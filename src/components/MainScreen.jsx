import React from 'react';

function MainScreen({ startGame }) {
  return (
    <div className="main-screen">
      <h1>게임 제목</h1>
      <button onClick={startGame}>게임 시작</button>
    </div>
  );
}

export default MainScreen;
