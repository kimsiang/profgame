/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* ---------------- movement + camera control ---------------- */
const keys = {};
const joy = { x: 0, y: 0 };
function walkTo(x, z, ev) {
  const path = astar(player.position.x, player.position.z, x, z);
  if (path && path.length) { S.path = path; S.autoTarget = ev || null; ripple(x, z, ev ? '#FFC857' : '#00A9F4'); }
  else if (ev && Math.hypot(player.position.x - x, player.position.z - z) < 1.5) openDialog(ev);
}
let stepT = 0;
function movePlayer(dt) {
  if (!S.running || S.dialog || S.activity || S.paused) { S.moving = false; if (S.running && !S.activity && !S.dialog && (player.userData.state === 'walk' || player.userData.state === 'run')) player.userData.state = 'idle'; return; }
  let mx = 0, my = 0;
  if (keys.ArrowLeft || keys.KeyA) mx -= 1; if (keys.ArrowRight || keys.KeyD) mx += 1;
  if (keys.ArrowUp || keys.KeyW) my += 1; if (keys.ArrowDown || keys.KeyS) my -= 1;
  mx += joy.x; my += joy.y;
  const run = !!(keys.ShiftLeft || keys.ShiftRight) || Math.hypot(joy.x, joy.y) > 0.92;
  const speed = (run ? 5.6 : 3.7) * (S.v.energy < 15 ? 0.7 : 1);
  const p = player.position; let dir = null;
  if (Math.hypot(mx, my) > 0.12) {
    S.path = []; S.autoTarget = null; S.autoRoute = null; S.autoNext = null; const b = camBasis();
    dir = b.right.multiplyScalar(mx).addScaledVector(b.fwd, my); if (dir.length() > 1) dir.normalize();
  } else if (S.path.length) {
    const tgt = S.path[0], d = Math.hypot(tgt.x - p.x, tgt.z - p.z);
    if (d < 0.12) { S.path.shift(); if (!S.path.length) { if (S.autoTarget) { const ev = S.autoTarget; S.autoTarget = null; if (ev.state === 'active') openDialog(ev); } else if (S.autoRoute && S.autoNext) { const next = S.autoNext; S.autoNext = null; const p = portalToward(Z.id, next); S.moving = false; player.userData.state = 'idle'; travel(next, p, continueRoute); return; } } }
    else dir = new THREE.Vector3((tgt.x - p.x) / d, 0, (tgt.z - p.z) / d);
  }
  S.moving = !!dir; S.run = run && S.moving;
  if (S.moving) player.userData.state = S.run ? 'run' : 'walk';
  else if (player.userData.state === 'walk' || player.userData.state === 'run') player.userData.state = 'idle';
  if (!dir) return;
  const step = speed * dt, nx = p.x + dir.x * step, nz = p.z + dir.z * step;
  if (S.path.length) { p.x = nx; p.z = nz; } else { if (freeAt(nx, p.z)) p.x = nx; if (freeAt(p.x, nz)) p.z = nz; }
  const want = Math.atan2(dir.x, dir.z); let dr = want - player.rotation.y; while (dr > Math.PI) dr -= Math.PI * 2; while (dr < -Math.PI) dr += Math.PI * 2; player.rotation.y += dr * Math.min(1, dt * 14);
  stepT -= dt * (S.run ? 1.5 : 1); if (stepT < 0) { stepT = 0.33; SFX.step(); }
  if (Z.id === 'f5') { const r = roomAt(p.x, p.z); if (r !== 'corridor' && !S.rooms[r]) { S.rooms[r] = 1; if (Object.keys(S.rooms).length >= 10) unlock('explorer'); } }
}
function rotateView(dir) { camState.wantAz += dir * Math.PI / 4; SFX.click(); }
function toggleOverview(on) { camState.overview = on === undefined ? !camState.overview : on; $('bMap').classList.toggle('on', camState.overview); }

