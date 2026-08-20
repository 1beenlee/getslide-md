---
name: getslide
description: Turn a user-provided README, Markdown file, or project notes into a source-grounded, AI-editable standalone HTML presentation deck. Use when asked to make, generate, structure, revise, or validate a getslide deck from existing source material.
---

# getslide

## Purpose

Create a presentation deck from **source material the user already owns or provides**. The workflow is source-grounded: facts, gaps, and assumptions stay explicit through `DECK_BRIEF.md`, and the final artifact is one standalone HTML file that remains easy to target and revise with AI.

Standalone HTML is the canonical artifact, not the product claim by itself. The quality bar is: **faithful to source, presentation-ready, addressable by slide ID, structurally valid, and safe to keep editing.**

## Supported input

v0.3 supports one UTF-8 text or Markdown source at a time, including:

- a README
- project notes
- copied report text
- pasted text saved to a temporary/local Markdown file

If the only source is a PDF, image, URL, repository URL, private connector, or other unsupported input, do not invent an ingestion path. Explain that this public workflow currently needs text/Markdown and ask for or create a text export only when the user has supplied the content.

## Hard boundaries

- Read `AGENTS.md`, `PRODUCT_DECISIONS.md`, and `OPEN_SOURCE_BOUNDARY.md` before changing repository files.
- Never position the workflow as ghostwriting. Structure and present the user's material; do not create work they did not do.
- Never invent metrics, users, results, team roles, features, architecture, research findings, or implementation details.
- Never hide uncertainty. Put unavailable evidence in `missing_information` and low-risk framing defaults in `auto_filled_assumptions`.
- Do not add a model API, provider routing, network request, dependency, hosted service, auth, payment, analytics, queue, or database.
- Do not rewrite the base template's navigation system merely to make a content edit.
- Do not claim browser, print, or visual QA unless you actually performed it.

## Workflow

### 1. Choose a task-owned output directory

Use a user-specified output directory when provided. Otherwise create a local task-owned directory such as `getslide-output/<source-stem>/`. Do not commit generated user material unless the user explicitly asks and repository policy allows it.

When the user pasted the source instead of giving a file path, save the pasted content as a task-owned Markdown file first. Preserve the original language and wording; do not pre-summarize away evidence before staging it.

### 2. Stage the source

Run:

```sh
node tools/prepare-deck.mjs <source-file> --out <run-directory>
```

The first run creates:

- `source.md`
- `source-to-brief-packet.md`

Read `source-to-brief-packet.md` and create one complete `DECK_BRIEF.md` in the run directory.

### 3. Apply the source-sufficiency gate

The brief is mandatory. Use `docs/DECK_BRIEF.schema.md` exactly.

**High confidence**

Proceed to deck generation when all are true:

- the user explicitly asked for the deck to be created end-to-end,
- the core story, audience/context, and key points are supported,
- there is no unresolved factual gap required by the proposed deck,
- there is no new risky assumption.

A high-confidence end-to-end request does not require an extra approval turn. Still keep the brief on disk and include its key assumptions/gaps in the final report.

**Medium confidence**

Surface `missing_information` and `auto_filled_assumptions`. Continue only when the existing user request clearly permits low-risk auto-fill and doing so does not create a factual claim. Otherwise stop after the brief and ask for the missing source or approval of the listed assumptions.

**Low confidence**

Stop after the brief. Explain which source material is missing. Do not create a polished deck that could make unsupported content look authoritative.

### 4. Prepare the generation packet

After `DECK_BRIEF.md` exists, rerun:

```sh
node tools/prepare-deck.mjs <source-file> --out <run-directory>
```

This creates `brief-to-deck-packet.md` containing the current brief plus the checked-in generation prompt, base template, HTML contract, and pattern catalog.

### 5. Generate `index.html`

Use `brief-to-deck-packet.md` as the generation contract.

Required behavior:

- generate one complete standalone HTML file,
- map every substantive claim to the brief,
- preserve the template's design-token structure, navigation script, print CSS, and semantic slide conventions,
- use unique kebab-case `data-slide-id` values and valid `data-pattern` values,
- keep text readable rather than shrinking to fit,
- preserve all required links,
- leave no TODO/TBD/placeholders,
- do not fill a missing-information item with invented content.

Write the result to `<run-directory>/index.html`.

### 6. Validate and repair narrowly

Run:

```sh
node tools/validate-deck.mjs <run-directory>/index.html
```

If validation fails, repair only the reported defect. Do not use a validator failure as permission to redesign valid slides or broaden the story. Rerun validation until it passes or report the blocker.

If a browser is available, also check the manual items in `docs/VALIDATION.md`: navigation/TOC, page numbering, viewport overflow, readable type, keyboard behavior, and print preview. If a browser is not available, mark those checks as **not freshly verified**.

### 7. Report the result

Return:

- source path
- `DECK_BRIEF.md` path and confidence
- `index.html` path
- automated validation result
- assumptions and unresolved missing information
- manual/browser checks actually performed
- anything not verified

Do not call the task complete if unsupported factual claims remain or the validator fails.

## Revising an existing getslide deck

For a later edit request:

1. Target the smallest possible slide scope using `data-slide-id`.
2. Preserve unrelated slides, CSS tokens, and the canonical navigation script.
3. If the edit introduces new factual content, update/verify the brief or source first.
4. Rerun `tools/validate-deck.mjs` after the edit.
5. When the user asks whether the deck remains AI-editable, use `docs/EDITABILITY_EVAL.md` rather than treating a validator pass as sufficient proof.

## Repository self-check

When modifying this skill or its workflow implementation, run:

```sh
node tools/test-agent-workflow.mjs
node tools/test-generation-harness.mjs
node tools/validate-deck.mjs examples/hackathon-demo/index.html
```

The Codex/Agent Skills copy and Claude Code copy must stay byte-identical.
