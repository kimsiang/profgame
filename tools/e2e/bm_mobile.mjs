// v10.3: phone portrait framing of the match venue.
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('prof-day-q', 'mid'); localStorage.setItem('prof-bm-tut-v1', '1'); } catch (e) {} });
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load' });
  await sleep(2500);
  await ev(`quickBadminton('jay')`);
  for (let i = 0; i < 60 && !(await ev(`!!BM.m`)); i++) await sleep(500);
  await sleep(3000);
  await page.screenshot({ path: SHOT + 'm_portrait.png' });
};
