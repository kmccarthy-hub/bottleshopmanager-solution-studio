import { useState } from "react";
import { productBaseline } from "../domain/product-baseline.js";

export type PrototypeRecord = { id: string; label: string; context: string; status: string };
export type InteractivePrototype = {
  conceptId: string;
  title: string;
  purpose: string;
  baselineSurface: string;
  interactionPattern: "review_queue" | "guided_workflow" | "insight_workspace";
  currentWorkflow: string;
  proposedWorkflow: string;
  testableAssumption: string;
  changeHighlights: string[];
  sampleRecords: PrototypeRecord[];
  primaryActionLabel: string;
  successMessage: string;
  exceptionalState: string;
  limitations: string[];
};

type PrototypeRendererProps = { prototype: InteractivePrototype; lens: string };

function ProductFrame({ prototype, children }: PrototypeRendererProps & { children: React.ReactNode }) {
  const module = productBaseline.modules.find((item) => item.id === prototype.baselineSurface);
  return <div className="proposal-frame">
    <aside><div className="mini-brand"><span className="bsm-mark" aria-hidden="true"><i /><i /><i /></span><strong>BSM</strong></div>{productBaseline.modules.map((item) => <span className={item.id === prototype.baselineSurface ? "active" : ""} key={item.id}>{item.label.slice(0, 1)}</span>)}</aside>
    <div className="proposal-main"><header><div><small>Example demo store</small><strong>{module?.label ?? prototype.baselineSurface}</strong></div><span>AI concept prototype</span></header>{children}</div>
  </div>;
}

export default function PrototypeRenderer({ prototype, lens }: PrototypeRendererProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [activeRecord, setActiveRecord] = useState(prototype.sampleRecords[0]?.id ?? "");
  const [drafted, setDrafted] = useState(false);
  const [complete, setComplete] = useState(false);

  function reset() { setSelected([]); setDismissed([]); setStep(0); setActiveRecord(prototype.sampleRecords[0]?.id ?? ""); setDrafted(false); setComplete(false); }
  function toggle(id: string) { setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); }
  const visibleRecords = prototype.sampleRecords.filter((record) => !dismissed.includes(record.id));
  const chosenRecord = prototype.sampleRecords.find((record) => record.id === activeRecord) ?? prototype.sampleRecords[0];

  return <ProductFrame prototype={prototype} lens={lens}>
    <div className="change-strip"><div><span>Current product</span><p>{prototype.currentWorkflow}</p></div><span className="change-arrow">→</span><div><span>Proposed {lens} concept</span><p>{prototype.proposedWorkflow}</p></div></div>
    <div className="proposal-content">
      <div className="proposal-heading"><div><span>{lens} prototype · synthetic data</span><h4>{prototype.title}</h4></div><button type="button" onClick={reset}>Reset prototype</button></div>
      <div className="change-tags">{prototype.changeHighlights.map((item) => <span key={item}>{item}</span>)}</div>

      {complete && <div className="prototype-success" role="status"><span>✓</span><div><strong>Prototype state completed</strong><p>{prototype.successMessage}</p></div><button type="button" onClick={reset}>Run again</button></div>}

      {!complete && prototype.interactionPattern === "review_queue" && <div className="queue-pattern">
        {step === 0 ? <><div className="interaction-guidance"><strong>Select example records to review</strong><span>{selected.length} selected</span></div><div className="prototype-records">{visibleRecords.map((record) => <label key={record.id} className={selected.includes(record.id) ? "selected" : ""}><input type="checkbox" checked={selected.includes(record.id)} onChange={() => toggle(record.id)} /><div><strong>{record.label}</strong><p>{record.context}</p></div><span>{record.status}</span></label>)}</div><div className="prototype-actions"><button type="button" className="secondary" disabled={!selected.length} onClick={() => { setDismissed((items) => [...items, ...selected]); setSelected([]); }}>Dismiss selected</button><button type="button" disabled={!selected.length} onClick={() => setStep(1)}>Review selected <span>→</span></button></div></> : <><div className="review-state"><span>Review before confirmation</span><h5>{selected.length} example record{selected.length === 1 ? "" : "s"} selected</h5>{prototype.sampleRecords.filter((record) => selected.includes(record.id)).map((record) => <div key={record.id}><strong>{record.label}</strong><small>{record.context}</small></div>)}</div><div className="prototype-actions"><button type="button" className="secondary" onClick={() => setStep(0)}>Back</button><button type="button" onClick={() => setComplete(true)}>{prototype.primaryActionLabel} <span>→</span></button></div></>}
        {!visibleRecords.length && <div className="exception-state"><strong>No records remain in this review.</strong><p>{prototype.exceptionalState}</p><button type="button" onClick={reset}>Restore examples</button></div>}
      </div>}

      {!complete && prototype.interactionPattern === "guided_workflow" && <div className="workflow-pattern"><div className="workflow-steps">{prototype.sampleRecords.map((record, index) => <button type="button" key={record.id} className={index === step ? "active" : index < step ? "complete" : ""} onClick={() => setStep(index)}><span>{index < step ? "✓" : index + 1}</span><div><strong>{record.label}</strong><small>{record.status}</small></div></button>)}</div><div className="workflow-stage"><span>Workflow step {step + 1}</span><h5>{prototype.sampleRecords[step]?.label}</h5><p>{prototype.sampleRecords[step]?.context}</p><div className="state-callout"><strong>Proposed connected state</strong><p>{prototype.proposedWorkflow}</p></div><div className="prototype-actions"><button type="button" className="secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Back</button>{step < prototype.sampleRecords.length - 1 ? <button type="button" onClick={() => setStep((value) => value + 1)}>Continue <span>→</span></button> : <button type="button" onClick={() => setComplete(true)}>{prototype.primaryActionLabel} <span>→</span></button>}</div></div></div>}

      {!complete && prototype.interactionPattern === "insight_workspace" && <div className="insight-pattern"><div className="signal-list"><span>Example signals</span>{prototype.sampleRecords.map((record) => <button type="button" className={record.id === activeRecord ? "active" : ""} key={record.id} onClick={() => { setActiveRecord(record.id); setDrafted(false); }}><strong>{record.label}</strong><small>{record.status}</small></button>)}</div><div className="signal-detail"><span>Why this is shown</span><h5>{chosenRecord?.label}</h5><p>{chosenRecord?.context}</p><div className="explanation-box"><strong>AI-generated explanation</strong><p>{prototype.testableAssumption}</p><small>Verify this interpretation with operational users.</small></div>{drafted ? <div className="draft-state"><strong>Added to a synthetic working draft</strong><p>The Product Manager can review or remove this input before any decision.</p><button type="button" onClick={() => setComplete(true)}>{prototype.primaryActionLabel} <span>→</span></button></div> : <button type="button" className="full-action" onClick={() => setDrafted(true)}>Use this example in draft <span>→</span></button>}</div></div>}
    </div>
  </ProductFrame>;
}
