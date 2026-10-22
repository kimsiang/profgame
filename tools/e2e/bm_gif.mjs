// v10.3: frames for a short GIF of a rally (logic stepped in-page at 1/12 s per frame, auto player).
const OUT = new URL('./out/gif/', import.meta.url).pathname;
import fs from 'fs';
export default async ({ page, sleep }) => {
  fs.mkdirSync(OUT, { recursive: true });
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('prof-day-q', 'mid'); localStorage.setItem('prof-bm-tut-v1', '1'); } catch (e) {} });
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load' });
  await sleep(2500);
  await ev(`quickBadminton('${process.env.OPP || 'wu'}')`);
  for (let i = 0; i < 60 && !(await ev(`!!BM.m`)); i++) await sleep(500);
  await sleep(2500);
  await ev(`(() => { BM.m.introT = 0; $('bmPop').className = ''; BM.m.pop = 0;
    window.__adv = (sec) => { for (let i = 0; i < Math.round(sec * 60); i++) { const B = BM.m; if (!B) return; const m = B.core.m;
      if (m.phase === 'serve' && m.server === 'P' && m.t - m.phaseT > 0.4) bmSwing('up');
      const r = B.core.ring(); if (r && r.reach && r.left < 0.017) bmSwing(r.c.y > 1.6 ? 'tap' : 'up');
      bmFrame(1 / 60); } }; })()`);
  const N = +(process.env.N || 60);
  for (let i = 0; i < N; i++) {
    await ev(`__adv(1 / 12)`);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: OUT + String(i).padStart(3, '0') + '.png' });
  }
};
