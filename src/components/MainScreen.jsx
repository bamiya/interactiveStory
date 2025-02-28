import React from 'react';
import '../styles/MainScreen.css';

// MainScreen 컴포넌트는 두 개의 시작 버튼을 제공한다.
// - startDefaultStory: 기본 스토리를 시작하는 함수
// - startYgTestStory: YG 테스트 스토리를 시작하는 함수
function MainScreen({ startDefaultStory, startYgTestStory, startTestStatus }) {
  return (
    <div className="main-screen">
      <h1>Rainy Night</h1>
      <div className="button-container">
        <button onClick={startDefaultStory} style={{
    textDecoration: 'line-through', // 취소선 추가
    backgroundColor: '#ddd',        // 비활성화된 배경색
    color: '#aaa',                  // 흐릿한 텍스트 색
    cursor: 'not-allowed',          // 비활성화된 커서 스타일
    border: '1px solid #ccc'        // 연한 경계선
  }} disabled>시작하기(공사중)</button>
        <button onClick={startYgTestStory}>YG 시작하기(공사중)</button>
        <button onClick={startTestStatus}>status테스트용</button>
      </div>
    </div>
  );
}

export default MainScreen;
