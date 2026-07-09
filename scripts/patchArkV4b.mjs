import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storyPath = join(__dirname, '../src/data/arkStory.json');
const s = JSON.parse(readFileSync(storyPath, 'utf8'));

// ─────────────────────────────────────────────
// 1. 삭제 노드
// ─────────────────────────────────────────────
['ch5_mira_guide','ch5_top_level','ch5_radiation_data','ch5_radiation_reaction'].forEach(k => delete s[k]);

// ─────────────────────────────────────────────
// 2. 업데이트/신규 노드 적용
// ─────────────────────────────────────────────

s.ch5_mira_condition = {
  id: 'ch5_mira_condition',
  text: '미라가 팔짱을 꼈다.\n"공짜로 안내는 못 해요. 부탁이 두 가지예요."\n"말해요."\n"최상층 환기 라인 쪽에 포식자 한 마리가 들어왔어요. 며칠째 안 나오고 있어요. 처리해줘요."\n"둘째는요."\n"거기서 방사능 수치 직접 재와요. 우리 장비로는 한계가 있어서." 미라가 이쪽을 봤다. "둘 다 해줘야 경로 알려줄게요."',
  choices: [
    { text: '한다', nextId: 'ch5_predator_hunt' },
    { text: '조건을 더 묻는다', nextId: 'ch5_ask_more' }
  ],
  background: 'ch5_unofficial'
};

s.ch5_ask_more = {
  id: 'ch5_ask_more',
  text: '"포식자가 몇 마리예요."\n"확인된 건 한 마리. 더 있을 수 있어요."\n"장비는요."\n미라가 이쪽을 봤다가 하나를 봤다. "협상을 하네요."\n"거래를 하는 거예요."\n미라가 피식 웃었다. "오케이. 측정 장비는 내가 빌려줄게요."',
  setFlags: { negotiatedMira: true },
  nextId: 'ch5_predator_hunt',
  background: 'ch5_unofficial'
};

s.ch5_predator_hunt = {
  id: 'ch5_predator_hunt',
  text: '미라가 경로를 짚어줬다.\n"최상층 환기 라인 쪽이에요. 올라가면 측정 지점이 있어요. 거기까지 가면 포식자도 마주치게 될 거예요."\n"같이 가요." 하나가 말했다.\n"제가 같이—"\n"여기서 기다려요." 이쪽이 말했다.\n하나가 이쪽을 봤다. "...빠르게 해요." 마음에 안 들어도 인정한 것이다.\n미라가 측정 장비를 건넸다.',
  nextId: 'ch5_hunt_inside',
  background: 'ch5_unofficial'
};

s.ch5_hunt_inside = {
  id: 'ch5_hunt_inside',
  text: '최상층은 달랐다.\n파이프가 낡았다. 천장 곳곳에서 물이 새고 있었다.\n포식자는 통로 끝에 있었다. 열 감지. 낙하 자세.\n짧고 빠르게 끝냈다.\n측정 지점에 장비를 댔다. 수치가 나왔다. 예상보다 낮다.\n그때 소리가 났다.\n낡은 냉각 라인이었다. 경고도 없이 터졌다.\n차가운 물이 쏟아졌다.\n둘 다 흠뻑 젖었다.',
  statusChange: { health: -10 },
  setFlags: { radiationMeasured: true },
  nextId: 'ch5_hunt_return',
  background: 'ch5_top_level'
};

s.ch5_hunt_return = {
  id: 'ch5_hunt_return',
  text: '내려가는 통로 입구에서 멈췄다.\n배회자 소리가 났다. 한 마리가 아니다. 방향도 이쪽이다.\n하나가 이쪽 팔을 잡아당겼다. "못 가요."\n"알아."\n젖은 옷이 몸에 붙어 있다. 체온이 빠르게 떨어지고 있었다.\n하나의 얼굴이 창백하다. 입술 색이 달라지고 있다.\n"버텨야 해요." 그녀가 말했다. "여기서."\n이쪽도 알고 있었다. 지금 내려가면 배회자보다 체온이 문제다.',
  setFlags: { cantReturn: true },
  nextId: 'ch5_overnight_stay',
  background: 'ch5_top_level'
};

