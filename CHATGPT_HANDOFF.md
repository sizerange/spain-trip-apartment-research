# ChatGPT handoff: Alicante Rental Pairs

Read this entire file before changing the project.

## Non-negotiable safety boundary

Do not modify, replace, remove, or reconfigure:

- Clerk authentication
- Login or logout behavior
- Authorization or permissions
- Security middleware
- Secrets or environment variables
- Economy authentication, authorization, and access control
- Existing routes, stable IDs, or Clerk proxy behavior

The user explicitly asked that security and login configuration remain untouched. Economy content and data may be changed when the user explicitly provides new financial or planning information. Do not invent Economy data or weaken its existing access restrictions.

## Product purpose

This is a private research site for a mother and daughter looking for two apartments near Alicante for approximately 5 November 2026 through 28 April 2027.

The site presents complete apartment pairs. Every valid pair must be shown, even if the same apartment repeats in several pairs. If apartments A, B, and C all qualify and are close enough, publish A+B, B+C, and A+C.

## Source-of-truth files

- Publication contract: `lib/api-spec/openapi.yaml`
- Persistent publication table: `lib/db/src/schema/apartment-pair-publications.ts`
- Import validation and public pair API: `artifacts/api-server/src/routes/apartment-pairs.ts`
- Main pair presentation: `artifacts/alicante-rental-pairs/src/pages/Home.tsx`
- Visual theme: `artifacts/alicante-rental-pairs/src/index.css`
- Terrain relationship map: `artifacts/alicante-rental-pairs/public/alicante-pairs-terrain-map.png`
- Scheduled-research repository: `sizerange/spain-trip-apartment-research`
- Scheduled importer workflow: `.github/workflows/import-ready-publication.yml`
- Scheduled importer script: `scripts/import-ready-publication.mjs`
- App routing, authentication, and Economy navigation: leave unchanged
- Economy content/data: may be updated only from new information explicitly provided by the user

## Budget rules

- The soft maximum is EUR 1,100 per pair per month.
- It is a combined limit, not a fixed per-apartment limit.
- EUR 550 + EUR 550 is valid.
- EUR 500 + EUR 600 is valid.
- Uneven splits are welcome when the pair total remains near or below EUR 1,100.
- A slightly more expensive pair may be retained only when it is unusually strong. Explain exactly why it justifies exceeding the soft maximum.
- Never silently publish an ordinary pair above EUR 1,100.
- Rank lower total rent above unnecessary extra floor area.
- Apartments around 30 square metres are acceptable. Do not favor 70–80 square metre homes merely because they are larger.
- Prefer a verified advertised monthly price.
- If a source has no monthly price, make a defensible comparison-based estimate and label it clearly as a market guesstimate, not a quoted rate.
- Treat large beachfront apartments with no stated rent as likely over budget unless credible research supports a near-budget estimate. Keep them out of the qualifying shortlist and place source-linked records in the collapsed “Likely over budget or rent not stated” panel.
- Never imply that inclusion proves the apartment meets the budget.

## Current publication state

- The live API reads the newest active publication from persistent PostgreSQL. Built-in TypeScript candidates are only a fallback when no active database publication exists.
- The first real scheduled-research submission was imported successfully from GitHub issue #3 on 21 September 2026.
- The active publication contains two provisional Guardamar pairs, each totaling EUR 1,100/month:
  - `sunsea-13164-13210`
  - `sunsea-13210-13248`
- Every import is validated before it can replace the active publication. The importer refreshes the issue and retries once after a malformed submission.
- If at least 90% of submitted pairs independently pass the full contract and publication checks, the valid pairs may be published and malformed pairs are discarded whole. Fields are never copied or merged between apartments.
- Each nested apartment is also validated independently. A good apartment survives even when its proposed partner or pair wrapper is malformed, and appears in the site's “Valid apartments waiting for a match” pool.
- Review that retained candidate pool before each research run so a previously valid apartment can be paired with a newly found match.
- A still-unusable retry leaves the current live publication unchanged.
- The import API enforces positive combined rent, rent arithmetic, matching outer and nested apartment IDs, distinct apartments, unique pair compositions, and a documented exception for totals above EUR 1,100.
- Repository labels:
  - `ready-for-import`: complete submission awaiting validation and import.
  - `import-rejected`: submission failed parsing or publication validation.
