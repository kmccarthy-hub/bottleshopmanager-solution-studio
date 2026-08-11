const stringArray = { type: "array", items: { type: "string" } };

const gapSchema = {
  type: "object", additionalProperties: false,
  properties: {
    category: { type: "string" }, missingInformation: { type: "string" }, whyItMatters: { type: "string" },
    questionForProductManager: { type: "string" },
  },
  required: ["category", "missingInformation", "whyItMatters", "questionForProductManager"],
};

const baseProperties = (stage) => ({ runId: { type: "string" }, artifactId: { type: "string" }, stage: { type: "string", enum: [stage] }, aiDisclosure: { type: "string" }, featureRequestNumber: { type: "integer" } });

const conceptSchema = {
  type: "object", additionalProperties: false,
  properties: {
    id: { type: "string" }, lens: { type: "string", enum: ["focused", "integrated", "exploratory"] },
    title: { type: "string" }, oneLineSummary: { type: "string" }, intendedUser: { type: "string" },
    operationalWorkflow: { type: "array", minItems: 3, items: { type: "string" } }, keyCapabilities: stringArray,
    evidenceFit: { type: "string" }, assumptions: stringArray, tradeoffs: stringArray, risks: stringArray,
    validationQuestion: { type: "string" }, prototypeBrief: { type: "string" },
  },
  required: ["id", "lens", "title", "oneLineSummary", "intendedUser", "operationalWorkflow", "keyCapabilities", "evidenceFit", "assumptions", "tradeoffs", "risks", "validationQuestion", "prototypeBrief"],
};

export const designerOutputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    ...baseProperties("designer"), concepts: { type: "array", minItems: 3, maxItems: 3, items: conceptSchema },
    conceptDistinctness: { type: "string" }, informationGaps: { type: "array", items: gapSchema },
    handoffSummary: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "featureRequestNumber", "concepts", "conceptDistinctness", "informationGaps", "handoffSummary"],
};

const componentSchema = {
  type: "object", additionalProperties: false,
  properties: {
    id: { type: "string" },
    type: { type: "string", enum: ["header", "notice", "metric", "item-list", "workflow-card", "status-panel", "comparison", "decision-panel", "button", "evidence-link"] },
    title: { type: "string" }, body: { type: "string" }, label: { type: "string" },
    action: {
      type: "object", nullable: true, additionalProperties: false,
      properties: { type: { type: "string", enum: ["select", "expand", "confirm", "reset"] }, target: { type: "string" } },
      required: ["type", "target"],
    },
  },
  required: ["id", "type", "title", "body", "label", "action"],
};

export const makerOutputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    ...baseProperties("maker"),
    prototypes: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          conceptId: { type: "string" }, title: { type: "string" }, purpose: { type: "string" },
          testableAssumption: { type: "string" }, components: { type: "array", minItems: 3, items: componentSchema },
          exceptionalState: { type: "string" }, limitations: stringArray, humanTestPrompts: stringArray,
        },
        required: ["conceptId", "title", "purpose", "testableAssumption", "components", "exceptionalState", "limitations", "humanTestPrompts"],
      },
    },
    informationGaps: { type: "array", items: gapSchema },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "featureRequestNumber", "prototypes", "informationGaps"],
};

export const communicatorOutputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    ...baseProperties("communicator"),
    optionBriefs: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          conceptId: { type: "string" }, headline: { type: "string" }, executiveSummary: { type: "string" },
          intendedUser: { type: "string" }, valueProposition: { type: "string" }, strengths: stringArray,
          risks: stringArray, prototypeExplanation: { type: "string" }, validationQuestions: stringArray,
          status: { type: "string", enum: ["DRAFT_INTERNAL_ONLY"] },
        },
        required: ["conceptId", "headline", "executiveSummary", "intendedUser", "valueProposition", "strengths", "risks", "prototypeExplanation", "validationQuestions", "status"],
      },
    },
    comparisonSummary: { type: "string" }, informationGaps: { type: "array", items: gapSchema },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "featureRequestNumber", "optionBriefs", "comparisonSummary", "informationGaps"],
};

const contributionSchema = {
  type: "object", additionalProperties: false,
  properties: { researcher: { type: "string" }, designer: { type: "string" }, maker: { type: "string" }, communicator: { type: "string" } },
  required: ["researcher", "designer", "maker", "communicator"],
};

