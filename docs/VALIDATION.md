# Deck Validation Checklist

Run this checklist against any deck before presenting it, sharing it, or committing it to `examples/`. A deck passes only when **every item in the Manual checks section passes**.

The contract these checks enforce is defined in [HTML_DECK_CONTRACT.md](HTML_DECK_CONTRACT.md).

## Manual checks

### A. Content integrity

| # | Check | Pass condition |
|---|---|---|
| A1 | No unresolved placeholders | No `TODO`, `TBD`, double curly braces, `[PLACEHOLDER]`, `XXX`, `FIXME`, or lorem ipsum anywhere in the file. (Template placeholders are allowed only in `templates/`.) |
| A2 | No private/internal traces | No internal tool names, system prompt fragments, private links, personal emails, company information, or content derived from real user materials. |
| A3 | No ghostwriting language | Nothing positions the deck or kit as doing someone's assignment or writing their work for them. |
| A4 | No fake real metrics | Every number is either real and verifiable by the author, or explicitly labeled as example/demo data. No invented users, traction, or benchmark claims. |

### B. Structure

| # | Check | Pass condition |
|---|---|---|
| B1 | Valid HTML structure | File has a doctype, `<html>`, `<head>`, `<body>`; tags are balanced; the file opens in a browser without console errors. |
| B2 | Unique slide IDs | Every `section.slide` has a `data-slide-id`; no value appears twice. |
| B3 | Patterns declared | Every slide has a `data-pattern`, either from the catalog or documented in the deck. |
| B4 | Nav count matches slide count | The TOC shows exactly one entry per slide. (Automatic if the TOC is script-generated per the contract — still verify visually.) |
| B5 | TOC links work | Clicking each TOC entry navigates to the correct slide. |
| B6 | Page numbers match order | Each slide shows `n / total` consistent with its document order. |
| B7 | No broken internal links | Every `href="#..."` in the file resolves to an existing element. |

### C. Behavior

| # | Check | Pass condition |
|---|---|---|
| C1 | Keyboard navigation works | `←`/`→`, `PageUp`/`PageDown`, `Home`/`End` move between slides; keys are not hijacked while typing in form fields. |
| C1a | Navigation state stays synchronized | The active slide and matching TOC entry update together; the URL hash equals the current `data-slide-id`; the page number remains `current / total`; TOC click and direct hash load update all four. |
| C1b | Presentation keys do not scroll the browser | `ArrowRight`, `ArrowLeft`, `Space`, `PageDown`, `PageUp`, `Home`, and `End` stay within the first/last slide boundary and do not trigger unexpected document scrolling. |
| C2 | Print mode exists | Browser print preview shows one slide per page, navigation chrome hidden, readable print colors. |
| C3 | Works offline as a file | The deck opens from `file://` with no network access and renders fully. |

### D. Readability and accessibility

| # | Check | Pass condition |
|---|---|---|
| D1 | Readable font sizes | Body text ≥ ~18px equivalent at 100% zoom; slide headings clearly dominant. |
| D2 | Basic accessibility | One `h1` (title slide), one `h2` per other slide; text/background contrast is comfortably readable on screen and in print; images (if any) have `alt` text. |
| D3 | No viewport overflow | At 1280×800 and 1440×900 at default zoom, no slide's content is cut off or forces horizontal scrolling. |

## Automated checks — static validator

A zero-dependency Node.js validator, [`tools/validate-deck.mjs`](../tools/validate-deck.mjs), automates the structural subset of the manual checks above. It uses only Node built-in modules — no dependencies, no build step.

```sh
# validate the example deck
node tools/validate-deck.mjs examples/hackathon-demo/index.html

# validate the template (auto-detected as template mode: placeholders → warnings)
node tools/validate-deck.mjs templates/base-onefile-deck.html
```

It exits `0` on pass and `1` on any failure, printing a per-check `[PASS]`/`[FAIL]`/`[WARN]`/`[INFO]` report. What it checks and the manual item it maps to:

| Validator check | Maps to |
|---|---|
| Input file exists | (prerequisite) |
| `section.slide` present and counted | B (structure) |
| Every slide has `data-slide-id` | B2 |
| Every slide has `data-pattern` | B3 |
| `data-slide-id` values unique | B2 |
| No unresolved placeholders (`TODO`, `TBD`, `FIXME`, `XXX`, double curly braces, `[PLACEHOLDER]`, `lorem`, `Replace with`) | A1 |
| No private/internal traces (`.env`, private key, internal source, system prompt, `briefing-deck-maker`, `kick-off`) | A2 |
| `@media print` present | C2 |
| Navigation contract complete (static signals for required keys, typing guard, active TOC, hash, TOC click, and page numbers) | C1, C1a, C1b |
| Metrics labeling (informational only, never fails) | A4 |

**Modes.** The validator auto-detects templates (path under `templates/` or basename `base-onefile-deck.html`) and downgrades placeholder findings to warnings, since templates intentionally ship `Replace with ...` placeholders. Force with `--template`, or force example rules with `--strict`.

## Automated checks — real browser QA

`tools/browser-qa.mjs` closes part of the gap between static signals and actual runtime behavior. It launches an **already installed Chrome/Chromium** in headless mode from the local `file://` deck and uses the DevTools protocol directly through Node built-ins.

```sh
node tools/browser-qa.mjs examples/hackathon-demo/index.html
```

If the executable is not auto-discovered, set `GETSLIDE_BROWSER` to the Chrome/Chromium executable path. The script does not install, download, or call a hosted browser.

It currently exercises:

| Browser-QA check | Maps to |
|---|---|
| Deck loads from `file://` in real Chrome/Chromium | B1, C3 (runtime evidence) |
| Generated TOC count and hash targets match slides | B4, B5, C1a |
| Generated `current / total` numbers match order | B6, C1a |
| Document/body/main/slides do not overflow horizontally at 1440×900 | D3 (one required viewport) |
| Each slide fits within one 1440×900 viewport vertically | D3 (one required viewport) |
| Initial active slide is synchronized | C1a |
| TOC click works | B5, C1a |
| ArrowRight/ArrowLeft, PageDown/PageUp, Home/End, Space work | C1, C1b |
| Direct hash navigation updates the active slide | C1a |

A browser-QA PASS is stronger than static inspection for those specific checks, but it still does **not** prove the second required 1280×800 viewport, projector readability, visual composition, typing-field guard behavior, or print quality. Those remain manual unless a later task adds a real executable check for them.

## Edit containment after AI changes

When validating a before/after AI edit, also use [`tools/evaluate-edit.mjs`](../tools/evaluate-edit.mjs) and the policies in [`EDITABILITY_EVAL.md`](EDITABILITY_EVAL.md). The evaluator can prove declared structural/change containment and invoke the static validator; it cannot prove semantic factual/source fidelity.

## What remains manual

Automation is a set of evidence gates, not a replacement for the checklist. Human or model review still owns:

- A3 ghostwriting/positioning judgment,
- A4 whether non-demo numbers are actually supported,
- B1 full HTML correctness beyond successful tested-browser load,
- B7 arbitrary internal anchors outside the generated TOC,
- C1 typing-target behavior unless explicitly runtime-tested,
- C2 one-page-per-slide print preview and print colors,
- D1 projector readability,
- D2 accessibility/contrast judgment,
- D3 the 1280×800 viewport and any touched slide visual-composition judgment,
- semantic source fidelity for generated or edited factual claims.

Do not convert a static-validator PASS, edit-containment PASS, or browser-runtime PASS into a claim that these separate manual dimensions were verified.
