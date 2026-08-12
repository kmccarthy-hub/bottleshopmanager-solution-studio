# BottleShopManager Solution Studio

Solution Studio is a desktop-first academic prototype for the internal Product Managers of BottleShopManager, a fictional B2B platform used by independent Irish off-licence shops and small chains to manage stock, suppliers, orders, staff workflows and operational reporting.

A Product Manager selects one live synthetic feature request from GitHub. Five distinct AI agents assess the request, create three solution directions, make those directions tangible and provide one advisory recommendation. Missing backlog information remains visible throughout the chain.

## Agent chain

1. Researcher explicitly calls `fetch_selected_feature_request`, uses live Google Search grounding, analyses the current product and produces an opportunity brief.
2. Designer acknowledges that Researcher artifact and creates a recommended, alternative and variation/extended design specification.
3. Maker acknowledges the Designer artifact and creates one traceable interactive prototype for each specification.
4. Communicator acknowledges the Maker artifact and explains changes, impact and qualitative implementation effort.
5. Manager acknowledges the Communicator artifact, audits the complete chain, ranks the concepts and provides an advisory recommendation.

The Manager does not select, approve or write anything back. The Product Manager retains the final decision.

## Deployment

The static Vite frontend is designed for GitHub Pages. Five serverless agent handlers and the public backlog endpoint are designed for Vercel. `VITE_API_BASE_URL` connects the two deployments. Gemini credentials remain server-side.

## Live source

The dedicated public `bottleshopmanager-backlog` repository contains ten clearly labelled synthetic feature requests. The Researcher requests the selected issue, comments and live backlog context at runtime with caching disabled, then performs grounded live market research with attributable sources. No bundled backlog substitutes for either evidence step.
