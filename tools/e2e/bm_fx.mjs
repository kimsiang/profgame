// v10.3 hit effects. Headless WebGL is ~1 fps, so the match logic is stepped in-page (bmFrame at 60 Hz) with an auto player
// that swings on time; a frame is rendered and grabbed right after a clear, mid-flight, and right after a smash.
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument((q) => { try { localStorage.setItem('prof-day-q', q); localStorage.setItem('prof-bm-tut-v1', '1'); } catch (e) {} }, process.env.Q || 'mid');
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load' });
  await sleep(2500);
  await ev(`quickBadminton('${process.env.OPP || 'wu'}')`);
  for (let i = 0; i < 60 && !(await ev(`!!BM.m`)); i++) await sleep(500);
  await ev(`(() => { BM.m.introT = 0;
    window.__step = (sec, swing) => { for (let i = 0; i < sec * 60; i++) { const B = BM.m; if (!B) return 'end'; const m = B.core.m;
      if (swing && m.phase === 'serve' && m.server === 'P' && m.t - m.phaseT > 0.5) bmSwing('up');
      const r = B.core.ring(); if (swing && r && r.reach && r.left < 0.017) { const g = r.c.y > 1.6 ? 'tap' : 'up'; bmSwing(g); for (let k = 0; k < 5; k++) bmFrame(1 / 60); return g; }
      bmFrame(1 / 60); } return 'none'; }; })()`);
  const got = {};
  for (let i = 0; i < 80 && !(got.smash && got.clear); i++) {
    const g = await ev(`__step(4, true)`);
    if (g === 'end') break;
    if (g === 'tap' && !got.smash) { got.smash = 1; await sleep(1200); await page.screenshot({ path: SHOT + 'fx_smash.png' }); await ev(`__step(0.15, false)`); await sleep(1200); await page.screenshot({ path: SHOT + 'fx_smash2.png' }); }
    else if (g === 'up' && !got.clear) { got.clear = 1; await sleep(1200); await page.screenshot({ path: SHOT + 'fx_clear.png' }); await ev(`__step(0.5, false)`); await sleep(1200); await page.screenshot({ path: SHOT + 'fx_flight.png' }); }
  }
  console.log(JSON.stringify(got), JSON.stringify(await ev(`BM.m ? BM.m.core.m.score : null`)));
};
