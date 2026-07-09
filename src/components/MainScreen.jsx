import React from 'react';
import '../styles/MainScreen.css';

// MainScreen 컴포넌트는 게임 시작/이어하기/엔딩 모음 진입점을 제공한다.
function MainScreen({ startArkStory, continueGame, hasSavedGame, openEndingsCollection }) {
  return (
    <div className="main-screen">
      <h1>ARK</h1>
      <div className="button-container">
        {hasSavedGame && (
          <button onClick={continueGame}>이어하기</button>
        )}
        <button onClick={startArkStory}>시작하기</button>
        <button onClick={openEndingsCollection}>엔딩 모음</button>
      </div>
    </div>
  );
}

export default MainScreen;
