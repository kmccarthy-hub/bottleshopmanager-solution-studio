import { GoogleGenAI } from "@google/genai";
import { createHmac, timingSafeEqual } from "node:crypto";
import * as agents from "../agent-prompts/index.js";
import {
  communicatorOutputSchema,
  designerOutputSchema,
  makerOutputSchema,
  managerOutputSchema,
  prototypeSelectionOutputSchema,
  validateDownstreamArtifact,
} from "../contracts/downstream.js";
import { productBaselinePrompt } from "../domain/product-baseline.js";
import { getPrototypeBaselinePackage, prototypeDesignTokens } from "../domain/prototype-baselines.js";
import { isTransientServiceError, sendStageError } from "./_service-errors.js";
import { stageRepairGuidance, stageRepairUserMessage } from "./_stage-repair.js";
import { createStageTiming } from "./_stage-timing.js";

const definitions = {
  designer: { agent: agents.designer, schema: designerOutputSchema, required: ["researcher"] },
  prototype_selection: { agent: agents.managerPrototypeSelector, schema: prototypeSelectionOutputSchema, required: ["researcher", "designer"] },
  maker: { agent: agents.maker, schema: makerOutputSchema, required: ["researcher", "designer", "prototypeSelection"] },
  communicator: { agent: agents.communicator, schema: communicatorOutputSchema, required: ["researcher", "prototypeSelection", "maker"] },
  manager: { agent: agents.manager, schema: managerOutputSchema, required: ["researcher", "designer", "prototypeSelection", "maker", "communicator"] },
};

const predecessorByStage = { designer: "researcher", prototype_selection: "designer", maker: "prototypeSelection", communicator: "maker", manager: "communicator" };
const MAKER_MAX_ATTEMPTS = 3;
const MAKER_MIN_REPAIR_WINDOW_MS = 20_000;

function repairSignature(encodedPayload) {
  return createHmac("sha256", process.env.GEMINI_API_KEY).update(encodedPayload).digest("base64url");
}

