import { GoogleGenAI } from "@google/genai";
import * as agents from "../agent-prompts/index.js";
import {
  communicatorOutputSchema,
  designerOutputSchema,
  makerOutputSchema,
  managerOutputSchema,
  validateDownstreamArtifact,
} from "../contracts/downstream.js";
import { productBaselinePrompt } from "../domain/product-baseline.js";

const definitions = {
  designer: { agent: agents.designer, schema: designerOutputSchema, required: ["researcher"] },
  maker: { agent: agents.maker, schema: makerOutputSchema, required: ["researcher", "designer"] },
  communicator: { agent: agents.communicator, schema: communicatorOutputSchema, required: ["researcher", "designer", "maker"] },
  manager: { agent: agents.manager, schema: managerOutputSchema, required: ["researcher", "designer", "maker", "communicator"] },
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

export function createAgentHandler(stage) {
  const definition = definitions[stage];
  return async function handler(request, response) {
    setCors(request, response);
    if (request.method === "OPTIONS") return response.status(204).end();
    if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed." });
    if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) return response.status(503).json({ error: "The Gemini service is not configured." });

    const { runId, artifacts } = request.body ?? {};
    if (!runId || !artifacts || definition.required.some((key) => !artifacts[key])) {
      return response.status(400).json({ error: `The ${stage} stage is missing a required upstream artefact.` });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let repairInstruction = "";
      let lastError;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const result = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL,
            contents: [{
              role: "user",
              parts: [{ text: `Continue BottleShopManager Solution Studio run ${runId}. Review every supplied upstream artefact, perform only the ${stage} responsibilities, preserve all information gaps and return the required handoff. Use the supplied current-product baseline to locate proposed changes, but never treat the baseline as customer evidence.${repairInstruction}\n\n${productBaselinePrompt}\n\nUPSTREAM ARTEFACTS\n${JSON.stringify(artifacts)}` }],
            }],
            config: {
              systemInstruction: definition.agent.systemPrompt,
              responseMimeType: "application/json",
              responseJsonSchema: definition.schema,
            },
          });
          const artifact = JSON.parse(result.text);
          validateDownstreamArtifact(stage, artifact, runId, artifacts);
          return response.status(200).json({ runId, stage, validationAttempts: attempt, aiDisclosure: "AI-generated analysis - verify before use", artifact });
        } catch (error) {
          lastError = error;
          if (attempt === 1) {
            repairInstruction = `\n\nYour previous draft failed server validation: ${error instanceof Error ? error.message : "invalid output"}. Correct that specific failure without changing the supplied evidence or inventing replacement facts.`;
          }
        }
      }
      throw lastError;
    } catch (error) {
      return response.status(500).json({ runId, stage, error: error instanceof Error ? error.message : `The ${stage} stage failed.`, aiDisclosure: "No completed AI recommendation was produced." });
    }
  };
}
