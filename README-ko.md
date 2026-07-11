[English](./README.md) | [한국어](./README-ko.md)

# getslide.md

![getslide.md 워크플로](docs/assets/readme-hero-ko.png)

**프로젝트 자료를 AI로 계속 수정할 수 있는 독립 실행형 HTML 덱으로 바꿉니다.**

getslide.md는 프레젠테이션 덱을 **단일 독립 실행형 HTML 파일**로 만드는 오픈소스 키트입니다. AI 도구가 읽고 이해하며 계속 수정할 수 있는 슬라이드 형식입니다.

README, 프로젝트 노트, 보고서 초안처럼 이미 가진 자료를 가져오면 됩니다. 이 키트는 자료를 발표 가능한 덱으로 구조화하는 방법과, 더 중요하게는 ChatGPT, Claude, Gemini 또는 이미 사용 중인 AI 도구로 계속 개선할 수 있는 덱 형식을 제공합니다.

## 왜 PPTX 대신 독립 실행형 HTML인가요?

> PPTX는 수동 편집을 위해 만들어졌습니다.
> 독립 실행형 HTML 덱은 AI 보조 편집에 더 적합합니다.

PPTX는 익숙하고 호환성이 좋지만, 반복적인 AI 편집에는 적합하지 않습니다. 구조가 불투명하고 원하는 부분만 고치기 어려우며 레이아웃 규칙도 쉽게 무너질 수 있기 때문입니다. 독립 실행형 HTML 덱은 다릅니다.

| 항목 | 독립 실행형 HTML의 장점 |
|---|---|
| AI 편집 가능성 | 일반 텍스트이므로 AI가 덱 전체를 읽고 특정 슬라이드 하나만 수정할 수 있습니다 |
| 주소 지정 | 각 슬라이드에 `data-slide-id`, `data-pattern` 메타데이터가 있어 수정 지시를 정확히 줄 수 있습니다 |
| 이식성 | 하나의 파일에 구조, 스타일, 동작이 모두 들어 있으며 오프라인에서 빌드 없이 열립니다 |
| 공유성 | 호스팅, 링크 공유, 임베드, PDF 출력이 가능합니다 |
| 비용 | 별도 슬라이드 SaaS 없이 이미 사용하는 AI 구독으로 계속 수정할 수 있습니다 |
| 버전 관리 | 일반 텍스트 파일처럼 diff, 복사, 아카이브할 수 있습니다 |

목표는 덱을 한 번 생성하는 것이 아닙니다. 웹 자산으로 계속 수정할 수 있는 덱을 만드는 것입니다.

## 누구를 위한 도구인가요?

1. **학생 개발자**(주 사용자): 해커톤 최종 피치, 캡스톤 데모, 개발자 동아리 발표, GitHub 프로젝트 소개, 사이드 프로젝트 피치.
2. **구직자**: 링크로 공유하는 포트폴리오 케이스 스터디 덱.
3. **보고서를 발표하는 학생**: 작성자와 출처에 대한 책임을 유지하면서 자신의 글을 더 명확한 슬라이드 구조로 바꾸는 경우.

GitHub, Markdown, AI 채팅 도구 사용에 익숙하다면 이 키트가 적합합니다.

## 키트 구성

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

tools/
  validate-deck.mjs             Zero-dependency deck validator (Node built-ins only)
