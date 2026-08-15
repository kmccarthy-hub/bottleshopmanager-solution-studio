import { useEffect, useRef, useState } from "react";
import BottleShopPlatform from "./bottle-shop-platform";
import PrototypeRenderer, { type InteractivePrototype } from "./prototype-renderer";

const stages = [
  { number: "01", key: "researcher", role: "Researcher", name: "Maeve O'Connell", accent: "cyan", output: "Live request + market opportunity brief" },
  { number: "02", key: "designer", role: "Designer", name: "Jonas Berg", accent: "violet", output: "Three research-informed design specifications" },
  { number: "03", key: "maker", role: "Maker", name: "Priya Shah", accent: "coral", output: "One Manager-selected page prototype" },
  { number: "04", key: "communicator", role: "Communicator", name: "Niamh Doyle", accent: "amber", output: "Selected prototype impact + effort brief" },
  { number: "05", key: "manager", role: "Manager", name: "Elias Grant", accent: "blue", output: "Ranked recommendation + backlog questions" },
] as const;

type StageKey = typeof stages[number]["key"];
type StageStatus = "idle" | "running" | "complete" | "error" | "cancelled";
type BacklogIssue = { number: number; title: string; state: string; labels: string[]; updatedAt: string; sourceUrl: string; body: string };
type Gap = { category: string; missingInformation: string; whyItMatters: string; questionForProductManager: string; sourceAgents?: string[] };
type Handoff = { from: string; artifactId: string; summary: string };
type ResearcherArtifact = { artifactId: string; receivedHandoff?: undefined; featureRequest: { issueNumber: number; title: string; sourceUrl: string; summary: string }; requestAssessment: { completeness: "low" | "medium" | "high"; confidenceRationale: string; knownFacts: string[]; missingInformation: Gap[] }; currentProductAnalysis: { currentStateSummary: string }; problemFrame: { primaryUser: string; problemStatement: string; desiredOutcome: string }; marketResearch: { findings: { id: string; pattern: string; applicability: string }[]; sources: { id: string; title: string; url: string }[] }; opportunityAnalysis: { problemsWorthSolving: string[]; researchBackedPossibilities: string[] }; designerHandoff: { summary: string }; handoffSummary: string };
type Concept = { id: string; lens: "recommended_approach" | "alternative_approach" | "variation_extended_approach"; title: string; oneLineSummary: string; intendedUser: string; baselineSurface: string; currentWorkflowReference: string; researchFindingIds: string[]; designRationale: string; keyCapabilities: string[]; screenSpecifications: { name: string; purpose: string }[]; makerInstructions: string[]; evidenceFit: string; assumptions: string[]; tradeoffs: string[]; risks: string[] };
type DesignerArtifact = { artifactId: string; receivedHandoff: Handoff; concepts: Concept[]; relationshipBetweenApproaches: string; informationGaps: Gap[]; handoffSummary: string };
type PrototypeSelectionArtifact = { artifactId: string; receivedHandoff: Handoff; selectedConceptId: string; selectedTitle: string; selectionRationale: string; confidence: "low" | "medium" | "high"; optionAssessment: { conceptId: string; title: string; status: "selected_for_prototyping" | "not_selected_for_prototyping"; reason: string }[]; decisionBoundary: string };
type MakerArtifact = { artifactId: string; receivedHandoff: Handoff; prototypes: InteractivePrototype[]; informationGaps: Gap[] };
type OptionBrief = { conceptId: string; headline: string; executiveSummary: string; intendedUser: string; changesInvolved: string[]; userImpact: string; operationalImpact: string; implementationEffort: "low" | "medium" | "high"; effortDrivers: string[]; valueProposition: string; strengths: string[]; risks: string[]; prototypeExplanation: string };
type CommunicatorArtifact = { artifactId: string; receivedHandoff: Handoff; optionBriefs: OptionBrief[]; comparisonSummary: string; informationGaps: Gap[] };
type Ranking = { rank: number; conceptId: string; title: string; lens: string; confidence: string; complexity: string; executiveSummary: string; agentContributions: { researcher: string; designer: string; maker: string; communicator: string } };
type ManagerArtifact = { artifactId: string; receivedHandoff: Handoff; handoffAudit: string; strategicAlignmentSummary: string; requestReadiness: "ready_for_concept_validation" | "needs_backlog_enrichment"; informationQualitySummary: string; consolidatedInformationGaps: Gap[]; ranking: Ranking[]; recommendedConceptId: string; recommendation: string; recommendationStrength: string; whatWouldChangeRecommendation: string[]; accountableHumanRole: string; suggestedNextStep: string; finalDisclosure: string };
type Artifacts = { researcher?: ResearcherArtifact; designer?: DesignerArtifact; prototypeSelection?: PrototypeSelectionArtifact; maker?: MakerArtifact; communicator?: CommunicatorArtifact; manager?: ManagerArtifact };

