import { useCallback, useEffect, useMemo, useState } from 'react';

// 칩이 패널 회로를 읽어내는 미니게임. 시작점(◎)에서 목표점(◉)까지 인접한 칸을
// 따라 연결하되, 점멸하는 보안 노이즈(빨간 칸)가 켜져 있을 때 닿으면 시간이 깎인다.
// 노이즈는 일정 주기로 점멸하므로 타이밍을 보고 지나가야 한다.
const DIFFICULTY_PRESETS = {
  novice: { size: 5, noiseCount: 4, pulseHalfPeriod: 900, timeLimit: 16, noisePenalty: 2 },
  advanced: { size: 6, noiseCount: 7, pulseHalfPeriod: 600, timeLimit: 12, noisePenalty: 2.5 },
};

function cellKey(x, y) {
  return `${x}_${y}`;
}

function buildNoiseCells(size, count, excludeKeys) {
  const used = new Set(excludeKeys);
  const candidates = Array.from({ length: size * size }, (_, i) => ({ x: i % size, y: Math.floor(i / size) }))
    .filter(({ x, y }) => !used.has(cellKey(x, y)));
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates.slice(0, count).map(({ x, y }) => ({ x, y, phaseOffset: Math.random() * 2000 }));
}

function buildGridCells(size) {
  return Array.from({ length: size * size }, (_, i) => ({ x: i % size, y: Math.floor(i / size) }));
}

function CircuitTraceMinigame({ difficulty = 'novice', onSuccess, onFail }) {
  const preset = DIFFICULTY_PRESETS[difficulty] ?? DIFFICULTY_PRESETS.novice;
  const { size, noiseCount, pulseHalfPeriod, timeLimit, noisePenalty } = preset;

  const source = useMemo(() => ({ x: 0, y: size - 1 }), [size]);
  const target = useMemo(() => ({ x: size - 1, y: 0 }), [size]);
  const sourceKey = cellKey(source.x, source.y);
  const targetKey = cellKey(target.x, target.y);

  const [noiseCells] = useState(() => buildNoiseCells(size, noiseCount, [sourceKey, targetKey]));
  const noiseMap = useMemo(() => {
    const m = new Map();
    noiseCells.forEach(c => m.set(cellKey(c.x, c.y), c));
    return m;
  }, [noiseCells]);

  const [path, setPath] = useState([source]);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [status, setStatus] = useState('playing');
  const [now, setNow] = useState(Date.now());
  const [shakeKey, setShakeKey] = useState(null);

  // 노이즈 점멸 갱신과 타이머 감소를 같은 틱에서 처리
  useEffect(() => {
    if (status !== 'playing') return;
    const interval = setInterval(() => {
      setNow(Date.now());
      setTimeLeft(prev => {
        const next = prev - 0.1;
        if (next <= 0) {
          setStatus('fail');
          return 0;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    if (status === 'fail') onFail?.();
    if (status === 'success') onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const isNoiseActive = useCallback((key) => {
    const cell = noiseMap.get(key);
    if (!cell) return false;
    return Math.floor((now - cell.phaseOffset) / pulseHalfPeriod) % 2 === 0;
  }, [noiseMap, now, pulseHalfPeriod]);

  const visitedKeys = useMemo(() => new Set(path.map(p => cellKey(p.x, p.y))), [path]);

  const handleCellClick = (x, y) => {
    if (status !== 'playing') return;
    const key = cellKey(x, y);
    if (visitedKeys.has(key)) return;
    const last = path[path.length - 1];
    const isAdjacent = Math.abs(last.x - x) + Math.abs(last.y - y) === 1;
    if (!isAdjacent) return;
    if (isNoiseActive(key)) {
      setTimeLeft(prev => Math.max(0, prev - noisePenalty));
      setShakeKey(key);
      setTimeout(() => setShakeKey(null), 220);
      return;
    }
    const nextPath = [...path, { x, y }];
    setPath(nextPath);
    if (key === targetKey) {
      setStatus('success');
    }
  };

  const cells = useMemo(() => buildGridCells(size), [size]);

  return (
    <div className="circuit-minigame">
      <p className="circuit-minigame-hint">
        칩이 회로를 읽는다. 빨간 노이즈가 켜져 있을 땐 닿지 말 것 — 인접한 칸을 따라 시작점에서 목표점까지 연결하라.
      </p>
      <p className="circuit-minigame-timer">남은 시간: {timeLeft.toFixed(1)}s</p>
      <div className="circuit-grid" style={{ gridTemplateColumns: `repeat(${size}, 36px)` }}>
        {cells.map(({ x, y }) => {
          const key = cellKey(x, y);
          const visited = visitedKeys.has(key);
          const active = isNoiseActive(key);
          const isSource = key === sourceKey;
          const isTarget = key === targetKey;
          const classNames = [
            'circuit-cell',
            visited ? 'circuit-cell-visited' : '',
            noiseMap.has(key) ? (active ? 'circuit-cell-noise-active' : 'circuit-cell-noise-idle') : '',
            isSource ? 'circuit-cell-source' : '',
            isTarget ? 'circuit-cell-target' : '',
            shakeKey === key ? 'circuit-cell-shake' : '',
          ].filter(Boolean).join(' ');
          return (
            <button
              key={key}
              type="button"
              className={classNames}
              onClick={() => handleCellClick(x, y)}
              disabled={status !== 'playing'}
            >
              {isSource ? '◎' : isTarget ? '◉' : ''}
            </button>
          );
        })}
      </div>
      {status === 'fail' && (
        <p className="circuit-minigame-result circuit-minigame-fail">연결 실패. 보안 노이즈가 회로를 끊었다.</p>
      )}
      {status === 'success' && (
        <p className="circuit-minigame-result circuit-minigame-success">회로 연결 완료.</p>
      )}
    </div>
  );
}

export default CircuitTraceMinigame;
