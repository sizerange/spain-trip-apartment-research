# Keep earlier apartment matches

After deploying this change, imports merge into the latest active publication.
For example, ten existing pairs plus fifty distinct new pairs produce sixty pairs. A request
containing fifty pairs that already includes the original ten produces fifty.
Missing pairs are retained, not deleted. Older publication snapshots remain stored.
The published site already has 65 active pairs from research issue #9; the first
incremental import will merge against those 65, not an older ten-pair snapshot.

Pairs are matched by the unordered combination of their stable apartment IDs.
An updated match retains its existing pair ID even if the submitted ID or apartment
order differs. Different apartment combinations cannot reuse a pair ID. Ranks are
normalized with lower combined rent first. Retained apartment source-check dates
are preserved; a new import does not pretend old evidence has been checked again.

Submit complete, consistent apartment records. If an apartment's price or facts
change, include complete updates to every affected active pair, or explicitly
archive the affected pairs with reasons. The importer rejects conflicting copies
instead of combining fields from different records or publishing contradictory
prices. It also rejects older evidence overwriting newer evidence. Budget and photo
checks apply to the complete merged result before it becomes active. A rejection
leaves the active pairs untouched; independent candidate retention is unchanged.

## Archive and restore

Ordinary research files need no new fields. To remove a pair, omit it from `pairs`
and supply `archivePairs: [{ "pairId": "existing-id", "reason": "Original listing withdrawn by the advertiser." }]`.
Reasons must contain at least twenty non-padding characters. Use an actual source
finding, not omission from today's search. Use a parseable `reviewedAt` date.
An archive-only request can have an empty `pairs` array. Removing the final pair
leaves an empty active publication; it does not reactivate built-in examples.

Archives persist across later imports. Replaying an old snapshot cannot restore
an archived composition, even under a different submitted pair ID. To restore it,
include its original ID in `restorePairIds` and submit a complete matching pair
with source checks dated on or after its archive date. Unknown targets, conflicting
archive/restore requests and stale updates are rejected. Repeated archive requests
keep their original reason and timestamp. Previous snapshots preserve archive
history even after explicit restoration.

All imports take the same transaction-scoped PostgreSQL advisory lock before
reading the active publication. Read, merge, final validation, deactivation and
insertion happen in that transaction, so overlapping requests cannot overwrite
each other's additions and failed validation cannot partly replace the list.
The response `total` is the complete resulting active count, not the submitted count.

## Replit deployment

1. Review and merge this PR, then sync Replit.
2. Apply the additive `pair_archives` column from
   `lib/db/migrations/20260923_pair_archives.sql` through Replit's supported migration
   flow (or its schema sync). Existing rows default to an empty archive list.
   Do not run production SQL from ChatGPT. Deploy the column before the new API.
3. Run the repository codegen, API/scripts typechecks and library checks, then
   publish the API. Existing authentication, tokens and route settings are unchanged.
4. In a test database/preview, verify 10+50=60, duplicate update, explicit archive,
   stale snapshot replay, explicit restore, simultaneous imports, and rejected
   conflicting updates leaving the previous active publication intact.
5. Do not rerun research issue #9: it was already imported and is live with 65
   pairs. Verify a new import retains these existing combinations.

GitHub source changes alone do not update production. No live migration or publish
has been performed by this PR. The static terrain-map image still needs separate
Replit review when the published set changes.
