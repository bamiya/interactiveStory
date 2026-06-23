import { useCallback, useRef, useState } from 'react';

// 사운드 재생을 담당할 자리. 실제 BGM/SFX 에셋이 들어오기 전까지는
// 오디오 엘리먼트 없이 구조(볼륨 상태, play/stop API)만 제공한다.
// 에셋이 준비되면 src 맵(예: { rain: '/assets/audio/rain.mp3' })만 채워주면 동작한다.

const SOUND_SOURCES = {
  // bgm_main: '/assets/audio/bgm_main.mp3',
  // sfx_click: '/assets/audio/sfx_click.mp3',
};

export function useAudio() {
  const [volume, setVolume] = useState(0.7);
  const [muted, setMuted] = useState(false);
  const audioRefs = useRef({});

  const play = useCallback((key, { loop = false } = {}) => {
    const src = SOUND_SOURCES[key];
    if (!src || muted) return; // 에셋이 없으면 조용히 무시 (구조만 동작 확인 가능)
    let audio = audioRefs.current[key];
    if (!audio) {
      audio = new Audio(src);
      audioRefs.current[key] = audio;
    }
    audio.loop = loop;
    audio.volume = volume;
    audio.play().catch(() => {});
  }, [muted, volume]);

  const stop = useCallback((key) => {
    const audio = audioRefs.current[key];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, []);

  return { volume, setVolume, muted, setMuted, play, stop };
}
