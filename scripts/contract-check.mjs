import assert from "node:assert/strict";
import { validateResearcherArtifact } from "../contracts/researcher.js";
import { validateDownstreamArtifact } from "../contracts/downstream.js";
import { isTransientServiceError, serviceStatus } from "../api/_service-errors.js";
import { getPrototypeBaselinePackage } from "../domain/prototype-baselines.js";
import { extractMarketResearch } from "../api/researcher.js";

assert.equal(serviceStatus(new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}')), 503);
assert.equal(isTransientServiceError(new Error("This model is currently experiencing high demand.")), true);
assert.equal(isTransientServiceError(new Error("Every generated page must provide a complete standalone document.")), false);
assert.equal(isTransientServiceError(new Error("Artifact validation failed: prohibited prototype capability.")), false);
assert.equal(isTransientServiceError({ status: 503, message: "Provider unavailable" }), true);
assert.throws(() => extractMarketResearch({ text: "Ungrounded response", candidates: [{ groundingMetadata: {} }] }), /grounded market evidence/);
const groundedResearch = extractMarketResearch({ text: "Grounded evidence", candidates: [{ groundingMetadata: { webSearchQueries: ["example query"], groundingChunks: [{ web: { title: "Official example", uri: "https://example.invalid/help" } }] } }] }, 2);
assert.equal(groundedResearch.receipt.sourceCount, 1);
assert.equal(groundedResearch.receipt.groundingAttempts, 2);

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
  receivedHandoff: { artifactId: "research-1" }, managerSelectionHandoff: { artifactId: "design-1" },
  concepts: [
    { id: "concept-lead", lens: "recommended_approach", baselineSurface: "inventory" },
    { id: "concept-alt", lens: "alternative_approach", baselineSurface: "orders" },
    { id: "concept-variation", lens: "variation_extended_approach", baselineSurface: "overview" },
  ],
};
validateDownstreamArtifact("designer", designer, "run-1", { researcher });
assert.throws(() => validateDownstreamArtifact("designer", { ...designer, receivedHandoff: { artifactId: "wrong" } }, "run-1", { researcher }));

const prototypeSelection = {
  runId: "run-1", artifactId: "selection-1", stage: "prototype_selection", featureRequestNumber: 4,
  receivedHandoff: { artifactId: "design-1" }, selectedConceptId: "concept-lead", makerHandoff: { artifactId: "selection-1" },
  optionAssessment: designer.concepts.map((concept) => ({ conceptId: concept.id, status: concept.id === "concept-lead" ? "selected_for_prototyping" : "not_selected_for_prototyping" })),
};
validateDownstreamArtifact("prototype_selection", prototypeSelection, "run-1", { researcher, designer });
assert.throws(() => validateDownstreamArtifact("prototype_selection", { ...prototypeSelection, selectedConceptId: "concept-alt" }, "run-1", { researcher, designer }));

const artifacts = { researcher, designer: { ...designer, concepts: [designer.concepts[0]] }, prototypeSelection };
const baselinePackage = getPrototypeBaselinePackage(artifacts.designer.concepts);
const maker = {
  runId: "run-1", artifactId: "maker-1", stage: "maker", featureRequestNumber: 4,
  receivedHandoff: { artifactId: "selection-1" }, communicatorHandoff: { artifactId: "maker-1" },
  prototypes: artifacts.designer.concepts.map((concept) => {
    const baseline = baselinePackage.find((item) => item.conceptId === concept.id);
    return {
    conceptId: concept.id, baselineSurface: concept.baselineSurface,
    baselineSourceId: baseline.sourceId, baselineAnchorsPreserved: baseline.anchors.slice(0, 2),
    implementedDesignElements: ["Example design element"], designTraceability: "Implements the supplied specification.",
    modifications: [{ id: "example-feature", targetAnchor: baseline.anchors[1], placement: "after", purpose: "Add the selected feature in context.", html: '<section data-prototype-element="example-feature" class="prototype-example"><h2>Example proposed feature</h2><p>This custom feature is added to the locked current page copy for isolated testing only.</p><button data-action="toggle" type="button">Test interaction</button><p data-state="result" hidden>Changed prototype state</p></section>' }],
    prototypeCss: '[data-prototype-element="example-feature"]{margin-top:16px;padding:18px;border:2px solid #7c3aed;border-radius:12px;background:#f3effd}.prototype-example button{padding:8px 12px;border:0;border-radius:7px;background:#7c3aed;color:#fff}',
    prototypeScript: 'document.querySelectorAll("[data-prototype-element]").forEach((root)=>{const button=root.querySelector("[data-action=toggle]");const target=root.querySelector("[data-state=result]");if(button&&target)button.addEventListener("click",()=>{target.hidden=!target.hidden;});});',
    };
  }),
};
validateDownstreamArtifact("maker", maker, "run-1", artifacts);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item) => ({ ...item, implementedDesignElements: [] })) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, prototypeScript: `${item.prototypeScript} fetch('https://example.com')` }) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, baselineAnchorsPreserved: ["invented-anchor"] }) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, modifications: item.modifications.map((modification) => ({ ...modification, targetAnchor: "invented-anchor" })) }) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, modifications: item.modifications.map((modification) => ({ ...modification, html: modification.html.replace("<section", "<form").replace("</section>", "</form>") })) }) }, "run-1", artifacts), /blocked token "<form"/);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, modifications: item.modifications.map((modification) => ({ ...modification, html: modification.html.replace("type=\"button\"", "type=\"button\" onclick=\"run()\"") })) }) }, "run-1", artifacts), /blocked token "onclick="/);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, prototypeCss: `body{color:red}${item.prototypeCss}` }) }, "run-1", artifacts));

const communicator = {
  runId: "run-1", artifactId: "communicator-1", stage: "communicator", featureRequestNumber: 4,
  receivedHandoff: { artifactId: "maker-1" }, managerHandoff: { artifactId: "communicator-1" },
  optionBriefs: [{ conceptId: "concept-lead" }],
};
validateDownstreamArtifact("communicator", communicator, "run-1", { researcher, prototypeSelection, maker });

validateDownstreamArtifact("manager", {
  runId: "run-1", stage: "manager", featureRequestNumber: 4, receivedHandoff: { artifactId: "communicator-1" }, recommendedConceptId: "concept-lead",
  ranking: designer.concepts.map((concept, index) => ({ conceptId: concept.id, rank: index + 1 })),
}, "run-1", { researcher, designer, prototypeSelection, maker, communicator });

console.log("Contract checks passed: three-option Manager gate, one selected baseline-locked modification prototype, single-prototype communication and final three-option governance.");
