import { useEffect, useState } from "react";

const stages = [
  { number: "01", key: "researcher", role: "Researcher", name: "Maeve O'Connell", accent: "cyan", output: "Live request + information-quality brief" },
  { number: "02", key: "designer", role: "Designer", name: "Jonas Berg", accent: "violet", output: "Focused, integrated + exploratory concepts" },
  { number: "03", key: "maker", role: "Maker", name: "Priya Shah", accent: "coral", output: "Three comparable interactive prototypes" },
  { number: "04", key: "communicator", role: "Communicator", name: "Niamh Doyle", accent: "amber", output: "Three decision-ready option briefs" },
  { number: "05", key: "manager", role: "Manager", name: "Elias Grant", accent: "blue", output: "Ranked recommendation + backlog questions" },
] as const;

type StageKey = typeof stages[number]["key"];
type StageStatus = "idle" | "running" | "complete" | "error";
type BacklogIssue = { number: number; title: string; state: string; labels: string[]; updatedAt: string; sourceUrl: string; body: string };
type Gap = { category: string; missingInformation: string; whyItMatters: string; questionForProductManager: string; sourceAgents?: string[] };
type ResearcherArtifact = { featureRequest: { issueNumber: number; title: string; sourceUrl: string; summary: string }; requestAssessment: { completeness: "low" | "medium" | "high"; confidenceRationale: string; knownFacts: string[]; missingInformation: Gap[] }; problemFrame: { primaryUser: string; problemStatement: string; desiredOutcome: string }; handoffSummary: string };
type Concept = { id: string; lens: "focused" | "integrated" | "exploratory"; title: string; oneLineSummary: string; intendedUser: string; evidenceFit: string; assumptions: string[]; tradeoffs: string[]; risks: string[] };
type DesignerArtifact = { concepts: Concept[]; conceptDistinctness: string; informationGaps: Gap[]; handoffSummary: string };
type PrototypeComponent = { id: string; type: string; title: string; body: string; label: string; action: { type: string; target: string } | null };
type Prototype = { conceptId: string; title: string; purpose: string; testableAssumption: string; components: PrototypeComponent[]; exceptionalState: string; limitations: string[] };
type MakerArtifact = { prototypes: Prototype[]; informationGaps: Gap[] };
type OptionBrief = { conceptId: string; headline: string; executiveSummary: string; intendedUser: string; valueProposition: string; strengths: string[]; risks: string[]; prototypeExplanation: string };
type CommunicatorArtifact = { optionBriefs: OptionBrief[]; comparisonSummary: string; informationGaps: Gap[] };
type Ranking = { rank: number; conceptId: string; title: string; lens: string; confidence: string; complexity: string; executiveSummary: string; agentContributions: { researcher: string; designer: string; maker: string; communicator: string } };
type ManagerArtifact = { requestReadiness: "ready_for_concept_validation" | "needs_backlog_enrichment"; informationQualitySummary: string; consolidatedInformationGaps: Gap[]; ranking: Ranking[]; recommendedConceptId: string; recommendation: string; recommendationStrength: string; whatWouldChangeRecommendation: string[]; accountableHumanRole: string; suggestedNextStep: string; finalDisclosure: string };
type Artifacts = { researcher?: ResearcherArtifact; designer?: DesignerArtifact; maker?: MakerArtifact; communicator?: CommunicatorArtifact; manager?: ManagerArtifact };

const initialStatuses: Record<StageKey, StageStatus> = { researcher: "idle", designer: "idle", maker: "idle", communicator: "idle", manager: "idle" };
const lensCopy = { focused: "Smallest credible intervention", integrated: "Connected operational workflow", exploratory: "Ambitious, higher-uncertainty direction" };
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, "");

