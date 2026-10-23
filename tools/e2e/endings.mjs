// v14.2: the Friday choice events appear when the career is ready; an ending flag ends the career on the review screen.
export default async ({ page, sleep, logs }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.goto(`http://localhost:${process.env.PORT || 8123}/index.html?debug&sim`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready') && window.__prof('!!MOMENTS.data && !!ENDINGS.data'), { timeout: 120000 });
  await ev(`(() => { localStorage.clear(); setup.mode = 'basic'; startGame(); return 1; })()`); await sleep(1200);
  const r = await ev(`(() => {
    S.flags.industry_ready = 1; S.flags.teach_ready = 1;
    for (let d = 0; d < 7; d++) {
      if (d > 0) startDay(d); beginDay(d, INTENTS[0].id); S.paused = false;
      if (d === 4) { var fri = S.events.filter(e => /^end_/.test(e.id)).map(e => e.id); }
      simulate(60 * 3); Object.keys(S.trust).forEach(id => { S.trust[id] = 70; });
      if (d === 1) moment('reimb'); if (d === 3) moment('table', { who: '赵博士', title: '有一家公司找我', said: '去吧，我也在想同样的事', where: '天台' });
      if (d === 4) S.flags.end_industry = 1;
      if (d !== 6) { S.t = hm(19); goHome(); }
      endDay(d === 6 ? 'time' : 'home');
    }
    const c = loadCareer();
    return { fri, done: c.done, ending: c.ending, head: $('endHead').textContent, title: $('wkTitle').textContent, line: $('wkLine').textContent, decisions: [...document.querySelectorAll('#wkMoments .wm')].map(x => x.textContent.trim().replace(/\\s+/g, ' ')), again: $('wkAgain').textContent, careerMoments: (c.moments || []).length };
  })()`);
  console.log('ENDING', JSON.stringify(r));
  console.log('ERRORS', logs.filter((l) => /pageerror/.test(l)).slice(0, 5).join('\n') || 'none');
};
