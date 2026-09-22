export const MAX_PUBLICATION_BYTES: number;
export class PublicationInputError extends Error {}
export function extractPublication(body: string | null): unknown;
export function resolvePublication(
  body: string | null,
  repository: string,
  github: (path: string, init?: { headers?: Record<string, string> }) => Promise<Response>,
): Promise<unknown>;
