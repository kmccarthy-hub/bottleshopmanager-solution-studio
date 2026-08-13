import { getPrototypeBaselinePackage } from "../domain/prototype-baselines.js";

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
    relationshipBetweenApproaches: { type: "string" }, informationGaps: { type: "array", items: gapSchema }, managerSelectionHandoff: nextHandoffSchema("manager"), handoffSummary: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "featureRequestNumber", "receivedHandoff", "concepts", "relationshipBetweenApproaches", "informationGaps", "managerSelectionHandoff", "handoffSummary"],
};

export const prototypeSelectionOutputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    ...baseProperties("prototype_selection"), receivedHandoff: receivedHandoffSchema("designer"),
    selectedConceptId: { type: "string" }, selectedTitle: { type: "string" }, selectionRationale: { type: "string" },
    confidence: { type: "string", enum: ["low", "medium", "high"] }, selectionCriteria: stringArray,
    optionAssessment: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", additionalProperties: false, properties: {
      conceptId: { type: "string" }, title: { type: "string" }, status: { type: "string", enum: ["selected_for_prototyping", "not_selected_for_prototyping"] }, reason: { type: "string" },
    }, required: ["conceptId", "title", "status", "reason"] } },
    makerHandoff: nextHandoffSchema("maker"), decisionBoundary: { type: "string" },
  },
  required: ["runId", "artifactId", "stage", "aiDisclosure", "featureRequestNumber", "receivedHandoff", "selectedConceptId", "selectedTitle", "selectionRationale", "confidence", "selectionCriteria", "optionAssessment", "makerHandoff", "decisionBoundary"],
};

