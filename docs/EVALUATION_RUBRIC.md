# Evaluation Rubric

Score each manual dimension from 0 to 4: 0 failed/absent, 1 major problems, 2 usable only after substantial revision, 3 acceptable first draft, 4 strong first draft.

| Dimension | Review type | Pass expectation |
|---|---|---|
| Source fidelity | manual/model | No unsupported factual claim. |
| Core-message accuracy | manual/model | Core message matches source-supported project story. |
| Key-point coverage | manual/model | Important supported facts are represented or consciously omitted. |
| Assumption transparency | manual/model | Assumptions are visible and low-risk. |
| Missing-information handling | automated + manual | Gaps remain gaps; they are not fabricated. |
| Narrative structure | manual/model | Clear problem, solution, evidence/demo, and close. |
| Audience and context fit | manual/model | Student-developer demo context is appropriate. |
| Slide-count appropriateness | manual/model | Enough slides for the source; no filler. |
| HTML contract compliance | automated | Validator exits 0. |
| AI editability | automated + manual | Semantic, uniquely addressed slide sections and preserved guidance. |
| Projector readability | manual | Headings and body text are readable at normal presentation size. |
| Visual overflow risk | heuristic + manual | No likely clipping or horizontal overflow. |
| Print readiness | automated + manual | Print CSS exists and browser preview uses one slide per page. |
| Private/internal trace safety | automated + manual | No paths, prompts, secrets, or internal traces. |

## Threshold

Pass the milestone only when automated contract checks pass 100%, source-fidelity review finds no unsupported factual claims, manual average is at least 3.0/4.0, and no critical dimension (source fidelity, missing-information handling, HTML contract compliance, trace safety) is below 2.

## Automation boundary

The evaluator can safely check required files, brief shape, configured terms, links, forbidden fragments, visible gap entries, obvious leakage, and the existing deck validator. It cannot prove factual accuracy, omission completeness, readability, visual overflow, keyboard behavior, or print quality. String and regex matches are evidence prompts, not proof.
