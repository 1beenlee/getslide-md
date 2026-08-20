# OPEN_SOURCE_BOUNDARY.md

This document defines what belongs in this public repository and what must stay out of it. If you contribute to this repo — human or AI agent — check this boundary before adding content.

## Why a boundary exists

getslide.md now follows this split:

> **The format and portable agent workflow are open. Hosted user-material automation and product operations stay private/future.**

The public repository should be genuinely useful with the AI/agent tool a user already has. That includes the standalone HTML contract, `DECK_BRIEF.md`, basic prompts, deterministic local staging/validation helpers, benchmark/evaluation rules, and a portable Agent Skill that composes those public pieces into one workflow.

The boundary begins where the system becomes an operated product: hosted ingestion of user materials, production model routing/tuning, private repair/scoring logic, billing, queues, delivery, analytics, abuse controls, and any infrastructure that stores or processes real user submissions.

The most important rule does not change: **real user material must never leak into this public repository.**

## Public: format + portable workflow

Safe to publish and improve in this repo:

- **Base standalone HTML skeleton** (`templates/base-onefile-deck.html`)
- **Deck brief schema** (`docs/DECK_BRIEF.schema.md`)
- **HTML deck contract** (`docs/HTML_DECK_CONTRACT.md`)
- **Student developer slide pattern catalog** (`docs/STUDENT_DEVELOPER_PATTERNS.md`)
- **Basic prompts** for source-to-brief, generation, editing, repair, and review (`prompts/`)
- **Example decks built from fictional, clearly-labeled demo content** (`examples/`)
- **Validation checklist and zero-dependency validator** (`docs/VALIDATION.md`, `tools/validate-deck.mjs`)
- **Provider-neutral benchmark/evaluation helpers** that use fictional fixtures and Node built-ins (`eval/`, deterministic tools under `tools/`)
- **Portable Agent Skill workflow** (`.agents/skills/getslide/`, `.claude/skills/getslide/`) that orchestrates checked-in public resources without embedding a provider, secret, hosted service, or model API
- **Deterministic local source staging** for one text/Markdown file (`tools/prepare-deck.mjs`); this packages supplied text into reviewable prompt packets but does not parse PDFs/images/URLs/repos or call a model
- **Editability evaluation specifications** that test whether targeted AI edits preserve grounding and the deck contract
- **Theme / design-token structure** (the `:root` CSS custom-property convention in the template and the HTML deck contract)
- General documentation: README, decision log, this boundary document, agent instructions.

## Private or future product layer

Do **not** add to this repo:

- **Hosted or broad source ingestion** — server-side user uploads or parsers/connectors for PDFs, images, URLs, repositories, Drive/Notion, or other user data sources.
- **Production tuned generation/repair chains** — proprietary prompt routing, model-specific quality scoring, private layout-repair heuristics, or production decision policies that go beyond the public reference workflow.
- **Model routing and hosted inference** — provider selection, model budgets, API keys, token/cost optimization, fallback routing, or server-side generation.
- **Private examples or real-use artifacts** — any deck, brief, benchmark source, or generated material derived from a real user, real team, real class, private project, or non-public source.
- **Paid generation queue** — queueing, job management, retries, delivery automation.
- **Payment** — checkout, pricing pages, billing code, payment-provider keys.
- **Rate limiting / abuse control** — fingerprinting, quota logic, fraud controls.
- **Hosted delivery** — user link management, per-user hosting, access control.
- **Analytics** — tracking code, usage dashboards, metrics pipelines.
- **Public gallery infrastructure** — consent storage, moderation, publishing workflow.
- **Marketplace infrastructure** — harness publishing, revenue sharing, builder accounts.

## Never publishable (regardless of layer)

- User-submitted materials, briefs, or generated outputs — with or without consent recorded elsewhere. Consent-based showcasing, if it ever exists, happens in a separately governed product surface, not as raw repository material.
- Personal data: names, emails, private links, credentials, API keys.
- Internal company or organization information of any kind.
- Internal system prompts, private agent traces, hidden evaluation data, or logs from private tooling.
- Unverifiable claims: real-sounding metrics, testimonials, or traction numbers. Example metrics must be fictional and labeled as demo data.

## Contributor quick test

Before committing, ask:

1. Could this content only have come from a private source (a user, a company, an internal tool)? → **Keep it out.**
2. Can this workflow run locally from public files without a secret, provider account, hosted service, or real-user dataset? → It may belong in the public portable workflow.
3. Does it introduce hosted ingestion, production model routing/tuning, billing, delivery, analytics, or operational user-data handling? → **Keep it in the private/future product layer.**
4. Does it contain a number or claim a reader might mistake for real-world results? → **Label it as fictional demo data or remove it.**
5. Would you be comfortable with this exact text and behavior being forked publicly? → If not, **keep it out.**

When in doubt, document the boundary question before expanding implementation scope.
