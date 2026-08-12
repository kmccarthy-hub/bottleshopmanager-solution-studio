const sharedShell = (moduleId, label, description, body) => `
<main class="bsm-page" data-baseline-source="bsm-baseline-v1-${moduleId}">
  <header class="module-header" data-baseline-anchor="module-header">
    <div><small>CURRENT MODULE</small><h1>${label}</h1><p>${description}</p></div>
    <button type="button">Current page action</button>
  </header>
  ${body}
  <aside class="current-workflow" data-baseline-anchor="current-workflow"><strong>HOW IT WORKS TODAY</strong><p>{{CURRENT_WORKFLOW}}</p></aside>
</main>`;

export const prototypeBaselinePages = {
  overview: {
    sourceId: "bsm-baseline-v1-overview",
    label: "Overview",
    anchors: ["module-header", "operational-summary", "priority-list", "current-workflow"],
    html: sharedShell("overview", "Overview", "Today's operational position across the example store", `
      <section class="kpi-grid" data-baseline-anchor="operational-summary"><article><span>Stock requiring review</span><strong>6</strong></article><article><span>Expected deliveries</span><strong>3</strong></article><article><span>Open shift tasks</span><strong>5</strong></article><article><span>Access reviews</span><strong>1</strong></article></section>
      <section class="panel" data-baseline-anchor="priority-list"><h2>Today's priorities</h2><div class="row"><strong>Review low-stock products</strong><span>Inventory · Open</span></div><div class="row"><strong>Resolve receiving discrepancy</strong><span>Supplier Orders · Open</span></div><div class="row"><strong>Confirm evening cover</strong><span>Shift Operations · Open</span></div></section>`),
  },
  inventory: {
    sourceId: "bsm-baseline-v1-inventory",
    label: "Inventory",
    anchors: ["module-header", "inventory-toolbar", "inventory-table", "current-workflow"],
    html: sharedShell("inventory", "Inventory", "Products, stock availability, counts and adjustments", `
      <div class="toolbar" data-baseline-anchor="inventory-toolbar"><label>Search products <input type="search" placeholder="Product name or category"></label><button type="button">All categories</button><button type="button">Stock status</button></div>
      <section class="panel" data-baseline-anchor="inventory-table"><h2>Product inventory</h2><table><thead><tr><th>Product</th><th>Category</th><th>Supplier</th><th>On hand</th><th>Status</th><th></th></tr></thead><tbody><tr><td>Docklands Lager · Example</td><td>Beer</td><td>Example Drinks Co.</td><td>18 cases</td><td>Low stock</td><td><button type="button">•••</button></td></tr><tr><td>Atlantic Coast Sauvignon Blanc · Example</td><td>Wine</td><td>Sample Wine Partners</td><td>31 bottles</td><td>In stock</td><td><button type="button">•••</button></td></tr><tr><td>Orchard Lane Cider · Example</td><td>Cider</td><td>Example Drinks Co.</td><td>7 cases</td><td>Count due</td><td><button type="button">•••</button></td></tr></tbody></table></section>`),
  },
  orders: {
    sourceId: "bsm-baseline-v1-orders",
    label: "Supplier Orders",
    anchors: ["module-header", "order-summary", "orders-table", "current-workflow"],
    html: sharedShell("orders", "Supplier Orders", "Draft purchase orders, confirmations and delivery receipt", `
      <section class="kpi-grid" data-baseline-anchor="order-summary"><article><span>Drafts</span><strong>1</strong></article><article><span>Awaiting delivery</span><strong>1</strong></article><article><span>Needs review</span><strong>1</strong></article></section>
      <section class="panel" data-baseline-anchor="orders-table"><h2>Supplier orders</h2><table><thead><tr><th>Order</th><th>Supplier</th><th>Status</th><th>Contents</th><th></th></tr></thead><tbody><tr><td>DEMO-1042</td><td>Example Drinks Co.</td><td>Draft</td><td>14 lines</td><td><button type="button">Open</button></td></tr><tr><td>DEMO-1041</td><td>Sample Wine Partners</td><td>Awaiting delivery</td><td>9 lines</td><td><button type="button">Open</button></td></tr></tbody></table></section>`),
  },
  transfers: {
    sourceId: "bsm-baseline-v1-transfers",
    label: "Stock Transfers",
    anchors: ["module-header", "transfer-flow", "transfer-table", "current-workflow"],
    html: sharedShell("transfers", "Stock Transfers", "Operational record of stock moving between example stores", `
      <section class="step-flow" data-baseline-anchor="transfer-flow"><article><strong>1 · Adjust source stock</strong><p>Recorded in sending store</p></article><article><strong>2 · Notify destination</strong><p>Handled outside platform</p></article><article><strong>3 · Adjust destination stock</strong><p>Entered separately</p></article></section>
      <section class="panel" data-baseline-anchor="transfer-table"><h2>Manually linked movements</h2><table><thead><tr><th>Reference</th><th>From</th><th>To</th><th>Status</th></tr></thead><tbody><tr><td>TR-DEMO-28</td><td>Example demo store</td><td>Example north store</td><td>Ready to dispatch</td></tr><tr><td>TR-DEMO-27</td><td>Example west store</td><td>Example demo store</td><td>Awaiting receipt</td></tr></tbody></table></section>`),
  },
  staff: {
    sourceId: "bsm-baseline-v1-staff",
    label: "Staff & Access",
    anchors: ["module-header", "staff-toolbar", "staff-directory", "current-workflow"],
    html: sharedShell("staff", "Staff & Access", "People, store roles, permissions and account status", `
      <div class="toolbar" data-baseline-anchor="staff-toolbar"><label>Search staff <input type="search" placeholder="Name or email"></label><button type="button">All roles</button><button type="button">All stores</button></div>
      <section class="card-grid" data-baseline-anchor="staff-directory"><article class="person-card"><strong>Aoife Brennan</strong><span>Store Manager · Active</span><p>aoife@example.invalid</p><button type="button">View profile and permissions</button></article><article class="person-card"><strong>Daniel Okafor</strong><span>Shift Supervisor · Active</span><p>daniel@example.invalid</p><button type="button">View profile and permissions</button></article><article class="person-card"><strong>Sofia Khan</strong><span>Sales Assistant · Active</span><p>sofia@example.invalid</p><button type="button">View profile and permissions</button></article></section>`),
  },
  shifts: {
    sourceId: "bsm-baseline-v1-shifts",
    label: "Shift Operations",
    anchors: ["module-header", "calendar-toolbar", "shift-calendar", "current-workflow"],
    html: sharedShell("shifts", "Shift Operations", "Weekly rota, cover and operational handover context", `
      <div class="toolbar" data-baseline-anchor="calendar-toolbar"><button type="button">←</button><strong>10–16 August 2026</strong><button type="button">→</button><button type="button">Week view</button></div>
      <section class="calendar" data-baseline-anchor="shift-calendar"><article><strong>Mon 10</strong><button type="button">Aoife B. · 09:00–17:00</button><button type="button">Sofia K. · 12:00–20:00</button></article><article><strong>Tue 11</strong><button type="button">Daniel O. · 09:00–17:00</button><button type="button">Ronan M. · 16:00–22:00</button></article><article><strong>Wed 12</strong><button type="button">Aoife B. · 10:00–18:00</button><button type="button">Sofia K. · 14:00–22:00</button></article></section>`),
  },
  reporting: {
    sourceId: "bsm-baseline-v1-reporting",
    label: "Reporting",
    anchors: ["module-header", "report-toolbar", "report-grid", "current-workflow"],
    html: sharedShell("reporting", "Reporting", "Saved operational reports and exports", `
      <div class="toolbar" data-baseline-anchor="report-toolbar"><label>Find a report <input type="search"></label><button type="button">My reports</button><button type="button">All operational reports</button></div>
      <section class="card-grid" data-baseline-anchor="report-grid"><article><strong>Inventory position</strong><p>Stock on hand, availability and count status</p><button type="button">Open report</button></article><article><strong>Supplier order status</strong><p>Draft, expected and received orders</p><button type="button">Open report</button></article><article><strong>Staff access review</strong><p>Roles, store scope and account status</p><button type="button">Open report</button></article></section>`),
  },
};

