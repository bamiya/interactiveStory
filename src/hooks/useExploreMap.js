import { useEffect, useState } from 'react';

const MOVE_BY_KEY = {
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
};

function isWall(map, x, y) {
  return map.walls.some(wall => wall.x === x && wall.y === y);
}

function findTrigger(map, x, y) {
  return map.triggers.find(trigger => trigger.x === x && trigger.y === y);
}

/**
 * 탐험 모드용 격자 이동 훅. 방향키로 플레이어를 한 칸씩 옮기고,
 * 트리거 칸에 도착하면 onTrigger(trigger)를 호출한다(대화/이벤트 전환용).
 * active=false면 키 입력을 무시한다(대화 중에는 맵 이동이 끼어들지 않도록).
 */
export function useExploreMap(map, active, onTrigger) {
  const [position, setPosition] = useState(map.playerStart);

  useEffect(() => {
    setPosition(map.playerStart);
  }, [map]);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (event) => {
      const move = MOVE_BY_KEY[event.key];
      if (!move) return;
      event.preventDefault();

      setPosition(prev => {
        const nextX = prev.x + move.dx;
        const nextY = prev.y + move.dy;
        if (nextX < 0 || nextX >= map.cols || nextY < 0 || nextY >= map.rows) return prev;
        if (isWall(map, nextX, nextY)) return prev;
        return { x: nextX, y: nextY };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, map]);

  // 위치가 트리거 칸과 겹치면 콜백을 호출하고 다음 입장을 위해 시작 위치로 되돌린다.
  useEffect(() => {
    if (!active) return;
    const trigger = findTrigger(map, position.x, position.y);
    if (trigger) {
      onTrigger(trigger);
      setPosition(map.playerStart);
    }
  }, [active, map, position, onTrigger]);

  return position;
}
