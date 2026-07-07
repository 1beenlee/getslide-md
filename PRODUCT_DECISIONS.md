# PRODUCT_DECISIONS.md

Current decision log for getslide.md. This file records what has been decided, what is deferred, what is explicitly out of scope for now, and what remains open. Update it whenever a decision changes.

Last updated: 2026-07-07

## Decided

| Topic | Decision |
|---|---|
| Product name | **getslide.md** |
| Repo / folder name | **getslide-md** |
| Canonical output | A **single standalone HTML file** per deck. Not PPTX. Not a multi-file web app. |
| Core thesis | PPTX was built for manual editing; standalone HTML decks are better for AI-assisted editing. |
| First target user | **Student developers** preparing hackathon, capstone, developer club, GitHub project, and side-project demo presentations. |
| Secondary targets (sequenced later) | Job seekers (portfolio decks), then business/social science students (report-to-presentation decks). |
| MVP input scope | **Pasted text and Markdown only** (README content, notes, report text). PDF, images, and URL ingestion are deferred. |
| First example deck | One **hackathon Developer Demo** deck built from a fictional project brief. |
| First theme | **Developer Demo** (dark, practical, slightly nerdy). Clean Academic and Portfolio Case Study themes come later. |
| Export policy | **Print-to-PDF via browser print CSS** is the supported export path. PPTX export is not a product goal. |
| Deck brief standard | Every generation flow normalizes input into a **`DECK_BRIEF.md`** (schema in `docs/DECK_BRIEF.schema.md`), including missing information, auto-filled assumptions, and a confidence level. |
| Privacy principle | **Private by default.** User inputs and outputs are never published, reviewed, or reused as examples without separate, explicit consent for each purpose. |
| Positioning guardrail | The product structures **user-provided materials**. It is never positioned as assignment writing or ghostwriting. |
| Open-source / private boundary | The skeleton, schema, patterns, basic prompts, one example, and validation checklist are public. Automation and tuned generation stay private. Details in `OPEN_SOURCE_BOUNDARY.md`. |
| Repo language | **English-first** for all public repo content (README, docs, prompts, examples). Community posts in other languages are handled outside this repo. |
| License | MIT. |
| Dependencies | None. No build step, no npm packages, no CDN assets. Decks must work offline as static files. |

## Deferred

Planned, but intentionally not in this repo seed:

- PDF / image / URL / GitHub-repo ingestion as generation inputs.
- Clean Academic and Portfolio Case Study themes and their example decks.
- Speaker script generation guide.
- QR / share / link-tracking guides.
- Hosted deck delivery (static hosting workflow docs).
- Additional pattern packs beyond the student developer catalog.
- An automated validation script (the checklist in `docs/VALIDATION.md` is manual for now).

## Not now

Explicitly out of scope until the kit and the thesis are validated:

- Any SaaS web app, dashboard, or admin panel.
- Authentication, accounts, or team features.
- Payment integration of any kind.
- Databases, upload systems, generation queues, or rate limiting infrastructure.
- WYSIWYG slide editor.
- Real-time collaboration.
- Analytics platform.
- Harness / theme marketplace (long-term vision only).

## Pricing hypothesis (not launched, not promised)

Recorded here — deliberately **not** in the README — because it is an untested hypothesis, not an offer:

- Free: this open-source kit, self-serve with the user's own AI tool.
- Hypothesis: a low-cost paid flow (around $3) for an automated first draft, with small optional add-ons (a revision pass, a speaker script). Value would come from automation and quality control, not from withholding the format.
- To validate: willingness to pay, generation cost per deck, and whether the no-revision scope of a first draft is understood and accepted.

## Open questions

1. Free generation limits (slides per deck, decks per week) once an automated flow exists.
2. First payment/delivery experiment channel (manual beta vs. simple checkout).
3. Public gallery scope: what exactly may be shown with consent, and in what anonymized form.
4. Which student developer communities to approach first for beta testing, and in what order.
5. Whether `DECK_BRIEF.md` needs versioning (schema version field) before third parties start producing briefs.
6. How much of the pattern catalog stays public as it grows (all of it vs. a public sample).
7. Whether the repo should ship a tiny zero-dependency validation script (single HTML/JS or Python file) as the first automation step.
