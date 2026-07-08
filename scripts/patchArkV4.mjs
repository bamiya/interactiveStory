import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storyPath = join(__dirname, '../src/data/arkStory.json');
const s = JSON.parse(readFileSync(storyPath, 'utf8'));

// ─────────────────────────────────────────────
// 1. 이전 패치 고아 노드 삭제
// ─────────────────────────────────────────────
const oldNodes = [
  'ch6_patriarch_path','ch6_patriarch_descent','ch6_patriarch_meet',
  'ch6_er_reveal','ch6_enforcer_summon','ch6_enforcer_down',
  'ch6_er_monologue','ch6_mother_sign',
  'ch3_er_meet'
];
oldNodes.forEach(k => delete s[k]);

// ─────────────────────────────────────────────
// 2. ch2: 하나 머리색 연한 금발로 수정 + 외형 묘사 추가
// ─────────────────────────────────────────────
s.ch2_observe.text = '벽 뒤에 붙었다.\n여자다. 짧게 자른 연한 금발. 지하 생활에도 색이 바래지 않은 자연 그대로.\n넉넉한 사이즈의 작업복인데도 실루엣이 눈에 걸린다. 가슴 쪽이 당겨진다.\n손에 파이프를 들고 있다.\n그녀 뒤로 배회자 두 마리. 냄새를 잡았다.\n여자는 막다른 곳을 향해 가고 있다. 모르는 것 같다.';

s.ch2_encounter.text = '모퉁이를 돌자 정면으로 마주쳤다.\n둘 다 멈췄다.\n짧게 자른 연한 금발. 작업복이 넉넉한 사이즈인데도 몸의 윤곽이 눈에 들어온다.\n한 박자 늦게 눈을 올렸다.\n여자의 손에 파이프가 들려 있다. 이쪽을 향하진 않았지만 내리지도 않았다.\n뒤에서 배회자 소리가 들린다. 여자가 뒤를 한 번 보고 이쪽을 봤다.\n"비켜요." 명령이다.';

// ─────────────────────────────────────────────
// 3. ch2_hana_first: 하나 외형 씬 1 (이전 패치 반영)
// ─────────────────────────────────────────────
s.ch2_hana_first.text = '얼굴이 아니라 전체를 훑는다. 손, 자세, 발 방향.\n이쪽도 봤다.\n오버사이즈 작업복이다. 가려놨는데 가려지지 않는 부분이 있다.\n한 박자 늦게 눈을 올렸다.\n"어디서 왔어요." 시험 같다.\n그녀는 이미 대답을 예상하고 있는 눈빛이다.';

// ─────────────────────────────────────────────
// 4. ch3: 에르 첫 등장 위치 수정 (ch3_enter → ch3_er_first_encounter → ch3_kai_meet)
// ─────────────────────────────────────────────
s.ch3_enter.nextId = 'ch3_er_first_encounter';

s.ch3_er_first_encounter = {
  id: 'ch3_er_first_encounter',
  text: '카이 쪽으로 가는 길목에서 누군가 먼저 말을 걸어왔다.\n50대 초반. 평범한 얼굴이다. 특징이 없다는 게 특징일 정도로.\n손에 공구를 들고 있다.\n"새 얼굴이네요." 웃음이 있다. 눈웃음이 깊다.\n"에르예요. 여기서 수리 담당이에요. 뭐든 고장 나면 저한테 오면 돼요."\n자연스럽게 비켜선다. 지나치게 자연스럽다.',
  nextId: 'ch3_kai_meet',
  setFlags: { metEr: true },
  background: 'ch3_settlement'
};

// ch3_settlement_explore: 에르 수리 묘사 추가, nextId 복구
s.ch3_settlement_explore.nextId = 'ch3_jun_talk';
s.ch3_settlement_explore.text = '정착파 구역을 훑는다.\n30명 정도. 아이도 있다. ARK 3호에서 태어난 아이들이다.\n사람들이 이쪽을 보는 방식이 제각각이다. 경계, 호기심, 무관심.\n하나를 볼 때 경계가 더 많다는 건 눈에 들어왔다.\n구역 한쪽 벽에 에르가 무언가를 수리하고 있다. 이쪽을 발견하고 손을 들어 보인다. 가볍게.';

