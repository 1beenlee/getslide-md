# Agent-native workflow

getslide.md v0.3 can be used as a project-level Agent Skill instead of requiring a user to manually assemble prompt packets and repository resources.

The skill does **not** add a model API or hosted generation service. It teaches a compatible agent how to use the checked-in schema, prompts, template, validator, and evaluation rules as one repeatable workflow.

## Skill locations

The repository ships the same `getslide` skill in two project-level locations:

```text
.agents/skills/getslide/SKILL.md   Agent Skills open-standard / Codex-compatible copy
.claude/skills/getslide/SKILL.md   Claude Code project-skill copy
```

The files are intentionally byte-identical. `node tools/test-agent-workflow.mjs` fails if they drift.

Compatible agents may discover the skill automatically from its description. You can also invoke it explicitly using the client mechanism you normally use for project skills (for example, selecting/calling `getslide` in Codex or `/getslide` in Claude Code).

## Supported source in v0.3

The public agent workflow accepts one UTF-8 text or Markdown source at a time:

- README
- project notes
- copied report text
- pasted text first saved as a local Markdown file

PDF, image, URL, repository URL, private connector, and other ingestion paths remain outside the public v0.3 workflow. The skill must not pretend those inputs were parsed when they were not.

## Files produced in a run

A normal task-owned run directory becomes:

```text
<run>/
  source.md
  source-to-brief-packet.md
  DECK_BRIEF.md
  brief-to-deck-packet.md
  index.html
```

Only the final three appear after their corresponding workflow stages. Generated user material should stay local unless the user explicitly asks to publish it and the destination policy allows publication.

## Stage 1 — Source staging

Run:

```sh
node tools/prepare-deck.mjs <source-file> --out <run-directory>
```

This preserves the source wording as `source.md` and creates `source-to-brief-packet.md` from:

- the source-to-brief prompt
- `docs/DECK_BRIEF.schema.md`
- the source text

No benchmark manifest is required. The command uses Node built-ins only and performs no network or model call.

## Stage 2 — `DECK_BRIEF.md`

The agent creates `DECK_BRIEF.md` before any deck HTML. The brief is the evidence boundary between raw source and persuasive presentation structure.

The important separation is:

- `key_points`: source-supported claims that the deck may state
- `missing_information`: useful or required facts the source does not provide
- `auto_filled_assumptions`: visible low-risk framing defaults, never invented evidence

The agent must never turn a missing metric, user count, result, team role, feature, architecture detail, or implementation fact into an assumption merely to make the deck look complete.

## Source-sufficiency gate

The agent uses the existing confidence field as an execution gate.

### High

A direct end-to-end deck request may proceed without another approval turn when:

- the core story and audience/context are supported,
- required deck claims are all source-grounded,
- no unresolved factual gap is required for the proposed narrative,
- no new risky assumption is needed.

The brief still remains a saved, reviewable artifact.

### Medium

The agent surfaces the gaps and assumptions. It may continue only when the user's existing request clearly permits low-risk auto-fill and the continuation does not create an unsupported factual claim. Otherwise the workflow stops at the brief for review.

### Low

The workflow stops at the brief and asks for more source material. A polished deck must not make sparse or ambiguous evidence look authoritative.

The stricter v0.2 benchmark harness may continue to require an explicit human brief-approval boundary. The public benchmark and the interactive agent workflow serve different evaluation purposes.

## Stage 3 — Generation packet

After `DECK_BRIEF.md` exists, rerun the same preparation command:

```sh
node tools/prepare-deck.mjs <source-file> --out <run-directory>
```

The command now creates `brief-to-deck-packet.md`, which bundles:

- the current brief
- `prompts/brief-to-html-deck.md`
- `templates/base-onefile-deck.html`
- `docs/HTML_DECK_CONTRACT.md`
- `docs/STUDENT_DEVELOPER_PATTERNS.md`

The agent uses that packet to create `<run-directory>/index.html`.

## Stage 4 — Validation and constrained repair

Run:

```sh
node tools/validate-deck.mjs <run-directory>/index.html
```

A validator failure permits only a repair of the reported defect. It is not permission to broaden the story, redesign valid slides, replace navigation behavior, or silently fill source gaps.

After the automated validator passes, perform the manual checks in `docs/VALIDATION.md` when the environment provides an actual browser/print path. If those checks cannot be performed, report them as not freshly verified.

## Stage 5 — AI editability

Generation success is not enough. The defining claim is that the deck remains safely editable after creation.

Use `docs/EDITABILITY_EVAL.md` when testing post-generation changes. A structural validator pass is necessary but does not prove that an agent contained its edit, preserved source grounding, or maintained readable visual hierarchy.

## Repository self-check

Changes to the agent-native workflow should run:

```sh
node tools/test-agent-workflow.mjs
node tools/test-generation-harness.mjs
node tools/validate-deck.mjs examples/hackathon-demo/index.html
```

Run the existing benchmark aggregation when the completed local runs are actually available. Do not claim a fresh benchmark run merely because the checked-in summary already records prior passes.
