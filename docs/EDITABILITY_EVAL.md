# AI Editability Evaluation

A getslide deck is not proven useful merely because the first generation passes the HTML validator. The product thesis also depends on **safe iterative editing**: an agent should be able to change the requested part of the deck without corrupting unrelated content, source grounding, navigation, or layout conventions.

This document defines the post-generation editability probes and the executable containment/browser gates. The tooling is provider-neutral and uses no model API.

## Evaluation unit

Start from a deck that already has:

- its source material
- the corresponding `DECK_BRIEF.md`
- a validator-passing `index.html`

Freeze copies of the brief and pre-edit deck before each independent probe. Do not chain all probes onto one increasingly modified deck unless the test explicitly measures cumulative edits.

## What every probe measures

Score each dimension from 0 to 4 using the same scale as `docs/EVALUATION_RUBRIC.md`.

| Dimension | Pass expectation |
|---|---|
| Change containment | Requested scope changes; unrelated slides/system code remain materially unchanged. |
| Source grounding | No unsupported factual claim is introduced. New evidence comes from the source/brief or is added to them first. |
| Contract preservation | `section.slide`, unique IDs, patterns, headings, design tokens, print rules, and navigation conventions remain valid. |
| Navigation/page integrity | TOC/hash/page-number behavior still maps to the new slide order/count. |
| Readability | The requested edit does not solve fit problems by making text unreasonably dense or small. |
| Trace safety | No prompt text, local paths, secrets, or private workflow traces leak into visible output. |

Automated validator PASS is required after every probe, but it is **not sufficient** for an editability PASS.

## Probe E1 — Targeted single-slide copy edit

Example instruction:

```text
Revise only the slide with data-slide-id="problem". Sharpen the headline and reduce the body to three bullets. Do not change any other slide or the deck system.
```

Check:

- only the requested slide's visible content changes, except mechanically generated nav/page state,
- `data-slide-id` and `data-pattern` stay stable unless the requested content genuinely requires a pattern change,
- no CSS token or navigation-script rewrite occurs,
- factual meaning remains within the brief.

## Probe E2 — Split one slide into two

Example instruction:

```text
Split data-slide-id="architecture" into two slides: system overview and implementation details. Preserve the theme and do not add unsupported technical facts.
```

Check:

- two useful slides replace the original without duplicating filler,
- new IDs are unique and semantically named,
- both patterns exist in the pattern catalog,
- slide count, TOC, URL hashes, and page numbers remain coherent,
- implementation details are supported by the source/brief rather than inferred from common practice.

## Probe E3 — Add newly supplied evidence

Before the edit, add one factual item to the source and/or brief, such as a measured result, a verified demo link, or a clarified team role.

Example instruction:

```text
Add the newly verified result from DECK_BRIEF.md to the evidence/results slide. Keep the rest of the story unchanged.
```

Check:

- the new claim exactly matches the newly supplied evidence,
- no adjacent metric or interpretation is fabricated,
- the edit is localized to the best-fit slide unless a second change is necessary for narrative consistency,
- required links remain visible and correct.

Mechanically, E3 normally uses the same `targeted` containment mode as E1. The evaluator can prove containment; it cannot prove that the new evidence is true or faithfully interpreted.

## Probe E4 — Reorder slides

Example instruction:

```text
Move the demo-flow slide before architecture so the presentation reaches the working product sooner. Do not rewrite slide content unless a transition becomes misleading.
```

Check:

- slide sections move without ID duplication or content loss,
- TOC/hash/page behavior follows the new order,
- transition wording is changed only where necessary,
- canonical navigation code is unchanged.

## Probe E5 — Tone and length adjustment

Example instruction:

```text
Adapt this deck from a 7-minute technical demo to a 5-minute mixed-audience pitch. Keep it under 8 slides and preserve all source-supported claims.
```

Check:

- cuts/merges remove secondary detail rather than evidence needed for the core message,
- no new claim is invented to make the shorter story more persuasive,
- readability is preserved,
- removed material is consciously omitted rather than accidentally lost,
- final slide count and narrative fit the new constraint.

## Optional Probe E6 — Cumulative two-edit stability

Apply E1 followed by E3 to the same deck. This checks whether the second edit preserves a prior valid targeted edit instead of regenerating the deck from scratch.

