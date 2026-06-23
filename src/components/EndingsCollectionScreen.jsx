import React from 'react';
import { getAllEndingIds } from '../data/endings';
import { useTranslation } from '../i18n/strings';

// 엔딩 도감: 지금까지 발견한 엔딩과 전체 엔딩 수를 보여준다.
// 모든 엔딩이 badEnding류 외에도 "정상 종료" 노드(choices 없는 노드)의 id를 포함한다.
function EndingsCollectionScreen({ unlockedEndingIds, onBack }) {
  const { t } = useTranslation();
  const knownEndingIds = getAllEndingIds();
  const allIds = Array.from(new Set([...knownEndingIds, ...unlockedEndingIds]));

  return (
    <div className="endings-collection">
      <h2>{t('endingsCollectionButton')}</h2>
      <p>{unlockedEndingIds.length} / {allIds.length || unlockedEndingIds.length}</p>
      <ul className="endings-list">
        {allIds.map(endingId => {
          const isUnlocked = unlockedEndingIds.includes(endingId);
          return (
            <li key={endingId} className={isUnlocked ? 'ending-unlocked' : 'ending-locked'}>
              {isUnlocked ? endingId : '???'}
            </li>
          );
        })}
      </ul>
      <button onClick={onBack}>{t('closeButton')}</button>
    </div>
  );
}

export default EndingsCollectionScreen;
