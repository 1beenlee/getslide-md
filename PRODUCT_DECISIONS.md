# PRODUCT_DECISIONS.md

Current decision log for getslide.md. This file records what has been decided, what is deferred, what is explicitly out of scope for now, and what remains open. Update it whenever a decision changes.

Last updated: 2026-08-25

## Decided

| Topic | Decision |
|---|---|
| Product name | **getslide.md** |
| Repo / folder name | **getslide-md** |
| Canonical output | A **single standalone HTML file** per deck. Not a multi-file web app. HTML is the canonical artifact even if compatibility outputs are added later. |
| Core thesis | getslide.md is a **source-grounded deck compiler for AI-native workflows**: source materials become explicit facts/gaps/assumptions, then a structured brief, then a deck that can be safely targeted and revised by AI. HTML enables that architecture but is not the sole product differentiator. |
| First validation cohort | **Student developers** preparing hackathon, capstone, developer club, GitHub project, and side-project demo presentations. Treat them as the first validation cohort, not a permanently fixed business segment. |
| Secondary validation cohorts | Job seekers / portfolio owners, indie builders, technical founders/PMs, then business/social science students where source-respecting report-to-presentation workflows fit. |
| MVP input scope | **Pasted text and Markdown only** (README content, notes, report text). PDF, images, URLs, and repository ingestion are deferred. |
| First example deck | One **hackathon Developer Demo** deck built from a fictional project brief. |
| First theme | **Developer Demo** (dark, practical, slightly nerdy). Clean Academic and Portfolio Case Study themes come later. |
| Export policy | **Print-to-PDF via browser print CSS** is supported. PPTX is not implemented now; it may become a compatibility output only if real usage validates the need. |
| Deck brief standard | Every generation flow normalizes input into a **`DECK_BRIEF.md`** (schema in `docs/DECK_BRIEF.schema.md`), including missing information, auto-filled assumptions, and a confidence level. |
| Source-sufficiency gate | High-confidence end-to-end requests may proceed when no unresolved factual gap or risky assumption remains. Medium confidence requires explicit low-risk auto-fill permission or brief review. Low confidence stops before deck generation. |
| Privacy principle | **Private by default.** User inputs and outputs are never published, reviewed, or reused as examples without separate, explicit consent for each purpose. |
| Positioning guardrail | The product structures **user-provided materials**. It is never positioned as assignment writing or ghostwriting. |
| Open-source / private boundary | The public layer includes the format, schemas/contracts, prompts, fictional examples, validator/benchmark helpers, and the **portable Agent Skill workflow**. The private/future product layer begins at hosted user-material ingestion, production model routing/tuning, billing, queues, delivery, analytics, and abuse controls. Details in `OPEN_SOURCE_BOUNDARY.md`. |
| Agent-native distribution | v0.3 ships a project Agent Skill in `.agents/skills/getslide/` plus a byte-identical Claude Code mirror in `.claude/skills/getslide/`. Agent-native usage is validated before building a hosted wrapper. |
| Repo language | **English-first** for all canonical public repo content. Translated README content may exist but must not become the source of truth. |
| License | MIT. |
| Dependencies | None. No build step, no npm packages, no CDN assets. Decks and deterministic helper scripts use platform/browser or Node built-ins only. |
| CI validation | GitHub Actions may run the zero-dependency Node regression checks, brief/edit-containment tests, real installed-browser QA, and the example validator on pull requests and `main`. CI performs **no deploy, publish, artifact upload, model call, browser package installation, or external service integration**. |
| Experimental harness | v0.2 provides a provider-neutral, file-based Markdown-to-brief-to-deck benchmark harness. It uses prompts and Node built-ins only; it is not hosted generation or automated factual verification. |
| Generated deck navigation | v0.2.1 requires generated decks to preserve the canonical base-template navigation script. Static validation checks conservative behavior signals; runtime browser and print QA remain separate gates. |
| Agent-native source staging | v0.3 adds `tools/prepare-deck.mjs` so one arbitrary text/Markdown source can be staged into the same brief/deck packet flow without benchmark metadata or a model/network call. |
| Editability evaluation | v0.3 treats post-generation targeted editing as a first-class quality axis. Validator PASS is necessary but insufficient; source grounding, change containment, navigation integrity, and visual/manual QA are evaluated separately. |
| Executable edit containment | v0.3.1 adds `tools/evaluate-edit.mjs` with explicit `targeted`, `split`, `reorder`, and `compression` policies. It invokes the deck validator and blocks undeclared slide/system changes, `:root` drift, and navigation/script drift. This is mechanical containment evidence, **not semantic factual proof**. |
| Real browser QA | v0.3.1 adds `tools/browser-qa.mjs`, which uses an already installed Chrome/Chromium through the DevTools protocol and Node built-ins to check actual `file://` runtime navigation, TOC/hash/page-number synchronization, and one canonical viewport overflow gate. No Puppeteer/Playwright or browser download is added. |
| Executable brief gate | v0.3.2 validates the documented `DECK_BRIEF.md` top-level scalar/list subset before generation. Required fields, confidence, optional field shapes, duplicate/malformed syntax, and the mechanical `high`-confidence/no-unresolved-gap invariant are checked; invalid briefs cannot produce a generation packet. This is structural evidence, **not semantic source-fidelity proof**. |

