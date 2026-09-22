# Spain Trip Apartment Research Inbox

This private repository is the handoff point between scheduled ChatGPT apartment research and the Alicante Rental Pairs site.

## Current automation

1. ChatGPT researches listings every day at 09:00 Europe/Stockholm.
2. It reads `CHATGPT_HANDOFF.md` and the publication contract, then creates a GitHub issue containing either the complete JSON publication or a pinned research-file descriptor. See [the research-file workflow](PUBLICATION_FILE_WORKFLOW.md).
3. Complete submissions receive `ready-for-import`.
4. GitHub Actions workflow `Import ready apartment research` starts when `ready-for-import` is applied, with an intended 11:00 Europe/Stockholm fallback and manual dispatch. Delayed scheduled runs remain eligible.
5. `scripts/import-ready-publication.mjs` submits queued publications to the authenticated production import API.
6. The API validates and atomically stores accepted publications in PostgreSQL. Invalid submissions leave the current live publication unchanged and receive `import-rejected`.

The first real queued submission was imported successfully on 21 September 2026 and the live API began serving two provisional EUR 1,100 Guardamar pairs.

## Repository names

- Workflow: `.github/workflows/import-ready-publication.yml`
- Importer: `scripts/import-ready-publication.mjs`
- Ready label: `ready-for-import`
- Rejected label: `import-rejected`
- Required Actions secret: `APARTMENT_IMPORT_TOKEN`

## Safety rules

- Never put API keys, importer tokens, passwords, or personal information in issues or files.
- Use public, attributable listing URLs and original photo URLs.
- Select genuinely varied photos, including outdoor context; avoid repeated angles of one room.
- The combined monthly soft maximum is EUR 1,100.
- Never claim exact-date availability unless the source confirmed it.
- Do not contact owners or submit personal information.
- Do not call the production importer from the ChatGPT research task; GitHub Actions owns that step.

See `CHATGPT_HANDOFF.md` for the complete operating rules, `CHATGPT_RESEARCH_PROMPT.md` for the scheduled task instructions, and `schemas/publication.schema.json` plus `lib/api-spec/openapi.yaml` for the required data shape.
