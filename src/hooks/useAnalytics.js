import { useCallback } from 'react';

// 어떤 분기/엔딩이 인기 있는지 데이터 없이는 콘텐츠 우선순위를 잡을 수 없다.
// 실제 분석 서비스(GA, Amplitude 등)를 붙이기 전까지는 localStorage에 이벤트를
// 누적하고 console에도 남겨, 연동 시 logEvent 내부만 교체하면 되는 구조로 둔다.

const STORAGE_KEY = 'interactiveStory.analyticsEvents.v1';
const MAX_STORED_EVENTS = 500;

export function useAnalytics() {
  const logEvent = useCallback((name, payload = {}) => {
    const event = { name, payload, timestamp: Date.now() };

    if (import.meta.env?.DEV) {
      console.debug('[analytics]', event);
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const events = raw ? JSON.parse(raw) : [];
      events.push(event);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_STORED_EVENTS)));
    } catch {
      // 저장 실패는 게임 진행에 영향을 주면 안 되므로 무시한다.
    }
  }, []);

  return { logEvent };
}
