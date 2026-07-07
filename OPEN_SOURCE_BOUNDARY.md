# OPEN_SOURCE_BOUNDARY.md

This document defines what belongs in this public repository and what must stay out of it. If you contribute to this repo — human or AI agent — check this boundary before adding content.

## Why a boundary exists

getslide.md follows a simple model: **the format is free, the automation is the product.**

The open-source kit makes standalone HTML decks a public, trustworthy standard that anyone can use with their own AI tool. The future product layer automates the tedious parts (parsing materials, drafting briefs, generating and validating decks). Publishing the format costs nothing; publishing the automation would just be publishing an unfinished product. More importantly, the private layer will eventually touch **user-submitted materials**, which must never leak into a public repo.

## Public: the open-source kit

Safe to publish and improve in this repo:

- **Base standalone HTML skeleton** (`templates/base-onefile-deck.html`)
- **Deck brief schema** (`docs/DECK_BRIEF.schema.md`)
- **Student developer slide pattern catalog** (`docs/STUDENT_DEVELOPER_PATTERNS.md`)
- **Basic prompts** for generating, editing, and reviewing decks (`prompts/`)
- **Example decks built from fictional, clearly-labeled demo content** (`examples/`)
- **Validation checklist** (`docs/VALIDATION.md`)
- **Theme / design-token structure** (the `:root` CSS custom property convention in the template and the HTML deck contract)
- General documentation: README, decision log, this boundary document, agent instructions.

## Private or future product layer

Do **not** add to this repo:

- **Automated source ingestion** — parsers for user files, PDFs, images, URLs, or repos.
- **Tuned prompt chains** — multi-step production prompt pipelines, quality-scoring prompts, layout-repair logic.
- **Model routing** — which model handles which step, token budgets, cost optimization logic.
- **Private examples** — any deck, brief, or material derived from a real user, a real team, a real class, or any non-public source.
- **Paid generation queue** — queueing, job management, delivery automation.
- **Payment** — checkout, pricing pages, billing code, payment provider keys.
- **Rate limiting** — abuse prevention rules, fingerprinting, quota logic.
- **Hosted delivery** — hosting infrastructure, user link management.
- **Analytics** — tracking code, usage dashboards, metrics pipelines.
- **Marketplace infrastructure** — harness publishing, revenue sharing, builder accounts.

## Never publishable (regardless of layer)

- User-submitted materials, briefs, or generated outputs — with or without consent recorded elsewhere. Consent-based showcasing, if it ever exists, happens in the product, not in this repo.
- Personal data: names, emails, private links, credentials, API keys.
- Internal company or organization information of any kind.
- Internal prompt traces, system prompts, or logs from private tooling.
- Unverifiable claims: real-sounding metrics, testimonials, or traction numbers. Example metrics must be fictional and labeled as demo data.

## Contributor quick test

Before committing, ask:

1. Could this content only have come from a private source (a user, a company, an internal tool)? → **Keep it out.**
2. Does it automate generation rather than define the format? → **Probably product layer. Keep it out.**
3. Does it contain a number or claim a reader might mistake for real-world results? → **Label it as fictional demo data or remove it.**
4. Would you be comfortable with this exact text on the front page of the repo? → If not, **keep it out.**

When in doubt, open an issue instead of a pull request.
