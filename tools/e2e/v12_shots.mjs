// v12 screenshots: the "叫谁一起？" dialog at lunch and the week's end with "你的一周". PORT (default 8123).
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const port = process.env.PORT || 8123;
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.goto(`http://localhost:${port}/index.html?debug`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready'), { timeout: 120000 });
  await ev(`(() => { localStorage.clear(); setup.mode = 'basic'; startGame(); return 1; })()`); await sleep(1500);
  await ev(`beginDay(0, 'students')`); await sleep(3000);
  await ev(`(() => { S.events.forEach(e => { if (e.npc === 'lin') e.state = 'resolved'; }); simulate(hm(12) - S.t); setZone('f1'); player.position.set(HS.canteen.x, 0, HS.canteen.z); camState.target.copy(player.position); if (S.dialog) closeDialog(); canteenMenu(); return 1; })()`);
  await sleep(2500); await page.screenshot({ path: SHOT + 'v12_invite.png' });
  // a week's end with some company and two table talks
  await ev(`(() => { closeDialog(); TABLE.chance.canteen = 1; S.day = 6; S.t = hm(23, 50); S.companions = { 0: { zhou: 'canteen' }, 1: { lin: 'canteen', zhao: 'cafe' }, 3: { yu: 'canteen' }, 4: { coach: 'cafe' } };
    S.tableLog = [{ day: 0, id: 't_zhou_phd', npc: 'zhou', said: '“先别急着决定。下学期来组里做一个真课题，再看”' }, { day: 1, id: 't_lin_cylinder', npc: 'lin', said: '吃完一起去实验室，现在就查，记录照实改' }];
    S.mealsOut = 9; S.mealsAlone = 4; S.tiredDay = 2; S.homeNights = 4; S.submitted = true; S.paperSubmitted = true; S.wb = 36; endDay('time'); return 1; })()`);
  await sleep(2500); await page.screenshot({ path: SHOT + 'v12_week.png', fullPage: true });
  await ev(`document.getElementById('endPeople').scrollIntoView()`); await sleep(500);
  await page.screenshot({ path: SHOT + 'v12_people.png' });
};
