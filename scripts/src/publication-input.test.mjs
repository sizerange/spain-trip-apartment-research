import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { MAX_PUBLICATION_BYTES, PublicationInputError, resolvePublication } from "./publication-input.mjs";

const fence = value => "```json\n" + JSON.stringify(value) + "\n```";
const commit = "a".repeat(40);
const digest = text => createHash("sha256").update(text).digest("hex");
const reference = text => ({ publicationFile: {
  path: "research/publications/2026-09-22.json", commit, sha256: digest(text),
} });
const noRequest = () => { throw new Error("Unexpected GitHub request"); };

test("legacy inline payload remains unchanged", async () => {
  const p = { pairs: [{ id: "existing" }], reviewedAt: "2026-09-22" };
  assert.deepEqual(await resolvePublication(fence(p), "owner/repo", noRequest), p);
});

test("a file larger than the issue limit loads from only the configured repository and pinned revision", async () => {
  const p = { pairs: [], disclaimer: "x".repeat(150_000) };
  const text = JSON.stringify(p);
  const got = await resolvePublication(fence(reference(text)), "owner/repo", async (path, init) => {
    assert.equal(path, `/repos/owner/repo/contents/research/publications/2026-09-22.json?ref=${commit}`);
    assert.equal(init.headers.accept, "application/vnd.github.raw+json");
    return new Response(text);
  });
  assert.deepEqual(got, p);
});

test("ambiguous JSON blocks, traversal, external URLs and mutable revisions are rejected before fetching", async () => {
  const valid = reference("{}");
  const bad = [null, "missing", fence({}) + "\n" + fence({}), "```json\n{broken\n```",
    ...["../secrets.json", "https://example.com/data.json", "research/publications/../../x.json", "research/publications/x%2f.json"].map(path => fence({ publicationFile: { ...valid.publicationFile, path } })),
    fence({ publicationFile: { ...valid.publicationFile, commit: "main" } }),
    fence({ publicationFile: { ...valid.publicationFile, sha256: "wrong" } }),
    fence({ ...valid, pairs: [] }),
  ];
  for (const body of bad) await assert.rejects(resolvePublication(body, "owner/repo", noRequest), PublicationInputError);
});

test("wrong digest, invalid JSON, nested references and oversized streams fail closed", async () => {
  await assert.rejects(resolvePublication(fence(reference("{}")), "owner/repo", async () => new Response('{"changed":true}')), /SHA-256/);
  for (const text of ["not json", JSON.stringify(reference("{}"))]) {
    await assert.rejects(resolvePublication(fence(reference(text)), "owner/repo", async () => new Response(text)), PublicationInputError);
  }
  const tooLarge = "x".repeat(MAX_PUBLICATION_BYTES + 1);
  await assert.rejects(resolvePublication(fence(reference(tooLarge)), "owner/repo", async () => new Response(tooLarge)), /2 MiB/);
});

test("missing files reject the submission; temporary GitHub failures keep it queued", async () => {
  const body = fence(reference("{}"));
  await assert.rejects(resolvePublication(body, "owner/repo", async () => new Response(null, { status: 404 })), PublicationInputError);
  await assert.rejects(resolvePublication(body, "owner/repo", async () => new Response(null, { status: 503 })), error => !(error instanceof PublicationInputError));
});
