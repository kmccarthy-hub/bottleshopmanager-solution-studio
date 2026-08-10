export const researcherOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    runId: { type: "string" },
    artifactId: { type: "string" },
    stage: { type: "string", enum: ["researcher"] },
    aiDisclosure: { type: "string" },
    toolReceiptId: { type: "string" },
    datasetAssessment: {
      type: "object",
      additionalProperties: false,
      properties: {
        usableIssueCount: { type: "integer" },
        summary: { type: "string" },
        limitations: { type: "array", items: { type: "string" } },
        contradictions: { type: "array", items: { type: "string" } },
      },
      required: ["usableIssueCount", "summary", "limitations", "contradictions"],
    },
    opportunities: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          problemStatement: { type: "string" },
          evidenceIssueNumbers: {
            type: "array",
            minItems: 1,
            items: { type: "integer" },
          },
          frequencySummary: { type: "string" },
          severitySummary: { type: "string" },
          breadthSummary: { type: "string" },
          recencySummary: { type: "string" },
          confidence: { type: "string", enum: ["low", "medium", "high"] },
          assumptions: { type: "array", items: { type: "string" } },
          researchQuestions: { type: "array", items: { type: "string" } },
        },
        required: [
          "id",
          "title",
          "problemStatement",
          "evidenceIssueNumbers",
          "frequencySummary",
          "severitySummary",
          "breadthSummary",
          "recencySummary",
          "confidence",
          "assumptions",
          "researchQuestions",
        ],
      },
    },
    provisionalRanking: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: { type: "string" },
    },
    leadOpportunityId: { type: "string" },
    leadRationale: { type: "string" },
    handoffSummary: { type: "string" },
  },
  required: [
    "runId",
    "artifactId",
    "stage",
    "aiDisclosure",
    "toolReceiptId",
    "datasetAssessment",
    "opportunities",
    "provisionalRanking",
    "leadOpportunityId",
    "leadRationale",
    "handoffSummary",
  ],
};

export function validateResearcherArtifact(artifact, issues, runId, receiptId) {
  if (!artifact || typeof artifact !== "object") {
    throw new Error("The Researcher did not return a JSON object.");
  }

  if (artifact.runId !== runId || artifact.toolReceiptId !== receiptId) {
    throw new Error("The Researcher did not preserve the run and tool receipt identifiers.");
  }

  if (!Array.isArray(artifact.opportunities) || artifact.opportunities.length !== 3) {
    throw new Error("The Researcher must return exactly three opportunities.");
  }

  const issueNumbers = new Set(issues.map((issue) => issue.number));
  const opportunityIds = new Set(artifact.opportunities.map((item) => item.id));

  for (const opportunity of artifact.opportunities) {
    if (!Array.isArray(opportunity.evidenceIssueNumbers) || opportunity.evidenceIssueNumbers.length === 0) {
      throw new Error(`Opportunity ${opportunity.id} has no source evidence.`);
    }

    for (const issueNumber of opportunity.evidenceIssueNumbers) {
      if (!issueNumbers.has(issueNumber)) {
        throw new Error(`Opportunity ${opportunity.id} cites issue #${issueNumber}, which was not returned by the live tool.`);
      }
    }
  }

  if (!opportunityIds.has(artifact.leadOpportunityId)) {
    throw new Error("The lead opportunity is not one of the three researched opportunities.");
  }

  if (
    !Array.isArray(artifact.provisionalRanking) ||
    artifact.provisionalRanking.length !== 3 ||
    artifact.provisionalRanking.some((id) => !opportunityIds.has(id))
  ) {
    throw new Error("The provisional ranking must contain the three researched opportunity identifiers.");
  }
}
