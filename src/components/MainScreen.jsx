import React from 'react';
import '../styles/MainScreen.css';

// MainScreen 컴포넌트는 게임 시작/이어하기/엔딩 모음 진입점을 제공한다.
function MainScreen({ startDefaultStory, startYgTestStory, startTestStatus, continueGame, hasSavedGame, openEndingsCollection }) {
  return (
    <div className="main-screen">
      <h1>Rainy Night</h1>
      <div className="button-container">
        {hasSavedGame && (
          <button onClick={continueGame}>이어하기</button>
        )}
        <button onClick={startDefaultStory} style={{
          textDecoration: 'line-through',
          backgroundColor: '#ddd',
          color: '#aaa',
          cursor: 'not-allowed',
          border: '1px solid #ccc'
        }} disabled>시작하기(공사중)</button>
        <button onClick={startYgTestStory}>YG 시작하기(공사중)</button>
        <button onClick={startTestStatus}>status테스트용</button>
        <button onClick={openEndingsCollection}>엔딩 모음</button>
      </div>
    </div>
  );
}

export default MainScreen;
