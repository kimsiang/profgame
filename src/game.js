/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   GAME — state, clock, activities, dialogue, mini games,
   RPG layer (XP · levels · achievements), HUD, camera
   ========================================================= */
const $ = (id) => document.getElementById(id);
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const pad = (n) => String(n).padStart(2, '0');
const fmt = (t) => { t = Math.min(t, 1439); return pad(Math.floor(t / 60) % 24) + ':' + pad(Math.floor(t % 60)); };
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const KPI = [['research', '科研'], ['teaching', '教学'], ['team', '团队'], ['rep', '声誉'], ['safety', '安全'], ['integrity', '诚信']];
const FXNAME = { research: '科研', teaching: '教学', team: '团队', rep: '声誉', safety: '安全', integrity: '诚信', cash: '¥', energy: '精力', full: '饱腹', bladder: '尿意', grant: '基金书', paper: '论文', wellbeing: '身心', gq: '基金质量', trust: '信任', partner: '伴侣', child: '孩子', house: '家务' };

let S = null;
const setup = { avatar: 'm', day: 'normal', mode: 'basic', house: 'buy', commute: 'car' };
let sampleFn = null;

function freshCareer() { return { cv: 3, fin: freshFin(setup.house, setup.commute), week: 1, pts: 0, rank: 0, history: [], trust: {}, lost: [], flags: {}, wb: 72, k: null, fam: null, dos: null, post: null, postWeeks: 0, postCool: 0, acadNext: 0, acadTries: 0, rankLog: [], postLog: [], done: false }; }
// v7 careers: the old top rank (讲席教授·PI at 30 points) maps to 教授; points are kept and re-earn the new titles.
// v8 careers: no money yet. Start them on the default household with the loans already partly paid.
function migrateFin(c) { if (c && !c.fin) { const f = freshFin('buy', 'car'), w = Math.max(0, (c.week || 1) - 1); for (const k of ['mortgage', 'car']) { const L = f[k]; for (let i = 0; i < w && L && L.left > 0; i++) { L.bal -= L.pay - L.bal * L.rate / 12; L.left--; } } if (f.car && f.car.left <= 0) f.car = null; if (c.rank >= 3) f.settled = true; c.fin = f; c.cv = 3; } return c; }
function migrateCareer(c) { if (c && c.cv === 2) migrateFin(c); if (c && !c.cv) { if (c.rank >= 3) c.rank = 2; Object.assign(c, { cv: 2, post: null, postWeeks: 0, postCool: 0, acadNext: 0, acadTries: 0, rankLog: [], postLog: [], done: false }); migrateFin(c); } return c; }
/* v6: fresh dossier (all components at 0 stars) and family meters. */
function freshDossier() { const o = {}; for (const p in DOSSIER) { o[p] = {}; DOSSIER[p].comps.forEach(c => { o[p][c.id] = 0; }); } return o; }
function freshFamily() { return { partner: 70, child: 70, house: 70 }; }
function newState(career) {
  career = career || freshCareer();
  const k0 = { research: 50, teaching: 50, team: 50, rep: 50, safety: 60, integrity: 70 };
  if (career.k) for (const k in k0) k0[k] = Math.round(k0[k] + (career.k[k] - k0[k]) * 0.5);
  const trust = {}; Object.keys(STUDENTS).forEach(id => { trust[id] = career.trust[id] !== undefined ? Math.round(60 + (career.trust[id] - 60) * 0.7) : 60; });
  return {
    week: career.week, career, wb: career.wb, trust, lost: career.lost.slice(), mem: {}, memToday: {}, gq: 40, intel: {}, crisis: {}, intent: null, intents: [],
    blockUse: [], timeWeek: {}, flow: 0, flowCarry: null, focusBlocks: 0, recruit: false, outcomes: null,
    // v6: dossier stars carry over (ideas go stale, see nextWeek); family meters carry over; tutorial progress is per browser.
    dos: career.dos ? JSON.parse(JSON.stringify(career.dos)) : freshDossier(), dataReq: null,
    // v12.2 companions: who came where today, table talks already had (once per career), garden inspiration, Dr Zhao's flow start
    companions: {}, tableSeen: (career.tableSeen || []).slice(), tableLog: [], inspired: false, zhaoFlow: false, coachWeek: 0, mealsOut: 0, mealsAlone: 0, tiredDay: null,
    fam: career.fam ? Object.assign({}, career.fam) : freshFamily(), homeNights: 0, famSkip: 0, homeToday: false, famEvents: {},
    // v9: the household ledger carries over in the career; one game week = one financial month.
    fin: JSON.parse(JSON.stringify(career.fin || freshFin(setup.house, setup.commute))),
    mode: setup.mode, avatar: setup.avatar, day: setup.day,
    t: hm(8, 0), running: false, paused: false, speed: 1,
    v: { energy: 86, full: 55, bladder: 18 },
    k: k0,
    grant: setup.day === 'crunch' ? 8 : 20, submitted: false, paper: 20, paperSubmitted: false, coffees: 0, meals: 0, day: 0, collapses: 0, lastEnd: 'time', dayLogStart: 0, cardStart: 0, kStart: null, totals: { done: 0, missed: 0, all: 0 }, coffeesWeek: 0, mealsWeek: 0,
    activity: null, events: [], log: [], cards: [], flags: Object.assign({}, career.flags), muons: 0,
    dialog: null, ended: false, path: [], autoTarget: null, warned: {}, moving: false, run: false,
    xp: 0, level: 0, ach: [], rooms: {}, zones: {}, sports: {}, reads: 0, clears: 0, hadQuests: false, autoRoute: null, autoNext: null,
  };
}

