import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";
import { researcher } from "../agent-prompts/researcher.js";
import { researcherOutputSchema, validateResearcherArtifact } from "../contracts/researcher.js";
import { productBaselinePrompt } from "../domain/product-baseline.js";
import { fetchSelectedFeatureRequest, setCors } from "./_github-backlog.js";
import { sendStageError } from "./_service-errors.js";

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

function extractMarketResearch(response) {
  const metadata = response.candidates?.[0]?.groundingMetadata;
  const sources = (metadata?.groundingChunks ?? [])
    .filter((chunk) => chunk.web?.uri)
    .map((chunk, index) => ({ id: `market-source-${index + 1}`, title: chunk.web.title || `Market source ${index + 1}`, url: chunk.web.uri }));
  if (!response.text || !sources.length) throw new Error("The Researcher did not return grounded market evidence with attributable sources.");
  return {
    receipt: {
      id: `market-research-${crypto.randomUUID()}`,
      completedAt: new Date().toISOString(),
      searchQueries: metadata?.webSearchQueries ?? [],
      sourceCount: sources.length,
      sources,
    },
    synthesis: response.text,
  };
}

export default async function handler(request, response) {
  setCors(request, response);
  if (request.method === "OPTIONS") return response.status(204).end();
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
  if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) return response.status(503).json({ error: "The Gemini service is not configured." });

  const selectedIssueNumber = Number(request.body?.featureRequestNumber);
  if (!Number.isInteger(selectedIssueNumber) || selectedIssueNumber < 1) return response.status(400).json({ error: "Select a valid live backlog request before starting." });
  const runId = crypto.randomUUID();

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const initialUserTurn = { role: "user", parts: [{ text: `Begin BottleShopManager Solution Studio run ${runId}. The Product Manager selected live backlog issue #${selectedIssueNumber}. Call the mandatory GitHub tool for exactly that issue. Do not design solutions.` }] };
    const toolRequest = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: [initialUserTurn],
      config: {
        systemInstruction: researcher.systemPrompt,
        tools: [{ functionDeclarations: [backlogTool] }],
        toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.ANY, allowedFunctionNames: [backlogTool.name] } },
      },
    });
    const functionCall = toolRequest.functionCalls?.find((call) => call.name === backlogTool.name);
    if (!functionCall) throw new Error("The Researcher did not request the mandatory live backlog tool.");
    if (Number(functionCall.args?.issueNumber) !== selectedIssueNumber) throw new Error("The Researcher requested a different issue from the Product Manager's selection.");

    const toolResult = await fetchSelectedFeatureRequest(selectedIssueNumber, researcher.name);
    const marketResponse = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL,
      contents: [{ role: "user", parts: [{ text: `Research current market patterns relevant to this synthetic feature request. Use Google Search. Prioritise official product pages or help documentation from comparable Irish and UK retail inventory, supplier-order or workforce software; use strong international examples when useful. Identify 2-4 workflow patterns, evidence, applicability to BottleShopManager and cautions. Do not design a final solution or make market-share claims.\n\nSELECTED LIVE REQUEST\n${JSON.stringify(toolResult.selectedIssue)}\n\n${productBaselinePrompt}` }] }],
      config: { systemInstruction: researcher.systemPrompt, tools: [{ googleSearch: {} }] },
    });
    const marketResearch = extractMarketResearch(marketResponse);

    const finalModelResponse = await ai.models.generateContent({
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
      },
    });
    const artifact = JSON.parse(finalModelResponse.text);
    validateResearcherArtifact(artifact, toolResult.selectedIssue, runId, toolResult.receipt.id, marketResearch.receipt.id);
    return response.status(200).json({
      runId, stage: "researcher", aiDisclosure: "AI-generated analysis - verify before use",
      toolCall: { id: functionCall.id ?? null, name: functionCall.name, arguments: functionCall.args ?? {}, requestedBy: researcher.name },
      toolReceipt: toolResult.receipt, marketResearchReceipt: marketResearch.receipt, artifact,
    });
  } catch (error) {
    return sendStageError(response, "researcher", runId, error);
  }
}
