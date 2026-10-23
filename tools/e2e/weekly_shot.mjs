// v14.0: a rendered frame of the week review (debug mode, so screens fade; see weekly.mjs for the checks).
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); localStorage.setItem('prof-day-q', 'mid'); } catch (e) {} });
  await page.goto(`http://localhost:${process.env.PORT || 8123}/index.html?debug`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready') && window.__prof('!!MOMENTS.data'), { timeout: 120000 });
  await ev(`(() => { setup.mode = 'basic'; startGame(); return 1; })()`); await sleep(1500);
  for (let d = 0; d < 7; d++) {
    if (d > 0) { await ev(`startDay(${d})`); await sleep(1500); }
    await ev(`(() => { beginDay(${d}, INTENTS[0].id); S.paused = false; if (typeof TUT !== 'undefined') TUT.done.all = true; simulate(60 * 5);
      if (${d} === 1) { S.dos.grant.write = 2; S.dos.grant.idea = 2; S.dos.grant.data = 2; moment('table', { who: '小周', title: '我可能不读博了', said: '先把这学期读完', where: '食堂' }); }
      if (${d} === 4) { S.dos.grant.write = 3; S.submitted = true; S.subWb = S.wb; S.t = hm(23, 41); moment('submit', { which: '基金申请书', stars: '写作★★★ 创新点★★☆ 预实验数据★★☆' }); }
      Object.keys(S.trust).forEach(id => { S.trust[id] = 70; });
      if (${d} === 0 || ${d} === 2 || ${d} === 3 || ${d} === 5) { S.t = hm(19, 10); goHome(); }
      endDay(${d} === 6 ? 'time' : ${d} === 1 ? 'collapse' : 'home'); return 1; })()`);
    await sleep(900);
  }
  await sleep(2500);
  await page.screenshot({ path: SHOT + 'v14_weekly.png' });
  await ev(`$('wkDetail').click()`); await sleep(600);
  await page.screenshot({ path: SHOT + 'v14_weekly_open.png' });
};