// ─────────────────────────────────────────────
// 5. ch4_narrow_path: 신체 접촉 묘사 (v4 스크립트 반영)
// ─────────────────────────────────────────────
s.ch4_narrow_path.text = '통로가 갑자기 좁아진다.\n하나가 먼저 들어갔다.\n"파이프가 무너져 있어요. 낮게 지나가야 해요."\n몸을 숙이자 공간이 더 좁아진다.\n하나가 앞서 기어가는데 이쪽도 같은 자세로 따라가야 한다.\n통로가 예상보다 훨씬 좁다.\n어느 순간 하나의 몸이 이쪽에 닿았다. 등 쪽이 아니다.\n옆으로 비틀다가 가슴 쪽이 이쪽 팔에 닿은 것이다.\n작업복 너머로도 느껴지는 부드러운 감촉.\n하나는 신경 쓰지 않는다. 아니, 신경 쓰지 않으려는 것 같다.\n그녀가 먼저 빠져나오면서 손을 뒤로 내밀었다.';

// ─────────────────────────────────────────────
// 6. ch4: 어둠 속 실수 씬 삽입 (ch4_d_zone_deeper 이후)
// ─────────────────────────────────────────────
s.ch4_d_zone_deeper.choices = undefined;
s.ch4_d_zone_deeper.nextId = 'ch4_darkness_incident';

s.ch4_darkness_incident = {
  id: 'ch4_darkness_incident',
  text: '조명이 깜빡이다가 꺼졌다.\n완전한 어둠이다.\n하나의 위치를 확인하려고 손을 뻗었다.\n잘못 짚었다.\n딱딱한 벽이나 장비가 아니었다.\n작업복 너머로 전해지는 감촉이 달랐다.\n손바닥 전체에 닿는 부드럽고 탄력 있는 감촉.\n가볍게 눌리면서 형태가 손 모양으로 살짝 바뀌는 느낌.\n말랑하고 따뜻한 온기가 손바닥으로 전해졌다. 생각보다 묵직한 무게감이 손에 실렸다.\n하나가 굳었다.\n"...읏." 작게. 자신도 모르게 나온 소리인 것 같다.\n"...지금."\n"잘못 짚었어."\n침묵.\n"알아요." 목소리가 평소보다 한 톤 낮다. 조금 잠긴 것 같기도 하다.\n"그래서 그냥 있어요."\n이쪽도 그냥 있었다.\n조명이 다시 켜졌다.\n하나가 앞을 보고 있다. 귀 끝이 눈에 띄게 붉다.\n머리카락으로 가리려는 것 같은데 짧아서 소용이 없다.\n"...군집체 소리 나요." 그녀가 먼저 걸음을 뗐다.',
  choices: [
    { text: '숨는다', nextId: 'ch4_hide' },
    { text: '싸운다', nextId: 'ch4_fight_swarm' },
    { text: '다른 방법을 찾는다', nextId: 'ch4_distract' }
  ],
  background: 'ch4_underground'
};

// ─────────────────────────────────────────────
// 7. ch4_hide: 밀착 묘사 강화 (v4 스크립트)
// ─────────────────────────────────────────────
s.ch4_hide.text = '닫힌 문을 열었다. 작은 공간이다. 둘이 들어가면 꽉 찬다.\n하나가 먼저 들어갔다. 문을 당겨 닫았다.\n완전히 어둡다. 조명을 껐다.\n공간이 좁다. 하나의 등이 이쪽 가슴에 닿을 만큼.\n그녀가 조금 움직이자 위치가 바뀌었다.\n어둠 속에서 하나의 가슴이 이쪽에 닿아 있다.\n말랑하고 따뜻한 감촉이 작업복 너머로 전해진다.\n하나의 숨소리가 들린다. 억지로 고르게 쉬고 있는 것이다.\n좁은 공간이 싫어서인지, 다른 이유인지.\n군집체 소리가 가까워졌다.';

