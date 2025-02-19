import React from 'react';
import ChoiceButton from './ChoiceButton';

function StoryNode({ nodeData, onChoiceSelect }) {
  if (!nodeData) return <div>스토리 데이터가 없습니다.</div>;

  const isEnd = !nodeData.choices || nodeData.choices.length === 0;

  return (
    <div className="story-node">
      <p>{nodeData.text}</p>

      {isEnd ? (
        <div className="end-container">
          <p>이야기가 종료되었습니다.</p>
          <button onClick={() => onChoiceSelect('start')}>처음으로 돌아가기</button>
        </div>
      ) : (
        <div className="choices">
          {nodeData.choices.map((choice, index) => (
            <ChoiceButton 
              key={index} 
              text={choice.text} 
              onClick={() => onChoiceSelect(choice.nextId)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default StoryNode;
