import assert from "node:assert/strict";
import { validateResearcherArtifact } from "../contracts/researcher.js";
import { validateDownstreamArtifact } from "../contracts/downstream.js";
import { isTransientServiceError, serviceStatus } from "../api/_service-errors.js";
import { stageRepairGuidance, stageRepairUserMessage } from "../api/_stage-repair.js";
import { createMakerRepairToken, readMakerRepairToken } from "../api/_agent-stage.js";
import { getPrototypeBaselinePackage } from "../domain/prototype-baselines.js";
import { createResearchRepairToken, extractMarketResearch, readResearchRepairToken } from "../api/researcher.js";
import { sortIssuesByNumber } from "../api/_github-backlog.js";
import { createStageTiming } from "../api/_stage-timing.js";

assert.equal(serviceStatus(new Error('{"error":{"code":503,"status":"UNAVAILABLE"}}')), 503);
assert.equal(isTransientServiceError(new Error("This model is currently experiencing high demand.")), true);
assert.equal(isTransientServiceError(new Error("Every generated page must provide a complete standalone document.")), false);
assert.equal(isTransientServiceError(new Error("Artifact validation failed: prohibited prototype capability.")), false);
assert.match(stageRepairGuidance("maker", new Error('Artifact validation failed: Blocked token: "mailto:".')), /type=button control/i);
assert.doesNotMatch(stageRepairGuidance("maker", new Error('Artifact validation failed: Blocked token: "mailto:".')), /mailto:/i);
assert.match(stageRepairGuidance("maker", new Error('Artifact validation failed: Maker CSS contains unscoped or baseline selector ".module-header".')), /matching \[data-prototype-element/);
assert.match(stageRepairGuidance("maker", new Error("Artifact validation failed: Maker CSS length 42 is outside the permitted range.")), /between 80 and 12000 characters/);
assert.match(stageRepairGuidance("maker", new Error('Artifact validation failed: Maker modification "stock-alert" must put data-prototype-element="stock-alert" on its HTML root element.')), /Add data-prototype-element="stock-alert" to the first\/root element/);
assert.match(stageRepairGuidance("maker", new Error('Artifact validation failed: Maker modification "stock-alert" has root data-prototype-element "stock-panel"; it must exactly match the modification ID.')), /change the root data-prototype-element value from "stock-panel" to exactly "stock-alert"/);
assert.match(stageRepairGuidance("maker", new Error('Artifact validation failed: Maker modification "stock-alert" HTML length 42 is outside the permitted 80-8000 character range.')), /Rewrite only modification "stock-alert"/);
assert.match(stageRepairGuidance("maker", new Error('Artifact validation failed: Maker modification ID "Stock Alert" must be 2-64 characters of lowercase kebab-case beginning with a letter.')), /lowercase kebab-case/);
assert.match(stageRepairUserMessage("maker", new Error("Artifact validation failed: Maker CSS length 0 is outside the permitted 80-12000 character range.")), /did not include the required scoped styling/);
const previousApiKey = process.env.GEMINI_API_KEY;
process.env.GEMINI_API_KEY = "contract-test-signing-secret";
const researchRepairPayload = { runId: "research-repair-run", stage: "researcher", attempt: 1, deadlineAt: Date.now() + 120_000, selectedIssueNumber: 4, initialUserTurn: { role: "user" }, functionCall: { name: "fetch_selected_feature_request" }, toolRequestContent: { role: "model" }, toolResult: { selectedIssue: { number: 4 } }, retryInstruction: "Search once." };
const researchRepairToken = createResearchRepairToken(researchRepairPayload);
assert.deepEqual(readResearchRepairToken(researchRepairToken), researchRepairPayload);
assert.throws(() => readResearchRepairToken(`${researchRepairToken.slice(0, -1)}x`), /could not be verified/);
const makerRepairPayload = { runId: "repair-run", stage: "maker", attempt: 1, deadlineAt: Date.now() + 120_000, failedArtifact: { prototypes: [{ prototypeCss: "" }] }, validationError: "Artifact validation failed: Maker CSS length 0 is outside the permitted 80-12000 character range." };
const makerRepairToken = createMakerRepairToken(makerRepairPayload);
assert.deepEqual(readMakerRepairToken(makerRepairToken, "repair-run"), makerRepairPayload);
assert.throws(() => readMakerRepairToken(`${makerRepairToken.slice(0, -1)}x`, "repair-run"), /could not be verified/);
assert.throws(() => readMakerRepairToken(makerRepairToken, "different-run"), /did not match this run/);
if (previousApiKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousApiKey;
assert.equal(stageRepairGuidance("designer", new Error('Blocked token: "mailto:".')), "");
assert.equal(isTransientServiceError({ status: 503, message: "Provider unavailable" }), true);
assert.throws(() => extractMarketResearch({ id: "interaction-empty", status: "completed", output_text: "Ungrounded response", steps: [{ type: "model_output", content: [{ type: "text", text: "Ungrounded response" }] }] }), /No Google Search call was observed/);
const groundedResearch = extractMarketResearch({ id: "interaction-grounded", status: "completed", output_text: "Grounded evidence", steps: [
  { type: "google_search_call", id: "search-1", arguments: { queries: ["example query"] } },
  { type: "google_search_result", call_id: "search-1", result: [] },
  { type: "model_output", content: [{ type: "text", text: "Grounded evidence", annotations: [{ type: "url_citation", title: "Official example", url: "https://example.invalid/help" }] }] },
] }, 2);
assert.equal(groundedResearch.receipt.sourceCount, 1);
assert.equal(groundedResearch.receipt.searchCallCount, 1);
assert.equal(groundedResearch.receipt.interactionId, "interaction-grounded");
assert.equal(groundedResearch.receipt.groundingAttempts, 2);
assert.equal(groundedResearch.receipt.attributionMode, "inline_citations");
const resultGroundedResearch = extractMarketResearch({ id: "interaction-result-grounded", status: "completed", output_text: "Grounded from result URLs", steps: [
  { type: "google_search_call", id: "search-result-1", arguments: { query: "single query shape" } },
  { type: "google_search_result", call_id: "search-result-1", result: [{ title: "Official result", url: "https://example.invalid/official" }] },
  { type: "model_output", content: [{ type: "text", text: "Grounded from result URLs" }] },
] });
assert.equal(resultGroundedResearch.receipt.attributionMode, "search_result_urls");
assert.deepEqual(resultGroundedResearch.receipt.searchQueries, ["single query shape"]);
assert.equal(resultGroundedResearch.receipt.sourceCount, 1);
assert.deepEqual(sortIssuesByNumber([{ number: 2 }, { number: 1 }, { number: 11 }, { number: 3 }]).map((issue) => issue.number), [1, 2, 3, 11]);
const timing = createStageTiming("maker", "timing-contract-run");
const measuredTimeout = await timing.measure("contract_test", 1, async (timeoutMs) => timeoutMs);
assert.ok(measuredTimeout > 200_000 && measuredTimeout <= 210_000);
const timingDiagnostics = timing.finish("complete");
assert.equal(timingDiagnostics.outcome, "complete");
assert.equal(timingDiagnostics.calls.length, 1);
assert.equal(timingDiagnostics.calls[0].outcome, "complete");

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
assert.doesNotThrow(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item) => ({ ...item, modifications: item.modifications.map((modification) => ({ ...modification, html: modification.html.replace(`data-prototype-element="${modification.id}"`, `data-prototype-element='${modification.id}'`) })) })) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item) => ({ ...item, modifications: item.modifications.map((modification) => ({ ...modification, id: "Stock Alert" })) })) }, "run-1", artifacts), /lowercase kebab-case/);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item) => ({ ...item, modifications: item.modifications.map((modification) => ({ ...modification, html: modification.html.replace(` data-prototype-element="${modification.id}"`, "") })) })) }, "run-1", artifacts), /must put data-prototype-element="example-feature" on its HTML root element/);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item) => ({ ...item, modifications: item.modifications.map((modification) => ({ ...modification, html: modification.html.replace(`data-prototype-element="${modification.id}"`, 'data-prototype-element="different-feature"') })) })) }, "run-1", artifacts), /has root data-prototype-element "different-feature"/);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item) => ({ ...item, modifications: item.modifications.map((modification) => ({ ...modification, html: `<section data-prototype-element="${modification.id}">Short</section>` })) })) }, "run-1", artifacts), /HTML length \d+ is outside/);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item) => ({ ...item, implementedDesignElements: [] })) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, prototypeScript: `${item.prototypeScript} fetch('https://example.com')` }) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, prototypeScript: `${item.prototypeScript} const unsafeEmailProtocol = "mailto:";` }) }, "run-1", artifacts), /Blocked token: "mailto:"/);
assert.doesNotThrow(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, prototypeScript: `${item.prototypeScript} document.querySelectorAll("[data-prototype-element]").forEach((root)=>{root.dataset.emailState="compose-preview";});` }) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, baselineAnchorsPreserved: ["invented-anchor"] }) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, modifications: item.modifications.map((modification) => ({ ...modification, targetAnchor: "invented-anchor" })) }) }, "run-1", artifacts));
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, modifications: item.modifications.map((modification) => ({ ...modification, html: modification.html.replace("<section", "<form").replace("</section>", "</form>") })) }) }, "run-1", artifacts), /blocked token "<form"/);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, modifications: item.modifications.map((modification) => ({ ...modification, html: modification.html.replace("type=\"button\"", "type=\"button\" onclick=\"run()\"") })) }) }, "run-1", artifacts), /blocked token "onclick="/);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, prototypeCss: `body{color:red}${item.prototypeCss}` }) }, "run-1", artifacts), /unscoped or baseline selector "body"/);
assert.throws(() => validateDownstreamArtifact("maker", { ...maker, prototypes: maker.prototypes.map((item, index) => index ? item : { ...item, prototypeCss: ".prototype-x{color:red}" }) }, "run-1", artifacts), /CSS length \d+ is outside/);

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
