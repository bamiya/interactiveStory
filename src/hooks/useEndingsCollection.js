import { useCallback, useEffect, useState } from 'react';
import { getAllEndingIds } from '../data/endings';

// 도감(엔딩 컬렉션): 플레이어가 어떤 엔딩들을 봤는지 localStorage에 누적 기록한다.
// 재플레이 가치를 만드는 핵심 기능이라 별도 훅으로 분리해두면 UI(도감 화면)에서 바로 재사용 가능.

const STORAGE_KEY = 'interactiveStory.unlockedEndings.v1';

function readUnlocked() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useEndingsCollection() {
  const [unlockedEndingIds, setUnlockedEndingIds] = useState(readUnlocked);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedEndingIds));
  }, [unlockedEndingIds]);

  const unlockEnding = useCallback((endingId) => {
    setUnlockedEndingIds(prev => (prev.includes(endingId) ? prev : [...prev, endingId]));
  }, []);

  return {
    unlockedEndingIds,
    totalEndingCount: getAllEndingIds().length,
    unlockEnding,
  };
}
