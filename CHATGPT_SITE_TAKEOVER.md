# ChatGPT site takeover: Alicante Rental Pairs

Read this file, `CHATGPT_HANDOFF.md`, `replit.md`, and the relevant source files before changing the application.

## What ChatGPT can and cannot currently reach

The GitHub repository `sizerange/spain-trip-apartment-research` now contains the scheduled research/import system and a complete source mirror of the Replit application.

ChatGPT may edit the complete source through GitHub. GitHub-only ChatGPT still cannot safely run Replit workflows, inspect the Replit preview, operate Replit databases or secrets, apply production migrations, or publish the application.

Never claim that a GitHub-only change is live on Replit. Submit source changes through a focused branch or pull request, then complete Replit validation and publishing.

### Stable pre-takeover checkpoint

The application state immediately before full-site ChatGPT access is tagged:

```text
pre-chatgpt-full-site-edit-2026-09-21
```

The tag exists both in the Replit Git history and in the GitHub repository. If later edits go badly, restore or compare against that tag rather than trying to reconstruct the previous state manually.

## Product and user intent

This is a private research and family-planning application for a mother and daughter seeking two nearby Alicante-area apartments for approximately 5 November 2026 through 28 April 2027.

The product has two main surfaces:

- `/` — apartment-pair research, filtering, sorting, map context, retained apartment candidates, source links, and validation disclosures.
- `/economy` — private authenticated family financial planning, scenario comparisons, source notes, and assumptions.

The app should feel personal, trustworthy, clearly organized, and pleasant to revisit. It is not a generic property portal or corporate dashboard.

## Non-negotiable safety boundary

Do not weaken, replace, bypass, or remove:

- Clerk authentication
- Login or logout behavior
- Authorization or permissions
- Security middleware
- Secret handling
- Economy access restrictions
- Import bearer-token verification
- Stable API routes or stable apartment IDs

Never print, log, commit, request in chat, or expose the values of:

- `APARTMENT_IMPORT_TOKEN`
- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `SESSION_SECRET`
- `VITE_CLERK_PUBLISHABLE_KEY`

Economy content may be changed only from new financial or planning information explicitly provided by the user. Do not invent family finances.

## Application source map

The complete Replit workspace uses a pnpm monorepo.

### Main website

- Artifact directory: `artifacts/alicante-rental-pairs`
- Main routes: `artifacts/alicante-rental-pairs/src/App.tsx`
- Apartment research page: `artifacts/alicante-rental-pairs/src/pages/Home.tsx`
- Economy page: `artifacts/alicante-rental-pairs/src/pages/Economy.tsx`
- Economy components: `artifacts/alicante-rental-pairs/src/components/economy/`
- Global theme: `artifacts/alicante-rental-pairs/src/index.css`
- Generated API client: `lib/api-client-react/src/generated/`

### API

- Artifact directory: `artifacts/api-server`
- Apartment import and public pair API: `artifacts/api-server/src/routes/apartment-pairs.ts`
- Pair affordability validation: `artifacts/api-server/src/routes/apartment-pair-affordability.ts`
- Economy route and access control: inspect the existing API route before editing; preserve its authorization behavior.

### Contracts and persistence

- Canonical OpenAPI contract: `lib/api-spec/openapi.yaml`
- Generated Zod schemas: `lib/api-zod/src/generated/`
- Persistent publications: `lib/db/src/schema/apartment-pair-publications.ts`
- Retained valid apartments: `lib/db/src/schema/apartment-candidates.ts`
- Schema exports: `lib/db/src/schema/index.ts`

### Import automation

- Replit-side GitHub importer: `scripts/src/import-github-research.ts`
- Research repository: `sizerange/spain-trip-apartment-research`
- GitHub workflow: `.github/workflows/import-ready-publication.yml`
- GitHub importer: `scripts/import-ready-publication.mjs`

## Contract-first editing rule

For any API shape or query change:

1. Edit `lib/api-spec/openapi.yaml`.
2. Run:

   ```bash
   pnpm --filter @workspace/api-spec run codegen
   ```

3. Update API implementation and frontend consumers.
4. Never hand-edit generated API files as the source of truth.

The OpenAPI copy in `sizerange/spain-trip-apartment-research` must be synchronized after contract changes because the scheduled ChatGPT research task reads it.

## Current apartment import behavior

- The public API reads the newest active publication from PostgreSQL.
- Built-in TypeScript pairs are only a fallback when no active publication exists.
- The importer authenticates with `APARTMENT_IMPORT_TOKEN`.
- The GitHub importer refreshes and retries once after HTTP 400 or 422.
- A publication may be salvaged only when at least 90% of submitted pairs independently pass the full contract and publication rules.
- Bad pairs are discarded whole.
- Apartment fields are never copied, merged, or reconstructed across apartment IDs.
- Outer `paperId` and `apartmentId` values must match the nested apartment records.
- A still-unusable import leaves the active publication unchanged.
- Each nested apartment is parsed independently.
- A complete valid apartment survives even when its partner or pair wrapper is malformed.
- Surviving apartments are upserted by stable listing ID in `apartment_candidates`.
- Retained apartments appear in “Valid apartments waiting for a match.”
- Apartments already used in the active publication are hidden from that waiting pool.
- Retained apartments do not count as qualifying pairs and do not affect affordability conclusions.

