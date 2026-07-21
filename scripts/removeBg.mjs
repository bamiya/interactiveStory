/**
 * 캐릭터 이미지 흰 배경 제거 스크립트 (sharp 사용)
 * 코너에서 BFS 플러드필로 바깥쪽 흰색만 투명 처리
 * WebP 등 다양한 포맷 지원, 결과는 PNG로 저장
 * 사용법: node scripts/removeBg.mjs
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAR_DIR = path.resolve(__dirname, '../public/characters');
const THRESHOLD = 28; // 흰색 허용 오차

function isNearWhite(r, g, b) {
  return r >= 255 - THRESHOLD && g >= 255 - THRESHOLD && b >= 255 - THRESHOLD;
}

async function removeBg(filePath) {
  // 어떤 포맷이든 raw RGBA로 읽기
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)
  const buf = Buffer.from(data);
  const visited = new Uint8Array(width * height);

  function getPixel(x, y) {
    const i = (y * width + x) * channels;
    return { r: buf[i], g: buf[i + 1], b: buf[i + 2], a: buf[i + 3] };
  }

  function setAlpha(x, y, alpha) {
    buf[(y * width + x) * channels + 3] = alpha;
  }

  // 네 모서리 + 네 변 전체에서 시드 수집
  const queue = [];
  const addSeed = (x, y) => {
    const idx = y * width + x;
    if (visited[idx]) return;
    const { r, g, b } = getPixel(x, y);
    if (!isNearWhite(r, g, b)) return;
    visited[idx] = 1;
    queue.push(x, y);
  };

  for (let x = 0; x < width; x++) { addSeed(x, 0); addSeed(x, height - 1); }
  for (let y = 0; y < height; y++) { addSeed(0, y); addSeed(width - 1, y); }

  // BFS
  const dirs = [-1, 0, 1, 0, 0, -1, 0, 1];
  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    setAlpha(x, y, 0);

    for (let d = 0; d < 8; d += 2) {
      const nx = x + dirs[d], ny = y + dirs[d + 1];
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const nidx = ny * width + nx;
      if (visited[nidx]) continue;
      visited[nidx] = 1;
      const { r, g, b } = getPixel(nx, ny);
      if (isNearWhite(r, g, b)) { queue.push(nx, ny); }
    }
  }

  // PNG로 저장 (원본 파일명 유지, 확장자 .png로 통일)
  const outPath = filePath.replace(/\.[^.]+$/, '.png');
  await sharp(buf, { raw: { width, height, channels } })
    .png()
    .toFile(outPath + '.tmp');

  // 원본 교체 (Windows: rename 전에 반드시 원본 삭제)
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  fs.renameSync(outPath + '.tmp', outPath);
  console.log(`DONE  ${path.basename(outPath)}`);
}

async function main() {
  const files = fs.readdirSync(CHAR_DIR)
    .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

  console.log(`배경 제거: ${files.length}개 파일\n`);
  for (const file of files) {
    process.stdout.write(`  ${file} ... `);
    try {
      await removeBg(path.join(CHAR_DIR, file));
    } catch (e) {
      console.error(`ERROR: ${e.message}`);
    }
  }
  console.log('\n완료! public/characters/ 확인하세요.');
}

main();
