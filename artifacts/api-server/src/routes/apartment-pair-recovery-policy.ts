/**
 * Best-effort recovery may drop invalid pair records. Archive and restore
 * controls must only be applied to a completely valid publication.
 */
export function canRecoverPairImport(raw: Record<string, unknown>): boolean {
  return !(
    Object.hasOwn(raw, "archivePairs") ||
    Object.hasOwn(raw, "restorePairIds")
  );
}