/* ---------------- ending ---------------- */
function endDay(reason) {
  if (S.ended) return; S.ended = true; S.running = false; tutHide();
  if (S.dialog) { const d = S.dialog; if (d.ctl) d.ctl.abort(); if (d.mini && d.mini.stop) d.mini.stop(); S.dialog = null; camState.cine = null; document.body.classList.remove('talking'); $('dlg').classList.add('hidden'); }
  S.activity = null; $('activity').classList.add('hidden'); player.visible = true;
  for (const ev of activeEvents()) { ev.state = 'expired'; settleEvent(ev); }
  const d = S.day, total = S.events.length, done = S.events.filter(e => e.state === 'resolved').length;
  S.totals.done += done; S.totals.all += total; S.totals.missed += total - done;
  S.lastEnd = reason === 'home' && S.t >= hm(22) ? 'time' : reason; if (reason === 'collapse') { S.collapses++; S.wb = clamp(S.wb - 15); moment('collapse'); }
  S.endT = S.t; S.dayBlocks = S.blockUse.map(u => topCat(u));
  // v6: the family drifts on nights you are not home; weekends count double.
  if (!S.homeToday) { const k = d >= 5 ? 2 : 1; Object.keys(S.fam).forEach(f => { const m = S.fin && ((f === 'house' && S.fin.help) ? 0 : (f === 'child' && S.fin.tutor) ? 0.5 : 1); S.fam[f] = clamp(S.fam[f] - FAM_DRIFT * k * (m ?? 1)); }); S.famSkip++; logIt(d >= 5 ? '周末也没回家。' : '又是一个没回家的晚上。'); } else S.famSkip = 0;
  if (!S.homeToday && reason !== 'collapse') moment(d >= 4 ? 'nohome_w' : 'nohome');   // v14: Friday and the weekend count double
  S.atHome = false;
  KPI.forEach(([k]) => { S.k[k] = S.k[k] - (S.k[k] - 50) * BAL.kpiNight; });   // v12.3: standing fades a little overnight
  // Attention is a resource: people you did not help today drift a little.
  Object.keys(S.trust).forEach(id => { if (!S.lost.includes(id) && !(S.mem[id] || []).some(m => m.day === d && m.kind === 'good')) S.trust[id] = clamp(S.trust[id] - 4); });
  // v5: students whose trust fell below 30 ask to talk tomorrow; a second slide means they leave.
  S.crisisSeen = S.crisisSeen || {};
  Object.keys(S.trust).forEach(id => {
    if (S.lost.includes(id) || S.trust[id] >= 30) return;
    if (S.crisisSeen[id] && d < 6) { loseStudent(id); logIt(`${STUDENTS[id].n}的信任跌到了谷底，决定离开课题组。`); }
    else if (d < 6) { S.crisis[id] = d + 1; S.crisisSeen[id] = 1; moment('crisis', { who: STUDENTS[id].n }); logIt(`${STUDENTS[id].n}今天一直没怎么说话。`); }
  });
  if (d === 3 && (S.intents.filter(x => x === 'students').length >= 2 || avgTrust() >= 75)) S.flags.students_week = 1;
  if (d === 4 && !S.submitted) { applyFx({ rep: -10, research: -6 }); logIt(`基金申请书没有提交（停在 ${Math.floor(S.grant)}%）。明年再来。`); }
  if (d === 6 && !S.paperSubmitted) { applyFx({ rep: -8, research: -6 }); logIt(`论文修改稿没能按时提交（${Math.floor(S.paper)}%），编辑把稿件标记为撤回。`); }
  S.dayResult = { reason, done, total };
  if (d === 6) return endWeek(reason);
  showDaySummary();
}
/* Five-block strip of the day: what each block was mostly spent on. */
function timeBreakdown(use) {
  const strip = BLOCKS.map((b, i) => { const u = use[i] || {}, tot = Object.values(u).reduce((a, c) => a + c, 0), tc = topCat(u);
    return `<div class="tbB ${b.overtime ? 'ot' : ''}"><b>${b.name}</b><div class="tbBar">${Object.keys(CATS).filter(k => u[k]).map(k => `<i title="${CATS[k].n} ${Math.round(u[k])} 分" style="flex:${u[k]};background:${CATS[k].c}"></i>`).join('') || '<i style="flex:1;background:rgba(255,255,255,.05)"></i>'}</div><small>${tc ? CATS[tc].n : tot ? '零碎' : '—'}</small></div>`; }).join('');
  return `<div class="tbRow">${strip}</div>`;
}
function catBars(tw) {
  const tot = Object.values(tw).reduce((a, c) => a + c, 0) || 1;
  return Object.keys(CATS).filter(k => tw[k] >= 1).sort((a, b) => tw[b] - tw[a]).map(k => `<div class="cb"><span>${CATS[k].n}</span><div><i style="width:${tw[k] / tot * 100}%;background:${CATS[k].c}"></i></div><b>${Math.floor(tw[k] / 60)}h${pad(Math.round(tw[k] % 60))}</b></div>`).join('');
}
function famRows() {
  return Object.entries(FAMILY).map(([k, f]) => { const v = Math.round(S.fam[k]); return `<div><b>${f.n}</b><small> · ${f.role}</small><i style="--v:${v}%;--c:${v < 40 ? 'var(--danger)' : v < 55 ? 'var(--warn)' : 'var(--ok)'}"></i><small>${v}${k === 'partner' ? ` · 这周在家 ${S.homeNights} 晚` : ''}</small></div>`; }).join('');
}
function trustRows() {
  return Object.entries(STUDENTS).map(([id, p]) => { const lost = S.lost.includes(id), v = Math.round(S.trust[id]); return `<div class="tr ${lost ? 'lost' : ''}"><img alt="" src="${portrait(CAST[id], lost ? 'normal' : v < 35 ? 'worried' : v > 75 ? 'happy' : 'normal', 'head')}"><span>${p.n}<small>${p.role}</small></span><div><i style="width:${lost ? 0 : v}%;background:${v < 35 ? 'var(--danger)' : v < 55 ? 'var(--warn)' : 'var(--ok)'}"></i></div><b>${lost ? '已离开' : v}</b></div>`; }).join('');
}
function fmtLeft(mins) { mins = Math.max(0, Math.round(mins)); return mins >= 1440 ? `${Math.floor(mins / 1440)}天${Math.floor(mins % 1440 / 60)}小时` : `${Math.floor(mins / 60)}h ${pad(mins % 60)}m`; }
function showDaySummary() {
  const d = S.day, D = DAYS[d], N = DAYS[d + 1], r = S.dayResult;
  $('dayEyebrow').textContent = `第 ${S.week} 周 · 第 ${d + 1} 天 · ${D.name} ${dayDate(d)} · ${fmt(S.t)}`;
  $('dayHead').textContent = r.reason === 'collapse' ? `${D.name}：你在办公室睡着了` : r.reason === 'home' ? `${D.name}：提前下班` : `${D.name}结束了`;
  const parts = [`今天冒出 ${r.total} 件事，你亲手处理了 ${r.done} 件。`, `喝了 ${S.coffees} 杯咖啡，吃了 ${S.meals} 顿饭。`];
  if (d < 4) parts.push(S.submitted ? '基金已经提交。' : `基金写到 ${Math.floor(S.grant)}%，周五 23:59 截止。`);
  if (d === 4) parts.push(S.submitted ? '基金赶在截止前交上了！' : '基金没能交上。');
  parts.push(S.paperSubmitted ? '论文修改稿已提交。' : `论文修改稿 ${Math.floor(S.paper)}%，周日 23:59 截止。`);
  parts.push(r.reason === 'collapse' ? '你累倒了，明天会从比较低的精力开始。' : r.reason === 'home' ? '今天早点回家，明天精神会更好。' : '回到家已经过了午夜。');
  parts.push(`身心 ${Math.round(S.wb)}。${S.homeToday ? '今晚在家。' : S.endT < hm(21) ? '今晚能好好休息，明天会恢复一些。' : '又是很晚才走。'}`);
  parts.push(`明天是${N.name}：${N.theme}，${N.sub}。`);
  $('daySummary').textContent = parts.join('');
  $('dayKpis').innerHTML = KPI.map(([k, n]) => { const v = Math.round(S.k[k]), dv = v - Math.round(S.kStart[k]); return `<tr><td><span class="dot" style="background:${v < 40 ? 'var(--danger)' : v < 55 ? 'var(--warn)' : 'var(--cyan)'}"></span>${n}</td><td>${v} <span class="delta ${dv >= 0 ? 'p' : 'm'}">${dv >= 0 ? '+' : ''}${dv}</span></td></tr>`; }).join('') + `<tr><td><span class="dot" style="background:var(--gold)"></span>等级</td><td>Lv.${S.level + 1} ${LEVELS[S.level][1]} · ${S.xp} XP</td></tr>`;
  $('dayTime').innerHTML = timeBreakdown(S.blockUse);
  $('dayTrust').innerHTML = trustRows();
  $('dayFam').innerHTML = famRows();
  $('weekStrip').innerHTML = DAYS.map((x, i) => `<div class="${i <= d ? 'done' : ''} ${i === d + 1 ? 'now' : ''} ${i === 4 || i === 6 ? 'dl' : ''}"><b>${x.name}</b>${i === 4 ? '基金截止' : i === 6 ? '投稿截止' : x.theme}</div>`).join('');
  const logs = S.log.slice(S.dayLogStart);
  $('dayLog').innerHTML = logs.map(l => `<div><span class="t">${fmt(l.t)}</span><span>${esc(l.text)}</span></div>`).join('') || '<div><span class="t">—</span><span>今天风平浪静。</span></div>';
  const cs = S.cards.slice(S.cardStart);
  $('dayCards').innerHTML = cs.map(c => `<div class="card"><h4>${esc(CARDS[c].t)}</h4><p>${esc(CARDS[c].b)}</p></div>`).join('') || '<p style="color:var(--muted);font-size:13px">今天没有新的科普卡。</p>';
  $('nextDayBtn').textContent = `回家睡觉 · 进入${N.name} ▶`;
  S.day = d + 1; saveGame(); S.day = d;
  fadeTo(() => { $('hud').classList.add('hidden'); show('scrDay'); toggleOverview(true); camState.orbit = 0.0001; });
}
