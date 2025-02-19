import React from 'react';
import ChoiceButton from './ChoiceButton';
import StoryNode from './StoryNode';

function StoryContainer({ node, onChoice }) {
  if (!node) return <div>스토리 데이터가 없습니다.</div>;

  return (
    <div className="story-container">
      {/* StoryNode를 활용하여 현재 스토리 노드 표시 */}
      <StoryNode nodeData={node} onChoiceSelect={onChoice} />
    </div>
  );
}

export default StoryContainer;
