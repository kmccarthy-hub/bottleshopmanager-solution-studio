import { useState } from "react";

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
  documentHtml: string;
  interactionSummary: string;
  interactiveStates: string[];
  limitations: string[];
};

type PrototypeRendererProps = { prototype: InteractivePrototype; lens: string; onOpenCurrentPlatform: () => void };

const sandboxPolicy = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; media-src 'none'; object-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none';";

function createSandboxDocument(documentHtml: string) {
  const policy = `<meta http-equiv="Content-Security-Policy" content="${sandboxPolicy}"><meta name="referrer" content="no-referrer">`;
  if (/<head[^>]*>/i.test(documentHtml)) return documentHtml.replace(/<head([^>]*)>/i, `<head$1>${policy}`);
  return documentHtml.replace(/<html([^>]*)>/i, `<html$1><head>${policy}</head>`);
}

export default function PrototypeRenderer({ prototype, lens, onOpenCurrentPlatform }: PrototypeRendererProps) {
  const [revision, setRevision] = useState(0);
  const source = createSandboxDocument(prototype.documentHtml);

  return <div className="generated-prototype-wrap">
    <div className="prototype-safety-bar">
      <div><span>Generated page copy</span><strong>Isolated from the current BottleShopManager platform</strong></div>
      <div><button type="button" onClick={onOpenCurrentPlatform}>View unchanged current page</button><button type="button" onClick={() => setRevision((value) => value + 1)}>Reset generated prototype</button></div>
    </div>
    <div className="prototype-code-meta"><span>{lens}</span><span>Source: {prototype.baselineSourceId}</span><span>{prototype.baselineAnchorsPreserved.length} current-page elements preserved</span><span>No network · no storage · no platform writes</span></div>
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
