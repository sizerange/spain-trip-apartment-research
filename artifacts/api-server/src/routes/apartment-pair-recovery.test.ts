import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { it } from "node:test";
import { ImportApartmentPairPublicationBody } from "../../../../lib/api-zod/src/generated/api.ts";
import { canRecoverPairImport } from "./apartment-pair-recovery-policy.ts";

const seed = JSON.parse(
  readFileSync(
    new URL("../../../../research/publications/2026-09-22.json", import.meta.url),
    "utf8",
  ),
);

it("does not recover a partially invalid request with archive controls", () => {
  const input = structuredClone(seed);
  const invalid = structuredClone(input.pairs[0]);
  delete invalid.paper;
  input.pairs.push(invalid);
  input.archivePairs = [
    { pairId: invalid.id, reason: "The original listing was withdrawn." },
  ];
  assert.equal(ImportApartmentPairPublicationBody.safeParse(input).success, false);
  assert.equal(canRecoverPairImport(input), false);

  // Legacy imports may still recover an otherwise useful publication.
  delete input.archivePairs;
  assert.equal(canRecoverPairImport(input), true);
});

it("rejects partial recovery when any restore control is supplied", () => {
  const input = structuredClone(seed);
  input.pairs.push({ id: "broken" });
  input.restorePairIds = ["some-archived-pair"];
  assert.equal(ImportApartmentPairPublicationBody.safeParse(input).success, false);
  assert.equal(canRecoverPairImport(input), false);
});