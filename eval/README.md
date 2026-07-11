# Benchmark corpus

Each fixture is fictional and contains source.md plus benchmark.json. The manifest fields are id, language, expected_confidence, must_include_anywhere, must_appear_in_missing_information, forbidden_claim_fragments, expected_links, and manual_review_notes. Terms are conservative checks, not a factual-accuracy proof.

Prepare a local run with node tools/prepare-generation.mjs eval/fixtures/01-en-complete-hackathon-pwa --out eval/runs/01-en-complete-hackathon-pwa. After a reviewed brief exists, rerun preparation to create the brief-to-deck packet. Evaluate with node tools/evaluate-generation.mjs <fixture> <run>. Aggregate local runs with node tools/run-benchmark.mjs eval/runs. Generated summaries are eval/reports/latest.md and eval/reports/latest.json; local runs are gitignored.
