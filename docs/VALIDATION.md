# Deck Validation Checklist

Run this checklist against any deck before presenting it, sharing it, or committing it to `examples/`. A deck passes only when **every item in the Manual checks section passes**.

The contract these checks enforce is defined in [HTML_DECK_CONTRACT.md](HTML_DECK_CONTRACT.md).

## Manual checks

### A. Content integrity

| # | Check | Pass condition |
|---|---|---|
| A1 | No unresolved placeholders | No `TODO`, `TBD`, `{{...}}`, `[PLACEHOLDER]`, `XXX`, `FIXME`, or lorem ipsum anywhere in the file. (Template placeholders are allowed only in `templates/`.) |
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
| C2 | Print mode exists | Browser print preview shows one slide per page, navigation chrome hidden, readable print colors. |
| C3 | Works offline as a file | The deck opens from `file://` with no network access and renders fully. |

### D. Readability and accessibility

| # | Check | Pass condition |
|---|---|---|
| D1 | Readable font sizes | Body text ≥ ~18px equivalent at 100% zoom; slide headings clearly dominant. |
| D2 | Basic accessibility | One `h1` (title slide), one `h2` per other slide; text/background contrast is comfortably readable on screen and in print; images (if any) have `alt` text. |
| D3 | No viewport overflow | At 1280×800 and 1440×900 at default zoom, no slide's content is cut off or forces horizontal scrolling. |

## Future automated checks

Not yet implemented. Candidates for a zero-dependency validation script, in priority order:

1. **Placeholder scan** — regex search for `TODO|TBD|\{\{|\[PLACEHOLDER\]|XXX|FIXME|lorem ipsum` (A1).
2. **Slide ID uniqueness** — parse `data-slide-id` values, assert no duplicates (B2).
3. **Pattern presence** — assert every `section.slide` has a non-empty `data-pattern` (B3).
4. **Internal anchor resolution** — assert every `href="#..."` target exists (B7).
5. **HTML well-formedness** — tag balance / parseability check (B1, partial).
6. **Single-file policy** — assert no `http(s)://` in `src`/`href` attributes of `script`, `link`, `img` (C3, partial; external links in visible content are allowed).
7. **Heading structure** — exactly one `h1`; every other slide has exactly one `h2` (D2, partial).
8. **Sensitive-string scan** — configurable denylist for internal names, emails, and private URL patterns (A2, partial — human review still required).

Checks A3, A4, C1, C2, D1, D3, and TOC behavior (B4–B6) remain human judgment or browser-based checks for now.
