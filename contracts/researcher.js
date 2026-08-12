const stringArray = { type: "array", items: { type: "string" } };

const gapSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    category: { type: "string", enum: ["user", "problem", "workflow", "frequency", "evidence", "constraint", "success", "permission", "exception", "other"] },
    missingInformation: { type: "string" },
    whyItMatters: { type: "string" },
    questionForProductManager: { type: "string" },
  },
  required: ["category", "missingInformation", "whyItMatters", "questionForProductManager"],
};

export const researcherOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    runId: { type: "string" },
    artifactId: { type: "string" },
    stage: { type: "string", enum: ["researcher"] },
    aiDisclosure: { type: "string" },
    toolReceiptId: { type: "string" },
    marketResearchReceiptId: { type: "string" },
    featureRequest: {
      type: "object", additionalProperties: false,
      properties: {
        issueNumber: { type: "integer" }, title: { type: "string" }, sourceUrl: { type: "string" },
        currentState: { type: "string" }, summary: { type: "string" },
      },
      required: ["issueNumber", "title", "sourceUrl", "currentState", "summary"],
    },
    requestAssessment: {
      type: "object", additionalProperties: false,
      properties: {
        completeness: { type: "string", enum: ["low", "medium", "high"] },
        confidenceRationale: { type: "string" },
        knownFacts: stringArray,
        evidenceReferences: stringArray,
        missingInformation: { type: "array", items: gapSchema },
        contradictions: stringArray,
        provisionalAssumptions: stringArray,
      },
      required: ["completeness", "confidenceRationale", "knownFacts", "evidenceReferences", "missingInformation", "contradictions", "provisionalAssumptions"],
    },
    currentProductAnalysis: {
      type: "object", additionalProperties: false,
      properties: {
        relevantSurfaces: {
          type: "array", minItems: 1, items: {
            type: "object", additionalProperties: false,
            properties: { surface: { type: "string" }, currentWorkflow: { type: "string" }, relevance: { type: "string" }, currentLimitation: { type: "string" } },
            required: ["surface", "currentWorkflow", "relevance", "currentLimitation"],
          },
        },
        crossModuleDependencies: stringArray,
        currentStateSummary: { type: "string" },
      },
      required: ["relevantSurfaces", "crossModuleDependencies", "currentStateSummary"],
    },
    marketResearch: {
      type: "object", additionalProperties: false,
      properties: {
        scope: { type: "string" },
        searchQueries: stringArray,
        sources: {
          type: "array", minItems: 1, items: {
            type: "object", additionalProperties: false,
            properties: { id: { type: "string" }, title: { type: "string" }, url: { type: "string" }, market: { type: "string" }, relevance: { type: "string" } },
            required: ["id", "title", "url", "market", "relevance"],
          },
        },
        findings: {
          type: "array", minItems: 2, items: {
            type: "object", additionalProperties: false,
            properties: { id: { type: "string" }, pattern: { type: "string" }, evidence: { type: "string" }, sourceIds: stringArray, applicability: { type: "string" }, caution: { type: "string" } },
            required: ["id", "pattern", "evidence", "sourceIds", "applicability", "caution"],
          },
        },
        researchLimitations: stringArray,
      },
      required: ["scope", "searchQueries", "sources", "findings", "researchLimitations"],
    },
    problemFrame: {
      type: "object", additionalProperties: false,
      properties: {
        primaryUser: { type: "string" }, jobToBeDone: { type: "string" }, problemStatement: { type: "string" },
        desiredOutcome: { type: "string" }, constraints: stringArray, nonGoals: stringArray,
      },
      required: ["primaryUser", "jobToBeDone", "problemStatement", "desiredOutcome", "constraints", "nonGoals"],
    },
    opportunityAnalysis: {
      type: "object", additionalProperties: false,
      properties: { problemsWorthSolving: stringArray, researchBackedPossibilities: stringArray, designPrinciples: stringArray },
      required: ["problemsWorthSolving", "researchBackedPossibilities", "designPrinciples"],
    },
    solutionCriteria: {
      type: "object", additionalProperties: false,
      properties: { mustAddress: stringArray, shouldAvoid: stringArray, validationSignals: stringArray },
      required: ["mustAddress", "shouldAvoid", "validationSignals"],
    },
    designerHandoff: {
      type: "object", additionalProperties: false,
      properties: { to: { type: "string", enum: ["designer"] }, artifactId: { type: "string" }, summary: { type: "string" }, requiredInputs: stringArray, unresolvedQuestions: stringArray },
      required: ["to", "artifactId", "summary", "requiredInputs", "unresolvedQuestions"],
    },
    handoffSummary: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "toolReceiptId", "marketResearchReceiptId", "featureRequest", "requestAssessment", "currentProductAnalysis", "marketResearch", "problemFrame", "opportunityAnalysis", "solutionCriteria", "designerHandoff", "handoffSummary"],
};

export function validateResearcherArtifact(artifact, selectedIssue, runId, receiptId, marketReceiptId) {
  if (!artifact || typeof artifact !== "object") throw new Error("The Researcher did not return a JSON object.");
  if (artifact.runId !== runId || artifact.toolReceiptId !== receiptId || artifact.marketResearchReceiptId !== marketReceiptId || artifact.stage !== "researcher") throw new Error("The Researcher did not preserve the run, GitHub receipt, market-research receipt and stage identifiers.");
  if (artifact.featureRequest?.issueNumber !== selectedIssue.number) throw new Error("The Researcher analysed a different feature request from the one selected by the Product Manager.");
  if (artifact.featureRequest?.sourceUrl !== selectedIssue.sourceUrl) throw new Error("The Researcher did not preserve the live GitHub source URL.");
  if (!Array.isArray(artifact.requestAssessment?.missingInformation)) throw new Error("The Researcher must return an explicit missing-information assessment.");
  if (!artifact.marketResearch?.sources?.length || !artifact.marketResearch?.findings?.length) throw new Error("The Researcher must use the live market-research evidence supplied to it.");
  if (artifact.designerHandoff?.artifactId !== artifact.artifactId) throw new Error("The Researcher handoff must reference its own validated artifact ID.");
}
