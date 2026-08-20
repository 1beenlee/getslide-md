# getslide.md

![getslide.md workflow](docs/assets/readme-hero-en.png)

[한국어](./README-ko.md)

**Turn project materials into source-grounded, AI-editable presentation decks.**

getslide.md is an open-source **deck compiler and Agent Skill workflow** for turning a README, project notes, or report text into one standalone HTML presentation deck.

The important part is not just the output format. getslide keeps a visible evidence boundary from source to deck:

```txt
source materials
  → facts / gaps / assumptions
  → DECK_BRIEF.md
  → standalone HTML deck
  → validation
  → targeted AI edits
```

That makes the result easier to trust, easier to review, and easier to keep editing with the AI/agent tool you already use.

## Why standalone HTML?

Standalone HTML remains the canonical artifact because it is unusually well suited to AI-assisted iteration:

| Dimension | Standalone HTML advantage |
|---|---|
| AI editability | Plain text — an AI can inspect and change a precise slide without opaque binary structure |
| Addressability | Each slide carries `data-slide-id` and `data-pattern` metadata for targeted edits |
| Portability | One file contains structure, style, and behavior; works offline; no build step |
| Shareability | Host it, link it, embed it, or print it to PDF |
| Versioning | Diff it, copy it, archive it like any text file |
| Validation | Static structure and safety rules can be checked before delivery |

HTML is an architectural advantage, not the whole product thesis. A good getslide deck must also stay **source-grounded, presentation-ready, structurally valid, and safely editable after generation**.

## Who is this for?

The first validation cohort is **student developers** making hackathon pitches, capstone demos, developer-club presentations, GitHub project showcases, and side-project demos.

The same workflow can later be tested with portfolio/job-seeker decks and other technical builders who already have source material but want a better presentation artifact.

If you are comfortable with Markdown and an AI agent/chat tool, this kit is designed to be useful without another slide SaaS subscription.

## What's in the kit

```txt
.agents/skills/getslide/
  SKILL.md                      Agent Skills / Codex project skill

.claude/skills/getslide/
  SKILL.md                      Byte-identical Claude Code project skill

docs/
  DECK_BRIEF.schema.md          Structured source/intent/evidence boundary
  HTML_DECK_CONTRACT.md         What every generated deck must contain
  STUDENT_DEVELOPER_PATTERNS.md Slide pattern catalog for developer presentations
  VALIDATION.md                 Pass/fail checklist before you present or share
  AGENT_WORKFLOW.md             v0.3 agent-native workflow
  EDITABILITY_EVAL.md           Post-generation targeted-edit evaluation
  GENERATION_HARNESS_SPEC.md    v0.2 benchmark harness contract
  EVALUATION_RUBRIC.md          First-generation quality rubric

templates/
  base-onefile-deck.html        Reusable standalone HTML deck skeleton

examples/
  hackathon-demo/
    DECK_BRIEF.md               Fictional example brief
    index.html                  Complete Developer Demo deck

prompts/
  source-to-deck-brief.md       Source → DECK_BRIEF prompt
  brief-to-html-deck.md         DECK_BRIEF → deck prompt
  edit-existing-html-deck.md    Targeted editing prompt
  review-deck-structure.md      Review prompt

tools/
  prepare-deck.mjs              Stage one arbitrary text/Markdown source
  validate-deck.mjs             Zero-dependency deck validator
  test-agent-workflow.mjs       v0.3 workflow regression checks
  *generation*.mjs              v0.2 benchmark helpers

eval/
  fixtures/                     Fictional benchmark sources
  reports/                      Checked-in benchmark summary
```

## Fastest path: use the getslide Agent Skill

The repository ships a project-level `getslide` skill for compatible agents.

- Agent Skills / Codex-compatible path: `.agents/skills/getslide/SKILL.md`
- Claude Code project-skill path: `.claude/skills/getslide/SKILL.md`

The two skill files are intentionally identical. A regression test prevents them from drifting.

With the repository open in a compatible agent, ask for a deck from a README/Markdown source, for example:

```txt
Use getslide to turn README.md into a 5-minute developer demo deck.
Keep every factual claim grounded in the source and validate the result.
```

The agent workflow will:

1. stage the source without changing its wording,
2. create `DECK_BRIEF.md`,
3. use confidence/gaps/assumptions as a source-sufficiency gate,
4. generate one standalone `index.html`,
5. run the structural validator,
6. report what was and was not manually/browser verified.

See [docs/AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md) for the exact workflow and boundaries.

## Manual/local path: stage one source file

You can also use the deterministic staging tool directly:

```sh
node tools/prepare-deck.mjs README.md --out getslide-output/my-deck
```

First run:

```txt
getslide-output/my-deck/
  source.md
  source-to-brief-packet.md
```

Create `DECK_BRIEF.md` from the packet, then rerun the same command. It will add:

```txt
  DECK_BRIEF.md
  brief-to-deck-packet.md
```

Use that packet with your AI tool to create `index.html`, then validate it.

