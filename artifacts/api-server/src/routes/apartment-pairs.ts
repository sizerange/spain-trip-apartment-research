import { timingSafeEqual } from "node:crypto";
import { Router, type IRouter, type Request } from "express";
import { desc, eq, sql } from "drizzle-orm";
import {
  apartmentCandidatesTable,
  apartmentPairPublicationsTable,
  db,
} from "@workspace/db";
import {
  GetApartmentPairsQueryParams,
  GetApartmentPairsResponse,
  ImportApartmentPairPublicationBody,
  ImportApartmentPairPublicationResponse,
} from "@workspace/api-zod";
import { validatePairAffordability } from "./apartment-pair-affordability.js";
import { mergeApartmentPairs, PairMergeError } from "./apartment-pair-merge.js";
import { canRecoverPairImport } from "./apartment-pair-recovery-policy.js";

const router: IRouter = Router();

const reviewedAt = "20 September 2026";
const sourceCheckedAt = "20 September 2026";
const attribution = "Atrivm Properties original listing gallery";
const outdoorPhotoPattern =
  /\b(balcony|terrace|patio|view|outlook|window view|exterior|facade|façade|building|courtyard|entrance|street|road|neighbourhood|neighborhood|sea)\b/i;

function getPhotoSubject(description: string): string {
  if (/\b(living|lounge|salon|sitting|dining)\b/i.test(description)) return "living";
  if (/\b(balcony|terrace|patio|roof terrace)\b/i.test(description)) return "balcony";
  if (/\b(view|outlook|sea view|window view)\b/i.test(description)) return "view";
  if (/\b(exterior|facade|façade|building|courtyard|entrance)\b/i.test(description)) return "exterior";
  if (/\b(street|road|neighbourhood|neighborhood)\b/i.test(description)) return "street";
  if (/\bkitchen\b/i.test(description)) return "kitchen";
  if (/\bbedroom\b/i.test(description)) return "bedroom";
  if (/\b(bathroom|shower|toilet)\b/i.test(description)) return "bathroom";
  return "other";
}

function getPairFoundTime(pair: {
  paper: { sourceCheckedAt: string };
  apartment: { sourceCheckedAt: string };
}): number {
  const timestamps = [
    Date.parse(pair.paper.sourceCheckedAt),
    Date.parse(pair.apartment.sourceCheckedAt),
  ].filter(Number.isFinite);
  return timestamps.length > 0 ? Math.max(...timestamps) : Number.NEGATIVE_INFINITY;
}

type ListingSeed = {
  id: string;
  ref: string;
  rent: number;
  size: number;
  bedrooms: number;
  url: string;
  photos: Array<{
    path: string;
    alt: string;
  }>;
  beachNote: string;
};

function createListing(seed: ListingSeed) {
  return {
    id: seed.id,
    displayName: `Torrevieja long-stay apartment · ${seed.ref}`,
    area: "Torrevieja",
    address: "Torrevieja; exact street not published",
    bedrooms: seed.bedrooms,
    sizeSqm: seed.size,
    monthlyRentEur: seed.rent,
    furnished: null,
    availabilityStatus: "unknown" as const,
    availabilityNote:
      "The source advertises this as a long-stay rental. Exact availability for 5 Nov 2026–28 Apr 2027 must be confirmed with the agent.",
    originalListingUrl: seed.url,
    photoSourceUrl: seed.url,
    photoAttribution: `${attribution}.`,
    photos: seed.photos.map((photo) => ({
      url: `https://www.atrivmproperties.com/media/images/properties/thumbnails/${photo.path}_1024x800.jpg`,
      alt: photo.alt,
      sourceUrl: seed.url,
      attribution,
      aiEdited: false,
    })),
    sourceName: "Atrivm Properties",
    sourceCheckedAt,
  };
}

