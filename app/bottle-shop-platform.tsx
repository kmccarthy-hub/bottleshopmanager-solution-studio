import { useState } from "react";
import { productBaseline } from "../domain/product-baseline.js";

type CurrentProductProps = { onOpenStudio: () => void };
type StatusTone = "neutral" | "good" | "attention" | "risk" | "violet";

const products = [
  { name: "Docklands Lager · 12 × 330ml", category: "Beer", supplier: "Example Drinks Co.", onHand: "18 cases", available: "16 cases", status: "Low stock", tone: "attention" as StatusTone },
  { name: "Atlantic Coast Sauvignon Blanc", category: "Wine", supplier: "Sample Wine Partners", onHand: "31 bottles", available: "29 bottles", status: "In stock", tone: "good" as StatusTone },
  { name: "Orchard Lane Cider · 8 × 500ml", category: "Cider", supplier: "Example Drinks Co.", onHand: "7 cases", available: "7 cases", status: "Count due", tone: "violet" as StatusTone },
  { name: "Northside Zero · 6 × 330ml", category: "Alcohol-free", supplier: "Demo Distribution", onHand: "22 packs", available: "21 packs", status: "In stock", tone: "good" as StatusTone },
];

const staff = [
  { initials: "AB", name: "Aoife Brennan", role: "Store Manager", email: "aoife@example.invalid", access: "Manager", stores: "Example demo store", status: "Active" },
  { initials: "DO", name: "Daniel Okafor", role: "Shift Supervisor", email: "daniel@example.invalid", access: "Supervisor", stores: "Example demo store", status: "Active" },
  { initials: "SK", name: "Sofia Khan", role: "Sales Assistant", email: "sofia@example.invalid", access: "Operations", stores: "Example demo store", status: "Active" },
  { initials: "RM", name: "Ronan Murphy", role: "Cover Staff", email: "ronan@example.invalid", access: "Broad temporary role", stores: "Two demo stores", status: "Review access" },
];

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: StatusTone }) { return <span className={`business-badge badge-${tone}`}>{children}</span>; }

function ModuleTitle({ label, description, action }: { label: string; description: string; action: string }) { return <div className="platform-title"><div><span>Current module</span><h2>{label}</h2><p>{description}</p></div><button type="button">{action}</button></div>; }

function CurrentWorkflow({ children }: { children: React.ReactNode }) { return <div className="current-workflow"><span>How it works today</span><p>{children}</p></div>; }

function OverviewPage() { return <>
  <ModuleTitle label="Overview" description="Today’s operational position across the example store" action="Customise overview" />
  <div className="business-kpis"><div><span>Stock requiring review</span><strong>6</strong><small>Across inventory and receiving</small></div><div><span>Expected deliveries</span><strong>3</strong><small>Two suppliers represented</small></div><div><span>Open shift tasks</span><strong>5</strong><small>Two marked for handover</small></div><div><span>Access reviews</span><strong>1</strong><small>Temporary cover role</small></div></div>
  <div className="overview-grid"><section className="business-panel"><div className="business-panel-head"><div><span>Today’s priorities</span><strong>Operational work requiring attention</strong></div><button type="button">View all</button></div>{[
    ["Review low-stock products", "Inventory", "Before next supplier order", "attention"],
    ["Resolve receiving discrepancy", "Supplier Orders", "Delivery received this morning", "risk"],
    ["Confirm evening cover", "Shift Operations", "Handover begins at 17:00", "violet"],
  ].map(([title, area, note, tone]) => <div className="activity-row" key={title}><span className="activity-dot" /><div><strong>{title}</strong><small>{area} · {note}</small></div><Badge tone={tone as StatusTone}>Open</Badge></div>)}</section><section className="business-panel"><div className="business-panel-head"><div><span>Recent activity</span><strong>Latest traceable changes</strong></div></div>{[
    ["Delivery receipt updated", "Daniel O. · Supplier Orders"], ["Inventory count completed", "Sofia K. · Inventory"], ["Temporary access extended", "Aoife B. · Staff & Access"],
  ].map(([title, note]) => <div className="activity-row compact" key={title}><span className="activity-initial">{title.slice(0, 1)}</span><div><strong>{title}</strong><small>{note}</small></div></div>)}</section></div>
  <CurrentWorkflow>Managers start with a cross-module summary, then open each area to investigate and complete work. The baseline does not yet combine related actions into one guided flow.</CurrentWorkflow>
</>; }

