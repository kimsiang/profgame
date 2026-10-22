/* Badminton core (v10): shuttle physics, rules and opponent AI.
   Pure logic: no THREE, no DOM. index.html renders it; tools/bm_balance.js runs it in node for balance tests.
   Coordinates: metres. x across the court, z along it, y up. Side 'P' (player) is the near half z > net,
   side 'O' (opponent) the far half z < net. */
(function (root) {
  'use strict';
  const G = 9.81;
  const DEG = Math.PI / 180;
  const ORDER = ['perfect', 'good', 'fair', 'bad'];
  const sideSign = (s) => (s === 'P' ? 1 : -1);
  const other = (s) => (s === 'P' ? 'O' : 'P');

  function BMCore(D, opts) {
    const rnd = opts.rng || Math.random;
    const C = D.court, k = D.physics.drag, OP = D.opponents[opts.opp];
    const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const lerp = (a, b, t) => a + (b - a) * t;
    const energy = Math.max(0, Math.min(100, opts.energy == null ? 80 : opts.energy));
    const W = D.timing.find((w) => energy >= w.minEnergy) || D.timing[D.timing.length - 1];

    // Per-side movement and reach parameters. The player's running speed falls with energy.
    const PAR = {
      P: { speed: D.player.speed * (1 - D.player.speedEnergy * (1 - energy / 100)), reaction: D.player.reaction, reach: D.player.reach, maxY: D.player.maxY, minY: D.player.minY },
      O: { speed: OP.speed, reaction: OP.reaction, reach: OP.reach, maxY: OP.maxY, minY: D.player.minY },
    };

    /* ---------- physics ---------- */
    // Quadratic drag: a = g - k|v|v. Samples every 1/60 s. With net=true, a shuttle that crosses the net plane
    // below the tape stops there and drops on the hitter's side.
    function fly(p, v, net, h) {
      h = h || 1 / 240;
      const every = Math.max(1, Math.round(1 / 60 / h));
      let x = p.x, y = p.y, z = p.z, vx = v.x, vy = v.y, vz = v.z, t = 0, n = 0, netHit = false, netY = null;
      const pts = [{ t: 0, x, y, z, vx, vy, vz }];
      while (t < 8) {
        const s = Math.hypot(vx, vy, vz);
        vx -= k * s * vx * h; vy -= (G + k * s * vy) * h; vz -= k * s * vz * h;
        const pz = z, py = y;
        x += vx * h; y += vy * h; z += vz * h; t += h; n++;
        if (net && !netHit && (pz - C.net) * (z - C.net) < 0) {
          const f = (C.net - pz) / (z - pz), yn = py + (y - py) * f;
          netY = yn;
          if (yn < C.netH) { netHit = true; z = C.net + Math.sign(pz - C.net) * 0.06; vx = 0; vz = 0; vy = Math.min(vy, 0) * 0.3; }
        }
        if (y <= 0) { y = 0; pts.push({ t, x, y, z, vx, vy, vz }); break; }
        if (n % every === 0) pts.push({ t, x, y, z, vx, vy, vz });
      }
      return { pts, netHit, netY, land: pts[pts.length - 1] };
    }
    function landDist(p, dir, ang, spd) {
      const v = { x: dir.x * Math.cos(ang) * spd, y: Math.sin(ang) * spd, z: dir.z * Math.cos(ang) * spd };
      const l = fly(p, v, false, 1 / 120).land;
      return Math.hypot(l.x - p.x, l.z - p.z);
    }
    // Launch velocity that lands at (tx, tz). Fixed angle → search speed; fixed speed (smash) → search angle.
    function solve(p, tx, tz, shot, spdFixed) {
      const dx = tx - p.x, dz = tz - p.z, dist = Math.hypot(dx, dz) || 0.01, dir = { x: dx / dist, z: dz / dist };
      let ang = shot.angle * DEG, spd;
      if (spdFixed) {
        let lo = -40 * DEG, hi = 12 * DEG; spd = spdFixed;
        for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (landDist(p, dir, mid, spd) < dist) lo = mid; else hi = mid; }
        ang = (lo + hi) / 2;
      } else {
        let lo = 1, hi = 110;
        if (landDist(p, dir, ang, hi) < dist) spd = hi;
        else { for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (landDist(p, dir, ang, mid) < dist) lo = mid; else hi = mid; } spd = (lo + hi) / 2; }
      }
      return { x: dir.x * Math.cos(ang) * spd, y: Math.sin(ang) * spd, z: dir.z * Math.cos(ang) * spd, spd, ang };
    }
    const inBounds = (pt, side) => Math.abs(pt.x - C.cx) <= C.sx + 0.02 && (pt.z - C.net) * sideSign(side) > 0 && Math.abs(pt.z - C.net) <= C.len + 0.02;

    /* ---------- match state ---------- */
    const base = (s) => ({ x: C.cx, z: C.net + sideSign(s) * 3.4 });
    const mkCh = (s) => { const b = base(s); return { x: b.x, z: b.z, tx: b.x, tz: b.z, mvT: 0, moving: false, swingT: -9 }; };
    const m = {
      t: 0, phase: 'serve', score: { P: 0, O: 0 }, server: 'P', ch: { P: mkCh('P'), O: mkCh('O') },
      fl: null, inc: null, phaseT: 0, ev: [], W, energy, opp: opts.opp,
      stats: { shots: 0, perfect: 0, smashes: 0, smashWin: 0, rally: 0, longest: 0, rallies: 0, misses: 0 },
    };
    const emit = (e) => m.ev.push(e);

    function flightPos(t) {
      const f = m.fl; if (!f) return null;
      const u = Math.max(0, (t - f.t0) * 60), i = Math.floor(u), P = f.pts;
      if (i >= P.length - 1) return P[P.length - 1];
      const a = P[i], b = P[i + 1], r = u - i;
      return { t: a.t + (b.t - a.t) * r, x: lerp(a.x, b.x, r), y: lerp(a.y, b.y, r), z: lerp(a.z, b.z, r), vx: lerp(a.vx, b.vx, r), vy: lerp(a.vy, b.vy, r), vz: lerp(a.vz, b.vz, r) };
    }
    function clampHalf(c, s) {
      const sg = sideSign(s);
      c.tx = Math.max(C.cx - C.sx - 0.6, Math.min(C.cx + C.sx + 0.6, c.tx));
      const dz = Math.max(0.5, Math.min(C.len + 0.8, (c.tz - C.net) * sg)); c.tz = C.net + dz * sg;
    }

    // Who receives the flight, where and when they can meet it, and whether they get there in time.
    function plan(recv) {
      const f = m.fl, R = m.ch[recv], P = PAR[recv], sg = sideSign(recv);
      if (f.netHit) { m.inc = { recv, none: true, done: true }; return; }
      let best = null, need = 0, last = null;
      for (const p of f.pts) {
        if ((p.z - C.net) * sg <= 0.05 || p.y < P.minY) continue;
        last = p;
        if (p.y > P.maxY) continue;
        const d = Math.max(0, Math.hypot(p.x - R.x, p.z - R.z) - P.reach);
        need = P.reaction + d / P.speed;
        if (need <= p.t) { best = p; break; }
      }
      const reach = !!best; if (!best) best = last || f.land;
      m.inc = { recv, c: { t: f.t0 + best.t, x: best.x, y: best.y, z: best.z, vx: best.vx, vy: best.vy, vz: best.vz, reach, margin: reach ? best.t - need : -1 }, done: false, out: !inBounds(f.land, recv) };
      // Stand so the shuttle meets the racket a little in front, on the forehand side.
      R.tx = best.x + 0.35; R.tz = best.z + sg * 0.35; clampHalf(R, recv); R.mvT = m.t + P.reaction;
    }

    function hit(side, shotId, q, o) {
      o = o || {};
      const S = D.shots[shotId], Q = D.quality[q], sg = sideSign(side), recv = other(side), R = m.ch[recv];
      const from = o.from || flightPos(m.t);
      const deep = shotId === 'clear' || shotId === 'lift' || shotId === 'high';
      let depth = lerp(S.depth[0], S.depth[1], rnd()) - Q.short * (deep ? 1 : 0.3);
      let tx;
      if (o.tx != null) tx = o.tx;
      else if (o.aim) tx = C.cx + o.aim * S.width * (0.8 + 0.2 * rnd());
      else { const away = R.x >= C.cx ? -1 : 1; tx = C.cx + away * S.width * (0.55 + 0.45 * rnd()); }
      const smashSpd = shotId === 'smash' ? (o.power || 1) * { perfect: 72, good: 60, fair: 46, bad: 40 }[q] : 0;
      // Intended aim: the noise-free shot must clear the tape by a margin. Lift the angle (or, for a smash,
      // aim deeper) until it does.
      let ang = S.angle;
      for (let i = 0; i < 10; i++) {
        const tr = fly(from, solve(from, tx, C.net - sg * depth, Object.assign({}, S, { angle: ang }), smashSpd), true, 1 / 120);
        if (!tr.netHit && tr.netY != null && tr.netY - C.netH >= D.netMargin) break;
        if (smashSpd || ang > 55) depth = Math.min(C.len - 0.4, depth + 0.6); else ang += 4;
      }
      // Execution error grows as the timing gets worse.
      const etx = tx + gauss() * Q.err, etz = C.net - sg * Math.max(0.2, depth + gauss() * Q.err * 0.8);
      const v = solve(from, etx, etz, Object.assign({}, S, { angle: ang + gauss() * { perfect: 0.4, good: 0.9, fair: 2, bad: 4 }[q] }), smashSpd);
      const f = fly(from, v, true);
      m.fl = Object.assign(f, { t0: m.t, hitter: side, shot: shotId, q, speed: v.spd });
      m.stats.rally++;
      if (side === 'P') { m.stats.shots++; if (q === 'perfect') m.stats.perfect++; if (shotId === 'smash') m.stats.smashes++; }
      const H = m.ch[side]; H.swingT = m.t;
      // Recover toward base, shaded to the side the shuttle went.
      const b = base(side); H.tx = b.x + (etx - C.cx) * 0.3; H.tz = b.z; H.mvT = m.t + 0.25;
      emit({ type: 'hit', side, shot: shotId, q, speed: v.spd, serve: !!o.serve });
      plan(recv);
    }

    function down(q, n) { let i = ORDER.indexOf(q); i = Math.min(ORDER.length - 1, i + (n || 1)); return ORDER[i]; }
    function zoneOf(c) { return c.y >= D.overhead ? 'high' : (c.y < 1.1 && Math.abs(c.z - C.net) < D.netZone ? 'net' : 'mid'); }
    function pickW(w) { let s = 0; for (const k2 in w) s += w[k2]; let r = rnd() * s; for (const k2 in w) { r -= w[k2]; if (r <= 0) return k2; } return Object.keys(w)[0]; }

    function aiHit() {
      const c = m.inc.c, z = zoneOf(c), inSpd = Math.hypot(c.vx, c.vy, c.vz);
      let q = rnd() < OP.q.perfect ? 'perfect' : rnd() < OP.q.good / (1 - OP.q.perfect) ? 'good' : 'fair';
      if (rnd() < OP.errP) q = 'bad';
      if (c.margin < 0.12) q = down(q);
      let shot = pickW(OP.w[z]);
      if (inSpd > D.smashSpeed) { shot = rnd() < 0.6 ? 'netdrop' : 'lift'; q = down(q); }   // blocking a smash
      if (shot === 'netdrop' && Math.abs(c.z - C.net) > D.netZone + 1) shot = 'drop';
      hit('O', shot, q);
    }

    // Player gesture → shot, from the contact height and distance to the net.
    function shotFor(g, c) {
      const z = zoneOf(c), nearNet = Math.abs(c.z - C.net) < D.netZone;
      if (g === 'up') return { shot: c.y < 1.1 ? 'lift' : 'clear' };
      if (g === 'down') return { shot: c.y < 1.1 && nearNet ? 'netdrop' : 'drop' };
      if (g === 'left' || g === 'right') return { shot: c.y < 1.1 && nearNet ? 'push' : 'drive', aim: g === 'right' ? 1 : -1 };
      return { shot: z === 'high' ? 'smash' : 'push' };
    }

    /* ---------- serving ---------- */
    function setupServe() {
      const s = m.server, r = other(s), right = m.score[s] % 2 === 0, S = m.ch[s], R = m.ch[r];
      S.x = S.tx = C.cx + (right ? 0.75 : -0.75) * sideSign(s); S.z = S.tz = C.net + sideSign(s) * 2.5;
      R.x = R.tx = 2 * C.cx - S.x; R.z = R.tz = C.net + sideSign(r) * 3.2;
      m.fl = null; m.inc = null; m.phase = 'serve'; m.phaseT = m.t; m.stats.rally = 0;
      emit({ type: 'serveReady', side: s, right });
    }
    function serve(kind, q) {
      const s = m.server, S = m.ch[s], r = other(s), Rr = m.ch[r];
      const from = { x: S.x, y: 1.0, z: S.z - sideSign(s) * 0.35, vx: 0, vy: 0, vz: 0 };
      m.phase = 'rally'; m.stats.rallies++;
      hit(s, kind, q || 'good', { from, tx: Rr.x + (rnd() - 0.5) * 0.4, serve: true });
    }

    function pointTo(w, why) {
      m.score[w]++; m.phase = 'point'; m.phaseT = m.t; m.stats.longest = Math.max(m.stats.longest, m.stats.rally);
      if (m.fl && m.fl.hitter === 'P' && m.fl.shot === 'smash' && w === 'P') m.stats.smashWin++;
      m.server = w;
      for (const s of ['P', 'O']) { const b = base(s); m.ch[s].tx = b.x; m.ch[s].tz = b.z; m.ch[s].mvT = m.t + 0.6; }
      const a = m.score[w], b = m.score[other(w)];
      const over = (a >= D.match.points && a - b >= D.match.winBy) || a >= D.match.cap;
      emit({ type: 'point', winner: w, why, score: { P: m.score.P, O: m.score.O } });
      if (over) { m.phase = 'over'; m.winner = w; emit({ type: 'over', winner: w }); }
    }

    /* ---------- public ---------- */
    function swing(g) {
      if (m.phase === 'serve' && m.server === 'P') { serve(g === 'down' ? 'short' : 'high', 'good'); return { r: 'serve' }; }
      if (m.phase !== 'rally' || !m.inc || m.inc.recv !== 'P' || m.inc.done) return null;
      const c = m.inc.c, dt = m.t - c.t;
      if (dt < -W.fair) { if (dt < -0.7) return null; m.inc.done = true; m.stats.misses++; emit({ type: 'miss', side: 'P', why: 'early' }); return { r: 'early' }; }
      if (!c.reach) { m.inc.done = true; m.stats.misses++; emit({ type: 'miss', side: 'P', why: 'far' }); return { r: 'far' }; }
      let q = Math.abs(dt) <= W.perfect ? 'perfect' : Math.abs(dt) <= W.good ? 'good' : 'fair';
      if (Math.hypot(c.vx, c.vy, c.vz) > D.smashSpeed) q = down(q);   // a smash is hard to return cleanly
      if (c.margin < 0.05) q = down(q);
      const sf = shotFor(g, c);
      m.inc.done = true;
      hit('P', sf.shot, q, { aim: sf.aim });
      return { r: q, shot: sf.shot };
    }

    function update(dt) {
      m.t += dt;
      for (const s of ['P', 'O']) {
        const c = m.ch[s], sp = PAR[s].speed * (m.phase === 'point' ? 1.3 : 1);
        c.moving = false;
        if (m.t < c.mvT) continue;
        const dx = c.tx - c.x, dz = c.tz - c.z, d = Math.hypot(dx, dz);
        if (d > 0.03) { const st = Math.min(d, sp * dt); c.x += dx / d * st; c.z += dz / d * st; c.moving = true; }
      }
      if (m.phase === 'serve') {
        if (m.server === 'O' && m.t - m.phaseT > D.match.aiServeDelay) serve(rnd() < 0.55 ? 'short' : 'high', rnd() < OP.q.perfect ? 'perfect' : 'good');
      } else if (m.phase === 'rally') {
        const inc = m.inc;
        if (inc && !inc.done && inc.recv === 'O' && m.t >= inc.c.t) {
          inc.done = true;
          if (!inc.c.reach) emit({ type: 'miss', side: 'O', why: 'far' });
          else if (inc.out && rnd() < OP.leaveP) emit({ type: 'miss', side: 'O', why: 'leave' });
          else aiHit();
        }
        if (inc && !inc.done && inc.recv === 'P' && m.t > inc.c.t + W.fair) {
          inc.done = true;
          if (inc.out) emit({ type: 'miss', side: 'P', why: 'leave' });
          else { m.stats.misses++; emit({ type: 'miss', side: 'P', why: inc.c.reach ? 'late' : 'far' }); }
        }
        const f = m.fl;
        if (f && m.t >= f.t0 + f.land.t) {
          const H = f.hitter, X = other(H);
          if (f.netHit) pointTo(X, 'net');
          else if (inBounds(f.land, X)) pointTo(H, 'in');
          else pointTo(X, 'out');
        }
      } else if (m.phase === 'point') {
        if (m.t - m.phaseT > D.match.pointPause) setupServe();
      }
      const out = m.ev; m.ev = []; return out;
    }

    // Timing-ring info for the player: seconds until the ideal contact, and the windows.
    function ring() {
      const inc = m.inc;
      if (m.phase !== 'rally' || !inc || inc.none || inc.recv !== 'P' || inc.done) return null;
      return { left: inc.c.t - m.t, reach: inc.c.reach, out: inc.out, W, c: inc.c };
    }

    setupServe();
    m.ev = [];
    return { m, swing, update, ring, pos: () => (m.fl ? flightPos(m.t) : null), W, PAR, inBounds, shotFor, D };
  }

  // Win probability for "just play it out", interpolated on energy (numbers come from the balance runs).
  BMCore.autoWin = (D, opp, energy) => { const a = D.autoWin[opp]; return a.e0 + (a.e100 - a.e0) * Math.max(0, Math.min(100, energy)) / 100; };

  if (typeof module !== 'undefined' && module.exports) module.exports = BMCore;
  else root.BMCore = BMCore;
})(typeof window !== 'undefined' ? window : this);
