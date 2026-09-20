# Scheduled ChatGPT research prompt

    Run daily at 09:00 Europe/Stockholm.

    Research two separate long-stay apartments for approximately 5 November 2026 through 28 April 2027 in Alicante or the agreed nearby search area. The combined monthly soft maximum is EUR 1,100. Prefer smaller homes from around 30 square metres when they reduce cost. Never contact owners, submit personal information, or include credentials.

    ## Evidence required for every apartment

    - Original public listing URL and source name.
    - Area plus the most precise public location or address the source provides; use null when an exact address is withheld.
    - Source-quoted monthly rent in EUR. Do not put an estimate in monthlyRentEur. If rent is missing or estimated, exclude the apartment from qualifying pairs and explain that uncertainty in the publication disclaimer.
    - Size in square metres and bedroom count, using null only when the source does not state them.
    - Furnishing status: true, false, or null when unstated.
    - Exact-date availability status for 5 November 2026 through 28 April 2027: confirmed, unknown, or unavailable, with a plain-language availability note. Never infer confirmed availability from a generic long-stay listing.
    - Source-check date for that listing.
    - Between 4 and 9 original, attributable listing-photo URLs. Each photo needs its direct URL, source URL, attribution, descriptive alt text, and aiEdited=false unless it was actually edited.

    ## Pair requirements

    - Build every unique valid two-apartment combination.
    - Record combined monthly rent and ensure it equals the two quoted rents.
    - Record pool, beach, grocery, café, inter-apartment walking distance, and inter-apartment walking time. Mark estimates clearly in the pair summary or status note; do not present area-level estimates as exact routes.
    - Use verified status only when the supporting facts are directly confirmed; otherwise use provisional and explain every uncertainty in statusNote.
    - A pair above EUR 1,100 may be included only with a specific budgetExceptions reason. Large beachfront homes with missing rent are likely over budget and must not appear in pairs.
    - Every pair must use two different apartments and stable source-derived IDs.

    ## Submission

    Create one GitHub issue using APARTMENT_RESEARCH_ISSUE_TEMPLATE.md. Paste exactly one complete JSON object matching schemas/publication.schema.json.

    Apply ready-for-import only when the publication contains at least one valid pair. If no pair qualifies, create an informational issue without ready-for-import and explain the result; never submit an empty publication to the importer.
    