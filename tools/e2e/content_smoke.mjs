// v12.1: the content JSON loads, a week starts, and the first day has its scripted events.
export default async ({ page, sleep, logs }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready'), { timeout: 120000 });
  const r = await ev(`(() => { localStorage.clear(); setup.mode = 'basic'; startGame(); return 1; })()`);
  await sleep(1500);
  console.log('PLAN', JSON.stringify(await ev(`({ week: WEEK.length, quick: QUICK.length, days: DAYS.length, intents: INTENTS.length, students: Object.keys(STUDENTS), cards: Object.keys(CARDS).length, events: S.events.length, ids: S.events.slice(0, 5).map(e => e.id), plan: !$('scrPlan').classList.contains('hidden') })`)));
  await ev(`beginDay(0, INTENTS[0].id)`); await sleep(3200);
  console.log('DAY', JSON.stringify(await ev(`(() => { simulate(240); return { t: S.t, active: activeEvents().map(e => e.title).slice(0, 4), err: !$('contentErr').classList.contains('hidden') }; })()`)));
  console.log('ERRORS', logs.filter((l) => /pageerror|Error/.test(l)).slice(0, 5).join('\n') || 'none');
};