const listings = {
  rent463: {
    seed: {
      id: "APT-RENT463",
      ref: "RENT463",
      rent: 550,
      size: 60,
      bedrooms: 2,
      url: "https://www.atrivmproperties.com/property/9308/apartment/long-term-rentals/spain/torrevieja/torrevieja/",
      photos: [
        {
          path: "PHOTO20231023182317_2",
          alt: "RENT463 living and dining room with balcony doors",
        },
        {
          path: "PHOTO20231023182317_1",
          alt: "RENT463 balcony and outward view toward the neighbouring buildings",
        },
        {
          path: "PHOTO20231023182318_2",
          alt: "RENT463 kitchen",
        },
        {
          path: "PHOTO20231023182318_3",
          alt: "RENT463 twin bedroom",
        },
        {
          path: "PHOTO20231023182318_4",
          alt: "RENT463 double bedroom",
        },
        {
          path: "PHOTO20231023182318",
          alt: "RENT463 bathroom",
        },
      ],
      beachNote: "Source states 200 m from the sea",
    },
  },
  alq574: {
    seed: {
      id: "APT-ALQ574",
      ref: "ALQ574",
      rent: 500,
      size: 100,
      bedrooms: 3,
      url: "https://www.atrivmproperties.com/property/7583/apartamento/alquiler-larga-estancia/spain/torrevieja/torrevieja/",
      photos: [
        {
          path: "68b3f7a1eee44d968942449598350cd3",
          alt: "ALQ574 living and dining room",
        },
        {
          path: "86f1cd15b5ee4bf298e216362f85ff82",
          alt: "ALQ574 balcony with an outward courtyard view",
        },
        {
          path: "2a600ff4e45d453884a320317da33e67",
          alt: "ALQ574 outward view toward the surrounding building",
        },
        {
          path: "PHOTO20200708123026",
          alt: "ALQ574 exterior courtyard area",
        },
        {
          path: "PHOTO20200708123118",
          alt: "ALQ574 kitchen",
        },
        {
          path: "PHOTO20200708123119_1",
          alt: "ALQ574 bedroom",
        },
        {
          path: "685cb0cbea95435caf32793937bf0f6a",
          alt: "ALQ574 bathroom",
        },
      ],
      beachNote: "Beach distance not stated",
    },
  },
  alq1513: {
    seed: {
      id: "APT-ALQ1513",
      ref: "ALQ1513",
      rent: 450,
      size: 65,
      bedrooms: 2,
      url: "https://www.atrivmproperties.com/property/7272/apartamento/alquiler-larga-estancia/spain/torrevieja/torrevieja/",
      photos: [
        {
          path: "7bdf901b4a51499ea7a4bd0dee74ebdd",
          alt: "ALQ1513 living room",
        },
        {
          path: "575e75b65f4c4bf7b086aee3f959fcfc",
          alt: "ALQ1513 street-facing building exterior and entrance",
        },
        {
          path: "7d7fd2ca6e6c46e692894550e587c84a",
          alt: "ALQ1513 kitchen",
        },
        {
          path: "856b0bf0544c415cadb66f03e05a2d0e",
          alt: "ALQ1513 bedroom",
        },
        {
          path: "7f22ff623354497b8f509cbf75784ba5",
          alt: "ALQ1513 bathroom",
        },
        {
          path: "2b6b1995362846bc8629d6cf44f3805b",
          alt: "ALQ1513 dining area beside an exterior window",
        },
        {
          path: "f46703b712a04f2daa1dacfeb44f6587",
          alt: "ALQ1513 second bedroom",
        },
      ],
      beachNote: "Beach distance not stated",
    },
  },
} satisfies Record<string, { seed: ListingSeed }>;

