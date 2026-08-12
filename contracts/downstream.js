const stringArray = { type: "array", items: { type: "string" } };

const gapSchema = {
  type: "object", additionalProperties: false,
  properties: { category: { type: "string" }, missingInformation: { type: "string" }, whyItMatters: { type: "string" }, questionForProductManager: { type: "string" } },
  required: ["category", "missingInformation", "whyItMatters", "questionForProductManager"],
};

const baseProperties = (stage) => ({ runId: { type: "string" }, artifactId: { type: "string" }, stage: { type: "string", enum: [stage] }, aiDisclosure: { type: "string" }, featureRequestNumber: { type: "integer" } });
const receivedHandoffSchema = (from) => ({
  type: "object", additionalProperties: false,
  properties: { from: { type: "string", enum: [from] }, artifactId: { type: "string" }, summary: { type: "string" }, inputsUsed: stringArray },
  required: ["from", "artifactId", "summary", "inputsUsed"],
});
const nextHandoffSchema = (to) => ({
  type: "object", additionalProperties: false,
  properties: { to: { type: "string", enum: [to] }, artifactId: { type: "string" }, summary: { type: "string" }, requiredInputs: stringArray, unresolvedQuestions: stringArray },
  required: ["to", "artifactId", "summary", "requiredInputs", "unresolvedQuestions"],
});

const screenSchema = {
  type: "object", additionalProperties: false,
  properties: { name: { type: "string" }, purpose: { type: "string" }, keyElements: stringArray, primaryAction: { type: "string" }, states: stringArray },
  required: ["name", "purpose", "keyElements", "primaryAction", "states"],
};

const conceptSchema = {
  type: "object", additionalProperties: false,
  properties: {
    id: { type: "string" }, lens: { type: "string", enum: ["recommended_approach", "alternative_approach", "variation_extended_approach"] },
    title: { type: "string" }, oneLineSummary: { type: "string" }, intendedUser: { type: "string" },
    baselineSurface: { type: "string", enum: ["overview", "inventory", "orders", "transfers", "staff", "shifts", "reporting"] },
    currentWorkflowReference: { type: "string" }, researchFindingIds: stringArray, designRationale: { type: "string" },
    operationalWorkflow: { type: "array", minItems: 3, items: { type: "string" } }, keyCapabilities: stringArray,
    screenSpecifications: { type: "array", minItems: 1, items: screenSchema }, businessRules: stringArray, permissions: stringArray, exceptionStates: stringArray,
    evidenceFit: { type: "string" }, assumptions: stringArray, tradeoffs: stringArray, risks: stringArray,
    validationQuestion: { type: "string" }, prototypeBrief: { type: "string" }, makerInstructions: stringArray,
  },
  required: ["id", "lens", "title", "oneLineSummary", "intendedUser", "baselineSurface", "currentWorkflowReference", "researchFindingIds", "designRationale", "operationalWorkflow", "keyCapabilities", "screenSpecifications", "businessRules", "permissions", "exceptionStates", "evidenceFit", "assumptions", "tradeoffs", "risks", "validationQuestion", "prototypeBrief", "makerInstructions"],
};

export const designerOutputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    ...baseProperties("designer"), receivedHandoff: receivedHandoffSchema("researcher"), concepts: { type: "array", minItems: 3, maxItems: 3, items: conceptSchema },
    relationshipBetweenApproaches: { type: "string" }, informationGaps: { type: "array", items: gapSchema }, makerHandoff: nextHandoffSchema("maker"), handoffSummary: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "featureRequestNumber", "receivedHandoff", "concepts", "relationshipBetweenApproaches", "informationGaps", "makerHandoff", "handoffSummary"],
};

const sampleRecordSchema = {
  type: "object", additionalProperties: false,
  properties: { id: { type: "string" }, label: { type: "string" }, context: { type: "string" }, status: { type: "string" } },
  required: ["id", "label", "context", "status"],
};

