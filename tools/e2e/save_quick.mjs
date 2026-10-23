// Quick save/continue check without page reloads (sim mode): autosave mid-day, continue, compare the state.
export default async ({ page, sleep, logs }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.goto(`http://localhost:${process.env.PORT || 8123}/index.html?debug&sim`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready'), { timeout: 120000 });
  const r = await ev(`(() => {
    localStorage.clear(); setup.mode = 'basic'; startGame(); beginDay(0, INTENTS[0].id); S.paused = false; simulate(150);
    const before = { t: S.t, day: S.day, energy: Math.round(S.v.energy), ev: S.events.map(e => e.id + ':' + e.state).join(','), moments: (S.moments || []).length, cash: S.fin && S.fin.cash };
    const ok = saveGame(true); const raw = localStorage.getItem(SAVE_KEY);
    S = null; continueGame();
    const after = { t: S.t, day: S.day, energy: Math.round(S.v.energy), ev: S.events.map(e => e.id + ':' + e.state).join(','), moments: (S.moments || []).length, cash: S.fin && S.fin.cash };
    simulate(60); endDay('home'); startDay(1); beginDay(1, INTENTS[0].id); simulate(30);
    const slotOk = typeof saveSlot === 'function' ? saveSlot(1) : 'n/a';
    return { ok, kb: Math.round(raw.length / 1024), same: JSON.stringify(before) === JSON.stringify(after), before, after, slotOk, day: S.day };
  })()`);
  console.log('SAVE', JSON.stringify(r).slice(0, 600));
  console.log('ERRORS', logs.filter((l) => /pageerror/.test(l)).slice(0, 5).join('\n') || 'none');
};
