// Gemini(gemini-2.5-flash-image, 일명 "나노바나나")로 스토리 장면별 배경 이미지를 생성하는 스크립트.
// 사용법: node scripts/generateBackgrounds.mjs
// .env의 GEMINI_API_KEY를 읽어서 사용하며, 키 값은 어디에도 출력하지 않는다.

import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY가 .env에 없습니다.');
  process.exit(1);
}

const OUTPUT_DIR = path.resolve('public/assets/generated');

// 스토리 장면별 프롬프트. 일관된 톤(차갑고 습한 시설, 청록/암청색 조명, 빗물)을 유지하도록
// 공통 스타일 문구를 각 프롬프트 끝에 덧붙인다.
const STYLE_SUFFIX =
  'cinematic atmospheric lighting, cold blue and teal tones, heavy humidity and dripping water, ' +
  'photorealistic, ultra detailed, moody horror-mystery visual novel background, no people, no text, 16:9';

const SCENES = [
  {
    id: 'hub',
    prompt: `A dim underground concrete corridor junction in an abandoned research facility, three passages branching into darkness, rusted pipes overhead, shallow standing water on the floor reflecting a faint ceiling light, water dripping through a cracked ceiling vent. ${STYLE_SUFFIX}`,
  },
  {
    id: 'cellsRoom',
    prompt: `A dark detention room inside a derelict facility, a rusted prison cell with bars, dim emergency light flickering, wet stained concrete walls, an unsettling but quiet atmosphere. ${STYLE_SUFFIX}`,
  },
  {
    id: 'controlGlimpse',
    prompt: `A small grimy control room seen through a dirty glass window, multiple old CRT monitors glowing in the dark, scattered papers, a single desk lamp, claustrophobic and secretive mood. ${STYLE_SUFFIX}`,
  },
  {
    id: 'floodedStairs',
    prompt: `A flooded stairwell descending into darkness, water rising up the steps, rusted railings, distorted reflections on the water surface, something unseen lurking just below the surface, dread-inducing atmosphere. ${STYLE_SUFFIX}`,
  },
  {
    id: 'coreApproach',
    prompt: `A massive heavy steel door at the end of a corridor labeled with faded warning stencils, a shattered skylight above pouring rain directly onto the floor, dramatic vertical light beam, ominous scale. ${STYLE_SUFFIX}`,
  },
];

async function generateScene(ai, scene) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: scene.prompt,
  });

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(part => part.inlineData);
  if (!imagePart) {
    console.error(`[${scene.id}] 이미지 데이터를 받지 못했습니다.`);
    return;
  }

  const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
  const filePath = path.join(OUTPUT_DIR, `${scene.id}.png`);
  await writeFile(filePath, buffer);
  console.log(`[${scene.id}] 저장 완료 -> ${filePath}`);
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const ai = new GoogleGenAI({ apiKey });

  for (const scene of SCENES) {
    try {
      await generateScene(ai, scene);
    } catch (error) {
      console.error(`[${scene.id}] 생성 실패:`, error.message ?? error);
    }
  }
}

main();
