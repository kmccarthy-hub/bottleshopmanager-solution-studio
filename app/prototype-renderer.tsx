import { useMemo, useState } from "react";
import { createPrototypeBaselineDocument } from "../domain/prototype-baselines.js";

type PrototypeModification = {
  id: string;
  targetAnchor: string;
  placement: "before" | "after" | "prepend" | "append";
  purpose: string;
  html: string;
};

export type InteractivePrototype = {
  conceptId: string;
  title: string;
  purpose: string;
  baselineSurface: string;
  baselineSourceId: string;
  baselineAnchorsPreserved: string[];
  currentWorkflow: string;
  proposedWorkflow: string;
  testableAssumption: string;
  implementedDesignElements: string[];
  omittedDesignElements: string[];
  designTraceability: string;
  changeHighlights: string[];
  modifications: PrototypeModification[];
  prototypeCss: string;
  prototypeScript: string;
  interactionSummary: string;
  interactiveStates: string[];
  limitations: string[];
};

type PrototypeRendererProps = { prototype: InteractivePrototype; lens: string; onOpenCurrentPlatform: () => void };

const sandboxPolicy = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none';";
const placements = { before: "beforebegin", after: "afterend", prepend: "afterbegin", append: "beforeend" } as const;

function createSandboxDocument(prototype: InteractivePrototype) {
  const parser = new DOMParser();
  const document = parser.parseFromString(createPrototypeBaselineDocument(prototype.baselineSurface), "text/html");
  const policy = document.createElement("meta");
  policy.setAttribute("http-equiv", "Content-Security-Policy");
  policy.setAttribute("content", sandboxPolicy);
  document.head.prepend(policy);
  const referrer = document.createElement("meta");
  referrer.setAttribute("name", "referrer");
  referrer.setAttribute("content", "no-referrer");
  document.head.prepend(referrer);

  for (const modification of prototype.modifications) {
    const target = document.querySelector(`[data-baseline-anchor="${modification.targetAnchor}"]`);
    if (!target) throw new Error(`Prototype target ${modification.targetAnchor} is unavailable.`);
    target.insertAdjacentHTML(placements[modification.placement], modification.html);
  }

  const style = document.createElement("style");
  style.setAttribute("data-generated-by", "maker");
  style.textContent = prototype.prototypeCss;
  document.head.append(style);
  const script = document.createElement("script");
  script.setAttribute("data-generated-by", "maker");
  script.textContent = prototype.prototypeScript;
  document.body.append(script);
  return `<!doctype html>${document.documentElement.outerHTML}`;
}

export default function PrototypeRenderer({ prototype, lens, onOpenCurrentPlatform }: PrototypeRendererProps) {
  const [revision, setRevision] = useState(0);
  const source = useMemo(() => createSandboxDocument(prototype), [prototype]);

  return <div className="generated-prototype-wrap">
    <div className="prototype-safety-bar">
      <div><span>Generated modifications on locked baseline</span><strong>Current BottleShopManager page retained; only verified additions are applied</strong></div>
      <div><button type="button" onClick={onOpenCurrentPlatform}>View unchanged current page</button><button type="button" onClick={() => setRevision((value) => value + 1)}>Reset generated prototype</button></div>
    </div>
    <div className="prototype-code-meta"><span>{lens}</span><span>Locked source: {prototype.baselineSourceId}</span><span>{prototype.modifications.length} Maker modification{prototype.modifications.length === 1 ? "" : "s"}</span><span>No replace · no network · no platform writes</span></div>
    <iframe
      key={`${prototype.conceptId}-${revision}`}
      className="generated-prototype-frame"
      title={`${prototype.title} — isolated AI-generated prototype`}
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      srcDoc={source}
    />
    <div className="prototype-state-summary"><div><span>Interaction designed by Maker</span><strong>{prototype.interactionSummary}</strong></div><div><span>Observable prototype states</span><strong>{prototype.interactiveStates.join(" · ")}</strong></div></div>
  </div>;
}
