import React from 'react';

function MainScreen({ startGame }) {
  return (
    <div className="main-screen">
      <h1>untitle</h1>
      <button onClick={startGame}>시작하기</button>
    </div>
  );
}

export default MainScreen;
