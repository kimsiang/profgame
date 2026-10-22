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
    const C = D.court, k = D.physics.drag, OP = D.opponents[opts.opp || 'aqiang'];
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
      fl: null, inc: null, phaseT: 0, ev: [], W, energy, opp: opts.opp, drill: null,
      stats: { shots: 0, perfect: 0, smashes: 0, smashWin: 0, rally: 0, longest: 0, rallies: 0, misses: 0 },
      log: [],      // every shot: who, what, where it landed, under how much pressure, tactical tags
      points: [],   // every rally: who won, how, and whose error it was
      timing: [],   // the player's swing offsets from the ideal moment (s; negative = early)
      tags: {},     // tag id -> count, player shots only
      oppPat: {},   // opponent pattern id -> count
    };
    const emit = (e) => { if (e.type === 'miss') m.lastMiss = e; m.ev.push(e); };

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
    // o.bonus = { maxY, reach } for a jump (中国跳); replanning mid-flight starts from "now" with no reaction delay.
    function plan(recv, o) {
      o = o || {};
      const f = m.fl, R = m.ch[recv], P = PAR[recv], sg = sideSign(recv), now = m.t - f.t0;
      if (f.netHit) { m.inc = { recv, none: true, done: true }; return; }
      const jump = recv === 'O' && OP.jumpY ? OP.jumpY : 0;   // an opponent who China-jumps meets the shuttle higher
      const maxY = P.maxY + jump + (o.bonus ? o.bonus.maxY : 0), reachR = P.reach + (o.bonus ? o.bonus.reach : 0);
      let react = o.replan ? 0.05 : P.reaction;
      if (o.fake) react += D.fakeDelay;   // a disguised shot: the receiver starts late
      if (recv === 'P' && m.stumble && !o.replan) { react += D.footwork.stumbleDelay; m.stumble = false; }
      let best = null, need = 0, last = null;
      for (const p of f.pts) {
        if (p.t < now + 0.03 || (p.z - C.net) * sg <= 0.05 || p.y < P.minY) continue;
        last = p;
        if (p.y > maxY) continue;
        const d = Math.max(0, Math.hypot(p.x - R.x, p.z - R.z) - reachR);
        need = now + react + d / P.speed;
        if (need <= p.t) { best = p; break; }
      }
      const reach = !!best; if (!best) best = last || f.land;
      const keep = o.replan && m.inc ? { foot: m.inc.foot } : {};
      m.inc = Object.assign({ recv, c: { t: f.t0 + best.t, x: best.x, y: best.y, z: best.z, vx: best.vx, vy: best.vy, vz: best.vz, reach, margin: reach ? best.t - need : -1 }, done: false, out: !inBounds(f.land, recv) }, keep);
      // Stand so the shuttle meets the racket a little in front, on the forehand side.
      R.tx = best.x + 0.35; R.tz = best.z + sg * 0.35; clampHalf(R, recv); R.mvT = m.t + P.reaction;
    }

    function hit(side, shotId, q, o) {
      o = o || {};
      const S = D.shots[shotId], Q = D.quality[q], sg = sideSign(side), recv = other(side), R = m.ch[recv];
      const from = o.from || flightPos(m.t);
      const deep = shotId === 'clear' || shotId === 'lift' || shotId === 'high';
      let depth = o.depth != null ? o.depth : lerp(S.depth[0], S.depth[1], rnd()) - Q.short * (deep ? 1 : 0.3);
      let tx;
      if (o.tx != null) tx = o.tx;
      else if (o.aim) tx = C.cx + o.aim * S.width * (0.8 + 0.2 * rnd());
      else { const away = R.x >= C.cx ? -1 : 1; tx = C.cx + away * S.width * (0.55 + 0.45 * rnd()); }
      const smashSpd = shotId === 'smash' ? (o.power || 1) * (side === 'O' && OP.power ? OP.power : 1) * { perfect: 72, good: 60, fair: 46, bad: 40 }[q] : 0;
      // Intended aim: the noise-free shot must clear the tape by a margin. Lift the angle (or, for a smash,
      // aim deeper) until it does.
      let ang = o.angle != null ? o.angle : S.angle;
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
      const prevInc = m.inc, margin = o.serve || !prevInc || !prevInc.c ? 9 : prevInc.c.margin;
      const inSpd = o.serve || !prevInc || !prevInc.c ? 0 : Math.hypot(prevInc.c.vx, prevInc.c.vy, prevInc.c.vz);
      const rec = { side, shot: shotId, q, serve: !!o.serve, from: { x: from.x, y: from.y, z: from.z }, land: { x: f.land.x, z: f.land.z }, net: f.netHit,
        margin, inSpd, opp: { x: R.x, z: R.z }, foot: o.foot || null, pat: o.pat || null, tags: o.footTag ? [o.footTag] : [] };
      if (o.footTag && side === 'P') m.tags[o.footTag] = (m.tags[o.footTag] || 0) + 1;
      if (o.pat && side === 'O') m.oppPat[o.pat] = (m.oppPat[o.pat] || 0) + 1;
      tagShot(rec);
      m.log.push(rec); m.fl.rec = rec;
      m.stats.rally++;
      if (side === 'P') { m.stats.shots++; if (q === 'perfect') m.stats.perfect++; if (shotId === 'smash') m.stats.smashes++; }
      const H = m.ch[side]; H.swingT = m.t;
      // Recover toward base, shaded to the side the shuttle went.
      const b = base(side); H.tx = b.x + (etx - C.cx) * 0.3; H.tz = b.z; H.mvT = m.t + 0.25;
      if (o.follow) H.tz = C.net + sg * 2.2;   // smash and follow in to the net
      emit({ type: 'hit', side, shot: shotId, q, speed: v.spd, serve: !!o.serve, tags: rec.tags, foot: o.foot || null });
      plan(recv, { fake: !!o.fake });
    }

    /* ---------- tactical tags (thresholds in D.tactics.rules) ---------- */
    const T = (D.tactics && D.tactics.rules) || {};
    const par = (id, k, d) => (T[id] && T[id][k] != null ? T[id][k] : d);
    function lastOf(side, before) { for (let i = m.log.length - 1; i >= 0; i--) { const r = m.log[i]; if (r === before) continue; if (r.side === side) return r; } return null; }
    function tagShot(r) {
      if (r.serve) return;
      const sg = sideSign(r.side), add = (id) => { r.tags.push(id); if (r.side === 'P') m.tags[id] = (m.tags[id] || 0) + 1; };
      const depthLand = Math.abs(r.land.z - C.net), depthFrom = Math.abs(r.from.z - C.net);
      const prev = lastOf(r.side, r);
      if (prev && !prev.net && (Math.abs(prev.land.z - r.land.z) >= par('spread', 'dz', 3) || Math.abs(prev.land.x - r.land.x) >= par('spread', 'dx', 3))) add('spread');
      if (Math.hypot(r.land.x - r.opp.x, r.land.z - r.opp.z) >= par('space', 'dist', 2.5)) add('space');
      if (r.margin < par('transition', 'margin', 0.2) && (r.shot === 'lift' || r.shot === 'clear') && depthLand >= par('transition', 'depth', 5)) add('transition');
      if (r.shot === 'smash' && depthFrom > par('risky', 'depth', 5) && r.margin < par('risky', 'margin', 0.25)) add('risky');
      // Backhand rear corner of a right-handed receiver: their left. Facing +z (far side) that is +x; facing -z, -x.
      if (depthLand >= par('backhand', 'depth', 4.5) && (r.land.x - C.cx) * sg > par('backhand', 'x', 1.0)) add('backhand');
      // Smash, then follow in: this shot is at the net and the player's previous shot was a smash.
      if (prev && prev.shot === 'smash' && depthFrom < D.netZone) add('smashNet');
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
      // Tactical patterns (opponents[].tactics): probabilities, tried in this order.
      const tac = OP.tactics || {}, P = m.ch.P, o = {}, nearNet = Math.abs(c.z - C.net) < D.netZone;
      const last = m.log.length ? m.log[m.log.length - 1] : null;
      if (inSpd <= D.smashSpeed) {
        if (last && last.side === 'P' && m.log.length > 1 && m.log[m.log.length - 2].side === 'O' && m.log[m.log.length - 2].shot === 'smash' && tac.smashNet && nearNet) {
          shot = rnd() < 0.6 ? 'push' : 'netdrop'; o.pat = 'smashNet';      // the kill after the smash
        } else if (tac.backhand && rnd() < tac.backhand) {
          shot = c.y >= D.overhead ? 'clear' : 'lift'; o.tx = C.cx - 2.15; o.depth = 6.1; o.pat = 'backhand';   // player's rear backhand (-x)
        } else if (tac.spread && rnd() < tac.spread) {
          const deep = Math.abs(P.z - C.net) > 3.8; o.tx = C.cx + (P.x >= C.cx ? -1 : 1) * 1.9; o.pat = 'spread';
          shot = deep ? (nearNet && c.y < 1.1 ? 'netdrop' : 'drop') : (c.y >= 1.1 ? 'clear' : 'lift');
        }
        if (tac.fake && rnd() < tac.fake) {
          o.fake = true; o.pat = o.pat || 'fake';
          if (!o.tx) o.tx = C.cx + (P.x >= C.cx ? 1 : -1) * 1.8;               // sudden change of line: to the side the player is on
          if (shot === 'clear') shot = 'drop'; else if (shot === 'smash' && rnd() < 0.5) shot = 'drop';
        }
      }
      if (shot === 'smash' && tac.smashNet && rnd() < tac.smashNet) o.follow = true;
      if (shot === 'smash' && !o.pat) o.pat = c.y > OP.maxY - 0.05 && OP.jumpY ? 'jumpSmash' : null;
      o.pat = o.pat || null;
      hit('O', shot, q, o);
    }

    // Player gesture → shot, from the contact height and distance to the net.
    // Gestures: up / down / left / right / tap, and the diagonals upleft, upright, downleft, downright.
    // A diagonal (or left/right) fixes the side the shuttle goes to (x sign as seen from the player); straight up or
    // down plays to the open space automatically.
    function shotFor(g, c) {
      const z = zoneOf(c), nearNet = Math.abs(c.z - C.net) < D.netZone;
      const aim = /left$/.test(g) ? -1 : /right$/.test(g) ? 1 : 0;
      if (g === 'left' || g === 'right') return { shot: c.y < 1.1 && nearNet ? 'push' : 'drive', aim };
      if (/^up/.test(g)) return { shot: c.y < 1.1 ? 'lift' : 'clear', aim };
      if (/^down/.test(g)) return { shot: c.y < 1.1 && nearNet ? 'netdrop' : 'drop', aim };
      return { shot: z === 'high' ? 'smash' : 'push', aim };
    }

    /* ---------- rear-court footwork: 并步 (default) · 马来步 · 中国跳 ----------
       马来步: turn the body, take the round-the-head (头顶区) ball on the forehand. Needs time (margin).
       中国跳: no turn, one-foot take-off, intercept earlier and higher. Costs energy; tired legs may land badly.
       Right-handed player on the near side faces -z, so the backhand / round-the-head side is -x. */
    const FW = D.footwork;
    const rearOf = (c) => Math.abs(c.z - C.net) >= FW.rearDepth && c.y >= D.overhead - 0.35;
    const headSide = (c) => c.x - C.cx < -FW.headX;
    function prep(foot) {
      const inc = m.inc;
      if (m.phase !== 'rally' || !inc || inc.recv !== 'P' || inc.done || !inc.c || inc.foot) return null;
      if (Math.abs(inc.c.z - C.net) < FW.rearDepth) return { r: 'front' };
      if (inc.c.t - m.t < FW.prepLead) return { r: 'late' };
      inc.foot = foot;
      if (foot === 'china') {
        m.chinaUses = (m.chinaUses || 0) + 1;
        plan('P', { replan: true, bonus: { maxY: FW.chinaY, reach: FW.chinaReach } });
      }
      return { r: 'ok', foot };
    }
    function footwork(c, q, shot) {
      const foot = m.inc.foot || null, out = { q, power: 1, foot, tag: null, note: null };
      if (!rearOf(c)) { if (foot) out.note = 'front'; return out; }
      if (!foot) { if (headSide(c)) { out.q = down(q); out.power = FW.backhandPower; out.note = 'backhand'; } return out; }
      if (foot === 'malay') {
        if (c.margin < FW.malayMargin) { out.q = down(q, 2); out.tag = 'footBad'; out.note = 'noTime'; }
        else if (!headSide(c)) { out.tag = 'footWaste'; out.note = 'forehand'; }
        else { out.power = FW.malayPower; out.tag = 'footGood'; }
      } else {
        const e = energy - FW.chinaEnergy * (m.chinaUses || 0);
        out.power = FW.chinaPower; out.tag = 'footChina';
        if (e < FW.tiredEnergy) { out.tag = 'footTired'; if (rnd() < FW.stumbleP) { m.stumble = true; out.note = 'stumble'; } }
      }
      return out;
    }

    /* ---------- training drills: a feeder plays one ball at a time (data: badminton-drills.json) ---------- */
    const DR = opts.drill ? Object.assign({ i: 0, score: 0, max: 0, results: [], cur: null }, { def: opts.drill }) : null;
    function drillFeed() {
      const d = DR.def, tag = d.order[DR.i % d.order.length], fd = d.feeds.find((f) => f.tag === tag), O = m.ch.O, P = m.ch.P;
      const fr = fd.from || { dx: 0, y: fd.shot === 'lift' ? 0.9 : 2.4, depth: fd.shot === 'lift' ? 2.2 : 4.8 };
      O.x = O.tx = C.cx - fr.dx; O.z = O.tz = C.net - fr.depth;   // feeder faces the player: its dx is mirrored
      const b = base('P'); P.tx = b.x; P.tz = b.z;
      DR.cur = { tag, i: DR.i }; m.phase = 'rally'; m.stats.rallies++; m.stats.rally = 0;
      hit('O', fd.shot, 'perfect', { from: { x: O.x, y: fr.y, z: O.z + 0.35 }, tx: C.cx + fd.dx, depth: fd.depth, angle: fd.angle != null ? fd.angle : undefined, serve: false });
      emit({ type: 'feed', i: DR.i, tag });
    }
    function drillLand(f) {
      const d = DR.def, r = f.rec, res = { i: DR.i, tag: DR.cur.tag, ok: false, pts: 0, q: null, foot: null, shot: null, why: null };
      if (f.hitter === 'P') {
        res.q = f.q; res.shot = f.shot; res.foot = r && r.foot; res.tags = r ? r.tags : [];
        res.ok = !f.netHit && inBounds(f.land, 'O'); res.why = f.netHit ? 'net' : res.ok ? 'in' : 'out';
        if (res.ok) res.pts = (d.points[f.q] || 0) + (d.bonus[res.tag + ':' + res.foot] || 0) + (d.bonus['shot:' + f.shot] || 0);
      } else res.why = m.lastMiss && m.lastMiss.side === 'P' ? m.lastMiss.why : 'miss';
      DR.results.push(res); DR.score += res.pts; DR.i++; m.lastMiss = null;
      m.phase = 'feed'; m.phaseT = m.t;
      emit({ type: 'drillBall', res, score: DR.score });
      if (DR.i >= d.balls) { m.phase = 'over'; m.winner = null; emit({ type: 'over', drill: true }); }
    }
    if (DR) { const d = DR.def, best = Math.max(...Object.values(d.points)) + Math.max(0, ...Object.values(d.bonus)); DR.max = best * d.balls; }

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

    // Whose point, and why: a winner, an unforced error (no pressure), a forced error, or a timing miss.
    function classify(w, why) {
      const f = m.fl, r = f && f.rec, loser = other(w);
      let kind, by;
      if (why === 'in') {
        const miss = m.lastMiss && m.lastMiss.side === loser ? m.lastMiss.why : 'far';
        by = miss === 'far' ? w : loser; kind = miss === 'far' ? 'winner' : 'timing';
      } else {
        by = r ? r.side : loser;
        const calm = r && r.margin >= par('unforced', 'margin', 0.25) && r.inSpd < D.smashSpeed;
        kind = calm ? 'unforced' : 'forced';
      }
      return { w, why, by, kind, shot: r ? r.shot : null, rally: m.stats.rally, rec: r || null, miss: m.lastMiss ? m.lastMiss.why : null };
    }
    function pointTo(w, why) {
      m.points.push(classify(w, why)); m.lastMiss = null;
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
      if (dt < -W.fair) { if (dt < -0.7 || g === 'tap') return null; m.timing.push(dt); m.inc.done = true; m.stats.misses++; emit({ type: 'miss', side: 'P', why: 'early' }); return { r: 'early' }; }
      if (!c.reach) { m.inc.done = true; m.stats.misses++; emit({ type: 'miss', side: 'P', why: 'far' }); return { r: 'far' }; }
      m.timing.push(dt);
      let q = Math.abs(dt) <= W.perfect ? 'perfect' : Math.abs(dt) <= W.good ? 'good' : 'fair';
      if (Math.hypot(c.vx, c.vy, c.vz) > D.smashSpeed) q = down(q);   // a smash is hard to return cleanly
      if (c.margin < 0.05) q = down(q);
      const sf = shotFor(g, c), fw = footwork(c, q, sf.shot);
      m.inc.done = true;
      hit('P', sf.shot, fw.q, { aim: sf.aim || 0, power: fw.power, foot: fw.foot, footTag: fw.tag });
      return { r: fw.q, shot: sf.shot, foot: fw.foot, footNote: fw.note };
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
      if (m.phase === 'feed') {
        if (m.t - m.phaseT > DR.def.gap) drillFeed();
      } else if (m.phase === 'serve') {
        if (m.server === 'O' && m.t - m.phaseT > D.match.aiServeDelay) serve(rnd() < 0.55 ? 'short' : 'high', rnd() < OP.q.perfect ? 'perfect' : 'good');
      } else if (m.phase === 'rally') {
        const inc = m.inc;
        if (DR && inc && inc.recv === 'O') inc.done = true;   // the feeder never returns
        if (inc && !inc.done && inc.recv === 'O' && m.t >= inc.c.t) {
          inc.done = true;
          if (!inc.c.reach) emit({ type: 'miss', side: 'O', why: 'far' });
          else if (inc.out && rnd() < OP.leaveP) emit({ type: 'miss', side: 'O', why: 'leave' });
          else aiHit();
        }
        if (inc && !inc.done && inc.recv === 'P' && m.t > inc.c.t + W.fair) {
          inc.done = true;
          if (inc.out) emit({ type: 'miss', side: 'P', why: 'leave' });
          else { m.stats.misses++; if (inc.c.reach) m.timing.push(W.fair + 0.05); emit({ type: 'miss', side: 'P', why: inc.c.reach ? 'late' : 'far' }); }
        }
        const f = m.fl;
        if (f && DR && m.t >= f.t0 + f.land.t) drillLand(f);
        else if (f && m.t >= f.t0 + f.land.t) {
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
      return { left: inc.c.t - m.t, reach: inc.c.reach, out: inc.out, W, c: inc.c, foot: inc.foot || null, rear: Math.abs(inc.c.z - C.net) >= FW.rearDepth };
    }

    if (DR) { m.drill = DR; m.phase = 'feed'; m.phaseT = m.t - DR.def.gap + 1.6; m.ch.P.x = m.ch.P.tx; } else setupServe();
    m.ev = [];
    return { m, swing, prep, update, ring, pos: () => (m.fl ? flightPos(m.t) : null), W, PAR, inBounds, shotFor, D };
  }

  /* Post-match review: one headline finding, evidence, two cues. Pure: takes the finished match state. */
  BMCore.review = (m, D, lang) => {
    const T = D.tactics || { rules: {}, cues: {}, findings: {}, words: {} }, L = lang === 'en' ? 'en' : 'zh';
    const fill = (tpl, o) => tpl.replace(/\{(\w+)\}/g, (_, k) => (o[k] != null ? o[k] : ''));
    const pts = m.points, lost = pts.filter((p) => p.w === 'O'), won = pts.filter((p) => p.w === 'P');
    const unforced = pts.filter((p) => p.by === 'P' && p.kind === 'unforced'), forced = pts.filter((p) => p.by === 'P' && p.kind === 'forced');
    const timingMiss = pts.filter((p) => p.by === 'P' && p.kind === 'timing'), far = pts.filter((p) => p.w === 'O' && p.kind === 'winner');
    const winners = pts.filter((p) => p.w === 'P' && p.kind === 'winner');
    const tm = m.timing, n = tm.length, mean = n ? tm.reduce((a, b) => a + b, 0) / n : 0;
    const sd = n > 1 ? Math.sqrt(tm.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (n - 1)) : 0;
    const shots = m.log.filter((r) => r.side === 'P' && !r.serve).length, tags = m.tags;
    const mode = (arr, f) => { const c = {}; arr.forEach((x) => { const k = f(x); c[k] = (c[k] || 0) + 1; }); return Object.keys(c).sort((a, b) => c[b] - c[a])[0]; };
    const items = [], cue = (id) => { const r = T.rules[id] || T.cues[id] || (T.counters && T.counters[id]); return r ? { id, text: r['cue_' + L] || r[L] } : null; };
    if (unforced.length >= 2 && unforced.length / Math.max(1, lost.length) >= 0.35) {
      const shot = mode(unforced, (p) => p.shot), why = mode(unforced, (p) => p.why);
      items.push({ id: 'unforced', text: fill(T.findings.unforced[L], { lost: lost.length, n: unforced.length, shot: (D.shots[shot] || {})[L] || shot, why: (T.words[why] || {})[L] || why }),
        cues: [shot === 'smash' && (tags.risky || 0) > 0 ? 'risky' : why === 'net' ? 'netClear' : 'inside'] });
    }
    if (n >= 5 && Math.abs(mean) >= 0.05) items.push({ id: 'timing', text: fill(T.findings.timing[L], { dir: (T.words[mean < 0 ? 'early' : 'late'] || {})[L], ms: Math.round(Math.abs(mean) * 1000) }), cues: ['shadow'] });
    if (far.length >= 3) items.push({ id: 'far', text: fill(T.findings.far[L], { n: far.length }), cues: ['transition', 'base'] });
    if (shots >= 8 && (tags.spread || 0) / shots < 0.25) items.push({ id: 'spread', text: fill(T.findings.spread[L], { shots, n: tags.spread || 0 }), cues: ['spread'] });
    if ((tags.footBad || 0) >= 2) items.push({ id: 'footBad', text: fill(T.findings.footBad[L], { n: tags.footBad }), cues: ['footBad'] });
    if ((tags.footTired || 0) >= 2) items.push({ id: 'footTired', text: fill(T.findings.footTired[L], { n: tags.footTired }), cues: ['footTired'] });
    if (!items.length || winners.length >= 2 && won.length >= lost.length) items.push({ id: 'good', text: fill(T.findings.good[L], { w: winners.length, n: unforced.length }), cues: [(tags.backhand || 0) < 2 ? 'backhand' : 'smashNet', 'space'] });
    // What the opponent did to you: their patterns, and how many of your lost points each one won.
    const oppPat = m.oppPat || {}, patWins = {};
    pts.forEach((p) => { if (p.w === 'O' && p.rec && p.rec.side === 'O' && p.rec.pat) patWins[p.rec.pat] = (patWins[p.rec.pat] || 0) + 1; });
    const topPat = Object.keys(patWins).sort((a, b) => patWins[b] - patWins[a])[0];
    if (topPat && patWins[topPat] >= 2 && T.patterns && T.patterns[topPat]) items.splice(Math.min(1, items.length), 0, { id: 'opp_' + topPat, text: fill(T.findings.opp[L], { pat: T.patterns[topPat][L], n: patWins[topPat] }), cues: ['vs_' + topPat] });
    // Cues: the first cue of each finding first (so the counter to the opponent's pattern makes the cut), then the rest.
    const cues = [], addC = (c) => { if (!cues.find((x) => x.id === c)) { const q = cue(c); if (q) cues.push(q); } };
    items.forEach((it) => addC(it.cues[0])); items.forEach((it) => it.cues.slice(1).forEach(addC));
    // Court map: every shot's landing point, coloured by what that shot did.
    const end = new Set(pts.map((p) => p.rec).filter(Boolean));
    const dots = m.log.filter((r) => !r.serve).map((r) => {
      const p = end.has(r) ? pts.find((q) => q.rec === r) : null;
      return { side: r.side, x: r.land.x, z: r.land.z, net: r.net, kind: p ? (p.w === r.side ? 'win' : 'err') : 'rally' };
    });
    return {
      headline: items[0].text, items, cues: cues.slice(0, 2),
      nums: { won: won.length, lost: lost.length, winners: winners.length, unforced: unforced.length, forced: forced.length, timingMiss: timingMiss.length, far: far.length,
        meanMs: Math.round(mean * 1000), sdMs: Math.round(sd * 1000), swings: n, longest: m.stats.longest, perfect: m.stats.perfect, shots,
        malay: (tags.footGood || 0) + (tags.footBad || 0) + (tags.footWaste || 0), china: (tags.footChina || 0) + (tags.footTired || 0), chinaUses: m.chinaUses || 0 },
      tags, dots, oppPat, patWins,
    };
  };

  /* Drill summary: score, the most useful tip, and counts. */
  BMCore.drillReview = (m, lang) => {
    const L = lang === 'en' ? 'en' : 'zh', DR = m.drill, d = DR.def, R = DR.results, tips = d['tips_' + L];
    const ok = R.filter((r) => r.ok).length, tm = m.timing, mean = tm.length ? tm.reduce((a, b) => a + b, 0) / tm.length : 0;
    let tip = tips.good;
    if (d.bonus['slow:malay'] != null) {
      const malayFast = R.filter((r) => r.tag === 'fast' && r.foot === 'malay').length, chinaSlow = R.filter((r) => r.tag === 'slow' && r.foot === 'china').length, none = R.filter((r) => !r.foot).length;
      tip = malayFast >= 2 ? tips.malayFast : none >= 4 ? tips.none : chinaSlow >= 2 ? tips.chinaSlow : tips.good;
      return { score: DR.score, max: DR.max, ok, balls: d.balls, tip, right: R.filter((r) => (r.tag === 'slow' && r.foot === 'malay') || (r.tag === 'fast' && r.foot === 'china')).length, meanMs: Math.round(mean * 1000) };
    }
    const out = R.filter((r) => r.why === 'out' || r.why === 'net').length;
    tip = ok >= 8 ? tips.good : mean < -0.04 ? tips.early : mean > 0.04 ? tips.late : out >= 3 ? tips.out : tips.good;
    return { score: DR.score, max: DR.max, ok, balls: d.balls, tip, meanMs: Math.round(mean * 1000) };
  };

  // Win probability for "just play it out", interpolated on energy (numbers come from the balance runs).
  BMCore.autoWin = (D, opp, energy) => { const a = D.autoWin[opp]; return a.e0 + (a.e100 - a.e0) * Math.max(0, Math.min(100, energy)) / 100; };

  if (typeof module !== 'undefined' && module.exports) module.exports = BMCore;
  else root.BMCore = BMCore;
})(typeof window !== 'undefined' ? window : this);
