// v10.3 venue: the gym rebuilt for the broadcast camera (menu, rally) and Friday's match with the crowd. Screenshots in out/.
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  const q = process.env.Q || 'high';
  await page.evaluateOnNewDocument((q) => { try { localStorage.setItem('prof-day-q', q); localStorage.setItem('prof-bm-tut-v1', '1'); } catch (e) {} }, q);
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load' });
  await sleep(3000);
  await ev(`quickMenu()`); await sleep(3000);
  await page.screenshot({ path: SHOT + 'v_menu.png' });
  await ev(`quickBadminton('jay')`); await sleep(4500);
  await ev(`bmSwing('up')`); await sleep(1500);
  await page.screenshot({ path: SHOT + 'v_rally.png' });
  // play on with auto swings near the ideal moment and grab a few frames
  for (let i = 0; i < 6; i++) {
    await ev(`(() => { const r = BM.m && BM.m.core.ring(); if (r && r.left < 0.05 && r.reach) bmSwing(r.c.y > 2.0 ? 'tap' : 'up'); })()`);
    await sleep(350);
    if (i === 3) await page.screenshot({ path: SHOT + 'v_rally2.png' });
  }
  const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); }; requestAnimationFrame(f); }));
  console.log('fps(headless, software GL)', fps);
  // Friday's match: career-style start without the quick flag, with the event dressing
  await ev(`bmEnd(false)`); await sleep(1500);
  await ev(`(() => { bmVenueOff(); S.quick = false; S.running = true; bmStart('wu', null, { event: 'chem' }); })()`); await sleep(4000);
  await page.screenshot({ path: SHOT + 'v_hall.png' });
  await ev(`bmSwing('up')`); await sleep(1200);
  await page.screenshot({ path: SHOT + 'v_hall2.png' });
};
