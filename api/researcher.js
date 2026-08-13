import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
import { createHmac, timingSafeEqual } from "node:crypto";
import { researcher } from "../agent-prompts/researcher.js";
import { researcherOutputSchema, validateResearcherArtifact } from "../contracts/researcher.js";
import { productBaselinePrompt } from "../domain/product-baseline.js";
import { fetchSelectedFeatureRequest, setCors } from "./_github-backlog.js";
import { sendStageError } from "./_service-errors.js";
import { createStageTiming } from "./_stage-timing.js";

const backlogTool = {
  name: "fetch_selected_feature_request",
  description: "Retrieves the Product Manager's selected BottleShopManager backlog issue, its current comments and the current backlog index directly from GitHub at the moment of use.",
  parametersJsonSchema: {
    type: "object", additionalProperties: false,
    properties: { issueNumber: { type: "integer", description: "The exact GitHub issue number selected by the Product Manager." } },
    required: ["issueNumber"],
  },
};
const RESEARCH_MAX_ATTEMPTS = 3;
const RESEARCH_MIN_RETRY_WINDOW_MS = 35_000;
const RESEARCH_DEADLINE_MS = 210_000;

function researchRepairSignature(encodedPayload) {
  return createHmac("sha256", process.env.GEMINI_API_KEY).update(encodedPayload).digest("base64url");
}

