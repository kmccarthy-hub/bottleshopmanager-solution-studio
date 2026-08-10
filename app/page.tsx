import { useState } from "react";

const stages = [
  { number: "01", key: "researcher", role: "Researcher", name: "Aisling Byrne", accent: "cyan", summary: "Calls the live feedback tool and identifies three evidence-backed opportunities.", output: "Opportunity research brief" },
  { number: "02", key: "designer", role: "Designer", name: "Luca Moretti", accent: "violet", summary: "Challenges the lead opportunity and turns it into a focused solution concept.", output: "Solution concept + user journey" },
  { number: "03", key: "maker", role: "Maker", name: "Priya Shah", accent: "coral", summary: "Builds a safe, clickable three-screen prototype from the approved design brief.", output: "Interactive feature prototype" },
  { number: "04", key: "communicator", role: "Communicator", name: "Niamh Doyle", accent: "amber", summary: "Prepares an honest customer validation package and internal decision story.", output: "Validation invitation + pitch" },
  { number: "05", key: "manager", role: "Manager", name: "Elias Grant", accent: "blue", summary: "Reviews the full chain, ranks three opportunities and recommends the next action.", output: "Build / validate / park decision" },
] as const;

type StageKey = typeof stages[number]["key"];
type StageStatus = "idle" | "running" | "complete" | "error";
type Opportunity = { id: string; title: string; problemStatement: string; evidenceIssueNumbers: number[]; confidence: string };
type ResearcherArtifact = { opportunities: Opportunity[]; provisionalRanking: string[]; leadOpportunityId: string; leadRationale: string; handoffSummary: string };
type DesignerArtifact = { selectedOpportunityId: string; problemStatement: string; desiredOutcome: string; selectedConceptId: string; selectionRationale: string; alternatives: { id: string; name: string; concept: string }[]; handoffSummary: string };
type PrototypeComponent = { id: string; type: string; title: string; body: string; label: string; action: { type: string; target: string } | null };
type MakerArtifact = { selectedOpportunityId: string; prototypeName: string; testableAssumption: string; screens: { id: string; name: string; purpose: string; components: PrototypeComponent[] }[]; limitations: string[] };
type CommunicatorArtifact = { internalPitch: { headline: string; problem: string; evidence: string; proposedConcept: string; risk: string; requestedDecision: string }; customerInvitation: { status: string; subject: string; body: string }; nextEngagementAction: string; intendedLearning: string };
type ManagerArtifact = { ranking: { rank: number; opportunityId: string; title: string; evidenceIssueNumbers: number[]; confidence: string; effortRisk: string; rationale: string }[]; finalAction: "build" | "validate" | "park"; finalRecommendation: string; immediateNextStep: string; successMeasure: string; accountableHumanRole: string; finalDisclosure: string };
type Artifacts = { researcher?: ResearcherArtifact; designer?: DesignerArtifact; maker?: MakerArtifact; communicator?: CommunicatorArtifact; manager?: ManagerArtifact };

const initialStatuses: Record<StageKey, StageStatus> = { researcher: "idle", designer: "idle", maker: "idle", communicator: "idle", manager: "idle" };
const feedbackRepository = "https://github.com/kmccarthy-hub/evidenceloop-feedback";

