---
title: "MergeMate — Stop Breaking main at 3 a.m."
audience: "Hackathon judges: two engineers, one designer, one sponsor representative (mixed technical depth)"
presentation_context: "Fictional 24-hour university hackathon, 5-minute final pitch followed by 2-minute Q&A, projector in a mid-size lecture hall"
presentation_goal: "Convince judges that broken merges are a real hackathon pain, and that the working MergeMate demo solves it in a way a small team actually adopts"
time_limit_minutes: 5
slide_count_target: 10
source_materials:
  - "Project README (features, quick start, screenshots list)"
  - "Team architecture notes (component sketch, check-runner design)"
  - "Hackathon submission form draft (problem statement, team roles)"
core_message: "Hackathon teams lose demo time to broken merges — MergeMate catches them before they land on main."
key_points:
  - "Every merge to main runs three fast checks: build, lint, and a conflict-risk scan"
  - "Results are summarized in plain language, not raw CI logs, so tired teammates act on them"
  - "Zero-config setup: one command installs the git hook and the local dashboard"
  - "Working end-to-end demo: break a branch on purpose, watch MergeMate block and explain it"
required_links:
  - "https://example.com/mergemate-repo (fictional repository URL for this example)"
required_images: []
missing_information:
  - "Final hosted demo URL (decided at submission time)"
  - "Sponsor prize track to name-drop on the closing slide, if any"
auto_filled_assumptions:
  - "Assumed judges reward 'built and working' over 'ambitious and unfinished', based on the event rubric in the submission form"
  - "Assumed a 10-slide structure fits 5 minutes at roughly 30 seconds per slide"
confidence: medium
recommended_direction: developer-demo
---

## Notes

- **This entire scenario is fictional.** MergeMate, its team, and all numbers in the deck are invented for this example; metrics on the results slide are labeled as demo data in the deck itself.
- The live demo plan: intentionally push a branch that fails lint, show MergeMate blocking the merge with a plain-language summary. The demo-flow slide doubles as the fallback narrative if the live run fails.
- Q&A prep: the conflict-risk scan is a heuristic (merge-base diff overlap), not a semantic merge — the deck says so honestly on the implementation slide.
