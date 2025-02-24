import React, { useState, useEffect, useMemo } from 'react';
import ChoiceButton from './ChoiceButton';
import '../styles/storycontainer.css'; // CSS 파일 import

function StoryContainer({ initialNodeId, storyData, onRestart }) {
  // --- 상태 선언 ---
  const [node, setNode] = useState(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTextComplete, setIsTextComplete] = useState(false);

  // --- 초기 노드 설정 (useEffect) ---
  useEffect(() => {
    const initialNode = storyData[initialNodeId]; // props로 전달된 storyData 사용
    if (initialNode) {
      setNode(initialNode);
      setCurrentLine(0);
      setCurrentText('');
      setIsTextComplete(false);
    } else {
      console.error("Invalid initialNodeId", initialNodeId);
    }
  }, [initialNodeId, storyData]); // storyData도 의존성 배열에 추가

  // --- lines 배열 계산 (useMemo) ---
  const lines = useMemo(() => {
    return node ? node.text.split('\n') : [];
  }, [node]);

  const isEnd = node && (!node.choices || node.choices.length === 0);
  const isNodeTextComplete = node && isTextComplete && (currentLine === lines.length - 1);

  useEffect(() => {
    if (!node) return;
    if (currentLine < lines.length) {
      if (!isTextComplete && currentText.length < lines[currentLine].length) {
        const timeoutId = setTimeout(() => {
          setCurrentText(prev => prev + lines[currentLine].charAt(prev.length));
        }, 50);
        return () => clearTimeout(timeoutId);
      } else if (currentText.length === lines[currentLine].length && !isTextComplete) {
        setIsTextComplete(true);
      }
    }
  }, [currentText, currentLine, isTextComplete, node, lines]);

  const handleConversationClick = () => {
    if (!node) return;
    if (currentText.length < lines[currentLine].length) {
      setCurrentText(lines[currentLine]);
      setIsTextComplete(true);
    } else {
      if (currentLine < lines.length - 1) {
        setCurrentLine(prev => prev + 1);
        setCurrentText('');
        setIsTextComplete(false);
      }
    }
  };

  const handleChoiceClick = (nextId) => {
    const nextNode = storyData[nextId];
    if (nextNode) {
      setNode(nextNode);
      setCurrentLine(0);
      setCurrentText('');
      setIsTextComplete(false);
    } else {
      console.error("Invalid nextId:", nextId);
    }
  };

  return (
    <div className="story-container">
      {!node ? (
        <div>스토리 데이터를 불러오는 중입니다...</div>
      ) : (
        <>
          <div className="conversation-area" onClick={handleConversationClick} style={{ cursor: 'pointer' }}>
            <p>{currentText}</p>
          </div>
          {isNodeTextComplete && node.choices && node.choices.length > 0 && (
            <div className="choices">
              {node.choices.map((choice) => (
                <ChoiceButton key={choice.nextId} text={choice.text} onClick={() => handleChoiceClick(choice.nextId)} />
              ))}
            </div>
          )}
          {isNodeTextComplete && (!node.choices || node.choices.length === 0) && (
            <div className="end-container">
              <p>이야기가 종료되었습니다.</p>
              <button onClick={onRestart}>처음으로 돌아가기</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}


export default StoryContainer;
