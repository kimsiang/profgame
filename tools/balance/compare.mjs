// Compares two harness outputs row by row (same policy, seed, week). node compare.mjs a.json b.json
// Used to prove a refactor did not change the game: every shared row must match exactly.
import fs from 'fs';
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const key = (r) => `${r.policy}#${r.seed}/W${r.week}`, A = new Map(a.map((r) => [key(r), r]));
let same = 0, diff = 0;
for (const r of b) {
  const o = A.get(key(r)); if (!o) continue;
  const fields = Object.keys(o).filter((k) => JSON.stringify(o[k]) !== JSON.stringify(r[k]));
  if (fields.length) { diff++; if (diff <= 10) console.log(key(r), fields.map((k) => `${k}: ${JSON.stringify(o[k])} → ${JSON.stringify(r[k])}`).join('; ')); } else same++;
}
console.log(`${same} rows identical, ${diff} differ (${b.length - same - diff} rows only in the second file)`);
process.exit(diff ? 1 : 0);
