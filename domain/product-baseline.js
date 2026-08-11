export const productBaseline = {
  name: "BottleShopManager Platform",
  status: "Fictional current-product baseline",
  principles: [
    "Desktop operational workspace for independent shops and small groups",
    "Explicit staff permissions and manager approval for consequential actions",
    "Traceable stock and workflow changes",
    "Unknown information is displayed rather than silently replaced with a value",
  ],
  modules: [
    { id: "overview", label: "Overview", description: "Operational snapshot and unresolved work", currentWorkflow: "Managers review stock alerts, deliveries and staff tasks before opening the relevant module." },
    { id: "inventory", label: "Inventory", description: "Stock levels, counts, adjustments and wastage", currentWorkflow: "Staff search products and record individual stock changes. Low-stock review is manual." },
    { id: "orders", label: "Supplier Orders", description: "Drafts, supplier grouping and delivery receipt", currentWorkflow: "Managers assemble and confirm supplier drafts; receiving staff record delivered quantities." },
    { id: "transfers", label: "Stock Transfers", description: "Movement between stores", currentWorkflow: "Stock is adjusted separately at each store; there is no shared transfer lifecycle." },
    { id: "staff", label: "Staff & Access", description: "Roles, permissions and temporary access", currentWorkflow: "Managers assign permanent role bundles and must remember later access changes." },
    { id: "shifts", label: "Shift Operations", description: "Tasks and handover notes", currentWorkflow: "Operational tasks are recorded separately; a structured handover is not available." },
    { id: "reporting", label: "Reporting", description: "Saved operational reports and exports", currentWorkflow: "Managers open predefined reports and export records for deeper analysis." },
  ],
};

export const productBaselinePrompt = `CURRENT BOTTLESHOPMANAGER PRODUCT BASELINE
BottleShopManager is a fictional desktop B2B operations platform. Its current modules are:
- overview: operational snapshot and unresolved work
- inventory: stock levels, counts, adjustments and wastage; low-stock review is manual
- orders: supplier-order drafts and delivery receipt; managers explicitly confirm drafts
- transfers: separate store adjustments; no shared transfer lifecycle
- staff: permanent role bundles; temporary access must be removed manually
- shifts: operational tasks without a structured handover workspace
- reporting: predefined reports and exports

Product rules: consequential actions require an authorised human; changes are traceable; unknown values must remain unknown. Treat this as the existing product, not evidence that the requested feature exists.`;
