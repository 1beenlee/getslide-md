# AGENTS.md

Instructions for AI coding agents (Claude, Codex, or others) working on this repository. Read this file, `PRODUCT_DECISIONS.md`, and `OPEN_SOURCE_BOUNDARY.md` before making changes.

## Project thesis

getslide.md turns project materials into **AI-editable standalone HTML decks**.

> PPTX was built for manual editing. Standalone HTML decks are better for AI-assisted editing.

The canonical output is always **one standalone HTML file** that a user can keep editing with the AI tool they already use. This repo is the public open-source kit that proves the thesis: a skeleton, a brief schema, a pattern catalog, prompts, one example deck, and a validation checklist. It is not the product's automation layer.

## Hard constraints

1. **Public-safe only.** No private company information, no internal tool names or traces, no personal data, no content derived from real users. See `OPEN_SOURCE_BOUNDARY.md` for the full boundary; it overrides anything else.
2. **No ghostwriting positioning.** Never describe the product as writing assignments, reports, or presentations *for* someone. It structures materials the user provides. Avoid copy like "we write your presentation."
3. **No SaaS overbuild.** Do not add auth, payments, databases, upload systems, queues, dashboards, rate limiting, hosting services, analytics, or marketplace code. The "Not now" list in `PRODUCT_DECISIONS.md` is binding.
4. **No dependencies.** No npm packages, build steps, CDN links, external fonts, or network requests. Every deck must open offline as a plain file.
5. **No fake real metrics.** Example numbers must be fictional and explicitly labeled as demo/example data.
6. **English-first.** All public repo content is written in English.
7. **Gitignored private planning/source folders are input-only.** Any locally present folder excluded by `.gitignore` (planning documents, private sources, internal notes) may inform your work but must never be referenced from public files, copied from verbatim, or committed.

## Repo structure

```txt
README.md                       Positioning and usage
PRODUCT_DECISIONS.md            Decision log (Decided / Deferred / Not now / Open questions)
OPEN_SOURCE_BOUNDARY.md         What may and may not be published
AGENTS.md                       This file
LICENSE                         MIT
docs/
  DECK_BRIEF.schema.md          Deck brief standard
  HTML_DECK_CONTRACT.md         Requirements every generated deck must satisfy
  STUDENT_DEVELOPER_PATTERNS.md Slide pattern catalog
  VALIDATION.md                 Pass/fail checklist
templates/
  base-onefile-deck.html        Reusable standalone deck skeleton
examples/
  hackathon-demo/               Fictional example: DECK_BRIEF.md + index.html
prompts/
  brief-to-html-deck.md         Generation prompt
  edit-existing-html-deck.md    Editing prompt
  review-deck-structure.md      Review prompt
```

Do not add new top-level folders without a decision recorded in `PRODUCT_DECISIONS.md`.

## Editing rules

- **Decks follow the contract.** Any HTML deck you create or edit must satisfy `docs/HTML_DECK_CONTRACT.md`: single file, `section.slide` with unique `data-slide-id` and a `data-pattern` from the catalog, TOC/nav, page numbers, keyboard navigation, print CSS, `:root` design tokens.
- **Edit slides, not the system.** When changing deck content, do not restructure CSS tokens, navigation script, or slide markup conventions unless that is the explicit task.
- **Templates may contain placeholders; examples may not.** `templates/` uses clearly-safe placeholder content. Anything under `examples/` must be complete, with zero unresolved placeholders (`TODO`, `TBD`, `{{...}}`, `[PLACEHOLDER]`, lorem ipsum).
- **Keep schema and examples in sync.** If you change `docs/DECK_BRIEF.schema.md`, update `examples/hackathon-demo/DECK_BRIEF.md` and the prompts that reference the fields.
- **Record decisions.** Any scope or positioning change goes into `PRODUCT_DECISIONS.md` in the same change.

## Validation expectations

After editing or creating any deck, **run the validator** on every deck you touched and confirm it passes (exit code `0`):

```sh
node tools/validate-deck.mjs <path-to-deck.html>
```

The validator (`tools/validate-deck.mjs`, Node built-ins only) covers the automatable checks: slide IDs, `data-pattern`, uniqueness, placeholders, private/internal traces, print CSS, keyboard navigation. It does not replace the checklist.

Then run the remaining **Manual checks** in `docs/VALIDATION.md` — the ones the validator cannot cover:

- TOC/nav entries match the slides,
- page numbers match slide order,
- print mode renders one slide per page,
- no viewport overflow, readable font sizes,
- no ghostwriting language anywhere in the diff.

Report what you checked and the results; do not claim validation you did not perform.

## What NOT to build yet

- Automated ingestion of user files (PDF/image/URL parsing).
- Any server, API, or hosted service.
- Payment, auth, accounts, queues, analytics, marketplace.
- A WYSIWYG editor.
- Additional themes/examples beyond what a task explicitly requests.

If a task seems to require one of these, stop and surface the conflict instead of building it.

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
