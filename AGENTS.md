# AGENTS.md

Instructions for AI coding agents (Claude, Codex, or others) working on this repository. Read this file, `PRODUCT_DECISIONS.md`, and `OPEN_SOURCE_BOUNDARY.md` before making changes.

## Project thesis

getslide.md is a **source-grounded deck compiler for AI-native workflows**.

The workflow keeps a visible evidence boundary:

```text
source materials
  → facts / gaps / assumptions
  → DECK_BRIEF.md
  → standalone HTML deck
  → validation
  → targeted AI edits
```

The canonical output remains **one standalone HTML file** because it is addressable, diffable, offline-friendly, and easy for AI tools to revise. HTML is an architectural advantage, not the sole product claim. The durable quality bar is source fidelity + presentation structure + safe iterative editability.

The public repo includes the format **and the portable agent workflow** that composes checked-in public resources. Hosted user-material automation and product operations remain outside this repository.

## Hard constraints

1. **Public-safe only.** No private company information, internal/private agent traces, personal data, secrets, or content derived from real users. See `OPEN_SOURCE_BOUNDARY.md`; it overrides anything else.
2. **No ghostwriting positioning.** Never describe the product as writing assignments, reports, or presentations *for* someone. It structures materials the user provides. Avoid copy like "we write your presentation."
3. **No SaaS overbuild.** Do not add auth, payments, databases, upload systems, queues, dashboards, rate limiting, hosted inference, hosting services, analytics, public-gallery infrastructure, or marketplace code. The "Not now" list in `PRODUCT_DECISIONS.md` is binding.
4. **No provider/runtime dependency.** No npm packages, build steps, CDN links, external fonts, model SDKs, API keys, or network requests. Decks must open offline; deterministic helper scripts use Node built-ins only.
5. **No fake real metrics.** Example numbers must be fictional and explicitly labeled as demo/example data.
6. **English-first canonical content.** Canonical docs, prompts, examples, and skill instructions are English-first. Translations may exist but are not the source of truth.
7. **Gitignored private planning/source folders are input-only.** Any locally present folder excluded by `.gitignore` may inform private planning but must never be referenced from public files, copied verbatim, or committed.
8. **Agent Skill copies stay synchronized.** `.agents/skills/getslide/SKILL.md` and `.claude/skills/getslide/SKILL.md` are intentionally byte-identical. Update both in the same change and run the parity test.

## Repo structure

```txt
README.md                       Positioning and usage
PRODUCT_DECISIONS.md            Decision log
OPEN_SOURCE_BOUNDARY.md         Public/private boundary
AGENTS.md                       This file
LICENSE                         MIT
.agents/skills/getslide/        Agent Skills / Codex project skill
.claude/skills/getslide/        Byte-identical Claude Code project skill
docs/
  DECK_BRIEF.schema.md          Deck brief standard + executable shape
  HTML_DECK_CONTRACT.md         Requirements every generated deck must satisfy
  STUDENT_DEVELOPER_PATTERNS.md Slide pattern catalog
  VALIDATION.md                 Static + real-browser validation checklist
  GENERATION_HARNESS_SPEC.md    v0.2 benchmark harness contract
  EVALUATION_RUBRIC.md          First-generation quality rubric
  AGENT_WORKFLOW.md             v0.3 agent-native workflow
  EDITABILITY_EVAL.md           Post-generation editability policies/tools
templates/
  base-onefile-deck.html        Reusable standalone deck skeleton
examples/
  hackathon-demo/               Fictional example: DECK_BRIEF.md + index.html
prompts/
  source-to-deck-brief.md       Source-to-brief prompt
  brief-to-html-deck.md         Generation prompt
  edit-existing-html-deck.md    Editing prompt
  review-deck-structure.md      Review prompt
tools/
  prepare-deck.mjs              Arbitrary text/Markdown source staging
  validate-brief.mjs            Structural/source-sufficiency brief gate
  test-brief-validation.mjs     Brief-gate regression checks
  validate-deck.mjs             Structural validator
  evaluate-edit.mjs             Before/after edit-containment evaluator
  test-editability-eval.mjs     Positive/negative editability regressions
  browser-qa.mjs                Installed-Chrome multi-viewport runtime QA
  test-agent-workflow.mjs       v0.3 agent-workflow regression checks
  *generation*.mjs              v0.2 benchmark helpers
eval/                           Fictional benchmark fixtures and reports
```

Do not add new top-level folders without a decision recorded in `PRODUCT_DECISIONS.md`.

## Editing rules

