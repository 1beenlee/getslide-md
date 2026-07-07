# Prompt: review a deck before finalizing

Use this prompt before you call a deck done — after generation, after heavy edits, or before sharing/presenting. Paste the deck (and the `DECK_BRIEF.md` if you have one) into your AI tool with the prompt below.

---

```txt
You are reviewing a standalone HTML presentation deck before final delivery.
Do NOT rewrite the deck. Produce a review report only.

INPUTS
1. The deck (standalone HTML file).
2. The DECK_BRIEF.md it was built from (if provided).

REVIEW THESE DIMENSIONS

1. Story flow
   - Does the slide order build a coherent argument (problem → solution →
     evidence → ask)?
   - Does each slide earn its place, and does each heading state that
     slide's point on its own?

2. Audience fit
   - Given the brief's audience and presentation_context: is the technical
     depth right? Is anything unexplained jargon? Is anything condescending?

3. Slide count and pacing
   - Is the count realistic for time_limit_minutes (roughly 30–45 seconds
     per slide)? Which slides would you cut or merge if over?

4. Unsupported claims
   - List every claim, metric, or superlative that is NOT backed by the
     brief's key_points or source materials. Flag any number not clearly
     labeled as real-and-verifiable or as example/demo data.

5. Missing information
   - What would the audience expect that the deck doesn't answer?
   - Are items from the brief's missing_information handled honestly
     (restructured around, not papered over)?

6. Clarity
   - Slide-by-slide: wordy bullets, buried leads, headings that don't match
     their body content, text too small or dense to read from a projector.

7. Validation issues (structural)
   - Unresolved placeholders (TODO, TBD, {{...}}, [PLACEHOLDER], lorem ipsum,
     or leftover "Replace with ..." text).
   - Duplicate or missing data-slide-id / data-pattern attributes.
   - Hardcoded nav entries or page numbers (they must be script-generated).
   - Internal links (href="#...") that don't resolve.
   - Signs the design tokens or navigation script were tampered with.

OUTPUT FORMAT

For each dimension: PASS or ISSUES, with specifics.
Then a prioritized fix list:
  1. Blockers — must fix before presenting.
  2. Improvements — worth fixing if time allows.
  3. Nitpicks — optional polish.
For each fix, name the target slide by data-slide-id and describe the change
precisely enough that an edit prompt could execute it.
```

---

**After the review:** apply fixes with `prompts/edit-existing-html-deck.md`, then run the human checklist in `docs/VALIDATION.md` — this review complements it but does not replace it (keyboard navigation, print mode, and viewport checks need a real browser).
