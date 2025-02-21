import React, { useState, useEffect, useMemo } from 'react';
import ChoiceButton from './ChoiceButton';
import storyData from '../data/storyData.json'; // 스토리 데이터 import
import '../styles/storycontainer.css'; // CSS 파일 import

function StoryContainer({ initialNodeId, onRestart }) {
  // 현재 노드, 현재 출력할 줄 인덱스, 현재 줄에 출력된 텍스트, 현재 노드의 "전체" 텍스트 출력 완료 여부
  const [node, setNode] = useState(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTextComplete, setIsTextComplete] = useState(false);

  // 초기 노드를 설정: initialNodeId가 변경되면 storyData에서 해당 노드를 가져오고,
  // 대화 관련 상태(currentLine, currentText, isTextComplete)를 초기화함.
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

  // useMemo를 이용하여, node.text를 개행('\n') 기준으로 분리한 배열을 계산.
  // node가 변경될 때만 다시 계산하여 불필요한 재계산을 방지.
  const lines = useMemo(() => {
    return node ? node.text.split('\n') : [];
  }, [node]);

  // 전체 텍스트 출력 여부: 마지막 줄까지 모두 출력되었으면 true로 판단.
  const isNodeTextComplete = isTextComplete && (currentLine === lines.length - 1);

  // 타이핑 효과 구현: 현재 줄(currentLine)의 텍스트를 한 글자씩 추가.
  // 만약 현재 줄의 텍스트가 아직 다 출력되지 않았다면, 50ms 간격으로 한 글자씩 추가하고,
  // 완전히 출력되면 isTextComplete를 true로 설정.
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

  // 대화 영역 클릭 핸들러:
  // - 만약 현재 줄이 완전히 출력되지 않았다면, 클릭 시 현재 줄 전체를 즉시 표시.
  // - 만약 현재 줄이 완전히 출력되었지만, 아직 마지막 줄이 아니라면 다음 줄로 넘어감.
  // - 마지막 줄까지 출력된 경우(isNodeTextComplete), 선택지는 자동으로 렌더링되므로 클릭은 무시.
  const handleConversationClick = () => {
    if (!node) return;
    if (currentText.length < lines[currentLine].length) {
      // 타이핑 효과 진행 중이면 현재 줄 전체를 즉시 표시.
      setCurrentText(lines[currentLine]);
      setIsTextComplete(true);
    } else if (currentLine < lines.length - 1) {
      // 현재 줄이 완전히 출력되었으나 마지막 줄이 아니라면 다음 줄로 이동.
      setCurrentLine(prev => prev + 1);
      setCurrentText('');
      setIsTextComplete(false);
    }
    // 만약 마지막 줄까지 출력되었다면(isNodeTextComplete) 클릭 시 아무 작업도 하지 않음.
  };

  // 선택지 클릭 핸들러: 선택지를 클릭하면 해당 선택지의 nextId에 해당하는 노드로 전환하고,
  // 대화 관련 상태를 초기화함.
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
          {/* 대화 영역: 화면 하단에 고정된 영역. CSS에서 설정한 conversation-area 스타일이 적용됨 */}
          <div 
            className="conversation-area"
            onClick={handleConversationClick}
            style={{ cursor: 'pointer' }}
          >
            <p>{currentText}</p>
          </div>
          
          {/* 선택지 영역: 텍스트가 완전히 출력되었고, (마지막 줄까지) 노드에 선택지가 존재할 때만 렌더링 */}
          {isNodeTextComplete && node.choices && node.choices.length > 0 && (
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
          
          {/* 엔딩 영역: 노드에 선택지가 없으면 엔딩으로 간주하고 엔딩 메시지 및 재시작 버튼 표시 */}
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
