// 스토리 엔진: 상태 계산과 엔딩 판정을 컴포넌트에서 분리한 순수 함수 모음.
// 콘텐츠 작가가 엔딩 조건을 추가할 때 컴포넌트 코드를 건드리지 않도록
// 엔딩 판정 규칙은 JSON(endingRules)에서 선언적으로 관리한다.

const OPERATORS = {
  '<=': (a, b) => a <= b,
  '<': (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '>': (a, b) => a > b,
  '==': (a, b) => a === b,
};

/** statusChange(예: {health: -10})를 현재 status에 적용한 새 status를 반환한다. */
export function applyStatusChange(status, statusChange) {
  if (!statusChange) return status;
  const next = { ...status };
  for (const key of Object.keys(statusChange)) {
    const delta = parseInt(statusChange[key], 10);
    next[key] = (next[key] || 0) + delta;
  }
  return next;
}

/**
 * endingRules를 순서대로 평가해 조건을 만족하는 첫 엔딩 id를 반환한다.
 * 만족하는 규칙이 없으면 null.
 */
export function evaluateEnding(status, endingRules) {
  for (const rule of endingRules) {
    const compare = OPERATORS[rule.op];
    if (!compare) continue;
    if (compare(status[rule.stat] ?? 0, rule.value)) {
      return rule.endingId;
    }
  }
  return null;
}

export function getNode(storyData, nodeId) {
  return storyData ? storyData[nodeId] : undefined;
}
