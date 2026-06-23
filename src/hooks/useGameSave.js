// 진행 상황 저장/불러오기. 새로고침하면 진행이 날아가는 문제를 막기 위한 최소 구현.
// storyKey는 어떤 스토리 데이터(default/yg 등)를 불러야 하는지 App에서 구분하는 용도.

const STORAGE_KEY = 'interactiveStory.save.v1';

export function saveGame({ storyKey, nodeId, status }) {
  const payload = { storyKey, nodeId, status, savedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasSavedGame() {
  return localStorage.getItem(STORAGE_KEY) != null;
}

export function clearSavedGame() {
  localStorage.removeItem(STORAGE_KEY);
}
