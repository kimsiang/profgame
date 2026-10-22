const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('prof-day-q', 'mid'); localStorage.setItem('prof-bm-tut-v1', '1'); } catch (e) {} });
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load' });
  await sleep(3000);
  await ev(`quickMenu()`); await sleep(2500);
  await page.screenshot({ path: SHOT + 'bm_menu.png' });
  await ev(`quickBadminton('wu')`); await sleep(5000);
  await ev(`bmSwing('up')`); await sleep(1200);
  await page.screenshot({ path: SHOT + 'bm_rally.png' });
  console.log(JSON.stringify(await ev(`({ phase: BM.m && BM.m.core.m.phase, score: BM.m && BM.m.core.m.score, t: BM.m && BM.m.core.m.t.toFixed(1) })`)));
};
