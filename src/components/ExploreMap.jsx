import React from 'react';
import { useExploreMap } from '../hooks/useExploreMap';

// 탐험 모드: 추상적인 격자 맵 위에서 방향키로 한 칸씩 이동하다가, 트리거 칸에
// 닿으면 해당 이벤트(대화/장면)로 넘어간다. 지금은 그림 없는 단순 타일로
// 동작 검증용 프로토타입만 구현했다.
function ExploreMap({ map, active, onTrigger }) {
  const position = useExploreMap(map, active, onTrigger);

  const isWallAt = (x, y) => map.walls.some(wall => wall.x === x && wall.y === y);
  const triggerAt = (x, y) => map.triggers.find(trigger => trigger.x === x && trigger.y === y);

  const rows = Array.from({ length: map.rows }, (_, y) => y);
  const cols = Array.from({ length: map.cols }, (_, x) => x);

  return (
    <div className="explore-map">
      <p className="explore-map-hint">방향키로 이동하세요</p>
      <div
        className="explore-map-grid"
        style={{ gridTemplateColumns: `repeat(${map.cols}, 36px)`, gridTemplateRows: `repeat(${map.rows}, 36px)` }}
      >
        {rows.map(y => cols.map(x => {
          const trigger = triggerAt(x, y);
          const isPlayerHere = position.x === x && position.y === y;
          const cellClass = isWallAt(x, y)
            ? 'explore-tile explore-tile-wall'
            : trigger
              ? 'explore-tile explore-tile-trigger'
              : 'explore-tile';
          return (
            <div key={`${x}-${y}`} className={cellClass}>
              {isPlayerHere ? '@' : trigger ? trigger.label[0] : ''}
            </div>
          );
        }))}
      </div>
    </div>
  );
}

export default ExploreMap;
