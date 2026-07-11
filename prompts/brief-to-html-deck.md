# Prompt: DECK_BRIEF.md → standalone HTML deck

Use this prompt with your AI tool (ChatGPT, Claude, Gemini, etc.) to turn an approved `DECK_BRIEF.md` into a standalone HTML deck. Attach or paste **three things**: your `DECK_BRIEF.md`, the template (`templates/base-onefile-deck.html`), and — if your tool has room — the contract (`docs/HTML_DECK_CONTRACT.md`).

---

```txt
You are generating a presentation deck as a single standalone HTML file.

INPUTS
1. DECK_BRIEF.md — the approved deck brief (attached/pasted below).
2. base-onefile-deck.html — the deck template to build on.
3. HTML_DECK_CONTRACT.md — the structural contract (if attached).

TASK
Generate one complete standalone HTML deck from the brief, using the template
as the base. Keep the template's design token structure, canonical navigation
script, print CSS, and guidance comments intact.

The template navigation script is canonical behavior, not optional scaffolding.
Do not replace, simplify, remove, or rewrite the template navigation script.
Do not copy navigation markup per slide. Edit only slide content, slide IDs,
patterns, and deck-specific visible text unless the user explicitly requests a
template-level navigation change.

RULES

Preserve the brief's intent:
- The deck says what the brief says. core_message drives the title and closing
  slides; every slide maps to key_points or explicit brief fields.
- Respect audience, presentation_context, presentation_goal, and
  time_limit_minutes when choosing tone and depth.
- Include every entry in required_links, written out visibly.

Do not invent:
- No claims, features, metrics, users, or results that are not in the brief.
- If the brief lists something under missing_information, do NOT fill the gap
  with invented content — restructure the slide so it isn't needed, or note it
  to me in your reply (outside the HTML).
- Anything you add from auto_filled_assumptions must stay consistent with how
  the brief states it. If you must assume anything NEW to complete a slide,
  list each new assumption in your reply so I can approve or correct it.

Follow the deck contract:
- One standalone HTML file, no external dependencies, works offline.
- Each slide: <section class="slide" data-slide-id="..." data-pattern="...">,
  with a unique kebab-case data-slide-id and a pattern from the student
  developer pattern catalog.
- Exactly one h1 (title slide); one h2 on every other slide.
- Do not hardcode nav entries or page numbers — the template script generates
  them from the slides.
- Preserve the script's complete navigation contract: active slide and TOC
  state, `current / total` page numbers, URL hash synchronization, direct hash
  loading, TOC clicks, ArrowRight/ArrowLeft, Space, PageDown/PageUp, Home/End,
  typing-target guard, and prevention of browser scrolling for handled keys.
- Zero unresolved placeholders: no TODO/TBD/double curly braces/[PLACEHOLDER]/lorem ipsum.
  Every "Replace with ..." string from the template must be gone.

Keep the slide count reasonable:
- Target slide_count_target from the brief; if unset, use roughly one slide
  per 30–45 seconds of time_limit_minutes (a 5-minute pitch is 8–10 slides).
- If the brief's key points don't fit, merge or cut slides — never shrink text
  below readable size to cram content.

OUTPUT
- Output the complete HTML file in a single code block.
- After the code block, list: (a) any new assumptions you made,
  (b) any brief content you could not include and why.
```

---

**After generating:** run the deck through `prompts/review-deck-structure.md`, then check it against `docs/VALIDATION.md` before presenting.
