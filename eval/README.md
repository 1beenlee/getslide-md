# Benchmark corpus

Each v0.2 fixture is fictional and contains `source.md` plus `benchmark.json`. The manifest fields are `id`, `language`, `expected_confidence`, `must_include_anywhere`, `must_appear_in_missing_information`, `forbidden_claim_fragments`, `expected_links`, and `manual_review_notes`. Terms are conservative checks, not a factual-accuracy proof.

Prepare a local benchmark run with:

```sh
node tools/prepare-generation.mjs eval/fixtures/01-en-complete-hackathon-pwa --out eval/runs/01-en-complete-hackathon-pwa
```

After a reviewed brief exists, rerun preparation to create the brief-to-deck packet. Evaluate with:

```sh
node tools/evaluate-generation.mjs <fixture> <run>
```

Aggregate completed local runs with:

```sh
node tools/run-benchmark.mjs eval/runs
```

Generated summaries are `eval/reports/latest.md` and `eval/reports/latest.json`; local runs are gitignored. The checked-in summary records historical benchmark evidence and must not be described as a fresh run unless the underlying runs were actually executed again.

## v0.3: editability is a separate axis

The fixture benchmark evaluates source-to-first-deck quality and structural contract signals. It does **not** prove the central iterative-editability claim.

After a validator-passing deck exists, use [`docs/EDITABILITY_EVAL.md`](../docs/EDITABILITY_EVAL.md) for targeted post-generation probes: single-slide copy edit, slide split, newly supplied evidence, reorder, and tone/length adjustment.

Keep these concepts separate:

- **generation benchmark** — did source become a grounded, structurally valid first deck?
- **editability evaluation** — can a later agent change the requested scope without corrupting grounding, unrelated slides, navigation, or readability?

A deck should not be called strongly AI-editable merely because the initial validator exits `0`.
