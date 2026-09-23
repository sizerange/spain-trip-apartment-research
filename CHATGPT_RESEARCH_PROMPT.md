# Scheduled ChatGPT research prompt

Run daily at 09:00 Europe/Stockholm.

Read current rules from `main` in `sizerange/spain-trip-apartment-research`. Commit research data files on a dedicated research branch; do not edit application code or write directly to protected `main`. Before researching, read:

1. `CHATGPT_HANDOFF.md`
2. `lib/api-spec/openapi.yaml`
3. `schemas/publication.schema.json`
4. `APARTMENT_RESEARCH_ISSUE_TEMPLATE.md`
5. `PUBLICATION_FILE_WORKFLOW.md`

Research two separate long-stay apartments for approximately 5 November 2026 through 28 April 2027 in Alicante or the agreed nearby search area. The combined monthly soft maximum is EUR 1,100. Prefer smaller homes from around 30 square metres when they reduce cost. Never contact owners, submit personal information, expose credentials, edit application source, or call the production importer directly.

## Evidence required for every apartment

- Original public listing URL and source name.
- Area plus the most precise public location or address the source provides; use null when an exact address is withheld.
- Source-quoted monthly rent in EUR. Do not put an estimate in monthlyRentEur. If rent is missing or estimated, exclude the apartment from qualifying pairs and explain that uncertainty in the publication disclaimer.
- Size in square metres and bedroom count, using null only when the source does not state them.
- Furnishing status: true, false, or null when unstated.
- Exact-date availability status for 5 November 2026 through 28 April 2027: confirmed, unknown, or unavailable, with a plain-language availability note. Never infer confirmed availability from a generic long-stay listing.
- Source-check date for that listing.
- Between 4 and 9 original, attributable listing-photo URLs with no duplicates. Each photo needs its direct URL, source URL, attribution, descriptive subject-based alt text, and aiEdited=false unless actually edited.
- Photo selection must include at least three distinct subjects and at least one balcony, outward view, exterior, courtyard, entrance, or street image. Do not submit several angles of the same room as the leading gallery.

## Pair requirements

- Build every unique valid two-apartment combination.
- Record combined monthly rent and ensure it equals the two quoted rents.
- Record pool, beach, grocery, café, inter-apartment walking distance, and inter-apartment walking time. Mark estimates clearly; do not present area-level estimates as exact routes.
- Use verified status only when supporting facts are directly confirmed; otherwise use provisional and explain every uncertainty in statusNote.
- A pair above EUR 1,100 may be included only with a specific budgetExceptions reason. Large beachfront homes with missing rent must not appear in pairs.
- Every pair must use two different apartments and stable source-derived IDs.

## Submission

Create one GitHub issue with the title `Research publication: YYYY-MM-DD`. Include exactly one fenced `json` object: either the complete publication matching the API contract and `schemas/publication.schema.json`, or a pinned `publicationFile` descriptor generated according to `PUBLICATION_FILE_WORKFLOW.md`. Prefer a research file when the full publication approaches GitHub's body limit; never omit pairs to fit an issue. Validate the complete referenced publication before applying the ready label.

Apply `ready-for-import` only when the publication contains at least one valid pair. If no pair qualifies, create an informational issue without `ready-for-import` and explain the result. Never submit an empty publication to the importer.

The GitHub Actions workflow `Import ready apartment research` starts when the ready label is applied, with an intended 11:00 Europe/Stockholm fallback and manual dispatch. It handles validation and publication. Invalid submissions receive `import-rejected` and do not change the live site.
# Incremental publication rule

Read `INCREMENTAL_PUBLICATIONS.md`. After its deployment, omitted pairs are retained by the importer. Do not use omission to remove a listing. Submit explicit reasoned `archivePairs` requests for confirmed removals, and consistent complete updates for all pairs sharing changed apartment facts. Old archived matches cannot return without explicit restoration and fresh source evidence. Verify Replit deployment before relying on this behavior.