s.ch5_overnight_stay = {
  id: 'ch5_overnight_stay',
  text: '근처 빈 방이 하나 있었다.\n전력 없음. 조명 없음. 바닥에 낡은 단열재 조각 몇 개.\n하나가 문을 닫았다. 배회자 소리가 벽 너머에서 들렸다.\n"겉옷 벗어요." 하나가 말했다. 목소리가 평소보다 낮다.\n"알아."\n젖은 겉옷을 벗었다. 선택이 없었다. 젖은 채로 있으면 위험하다.\n하나가 단열재를 바닥에 깔았다. 둘이 등을 맞대고 앉았다.\n좁다. 의도한 게 아니다. 공간이 이게 전부다.\n체온이 오가기 시작했다.\n"추워요." 하나가 말했다.\n"응."\n잠깐 있다가 하나가 돌아누웠다. 이쪽 몸 쪽으로.\n가슴이 이쪽 몸에 닿았다. 말랑하고 따뜻한 감촉이 밀착됐다.\n"더 따뜻해요." 설명하듯이. 변명하듯이.\n"응."\n하나의 숨소리가 천천히 고르게 바뀌었다.\n잠든 것이다.\n이쪽은 한동안 잠들지 못했다.\n배회자 소리가 점점 멀어졌다.',
  statusChange: { mood: 20 },
  setFlags: { overnightStay: true },
  nextId: 'ch5_morning_return',
  background: 'ch5_unofficial'
};

s.ch5_morning_return = {
  id: 'ch5_morning_return',
  text: '날이 밝았다.\n배회자 소리가 없다.\n하나가 먼저 깼다. 이쪽에서 떨어지더니 겉옷을 집어 들었다. 마른 건 아니지만 아까보다는 나았다.\n"가요." 말이 없다.\n"응."\n내려가는 길에 아무것도 없었다.\n하나가 한 번도 뒤를 돌아보지 않았다. 귀 끝이 분홍빛이었다.',
  nextId: 'ch5_mira_return',
  background: 'ch5_top_level'
};

s.ch5_mira_return = {
  id: 'ch5_mira_return',
  text: '미라가 돌아왔다.\n둘을 번갈아 봤다. 아무 말 안 한다. 그게 더 말 많은 것 같다.\n"동쪽 통로 얘기 하러 왔어요." 그녀가 앉으면서 말했다. "봉인 해제는 우리가 시도해봤어요. 전자 잠금인데 기술이 없어서 못 했어요."\n이쪽을 봤다. "근데 당신, D구역 문 열었다고 했죠."\n"네."\n"그럼 나한테는 뭐 할 거예요."',
  nextId: 'ch5_age_discovery',
  background: 'ch5_unofficial'
};

s.ch5_age_discovery = {
  id: 'ch5_age_discovery',
  text: '기록부 옆에 오래된 서류 묶음이 있었다.\n미라가 치우려다 이쪽을 봤다. "ARK 초기 문서예요. 버려진 거 주웠어요."\n하나가 묶음을 집었다. 훑다가 한 장에서 멈췄다.\n"이거." 종이를 들었다. 냉동 대상자 명단이다. 이름은 지워졌지만 생년이 남아 있다.\n숫자를 보다가 이쪽을 봤다. 다시 숫자를 봤다.\n"...이거 당신 거 맞아요?"',
  choices: [
    { text: '그런 것 같다고 한다', nextId: 'ch5_age_confirm' },
    { text: '모른다고 한다', nextId: 'ch5_age_unsure' }
  ],
  background: 'ch5_unofficial'
};

// ch5_age_aftermath → ch5_mira_info → ch5_hana_past → ... → ch5_hana_moment → ch5_tunnel_plan
// hana_moment가 기존에 ch5_mira_return을 가리키고 있었는데 이제 tunnel_plan으로 변경
s.ch5_hana_moment.nextId = 'ch5_tunnel_plan';

s.ch5_tunnel_plan = {
  id: 'ch5_tunnel_plan',
  text: '계획을 잡았다.\n동쪽 통로 봉인 해제. 7호와 교신. 지상 데이터 공식 확인.\n미라가 경로를 알려줬다.\n"조심해야 할 게 있어요." 마지막으로 말했다. "그 통로 근처에 뭔가 있어요. 우리 사람이 한 명 안 돌아왔어요."\n하나가 이쪽을 봤다. 이쪽이 하나를 봤다.\n말이 필요 없다.',
  nextId: 'ch5_return_ark',
  background: 'ch5_unofficial'
};

// ch5_return_rei: 이전 패치에서 ch5_overnight_stay로 바꿨던 것 복구
s.ch5_return_rei.nextId = 'ch5_kai_confrontation';

// ─────────────────────────────────────────────
// 저장
// ─────────────────────────────────────────────
writeFileSync(storyPath, JSON.stringify(s, null, 2), 'utf8');
console.log('Done. Total nodes:', Object.keys(s).length);