export const makerOutputSchema = {
  type: "object", additionalProperties: false,
  properties: {
    ...baseProperties("maker"), receivedHandoff: receivedHandoffSchema("manager"),
    prototypes: {
      type: "array", minItems: 1, maxItems: 1,
      items: {
        type: "object", additionalProperties: false,
        properties: {
          conceptId: { type: "string" }, title: { type: "string" }, purpose: { type: "string" },
          baselineSurface: { type: "string", enum: ["overview", "inventory", "orders", "transfers", "staff", "shifts", "reporting"] },
          baselineSourceId: { type: "string" }, baselineAnchorsPreserved: stringArray,
          currentWorkflow: { type: "string" }, proposedWorkflow: { type: "string" }, testableAssumption: { type: "string" },
          implementedDesignElements: stringArray, omittedDesignElements: stringArray, designTraceability: { type: "string" },
          changeHighlights: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
          modifications: { type: "array", minItems: 1, maxItems: 6, items: { type: "object", additionalProperties: false, properties: {
            id: { type: "string", description: "A lowercase kebab-case identifier, for example stock-alert." }, targetAnchor: { type: "string" }, placement: { type: "string", enum: ["before", "after", "prepend", "append"] }, purpose: { type: "string" }, html: { type: "string" },
          }, required: ["id", "targetAnchor", "placement", "purpose", "html"] } },
          prototypeCss: { type: "string", description: "Required complete non-empty CSS, 80-12000 characters, scoped only to generated prototype elements. Never return an empty string." }, prototypeScript: { type: "string" }, interactionSummary: { type: "string" }, interactiveStates: { type: "array", minItems: 2, items: { type: "string" } },
          limitations: stringArray, humanTestPrompts: stringArray,
        },
        required: ["conceptId", "title", "purpose", "baselineSurface", "baselineSourceId", "baselineAnchorsPreserved", "currentWorkflow", "proposedWorkflow", "testableAssumption", "implementedDesignElements", "omittedDesignElements", "designTraceability", "changeHighlights", "modifications", "prototypeCss", "prototypeScript", "interactionSummary", "interactiveStates", "limitations", "humanTestPrompts"],
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
      type: "array", minItems: 1, maxItems: 1,
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
  const predecessor = { designer: "researcher", prototype_selection: "designer", maker: "prototypeSelection", communicator: "maker", manager: "communicator" }[stage];
  if (predecessor && artifact.receivedHandoff?.artifactId !== inputs[predecessor]?.artifactId) throw new Error(`The ${stage} must explicitly acknowledge the validated ${predecessor} artifact ID.`);

  if (stage === "designer") {
    const roles = ids(artifact.concepts, "lens");
    const requiredRoles = ["recommended_approach", "alternative_approach", "variation_extended_approach"];
    if (artifact.concepts?.length !== 3 || new Set(roles).size !== 3 || !requiredRoles.every((role) => roles.includes(role))) throw new Error("The Designer must produce one recommended approach, one alternative approach and one variation or extended approach.");
    if (artifact.managerSelectionHandoff?.artifactId !== artifact.artifactId) throw new Error("The Designer handoff to the Manager selection gate must reference its own validated artifact ID.");
  }
  if (stage === "prototype_selection") {
    const assessedIds = ids(artifact.optionAssessment, "conceptId");
    if (assessedIds.length !== 3 || new Set(assessedIds).size !== 3 || assessedIds.some((id) => !conceptIds.includes(id))) throw new Error("The Manager selection gate must assess all three Designer specifications.");
    if (!conceptIds.includes(artifact.selectedConceptId) || artifact.optionAssessment.filter((item) => item.status === "selected_for_prototyping").length !== 1 || artifact.optionAssessment.find((item) => item.status === "selected_for_prototyping")?.conceptId !== artifact.selectedConceptId) throw new Error("The Manager selection gate must select exactly one Designer specification for prototyping.");
    if (artifact.makerHandoff?.artifactId !== artifact.artifactId) throw new Error("The Manager selection handoff must reference its own validated artifact ID.");
  }
  if (stage === "maker") {
    const prototypeIds = ids(artifact.prototypes, "conceptId");
    if (prototypeIds.length !== 1 || prototypeIds[0] !== inputs.prototypeSelection?.selectedConceptId || prototypeIds.some((id) => !conceptIds.includes(id))) throw new Error("The Maker must create exactly one prototype for the Manager-selected Designer specification.");
    const baselines = getPrototypeBaselinePackage(concepts);
    const forbiddenPrototypeRuntime = /<\s*(?:a|iframe|object|embed|base|form|script|style|link|meta)\b|\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|localStorage|sessionStorage|indexedDB|serviceWorker|window\.open|document\.cookie|window\.parent|window\.top|window\.opener|eval\s*\(|Function\s*\(|(?:window\.|document\.)?location\s*[.=])|https?:\/\/|mailto:|javascript:/i;
    const forbiddenPrototypeMarkup = new RegExp(`${forbiddenPrototypeRuntime.source}|(?<![\\w-])(?:href|src|action|formaction|target)\\s*=|\\bon\\w+\\s*=`, "i");
    const broadPrototypeCss = /(^|[},])\s*(?:html|body|\*|:root|\.platform-|\.bsm-page|\.module-header|\.current-workflow|\[data-baseline)[^{,]*\{/im;
    for (const prototype of artifact.prototypes) {
      const concept = concepts.find((item) => item.id === prototype.conceptId);
      if (!concept || prototype.baselineSurface !== concept.baselineSurface) throw new Error("Each Maker prototype must preserve its Designer specification's current-product surface.");
      if (!prototype.implementedDesignElements?.length || !prototype.designTraceability) throw new Error("Every Maker prototype must state how it implements the Designer specification.");
      const baseline = baselines.find((item) => item.conceptId === prototype.conceptId);
      if (!baseline || prototype.baselineSourceId !== baseline.sourceId) throw new Error("Every Maker prototype must identify the immutable baseline page source it modified.");
      const modificationIds = ids(prototype.modifications, "id");
      if (!prototype.modifications?.length || new Set(modificationIds).size !== modificationIds.length) throw new Error("Every Maker prototype must provide uniquely identified page modifications.");
      for (const modification of prototype.modifications) {
        if (!/^[a-z][a-z0-9-]{1,63}$/.test(modification.id ?? "")) throw new Error(`Maker modification ID ${JSON.stringify(modification.id)} must be 2-64 characters of lowercase kebab-case beginning with a letter.`);
        if (!baseline.anchors.includes(modification.targetAnchor)) throw new Error(`The Maker targeted an unknown baseline anchor: ${modification.targetAnchor}.`);
        const modificationHtmlLength = modification.html?.length ?? 0;
        if (modificationHtmlLength < 80 || modificationHtmlLength > 8000) throw new Error(`Maker modification ${JSON.stringify(modification.id)} HTML length ${modificationHtmlLength} is outside the permitted 80-8000 character range.`);
        const rootTag = modification.html.match(/^\s*<([a-z][a-z0-9-]*)\b([^>]*)>/i);
        if (!rootTag) throw new Error(`Maker modification ${JSON.stringify(modification.id)} must begin with one HTML root element.`);
        const rootMarker = rootTag[2].match(/\bdata-prototype-element\s*=\s*(["'])([^"']+)\1/i)?.[2];
        if (!rootMarker) throw new Error(`Maker modification ${JSON.stringify(modification.id)} must put data-prototype-element=${JSON.stringify(modification.id)} on its HTML root element.`);
        if (rootMarker !== modification.id) throw new Error(`Maker modification ${JSON.stringify(modification.id)} has root data-prototype-element ${JSON.stringify(rootMarker)}; it must exactly match the modification ID.`);
        const blockedMarkup = modification.html.match(forbiddenPrototypeMarkup)?.[0];
        if (blockedMarkup) throw new Error(`Generated prototype markup contains blocked token ${JSON.stringify(blockedMarkup.slice(0, 48))}. Use non-submitting controls in html, prototypeCss for styling and prototypeScript for behaviour.`);
      }
      const generatedCode = `${prototype.prototypeCss ?? ""}\n${prototype.prototypeScript ?? ""}`;
      const prototypeCssLength = prototype.prototypeCss?.length ?? 0;
      if (prototypeCssLength < 80 || prototypeCssLength > 12000) throw new Error(`Maker CSS length ${prototypeCssLength} is outside the permitted 80-12000 character range.`);
      const broadCssMatch = prototype.prototypeCss.match(broadPrototypeCss)?.[0];
      if (broadCssMatch) {
        const broadCssSelector = broadCssMatch.replace(/^[},]\s*/, "").replace(/\s*\{$/, "").trim();
        throw new Error(`Maker CSS contains unscoped or baseline selector ${JSON.stringify(broadCssSelector)}. Every selector must begin with [data-prototype-element] or .prototype-.`);
      }
      const blockedGeneratedCode = generatedCode.match(forbiddenPrototypeRuntime)?.[0];
      if (prototype.prototypeScript?.length < 80 || prototype.prototypeScript.length > 10000 || blockedGeneratedCode) throw new Error(`Maker interactions must be bounded and cannot request network, storage, navigation, embedding or parent-page capabilities.${blockedGeneratedCode ? ` Blocked token: ${JSON.stringify(blockedGeneratedCode.slice(0, 48))}.` : ""}`);
      if (!prototype.modifications.some((item) => /<button\b/i.test(item.html)) || !/data-prototype-element|\.prototype-/i.test(prototype.prototypeScript)) throw new Error("Every generated page modification must include feature-specific controls and scoped interactive behaviour.");
      if (prototype.baselineAnchorsPreserved?.length < 2 || prototype.baselineAnchorsPreserved.some((anchor) => !baseline.anchors.includes(anchor))) throw new Error("Every generated page must acknowledge at least two verified elements from the relevant current-platform page.");
    }
    const makerText = JSON.stringify({ ...artifact, prototypes: artifact.prototypes.map((prototype) => Object.fromEntries(Object.entries(prototype).filter(([key]) => !["modifications", "prototypeCss", "prototypeScript"].includes(key)))) });
    const upstreamText = JSON.stringify({ researcher: inputs.researcher, designer: inputs.designer });
    const unsupportedTokens = [...(makerText.match(/\b(?:SKU|PO|ORDER|JIRA|LINEAR)-?\d+\b/gi) ?? []), ...(makerText.match(/(?:â‚¬|Â£|\$)\s?\d+(?:\.\d+)?/g) ?? []), ...(makerText.match(/\b\d+(?:\.\d+)?%\b/g) ?? [])].filter((token) => !upstreamText.toLowerCase().includes(token.toLowerCase()));
    if (unsupportedTokens.length) throw new Error(`The Maker invented unsupported identifiers or figures: ${[...new Set(unsupportedTokens)].join(", ")}. Use an explicit synthetic placeholder instead.`);
    if (artifact.communicatorHandoff?.artifactId !== artifact.artifactId) throw new Error("The Maker handoff must reference its own validated artifact ID.");
  }
  if (stage === "communicator") {
    const briefIds = ids(artifact.optionBriefs, "conceptId");
    if (briefIds.length !== 1 || briefIds[0] !== inputs.prototypeSelection?.selectedConceptId) throw new Error("The Communicator must assess only the single Manager-selected Maker prototype.");
    if (artifact.managerHandoff?.artifactId !== artifact.artifactId) throw new Error("The Communicator handoff must reference its own validated artifact ID.");
  }
  if (stage === "manager") {
    const rankedIds = ids(artifact.ranking, "conceptId");
    if (rankedIds.length !== 3 || new Set(rankedIds).size !== 3 || rankedIds.some((id) => !conceptIds.includes(id))) throw new Error("The Manager must rank each Designer specification exactly once.");
    if (!conceptIds.includes(artifact.recommendedConceptId)) throw new Error("The Manager recommendation must reference one of the three Designer specifications.");
    if (artifact.recommendedConceptId !== inputs.prototypeSelection?.selectedConceptId) throw new Error("The final Manager recommendation must explain and preserve the option it selected for prototype development.");
    if (artifact.ranking.find((item) => item.rank === 1)?.conceptId !== inputs.prototypeSelection?.selectedConceptId) throw new Error("The Manager-selected prototype must be ranked first in the final review.");
  }
}
