import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { MAX_PUBLICATION_BYTES } from "./src/publication-input.mjs";

const path = process.argv[2];
const commit = process.argv[3] ?? execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (!/^research\/publications\/[a-zA-Z0-9_-]+\.json$/.test(path ?? "") || !/^[a-f0-9]{40}$/.test(commit)) {
  throw new Error("Usage: node scripts/prepare-publication-issue.mjs research/publications/NAME.json [FULL_COMMIT_SHA]");
}
// Hash committed bytes, including their original line endings, not the checkout.
const bytes = execFileSync("git", ["show", `${commit}:${path}`], { maxBuffer: MAX_PUBLICATION_BYTES + 1 });
if (bytes.byteLength > MAX_PUBLICATION_BYTES) throw new Error("Publication exceeds 2 MiB");
const publication = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
if (!Array.isArray(publication.pairs) || publication.pairs.length === 0) throw new Error("Publication must have at least one pair; validate the full contract before marking ready");
const descriptor = { publicationFile: { path, commit, sha256: createHash("sha256").update(bytes).digest("hex") } };
console.log(`Research publication: ${publication.reviewedAt}\n\n${publication.pairs.length} pairs. Complete publication stored in a pinned repository file. Validate the complete payload before applying ready-for-import.\n\n\`\`\`json\n${JSON.stringify(descriptor, null, 2)}\n\`\`\``);
