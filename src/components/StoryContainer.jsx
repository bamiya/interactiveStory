import React, { useState, useEffect, useMemo } from 'react';
import ChoiceButton from './ChoiceButton';
import '../styles/storycontainer.css'; // CSS 파일 import

function StoryContainer({ initialNodeId, storyData, statusData, onRestart }) {
  // --- 상태 선언 ---
  const [node, setNode] = useState(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTextComplete, setIsTextComplete] = useState(false);
  const [isStatusPopupVisible, setIsStatusPopupVisible] = useState(false);
  
  // statusData를 prop으로 받아 현재 상태를 관리 (기본값: { name: "???", health: 30, mood: 20 })
  const [status, setStatus] = useState(statusData);

  // 기분 수치에 따른 설명 반환 함수
  const getMoodDescription = (moodValue) => {
    if (moodValue >= 1 && moodValue <= 10) return "공황";
    else if (moodValue >= 11 && moodValue <= 30) return "불안함";
    else if (moodValue >= 31 && moodValue <= 50) return "평범";
    else if (moodValue >= 51 && moodValue <= 70) return "편안함";
    else if (moodValue >= 71 && moodValue <= 90) return "기분좋음";
    else if (moodValue >= 91 && moodValue <= 100) return "최고";
    else return "죽음";
  };

  // --- 초기 노드 설정 (useEffect) ---
  useEffect(() => {
    const initialNode = storyData[initialNodeId]; // prop으로 전달받은 storyData 사용
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
      // 타이핑 진행 중이면 전체 줄을 즉시 표시
      setCurrentText(lines[currentLine]);
      setIsTextComplete(true);
    } else {
      // 현재 줄이 완전히 출력되었으면, 다음 줄이 있으면 이동
      if (currentLine < lines.length - 1) {
        setCurrentLine(prev => prev + 1);
        setCurrentText('');
        setIsTextComplete(false);
      }
    }
  };

  // --- 선택지 클릭 핸들러 ---
  // 선택지를 클릭하면, 해당 선택지의 statusChange 값을 파싱해 현재 status를 업데이트한 후, 다음 노드로 전환
  const handleChoiceClick = (nextId, statusChange) => {
    if (statusChange) {
      setStatus(prevStatus => {
        const newStatus = { ...prevStatus };
        for (const key in statusChange) {
          if (statusChange.hasOwnProperty(key)) {
            const delta = parseInt(statusChange[key], 10); // "+10" 또는 "-5" 파싱
            newStatus[key] = (newStatus[key] || 0) + delta;
          }
        }
        return newStatus;
      });
    }
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
                <p>기분: {getMoodDescription(status.mood)}</p>
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
