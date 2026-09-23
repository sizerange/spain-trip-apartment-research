# Complete research files and automatic imports

Pair retention and explicit archive/restore behavior are documented in `INCREMENTAL_PUBLICATIONS.md`. After that change is deployed, file and inline imports both merge into the active pair set; omission is not deletion. Archive-only requests may contain an empty `pairs` array and explicit `archivePairs` instructions.

GitHub issue bodies have a 65,536-character limit. Repeating apartments and full photo galleries in every pair can exceed it. Do not drop pairs or photographs to fit an issue. Store the unchanged API publication JSON in `research/publications/NAME.json`; a small issue references its exact commit and SHA-256 digest. Existing inline publications remain supported.

## One-time activation

1. Review and merge this import change through a pull request. This branch is separate from the existing `chatgpt-site-edits` work because that branch contains unrelated Economy edits.
2. Sync Replit, run the API/scripts typechecks and library checks, and publish. The import route accepts up to 2 MiB; other routes retain their existing JSON limit. No database migration or new token is required.
3. Submit the full saved research file only after the API change is live. A 413 response means the receiving deployment still has the old request limit; leave the queue intact, publish Replit, and retry the workflow.
4. Verify the GitHub result comment and live API pair count. A merged PR or a green workflow with no imported issues is not evidence that data is live.

## Every research update

1. Read the latest handoff, previous research files and local ledger. Recheck changing prices/availability. Preserve sources, rejection reasons, identities, photo evidence and map uncertainty.
2. Build every valid local combination. Store one complete publication file in `research/publications/`, including all selected source photos. Validate against `schemas/publication.schema.json`, the API contract and publication rules. The 2 MiB bound is a byte limit, not a pair-count limit.
3. Commit and push the **data file only** on a research branch such as `codex/research-YYYY-MM-DD`. Do not change application code or push directly to protected `main` during research. Retain that branch while the issue is pending. Its data can be imported without merging application code.
4. Run `node scripts/prepare-publication-issue.mjs research/publications/NAME.json` from the repository. It reads committed bytes at HEAD and prints a short issue body with exactly one fenced JSON descriptor. An optional second argument selects a full commit SHA. This helper is not a substitute for publication validation.
5. Create one `Research publication: YYYY-MM-DD` issue (or update that day's still-open submission). Review the referenced file and descriptor; only then apply `ready-for-import`. For corrections, remove the label, commit the corrected file, regenerate the descriptor and reapply the label.
6. The label event starts GitHub Actions. It reads data only from this repository, at the pinned commit, verifies the digest, enforces the size limit, and submits the complete publication through the existing authenticated API. It never executes code from the data branch. Existing API validation and atomic replacement remain unchanged.
7. Check the result comment and live site. `import-rejected` identifies invalid input; temporary infrastructure failures leave the issue ready for retry. No owner contact, personal information, direct production calls or token rotation.

The daily 09:00 Stockholm research time is unchanged. The intended 11:00 import remains a fallback. The workflow selects the summer/winter cron by its scheduled expression instead of requiring execution at exactly 11:00, so a delayed GitHub runner can still import. Manual workflow dispatch also remains available. Labels applied with an Actions-provided `GITHUB_TOKEN` do not trigger a second workflow; use the normal user GitHub connection or manual dispatch in that case.

The importer updates publication data. The current static terrain map is not part of the publication schema; map-image changes still need separate Replit review and publishing. Do not claim the map changed merely because a publication imported.

## Descriptor example

```json
{
  "publicationFile": {
    "path": "research/publications/2026-09-22.json",
    "commit": "FULL_40_CHARACTER_COMMIT_SHA_FROM_HELPER",
    "sha256": "EXACT_64_CHARACTER_SHA256_FROM_HELPER"
  }
}
```

The placeholders deliberately fail validation. Use the helper to generate real values. Files must contain the complete ordinary publication, not another descriptor. Keep reference metadata outside the production API contract; the importers resolve it before contacting the API.

## Validation

- `node --test scripts/src/publication-input.test.mjs scripts/import-schedule.test.mjs`
- `pnpm --filter @workspace/api-server run typecheck`
- `pnpm --filter @workspace/scripts run typecheck`
- `pnpm run typecheck:libs`
- `git diff --check`

Deployment verification: submit a validated payload larger than 100 KiB, confirm all pairs imported, verify invalid submissions cannot replace it, and check that other routes retain their limits.
