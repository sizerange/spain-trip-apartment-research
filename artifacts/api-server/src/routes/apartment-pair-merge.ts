import type { ImportApartmentPairPublicationBody } from "@workspace/api-zod";

type Publication = typeof ImportApartmentPairPublicationBody._type;
type Pair = Publication["pairs"][number];
export type PairArchive = {
  pairId: string;
  apartmentIds: [string, string];
  reason: string;
  archivedAt: string;
};
export class PairMergeError extends Error {}
const composition = (pair: Pair) =>
  JSON.stringify([pair.paper.id, pair.apartment.id].sort());
const archiveComposition = (archive: PairArchive) =>
  JSON.stringify([...archive.apartmentIds].sort());
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}

/** Whole pair records only; never reconstruct apartment facts from different records. */
export function mergeApartmentPairs(
  current: Publication | null,
  savedArchives: PairArchive[],
  incoming: Publication,
  now: string,
) {
  const pairs = new Map(
    (current?.pairs ?? []).map((pair) => [composition(pair), pair]),
  );
  const ids = new Map(
    (current?.pairs ?? []).map((pair) => [pair.id, composition(pair)]),
  );
  const archives = new Map(
    savedArchives.map((item) => [archiveComposition(item), item]),
  );
  const incomingKeys = new Set(incoming.pairs.map(composition));
  const exceptions = new Map(
    (current?.budgetExceptions ?? []).map((item) => [item.pairId, item]),
  );
  const freshExceptions = new Map(
    incoming.budgetExceptions.map((item) => [item.pairId, item]),
  );
  const restoreIds = new Set(incoming.restorePairIds ?? []);
  const archiveIds = new Set<string>();
  const counts = {
    added: 0,
    updated: 0,
    retained: 0,
    archived: 0,
    skippedArchived: 0,
  };
  if (restoreIds.size !== (incoming.restorePairIds ?? []).length)
    throw new PairMergeError("Duplicate restore pair ID");
  for (const request of incoming.archivePairs ?? []) {
    if (!Number.isFinite(Date.parse(incoming.reviewedAt)))
      throw new PairMergeError(
        "Archive requests require a valid reviewedAt date",
      );
    if (!request.reason.trim() || request.reason.trim().length < 20)
      throw new PairMergeError(
        "Archive reason must contain at least 20 meaningful characters",
      );
    if (archiveIds.has(request.pairId) || restoreIds.has(request.pairId))
      throw new PairMergeError(
        `Conflicting or repeated archive request: ${request.pairId}`,
      );
    archiveIds.add(request.pairId);
    const priorArchive = savedArchives.find(
      (item) => item.pairId === request.pairId,
    );
    const key =
      ids.get(request.pairId) ??
      (priorArchive && archiveComposition(priorArchive));
    if (!key)
      throw new PairMergeError(
        `Cannot archive unknown pair: ${request.pairId}`,
      );
    if (incomingKeys.has(key))
      throw new PairMergeError(
        `Pair ${request.pairId} is both submitted and archived; remove it from pairs`,
      );
    const old = pairs.get(key);
    if (old) {
      if (
        [old.paper, old.apartment].some(
          (listing) =>
            Date.parse(incoming.reviewedAt) <
            Date.parse(listing.sourceCheckedAt),
        )
      )
        throw new PairMergeError(
          `Stale archive request for ${old.id}; newer source evidence exists`,
        );
      archives.set(key, {
        pairId: old.id,
        apartmentIds: [old.paper.id, old.apartment.id],
        reason: request.reason.trim(),
        archivedAt: now,
      });
      pairs.delete(key);
      exceptions.delete(old.id);
      counts.archived++;
    }
    // Retrying the same archive request keeps its original evidence and timestamp.
  }
  for (const id of restoreIds) {
    const archived = savedArchives.find((item) => item.pairId === id);
    const key = archived ? archiveComposition(archived) : ids.get(id);
    if (!key || !incomingKeys.has(key))
      throw new PairMergeError(
        `Restore ${id} requires an archived pair and a complete matching pair record`,
      );
  }
  const touched = new Set<string>();
  for (const fresh of incoming.pairs) {
    const key = composition(fresh);
    if (touched.has(key))
      throw new PairMergeError("Duplicate submitted pair composition");
    touched.add(key);
    const oldKey = ids.get(fresh.id);
    const archivedId = savedArchives.find((item) => item.pairId === fresh.id);
    if (
      (oldKey && oldKey !== key) ||
      (archivedId && archiveComposition(archivedId) !== key)
    )
      throw new PairMergeError(
        `Pair ID ${fresh.id} cannot change apartment identities`,
      );
    const archived = archives.get(key);
    if (archived && !restoreIds.has(archived.pairId)) {
      counts.skippedArchived++;
      continue;
    }
    if (
      archived &&
      [fresh.paper, fresh.apartment].some(
        (listing) =>
          !Number.isFinite(Date.parse(listing.sourceCheckedAt)) ||
          Date.parse(listing.sourceCheckedAt) <
            Date.parse(archived.archivedAt.slice(0, 10)),
      )
    )
      throw new PairMergeError(
        `Restore ${archived.pairId} requires source checks dated on or after its archive date`,
      );
    const old = pairs.get(key);
    if (old) {
      for (const listing of [fresh.paper, fresh.apartment]) {
        const prior = [old.paper, old.apartment].find(
          (item) => item.id === listing.id,
        )!;
        const priorDate = Date.parse(prior.sourceCheckedAt),
          freshDate = Date.parse(listing.sourceCheckedAt);
        if (
          Number.isFinite(priorDate) &&
          (!Number.isFinite(freshDate) || freshDate < priorDate)
        )
          throw new PairMergeError(
            `Stale update for ${listing.id}; existing pair ${old.id} has newer source evidence`,
          );
      }
    }
    const stableId = old?.id ?? archived?.pairId ?? fresh.id;
    const conflict = [...pairs.entries()].find(
      ([otherKey, value]) => otherKey !== key && value.id === stableId,
    );
    if (conflict) throw new PairMergeError(`Duplicate pair ID ${stableId}`);
    const paperLabel = old?.title.match(/^PAPER\s+\d+\b/)?.[0];
    pairs.set(key, {
      ...fresh,
      id: stableId,
      title: paperLabel
        ? fresh.title.replace(/^PAPER\s+\d+\b/, paperLabel)
        : fresh.title,
    });
    ids.set(stableId, key);
    exceptions.delete(stableId);
    const exception = freshExceptions.get(fresh.id);
    if (exception) exceptions.set(stableId, { ...exception, pairId: stableId });
    if (archived) archives.delete(key);
    if (old) counts.updated++;
    else counts.added++;
  }
  const records = new Map<string, { signature: string; pairId: string }>();
  for (const pair of pairs.values()) {
    for (const listing of [pair.paper, pair.apartment]) {
      if (listing.availabilityStatus === "unavailable")
        throw new PairMergeError(
          `Archive affected pairs explicitly: ${listing.id} is unavailable`,
        );
      const previous = records.get(listing.id),
        signature = canonical(listing);
      if (previous && previous.signature !== signature)
        throw new PairMergeError(
          `Conflicting records for ${listing.id} in ${previous.pairId} and ${pair.id}. Include consistent complete updates for all affected pairs, or explicitly archive them.`,
        );
      records.set(listing.id, { signature, pairId: pair.id });
    }
  }
  counts.retained = [...pairs.keys()].filter((key) => !touched.has(key)).length;
  const merged = [...pairs.values()]
    .sort(
      (a, b) =>
        (a.combinedMonthlyRentEur ?? Infinity) -
          (b.combinedMonthlyRentEur ?? Infinity) ||
        a.rank - b.rank ||
        a.id.localeCompare(b.id),
    )
    .map((pair, index) => ({ ...pair, rank: index + 1 }));
  return {
    publication: {
      ...incoming,
      pairs: merged,
      budgetExceptions: [...exceptions.values()],
    },
    archives: [...archives.values()],
    counts,
  };
}
