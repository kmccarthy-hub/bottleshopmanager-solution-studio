function repositoryConfig() {
  const owner = process.env.BACKLOG_REPOSITORY_OWNER;
  const repository = process.env.BACKLOG_REPOSITORY_NAME;
  if (!owner || !repository) throw new Error("The BottleShopManager backlog repository is not configured.");
  return { owner, repository };
}

function githubHeaders() {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "BottleShopManager-Solution-Studio", "X-GitHub-Api-Version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function githubJson(url) {
  const response = await fetch(url, { headers: githubHeaders(), cache: "no-store" });
  if (!response.ok) throw new Error(`GitHub returned ${response.status} while retrieving the live backlog.`);
  return { response, data: await response.json() };
}

function normaliseIssue(issue) {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body ?? "",
    state: issue.state,
    labels: issue.labels.map((label) => typeof label === "string" ? label : label.name).filter(Boolean),
    commentsCount: issue.comments,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    sourceUrl: issue.html_url,
  };
}

export function sortIssuesByNumber(issues) {
  return [...issues].sort((first, second) => first.number - second.number);
}

export async function fetchBacklogIndex() {
  const { owner, repository } = repositoryConfig();
  const url = new URL(`https://api.github.com/repos/${owner}/${repository}/issues`);
  url.searchParams.set("state", "all");
  url.searchParams.set("sort", "created");
  url.searchParams.set("direction", "asc");
  url.searchParams.set("per_page", "100");
  const { response, data } = await githubJson(url);
  const issues = sortIssuesByNumber(data.filter((issue) => !issue.pull_request).map(normaliseIssue));
  return { owner, repository, responseStatus: response.status, issues };
}

export async function fetchSelectedFeatureRequest(issueNumber, requestedBy) {
  const requestedAt = new Date().toISOString();
  const { owner, repository } = repositoryConfig();
  const issueUrl = `https://api.github.com/repos/${owner}/${repository}/issues/${issueNumber}`;
  const commentsUrl = `${issueUrl}/comments?per_page=100`;
  const [issueResult, commentsResult, backlog] = await Promise.all([
    githubJson(issueUrl), githubJson(commentsUrl), fetchBacklogIndex(),
  ]);
  const selectedIssue = normaliseIssue(issueResult.data);
  selectedIssue.comments = commentsResult.data.map((comment) => ({ body: comment.body ?? "", createdAt: comment.created_at, updatedAt: comment.updated_at, sourceUrl: comment.html_url }));
  const completedAt = new Date().toISOString();
  return {
    receipt: {
      id: crypto.randomUUID(), tool: "fetch_selected_feature_request", requestedBy, requestedAt, completedAt,
      source: "GitHub Issues API", repository: `${owner}/${repository}`, selectedIssueNumber: issueNumber,
      responseStatus: issueResult.response.status, returnedCommentCount: selectedIssue.comments.length,
      backlogIssueCount: backlog.issues.length, issueUpdatedAt: selectedIssue.updatedAt, cacheUsed: false,
    },
    selectedIssue,
    backlogContext: backlog.issues.map((issue) => ({ number: issue.number, title: issue.title, state: issue.state, labels: issue.labels, updatedAt: issue.updatedAt, sourceUrl: issue.sourceUrl })),
  };
}

export function setCors(request, response) {
  const origin = request.headers.origin;
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const isLocal = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
  if (origin && (origin === allowedOrigin || isLocal)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Cache-Control", "no-store, max-age=0");
}
