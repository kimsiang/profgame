/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.2: the game's arithmetic as pure functions — no game state, no DOM — so balance rules can be tested in Node
   (`npm test`) and read in one place. The game calls these; the numbers are unchanged from v12.3 / v9.
   Loads before the other rules files; also usable from Node (module.exports). */
(function (root) {
  'use strict';
  const Rules = {
    /* Monthly annuity payment for a loan of P at a yearly rate over n months (v9 mortgage and car loan). */
    pmt(P, rate, n) { const r = rate / 12; return r ? P * r / (1 - Math.pow(1 + r, -n)) : P / n; },
    /* Dossier quality 0–100: each component's weight times its stars out of three (v6). comps: [{ id, w }], stars: { id: 0–3 }. */
    dossierScore(comps, stars) { return Math.round(comps.reduce((a, c) => a + c.w * ((stars[c.id] || 0) / 3), 0)); },
    /* Letter grade for a week score against the band thresholds [S, A, B, C] (v12.3 bands 92 / 84 / 60 / 46). */
    gradeOf(score, grades) { const [gS, gA, gB, gC] = grades; return score >= gS ? 'S' : score >= gA ? 'A' : score >= gB ? 'B' : score >= gC ? 'C' : 'D'; },
    /* The week score (v6 + v12.3): half the KPI average, the epilogue points, the share of events handled, minus collapses,
       minus wellbeing below the floor; a week with fewer than two nights at home is capped just under A.
       w = { avg, pts, done, all, collapses, wb, homeNights }; bal = { grades, wbFloor, wbPenalty }. Returns { score, grade, homeCap }. */
    weekScore(w, bal) {
      let score = w.avg * 0.5 + w.pts * 3.2 + (w.done / Math.max(1, w.all)) * 8 - w.collapses * 4;
      score -= Math.max(0, bal.wbFloor - w.wb) * bal.wbPenalty;
      const homeCap = w.homeNights < 2; if (homeCap) score = Math.min(score, bal.grades[1] - 1);
      return { score, grade: Rules.gradeOf(score, bal.grades), homeCap };
    },
    /* Career facts the endings test (v14.2), from the week history and the carried flags. */
    careerFacts(c) {
      const h = c.history || [], last4 = h.slice(-4), fl = c.flags || {};
      let streak = 0; for (let i = h.length - 1; i >= 0; i--) { if (h[i].grantOk) break; streak++; }
      let cw = 0; for (let i = h.length - 1; i >= 0; i--) { if ((h[i].collapses || 0) >= 2) cw++; else break; }
      const teach = last4.length === 4 ? last4.reduce((a, x) => a + ((x.k && x.k.teaching) || 0), 0) / 4 : 0;
      return { grantFailStreak: streak, lost: (c.lost || []).length, collapseWeeks: cw, teachAvg4: teach, trust: h.length ? (h[h.length - 1].trust || 0) : 0, consultN: c.consultN || 0, flags: fl, weeks: h.length };
    },
    /* The first ending whose conditions hold, or null. `any` = at least one of the listed condition sets; numbers are minimums. */
    ending(facts, endings) {
      const holds = (w) => Object.entries(w).every(([k, v]) => k === 'any' ? v.some(holds) : k === 'flag' ? !!facts.flags[v] : (facts[k] || 0) >= v);
      for (const e of endings) if (e.when && holds(e.when)) return e;
      return null;
    },
    /* Trust gained from a positive delta is ×1.5 on a 学生优先 day (v5). */
    trustGain(n, intent) { return Math.round(n * (intent === 'students' && n > 0 ? 1.5 : 1)); },
  };
  root.Rules = Rules;
  if (typeof module !== 'undefined' && module.exports) module.exports = Rules;
})(typeof window !== 'undefined' ? window : globalThis);
