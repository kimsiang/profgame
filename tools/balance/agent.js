/* v12 balance harness, in-page part. Loaded into index.html?sim by tools/e2e/balance.mjs.
   Plays whole weeks under a fixed policy through window.__sim (the real game rules, no rendering) and returns per-week metrics.
   A policy answers four questions: which intention this morning, what to do with free time, which choice in a dialog,
   and whether to accept a post. Walking is charged as minutes (see TRAVEL below), since nothing moves in sim mode. */
(function () {
  'use strict';
  const G = () => window.__sim;
  const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const hm = (h, m = 0) => h * 60 + m;
  // Walking inside a floor ≈ 4 game minutes; another floor adds the lift (travelMinutes) and the walk to and from it.
  const TRAVEL = { same: 5, other: 7 };
  const NOISE = 4;   // ± spread added to each choice's value, so careers differ
  const homeAt = (S, base) => base + (S.homeJit || 0);   // each day's leaving time varies ±30 min   // 3.7 m/s walking, 1 game minute per real second, typical 15–25 m trips
  const FAMK = ['partner', 'child', 'house'];
  const STAR_FLAGS = ['letter', 'letter3', 'fit_ok', 'sys_ok', 'r2_data', 'resp_full', 'refs_ok', 'fig_ok', 'disc_ok'];

  /* ---------------- policies ---------------- */
  // Weights turn a choice's fx into one number; timeCost is per minute the choice takes.
  const W = {
    grinder: { grant: 3, paper: 3, gq: 2, research: 1.5, rep: 1, teaching: 0.5, safety: 0.6, integrity: 0.4, team: 0.3, trust: 0.2, energy: 0.2, wellbeing: 0.1, partner: 0.05, child: 0.05, house: 0.05, cash: 0.0002, timeCost: 0.15 },
    mentor: { grant: 1, paper: 1, gq: 0.6, research: 0.6, rep: 0.6, teaching: 1, safety: 1, integrity: 1, team: 1.5, trust: 1.5, energy: 0.3, wellbeing: 0.5, partner: 0.5, child: 0.5, house: 0.3, cash: 0.0003, timeCost: 0.03 },
    balanced: { grant: 1.6, paper: 1.6, gq: 1, research: 1, rep: 0.8, teaching: 0.8, safety: 1, integrity: 1, team: 0.9, trust: 0.9, energy: 0.4, wellbeing: 0.7, partner: 0.8, child: 0.8, house: 0.5, cash: 0.0004, timeCost: 0.06 },
  };
  const score = (fx, w) => Object.entries(fx || {}).reduce((a, [k, v]) => a + (w[k] || 0) * v, 0);

  function choiceValue(S, ev, c, name) {
    if (name === 'random') return 0;
    const w = W[name], fl = c.flags || [];
    let v = score(c.fx, w) - (c.min || 0) * w.timeCost;
    if (fl.some((f) => f.startsWith('kept_'))) v += name === 'grinder' ? 5 : 25;
    if (fl.includes('lose')) v -= name === 'grinder' ? 5 : 40;
    if (fl.includes('data_in')) v += 12;
    // flags that add dossier stars (FLAG_STARS in index.html): a player who reads the checklist values them
    if (fl.some((f) => STAR_FLAGS.includes(f))) v += name === 'grinder' ? 12 : 8;
    if (c.next && !c.fx) v += 1;   // a branch: look inside rather than walk away
    return v;
  }
  function chooseIndex(S, d, P, rnd) {
    const ev = d.ev, ch = d.choices, n = ch.length, id = ev.id;
    const find = (re) => ch.findIndex((c) => re.test(c.t));
    if (P.name === 'random' && !['desk', 'home'].includes(id)) return (rnd() * n) | 0;
    if (id === 'intr') return P.name === 'grinder' ? 1 : 0;
    if (id === 'desk') {
      const want = d.want || P.deskWant;
      if (d.key === 'warn') { if (S.day >= 4 || P.name === 'grinder') return find(/就这样交了/); d.want = 'paper'; return find(/先不交/); }
      const order = want === 'data' ? [/请小陈整理/] : want === 'submit-grant' ? [/提交基金/] : want === 'submit-paper' ? [/提交论文/]
        : want === 'grant' ? [/写基金/] : want === 'paper' ? [/改论文/] : [];
      for (const re of order.concat([/写基金/, /改论文/])) { const i = find(re); if (i >= 0) return i; }
      const warn = find(/先不交/); if (warn >= 0) { if (S.day >= 4 || P.name === 'grinder') return find(/就这样交了/); d.want = 'paper'; return warn; }
      return n - 1;
    }
    if (id === 'canteenMenu') { const i = ch.findIndex((c) => /本周第一次/.test(c.d || '')); return i >= 0 ? i : 0; }
    // v12.2 companions: who comes along is the policy's call (P.invite returns a person id or null)
    if (id === 'canteenWho' || id === 'gardenWho' || id === 'roofcafe') {
      const place = id === 'canteenWho' ? 'canteen' : id === 'gardenWho' ? 'garden' : 'cafe', who = P.invite ? P.invite(S, place, G().companionsFor(place).ok, rnd) : null;
      if (who) { const nm = G().TABLE.people[who].n; const i = ch.findIndex((c) => c.t.includes(nm)); if (i >= 0) return i; }
      return id === 'canteenWho' ? n - 1 : 0;
    }
    if (id === 'home') { const i = find(/带束花/); return P.name !== 'grinder' && i >= 0 && S.fam.partner < 60 ? i : 0; }
    // events and home scenes: best weighted value
    let best = 0, bv = -1e9;
    // NOISE: players weigh things differently; without it every career with the same week number plays identically
    ch.forEach((c, i) => { const v = choiceValue(S, ev, c, P.name) + rnd() * NOISE; if (v > bv) { bv = v; best = i; } });
    return best;
  }

  const workKind = (S) => (!S.submitted && S.day <= 4 ? 'grant' : !S.paperSubmitted ? 'paper' : null);
  const inFocusBlock = (S) => { const b = G().blockIdx(S.t); return b === 0 || b === 1 || b === 3; };
  const mealTime = (S) => (S.t >= hm(11, 30) && S.t < hm(13, 30)) || (S.t >= hm(17, 30) && S.t < hm(19, 30));

  function needs(S, P) {
    const v = S.v;
    if (v.bladder > 72) return { do: 'wc' };
    if (v.full < 20 || (v.full < 45 && mealTime(S) && S.meals < 3)) return P.name === 'grinder' ? { do: 'eat' } : { do: 'canteen' };
    if (v.energy < 30) return S.coffees < 3 ? { do: 'coffee' } : { do: 'nap' };
    return null;
  }
  function deskOrWrite(S) {
    const k = workKind(S); if (!k) return null;
    if (k === 'grant' && !S.dataReq && S.day <= 3 && !S.lost.includes('chen')) return { do: 'desk', want: 'data' };
    const bar = (G().BAL || {}).grantBar || 58;
    if (k === 'grant' && S.grant >= 100 && S.day < 4 && G().dossierScore('grant') < bar) {
      // Text done but the dossier would fail: gather stars (reading, events) and use the desk time for the paper.
      if (S.dos.grant.idea < 3 && S.readDay !== S.day) { S.readDay = S.day; return { do: 'read', min: 30 }; }
      if (!S.paperSubmitted) return S.paper >= 100 ? { do: 'desk', want: 'submit-paper' } : { do: 'desk', want: 'paper' };
    }
    if (S[k] >= 100) {
      // Text done: submit when the dossier is good, or on the deadline day; until then the stars come from people and events.
      const q = G().dossierScore(k), last = k === 'grant' ? 4 : 6;
      if (q >= (k === 'grant' ? bar + 10 : 70) || S.day >= last || (k === 'grant' && q >= bar && S.day >= 3)) return { do: 'desk', want: 'submit-' + k };
      if (k === 'grant' && !S.paperSubmitted && S.paper < 100) return { do: 'desk', want: 'paper' };
      return null;
    }
    return { do: 'desk', want: k };
  }
  const takeable = (S, ev) => ev.phone || G().HS[ev.loc];
  const byDeadline = (a, b) => a.deadline - b.deadline;
  const lateDeadline = (S) => (S.day === 4 && !S.submitted) || (S.day === 6 && !S.paperSubmitted);

  const POLICIES = {
    grinder: {
      intent: (S) => (workKind(S) || 'paper'),
      act(S) {
        const n = needs(S, this); if (n) return n;
        const evs = G().activeEvents().filter((e) => takeable(S, e) && (e.urgent || e.alarm || e.crisisOf)).sort(byDeadline);
        if (evs.length) return { ev: evs[0] };
        return deskOrWrite(S) || { do: 'wait', min: 15 };
      },
      post: false,
    },
    mentor: {
      invite: (S, place, ok) => { const st = ok.filter((id) => S.trust[id] !== undefined).sort((a, b) => S.trust[a] - S.trust[b]); return place === 'garden' ? (ok.includes('partner') && S.fam.partner < 75 ? 'partner' : null) : place === 'cafe' ? (ok.includes('zhao') ? 'zhao' : null) : st[0] || null; },
      intent: () => 'students',
      act(S) {
        const n = needs(S, this); if (n) return n;
        const evs = G().activeEvents().filter((e) => takeable(S, e)).sort(byDeadline);
        if (evs.length) return { ev: evs[0] };
        if (S.t >= homeAt(S, hm(18, 30)) && !lateDeadline(S)) return { do: 'home' };
        if (S.t >= hm(15) && S.t < hm(16, 30) && S.cafeDay !== S.day && G().companionsFor && G().companionsFor('cafe').ok.includes('zhao')) { S.cafeDay = S.day; return { do: 'roofcafe' }; }
        if (S.t >= hm(17) && S.t < hm(18) && S.dayBad !== S.day) { S.dayBad = S.day; return { do: 'badminton', min: 60 }; }
        return deskOrWrite(S) || (S.t >= hm(17) ? { do: 'home' } : { do: 'wait', min: 15 });
      },
      post: false,
    },
    balanced: {
      invite: (S, place, ok) => {
        if (place === 'garden') return ok.includes('partner') && S.fam.partner < 70 ? 'partner' : null;
        if (place === 'cafe') return ok.includes('coach') && !S.submitted && S.dos.grant.letter < 3 ? 'coach' : ok.includes('zhao') && workKind(S) ? 'zhao' : ok.includes('wang') ? 'wang' : null;
        const st = ok.filter((id) => S.trust[id] !== undefined && S.trust[id] < 75).sort((a, b) => S.trust[a] - S.trust[b]); return st[0] || null;
      },
      intent: (S, d) => { const k = workKind(S); if (S.wb < 45) return 'self'; if (d === 1) return 'students'; return k || 'paper'; },
      act(S) {
        const n = needs(S, this); if (n) return n;
        const g = G(), evs = g.activeEvents().filter((e) => takeable(S, e)).sort(byDeadline);
        const urgent = evs.filter((e) => e.urgent || e.alarm || e.crisisOf || e.deadline - S.t < 45 || e.npc && g.STUDENTS[e.npc]);
        if (urgent.length) return { ev: urgent[0] };
        if (!inFocusBlock(S) && evs.length) return { ev: evs[0] };
        if (S.t >= homeAt(S, hm(19)) && !lateDeadline(S)) return { do: 'home' };
        if (S.wb < 45 && S.t >= hm(15) && S.walkDay !== S.day) { S.walkDay = S.day; return { do: 'walk', min: 20 }; }
        if (S.t >= hm(14, 30) && S.t < hm(16) && S.cafeDay !== S.day && S.day <= 4 && G().companionsFor && G().companionsFor('cafe').ok.length) { S.cafeDay = S.day; return { do: 'roofcafe' }; }
        if (S.day === 1 && S.t >= hm(17) && S.t < hm(18) && S.dayBad !== S.day) { S.dayBad = S.day; return { do: 'badminton', min: 60 }; }
        if (!S.submitted && S.day <= 3 && S.dos.grant.idea < 2 && S.readDay !== S.day && S.t >= hm(14)) { S.readDay = S.day; return { do: 'read', min: 30 }; }
        return deskOrWrite(S) || (S.t >= hm(17) ? { do: 'home' } : evs.length ? { ev: evs[0] } : { do: 'wait', min: 15 });
      },
      post: false,
    },
    random: {
      invite: (S, place, ok, rnd) => (ok.length && rnd() < 0.5 ? ok[(rnd() * ok.length) | 0] : null),
      intent: (S, d, rnd) => ['grant', 'paper', 'students', 'self'][(rnd() * 4) | 0],
      act(S, rnd) {
        const g = G(), evs = g.activeEvents().filter((e) => takeable(S, e));
        const opts = [() => evs.length && { ev: evs[(rnd() * evs.length) | 0] }, () => deskOrWrite(S), () => ({ do: 'canteen' }), () => ({ do: 'coffee' }), () => ({ do: 'nap' }), () => ({ do: 'wc' }),
          () => ({ do: 'walk', min: 20 }), () => (S.t >= hm(17) ? { do: 'home' } : null), () => ({ do: 'wait', min: 20 })];
        for (let k = 0; k < 6; k++) { const a = opts[(rnd() * opts.length) | 0](); if (a) return a; }
        return { do: 'wait', min: 20 };
      },
      post: false,
    },
  };

  /* ---------------- the driver ---------------- */
  const AMEN = { desk: 'desk', wc: 'wc', coffee: 'coffee', eat: 'food', nap: 'sofa', canteen: 'canteen', walk: 'garden', read: 'libdesk', badminton: 'courtB', roofcafe: 'roofcafe', home: 'elevator' };
  function runWeeks(name, weeks, seed) {
    const g = G(), P = Object.assign({ name }, POLICIES[name]), rnd = mulberry(seed * 7919 + 13);
    Math.random = mulberry(seed);   // every in-game roll from here on is reproducible
    g.clearAll(); Object.assign(g.setup, { avatar: 'm', day: 'normal', mode: 'basic', house: 'buy', commute: 'car' });
    window.__simMini = (k) => (k === 'fit' ? { chi: 1.3, tau: 2.2 } : k === 'quiz' ? { right: 2 } : { acc: 0.75 });
    const T0 = performance.now(), LIMIT = window.__simLimit || 600000;
    let here = 'f5', guard = 0, picks = 0, conseq = 0, firstLowE = null;
    const out = [];
    const goTo = (loc) => {
      const S = g.S, to = (g.HS[loc] && g.HS[loc].zone) || 'f5', m = to === here ? TRAVEL.same : g.travelMinutes(here, to) + TRAVEL.other;
      S.traveling = true; g.simulate(m); S.traveling = false; here = to; return !S.ended;
    };
    const doAct = (a) => {
      const S = g.S;
      if (a.ev) { if (!a.ev.phone && !goTo(a.ev.loc)) return; if (a.ev.state === 'active' && !S.ended) g.openDialog(a.ev); return; }
      if (a.do === 'wait') return g.simulate(a.min);
      if (!goTo(AMEN[a.do])) return;
      switch (a.do) {
        case 'desk': g.openDesk(); if (S.dialog) S.dialog.want = a.want; break;
        case 'canteen': g.canteenMenu(); break;
        case 'home': g.confirmHome(); break;
        case 'eat': g.ACT.eat(); break;
        case 'coffee': g.ACT.coffee(); break;
        case 'nap': g.ACT.nap(); break;
        case 'wc': g.ACT.wc(); break;
        case 'walk': g.openGarden ? g.openGarden() : g.ACT.walk(a.min); break;
        case 'roofcafe': g.openRoofCafe(); break;
        case 'read': g.ACT.read(a.min); break;
        case 'badminton': g.ACT.badminton(a.min); break;
      }
    };
    const playDay = (d) => {
      const S = g.S;
      g.beginDay(d, P.intent(S, d, rnd)); S.paused = false; here = 'f5'; S.homeJit = Math.round((rnd() - 0.5) * 60);
      while (!g.S.ended) {
        if (++guard > 200000 || performance.now() - T0 > LIMIT) throw new Error('harness stuck on day ' + d + ' at ' + g.S.t);
        const S2 = g.S;
        if (S2.dialog) {
          const dl = S2.dialog;
          if (window.__simTrace) window.__simTrace.push(`  dlg ${dl.ev.id} ${dl.choices ? dl.choices.length : '-'}`);
          if (dl.choices && dl.choices.length) {
            const i = chooseIndex(S2, dl, P, rnd), c = dl.choices[Math.max(0, i)];
            if (!dl.ev.synthetic) { picks++; if (Object.values(c.fx || {}).some((v) => Math.abs(v) >= 3)) conseq++; }
            g.pick(c);
          } else g.closeDialog();
          continue;
        }
        if (S2.activity) { let k = 0; while (S2.activity && !S2.dialog && !S2.ended && k++ < 1500) g.minuteTick(1); if (k > 1500) throw new Error(`activity never ends: ${S2.activity.type} ${S2.activity.label}`); continue; }
        if (firstLowE === null && S2.v.energy < 30) firstLowE = d;
        const t0 = S2.t, act = P.act(S2, rnd); if (window.__simTrace) window.__simTrace.push(`${d} ${S2.t} ${act.ev ? 'ev:' + act.ev.id : act.do + (act.want ? ':' + act.want : '')}`); doAct(act);
        if (!g.S.ended && !g.S.dialog && !g.S.activity && g.S.t === t0) g.simulate(5);   // nothing happened: let time pass
      }
    };
    g.startGame();
    for (let w = 0; w < weeks; w++) {
      picks = 0; conseq = 0; firstLowE = null;
      for (let d = 0; d < 7; d++) { if (d > 0) g.startDay(d); playDay(d); }
      const S = g.S, R = S.weekResult || {}, outs = R.outs || [];
      out.push({
        policy: name, seed, week: S.week, grade: R.grade, score: R.score, pts: R.pts, homeCap: R.homeCap, kAvg: R.kAvg, grantQ: R.grantQ, paperQ: R.paperQ,
        grantSubmitted: S.submitted, grantOk: outs.some((o) => /^基金：(获批|优先资助)/.test(o[1])), paper: (outs.find((o) => /^论文/.test(o[1])) || [])[1] || '',
        wb: Math.round(S.wb), collapses: S.collapses, trust: Math.round(g.avgTrust()), lost: S.lost.length, homeNights: S.homeNights,
        fam: Math.round(Math.min(...FAMK.map((k) => S.fam[k]))), cash: S.fin ? Math.round(S.fin.cash) : null, rank: S.career.rank, post: S.career.post,
        events: S.totals.all, done: S.totals.done, picks, companions: Object.values(S.companions || {}).reduce((a, d) => a + Object.keys(d).length, 0), table: (S.tableLog || []).length, conseqPerDay: +(conseq / 7).toFixed(1), firstLowEnergyDay: firstLowE,
        k: Object.fromEntries(Object.entries(S.k).map(([k, v]) => [k, Math.round(v)])),
      });
      const no = document.getElementById(P.post ? 'ofYes' : 'ofNo'); if (no) no.click();
      const c = g.loadCareer(); if (!c || c.done || w === weeks - 1) break;
      g.nextWeek();
    }
    return out;
  }
  window.simRun = runWeeks;
  window.simPolicies = Object.keys(POLICIES);
})();