function makePair(
  id: string,
  rank: number,
  left: ListingSeed,
  right: ListingSeed,
  distance: string,
  walkingTime: string,
) {
  const total = left.rent + right.rent;
  return {
    id,
    rank,
    paperId: left.id,
    apartmentId: right.id,
    title: `${left.ref} + ${right.ref}`,
    summary:
      `A source-quoted long-stay pairing in Torrevieja at €${left.rent} + €${right.rent}, or €${total} per month total. Both homes exceed the 30 m² minimum and are listed separately by Atrivm Properties. The source pages quote the rents directly; these are not market estimates.\n\nThe listings are candidates for the requested 5 November 2026–28 April 2027 stay, but neither page confirms those exact dates. Exact street addresses are not published, so the pair distance is an area-level walking estimate and must be checked with the agent before booking.`,
    status: "provisional" as const,
    statusNote:
      "Quoted monthly rents and long-stay listing type are verified on the source pages; exact dates, addresses, furnishing, and contract terms remain unconfirmed.",
    areas: ["Torrevieja"],
    beachDistanceMinutes: null,
    combinedMonthlyRentEur: total,
    poolDistance: "Not stated on the reviewed source pages",
    beachDistance: `${left.id}: ${left.beachNote} | ${right.id}: ${right.beachNote}`,
    groceriesDistance: "Not verified; exact addresses not published",
    cafesDistance: "Not verified; exact addresses not published",
    pairWalkingDistance: distance,
    pairWalkingTime: walkingTime,
    paper: createListing(left),
    apartment: createListing(right),
  };
}

const candidatePairs = [
  makePair(
    "pair-001",
    1,
    listings.alq574.seed,
    listings.alq1513.seed,
    "Approximately 1,200 m (area-level estimate; exact addresses withheld)",
    "Approximately 15 min",
  ),
  makePair(
    "pair-002",
    2,
    listings.rent463.seed,
    listings.alq1513.seed,
    "Approximately 1,500 m (area-level estimate; exact addresses withheld)",
    "Approximately 19 min",
  ),
  makePair(
    "pair-003",
    3,
    listings.rent463.seed,
    listings.alq574.seed,
    "Approximately 1,000 m (area-level estimate; exact addresses withheld)",
    "Approximately 13 min",
  ),
];

const pairSoftMaxEur = 1100;
const pairs = candidatePairs.filter(
  (pair) => pair.combinedMonthlyRentEur <= pairSoftMaxEur,
);

function hasValidImporterToken(req: Request): "valid" | "invalid" | "unconfigured" {
  const expectedToken = process.env.APARTMENT_IMPORT_TOKEN;
  if (!expectedToken) return "unconfigured";

  const authorization = req.get("authorization");
  const providedToken = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";

  const expectedBuffer = Buffer.from(expectedToken);
  const providedBuffer = Buffer.from(providedToken);
  if (expectedBuffer.length !== providedBuffer.length) return "invalid";

  return timingSafeEqual(expectedBuffer, providedBuffer) ? "valid" : "invalid";
}

function validatePublication(
  publication: typeof ImportApartmentPairPublicationBody._type,
  allowEmpty = false,
): string[] {
  const errors: string[] = [];
  if (!allowEmpty && publication.pairs.length === 0 && !publication.archivePairs?.length && !publication.restorePairIds?.length) {
    errors.push("An import must contain pairs or explicit archive/restore requests");
  }
  const pairIds = new Set<string>();
  const compositions = new Set<string>();
  const exceptionReasons = new Map(
    publication.budgetExceptions.map((exception) => [
      exception.pairId,
      exception.reason,
    ]),
  );

  for (const pair of publication.pairs) {
    if (pairIds.has(pair.id)) {
      errors.push(`Duplicate pair ID: ${pair.id}`);
    }
    pairIds.add(pair.id);

    const composition = [pair.paper.id, pair.apartment.id].sort().join("::");
    if (compositions.has(composition)) {
      errors.push(`Duplicate apartment combination: ${composition}`);
    }
    compositions.add(composition);

    if (pair.paper.id === pair.apartment.id) {
      errors.push(`${pair.id} uses the same apartment twice`);
    }
    if (pair.paperId !== pair.paper.id) {
      errors.push(
        `${pair.id} paperId does not match its nested paper apartment`,
      );
    }
    if (pair.apartmentId !== pair.apartment.id) {
      errors.push(
        `${pair.id} apartmentId does not match its nested apartment`,
      );
    }

    errors.push(
      ...validatePairAffordability(
        pair,
        pairSoftMaxEur,
        exceptionReasons.has(pair.id),
      ),
    );

    for (const listing of [pair.paper, pair.apartment]) {
      errors.push(...validateListing(listing));
    }
  }

  for (const exception of publication.budgetExceptions) {
    if (!pairIds.has(exception.pairId)) {
      errors.push(`Budget exception references unknown pair: ${exception.pairId}`);
    }
  }

  return errors;
}

