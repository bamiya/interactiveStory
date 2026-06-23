import { useEffect, useMemo, useState } from 'react';

const DEFAULT_SPEED_MS = 50;

/**
 * 노드 텍스트를 줄 단위로 타이핑 효과로 보여주는 훅.
 * StoryContainer에 있던 타이핑 상태를 분리해 재사용/테스트 가능하게 만들었다.
 */
export function useTypewriter(node, speedMs = DEFAULT_SPEED_MS) {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTextComplete, setIsTextComplete] = useState(false);

  const lines = useMemo(() => (node ? node.text.split('\n') : []), [node]);

  useEffect(() => {
    setCurrentLine(0);
    setCurrentText('');
    setIsTextComplete(false);
  }, [node]);

  useEffect(() => {
    if (!node || currentLine >= lines.length) return;
    const targetLine = lines[currentLine];
    if (!isTextComplete && currentText.length < targetLine.length) {
      const timeoutId = setTimeout(() => {
        setCurrentText(prev => prev + targetLine.charAt(prev.length));
      }, speedMs);
      return () => clearTimeout(timeoutId);
    }
    if (currentText.length === targetLine.length && !isTextComplete) {
      setIsTextComplete(true);
    }
  }, [currentText, currentLine, isTextComplete, node, lines, speedMs]);

  const isLastLine = currentLine === lines.length - 1;
  const isNodeTextComplete = Boolean(node) && isTextComplete && isLastLine;

  // 현재 줄을 즉시 완성한다 (클릭 스킵 / 오토플레이에서 사용).
  const completeLine = () => {
    if (currentLine < lines.length) {
      setCurrentText(lines[currentLine]);
      setIsTextComplete(true);
    }
  };

  // 다음 줄로 넘어간다. 더 이상 줄이 없으면 false를 반환한다.
  const advanceLine = () => {
    if (currentLine < lines.length - 1) {
      setCurrentLine(prev => prev + 1);
      setCurrentText('');
      setIsTextComplete(false);
      return true;
    }
    return false;
  };

  // 현재 노드의 마지막 줄까지 즉시 표시한다 (스킵 버튼에서 사용).
  const skipToEnd = () => {
    if (lines.length === 0) return;
    setCurrentLine(lines.length - 1);
    setCurrentText(lines[lines.length - 1]);
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
