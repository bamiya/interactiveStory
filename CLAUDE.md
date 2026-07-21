# ARK — Interactive Story Engine

## 프로젝트 개요
React 19 + Vite 6 기반 비주얼 노벨 엔진. 한국어 포스트아포칼립스 스토리 "ARK".
주인공은 기억을 잃은 채 냉동 캡슐에서 깨어난 인물로, 이름과 과거가 밝혀지지 않은 상태. 감정보다 관찰이 먼저 작동하는 냉정하고 분석적인 성격.

## 기술 스택
- React 19, Vite 6, 순수 CSS (CSS Modules 아님)
- 상태관리: useState/useEffect (Redux 없음)
- 애니메이션: CSS keyframes + setInterval (requestAnimationFrame은 인앱브라우저에서 미작동 확인됨)

## 디렉토리 구조
```
src/
  components/
    StoryContainer.jsx   # 메인 게임 컴포넌트 (전체 게임 로직)
    CombatChoices.jsx    # 전투 타이머 선택지 컴포넌트
    ChoiceButton.jsx     # 일반 선택지 버튼
    CircuitTraceMinigame.jsx
    ExploreMap.jsx
    MainScreen.jsx
  styles/
    StoryContainer.css   # 모든 게임 UI 스타일
    CombatChoices.css    # 전투 UI + 씬 전환 + 피해 이펙트 스타일
  data/
    arkStory.json        # 메인 스토리 노드 (1100+개, split_nodes.py로 생성)
    arkStory.backup.json # 원본 백업 (370개 노드)
    characters.json      # 캐릭터 ID→이름/이미지 매핑
    endingRules.json     # 엔딩 트리거 조건
    status/statusA.json  # 초기 스탯 (health: 50, mood: 20)
    endings/             # 엔딩 JSON 파일들 (id 필드로 자동 등록)
      gameOverCombat.json / _2 / _3 / _4  # 전투 게임오버 체인
      badEnding1~3.json
    partyMembers.json
    maps/hubMap.json
  engine/storyEngine.js  # 순수 함수: applyFlags, evaluateEnding, meetsRequirements 등
  hooks/
    useTypewriter.js     # 타이핑 효과 훅 (setInterval 기반)
    useImagePreload.js
    useGameSave.js
    useAnalytics.js
  i18n/strings.js
scripts/
  split_nodes.py         # arkStory.backup.json → arkStory.json 노드 분리 스크립트
```

## 스토리 노드 구조
```json
{
  "node_id": {
    "id": "node_id",
    "background": "backgroundKey",
    "text": "표시될 텍스트",
    "speaker": "하나",          // 캐릭터 이름 또는 ID (protagonist 등)
    "characters": [{"id": "hana"}],
    "nextId": "next_node_id",
    "choices": [               // nextId 대신 사용
      { "text": "선택지 텍스트", "nextId": "...", "onTimeout": true }
    ],
    "combatTimer": 4,          // 전투 타이머 선택지 (초). 있으면 CombatChoices 렌더
    "setFlags": { "flagName": true },
    "statusChange": { "health": "-5" },
    "examine": [...],
    "mapId": "hub",
    "minigame": {...},
    "isGameOver": true         // 게임오버 엔딩 노드에만
  }
}
```

## 핵심 구현 사항

### 세그먼트 시스템
- 노드 텍스트를 `"..."` / `"..."` 따옴표 기준으로 대사/서술 세그먼트로 분리
- `parseSegments(text)` → `[{text, isDialogue}]`
- 대사 세그먼트만 캐릭터 초상화 표시, 서술은 초상화 없음

### SPEAKER_MAP
```js
// 이름과 ID 모두 지원 (주인공은 id "protagonist", name "")
const SPEAKER_MAP = Object.fromEntries([
  ...Object.entries(charactersData).map(([id, c]) => [c.name, { id, ...c }]),
  ...Object.entries(charactersData).map(([id, c]) => [id, { id, ...c }]),
]);
```

### 씬 전환 연출 (자동 감지)
`goToNode`에서 현재↔다음 노드 비교:
- 배경 변경 → 암전 페이드 (350ms in + 500ms out)
- combatTimer 진입 → 화이트 플래시 (160ms in + 600ms out)
- 같은 배경 → 텍스트 크로스페이드 (300ms)
- `transitioningRef.current = true` 동안 중복 호출 차단 (스킵과 충돌 방지)

### 전투 시스템
- 노드에 `combatTimer: N` + `choices` 있으면 `CombatChoices` 컴포넌트 렌더
- `onTimeout: true` 선택지 = 시간 초과 시 자동 선택 (실패 분기)
- HP 감소(`statusChange.health` 음수) 노드 진입 시 화면 흔들기 + 붉은 플래시
- `endingRules.json`에서 `health <= 0` → `gameOverCombat` 체인 엔딩

### 키 바인딩
- `Space` → 텍스트박스 숨기기/보이기 토글
- `Ctrl` 홀드 → 스킵 모드 (손 떼면 해제)
- 방향키 → 탐색 모드 이동

### 모바일 대응
- `@media (max-width: 900px) and (orientation: portrait)` → 화면 전체 가로회전 안내 오버레이
- `@media (max-width: 900px) and (orientation: landscape)` → 폰트/패딩/버튼 크기 조정
- `viewport-fit=cover` + `env(safe-area-inset-*)` 노치 대응

## 캐릭터 목록 (characters.json)
| id | name | img |
|---|---|---|
| protagonist | "" (미공개) | /characters/protagonist.png |
| hana | 하나 | /characters/hana.png |
| rei | 레이 | /characters/rei.png |
| kai | 카이 | /characters/kai.png |
| sena | 세나 | /characters/sena.png |
| jun | 준 | /characters/jun.png |
| er | 에르 | null |
| tad | 타드 | null |
| mira | 미라 | null |
| don | 돈 | null |

## 엔딩 규칙 (endingRules.json 순서대로 평가)
1. `health <= 0` → gameOverCombat (전투 패배 게임오버)
2. `sawCreature=true AND health <= 15` → badEnding3
3. `mood <= 0` → badEnding2

## 스타일 규칙
- `--vn-accent: #4fa8d5` (파란 계열), `--vn-amber: #c8965a` (화자명 강조)
- 텍스트박스: `position: fixed; bottom: 0; height: 32vh; z-index: 50`
- 모바일 가로: 텍스트박스 `36vh`
- 전투/일반 선택지: `bottom: calc(32vh + 8px)` / 모바일: `calc(36vh + 8px)`
- 스탠딩 이미지: `height: 115vh; object-position: top center` (텍스트박스에 하체 가려짐)

## 작업 시 주의사항
- `requestAnimationFrame` 사용 금지 — 인앱 브라우저에서 콜백이 발화하지 않음. `setInterval` 사용.
- 엔딩은 `src/data/endings/` 폴더에 JSON 파일 추가만 하면 자동 등록됨 (`id` 필드 필수).
- 스토리 노드 대량 수정 시 `scripts/split_nodes.py` 활용 (backup.json → arkStory.json).
- CSS는 `StoryContainer.css`와 `CombatChoices.css` 두 파일로 분리됨.
- 새 씬 전환 타입 추가 시 `getTransitionType()` + CSS keyframe + overlay class 세트로 추가.
