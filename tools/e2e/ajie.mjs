// v12.3.2: 阿杰 is a real NPC. Monday 12:15 "阿杰在茶水间等你": he stands at the pantry while the event is active,
// the dialog shows his bust and a trust value, and he is back at bay4 after it settles.
export default async ({ page, sleep, logs }) => {
  const port = process.env.PORT || 8123;
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.goto(`http://localhost:${port}/index.html?debug`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready'), { timeout: 120000 });
  await ev(`(() => { localStorage.clear(); setup.mode = 'basic'; startGame(); return 1; })()`);
  await sleep(1500);
  await ev(`beginDay(0, INTENTS[0].id)`); await sleep(3000);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z).toFixed(2);
  const home = await ev(`({ x: NPC.jie.position.x, z: NPC.jie.position.z, seated: !!NPC.jie.userData.seated, trust: S.trust.jie, student: !!STUDENTS.jie })`);
  console.log('HOME', JSON.stringify(home), 'to bay4', dist(home, await ev(`HS.bay4`)));
  // run the clock to 12:20 so the pantry event has fired
  await ev(`(() => { const target = 12 * 60 + 20; simulate(Math.max(0, target - S.t)); return S.t; })()`);
  await sleep(300);
  const active = await ev(`activeEvents().filter(e => e.npc === 'jie').map(e => [e.id, e.loc, e.title])`);
  const at = await ev(`({ x: NPC.jie.position.x, z: NPC.jie.position.z, seated: !!NPC.jie.userData.seated, state: NPC.jie.userData.state, away: NPC.jie.userData.away })`);
  console.log('ACTIVE', JSON.stringify(active));
  console.log('AT', JSON.stringify(at), 'to coffee', dist(at, await ev(`HS.coffee`)));
  // open the dialog, pick the first choice, and check the bust and the trust change
  const r = await ev(`(() => { const e = activeEvents().find(x => x.npc === 'jie'); if (!e) return 'no event'; openDialog(e); const bust = $('bustImg').getAttribute('src') ? 'bust' : 'no bust'; const who = $('dlgWho').textContent; const t0 = S.trust.jie; const b = document.querySelector('#dlgChoices button, .choices button, #dlgCh button'); if (b) b.click(); return { bust, who, t0, t1: S.trust.jie }; })()`);
  console.log('DIALOG', JSON.stringify(r));
  await sleep(500);
  await ev(`(() => { const d = $('dlgClose') || document.querySelector('#dialog .close, #dlgDone'); if (d) d.click(); return 1; })()`);
  await ev(`simulate(5)`); await sleep(300);
  const back = await ev(`({ x: NPC.jie.position.x, z: NPC.jie.position.z, seated: !!NPC.jie.userData.seated, state: NPC.jie.userData.state, ev: (S.events.find(e => e.npc === 'jie' && e.loc === 'coffee') || {}).state, mem: (S.mem.jie || []).length })`);
  console.log('BACK', JSON.stringify(back), 'to bay4', dist(back, await ev(`HS.bay4`)));
  console.log('ERRORS', logs.filter((l) => /pageerror/.test(l)).slice(0, 5).join('\n') || 'none');
};
