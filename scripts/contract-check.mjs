import assert from "node:assert/strict";
import { validateResearcherArtifact } from "../contracts/researcher.js";
import { validateDownstreamArtifact } from "../contracts/downstream.js";

const issues = [{ number: 1 }, { number: 2 }, { number: 3 }];
const researcher = {
  runId: "run-1",
  toolReceiptId: "receipt-1",
  opportunities: [
    { id: "opp-1", evidenceIssueNumbers: [1] },
    { id: "opp-2", evidenceIssueNumbers: [2] },
    { id: "opp-3", evidenceIssueNumbers: [3] },
  ],
  leadOpportunityId: "opp-1",
  provisionalRanking: ["opp-1", "opp-2", "opp-3"],
};

validateResearcherArtifact(researcher, issues, "run-1", "receipt-1");
assert.throws(() => validateResearcherArtifact({ ...researcher, leadOpportunityId: "invented" }, issues, "run-1", "receipt-1"));
assert.throws(() => validateResearcherArtifact({ ...researcher, opportunities: [{ id: "opp-1", evidenceIssueNumbers: [99] }] }, issues, "run-1", "receipt-1"));

const artifacts = {
  researcher,
  designer: { selectedOpportunityId: "opp-1" },
  maker: { selectedOpportunityId: "opp-1" },
  communicator: { selectedOpportunityId: "opp-1" },
};

validateDownstreamArtifact("manager", {
  runId: "run-1",
  stage: "manager",
  finalAction: "validate",
  ranking: [
    { opportunityId: "opp-2" },
    { opportunityId: "opp-1" },
    { opportunityId: "opp-3" },
  ],
}, "run-1", artifacts);

assert.throws(() => validateDownstreamArtifact("manager", {
  runId: "run-1",
  stage: "manager",
  finalAction: "build",
  ranking: [
    { opportunityId: "opp-2" },
    { opportunityId: "opp-1" },
    { opportunityId: "opp-3" },
  ],
}, "run-1", artifacts));

assert.throws(() => validateDownstreamArtifact("maker", {
  runId: "run-1",
  stage: "maker",
  selectedOpportunityId: "opp-1",
  screens: [
    { id: "one", components: [{ body: "Send JIRA-8420 when adoption reaches 80%." }] },
    { id: "two", components: [] },
    { id: "three", components: [] },
  ],
}, "run-1", artifacts));

console.log("Contract checks passed: traceability, three-opportunity ranking and build governance.");