- Successful imports receive a result comment and the GitHub issue is closed.

## Apartment research rules

For every candidate:

1. Use a real, public, attributable listing URL.
2. Prefer seasonal or long-stay listings appropriate for the requested winter period.
3. Check the exact stay dates where the source permits it.
4. If the site accepts a check-in but refuses the long checkout, say that precisely. Do not claim the full date range was accepted.
5. Availability remains unknown unless the source returns an actual result for the requested stay.
6. Record the advertised monthly price when available.
7. If estimating rent, use current neighborhood comparables, give a midpoint and range, and label it `guesstimate`. A guessed rent must not be presented as quoted or used to silently qualify a pair under the EUR 1,100 limit.
8. Confirm or estimate walking distance between the two map pins. Label map-pin routes as estimates, not verified door-to-door measurements.
9. Preserve the original listing and photo-source links.
10. Do not contact owners, book, or submit personal information.
11. For missing numeric comparison facts where a defensible local average exists—such as size or walking distance—prefer a midpoint and range over zero or a blank. Include the word `guesstimate` in the displayed value or supporting note.
12. Do not guesstimate exact-date availability or claim that a categorical amenity exists without source evidence.

## Pair construction rules

- Show every valid combination.
- Repetition is intentional and allowed.
- Keep apartment identity stable when it repeats.
- Give each pair its own PAPER number.
- In repeated apartment panels, show “Also appears in PAPER …”.
- Pair cards contain two apartment sections, followed by shared distance facts and a concise research summary.
- Pair distance is shown in approximate metres only. Do not add a Pair Time field.
- A roughly 10-minute walk is preferred. Longer pairs can remain as clearly described fallbacks, but walking distance must be visible.

## Apartment-specific copy

When a shared field contains facts for both apartments, visually separate the switch between apartment IDs with a blank row.

Correct:

```text
P-002: beachfront access

A-001: approximately 5 min walk
```

Do not run both apartments together with a pipe character in the rendered UI.

Use short IDs such as `P-001`, not “Apartment P-001”. Do not use filler such as “advertiser states approximately”.

Unknown facts must be stated honestly as “Not verified”, “Not stated”, or another precise explanation. Numeric unknowns should instead use a defensible midpoint and range when one can be researched, with a visible `guesstimate` label. This does not apply to exact availability, quoted-rent provenance, or whether an amenity exists.

## Pair separation

Each complete two-apartment pair is followed by:

1. generous vertical padding,
2. a solid black horizontal line exactly 10px high spanning the content width,
3. generous vertical padding before the next pair.

Conceptually:

```text
Apartment A
Apartment B

10px black line

Apartment C
Apartment D
```

Do not put the line between the two apartments that belong to the same pair.

## Photo rules

- Use real photographs from the original listing gallery.
- Show four visible photos per apartment in a two-by-two grid.
- Put the additional-photo count beneath the grid, such as “+5 more photos in gallery”.
- Keep visible photos clear. Never blur the fourth image or place the count over a photograph.
- Aim for nine source photos per apartment: four visible and five in the gallery.
- Choose representative photographs rather than marketing repetition:
  - representative living or dining overview,
  - balcony or terrace,
  - outward view from the apartment,
  - building exterior, entrance, courtyard, or street context,
  - kitchen, bedroom, and bathroom where available.
- Never fill the leading gallery with several angles of the same room or furniture.
- The frontend prioritizes the first distinct living, balcony, view, exterior, street, kitchen, bedroom, and bathroom images before remaining source-order images.
- Imports must contain 4–9 photos, no duplicate photo URLs, at least one balcony/view/exterior/courtyard/street image, and at least three distinct photo subjects identified by descriptive alt text.
- Do not imply an amenity from an unrelated neighborhood photograph.
- Keep source attribution in the full gallery.

## Map rules

- Keep a terrain-style map above the pair cards.
- Mark every unique apartment.
- Draw every valid pair connection.
- Explain that green lines represent possible pairs.
- If the same listing has historical role IDs, display both where needed rather than hiding the relationship.
- Keep OpenStreetMap/OpenTopoMap attribution.

## Visual and interaction preferences

