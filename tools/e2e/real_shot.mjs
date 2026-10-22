// v11.1 realistic cast: 5F frame at the normal camera, and a close one. OUT prefix, STATE = idle|walk|sit...
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument((q) => { try { localStorage.clear(); localStorage.setItem('prof-day-q', q); } catch (e) {} }, process.env.Q || 'mid');
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load', timeout: 180000 });
  await sleep(3000);
  await ev(`setup.mode = 'basic'; startGame();`); await sleep(2500);
  await ev(`beginDay(0, INTENTS[0].id)`); await sleep(3000);
  await ev(`(() => { if (typeof TUT !== 'undefined') TUT.done.all = true; const t = document.getElementById('tut'); if (t) t.classList.add('hidden'); player.position.set(14.5, 0, 13.2); player.rotation.y = 0.6; S.paused = true; })()`);
  for (let i = 0; i < 40 && !(await ev(`!!(player.userData.model)`)); i++) await sleep(1000);
  console.log(JSON.stringify(await ev(`(() => { const M = player.userData.model; const b = new THREE.Box3().setFromObject(player); return { real: !!(M && M.real), clips: M && Object.keys(M.clips).length, h: +(b.max.y - b.min.y).toFixed(2) }; })()`)));
  await sleep(4000);
  const out = process.env.OUT || 'real';
  await page.screenshot({ path: SHOT + out + '_far.png' });
  await ev(`camState.followDist = 5.5`); await sleep(5000);
  await page.screenshot({ path: SHOT + out + '_near.png' });
  await ev(`player.position.set(12.5, 0, 6.2)`); await sleep(6000);
  await page.screenshot({ path: SHOT + out + '_desk.png' });
};
