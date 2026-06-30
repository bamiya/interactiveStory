import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '../public/assets/generated');
fs.mkdirSync(OUT_DIR, { recursive: true });

const IMAGES = [
  { file: 'ch1_start.jpg', prompt: '2149 post-nuclear war underground facility, cryo-sleep capsule pod opening with frost and cold mist, dim emergency lighting, dark sci-fi, cinematic' },
  { file: 'ch1_awakeRoom.jpg', prompt: '2149 underground bunker awakening room, rows of cryo pods, some broken, cold blue lighting, dust particles, dark post-apocalyptic sci-fi interior' },
  { file: 'ch1_corridor.jpg', prompt: '2149 underground facility long corridor, flickering emergency lights, metal walls with cracks, debris on floor, dark atmospheric sci-fi' },
  { file: 'ch1_archive.jpg', prompt: '2149 underground archive room, old servers and data terminals, dim blue screens glowing, shelves of physical files, post-apocalyptic research facility' },
  { file: 'ch1_mainHall.jpg', prompt: '2149 underground facility main hall, large open space, massive reinforced doors, central atrium with broken equipment, dramatic cinematic lighting' },
  { file: 'ch1_encounter.jpg', prompt: '2149 underground facility tense encounter, narrow corridor, spotlight beam, shadows of figures, atmospheric sci-fi thriller' },
  { file: 'ch1_secondZone.jpg', prompt: '2149 underground facility second sector, deeper levels, industrial pipes, warning signs, red emergency lighting, dark claustrophobic' },
  { file: 'ch1_end.jpg', prompt: '2149 underground bunker chapter end, large sealed blast door, dim light, lone figure standing before it, cinematic dramatic sci-fi' },
  { file: 'ch2_start.jpg', prompt: '2149 post-nuclear underground facility chapter 2, new area with different architecture, abandoned cafeteria or living quarters, eerie silence' },
  { file: 'ch3_start.jpg', prompt: '2149 deep underground facility chapter 3, industrial machinery level, massive generators, steam and pipes, hellish glow, dark sci-fi atmosphere' },
  { file: 'ch3_sublevel.jpg', prompt: '2149 underground facility sublevel, lowest accessible floor, flooded section, murky water, warning lights reflecting on water surface' },
  { file: 'ch4_start.jpg', prompt: '2149 underground facility chapter 4, research wing, laboratories with broken equipment, specimen tanks, eerie green lighting, dark bio-lab' },
  { file: 'ch4_descent.jpg', prompt: '2149 underground facility descent, vertical shaft with ladder, deep dark pit below, emergency lights dotting the walls going down' },
  { file: 'ch4_d_zone.jpg', prompt: '2149 underground facility D zone, restricted area, biohazard signs, quarantine barriers, dark mutagen research area, ominous lighting' },
  { file: 'ch5_start.jpg', prompt: '2149 underground facility chapter 5, communications hub, large antenna equipment, signal towers, bunker deep level, technological relics' },
  { file: 'ch5_border.jpg', prompt: '2149 underground facility border zone, boundary between two factions, tense barrier, makeshift barricade, opposing sides, tension sci-fi' },
  { file: 'ch5_unofficial.jpg', prompt: '2149 underground facility hidden route, unofficial passage cut through walls, improvised tunnel, crude lighting, survival atmosphere' },
  { file: 'ch6_start.jpg', prompt: '2149 underground facility final chapter, approach to central command, grand reinforced corridor, imposing architecture, climactic atmosphere' },
  { file: 'ch6_east.jpg', prompt: '2149 underground facility east wing, collapsed section, rubble and debris, daylight glimpse through cracks above, hope amid destruction' },
  { file: 'ch6_tunnel.jpg', prompt: '2149 underground facility escape tunnel, narrow rough-hewn passage, heading toward surface, light at end of tunnel, dramatic silhouette' },
  { file: 'ch6_comms_room.jpg', prompt: '2149 underground facility communications room, old radio equipment, screens with static, maps on walls, final broadcast, dramatic cinematic' },
];

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    });
    req.on('error', (e) => { file.close(); reject(e); });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function generate(item) {
  const dest = path.join(OUT_DIR, item.file);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
    console.log(`SKIP (exists) ${item.file}`);
    return;
  }
  const encoded = encodeURIComponent(item.prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=576&nologo=true&model=flux`;
  console.log(`Generating ${item.file}...`);
  try {
    await downloadImage(url, dest);
    const size = fs.statSync(dest).size;
    console.log(`  OK ${item.file} (${(size/1024).toFixed(0)} KB)`);
  } catch (e) {
    if (e.message.includes('429') || e.message.includes('timeout')) {
      console.log(`  Retrying ${item.file} after 8s...`);
      await new Promise(r => setTimeout(r, 8000));
      try {
        await downloadImage(url, dest);
        const size = fs.statSync(dest).size;
        console.log(`  OK (retry) ${item.file} (${(size/1024).toFixed(0)} KB)`);
      } catch (e2) {
        console.error(`  FAIL ${item.file}: ${e2.message}`);
      }
    } else {
      console.error(`  FAIL ${item.file}: ${e.message}`);
    }
  }
}

for (const item of IMAGES) {
  await generate(item);
  await new Promise(r => setTimeout(r, 3000));
}
console.log('Done.');
