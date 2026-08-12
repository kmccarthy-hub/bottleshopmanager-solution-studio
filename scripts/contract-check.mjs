import assert from "node:assert/strict";
import { validateResearcherArtifact } from "../contracts/researcher.js";
import { validateDownstreamArtifact } from "../contracts/downstream.js";
import { isTransientServiceError, serviceStatus } from "../api/_service-errors.js";
import { getPrototypeBaselinePackage } from "../domain/prototype-baselines.js";

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
const baselinePackage = getPrototypeBaselinePackage(designer.concepts);
const maker = {
  runId: "run-1", artifactId: "maker-1", stage: "maker", featureRequestNumber: 4,
  receivedHandoff: { artifactId: "design-1" }, communicatorHandoff: { artifactId: "maker-1" },
  prototypes: designer.concepts.map((concept) => {
    const baseline = baselinePackage.find((item) => item.conceptId === concept.id);
    const documentHtml = `<!doctype html><html><head><style>body{margin:0;padding:24px;background:#f7f7fa;color:#171222;font-family:Arial,sans-serif}.notice{padding:12px;background:#171222;color:white}.bsm-page{padding:24px}.module-header{display:flex;justify-content:space-between}.panel,.card-grid,.kpi-grid,.toolbar,.step-flow,.calendar{margin-top:18px;padding:18px;border:1px solid #ddd;border-radius:14px;background:white}.card-grid,.kpi-grid,.step-flow,.calendar{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.row,.person-card{padding:12px;border-top:1px solid #eee}table{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;border-bottom:1px solid #eee}button{padding:8px 12px;border:0;border-radius:7px;background:#7c3aed;color:white}.feature{margin-top:18px;padding:18px;border:2px solid #7c3aed;border-radius:14px;background:#f3effd}.current-workflow{margin-top:18px;padding:14px;background:#e8f7f8}.hidden{display:none}</style></head><body><div class="notice">AI-GENERATED PROTOTYPE · SYNTHETIC DATA · DOES NOT CHANGE CURRENT PLATFORM</div>${baseline.html}<section class="feature"><h2>Example proposed feature</h2><p>This custom feature is added to the copied current page for isolated testing only.</p><button id="test" type="button">Test interaction</button><p id="state" class="hidden">Changed prototype state</p></section><script>document.getElementById('test').addEventListener('click',()=>document.getElementById('state').classList.toggle('hidden'));</script></body></html>`;
    return {
    conceptId: concept.id, baselineSurface: concept.baselineSurface,
    baselineSourceId: baseline.sourceId, baselineAnchorsPreserved: baseline.anchors.slice(0, 2),
    implementedDesignElements: ["Example design element"], designTraceability: "Implements the supplied specification.",
    documentHtml,
    };
  }),
};
validateDownstreamArtifact("maker", maker, "run-1", artifacts);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item) => ({ ...item, implementedDesignElements: [] })) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, documentHtml: item.documentHtml.replace("</script>", "fetch('https://example.com')</script>") }) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, baselineAnchorsPreserved: ["invented-anchor"] }) }, "run-1", artifacts));

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

console.log("Contract checks passed: live evidence receipts, explicit handoffs, immutable baseline traceability, sandbox rejection rules and advisory recommendation governance.");
