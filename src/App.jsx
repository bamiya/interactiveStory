import React, { useState } from 'react';
import MainScreen from './components/MainScreen';
import StoryContainer from './components/StoryContainer';
import EndingsCollectionScreen from './components/EndingsCollectionScreen';
import defaultStoryData from './data/storyData.json';
import arkStory from './data/arkStory.json';
import statusData from './data/status/statusA.json';
import globalEndingRules from './data/endingRules.json';
import { loadGame, hasSavedGame as checkHasSavedGame } from './hooks/useGameSave';
import { useEndingsCollection } from './hooks/useEndingsCollection';
import './App.css';

// storyKey로 스토리 데이터를 찾기 위한 레지스트리. 새 스토리를 추가할 때 여기에만 등록하면 됨.
const STORY_REGISTRY = {
  default: defaultStoryData,
  ark: arkStory,
};

// 스토리별 엔딩 판정 규칙. ARK 스토리는 구 시설 배드엔딩 규칙을 사용하지 않는다.
const ENDING_RULES_BY_STORY = {
  default: globalEndingRules,
  ark: [],
};

const SCREEN = { MAIN: 'main', GAME: 'game', ENDINGS: 'endings' };

function App() {
  const [screen, setScreen] = useState(SCREEN.MAIN);
  const [storyKey, setStoryKey] = useState(null);
  const [initialNodeId, setInitialNodeId] = useState('');
  const [initialStatus, setInitialStatus] = useState(statusData);

  const endingsCollection = useEndingsCollection();

  const startStory = (key, startNodeId = 'start') => {
    setStoryKey(key);
    setInitialNodeId(startNodeId);
    setInitialStatus(statusData);
    setScreen(SCREEN.GAME);
  };

  const continueGame = () => {
    const saved = loadGame();
    if (!saved) return;
    setStoryKey(saved.storyKey);
    setInitialNodeId(saved.nodeId);
    setInitialStatus(saved.status);
    setScreen(SCREEN.GAME);
  };

  const restartGame = () => {
    setScreen(SCREEN.MAIN);
    setStoryKey(null);
    setInitialNodeId('');
  };

  return (
    <div className="app">
      {screen === SCREEN.MAIN && (
        <MainScreen
          startArkStory={() => startStory('ark', 'ch1_start')}
          continueGame={continueGame}
          hasSavedGame={checkHasSavedGame()}
          openEndingsCollection={() => setScreen(SCREEN.ENDINGS)}
        />
      )}

      {screen === SCREEN.GAME && (
        <StoryContainer
          storyKey={storyKey}
          initialNodeId={initialNodeId}
          storyData={STORY_REGISTRY[storyKey]}
          statusData={initialStatus}
          endingRules={ENDING_RULES_BY_STORY[storyKey] ?? []}
          onRestart={restartGame}
          onUnlockEnding={endingsCollection.unlockEnding}
        />
      )}

      {screen === SCREEN.ENDINGS && (
        <EndingsCollectionScreen
          unlockedEndingIds={endingsCollection.unlockedEndingIds}
          onBack={() => setScreen(SCREEN.MAIN)}
        />
      )}
    </div>
  );
}

export default App;
