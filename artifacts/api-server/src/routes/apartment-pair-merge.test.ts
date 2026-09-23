import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { mergeApartmentPairs } from "./apartment-pair-merge.ts";
import {
  ImportApartmentPairPublicationBody,
  GetApartmentPairsResponse,
} from "../../../../lib/api-zod/src/generated/api.ts";
const seed = JSON.parse(
  readFileSync(
    new URL(
      "../../../../research/publications/2026-09-22.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const date = "2026-09-23T12:00:00Z";
function pair(id: string, a = `${id}-A`, b = `${id}-B`) {
  const p = structuredClone(seed.pairs[0]);
  p.id = id;
  p.paperId = p.paper.id = a;
  p.apartmentId = p.apartment.id = b;
  return p;
}
function publication(pairs: ReturnType<typeof pair>[], extra: object = {}) {
  return {
    reviewedAt: "2026-09-23",
    disclaimer: "Research evidence, not a booking",
    pairs,
    budgetExceptions: [],
    ...extra,
  };
}
describe("incremental apartment publications", () => {
  it("accepts legacy and archive-only contracts but rejects malformed removal instructions", () => {
    assert.equal(
      ImportApartmentPairPublicationBody.safeParse(seed).success,
      true,
    );
    assert.equal(
      ImportApartmentPairPublicationBody.safeParse(
        publication([], {
          archivePairs: [
            { pairId: "a", reason: "Original advert removed by its owner." },
          ],
        }),
      ).success,
      true,
    );
    assert.equal(
      ImportApartmentPairPublicationBody.safeParse(
        publication([], { archivePairs: [{ pairId: "a", reason: "short" }] }),
      ).success,
      false,
    );
    assert.equal(
      GetApartmentPairsResponse.safeParse({
        reviewedAt: "2026-09-23",
        disclaimer: "No active pairs",
        total: 0,
        pairs: [],
        availableApartments: [],
      }).success,
      true,
    );
  });
  it("keeps Monday 10 and adds Tuesday 50, without changing old dates or IDs", () => {
    const monday = publication(
      Array.from({ length: 10 }, (_, i) => pair(`old${i}`)),
    );
    const tuesday = publication(
      Array.from({ length: 50 }, (_, i) => pair(`new${i}`)),
    );
    const result = mergeApartmentPairs(monday, [], tuesday, date);
    assert.equal(result.publication.pairs.length, 60);
    assert.equal(result.counts.retained, 10);
    assert.equal(
      result.publication.pairs.find((p) => p.id === "old0")!.paper
        .sourceCheckedAt,
      "2026-09-22",
    );
    assert.equal(monday.pairs.length, 10);
  });
  it("matches reversed apartment composition under a different submitted ID and preserves the stable ID", () => {
    const old = pair("stable");
    const fresh = structuredClone(old);
    fresh.id = "new-alias";
    [fresh.paper, fresh.apartment] = [fresh.apartment, fresh.paper];
    fresh.paperId = fresh.paper.id;
    fresh.apartmentId = fresh.apartment.id;
    fresh.summary = "New source evidence";
    const result = mergeApartmentPairs(
      publication([old]),
      [],
      publication([fresh]),
      date,
    );
    assert.equal(result.publication.pairs.length, 1);
    assert.equal(result.publication.pairs[0].id, "stable");
    assert.equal(result.publication.pairs[0].summary, fresh.summary);
  });
  it("repeated imports do not duplicate records", () => {
    const input = publication([pair("a"), pair("b")]);
    const first = mergeApartmentPairs(null, [], input, date);
    const second = mergeApartmentPairs(
      first.publication,
      first.archives,
      input,
      date,
    );
    assert.deepEqual(second.publication.pairs, first.publication.pairs);
  });
  it("archives with a reason, keeps history and prevents accidental resurrection by old snapshots", () => {
    const old = publication([pair("a")]);
    const result = mergeApartmentPairs(
      old,
      [],
      publication([], {
        archivePairs: [
          {
            pairId: "a",
            reason: "Original listing was withdrawn by advertiser.",
          },
        ],
      }),
      date,
    );
    assert.equal(result.publication.pairs.length, 0);
    assert.equal(result.archives[0].pairId, "a");
    assert.equal(old.pairs.length, 1);
    const replay = mergeApartmentPairs(
      result.publication,
      result.archives,
      old,
      date,
    );
    assert.equal(replay.publication.pairs.length, 0);
    assert.equal(replay.counts.skippedArchived, 1);
    assert.deepEqual(replay.archives, result.archives);
  });
  it("restores only explicitly with fresh evidence and preserves the archived stable ID", () => {
    const archived = {
      pairId: "a",
      apartmentIds: ["a-A", "a-B"] as [string, string],
      reason: "Advert withdrawn and later returned.",
      archivedAt: date,
    };
    const fresh = pair("alias", "a-A", "a-B");
    fresh.paper.sourceCheckedAt = fresh.apartment.sourceCheckedAt =
      "2026-09-23";
    const restored = mergeApartmentPairs(
      publication([]),
      [archived],
      publication([fresh], { restorePairIds: ["a"] }),
      date,
    );
    assert.equal(restored.publication.pairs[0].id, "a");
    assert.deepEqual(restored.archives, []);
    assert.throws(
      () =>
        mergeApartmentPairs(
          publication([]),
          [archived],
          publication([pair("a")], { restorePairIds: ["a"] }),
          date,
        ),
      /source checks/,
    );
  });
  it("rejects missing or conflicting archive/restore targets and reused IDs", () => {
    const current = publication([pair("a")]);
    assert.throws(
      () =>
        mergeApartmentPairs(
          current,
          [],
          publication([], {
            archivePairs: [
              { pairId: "missing", reason: "A sufficiently detailed reason." },
            ],
          }),
          date,
        ),
      /unknown pair/,
    );
    assert.throws(
      () =>
        mergeApartmentPairs(
          current,
          [],
          publication([pair("a")], {
            archivePairs: [
              { pairId: "a", reason: "A sufficiently detailed reason." },
            ],
          }),
          date,
        ),
      /both submitted and archived/,
    );
    assert.throws(
      () =>
        mergeApartmentPairs(
          current,
          [],
          publication([pair("a", "X", "Y")]),
          date,
        ),
      /cannot change apartment identities/,
    );
    assert.throws(
      () =>
        mergeApartmentPairs(
          current,
          [],
          publication([], { restorePairIds: ["a"] }),
          date,
        ),
      /requires an archived pair/,
    );
  });
  it("rejects stale updates instead of rolling back newer evidence", () => {
    const current = publication([pair("a")]);
    current.pairs[0].paper.sourceCheckedAt = "2026-09-24";
    assert.throws(
      () => mergeApartmentPairs(current, [], publication([pair("a")]), date),
      /Stale update/,
    );
  });
  it("rejects conflicting shared apartments; accepts complete consistent updates", () => {
    const a = pair("a", "SHARED", "B"),
      b = pair("b", "SHARED", "C");
    b.paper = structuredClone(a.paper);
    const fresh = structuredClone(a);
    fresh.paper.monthlyRentEur = 450;
    fresh.combinedMonthlyRentEur = 950;
    assert.throws(
      () =>
        mergeApartmentPairs(
          publication([a, b]),
          [],
          publication([fresh]),
          date,
        ),
      /Include consistent complete updates/,
    );
    const freshB = structuredClone(b);
    freshB.paper = structuredClone(fresh.paper);
    freshB.combinedMonthlyRentEur = 950;
    const result = mergeApartmentPairs(
      publication([a, b]),
      [],
      publication([fresh, freshB]),
      date,
    );
    assert.equal(result.publication.pairs.length, 2);
  });
  it("preserves retained budget exceptions and remaps updated exceptions to stable IDs", () => {
    const old = publication([pair("a"), pair("b")], {
      budgetExceptions: [
        { pairId: "b", reason: "Retained documented exceptional location." },
      ],
    });
    const fresh = pair("alias", "a-A", "a-B");
    const result = mergeApartmentPairs(
      old,
      [],
      publication([fresh], {
        budgetExceptions: [
          {
            pairId: "alias",
            reason: "New documented exceptional accessibility.",
          },
        ],
      }),
      date,
    );
    assert.deepEqual(
      result.publication.budgetExceptions.map((x) => x.pairId).sort(),
      ["a", "b"],
    );
  });
});
