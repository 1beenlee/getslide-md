[English](./README.md) | [한국어](./README-ko.md)

# getslide.md

![getslide.md 워크플로](docs/assets/readme-hero-ko.png)

**프로젝트 자료를 근거가 분명하고 AI로 계속 수정할 수 있는 프레젠테이션 덱으로 바꿉니다.**

getslide.md는 README, 프로젝트 노트, 보고서 텍스트 같은 기존 자료를 **단일 독립 실행형 HTML 프레젠테이션 덱**으로 바꾸는 오픈소스 **deck compiler + Agent Skill 워크플로**입니다.

핵심은 출력 형식만이 아닙니다. getslide는 원본에서 덱까지 근거의 경계를 명시적으로 유지합니다.

```txt
source materials
  → facts / gaps / assumptions
  → DECK_BRIEF.md
  → standalone HTML deck
  → validation
  → targeted AI edits
```

그래서 결과물을 더 쉽게 검토하고 신뢰할 수 있으며, 이미 사용하는 AI/Agent 도구로 이후에도 안전하게 수정할 수 있습니다.

## 왜 독립 실행형 HTML인가요?

독립 실행형 HTML은 AI 기반 반복 수정에 특히 잘 맞기 때문에 canonical artifact로 유지합니다.

| 항목 | 독립 실행형 HTML의 장점 |
|---|---|
| AI 편집 가능성 | 일반 텍스트이므로 불투명한 바이너리 구조 없이 특정 슬라이드를 정확히 읽고 수정할 수 있습니다 |
| 주소 지정 | 각 슬라이드에 `data-slide-id`, `data-pattern` 메타데이터가 있어 수정 범위를 정확히 지정할 수 있습니다 |
| 이식성 | 하나의 파일에 구조, 스타일, 동작이 들어 있으며 빌드 없이 오프라인에서 열립니다 |
| 공유성 | 호스팅, 링크 공유, 임베드, 브라우저 PDF 출력이 가능합니다 |
| 버전 관리 | 일반 텍스트처럼 diff, 복사, 아카이브할 수 있습니다 |
| 검증 가능성 | 전달 전에 구조와 안전 규칙을 정적으로 검사할 수 있습니다 |

다만 HTML 자체가 제품의 전부는 아닙니다. 좋은 getslide 덱은 **원본에 근거하고, 발표 가능한 구조를 가지며, 구조 검증을 통과하고, 생성 후에도 AI가 안전하게 수정할 수 있어야 합니다.**

## 누구를 위한 도구인가요?

첫 검증 대상은 **학생 개발자**입니다. 해커톤 피치, 캡스톤 데모, 개발 동아리 발표, GitHub 프로젝트 소개, 사이드 프로젝트 데모처럼 이미 README와 프로젝트 자료가 있는 상황을 우선 검증합니다.

같은 워크플로는 이후 포트폴리오/구직용 덱이나 기술 빌더·PM 등 기존 자료를 더 나은 발표 산출물로 바꾸려는 사용자에게 확장할 수 있습니다.

Markdown과 AI Agent/채팅 도구 사용에 익숙하다면 별도 슬라이드 SaaS 없이 사용할 수 있도록 설계했습니다.

## 구성

```txt
.agents/skills/getslide/
  SKILL.md                      Agent Skills / Codex 프로젝트 스킬

.claude/skills/getslide/
  SKILL.md                      Claude Code용 byte-identical 미러
docs/
  DECK_BRIEF.schema.md          원본/의도/근거 경계 표준
  HTML_DECK_CONTRACT.md         생성 덱의 구조 계약
  STUDENT_DEVELOPER_PATTERNS.md 학생 개발자용 슬라이드 패턴
  VALIDATION.md                 발표/공유 전 검증 체크리스트
  AGENT_WORKFLOW.md             v0.3 Agent-native 워크플로
  EDITABILITY_EVAL.md           생성 후 targeted-edit 평가
  GENERATION_HARNESS_SPEC.md    v0.2 벤치마크 하니스 계약
  EVALUATION_RUBRIC.md          첫 생성 품질 평가 기준

templates/
  base-onefile-deck.html        재사용 가능한 standalone HTML skeleton

examples/
  hackathon-demo/
    DECK_BRIEF.md               가상의 예시 brief
    index.html                  완성된 Developer Demo deck

prompts/
  source-to-deck-brief.md       source → DECK_BRIEF prompt
  brief-to-html-deck.md         DECK_BRIEF → deck prompt
  edit-existing-html-deck.md    targeted editing prompt
  review-deck-structure.md      review prompt

tools/
  prepare-deck.mjs              임의의 text/Markdown source staging
  validate-deck.mjs             zero-dependency deck validator
  test-agent-workflow.mjs       v0.3 workflow regression checks
  *generation*.mjs              v0.2 benchmark helpers

eval/
  fixtures/                     가상의 benchmark source
  reports/                      체크인된 benchmark summary
```

