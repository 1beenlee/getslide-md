# Generation Harness Specification

## Purpose

v0.2 is an experimental, provider-neutral workflow for turning one README or Markdown document into an AI-editable Developer Demo deck. It creates reviewable files, not a hosted service or model integration.

## Scope

- Input: one README or Markdown document.
- Persona: university student developer.
- Direction: developer-demo only.
- Default output: approximately 5–8 slides, unless the source is too thin to support that range.
- Output: an approved DECK_BRIEF.md, one standalone HTML deck, structural validation, and an evaluation report.

## Pipeline

| Stage | Input | Output | Invariant |
|---|---|---|---|
| 0. Source intake | one Markdown file | copied source.md, benchmark.json, source packet | Preserve source wording and language. |
| 1. Source to brief | source packet | DECK_BRIEF.md | Separate facts, gaps, and assumptions. |
| 2. Brief review boundary | draft brief | approved brief | A person approves or corrects the brief before deck generation. |
| 3. Brief to deck | approved brief and template | index.html | Follow the HTML contract and add no unsupported facts. |
| 4. Structural validation | deck | validator output | validate-deck.mjs must exit 0. |
| 5. Constrained repair | failed deck and validator output | corrected deck | Repair only identified issues; preserve supported content. |
| 6. Benchmark evaluation | fixture, brief, deck | evaluation.json, evaluation.md | Separate automated evidence from manual review. |

## Evidence, confidence, and approvals

key_points must be source-supported. Unavailable evidence belongs in missing_information; low-risk framing defaults belong in auto_filled_assumptions. Assumptions never supply metrics, users, results, team roles, features, or implementation details. high confidence means the core story and context are supported; medium means reviewable gaps remain; low means the source is too sparse for a confident complete deck. The user approval boundary is Stage 2: do not treat a generated brief as approved merely because it parses.

## Validation and repair

Run node tools/validate-deck.mjs index.html. A failure uses prompts/repair-invalid-deck.md with the validator output, approved brief, contract, and base template. Re-run validation and then evaluation. Repair must not broaden the story, redesign valid slides, or silently fill gaps.

## Benchmark flow

Fixtures hold fictional source material and a small manifest of terms, links, forbidden fragments, expected confidence, and known gaps. prepare-generation.mjs stages an AI-ready packet without calling a model. evaluate-generation.mjs performs conservative string and contract checks, then records manual review requirements. run-benchmark.mjs aggregates available runs.

## Failure taxonomy

| ID | Failure |
|---|---|
| F1 | Source parsing failure |
| F2 | Required brief field missing |
| F3 | Unsupported factual claim |
| F4 | Unreported assumption |
| F5 | Important source fact omitted |
| F6 | Invalid HTML deck contract |
| F7 | Unresolved placeholder |
| F8 | Private/internal trace |
| F9 | Likely visual overflow |
| F10 | Print or navigation regression |

F1–F2 block the next stage. F3–F5 require content review. F6–F8 block delivery. F9–F10 require browser review or constrained repair.

## Provider-neutral and manual boundaries

The repository invokes no model API, stores no keys, and depends only on Node built-ins. A person may use any AI chat or coding tool to apply the checked-in prompts. Source interpretation, brief approval, factual accuracy review, visual overflow, browser behavior, and print preview intentionally remain manual or model-reviewed.

## Deferred

PDF, image, URL, and repository ingestion; hosted inference; source upload; automatic fact verification; visual browser automation; additional directions and themes; SaaS infrastructure; and any automatic approval flow are deferred.
