---
name: Daily apartment publishing
description: Confirmed separation between scheduled apartment research and validated production publication.
---

Run apartment research through a ChatGPT recurring task scheduled daily at 09:00 Europe/Stockholm. The task submits a complete publication payload to the designated GitHub issue queue and marks it ready for import. A GitHub Actions job runs at 11:00 Stockholm time, allowing two hours for research, and invokes the Replit importer. The importer validates that payload and is the only component that activates it in production.

The GitHub queue repository must also contain synchronized copies of the handoff instructions and API specification at the exact paths named by the recurring-task prompt. The task cannot read those files from the Replit workspace.

**Why:** The user confirmed this scheduling model is enabled. Keeping research submission separate from publication prevents invalid or incomplete research from replacing live data and avoids relying on a web deployment filesystem for persistence. The first scheduled attempt was blocked because the queue repository did not contain the referenced files.

The importer retries a rejected queued submission once after refreshing the GitHub issue. It may salvage a batch only when at least 90% of pairs independently pass the complete schema and publication checks. Invalid pairs are discarded whole; fields are never merged across pair or apartment records. A still-unusable retry leaves the active publication unchanged.

Apartment survival is independent from pair survival. Any complete apartment record nested in a malformed pair is retained in the candidate pool, while the bad pair is rejected. Paired records and candidate records are never assembled by copying fields across apartment IDs.

**How to apply:** Preserve the issue-queue and importer boundary when changing automation. Do not replace it with an in-process timer or direct source-file edits. When either instruction file changes, sync its current version to the queue repository. The authenticated GitHub Actions path has been verified with a controlled invalid submission that production rejected without replacing live data; repeat both valid and invalid checks after material pipeline changes.