# getslide.md

**Turn project materials into AI-editable standalone HTML decks.**

getslide.md is an open-source kit for building presentation decks as **single standalone HTML files** — a slide format that AI tools can read, understand, and keep editing.

You bring your own materials (a README, project notes, a report draft). The kit gives you a structured way to turn them into a presentable deck, and — more importantly — a deck format you can keep improving with ChatGPT, Claude, Gemini, or whatever AI tool you already use.

## Why standalone HTML instead of PPTX?

> PPTX was built for manual editing.
> Standalone HTML decks are better for AI-assisted editing.

PPTX is familiar and compatible, but it is a poor format for iterative AI editing: the structure is opaque, targeted edits are hard, and layout rules are easy to break. A standalone HTML deck is different:

| Dimension | Standalone HTML advantage |
|---|---|
| AI editability | Plain text — an AI can read the whole deck and edit exactly one slide |
| Addressability | Each slide carries `data-slide-id` and `data-pattern` metadata, so edit instructions can be precise |
| Portability | One file contains structure, style, and behavior; works offline; no build step |
| Shareability | Host it, link it, embed it, print it to PDF |
| Cost | Keep editing with the AI subscription you already have — no separate slide SaaS needed |
| Versioning | Diff it, copy it, archive it like any text file |

The goal is not "generate a deck once." The goal is a deck that stays editable as a web asset.

## Who is this for?

1. **Student developers** (primary) — hackathon final pitches, capstone demos, developer club presentations, GitHub project showcases, side-project pitches.
2. **Job seekers** — portfolio case-study decks shared as links.
3. **Students who present reports** — turning their own written work into a clearer slide structure while preserving authorship and source responsibility.

If you are comfortable with GitHub, Markdown, and an AI chat tool, this kit is built for you.

## What's in the kit

```txt
docs/
  DECK_BRIEF.schema.md          The DECK_BRIEF.md standard (structured deck brief)
  HTML_DECK_CONTRACT.md         What every generated deck must contain
  STUDENT_DEVELOPER_PATTERNS.md Slide pattern catalog for developer presentations
  VALIDATION.md                 Pass/fail checklist before you present or share

templates/
  base-onefile-deck.html        Reusable standalone HTML deck skeleton

examples/
  hackathon-demo/
    DECK_BRIEF.md               Example brief for a fictional hackathon project
    index.html                  Complete example deck (Developer Demo theme)

prompts/
  brief-to-html-deck.md         Prompt: turn a DECK_BRIEF.md into a deck
  edit-existing-html-deck.md    Prompt: safely edit an existing deck
  review-deck-structure.md      Prompt: review a deck before finalizing
```

## What is intentionally NOT included

This is a starter kit, not a SaaS. There is deliberately:

- no web app, no accounts, no authentication
- no payment or subscription
- no upload pipeline, database, queue, or hosting service
- no PPTX export (print-to-PDF is the supported export path)
- no build step and no runtime dependencies

Everything here works with a text editor, a browser, and the AI tool of your choice.

## Quick start: open the example deck

1. Clone or download this repository.
2. Open [examples/hackathon-demo/index.html](examples/hackathon-demo/index.html) in any modern browser. It works offline — no server needed.
3. Navigate with `←` / `→` arrow keys, the sidebar table of contents, or scrolling.
4. To export a PDF, use the browser's Print dialog (each slide prints as one page).

## How to edit a deck with AI

Because the deck is one readable HTML file, you can paste it (or attach it) into your AI tool and ask for precise edits:

```txt
Revise only the slide with data-slide-id="problem".
Make the headline sharper and reduce the body to three bullets.
Do not change CSS tokens. Preserve the existing visual system.
```

Ready-made prompts live in [prompts/](prompts/). The rules an AI (or a human) should follow when editing are defined in [docs/HTML_DECK_CONTRACT.md](docs/HTML_DECK_CONTRACT.md).

## The DECK_BRIEF.md workflow

`DECK_BRIEF.md` is the structured intermediate between "pile of materials" and "finished deck":

```txt
your materials (README, notes, report)
  → DECK_BRIEF.md   (audience, goal, core message, key points, gaps, assumptions)
  → review & adjust (you stay in control of the content)
  → standalone HTML deck
  → keep editing with your AI tool
```

The brief makes generation predictable: it records what the deck should say, what information is missing, and which assumptions were auto-filled — so nothing gets invented silently. The format is defined in [docs/DECK_BRIEF.schema.md](docs/DECK_BRIEF.schema.md), with a complete example in [examples/hackathon-demo/DECK_BRIEF.md](examples/hackathon-demo/DECK_BRIEF.md).

## What getslide.md is not

- Not a generic AI presentation generator, and not a Canva/Gamma-style design platform.
- Not a PPTX generator.
- Not a ghostwriting or assignment-writing service. The kit structures and presents **materials you provide and work you did** — it does not do your work for you, and it should not be used to misrepresent authorship.

## License

[MIT](LICENSE)