export default function Home() {
  const [backlog, setBacklog] = useState<BacklogIssue[]>([]);
  const [backlogState, setBacklogState] = useState<"loading" | "ready" | "error" | "preview">(API_BASE_URL ? "loading" : "preview");
  const [backlogError, setBacklogError] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [statuses, setStatuses] = useState(initialStatuses);
  const [activeStage, setActiveStage] = useState(0);
  const [artifacts, setArtifacts] = useState<Artifacts>({});
  const [toolReceipt, setToolReceipt] = useState<{ completedAt: string; responseStatus: number; selectedIssueNumber: number; backlogIssueCount: number; returnedCommentCount: number } | null>(null);
  const [runError, setRunError] = useState("");
  const [prototypeId, setPrototypeId] = useState("");
  const [expandedComponent, setExpandedComponent] = useState("");
  const apiBaseUrl = API_BASE_URL;
  const selectedIssue = backlog.find((issue) => issue.number === selectedNumber);
  const runActive = Object.values(statuses).includes("running");

  useEffect(() => {
    if (!apiBaseUrl) return;
    let cancelled = false;
    fetch(`${apiBaseUrl}/api/backlog`, { cache: "no-store" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "The live backlog could not be loaded."); return payload; })
      .then((payload) => { if (!cancelled) { setBacklog(payload.issues); setSelectedNumber(payload.issues[0]?.number ?? null); setBacklogState("ready"); } })
      .catch((error) => { if (!cancelled) { setBacklogState("error"); setBacklogError(error instanceof Error ? error.message : "The live backlog could not be loaded."); } });
    return () => { cancelled = true; };
  }, [apiBaseUrl]);

  function setStageStatus(key: StageKey, status: StageStatus) { setStatuses((current) => ({ ...current, [key]: status })); }

  async function postStage(key: StageKey, body: object) {
    const response = await fetch(`${apiBaseUrl}/api/${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `${key} could not complete.`);
    return payload;
  }

  async function exploreSolutions() {
    if (!apiBaseUrl || !selectedNumber) return;
    setRunError(""); setArtifacts({}); setStatuses(initialStatuses); setToolReceipt(null); setPrototypeId(""); setExpandedComponent("");
    let currentStage: StageKey = "researcher";
    try {
      setActiveStage(0); setStageStatus("researcher", "running");
      const research = await postStage("researcher", { featureRequestNumber: selectedNumber });
      const next: Artifacts = { researcher: research.artifact };
      setArtifacts(next); setToolReceipt(research.toolReceipt); setStageStatus("researcher", "complete");
      for (const key of ["designer", "maker", "communicator", "manager"] as StageKey[]) {
        currentStage = key; setActiveStage(stages.findIndex((item) => item.key === key)); setStageStatus(key, "running");
        const result = await postStage(key, { runId: research.runId, artifacts: next });
        next[key] = result.artifact; setArtifacts({ ...next }); setStageStatus(key, "complete");
        if (key === "maker") setPrototypeId(result.artifact.prototypes[0].conceptId);
      }
    } catch (error) {
      setStageStatus(currentStage, "error"); setRunError(error instanceof Error ? error.message : "The agent chain stopped unexpectedly.");
    }
  }

  const currentPrototype = artifacts.maker?.prototypes.find((item) => item.conceptId === prototypeId) ?? artifacts.maker?.prototypes[0];
  const recommended = artifacts.manager?.ranking.find((item) => item.conceptId === artifacts.manager?.recommendedConceptId);

  return <main className="app-shell bsm-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <a className="brand" href="#top" aria-label="BottleShopManager Solution Studio home"><span className="bsm-mark" aria-hidden="true"><i /><i /><i /></span><span>BottleShopManager</span><span className="product-name">Solution Studio</span></a>
      <div className="topbar-meta"><span className="disclosure-pill"><span className="spark">✦</span>AI-assisted exploration</span><span className="synthetic-pill">Synthetic academic backlog</span><a className="text-link" href="#pipeline">Five-agent method</a></div>
    </header>

    <section className="studio-hero" id="top">
      <div className="studio-copy"><p className="eyebrow"><span /> Internal product concept studio</p><h1>Explore a backlog request from <em>three angles</em> before committing.</h1><p className="hero-lede">Select one live BottleShopManager feature request. Five specialised AI agents investigate its quality, build three solution concepts and provide one advisory recommendation—while the Product Manager keeps the decision.</p><div className="studio-principles"><span>Live GitHub backlog</span><span>Three comparable prototypes</span><span>Information gaps made visible</span></div></div>

      <aside className="request-selector" aria-label="Select a live backlog request">
        <div className="selector-head"><div><span className="card-kicker">Live BottleShopManager backlog</span><h2>Choose a feature request</h2></div><span className={`source-state source-${backlogState}`}>{backlogState === "ready" ? `${backlog.length} live requests` : backlogState}</span></div>
        {backlogState === "ready" && <><label htmlFor="feature-request">Feature request</label><select id="feature-request" value={selectedNumber ?? ""} onChange={(event) => setSelectedNumber(Number(event.target.value))} disabled={runActive}>{backlog.map((issue) => <option key={issue.number} value={issue.number}>#{issue.number} · {issue.title}</option>)}</select></>}
        {backlogState === "loading" && <div className="selector-message">Connecting to the current GitHub backlog…</div>}
        {backlogState === "preview" && <div className="selector-message"><strong>Interface preview</strong><br />Connect the deployed API to load the live backlog. No request has been hardcoded.</div>}
        {backlogState === "error" && <div className="selector-message error"><strong>Backlog unavailable</strong><br />{backlogError}</div>}
        {selectedIssue && <div className="selected-request"><div><span>Selected live issue</span><strong>#{selectedIssue.number} · {selectedIssue.title}</strong></div><a href={selectedIssue.sourceUrl} target="_blank" rel="noreferrer">View source ↗</a><p>{selectedIssue.body.replace(/[*#>]/g, " ").replace(/\s+/g, " ").slice(0, 250)}…</p></div>}
        <button className="primary-button studio-button" type="button" onClick={exploreSolutions} disabled={runActive || backlogState !== "ready" || !selectedNumber}>{runActive ? `${stages[activeStage].role} is working…` : artifacts.manager ? "Run this request again" : "Explore three solutions"}<span aria-hidden="true">→</span></button>
        <p className="decision-note">No feature, roadmap or investment decision is written back.</p>
        {runError && <div className="run-error" role="alert"><strong>Pipeline stopped at {stages[activeStage].role}:</strong> {runError}</div>}
      </aside>
    </section>

    <section className="pipeline-section" id="pipeline">
      <div className="section-heading"><div><p className="eyebrow"><span /> Cumulative handoffs</p><h2>Five viewpoints. One traceable recommendation.</h2></div><p>Every agent receives all validated work produced before it. Missing information accumulates instead of disappearing between stages.</p></div>
      <div className="studio-pipeline">
        {stages.map((item, index) => <button key={item.key} type="button" className={`pipeline-node ${index === activeStage ? "active" : ""}`} onClick={() => setActiveStage(index)} aria-pressed={index === activeStage}><span className={`stage-orb ${item.accent}`}>{item.number}</span><span><strong>{item.role}</strong><small>{item.name}</small></span><span className={`stage-status status-${statuses[item.key]}`}>{statuses[item.key]}</span><p>{item.output}</p></button>)}
      </div>
      <div className="pipeline-boundary"><div><strong>{stages[activeStage].role}</strong><span>AI-generated · verify before use</span></div><p>{activeStage === 4 ? "Provides an advisory recommendation and backlog-improvement questions. The Product Manager retains the final decision." : "Cannot approve work, change the backlog or bypass the next evidence handoff."}</p></div>
    </section>

    {artifacts.researcher && <section className="results-section studio-results" aria-live="polite">
      <div className="section-heading"><div><p className="eyebrow"><span /> Selected request analysis</p><h2>{artifacts.researcher.featureRequest.title}</h2></div><p>All content below is AI-generated from the selected live GitHub issue and cumulative agent artefacts.</p></div>

      <div className="research-grid">
        <article className="request-quality"><div className="panel-heading"><div><span className="card-kicker">Researcher · request readiness</span><h3>{artifacts.researcher.requestAssessment.completeness} information quality</h3></div><span className={`quality-chip quality-${artifacts.researcher.requestAssessment.completeness}`}>{artifacts.researcher.requestAssessment.missingInformation.length} gaps</span></div><p>{artifacts.researcher.requestAssessment.confidenceRationale}</p><dl><div><dt>Primary user</dt><dd>{artifacts.researcher.problemFrame.primaryUser}</dd></div><div><dt>Problem</dt><dd>{artifacts.researcher.problemFrame.problemStatement}</dd></div><div><dt>Desired outcome</dt><dd>{artifacts.researcher.problemFrame.desiredOutcome}</dd></div></dl></article>
        <aside className="live-receipt"><span className="card-kicker">Agent-requested tool receipt</span><div className="tool-name"><code>fetch_selected_feature_request</code><strong>{toolReceipt ? "Completed" : "Waiting"}</strong></div><div className="receipt-list"><div><span>Selected issue</span><strong>{toolReceipt ? `#${toolReceipt.selectedIssueNumber}` : "—"}</strong></div><div><span>Backlog context</span><strong>{toolReceipt ? `${toolReceipt.backlogIssueCount} live requests` : "—"}</strong></div><div><span>Comments retrieved</span><strong>{toolReceipt?.returnedCommentCount ?? "—"}</strong></div><div><span>GitHub response</span><strong>{toolReceipt ? `HTTP ${toolReceipt.responseStatus}` : "—"}</strong></div><div><span>Query time</span><strong>{toolReceipt ? new Date(toolReceipt.completedAt).toLocaleString("en-IE") : "—"}</strong></div></div></aside>
      </div>

      {artifacts.designer && <><div className="result-section-title"><span>Designer output</span><h3>Three deliberately different solution directions</h3><p>{artifacts.designer.conceptDistinctness}</p></div><div className="concept-grid">{artifacts.designer.concepts.map((concept) => <article className={`concept-card lens-${concept.lens}`} key={concept.id}><div className="concept-top"><span>{concept.lens}</span><small>{lensCopy[concept.lens]}</small></div><h3>{concept.title}</h3><p>{concept.oneLineSummary}</p><div className="concept-meta"><span>Evidence fit</span><strong>{concept.evidenceFit}</strong></div><details><summary>Assumptions and trade-offs</summary><ul>{[...concept.assumptions, ...concept.tradeoffs].map((item) => <li key={item}>{item}</li>)}</ul></details></article>)}</div></>}

      {artifacts.maker && currentPrototype && <article className="result-panel prototype-panel"><div className="panel-heading"><div><span className="card-kicker">Maker · three AI-generated prototypes</span><h3>Compare the operational moment</h3></div><span className="generated-chip">Synthetic prototype · not production</span></div><div className="prototype-shell studio-prototype"><nav aria-label="Solution prototypes">{artifacts.maker.prototypes.map((prototype) => { const concept = artifacts.designer?.concepts.find((item) => item.id === prototype.conceptId); return <button type="button" key={prototype.conceptId} className={prototype.conceptId === currentPrototype.conceptId ? "active" : ""} onClick={() => { setPrototypeId(prototype.conceptId); setExpandedComponent(""); }}><span>{concept?.lens}</span>{prototype.title}</button>; })}</nav><div className="prototype-intro"><div><span className="card-kicker">Assumption under test</span><h4>{currentPrototype.title}</h4><p>{currentPrototype.testableAssumption}</p></div><p>{currentPrototype.purpose}</p></div><div className="prototype-canvas">{currentPrototype.components.map((component) => <button type="button" className={`prototype-component component-${component.type} ${expandedComponent === component.id ? "selected" : ""}`} key={component.id} disabled={!component.action} onClick={() => setExpandedComponent(expandedComponent === component.id ? "" : component.id)}><span>{component.type}</span><strong>{component.title || component.label}</strong><p>{component.body}</p>{component.action && <small>{component.label || component.action.type} →</small>}</button>)}</div><div className="prototype-limit"><strong>What this does not prove</strong><p>{currentPrototype.limitations.join(" · ")}</p></div></div></article>}

      {artifacts.communicator && <article className="result-panel"><div className="panel-heading"><div><span className="card-kicker">Communicator · internal AI draft</span><h3>Decision briefs, not launch promises</h3></div><span className="draft-chip">Draft · internal only</span></div><p>{artifacts.communicator.comparisonSummary}</p><div className="brief-grid">{artifacts.communicator.optionBriefs.map((brief) => <div key={brief.conceptId}><span>{artifacts.designer?.concepts.find((item) => item.id === brief.conceptId)?.lens}</span><strong>{brief.headline}</strong><p>{brief.executiveSummary}</p></div>)}</div></article>}

      {artifacts.manager && <article className="result-panel manager-panel"><div className="panel-heading"><div><span className="card-kicker">Manager · advisory AI recommendation</span><h3>{artifacts.manager.requestReadiness === "needs_backlog_enrichment" ? "Improve the request before relying on the concepts" : `Recommended direction: ${recommended?.title}`}</h3></div><span className="human-chip">Product Manager decides</span></div><p className="manager-recommendation">{artifacts.manager.recommendation}</p><div className="ranking-table studio-ranking">{artifacts.manager.ranking.map((item) => <details key={item.conceptId} open={item.rank === 1}><summary><span className="rank-number">{item.rank}</span><div><strong>{item.title}</strong><small>{item.lens} · {item.confidence} confidence · {item.complexity}</small></div><span>{item.rank === 1 ? `${artifacts.manager?.recommendationStrength} recommendation` : "View executive summary"}</span></summary><p>{item.executiveSummary}</p><div className="contribution-grid"><div><span>Researcher</span><p>{item.agentContributions.researcher}</p></div><div><span>Designer</span><p>{item.agentContributions.designer}</p></div><div><span>Maker</span><p>{item.agentContributions.maker}</p></div><div><span>Communicator</span><p>{item.agentContributions.communicator}</p></div></div></details>)}</div><div className="manager-next"><div><span>Accountable human</span><strong>{artifacts.manager.accountableHumanRole}</strong></div><div><span>Suggested next step</span><strong>{artifacts.manager.suggestedNextStep}</strong></div><div><span>Decision boundary</span><strong>No selection or backlog change is made here.</strong></div></div><p className="final-disclosure">{artifacts.manager.finalDisclosure}</p></article>}

      {artifacts.manager && <article className="gap-panel"><div className="panel-heading"><div><span className="card-kicker">Cumulative information-gap tracker</span><h3>Improve the backlog request, then run it again.</h3></div><span className="gap-count">{artifacts.manager.consolidatedInformationGaps.length} questions</span></div><p>{artifacts.manager.informationQualitySummary}</p>{artifacts.manager.consolidatedInformationGaps.length ? <div className="gap-list">{artifacts.manager.consolidatedInformationGaps.map((gap, index) => <div key={`${gap.category}-${index}`}><span>{gap.category}</span><div><strong>{gap.questionForProductManager}</strong><p>{gap.whyItMatters}</p><small>Raised by: {gap.sourceAgents?.join(", ")}</small></div></div>)}</div> : <div className="no-gaps">No critical information gaps remained in this run. Validate the assumptions with real users before commitment.</div>}</article>}
    </section>}

    <footer><span>BottleShopManager · Solution Studio</span><span>Fictional Irish B2B retail platform · Synthetic academic prototype</span><span>AI advises · Product Manager decides</span></footer>
  </main>;
}
