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
    problemFrame: {
      type: "object", additionalProperties: false,
      properties: {
        primaryUser: { type: "string" }, jobToBeDone: { type: "string" }, problemStatement: { type: "string" },
        desiredOutcome: { type: "string" }, constraints: stringArray, nonGoals: stringArray,
      },
      required: ["primaryUser", "jobToBeDone", "problemStatement", "desiredOutcome", "constraints", "nonGoals"],
    },
    solutionCriteria: {
      type: "object", additionalProperties: false,
      properties: { mustAddress: stringArray, shouldAvoid: stringArray, validationSignals: stringArray },
      required: ["mustAddress", "shouldAvoid", "validationSignals"],
    },
    handoffSummary: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "toolReceiptId", "featureRequest", "requestAssessment", "problemFrame", "solutionCriteria", "handoffSummary"],
};

export function validateResearcherArtifact(artifact, selectedIssue, runId, receiptId) {
  if (!artifact || typeof artifact !== "object") throw new Error("The Researcher did not return a JSON object.");
  if (artifact.runId !== runId || artifact.toolReceiptId !== receiptId || artifact.stage !== "researcher") throw new Error("The Researcher did not preserve the run, receipt and stage identifiers.");
  if (artifact.featureRequest?.issueNumber !== selectedIssue.number) throw new Error("The Researcher analysed a different feature request from the one selected by the Product Manager.");
  if (artifact.featureRequest?.sourceUrl !== selectedIssue.sourceUrl) throw new Error("The Researcher did not preserve the live GitHub source URL.");
  if (!Array.isArray(artifact.requestAssessment?.missingInformation)) throw new Error("The Researcher must return an explicit missing-information assessment.");
}