/* ---------------- audio: sfx + generative ambient score ---------------- */
let actx = null, soundOn = true, musicOn = true, master = null, musicBus = null;
function ensureAudio() {
  if (actx || SIM) return;
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain(); master.gain.value = 0.9; master.connect(actx.destination);
    musicBus = actx.createGain(); musicBus.gain.value = 0.0;
    const delay = actx.createDelay(1.0); delay.delayTime.value = 0.42; const fb = actx.createGain(); fb.gain.value = 0.35; const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    musicBus.connect(lp); lp.connect(master); lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(master);
    // v11.2: the track sequencer (assets/js/music.js + assets/data/music.json)
    if (window.ProfMusic) fetch('assets/data/music.json').then(r => r.json()).then(d => { ProfMusic.init(actx, master, d); MUSIC.data = d; }).catch(() => { /* old pads only */ });
  } catch (e) { actx = null; }
}
function tone(f, dur = 0.15, type = 'sine', vol = 0.08, when = 0, bus) {
  if (!actx || (!bus && !soundOn)) return;
  const t0 = actx.currentTime + when, o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.02, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(bus || master); o.start(t0); o.stop(t0 + dur + 0.05);
}
const SFX = {
  ping: () => { tone(880, 0.14, 'sine', 0.07); tone(1320, 0.22, 'sine', 0.05, 0.1); },
  ring: () => { for (let i = 0; i < 3; i++) { tone(1046, 0.09, 'square', 0.025, i * 0.32); tone(1318, 0.09, 'square', 0.025, i * 0.32 + 0.1); } },
  alarm: () => { for (let i = 0; i < 4; i++) { tone(740, 0.18, 'sawtooth', 0.035, i * 0.4); tone(990, 0.18, 'sawtooth', 0.035, i * 0.4 + 0.2); } },
  good: () => { tone(660, 0.12, 'triangle', 0.07); tone(990, 0.2, 'triangle', 0.06, 0.08); },
  bad: () => { tone(196, 0.3, 'sawtooth', 0.04); },
  tick: () => tone(1200, 0.05, 'square', 0.025),
  click: () => tone(1500, 0.04, 'sine', 0.03),
  step: () => tone(120 + Math.random() * 30, 0.05, 'triangle', 0.018),
  level: () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.35, 'triangle', 0.07, i * 0.09)); },
  ach: () => { [784, 988, 1175].forEach((f, i) => tone(f, 0.4, 'sine', 0.06, i * 0.12)); },
  type: () => tone(2200 + Math.random() * 300, 0.015, 'square', 0.008),
};
const CHORDS_DAY = [[261.6, 329.6, 392, 493.9], [220, 261.6, 329.6, 392], [174.6, 220, 261.6, 329.6], [196, 246.9, 293.7, 392]];
const CHORDS_NIGHT = [[220, 261.6, 329.6, 415.3], [174.6, 220, 261.6, 349.2], [146.8, 174.6, 220, 293.7], [164.8, 207.7, 246.9, 329.6]];
let musicStep = 0, musicTimer = 0;
/* v11.2 music choice: 'auto' (by time of day; the rooftop café always plays the lounge track), a track id, or 'off'. */
const MUSIC = { data: null, pick: (() => { try { return localStorage.getItem('prof-music') || 'auto'; } catch (e) { return 'auto'; } })() };
musicOn = MUSIC.pick !== 'off';
function musicWant() {
  const A = MUSIC.data.auto;
  if (Z && Z.id === 'roof') return A.cafe;
  if (MUSIC.pick !== 'auto') return MUSIC.pick;
  if (!S) return A.evening;
  const t = S.t; if (t < hm(9, 30)) return A.morning; if (t >= hm(20, 30)) return A.night; if (t >= hm(17, 30)) return A.evening;
  return A.day[Math.floor((t - hm(9, 30)) / 120) % A.day.length];   // a new daytime track every two in-game hours
}
function musicTick(dt) {
  if (!actx || !musicBus) return;
  if (MUSIC.data && window.ProfMusic) {
    musicBus.gain.value = 0;
    if (!musicOn) { ProfMusic.setVolume(0); return; }
    ProfMusic.setTrack(musicWant());
    ProfMusic.setVolume(S && S.running ? (S.paused ? 0.25 : 0.6) : 0.45);
    return;
  }
  const want = musicOn ? (S && S.running ? (S.paused ? 0.12 : 0.32) : 0.22) : 0;
  musicBus.gain.value += (want - musicBus.gain.value) * Math.min(1, dt * 1.5);
  musicTimer -= dt; if (musicTimer > 0) return;
  musicTimer = 4.2;
  if (!musicOn) return;
  const night = S && S.t > hm(18, 30), ch = (night ? CHORDS_NIGHT : CHORDS_DAY)[musicStep++ % 4];
  ch.forEach((f, i) => { tone(f / 2, 4.6, 'sine', 0.05, i * 0.04, musicBus); tone(f, 3.8, 'triangle', 0.018, 0.02 + i * 0.05, musicBus); });
  for (let i = 0; i < 4; i++) if (Math.random() < 0.6) tone(ch[(Math.random() * 4) | 0] * 2, 0.6, 'sine', 0.03, 0.6 + i * 0.9, musicBus);
}

/* ---------------- effects, XP, achievements ---------------- */
function applyFx(fx) {
  const out = [];
  for (const [k, raw] of Object.entries(fx || {})) {
    const d = Math.round(raw); if (!d) continue;
    if (k === 'energy' || k === 'full' || k === 'bladder') S.v[k] = clamp(S.v[k] + d);
    else if (k === 'grant') { if (S.submitted || S.day > 4) continue; S.grant = clamp(S.grant + d); }
    else if (k === 'paper') { if (S.paperSubmitted) continue; S.paper = clamp(S.paper + d); }
    else if (k === 'wellbeing') S.wb = clamp(S.wb + d);
    else if (k === 'partner' || k === 'child' || k === 'house') S.fam[k] = clamp(S.fam[k] + d);
    else if (k === 'gq') { if (S.submitted) continue; S.gq = clamp(S.gq + d); }
    else if (k === 'cash') { if (!S.fin) continue; finMove(d, applyFx.label); renderMoney(); }
    else if (k in S.k) { const [lo, hi, min] = BAL.kpiSoft, f = d > 0 ? BAL.kpiGain * Math.max(min, Math.min(1, (hi - S.k[k]) / (hi - lo))) : 1, v0 = S.k[k]; S.k[k] = clamp(S.k[k] + d * f); if (Math.round(S.k[k] - v0) !== d) { const a = Math.round(S.k[k] - v0); if (!a) continue; out.push([k, a]); const el = document.createElement('div'); el.className = 'fx ' + (a > 0 ? 'p' : 'm'); el.textContent = `${a > 0 ? '+' : ''}${a} ${FXNAME[k]}`; $('fxStream').appendChild(el); setTimeout(() => el.remove(), 2500); if (a > 0) gainXP(a * 3); continue; } }
    else continue;
    out.push([k, d]);
    const el = document.createElement('div');
    const good = k === 'bladder' ? d < 0 : d > 0;
    el.className = 'fx ' + (good ? 'p' : 'm'); el.textContent = k === 'cash' ? `${d > 0 ? '+' : ''}${fmtY(d)}` : `${d > 0 ? '+' : ''}${d} ${FXNAME[k]}`;
    $('fxStream').appendChild(el); setTimeout(() => el.remove(), 2500);
    if (k in S.k && d > 0) gainXP(d * 3);
    if (k === 'cash') continue;
  }
  return out;
}
function levelOf(xp) { let l = 0; LEVELS.forEach(([x], i) => { if (xp >= x) l = i; }); return l; }
function gainXP(n) {
  if (!S || n <= 0) return;
  S.xp += Math.round(n);
  const l = levelOf(S.xp);
  if (l > S.level) {
    S.level = l; SFX.level();
    $('lvlUp').innerHTML = `<div><div class="big">LEVEL UP</div><div class="sub">Lv.${l + 1} · ${LEVELS[l][1]}</div></div>`;
    setTimeout(() => { $('lvlUp').innerHTML = ''; }, 2700);
    if (player) burst(player.position.x, 1.2, player.position.z, [2, 1.6, 0.5], 70, 3);
    logIt(`升级：Lv.${l + 1} ${LEVELS[l][1]}`);
  }
  renderXP();
}
function renderXP() {
  const l = S.level, cur = LEVELS[l][0], nxt = LEVELS[l + 1] ? LEVELS[l + 1][0] : cur + 400;
  const pct = clamp((S.xp - cur) / (nxt - cur) * 100);
  $('pLv').textContent = 'Lv.' + (l + 1); $('pTitle').textContent = `${RANKS[S.career.rank].n}${postLabel(S.career)} · ${LEVELS[l][1]} · ${S.xp} XP`;
  $('xpBar').style.width = pct + '%'; $('pAvatar').style.setProperty('--xp', pct + '%');
}
function unlock(id) {
  if (!S || S.ach.includes(id) || !ACHIEVEMENTS[id]) return;
  S.ach.push(id); SFX.ach(); gainXP(40);
  const [n, d] = ACHIEVEMENTS[id];
  const el = document.createElement('div'); el.className = 'achT';
  el.innerHTML = `<div class="medal">★</div><div><small>ACHIEVEMENT UNLOCKED</small><b>${esc(n)}</b><span>${esc(d)}</span></div>`;
  $('ach').appendChild(el); setTimeout(() => el.remove(), 3700);
  logIt('解锁成就：' + n);
}
function toast(msg, kind = '') {
  if (SIM) return;
  placeNavChip();   // keep the notices under the navigator chip, wherever the clock panel has grown to
  const el = document.createElement('div'); el.className = 'toast ' + kind; el.textContent = msg;
  $('toasts').appendChild(el); setTimeout(() => el.remove(), 4200);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
}
function logIt(text) { S.log.push({ t: S.t, day: S.day, text }); }

