// Balance runs for the v10 badminton match: a bot swings with human-like timing noise.
// Usage: node tools/bm_balance.js [matches=200] [sigma=0.085]
const BMCore = require('../assets/js/badminton.js');
const D = require('../assets/data/badminton.json');
const N = +process.argv[2] || 200, SIG = +process.argv[3] || 0.085;

function rngFrom(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

function play(opp, energy, seed) {
  const r = rngFrom(seed), core = BMCore(D, { opp, energy, rng: rngFrom(seed * 7 + 1) });
  let plan = null, serveAt = null, t = 0, swings = 0, perfect = 0;
  const dt = 1 / 60;
  while (core.m.phase !== 'over' && t < 900) {
    const m = core.m;
    if (m.phase === 'serve' && m.server === 'P') { if (serveAt == null) serveAt = m.t + 0.6; if (m.t >= serveAt) { core.swing(r() < 0.3 ? 'down' : 'up'); serveAt = null; } }
    const rg = core.ring();
    if (rg && !plan) {
      if (rg.out && r() < 0.7) plan = { skip: true, inc: m.inc };
      else {
        const c = rg.c, high = c.y >= D.overhead, net = c.y < 1.1 && Math.abs(c.z - D.court.net) < D.netZone;
        const x = r(); const g = high ? (x < 0.4 ? 'tap' : x < 0.75 ? 'up' : 'down') : net ? (x < 0.6 ? 'down' : 'up') : (x < 0.4 ? (r() < 0.5 ? 'left' : 'right') : x < 0.8 ? 'up' : 'down');
        plan = { at: c.t + gauss(r) * SIG, g, inc: m.inc };
      }
    }
    if (plan && plan.inc !== m.inc) plan = null;
    if (plan && !plan.skip && m.t >= plan.at) { const res = core.swing(plan.g); if (res) { swings++; if (res.r === 'perfect') perfect++; } plan.skip = true; }
    core.update(dt); t += dt;
  }
  return { win: core.m.winner === 'P', P: core.m.score.P, O: core.m.score.O, t: core.m.t, longest: core.m.stats.longest, perfect, swings, rallies: core.m.stats.rallies };
}

for (const opp of Object.keys(D.opponents)) {
  for (const e of [95, 70, 50, 25]) {
    let w = 0, secs = 0, pts = 0, rl = 0, pf = 0, sw = 0;
    for (let i = 0; i < N; i++) { const o = play(opp, e, 1000 + i); w += o.win; secs += o.t; pts += o.P + o.O; rl += o.longest; pf += o.perfect; sw += o.swings; }
    console.log(`${opp.padEnd(7)} energy ${String(e).padStart(3)}: win ${(w / N * 100).toFixed(0).padStart(3)}%  match ${(secs / N).toFixed(0)} s  points ${(pts / N).toFixed(1)}  longest rally ${(rl / N).toFixed(1)}  perfect ${(pf / Math.max(1, sw) * 100).toFixed(0)}%`);
  }
}
