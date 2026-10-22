// v10.4 sharpness: a 5F frame while walking. PORT picks the build (8123 = working tree); OUT names the file.
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  const port = process.env.PORT || 8123;
  await page.evaluateOnNewDocument((q) => { try { localStorage.clear(); localStorage.setItem('prof-day-q', q); } catch (e) {} }, process.env.Q || 'high');
  await page.goto(`http://localhost:${port}/index.html?debug`, { waitUntil: 'load' });
  await sleep(3000);
  await ev(`setup.mode = 'basic'; startGame();`); await sleep(2500);
  await ev(`beginDay(0, INTENTS[0].id)`); await sleep(3000);
  await ev(`(() => { if (typeof TUT !== 'undefined') TUT.done.all = true; const t = document.getElementById('tut'); if (t) t.classList.add('hidden'); player.position.set(14.5, 0, 13.2); S.paused = true; })()`);
  await sleep(6000);
  await page.screenshot({ path: SHOT + (process.env.OUT || 'world') + '.png' });
};