## 가장 빠른 사용법: getslide Agent Skill

저장소에는 호환 가능한 Agent가 사용할 수 있는 프로젝트 레벨 `getslide` skill이 포함되어 있습니다.

- Agent Skills / Codex 호환 경로: `.agents/skills/getslide/SKILL.md`
- Claude Code 프로젝트 스킬 경로: `.claude/skills/getslide/SKILL.md`

두 파일은 의도적으로 완전히 동일하며 regression test가 drift를 막습니다.

호환 Agent에서 저장소를 연 뒤 다음처럼 요청할 수 있습니다.

```txt
Use getslide to turn README.md into a 5-minute developer demo deck.
Keep every factual claim grounded in the source and validate the result.
```

Agent 워크플로는 다음 순서로 진행합니다.

1. 원본 문구를 바꾸지 않고 source를 staging합니다.
2. `DECK_BRIEF.md`를 생성합니다.
3. confidence / gaps / assumptions를 source-sufficiency gate로 사용합니다.
4. 하나의 standalone `index.html`을 생성합니다.
5. structural validator를 실행합니다.
6. 실제로 검증한 항목과 검증하지 못한 항목을 구분해 보고합니다.

정확한 워크플로와 경계는 [docs/AGENT_WORKFLOW.md](docs/AGENT_WORKFLOW.md)를 참고하세요.

## 수동/로컬 경로: source 하나 staging하기

결정적인 로컬 staging 도구만 직접 사용할 수도 있습니다.

```sh
node tools/prepare-deck.mjs README.md --out getslide-output/my-deck
```

첫 실행 결과:

```txt
getslide-output/my-deck/
  source.md
  source-to-brief-packet.md
```

이 packet으로 `DECK_BRIEF.md`를 만든 뒤 같은 명령을 다시 실행하면 다음이 추가됩니다.

```txt
  DECK_BRIEF.md
  brief-to-deck-packet.md
```

이 packet으로 AI 도구에서 `index.html`을 생성한 다음 validator를 실행합니다.

`prepare-deck.mjs`는 Node built-ins만 사용합니다. 모델을 호출하거나 URL을 가져오거나 파일을 업로드하지 않으며 benchmark metadata도 필요하지 않습니다.

## DECK_BRIEF.md: 근거 경계

`DECK_BRIEF.md`는 자료 더미와 완성된 덱 사이의 구조화된 중간 산출물입니다.

```txt
your materials
  → key_points              원본이 뒷받침하는 사실/주장
  → missing_information     원본에는 없는 유용하거나 필요한 사실
  → auto_filled_assumptions 표시된 저위험 framing default
  → confidence              source sufficiency gate
  → standalone HTML deck
```

이 brief의 목적은 부족한 근거가 그럴듯한 허구로 바뀌는 것을 막는 것입니다. 형식은 [docs/DECK_BRIEF.schema.md](docs/DECK_BRIEF.schema.md)에 정의되어 있고, 가상의 완전한 예시는 [examples/hackathon-demo/DECK_BRIEF.md](examples/hackathon-demo/DECK_BRIEF.md)에 있습니다.

### Agent Skill의 confidence 동작

- **High** — 사용자가 end-to-end 덱 생성을 요청했고 필요한 factual gap이나 위험한 새 가정이 없다면 추가 승인 턴 없이 진행할 수 있습니다.
- **Medium** — gaps/assumptions를 드러내고, 기존 요청이 저위험 auto-fill을 분명히 허용하며 사실을 지어내지 않는 경우에만 계속합니다.
- **Low** — polished deck 생성 전에 멈추고 더 많은 source material을 요청합니다.

v0.2 benchmark harness는 의도적으로 더 엄격한 review boundary를 유지합니다. benchmark와 interactive Agent Skill은 서로 다른 목적을 가집니다.

## 덱 검증

의존성 없는 Node.js 스크립트가 발표 또는 공유 전에 덱 구조를 검사합니다.

```sh
node tools/validate-deck.mjs examples/hackathon-demo/index.html
```

slide ID, pattern, placeholder, private/internal trace, print/keyboard contract signal 등 정적으로 검사 가능한 항목을 확인하고 실패 시 0이 아닌 종료 코드를 반환합니다.