function InventoryPage() { return <>
  <ModuleTitle label="Inventory" description="Products, stock availability, counts and adjustments" action="Add product" />
  <div className="module-toolbar"><div className="fake-search">⌕ <span>Search product name or category</span></div><button type="button">All categories</button><button type="button">Stock status</button><button type="button">More filters</button></div>
  <div className="business-panel data-panel"><div className="business-panel-head"><div><span>Product inventory</span><strong>Example demo store · synthetic records</strong></div><button type="button">Export</button></div><div className="business-table inventory-table"><div className="business-tr business-th"><span>Product</span><span>Category</span><span>Supplier</span><span>On hand</span><span>Available</span><span>Status</span><span /></div>{products.map((product) => <div className="business-tr" key={product.name}><div className="product-cell"><span className="product-thumb">{product.category.slice(0, 1)}</span><strong>{product.name}</strong></div><span>{product.category}</span><span>{product.supplier}</span><strong>{product.onHand}</strong><span>{product.available}</span><Badge tone={product.tone}>{product.status}</Badge><button type="button">•••</button></div>)}</div></div>
  <CurrentWorkflow>Staff search products and open individual records to count stock or enter an adjustment. Low-stock review is manual and separate from building a supplier order.</CurrentWorkflow>
</>; }

function OrdersPage() { const orders = [
  ["DEMO-1042", "Example Drinks Co.", "Draft", "14 lines", "Tue 18 Aug", "attention"],
  ["DEMO-1041", "Sample Wine Partners", "Awaiting delivery", "9 lines", "Wed 19 Aug", "violet"],
  ["DEMO-1040", "Demo Distribution", "Part received", "6 lines", "Mon 17 Aug", "risk"],
  ["DEMO-1039", "Example Drinks Co.", "Received", "11 lines", "Fri 14 Aug", "good"],
]; return <>
  <ModuleTitle label="Supplier Orders" description="Draft purchase orders, confirmations and delivery receipt" action="Create draft order" />
  <div className="order-summary"><div><span>Drafts</span><strong>1</strong></div><div><span>Awaiting delivery</span><strong>1</strong></div><div><span>Needs review</span><strong>1</strong></div><div><span>Received this week</span><strong>4</strong></div></div>
  <div className="business-panel data-panel"><div className="business-panel-head"><div><span>Supplier orders</span><strong>Current and recent records</strong></div><div className="head-actions"><button type="button">Filter</button><button type="button">Export</button></div></div><div className="business-table order-table"><div className="business-tr business-th"><span>Order</span><span>Supplier</span><span>Status</span><span>Contents</span><span>Expected</span><span /></div>{orders.map(([id, supplier, status, lines, expected, tone]) => <div className="business-tr" key={id}><strong>{id}</strong><span>{supplier}</span><Badge tone={tone as StatusTone}>{status}</Badge><span>{lines}</span><span>{expected}</span><button type="button">Open</button></div>)}</div></div>
  <CurrentWorkflow>Managers create separate drafts and explicitly confirm each supplier order. Receiving staff later open the expected order and enter delivered quantities; discrepancies are followed up separately.</CurrentWorkflow>
</>; }

function TransfersPage() { const transfers = [
  ["TR-DEMO-28", "Example demo store", "Example north store", "Ready to dispatch", "4 product lines", "attention"],
  ["TR-DEMO-27", "Example west store", "Example demo store", "Awaiting receipt", "7 product lines", "violet"],
  ["TR-DEMO-26", "Example demo store", "Example west store", "Completed", "3 product lines", "good"],
]; return <>
  <ModuleTitle label="Stock Transfers" description="Operational record of stock moving between example stores" action="New stock adjustment" />
  <div className="transfer-flow"><div><span>1</span><strong>Adjust source stock</strong><small>Recorded in the sending store</small></div><i>→</i><div><span>2</span><strong>Notify destination</strong><small>Handled outside the platform</small></div><i>→</i><div><span>3</span><strong>Adjust destination stock</strong><small>Entered as a second action</small></div></div>
  <div className="business-panel data-panel"><div className="business-panel-head"><div><span>Manually linked movements</span><strong>Transfer reference workspace</strong></div><button type="button">Filter</button></div><div className="business-table transfer-table"><div className="business-tr business-th"><span>Reference</span><span>From</span><span>To</span><span>Contents</span><span>Status</span><span /></div>{transfers.map(([id, from, to, lines, status, tone]) => <div className="business-tr" key={id}><strong>{id}</strong><span>{from}</span><span>{to}</span><span>{lines}</span><Badge tone={tone as StatusTone}>{status}</Badge><button type="button">Open</button></div>)}</div></div>
  <CurrentWorkflow>Staff record separate stock adjustments in each store and use a shared reference to reconcile them. There is no single approval, dispatch and receipt lifecycle.</CurrentWorkflow>
</>; }