export const makerOutputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    ...baseProperties("maker"), receivedHandoff: receivedHandoffSchema("designer"),
    prototypes: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          conceptId: { type: "string" }, title: { type: "string" }, purpose: { type: "string" },
          baselineSurface: { type: "string", enum: ["overview", "inventory", "orders", "transfers", "staff", "shifts", "reporting"] },
          interactionPattern: { type: "string", enum: ["review_queue", "guided_workflow", "insight_workspace"] },
          currentWorkflow: { type: "string" }, proposedWorkflow: { type: "string" }, testableAssumption: { type: "string" },
          implementedDesignElements: stringArray, omittedDesignElements: stringArray, designTraceability: { type: "string" },
          changeHighlights: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
          sampleRecords: { type: "array", minItems: 3, maxItems: 3, items: sampleRecordSchema },
          primaryActionLabel: { type: "string" }, successMessage: { type: "string" },
          exceptionalState: { type: "string" }, limitations: stringArray, humanTestPrompts: stringArray,
        },
        required: ["conceptId", "title", "purpose", "baselineSurface", "interactionPattern", "currentWorkflow", "proposedWorkflow", "testableAssumption", "implementedDesignElements", "omittedDesignElements", "designTraceability", "changeHighlights", "sampleRecords", "primaryActionLabel", "successMessage", "exceptionalState", "limitations", "humanTestPrompts"],
      },
    },
    informationGaps: { type: "array", items: gapSchema }, communicatorHandoff: nextHandoffSchema("communicator"),
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "featureRequestNumber", "receivedHandoff", "prototypes", "informationGaps", "communicatorHandoff"],
};

export const communicatorOutputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    ...baseProperties("communicator"), receivedHandoff: receivedHandoffSchema("maker"),
    optionBriefs: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          conceptId: { type: "string" }, headline: { type: "string" }, executiveSummary: { type: "string" }, intendedUser: { type: "string" },
          changesInvolved: stringArray, userImpact: { type: "string" }, operationalImpact: { type: "string" }, implementationEffort: { type: "string", enum: ["low", "medium", "high"] }, effortDrivers: stringArray,
          valueProposition: { type: "string" }, strengths: stringArray, risks: stringArray, prototypeExplanation: { type: "string" }, validationQuestions: stringArray,
          status: { type: "string", enum: ["DRAFT_INTERNAL_ONLY"] },
        },
        required: ["conceptId", "headline", "executiveSummary", "intendedUser", "changesInvolved", "userImpact", "operationalImpact", "implementationEffort", "effortDrivers", "valueProposition", "strengths", "risks", "prototypeExplanation", "validationQuestions", "status"],
      },
    },
    comparisonSummary: { type: "string" }, informationGaps: { type: "array", items: gapSchema }, managerHandoff: nextHandoffSchema("manager"),
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "featureRequestNumber", "receivedHandoff", "optionBriefs", "comparisonSummary", "informationGaps", "managerHandoff"],
};

const contributionSchema = {
  type: "object", additionalProperties: false,
  properties: { researcher: { type: "string" }, designer: { type: "string" }, maker: { type: "string" }, communicator: { type: "string" } },
  required: ["researcher", "designer", "maker", "communicator"],
};

export const managerOutputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    ...baseProperties("manager"), receivedHandoff: receivedHandoffSchema("communicator"), handoffAudit: { type: "string" }, strategicAlignmentSummary: { type: "string" },
    requestReadiness: { type: "string", enum: ["ready_for_concept_validation", "needs_backlog_enrichment"] }, informationQualitySummary: { type: "string" },
    consolidatedInformationGaps: { type: "array", items: { type: "object", additionalProperties: false, properties: { category: { type: "string" }, sourceAgents: stringArray, missingInformation: { type: "string" }, whyItMatters: { type: "string" }, questionForProductManager: { type: "string" } }, required: ["category", "sourceAgents", "missingInformation", "whyItMatters", "questionForProductManager"] } },
    weightingExplanation: { type: "string" },
    ranking: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", additionalProperties: false, properties: {
      rank: { type: "integer" }, conceptId: { type: "string" }, title: { type: "string" }, lens: { type: "string" }, userValue: { type: "string" }, evidenceFit: { type: "string" }, operationalFit: { type: "string" },
      confidence: { type: "string", enum: ["low", "medium", "high"] }, complexity: { type: "string" }, validationRisk: { type: "string" }, executiveSummary: { type: "string" }, agentContributions: contributionSchema,
    }, required: ["rank", "conceptId", "title", "lens", "userValue", "evidenceFit", "operationalFit", "confidence", "complexity", "validationRisk", "executiveSummary", "agentContributions"] } },
    recommendedConceptId: { type: "string" }, recommendation: { type: "string" }, recommendationStrength: { type: "string", enum: ["tentative", "moderate", "strong"] },
    whatWouldChangeRecommendation: stringArray, unsupportedClaims: stringArray, accountableHumanRole: { type: "string" }, suggestedNextStep: { type: "string" }, finalDisclosure: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "featureRequestNumber", "receivedHandoff", "handoffAudit", "strategicAlignmentSummary", "requestReadiness", "informationQualitySummary", "consolidatedInformationGaps", "weightingExplanation", "ranking", "recommendedConceptId", "recommendation", "recommendationStrength", "whatWouldChangeRecommendation", "unsupportedClaims", "accountableHumanRole", "suggestedNextStep", "finalDisclosure"],
};