// ─────────────────────────────────────────────
// 8. ch5_hunt_return: 붕대 씬 강화
// ─────────────────────────────────────────────
s.ch5_hunt_return.text = '나왔다. 하나가 입구 앞에 서 있었다.\n"다쳤어요?" 어깨를 봤다.\n"긁혔어. 별거 아니야."\n하나가 말 없이 천 조각을 꺼냈다.\n이쪽 어깨를 잡고 묶기 시작했다.\n붕대를 감으려면 가까이 서야 한다. 거의 밀착에 가까운 거리다.\n하나가 손을 뻗을 때마다 그녀의 가슴이 이쪽 팔에 스쳤다.\n부드럽고 따뜻한 감촉이 반복됐다.\n하나는 일에 집중하고 있다. 의식하는 것 같지 않다.\n그게 오히려 더 신경 쓰였다.\n"아파."\n"참아요." 무뚝뚝하게. 손이 꼼꼼하다.';

// ─────────────────────────────────────────────
// 9. ch5_overnight_stay 삽입 (ch5_return_rei 이후)
// ─────────────────────────────────────────────
s.ch5_return_rei.nextId = 'ch5_overnight_stay';

s.ch5_overnight_stay = {
  id: 'ch5_overnight_stay',
  text: '미라가 공간 하나를 내줬다.\n좁다. 담요 하나. 난방도 없다.\n"여기 밤은 생각보다 추워요." 미라가 말하고 나갔다.\n\n하나가 담요를 봤다. 이쪽을 봤다. 다시 담요를 봤다.\n"...하나예요."\n"알아."\n"그 말이 아니라." 그녀가 담요를 집어 들었다.\n"담요가 하나예요."\n\n선택지가 없었다.\n하나가 먼저 누웠다. 벽 쪽으로 붙었다.\n이쪽이 옆에 누웠다. 담요를 같이 덮었다.\n좁다. 등이 닿는다. 하나의 등이 이쪽 가슴에 닿을 만큼.\n그녀의 체온이 직접 전해졌다. 따뜻하다.\n\n"추워요?" 하나가 물었다.\n"아니."\n"...나는 조금." 잠깐 있다가 그녀가 조금 더 이쪽으로 당겨 붙었다.\n이번엔 등이 아니다. 돌아누운 것이다.\n하나의 얼굴이 이쪽 가슴 쪽에 있다.\n가슴이 이쪽 몸에 닿아 있다. 말랑하고 따뜻한 감촉이 밀착됐다.\n\n"자요." 하나가 말한다. 눈을 감은 채로.\n"응."\n\n한참 후 하나의 숨소리가 고르게 바뀌었다.\n잠든 것이다.\n이쪽은 한동안 잠들지 못했다.',
  nextId: 'ch5_kai_confrontation',
  background: 'ch5_unofficial'
};

// ─────────────────────────────────────────────
// 10. ch6: 초대 목자 → 어머니 → 에르 보스전 순서로 재구성
// ─────────────────────────────────────────────

// ch6_memory_flash → first_architect_encounter
s.ch6_memory_flash.nextId = 'first_architect_encounter';

// 초대 목자 조우
s.first_architect_encounter = {
  id: 'first_architect_encounter',
  text: '숨을 고르는 통로에서 우회로를 발견했다.\n더 깊은 곳으로 내려가는 것이다. 아무것도 없어야 할 통로.\n칩이 반응했다. 당기는 것처럼.\n하나가 이쪽을 봤다. "가볼 거예요?"',
  nextId: 'first_architect_approach',
  background: 'ch6_tunnel'
};

