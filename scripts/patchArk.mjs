import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storyPath = join(__dirname, '../src/data/arkStory.json');
const s = JSON.parse(readFileSync(storyPath, 'utf8'));

// === 1. ch1_awakeRoom: 4th examine — 정화회 clue 1 ===
s.ch1_awakeRoom.examine.push({
  label: '바닥에 떨어진 기록지를 집는다',
  text: '수십 년 된 종이다. 인쇄된 날짜가 ARK 3호 건설 초기다.\n[스플라이스 시술 기록 — 대상: 1번.]\n나머지는 번진 물기로 읽을 수가 없다.\n\'1번.\'이라는 표기가 마음에 걸린다.',
  setFlags: { foundSpliceRecord: true }
});

// === 2. ch3_settlement_explore: nextId → ch3_er_meet, add wall mark examine ===
s.ch3_settlement_explore.nextId = 'ch3_er_meet';
s.ch3_settlement_explore.examine.push({
  label: '통로 벽면을 살펴본다',
  text: '긁힌 자국이 있다. 우연히 생긴 것과는 다르다.\n작고 반복적이고, 너무 규칙적이다.\n기억에 걸어둔다.'
});

// === 3. ch3_er_meet: 에르 첫 등장 ===
s.ch3_er_meet = {
  id: 'ch3_er_meet',
  text: '누군가 옆에 섰다.\n"도구 찾는 거예요?"\n평범한 얼굴이다. 인상에 남지 않는 종류의 얼굴. 나이는 오십 전후.\n손에 공구 가방을 들고 있다.\n"에르라고 해요. 여기 수리 담당이에요. 뭔가 고장 났으면 말해요."\n웃는 얼굴이다. 자연스럽게. 너무 자연스럽다.',
  nextId: 'ch3_jun_talk',
  background: 'ch3_settlement'
};

// === 4. ch4_archive_inside: 3rd examine — 정화회 clue ('정화' document) ===
s.ch4_archive_inside.examine.push({
  label: '구석의 낡은 봉투를 연다',
  text: '손으로 찢겨 있다. 내용 일부가 남아 있다.\n[...회의 결과: 정화 절차 3단계 승인...]\n[...대상 선정 기준은 첨부 문서 참조. 경고 — 이 정보는...]\n나머지는 잘려나가 없다.\n\'정화\'라는 단어가 눈에 박힌다.',
  setFlags: { foundPurgeDoc: true }
});

// === 5. ch2_hana_first: Hana appearance scene 1 ===
s.ch2_hana_first.text = '여자가 이쪽을 보는 방식이 특이하다.\n얼굴이 아니라 전체를 훑는다. 손, 자세, 발 방향.\n이쪽도 봤다.\n오버사이즈 작업복이다. 가려놨는데 가려지지 않는 부분이 있다.\n한 박자 늦게 눈을 올렸다.\n"어디서 왔어요." 시험 같다.\n그녀는 이미 대답을 예상하고 있는 눈빛이다.';

// === 6. ch4_hide: Hana appearance scene 2 ===
s.ch4_hide.text = '닫힌 문을 열었다. 작은 공간이다. 둘이 들어가면 꽉 찬다.\n하나가 먼저 들어갔다. 이쪽이 들어가자 문을 당겨 닫았다.\n완전히 어둡다. 조명을 껐다.\n군집체 소리가 가까워졌다.\n거리가 없다. 어깨가 닿는다. 작업복 천 너머로 온기가 느껴진다.\n하나의 숨소리가 들린다. 억지로 고르게 쉬고 있는 것이다.\n이쪽은 다른 데 신경 쓰이지 않으려고 벽에 집중했다.';

// === 7. ch5_hana_moment: Hana appearance scene 3 ===
s.ch5_hana_moment.text = '하나가 무릎에 턱을 얹었다.\n자세가 달라지자 작업복 앞섶이 당겨졌다. 잠깐 눈이 그쪽에 갔다가 올라왔다.\n"당신은요." 그녀가 물었다. "기억 찾으면 어떻게 할 거예요."\n"몰라. 아직은."\n"임무 완수하고 어디 가요?"\n"같이 다니는 거 아니야?" 이쪽이 말했다.\n하나가 이쪽을 봤다.\n잠시 있다가 시선을 내렸다. 귀 끝이 분홍빛이다.';

// === 8. ch6_specter_truth → ch6_patriarch_path ===
s.ch6_specter_truth.nextId = 'ch6_patriarch_path';

// === 9. New ch6 nodes: 초대 목자 + 에르 보스 + 어머니 ===

