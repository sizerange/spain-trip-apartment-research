import { PublicationInputError, resolvePublication } from "./src/publication-input.mjs";

const readyLabel = "ready-for-import";
const rejectedLabel = "import-rejected";
const repository = process.env.GITHUB_REPOSITORY;
const importUrl = process.env.APARTMENT_IMPORT_URL;
const importToken = process.env.APARTMENT_IMPORT_TOKEN;
const githubToken = process.env.GITHUB_TOKEN;

if (!repository || !importUrl || !importToken || !githubToken) {
  throw new Error("Required importer configuration is missing");
}

async function github(path, init = {}) {
  const response = await fetch("https://api.github.com" + path, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: "Bearer " + githubToken,
      "x-github-api-version": "2022-11-28",
      ...init.headers,
    },
  });
  if (!response.ok && response.status !== 404 && response.status !== 422) {
    throw new Error("GitHub request failed (" + response.status + "): " + path);
  }
  return response;
}

async function ensureLabel(name, color, description) {
  await github("/repos/" + repository + "/labels", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, color, description }),
  });
}

async function comment(issueNumber, body) {
  await github("/repos/" + repository + "/issues/" + issueNumber + "/comments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

async function reject(issue, reason) {
  await github("/repos/" + repository + "/issues/" + issue.number + "/labels", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ labels: [rejectedLabel] }),
  });
  await comment(
    issue.number,
    "Import rejected: " + reason +
      "\n\nThe live publication was not changed. Correct the JSON, remove `" +
      rejectedLabel + "` and reapply `" + readyLabel + "` when ready.",
  );
  await github(
    "/repos/" + repository + "/issues/" + issue.number + "/labels/" + readyLabel,
    { method: "DELETE" },
  );
}

await ensureLabel(
  rejectedLabel,
  "cf222e",
  "Submission rejected by publication validation",
);
const issuesResponse = await github(
  "/repos/" + repository + "/issues?state=open&labels=" +
    readyLabel + "&sort=created&direction=asc&per_page=20",
);
const issues = (await issuesResponse.json()).filter((issue) => !issue.pull_request);

if (issues.length === 0) {
  console.log("No apartment research submission is awaiting import.");
  process.exit(0);
}

let imported = 0;
let rejected = 0;
for (const issue of issues) {
  let publication;
  try {
    // Re-read immediately before import so a removed ready label is respected.
    const refreshed = await github("/repos/" + repository + "/issues/" + issue.number);
    if (!refreshed.ok) throw new Error("Unable to refresh queued issue");
    const current = await refreshed.json();
    if (current.state !== "open" || !current.labels.some(label => label.name === readyLabel)) continue;
    publication = await resolvePublication(current.body, repository, github);
  } catch (error) {
    if (!(error instanceof PublicationInputError)) throw error;
    await reject(issue, error instanceof Error ? error.message : "invalid JSON");
    rejected += 1;
    continue;
  }

  const response = await fetch(importUrl, {
    method: "POST",
    headers: {
      authorization: "Bearer " + importToken,
      "content-type": "application/json",
    },
    body: JSON.stringify(publication),
  });

  if (response.status === 400 || response.status === 422) {
    const details = await response.json().catch(() => ({}));
    await reject(
      issue,
      typeof details.error === "string"
        ? details.error
        : "publication validation returned HTTP " + response.status,
    );
    rejected += 1;
    continue;
  }
  if (!response.ok) {
    throw new Error(
      "Import service failed for issue #" + issue.number + " (" + response.status + ")",
    );
  }

  const result = await response.json();
  await comment(
    issue.number,
    "Imported successfully.\n\n- Publication: `" + result.publicationId +
      "`\n- Pairs: " + result.total + "\n- Imported: " + result.importedAt,
  );
  await github("/repos/" + repository + "/issues/" + issue.number, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state: "closed", state_reason: "completed" }),
  });
  imported += 1;
}

console.log("Finished: " + imported + " imported, " + rejected + " rejected.");
