# Prompt: edit an existing HTML deck

Use these prompts to edit a deck you already have. The deck's structure makes precise edits possible: every slide has a `data-slide-id`, and the visual system lives in the `:root` design tokens. Good edit instructions say **which slide** to touch and **what must not change**.

Paste the whole deck file into your AI tool along with one of the prompts below.

## Base editing rules (prepend to any edit request)

```txt
You are editing a standalone HTML deck. Rules:
- Edit ONLY what I ask for, addressed by data-slide-id.
- Do not change the :root CSS design tokens.
- Do not modify the navigation script, the print CSS block, or the
  guidance comments — the table of contents and page numbers are
  script-generated and must stay that way.
- Preserve the existing visual system: reuse the classes and structures
  already in the file instead of inventing new inline styles.
- Do not add claims, metrics, or facts I did not provide.
- Keep every data-slide-id unique; keep one heading per slide.
- Return the complete updated HTML file.
```

## Example edit requests

Revise one slide:

```txt
Revise only the slide with data-slide-id="problem".
Make the headline sharper and reduce the body to three bullets.
Do not change CSS tokens.
Preserve the existing visual system.
```

Split a slide:

```txt
Split the slide with data-slide-id="architecture" into two slides:
"architecture" (system overview) and "architecture-detail"
(implementation details). Reuse the existing slide structure and
classes. The TOC and page numbers update themselves — do not touch them.
```

Add a slide:

```txt
Add a new slide with data-slide-id="team" and data-pattern="team-contribution"
between the slides "next-steps" and "closing". Content: [your team's real
roles and contributions]. Match the visual style of the existing slides.
```

Adjust tone globally (content-only):

```txt
Make the wording across all slides more suitable for a 5-minute hackathon
final pitch: shorter sentences, verbs first, no jargon the judges won't know.
Change text content only — no structural, CSS, or script changes.
Keep the slide count the same.
```

Re-theme (tokens-only — the one case where tokens change and content doesn't):

```txt
Re-theme this deck to a light, clean academic look by editing ONLY the
:root design token values (and the print token overrides if present).
Do not change any slide content, markup, or the script.
Keep text/background contrast comfortably readable.
```

## After editing

Skim the result against `docs/VALIDATION.md` — especially: unique slide IDs, no leftover placeholder text from the AI ("...", "[add content]"), TOC and page numbers still script-generated, and print preview still one slide per page.