/* ---------------- clock simulation ---------------- */
function minuteTick(dm) {
  const v = S.v, a = S.activity;
  let drain = 0.05;
  if (v.full < 15) drain *= 1.8;
  if (v.bladder > 85) drain *= 1.4;
  if (S.t > hm(22)) drain *= 1.25;
  if (S.moving && S.run) drain += 0.08;
  if (a && a.drain) drain += a.drain;
  v.energy = clamp(v.energy - drain * dm);
  v.full = clamp(v.full - 0.085 * dm);
  v.bladder = clamp(v.bladder + 0.068 * dm);
  if (a && a.perMin) a.perMin(dm);
  trackTime(dm);
  // Wellbeing: a working day wears you down slowly; evenings and overtime much faster.
  S.wb = clamp(S.wb - (S.t >= hm(21) ? BAL.wbDrain[2] : S.t >= hm(19) ? BAL.wbDrain[1] : BAL.wbDrain[0]) * dm * (S.intent === 'self' ? 0.6 : 1));
  if (v.full < 15) S.wb = clamp(S.wb - 0.01 * dm);
  if (S.wb < 20) { v.energy = Math.min(v.energy, 70); if (!S.warned.w) { S.warned.w = 1; toast('身心只剩 20%：你开始烦躁、走神。去六楼植物园走走，或者今天早点回家。', 'bad'); } }
  if (S.wb > 30) S.warned.w = 0;
  S.muons += 650 * dm;
  S.t += dm;
  if (a) { a.done += dm; if (a.min && a.done >= a.min) finishActivity(true); }
  if (v.energy < 30 && S.tiredDay == null) S.tiredDay = S.day;
  if (v.energy < 25 && !S.warned.e) { S.warned.e = 1; toast('精力只剩 25%：去沙发小睡，或者喝杯咖啡。', 'bad'); }
  if (v.energy > 40) S.warned.e = 0;
  if (v.full < 15 && !S.warned.f) { S.warned.f = 1; toast('肚子在叫了。饿着肚子，精力掉得更快。', 'bad'); }
  if (v.full > 30) S.warned.f = 0;
  if (v.bladder > 85 && !S.warned.b) { S.warned.b = 1; toast('尿意 85%：再不去洗手间就要出事了。', 'bad'); }
  if (v.bladder < 60) S.warned.b = 0;
  if (v.bladder >= 100) { v.bladder = 0; applyFx({ rep: -6, energy: -8 }); logIt('憋太久，在走廊上狂奔去洗手间，被学生看见了。'); toast('你冲进了洗手间……整层楼都看见了。声誉 −6', 'bad'); }
  updateEvents();
  if (v.energy <= 0) return endDay('collapse');
  if (S.t >= 1440) return endDay('time');
}
function simulate(minutes) { let left = minutes; while (left > 0 && !S.ended) { const d = Math.min(1, left); minuteTick(d); left -= d; } }

/* ---------------- events lifecycle ---------------- */
// v12.3.2: "阿杰在茶水间等你" used to mean a marker at the pantry and 阿杰 still typing at his desk.
// While an event is active its NPC stands beside the event's hotspot (same floor only), and goes back to his seat when it settles.
function npcToEvent(n, ev) {
  const h = !ev.phone && HS[ev.loc]; const u = n.userData; if (!h || (!n.visible && !u.visitor)) return;
  if (u.visitor) n.visible = true; if ((h.zone || 'f5') !== (u.zone || 'f5')) return;
  const dx = n.position.x - h.x, dz = n.position.z - h.z; if (!u.visitor && dx * dx + dz * dz < 2.5 * 2.5) return;   // already there (his own desk, the detector…)
  if (!u.home) u.home = { x: n.position.x, z: n.position.z, ry: n.rotation.y, seated: !!u.seated, base: u.baseState };
  u.away = ev.id || true; u.seated = false; u.baseState = 'idle'; u.state = 'idle';
  n.position.set(h.x + 0.9, 0, h.z + 0.6); face(n, h.x, h.z);
}
function npcHome(n) {
  const u = n.userData, h = u.home; if (!h || !u.away) return;
  if (activeEvents().some(e => e.npc === u.modelId && e.id !== u.away && HS[e.loc])) { u.away = null; return; }   // another event still wants him elsewhere
  n.position.set(h.x, 0, h.z); n.rotation.y = h.ry; u.seated = h.seated; u.baseState = h.base; u.state = h.base || 'idle'; u.away = null;
  if (u.visitor) n.visible = false;
}
function activeEvents() { return S.events.filter(e => e.state === 'active'); }
function updateEvents() {
  for (const ev of S.events) {
    if (ev.state === 'pending' && S.t >= ev.at) {
      ev.state = 'active'; ev.deadline = ev.until ?? (ev.at + ev.win); S.hadQuests = true;
      if (!ev.phone) { const h = HS[ev.loc]; ev.marker = makeMarker(h.x, h.z, !!(ev.urgent || ev.alarm), h.zone || 'f5'); }
      if (ev.npc && NPC[ev.npc]) { const n = NPC[ev.npc]; npcToEvent(n, ev); if (ev.urgent || ev.alarm) { n.userData.state = 'panic'; setExpr(n, 'shock'); setEmote(n, '!!'); } else { setEmote(n, '!'); if (ev.mood) setExpr(n, ev.mood); } }
      if (ev.phone) { SFX.ring(); toast('电话：' + ev.title); }
      else if (ev.alarm) { SFX.alarm(); toast('警报：' + ev.title, 'bad'); }
      else { SFX.ping(); toast((ev.urgent ? '紧急：' : '新任务：') + ev.line, ev.urgent ? 'bad' : ''); }
      questsDirty = true;
      if ((ev.urgent || ev.alarm) && !ev.phone && S.activity && S.activity.deep && !S.dialog) askInterrupt(ev);
    } else if (ev.state === 'active' && S.t > ev.deadline && (!S.dialog || S.dialog.ev !== ev)) {
      ev.state = 'expired'; settleEvent(ev);
      if (/^adm_/.test(ev.id) && ev.urgent) S.adminMissed = (S.adminMissed || 0) + 1;
      applyFx(ev.expire.fx); if (ev.expire.log) { logIt(ev.expire.log); toast(ev.expire.log, 'bad'); }
      S.wb = clamp(S.wb - BAL.expiredWb); remember(ev, 'ignored'); if (ev.npc && S.trust[ev.npc] !== undefined) S.trust[ev.npc] = clamp(S.trust[ev.npc] - 10);
      if (ev.expire.lose && ev.crisisOf) loseStudent(ev.crisisOf);
      if (ev.id === 'fin_consultMeet' && S.fin) S.fin.consultHalf = true;
      if (ev.id === 'fin_lease' && S.fin) finFlag('fin_renew');
      SFX.bad(); questsDirty = true;
    }
  }
}
function settleEvent(ev) {
  if (ev.marker) { ev.marker.parent.remove(ev.marker); ev.marker = null; }
  if (ev.npc && NPC[ev.npc]) { const n = NPC[ev.npc]; setEmote(n, null); npcHome(n); n.userData.state = n.userData.baseState || 'idle'; setExpr(n, ev.state === 'resolved' ? 'happy' : 'normal'); setTimeout(() => { if (n.userData.expr === 'happy') setExpr(n, 'normal'); }, 6000); }
  if (ev.state === 'resolved' && !activeEvents().length) { S.clears++; if (S.clears >= 3) unlock('allclear'); }
}