## Deferred

Planned or plausible, but intentionally not in the current open-source milestone:

- PDF / image / URL / GitHub-repo ingestion as generation inputs.
- Clean Academic and Portfolio Case Study themes and their example decks.
- Speaker script generation guide.
- QR / share / link-tracking guides.
- Hosted deck delivery.
- Additional pattern packs beyond the student developer catalog.
- Real-user or public-project evaluation artifacts in this public repo; real usage evidence must be collected without committing user material.
- PPTX or Google Slides compatibility output, unless user validation shows that browser/PDF delivery is insufficient.
- Automated semantic source-fidelity proof; factual/meaning review remains model/human review rather than a deterministic string/diff claim.
- Full browser automation of print preview, projector readability, composition quality, and all responsive viewport sizes.

## Not now

Explicitly out of scope until the Agent Skill and source-grounded/editability thesis are validated with real use:

- Any SaaS web app, dashboard, or admin panel.
- Authentication, accounts, or team features.
- Payment integration of any kind.
- Databases, upload systems, generation queues, or rate limiting infrastructure.
- Hosted model inference or model routing.
- WYSIWYG slide editor.
- Real-time collaboration.
- Analytics platform.
- Public gallery.
- Harness / theme marketplace.

## Pricing hypothesis (not launched, not promised)

The earlier `$3 first draft + add-ons` idea remains only a research hypothesis. Do **not** build pricing or checkout around it yet.

The next monetization decision comes only after agent-native usage demonstrates that people repeatedly value the workflow and reveals whether the real friction is:

- running an agent/skill at all,
- source ingestion,
- generation quality/repair,
- compatibility/export,
- or delivery/sharing.

A future hosted wrapper should sell convenience and operational quality, not access to a hidden slide format.

## Open questions

1. Does the `getslide` Agent Skill produce a useful first deck from real README/project material with less user effort than the user's normal workflow?
2. Do post-generation targeted edits stay contained, source-grounded, and visually usable across different compatible agents?
3. How often do real users require PDF, PPTX, Google Slides, or hosted-link compatibility after receiving the canonical HTML deck?
4. Which first validation cohort has the strongest repeat need: student developers, portfolio/job seekers, or technical builders/PMs?
5. Does `DECK_BRIEF.md` need an explicit schema-version field before external tools start producing briefs?
6. How much of the pattern catalog should remain public as it grows: all of it or a stable public core plus specialized packs?
7. If agent-native usage is strong but setup friction blocks non-agent users, what is the thinnest hosted wrapper that removes that friction without becoming a generic slide SaaS?
8. After mechanical containment, executable brief validation, and one canonical browser viewport are reliable, which next quality gate delivers more value: semantic source-review automation, 1280×800 responsive QA, or print/PDF rendering evidence?
