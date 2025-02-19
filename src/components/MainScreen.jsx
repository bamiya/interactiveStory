import React, { useState } from 'react';
import StoryContainer from './StoryContainer'; // 스토리 컨테이너 컴포넌트

function MainScreen() {
  const [gameStarted, setGameStarted] = useState(false);

  // 게임 시작 버튼 클릭 시 호출되는 함수
  const startGame = () => {
    setGameStarted(true);
  };

  return (
    <div className="main-screen">
      {gameStarted ? (
        // 게임이 시작되면 StoryContainer를 렌더링
        <StoryContainer initialNodeId="start" />
      ) : (
        <div className="game-start">
          <h1>환영합니다!</h1>
          <button onClick={startGame}>시작</button>
        </div>
      )}
    </div>
  );
}

export default MainScreen;
