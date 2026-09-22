import { ReplitConnectors } from "@replit/connectors-sdk";
import { PublicationInputError, resolvePublication } from "./publication-input.mjs";

type GitHubIssue = {
  number: number;
  title: string;
  body: string | null;
  pull_request?: unknown;
  state: string;
  labels: { name: string }[];
};

type ImportResult = {
  publicationId: string;
  importedAt: string;
  total: number;
};

const readyLabel = "ready-for-import";
const rejectedLabel = "import-rejected";

const repository = process.env.GITHUB_RESEARCH_REPOSITORY;
const importUrl = process.env.APARTMENT_IMPORT_URL;
const importToken = process.env.APARTMENT_IMPORT_TOKEN;

if (!repository || !repository.includes("/")) {
  throw new Error("GITHUB_RESEARCH_REPOSITORY must be owner/repository");
}
if (!importUrl) {
  throw new Error("APARTMENT_IMPORT_URL is not configured");
}
if (!importToken) {
  throw new Error("APARTMENT_IMPORT_TOKEN is not configured");
}

const requiredImportUrl: string = importUrl;
const requiredImportToken: string = importToken;
const requiredRepository: string = repository;

async function submitPublication(publication: unknown): Promise<Response> {
  return fetch(requiredImportUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${requiredImportToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(publication),
  });
}

async function githubRequest(
  connectors: ReplitConnectors,
  path: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
): Promise<Response> {
  const response = await connectors.proxy("github", path, init);
  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status})`);
  }
  return response;
}

async function ensureRejectedLabel(
  connectors: ReplitConnectors,
): Promise<void> {
  const response = await connectors.proxy(
    "github",
    `/repos/${repository}/labels`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: rejectedLabel,
        color: "cf222e",
        description: "Submission rejected by publication validation",
      }),
    },
  );

  if (!response.ok && response.status !== 422) {
    throw new Error(`Unable to ensure rejection label (${response.status})`);
  }
}

async function rejectIssue(
  connectors: ReplitConnectors,
  issue: GitHubIssue,
  reason: string,
): Promise<void> {
  await githubRequest(
    connectors,
    `/repos/${repository}/issues/${issue.number}/labels`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ labels: [rejectedLabel] }),
    },
  );
  await githubRequest(
    connectors,
    `/repos/${repository}/issues/${issue.number}/comments`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        body: `Import rejected: ${reason}\n\nThe live publication was not changed. Correct the JSON, remove the \`${rejectedLabel}\` label, and reapply \`${readyLabel}\` when it is ready for another attempt.`,
      }),
    },
  );
  await githubRequest(
    connectors,
    `/repos/${repository}/issues/${issue.number}/labels/${readyLabel}`,
    { method: "DELETE" },
  );
}

async function run(): Promise<void> {
  const connectors = new ReplitConnectors();
  await ensureRejectedLabel(connectors);
  const issuesResponse = await githubRequest(
    connectors,
    `/repos/${repository}/issues?state=open&labels=${readyLabel}&sort=created&direction=asc&per_page=10`,
  );
  const issues = (await issuesResponse.json()) as GitHubIssue[];
  const submissions = issues.filter((candidate) => !candidate.pull_request);

  if (submissions.length === 0) {
    console.log("No apartment research submission is awaiting import.");
    return;
  }

  let imported = 0;
  let rejected = 0;

  for (const issue of submissions) {
    let publication: unknown;
    try {
      const currentResponse = await githubRequest(connectors, `/repos/${repository}/issues/${issue.number}`);
      const current = (await currentResponse.json()) as GitHubIssue;
      if (current.state !== "open" || !current.labels.some(label => label.name === readyLabel)) continue;
      publication = await resolvePublication(current.body, requiredRepository, (path, init) => connectors.proxy("github", path, init));
    } catch (error) {
      if (!(error instanceof PublicationInputError)) throw error;
      await rejectIssue(
        connectors,
        issue,
        error.message,
      );
      rejected += 1;
      continue;
    }

    let importResponse = await submitPublication(publication);

    if (importResponse.status === 400 || importResponse.status === 422) {
      const refreshedIssueResponse = await githubRequest(
        connectors,
        `/repos/${repository}/issues/${issue.number}`,
      );
      const refreshedIssue = (await refreshedIssueResponse.json()) as GitHubIssue;
      if (refreshedIssue.state !== "open" || !refreshedIssue.labels.some(label => label.name === readyLabel)) continue;
      try {
        publication = await resolvePublication(refreshedIssue.body, requiredRepository, (path, init) => connectors.proxy("github", path, init));
        importResponse = await submitPublication(publication);
      } catch (error) {
        if (!(error instanceof PublicationInputError)) throw error;
        // The normal rejection path below preserves the current publication.
      }
    }

    if (importResponse.status === 400 || importResponse.status === 422) {
      await rejectIssue(
        connectors,
        issue,
        `publication validation returned HTTP ${importResponse.status}.`,
      );
      rejected += 1;
      continue;
    }
    if (!importResponse.ok) {
      throw new Error(
        `Import service failed for issue #${issue.number} (${importResponse.status})`,
      );
    }

    const result = (await importResponse.json()) as ImportResult;
    await githubRequest(
      connectors,
      `/repos/${repository}/issues/${issue.number}/comments`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          body: `Imported successfully.\n\n- Publication: \`${result.publicationId}\`\n- Pairs: ${result.total}\n- Imported: ${result.importedAt}`,
        }),
      },
    );
    await githubRequest(
      connectors,
      `/repos/${repository}/issues/${issue.number}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ state: "closed", state_reason: "completed" }),
      },
    );

    imported += 1;
    console.log(
      `Imported issue #${issue.number} with ${result.total} apartment pairs.`,
    );
  }

  console.log(`Finished: ${imported} imported, ${rejected} rejected.`);
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
