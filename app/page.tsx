import { useEffect, useState } from "react";
import BottleShopPlatform from "./bottle-shop-platform";
import PrototypeRenderer, { type InteractivePrototype } from "./prototype-renderer";

const stages = [
  { number: "01", key: "researcher", role: "Researcher", name: "Maeve O'Connell", accent: "cyan", output: "Live request + market opportunity brief" },
  { number: "02", key: "designer", role: "Designer", name: "Jonas Berg", accent: "violet", output: "Three research-informed design specifications" },
  { number: "03", key: "maker", role: "Maker", name: "Priya Shah", accent: "coral", output: "Three generated current-page prototypes" },
  { number: "04", key: "communicator", role: "Communicator", name: "Niamh Doyle", accent: "amber", output: "Three decision-ready option briefs" },
  { number: "05", key: "manager", role: "Manager", name: "Elias Grant", accent: "blue", output: "Ranked recommendation + backlog questions" },
] as const;

type StageKey = typeof stages[number]["key"];
type StageStatus = "idle" | "running" | "complete" | "error";
type BacklogIssue = { number: number; title: string; state: string; labels: string[]; updatedAt: string; sourceUrl: string; body: string };
type Gap = { category: string; missingInformation: string; whyItMatters: string; questionForProductManager: string; sourceAgents?: string[] };
type Handoff = { from: string; artifactId: string; summary: string };
type ResearcherArtifact = { artifactId: string; receivedHandoff?: undefined; featureRequest: { issueNumber: number; title: string; sourceUrl: string; summary: string }; requestAssessment: { completeness: "low" | "medium" | "high"; confidenceRationale: string; knownFacts: string[]; missingInformation: Gap[] }; currentProductAnalysis: { currentStateSummary: string }; problemFrame: { primaryUser: string; problemStatement: string; desiredOutcome: string }; marketResearch: { findings: { id: string; pattern: string; applicability: string }[]; sources: { id: string; title: string; url: string }[] }; opportunityAnalysis: { problemsWorthSolving: string[]; researchBackedPossibilities: string[] }; designerHandoff: { summary: string }; handoffSummary: string };
type Concept = { id: string; lens: "recommended_approach" | "alternative_approach" | "variation_extended_approach"; title: string; oneLineSummary: string; intendedUser: string; baselineSurface: string; currentWorkflowReference: string; researchFindingIds: string[]; designRationale: string; keyCapabilities: string[]; screenSpecifications: { name: string; purpose: string }[]; makerInstructions: string[]; evidenceFit: string; assumptions: string[]; tradeoffs: string[]; risks: string[] };
type DesignerArtifact = { artifactId: string; receivedHandoff: Handoff; concepts: Concept[]; relationshipBetweenApproaches: string; informationGaps: Gap[]; handoffSummary: string };
type MakerArtifact = { artifactId: string; receivedHandoff: Handoff; prototypes: InteractivePrototype[]; informationGaps: Gap[] };
type OptionBrief = { conceptId: string; headline: string; executiveSummary: string; intendedUser: string; changesInvolved: string[]; userImpact: string; operationalImpact: string; implementationEffort: "low" | "medium" | "high"; effortDrivers: string[]; valueProposition: string; strengths: string[]; risks: string[]; prototypeExplanation: string };
type CommunicatorArtifact = { artifactId: string; receivedHandoff: Handoff; optionBriefs: OptionBrief[]; comparisonSummary: string; informationGaps: Gap[] };
type Ranking = { rank: number; conceptId: string; title: string; lens: string; confidence: string; complexity: string; executiveSummary: string; agentContributions: { researcher: string; designer: string; maker: string; communicator: string } };
type ManagerArtifact = { artifactId: string; receivedHandoff: Handoff; handoffAudit: string; strategicAlignmentSummary: string; requestReadiness: "ready_for_concept_validation" | "needs_backlog_enrichment"; informationQualitySummary: string; consolidatedInformationGaps: Gap[]; ranking: Ranking[]; recommendedConceptId: string; recommendation: string; recommendationStrength: string; whatWouldChangeRecommendation: string[]; accountableHumanRole: string; suggestedNextStep: string; finalDisclosure: string };
type Artifacts = { researcher?: ResearcherArtifact; designer?: DesignerArtifact; maker?: MakerArtifact; communicator?: CommunicatorArtifact; manager?: ManagerArtifact };

