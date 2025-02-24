import React from 'react';

// MainScreen 컴포넌트는 두 개의 시작 버튼을 제공한다.
// - startDefaultStory: 기본 스토리를 시작하는 함수
// - startYgTestStory: YG 테스트 스토리를 시작하는 함수
function MainScreen({ startDefaultStory, startYgTestStory }) {
  return (
    <div className="main-screen">
      <h1>untitle</h1>
      <button onClick={startDefaultStory}>시작하기</button>
      <button onClick={startYgTestStory}>YG 시작하기</button>
    </div>
  );
}

export default MainScreen;
