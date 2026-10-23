/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* ---------------- HUD ---------------- */
let questsDirty = true, lastQuestT = -1;
function renderQuests() {
  const list = activeEvents().sort((a, b) => a.deadline - b.deadline);
  $('callN').textContent = list.length;
  if (!list.length) { $('questList').innerHTML = '<div class="empty">目前没有人找你。去写基金吧。</div>'; return; }
  $('questList').innerHTML = list.map(ev => {
    const total = ev.deadline - ev.at, left = Math.max(0, Math.round(ev.deadline - S.t)), p = clamp(left / total * 100);
    const cls = ev.phone ? 'phone' : ev.urgent || ev.alarm ? 'urgent' : '';
    const col = ev.phone ? 'var(--cyan)' : ev.urgent || ev.alarm ? 'var(--danger)' : 'var(--warn)';
    const h = ev.phone ? null : HS[ev.loc], zn = h && (h.zone || 'f5') !== Z.id ? ZONES[h.zone || 'f5'].name.split(' · ')[0] + ' · ' : '';
    return `<div class="q ${cls}"><div class="ring" style="--p:${p}%;--c:${col}"><b>${left < 100 ? left : Math.round(left / 60) + 'h'}</b></div><div class="t"><span class="loc">${ev.phone ? 'CALL' : esc(h.code)}</span>${esc(ev.line)}<small>${ev.phone ? '电话 · 随时可接' : zn + esc(h.name)} · 还剩 ${left} 分钟</small></div><button type="button" data-id="${ev.id}">${ev.phone ? '接听' : '前往'}</button></div>`;
  }).join('');
  $('questList').querySelectorAll('button').forEach(b => b.onclick = () => {
    const ev = S.events.find(e => e.id === b.dataset.id); if (!ev || S.dialog) return;
    SFX.click();
    if (ev.phone) { openDialog(ev); return; }
    if (S.activity) { if (!S.activity.cancelable) return; finishActivity(false); }
    if (camState.overview) toggleOverview(false);
    routeTo(HS[ev.loc].x, HS[ev.loc].z, HS[ev.loc].zone || 'f5', ev);
  });
}
function renderHUD() {
  $('clock').textContent = fmt(S.t); $('clockMini').textContent = fmt(S.t);
  $('clockEyebrow').textContent = `W${S.week} · ${DAYS[S.day].name} · ${BLOCKS[blockIdx(S.t)].name}${S.intent ? ' · ' + INTENTS.find(x => x.id === S.intent).n : ''}`;
  if (!S.submitted && S.day <= 4) $('clockSub').innerHTML = `基金 <b>${fmtLeft((4 - S.day) * 1440 + 1440 - S.t)}</b>`;
  else if (!S.paperSubmitted) $('clockSub').innerHTML = `论文 <b>${fmtLeft((6 - S.day) * 1440 + 1440 - S.t)}</b>`;
  else $('clockSub').innerHTML = '截止日 <b style="color:var(--ok)">都搞定了</b>';
  $('dayFill').style.width = clamp((S.t - 480) / 960 * 100) + '%';
  renderBlocks();
  $('kpis').innerHTML = KPI.map(([k, n]) => { const v = Math.round(S.k[k]), c = v < 35 ? 'var(--danger)' : v < 50 ? 'var(--warn)' : 'var(--cyan)'; return `<div class="kpi"><div class="row1"><span>${n}</span><b>${v}</b></div><div class="bar"><i style="width:${v}%;background:${c};box-shadow:0 0 8px ${c}"></i></div></div>`; }).join('');
  $('grantPct').textContent = S.submitted ? '已提交' : (S.day > 4 ? '已截止' : Math.floor(S.grant) + '%');
  $('grantBar').style.width = S.grant + '%';
  $('paperPct').textContent = S.paperSubmitted ? '已提交' : Math.floor(S.paper) + '%';
  $('paperBar').style.width = S.paper + '%';
  const dk = JSON.stringify(S.dos) + S.submitted + S.paperSubmitted; if (renderHUD.dk !== dk) { renderHUD.dk = dk; $('dosRow').innerHTML = ['grant', 'paper'].map(p => `<div><span>${p === 'grant' ? '基' : '文'}</span>${DOSSIER[p].comps.map(c => `<i title="${esc(c.n)} · ${esc(c.src)}" class="${S.dos[p][c.id] ? 'has' : ''}">${STAR(S.dos[p][c.id])}</i>`).join('')}<b>${dossierScore(p)}</b></div>`).join(''); }
  $('muonCount').textContent = Math.floor(S.muons).toLocaleString('zh-CN');
  const v = S.v, col = (x, inv) => { const bad = inv ? x > 80 : x < 25, mid = inv ? x > 60 : x < 45; return bad ? 'var(--danger)' : mid ? 'var(--warn)' : null; };
  $('vE').style.width = v.energy + '%'; $('vE').style.background = col(v.energy) || '#3DDC97'; $('vEn').textContent = Math.round(v.energy) + '%';
  $('vH').style.width = v.full + '%'; $('vH').style.background = col(v.full) || '#FFB547'; $('vHn').textContent = v.full < 15 ? '好饿' : Math.round(v.full) + '%';
  $('vW').style.width = S.wb + '%'; $('vW').style.background = col(S.wb) || '#c58bff'; $('vWn').textContent = Math.round(S.wb) + '';
  $('vB').style.width = v.bladder + '%'; $('vB').style.background = col(v.bladder, true) || '#5cc8ff'; $('vBn').textContent = Math.round(v.bladder) + '%';
  if (questsDirty || Math.floor(S.t) !== lastQuestT) { renderQuests(); questsDirty = false; lastQuestT = Math.floor(S.t); }
  renderActivity(); tutTick(); renderMoney();
}
function renderBlocks() {
  const cur = blockIdx(S.t), key = cur + '|' + S.blockUse.map(u => topCat(u)).join(',');
  if (renderBlocks.key === key) return; renderBlocks.key = key;
  $('blockStrip').innerHTML = BLOCKS.map((b, i) => { const tc = i < cur ? topCat(S.blockUse[i]) : null; return `<div class="${i === cur ? 'now' : i < cur ? 'past' : ''} ${b.overtime ? 'ot' : ''}" title="${b.name} ${fmt(b.from)}–${b.to >= 1440 ? '24:00' : fmt(b.to)}"><span>${b.name}</span>${tc ? `<i style="background:${CATS[tc].c}">${CATS[tc].i}</i>` : i < cur ? '<i class="z">碎</i>' : ''}</div>`; }).join('');
}
(function buildDayLine() {
  const dl = $('dayLine'); [10, 12, 14, 22, 24].forEach(h => { const s = document.createElement('span'); s.style.left = `calc(${((h * 60 - 480) / 960 * 100)}% - 1px)`; if (h === 24) s.className = 'big'; dl.appendChild(s); });
})();
/* minimap — rotates with the camera so "up" is always where you are walking */
const mm = { g: $('minimap').getContext('2d') };
function drawMinimap() {
  const g = mm.g, Wc = 440, Hc = 300, sc = Math.min(300 / Z.W, 200 / Z.D); g.clearRect(0, 0, Wc, Hc);
  g.save(); g.translate(Wc / 2, Hc / 2); g.rotate(camState.az); g.translate(-Z.W / 2 * sc, -Z.D / 2 * sc);
  g.fillStyle = Z.outdoor ? 'rgba(30,60,40,.95)' : 'rgba(10,36,54,.95)'; g.fillRect(0, 0, Z.W * sc, Z.D * sc);
  const cur = player ? roomAt(player.position.x, player.position.z) : '';
  Object.entries(Z.rooms).forEach(([id, r]) => { g.fillStyle = id === cur ? 'rgba(0,169,244,.42)' : 'rgba(34,81,255,.16)'; g.fillRect(r.x0 * sc + 2, r.z0 * sc + 2, (r.x1 - r.x0) * sc - 4, (r.z1 - r.z0) * sc - 4); });
  if (Z.id === 'f5') { g.fillStyle = 'rgba(205,238,255,.1)'; g.fillRect(0, 11 * sc, 40 * sc, 4 * sc); }
  g.strokeStyle = 'rgba(0,169,244,.7)'; g.lineWidth = 2; g.strokeRect(0, 0, Z.W * sc, Z.D * sc);
  Z.portals.forEach(p => { g.fillStyle = p.kind === 'elevator' ? '#00A9F4' : '#3DDC97'; g.fillRect(p.x * sc - 5, p.z * sc - 5, 10, 10); });
  if (S) activeEvents().forEach(ev => { if (ev.phone) return; const h = HS[ev.loc]; if ((h.zone || 'f5') !== Z.id) return; g.fillStyle = ev.urgent || ev.alarm ? '#FF5A6E' : '#FFB547'; g.beginPath(); g.arc(h.x * sc, h.z * sc, 8 + Math.sin(performance.now() / 200) * 2, 0, 7); g.fill(); });
  if (Z.id === 'f5') { g.fillStyle = 'rgba(255,200,87,.9)'; g.beginPath(); g.arc(HS.desk.x * sc, HS.desk.z * sc, 4, 0, 7); g.fill(); }
  if (player) { g.save(); g.translate(player.position.x * sc, player.position.z * sc); g.rotate(-player.rotation.y + Math.PI); g.fillStyle = '#fff'; g.shadowColor = '#00A9F4'; g.shadowBlur = 10; g.beginPath(); g.moveTo(0, -12); g.lineTo(8, 8); g.lineTo(0, 4); g.lineTo(-8, 8); g.closePath(); g.fill(); g.restore(); }
  g.restore();
  $('roomLbl').textContent = (Z.name.split(' · ')[0]) + ' · ' + (cur && Z.rooms[cur] ? Z.rooms[cur].name : (Z.outdoor ? '校园' : '走廊'));
  const off = S ? activeEvents().filter(e => !e.phone && (HS[e.loc].zone || 'f5') !== Z.id).length : 0; $('roomSub').textContent = off ? `其他楼层还有 ${off} 件事` : (FLOOR_LABEL[Z.id] || '');
}

