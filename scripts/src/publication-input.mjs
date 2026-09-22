import { createHash } from "node:crypto";

export const MAX_PUBLICATION_BYTES = 2 * 1024 * 1024;

export class PublicationInputError extends Error {}

export function extractPublication(body) {
  const blocks = [...(body ?? "").matchAll(/^```json[^\S\r\n]*\r?\n([\s\S]*?)^```[^\S\r\n]*$/gim)];
  if (blocks.length !== 1) {
    throw new PublicationInputError("Issue must contain exactly one fenced json block");
  }
  try {
    return JSON.parse(blocks[0][1]);
  } catch {
    throw new PublicationInputError("Publication block is not valid JSON");
  }
}

/** Resolve data only: never execute code or follow an arbitrary issue-supplied URL. */
export async function resolvePublication(body, repository, github) {
  const input = extractPublication(body);
  if (!input || typeof input !== "object" || !("publicationFile" in input)) return input;
  const file = input.publicationFile;
  if (Object.keys(input).join() !== "publicationFile" || !file ||
      Object.keys(file).sort().join() !== "commit,path,sha256" ||
      typeof file.commit !== "string" || !/^[a-f0-9]{40}$/.test(file.commit) ||
      typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(file.sha256) ||
      typeof file.path !== "string" ||
      !/^research\/publications\/[a-zA-Z0-9_-]+\.json$/.test(file.path)) {
    throw new PublicationInputError("Invalid publicationFile: require a research/publications/*.json path, full commit SHA and SHA-256 digest");
  }
  const path = `/repos/${repository}/contents/${file.path}?ref=${file.commit}`;
  const response = await github(path, { headers: { accept: "application/vnd.github.raw+json" } });
  if (response.status === 404) throw new PublicationInputError("Pinned publication file was not found");
  if (!response.ok) throw new Error(`Publication download failed (${response.status})`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Publication download returned no body");
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PUBLICATION_BYTES) {
        await reader.cancel();
        throw new PublicationInputError("Publication file exceeds the 2 MiB limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = Buffer.concat(chunks);
  if (createHash("sha256").update(bytes).digest("hex") !== file.sha256) {
    throw new PublicationInputError("Publication file SHA-256 does not match the approved bytes");
  }
  try {
    const publication = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (!publication || typeof publication !== "object" || "publicationFile" in publication) {
      throw new Error("File must contain a publication, not another file reference");
    }
    if (Buffer.byteLength(JSON.stringify(publication)) > MAX_PUBLICATION_BYTES) throw new Error("Serialized publication exceeds the API limit");
    return publication;
  } catch {
    throw new PublicationInputError("Pinned file must contain a valid UTF-8 JSON publication within the API size limit");
  }
}