const initialStatuses: Record<StageKey, StageStatus> = { researcher: "idle", designer: "idle", maker: "idle", communicator: "idle", manager: "idle" };
const lensCopy = { recommended_approach: "Designer's strongest research-informed response", alternative_approach: "Credible alternative workflow or emphasis", variation_extended_approach: "Variation or extension of a strong direction" };
const lensLabel = { recommended_approach: "Recommended approach", alternative_approach: "Alternative approach", variation_extended_approach: "Variation / extended approach" };
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, "");
const formatGapCategory = (category: string) => category.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function Home() {
  const [workspaceView, setWorkspaceView] = useState<"studio" | "platform">("studio");
  const [backlog, setBacklog] = useState<BacklogIssue[]>([]);
  const [backlogState, setBacklogState] = useState<"loading" | "ready" | "error" | "preview">(API_BASE_URL ? "loading" : "preview");
  const [backlogError, setBacklogError] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [statuses, setStatuses] = useState(initialStatuses);
  const [activeStage, setActiveStage] = useState(0);
  const [artifacts, setArtifacts] = useState<Artifacts>({});
  const [toolReceipt, setToolReceipt] = useState<{ completedAt: string; responseStatus: number; selectedIssueNumber: number; backlogIssueCount: number; returnedCommentCount: number } | null>(null);
  const [marketResearchReceipt, setMarketResearchReceipt] = useState<{ completedAt: string; sourceCount: number; searchQueries: string[]; sources: { id: string; title: string; url: string }[] } | null>(null);
  const [runError, setRunError] = useState("");
  const [retryNotice, setRetryNotice] = useState("");
  const [prototypeId, setPrototypeId] = useState("");
  const apiBaseUrl = API_BASE_URL;
  const selectedIssue = backlog.find((issue) => issue.number === selectedNumber);
  const runActive = Object.values(statuses).includes("running");
  const activeArtifact = artifacts[stages[activeStage].key];

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
    const retryDelays = [0, 5000, 12000, 20000];
    for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
      if (retryDelays[attempt]) {
        setRetryNotice(`${stages.find((stage) => stage.key === key)?.role} AI service is busy. Automatic retry ${attempt} of ${retryDelays.length - 1}…`);
        await new Promise((resolve) => window.setTimeout(resolve, retryDelays[attempt]));
      }
      try {
        const response = await fetch(`${apiBaseUrl}/api/${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const payload = await response.json().catch(() => ({ error: `${key} returned an unreadable response.`, retryable: [502, 503, 504].includes(response.status) }));
        if (response.ok) { setRetryNotice(""); return payload; }
        if (!payload.retryable || attempt === retryDelays.length - 1) { setRetryNotice(""); throw new Error(payload.error ?? `${key} could not complete.`); }
      } catch (error) {
        if (error instanceof TypeError && attempt < retryDelays.length - 1) {
          setRetryNotice(`${stages.find((stage) => stage.key === key)?.role} request was interrupted before a response was readable. Retrying this stage automatically…`);
          continue;
        }
        setRetryNotice("");
        if (error instanceof TypeError) throw new Error("The AI service remained unavailable after automatic retries. Please wait a few minutes and start a new run.");
        throw error;
      }
    }
    throw new Error(`${key} could not complete after automatic retries.`);
  }

  async function exploreSolutions() {
    if (!apiBaseUrl || !selectedNumber) return;
    setRunError(""); setRetryNotice(""); setArtifacts({}); setStatuses(initialStatuses); setToolReceipt(null); setMarketResearchReceipt(null); setPrototypeId("");
    let currentStage: StageKey = "researcher";
    try {
      setActiveStage(0); setStageStatus("researcher", "running");
      const research = await postStage("researcher", { featureRequestNumber: selectedNumber });
      const next: Artifacts = { researcher: research.artifact };
      setArtifacts(next); setToolReceipt(research.toolReceipt); setMarketResearchReceipt(research.marketResearchReceipt); setStageStatus("researcher", "complete");
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
      <div className="topbar-meta"><div className="workspace-switch" aria-label="Choose BottleShopManager workspace"><button type="button" className={workspaceView === "platform" ? "active" : ""} onClick={() => setWorkspaceView("platform")}>Current platform</button><button type="button" className={workspaceView === "studio" ? "active" : ""} onClick={() => setWorkspaceView("studio")}>Solution Studio</button></div><span className="disclosure-pill"><span className="spark">✦</span>AI-assisted exploration</span><span className="synthetic-pill">Synthetic academic backlog</span></div>
    </header>

    {workspaceView === "platform" ? <BottleShopPlatform onOpenStudio={() => setWorkspaceView("studio")} /> : <>
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
        {retryNotice && <div className="retry-notice" role="status"><strong>Temporary AI demand</strong><br />{retryNotice}</div>}
        {runError && <div className="run-error" role="alert"><strong>Pipeline stopped at {stages[activeStage].role}:</strong> {runError}</div>}
      </aside>
    </section>

    <section className="pipeline-section" id="pipeline">
      <div className="section-heading"><div><p className="eyebrow"><span /> Cumulative handoffs</p><h2>Five viewpoints. One traceable recommendation.</h2></div><p>Every agent receives all validated work produced before it. Missing information accumulates instead of disappearing between stages.</p></div>
      <div className="studio-pipeline">
        {stages.map((item, index) => <button key={item.key} type="button" className={`pipeline-node ${index === activeStage ? "active" : ""}`} onClick={() => setActiveStage(index)} aria-pressed={index === activeStage}><span className={`stage-orb ${item.accent}`}>{item.number}</span><span><strong>{item.role}</strong><small>{item.name}</small></span><span className={`stage-status status-${statuses[item.key]}`}>{statuses[item.key]}</span><p>{item.output}</p></button>)}
      </div>
      <div className="pipeline-boundary"><div><strong>{stages[activeStage].role}</strong><span>AI-generated · verify before use</span></div><p>{activeArtifact?.receivedHandoff ? `Received ${activeArtifact.receivedHandoff.from} artifact ${activeArtifact.receivedHandoff.artifactId}; produced ${activeArtifact.artifactId}.` : activeArtifact ? `Produced Researcher artifact ${activeArtifact.artifactId} for the Designer handoff.` : activeStage === 4 ? "Provides an advisory recommendation and backlog-improvement questions. The Product Manager retains the final decision." : "Cannot approve work, change the backlog or bypass the next evidence handoff."}</p></div>
    </section>

    {artifacts.researcher && <section className="results-section studio-results" aria-live="polite">
      <div className="section-heading"><div><p className="eyebrow"><span /> Selected request analysis</p><h2>{artifacts.researcher.featureRequest.title}</h2></div><p>All content below is AI-generated from the selected live GitHub issue and cumulative agent artefacts.</p></div>

      <div className="research-grid">
        <article className="request-quality"><div className="panel-heading"><div><span className="card-kicker">Researcher · request readiness</span><h3>{artifacts.researcher.requestAssessment.completeness} information quality</h3></div><span className={`quality-chip quality-${artifacts.researcher.requestAssessment.completeness}`}>{artifacts.researcher.requestAssessment.missingInformation.length} gaps</span></div><p>{artifacts.researcher.requestAssessment.confidenceRationale}</p><dl><div><dt>Primary user</dt><dd>{artifacts.researcher.problemFrame.primaryUser}</dd></div><div><dt>Problem</dt><dd>{artifacts.researcher.problemFrame.problemStatement}</dd></div><div><dt>Desired outcome</dt><dd>{artifacts.researcher.problemFrame.desiredOutcome}</dd></div></dl></article>
        <aside className="live-receipt"><span className="card-kicker">Researcher · live evidence receipts</span><div className="tool-name"><code>GitHub + Google Search</code><strong>{toolReceipt && marketResearchReceipt ? "Completed" : "Waiting"}</strong></div><div className="receipt-list"><div><span>Selected issue</span><strong>{toolReceipt ? `#${toolReceipt.selectedIssueNumber}` : "—"}</strong></div><div><span>Backlog context</span><strong>{toolReceipt ? `${toolReceipt.backlogIssueCount} live requests` : "—"}</strong></div><div><span>Comments retrieved</span><strong>{toolReceipt?.returnedCommentCount ?? "—"}</strong></div><div><span>Market sources</span><strong>{marketResearchReceipt?.sourceCount ?? "—"}</strong></div><div><span>Search queries</span><strong>{marketResearchReceipt?.searchQueries.length ?? "—"}</strong></div><div><span>Evidence time</span><strong>{marketResearchReceipt ? new Date(marketResearchReceipt.completedAt).toLocaleString("en-IE") : "—"}</strong></div></div>{marketResearchReceipt?.sources.length ? <details><summary>View live market sources</summary><ul>{marketResearchReceipt.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul></details> : null}</aside>
      </div>

      <article className="result-panel"><div className="panel-heading"><div><span className="card-kicker">Researcher · opportunity brief for Designer</span><h3>Current state, market patterns and problems worth solving</h3></div><span className="generated-chip">Live grounded research · verify sources</span></div><div className="brief-grid"><div><span>Current product</span><strong>Relevant workflow analysis</strong><p>{artifacts.researcher.currentProductAnalysis.currentStateSummary}</p></div><div><span>Market pattern</span><strong>{artifacts.researcher.marketResearch.findings[0]?.pattern}</strong><p>{artifacts.researcher.marketResearch.findings[0]?.applicability}</p></div><div><span>Designer handoff</span><strong>{artifacts.researcher.opportunityAnalysis.problemsWorthSolving[0]}</strong><p>{artifacts.researcher.designerHandoff.summary}</p></div></div></article>

      {artifacts.designer && <><div className="result-section-title"><span>Designer output</span><h3>Three research-informed design specifications</h3><p>{artifacts.designer.relationshipBetweenApproaches}</p></div><div className="concept-grid">{artifacts.designer.concepts.map((concept, index) => <article className={`concept-card lens-${["focused", "integrated", "exploratory"][index]}`} key={concept.id}><div className="concept-top"><span>{lensLabel[concept.lens]}</span><small>{lensCopy[concept.lens]}</small></div><h3>{concept.title}</h3><p>{concept.oneLineSummary}</p><div className="concept-meta"><span>Current product surface</span><strong>{concept.baselineSurface} · {concept.currentWorkflowReference}</strong></div><div className="concept-meta"><span>Evidence fit</span><strong>{concept.evidenceFit}</strong></div><details><summary>Open design specification</summary><p>{concept.designRationale}</p><ul>{concept.screenSpecifications.map((screen) => <li key={screen.name}><strong>{screen.name}:</strong> {screen.purpose}</li>)}</ul><small>Research used: {concept.researchFindingIds.join(", ")}</small></details><details><summary>Maker instructions</summary><ul>{concept.makerInstructions.map((item) => <li key={item}>{item}</li>)}</ul></details><details><summary>Assumptions and trade-offs</summary><ul>{[...concept.assumptions, ...concept.tradeoffs].map((item) => <li key={item}>{item}</li>)}</ul></details></article>)}</div></>}

      {artifacts.maker && currentPrototype && <article className="result-panel prototype-panel"><div className="panel-heading"><div><span className="card-kicker">Maker · three AI-generated page prototypes</span><h3>Current pages modified from each Designer specification</h3></div><span className="generated-chip">Isolated prototype · current platform unchanged</span></div><div className="prototype-shell studio-prototype"><nav aria-label="Solution prototypes">{artifacts.maker.prototypes.map((prototype) => { const concept = artifacts.designer?.concepts.find((item) => item.id === prototype.conceptId); return <button type="button" key={prototype.conceptId} className={prototype.conceptId === currentPrototype.conceptId ? "active" : ""} onClick={() => setPrototypeId(prototype.conceptId)}><span>{concept ? lensLabel[concept.lens] : "Design specification"}</span>{prototype.title}</button>; })}</nav><div className="prototype-intro"><div><span className="card-kicker">Assumption under test</span><h4>{currentPrototype.title}</h4><p>{currentPrototype.testableAssumption}</p></div><p>{currentPrototype.purpose}</p></div><div className="prototype-limit"><strong>Designer-to-Maker traceability</strong><p>{currentPrototype.designTraceability} Implemented: {currentPrototype.implementedDesignElements.join(" · ")}</p></div><PrototypeRenderer key={currentPrototype.conceptId} prototype={currentPrototype} lens={artifacts.designer?.concepts.find((item) => item.id === currentPrototype.conceptId)?.lens ? lensLabel[artifacts.designer.concepts.find((item) => item.id === currentPrototype.conceptId)!.lens] : "concept"} onOpenCurrentPlatform={() => { setWorkspaceView("platform"); window.scrollTo({ top: 0, behavior: "smooth" }); }} /><div className="prototype-limit"><strong>What this does not prove</strong><p>{currentPrototype.limitations.join(" · ")}</p></div></div></article>}

      {artifacts.communicator && <article className="result-panel"><div className="panel-heading"><div><span className="card-kicker">Communicator · internal AI draft</span><h3>Changes, impact and implementation effort</h3></div><span className="draft-chip">Draft · internal only</span></div><p>{artifacts.communicator.comparisonSummary}</p><div className="brief-grid">{artifacts.communicator.optionBriefs.map((brief) => <div key={brief.conceptId}><span>{brief.implementationEffort} effort</span><strong>{brief.headline}</strong><p>{brief.executiveSummary}</p><small>{brief.operationalImpact}</small><details><summary>Changes and effort drivers</summary><ul>{[...brief.changesInvolved, ...brief.effortDrivers].map((item) => <li key={item}>{item}</li>)}</ul></details></div>)}</div></article>}

      {artifacts.manager && <article className="result-panel manager-panel"><div className="panel-heading"><div><span className="card-kicker">Manager · advisory AI recommendation</span><h3>{artifacts.manager.requestReadiness === "needs_backlog_enrichment" ? "Improve the request before relying on the concepts" : `Recommended direction: ${recommended?.title}`}</h3></div><span className="human-chip">Product Manager decides</span></div><p className="manager-recommendation">{artifacts.manager.recommendation}</p><div className="manager-next"><div><span>Handoff audit</span><strong>{artifacts.manager.handoffAudit}</strong></div><div><span>Strategic alignment</span><strong>{artifacts.manager.strategicAlignmentSummary}</strong></div></div><div className="ranking-table studio-ranking">{artifacts.manager.ranking.map((item) => <details key={item.conceptId} open={item.rank === 1}><summary><span className="rank-number">{item.rank}</span><div><strong>{item.title}</strong><small>{item.lens} · {item.confidence} confidence · {item.complexity}</small></div><span>{item.rank === 1 ? `${artifacts.manager?.recommendationStrength} recommendation` : "View executive summary"}</span></summary><p>{item.executiveSummary}</p><div className="contribution-grid"><div><span>Researcher</span><p>{item.agentContributions.researcher}</p></div><div><span>Designer</span><p>{item.agentContributions.designer}</p></div><div><span>Maker</span><p>{item.agentContributions.maker}</p></div><div><span>Communicator</span><p>{item.agentContributions.communicator}</p></div></div></details>)}</div><div className="manager-next"><div><span>Accountable human</span><strong>{artifacts.manager.accountableHumanRole}</strong></div><div><span>Suggested next step</span><strong>{artifacts.manager.suggestedNextStep}</strong></div><div><span>Decision boundary</span><strong>No selection or backlog change is made here.</strong></div></div><p className="final-disclosure">{artifacts.manager.finalDisclosure}</p></article>}

      {artifacts.manager && <article className="gap-panel"><div className="panel-heading"><div><span className="card-kicker">Cumulative information-gap tracker</span><h3>{artifacts.manager.requestReadiness === "needs_backlog_enrichment" ? "Improve the backlog request, then run it again." : "Questions to carry into concept validation."}</h3></div><span className="gap-count">{artifacts.manager.consolidatedInformationGaps.length} questions</span></div><p>{artifacts.manager.informationQualitySummary}</p>{artifacts.manager.consolidatedInformationGaps.length ? <div className="gap-list">{artifacts.manager.consolidatedInformationGaps.map((gap, index) => <div key={`${gap.category}-${index}`}><span>{formatGapCategory(gap.category)}</span><div><strong>{gap.questionForProductManager}</strong><p>{gap.whyItMatters}</p><small>Raised by: {gap.sourceAgents?.map(formatGapCategory).join(", ")}</small></div></div>)}</div> : <div className="no-gaps">No critical information gaps remained in this run. Validate the assumptions with real users before commitment.</div>}</article>}
    </section>}
    </>}

    <footer><span>BottleShopManager · Solution Studio</span><span>Fictional Irish B2B retail platform · Synthetic academic prototype</span><span>AI advises · Product Manager decides</span></footer>
  </main>;
}
