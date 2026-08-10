const stringArray = { type: "array", items: { type: "string" } };

const baseProperties = (stage) => ({
  runId: { type: "string" },
  artifactId: { type: "string" },
  stage: { type: "string", enum: [stage] },
  aiDisclosure: { type: "string" },
});

export const designerOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...baseProperties("designer"),
    selectedOpportunityId: { type: "string" },
    selectionDecision: { type: "string", enum: ["accept", "challenge"] },
    problemStatement: { type: "string" },
    desiredOutcome: { type: "string" },
    evidenceIssueNumbers: { type: "array", items: { type: "integer" } },
    alternatives: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          id: { type: "string" }, name: { type: "string" }, concept: { type: "string" },
          size: { type: "string", enum: ["small", "medium", "large"] },
          userValue: { type: "string" }, evidenceFit: { type: "string" },
          complexity: { type: "string" }, trustConsiderations: { type: "string" },
        },
        required: ["id", "name", "concept", "size", "userValue", "evidenceFit", "complexity", "trustConsiderations"],
      },
    },
    selectedConceptId: { type: "string" },
    selectionRationale: { type: "string" },
    designPrinciples: stringArray,
    scopeBoundaries: stringArray,
    userJourney: { type: "array", minItems: 3, items: { type: "string" } },
    screens: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        properties: { id: { type: "string" }, name: { type: "string" }, purpose: { type: "string" } },
        required: ["id", "name", "purpose"],
      },
    },
    stateExpectations: stringArray,
    assumptions: stringArray,
    acceptanceCriteria: stringArray,
    handoffSummary: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "selectedOpportunityId", "selectionDecision", "problemStatement", "desiredOutcome", "evidenceIssueNumbers", "alternatives", "selectedConceptId", "selectionRationale", "designPrinciples", "scopeBoundaries", "userJourney", "screens", "stateExpectations", "assumptions", "acceptanceCriteria", "handoffSummary"],
};

export const makerOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...baseProperties("maker"),
    selectedOpportunityId: { type: "string" },
    selectedConceptId: { type: "string" },
    prototypeName: { type: "string" },
    testableAssumption: { type: "string" },
    screens: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          id: { type: "string" }, name: { type: "string" }, purpose: { type: "string" },
          components: {
            type: "array", minItems: 1,
            items: {
              type: "object", additionalProperties: false,
              properties: {
                id: { type: "string" },
                type: { type: "string", enum: ["header", "notice", "metric", "issue-list", "opportunity-card", "score-breakdown", "decision-panel", "button", "evidence-link"] },
                title: { type: "string" }, body: { type: "string" }, label: { type: "string" },
                action: {
                  type: "object", nullable: true, additionalProperties: false,
                  properties: { type: { type: "string", enum: ["navigate", "select", "expand", "back"] }, target: { type: "string" } },
                  required: ["type", "target"],
                },
              },
              required: ["id", "type", "title", "body", "label", "action"],
            },
          },
        },
        required: ["id", "name", "purpose", "components"],
      },
    },
    exceptionalState: { type: "string" },
    acceptanceMapping: stringArray,
    testScript: stringArray,
    expectedObservations: stringArray,
    feasibilityRisks: stringArray,
    limitations: stringArray,
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "selectedOpportunityId", "selectedConceptId", "prototypeName", "testableAssumption", "screens", "exceptionalState", "acceptanceMapping", "testScript", "expectedObservations", "feasibilityRisks", "limitations"],
};

export const communicatorOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...baseProperties("communicator"),
    selectedOpportunityId: { type: "string" },
    internalPitch: {
      type: "object", additionalProperties: false,
      properties: { headline: { type: "string" }, problem: { type: "string" }, evidence: { type: "string" }, proposedConcept: { type: "string" }, risk: { type: "string" }, requestedDecision: { type: "string" } },
      required: ["headline", "problem", "evidence", "proposedConcept", "risk", "requestedDecision"],
    },
    customerInvitation: {
      type: "object", additionalProperties: false,
      properties: { status: { type: "string", enum: ["DRAFT_NOT_SENT"] }, subject: { type: "string" }, body: { type: "string" }, approvalRequired: { type: "boolean" } },
      required: ["status", "subject", "body", "approvalRequired"],
    },
    testingQuestions: { type: "array", minItems: 4, items: { type: "string" } },
    valueProposition: { type: "string" },
    trustConcerns: stringArray,
    aiTransparencyWording: { type: "string" },
    nextEngagementAction: { type: "string" },
    intendedLearning: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "selectedOpportunityId", "internalPitch", "customerInvitation", "testingQuestions", "valueProposition", "trustConcerns", "aiTransparencyWording", "nextEngagementAction", "intendedLearning"],
};

