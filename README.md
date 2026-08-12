# BottleShopManager Solution Studio

Solution Studio is a desktop-first academic prototype for the internal Product Managers of BottleShopManager, a fictional B2B platform used by independent Irish off-licence shops and small chains to manage stock, suppliers, orders, staff workflows and operational reporting.

A Product Manager selects one live synthetic feature request from GitHub. Five distinct AI agents assess the request, create three solution directions, make those directions tangible and provide one advisory recommendation. Missing backlog information remains visible throughout the chain.

## Agent chain

1. Researcher explicitly calls `fetch_selected_feature_request`, uses live Google Search grounding, analyses the current product and produces an opportunity brief.
2. Designer acknowledges that Researcher artifact and creates three design specifications.
3. The Manager performs an interim checkpoint, assesses all three and selects one for prototyping.
4. Maker receives only that selected specification and immutable current-page source, then generates validated feature modifications for one sandboxed page prototype.
5. Communicator receives only the selected prototype evidence and explains its changes, impact and qualitative effort.
6. The same Manager performs the final review, explains why it selected that option and references the other two Designer specifications.

There are five distinct agents; the Manager is invoked twice as the governance agent.

The Manager does not select, approve or write anything back. The Product Manager retains the final decision.

The Maker does not rewrite or alter the Current platform view. A deterministic renderer starts with a locked BottleShopManager page copy and applies only validated additions at known page anchors. Generated HTML/CSS/JavaScript executes only in an isolated iframe with no network, storage, navigation or parent-page access and is discarded when the run is replaced.

## Deployment

The static Vite frontend is designed for GitHub Pages. Five serverless agent handlers and the public backlog endpoint are designed for Vercel. `VITE_API_BASE_URL` connects the two deployments. Gemini credentials remain server-side.

## Live source

The dedicated public `bottleshopmanager-backlog` repository contains ten clearly labelled synthetic feature requests. The Researcher requests the selected issue, comments and live backlog context at runtime with caching disabled, then performs grounded live market research with attributable sources. No bundled backlog substitutes for either evidence step.