/* ---------------- global navigator ----------------
   The minimap shows one floor and rotates with the camera; this answers "where am I in the whole campus?".
   NAV lists every place in walking order. a = hotspot the "go" button walks to. */
const NAV = [
  { cap: '物理楼 · Physics Building', zones: [['roof', '天台咖啡馆'], ['f6', '植物园'], ['f5', '缪子物理组 · 503 办公室'], ['f4', '网球馆'], ['f3', '图书馆'], ['f2', '教室'], ['f1', '大厅 · 食堂']] },
  { cap: '校园 · Campus', zones: [['campus', '广场 · 足球场'], ['gym', '体育馆 · 羽毛球']] },
];
const NAV_ANCHOR = { roof: 'roofcafe', f6: 'garden', f5: 'desk', f4: 'tennis', f3: 'libdesk', f2: 'classroom', f1: 'lobby1', campus: 'plaza', gym: 'courtB' };
const placeName = (id) => FLOOR_IDS.includes(id) ? '物理楼 ' + FLOOR_LABEL[id] : id === 'campus' ? '校园' : id === 'gym' ? '体育馆' : id;
// Pending tasks per zone (phone calls follow you, so they are not on any floor).
function navEvents() {
  const by = {}; if (!S) return by;
  activeEvents().forEach(e => { if (e.phone) return; const z = (HS[e.loc] && HS[e.loc].zone) || 'f5'; const o = by[z] = by[z] || { n: 0, u: 0 }; o.n++; if (e.urgent || e.alarm) o.u++; });
  return by;
}
// Minutes to walk there, counting elevator rides and doors along the way.
function navMinutes(to) {
  const hops = zoneHops(Z.id, to); if (!hops) return null;
  let m = 0; for (let i = 1; i < hops.length; i++) m += travelMinutes(hops[i - 1], hops[i]);
  return Math.round(m);
}
/* v11.2: folding HUD boxes */
const FOLD_KEY = 'prof-fold-v1', FOLDABLE = { pCard: '你 · 值班教授', kpiCard: '今日表现', clockPill: '时间', quests: '待处理', mapCard: '小地图' };
let FOLD = {}; try { FOLD = JSON.parse(localStorage.getItem(FOLD_KEY) || '{}'); } catch (e) { FOLD = {}; }
function foldSet(id, on) {
  const el = $(id); if (!el) return; FOLD[id] = !!on; el.classList.toggle('folded', !!on);
  const b = el.querySelector(':scope > .foldBtn'); if (b) { b.textContent = on ? '+' : '–'; b.title = (on ? '展开 · ' : '收起 · ') + FOLDABLE[id] + '（H：全部）'; }
  try { localStorage.setItem(FOLD_KEY, JSON.stringify(FOLD)); } catch (e) { /* storage blocked */ }
  placeLeftCol(); placeNavChip();
}
Object.keys(FOLDABLE).forEach(id => { const el = $(id); if (!el) return; const b = document.createElement('button'); b.type = 'button'; b.className = 'foldBtn';
  b.onclick = (e) => { e.stopPropagation(); foldSet(id, !FOLD[id]); }; el.appendChild(b); foldSet(id, !!FOLD[id]); });