Use this only after the independent probes pass; cumulative editing introduces more variables and should not obscure a basic single-edit failure.

## Executable containment evaluator

`tools/evaluate-edit.mjs` compares a frozen before deck with an edited after deck. It always runs the existing deck validator on the after deck and blocks `:root` design-token drift, script/navigation drift, and non-slide system-shell drift.

### Targeted edit / E1 or E3

```sh
node tools/evaluate-edit.mjs before.html after.html \
  --mode targeted \
  --targets problem
```

The slide set/order must be unchanged. Only declared target slide sections may change.

### Slide split / E2

```sh
node tools/evaluate-edit.mjs before.html after.html \
  --mode split \
  --replace architecture:architecture-overview,architecture-details
```

The declared original slide must be replaced in place by exactly the declared new IDs; unrelated slides must stay byte-stable.

### Reorder / E4

```sh
node tools/evaluate-edit.mjs before.html after.html \
  --mode reorder \
  --order title,problem,demo-flow,architecture,closing
```

The after deck must use exactly the original slide set in the declared order. Slide-section contents must remain byte-stable.

### Compression / E5

```sh
node tools/evaluate-edit.mjs before.html after.html \
  --mode compression \
  --targets problem,solution \
  --allow-remove technical-details
```

No slide additions or reordering are allowed. Surviving non-target slides must remain byte-stable, and only explicitly declared slides may be removed.

### What the evaluator does not prove

A mechanical PASS does **not** mean the edited text is factually correct, source-supported, persuasive, or visually good. It proves only that the declared structural/edit scope was respected and that the after deck still passes the static deck validator. Source/brief review remains mandatory for semantic claims.

## Regression suite

Run the checked-in positive/negative mutation suite:

```sh
node tools/test-editability-eval.mjs
```

The suite copies the fictional public example into a temporary directory and verifies both accepted changes and blocked failure modes, including undeclared slide edits, design-token drift, navigation-script drift, undeclared removals, and content rewrites during reorder.

## Real browser quality gate

`tools/browser-qa.mjs` launches an **actually installed Chrome/Chromium** in headless mode and uses the DevTools protocol directly through Node built-ins. It does not install or download a browser. Browser sandboxing stays enabled, and external page network is routed through a dead local proxy during QA.

```sh
node tools/browser-qa.mjs <deck.html>
```

Set `GETSLIDE_BROWSER` to an executable path if auto-discovery cannot find Chrome/Chromium.

The browser gate currently verifies:

- generated TOC count and hash targets,
- generated `current / total` page numbers,
- no horizontal document/body/main/slide overflow at **1440×900 and 1280×800**,
- no slide taller than one viewport at either required size,
- initial active-slide synchronization,
- TOC click navigation,
- ArrowRight/ArrowLeft, PageDown/PageUp, Home/End, and Space navigation,
- a focused temporary input prevents all seven presentation keys from changing active slide/hash,
- direct hash navigation.

The focused-input probe is injected only into the live browser DOM and removed after the check; the deck file on disk is not changed.

This is real runtime evidence, not static inspection. It still does not replace human review for projector readability, composition quality, print preview/PDF rendering, accessibility judgment, or factual/source fidelity.

## Manual/browser checks

For a real edited deck, also inspect what automation does not establish:

- projector-readable type size and information density,
- visual hierarchy and composition on every touched/new slide,
- print preview with one slide per page,
- source/brief fidelity of every changed factual claim.

If an executable browser is unavailable, record browser checks as **not freshly verified**. Do not convert static HTML inspection into a visual PASS claim.

## Passing the editability milestone

A deck passes the editability milestone when:

- E1–E5 each finish with validator exit `0`,
- applicable `evaluate-edit.mjs` containment checks pass,
- no probe introduces an unsupported factual claim,
- no probe rewrites the canonical navigation system without being asked,
- no critical dimension scores below `3`,
- average manual/model score across the six dimensions is at least `3.0`,
- browser/runtime behavior is actually verified where claimed,
- remaining visual/print/semantic items are either reviewed or explicitly left open rather than falsely marked PASS.

The purpose is not to optimize for a particular model. It is to test whether getslide's artifact contract makes **small, trustworthy, repeatable AI edits** practical across compatible agents.
