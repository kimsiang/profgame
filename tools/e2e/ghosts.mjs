// v12.3.3: the three former ghosts. 小敏 is a student with trust; 隔壁组老师 (a visitor) appears at the pantry on Tuesday 13:00
// and vanishes after; 陈老师's lines show the coach's bust.
export default async ({ page, sleep, logs }) => {
  const port = process.env.PORT || 8123;
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.goto(`http://localhost:${port}/index.html?debug`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready'), { timeout: 120000 });
  await ev(`(() => { localStorage.clear(); setup.mode = 'basic'; startGame(); return 1; })()`);
  await sleep(1500);
  console.log('ROSTER', JSON.stringify(await ev(`({ students: Object.keys(STUDENTS), trustMin: S.trust.min, speakers: ['小敏', '陈老师', '隔壁组老师'].map(n => SPEAKERS[n]), busts: ['小敏', '陈老师', '隔壁组老师'].map(n => !!bustFor(n)) })`)));
  await ev(`startDay(1)`); await sleep(3500); await ev(`beginDay(1, INTENTS[0].id)`); await sleep(1500);
  console.log('NB-BEFORE', JSON.stringify(await ev(`({ visible: NPC.nb.visible })`)));
  await ev(`(() => { simulate(Math.max(0, 13 * 60 + 5 - S.t)); return S.t; })()`); await sleep(300);
  console.log('NB-ACTIVE', JSON.stringify(await ev(`({ visible: NPC.nb.visible, x: +NPC.nb.position.x.toFixed(1), z: +NPC.nb.position.z.toFixed(1), ev: activeEvents().filter(e => e.npc === 'nb').map(e => e.title) })`)));
  const r = await ev(`(() => { const e = activeEvents().find(x => x.npc === 'nb'); if (!e) return 'no event'; openDialog(e); const bust = $('bustImg').getAttribute('src') ? 'bust' : 'no bust'; const b = document.querySelector('#dlgChoices button, .choices button, #dlgCh button'); if (b) b.click(); return { bust, who: $('dlgWho').textContent }; })()`);
  console.log('DIALOG', JSON.stringify(r)); await sleep(400);
  await ev(`(() => { const d = $('dlgClose') || document.querySelector('#dialog .close, #dlgDone'); if (d) d.click(); return 1; })()`);
  await ev(`simulate(5)`); await sleep(200);
  console.log('NB-AFTER', JSON.stringify(await ev(`({ visible: NPC.nb.visible, state: (S.events.find(e => e.npc === 'nb') || {}).state })`)));
  console.log('ERRORS', logs.filter((l) => /pageerror/.test(l)).slice(0, 5).join('\n') || 'none');
};