s.ch6_patriarch_path = {
  id: 'ch6_patriarch_path',
  text: '통신실 한쪽, 아무것도 없어야 할 통로에 표시가 하나 있다.\n너무 낡아서 최근 것은 아니다.\n하나가 이쪽을 봤다.\n"가볼 거예요?"',
  choices: [
    { text: '가본다', nextId: 'ch6_patriarch_descent' },
    { text: '그냥 둔다', nextId: 'ch6_er_reveal' }
  ],
  background: 'ch6_comms_room'
};

s.ch6_patriarch_descent = {
  id: 'ch6_patriarch_descent',
  text: '깊이 내려갔다.\n다른 구역보다 온도가 낮다. 오래된 공기다.\n끝에 사람이 있다.\n흰머리. 등이 굽었다. 이쪽을 봤다.\n"...왔어."',
  nextId: 'ch6_patriarch_meet',
  background: 'ch6_tunnel'
};

s.ch6_patriarch_meet = {
  id: 'ch6_patriarch_meet',
  text: '"33년."\n그게 다다.\n얼굴에서 아무것도 읽히지 않는다. 정신과 의사였다고 했다. 초대 목자.\n"막을 거야?" 이쪽이 물었다.\n긴 침묵 뒤에.\n"...됐어."\n그게 끝이다. 더 말할 것이 없다는 얼굴이다.',
  nextId: 'ch6_er_reveal',
  background: 'ch6_tunnel'
};

s.ch6_er_reveal = {
  id: 'ch6_er_reveal',
  text: '통신실로 돌아왔다.\n에르가 있었다.\n이전과 같은 얼굴이다. 공구 가방. 미소. 같은 사람.\n"다 봤네요." 그가 말했다. "3번 목자 에르입니다. 이제 제대로 인사해도 되겠죠."\n가방에서 꺼낸 건 공구가 아니었다.',
  nextId: 'ch6_enforcer_summon',
  background: 'ch6_comms_room'
};

s.ch6_enforcer_summon = {
  id: 'ch6_enforcer_summon',
  text: '에르가 손목의 무언가를 눌렀다.\n"저는 직접 싸우지 않아요. 그런 걸 위해 만들어놓은 게 있으니까."\n복도 쪽에서 소리가 왔다. 발소리가 아니다. 금속음이다.\n집행자다.\n스플라이스 기술을 극단까지 밀어붙인 것. 한때 사람이었을 것이다.\n하나가 이쪽 팔을 잡았다. "칩. 써요."',
  minigame: {
    type: 'circuitTrace',
    difficulty: 'advanced',
    onSuccess: 'ch6_enforcer_down',
    failMoodPenalty: 8
  },
  background: 'ch6_comms_room'
};

s.ch6_enforcer_down = {
  id: 'ch6_enforcer_down',
  text: '집행자가 멈췄다.\n회로가 타는 냄새가 났다. 칩이 간섭한 것이다.\n쓰러지면서 벽을 부쉈다. 먼지가 가라앉았다.\n에르가 이쪽을 봤다. 표정이 없다. 처음으로 표정이 없다.',
  nextId: 'ch6_er_monologue',
  background: 'ch6_comms_room'
};

s.ch6_er_monologue = {
  id: 'ch6_er_monologue',
  text: '"맞아요." 에르가 말했다. "나도 알아요. 이게 옳지 않다는 거."\n"그러면 왜."\n"그래도 해야 한다고 생각했어요. 오래."\n그가 벽에 등을 기댔다. 공구 가방이 떨어졌다.\n"1번 대상 기록. 당신 파일이에요. 처음부터 설계됐어요."\n침묵.\n"정화회는 끝났어요. 나도 알아요. 그냥... 끝내러 왔어요."',
  nextId: 'ch6_mother_sign',
  background: 'ch6_comms_room'
};

s.ch6_mother_sign = {
  id: 'ch6_mother_sign',
  text: '그때 ARK 전체가 흔들렸다.\n비상등이 켜졌다.\n[경보 — 외부 생체 신호 대규모 감지. 지상 접근 중.]\n하나가 벽의 화면을 봤다. 화면이 끊어졌다 돌아왔다.\n군집. 거대한 군집이다. 먼저 오는 게 아닌, 이끌려 오는 것이다.\n무언가가 이끌고 있다. 지상에서.\n에르가 작게 말했다. "...어머니가 왔네."',
  nextId: 'ch6_before_choice_moment',
  background: 'ch6_comms_room'
};

writeFileSync(storyPath, JSON.stringify(s, null, 2), 'utf8');
console.log('Done. Total nodes:', Object.keys(s).length);
