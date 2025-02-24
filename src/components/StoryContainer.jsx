import React, { useState, useEffect, useMemo } from 'react';
import ChoiceButton from './ChoiceButton';
import '../styles/storycontainer.css'; // CSS 파일 import

function StoryContainer({ initialNodeId, storyData, statusData, onRestart }) {
  // --- 상태 선언 ---
  const [node, setNode] = useState(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [isStatusPopupVisible, setIsStatusPopupVisible] = useState(false); // 상태 팝업 가시성 상태

  // --- 상태 관련 ---
  // const [status, setStatus] = useState(statusData);  // statusData를 상태로 관리

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

  // 상태를 업데이트하는 함수
  const updateStatus = (statusKey, value) => {
    setStatus(prevStatus => ({
      ...prevStatus,
      [statusKey]: value,  // 특정 상태값 업데이트
    }));
  };

  useEffect(() => {
    // 특정 상태값을 스토리 내에서 활용할 수 있는 예시
    if (node && node.statusUpdate) {
      // 예를 들어, node에 statusUpdate 속성이 있다면 해당 값을 업데이트
      node.statusUpdate.forEach(statusUpdate => {
        const { statusKey, value } = statusUpdate;
        updateStatus(statusKey, value);
      });
    }
  }, [node]);

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

  const toggleStatusPopup = () => {
    setIsStatusPopupVisible(prev => !prev); // 팝업의 표시 상태를 토글
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
                <h2>상태</h2>
                <pre>{JSON.stringify(statusData, null, 2)}</pre>
                <button className="close-button" onClick={toggleStatusPopup}>닫기</button>
              </div>
            </div>
          )}

          {/* 대화 영역 */}
          <div className="conversation-area" onClick={handleConversationClick} style={{ cursor: 'pointer' }}>
            <p>{currentText}</p>
          </div>

          {/* 선택지 버튼 */}
          {isNodeTextComplete && node.choices && node.choices.length > 0 && (
            <div className="choices">
              {node.choices.map((choice) => (
                <ChoiceButton key={choice.nextId} text={choice.text} onClick={() => handleChoiceClick(choice.nextId)} />
              ))}
            </div>
          )}

          {/* 스토리 종료 시 */}
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
