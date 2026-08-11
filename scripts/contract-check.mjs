import assert from "node:assert/strict";
import { validateResearcherArtifact } from "../contracts/researcher.js";
import { validateDownstreamArtifact } from "../contracts/downstream.js";

const selectedIssue = { number: 4, sourceUrl: "https://github.com/kmccarthy-hub/bottleshopmanager-backlog/issues/4" };
const researcher = {
  runId: "run-1", stage: "researcher", toolReceiptId: "receipt-1",
  featureRequest: { issueNumber: 4, sourceUrl: selectedIssue.sourceUrl },
  requestAssessment: { missingInformation: [] },
};

validateResearcherArtifact(researcher, selectedIssue, "run-1", "receipt-1");
assert.throws(() => validateResearcherArtifact({ ...researcher, featureRequest: { issueNumber: 5, sourceUrl: selectedIssue.sourceUrl } }, selectedIssue, "run-1", "receipt-1"));

const designer = {
  runId: "run-1", stage: "designer", featureRequestNumber: 4,
  concepts: [
    { id: "concept-focused", lens: "focused", baselineSurface: "inventory" },
    { id: "concept-integrated", lens: "integrated", baselineSurface: "orders" },
    { id: "concept-exploratory", lens: "exploratory", baselineSurface: "overview" },
  ],
};
validateDownstreamArtifact("designer", designer, "run-1", { researcher });
assert.throws(() => validateDownstreamArtifact("designer", { ...designer, concepts: designer.concepts.map((item) => ({ ...item, lens: "focused" })) }, "run-1", { researcher }));

const artifacts = { researcher, designer };
validateDownstreamArtifact("maker", {
  runId: "run-1", stage: "maker", featureRequestNumber: 4,
  prototypes: designer.concepts.map((concept) => ({
    conceptId: concept.id,
    baselineSurface: concept.baselineSurface,
    interactionPattern: { focused: "review_queue", integrated: "guided_workflow", exploratory: "insight_workspace" }[concept.lens],
    sampleRecords: [1, 2, 3].map((number) => ({ label: `Example record ${number}` })),
  })),
}, "run-1", artifacts);

assert.throws(() => validateDownstreamArtifact("maker", {
  runId: "run-1", stage: "maker", featureRequestNumber: 4,
  prototypes: [
    { conceptId: "concept-focused", baselineSurface: "inventory", interactionPattern: "review_queue", sampleRecords: [{ label: "Example SKU-8420 at 80%." }, { label: "Example record 2" }, { label: "Example record 3" }] },
    { conceptId: "concept-integrated", baselineSurface: "orders", interactionPattern: "guided_workflow", sampleRecords: [{ label: "Example record 1" }, { label: "Example record 2" }, { label: "Example record 3" }] },
    { conceptId: "concept-exploratory", baselineSurface: "overview", interactionPattern: "insight_workspace", sampleRecords: [{ label: "Example record 1" }, { label: "Example record 2" }, { label: "Example record 3" }] },
  ],
}, "run-1", artifacts));

validateDownstreamArtifact("manager", {
  runId: "run-1", stage: "manager", featureRequestNumber: 4, recommendedConceptId: "concept-focused",
  ranking: [
    { conceptId: "concept-focused" },
    { conceptId: "concept-integrated" },
    { conceptId: "concept-exploratory" },
  ],
}, "run-1", artifacts);

assert.throws(() => validateDownstreamArtifact("manager", {
  runId: "run-1", stage: "manager", featureRequestNumber: 4, recommendedConceptId: "invented",
  ranking: [
    { conceptId: "concept-focused" },
    { conceptId: "concept-integrated" },
    { conceptId: "concept-exploratory" },
  ],
}, "run-1", artifacts));

console.log("Contract checks passed: selected-request traceability, three solution lenses, prototype coverage and advisory recommendation governance.");
