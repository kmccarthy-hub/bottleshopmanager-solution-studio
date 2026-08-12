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