export default function Home() {
  const [activeStage, setActiveStage] = useState(0);
  const [statuses, setStatuses] = useState(initialStatuses);
  const [artifacts, setArtifacts] = useState<Artifacts>({});
  const [runError, setRunError] = useState("");
  const [previewNotice, setPreviewNotice] = useState(false);
  const [toolReceipt, setToolReceipt] = useState<{ completedAt: string; returnedIssueCount: number; responseStatus: number; id: string } | null>(null);
  const [prototypeScreenId, setPrototypeScreenId] = useState("");
  const [selectedComponentId, setSelectedComponentId] = useState("");

  const stage = stages[activeStage];
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const runActive = Object.values(statuses).includes("running");

  function setStageStatus(key: StageKey, value: StageStatus) {
    setStatuses((current) => ({ ...current, [key]: value }));
  }

  async function postStage(key: StageKey, body: object) {
    const response = await fetch(`${apiBaseUrl}/api/${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error ?? `${stages.find((item) => item.key === key)?.role} could not complete.`);
    return payload;
  }

  async function startAnalysis() {
    if (!apiBaseUrl) { setPreviewNotice(true); return; }
    setPreviewNotice(false); setRunError(""); setToolReceipt(null); setArtifacts({}); setStatuses(initialStatuses); setPrototypeScreenId(""); setSelectedComponentId("");
    let currentStage: StageKey = "researcher";
    try {
      setActiveStage(0); setStageStatus("researcher", "running");
      const research = await postStage("researcher", { trigger: "analyse-current-feedback" });
      const nextArtifacts: Artifacts = { researcher: research.artifact };
      setArtifacts(nextArtifacts); setToolReceipt(research.toolReceipt); setStageStatus("researcher", "complete");

      const downstream: StageKey[] = ["designer", "maker", "communicator", "manager"];
      for (const key of downstream) {
        currentStage = key;
        const index = stages.findIndex((item) => item.key === key);
        setActiveStage(index); setStageStatus(key, "running");
        const result = await postStage(key, { runId: research.runId, artifacts: nextArtifacts });
        nextArtifacts[key] = result.artifact;
        setArtifacts({ ...nextArtifacts }); setStageStatus(key, "complete");
        if (key === "maker") setPrototypeScreenId(result.artifact.screens[0].id);
      }
    } catch (error) {
      setStageStatus(currentStage, "error");
      setRunError(error instanceof Error ? error.message : "The agent pipeline stopped unexpectedly.");
    }
  }

  function handlePrototypeAction(component: PrototypeComponent) {
    if (!component.action || !artifacts.maker) return;
    const targetScreen = artifacts.maker.screens.find((screen) => screen.id === component.action?.target);
    if (targetScreen) { setPrototypeScreenId(targetScreen.id); setSelectedComponentId(""); }
    else setSelectedComponentId(component.id === selectedComponentId ? "" : component.id);
  }

  const currentPrototypeScreen = artifacts.maker?.screens.find((screen) => screen.id === prototypeScreenId) ?? artifacts.maker?.screens[0];

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="EvidenceLoop home"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>EvidenceLoop</span><span className="product-name">Opportunity Lens</span></a>
        <div className="topbar-meta"><span className="disclosure-pill"><span className="spark">✦</span>AI-assisted decision support</span><span className="synthetic-pill">Synthetic academic data</span><a className="text-link" href="#how-it-works">How it works</a></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Product opportunity intelligence</p>
          <h1>Turn customer feedback into a decision your team can <em>defend.</em></h1>
          <p className="hero-lede">Five specialised AI agents transform live customer evidence into three ranked opportunities, one clickable concept and a recommendation that stays under human control.</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={startAnalysis} disabled={runActive}>{runActive ? `${stage.role} is working…` : artifacts.manager ? "Run a fresh analysis" : "Analyse current feedback"}<span aria-hidden="true">→</span></button>
            <div className="run-note"><span className="live-dot" />Researcher queries GitHub at run time</div>
          </div>
          {previewNotice && <div className="preview-notice" role="status"><strong>Interface preview:</strong> connect the deployed Vercel API before running. No result on this page is represented as live.<button type="button" onClick={() => setPreviewNotice(false)} aria-label="Dismiss preview notice">×</button></div>}
          {runError && <div className="run-error" role="alert"><strong>Pipeline stopped at {stage.role}:</strong> {runError}</div>}
        </div>

        <div className="signal-card" aria-label="Live tool call receipt">
          <div className="signal-card-head"><div><span className="card-kicker">Researcher tool</span><h2>Live source receipt</h2></div><span className="ai-chip">AI requested</span></div>
          <div className="tool-line"><span className="terminal-prompt">›</span><code>fetch_customer_feedback</code><span className={`waiting-chip ${toolReceipt ? "completed" : ""}`}>{statuses.researcher === "running" ? "Calling…" : toolReceipt ? "Completed" : statuses.researcher === "error" ? "Stopped" : "Not run"}</span></div>
          <div className="receipt-grid">
            <div><span>Source</span><strong>GitHub Issues API</strong></div><div><span>Query time</span><strong>{toolReceipt ? new Date(toolReceipt.completedAt).toLocaleString("en-IE") : "Waiting for run"}</strong></div>
            <div><span>Feedback received</span><strong>{toolReceipt ? `${toolReceipt.returnedIssueCount} live issues` : "—"}</strong></div><div><span>Validation</span><strong>{toolReceipt ? `Verified · HTTP ${toolReceipt.responseStatus}` : "Not started"}</strong></div>
          </div>
          <div className="source-rule"><span className="source-icon">↗</span><p>The Researcher requests the tool. The application executes the live API call and records a deterministic receipt. No cached feedback fallback is used.</p></div>
        </div>
      </section>

      <section className="pipeline-section" id="how-it-works">
        <div className="section-heading"><div><p className="eyebrow"><span /> One cumulative chain</p><h2>Five agents. Five accountable handoffs.</h2></div><p>Each agent receives the validated artefacts produced before it. Select a stage to inspect its role, status and control boundary.</p></div>
        <div className="pipeline-grid">
          <nav className="stage-rail" aria-label="Agent pipeline">
            {stages.map((item, index) => <button key={item.role} type="button" className={`stage-tab ${index === activeStage ? "active" : ""}`} onClick={() => setActiveStage(index)} aria-pressed={index === activeStage}><span className={`stage-orb ${item.accent}`}>{item.number}</span><span className="stage-label"><strong>{item.role}</strong><small>{item.name}</small></span><span className={`ai-mini status-${statuses[item.key]}`}>{statuses[item.key] === "idle" ? "AI" : statuses[item.key]}</span></button>)}
          </nav>
          <article className={`stage-detail detail-${stage.accent}`}>
            <div className="stage-detail-top"><div><span className="card-kicker">Stage {stage.number} · AI agent</span><h3>{stage.role}</h3><p className="agent-name">{stage.name}</p></div><span className="generated-chip">AI-generated · verify before use</span></div>
            <p className="stage-summary">{stage.summary}</p>
            <div className="handoff-flow"><div><span>Receives</span><strong>{activeStage === 0 ? "Research task + tool access" : `All artefacts through ${stages[activeStage - 1].role}`}</strong></div><span className="flow-arrow" aria-hidden="true">→</span><div><span>Produces</span><strong>{stage.output}</strong></div></div>
            <div className="stage-boundary"><span>Control boundary</span><p>{activeStage === 4 ? "Advisory output only. A human product leader approves, rejects or requests more validation." : "This agent cannot publish, approve investment or bypass the next validation gate."}</p></div>
          </article>
          <aside className="decision-preview"><span className="card-kicker">Final decision format</span><h3>Evidence before confidence.</h3><ol><li><span>1</span><div><strong>Rank three opportunities</strong><small>With issue-level traceability</small></div></li><li><span>2</span><div><strong>Review the prototype</strong><small>Against the selected problem</small></div></li><li><span>3</span><div><strong>Recommend one action</strong><small>Build, validate or park</small></div></li></ol><div className="human-control"><span className="human-icon" aria-hidden="true">◎</span><div><strong>Human approval required</strong><p>Opportunity Lens informs the roadmap. It never changes it.</p></div></div></aside>
        </div>
      </section>

      {artifacts.researcher && <section className="results-section" aria-live="polite">
        <div className="section-heading"><div><p className="eyebrow"><span /> Current run</p><h2>Decision workspace</h2></div><p>Every panel below is AI-generated decision support. Evidence links open the synthetic source record for human verification.</p></div>
        <div className="opportunity-grid">
          {artifacts.researcher.opportunities.map((opportunity) => <article className={`opportunity-result ${opportunity.id === artifacts.researcher?.leadOpportunityId ? "lead" : ""}`} key={opportunity.id}><div className="result-label"><span>{opportunity.id === artifacts.researcher?.leadOpportunityId ? "Researcher lead" : "Candidate"}</span><span>{opportunity.confidence} confidence</span></div><h3>{opportunity.title}</h3><p>{opportunity.problemStatement}</p><div className="evidence-links">{opportunity.evidenceIssueNumbers.map((number) => <a key={number} href={`${feedbackRepository}/issues/${number}`} target="_blank" rel="noreferrer">Issue #{number}</a>)}</div></article>)}
        </div>

        {artifacts.designer && <article className="result-panel"><div className="panel-heading"><div><span className="card-kicker">Designer · AI-generated</span><h3>{artifacts.designer.problemStatement}</h3></div><span className="generated-chip">Concept under evaluation</span></div><p>{artifacts.designer.selectionRationale}</p><div className="alternative-row">{artifacts.designer.alternatives.map((alternative) => <div key={alternative.id} className={alternative.id === artifacts.designer?.selectedConceptId ? "selected" : ""}><strong>{alternative.name}</strong><p>{alternative.concept}</p></div>)}</div></article>}

        {artifacts.maker && currentPrototypeScreen && <article className="result-panel prototype-panel"><div className="panel-heading"><div><span className="card-kicker">Maker · AI-generated prototype</span><h3>{artifacts.maker.prototypeName}</h3><p>{artifacts.maker.testableAssumption}</p></div><span className="generated-chip">Prototype · not production</span></div><div className="prototype-shell"><nav aria-label="Prototype screens">{artifacts.maker.screens.map((screen) => <button type="button" key={screen.id} className={screen.id === currentPrototypeScreen.id ? "active" : ""} onClick={() => { setPrototypeScreenId(screen.id); setSelectedComponentId(""); }}>{screen.name}</button>)}</nav><div className="prototype-canvas"><div className="prototype-top"><span>{currentPrototypeScreen.name}</span><small>{currentPrototypeScreen.purpose}</small></div>{currentPrototypeScreen.components.map((component) => <button type="button" className={`prototype-component component-${component.type} ${component.id === selectedComponentId ? "selected" : ""}`} key={component.id} onClick={() => handlePrototypeAction(component)} disabled={!component.action}><span>{component.type}</span><strong>{component.title || component.label}</strong><p>{component.body}</p>{component.action && <small>{component.label || component.action.type} →</small>}</button>)}</div></div></article>}

        {artifacts.communicator && <article className="result-panel communication-panel"><div className="panel-heading"><div><span className="card-kicker">Communicator · AI draft</span><h3>{artifacts.communicator.internalPitch.headline}</h3></div><span className="draft-chip">Draft · not sent</span></div><div className="communication-grid"><div><span>Internal decision request</span><p>{artifacts.communicator.internalPitch.requestedDecision}</p><strong>Risk</strong><p>{artifacts.communicator.internalPitch.risk}</p></div><div><span>Customer validation invitation</span><strong>{artifacts.communicator.customerInvitation.subject}</strong><p>{artifacts.communicator.customerInvitation.body}</p></div></div></article>}

        {artifacts.manager && <article className="result-panel manager-panel"><div className="panel-heading"><div><span className="card-kicker">Manager · advisory AI output</span><h3>Final recommendation: {artifacts.manager.finalAction}</h3></div><span className="human-chip">Human approval required</span></div><p className="manager-recommendation">{artifacts.manager.finalRecommendation}</p><div className="ranking-table">{artifacts.manager.ranking.map((item) => <div key={item.opportunityId}><span className="rank-number">{item.rank}</span><div><strong>{item.title}</strong><p>{item.rationale}</p></div><span>{item.confidence}<small>confidence</small></span><span>{item.effortRisk}<small>effort / risk</small></span></div>)}</div><div className="manager-next"><div><span>Accountable human</span><strong>{artifacts.manager.accountableHumanRole}</strong></div><div><span>Immediate next step</span><strong>{artifacts.manager.immediateNextStep}</strong></div><div><span>Success measure</span><strong>{artifacts.manager.successMeasure}</strong></div></div><p className="final-disclosure">{artifacts.manager.finalDisclosure}</p></article>}
      </section>}

      <footer><span>EvidenceLoop · Opportunity Lens</span><span>Fictional organisation · Academic prototype · 2026</span><span>Desktop experience</span></footer>
    </main>
  );
}