type ApartmentPairPublication =
  typeof ImportApartmentPairPublicationBody._type;

type RecoveredPublication = {
  publication: ApartmentPairPublication;
  ignoredPairs: number;
};

const publicationMetadataSchema = ImportApartmentPairPublicationBody.pick({
  reviewedAt: true,
  disclaimer: true,
  archivePairs: true,
  restorePairIds: true,
});
const apartmentPairSchema =
  ImportApartmentPairPublicationBody.shape.pairs.element;
const apartmentListingSchema = apartmentPairSchema.shape.paper;

type ApartmentListing = typeof apartmentListingSchema._type;

function validateListing(listing: ApartmentListing): string[] {
  const errors: string[] = [];
  if (listing.photos.length < 4 || listing.photos.length > 9) {
    errors.push(`${listing.id} must provide between 4 and 9 source photos`);
  }

  const uniquePhotoUrls = new Set(listing.photos.map((photo) => photo.url));
  if (uniquePhotoUrls.size !== listing.photos.length) {
    errors.push(`${listing.id} must not repeat the same source photo`);
  }

  if (!listing.photos.some((photo) => outdoorPhotoPattern.test(photo.alt))) {
    errors.push(
      `${listing.id} must include a balcony, outward view, exterior, courtyard, or street photo`,
    );
  }

  const photoSubjects = new Set(
    listing.photos.map((photo) => getPhotoSubject(photo.alt)),
  );
  if (photoSubjects.size < 3) {
    errors.push(
      `${listing.id} must include at least three distinct photo subjects rather than repeated angles of one room`,
    );
  }
  return errors;
}

export function extractValidApartmentCandidates(
  input: unknown,
): ApartmentListing[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) return [];
  const rawPairs = (input as Record<string, unknown>).pairs;
  if (!Array.isArray(rawPairs)) return [];

  const candidates = new Map<string, ApartmentListing>();
  for (const rawPair of rawPairs) {
    if (!rawPair || typeof rawPair !== "object" || Array.isArray(rawPair)) {
      continue;
    }
    const pairRecord = rawPair as Record<string, unknown>;
    for (const side of ["paper", "apartment"] as const) {
      const parsed = apartmentListingSchema.safeParse(pairRecord[side]);
      if (!parsed.success) continue;
      candidates.set(parsed.data.id, parsed.data);
    }
  }
  return [...candidates.values()];
}

