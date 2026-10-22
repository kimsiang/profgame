// Scenario: start a career, play into Monday, autosave mid-day, reload, continue, compare; then slots.
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page: p0, sleep, browser }) => {
  let page = p0;
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument(() => { try { if (!localStorage.getItem('prof-day-q')) localStorage.setItem('prof-day-q', 'mid'); } catch (e) {} });
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load' });
  await sleep(3000);
  await ev(`Object.keys(localStorage).filter(k => k !== 'prof-day-q').forEach(k => localStorage.removeItem(k)); setup.mode = 'basic'; startGame();`);
  await sleep(2500);
  await ev(`beginDay(0, INTENTS[0].id)`);
  await sleep(3500);
  const before = await ev(`(() => {
    simulate(150);
    player.position.set(14.5, 0, 13.2);
    const ok = saveGame(true);
    const x = JSON.parse(localStorage.getItem(SAVE_KEY));
    return { ok, t: S.t, day: S.day, energy: Math.round(S.v.energy), grant: S.grant, ev: S.events.map(e => e.id + ':' + e.state).join(','), hasMid: !!x.mid, kb: Math.round(localStorage.getItem(SAVE_KEY).length / 1024), label: saveLabel(x) };
  })()`);
  console.log('BEFORE', JSON.stringify(before));
  await ev(`saveToSlot(1)`);
  const np = await browser.newPage(); await np.setViewport({ width: 1280, height: 800 });
  await np.setRequestInterception(true); np.on('request', (r) => p0.__route(r));
  await p0.close(); page = np;
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(3000);
  console.log('TITLE', JSON.stringify(await ev(`({ cont: $('contBtn').textContent, hidden: $('contBtn').classList.contains('hidden') })`)));
  await page.screenshot({ path: SHOT + 'title.png' });
  await ev(`toggleSave(true)`); await sleep(400);
  await page.screenshot({ path: SHOT + 'sheet_title.png' });
  await ev(`toggleSave(false); continueGame();`);
  await sleep(3000);
  const after = await ev(`({ t: S.t, day: S.day, energy: Math.round(S.v.energy), grant: S.grant, ev: S.events.map(e => e.id + ':' + e.state).join(','), pos: [player.position.x, player.position.z].map(v => v.toFixed(1)).join(','), zone: Z.id, running: S.running, paused: S.paused, planning: S.planning, markers: S.events.filter(e => e.marker).length, active: S.events.filter(e => e.state === 'active').length })`);
  console.log('AFTER', JSON.stringify(after));
  console.log('EVENTS MATCH', before.ev === after.ev, '| TIME MATCH', before.t === after.t);
  await sleep(1500);
  await page.screenshot({ path: SHOT + 'resumed.png' });
  await ev(`toggleSave(true)`); await sleep(400);
  await page.screenshot({ path: SHOT + 'sheet_game.png' });
  const t1 = await ev(`(() => { toggleSave(false); simulate(60); return S.t; })()`);
  await ev(`loadSlot(1)`); await sleep(3000);
  console.log('SLOT LOAD', t1, '->', await ev(`S.t`), 'running', await ev(`S.running`));
  // the game keeps running after resume: time advances
  const ta = await ev(`S.t`); await sleep(3000); console.log('CLOCK RUNS', ta, '->', await ev(`S.t`));
};
