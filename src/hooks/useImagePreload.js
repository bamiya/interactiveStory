import { useEffect } from 'react';

// 현재 노드에서 갈 수 있는 다음 노드들의 배경 이미지를 미리 디코딩해둔다.
// 선택 직후 배경이 바뀌는 순간 다운로드 지연으로 화면이 끊기는 것을 막는다.
export function useImagePreload(node, storyData) {
  useEffect(() => {
    if (!node) return;
    const nextIds = [
      node.nextId,
      ...(node.choices?.map(choice => choice.nextId) ?? []),
    ].filter(Boolean);

    for (const nextId of nextIds) {
      const background = storyData?.[nextId]?.background;
      if (background) {
        const img = new Image();
        img.src = background;
      }
    }
  }, [node, storyData]);
}