export const managerOutputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    ...baseProperties("manager"),
    requestReadiness: { type: "string", enum: ["ready_for_concept_validation", "needs_backlog_enrichment"] },
    informationQualitySummary: { type: "string" },
    consolidatedInformationGaps: {
      type: "array", items: {
        type: "object", additionalProperties: false,
        properties: { category: { type: "string" }, sourceAgents: stringArray, missingInformation: { type: "string" }, whyItMatters: { type: "string" }, questionForProductManager: { type: "string" } },
        required: ["category", "sourceAgents", "missingInformation", "whyItMatters", "questionForProductManager"],
      },
    },
    weightingExplanation: { type: "string" },
    ranking: {
      type: "array", minItems: 3, maxItems: 3,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          rank: { type: "integer" }, conceptId: { type: "string" }, title: { type: "string" }, lens: { type: "string" },
          userValue: { type: "string" }, evidenceFit: { type: "string" }, operationalFit: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] }, complexity: { type: "string" },
          validationRisk: { type: "string" }, executiveSummary: { type: "string" }, agentContributions: contributionSchema,
        },
        required: ["rank", "conceptId", "title", "lens", "userValue", "evidenceFit", "operationalFit", "confidence", "complexity", "validationRisk", "executiveSummary", "agentContributions"],
      },
    },
    recommendedConceptId: { type: "string" }, recommendation: { type: "string" }, recommendationStrength: { type: "string", enum: ["tentative", "moderate", "strong"] },
    whatWouldChangeRecommendation: stringArray, unsupportedClaims: stringArray,
    accountableHumanRole: { type: "string" }, suggestedNextStep: { type: "string" }, finalDisclosure: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "featureRequestNumber", "requestReadiness", "informationQualitySummary", "consolidatedInformationGaps", "weightingExplanation", "ranking", "recommendedConceptId", "recommendation", "recommendationStrength", "whatWouldChangeRecommendation", "unsupportedClaims", "accountableHumanRole", "suggestedNextStep", "finalDisclosure"],
};

function ids(items, key) { return items?.map((item) => item[key]) ?? []; }

export function validateDownstreamArtifact(stage, artifact, runId, inputs) {
  if (!artifact || typeof artifact !== "object" || artifact.runId !== runId || artifact.stage !== stage) throw new Error(`The ${stage} artefact did not preserve the run and stage identifiers.`);
  const issueNumber = inputs.researcher?.featureRequest?.issueNumber;
  if (artifact.featureRequestNumber !== issueNumber) throw new Error(`The ${stage} did not preserve the selected feature-request number.`);
  const concepts = inputs.designer?.concepts ?? artifact.concepts ?? [];
  const conceptIds = ids(concepts, "id");

  if (stage === "designer") {
    const lenses = ids(artifact.concepts, "lens");
    if (artifact.concepts?.length !== 3 || new Set(lenses).size !== 3 || !["focused", "integrated", "exploratory"].every((lens) => lenses.includes(lens))) throw new Error("The Designer must produce exactly one focused, one integrated and one exploratory concept.");
  }
  if (stage === "maker") {
    const prototypeIds = ids(artifact.prototypes, "conceptId");
    if (prototypeIds.length !== 3 || new Set(prototypeIds).size !== 3 || prototypeIds.some((id) => !conceptIds.includes(id))) throw new Error("The Maker must create exactly one prototype for each Designer concept.");
    const makerText = JSON.stringify(artifact);
    const upstreamText = JSON.stringify({ researcher: inputs.researcher, designer: inputs.designer });
    const unsupportedTokens = [...(makerText.match(/\b(?:SKU|PO|ORDER|JIRA|LINEAR)-?\d+\b/gi) ?? []), ...(makerText.match(/(?:€|£|\$)\s?\d+(?:\.\d+)?/g) ?? []), ...(makerText.match(/\b\d+(?:\.\d+)?%\b/g) ?? [])].filter((token) => !upstreamText.toLowerCase().includes(token.toLowerCase()));
    if (unsupportedTokens.length) throw new Error(`The Maker invented unsupported identifiers or figures: ${[...new Set(unsupportedTokens)].join(", ")}. Use an explicit synthetic placeholder instead.`);
  }
  if (stage === "communicator") {
    const briefIds = ids(artifact.optionBriefs, "conceptId");
    if (briefIds.length !== 3 || new Set(briefIds).size !== 3 || briefIds.some((id) => !conceptIds.includes(id))) throw new Error("The Communicator must brief each Designer concept exactly once.");
  }
  if (stage === "manager") {
    const rankedIds = ids(artifact.ranking, "conceptId");
    if (rankedIds.length !== 3 || new Set(rankedIds).size !== 3 || rankedIds.some((id) => !conceptIds.includes(id))) throw new Error("The Manager must rank each Designer concept exactly once.");
    if (!conceptIds.includes(artifact.recommendedConceptId)) throw new Error("The Manager recommendation must reference one of the three Designer concepts.");
  }
}
