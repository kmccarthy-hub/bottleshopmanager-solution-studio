import { fetchBacklogIndex, setCors } from "./_github-backlog.js";

export default async function handler(request, response) {
  setCors(request, response);
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "GET") return response.status(405).json({ error: "Method not allowed." });
  try {
    const backlog = await fetchBacklogIndex();
    return response.status(200).json({
      source: "GitHub Issues API", repository: `${backlog.owner}/${backlog.repository}`,
      issueCount: backlog.issues.length,
      issues: backlog.issues.map((issue) => ({ number: issue.number, title: issue.title, state: issue.state, labels: issue.labels, updatedAt: issue.updatedAt, sourceUrl: issue.sourceUrl, body: issue.body })),
    });
  } catch (error) {
    return response.status(500).json({ error: error instanceof Error ? error.message : "The live backlog could not be loaded." });
  }
}
