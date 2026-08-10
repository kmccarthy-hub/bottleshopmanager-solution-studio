# EvidenceLoop Opportunity Lens

Opportunity Lens is a desktop-first academic prototype for a fictional product-management software company. A human product manager triggers a five-agent pipeline that queries the current synthetic feedback in the public `evidenceloop-feedback` GitHub repository.

## Agent chain

1. Researcher explicitly calls `fetch_customer_feedback` and produces three traceable opportunities.
2. Designer compares solution directions and selects one concept.
3. Maker returns a constrained, clickable three-screen prototype definition.
4. Communicator drafts an internal decision story and an unsent customer-validation invitation.
5. Manager audits the chain, ranks all three opportunities and recommends build, validate or park.

All outputs are visibly labelled as AI-generated. The Manager is advisory; a human product leader retains approval.

## Local setup

Copy `.env.example` to the deployment environment and supply server-side Gemini credentials. Never commit the key.

```text
npm install
npm run dev
npm run build
npm run lint
```

The static Vite frontend is intended for GitHub Pages. The five serverless API handlers are intended for Vercel. `VITE_API_BASE_URL` connects the two deployments.

## Live source

The Researcher tool queries every issue in the dedicated public repository at run time with `Cache-Control: no-store`. The application does not bundle or cache a fallback copy of the feedback.