for (const page of Object.values(prototypeBaselinePages)) {
  page.html = page.html.replace("{{CURRENT_WORKFLOW}}", page.sourceId === "bsm-baseline-v1-inventory" ? "Staff search products and record individual stock changes. Low-stock review is manual." : page.sourceId === "bsm-baseline-v1-orders" ? "Managers assemble and confirm supplier drafts; receiving staff later record delivered quantities." : page.sourceId === "bsm-baseline-v1-transfers" ? "Stock is adjusted separately at each store; there is no shared transfer lifecycle." : page.sourceId === "bsm-baseline-v1-staff" ? "Managers assign permanent role bundles and must remember later access changes." : page.sourceId === "bsm-baseline-v1-shifts" ? "Managers build the rota; shift changes and handover notes are communicated separately." : page.sourceId === "bsm-baseline-v1-reporting" ? "Managers open predefined reports and export records for deeper analysis." : "Managers review the summary, then open each module to complete work.");
}

export const prototypeDesignTokens = `
Use a desktop BottleShopManager visual language: #171222 navigation, #f7f7fa canvas, white panels, #7c3aed primary actions, #12a6b0 information accents, #ff6b4a warnings, 14px-18px rounded corners, system sans-serif body text, dark navy headings, compact operational tables and generous spacing. Preserve the current page structure and add the proposed feature in context.`;

