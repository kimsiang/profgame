// v14.0: moments are recorded through the week and the Sunday review opens with one sentence and up to five moments.
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep, logs }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.goto(`http://localhost:${process.env.PORT || 8123}/index.html?debug&sim`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready') && window.__prof('!!MOMENTS.data'), { timeout: 120000 });
  await ev(`(() => { localStorage.clear(); setup.mode = 'basic'; startGame(); return 1; })()`); await sleep(1500);
  // play a quick week: submit on Friday with a few stars, go home on three nights, one table talk, one collapse
  const r = await ev(`(() => {
    for (let d = 0; d < 7; d++) {
      if (d > 0) startDay(d); beginDay(d, INTENTS[0].id); S.paused = false;
      simulate(60 * 4);
      if (d === 1) { S.dos.grant.write = 3; S.dos.grant.idea = 1; moment('table', { who: '小周', title: '我可能不读博了', said: '先把这学期读完', where: '食堂' }); }
      if (d === 4) { S.dos.grant.write = 3; S.submitted = true; S.subWb = S.wb; moment('submit', { which: '基金申请书', stars: '写作★★★ 创新点★☆☆' }); }
      if (d === 2) { endDay('collapse'); continue; }
      if (d === 0 || d === 3 || d === 5) { S.t = hm(19); goHome(); }
      endDay(d === 6 ? 'time' : 'home');
    }
    return { moments: S.moments.map(m => m.kind), n: S.moments.length };
  })()`);
  console.log('MOMENTS', JSON.stringify(r));
  await sleep(1200);
  console.log('WEEKLY', JSON.stringify(await ev(`({ shown: !$('weekly').classList.contains('hidden'), wk: $('scrEnd').classList.contains('wk'), line: $('wkLine').textContent, rows: [...document.querySelectorAll('#wkMoments .wm')].map(x => x.textContent.trim().replace(/\\s+/g, ' ')), grade: $('wkGrade').textContent })`)));
  await ev(`$('wkDetail').click()`); await sleep(300);
  console.log('DETAIL', JSON.stringify(await ev(`({ open: $('scrEnd').classList.contains('open'), gridVisible: getComputedStyle($('endGrid')).display })`)));
  await page.screenshot({ path: SHOT + 'v14_weekly.png' });
  console.log('ERRORS', logs.filter((l) => /pageerror/.test(l)).slice(0, 5).join('\n') || 'none');
};
