// components/StoryContainer.js
import React, { useState, useEffect } from 'react';
import StoryNode from './StoryNode'; // StoryNode 컴포넌트 import
import storyData from '../data/storyData.json'; // 스토리 데이터를 import

function StoryContainer({ initialNodeId }) {
  const [nodeId, setNodeId] = useState(initialNodeId); // 초기 노드를 설정
  const [node, setNode] = useState(null);

  // 초기 노드를 로드하는 useEffect
  useEffect(() => {
    const currentNode = storyData.find((n) => n.id === nodeId); // nodeId에 해당하는 노드를 찾음
    setNode(currentNode);
  }, [nodeId]); // nodeId가 바뀔 때마다 스토리 노드를 업데이트

  const handleChoice = (nextId) => {
    setNodeId(nextId); // 사용자가 선택한 다음 스토리 노드로 이동
  };

  if (!node) return <div>로딩 중...</div>; // 노드를 찾을 수 없는 경우 로딩 중 표시

  return (
    <div className="story-container">
      <StoryNode node={node} onChoice={handleChoice} />
    </div>
  );
}

export default StoryContainer;
