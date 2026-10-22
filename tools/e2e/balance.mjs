// v12 balance harness: plays WEEKS weeks per career, RUNS careers per policy, every policy, and prints the §2.3 table.
// PORT (default 8123), WEEKS (10), RUNS (10), POLICIES (comma list), OUT (tools/balance/out/<name>.json).
import fs from 'fs';
import path from 'path';
const ROOT = new URL('../balance/', import.meta.url).pathname;
export default async ({ page }) => {
  const port = process.env.PORT || 8123, weeks = +(process.env.WEEKS || 10), runs = +(process.env.RUNS || 10);
  // A fresh page for every career: runs stay independent and memory stays flat.
  const open = async () => {
    await page.goto(`http://localhost:${port}/index.html?sim`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForFunction(() => window.__sim && window.__sim.ready !== false, { timeout: 120000 });
    await page.addScriptTag({ content: fs.readFileSync(ROOT + 'agent.js', 'utf8') });
  };
  const policies = (process.env.POLICIES || 'grinder,mentor,balanced,random').split(',');
  const rows = [];
  for (const p of policies) for (let r = 0; r < runs; r++) {
    const t0 = Date.now(); await open();
    try { rows.push(...await page.evaluate((p, w, s) => window.simRun(p, w, s), p, weeks, r + 1)); }
    catch (e) { console.log(`run ${p}#${r + 1} failed: ${e.message.split('\n')[0]}`); }
    console.log(`${p} #${r + 1}: ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  }
  fs.mkdirSync(ROOT + 'out', { recursive: true });
  const file = process.env.OUT || path.join(ROOT, 'out', 'latest.json');
  fs.writeFileSync(file, JSON.stringify(rows, null, 1));
  const { report } = await import(ROOT + 'report.mjs');
  console.log(report(rows));
};
