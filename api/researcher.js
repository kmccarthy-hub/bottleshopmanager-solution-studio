import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
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

function extractModelContent(response) {
  const content = response.candidates?.[0]?.content;
  if (!content) throw new Error("Gemini did not return a Researcher tool-request turn.");
  return content;
}

export function extractMarketResearch(interaction, groundingAttempts = 1) {
  const steps = interaction.steps ?? [];
  const searchCalls = steps.filter((step) => step.type === "google_search_call");
  const textBlocks = steps
    .filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((content) => content.type === "text");
  const citations = textBlocks.flatMap((content) => content.annotations ?? []).filter((annotation) => annotation.type === "url_citation" && annotation.url);
  const uniqueCitations = [...new Map(citations.map((citation) => [citation.url, citation])).values()];
  const sources = uniqueCitations.map((citation, index) => ({ id: `market-source-${index + 1}`, title: citation.title || `Market source ${index + 1}`, url: citation.url }));
  const searchQueries = [...new Set(searchCalls.flatMap((step) => step.arguments?.queries ?? []))];
  const synthesis = interaction.output_text || textBlocks.map((content) => content.text).join("\n");
  if (interaction.status !== "completed" || !searchCalls.length || !synthesis || !sources.length) throw new Error("The Researcher did not complete a forced Google Search interaction with attributable citations.");
  return {
    receipt: {
      id: `market-research-${crypto.randomUUID()}`,
      completedAt: new Date().toISOString(),
      searchQueries,
      sourceCount: sources.length,
      groundingAttempts,
      searchCallCount: searchCalls.length,
      interactionId: interaction.id,
      sources,
    },
    synthesis,
  };
}

async function requestGroundedMarketResearch(ai, model, selectedIssue, timing) {
  let lastGroundingError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const retryInstruction = attempt === 1 ? "" : " Your previous response did not include an observable Search call and URL citations, so search before answering this final attempt.";
    const interaction = await timing.measure("grounded_market_research", attempt, (timeoutMs) => ai.interactions.create({
      model,
      input: `Search the web and research current market patterns relevant to this synthetic feature request. Prioritise official product pages or help documentation from comparable Irish and UK retail inventory, supplier-order or workforce software; use strong international examples when useful. Identify 2-4 workflow patterns, the supporting evidence, applicability to BottleShopManager and cautions. Include attributable citations for every market pattern. Do not design a final solution or make market-share claims.${retryInstruction}\n\nSELECTED LIVE REQUEST\n${JSON.stringify(selectedIssue)}\n\n${productBaselinePrompt}`,
      system_instruction: "You are the live market-evidence retrieval substage for a product Researcher. The selected GitHub request has already been fetched and is included in the input. Use the available Google Search tool once as needed, return a concise cited synthesis and avoid unsupported facts. Do not call or discuss the GitHub tool and do not design solutions.",
      tools: [{ type: "google_search", search_types: ["web_search"] }],
      generation_config: { max_output_tokens: 1600, thinking_level: "low", tool_choice: "auto" },
      store: false,
    }, { timeout: timeoutMs }));
    try {
      return extractMarketResearch(interaction, attempt);
    } catch (error) {
      lastGroundingError = error;
    }
  }
  throw lastGroundingError;
}

export default async function handler(request, response) {
  setCors(request, response);
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) return response.status(503).json({ error: "The Gemini service is not configured." });

  const selectedIssueNumber = Number(request.body?.featureRequestNumber);
  if (!Number.isInteger(selectedIssueNumber) || selectedIssueNumber < 1) return response.status(400).json({ error: "Select a valid live backlog request before starting." });
  const runId = crypto.randomUUID();
  const timing = createStageTiming("researcher", runId);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const initialUserTurn = { role: "user", parts: [{ text: `Begin BottleShopManager Solution Studio run ${runId}. The Product Manager selected live backlog issue #${selectedIssueNumber}. Call the mandatory GitHub tool for exactly that issue. Do not design solutions.` }] };
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
    const functionCall = toolRequest.functionCalls?.find((call) => call.name === backlogTool.name);
    if (!functionCall) throw new Error("The Researcher did not request the mandatory live backlog tool.");
    if (Number(functionCall.args?.issueNumber) !== selectedIssueNumber) throw new Error("The Researcher requested a different issue from the Product Manager's selection.");

    const toolResult = await fetchSelectedFeatureRequest(selectedIssueNumber, researcher.name);
    const marketResearch = await requestGroundedMarketResearch(ai, process.env.GEMINI_MODEL, toolResult.selectedIssue, timing);

    const finalModelResponse = await timing.measure("synthesise_research_brief", 1, (timeoutMs) => ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: [
        initialUserTurn,
        extractModelContent(toolRequest),
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