function foldAll() { const any = Object.keys(FOLDABLE).some(id => !FOLD[id]); Object.keys(FOLDABLE).forEach(id => foldSet(id, any)); toast(any ? '信息框已全部收起（H 展开）' : '信息框已全部展开'); }
// The performance box sits 10 px under the player card, whatever height the card has (folded or not).
function placeLeftCol() {
  const a = $('pCard'), k = $('kpiCard'); if (!a || !k) return;
  if (innerWidth <= 900) { k.style.top = ''; return; }
  const r = a.getBoundingClientRect(); if (r.height) k.style.top = Math.round(r.bottom + 10) + 'px';
}
addEventListener('resize', placeLeftCol);
let navSig = '';
// Desktop: the chip sits 8 px under the clock panel (the panel grows with the day-block bar, so a fixed top overlapped it).
function placeNavChip() {
  const chip = $('navChip'), pill = $('clockPill'); if (!chip || !pill) return;
  const ts = $('toasts');
  if (innerWidth <= 900) { chip.style.top = ''; if (ts) ts.style.top = ''; return; }
  const r = pill.getBoundingClientRect(); if (r.height) chip.style.top = Math.round(r.bottom + 8) + 'px';
  // Notices go under the chip (or under the panel when the chip is hidden), so they never cover it.
  if (ts) { const c = chip.getBoundingClientRect(), below = c.height ? c.bottom : r.bottom; if (below) ts.style.top = Math.round(below + 8) + 'px'; }
}
addEventListener('resize', placeNavChip);
function renderNavChip() {
  if (!Z) return;
  placeNavChip(); placeLeftCol();
  const cur = player ? roomAt(player.position.x, player.position.z) : '';
  const room = cur && Z.rooms[cur] ? Z.rooms[cur].name : (Z.outdoor ? '' : (Z.name.split(' · ')[1] || '走廊'));
  const by = navEvents(), off = Object.entries(by).filter(([z]) => z !== Z.id).reduce((a, [, o]) => a + o.n, 0);
  const sig = Z.id + room + off + innerWidth; if (sig === navSig) return; navSig = sig;
  const narrow = innerWidth <= 900, where = narrow ? (FLOOR_LABEL[Z.id] || placeName(Z.id)) : placeName(Z.id);
  $('navPath').innerHTML = `<b>${esc(where)}</b>${room ? `<span class="sep">›</span>${esc(room)}` : ''}`;
  $('navOff').textContent = off ? `别处 ${off} 件` : '';
}
function renderNavSheet() {
  const by = navEvents(), busy = S && (S.dialog || S.ended);
  $('navBox').innerHTML = `<div class="eyebrow">Navigator · 我在哪</div><h3>你在：${esc(placeName(Z.id))}${Z.id === 'f5' ? ' · 503 所在层' : ''}</h3>
    <div class="sub">点「去这里」会自动走过去，坐电梯也算时间。打电话的事不在地图上，走到哪里都能接。</div>` +
    NAV.map(b => `<div class="navBld"><div class="cap">${esc(b.cap)}</div>${b.zones.map(([id, label]) => {
      const here = id === Z.id, ev = by[id], mins = here ? 0 : navMinutes(id);
      return `<div class="navRow ${here ? 'here' : ''}"><span class="fl">${esc(FLOOR_LABEL[id] || (id === 'campus' ? '外' : '馆'))}</span>
        <span class="nm">${esc(label)}<small>${here ? '你在这里' : mins !== null ? `约 ${mins} 分钟` : ''}</small></span>
        <span class="ev ${ev && ev.u ? 'u' : ''}">${ev ? `${ev.u ? '紧急 ' : ''}${ev.n} 件事` : ''}</span>
        ${here ? '<span class="you">● HERE</span>' : `<button type="button" data-go="${id}" ${busy ? 'disabled' : ''}>去这里</button>`}</div>`;
    }).join('')}</div>`).join('') +
    `<div class="foot"><span>下班回家：电梯按 B1，或右上角「下班」。</span><button class="ib" type="button" id="navClose">关闭</button></div>`;
  $('navBox').querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const id = b.dataset.go, h = HS[NAV_ANCHOR[id]]; toggleNav(false); if (S.activity) { if (!S.activity.cancelable) return toast('现在走不开。'); finishActivity(false); } routeTo(h.x, h.z, id); });
  $('navClose').onclick = () => toggleNav(false);
}
let navWasPaused = false;
function toggleNav(open) {
  if (!S || !S.running || S.planning) return;
  const sheet = $('navSheet'); open = open === undefined ? sheet.classList.contains('hidden') : open;
  if (open) { navWasPaused = S.paused; S.paused = true; renderNavSheet(); sheet.classList.remove('hidden'); SFX.click(); }
  else { sheet.classList.add('hidden'); S.paused = navWasPaused; }
}
$('navChip').onclick = () => toggleNav(true);
$('navSheet').onclick = (e) => { if (e.target.id === 'navSheet') toggleNav(false); };

