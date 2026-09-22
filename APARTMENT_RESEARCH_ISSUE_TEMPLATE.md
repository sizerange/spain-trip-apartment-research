# Apartment research submission

    Create a new issue with the title: Research publication: YYYY-MM-DD

    Paste one complete publication JSON object below. It must match schemas/publication.schema.json and contain at least one apartment pair. Never include credentials, tokens, passwords, or personal information.

    Apply ready-for-import only after the JSON is complete and contains at least one valid pair. A no-match research report must not carry ready-for-import.

    ```json
    {
      "reviewedAt": "YYYY-MM-DD",
      "disclaimer": "State unresolved research limitations and exclusions.",
      "pairs": [
        {
          "id": "stable-pair-id",
          "rank": 1,
          "paperId": "first-listing-id",
          "apartmentId": "second-listing-id",
          "title": "Pair title",
          "summary": "Evidence summary, including quoted rents and estimated distances.",
          "status": "provisional",
          "statusNote": "List every unconfirmed fact.",
          "areas": ["Area one", "Area two"],
          "beachDistanceMinutes": null,
          "combinedMonthlyRentEur": 0,
          "poolDistance": "Unknown or sourced/estimated distance",
          "beachDistance": "Unknown or sourced/estimated distance",
          "groceriesDistance": "Unknown or sourced/estimated distance",
          "cafesDistance": "Unknown or sourced/estimated distance",
          "pairWalkingDistance": "Estimated or verified distance",
          "pairWalkingTime": "Estimated or verified walking time",
          "paper": {},
          "apartment": {}
        }
      ],
      "budgetExceptions": []
    }
    ```

# Large publications

Use `PUBLICATION_FILE_WORKFLOW.md` when the full payload approaches the issue-body limit. Store the complete validated publication in `research/publications/` and use the preparation helper's single fenced JSON descriptor instead of the inline example below. Do not omit pairs or photos to fit. The receiving API must be republished with the larger import limit before activating this format.