export function recoverMostlyValidPublication(
  input: unknown,
  minimumValidRatio = 0.9,
): RecoveredPublication | null {
  const complete = ImportApartmentPairPublicationBody.safeParse(input);
  if (complete.success) {
    return { publication: complete.data, ignoredPairs: 0 };
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const raw = input as Record<string, unknown>;
  // Archive and restore are destructive controls. Never execute them after
  // dropping an invalid submitted pair during best-effort recovery.
  if (!canRecoverPairImport(raw)) return null;
  const metadata = publicationMetadataSchema.safeParse(raw);
  if (!metadata.success || !Array.isArray(raw.pairs) || raw.pairs.length === 0) {
    return null;
  }

  const parsedExceptionList =
    ImportApartmentPairPublicationBody.shape.budgetExceptions.safeParse(
      raw.budgetExceptions,
    );
  const parsedExceptions = parsedExceptionList.success
    ? parsedExceptionList.data
    : [];
  const exceptionsByPairId = new Map(
    parsedExceptions.map((exception) => [exception.pairId, exception]),
  );

  const acceptedPairs: ApartmentPairPublication["pairs"] = [];
  const acceptedExceptions: ApartmentPairPublication["budgetExceptions"] = [];
  const pairIds = new Set<string>();
  const compositions = new Set<string>();

  for (const candidate of raw.pairs) {
    const parsedPair = apartmentPairSchema.safeParse(candidate);
    if (!parsedPair.success) continue;

    const pair = parsedPair.data;
    const exception = exceptionsByPairId.get(pair.id);
    const isolatedPublication: ApartmentPairPublication = {
      ...metadata.data,
      pairs: [pair],
      budgetExceptions: exception ? [exception] : [],
    };
    if (validatePublication(isolatedPublication).length > 0) continue;

    const composition = [pair.paper.id, pair.apartment.id].sort().join("::");
    if (
      pairIds.has(pair.id) ||
      compositions.has(composition) ||
      pair.paper.id === pair.apartment.id
    ) {
      continue;
    }

    pairIds.add(pair.id);
    compositions.add(composition);
    acceptedPairs.push(pair);
    if (exception) acceptedExceptions.push(exception);
  }

  const validRatio = acceptedPairs.length / raw.pairs.length;
  if (
    acceptedPairs.length === 0 ||
    validRatio + Number.EPSILON < minimumValidRatio
  ) {
    return null;
  }

  return {
    publication: {
      ...metadata.data,
      pairs: acceptedPairs,
      budgetExceptions: acceptedExceptions,
    },
    ignoredPairs: raw.pairs.length - acceptedPairs.length,
  };
}

router.get("/apartment-pairs", async (req, res): Promise<void> => {
  const parsedQuery = GetApartmentPairsQueryParams.safeParse(req.query);
  if (!parsedQuery.success) {
    res.status(400).json({ error: parsedQuery.error.message });
    return;
  }

  const [[activePublication], savedCandidateRows] = await Promise.all([
    db
      .select()
      .from(apartmentPairPublicationsTable)
      .where(eq(apartmentPairPublicationsTable.active, true))
      .orderBy(desc(apartmentPairPublicationsTable.importedAt))
      .limit(1),
    db.select().from(apartmentCandidatesTable),
  ]);

  const publication = activePublication
    ? GetApartmentPairsResponse.parse({
        reviewedAt: activePublication.reviewedAt,
        disclaimer: activePublication.disclaimer,
        total: activePublication.pairs.length,
        pairs: activePublication.pairs,
        availableApartments: [],
      })
    : GetApartmentPairsResponse.parse({
        reviewedAt,
        disclaimer:
          "The pair budget is a €1,100 monthly soft maximum in total. No persistent apartment-pair publication has been imported yet.",
        total: pairs.length,
        pairs,
        availableApartments: [],
      });

  const { status = "all", area, sort = "rank" } = parsedQuery.data;
  const normalizedArea = area?.trim().toLocaleLowerCase();
  const filteredPairs = publication.pairs
    .filter((pair) => status === "all" || pair.status === status)
    .filter(
      (pair) =>
        !normalizedArea ||
        pair.areas.some((pairArea) => pairArea.toLocaleLowerCase() === normalizedArea),
    )
    .sort((left, right) => {
      if (sort === "date-found") {
        const dateDifference = getPairFoundTime(right) - getPairFoundTime(left);
        return dateDifference || left.rank - right.rank;
      }
      if (sort === "beach-distance") {
        if (left.beachDistanceMinutes === null) return 1;
        if (right.beachDistanceMinutes === null) return -1;
        return left.beachDistanceMinutes - right.beachDistanceMinutes;
      }
      return left.rank - right.rank;
    });
  const pairedListingIds = new Set(
    publication.pairs.flatMap((pair) => [pair.paper.id, pair.apartment.id]),
  );
  const availableApartments = savedCandidateRows.flatMap((row) => {
    const parsed = apartmentListingSchema.safeParse(row.listing);
    return parsed.success && !pairedListingIds.has(parsed.data.id)
      ? [parsed.data]
      : [];
  });

  res.json(
    GetApartmentPairsResponse.parse({
      reviewedAt: publication.reviewedAt,
      disclaimer: publication.disclaimer,
      total: filteredPairs.length,
      pairs: filteredPairs,
      availableApartments,
    }),
  );
});

router.post(
  "/apartment-pairs/import",
  async (req, res): Promise<void> => {
    const tokenStatus = hasValidImporterToken(req);
    if (tokenStatus === "unconfigured") {
      res.status(503).json({ error: "Apartment importer is not configured" });
      return;
    }
    if (tokenStatus === "invalid") {
      res.status(401).json({ error: "Invalid importer credentials" });
      return;
    }

    const validCandidates = extractValidApartmentCandidates(req.body);
    if (validCandidates.length > 0) {
      await db
        .insert(apartmentCandidatesTable)
        .values(
          validCandidates.map((listing) => ({
            listingId: listing.id,
            listing,
            source: "chatgpt-import",
          })),
        )
        .onConflictDoUpdate({
          target: apartmentCandidatesTable.listingId,
          set: {
            listing: sql`excluded.listing`,
            source: "chatgpt-import",
            savedAt: new Date(),
          },
        });
      req.log.info(
        { candidateTotal: validCandidates.length },
        "Saved independently valid apartment candidates",
      );
    }

    const recovered = recoverMostlyValidPublication(req.body);
    if (!recovered) {
      const parsedBody = ImportApartmentPairPublicationBody.safeParse(req.body);
      req.log.warn(
        {
          validationErrors: parsedBody.success
            ? validatePublication(parsedBody.data)
            : parsedBody.error.issues,
        },
        "Rejected invalid apartment-pair import",
      );
      res.status(400).json({
        error:
          "Publication is unusable or fewer than 90% of its apartment pairs pass validation",
      });
      return;
    }

    const validationErrors = validatePublication(recovered.publication);
    if (validationErrors.length > 0) {
      req.log.warn(
        { validationErrors },
        "Rejected apartment-pair import that failed publication rules",
      );
      res.status(400).json({ error: validationErrors.join("; ") });
      return;
    }

    let publication;
    try {
      publication = await db.transaction(async (tx) => {
        // Serialize the read/merge/write, including the first import with no row to lock.
        // Concurrent ready-label and scheduled imports must both retain their additions.
        await tx.execute(sql`select pg_advisory_xact_lock(1936744801, 1)`);
        const [active] = await tx.select().from(apartmentPairPublicationsTable)
          .where(eq(apartmentPairPublicationsTable.active, true))
          .orderBy(desc(apartmentPairPublicationsTable.importedAt)).limit(1);
        const current = active ? ImportApartmentPairPublicationBody.parse({
          reviewedAt: active.reviewedAt, disclaimer: active.disclaimer,
          pairs: active.pairs, budgetExceptions: active.budgetExceptions,
        }) : null;
        const merged = mergeApartmentPairs(current, active?.pairArchives ?? [], recovered.publication, new Date().toISOString());
        const mergedErrors = validatePublication(merged.publication, true);
        if (mergedErrors.length) throw new PairMergeError(mergedErrors.join("; "));
        await tx
          .update(apartmentPairPublicationsTable)
          .set({ active: false })
          .where(eq(apartmentPairPublicationsTable.active, true));

        const [inserted] = await tx
          .insert(apartmentPairPublicationsTable)
          .values({
            reviewedAt: merged.publication.reviewedAt,
            disclaimer: merged.publication.disclaimer,
            pairs: merged.publication.pairs,
            budgetExceptions: merged.publication.budgetExceptions,
            pairArchives: merged.archives,
            source: "chatgpt-import",
            active: true,
          })
          .returning();

        return inserted;
      });
    } catch (error) {
      if (error instanceof PairMergeError) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }

    req.log.info(
      {
        publicationId: publication.id,
        total: publication.pairs.length,
        ignoredPairs: recovered.ignoredPairs,
      },
      "Activated apartment-pair publication",
    );

    res.status(201).json(
      ImportApartmentPairPublicationResponse.parse({
        publicationId: publication.id,
        importedAt: publication.importedAt.toISOString(),
        total: publication.pairs.length,
      }),
    );
  },
);

export default router;
