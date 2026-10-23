// Bug hunt: plays careers under every policy (the random one is the monkey) and collects page errors, console errors,
// harness exceptions, and invariant breaks in the state after each week. SEEDS (default 6), WEEKS (default 3).
import fs from 'fs';
const ROOT = new URL('../balance/', import.meta.url).pathname;
export default async ({ page }) => {
  const port = process.env.PORT || 8123, seeds = +(process.env.SEEDS || 6), weeks = +(process.env.WEEKS || 3);
  const found = [];
  page.on('pageerror', (e) => found.push('pageerror: ' + e.message.split('\n')[0]));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR/.test(m.text())) found.push('console: ' + m.text().slice(0, 160)); });
  const open = async () => {
    await page.goto(`http://localhost:${port}/index.html?sim`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.__sim && window.__sim.ready !== false, { timeout: 120000 });
    await page.addScriptTag({ content: fs.readFileSync(ROOT + 'agent.js', 'utf8') });
    await page.evaluate(() => { window.__simLimit = 240000; });
  };
  const INV = `(() => {
    const S = window.__sim.S, bad = [];
    const num = (v, n) => { if (typeof v !== 'number' || Number.isNaN(v) || !Number.isFinite(v)) bad.push(n + '=' + v); };
    Object.entries(S.k).forEach(([k, v]) => { num(v, 'k.' + k); if (v < 0 || v > 100) bad.push('k.' + k + ' out of range ' + v); });
    ['energy', 'full', 'bladder'].forEach((k) => { num(S.v[k], 'v.' + k); if (S.v[k] < 0 || S.v[k] > 100) bad.push('v.' + k + ' out of range ' + S.v[k]); });
    num(S.wb, 'wb'); Object.entries(S.trust).forEach(([k, v]) => { num(v, 'trust.' + k); if (v < 0 || v > 100) bad.push('trust.' + k + ' ' + v); });
    if (S.fam) Object.entries(S.fam).forEach(([k, v]) => num(v, 'fam.' + k));
    if (S.fin) { num(S.fin.cash, 'fin.cash'); num(S.fin.fund, 'fin.fund'); }
    ['grant', 'paper'].forEach((p) => Object.entries(S.dos[p]).forEach(([k, v]) => { if (!(v >= 0 && v <= 3)) bad.push('dos.' + p + '.' + k + '=' + v); }));
    if (S.t < 0 || S.t > 24 * 60) bad.push('t=' + S.t);
    const R = S.weekResult || {}; num(R.score, 'weekResult.score');
    S.events.forEach((e) => { if (!['pending', 'active', 'resolved', 'expired'].includes(e.state)) bad.push('event ' + e.id + ' state ' + e.state); });
    const c = window.__sim.loadCareer(); if (c) { num(c.pts, 'career.pts'); if (c.rank < 0) bad.push('rank ' + c.rank); }
    return bad;
  })()`;
  for (const p of ['random', 'grinder', 'balanced', 'mentor']) for (let s = 1; s <= seeds; s++) {
    await open();
    const n0 = found.length;
    try { await page.evaluate((p, w, s) => window.simRun(p, w, s), p, weeks, s); } catch (e) { found.push(`harness ${p}#${s}: ${e.message.split('\n')[0].slice(0, 200)}`); }
    const inv = await page.evaluate(INV); inv.forEach((b) => found.push(`invariant ${p}#${s}: ${b}`));
    console.log(`${p} #${s}: ${found.length - n0} issue(s)`);
  }
  const uniq = [...new Map(found.map((f) => [f.replace(/#\d+/g, '').replace(/\d+(\.\d+)?/g, 'N'), f])).values()];
  console.log(`\nISSUES ${found.length} total, ${uniq.length} distinct`); uniq.slice(0, 40).forEach((f) => console.log(' - ' + f));
};
