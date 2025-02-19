import React from 'react';
import ChoiceButton from './ChoiceButton';

function StoryContainer({ node, onChoice }) {
  if (!node) return <div>스토리 데이터가 없습니다.</div>;

  // 선택지가 없으면 엔딩으로 간주
  const isEnd = !node.choices || node.choices.length === 0;

  return (
    <div className="story-container">
      <p>{node.text}</p>
 {isEnd ? (
        <div className="end-container">
          <p>이야기가 종료되었습니다.</p>
          <button onClick={() => onChoice('start')}>처음으로 돌아가기</button>
        </div>
      ) : (
        <div className="choices">
          {node.choices.map((choice, index) => (
            <ChoiceButton 
              key={index} 
              text={choice.text} 
              onClick={() => onChoice(choice.nextId)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default StoryContainer;