export const managerOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    ...baseProperties("manager"),
    traceabilityAudit: { type: "string" },
    unsupportedClaims: stringArray,
    weightingExplanation: { type: "string" },
    ranking: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          rank: { type: "integer" }, opportunityId: { type: "string" }, title: { type: "string" },
          evidenceIssueNumbers: { type: "array", items: { type: "integer" } },
          frequency: { type: "string" }, severity: { type: "string" }, breadth: { type: "string" },
          recency: { type: "string" }, strategicFit: { type: "string" }, confidence: { type: "string" },
          effortRisk: { type: "string" }, rationale: { type: "string" },
        },
        required: ["rank", "opportunityId", "title", "evidenceIssueNumbers", "frequency", "severity", "breadth", "recency", "strategicFit", "confidence", "effortRisk", "rationale"],
      },
    },
    designerReview: { type: "string" },
    prototypeReview: { type: "string" },
    communicationReview: { type: "string" },
    finalAction: { type: "string", enum: ["build", "validate", "park"] },
    finalRecommendation: { type: "string" },
    uncertainties: stringArray,
    ethicalAndTrustRisks: stringArray,
    requiredHumanChecks: stringArray,
    accountableHumanRole: { type: "string" },
    immediateNextStep: { type: "string" },
    successMeasure: { type: "string" },
    finalDisclosure: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "traceabilityAudit", "unsupportedClaims", "weightingExplanation", "ranking", "designerReview", "prototypeReview", "communicationReview", "finalAction", "finalRecommendation", "uncertainties", "ethicalAndTrustRisks", "requiredHumanChecks", "accountableHumanRole", "immediateNextStep", "successMeasure", "finalDisclosure"],
};

export function validateDownstreamArtifact(stage, artifact, runId, inputs) {
  if (!artifact || typeof artifact !== "object" || artifact.runId !== runId || artifact.stage !== stage) {
    throw new Error(`The ${stage} artefact did not preserve the run and stage identifiers.`);
  }
  const opportunities = inputs.researcher?.opportunities ?? [];
  const opportunityIds = new Set(opportunities.map((item) => item.id));
  if (stage !== "manager" && !opportunityIds.has(artifact.selectedOpportunityId)) {
    throw new Error(`The ${stage} selected an opportunity that the Researcher did not produce.`);
  }
  if (stage === "designer" && (artifact.alternatives?.length !== 3 || artifact.screens?.length !== 3)) {
    throw new Error("The Designer must return three alternatives and three screen purposes.");
  }
  if (stage === "maker" && artifact.screens?.length !== 3) {
    throw new Error("The Maker must return exactly three prototype screens.");
  }
  if (stage === "maker") {
    const makerText = JSON.stringify(artifact);
    const upstreamText = JSON.stringify({ researcher: inputs.researcher, designer: inputs.designer });
    const unsupportedTokens = [
      ...(makerText.match(/\b(?:JIRA|LINEAR)-?\d+\b/gi) ?? []),
      ...(makerText.match(/\b\d+(?:\.\d+)?%\b/g) ?? []),
    ].filter((token) => !upstreamText.toLowerCase().includes(token.toLowerCase()));
    if (unsupportedTokens.length > 0) {
      throw new Error(`The Maker invented unsupported identifiers or quantitative targets: ${[...new Set(unsupportedTokens)].join(", ")}. Use an explicit synthetic placeholder instead.`);
    }
  }
  if (stage === "manager") {
    const rankedIds = artifact.ranking?.map((item) => item.opportunityId) ?? [];
    if (rankedIds.length !== 3 || new Set(rankedIds).size !== 3 || rankedIds.some((id) => !opportunityIds.has(id))) {
      throw new Error("The Manager must rank each of the three researched opportunities exactly once.");
    }
    if (artifact.finalAction === "build" && artifact.ranking[0].opportunityId !== inputs.maker?.selectedOpportunityId) {
      throw new Error("The Manager cannot recommend building an opportunity that was not prototyped.");
    }
  }
}
