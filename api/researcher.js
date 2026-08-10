import {
  FunctionCallingConfigMode,
  GoogleGenAI,
} from "@google/genai";
import { researcher } from "../agent-prompts/researcher.js";
import {
  researcherOutputSchema,
  validateResearcherArtifact,
} from "../contracts/researcher.js";

const feedbackTool = {
  name: "fetch_customer_feedback",
  description:
    "Fetches the current synthetic customer-feedback issues for EvidenceLoop from the configured public GitHub repository at the moment of use.",
  parametersJsonSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      state: {
        type: "string",
        enum: ["all"],
        description: "Fetch all feedback records so open and recently closed evidence can be assessed.",
      },
    },
    required: ["state"],
  },
};

function setCors(request, response) {
  const origin = request.headers.origin;
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  const isLocal = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");

  if (origin && (origin === allowedOrigin || isLocal)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Cache-Control", "no-store, max-age=0");
}

async function fetchCustomerFeedback() {
  const owner = process.env.FEEDBACK_REPOSITORY_OWNER;
  const repository = process.env.FEEDBACK_REPOSITORY_NAME;

  if (!owner || !repository) {
    throw new Error("The feedback repository is not configured.");
  }

  const requestedAt = new Date().toISOString();
  const endpoint = new URL(`https://api.github.com/repos/${owner}/${repository}/issues`);
  endpoint.searchParams.set("state", "all");
  endpoint.searchParams.set("sort", "updated");
  endpoint.searchParams.set("direction", "desc");
  endpoint.searchParams.set("per_page", "100");

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "EvidenceLoop-Opportunity-Lens",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const githubResponse = await fetch(endpoint, {
    headers,
    cache: "no-store",
  });

  if (!githubResponse.ok) {
    throw new Error(`GitHub returned ${githubResponse.status} while fetching live feedback.`);
  }

  const rawIssues = await githubResponse.json();
  const issues = rawIssues
    .filter((issue) => !issue.pull_request)
    .map((issue) => ({
      number: issue.number,
      title: issue.title,
      body: issue.body ?? "",
      state: issue.state,
      labels: issue.labels
        .map((label) => (typeof label === "string" ? label : label.name))
        .filter(Boolean)
        .filter((label) => !label.startsWith("theme:")),
      comments: issue.comments,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      sourceUrl: issue.html_url,
    }));

  const completedAt = new Date().toISOString();
  const receipt = {
    id: crypto.randomUUID(),
    tool: "fetch_customer_feedback",
    requestedBy: researcher.name,
    requestedAt,
    completedAt,
    source: "GitHub Issues API",
    repository: `${owner}/${repository}`,
    responseStatus: githubResponse.status,
    returnedIssueCount: issues.length,
    latestIssueUpdate: issues[0]?.updatedAt ?? null,
    cacheUsed: false,
  };

  return { receipt, issues };
}

function extractModelContent(response) {
  const content = response.candidates?.[0]?.content;
  if (!content) {
    throw new Error("Gemini did not return a model turn for the Researcher tool request.");
  }
  return content;
}

export default async function handler(request, response) {
  setCors(request, response);

  if (request.method === "OPTIONS") {
    return response.status(204).end();
  }

  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method not allowed." });
  }

  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) {
    return response.status(503).json({ error: "The Gemini service is not configured." });
  }

  const runId = crypto.randomUUID();

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const initialUserTurn = {
      role: "user",
      parts: [
        {
          text: `Begin Opportunity Lens run ${runId}. Use the live feedback tool, then identify and provisionally rank exactly three evidence-backed customer problems.`,
        },
      ],
    };

    const toolRequest = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: [initialUserTurn],
      config: {
        systemInstruction: researcher.systemPrompt,
        tools: [{ functionDeclarations: [feedbackTool] }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY,
            allowedFunctionNames: [feedbackTool.name],
          },
        },
      },
    });

    const functionCall = toolRequest.functionCalls?.find(
      (call) => call.name === feedbackTool.name,
    );

    if (!functionCall) {
      throw new Error("The Researcher did not request the mandatory live feedback tool.");
    }

    const toolResult = await fetchCustomerFeedback();

    if (toolResult.issues.length < 3) {
      throw new Error("The live source returned fewer than three usable feedback issues.");
    }

    const finalModelResponse = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: [
        initialUserTurn,
        extractModelContent(toolRequest),
        {
          role: "user",
          parts: [
            {
              functionResponse: {
                id: functionCall.id,
                name: functionCall.name,
                response: { output: toolResult },
              },
            },
          ],
        },
      ],
      config: {
        systemInstruction: researcher.systemPrompt,
        responseMimeType: "application/json",
        responseJsonSchema: researcherOutputSchema,
        tools: [{ functionDeclarations: [feedbackTool] }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.NONE,
          },
        },
      },
    });

    const artifact = JSON.parse(finalModelResponse.text);
    validateResearcherArtifact(
      artifact,
      toolResult.issues,
      runId,
      toolResult.receipt.id,
    );

    return response.status(200).json({
      runId,
      stage: "researcher",
      aiDisclosure: "AI-generated analysis - verify before use",
      toolCall: {
        id: functionCall.id ?? null,
        name: functionCall.name,
        arguments: functionCall.args ?? {},
        requestedBy: researcher.name,
      },
      toolReceipt: toolResult.receipt,
      artifact,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The Researcher stage failed.";
    return response.status(500).json({
      runId,
      stage: "researcher",
      error: message,
      aiDisclosure: "No completed AI recommendation was produced.",
    });
  }
}