function StaffPage() { return <>
  <ModuleTitle label="Staff & Access" description="People, store roles, permissions and account status" action="Invite staff member" />
  <div className="module-toolbar"><div className="fake-search">⌕ <span>Search staff name or email</span></div><button type="button">All roles</button><button type="button">All stores</button><button type="button">Access review</button></div>
  <div className="staff-grid">{staff.map((person) => <article className="staff-card" key={person.email}><div className="staff-card-top"><span className="staff-avatar">{person.initials}</span><Badge tone={person.status === "Review access" ? "attention" : "good"}>{person.status}</Badge></div><h3>{person.name}</h3><p>{person.role}</p><dl><div><dt>Email</dt><dd>{person.email}</dd></div><div><dt>Access</dt><dd>{person.access}</dd></div><div><dt>Store scope</dt><dd>{person.stores}</dd></div></dl><button type="button">View profile and permissions</button></article>)}</div>
  <CurrentWorkflow>Managers assign permanent role bundles. Cover staff often receive the closest broad role, and a manager must remember to change or remove it later.</CurrentWorkflow>
</>; }

function ShiftsPage() { const days = ["Mon 10", "Tue 11", "Wed 12", "Thu 13", "Fri 14", "Sat 15", "Sun 16"]; const shiftSets = [
  [["Aoife B.", "09:00–17:00", "manager"], ["Sofia K.", "12:00–20:00", "sales"]],
  [["Daniel O.", "09:00–17:00", "supervisor"], ["Ronan M.", "16:00–22:00", "cover"]],
  [["Aoife B.", "10:00–18:00", "manager"], ["Sofia K.", "14:00–22:00", "sales"]],
  [["Daniel O.", "09:00–17:00", "supervisor"], ["Sofia K.", "12:00–20:00", "sales"]],
  [["Aoife B.", "09:00–17:00", "manager"], ["Ronan M.", "16:00–22:00", "cover"]],
  [["Daniel O.", "10:00–18:00", "supervisor"], ["Sofia K.", "14:00–22:00", "sales"]],
  [["Aoife B.", "11:00–19:00", "manager"]],
]; return <>
  <ModuleTitle label="Shift Operations" description="Weekly rota, cover and operational handover context" action="Add shift" />
  <div className="calendar-toolbar"><div><button type="button">←</button><strong>10–16 August 2026</strong><button type="button">→</button></div><div><button type="button">Today</button><button type="button">Week view</button></div></div>
  <div className="shift-calendar">{days.map((day, index) => <div className="calendar-day" key={day}><header><span>{day.split(" ")[0]}</span><strong>{day.split(" ")[1]}</strong></header><div className="shift-hours"><small>09:00</small><small>13:00</small><small>17:00</small><small>21:00</small></div><div className="shift-blocks">{shiftSets[index].map(([name, time, role]) => <button type="button" className={`shift-block shift-${role}`} key={`${day}-${name}`}><strong>{name}</strong><small>{time}</small></button>)}</div></div>)}</div>
  <div className="shift-footer"><div><span className="legend manager" />Manager</div><div><span className="legend supervisor" />Supervisor</div><div><span className="legend sales" />Sales assistant</div><div><span className="legend cover" />Cover staff</div><p>All names and shifts are synthetic.</p></div>
  <CurrentWorkflow>Managers build the rota and record separate tasks. Shift changes and unresolved operational notes are communicated outside a structured handover flow.</CurrentWorkflow>
</>; }

function ReportingPage() { const reports = [
  ["Inventory position", "Stock on hand, availability and count status", "Inventory", "Daily"],
  ["Supplier order status", "Draft, expected and received orders", "Orders", "Weekly"],
  ["Stock adjustments", "Counts, wastage and correction history", "Inventory", "Weekly"],
  ["Staff access review", "Roles, store scope and account status", "Staff", "Monthly"],
  ["Operational activity", "Traceable changes across selected modules", "Overview", "On demand"],
  ["Transfer reconciliation", "Linked source and destination adjustments", "Transfers", "On demand"],
]; return <>
  <ModuleTitle label="Reporting" description="Saved operational reports and exports" action="Create saved view" />
  <div className="reporting-head"><div className="fake-search">⌕ <span>Find a report</span></div><div><button type="button">My reports</button><button type="button">All operational reports</button></div></div>
  <div className="report-grid">{reports.map(([name, description, source, cadence]) => <article className="report-card" key={name}><div className="report-icon">▥</div><Badge tone="neutral">{source}</Badge><h3>{name}</h3><p>{description}</p><div><span>Default cadence</span><strong>{cadence}</strong></div><button type="button">Open report <span>→</span></button></article>)}</div>
  <CurrentWorkflow>Managers open predefined reports and export records for deeper analysis. The current dashboard does not adapt its information to a named decision or user role.</CurrentWorkflow>
</>; }

function ModulePage({ moduleId }: { moduleId: string }) {
  if (moduleId === "inventory") return <InventoryPage />;
  if (moduleId === "orders") return <OrdersPage />;
  if (moduleId === "transfers") return <TransfersPage />;
  if (moduleId === "staff") return <StaffPage />;
  if (moduleId === "shifts") return <ShiftsPage />;
  if (moduleId === "reporting") return <ReportingPage />;
  return <OverviewPage />;
}

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
        <div className="platform-content"><ModulePage moduleId={module.id} /></div>
      </div>
    </div>
  </section>;
}
