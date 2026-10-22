// Notices must sit under the navigator chip (bug: a toast covered the chip). Crops the top of the screen to out/toast_nav.png.
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); localStorage.setItem('prof-day-q', 'low'); } catch (e) {} });
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load', timeout: 180000 });
  await sleep(3000);
  await ev(`setup.mode = 'basic'; startGame();`); await sleep(2500);
  await ev(`beginDay(0, INTENTS[0].id)`); await sleep(4000);
  await ev(`(() => { if (typeof TUT !== 'undefined') TUT.done.all = true; const t = document.getElementById('tut'); if (t) t.classList.add('hidden'); toast('没来得及处理：小敏：我想从模拟转去做实验。', 'bad'); })()`); await sleep(800);
  const r = await ev(`(() => { const a = $('navChip').getBoundingClientRect(), b = $('toasts').firstChild.getBoundingClientRect(); return { chipBottom: Math.round(a.bottom), toastTop: Math.round(b.top), overlap: b.top < a.bottom }; })()`);
  console.log(JSON.stringify(r));
  await ev(`(() => { const el = $('toasts').firstChild; if (el) { el.style.animation = 'none'; const keep = el.cloneNode(true); $('toasts').appendChild(keep); } })()`);   // a copy outlives the 4.2 s timer while the slow headless frame renders
  await page.screenshot({ path: SHOT + 'toast_nav.png', clip: { x: 340, y: 0, width: 600, height: 330 } });
};
