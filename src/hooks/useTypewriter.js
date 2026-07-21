import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_SPEED_MS = 50;

/**
 * 노드 텍스트를 줄 단위로 타이핑 효과로 보여주는 훅.
 * node 객체를 받아 node.text를 \n으로 분리, 줄마다 순차 표시.
 * node 레퍼런스가 바뀌면 자동 리셋.
 */
export function useTypewriter(node, speedMs = DEFAULT_SPEED_MS) {
  const [currentLine, setCurrentLine] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [isTextComplete, setIsTextComplete] = useState(false);
  const rafRef = useRef(null);

  const lines = useMemo(() => (node ? node.text.split('\n') : []), [node]);

  useEffect(() => {
    setCurrentLine(0);
    setRevealedCount(0);
    setIsTextComplete(false);
  }, [node]);

  useEffect(() => {
    if (!node || currentLine >= lines.length || isTextComplete) return;
    const targetLength = lines[currentLine].length;

    if (speedMs === 0) {
      setRevealedCount(targetLength);
      setIsTextComplete(true);
      return;
    }

    rafRef.current = setInterval(() => {
      setRevealedCount(prev => {
        const next = prev + 1;
        if (next >= targetLength) {
          clearInterval(rafRef.current);
          setIsTextComplete(true);
          return targetLength;
        }
        return next;
      });
    }, speedMs);

    return () => clearInterval(rafRef.current);
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