validator가 시각 품질까지 증명하지는 않습니다. 실제 브라우저/print 확인이 필요한 항목은 [docs/VALIDATION.md](docs/VALIDATION.md)를 참고하세요.

## AI 수정이 실제로 안전한지 평가하기

핵심 주장은 “AI가 유효한 덱 하나를 생성했다”가 아니라 **이후의 작은 수정도 신뢰할 수 있게 유지되는가**입니다.

[docs/EDITABILITY_EVAL.md](docs/EDITABILITY_EVAL.md)는 다섯 가지 필수 probe를 정의합니다.

1. 특정 슬라이드 copy edit
2. 슬라이드 하나를 두 장으로 분리
3. 새로 제공된 근거 추가
4. 슬라이드 순서 변경
5. tone / length 조정

각 probe는 change containment, source grounding, HTML contract, navigation/page integrity, readability, trace safety를 검사합니다. validator PASS만으로 editability를 증명했다고 보지 않습니다.

## 빠른 시작: 예시 덱 열기

**라이브로 보기:** https://1beenlee.github.io/getslide-md/examples/hackathon-demo/

1. 이 저장소를 clone하거나 다운로드합니다.
2. 최신 브라우저에서 [examples/hackathon-demo/index.html](examples/hackathon-demo/index.html)을 엽니다. 서버 없이 오프라인에서도 동작합니다.
3. `←` / `→` 화살표 키, 사이드바 목차 또는 스크롤로 이동합니다.
4. PDF로 내보내려면 브라우저 인쇄 대화상자를 사용합니다. 각 슬라이드는 한 페이지로 출력됩니다.

## AI로 기존 덱 수정하기

하나의 읽기 쉬운 HTML 파일이므로 `data-slide-id`로 수정 범위를 정확하게 지정할 수 있습니다.

```txt
Revise only the slide with data-slide-id="problem".
Make the headline sharper and reduce the body to three bullets.
Do not change CSS tokens or the navigation system.
Preserve the factual meaning from DECK_BRIEF.md.
```

준비된 프롬프트는 [prompts/](prompts/)에 있고, 구조 규칙은 [docs/HTML_DECK_CONTRACT.md](docs/HTML_DECK_CONTRACT.md)에 있습니다.

## 의도적으로 포함하지 않은 것

이 저장소는 hosted slide product가 아니라 portable open-source workflow입니다. 현재 의도적으로 포함하지 않는 항목은 다음과 같습니다.

- 웹 앱, 계정, 인증
- 결제 또는 구독
- 업로드 파이프라인, 데이터베이스, 큐, hosted model inference, 사용자별 hosting
- PDF/image/URL/repository ingestion
- analytics / public gallery
- WYSIWYG editor
- 현재 PPTX export; 브라우저 print-to-PDF는 지원하며 compatibility output은 실제 사용 필요가 검증될 때까지 보류
- build step / runtime dependency

정확한 공개/비공개 경계는 [OPEN_SOURCE_BOUNDARY.md](OPEN_SOURCE_BOUNDARY.md)를 참고하세요.

## getslide.md가 아닌 것

- 범용 AI 프레젠테이션 생성기나 Canva/Gamma형 디자인 플랫폼이 아닙니다.
- PowerPoint 대체재가 아닙니다.
- 대필 또는 과제 작성 서비스가 아닙니다. **사용자가 제공한 자료와 직접 수행한 작업**을 구조화하고 표현하며 저자성을 왜곡하는 데 쓰여서는 안 됩니다.

## Experimental benchmark harness

v0.2 benchmark harness는 가상의 fixture를 사용해 Markdown → brief → Developer Demo deck → validation을 반복 평가하는 워크플로입니다. 모델 API를 호출하지 않습니다. [하니스 명세](docs/GENERATION_HARNESS_SPEC.md), [평가 기준](docs/EVALUATION_RUBRIC.md), [벤치마크 코퍼스](eval/README.md)를 참고하세요.

v0.3은 이 기반 위에 Agent-native workflow와 editability evaluation을 추가하며 기존 benchmark 의미를 대체하지 않습니다.

## 저장소 self-check

Agent-native workflow를 변경할 때 다음을 실행합니다.

```sh
node tools/test-agent-workflow.mjs
node tools/test-generation-harness.mjs
node tools/validate-deck.mjs examples/hackathon-demo/index.html
```

완료된 로컬 benchmark run이 실제로 있을 때만 aggregation을 새로 실행합니다. 체크인된 과거 summary를 fresh test로 보고하지 않습니다.

## 라이선스

[MIT](LICENSE)