s.first_architect_approach = {
  id: 'first_architect_approach',
  text: '더 내려갔다. 온도가 낮아졌다. 오래된 공기.\nSplice와 인간이 섞인 방식이 다르다. 정교하다. 하지만 시간으로 망가진 것.\n눈 하나.\n칩이 다시 반응했다. 인식이다.',
  nextId: 'first_architect_talk',
  background: 'ch6_tunnel'
};

s.first_architect_talk = {
  id: 'first_architect_talk',
  text: '"...됐어."\n"뭐가."\n"...강해졌어. 결국."\n그가 이쪽을 봤다. 표정이라고 할 수 없는 것이 얼굴에 있다.\n"...가. 여긴 내가 있어."',
  choices: [
    { text: '지나친다', nextId: 'first_architect_pass' },
    { text: '이름을 묻는다', nextId: 'first_architect_name' }
  ],
  background: 'ch6_tunnel'
};

s.first_architect_name = {
  id: 'first_architect_name',
  text: '"이름이 뭐야."\n긴 침묵.\n"...잊어버렸어."\n그게 다였다.',
  nextId: 'first_architect_pass',
  background: 'ch6_tunnel'
};

s.first_architect_pass = {
  id: 'first_architect_pass',
  text: '"저게 뭐예요." 하나가 돌아서서 물었다.\n"몰라."\n"칩이 반응했어요."\n"응."\n뒤에서 소리가 들렸다. 낮고 느리게.\n"...잘 가."',
  nextId: 'ch6_mother_appears',
  setFlags: { metFirstArchitect: true },
  background: 'ch6_tunnel'
};

// 어머니 출현
s.ch6_mother_appears = {
  id: 'ch6_mother_appears',
  text: '돌아가는 통로에서 하층부 봉인 해제 경보가 울렸다.\n그리고 소리가 왔다.\n군집체다. 한 방향에서.\n다른 뭔가가 이끌고 있다.\n그것이 나타났을 때 하나가 멈췄다.\n크다. 눈이 여러 개다. 군집체가 위성처럼 그 주위를 선회한다.\n"저게 어머니예요." 하나의 목소리가 낮다. "올라오면 안 되는 게 올라왔어요."',
  nextId: 'ch6_mother_escape',
  setFlags: { sawMother: true },
  background: 'ch6_tunnel'
};

s.ch6_mother_escape = {
  id: 'ch6_mother_escape',
  text: '조명 최대로 올렸다. 군집체가 분산됐다.\n달렸다.\n어머니는 따라오지 않았다. 아직 파악 중인 것 같다.\n"생각하지 마. 지금은 나가야 해."\n통로 끝이 보였다.',
  nextId: 'ch6_boss_encounter_er',
  background: 'ch6_tunnel'
};

// 에르 보스전
s.ch6_boss_encounter_er = {
  id: 'ch6_boss_encounter_er',
  text: '탈출 경로 한가운데 에르가 서 있었다.\n웃고 있다. 3챕터와 같은 얼굴이다.\n"가려고요?"\n"당신도 나가지 그래."\n"여기가 제 자리예요."\n공구 가방에서 꺼낸 건 공구가 아니었다.\n손목의 무언가를 눌렀다.\n"정화가 끝나지 않았어요."\n복도 쪽에서 금속음이 왔다. 집행자다.\n하나가 이쪽 팔을 잡았다. "칩. 써요."',
  nextId: 'ch6_er_fight',
  background: 'ch6_comms_room'
};

s.ch6_er_fight = {
  id: 'ch6_er_fight',
  text: '집행자가 움직이기 시작했다.\n에르가 뒤에서 말한다.\n"당신은 우리가 꿈꾼 것의 완성이에요. Splice. 아이러니하죠."',
  minigame: {
    type: 'circuitTrace',
    difficulty: 'advanced',
    onSuccess: 'ch6_er_fight_end',
    failMoodPenalty: 8
  },
  background: 'ch6_comms_room'
};