export function getPrototypeBaselinePackage(concepts = []) {
  return concepts.map((concept) => {
    const page = prototypeBaselinePages[concept.baselineSurface];
    if (!page) throw new Error(`No immutable prototype baseline exists for ${concept.baselineSurface}.`);
    return { conceptId: concept.id, baselineSurface: concept.baselineSurface, ...page };
  });
}

const moduleNavigation = [
  ["overview", "O", "Overview", "Operational snapshot and unresolved work"],
  ["inventory", "I", "Inventory", "Stock levels, counts, adjustments and wastage"],
  ["orders", "S", "Supplier Orders", "Drafts, supplier grouping and delivery receipt"],
  ["transfers", "S", "Stock Transfers", "Movement between stores"],
  ["staff", "S", "Staff & Access", "Roles, permissions and temporary access"],
  ["shifts", "S", "Shift Operations", "Tasks and handover notes"],
  ["reporting", "R", "Reporting", "Saved operational reports and exports"],
];

export const prototypeBaselineCss = `
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#171222;background:#eeeef3;font-synthesis:none}*{box-sizing:border-box}body{margin:0;min-width:1180px;background:#eeeef3;color:#171222}button,input{font:inherit}button{cursor:pointer}.prototype-disclosure{display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:#21172e;color:#fff;font-size:11px;font-weight:800;letter-spacing:.055em;text-transform:uppercase}.prototype-disclosure span:last-child{color:#cdbdff;font-size:9px}.platform-window{width:100%;min-height:780px;display:grid;grid-template-columns:310px minmax(0,1fr);background:#f7f7fa}.platform-sidebar{position:relative;display:flex;flex-direction:column;min-height:780px;padding:26px 22px 22px;background:#171222;color:#fff}.platform-logo{display:flex;gap:12px;align-items:center;padding:2px 8px 24px;border-bottom:1px solid rgba(255,255,255,.08)}.platform-logo strong,.platform-logo small{display:block}.platform-logo strong{font-size:14px}.platform-logo small{margin-top:3px;color:#928a9f;font-size:9px}.bsm-mark{position:relative;width:34px;height:37px;display:flex;align-items:flex-end;gap:3px;padding:7px;border-radius:10px 10px 12px 12px;background:linear-gradient(150deg,#39244b,#0f0b16);transform:rotate(-3deg)}.bsm-mark:before{position:absolute;width:7px;height:6px;top:-3px;left:13px;border-radius:2px 2px 0 0;background:#ff6b4a;content:""}.bsm-mark i{width:5px;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,#a987ff,#fff)}.bsm-mark i:nth-child(1){height:12px;opacity:.55}.bsm-mark i:nth-child(2){height:20px}.bsm-mark i:nth-child(3){height:15px;opacity:.75}.demo-store{margin:22px 0 18px;padding:15px;border-radius:12px;background:rgba(255,255,255,.06)}.demo-store span,.demo-store strong,.demo-store small{display:block}.demo-store span{color:#9b91a7;font-size:8px;font-weight:800;text-transform:uppercase}.demo-store strong{margin-top:7px;font-size:12px}.demo-store small{margin-top:5px;color:#b7acbf;font-size:8px}.platform-sidebar nav{display:grid;gap:5px}.platform-sidebar nav button{width:100%;display:grid;grid-template-columns:35px 1fr;gap:10px;align-items:center;padding:9px;border:0;border-radius:10px;background:transparent;color:#c4b8cc;text-align:left}.platform-sidebar nav button.active{background:#30224f;color:#fff}.platform-sidebar nav button>span{width:31px;height:31px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.12);border-radius:9px;font-size:9px;font-weight:800}.platform-sidebar nav button.active>span{border-color:#8e5aff;background:#7c3aed}.platform-sidebar nav strong,.platform-sidebar nav small{display:block}.platform-sidebar nav strong{font-size:10px}.platform-sidebar nav small{margin-top:3px;color:#8e8399;font-size:7px}.platform-sidebar nav button.active small{color:#c6b6df}.baseline-note{margin-top:auto;padding:14px;border:1px solid rgba(255,255,255,.09);border-radius:11px}.baseline-note span{color:#a987ff;font-size:8px;font-weight:850;text-transform:uppercase}.baseline-note p{margin:7px 0 0;color:#94899f;font-size:8px;line-height:1.55}.platform-main{min-width:0}.platform-main>header{height:70px;display:flex;align-items:center;justify-content:space-between;padding:0 34px;border-bottom:1px solid #e8e5eb;background:#fff}.platform-main>header span,.platform-main>header strong{display:block}.platform-main>header span{color:#928a96;font-size:8px}.platform-main>header strong{margin-top:3px;font-size:12px}.platform-user{display:flex;gap:8px;align-items:center}.platform-user button,.platform-user>span{width:32px;height:32px;display:grid;place-items:center;border:1px solid #ddd9e1;border-radius:9px;background:#fff;color:#5d5465;font-size:9px;font-weight:800}.platform-user>span{border:0;background:#24172f;color:#fff}.platform-content{padding:34px 38px 44px}.bsm-page{max-width:1180px;margin:0 auto}.module-header{display:flex;align-items:flex-start;justify-content:space-between;gap:30px}.module-header small{color:#5d2ed1;font-size:8px;font-weight:850;letter-spacing:.08em}.module-header h1{margin:8px 0 5px;font-size:34px;line-height:1;letter-spacing:-.045em}.module-header p{margin:0;color:#756b79;font-size:11px}.module-header button,.toolbar button,.panel button,.card-grid button,.calendar button{padding:9px 12px;border:1px solid #ddd9e1;border-radius:8px;background:#fff;color:#171222;font-size:8px;font-weight:780}.toolbar{display:flex;gap:7px;align-items:flex-end;margin:24px 0 13px}.toolbar label{min-width:340px;flex:1;color:#706775;font-size:8px;font-weight:750}.toolbar input{width:100%;margin-top:6px;padding:10px 11px;border:1px solid #ddd9e1;border-radius:8px;background:#fff;color:#171222}.panel,.card-grid>article,.kpi-grid>article,.step-flow>article{border:1px solid #ddd9e1;border-radius:12px;background:#fff}.panel{margin-top:16px;overflow:hidden}.panel h2{margin:0;padding:15px 17px;border-bottom:1px solid #ebe8ed;font-size:12px}.panel .row{display:flex;align-items:center;justify-content:space-between;padding:14px 17px;border-bottom:1px solid #efedf1;font-size:9px}.panel .row:last-child{border-bottom:0}.panel .row span{color:#7f7582}.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px;margin-top:22px}.kpi-grid article{padding:16px}.kpi-grid span,.kpi-grid strong{display:block}.kpi-grid span{color:#746a78;font-size:8px}.kpi-grid strong{margin-top:8px;font-size:20px}table{width:100%;border-collapse:collapse}th,td{padding:13px 15px;border-bottom:1px solid #efedf1;color:#5e5562;font-size:8px;text-align:left}th{background:#f7f6f8;color:#8b8290;font-size:7px;text-transform:uppercase}td:first-child{color:#171222;font-weight:750}.card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-top:16px}.card-grid article{padding:16px}.card-grid strong,.card-grid span{display:block}.card-grid span{margin-top:5px;color:#716776;font-size:8px}.card-grid p{color:#8a7f8e;font-size:8px}.card-grid button{margin-top:8px;color:#5d2ed1}.person-card:before{width:38px;height:38px;display:grid;place-items:center;margin-bottom:12px;border-radius:11px;background:linear-gradient(145deg,#24172f,#8058d0);color:#fff;content:"S";font-size:9px;font-weight:850}.step-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:11px;margin-top:22px}.step-flow article{padding:15px}.step-flow strong{font-size:9px}.step-flow p{color:#766d79;font-size:8px}.calendar{display:grid;grid-template-columns:repeat(3,1fr);min-height:360px;margin-top:16px;overflow:hidden;border:1px solid #ddd9e1;border-radius:12px;background:#fff}.calendar article{padding:15px;border-right:1px solid #e8e5eb}.calendar article:last-child{border-right:0}.calendar article>strong{display:block;margin-bottom:18px;font-size:10px}.calendar article button{width:100%;display:block;margin-top:8px;border-left:3px solid #7c3aed;background:#f0eaff;text-align:left}.current-workflow{margin-top:20px;padding:15px 17px;border-left:3px solid #12a6b0;border-radius:0 10px 10px 0;background:#e8f5f7}.current-workflow strong{color:#087985;font-size:8px;letter-spacing:.06em}.current-workflow p{margin:7px 0 0;color:#526d72;font-size:9px;line-height:1.5}
`;