Do not add a retention/deletion policy for candidates unless the user specifies one.

## Pair and apartment rules

- Combined monthly pair budget: EUR 1,100 soft maximum.
- Uneven splits are valid.
- A normal pair above the maximum is invalid.
- An exceptional over-budget pair requires a specific documented budget exception.
- Missing or guessed rent must never silently qualify a pair.
- Prefer lower rent over unnecessary extra floor area.
- Apartments around 30 m² are acceptable.
- Show every valid pair combination, even when an apartment repeats.
- Keep apartment identity stable across repeated combinations.
- Pair cards contain two complete apartment sections.
- A valid imported listing uses a real public source URL.
- Exact-date availability remains unknown unless the source verifies the requested dates.
- Estimates must be labeled `guesstimate`.
- Do not infer categorical amenities without source evidence.

### Photo publication rules

Published pairs require:

- 4–9 distinct source photos per apartment
- no duplicate photo URLs
- at least three distinct subjects
- at least one balcony, terrace, outward view, exterior, courtyard, entrance, street, or neighborhood-context image
- accurate descriptive alt text
- source attribution and original links

Candidate retention requires a complete valid apartment record but does not require the full pair-publication gallery standard. This prevents a good apartment from being lost solely because its gallery needs further work.

## Current sorting behavior

The apartment-pair filters support:

- editorial rank
- date found — newest first
- beach distance

“Date found — newest first” sorts by the most recent valid `sourceCheckedAt` timestamp among the pair’s two apartments. Newest entries appear at the top; earliest entries appear at the bottom. Equal or unavailable dates fall back to editorial rank.

## Current visual direction

The user likes the color character of `sizerange.com` but does not want a direct copy.

The current application uses:

- near-black and deep forest-green surfaces
- soft white text
- vivid mint/green accents
- restrained gold accents
- subtle green fades and depth
- strong, clearly contrasting borders around information that belongs together
- approximately 2px borders on major grouped cards and panels
- a polished silver separator approximately 10px high between complete apartment pairs
- a silver gradient/fade and restrained shadow on that separator

Required pair rhythm:

```text
apartment information
apartment information
silver separator
apartment information
apartment information
silver separator
```

The separator goes between complete pairs, never between the two apartments within one pair.

Preserve:

- clear grouped boundaries
- responsive side-by-side apartment sections on wide screens
- stacked apartment sections on small screens
- large legible photos
- visible source links
- gold, black, white, and green identity
- no emojis

The large Economy introduction that stated Wayne’s monthly income, the review date, and the long family-planning disclaimer was intentionally removed. Do not restore it unless the user explicitly requests it. Keep the actual authenticated financial cards and scenario tools.

## Replit runtime requirements

- The frontend workflow is:

  ```bash
  pnpm --filter @workspace/alicante-rental-pairs run dev
  ```

- The API workflow is:

  ```bash
  pnpm --filter @workspace/api-server run dev
  ```

- Services must use Replit’s configured artifact routing and `PORT`.
- Browser code must not hardcode localhost or the Replit development domain.
- Preserve artifact base-path behavior.
- After application changes, restart the affected workflow once and inspect its logs.
- Preview through the Replit artifact preview, not a guessed localhost URL.

## Database changes

For development schema changes:

```bash
pnpm --filter @workspace/db run push
```

Do not run production SQL directly. Production schema changes must be applied through the supported Replit publish/deployment flow.

Never replace the existing database.

## Required validation

For frontend-only changes:

```bash
pnpm --filter @workspace/alicante-rental-pairs run typecheck
git diff --check
```

For API or import changes:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/scripts run typecheck
pnpm run typecheck:libs
git diff --check
```

For OpenAPI changes, run code generation first.

After meaningful visual work:

- restart the web workflow
- inspect desktop and mobile previews
- check browser logs
- verify text contrast, responsive stacking, card boundaries, and source links

Do not claim completion merely because files were edited.

## Publishing and live-site responsibility

A code change is not live until the Replit project is published successfully.

Before publishing:

- ensure all required secrets exist in the target environment without displaying them
- ensure database schema changes are included
- ensure the API and frontend builds pass
- confirm health checks and deployment logs

Never construct a production URL from a development domain.

## Recommended operating model

If ChatGPT works from GitHub:

1. Work in `sizerange/spain-trip-apartment-research`, which contains the complete Replit source mirror.
2. Use the dedicated `chatgpt-site-edits` branch. Do not commit application edits directly to `main`.
3. Make and validate the change.
4. Open a pull request with:
   - user-visible summary
   - changed routes/files
   - validation commands and results
   - migration requirements
   - screenshots for visual work
5. Have Replit merge/sync the change.
6. Run Replit workflow, database, preview, and publish checks.

If ChatGPT works inside Replit with full tools, it may edit and validate directly while obeying this file and `CHATGPT_HANDOFF.md`.

## Full-takeover status

The complete application source, lockfiles, workspace configuration, documentation, and required terrain-map asset are mirrored to GitHub. Secrets, environment values, dependencies, generated build output, private runtime data, and historical screenshots are excluded.

ChatGPT can now own source-code editing through GitHub. Replit validation, database migration, preview review, and publishing remain required before any GitHub change is considered live.