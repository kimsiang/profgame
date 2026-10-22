#!/usr/bin/env node
// v12.1 content validator: node tools/validate-data.mjs  (exit code 1 on any error)
// Checks every file in assets/data/content against the shapes index.html expects, and the cross references
// (hotspots, flags, cards, achievements, people) against index.html itself.
import fs from 'fs';
import path from 'path';
const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const DIR = path.join(ROOT, 'assets/data/content');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const J = (f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
const errs = [], warns = [];
const err = (where, msg) => errs.push(`${where}: ${msg}`);

// What index.html knows
const hsBlock = html.slice(html.indexOf('const HS = {'), html.indexOf('};', html.indexOf('const HS = {')));
const HOTSPOTS = new Set([...hsBlock.matchAll(/^\s+(\w+): \{ x:/gm)].map((m) => m[1]));
const FXKEYS = new Set([...html.match(/const FXNAME = \{([^}]*)\}/)[1].matchAll(/(\w+):/g)].map((m) => m[1]));
const SPEAKERS = new Set([...html.match(/const SPEAKERS = \{([^}]*)\}/)[1].matchAll(/'([^']+)':/g)].map((m) => m[1]));
const codeFlags = new Set([...html.matchAll(/S\.flags\.(\w+) = |flags\.(\w+) = 1|S\.flags\[['"](\w+)['"]\]|finFlag\('(\w+)'\)|flag: '(\w+)'/g)].map((m) => m.slice(1).find(Boolean)));
const MOODS = new Set(['normal', 'happy', 'worried', 'shock', 'sleepy']);
const ACTS = new Set([...html.slice(html.indexOf('const ACT = {'), html.indexOf('\n};', html.indexOf('const ACT = {'))).matchAll(/^  (\w+): /gm)].map((m) => m[1]));

const week = J('week.json'), ev = J('events.json'), people = J('people.json'), cal = J('calendar.json'), codex = J('codex.json');
const CARDS = new Set(Object.keys(codex.cards)), ACH = new Set(Object.keys(codex.achievements)), STUD = new Set(Object.keys(people.students));

// Flags that content sets with @flag, plus the ones code sets
const setFlags = new Set(codeFlags);
const scanFlags = (fx) => (String(fx || '').match(/@\w+/g) || []).forEach((f) => setFlags.add(f.slice(1)));
const choiceLists = [...week.events.map((e) => e.ch), ...ev.quick.map((q) => q.ch), ...ev.admin.map((e) => e.ch), ...ev.academy.map((e) => e.ch), ev.hat.ch, ...Object.values(ev.finance).flatMap((e) => (Array.isArray(e) ? e.map((x) => x.ch) : [e.ch])), ...ev.home.map((h) => h.ch)];
choiceLists.forEach((ch) => (ch || []).forEach((c) => scanFlags(c[1])));
week.events.forEach((e) => { if (e.exp) scanFlags(e.exp.split('|')[0]); });

function checkFx(where, fx) {
  if (typeof fx !== 'string') return err(where, `fx must be a string, got ${typeof fx}`);
  for (const tok of fx.trim().split(/\s+/).filter(Boolean)) {
    if (tok.startsWith('@')) { if (!/^@\w+$/.test(tok)) err(where, `bad flag token "${tok}"`); continue; }
    const m = tok.match(/^([a-z]+)([+-]\d+)$/);
    if (!m) err(where, `bad fx token "${tok}"`); else if (!FXKEYS.has(m[1])) err(where, `unknown fx key "${m[1]}"`);
  }
}
// Text may be a plain string or { zh, en?, ja?, ms? } (zh required: it is the fallback).
const LANGS = ['zh', 'en', 'ja', 'ms'];
const str = (where, v, name, opt) => {
  if (v === undefined && opt) return;
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    if (typeof v.zh !== 'string' || !Object.keys(v).every((k) => LANGS.includes(k))) return err(where, `${name}: a translated text needs a zh string and only ${LANGS.join('/')} keys`);
    return Object.values(v).forEach((x) => { if (typeof x !== 'string') err(where, `${name}: every language must be a string`); });
  }
  if (typeof v !== 'string' || (!opt && !v.trim())) err(where, `${name} must be a non-empty string`);
};
const time = (where, t) => { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t || '')) err(where, `time "${t}" is not HH:MM`); };
const loc = (where, l) => { if (l !== 'phone' && !HOTSPOTS.has(l)) err(where, `unknown hotspot "${l}"`); };
function choices(where, ch, kind = 'event') {
  if (!Array.isArray(ch) || ch.length < 1) return err(where, 'needs at least one choice');
  if (ch.length > 6) warns.push(`${where}: ${ch.length} choices (more than 6 will not fit)`);
  ch.forEach((c, i) => {
    const w = `${where} choice ${i + 1}`;
    if (!Array.isArray(c)) return err(w, 'must be an array');
    str(w, c[0], 'text'); checkFx(w, c[1]);
    if (kind === 'home') { str(w, c[2], 'feedback', true); return; }
    if (typeof c[2] !== 'number' || c[2] < 0) err(w, 'minutes must be a number ≥ 0');
    if (c[3] !== undefined) str(w, c[3], 'feedback', true);
    if (c[5] !== undefined) { const [a, m] = String(c[5]).split(':'); if (!ACTS.has(a) || !(+m > 0)) err(w, `after "${c[5]}" must be <activity>:<minutes> with an activity from ACT`); }
  });
}
// "小陈放下筷子：老师……" reads as a speaker called 小陈放下筷子. Narration and speech go in separate |-lines.
function speakers(where, open) {
  const zh = open && typeof open === 'object' ? open.zh : open;
  String(zh || '').split('|').forEach((seg) => { const m = seg.match(/^([^：|]{1,6})：/); if (m && !SPEAKERS.has(m[1]) && [...SPEAKERS].some((n) => m[1].startsWith(n))) err(where, `"${m[1]}：" would show as a speaker; split it into "${m[1]}。|${[...SPEAKERS].find((n) => m[1].startsWith(n))}：…"`); });
}
function event(where, e, o = {}) {
  speakers(where, e.open);
  ['who', 'tag', 'title', 'line'].forEach((k) => str(where, e[k], k));
  str(where, e.open, 'open', true); loc(where, e.loc);
  if (o.time !== false) time(where, e.time);
  choices(where, e.ch);
}

// week.json
const ids = new Map();
week.events.forEach((e, i) => {
  const where = `week.json #${i} (${e.title || '?'})`;
  if (!Number.isInteger(e.day) || e.day < 0 || e.day > 6) err(where, 'day must be 0–6');
  event(where, e);
  const id = e.id || `w${e.day}_${(e.time || '').replace(':', '')}`;
  if (ids.has(id)) err(where, `duplicate id "${id}" (also #${ids.get(id)}); give one an explicit id`); else ids.set(id, i);
  for (const k of ['req', 'reqNot']) if (e[k] && !setFlags.has(e[k])) err(where, `${k} "${e[k]}" is never set by any choice or by the code`);
  if (e.card && !CARDS.has(e.card)) err(where, `card "${e.card}" is not in codex.json`);
  if (e.ach && !ACH.has(e.ach)) err(where, `ach "${e.ach}" is not in codex.json`);
  if (e.achOn && !e.ch.some((c) => JSON.stringify(c[0]) === JSON.stringify(e.achOn))) err(where, `achOn does not match any choice text`);
  if (e.mood && !MOODS.has(e.mood)) err(where, `mood "${e.mood}" unknown`);
  if (e.exp) { const [fx] = e.exp.split('|'); checkFx(where + ' exp', fx); }
  if (e.win !== undefined && !(e.win > 0)) err(where, 'win must be > 0 minutes');
  const zh = (v) => (v && typeof v === 'object' ? v.zh : v) || '', name = zh(e.who).split(' · ')[0];
  if (!SPEAKERS.has(name) && e.loc !== 'phone' && /^小|博士|老师$/.test(name)) warns.push(`${where}: "${name}" has no portrait (not in SPEAKERS)`);
});

// events.json
ev.quick.forEach((q, i) => { const w = `events.json quick #${i}`; ['who', 'title', 'open'].forEach((k) => str(w, q[k], k)); choices(w, q.ch); });
ev.admin.forEach((e, i) => { const w = `events.json admin #${i}`; if (!['any', 'dean'].includes(e.post)) err(w, 'post must be any|dean'); event(w, e, { time: false }); });
ev.academy.forEach((e, i) => { const w = `events.json academy #${i}`; if (!(e.day >= 0 && e.day <= 6)) err(w, 'day must be 0–6'); event(w, e); });
event('events.json hat', ev.hat, { time: false });
Object.entries(ev.finance).forEach(([k, e]) => {
  if (k !== 'shocks') return event(`events.json finance.${k}`, e);
  e.forEach((x, i) => { const w = `events.json finance.shocks #${i} (${x.id})`; if (!['any', 'car', 'rent'].includes(x.need)) err(w, 'need must be any|car|rent'); if (!(x.day >= 0 && x.day <= 6)) err(w, 'day must be 0–6'); event(w, x); });
});
const homeIds = new Set();
ev.home.forEach((h, i) => {
  const w = `events.json home #${i} (${h.id})`;
  str(w, h.id, 'id'); if (homeIds.has(h.id)) err(w, 'duplicate id'); homeIds.add(h.id);
  if (!['partner', 'child', 'house'].includes(h.m)) err(w, 'm must be partner|child|house');
  if (!Array.isArray(h.days) || !h.days.every((d) => d >= 0 && d <= 6)) err(w, 'days must be a list of 0–6');
  str(w, h.open, 'open'); choices(w, h.ch, 'home');
});

// people.json
Object.entries(people.students).forEach(([id, p]) => { const w = `people.json students.${id}`; ['n', 'role', 'he'].forEach((k) => str(w, p[k], k)); loc(w, p.loc); });
Object.entries(people.memlines).forEach(([id, m]) => {
  const w = `people.json memlines.${id}`;
  for (const k of ['good', 'bad', 'ignored']) {
    if (!Array.isArray(m[k]) || !m[k].length) { err(w, `needs a non-empty "${k}" list`); continue; }
    m[k].forEach((l, i) => { if (!String(l && typeof l === 'object' ? l.zh : l).includes('{t}')) err(`${w}.${k}[${i}]`, 'line must contain {t}'); });
  }
});
STUD.forEach((id) => { if (!people.memlines[id]) err('people.json', `student "${id}" has no memory lines`); });

// calendar.json
if (cal.days.length !== 7) err('calendar.json', 'needs exactly 7 days');
cal.days.forEach((d, i) => ['name', 'theme', 'sub'].forEach((k) => str(`calendar.json days[${i}]`, d[k], k)));
const INTENT_IDS = ['grant', 'paper', 'students', 'self'];
cal.intents.forEach((x, i) => { const w = `calendar.json intents[${i}]`; if (!INTENT_IDS.includes(x.id)) err(w, `id must be one of ${INTENT_IDS.join(', ')} (the rules key on them)`); ['n', 'd', 'ic'].forEach((k) => str(w, x[k], k)); });

// codex.json
Object.entries(codex.cards).forEach(([id, c]) => { str(`codex.json cards.${id}`, c.t, 't'); str(`codex.json cards.${id}`, c.b, 'b'); });
Object.entries(codex.achievements).forEach(([id, a]) => { if (!Array.isArray(a) || a.length !== 2) err(`codex.json achievements.${id}`, 'must be [name, description]'); });
codex.quiz.forEach((q, i) => { const w = `codex.json quiz[${i}]`; str(w, q.q, 'q'); if (!Array.isArray(q.o) || q.o.length < 2) err(w, 'needs options'); else if (!(q.a >= 0 && q.a < q.o.length)) err(w, 'answer index out of range'); });
// cards and achievements referenced from code must exist
[...html.matchAll(/card: '(\w+)'/g)].forEach((m) => { if (!CARDS.has(m[1])) err('index.html', `card "${m[1]}" is not in codex.json`); });
[...html.matchAll(/unlock\('(\w+)'\)/g)].forEach((m) => { if (!ACH.has(m[1])) err('index.html', `achievement "${m[1]}" is not in codex.json`); });

// table.json (v12.2 companions and table talks)
const table = J('table.json');
const PEOPLE = new Set(Object.keys(table.people));
Object.entries(table.places).forEach(([pl, P]) => {
  if (!['canteen', 'cafe', 'garden'].includes(pl)) err(`table.json places.${pl}`, 'place must be canteen|cafe|garden (the rules key on them)');
  P.who.forEach((id) => { if (!PEOPLE.has(id)) err(`table.json places.${pl}`, `"${id}" is not in people`); });
});
Object.entries(table.people).forEach(([id, p]) => { const w = `table.json people.${id}`; str(w, p.n, 'n'); str(w, p.perk, 'perk', true); if (p.seat) loc(w, p.seat); if (p.from) time(w, p.from); });
['canteen', 'cafe'].forEach((pl) => { if (!(table.treat[pl] >= 0)) err('table.json treat', `${pl} must be a price`); if (!(table.chance[pl] >= 0 && table.chance[pl] <= 1)) err('table.json chance', `${pl} must be 0–1`); });
const tids = new Set();
table.events.forEach((e, i) => {
  const w = `table.json events #${i} (${e.id})`;
  if (!/^t_\w+$/.test(e.id || '')) err(w, 'id must look like t_<name>'); if (tids.has(e.id)) err(w, 'duplicate id'); tids.add(e.id);
  if (!PEOPLE.has(e.npc)) err(w, `npc "${e.npc}" is not in people`);
  if (!Object.values(table.places).some((P) => P.who.includes(e.npc))) warns.push(`${w}: ${e.npc} cannot be invited anywhere, so this talk never happens`);
  ['who', 'title', 'open'].forEach((k) => str(w, e[k], k)); choices(w, e.ch); speakers(w, e.open);
});

warns.forEach((w) => console.log('warn ', w));
errs.forEach((e) => console.log('ERROR', e));
const n = week.events.length + ev.quick.length + ev.admin.length + ev.academy.length + 1 + Object.keys(ev.finance).length - 1 + ev.finance.shocks.length + ev.home.length;
console.log(errs.length ? `\n${errs.length} error(s) in ${n} events` : `content ok: ${n} events, ${table.events.length} table talks, ${Object.keys(codex.cards).length} cards, ${Object.keys(codex.achievements).length} achievements, ${STUD.size} students`);
process.exit(errs.length ? 1 : 0);
