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
  const [backgroundImage, setBackgroundImage] = useState('');
  const [conversationOpacity, setConversationOpacity] = useState(0.3); // 투명도 상태
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false); // 설정 모달 가시성
  const [brightness, setBrightness] = useState(0.7); // 기본값 1 (정상 밝기)

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
      } else {
        // 선택지가 없으면 자동으로 nextId로 이동
        if (node.nextId) {
          onNext(node.nextId);
        }
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

  const onNext = (nextId) => {
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

  // --- 설정 모달 토글 ---
  const toggleSettingsModal = () => {
    setIsSettingsModalVisible(prev => !prev);
  };

  useEffect(() => {
    if (node?.background) {      
      setBackgroundImage(node.background); // 상태로 배경 이미지 설정
    }
  }, [node]); // node가 변경될 때마다 실행

  const lowHealthEffect = status.health <= 10 ? "low-health" : "";
  const lowMoodEffect = 
  status.mood <= 10 ? "low-mood-effect-strong" : 
  status.mood <= 30 ? "low-mood-effect-mild" : "";
  
  return (
    <div className={`story-container ${lowHealthEffect} ${lowMoodEffect}`} style={{
      backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      width: '100vw',
      height: '100vh',
      filter: `brightness(${brightness})`
    }}>
      {!node ? (
        <div>스토리 데이터를 불러오는 중입니다...</div>
      ) : (
        <>
          {/* 상태 버튼 (오른쪽 상단) */}
          <button className="status-button" onClick={toggleStatusPopup}>
            상태
          </button>          

          {/* 설정 모달 (팝업) */}
          {isSettingsModalVisible && (
            <div className="modal-overlay">
              <div className="modal-content">
                <button className="close-button" onClick={toggleSettingsModal}>닫기</button>
                <h2>설정</h2>
                <label htmlFor="opacitySlider">대화 영역 투명도: {conversationOpacity}</label>
                <input
                  type="range"
                  id="opacitySlider"
                  min="0"
                  max="1"
                  step="0.01"
                  value={conversationOpacity}
                  onChange={(e) => setConversationOpacity(parseFloat(e.target.value))}
                />
                <br/>
                {/* 화면 전체 밝기 조절 */}
                <label htmlFor="brightnessSlider">화면 밝기: {brightness}</label>
                <input
                  type="range"
                  id="brightnessSlider"
                  min="0.5"
                  max="1.5"
                  step="0.01"
                  value={brightness}
                  onChange={(e) => setBrightness(parseFloat(e.target.value))}
                />
              </div>
            </div>
          )}
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
                  status.mood >= 1 && status.mood <= 10 ? "공황" :
                  status.mood >= 11 && status.mood <= 30 ? "불안함" :
                  status.mood >= 31 && status.mood <= 50 ? "평범" :
                  status.mood >= 51 && status.mood <= 70 ? "편안함" :
                  status.mood >= 71 && status.mood <= 91 ? "기분좋음" :
                  status.mood >= 91 && status.mood <= 100 ? "최고" : "death"
                }</p>
              </div>
            </div>
          )}

          {/* 대화 영역 */}
          <div className="conversation-area" onClick={handleConversationClick} data-id={node.id} style={{ cursor: 'pointer', backgroundColor: `rgba(214,214,214,${conversationOpacity})` }}>
            <p>{currentText}</p>
            {/* 설정 버튼: 대화 영역의 오른쪽 상단에 배치 */}
            <button 
              className="settings-button" 
              onClick={(e) => { 
                e.stopPropagation(); // 대화영역 클릭 이벤트 전파 방지
                toggleSettingsModal();
              }}
              style={{ 
                position: 'absolute', 
                top: '10px', 
                right: '10px',
                zIndex: 10,
                color: 'black',
                backgroundColor: 'rgba(75, 255, 108, 0.85)'
              }}
            >
              설정
            </button>
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
          {isNodeTextComplete && (!node.choices || node.choices.length === 0) && !node.nextId && (
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
