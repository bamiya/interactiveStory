import React, { useState } from 'react';
import MainScreen from './components/MainScreen';
import StoryContainer from './components/StoryContainer';
import './App.css'

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
  };

  const restartGame = () => {
    setGameStarted(false);
  };

  return (
    <div className="app">
      {gameStarted ? (
        <StoryContainer initialNodeId="start" onRestart={restartGame} />
      ) : (
        <MainScreen startGame={startGame} />
      )}
    </div>
  );
}

export default App;
