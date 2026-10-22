// v11.1: bake portrait atlases for the realistic cast (tools/rocketbox/portrait.html). One pose, repeated for the 5 expressions
// the dialogue system asks for (the Rocketbox meshes have no face morphs). Writes assets/characters/real/portraits/<id>.webp.
import fs from 'fs';
const OUT = new URL('../../assets/characters/real/portraits/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  fs.mkdirSync(OUT, { recursive: true });
  await page.setViewport({ width: 400, height: 500 });
  await page.goto('http://localhost:8123/tools/rocketbox/portrait.html', { waitUntil: 'load', timeout: 180000 });
  await sleep(2500);
  const man = JSON.parse(fs.readFileSync(new URL('../../assets/characters/real/manifest.json', import.meta.url)));
  const only = (process.env.IDS || '').split(',').filter(Boolean);
  for (const [id, m] of Object.entries(man)) {
    if (only.length && !only.includes(id)) continue;
    const png = await page.evaluate((u, a) => window.bake(u, a), '../../' + m.url, '../../' + m.anims);
    fs.writeFileSync(OUT + id + '.png', Buffer.from(png.split(',')[1], 'base64'));
    console.log('baked', id);
  }
};