/* ---------------- v12.2: companions (约人) and table talks (assets/data/content/table.json) ---------------- */
const TABLE = {};
function compName(id) { const p = TABLE.people && TABLE.people[id]; return p ? p.n : (STUDENTS[id] ? STUDENTS[id].n : id); }
function compPerk(id) { const p = TABLE.people && TABLE.people[id]; return p && p.perk ? p.perk : '信任 +' + ((TABLE.places.canteen || {}).trust || 6); }
// Who can come, and why the others cannot. A student who is waiting for you somewhere, in crisis, or already came today is not free.
function companionsFor(place) {
  const P = TABLE.places && TABLE.places[place]; if (!P || !S) return { ok: [], no: [] };
  const today = S.companions[S.day] || {}, ok = [], no = [];
  for (const id of P.who) {
    const pp = TABLE.people[id] || {}, name = compName(id);
    if (S.lost.includes(id)) continue;
    if (today[id]) { no.push(`${name}今天已经和你吃过/喝过了`); continue; }
    if (S.crisis[id] === S.day) { no.push(`${name}今天状态不好，先单独谈谈`); continue; }
    const busy = activeEvents().find(e => e.npc === id);
    if (busy) { no.push(`${name}在等你处理「${shortTitle(busy.title)}」`); continue; }
    if (pp.days && !pp.days.includes(S.day)) { no.push(`${name}今天不在`); continue; }
    if (pp.from && S.t < hm(...pp.from.split(':').map(Number))) { no.push(`${name}这会儿还在上班`); continue; }
    if (id === 'coach' && S.coachWeek === S.week) { no.push(`${name}这周已经约过了`); continue; }
    ok.push(id);
  }
  return { ok, no };
}
// The "who comes along?" question. Returns false when nobody is free (the caller just carries on alone).
function whoDialog(place, then) {
  const { ok, no } = companionsFor(place); if (!ok.length) return false;
  const cost = place === 'canteen' ? TABLE.treat.canteen : TABLE.treat.cafe;
  const ch = ok.map(id => ({ t: `叫上${compName(id)}（请客 ${fmtY(cost)}）`, d: `多 10 分钟 · ${compPerk(id)}${STUDENTS[id] ? `（现在 ${Math.round(S.trust[id])}）` : ''}`, run: () => then(id) }));
  ch.push({ t: '一个人吃', d: '快一点', run: () => then(null) });
  openDialog({ id: place + 'Who', loc: place === 'canteen' ? 'canteen' : 'roofcafe', who: '约人', tag: '吃饭', title: '叫谁一起？', synthetic: true, start: 'a',
    nodes: { a: { say: [['', '饭桌上，人会说办公室里不说的话。'], ...(no.length ? [['', no.join('；') + '。']] : [])], choices: ch } } });
  return true;
}
function openGarden() {
  const { ok } = companionsFor('garden');
  if (!ok.length) return ACT.walk(20);
  openDialog({ id: 'gardenWho', loc: 'garden', who: '六楼植物园', tag: '散步', title: '一个人走走，还是给阿玲打个电话？', synthetic: true, start: 'a',
    nodes: { a: { say: [['', '凉亭里没有人。远处高山区的石头上还有一点“雪”。']], choices: [
      { t: '一个人走 20 分钟', d: `身心 +9${!S.submitted && S.day <= 4 && !S.inspired ? ' · 也许能想清楚基金的一个点' : ''}`, run: () => ACT.walk(20) },
      { t: '一边走一边给阿玲打电话', d: `20 分钟 · ${compPerk('partner')}`, run: () => ACT.walk(20, 'partner') },
      { t: '不走了', d: '' }] } } });
}
// After the meal or the coffee: the bill, trust, the place's perk, and maybe something said at the table.
function companionDone(place, id) {
  (S.companions[S.day] = S.companions[S.day] || {})[id] = place;
  const P = TABLE.places[place] || {}, cost = place === 'canteen' ? TABLE.treat.canteen : place === 'cafe' ? TABLE.treat.cafe : 0;
  if (cost && S.fin) finSpend(cost, `请${compName(id)}`, {});
  if (S.trust[id] !== undefined && P.trust) S.trust[id] = clamp(S.trust[id] + trustGain(P.trust));
  if (id === 'zhao' && place === 'cafe') { S.zhaoFlow = true; toast('赵博士把你基金书里卡住的那段讲通了。下一段写作一开始就有专注。', 'good'); }
  if (id === 'coach') { S.coachWeek = S.week; if (!S.submitted && S.day <= 4 && addStar('grant', 'letter', 1, true)) toast(`陈老师答应在合作信里多写一段：${STAR(S.dos.grant.letter)}`, 'good'); }
  if (id === 'wang') {
    if (S.fin && S.fin.reimb && S.fin.reimb.length) { S.fin.reimb.shift(); toast('王老师帮你把一张餐费票据的手续补齐了，不怕审计了。', 'good'); }
    else { activeEvents().filter(e => e.loc === 'admin').forEach(e => { e.deadline += 60; }); toast('王老师：“院办的事您别急，我先帮您压着。”（院办事项多 1 小时）', 'good'); }
  }
  if (id === 'partner') { S.fam.partner = clamp(S.fam.partner + 3); }
  logIt(`和${compName(id)}在${{ canteen: '食堂', cafe: '天台', garden: '植物园' }[place]}待了一会儿。`);
  tableTalk(place, id);
}
// A table talk: at most one per meal, each once per career, seeded so a reload cannot reroll it.
function tableTalk(place, id) {
  const chance = (TABLE.chance || {})[place] || 0; if (!chance || !TABLE.events) return;
  const pool = TABLE.events.filter(e => e.npc === id && !S.tableSeen.includes(e.id)); if (!pool.length) return;
  const h = id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7) >>> 0;
  if (rng((S.week * 7919 + S.day * 104729 + h) % 2147483646 + 1)() >= chance) return;
  const e = pool[0]; S.tableSeen.push(e.id); S.tableLog.push({ day: S.day, id: e.id, npc: id });
  const ev = Object.assign(mkC(S.day, fmt(S.t), place === 'cafe' ? 'roofcafe' : 'canteen', e.who, '饭桌', e.title, e.title, e.open, e.ch, { id: e.id, pro: false }), { state: 'active', table: true });
  openDialog(ev);
}

