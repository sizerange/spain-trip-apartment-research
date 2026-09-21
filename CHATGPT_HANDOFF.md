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

- Pair data and research copy: `artifacts/api-server/src/routes/apartment-pairs.ts`
- Main pair presentation: `artifacts/alicante-rental-pairs/src/pages/Home.tsx`
- Visual theme: `artifacts/alicante-rental-pairs/src/index.css`
- Terrain relationship map: `artifacts/alicante-rental-pairs/public/alicante-pairs-terrain-map.png`
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

All previous candidates were estimated at EUR 1,650–EUR 1,800 per pair and are filtered out of the public response. They remain in `candidatePairs` only as research history and must not appear on the site while above budget.

The API publishes only candidates whose `combinedMonthlyRentEur` is at or below EUR 1,100.

## Apartment research rules

For every candidate:

1. Use a real, public, attributable listing URL.
2. Prefer seasonal or long-stay listings appropriate for the requested winter period.
3. Check the exact stay dates where the source permits it.
4. If the site accepts a check-in but refuses the long checkout, say that precisely. Do not claim the full date range was accepted.
5. Availability remains unknown unless the source returns an actual result for the requested stay.
6. Record the advertised monthly price when available.
7. If estimating rent, use current neighborhood comparables and explain that it is an estimate.
8. Confirm or estimate walking distance between the two map pins. Label map-pin routes as estimates, not verified door-to-door measurements.
9. Preserve the original listing and photo-source links.
10. Do not contact owners, book, or submit personal information.

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

Unknown facts must be stated honestly as “Not verified”, “Not stated”, or another precise explanation.

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
  - useful indoor overview,
  - kitchen or living overview,
  - exterior, garden, pool, terrace, or beach context when genuinely provided by the source.
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

Selected scheduler: ChatGPT recurring task.

Target schedule:

- Every day at 09:00
- Time zone: Europe/Stockholm
- Cron expression when the scheduler uses local time: `0 9 * * *`

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

The current website is an Autoscale web deployment and its pair data is hardcoded in TypeScript. A Replit Scheduled Deployment cannot safely update that deployed source file because published filesystems are not persistent.

Do not create a fake timer, `setInterval`, or development workflow and call it a daily updater.

Before enabling the real timer:

1. Store published apartment and pair records in persistent PostgreSQL or another persistent store.
2. Make the API read approved pair records from that store.
3. Create a separate scheduled job that performs the refresh and writes validated records to the store.
4. Configure that job for `0 9 * * *` in `Europe/Stockholm`.
5. Keep the website/API deployment as a web deployment; the scheduled job must be separate.
6. Verify one manual refresh before enabling the recurring schedule.

## Ready-to-use ChatGPT recurring-task prompt

Use this prompt for a ChatGPT task scheduled every day at 09:00 Europe/Stockholm after persistent storage and repository access are connected:

> Refresh the Alicante Rental Pairs research. Read `CHATGPT_HANDOFF.md` first and obey every rule. Do not touch authentication, authorization, security middleware, secrets, the Economy page, or existing routes. Search for real seasonal or long-stay apartments suitable for 5 November 2026 through 28 April 2027. Prefer homes from about 30 m² when they reduce cost. The pair budget is EUR 1,100/month total soft maximum and may be uneven, such as EUR 500 + EUR 600. Only exceed it for an unusually strong pair and explain why. Build every valid pair combination, keep stable apartment identities, use attributable original links and representative real photos, update the terrain map when locations change, and label estimates and unconfirmed availability honestly. Run the frontend and API typechecks plus `git diff --check`. Publish only validated pair records.

## Validation before finishing any update

Run:

```bash
pnpm --filter @workspace/alicante-rental-pairs run typecheck
pnpm --filter @workspace/api-server run typecheck
git diff --check
```

Restart the web and API workflows after code or data changes, inspect logs, and visually check desktop and mobile layouts.