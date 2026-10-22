// v11.2 checks: garden (6F), rooftop café, campus football, canteen (1F), folded HUD. ART=real|diorama. Frames in out/v112_*.png
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument((a) => { try { localStorage.clear(); localStorage.setItem('prof-day-q', 'mid'); if (a) localStorage.setItem('prof-art', a); } catch (e) {} }, process.env.ART || '');
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load', timeout: 180000 });
  await sleep(3000);
  await ev(`setup.mode = 'basic'; startGame();`); await sleep(2500);
  await ev(`beginDay(0, INTENTS[0].id)`); await sleep(3000);
  await ev(`(() => { if (typeof TUT !== 'undefined') TUT.done.all = true; const t = document.getElementById('tut'); if (t) t.classList.add('hidden'); S.paused = true; })()`);
  const go = async (zone, x, z, dist, name) => {
    await ev(`(() => { setZone('${zone}'); player.position.set(${x}, 0, ${z}); camState.followDist = ${dist}; camState.dist = ${dist}; camState.target.set(${x}, 0.6, ${z}); camState.overview = false; })()`);
    await sleep(9000); await page.screenshot({ path: SHOT + 'v112_' + name + '.png' });
  };
  const only = (process.env.ONLY || 'garden,cafe,soccer,canteen,hud').split(',');
  if (only.includes('garden')) { await go('f6', 20, 13, 30, 'garden'); }
  if (only.includes('cafe')) { await go('roof', 10, 9, 13, 'cafe'); await go('roof', 26, 21.5, 13, 'cafe2'); }
  if (only.includes('soccer')) { await ev(`S.paused = false; S.speed = 1`); await go('campus', 60, 33, 32, 'soccer'); await sleep(4000); await page.screenshot({ path: SHOT + 'v112_soccer2.png' }); await ev(`S.paused = true`); }
  if (only.includes('canteen')) { await ev(`S.t = hm(12, 10)`); await go('f1', 31, 4.5, 13, 'canteen'); await ev(`canteenMenu()`); await sleep(3000); await page.screenshot({ path: SHOT + 'v112_menu.png' }); await ev(`closeDialog && closeDialog()`); }
  if (only.includes('hud')) { await ev(`setZone('f5'); player.position.set(14.5, 0, 13.2); foldSet('pCard', true); foldSet('quests', true)`); await sleep(5000); await page.screenshot({ path: SHOT + 'v112_hud.png' }); await ev(`foldSet('pCard', false); foldSet('quests', false)`); }
};
