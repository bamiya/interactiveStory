// 최소 i18n 구조. 지금은 한국어만 있지만, UI 텍스트를 코드에서 분리해두면
// 나중에 언어를 추가할 때 컴포넌트를 건드리지 않고 strings 객체만 늘리면 된다.

export const SUPPORTED_LOCALES = ['ko'];
export const DEFAULT_LOCALE = 'ko';

const ko = {
  loading: '스토리 데이터를 불러오는 중입니다...',
  statusButton: '상태',
  settingsButton: '설정',
  closeButton: '닫기',
  settingsTitle: '설정',
  opacityLabel: '대화 영역 투명도',
  brightnessLabel: '화면 밝기',
  typingSpeedLabel: '타이핑 속도',
  autoPlayLabel: '오토플레이',
  skipButton: '스킵',
  backlogButton: '백로그',
  statusTitle: '주인공 상태',
  statusName: '이름',
  statusHealth: '체력',
  statusMood: '기분',
  endingReached: '이야기가 종료되었습니다.',
  restartButton: '처음으로 돌아가기',
  saveButton: '저장',
  loadButton: '이어하기',
  endingsCollectionButton: '엔딩 모음',
  backlogTitle: '지난 대화',
  moodPanic: '공황',
  moodAnxious: '불안함',
  moodNormal: '평범',
  moodComfortable: '편안함',
  moodGood: '기분좋음',
  moodBest: '최고',
};

const dictionaries = { ko };

export function useTranslation(locale = DEFAULT_LOCALE) {
  const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  const t = (key) => dict[key] ?? key;
  return { t };
}
