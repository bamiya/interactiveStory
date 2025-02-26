import React, { useState, useEffect, useMemo } from 'react';
import ChoiceButton from './ChoiceButton';
import badEnding1 from '../data/endings/badEnding1.json';
import badEnding2 from '../data/endings/badEnding2.json';
import '../styles/storycontainer.css'; // CSS 파일 import

function StoryContainer({ initialNodeId, storyData, statusData, onRestart }) {
  // --- 상태 선언 ---
  const [node, setNode] = useState(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [isStatusPopupVisible, setIsStatusPopupVisible] = useState(false);
  const [status, setStatus] = useState(statusData); // 기본 상태는 statusData

  // --- 초기 노드 설정 (useEffect) ---
  useEffect(() => {
    const initialNode = storyData[initialNodeId]; // prop으로 전달된 storyData 사용
    if (initialNode) {
      setNode(initialNode);
      setCurrentLine(0);
      setCurrentText('');
      setIsTextComplete(false);
    } else {
      console.error("Invalid initialNodeId", initialNodeId);
    }
  }, [initialNodeId, storyData]);

  // --- lines 배열 계산 (useMemo) ---
  const lines = useMemo(() => {
    return node ? node.text.split('\n') : [];
  }, [node]);

  const isNodeTextComplete = node && isTextComplete && (currentLine === lines.length - 1);

  // --- 타이핑 효과 (useEffect) ---
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

  // --- 대화 영역 클릭 핸들러 ---
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

  // --- 선택지 클릭 핸들러 ---
  const handleChoiceClick = (nextId, statusChange) => {
    // 현재 상태에 statusChange 적용하여 새 상태 계산
    let newStatus = { ...status };
    if (statusChange) {
      for (const key in statusChange) {
        if (statusChange.hasOwnProperty(key)) {
          const delta = parseInt(statusChange[key], 10);
          newStatus[key] = (newStatus[key] || 0) + delta;
        }
      }
    }
    setStatus(newStatus);

    // 상태 조건 체크: health가 0 이하이면 badEnding1, mood가 0 이하이면 badEnding2로 전환
    if (newStatus.health <= 0) {
      setNode(badEnding1);
      setCurrentLine(0);
      setCurrentText('');
      setIsTextComplete(true);
      return;
    } else if (newStatus.mood <= 0) {
      setNode(badEnding2);
      setCurrentLine(0);
      setCurrentText('');
      setIsTextComplete(true);
      return;
    }

    // 조건에 해당하지 않으면 다음 노드로 전환
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

  // --- 상태 팝업 토글 ---
  const toggleStatusPopup = () => {
    setIsStatusPopupVisible(prev => !prev);
  };

  return (
    <div className="story-container">
      {!node ? (
        <div>스토리 데이터를 불러오는 중입니다...</div>
      ) : (
        <>
          {/* 상태 버튼 (오른쪽 상단) */}
          <button className="status-button" onClick={toggleStatusPopup}>
            상태 보기
          </button>

          {/* 상태 팝업 */}
          {isStatusPopupVisible && (
            <div className="status-popup">
              <div className="status-content">
                <button className="close-button" onClick={toggleStatusPopup}>
                  닫기
                </button>
                <h2>주인공 상태</h2>
                <p>이름: {status.name}</p>
                <p>체력: {status.health}</p>
                <p>기분: {
                  // mood 수치에 따른 기분 텍스트
                  status.mood >= 0 && status.mood <= 10 ? "공황" :
                  status.mood >= 11 && status.mood <= 30 ? "불안함" :
                  status.mood >= 31 && status.mood <= 50 ? "평범" :
                  status.mood >= 51 && status.mood <= 70 ? "편안함" : "Unknown"
                }</p>
              </div>
            </div>
          )}

          {/* 대화 영역 */}
          <div className="conversation-area" onClick={handleConversationClick} style={{ cursor: 'pointer' }}>
            <p>{currentText}</p>
          </div>

          {/* 선택지 영역 */}
          {isNodeTextComplete && node.choices && node.choices.length > 0 && (
            <div className="choices">
              {node.choices.map(choice => (
                <ChoiceButton
                  key={choice.nextId}
                  text={choice.text}
                  onClick={() => handleChoiceClick(choice.nextId, choice.statusChange)}
                />
              ))}
            </div>
          )}

          {/* 엔딩 영역 */}
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
