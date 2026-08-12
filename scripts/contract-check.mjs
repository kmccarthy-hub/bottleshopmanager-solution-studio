import assert from "node:assert/strict";
import { validateResearcherArtifact } from "../contracts/researcher.js";
import { validateDownstreamArtifact } from "../contracts/downstream.js";
import { isTransientServiceError, serviceStatus } from "../api/_service-errors.js";

assert.equal(serviceStatus(new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}')), 503);
assert.equal(isTransientServiceError(new Error("This model is currently experiencing high demand.")), true);

const selectedIssue = { number: 4, sourceUrl: "https://github.com/kmccarthy-hub/bottleshopmanager-backlog/issues/4" };
const researcher = {
  runId: "run-1", artifactId: "research-1", stage: "researcher", toolReceiptId: "receipt-1", marketResearchReceiptId: "market-1",
  featureRequest: { issueNumber: 4, sourceUrl: selectedIssue.sourceUrl }, requestAssessment: { missingInformation: [] },
  marketResearch: { sources: [{ id: "source-1" }], findings: [{ id: "finding-1" }] }, designerHandoff: { artifactId: "research-1" },
};
validateResearcherArtifact(researcher, selectedIssue, "run-1", "receipt-1", "market-1");
assert.throws(() => validateResearcherArtifact({ ...researcher, marketResearchReceiptId: "wrong" }, selectedIssue, "run-1", "receipt-1", "market-1"));

const designer = {
  runId: "run-1", artifactId: "design-1", stage: "designer", featureRequestNumber: 4,
  receivedHandoff: { artifactId: "research-1" }, makerHandoff: { artifactId: "design-1" },
  concepts: [
    { id: "concept-lead", lens: "recommended_approach", baselineSurface: "inventory" },
    { id: "concept-alt", lens: "alternative_approach", baselineSurface: "orders" },
    { id: "concept-variation", lens: "variation_extended_approach", baselineSurface: "overview" },
  ],
};
validateDownstreamArtifact("designer", designer, "run-1", { researcher });
assert.throws(() => validateDownstreamArtifact("designer", { ...designer, receivedHandoff: { artifactId: "wrong" } }, "run-1", { researcher }));

const artifacts = { researcher, designer };
const maker = {
  runId: "run-1", artifactId: "maker-1", stage: "maker", featureRequestNumber: 4,
  receivedHandoff: { artifactId: "design-1" }, communicatorHandoff: { artifactId: "maker-1" },
  prototypes: designer.concepts.map((concept, index) => ({
    conceptId: concept.id, baselineSurface: concept.baselineSurface,
    interactionPattern: ["guided_workflow", "guided_workflow", "review_queue"][index],
    implementedDesignElements: ["Example design element"], designTraceability: "Implements the supplied specification.",
    sampleRecords: [1, 2, 3].map((number) => ({ label: `Example record ${number}` })),
  })),
};
validateDownstreamArtifact("maker", maker, "run-1", artifacts);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item) => ({ ...item, implementedDesignElements: [] })) }, "run-1", artifacts));

const communicator = {
  runId: "run-1", artifactId: "communicator-1", stage: "communicator", featureRequestNumber: 4,
  receivedHandoff: { artifactId: "maker-1" }, managerHandoff: { artifactId: "communicator-1" },
  optionBriefs: designer.concepts.map((concept) => ({ conceptId: concept.id })),
};
validateDownstreamArtifact("communicator", communicator, "run-1", { ...artifacts, maker });

validateDownstreamArtifact("manager", {
  runId: "run-1", stage: "manager", featureRequestNumber: 4, receivedHandoff: { artifactId: "communicator-1" }, recommendedConceptId: "concept-alt",
  ranking: designer.concepts.map((concept) => ({ conceptId: concept.id })),
}, "run-1", { ...artifacts, maker, communicator });

console.log("Contract checks passed: live evidence receipts, explicit handoffs, three design approaches, specification-to-prototype traceability and advisory recommendation governance.");
