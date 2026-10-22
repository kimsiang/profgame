// v10.3: leaving a match restores the gym (zone visible, opponent back in the gym group, sizes and props back).
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('prof-day-q', 'low'); localStorage.setItem('prof-bm-tut-v1', '1'); } catch (e) {} });
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load' });
  await sleep(2500);
  await ev(`quickBadminton('wu')`); for (let i = 0; i < 60 && !(await ev(`!!BM.m`)); i++) await sleep(500);
  const st = () => ev(`({ venue: BMV.cur, zoneVis: Z.group.visible, wuInGym: NPC.wu.parent === Z.group, wuScale: NPC.wu.scale.x, plScale: player.scale.x, racket: !!(player.userData.bmRacket && player.userData.bmRacket.visible), fov: cam.fov })`);
  console.log('in match   ', JSON.stringify(await st()));
  await ev(`bmEnd(false)`); await sleep(1500);
  console.log('quick review', JSON.stringify(await st()));
  await ev(`quickHome()`); await sleep(4000);
  console.log('title       ', JSON.stringify(await st()));
  // career: Friday match, finish, press 继续
  await ev(`(() => { S = newState(freshCareer()); Object.assign(S, { running: true, paused: false, day: 4, t: hm(13), v: { energy: 80, full: 60, bladder: 10 } }); setZone('gym'); player.visible = true; bmStart('wu', null, { event: 'chem' }); })()`);
  for (let i = 0; i < 60 && !(await ev(`!!BM.m`)); i++) await sleep(500);
  console.log('career     ', JSON.stringify(await st()));
  await ev(`(() => { const m = BM.m.core.m; m.winner = 'P'; m.score.P = 7; m.phase = 'over'; bmEnd(true); })()`); await sleep(800);
  console.log('career rev ', JSON.stringify(await st()));
  await ev(`$('bmGo').click()`); await sleep(1500);
  console.log('career done', JSON.stringify(await st()), JSON.stringify(await ev(`({ activity: S.activity && S.activity.type, paused: S.paused })`)));
};