function ids(items, key) { return items?.map((item) => item[key]) ?? []; }

export function validateDownstreamArtifact(stage, artifact, runId, inputs) {
  if (!artifact || typeof artifact !== "object" || artifact.runId !== runId || artifact.stage !== stage) throw new Error(`The ${stage} artefact did not preserve the run and stage identifiers.`);
  const issueNumber = inputs.researcher?.featureRequest?.issueNumber;
  if (artifact.featureRequestNumber !== issueNumber) throw new Error(`The ${stage} did not preserve the selected feature-request number.`);
  const concepts = inputs.designer?.concepts ?? artifact.concepts ?? [];
  const conceptIds = ids(concepts, "id");
  const predecessor = { designer: "researcher", maker: "designer", communicator: "maker", manager: "communicator" }[stage];
  if (predecessor && artifact.receivedHandoff?.artifactId !== inputs[predecessor]?.artifactId) throw new Error(`The ${stage} must explicitly acknowledge the validated ${predecessor} artifact ID.`);

  if (stage === "designer") {
    const roles = ids(artifact.concepts, "lens");
    const requiredRoles = ["recommended_approach", "alternative_approach", "variation_extended_approach"];
    if (artifact.concepts?.length !== 3 || new Set(roles).size !== 3 || !requiredRoles.every((role) => roles.includes(role))) throw new Error("The Designer must produce one recommended approach, one alternative approach and one variation or extended approach.");
    if (artifact.makerHandoff?.artifactId !== artifact.artifactId) throw new Error("The Designer handoff must reference its own validated artifact ID.");
  }
  if (stage === "maker") {
    const prototypeIds = ids(artifact.prototypes, "conceptId");
    if (prototypeIds.length !== 3 || new Set(prototypeIds).size !== 3 || prototypeIds.some((id) => !conceptIds.includes(id))) throw new Error("The Maker must create exactly one prototype for each Designer specification.");
    for (const prototype of artifact.prototypes) {
      const concept = concepts.find((item) => item.id === prototype.conceptId);
      if (!concept || prototype.baselineSurface !== concept.baselineSurface) throw new Error("Each Maker prototype must preserve its Designer specification's current-product surface.");
      if (!prototype.implementedDesignElements?.length || !prototype.designTraceability) throw new Error("Every Maker prototype must state how it implements the Designer specification.");
      if (prototype.sampleRecords?.length !== 3 || prototype.sampleRecords.some((record) => !/^Example\b/i.test(record.label))) throw new Error("Every Maker prototype must contain exactly three clearly labelled Example records.");
    }
    const makerText = JSON.stringify(artifact);
    const upstreamText = JSON.stringify({ researcher: inputs.researcher, designer: inputs.designer });
    const unsupportedTokens = [...(makerText.match(/\b(?:SKU|PO|ORDER|JIRA|LINEAR)-?\d+\b/gi) ?? []), ...(makerText.match(/(?:â‚¬|Â£|\$)\s?\d+(?:\.\d+)?/g) ?? []), ...(makerText.match(/\b\d+(?:\.\d+)?%\b/g) ?? [])].filter((token) => !upstreamText.toLowerCase().includes(token.toLowerCase()));
    if (unsupportedTokens.length) throw new Error(`The Maker invented unsupported identifiers or figures: ${[...new Set(unsupportedTokens)].join(", ")}. Use an explicit synthetic placeholder instead.`);
    if (artifact.communicatorHandoff?.artifactId !== artifact.artifactId) throw new Error("The Maker handoff must reference its own validated artifact ID.");
  }
  if (stage === "communicator") {
    const briefIds = ids(artifact.optionBriefs, "conceptId");
    if (briefIds.length !== 3 || new Set(briefIds).size !== 3 || briefIds.some((id) => !conceptIds.includes(id))) throw new Error("The Communicator must brief each Designer specification exactly once.");
    if (artifact.managerHandoff?.artifactId !== artifact.artifactId) throw new Error("The Communicator handoff must reference its own validated artifact ID.");
  }
  if (stage === "manager") {
    const rankedIds = ids(artifact.ranking, "conceptId");
    if (rankedIds.length !== 3 || new Set(rankedIds).size !== 3 || rankedIds.some((id) => !conceptIds.includes(id))) throw new Error("The Manager must rank each Designer specification exactly once.");
    if (!conceptIds.includes(artifact.recommendedConceptId)) throw new Error("The Manager recommendation must reference one of the three Designer specifications.");
  }
}