- Palette: gold, black, and green.
- The Research view and filters begin directly below the menu.
- Do not restore “The shortlist, without the guesswork” hero.
- Apartment sections are side-by-side on wide screens and stacked on small screens.
- Photos should be large and legible.
- Keep the 10px black pair separators.
- Preserve the existing navigation and Economy link.
- Do not add emojis.

## Daily morning refresh specification

The automation has two separate stages:

1. ChatGPT recurring research task:
   - Every day at 09:00 Europe/Stockholm.
   - Reads this file and `lib/api-spec/openapi.yaml` from `sizerange/spain-trip-apartment-research`.
   - Creates one GitHub issue containing exactly one fenced JSON publication.
   - Applies `ready-for-import` only after the payload is complete.
2. GitHub Actions importer:
   - Intended import time: 11:00 Europe/Stockholm, allowing two hours for research.
   - Workflow name: `Import ready apartment research`.
   - Workflow path: `.github/workflows/import-ready-publication.yml`.
   - GitHub cron runs at both 09:00 and 10:00 UTC and proceeds only when Stockholm local time is 11:00, covering daylight-saving changes.
   - Calls the production import endpoint, which validates and atomically activates accepted data.

Connection and naming notes:

- GitHub owner: `sizerange`.
- Research repository: `sizerange/spain-trip-apartment-research`.
- Production import URL is configured through `APARTMENT_IMPORT_URL`.
- Replit and GitHub Actions must hold the same `APARTMENT_IMPORT_TOKEN`; never put its value in issues, files, logs, or chat.
- GitHub OAuth manages research issues. A GitHub App connection was added for repository/workflow administration.

Each run should:

1. Search current seasonal and long-stay sources for smaller, lower-cost Alicante apartments.
2. Prioritize Playa San Juan, Albufereta, and nearby areas that still satisfy the beach, pool, grocery, café, and pair-distance goals.
3. Check or carefully estimate monthly rent.
4. Reject ordinary pairs above EUR 1,100 total.
5. Build all valid pair combinations from qualifying apartments.
6. Preserve stable apartment identities across repeated combinations.
7. Select and attribute real representative photos.
8. Update map markers and connection lines when apartments change.
9. Publish only after validation succeeds.
10. Keep a last-reviewed date and source-checked date.

## Important scheduling limitation

The website and API remain an Autoscale web deployment. Scheduling is external: ChatGPT performs research and GitHub Actions invokes the importer. Do not add an in-process timer, `setInterval`, or development workflow.

The persistent PostgreSQL publication store, database-reading API, authenticated importer, GitHub issue queue, and controlled acceptance/rejection checks are complete. A real submission has also been imported successfully.

As of 21 September 2026, final automatic-import activation still requires:

1. Add the same rotated `APARTMENT_IMPORT_TOKEN` as a GitHub Actions repository secret.
2. Republish the Replit app so production receives the rotated token.
3. Run `Import ready apartment research` manually once and confirm success.

## Ready-to-use ChatGPT recurring-task prompt

Use this prompt for the ChatGPT task scheduled every day at 09:00 Europe/Stockholm:

> Refresh the Alicante Rental Pairs research. Work in `sizerange/spain-trip-apartment-research` on `main`. Read `CHATGPT_HANDOFF.md`, `CHATGPT_RESEARCH_PROMPT.md`, and `lib/api-spec/openapi.yaml` first and obey every rule. Do not touch authentication, authorization, security middleware, secrets, the Economy page, or application routes. Search for real seasonal or long-stay apartments suitable for 5 November 2026 through 28 April 2027. Prefer homes from about 30 m² when they reduce cost. The pair budget is EUR 1,100/month total soft maximum and may be uneven, such as EUR 500 + EUR 600. Only exceed it for an unusually strong pair and provide a specific budget exception. Build every valid pair combination, preserve stable apartment identities, use attributable source links and genuinely varied original photos, and label estimates and unconfirmed availability honestly. Create one GitHub issue containing exactly one fenced JSON publication matching the API contract. Apply `ready-for-import` only when the publication is complete and contains at least one valid pair. Never call the production importer directly.

## Validation before finishing any update

Run:

```bash
pnpm --filter @workspace/alicante-rental-pairs run typecheck
pnpm --filter @workspace/api-server run typecheck
git diff --check
```

These commands apply to application-code changes in Replit, not normal ChatGPT research submissions. Normal research runs create a GitHub issue and leave validation and production activation to the importer.