export function createResearchRepairToken(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${researchRepairSignature(encodedPayload)}`;
}

export function readResearchRepairToken(token) {
  if (typeof token !== "string" || token.length > 300_000) throw new Error("The Researcher retry context was invalid or too large.");
  const [encodedPayload, suppliedSignature, ...extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra.length) throw new Error("The Researcher retry context was invalid.");
  const expectedSignature = researchRepairSignature(encodedPayload);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) throw new Error("The Researcher retry context could not be verified.");
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (payload.stage !== "researcher" || !payload.runId || !Number.isInteger(payload.attempt) || payload.attempt < 1 || payload.attempt >= RESEARCH_MAX_ATTEMPTS || !Number.isFinite(payload.deadlineAt) || !payload.toolResult || !payload.toolRequestContent || !payload.functionCall) throw new Error("The Researcher retry context was incomplete.");
  return payload;
}

function extractModelContent(response) {
  const content = response.candidates?.[0]?.content;
  if (!content) throw new Error("Gemini did not return a Researcher tool-request turn.");
  return content;
}

function resultItems(step) {
  if (Array.isArray(step.result)) return step.result;
  if (step.result && typeof step.result === "object") return [step.result];
  return [];
}

function evidenceFailure(diagnostics) {
  if (diagnostics.status !== "completed") return { reason: "The market-research interaction did not complete.", instruction: "Complete the interaction after using Google Search once." };
  if (!diagnostics.searchCallCount) return { reason: "No Google Search call was observed. Researcher is retrying with an explicit search requirement.", instruction: "No Google Search call was observed. You must invoke the available Google Search tool once before writing the synthesis." };
  if (!diagnostics.synthesisPresent) return { reason: "Google Search ran, but no usable market synthesis was returned.", instruction: "Google Search ran, but no synthesis was returned. Write a concise 2-4 pattern synthesis grounded only in the retrieved results." };
  return { reason: "Google Search ran, but the response contained no attributable source links.", instruction: "Google Search ran, but no attributable URLs were returned. Search official product or help pages and cite the source URLs in the response." };
}

export function extractMarketResearch(interaction, groundingAttempts = 1) {
  const steps = interaction.steps ?? [];
  const searchCalls = steps.filter((step) => step.type === "google_search_call");
  const searchResults = steps.filter((step) => step.type === "google_search_result");
  const textBlocks = steps
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((content) => content.type === "text");
  const citations = textBlocks.flatMap((content) => content.annotations ?? []).filter((annotation) => annotation.type === "url_citation" && annotation.url);
  const uniqueCitations = [...new Map(citations.map((citation) => [citation.url, citation])).values()];
  const resultSources = searchResults.flatMap(resultItems).filter((item) => item?.url).map((item) => ({ title: item.title, url: item.url }));
  const attributableSources = uniqueCitations.length ? uniqueCitations : [...new Map(resultSources.map((source) => [source.url, source])).values()];
  const sources = attributableSources.map((source, index) => ({ id: `market-source-${index + 1}`, title: source.title || `Market source ${index + 1}`, url: source.url }));
  const searchQueries = [...new Set(searchCalls.flatMap((step) => {
    const queries = step.arguments?.queries;
    if (Array.isArray(queries)) return queries;
    return step.arguments?.query ? [step.arguments.query] : [];
  }))];
  const synthesis = (interaction.output_text || textBlocks.map((content) => content.text).join("\n")).trim();
  const diagnostics = {
    status: interaction.status ?? "unknown",
    stepTypes: [...new Set(steps.map((step) => step.type))],
    searchCallCount: searchCalls.length,
    searchResultCount: searchResults.length,
    textBlockCount: textBlocks.length,
    citationCount: uniqueCitations.length,
    attributableResultUrlCount: resultSources.length,
    synthesisPresent: Boolean(synthesis),
  };
  if (diagnostics.status !== "completed" || !diagnostics.searchCallCount || !diagnostics.synthesisPresent || !sources.length) {
    const failure = evidenceFailure(diagnostics);
    const error = new Error(failure.reason);
    error.code = "RESEARCH_EVIDENCE_INCOMPLETE";
    error.diagnostics = diagnostics;
    error.retryInstruction = failure.instruction;
    error.userMessage = failure.reason;
    throw error;
  }
  return {
    receipt: {
      id: `market-research-${crypto.randomUUID()}`,
      completedAt: new Date().toISOString(),
      searchQueries,
      sourceCount: sources.length,
      groundingAttempts,
      searchCallCount: searchCalls.length,
      searchResultCount: searchResults.length,
      citationCount: uniqueCitations.length,
      attributionMode: uniqueCitations.length ? "inline_citations" : "search_result_urls",
      interactionId: interaction.id,
      sources,
    },
    synthesis,
  };
}

async function requestGroundedMarketResearch(ai, model, selectedIssue, timing, attempt, retryInstruction = "") {
    const interaction = await timing.measure("grounded_market_research", attempt, (timeoutMs) => ai.interactions.create({
      model,
      input: `Search the web and research current market patterns relevant to this synthetic feature request. Make one observable Google Search call before answering. Prioritise official product pages or help documentation from comparable Irish and UK retail inventory, supplier-order or workforce software; use strong international examples when useful. Identify 2-4 workflow patterns, the supporting evidence, applicability to BottleShopManager and cautions. Include attributable source URLs for every market pattern. Do not design a final solution or make market-share claims.${retryInstruction ? ` RETRY REQUIREMENT: ${retryInstruction}` : ""}\n\nSELECTED LIVE REQUEST\n${JSON.stringify(selectedIssue)}\n\n${productBaselinePrompt}`,
      system_instruction: "You are the live market-evidence retrieval substage for a product Researcher. The selected GitHub request has already been fetched and is included in the input. Use the available Google Search tool once as needed, return a concise cited synthesis and avoid unsupported facts. Do not call or discuss the GitHub tool and do not design solutions.",
      tools: [{ type: "google_search", search_types: ["web_search"] }],
      generation_config: { max_output_tokens: 1600, thinking_level: "low", tool_choice: "auto" },
      store: false,
    }, { timeout: timeoutMs }));
    return extractMarketResearch(interaction, attempt);
}

export default async function handler(request, response) {
  setCors(request, response);
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) return response.status(503).json({ error: "The Gemini service is not configured." });

  let researchRepair;
  try {
    researchRepair = request.body?.repairToken ? readResearchRepairToken(request.body.repairToken) : null;
  } catch (error) {
    return response.status(400).json({ stage: "researcher", retryable: false, error: error instanceof Error ? error.message : "The Researcher retry context was invalid." });
  }
  const selectedIssueNumber = Number(researchRepair?.selectedIssueNumber ?? request.body?.featureRequestNumber);
  if (!Number.isInteger(selectedIssueNumber) || selectedIssueNumber < 1) return response.status(400).json({ error: "Select a valid live backlog request before starting." });
  const runId = researchRepair?.runId ?? crypto.randomUUID();
  const researchAttempt = researchRepair ? researchRepair.attempt + 1 : 1;
  const deadlineAt = researchRepair?.deadlineAt ?? Date.now() + RESEARCH_DEADLINE_MS;
  const remainingBudgetMs = deadlineAt - Date.now();
  if (remainingBudgetMs < RESEARCH_MIN_RETRY_WINDOW_MS) return response.status(503).json({ runId, stage: "researcher", retryable: false, error: "Researcher did not have enough controlled processing time remaining for another market-evidence attempt.", diagnosticCode: "AI_STAGE_DEADLINE" });
  const timing = createStageTiming("researcher", runId, { deadlineMs: remainingBudgetMs });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const initialUserTurn = researchRepair?.initialUserTurn ?? { role: "user", parts: [{ text: `Begin BottleShopManager Solution Studio run ${runId}. The Product Manager selected live backlog issue #${selectedIssueNumber}. Call the mandatory GitHub tool for exactly that issue. Do not design solutions.` }] };
    let functionCall = researchRepair?.functionCall;
    let toolRequestContent = researchRepair?.toolRequestContent;
    let toolResult = researchRepair?.toolResult;
    if (!researchRepair) {
      const toolRequest = await timing.measure("request_live_backlog_tool", 1, (timeoutMs) => ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: [initialUserTurn],
      config: {
        systemInstruction: researcher.systemPrompt,
        tools: [{ functionDeclarations: [backlogTool] }],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.ANY, allowedFunctionNames: [backlogTool.name] } },
        httpOptions: { timeout: timeoutMs },
      },
      }));
      functionCall = toolRequest.functionCalls?.find((call) => call.name === backlogTool.name);
      if (!functionCall) throw new Error("The Researcher did not request the mandatory live backlog tool.");
      if (Number(functionCall.args?.issueNumber) !== selectedIssueNumber) throw new Error("The Researcher requested a different issue from the Product Manager's selection.");
      toolRequestContent = extractModelContent(toolRequest);
      toolResult = await fetchSelectedFeatureRequest(selectedIssueNumber, researcher.name);
    }
    let marketResearch;
    try {
      marketResearch = await requestGroundedMarketResearch(ai, process.env.GEMINI_MODEL, toolResult.selectedIssue, timing, researchAttempt, researchRepair?.retryInstruction);
    } catch (error) {
      if (error?.code === "RESEARCH_EVIDENCE_INCOMPLETE") {
        console.warn(JSON.stringify({ event: "researcher_market_evidence_incomplete", stage: "researcher", runId, attempt: researchAttempt, diagnostics: error.diagnostics }));
        if (researchAttempt < RESEARCH_MAX_ATTEMPTS && deadlineAt - Date.now() >= RESEARCH_MIN_RETRY_WINDOW_MS) {
          const repairToken = createResearchRepairToken({ runId, stage: "researcher", attempt: researchAttempt, deadlineAt, selectedIssueNumber, initialUserTurn, functionCall, toolRequestContent, toolResult, retryInstruction: error.retryInstruction });
          return response.status(422).json({ runId, stage: "researcher", repairable: true, attempt: researchAttempt, nextAttempt: researchAttempt + 1, maxAttempts: RESEARCH_MAX_ATTEMPTS, repairActivity: "retrying market evidence", repairReason: error.userMessage, repairToken, evidenceDiagnostics: error.diagnostics, timingDiagnostics: timing.finish("repair_required"), aiDisclosure: "No market brief was accepted because attributable evidence was incomplete." });
        }
      }
      throw error;
    }

    const finalModelResponse = await timing.measure("synthesise_research_brief", 1, (timeoutMs) => ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: [
        initialUserTurn,
        toolRequestContent,
        { role: "user", parts: [
          { functionResponse: { id: functionCall.id, name: functionCall.name, response: { output: toolResult } } },
          { text: `${productBaselinePrompt}\n\nLIVE GROUNDED MARKET-RESEARCH PACKAGE\nReceipt and exact source IDs: ${JSON.stringify(marketResearch.receipt)}\nGrounded synthesis: ${marketResearch.synthesis}\n\nUse only these supplied query strings, source IDs, titles and URLs in marketResearch. Complete the Researcher artifact and explicit Designer handoff now.` },
        ] },
      ],
      config: {
        systemInstruction: researcher.systemPrompt,
        responseMimeType: "application/json",
        responseJsonSchema: researcherOutputSchema,
        tools: [{ functionDeclarations: [backlogTool] }],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.NONE } },
        httpOptions: { timeout: timeoutMs },
      },
    }));
    const artifact = JSON.parse(finalModelResponse.text);
    validateResearcherArtifact(artifact, toolResult.selectedIssue, runId, toolResult.receipt.id, marketResearch.receipt.id);
    return response.status(200).json({
      runId, stage: "researcher", aiDisclosure: "AI-generated analysis - verify before use",
      toolCall: { id: functionCall.id ?? null, name: functionCall.name, arguments: functionCall.args ?? {}, requestedBy: researcher.name },
      toolReceipt: toolResult.receipt, marketResearchReceipt: marketResearch.receipt, timingDiagnostics: timing.finish("complete"), artifact,
    });
  } catch (error) {
    return sendStageError(response, "researcher", runId, error, timing.finish("error"));
  }
}
