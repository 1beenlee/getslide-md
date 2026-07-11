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

## Automated checks (validator script)

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

**Still manual.** The validator is a first pass, not a replacement for the checklist. It checks static evidence only and cannot prove runtime navigation, hash transitions, scrolling behavior, visual active-state synchronization, or print output. Checks A3, B1, B4–B7, C2 (one-page-per-slide), C3, D1–D3, and browser/print behavior still require human judgment or a browser. HTML well-formedness, internal-anchor resolution, single-file policy, and heading structure are candidates for a future version.
