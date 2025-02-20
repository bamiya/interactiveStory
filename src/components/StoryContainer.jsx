import React, { useState, useEffect } from 'react';
import ChoiceButton from './ChoiceButton';
import storyData from '../data/storyData.json'; // 스토리 데이터 import

function StoryContainer({ initialNodeId, onRestart }) {
  const [node, setNode] = useState(null);

  // 초기 노드 설정
  useEffect(() => {
    setNode(storyData[initialNodeId]); // 처음 시작할 때 "start"에 해당하는 노드 가져오기
  }, [initialNodeId]);

  if (!node) return <div>스토리 데이터가 없습니다.</div>;

  const isEnd = !node.choices || node.choices.length === 0;

  return (
    <div className="story-container">
      <p>{node.text}</p>
      {isEnd ? (
        <div className="end-container">
          <p>이야기가 종료되었습니다.</p>
          <button onClick={onRestart}>처음으로 돌아가기</button>
        </div>
      ) : (
        <div className="choices">
          {node.choices.map((choice, index) => (
            <ChoiceButton 
              key={index} 
              text={choice.text} 
              onClick={() => setNode(storyData[choice.nextId])} // 선택 시 다음 노드로 변경
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default StoryContainer;
