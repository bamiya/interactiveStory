const base = import.meta.env.BASE_URL.replace(/\/$/, '');

const BACKGROUND_MAP = {
  archiveRoom: `${base}/backgrounds/archiveRoom.png`,
  corridor: `${base}/backgrounds/corridor.png`,
  mainHall: `${base}/backgrounds/mainHall.png`,
  safeRoom: `${base}/backgrounds/safeRoom.jpg`,
  middleLevel: `${base}/backgrounds/middleLevel.jpg`,
  ventPath: `${base}/backgrounds/ventPath.jpg`,
  cryoPod: `${base}/backgrounds/cryoPod.png`,
  cryoRoom: `${base}/backgrounds/cryoRoom.png`,
};

export function resolveBackground(key) {
  if (!key) return '';
  return BACKGROUND_MAP[key] ?? '';
}
