# DECK_BRIEF.md Schema

`DECK_BRIEF.md` is the structured intermediate between raw project materials and a generated deck. Every generation flow — manual or automated — normalizes input into this format first.

## Purpose

A deck brief exists so that:

1. **Nothing is invented silently.** The brief separates what the source materials actually say (`key_points`) from what was assumed (`auto_filled_assumptions`) and what is still unknown (`missing_information`).
2. **The user stays in control.** The brief is reviewed and approved before a deck is generated. Editing a brief is much cheaper than editing a finished deck.
3. **Generation is predictable.** A deck generated from an approved brief should not surprise its author.

## Format

A `DECK_BRIEF.md` file is a Markdown file whose content is a single YAML frontmatter block, optionally followed by free-form Markdown notes. The YAML block is the machine-readable part; the notes are for humans.

The public workflow intentionally uses a small YAML subset: top-level scalar fields and indented dash lists. Avoid nested mappings, block scalars, anchors, aliases, or other advanced YAML features. This keeps the brief portable and allows zero-dependency validation.

Run the executable structural gate before generation:

```sh
node tools/validate-brief.mjs <DECK_BRIEF.md>
```

`tools/prepare-deck.mjs` runs the same gate automatically and refuses to create `brief-to-deck-packet.md` when the brief is invalid. This validates shape and the mechanical confidence/gap invariant; it does **not** prove that a claim is actually supported by the source.

## Fields

### Required fields

| Field | Type | Description |
|---|---|---|
| `title` | string | Working title of the presentation. |
| `audience` | string | Who will watch this deck (e.g. "hackathon judges", "capstone review panel"). |
| `presentation_context` | string | The setting: event name/type, format, stakes. |
| `presentation_goal` | string | What the presenter wants the audience to think or do afterward. |
| `core_message` | string | The one sentence the audience must remember. |
| `key_points` | list | The claims/facts the deck will present. Each point must be supported by the source materials and preserve material lifecycle/status or quantitative qualifiers. |
| `source_materials` | list | What the brief was built from (e.g. "project README", "architecture notes"). Reference names/descriptions, not private file contents. |
| `confidence` | `high` \| `medium` \| `low` | How well the source materials support a complete deck (see below). |

### Optional fields

| Field | Type | Description |
|---|---|---|
| `time_limit_minutes` | number or `unknown` | Presentation time limit. Drives slide count. |
| `slide_count_target` | number or `unknown` | Desired slide count. Rule of thumb: ~1 slide per 30–45 seconds. |
| `required_links` | list | Presentation-essential links that must appear visibly in the deck, such as the project/repository, live demo, portfolio, or contact. This is not a dump of every URL in the source. |
| `required_images` | list | Images/screenshots that are actually supplied/available to the generation workflow, with intended placement. A Markdown image reference alone does not mean the asset is available. |
| `missing_information` | list | Information or presentation-critical assets the deck needs but the supplied sources don't provide. |
| `auto_filled_assumptions` | list | Assumptions made to fill gaps. Each must be visible to the user before generation. |
| `recommended_direction` | string | Suggested theme/style: `developer-demo`, `clean-academic`, `portfolio-case-study`, or `other`. |

### Link and image availability rules

- `required_links` is for **presentation requirements**, not source inventory. Setup/install URLs, dependency docs, developer portals, issue trackers, and contribution/reference links stay out unless the presentation goal explicitly needs them.
- In the text/Markdown-only workflow, an inline Markdown or HTML image reference is only text pointing at an asset. It does not make that image available to a standalone offline deck.
- Put an image in `required_images` only when the actual asset is separately available to the generation workflow.
- If a referenced screenshot/diagram is important but unavailable, record the missing asset in `missing_information`; do not hotlink or invent a replacement.

## Confidence levels

| Level | Meaning | Expected action |
|---|---|---|
| `high` | Sources cover the goal, audience, and all key points. Few or no assumptions. | Generate directly. |
| `medium` | Sources cover the core story, but some slides depend on assumptions or have gaps. | Review `missing_information` and `auto_filled_assumptions` before generating. |
| `low` | Sources are thin or ambiguous; major content had to be assumed. | Add material or answer the missing-information items first. |

The executable validator enforces one mechanical invariant from this table: a brief cannot claim `confidence: high` while `missing_information` still contains unresolved items.

## Rules for `missing_information` and `auto_filled_assumptions`

- Anything the deck states that is **not in the source materials** must appear in `auto_filled_assumptions`.
- Anything the deck **should** state but cannot, including a presentation-critical referenced image that was not actually supplied, must appear in `missing_information`.
- Assumptions never include invented metrics, users, or results. A gap in results data is `missing_information`, not a number to make up.
- Preserve material caveats in source-supported claims. Do not turn `about 1K`, `under 50ms`, `experimental`, `sunset`, `archived`, or similar wording into stronger/exact/current claims.
- Resolving a `missing_information` item moves it into `key_points`; accepting an assumption keeps it listed so the author knows it is theirs to verify.

## Recommended direction

`recommended_direction` names the intended theme and tone:

- `developer-demo` — project showcases, hackathons, capstone demos. Practical, technical, demo-centered.
- `clean-academic` — class presentations, research summaries. Structured, source-respecting, restrained.
- `portfolio-case-study` — job applications, career storytelling. Role, decisions, impact, learning.
- `other` — anything else; describe it in the notes section.

## Short complete example

```markdown
---
title: "StudyCache — Offline-First Flashcards for Commuters"
audience: "University hackathon judges (mixed technical/non-technical)"
presentation_context: "24-hour campus hackathon, 5-minute final pitch + 2-minute Q&A"
presentation_goal: "Convince judges the problem is real and the working demo is technically credible"
time_limit_minutes: 5
slide_count_target: 8
source_materials:
  - "Project README (features, setup, screenshots list)"
  - "Team notes on architecture decisions"
core_message: "Flashcard apps fail exactly where students study most — offline, in transit."
key_points:
  - "Built a PWA that syncs decks when online and works fully offline"
  - "Conflict-free sync via last-write-wins with per-card timestamps"
  - "Working demo: create, study, and sync a deck live"
required_links:
  - "https://example.com/studycache-repo"
missing_information:
  - "Exact team member role split for the contribution slide"
auto_filled_assumptions:
  - "Assumed judges care about offline-first as a differentiator, based on the README's framing"
confidence: medium
recommended_direction: developer-demo
---

Notes: Demo happens live on a phone in airplane mode; keep the demo-flow slide as a fallback narrative if Wi-Fi or the device fails.
```

(The project above is fictional and used only to illustrate the format.)
