import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_SPEED_MS = 50;

/**
 * 노드 텍스트를 줄 단위로 타이핑 효과로 보여주는 훅.
 * setTimeout으로 글자 하나마다 리렌더하던 기존 구현 대신 requestAnimationFrame으로
 * 경과 시간을 누적해 표시 글자 수를 계산한다. 프레임당 1회만 갱신되어 길어진
 * 텍스트에서도 리렌더 빈도가 들쭝날쭝해지지 않는다.
 */
export function useTypewriter(node, speedMs = DEFAULT_SPEED_MS) {
  const [currentLine, setCurrentLine] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const rafRef = useRef(null);
  const startTimeRef = useRef(0);

  const lines = useMemo(() => (node ? node.text.split('\n') : []), [node]);

  useEffect(() => {
    setCurrentLine(0);
    setRevealedCount(0);
    setIsTextComplete(false);
  }, [node]);

  useEffect(() => {
    if (!node || currentLine >= lines.length || isTextComplete) return;
    const targetLength = lines[currentLine].length;
    startTimeRef.current = performance.now() - revealedCount * speedMs;

    const tick = (now) => {
      const elapsed = now - startTimeRef.current;
      const nextCount = Math.min(targetLength, Math.floor(elapsed / speedMs));
      setRevealedCount(nextCount);
      if (nextCount >= targetLength) {
        setIsTextComplete(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [node, currentLine, speedMs, isTextComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentText = node ? lines[currentLine]?.slice(0, revealedCount) ?? '' : '';
  const isLastLine = currentLine === lines.length - 1;
  const isNodeTextComplete = Boolean(node) && isTextComplete && isLastLine;

  const completeLine = () => {
    if (currentLine < lines.length) {
      setRevealedCount(lines[currentLine].length);
      setIsTextComplete(true);
    }
  };

  const advanceLine = () => {
    if (currentLine < lines.length - 1) {
      setCurrentLine(prev => prev + 1);
      setRevealedCount(0);
      setIsTextComplete(false);
      return true;
    }
    return false;
  };

  const skipToEnd = () => {
    if (lines.length === 0) return;
    setCurrentLine(lines.length - 1);
    setRevealedCount(lines[lines.length - 1].length);
    setIsTextComplete(true);
  };

  return {
    lines,
    currentLine,
    currentText,
    isTextComplete,
    isNodeTextComplete,
    completeLine,
    advanceLine,
    skipToEnd,
  };
}