const initialStatuses: Record<StageKey, StageStatus> = { researcher: "idle", designer: "idle", maker: "idle", communicator: "idle", manager: "idle" };
const lensCopy = { recommended_approach: "Designer's strongest research-informed response", alternative_approach: "Credible alternative workflow or emphasis", variation_extended_approach: "Variation or extension of a strong direction" };
const lensLabel = { recommended_approach: "Recommended approach", alternative_approach: "Alternative approach", variation_extended_approach: "Variation / extended approach" };
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || window.location.origin).replace(/\/$/, "");
const formatGapCategory = (category: string) => category.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function createAbortError() {
  const error = new Error("Pipeline cancelled by the Product Manager.");
  error.name = "AbortError";
  return error;
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw createAbortError();
}

function abortableDelay(delayMs: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    throwIfAborted(signal);
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, delayMs);
    function handleAbort() {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", handleAbort);
      reject(createAbortError());
    }
    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

const isAbortError = (error: unknown) => error instanceof Error && error.name === "AbortError";

export default function Home() {
  const [workspaceView, setWorkspaceView] = useState<"studio" | "platform">("studio");
  const [backlog, setBacklog] = useState<BacklogIssue[]>([]);
  const [backlogState, setBacklogState] = useState<"loading" | "ready" | "error" | "preview">(API_BASE_URL ? "loading" : "preview");
  const [backlogError, setBacklogError] = useState("");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [statuses, setStatuses] = useState(initialStatuses);
  const [runningStageKey, setRunningStageKey] = useState<StageKey | null>(null);
  const [stageStartedAt, setStageStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeStage, setActiveStage] = useState(0);
  const [artifacts, setArtifacts] = useState<Artifacts>({});
  const [toolReceipt, setToolReceipt] = useState<{ completedAt: string; responseStatus: number; selectedIssueNumber: number; backlogIssueCount: number; returnedCommentCount: number } | null>(null);
  const [marketResearchReceipt, setMarketResearchReceipt] = useState<{ completedAt: string; sourceCount: number; searchQueries: string[]; sources: { id: string; title: string; url: string }[] } | null>(null);
  const [runError, setRunError] = useState("");
  const [runErrorStage, setRunErrorStage] = useState<StageKey | null>(null);
  const [runCancelled, setRunCancelled] = useState("");
  const [retryNotice, setRetryNotice] = useState("");
  const [repairNotice, setRepairNotice] = useState<{ stage: StageKey; activity: string; attempt: number; maxAttempts: number; reason: string } | null>(null);
  const [prototypeId, setPrototypeId] = useState("");
  const pipelineRef = useRef<HTMLElement | null>(null);
  const followRunRef = useRef(true);
  const runAbortRef = useRef<AbortController | null>(null);
  const runSequenceRef = useRef(0);
  const runningStageRef = useRef<StageKey | null>(null);
  const apiBaseUrl = API_BASE_URL;
  const selectedIssue = backlog.find((issue) => issue.number === selectedNumber);
  const runActive = Object.values(statuses).includes("running");
  const activeStageKey = stages[activeStage].key;
  const activeArtifact = activeStageKey === "manager" ? artifacts.manager ?? artifacts.prototypeSelection : artifacts[activeStageKey];
  const activeStatus = statuses[activeStageKey];
  const activeHasOutput = activeStageKey === "manager" ? Boolean(artifacts.prototypeSelection || artifacts.manager) : Boolean(artifacts[activeStageKey]);
  const errorStageRole = stages.find((stage) => stage.key === runErrorStage)?.role;
  const completedIssueNumber = artifacts.manager ? artifacts.researcher?.featureRequest.issueNumber : null;
  const selectedRunCompleted = completedIssueNumber === selectedNumber;

  useEffect(() => {
    if (!apiBaseUrl) return;
    let cancelled = false;
    fetch(`${apiBaseUrl}/api/backlog`, { cache: "no-store" })
      .then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error ?? "The live backlog could not be loaded."); return payload; })
      .then((payload) => { if (!cancelled) { setBacklog(payload.issues); setSelectedNumber(payload.issues[0]?.number ?? null); setBacklogState("ready"); } })
      .catch((error) => { if (!cancelled) { setBacklogState("error"); setBacklogError(error instanceof Error ? error.message : "The live backlog could not be loaded."); } });
    return () => { cancelled = true; };
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!runningStageKey || stageStartedAt === null) return;
    const updateElapsed = () => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - stageStartedAt) / 1000)));
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [runningStageKey, stageStartedAt]);

  function setStageStatus(key: StageKey, status: StageStatus) {
    setStatuses((current) => ({ ...current, [key]: status }));
    if (status === "running") {
      runningStageRef.current = key;
      setRunningStageKey(key);
      setStageStartedAt(Date.now());
      setElapsedSeconds(0);
    } else {
      if (runningStageRef.current === key) runningStageRef.current = null;
      setRunningStageKey(null);
      setStageStartedAt(null);
    }
  }

  function followStage(index: number) {
    if (followRunRef.current) setActiveStage(index);
  }

  function selectStage(index: number) {
    if (runActive) followRunRef.current = false;
    setActiveStage(index);
  }

  async function postStage(key: StageKey | "prototype-selection", body: object, signal: AbortSignal) {
    const roleLabel = key === "prototype-selection" ? "Manager selection gate" : stages.find((stage) => stage.key === key)?.role ?? key;
    const retryDelays = [0, 5000, 12000, 20000];
    let requestBody = body;
    for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
      throwIfAborted(signal);
      if (retryDelays[attempt]) {
        setRetryNotice(`${roleLabel} AI service is busy. Automatic retry ${attempt} of ${retryDelays.length - 1}…`);
        await abortableDelay(retryDelays[attempt], signal);
      }
      try {
        const response = await fetch(`${apiBaseUrl}/api/${key}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody), signal });
        const payload = await response.json().catch(() => ({ error: `${key} returned an unreadable response.`, retryable: [502, 503, 504].includes(response.status) }));
        throwIfAborted(signal);
        if (response.ok) { setRetryNotice(""); setRepairNotice(null); return payload; }
        if ((key === "maker" || key === "researcher") && response.status === 422 && payload.repairable && payload.repairToken) {
          setRetryNotice("");
          setRepairNotice({ stage: key, activity: payload.repairActivity ?? "revising its draft", attempt: payload.nextAttempt, maxAttempts: payload.maxAttempts, reason: payload.repairReason });
          requestBody = { ...body, repairToken: payload.repairToken };
          attempt -= 1;
          continue;
        }
        if (!payload.retryable) { setRetryNotice(""); throw new Error(payload.error ?? `${key} could not complete.`); }
        if (attempt === retryDelays.length - 1) { setRetryNotice(""); throw new Error(`${roleLabel} could not reach the AI service after ${retryDelays.length} attempts. Please wait a few minutes and run the request again.`); }
      } catch (error) {
        if (isAbortError(error) || signal.aborted) throw createAbortError();
        if (error instanceof TypeError && attempt < retryDelays.length - 1) {
          setRetryNotice(`${roleLabel} request was interrupted before a response was readable. Retrying this stage automatically…`);
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
    const requestedIssueNumber = selectedNumber;
    const runSequence = runSequenceRef.current + 1;
    runSequenceRef.current = runSequence;
    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;
    const ensureCurrentRun = () => {
      throwIfAborted(controller.signal);
      if (runSequenceRef.current !== runSequence) throw createAbortError();
    };
    followRunRef.current = true;
    setRunError(""); setRunErrorStage(null); setRunCancelled(""); setRetryNotice(""); setRepairNotice(null); setArtifacts({}); setStatuses(initialStatuses); setRunningStageKey(null); setStageStartedAt(null); setElapsedSeconds(0); setToolReceipt(null); setMarketResearchReceipt(null); setPrototypeId("");
    window.requestAnimationFrame(() => pipelineRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    let currentStage: StageKey = "researcher";
    try {
      setActiveStage(0); setStageStatus("researcher", "running");
      const research = await postStage("researcher", { featureRequestNumber: requestedIssueNumber }, controller.signal);
      ensureCurrentRun();
      const next: Artifacts = { researcher: research.artifact };
      setArtifacts(next); setToolReceipt(research.toolReceipt); setMarketResearchReceipt(research.marketResearchReceipt); setStageStatus("researcher", "complete");
      currentStage = "designer"; setStageStatus("designer", "running");
      const design = await postStage("designer", { runId: research.runId, artifacts: next }, controller.signal);
      ensureCurrentRun();
      next.designer = design.artifact; setArtifacts({ ...next }); setStageStatus("designer", "complete"); followStage(1);

      currentStage = "manager"; setStageStatus("manager", "running");
      const selection = await postStage("prototype-selection", { runId: research.runId, artifacts: next }, controller.signal);
      ensureCurrentRun();
      next.prototypeSelection = selection.artifact; setArtifacts({ ...next }); setStageStatus("manager", "idle"); followStage(4);

      const selectedConcept = next.designer.concepts.find((concept) => concept.id === next.prototypeSelection?.selectedConceptId);
      if (!selectedConcept) throw new Error("The Manager selection did not match a Designer specification.");
      const makerArtifacts = { researcher: next.researcher, designer: { ...next.designer, concepts: [selectedConcept] }, prototypeSelection: next.prototypeSelection };
      currentStage = "maker"; setStageStatus("maker", "running");
      const made = await postStage("maker", { runId: research.runId, artifacts: makerArtifacts }, controller.signal);
      ensureCurrentRun();
      next.maker = made.artifact; setPrototypeId(made.artifact.prototypes[0].conceptId); setArtifacts({ ...next }); setStageStatus("maker", "complete"); followStage(2);

      currentStage = "communicator"; setStageStatus("communicator", "running");
      const communicatorArtifacts = { researcher: next.researcher, prototypeSelection: next.prototypeSelection, maker: next.maker };
      const communication = await postStage("communicator", { runId: research.runId, artifacts: communicatorArtifacts }, controller.signal);
      ensureCurrentRun();
      next.communicator = communication.artifact; setArtifacts({ ...next }); setStageStatus("communicator", "complete"); followStage(3);

      currentStage = "manager"; setStageStatus("manager", "running");
      const management = await postStage("manager", { runId: research.runId, artifacts: next }, controller.signal);
      ensureCurrentRun();
      next.manager = management.artifact; setArtifacts({ ...next }); setStageStatus("manager", "complete"); followStage(4);
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted || runSequenceRef.current !== runSequence) return;
      setStageStatus(currentStage, "error"); followStage(stages.findIndex((stage) => stage.key === currentStage)); setRunErrorStage(currentStage); setRunError(error instanceof Error ? error.message : "The agent chain stopped unexpectedly.");
    } finally {
      if (runSequenceRef.current === runSequence) runAbortRef.current = null;
    }
  }

  function cancelPipeline() {
    const cancelledStage = runningStageRef.current;
    if (!cancelledStage) return;
    followRunRef.current = false;
    runSequenceRef.current += 1;
    runAbortRef.current?.abort();
    runAbortRef.current = null;
    runningStageRef.current = null;
    setStatuses((current) => ({ ...current, [cancelledStage]: "cancelled" }));
    setRunningStageKey(null);
    setStageStartedAt(null);
    setElapsedSeconds(0);
    setRetryNotice("");
    setRepairNotice(null);
    setRunError("");
    setRunErrorStage(null);
    setRunCancelled("Pipeline cancelled by the Product Manager. No further agents will run; the current hosted AI request may take a short time to wind down.");
  }

  function selectIssue(issueNumber: number) {
    setSelectedNumber(issueNumber);
    setRunCancelled("");
    setRunError("");
    setRunErrorStage(null);
  }

  const currentPrototype = artifacts.maker?.prototypes.find((item) => item.conceptId === prototypeId) ?? artifacts.maker?.prototypes[0];
  const recommended = artifacts.manager?.ranking.find((item) => item.conceptId === artifacts.manager?.recommendedConceptId);

  return <main className="app-shell bsm-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar">
      <a className="brand" href="#top" aria-label="BottleShopManager Solution Studio home"><span className="bsm-mark" aria-hidden="true"><i /><i /><i /></span><span>BottleShopManager</span><span className="product-name">Solution Studio</span></a>
      <div className="workspace-switch topbar-workspace-switch" aria-label="Choose BottleShopManager workspace"><button type="button" className={workspaceView === "platform" ? "active" : ""} onClick={() => setWorkspaceView("platform")}>Current platform</button><button type="button" className={workspaceView === "studio" ? "active" : ""} onClick={() => setWorkspaceView("studio")}>Solution Studio</button></div>
      <div className="topbar-meta"><span className="disclosure-pill"><span className="spark">✦</span>AI-assisted exploration</span><span className="synthetic-pill">Synthetic academic backlog</span></div>
    </header>

    {workspaceView === "platform" ? <BottleShopPlatform onOpenStudio={() => setWorkspaceView("studio")} /> : <>
    <section className="studio-hero" id="top">
      <div className="studio-copy"><p className="eyebrow"><span /> Internal product concept studio</p><h1>Explore <em>evidence-backed solutions</em> before committing.</h1><p className="hero-lede">Select one live BottleShopManager feature request from the backlog. Five specialised AI agents research it, design three options, select one for prototyping and provide an advisory recommendation — to help you, the Product Manager, make a decision on what to do next.</p><div className="studio-principles"><span>Live GitHub backlog</span><span>Three designs · one prototype</span><span>Information gaps made visible</span></div></div>

      <aside className="request-selector" aria-label="Select a live backlog request">
        <div className="selector-head"><div><span className="card-kicker">Live BottleShopManager backlog</span><h2>Choose a feature request</h2></div><span className={`source-state source-${backlogState}`}>{backlogState === "ready" ? `${backlog.length} live requests` : backlogState}</span></div>
        {backlogState === "ready" && <><label htmlFor="feature-request">Feature request</label><select id="feature-request" value={selectedNumber ?? ""} onChange={(event) => selectIssue(Number(event.target.value))} disabled={runActive}>{backlog.map((issue) => <option key={issue.number} value={issue.number}>#{issue.number} · {issue.title}</option>)}</select></>}
        {backlogState === "loading" && <div className="selector-message">Connecting to the current GitHub backlog…</div>}
        {backlogState === "preview" && <div className="selector-message"><strong>Interface preview</strong><br />Connect the deployed API to load the live backlog. No request has been hardcoded.</div>}
        {backlogState === "error" && <div className="selector-message error"><strong>Backlog unavailable</strong><br />{backlogError}</div>}
        {selectedIssue && <div className="selected-request"><div><span>Selected live issue</span><strong>#{selectedIssue.number} · {selectedIssue.title}</strong></div><a href={selectedIssue.sourceUrl} target="_blank" rel="noreferrer">View source ↗</a><p>{selectedIssue.body.replace(/[*#>]/g, " ").replace(/\s+/g, " ").slice(0, 250)}…</p></div>}
        <div className="studio-actions">
          <button className="primary-button studio-button" type="button" onClick={exploreSolutions} disabled={runActive || backlogState !== "ready" || !selectedNumber}>{runActive ? `${stages.find((stage) => statuses[stage.key] === "running")?.role ?? "Agent"} is working…` : selectedRunCompleted ? "Run this request again" : "Explore Solutions"}<span aria-hidden="true">→</span></button>
          {runActive && <button className="cancel-pipeline-button" type="button" onClick={cancelPipeline}>Cancel pipeline</button>}
        </div>
        <p className="decision-note">No feature, roadmap or investment decision is written back.</p>
        {retryNotice && <div className="retry-notice" role="status"><strong>Temporary AI demand</strong><br />{retryNotice}</div>}
        {runCancelled && <div className="cancelled-notice" role="status"><strong>Pipeline cancelled</strong><br />{runCancelled}</div>}
        {runError && <div className="run-error" role="alert"><strong>Pipeline stopped at {errorStageRole ?? "agent"}:</strong> {runError}</div>}
      </aside>
    </section>

    <section className="pipeline-section" id="pipeline" ref={pipelineRef}>
      <div className="section-heading"><div><p className="eyebrow"><span /> Governed handoffs</p><h2>Five agents. Three designs. One prototype.</h2></div><p>The Researcher combines the live backlog request, current platform and market evidence. The Designer creates three options; the Manager selects one for prototyping; the Maker builds it; the Communicator explains its impact and effort; and the Manager completes the final three-option review.</p></div>
      <div className="studio-pipeline">
        {stages.map((item, index) => <button key={item.key} type="button" className={`pipeline-node ${index === activeStage ? "active" : ""}`} onClick={() => selectStage(index)} aria-pressed={index === activeStage}><span className={`stage-orb ${item.accent}`}>{item.number}</span><span><strong>{item.role}</strong><small>{item.name}</small></span><span className={`stage-status status-${statuses[item.key]}`}>{statuses[item.key] === "running" && <span className="stage-throbber" aria-hidden="true" />}{statuses[item.key] === "running" ? `Working for ${item.key === runningStageKey ? elapsedSeconds : 0} seconds` : statuses[item.key] === "idle" ? "waiting" : statuses[item.key]}</span><p>{item.output}</p></button>)}
      </div>
      {repairNotice && statuses[repairNotice.stage] === "running" && <div className="agent-repair-banner" role="status"><span className="stage-throbber" aria-hidden="true" /><div><strong>{stages.find((stage) => stage.key === repairNotice.stage)?.role} is {repairNotice.activity} · attempt {repairNotice.attempt} of {repairNotice.maxAttempts}</strong><p>{repairNotice.reason}</p></div></div>}
      <div className="pipeline-boundary"><div><strong>{stages[activeStage].role}</strong><span>AI-generated · verify before use</span></div><p>{activeArtifact?.receivedHandoff ? `Received ${activeArtifact.receivedHandoff.from} artifact ${activeArtifact.receivedHandoff.artifactId}; produced ${activeArtifact.artifactId}.` : activeArtifact ? `Produced Researcher artifact ${activeArtifact.artifactId} for the Designer handoff.` : activeStage === 4 ? "Provides an advisory recommendation and backlog-improvement questions. The Product Manager retains the final decision." : "Cannot approve work, change the backlog or bypass the next evidence handoff."}</p></div>
      <div className="agent-output-workspace" aria-live="polite">
        <div className="agent-request-context">
          <div><span>Selected live request</span><strong>{artifacts.researcher ? `#${artifacts.researcher.featureRequest.issueNumber} · ${artifacts.researcher.featureRequest.title}` : selectedIssue ? `#${selectedIssue.number} · ${selectedIssue.title}` : "Choose a feature request above"}</strong></div>
          <div><span>Viewing agent output</span><strong>{stages[activeStage].role} · {stages[activeStage].name}</strong></div>
          <span className="agent-ai-disclosure">✦ AI-generated · verify before use</span>
        </div>
        <div className="agent-output-heading">
          <div><span className="card-kicker">{stages[activeStage].role} output</span><h3>{stages[activeStage].output}</h3></div>
          <span className={`stage-status output-status status-${activeStatus}`}>{activeStatus === "running" && <span className="stage-throbber" aria-hidden="true" />}{activeStatus === "idle" ? "waiting" : activeStatus}</span>
        </div>
        {retryNotice && activeStatus === "running" && <div className="agent-run-notice" role="status"><span className="stage-throbber" aria-hidden="true" /><p><strong>Temporary AI demand</strong>{retryNotice}</p></div>}

        {!activeHasOutput && <div className={`agent-output-placeholder placeholder-${activeStatus}`}><span className={activeStatus === "running" ? "stage-throbber large" : "waiting-orb"} aria-hidden="true" /><div><strong>{activeStatus === "running" ? `${stages[activeStage].role} is working` : activeStatus === "error" ? `${stages[activeStage].role} could not complete` : activeStatus === "cancelled" ? `${stages[activeStage].role} was cancelled` : `${stages[activeStage].role} is waiting`}</strong><p>{activeStatus === "running" ? "The agent is processing its governed handoff. Longer prototype work can take several minutes; its output will appear here when complete." : activeStatus === "error" ? (activeStageKey === runErrorStage && runError ? runError : "Run the selected request again to retry this stage.") : activeStatus === "cancelled" ? "The Product Manager cancelled this run. No further agent handoffs will begin." : "This agent will begin after it receives the required output from the previous stage."}</p></div></div>}

      {activeStageKey === "researcher" && artifacts.researcher && <>
      <div className="research-grid">
        <article className="request-quality"><div className="panel-heading"><div><span className="card-kicker">Researcher · request readiness</span><h3>{artifacts.researcher.requestAssessment.completeness} information quality</h3></div><span className={`quality-chip quality-${artifacts.researcher.requestAssessment.completeness}`}>{artifacts.researcher.requestAssessment.missingInformation.length} gaps</span></div><p>{artifacts.researcher.requestAssessment.confidenceRationale}</p><dl><div><dt>Primary user</dt><dd>{artifacts.researcher.problemFrame.primaryUser}</dd></div><div><dt>Problem</dt><dd>{artifacts.researcher.problemFrame.problemStatement}</dd></div><div><dt>Desired outcome</dt><dd>{artifacts.researcher.problemFrame.desiredOutcome}</dd></div></dl></article>
        <aside className="live-receipt"><span className="card-kicker">Researcher · live evidence receipts</span><div className="tool-name"><code>GitHub + Google Search</code><strong>{toolReceipt && marketResearchReceipt ? "Completed" : "Waiting"}</strong></div><div className="receipt-list"><div><span>Selected issue</span><strong>{toolReceipt ? `#${toolReceipt.selectedIssueNumber}` : "—"}</strong></div><div><span>Backlog context</span><strong>{toolReceipt ? `${toolReceipt.backlogIssueCount} live requests` : "—"}</strong></div><div><span>Comments retrieved</span><strong>{toolReceipt?.returnedCommentCount ?? "—"}</strong></div><div><span>Market sources</span><strong>{marketResearchReceipt?.sourceCount ?? "—"}</strong></div><div><span>Search queries</span><strong>{marketResearchReceipt?.searchQueries.length ?? "—"}</strong></div><div><span>Evidence time</span><strong>{marketResearchReceipt ? new Date(marketResearchReceipt.completedAt).toLocaleString("en-IE") : "—"}</strong></div></div>{marketResearchReceipt?.sources.length ? <details><summary>View live market sources</summary><ul>{marketResearchReceipt.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a></li>)}</ul></details> : null}</aside>
      </div>

      <article className="result-panel"><div className="panel-heading"><div><span className="card-kicker">Researcher · opportunity brief for Designer</span><h3>Current state, market patterns and problems worth solving</h3></div><span className="generated-chip">Live grounded research · verify sources</span></div><div className="brief-grid"><div><span>Current product</span><strong>Relevant workflow analysis</strong><p>{artifacts.researcher.currentProductAnalysis.currentStateSummary}</p></div><div><span>Market pattern</span><strong>{artifacts.researcher.marketResearch.findings[0]?.pattern}</strong><p>{artifacts.researcher.marketResearch.findings[0]?.applicability}</p></div><div><span>Designer handoff</span><strong>{artifacts.researcher.opportunityAnalysis.problemsWorthSolving[0]}</strong><p>{artifacts.researcher.designerHandoff.summary}</p></div></div></article>
      </>}

      {activeStageKey === "designer" && artifacts.designer && <><div className="result-section-title"><span>Designer output</span><h3>Three research-informed design specifications</h3><p>{artifacts.designer.relationshipBetweenApproaches}</p></div><div className="concept-grid">{artifacts.designer.concepts.map((concept, index) => <article className={`concept-card lens-${["focused", "integrated", "exploratory"][index]}`} key={concept.id}><div className="concept-top"><span>{lensLabel[concept.lens]}</span><small>{artifacts.prototypeSelection?.selectedConceptId === concept.id ? "Selected by Manager for prototyping" : lensCopy[concept.lens]}</small></div><h3>{concept.title}</h3><p>{concept.oneLineSummary}</p><div className="concept-meta"><span>Current product surface</span><strong>{concept.baselineSurface} · {concept.currentWorkflowReference}</strong></div><div className="concept-meta"><span>Evidence fit</span><strong>{concept.evidenceFit}</strong></div><details><summary>Open design specification</summary><p>{concept.designRationale}</p><ul>{concept.screenSpecifications.map((screen) => <li key={screen.name}><strong>{screen.name}:</strong> {screen.purpose}</li>)}</ul><small>Research used: {concept.researchFindingIds.join(", ")}</small></details><details><summary>Maker instructions</summary><ul>{concept.makerInstructions.map((item) => <li key={item}>{item}</li>)}</ul></details><details><summary>Assumptions and trade-offs</summary><ul>{[...concept.assumptions, ...concept.tradeoffs].map((item) => <li key={item}>{item}</li>)}</ul></details></article>)}</div></>}

      {activeStageKey === "manager" && artifacts.prototypeSelection && <article className="result-panel manager-panel"><div className="panel-heading"><div><span className="card-kicker">Manager · prototype-selection checkpoint</span><h3>Selected for prototyping: {artifacts.prototypeSelection.selectedTitle}</h3></div><span className="human-chip">Prototype allocation only</span></div><p className="manager-recommendation">{artifacts.prototypeSelection.selectionRationale}</p><div className="brief-grid">{artifacts.prototypeSelection.optionAssessment.map((option) => <div key={option.conceptId}><span>{option.status.replaceAll("_", " ")}</span><strong>{option.title}</strong><p>{option.reason}</p></div>)}</div><p className="final-disclosure">{artifacts.prototypeSelection.decisionBoundary}</p></article>}

      {activeStageKey === "maker" && artifacts.maker && currentPrototype && <article className="result-panel prototype-panel"><div className="panel-heading"><div><span className="card-kicker">Maker · selected AI-generated page prototype</span><h3>Manager-selected design implemented on its current page</h3></div><span className="generated-chip">One isolated prototype · current platform unchanged</span></div><div className="prototype-shell studio-prototype"><div className="prototype-intro"><div><span className="card-kicker">Assumption under test</span><h4>{currentPrototype.title}</h4><p>{currentPrototype.testableAssumption}</p></div><p>{currentPrototype.purpose}</p></div><div className="prototype-limit"><strong>Designer-to-Maker traceability</strong><p>{currentPrototype.designTraceability} Implemented: {currentPrototype.implementedDesignElements.join(" · ")}</p></div><PrototypeRenderer key={currentPrototype.conceptId} prototype={currentPrototype} lens={artifacts.designer?.concepts.find((item) => item.id === currentPrototype.conceptId)?.lens ? lensLabel[artifacts.designer.concepts.find((item) => item.id === currentPrototype.conceptId)!.lens] : "concept"} onOpenCurrentPlatform={() => { setWorkspaceView("platform"); window.scrollTo({ top: 0, behavior: "smooth" }); }} /><div className="prototype-limit"><strong>What this does not prove</strong><p>{currentPrototype.limitations.join(" · ")}</p></div></div></article>}

      {activeStageKey === "communicator" && artifacts.communicator && <article className="result-panel"><div className="panel-heading"><div><span className="card-kicker">Communicator · selected prototype only</span><h3>Prototype changes, impact and implementation effort</h3></div><span className="draft-chip">Draft · internal only</span></div><p>{artifacts.communicator.comparisonSummary}</p><div className="brief-grid single-brief">{artifacts.communicator.optionBriefs.map((brief) => <div key={brief.conceptId}><span>{brief.implementationEffort} effort</span><strong>{brief.headline}</strong><p>{brief.executiveSummary}</p><small>{brief.operationalImpact}</small><details><summary>Changes and effort drivers</summary><ul>{[...brief.changesInvolved, ...brief.effortDrivers].map((item) => <li key={item}>{item}</li>)}</ul></details></div>)}</div></article>}

      {activeStageKey === "manager" && artifacts.manager && <article className="result-panel manager-panel"><div className="panel-heading"><div><span className="card-kicker">Manager · final advisory review</span><h3>{artifacts.manager.requestReadiness === "needs_backlog_enrichment" ? "Improve the request before relying on the concepts" : `Recommended direction: ${recommended?.title}`}</h3></div><span className="human-chip">Product Manager decides</span></div><p className="manager-recommendation">{artifacts.manager.recommendation}</p><section className="decision-basis" aria-label="Decision basis"><div className="decision-basis-heading"><div><span className="card-kicker">Decision basis</span><h4>What supports this recommendation</h4></div><span>All five agent outputs reviewed</span></div><div className="decision-basis-grid"><div><span className="decision-basis-icon" aria-hidden="true">01</span><div><strong>Evidence trail</strong><p>{artifacts.manager.handoffAudit}</p></div></div><div><span className="decision-basis-icon" aria-hidden="true">02</span><div><strong>Strategic fit</strong><p>{artifacts.manager.strategicAlignmentSummary}</p></div></div></div>{artifacts.manager.whatWouldChangeRecommendation.length > 0 && <div className="recommendation-sensitivity"><div><span className="decision-basis-icon" aria-hidden="true">?</span><strong>What could change this recommendation?</strong></div><ul>{artifacts.manager.whatWouldChangeRecommendation.map((item) => <li key={item}>{item}</li>)}</ul></div>}</section><div className="ranking-table studio-ranking">{artifacts.manager.ranking.map((item) => <details key={item.conceptId} open={item.rank === 1}><summary><span className="rank-number">{item.rank}</span><div><strong>{item.title}</strong><small>{item.lens} · {item.confidence} confidence · {item.complexity}</small></div><span>{item.rank === 1 ? `${artifacts.manager?.recommendationStrength} recommendation` : "View executive summary"}</span></summary><p>{item.executiveSummary}</p><div className="contribution-grid"><div><span>Researcher</span><p>{item.agentContributions.researcher}</p></div><div><span>Designer</span><p>{item.agentContributions.designer}</p></div><div><span>Maker</span><p>{item.agentContributions.maker}</p></div><div><span>Communicator</span><p>{item.agentContributions.communicator}</p></div></div></details>)}</div><div className="manager-next"><div><span>Accountable human</span><strong>{artifacts.manager.accountableHumanRole}</strong></div><div><span>Suggested next step</span><strong>{artifacts.manager.suggestedNextStep}</strong></div><div><span>Decision boundary</span><strong>No selection or backlog change is made here.</strong></div></div><p className="final-disclosure">{artifacts.manager.finalDisclosure}</p></article>}

      {activeStageKey === "manager" && artifacts.manager && <article className="gap-panel"><div className="panel-heading"><div><span className="card-kicker">Manager · cumulative information-gap tracker</span><h3>{artifacts.manager.requestReadiness === "needs_backlog_enrichment" ? "Improve the backlog request, then run it again." : "Questions to carry into concept validation."}</h3></div><span className="gap-count">{artifacts.manager.consolidatedInformationGaps.length} questions</span></div><p>{artifacts.manager.informationQualitySummary}</p>{artifacts.manager.consolidatedInformationGaps.length ? <div className="gap-list">{artifacts.manager.consolidatedInformationGaps.map((gap, index) => <div key={`${gap.category}-${index}`}><span>{formatGapCategory(gap.category)}</span><div><strong>{gap.questionForProductManager}</strong><p>{gap.whyItMatters}</p><small>Raised by: {gap.sourceAgents?.map(formatGapCategory).join(", ")}</small></div></div>)}</div> : <div className="no-gaps">No critical information gaps remained in this run. Validate the assumptions with real users before commitment.</div>}</article>}
      </div>
    </section>
    </>}

    <footer><span>BottleShopManager · Solution Studio</span><span>Fictional Irish B2B retail platform · Synthetic academic prototype</span><span>AI advises · Product Manager decides</span></footer>
  </main>;
}