/* ---------------- activities ---------------- */
// The pantry and takeaway keep the old everyday food; the canteen serves the world kitchens.
const FOOD_PANTRY = () => S.t < hm(10, 30) ? ['包子和豆浆', '早餐'] : S.t < hm(15) ? ['食堂打包的红烧肉便当', '午饭'] : S.t < hm(20, 30) ? ['外卖的兰州拉面', '晚饭'] : ['办公室囤的泡面', '宵夜'];
const FOOD = () => S.t < hm(10, 30) ? [canteenBreakfast(), '早餐'] : S.t < hm(15) ? [canteenPick()[0], '午饭'] : S.t < hm(20, 30) ? [canteenPick()[0], '晚饭'] : ['办公室囤的泡面', '宵夜'];
/* v11.2 world kitchens (assets/data/canteen.json): six of TasteAtlas's top-20 cuisines open each day, one signature dish each. */
function canteenDay() { return S ? ((S.week || 1) - 1) * 7 + (S.day || 0) : 0; }
function canteenToday() {
  const D = CANTEEN.data; if (!D) return [];
  const d = canteenDay(), n = D.cuisines.length, k = D.stallsPerDay || 6;
  return Array.from({ length: k }, (_, i) => { const c = D.cuisines[(d * k + i) % n]; return { c, dish: c.dishes[(d + i) % c.dishes.length] }; });
}
function canteenBreakfast() { const B = CANTEEN.data && CANTEEN.data.breakfast; return B ? B[canteenDay() % B.length][0] : '包子和豆浆'; }
function canteenPick() { const T = canteenToday(); if (!T.length) return ['食堂的红烧肉便当', null]; const p = T[(Math.random() * T.length) | 0]; return [`${p.c.zh}档 · ${p.dish[0]}`, p]; }
function canteenSigns() {
  const T = canteenToday(), key = canteenDay(); if (!T.length || CANTEEN.signDay === key) return; CANTEEN.signDay = key;
  CANTEEN.stalls.forEach((sg, i) => {
    const p = T[i], tx = sg.material.map, c = tx.userData.canvas, g = c.getContext('2d'), w = 400, h = 190;
    g.fillStyle = '#14181d'; g.fillRect(0, 0, w, h);
    p.c.flag.forEach((col, j) => { g.fillStyle = col; g.fillRect(j * w / 3, 0, w / 3 + 1, 14); });
    g.fillStyle = '#ffd9a0'; g.font = `800 15px ${CN_FONT}`; g.fillText(`No.${p.c.rank} · ${p.c.en.toUpperCase()}`, 16, 40);
    g.fillStyle = '#ffffff'; g.font = `900 40px ${CN_FONT}`; g.fillText(p.c.zh, 16, 88);
    g.fillStyle = '#EAF4FB'; g.font = `700 20px ${CN_FONT}`; g.fillText(p.dish[0].length > 16 ? p.dish[0].slice(0, 16) + '…' : p.dish[0], 16, 126);
    g.fillStyle = 'rgba(234,244,251,.6)'; g.font = `500 14px ${CN_FONT}`; g.fillText(p.dish[1].length > 40 ? p.dish[1].slice(0, 40) + '…' : p.dish[1], 16, 152);
    g.fillStyle = '#c9a227'; g.font = `600 12px ${CN_FONT}`; g.fillText('今日主厨推荐 · CHEF\'S SIGNATURE', 16, 176);
    tx.needsUpdate = true;
  });
}
// At the counter: breakfast is quick; at lunch and dinner you choose a stall. A cuisine new to you this week lifts the mood a little more.
function canteenMenu(comp) {
  const T = canteenToday();
  if (S.t < hm(10, 30) || S.t >= hm(20, 30) || !T.length) return ACT.canteen(20);
  if (comp === undefined && TABLE.places) { const w = whoDialog('canteen', (id) => canteenMenu(id)); if (w) return; comp = null; }
  canteenSigns();
  const tried = S.cuisines || {}, ch = T.map(p => ({ t: `${p.c.zh} · ${p.dish[0]}`, d: `${p.c.en} · ${p.dish[1]}${tried[p.c.id] ? '' : ' · 本周第一次'}`, run: () => ACT.canteen(comp ? 30 : 20, [`${p.c.zh}档 · ${p.dish[0]}`, p], comp) }));
  ch.push({ t: '算了，不吃了', d: '' });
  openDialog({ id: 'canteenMenu', loc: 'canteen', who: '食堂 · 世界美食档口', tag: '吃饭', title: `今天开张的 6 个档口（第 ${canteenDay() + 1} 天）`, synthetic: true, start: 'a',
    status: [['排名来源', 'TasteAtlas 2025/26'], ['本周尝过', `${Object.keys(tried).length} / 20`]], nodes: { a: { say: [['', '六个档口今天换了菜。每个档口一道主厨招牌。']], choices: ch } } });
}
function startActivity(a) {
  S.path = []; S.autoTarget = null;
  if (a.deep) { S.flow = S.flowCarry && S.t - S.flowCarry.t <= 5 ? S.flowCarry.v : 0; S.flowCarry = null;
    // v12.2: coffee with Dr Zhao means you sit down already thinking; a garden walk brings an idea to the grant
    if (S.zhaoFlow) { S.flow = Math.max(S.flow, 15); S.zhaoFlow = false; }
    if (S.inspired && a.kind === 'grant') { S.inspired = false; addStar('grant', 'idea', 1); } }
  S.activity = Object.assign({ done: 0, ff: 8, cancelable: true }, a);
  $('activity').classList.remove('hidden'); $('actIcon').textContent = a.icon || '…';
  renderActivity();
}
function finishActivity(completed) {
  const a = S.activity; if (!a) return;
  S.activity = null; $('activity').classList.add('hidden');
  if (player) { player.userData.state = 'idle'; player.userData.seated = false; player.visible = true; if (player.userData.expr !== 'normal') setExpr(player, 'normal'); }
  if (completed && a.onDone) a.onDone();
  if (!completed && a.onCancel) a.onCancel();
}
function renderActivity() {
  const a = S.activity; if (!a) return;
  const pct = a.min ? Math.min(100, a.done / a.min * 100) : S.grant;
  $('actTitle').innerHTML = `${esc(a.label)} <span>${a.type === 'write' ? `${a.kind === 'grant' ? '基金' : '论文'} ${Math.floor(S[a.kind])}% · 专注 ${Math.round(flowMul() * 100)}%` : Math.round(pct) + '%'}</span>`;
  $('actBar').firstElementChild.style.width = pct + '%';
  $('actHint').innerHTML = a.cancelable ? `时间快进中 · 按 <span class="key">E</span> ${esc(a.cancelText || '先不做了')}` : '时间快进中…';
}
function grantRate() { const v = S.v; let r = 0.5; if (v.energy < 40) r *= 0.65; if (v.energy < 20) r *= 0.6; if (v.bladder > 85) r *= 0.5; if (v.full < 15) r *= 0.6; return r; }
/* ---------------- v5: time blocks, focus, wellbeing, trust, memory ---------------- */
function blockIdx(t) { for (let i = BLOCKS.length - 1; i >= 0; i--) if (t >= BLOCKS[i].from) return i; return 0; }
// Deep work runs to the end of the current block; < 20 min left rolls over to the next block.
function commitEnd() { let i = blockIdx(S.t), end = BLOCKS[i].to; if (end - S.t < 20 && i < BLOCKS.length - 1) end = BLOCKS[i + 1].to; return Math.min(end, 1439); }
// Focus ramps from 15% to 100% over 30 min (40 min when wellbeing is low).
function flowMul() { const ramp = S.wb < 40 ? 40 : 30; return Math.min(1, 0.15 + 0.85 * S.flow / ramp); }
function endFocus(completed, kind) {
  if (S.flow >= 90 && kind) addStar(kind, kind === 'grant' ? 'write' : 'figure', 1);
  if (S.flow >= 90) { S.focusBlocks++; if (S.focusBlocks === 1) toast('完整的一段专注时间：这才是写东西的节奏。', 'good'); }
  S.flowCarry = completed ? { t: S.t, v: S.flow } : null; S.flow = 0;
}
function breakFocus() { if (S.activity && S.activity.deep && S.flow > 5) toast('专注被打断了：重新进入状态需要时间。', 'bad'); S.flow = 0; S.flowCarry = null; }
function catNow() {
  const a = S.activity;
  if (S.atHome) return 'home';
  if (S.dialog) return 'events';
  if (S.traveling) return 'travel';
  if (a) return { write: a.kind, submit: a.kind, read: 'research', lecture: 'teach', meeting: 'meet', multitask: 'meet', sport: 'sport' }[a.type] || 'self';
  return S.moving ? 'travel' : 'idle';
}
function trackTime(dm) {
  const i = blockIdx(S.t), c = catNow();
  const u = S.blockUse[i] || (S.blockUse[i] = {}); u[c] = (u[c] || 0) + dm;
  S.timeWeek[c] = (S.timeWeek[c] || 0) + dm;
}
function topCat(u) { let best = null, bv = 0; for (const k in u || {}) if (k !== 'idle' && u[k] > bv) { bv = u[k]; best = k; } return bv >= 15 ? best : null; }
function trustGain(n) { return Rules.trustGain(n, S.intent); }   // v13.2: src/rules/pure.js
function shortTitle(t) { const x = String(t).split('：'); return (x.length > 1 ? x.slice(1).join('：') : x[0]).split(' · ')[0].slice(0, 14); }
function remember(ev, kind) {
  if (!ev.npc || ev.synthetic) return;
  const m = S.mem[ev.npc] || (S.mem[ev.npc] = []);
  m.push({ day: S.day, t: S.t, title: shortTitle(ev.title), kind }); if (m.length > 6) m.shift();
}
// One line per NPC per day, recalling the most recent earlier interaction.
function memoryLine(ev) {
  const id = ev.npc, m = S.mem[id], lines = MEMLINES[id];
  if (!m || !lines || S.memToday[id]) return null;
  const e = [...m].reverse().find(x => x.day < S.day || S.t - x.t > 120); if (!e) return null;
  S.memToday[id] = 1;
  const pool = lines[e.kind] || lines.good, tpl = pool[(S.day + m.length) % pool.length];
  return [Object.keys(SPEAKERS).find(k => SPEAKERS[k] === id) || '', tpl.replace('{t}', e.title)];
}
function memorySummary(id) {
  const m = S.mem[id] || []; if (!m.length) return '';
  const word = { good: '处理得让你满意', bad: '让你失望', ignored: '教授没有来' };
  return m.map(x => `${DAYS[x.day].name}「${x.title}」${word[x.kind]}`).join('；');
}
function loseStudent(id) {
  if (S.lost.includes(id)) return;
  S.lost.push(id); applyFx({ team: -10, rep: -3 }); S.wb = clamp(S.wb - 6);
  const p = STUDENTS[id]; logIt(`${p.n}离开了课题组。`); toast(`${p.n}提交了转导师申请，离开了课题组。`, 'bad'); SFX.bad();
  if (NPC[id]) NPC[id].visible = false;
}
// Urgent event during deep work: pause and let the player choose.
function askInterrupt(ev) {
  const h = HS[ev.loc], zn = (h.zone || 'f5') !== Z.id ? ZONES[h.zone || 'f5'].name.split(' · ')[0] + ' · ' : '';
  openDialog({ id: 'intr', loc: ev.loc, who: '专注被打断', tag: '决定', title: ev.title, synthetic: true, start: 'a', urgent: true,
    status: [['正在做', S.activity.label.split(' · ')[0]], ['专注', Math.round(flowMul() * 100) + '%'], ['要你去', zn + h.name]],
    nodes: { a: { say: [['', `${ev.line}`], ['', '现在过去，专注就断了；不去，这件事可能会过期。']], choices: [
      { t: '马上过去处理', d: '专注中断', run: () => { if (S.activity) finishActivity(false); routeTo(h.x, h.z, h.zone || 'f5', ev); } },
      { t: '继续写，等这段写完再说', d: `还剩 ${Math.max(0, Math.round(ev.deadline - S.t))} 分钟会过期` },
    ] } } });
}
function rumour() {
  const d = S.day + 1; if (d > 6 || S.intel[d]) { if (d <= 6) toast('咖啡师：“今天没听到什么新鲜事。”'); return; }
  S.intel[d] = true;
  const peek = buildDay(d, setup.day).filter(e => e.urgent || e.alarm).slice(0, 2);
  const msg = peek.length ? `邻桌的人在聊：明天${peek.map(e => `${fmt(e.at)}「${shortTitle(e.title)}」`).join('、')}。` : '邻桌的人说明天应该挺平静。';
  S.rumours = (S.rumours || []).concat([{ day: d, text: msg }]);
  toast('天台八卦：' + msg + '（明天这些事的处理时间 +50%）', 'good'); logIt('在天台听到的消息：' + msg);
}
function pose(state, x, z, ry, seated) { if (x !== undefined) { player.position.x = x; player.position.z = z; } if (ry !== undefined) player.rotation.y = ry; player.userData.state = state; player.userData.seated = !!seated; }
const PANTRY_SEAT = [28.6 + Math.cos(Math.PI * 2 / 3) * 0.95, 19.6 + Math.sin(Math.PI * 2 / 3) * 0.95];
const ACT = {
  // Deep work: commits to the rest of the current time block; progress ramps with focus (flow).
  write: (kind = 'grant') => { const isG = kind === 'grant', end = commitEnd(); pose('type', 3, 3.95, Math.PI, true);
    startActivity({ type: 'write', kind, deep: true, label: (isG ? '写基金申请书' : '改论文修改稿') + ' · 到 ' + fmt(end), icon: isG ? '书' : '文', min: end - S.t, ff: 7, drain: 0.03, cancelText: '先停一下（专注会中断）',
    perMin: (dm) => { S.flow += dm; const before = Math.floor(S[kind] / 10); const boost = S.intent === kind ? 1.2 : 1; S[kind] = clamp(S[kind] + grantRate() / 0.5 * (isG ? 0.18 : 0.21) * flowMul() * boost * dm); if (isG) S.gq = clamp(S.gq + 0.004 * dm * flowMul()); if (Math.floor(S[kind] / 10) > before) gainXP(8); if (S[kind] >= 100 && S.activity && S.activity.type === 'write') finishActivity(true); },
    onDone: () => { pose('idle', 3, 4.75); endFocus(true, kind); if (S[kind] >= 100) { toast(isG ? '基金申请书写完了！在办公桌按 E 提交。' : '论文修改稿改完了！在办公桌按 E 提交。', 'good'); SFX.good(); } else toast(`${BLOCKS[blockIdx(S.t - 1)].name}时段结束：${isG ? '基金' : '论文'} ${Math.floor(S[kind])}%。在办公桌按 E 可以接着写，专注不会断。`); },
    onCancel: () => { pose('idle', 3, 4.75); endFocus(false, kind); } }); },
  submit: (kind = 'grant') => { const isG = kind === 'grant'; pose('type', 3, 3.95, Math.PI, true); startActivity({ type: 'submit', label: isG ? '上传并提交基金申请书' : '在投稿系统提交修改稿', icon: '交', min: 6, ff: 6, cancelable: false,
    onDone: () => { if (isG) { S.submitted = true; S.subWb = S.wb; } else S.paperSubmitted = true; pose('idle', 3, 4.75); setExpr(player, 'happy'); applyFx({ rep: 4 }); gainXP(80); unlock(isG ? 'grant' : 'paper'); logIt(isG ? '基金申请书提交成功。系统显示：已提交，不可修改。' : '论文修改稿提交成功。'); toast(isG ? '基金提交成功！' : '论文修改稿提交成功！', 'good'); SFX.good(); burst(3, 1.4, 4.5, [0.6, 1.6, 2.2], 60, 2.5); } }); },
  nap: () => { pose('sit', 1.25, 8, Math.PI / 2, true); setExpr(player, 'sleepy'); setEmote(player, 'zz'); startActivity({ type: 'nap', label: '在沙发上小睡', icon: '眠', min: 25, ff: 12, drain: -0.05, perMin: (dm) => { S.v.energy = clamp(S.v.energy + 1.1 * dm); },
    onDone: () => { setEmote(player, null); pose('idle', 2.3, 8); S.wb = clamp(S.wb + 2); toast('睡醒了，精力回来了一些。'); logIt('在办公室沙发上睡了 25 分钟。'); }, onCancel: () => { setEmote(player, null); pose('idle', 2.3, 8); } }); },
  coffee: () => { const gain = [16, 12, 8, 5, 3][Math.min(4, S.coffees)]; pose('talk', 27.6, 23.9, 0);
    startActivity({ type: 'coffee', label: '冲一杯手冲咖啡', icon: '啡', min: 4, ff: 6, onDone: () => { S.coffees++; S.coffeesWeek++; applyFx({ energy: gain, bladder: 16 }); if (S.coffees >= 4) unlock('caffeine'); if (S.coffees === 4) toast('第四杯了，咖啡因的效果在递减。'); } }); },
  eat: () => { const [food, meal] = FOOD_PANTRY(); pose('sit', PANTRY_SEAT[0], PANTRY_SEAT[1], Math.atan2(28.6 - PANTRY_SEAT[0], 19.6 - PANTRY_SEAT[1]), true); setExpr(player, 'happy');
    startActivity({ type: 'eat', label: food + ' · 还温的', icon: '饭', min: 16, ff: 8, perMin: (dm) => { S.v.full = clamp(S.v.full + 4.2 * dm); S.v.energy = clamp(S.v.energy + 0.35 * dm); },
      onDone: () => { S.meals++; S.mealsWeek++; logIt(`吃了${meal}：${food}。`); pose('idle', 30.2, 23.9); }, onCancel: () => pose('idle', 30.2, 23.9), cancelText: '先不吃了' }); },
  wc: () => { player.visible = false; startActivity({ type: 'wc', label: '洗手间', icon: '厕', min: 4, ff: 6, cancelable: false, perMin: (dm) => { S.v.bladder = clamp(S.v.bladder - 30 * dm); } }); },
  lecture: (min) => { pose('present', 6, 22.9, Math.PI); startActivity({ type: 'lecture', label: '上课：狭义相对论', icon: '课', min, ff: 12, drain: 0.04, cancelText: '提前下课',
    onDone: () => { pose('idle', 6, 22.3); toast('下课了。拿出手机一看……'); logIt('上完 90 分钟的大学物理。'); gainXP(40); }, onCancel: () => { pose('idle', 6, 22.3); applyFx({ teaching: -8 }); logIt('提前下课，学生们一脸疑惑。'); } }); },
  meeting: (min) => { pose('sit', 14.75, 21.05, Math.PI / 2, true); startActivity({ type: 'meeting', label: '开会中', icon: '会', min, ff: 12, drain: 0.03, cancelText: '中途离场',
    onDone: () => pose('idle', 16, 18.4), onCancel: () => { pose('idle', 16, 18.4); applyFx({ rep: -4 }); logIt('会开到一半离场。'); } }); },
  canteen: (min, pick, comp) => { const [food0, meal] = FOOD(), food = pick ? pick[0] : food0, cui = pick && pick[1] ? pick[1].c : null; pose('sit', 28, 3.7, 0, true); setExpr(player, 'happy'); startActivity({ type: 'eat', label: `食堂 · ${food}${comp ? ' · 和' + compName(comp) : ''}`, icon: '饭', min, ff: 8, perMin: (dm) => { S.v.full = clamp(S.v.full + 3.6 * dm); S.v.energy = clamp(S.v.energy + 0.4 * dm); },
    onDone: () => { S.meals++; S.mealsWeek++; const first = cui && !(S.cuisines || {})[cui.id]; if (cui) (S.cuisines = S.cuisines || {})[cui.id] = 1; applyFx({ wellbeing: first ? 5 : 3 }); if (meal !== '早餐') { S.mealsOut++; if (!comp) S.mealsAlone++; } logIt(`在食堂${comp ? '和' + compName(comp) : '和同事们'}一起吃了${meal}：${food}${first ? `（这周第一次吃${cui.zh}菜）` : ''}。`); pose('idle', 28, 2.6); if (comp) companionDone('canteen', comp); }, onCancel: () => pose('idle', 28, 2.6), cancelText: '先不吃了' }); },
  read: (min) => { pose('read', 13, 18.3, 0, true); startActivity({ type: 'read', label: '在图书馆读论文', icon: '读', min, ff: 10, drain: -0.02, perMin: (dm) => { S.paper = S.paperSubmitted ? S.paper : clamp(S.paper + 0.12 * dm); },
    onDone: () => { applyFx({ research: 2, energy: 4 }); S.reads++; if (!S.submitted && S.day <= 4) { if (addStar('grant', 'idea', 1, true)) toast(`读到一篇好文章，基金书多了一个创新点：${STAR(S.dos.grant.idea)}`, 'good'); else toast('又读了一篇，创新点已经够清楚了；现在缺的是数据和写作。'); } if (S.reads >= 3) unlock('bookworm'); logIt('在图书馆安静地读了半小时论文，记下了两个基金书可以用的想法。'); pose('idle', 13, 17.6); }, onCancel: () => pose('idle', 13, 17.6) }); },
  tennis: (min) => sport('tennis', min, { x: 12, z: 13, lx: 26, lz: 13, label: '和化学系陈老师打网球', fx: { energy: 12, full: -10, bladder: 4, rep: 2, wellbeing: 5 }, partner: 'coach', log: '和化学系的陈老师打了一局网球，聊起了各自的基金。',
    after: () => { if (!S.flags.ally_coach) { S.flags.ally_coach = 1; toast('陈老师：“你那个基金，我们组的表面分析也许帮得上忙。”（周五前他会联系你）', 'good'); logIt('陈老师成了你的合作伙伴。'); } } }),
  bmatch: () => bmOffer('wu', { event: 'chem' }),
  badminton: (min) => sport('badminton', min, { x: 20, z: 11, lx: 20, lz: 17, label: '和研究生们打羽毛球', fx: { energy: 11, full: -8, bladder: 3, team: 3, wellbeing: 4 }, partner: 'grad1', log: '和研究生们打了一场羽毛球。',
    after: () => { Object.keys(S.trust).forEach(id => { if (!S.lost.includes(id)) S.trust[id] = clamp(S.trust[id] + trustGain(6)); }); toast(`学生们对你的信任都上升了（+${trustGain(6)}）。球场上的老师，和办公室里的不太一样。`, 'good'); } }),
  soccer: (min) => sport('soccer', min, { x: 58, z: 46, lx: 84, lz: 46, label: '和本科生踢球', fx: { energy: 12, full: -14, bladder: 4, team: 4, wellbeing: 4 }, log: '和本科生们在足球场踢了一场球。',
    after: () => { if (!S.recruit) { S.recruit = true; S.flags.recruit = 1; toast('中场休息时，一个大二学生小吴问：“老师，本科生能进您的组吗？”', 'good'); logIt('踢球时认识了大二的小吴，他想进组。'); } } }),
  walk: (min, comp) => { pose('walk', undefined, undefined, undefined, false); startActivity({ type: 'walk', label: comp ? '在植物园里散步 · 和阿玲打电话' : '在植物园里散步 · 身心恢复中', icon: '花', min, ff: 10, drain: -0.06, perMin: (dm) => { S.v.energy = clamp(S.v.energy + 0.55 * dm); S.wb = clamp(S.wb + 0.45 * dm); }, cancelText: '走回去',
    perFrame: (t) => { const a = t * 0.5; player.position.set(20 + Math.cos(a) * 1.6, 0, 13 + Math.sin(a) * 1.0); player.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a)); },
    onDone: () => { logIt(comp ? '在植物园里一边走一边和阿玲打电话。' : '在六楼植物园里走了一圈。'); pose('idle', 20, 13);
      if (comp) companionDone('garden', comp);
      else if (min >= 20 && !S.inspired && !S.submitted && S.day <= 4) { S.inspired = true; toast('走到第三圈，基金书的一个想法突然清楚了。下一段写基金时，创新点 +1 星。', 'good'); } },
    onCancel: () => pose('idle', 20, 13) }); },
  roofcoffee: (min, comp) => { const gain = [14, 12, 10, 8, 6][Math.min(4, S.coffees)]; pose('sit', 14 + 1.0, 11, -Math.PI / 2 - 0 + Math.PI, true); startActivity({ type: 'coffee', label: '天台 · 一杯手冲', icon: '啡', min, ff: 8, drain: -0.04,
    onDone: () => { S.coffees++; S.coffeesWeek++; applyFx({ energy: gain, bladder: 14, wellbeing: 2 }); if (S.coffees >= 4) unlock('caffeine'); logIt(comp ? `在天台和${compName(comp)}喝了一杯咖啡。` : '在天台喝了一杯咖啡，看了一会儿城市。'); pose('idle', 9, 7.8); rumour(); if (comp) companionDone('cafe', comp); }, onCancel: () => pose('idle', 9, 7.8) }); },
  roofeat: (min) => { pose('sit', 15, 11, Math.PI / 2, true); setExpr(player, 'happy'); startActivity({ type: 'eat', label: '天台 · 三明治和拿铁', icon: '饭', min, ff: 8, perMin: (dm) => { S.v.full = clamp(S.v.full + 2.6 * dm); S.v.energy = clamp(S.v.energy + 0.6 * dm); },
    onDone: () => { S.meals++; S.mealsWeek++; S.coffees++; applyFx({ bladder: 10 }); logIt('在天台吃了三明治，喝了拿铁。'); pose('idle', 9, 7.8); }, onCancel: () => pose('idle', 9, 7.8) }); },
  multitask: (min) => { pose('type', 14.75, 21.05, Math.PI / 2, true); startActivity({ type: 'multitask', label: '一边开会一边写基金', icon: '双', min, ff: 12, drain: 0.05,
    perMin: (dm) => { S.grant = clamp(S.grant + grantRate() * 0.4 * dm); }, onDone: () => pose('idle', 16, 18.4), onCancel: () => pose('idle', 16, 18.4) }); },
};

function sport(kind, min, o) {
  pose('play', o.x, o.z, Math.atan2(o.lx - o.x, o.lz - o.z));
  const partner = o.partner && NPC[o.partner]; if (partner) { partner.userData.state = 'play'; setExpr(partner, 'happy'); }
  Z.balls.forEach(b => { b.active = true; });
  startActivity({ type: 'sport', label: o.label, icon: '球', min, ff: 10, drain: 0.02, cancelText: '不打了',
    onDone: () => { applyFx(o.fx); if (o.after) o.after(); S.sports[kind] = 1; if (S.sports.tennis && S.sports.badminton && S.sports.soccer) unlock('athlete'); gainXP(20); logIt(o.log); finish(); },
    onCancel: finish });
  function finish() { if (partner) { partner.userData.state = partner.userData.baseState || 'idle'; setExpr(partner, 'normal'); } Z.balls.forEach(b => { b.active = b.kind === 'soccer' || (b.kind === 'shuttle' && b.from[0] !== 20); }); pose('idle', o.x, o.z); }
}

