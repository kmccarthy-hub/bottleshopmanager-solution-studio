# BottleShopManager Solution Studio

Solution Studio is a desktop-first academic prototype for the internal Product Managers of BottleShopManager, a fictional B2B platform used by independent Irish off-licence shops and small chains to manage stock, suppliers, orders, staff workflows and operational reporting.

A Product Manager selects one live synthetic feature request from GitHub. Five distinct AI agents assess the request, create three solution directions, make those directions tangible and provide one advisory recommendation. Missing backlog information remains visible throughout the chain.

## Agent chain

1. Researcher explicitly calls `fetch_selected_feature_request` for the selected issue and assesses its information quality.
2. Designer creates one focused, one integrated and one exploratory concept.
3. Maker creates one constrained interactive prototype for each concept.
4. Communicator creates three comparable internal decision briefs.
5. Manager ranks the concepts, explains every agent's contribution and consolidates questions that would improve the backlog request.

The Manager does not select, approve or write anything back. The Product Manager retains the final decision.

## Deployment

The static Vite frontend is designed for GitHub Pages. Five serverless agent handlers and the public backlog endpoint are designed for Vercel. `VITE_API_BASE_URL` connects the two deployments. Gemini credentials remain server-side.

## Live source

The dedicated public `bottleshopmanager-backlog` repository contains ten clearly labelled synthetic feature requests. The Researcher requests the selected issue, comments and live backlog context at runtime with caching disabled. No bundled backlog substitutes for the tool result.
