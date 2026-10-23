/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v14.0 moments: what a week leaves behind. The game calls moment(kind, data) at the points that already decide things
   (a table talk answered, a student gone quiet, a night at home or not, a submission, a collapse, money, a match, a
   promotion); nothing here changes a rule. Templates and weights live in assets/data/content/moments.json.
   weeklyLine() writes the one sentence the week review opens with; weeklyTop(n) picks the moments worth showing. */
'use strict';
const MOMENTS = { data: null, p: null };
MOMENTS.p = fetch('assets/data/content/moments.json').then(r => r.json()).then(d => { MOMENTS.data = d; }).catch(() => { /* review falls back to the dashboard */ });
/* v14.2 endings (assets/data/content/endings.json): text, kinds and conditions; the rule itself is Rules.ending(). */
const ENDINGS = { data: null };
fetch('assets/data/content/endings.json').then(r => r.json()).then(d => { ENDINGS.data = d; }).catch(() => { /* no endings: the career runs on */ });
function endingById(id) { return ENDINGS.data ? ENDINGS.data.endings.find(e => e.id === id) : null; }
/* Flags that open the Friday choice events: a teaching path once four good weeks are behind you, the headhunter after two consulting contracts. */
function endingReadiness(career) {
  const f = Rules.careerFacts(career), out = {};
  if (f.teachAvg4 >= 75 && f.trust >= 70 && !f.flags.end_teach) out.teach_ready = 1;
  if (f.consultN >= 2 && !f.flags.end_industry) out.industry_ready = 1;
  return out;
}
/* The three career moments that led to an ending: of the ending's kinds first, by weight, then anything else; in time order. */
function endingDecisions(career, ending) {
  const all = (career.moments || []).slice(), kinds = ending.kinds || [];
  const rank = (m) => (kinds.includes(m.kind) ? 100 - kinds.indexOf(m.kind) : 0) + m.w;
  const pick = all.sort((a, b) => rank(b) - rank(a)).slice(0, 3);
  return pick.sort((a, b) => (a.week || 0) - (b.week || 0) || a.day - b.day || a.t - b.t);
}
const momentLang = () => (typeof LANG !== 'undefined' && LANG === 'en') ? 'en' : 'zh';
/* Fill {name} slots; missing slots become ''. */
function momentFill(tpl, data) { return String(tpl).replace(/\{(\w+)\}/g, (_, k) => data[k] == null ? '' : String(data[k])); }
function dayName(d) { return (typeof DAYS !== 'undefined' && DAYS[d]) ? DAYS[d].name : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][d] || ''; }
/* Record a moment. data may carry {day, t, who, said, title, where, which, stars, score, win, n}; day defaults to today. */
function moment(kind, data = {}) {
  if (!S || !MOMENTS.data) return null;
  const K = MOMENTS.data.kinds[kind]; if (!K) return null;
  const day = data.day ?? S.day, t = data.t ?? (typeof fmt === 'function' ? fmt(S.t) : '');
  const d = Object.assign({ day: dayName(day), t }, data, { day: dayName(day) });
  const m = { day, t: S.t, kind, w: data.w ?? K.w, icon: K.icon, zh: momentFill(K.zh, d), en: momentFill(K.en, d), who: data.who || null };
  (S.moments = S.moments || []).push(m);
  return m;
}
/* The week's facts the sentence templates test against. */
function weeklyFacts() {
  const kinds = new Set((S.moments || []).map(m => m.kind));
  return { kinds, home: S.homeNights || 0, submitted: !!S.submitted, collapses: S.collapses || 0, all: S.totals.all, done: S.totals.done,
    where: (typeof Z !== 'undefined' && Z && Z.name) || '办公室', lost: (S.lost || []).length };
}
function whenHolds(w, f) {
  if (w.hasKind && !w.hasKind.some(k => f.kinds.has(k))) return false;
  if (w.homeMax != null && f.home > w.homeMax) return false;
  if (w.homeMin != null && f.home < w.homeMin) return false;
  if (w.submitted != null && f.submitted !== w.submitted) return false;
  if (w.collapsesMin != null && f.collapses < w.collapsesMin) return false;
  if (w.collapsesMax != null && f.collapses > w.collapsesMax) return false;
  return true;
}
/* The strongest moment of the kinds a template names (or of all), as a short line without its day prefix. */
function momentFor(kinds) {
  const lang = momentLang();
  const pool = (S.moments || []).filter(m => !kinds || kinds.includes(m.kind)).sort((a, b) => b.w - a.w || a.t - b.t);
  if (!pool.length) return '';
  return pool[0][lang].replace(/^[^，,:：]*[，,]\s*/, '');
}
/* The one sentence. Templates are tried in order; the first whose conditions hold is filled. */
function weeklyLine() {
  if (S && S.endingView) return S.endingView.line;
  if (!MOMENTS.data) return '';
  const f = weeklyFacts(), lang = momentLang();
  for (const tpl of MOMENTS.data.weekly) {
    if (!whenHolds(tpl.when || {}, f)) continue;
    const d = Object.assign({}, f, { moment: momentFor(tpl.when && tpl.when.hasKind) });
    return momentFill(tpl[lang], d);
  }
  return '';
}
/* The n moments worth showing: by weight, then earliest; at most one per kind unless the week is thin. Returned in time order. */
/* A moment's line without its own day/time prefix, for places that already show the time (the timeline, the card). */
function momentText(m, lang) { return m[lang || momentLang()].replace(/^(周[一二三四五六日]|[A-Z][a-z]+)(\s+\d\d:\d\d)?(（[^）]*）|\([^)]*\))?[，,:：]?\s*/, ''); }
function weeklyTop(n = 5) {
  if (S && S.endingView) return S.endingView.moments;
  const all = (S.moments || []).slice().sort((a, b) => b.w - a.w || a.day - b.day || a.t - b.t);
  const pick = [], seen = new Set();
  for (const m of all) { if (pick.length >= n) break; if (seen.has(m.kind) && all.length > n) continue; seen.add(m.kind); pick.push(m); }
  for (const m of all) { if (pick.length >= n) break; if (!pick.includes(m)) pick.push(m); }
  return pick.sort((a, b) => a.day - b.day || a.t - b.t);
}