export function createPrototypeBaselineDocument(surface) {
  const page = prototypeBaselinePages[surface];
  if (!page) throw new Error(`No immutable prototype baseline exists for ${surface}.`);
  const navigation = moduleNavigation.map(([id, initial, label, description]) => `<button type="button" class="${id === surface ? "active" : ""}" tabindex="-1"><span>${initial}</span><div><strong>${label}</strong><small>${description}</small></div></button>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=1280"><style>${prototypeBaselineCss}</style></head><body><div class="prototype-disclosure"><span>AI-generated prototype · synthetic data · does not change current platform</span><span>Isolated page copy</span></div><div class="platform-window"><aside class="platform-sidebar"><div class="platform-logo"><span class="bsm-mark"><i></i><i></i><i></i></span><div><strong>BottleShopManager</strong><small>Operations platform</small></div></div><div class="demo-store"><span>Current workspace</span><strong>Example demo store</strong><small>Synthetic environment</small></div><nav aria-label="Current product modules">${navigation}</nav><div class="baseline-note"><span>Baseline v1</span><p>This page is an immutable copy. AI changes are added only at verified anchors.</p></div></aside><div class="platform-main"><header><div><span>Example demo store</span><strong>${page.label}</strong></div><div class="platform-user"><button type="button" tabindex="-1">?</button><span>PM</span></div></header><div class="platform-content">${page.html}</div></div></div></body></html>`;
}
