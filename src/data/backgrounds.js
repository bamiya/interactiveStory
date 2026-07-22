const BACKGROUND_MAP = {
  safeRoom: '/backgrounds/safeRoom.jpg',
  middleLevel: '/backgrounds/middleLevel.jpg',
};

export function resolveBackground(key) {
  if (!key) return '';
  return BACKGROUND_MAP[key] ?? '';
}
