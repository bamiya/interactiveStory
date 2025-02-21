import React, { useState, useEffect } from 'react';
import ChoiceButton from './ChoiceButton';
import storyData from '../data/storyData.json'; // 스토리 데이터 import
import '../styles/storycontainer.css'; // CSS 파일 import

function StoryContainer({ initialNodeId, onRestart }) {
  const [node, setNode] = useState(null);
  const [currentLine, setCurrentLine] = useState(0); // 현재 출력할 대화 줄
  const [isTextComplete, setIsTextComplete] = useState(false);

 // 초기 노드 설정
 useEffect(() => {
  const initialNode = storyData[initialNodeId];
  if (initialNode) {
    setNode(initialNode);
    setCurrentLine(0);
    setIsTextComplete(false);
  } else {
    console.error("Invalid initialNodeId", initialNodeId);
  }
}, [initialNodeId]);

  
  if (!node) return <div>스토리 데이터를 불러오는 중입니다...</div>;

  const isEnd = !node.choices || node.choices.length === 0;
  const lines = node.text.split('\n'); // 텍스트를 개행으로 나누기

  const handleNextLine = () => {
    if (currentLine < lines.length - 1) {
      setCurrentLine(currentLine + 1);
    } else {
      setIsTextComplete(true); // 텍스트 출력 완료
    }
  };

  return (
    <div className="story-container">
      {/* 대화 영역: 클릭하면 handleNextLine이 실행됨 */}
      <div 
        className="conversation-area" 
        onClick={!isTextComplete ? handleNextLine : undefined}
        style={{ cursor: !isTextComplete ? 'pointer' : 'default' }}
      >
        <p>{lines[currentLine]}</p>
      </div>
      
      {/* 텍스트 출력이 완료되고, 노드가 엔딩이 아니라면 선택지를 보여줌 */}
      {isTextComplete && !isEnd && (
        <div className="choices">
          {node.choices.map((choice) => (
            <ChoiceButton
              key={choice.nextId}
              text={choice.text}
              onClick={() => {
                // 선택 시 다음 노드로 전환하고, 대화 상태 초기화
                const nextNode = storyData[choice.nextId];
                if (nextNode) {
                  setNode(nextNode);
                  setCurrentLine(0);
                  setIsTextComplete(false);
                } else {
                  console.error("Invalid nextId:", choice.nextId);
                }
              }}
            />
          ))}
        </div>
      )}
      
      {/* 만약 노드가 엔딩이면 엔딩 메시지와 재시작 버튼 표시 */}
      {isEnd && (
        <div className="end-container">
          <p>이야기가 종료되었습니다.</p>
          <button onClick={onRestart}>처음으로 돌아가기</button>
        </div>
      )}
    </div>
  );
}

export default StoryContainer;
