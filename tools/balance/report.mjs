// Summarises harness rows into the design note's §2.3 table. Usable alone: node report.mjs out/baseline.json
import fs from 'fs';
const pct = (a, f) => (a.length ? Math.round(a.filter(f).length / a.length * 100) : 0) + '%';
const med = (xs) => { const s = xs.filter((x) => x != null).sort((a, b) => a - b); return s.length ? s[s.length >> 1] : '—'; };
const avg = (xs) => (xs.length ? +(xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : '—');
const GR = ['S', 'A', 'B', 'C', 'D'];
export function report(rows) {
  const by = {}; rows.forEach((r) => (by[r.policy] = by[r.policy] || []).push(r));
  const head = ['metric', ...Object.keys(by)];
  const line = (name, f) => [name, ...Object.values(by).map(f)];
  const t = [
    line('weeks played', (a) => a.length),
    line('grades S/A/B/C/D', (a) => GR.map((g) => a.filter((r) => r.grade === g).length).join('/')),
    line('median grade', (a) => GR[med(a.map((r) => GR.indexOf(r.grade)))] || '—'),
    line('median score', (a) => med(a.map((r) => r.score))),
    line('grant submitted', (a) => pct(a, (r) => r.grantSubmitted)),
    line('grant funded', (a) => pct(a, (r) => r.grantOk)),
    line('paper accepted as is', (a) => pct(a, (r) => /直接接收/.test(r.paper))),
    line('Sunday wellbeing (median)', (a) => med(a.map((r) => r.wb))),
    line('weeks ending wellbeing < 40', (a) => pct(a, (r) => r.wb < 40)),
    line('collapses / week', (a) => avg(a.map((r) => r.collapses))),
    line('avg student trust (median)', (a) => med(a.map((r) => r.trust))),
    line('weeks with a student lost', (a) => pct(a, (r) => r.lost > 0)),
    line('home nights (avg)', (a) => avg(a.map((r) => r.homeNights))),
    line('lowest family meter (median)', (a) => med(a.map((r) => r.fam))),
    line('cash > 0 at month end', (a) => pct(a, (r) => r.cash > 0)),
    line('consequential choices / day', (a) => avg(a.map((r) => r.conseqPerDay))),
    line('events handled', (a) => pct([].concat(...a.map((r) => Array(r.events).fill(0).map((_, i) => i < r.done))), (x) => x)),
    line('first day energy < 30 (median)', (a) => med(a.map((r) => r.firstLowEnergyDay))),
    line('rank reached (max)', (a) => Math.max(...a.map((r) => r.rank))),
  ];
  const w = head.map((_, i) => Math.max(...[head, ...t].map((r) => String(r[i]).length)));
  const fmt = (r) => r.map((c, i) => String(c).padEnd(w[i])).join('  ');
  let s = fmt(head) + '\n' + w.map((n) => '-'.repeat(n)).join('  ') + '\n' + t.map(fmt).join('\n');
  // The test that matters: nobody beats "balanced" on both grade and wellbeing.
  if (by.balanced) {
    const b = by.balanced, bs = med(b.map((r) => r.score)), bw = med(b.map((r) => r.wb));
    const dom = Object.entries(by).filter(([k, a]) => k !== 'balanced' && med(a.map((r) => r.score)) > bs && med(a.map((r) => r.wb)) > bw).map(([k]) => k);
    s += `\n\ndominant-strategy test: ${dom.length ? 'FAIL — ' + dom.join(', ') + ' beats balanced on both score and wellbeing' : 'pass (no policy beats balanced on both median score and wellbeing)'}`;
  }
  return s;
}
if (process.argv[1] && process.argv[1].endsWith('report.mjs') && process.argv[2]) console.log(report(JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))));
