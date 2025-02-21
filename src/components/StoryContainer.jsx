import React, { useState, useEffect, useMemo} from 'react';
import ChoiceButton from './ChoiceButton';
import storyData from '../data/storyData.json'; // 스토리 데이터 import
import '../styles/storycontainer.css'; // CSS 파일 import

function StoryContainer({ initialNodeId, onRestart }) {
  const [node, setNode] = useState(null);
  const [currentLine, setCurrentLine] = useState(0); // 현재 출력할 대화 줄
  const [currentText, setCurrentText] = useState('');  // 현재 줄에 출력된 텍스트
  const [isTextComplete, setIsTextComplete] = useState(false);

 // 초기 노드 설정
 useEffect(() => {
  const initialNode = storyData[initialNodeId];
  if (initialNode) {
    setNode(initialNode);
    setCurrentLine(0);
    setCurrentText('');
    setIsTextComplete(false);
  } else {
    console.error("Invalid initialNodeId", initialNodeId);
  }
 }, [initialNodeId]);


  // useMemo로 안정적인 lines 배열 생성 (node.text를 개행으로 분리)
  const lines = useMemo(() => {
    return node ? node.text.split('\n') : [];
  }, [node]);


  // 타이핑 효과: 현재 줄의 텍스트를 한 글자씩 추가
  useEffect(() => {
    if (!node) return;
    if (!isTextComplete && currentText.length < lines[currentLine].length) {
      const timeoutId = setTimeout(() => {
        setCurrentText(prev => prev + lines[currentLine].charAt(prev.length));
      }, 50); // 50ms 간격으로 한 글자씩 추가
      return () => clearTimeout(timeoutId);
    } else if (node && currentText.length === lines[currentLine].length && !isTextComplete) {
      setIsTextComplete(true);
    }
  }, [currentText, currentLine, isTextComplete, node, lines]);

  // 대화 영역 클릭 핸들러:
  // - 출력 중이면 현재 줄 전체를 즉시 표시
  // - 출력 완료된 상태이면, 다음 줄로 넘어감 (있다면)
  const handleConversationClick = () => {
    if (!node) return; // node가 없으면 아무것도 하지 않음
    if (!isTextComplete) {
      setCurrentText(lines[currentLine]); // 현재 줄 전체 출력
      setIsTextComplete(true);
    } else {
      if (currentLine < lines.length - 1) {
        setCurrentLine(prev => prev + 1);
        setCurrentText('');
        setIsTextComplete(false);
      }
    }
  };

  // 선택지 클릭 시, 해당 nextId에 해당하는 노드로 전환하고 대화 상태 초기화
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
       {/* 조건부 렌더링: node가 없으면 로딩 메시지 표시 */}
       {!node ? (
        <div>스토리 데이터를 불러오는 중입니다...</div>
      ) : (
        <>
          {/* 대화 영역 */}
          <div 
            className="conversation-area"
            onClick={handleConversationClick}
            style={{ cursor: 'pointer' }}
          >
            <p>{currentText}</p>
          </div>
      
      {/* 텍스트가 모두 출력되었고, 선택지가 존재하면 선택지 버튼 렌더링 */}
      {isTextComplete && node.choices && node.choices.length > 0 && (
            <div className="choices">
              {node.choices.map((choice) => (
                <ChoiceButton 
                  key={choice.nextId}
                  text={choice.text}
                  onClick={() => handleChoiceClick(choice.nextId)}
                />
              ))}
            </div>
          )}
      
      {/* 엔딩: 선택지가 없으면 엔딩 영역 표시 */}
      {isTextComplete && (!node.choices || node.choices.length === 0) && (
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