export function createMakerRepairToken(payload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encodedPayload}.${repairSignature(encodedPayload)}`;
}

export function readMakerRepairToken(token, runId) {
  if (typeof token !== "string" || token.length > 250_000) throw new Error("The Maker repair context was invalid or too large.");
  const [encodedPayload, suppliedSignature, ...extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra.length) throw new Error("The Maker repair context was invalid.");
  const expectedSignature = repairSignature(encodedPayload);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) throw new Error("The Maker repair context could not be verified.");
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  if (payload.runId !== runId || payload.stage !== "maker" || !Number.isInteger(payload.attempt) || payload.attempt < 1 || payload.attempt >= MAKER_MAX_ATTEMPTS || !Number.isFinite(payload.deadlineAt) || !payload.failedArtifact || typeof payload.validationError !== "string") throw new Error("The Maker repair context did not match this run.");
  return payload;
}

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

    const { runId, artifacts, repairToken } = request.body ?? {};
    if (!runId || !artifacts || definition.required.some((key) => !artifacts[key])) {
      return response.status(400).json({ error: `The ${stage} stage is missing a required upstream artefact.` });
    }

    let makerRepair;
    try {
      makerRepair = stage === "maker" && repairToken ? readMakerRepairToken(repairToken, runId) : null;
    } catch (error) {
      return response.status(400).json({ runId, stage, retryable: false, error: error instanceof Error ? error.message : "The Maker repair context was invalid." });
    }
    const makerAttempt = makerRepair ? makerRepair.attempt + 1 : 1;
    const makerDeadlineAt = makerRepair?.deadlineAt ?? Date.now() + 210_000;
    const remainingMakerBudgetMs = makerDeadlineAt - Date.now();
    if (stage === "maker" && remainingMakerBudgetMs < MAKER_MIN_REPAIR_WINDOW_MS) return response.status(503).json({ runId, stage, retryable: false, error: "Maker did not have enough controlled processing time remaining for another safe repair attempt.", diagnosticCode: "AI_STAGE_DEADLINE" });
    const timing = createStageTiming(stage, runId, stage === "maker" ? { deadlineMs: remainingMakerBudgetMs } : undefined);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const predecessor = predecessorByStage[stage];
      const predecessorArtifactId = artifacts[predecessor]?.artifactId;
      const makerBaselinePackage = stage === "maker" ? `\n\nIMMUTABLE CURRENT-PAGE SOURCE PACKAGE FOR THE MANAGER-SELECTED SPECIFICATION\n${JSON.stringify(getPrototypeBaselinePackage(artifacts.designer?.concepts))}\n\nVISUAL TOKENS\n${prototypeDesignTokens}` : "";
      let repairInstruction = makerRepair ? `\n\nREPAIR THE PREVIOUS MAKER DRAFT — ATTEMPT ${makerAttempt} OF ${MAKER_MAX_ATTEMPTS}\nThe previous draft failed server validation: ${makerRepair.validationError}\n${stageRepairGuidance(stage, new Error(makerRepair.validationError))}\nPreserve every field and implementation detail that does not need to change. Correct only the reported failure and any selectors that must remain consistent with that correction. Return the complete corrected artifact.\n\nPREVIOUS INVALID MAKER DRAFT\n${JSON.stringify(makerRepair.failedArtifact)}` : "";
      let lastError;
      const attemptsInThisRequest = stage === "maker" ? 1 : 2;
      for (let attempt = 1; attempt <= attemptsInThisRequest; attempt += 1) {
        const reportedAttempt = stage === "maker" ? makerAttempt : attempt;
        try {
          const result = await timing.measure("generate_validated_artifact", reportedAttempt, (timeoutMs) => ai.models.generateContent({
            model: process.env.GEMINI_MODEL,
            contents: [{
              role: "user",
              parts: [{ text: `Continue BottleShopManager Solution Studio run ${runId}. Your immediate predecessor is ${predecessor}; its validated artifact ID is ${predecessorArtifactId}. Treat that explicit handoff as your primary working input and acknowledge it in receivedHandoff. Earlier artifacts are supplied for evidence audit and must not be ignored. Perform only the ${stage} responsibilities, preserve unresolved information gaps and create the required next handoff. Use the current-product baseline to locate proposed changes, but never treat it as customer evidence.${repairInstruction}\n\n${productBaselinePrompt}${makerBaselinePackage}\n\nCUMULATIVE VALIDATED ARTIFACTS\n${JSON.stringify(artifacts)}` }],
            }],
            config: {
              systemInstruction: definition.agent.systemPrompt,
              responseMimeType: "application/json",
              responseJsonSchema: definition.schema,
              httpOptions: { timeout: timeoutMs },
            },
          }));
          const artifact = JSON.parse(result.text);
          try {
            validateDownstreamArtifact(stage, artifact, runId, artifacts);
          } catch (validationError) {
            const artifactError = new Error(`Artifact validation failed: ${validationError instanceof Error ? validationError.message : "invalid structured output"}`);
            console.warn(JSON.stringify({ event: "agent_artifact_validation_failed", stage, runId, attempt: reportedAttempt, error: artifactError.message }));
            if (stage === "maker" && reportedAttempt < MAKER_MAX_ATTEMPTS && makerDeadlineAt - Date.now() >= MAKER_MIN_REPAIR_WINDOW_MS) {
              const repairReason = stageRepairUserMessage(stage, artifactError);
              const nextRepairToken = createMakerRepairToken({ runId, stage, attempt: reportedAttempt, deadlineAt: makerDeadlineAt, failedArtifact: artifact, validationError: artifactError.message });
              return response.status(422).json({ runId, stage, repairable: true, attempt: reportedAttempt, nextAttempt: reportedAttempt + 1, maxAttempts: MAKER_MAX_ATTEMPTS, repairReason, repairToken: nextRepairToken, timingDiagnostics: timing.finish("repair_required"), aiDisclosure: "The AI-generated draft was not rendered because it did not pass validation." });
            }
            throw artifactError;
          }
          return response.status(200).json({ runId, stage, validationAttempts: reportedAttempt, timingDiagnostics: timing.finish("complete"), aiDisclosure: "AI-generated analysis - verify before use", artifact });
        } catch (error) {
          if (isTransientServiceError(error)) throw error;
          lastError = error;
          if (attempt === 1 && stage !== "maker") {
            repairInstruction = `\n\nYour previous draft failed server validation: ${error instanceof Error ? error.message : "invalid output"}. Correct that specific failure without changing the supplied evidence or inventing replacement facts.${stageRepairGuidance(stage, error)}`;
          }
        }
      }
      throw lastError;
    } catch (error) {
      return sendStageError(response, stage, runId, error, timing.finish("error"));
    }
  };
}