`prepare-deck.mjs` uses Node built-ins only. It does not call a model, fetch a URL, upload a file, or require benchmark metadata.

## The DECK_BRIEF.md evidence boundary

`DECK_BRIEF.md` is the structured intermediate between "pile of materials" and "finished deck":

```txt
your materials
  → key_points             source-supported facts/claims
  → missing_information    useful facts the source does not provide
  → auto_filled_assumptions visible, low-risk framing defaults
  → confidence             source sufficiency gate
  → standalone HTML deck
```

The brief exists so missing evidence never turns into confident-looking invented content. The schema is defined in [docs/DECK_BRIEF.schema.md](docs/DECK_BRIEF.schema.md), with a fictional complete example in [examples/hackathon-demo/DECK_BRIEF.md](examples/hackathon-demo/DECK_BRIEF.md).

### Confidence behavior in the Agent Skill

- **High** — an explicit end-to-end deck request may proceed when no unresolved factual gap or risky assumption is needed.
- **Medium** — surface gaps/assumptions; continue only when the user's existing request clearly permits low-risk auto-fill without inventing facts.
- **Low** — stop before polished deck generation and ask for more source material.

The v0.2 benchmark harness intentionally keeps a stricter review boundary; the benchmark and interactive skill serve different purposes.

## Validate a deck

A zero-dependency Node.js script checks a deck's structure before you present or share it:

```sh
node tools/validate-deck.mjs examples/hackathon-demo/index.html
```

It checks slide IDs, patterns, placeholders, private/internal traces, print/keyboard contract signals, and other static requirements. It exits non-zero on failure.

The validator does **not** prove visual quality. See [docs/VALIDATION.md](docs/VALIDATION.md) for the manual browser/print checks that still matter.

## Test whether AI edits stay safe

The defining claim is not "AI generated one valid deck." It is that later edits remain small, trustworthy, and structurally safe.

[docs/EDITABILITY_EVAL.md](docs/EDITABILITY_EVAL.md) defines five required probes:

1. targeted single-slide copy edit,
2. split one slide into two,
3. add newly supplied evidence,
4. reorder slides,
5. adjust tone/length.

Every probe checks change containment, source grounding, HTML-contract preservation, navigation/page integrity, readability, and trace safety. Validator PASS is necessary but not sufficient.

## Quick start: open the example deck

**View it live:** https://1beenlee.github.io/getslide-md/examples/hackathon-demo/

1. Clone or download this repository.
2. Open [examples/hackathon-demo/index.html](examples/hackathon-demo/index.html) in any modern browser. It works offline — no server needed.
3. Navigate with `←` / `→` arrow keys, the sidebar table of contents, or scrolling.
4. To export a PDF, use the browser's Print dialog (each slide prints as one page).

## How to edit a deck with AI

Because the deck is one readable HTML file, ask for precise edits by slide ID:

```txt
Revise only the slide with data-slide-id="problem".
Make the headline sharper and reduce the body to three bullets.
Do not change CSS tokens or the navigation system.
Preserve the factual meaning from DECK_BRIEF.md.
```

Ready-made prompts live in [prompts/](prompts/). The structural rules are defined in [docs/HTML_DECK_CONTRACT.md](docs/HTML_DECK_CONTRACT.md).

## What is intentionally NOT included

This repository is a portable open-source workflow, not a hosted slide product. There is deliberately:

- no web app, accounts, or authentication
- no payment/subscription
- no upload pipeline, database, queue, hosted model inference, or per-user hosting
- no PDF/image/URL/repository ingestion
- no analytics or public gallery
- no WYSIWYG editor
- no PPTX export today; browser print-to-PDF is supported, and compatibility outputs are deferred until real usage proves they are needed
- no build step and no runtime dependencies

See [OPEN_SOURCE_BOUNDARY.md](OPEN_SOURCE_BOUNDARY.md) for the exact public/private boundary.

## What getslide.md is not

- Not a generic AI presentation generator or a Canva/Gamma-style design platform.
- Not a PowerPoint replacement.
- Not a ghostwriting or assignment-writing service. It structures and presents **materials you provide and work you did**; it should not be used to misrepresent authorship.

## Experimental benchmark harness

The v0.2 benchmark harness remains as a repeatable Markdown-to-brief-to-Developer-Demo-deck-to-validation workflow over fictional fixtures. It does not call a model API. See [the harness specification](docs/GENERATION_HARNESS_SPEC.md), [evaluation rubric](docs/EVALUATION_RUBRIC.md), and [benchmark corpus](eval/README.md).

v0.3 adds the agent-native workflow and editability evaluation on top of that foundation; it does not replace the existing benchmark semantics.

## Repository self-check

When changing the agent-native workflow:

```sh
node tools/test-agent-workflow.mjs
node tools/test-generation-harness.mjs
node tools/validate-deck.mjs examples/hackathon-demo/index.html
```

Run benchmark aggregation only when completed local benchmark runs are actually available; the checked-in historical summary is not a fresh test run.

## License

[MIT](LICENSE)