s.ch6_er_fight_end = {
  id: 'ch6_er_fight_end',
  text: '집행자가 쓰러졌다.\n에르가 벽에 손을 짚었다.\n팔 내부에서 금속 소리가 났다. 칩이 반응했다. 이쪽만 들을 수 있는 소리였다.\n"됐어요. 가요."\n"당신은."\n"저는 여기 있어요."',
  nextId: 'ch6_er_final',
  setFlags: { erDefeated: true },
  background: 'ch6_comms_room'
};

s.ch6_er_final = {
  id: 'ch6_er_final',
  text: '"두고 봐요."\n에르가 웃었다. 처음으로 눈웃음이 아니었다.\n"저주야, 그게."\n"기도예요. 내 방식의."\n하나가 손을 잡았다. 당기는 것이다.\n에르는 남아 있었다.',
  nextId: 'ch6_tunnel_end',
  background: 'ch6_comms_room'
};

// ch6_specter_truth: 이전 패치에서 ch6_patriarch_path로 바꾼 것을 되돌림
s.ch6_specter_truth.nextId = 'ch6_before_choice_moment';

// ch6_tunnel_end: 지하 연결통로 아님으로 텍스트 수정
s.ch6_tunnel_end.text = '통신 장비가 있다. 벽에 지도가 있다.\nARK 12개 위치. 마지막으로 교신 신호가 확인된 ARK들이 표시돼 있다.\n7호는 같은 대륙권이다. 단파 무선교신으로만 닿을 수 있는 거리.\n지하 연결 통로는 없다. 지상을 통해야 한다.\n그건 아직 아니다.';

// ─────────────────────────────────────────────
// 11. ch6_intimate_yes: 키스 씬 강화 (v4 스크립트)
// ─────────────────────────────────────────────
s.ch6_intimate_yes.text = '하나가 먼저였다. 기다렸다가 한 것이다.\n이쪽도 답했다.\n가까이 당기자 하나의 몸이 완전히 이쪽에 닿았다.\n가슴이 이쪽 가슴에 눌리는 감촉.\n생각보다 풍만하고, 생각보다 따뜻했다.\n하나가 이쪽 재킷을 쥔 손에 힘이 들어갔다.\n한참 후, 하나가 이마를 이쪽 어깨에 댔다. 숨이 조금 고르지 않다.\n"...할아버지라고 부르기 애매해졌네요."\n웃음이 나왔다. 이 타이밍에.';

// ─────────────────────────────────────────────
// 12. 엔딩 수정 (v4)
// ─────────────────────────────────────────────

// 진실 엔딩: 7호 물리적 이동 → 지상 수직 통로
s.ending_truth.text = '지상 수직 통로.\n하나가 옆에 걸었다.\n"무슨 생각 해요."\n"칩이 뭔가 알고 있는 것 같아."\n입구에 손을 댔다.\n칩이 반응했다. 길고 천천히. 평소와 달랐다.';

s.ending_truth_final.text = '지상 수직 통로 입구.\n손을 댔다. 길고 천천히.\n이름이 돌아왔다. 전부는 아니지만.\n하나가 뒤에서 기다리고 있었다. 돌아봤다.\n"뭐예요." 눈이 달랐다.\n이름을 말했다.\n하나가 오래 봤다.\n"...그 이름. 잘 어울려요."\n7호는 북쪽에 있다고 했다. 거기까지 어떻게 갈지는 올라가봐야 안다.\n위를 향해 걸었다. 들어가는 장면은 없다.';

// 잔류 엔딩 final: 이미 좋음, v4와 일치 확인

// ─────────────────────────────────────────────
// 13. ch5_hana_moment: 하나 외형 씬 3 (이전 패치 유지)
// ─────────────────────────────────────────────
// Already updated in previous patch, keeping it.

// ─────────────────────────────────────────────
// 저장
// ─────────────────────────────────────────────
writeFileSync(storyPath, JSON.stringify(s, null, 2), 'utf8');
console.log('Done. Total nodes:', Object.keys(s).length);
