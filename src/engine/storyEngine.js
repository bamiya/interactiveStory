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

/**
 * statusChange(예: {health: "-10"})를 현재 status에 적용한 새 status를 반환한다.
 * 값이 숫자로 파싱되면 델타(증감)로 더하고, "이안"처럼 숫자가 아니면 그대로 대입한다
 * (이름 등 비수치 필드를 스토리 진행 중 한 번 확정해서 보여주는 용도).
 */
// health/mood는 0~100 범위의 게이지로 다룬다. 긴 스토리에서 +/-가 계속 누적되면
// 디자이너가 의도하지 않은 시점에 0 이하/100 초과로 튀어 배드엔딩이 끼어들거나
// 상태 표시가 깨질 수 있어, 이 두 스탯만 범위를 강제한다.
const CLAMPED_STATS = {
  health: { min: 0, max: 100 },
  mood: { min: 0, max: 100 },
};

export function applyStatusChange(status, statusChange) {
  if (!statusChange) return status;
  const next = { ...status };
  for (const key of Object.keys(statusChange)) {
    const raw = statusChange[key];
    const delta = parseInt(raw, 10);
    if (Number.isNaN(delta)) {
      next[key] = raw;
      continue;
    }
    const value = (next[key] || 0) + delta;
    const clamp = CLAMPED_STATS[key];
    next[key] = clamp ? Math.min(clamp.max, Math.max(clamp.min, value)) : value;
  }
  return next;
}

/**
 * endingRules를 순서대로 평가해 조건을 만족하는 첫 엔딩 id를 반환한다.
 * 만족하는 규칙이 없으면 null.
 * rule.stat/op/value: 수치 조건. rule.requiresFlags: 플래그 조건(둘 다 있으면 AND).
 */
export function evaluateEnding(status, flags, endingRules) {
  for (const rule of endingRules) {
    const statOk = rule.stat
      ? OPERATORS[rule.op]?.(status[rule.stat] ?? 0, rule.value)
      : true;
    const flagsOk = rule.requiresFlags
      ? Object.entries(rule.requiresFlags).every(([key, value]) => (flags?.[key] ?? false) === value)
      : true;
    if (statOk && flagsOk) return rule.endingId;
  }
  return null;
}

export function getNode(storyData, nodeId) {
  return storyData ? storyData[nodeId] : undefined;
}

/** setFlags(예: {metHana: true})를 현재 flags에 병합한 새 flags를 반환한다. */
export function applyFlags(flags, setFlags) {
  if (!setFlags) return flags;
  return { ...flags, ...setFlags };
}

/**
 * 선택지/노드의 requires 조건을 현재 status/flags가 만족하는지 검사한다.
 * requires.flags: { flagName: true|false } 형태로 전부 일치해야 함.
 * requires.status: { stat: { min, max } } 형태로 범위 내에 있어야 함.
 * requires가 없으면 항상 true (조건 없는 선택지/노드).
 */
export function meetsRequirements(status, flags, requires) {
  if (!requires) return true;

  if (requires.flags) {
    for (const flagName of Object.keys(requires.flags)) {
      if ((flags?.[flagName] ?? false) !== requires.flags[flagName]) return false;
    }
  }

  if (requires.status) {
    for (const stat of Object.keys(requires.status)) {
      const { min, max } = requires.status[stat];
      const value = status?.[stat] ?? 0;
      if (min != null && value < min) return false;
      if (max != null && value > max) return false;
    }
  }

  return true;
}

/**
 * partyMembers.json(예: [{ id, flag, name }])과 현재 flags를 비교해
 * 합류 조건(flag)이 true인 동행만 골라 반환한다.
 */
export function getActiveParty(flags, partyMembers) {
  return partyMembers.filter(member => flags?.[member.flag] === true);
}
