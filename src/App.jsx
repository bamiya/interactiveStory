import React, { useState } from 'react';
// MainScreen: 메인 시작 화면 컴포넌트 (두 개의 시작 버튼 제공)
import MainScreen from './components/MainScreen';
// StoryContainer: 스토리 진행 화면 컴포넌트
import StoryContainer from './components/StoryContainer';
// 기본 스토리 데이터와 YG 테스트 스토리 데이터를 JSON 파일에서 import
import defaultStoryData from './data/storyData.json';
import ygTestData from './data/ygTestData.json';
import './App.css';

function App() {
  // 게임이 시작되었는지 여부를 관리하는 상태 (false면 메인 화면, true면 스토리 실행)
  const [gameStarted, setGameStarted] = useState(false);
  // 선택한 스토리 데이터 (기본 스토리 또는 YG 테스트 스토리)
  const [selectedStoryData, setSelectedStoryData] = useState(null);
  // 스토리 데이터 내의 시작 노드 ID (예: "start")
  const [initialNodeId, setInitialNodeId] = useState('');

  // 기본 스토리 시작 함수
  const startDefaultStory = () => {
    setSelectedStoryData(defaultStoryData);  // 기본 스토리 데이터를 선택
    setInitialNodeId('start');               // 기본 스토리의 시작 노드 ID 설정 (JSON의 키와 일치)
    setGameStarted(true);                    // 게임 시작 상태 true로 전환
  };

  // YG 테스트 스토리 시작 함수
  const startYgTestStory = () => {
    setSelectedStoryData(ygTestData);        // YG 테스트 스토리 데이터를 선택
    setInitialNodeId('start');               // YG 테스트 스토리의 시작 노드 ID 설정 (키가 "start"라고 가정)
    setGameStarted(true);                    // 게임 시작 상태 true로 전환
  };

  // 재시작 함수: 메인 화면으로 돌아가기
  const restartGame = () => {
    setGameStarted(false);
    setSelectedStoryData(null);
    setInitialNodeId('');
  };
  
  return (
    <div className="app">
      { !gameStarted ? (
        // 게임이 시작되지 않았으면 MainScreen 컴포넌트를 렌더링
        <MainScreen 
          startDefaultStory={startDefaultStory} 
          startYgTestStory={startYgTestStory} 
        />
      ) : (
        // 게임이 시작되면 선택한 스토리 데이터를 StoryContainer에 전달하여 스토리를 실행함
        <StoryContainer 
          initialNodeId={initialNodeId} 
          storyData={selectedStoryData}
          onRestart={restartGame} 
        />
      )}
    </div>
  );
}

export default App;
