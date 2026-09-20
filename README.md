# Spain Trip Apartment Research Inbox

This private repository is the handoff point between scheduled ChatGPT apartment research and the Alicante Rental Pairs site.

## Workflow

1. ChatGPT researches listings for the 5 November 2026–28 April 2027 stay.
2. It creates a new GitHub issue using the Apartment research submission template.
3. The issue contains one JSON publication matching schemas/publication.schema.json.
4. A Replit scheduled importer validates the issue.
5. Only a fully valid snapshot is published. Invalid submissions remain unpublished.

## Safety rules

- Never put API keys, importer tokens, passwords, or personal information in issues or files.
- Use public, attributable listing URLs and original photo URLs.
- The combined monthly soft maximum is EUR 1,100.
- Large beachfront apartments with no stated rent belong in the likely-over-budget/unknown-rent section, not the qualifying shortlist.
- Never claim exact-date availability unless the source confirmed it.
- Do not contact owners or submit personal information.

See CHATGPT_RESEARCH_PROMPT.md for the scheduled prompt and schemas/publication.schema.json for the required data shape.
