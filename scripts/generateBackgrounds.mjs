/**
 * NovelAI 이미지 생성 스크립트
 * 사용법: node scripts/generateBackgrounds.mjs
 * 필요: .env 파일에 NOVELAI_TOKEN=<토큰>
 *
 * 생성된 이미지는 public/backgrounds/ 에 저장됩니다.
 * 이미 파일이 존재하면 스킵합니다 (--force 플래그로 덮어쓰기 가능).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// .env 수동 파싱 (dotenv 없이)
const envPath = path.join(ROOT, '.env');
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env 파일이 없습니다. NOVELAI_TOKEN=<토큰> 을 추가하세요.');
  process.exit(1);
}
const envVars = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('=').map(s => s.trim()))
);
const TOKEN = envVars['NOVELAI_TOKEN'];
if (!TOKEN) {
  console.error('ERROR: NOVELAI_TOKEN 이 .env 에 없습니다.');
  process.exit(1);
}

const FORCE = process.argv.includes('--force');
const OUT_DIR = path.join(ROOT, 'public', 'backgrounds');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── 배경별 프롬프트 정의 ──────────────────────────────────────
// 공통 스타일 태그 (모든 배경에 붙음)
const STYLE = 'dark sci-fi bunker interior, cyberpunk, cinematic lighting, no humans, detailed environment, ultra detailed, masterpiece, best quality';
const NEG   = 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, out of focus, people, characters';

const BACKGROUNDS = {
  cryoRoom:      `${STYLE}, cryogenic sleep pods in rows, blue tinted fog, frost on metal, underground facility`,
  corridor:      `${STYLE}, long narrow metal corridor, flickering fluorescent lights, pipes on ceiling, worn floor`,
  archiveRoom:   `${STYLE}, server room full of glowing data terminals, holographic displays, blue ambient light`,
  mainHall:      `${STYLE}, large underground atrium, concrete pillars, dim overhead lights, industrial scale`,
  ventPath:      `${STYLE}, cramped air duct interior, metal grating, dust particles, single dim light`,
  arkGlimpse:    `${STYLE}, glimpse of a massive ark structure through a small porthole, epic scale, atmospheric`,
  middleLevel:   `${STYLE}, mid-level bunker floor, catwalks, metal railings, dim yellowish lighting`,
  safeRoom:      `${STYLE}, small fortified safe room, reinforced door, emergency lighting, sparse supplies`,
  workshop:      `${STYLE}, underground workshop with scattered tools, sparks from welding, mechanical equipment`,
  settlement:    `${STYLE}, underground settlement with makeshift structures, warm lantern lights, lived-in atmosphere`,
  kaiOffice:     `${STYLE}, commander office underground, tactical maps on wall, single desk lamp, military aesthetic`,
  cafeteria:     `${STYLE}, underground cafeteria with long benches, tray stacks, dim institutional lighting`,
  lowerLevel:    `${STYLE}, deep underground level, darker atmosphere, heavy machinery, dripping water on walls`,
  ductPath:      `${STYLE}, utility duct corridor, pipes and cables everywhere, emergency red lighting`,
  valveRoom:     `${STYLE}, industrial valve control room, large pipes, pressure gauges, steam venting`,
  unofficialZone:`${STYLE}, unofficial hidden area with graffiti, makeshift shelves, contraband supplies, warm tones`,
  topFloor:      `${STYLE}, top level of bunker, higher ceiling, cleaner design, administrative zone`,
  upperLevel:    `${STYLE}, upper bunker level, better lighting, wider corridors, command zone atmosphere`,
  medRoom:       `${STYLE}, underground medical bay, hospital beds, medical equipment, sterile white and blue lighting`,
  boilerRoom:    `${STYLE}, massive underground boiler room, huge furnaces, intense heat haze, orange glow`,
  supplyHall:    `${STYLE}, large supply storage hall, metal shelves with crates, forklift tracks, warehouse scale`,
  plaza:         `${STYLE}, underground central plaza, open space in bunker, multiple levels visible, communal area`,
  bridge:        `${STYLE}, engineering bridge over deep chasm inside bunker, metal grating underfoot, abyss below`,
  surface:       `ruined post-apocalyptic surface, daylight through smoke, destroyed cityscape, overgrown ruins, cinematic, masterpiece, best quality, no humans`,
  surfaceNight:  `ruined post-apocalyptic surface at night, moonlight through clouds, destroyed city silhouettes, stars visible, cinematic, masterpiece, best quality, no humans`,
};

// ── NovelAI API 호출 ──────────────────────────────────────────
async function generateImage(name, prompt) {
  const outPath = path.join(OUT_DIR, `${name}.png`);
  if (!FORCE && fs.existsSync(outPath)) {
    console.log(`  SKIP  ${name}.png (already exists)`);
    return;
  }

  const body = {
    input: prompt,
    model: 'nai-diffusion-3',
    action: 'generate',
    parameters: {
      width: 1216,
      height: 832,
      scale: 6,
      sampler: 'k_euler_ancestral',
      steps: 28,
      seed: Math.floor(Math.random() * 2 ** 32),
      n_samples: 1,
      ucPreset: 0,
      qualityToggle: true,
      negative_prompt: NEG,
      sm: false,
      sm_dyn: false,
    },
  };

  const res = await fetch('https://image.novelai.net/ai/generate-image', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  // 응답은 zip 바이너리
  const arrayBuf = await res.arrayBuffer();
  const zip = new AdmZip(Buffer.from(arrayBuf));
  const entries = zip.getEntries();
  if (entries.length === 0) throw new Error('Empty zip response');
  const imgBuf = entries[0].getData();
  fs.writeFileSync(outPath, imgBuf);
  console.log(`  DONE  ${name}.png`);
}

// ── 메인 ──────────────────────────────────────────────────────
const DELAY_MS = 1500; // API 레이트리밋 방지용 딜레이

async function main() {
  const entries = Object.entries(BACKGROUNDS);
  console.log(`배경 생성 시작: ${entries.length}개 (${FORCE ? '강제 덮어쓰기' : '기존 파일 스킵'})\n`);

  for (let i = 0; i < entries.length; i++) {
    const [name, prompt] = entries[i];
    process.stdout.write(`[${String(i + 1).padStart(2)}/${entries.length}] ${name} ... `);
    try {
      await generateImage(name, prompt);
    } catch (err) {
      console.error(`\n  ERROR: ${err.message}`);
    }
    if (i < entries.length - 1) await new Promise(r => setTimeout(r, DELAY_MS));
  }

  console.log('\n완료! public/backgrounds/ 를 확인하세요.');
}

main();