- **Decks follow the contract.** Any HTML deck you create or edit must satisfy `docs/HTML_DECK_CONTRACT.md`: single file, `section.slide` with unique `data-slide-id` and a `data-pattern` from the catalog, TOC/nav, page numbers, keyboard navigation, print CSS, `:root` design tokens.
- **Edit slides, not the system.** When changing deck content, do not restructure CSS tokens, navigation script, or slide markup conventions unless that is the explicit task.
- **Source grounding is mandatory.** New factual content must be traceable to the source/brief. Missing facts stay in `missing_information`; low-risk framing defaults stay visible in `auto_filled_assumptions`.
- **Real README compression is selective, not lossy.** Preserve material lifecycle/status caveats and quantitative qualifiers; select only presentation-essential links; never treat a Markdown image reference as an actually supplied image asset.
- **Briefs are executable contracts.** Before generating a deck, `DECK_BRIEF.md` must pass `tools/validate-brief.mjs`. A structural PASS never substitutes for semantic source/brief review.
- **Templates may contain placeholders; examples may not.** `templates/` uses clearly-safe placeholder content. Anything under `examples/` must be complete, with zero unresolved placeholders (`TODO`, `TBD`, double curly braces, `[PLACEHOLDER]`, lorem ipsum).
- **Keep schema and examples in sync.** If you change `docs/DECK_BRIEF.schema.md`, update the fictional example brief and prompts that reference the fields.
- **Record decisions.** Any scope or positioning change goes into `PRODUCT_DECISIONS.md` in the same change.
- **Portable workflow only.** Public agent helpers may stage user-supplied text locally and assemble checked-in public resources; they may not fetch, upload, host, or call a model/provider.
- **Mechanical gates are bounded evidence.** `validate-brief.mjs` proves brief shape/mechanical sufficiency, `evaluate-edit.mjs` proves declared structural/change containment, and `browser-qa.mjs` proves specified multi-viewport/runtime behaviors. None proves semantic source fidelity or general visual quality.

## Validation expectations

After creating or changing `DECK_BRIEF.md`, run:

```sh
node tools/validate-brief.mjs <path-to-DECK_BRIEF.md>
```

`prepare-deck.mjs` also enforces this gate before creating `brief-to-deck-packet.md`.

After editing or creating any deck, run the static validator on every deck you touched and confirm exit code `0`:

```sh
node tools/validate-deck.mjs <path-to-deck.html>
```

For a before/after AI edit, apply the matching policy from `docs/EDITABILITY_EVAL.md`, for example:

```sh
node tools/evaluate-edit.mjs before.html after.html --mode targeted --targets problem
```

When a compatible installed Chrome/Chromium is available, run real browser QA:

```sh
node tools/browser-qa.mjs <path-to-deck.html>
```

The browser gate covers the required 1440×900 and 1280×800 geometric-fit viewports, navigation/hash/TOC/page-number behavior, and the focused-input typing guard. It does not prove projector aesthetics or print/PDF quality.

When changing the agent/editability workflow or validation tooling, run the proportional regression set:

```sh
node --check tools/validate-brief.mjs
node --check tools/test-brief-validation.mjs
node --check tools/evaluate-edit.mjs
node --check tools/test-editability-eval.mjs
node --check tools/browser-qa.mjs
node tools/test-brief-validation.mjs
node tools/test-editability-eval.mjs
node tools/browser-qa.mjs examples/hackathon-demo/index.html
node tools/test-agent-workflow.mjs
node tools/test-generation-harness.mjs
node tools/validate-deck.mjs examples/hackathon-demo/index.html
```

Run existing benchmark aggregation only when the completed local benchmark runs are actually present. A checked-in historical PASS summary is not a fresh test run.

Then perform remaining manual checks in `docs/VALIDATION.md` when applicable, especially:

- source/brief fidelity for every factual claim and material caveat,
- presentation relevance of selected links and availability of any required image assets,
- print preview with one slide per page,
- projector readability and visual composition,
- accessibility/contrast judgment,
- no ghostwriting language or private traces in the diff.

For claims about source grounding, a brief-validator PASS alone is insufficient. For claims about iterative AI editability, a deck-validator PASS alone is insufficient. For claims about visual quality, geometric browser-fit checks alone are insufficient.

Report what you actually checked; never convert a mechanical containment check, static validator, or browser-runtime gate into broader proof than it provides.

## What NOT to build yet

- Automated PDF/image/URL/repository ingestion.
- Any server, API, hosted inference, or hosted delivery service.
- Payment, auth, accounts, queues, analytics, public gallery, marketplace.
- A WYSIWYG editor.
- PPTX export unless a later task records validated compatibility demand.
- Additional themes/examples beyond what a task explicitly requests.

If a task seems to require one of these, surface the scope conflict instead of silently expanding the repository.

## Final report format

End every substantial task with this report:

```txt
Summary
Files created/changed
Important decisions captured
Validation performed
Known limitations
Recommended next task
```

Keep the report factual: name the checks you actually ran, list anything you skipped, and state limitations plainly.