```

## 의도적으로 포함하지 않은 것

이것은 SaaS가 아니라 스타터 키트입니다. 의도적으로 다음을 포함하지 않습니다.

- 웹 앱, 계정, 인증
- 결제 또는 구독
- 업로드 파이프라인, 데이터베이스, 큐, 호스팅 서비스
- PPTX 내보내기(PDF 출력이 지원하는 내보내기 방식입니다)
- 빌드 단계와 런타임 의존성

모든 항목은 텍스트 에디터, 브라우저, 선택한 AI 도구만으로 동작합니다.

## 빠른 시작: 예시 덱 열기

**라이브로 보기:** https://1beenlee.github.io/getslide-md/examples/hackathon-demo/

1. 이 저장소를 clone하거나 다운로드합니다.
2. 최신 브라우저에서 [examples/hackathon-demo/index.html](examples/hackathon-demo/index.html)을 엽니다. 서버 없이 오프라인에서도 동작합니다.
3. `←` / `→` 화살표 키, 사이드바 목차 또는 스크롤로 이동합니다.
4. PDF로 내보내려면 브라우저의 인쇄 대화상자를 사용합니다. 각 슬라이드는 한 페이지로 출력됩니다.

## AI로 덱 편집하기

덱은 읽기 쉬운 하나의 HTML 파일이므로, AI 도구에 붙여넣거나 첨부한 뒤 정확한 수정을 요청할 수 있습니다.

```txt
Revise only the slide with data-slide-id="problem".
Make the headline sharper and reduce the body to three bullets.
Do not change CSS tokens. Preserve the existing visual system.
```

준비된 프롬프트는 [prompts/](prompts/)에 있습니다. AI와 사람이 덱을 편집할 때 따라야 할 규칙은 [docs/HTML_DECK_CONTRACT.md](docs/HTML_DECK_CONTRACT.md)에 정의되어 있습니다.

## DECK_BRIEF.md 워크플로

`DECK_BRIEF.md`는 자료 더미와 완성된 덱 사이에 놓이는 구조화된 중간 단계입니다.

```txt
your materials (README, notes, report)
  → DECK_BRIEF.md   (audience, goal, core message, key points, gaps, assumptions)
  → review & adjust (you stay in control of the content)
  → standalone HTML deck
  → keep editing with your AI tool
```

브리프는 덱이 무엇을 말해야 하는지, 어떤 정보가 빠졌는지, 어떤 가정이 자동으로 채워졌는지를 기록해 생성 과정을 예측 가능하게 만듭니다. 따라서 아무 정보도 조용히 지어내지 않습니다. 형식은 [docs/DECK_BRIEF.schema.md](docs/DECK_BRIEF.schema.md)에 정의되어 있으며, 완전한 예시는 [examples/hackathon-demo/DECK_BRIEF.md](examples/hackathon-demo/DECK_BRIEF.md)에서 볼 수 있습니다.

## 덱 검증

의존성 없는 Node.js 스크립트가 발표 또는 공유 전에 덱 구조를 확인합니다. 슬라이드 ID의 고유성, 필수 메타데이터, 남은 placeholder, 우발적인 비공개 흔적, 인쇄와 키보드 지원을 검사합니다.

```sh
node tools/validate-deck.mjs examples/hackathon-demo/index.html
```

Node만 있으면 되며(설치나 의존성 불필요), 실패하면 0이 아닌 종료 코드로 끝납니다. 전체 체크리스트와 스크립트가 다루는 범위 및 다루지 않는 범위는 [docs/VALIDATION.md](docs/VALIDATION.md)를 참고하세요.

## getslide.md가 아닌 것

- 범용 AI 프레젠테이션 생성기나 Canva/Gamma 스타일의 디자인 플랫폼이 아닙니다.
- PPTX 생성기가 아닙니다.
- 대필 또는 과제 작성 서비스가 아닙니다. 이 키트는 **사용자가 제공한 자료와 직접 수행한 작업**을 구조화하고 표현하며, 사용자의 일을 대신하거나 작성자 표시를 왜곡하는 데 쓰여서는 안 됩니다.

## Experimental generation harness

v0.2 실험 하니스는 README 또는 Markdown에서 brief, Developer Demo HTML deck, validation, benchmark까지 이어지는 반복 가능한 흐름을 제공합니다. 모델 API를 호출하지 않으며, 원하는 AI 도구에서 저장소 프롬프트를 사용한 다음 로컬 도구를 실행합니다. [하니스 명세](docs/GENERATION_HARNESS_SPEC.md), [평가 기준](docs/EVALUATION_RUBRIC.md), [벤치마크 코퍼스](eval/README.md)를 참고하세요.

## 라이선스

[MIT](LICENSE)
