// v12.2: invite 小周 to lunch, a table talk happens, trust moves, and the next day she remembers it.
// PORT (default 8123). Screenshot of the invite dialog and the table talk in out/.
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep, logs }) => {
  const port = process.env.PORT || 8123;
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.goto(`http://localhost:${port}/index.html?debug`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready'), { timeout: 120000 });
  await ev(`(() => { localStorage.clear(); setup.mode = 'basic'; startGame(); return 1; })()`); await sleep(1500);
  await ev(`beginDay(0, 'students')`); await sleep(3000);
  // lunch time, at the canteen, with nothing pending for 小周
  const pre = await ev(`(() => { S.events.forEach(e => { if (e.npc === 'zhou') e.state = 'resolved'; }); simulate(hm(12) - S.t); setZone('f1'); player.position.set(HS.canteen.x, 0, HS.canteen.z); TABLE.chance.canteen = 1;
    const c = companionsFor('canteen'); return { t: fmt(S.t), ok: c.ok, no: c.no, trust: Math.round(S.trust.zhou), cash: Math.round(S.fin.cash) }; })()`);
  console.log('PRE', JSON.stringify(pre));
  await ev(`(S.dialog && closeDialog(), canteenMenu(), 1)`); await sleep(900);
  await page.screenshot({ path: SHOT + 'v122_invite.png' });
  const who = await ev(`({ title: S.dialog && S.dialog.ev.title, choices: S.dialog && S.dialog.choices.map(c => c.t) })`);
  console.log('WHO', JSON.stringify(who));
  await ev(`pick(S.dialog.choices.find(c => c.t.includes('小周')))`); await sleep(500);
  await ev(`pick(S.dialog.choices[0])`); await sleep(300);
  await ev(`(() => { while (S.activity && !S.dialog) minuteTick(1); return 1; })()`); await sleep(1500);
  await page.screenshot({ path: SHOT + 'v122_table.png' });
  const talk = await ev(`({ id: S.dialog && S.dialog.ev.id, title: S.dialog && S.dialog.ev.title, choices: S.dialog && S.dialog.choices.map(c => c.t), trustAfterMeal: Math.round(S.trust.zhou), cash: Math.round(S.fin.cash) })`);
  console.log('TALK', JSON.stringify(talk));
  await ev(`pick(S.dialog.choices[0])`); await sleep(300); await ev(`closeDialog()`);
  const post = await ev(`({ trust: Math.round(S.trust.zhou), mem: S.mem.zhou, seen: S.tableSeen, log: S.tableLog, companions: S.companions })`);
  console.log('POST', JSON.stringify(post));
  // next morning: 小周's next event opens with a memory of the lunch
  const mem = await ev(`(() => { S.day = 1; S.t = hm(9); S.memToday = {}; const e = { npc: 'zhou', title: 'x' }; return memoryLine(e); })()`);
  console.log('MEMORY', JSON.stringify(mem));
  // the café offers Dr Zhao; his coffee gives flow to the next writing block
  const cafe = await ev(`(() => { S.day = 0; S.t = hm(15); setZone('roof'); openRoofCafe(); const ch = S.dialog.choices.map(c => c.t); pick(S.dialog.choices.find(c => c.t.includes('赵博士'))); while (S.activity && !S.dialog) minuteTick(1); if (S.dialog) { pick(S.dialog.choices[0]); closeDialog(); } const z = S.zhaoFlow; ACT.write('grant'); const f = S.flow; finishActivity(false); return { ch, zhaoFlow: z, flowAtStart: f }; })()`);
  console.log('CAFE', JSON.stringify(cafe));
  console.log('ERRORS', logs.filter((l) => /pageerror/.test(l)).slice(0, 5).join('\n') || 'none');
};
