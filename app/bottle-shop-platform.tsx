import { useState } from "react";
import { productBaseline } from "../domain/product-baseline.js";

type CurrentProductProps = { onOpenStudio: () => void };

const exampleRows = [
  { name: "Example inventory item A", status: "Review due", owner: "Shop manager" },
  { name: "Example inventory item B", status: "No open task", owner: "Inventory team" },
  { name: "Example operational record C", status: "Awaiting update", owner: "Shift supervisor" },
];

export default function BottleShopPlatform({ onOpenStudio }: CurrentProductProps) {
  const [activeModule, setActiveModule] = useState("overview");
  const module = productBaseline.modules.find((item) => item.id === activeModule) ?? productBaseline.modules[0];

  return <section className="baseline-wrap" aria-label="BottleShopManager current product baseline">
    <div className="baseline-banner"><div><span>Current product baseline</span><strong>Fictional interface · synthetic demonstration data</strong></div><button type="button" onClick={onOpenStudio}>Open Solution Studio <span>→</span></button></div>
    <div className="platform-window">
      <aside className="platform-sidebar">
        <div className="platform-logo"><span className="bsm-mark" aria-hidden="true"><i /><i /><i /></span><div><strong>BottleShopManager</strong><small>Operations platform</small></div></div>
        <div className="demo-store"><span>Current workspace</span><strong>Example demo store</strong><small>Synthetic environment</small></div>
        <nav aria-label="Current product modules">{productBaseline.modules.map((item) => <button type="button" className={item.id === module.id ? "active" : ""} key={item.id} onClick={() => setActiveModule(item.id)}><span>{item.label.slice(0, 1)}</span><div><strong>{item.label}</strong><small>{item.description}</small></div></button>)}</nav>
        <div className="baseline-note"><span>Baseline v1</span><p>This interface shows what exists before any AI-proposed concept. It is not a production system.</p></div>
      </aside>
      <div className="platform-main">
        <header><div><span>Example demo store</span><strong>{module.label}</strong></div><div className="platform-user"><button type="button" aria-label="Open help">?</button><span>PM</span></div></header>
        <div className="platform-content">
          <div className="platform-title"><div><span>Current module</span><h2>{module.label}</h2><p>{module.description}</p></div><button type="button">Export current view</button></div>
          <div className="current-workflow"><span>How it works today</span><p>{module.currentWorkflow}</p></div>
          <div className="baseline-metrics"><div><span>Open operational work</span><strong>Not measured in demo</strong><small>Unknown values remain explicit</small></div><div><span>Latest activity</span><strong>Synthetic records only</strong><small>No real shop information</small></div><div><span>Permissions</span><strong>Role-based review</strong><small>Manager approval where required</small></div></div>
          <div className="baseline-table"><div className="table-heading"><div><span>Representative current records</span><strong>{module.label} workspace</strong></div><button type="button">Filter</button></div>{exampleRows.map((row) => <div className="baseline-row" key={row.name}><span className="row-icon">{row.name.slice(-1)}</span><div><strong>{row.name}</strong><small>{row.owner}</small></div><span>{row.status}</span><button type="button">Open</button></div>)}</div>
        </div>
      </div>
    </div>
  </section>;
}
