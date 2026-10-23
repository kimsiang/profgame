/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* ---------------- screens ---------------- */
function show(id) { ['scrTitle', 'scrSetup', 'scrHand', 'scrEnd', 'scrDay', 'scrPlan'].forEach(s => $(s).classList.toggle('hidden', s !== id)); }
function fadeTo(fn) { if (SIM) return fn(); $('fade').classList.add('on'); setTimeout(() => { fn(); setTimeout(() => $('fade').classList.remove('on'), 80); }, 460); }
function renderSetup() {
  const sel = (a, b, on) => { a.classList.toggle('on', on); b.classList.toggle('on', !on); a.setAttribute('aria-pressed', on); b.setAttribute('aria-pressed', !on); SFX.click(); };
  $('avM').querySelector('img').src = portrait(PLAYER_LOOK(false), 'happy');
  $('avF').querySelector('img').src = portrait(PLAYER_LOOK(true), 'happy');
  $('avM').onclick = () => { setup.avatar = 'm'; sel($('avM'), $('avF'), true); };
  $('avF').onclick = () => { setup.avatar = 'f'; sel($('avM'), $('avF'), false); };
  $('dayN').onclick = () => { setup.day = 'normal'; sel($('dayN'), $('dayC'), true); };
  $('dayC').onclick = () => { setup.day = 'crunch'; sel($('dayN'), $('dayC'), false); };
  $('houseB').onclick = () => { setup.house = 'buy'; sel($('houseB'), $('houseR'), true); };
  $('houseR').onclick = () => { setup.house = 'rent'; sel($('houseB'), $('houseR'), false); };
  $('carY').onclick = () => { setup.commute = 'car'; sel($('carY'), $('carN'), true); };
  $('carN').onclick = () => { setup.commute = 'metro'; sel($('carY'), $('carN'), false); };
}
function renderHandover() {
  const crunch = setup.day === 'crunch';
  const rows = [
    ['周一', '组会 · 大学物理第 7 讲', '小陈的寿命拟合一直不对；新的 SiPM 到货。'],
    ['周二', '实验室日', '周三安全检查前要整改；高压电源这周偶尔报警。'],
    ['周三', '上课 · 研究生复试', '投影仪不太靠谱；下午三位复试考生。'],
    ['周四', '院务会 · 预答辩 · 采访', '你是隔壁组预答辩委员；液氮杜瓦阀门有点冻。'],
    ['周五', '基金截止 23:59', `基金书目前 ${crunch ? 8 : 20}%；小周的推荐信也是当晚截止。`],
    ['周六', '校园开放日', '上午科普讲座，下午论文。'],
    ['周日', '论文修改稿截止 23:59', '修改稿目前 20%，审稿意见 23 条。'],
  ];
  $('sheetTable').innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td><b>${esc(r[1])}</b><br><span class="note">${esc(r[2])}</span></td></tr>`).join('');
  $('handMe').innerHTML = `<h4>你</h4><img class="me" alt="" src="${portrait(PLAYER_LOOK(setup.avatar === 'f'), 'normal')}"><div style="margin-top:10px;font:900 15px var(--serif-cn)">助理教授 · 第 1 周</div><div style="font-size:11px;color:var(--muted);margin-top:4px">${setup.mode === 'pro' ? '学者 Pro 版 · AI 开放式对话' : '一般民众体验版'} · ${crunch ? '大爆周' : '普通的一周'}</div>`;
  const oc = loadCareer(); $('handCareer').textContent = oc && oc.week > 1 ? `注意：这会开始一段新的职业生涯（当前存档：第 ${oc.week} 周 · ${RANKS[oc.rank].n}）。想继续，请回首页点「继续职业生涯」。` : '';
  $('teamRow').innerHTML = [['wang', '王老师', '院办秘书'], ['zhao', '赵博士', '博士后'], ['lin', '小林', '硕士 · 实验室']].map(([id, n, r]) => `<div><img alt="" src="${portrait(CAST[id], 'normal', 'head')}">${n}<br><span style="color:var(--muted)">${r}</span></div>`).join('');
}
function startGame() {
  if (!needContent(startGame)) return;
  if (loadSave() && !confirm('开始新的一周会覆盖自动存档（三个手动存档位不受影响）。继续吗？')) return;
  ensureAudio(); if (actx && actx.state === 'suspended') actx.resume(); if (S) S.events.forEach(ev => { if (ev.marker) ev.marker.parent.remove(ev.marker); }); clearSave(); try { localStorage.removeItem(CAREER_KEY); } catch (e) { /* storage blocked */ } S = newState(freshCareer()); startDay(0); }
function continueGame() {
  if (!needContent(continueGame)) return;
  const sv = loadSave(); if (!sv) return;
  ensureAudio(); if (actx && actx.state === 'suspended') actx.resume();
  Object.assign(setup, sv.setup); if (S) S.events.forEach(ev => { if (ev.marker && ev.marker.parent) ev.marker.parent.remove(ev.marker); });
  if (sv.mid && sv.mid.S && sv.mid.S.dayBase) { try { return resumeMid(sv); } catch (e) { console.warn('mid-day resume failed, restarting the day', e); } }
  S = Object.assign(newState(), sv.S); startDay(sv.S.day);
}
// Mid-day resume: rebuild the day's events from the state the day started with, then apply each saved event's
// own fields (state, deadline, …). Events added during the day that the rebuild does not produce come back as saved.
function resumeMid(sv) {
  const cur = sv.mid.S, d = cur.day;
  let evs = [];
  S = Object.assign(newState(), JSON.parse(JSON.stringify(cur.dayBase)));
  try { evs = buildDay(d, setup.day); } catch (e) { evs = []; }
  S = Object.assign(newState(), cur);
  const prim = (v) => v === null || ['string', 'number', 'boolean'].includes(typeof v);
  S.events = (cur.events || []).map(se => { const r = evs.find(e => e.id === se.id); if (!r) return se; for (const k in se) if (prim(se[k])) r[k] = se[k]; return r; });
  fadeTo(() => {
    Object.values(NPC).forEach(n => { setEmote(n, null); n.userData.state = n.userData.baseState || 'idle'; setExpr(n, 'normal'); });
    Object.keys(STUDENTS).forEach(id => { if (NPC[id]) NPC[id].visible = !(S.lost || []).includes(id); });
    Object.assign(S, { running: true, paused: false, ended: false, planning: false, activity: null, dialog: null, path: [], autoTarget: null, traveling: false, autoRoute: null, autoNext: null });
    setZone(sv.mid.zone || 'f5'); makePlayer(setup.avatar === 'f');
    const p = sv.mid.pos || {}; player.position.set(p.x ?? Z.spawn.x, 0, p.z ?? Z.spawn.z); if (p.ry != null) player.rotation.y = p.ry;
    $('pImg').src = portrait(PLAYER_LOOK(setup.avatar === 'f'), 'normal', 'head');
    for (const ev of activeEvents()) {
      if (!ev.phone && HS[ev.loc]) { const h = HS[ev.loc]; ev.marker = makeMarker(h.x, h.z, !!(ev.urgent || ev.alarm), h.zone || 'f5'); }
      if (ev.npc && NPC[ev.npc]) { const n = NPC[ev.npc]; npcToEvent(n, ev); if (ev.urgent || ev.alarm) { n.userData.state = 'panic'; setExpr(n, 'shock'); setEmote(n, '!!'); } else setEmote(n, '!'); }
    }
    camState.orbit = 0; camState.wantAz = camState.az = Math.PI / 4; toggleOverview(false); camState.target.copy(player.position);
    show(null); $('hud').classList.remove('hidden'); $('pauseVeil').classList.add('hidden'); $('activity').classList.add('hidden'); $('dlg').classList.add('hidden'); document.body.classList.remove('talking'); $('navSheet').classList.add('hidden'); camState.cine = null;
    questsDirty = true; renderXP(); renderHUD();
    toast(`已读取：第 ${S.week} 周 · ${DAYS[d].name} ${fmt(S.t)}`, 'good');
  });
}
function startDay(d) {
  fadeTo(() => {
    S.events.forEach(ev => { if (ev.marker) ev.marker.parent.remove(ev.marker); });
    Object.values(NPC).forEach(n => { setEmote(n, null); n.userData.state = n.userData.baseState || 'idle'; setExpr(n, 'normal'); });
    S.day = d; S.t = hm(8); S.ended = false; S.running = true; S.paused = false; S.activity = null; S.dialog = null; S.path = []; S.autoTarget = null; S.warned = {};
    S.v = { energy: S.lastEnd === 'collapse' ? 55 : S.lastEnd === 'home' ? 92 : 78, full: 50, bladder: 15 };
    if (d > 0 && S.endT !== undefined) S.wb = clamp(S.wb + (S.lastEnd === 'collapse' ? 0 : S.endT < hm(19) ? BAL.wbMorning[0] : S.endT < hm(21) ? BAL.wbMorning[1] : S.endT < hm(23) ? BAL.wbMorning[2] : BAL.wbMorning[3]));
    S.coffees = 0; S.meals = 0; S.hadQuests = false; S.flags = S.flags || {};
    S.blockUse = []; S.memToday = {}; S.intent = null; S.flow = 0; S.flowCarry = null; S.endT = undefined; S.homeToday = false; S.atHome = false;
    if (S.fam && S.fam.house < 30) { S.t = hm(8, 30); logIt('找不到车钥匙，衬衫也没一件干净的。08:30 才出门。'); }
    Object.keys(STUDENTS).forEach(id => { if (NPC[id]) NPC[id].visible = !S.lost.includes(id); });
    S.events = []; S.dayBase = snapState(S); S.dayBase.day = d;
    S.events = buildDay(d, setup.day); S.dayLogStart = S.log.length; S.cardStart = S.cards.length; S.kStart = Object.assign({}, S.k);
    saveGame();
    setZone('f5'); S.autoRoute = null; S.autoNext = null; S.zones.f5 = 1;
    makePlayer(setup.avatar === 'f');
    $('pImg').src = portrait(PLAYER_LOOK(setup.avatar === 'f'), 'normal', 'head');
    camState.orbit = 0; camState.wantAz = camState.az = Math.PI / 4; toggleOverview(false); camState.target.copy(player.position);
    show(null); $('hud').classList.remove('hidden');
    questsDirty = true; renderXP(); renderHUD();
    S.paused = true; S.planning = true; $('hud').classList.add('hidden'); showPlanner(d);
  });
}
function avgTrust() { const ids = Object.keys(S.trust).filter(id => !S.lost.includes(id)); return ids.length ? ids.reduce((a, id) => a + S.trust[id], 0) / ids.length : 0; }
function dayDate(d) { const t = new Date(2026, 9, 19 + d + 7 * ((S && S.week || 1) - 1)); return `${t.getMonth() + 1}/${t.getDate()}`; }
/* Morning planner: fixed commitments per block, deadline arithmetic, trust, rumours, one intention. */
function showPlanner(d) {
  const D = DAYS[d], evs = S.events;
  $('planEyebrow').textContent = `第 ${S.week} 周 · 第 ${d + 1} 天 · ${D.name} ${dayDate(d)} · 07:45`;
  $('planHead').textContent = `${D.name}：${D.theme}`;
  $('planSub').textContent = `${D.sub}。今天一共会冒出大约 ${evs.length} 件事，你不可能全都亲手处理。`;
  const fixed = (i) => evs.filter(e => blockIdx(e.at) === i && (e.known || (S.intel[d] && (e.urgent || e.alarm))));
  $('planBlocks').innerHTML = BLOCKS.map((b, i) => {
    const f = fixed(i), busy = f.length > 0;
    return `<div class="pb ${b.overtime ? 'ot' : ''} ${busy ? 'busy' : ''}"><div class="pbH"><b>${b.name}</b><span>${fmt(b.from)}–${b.to >= 1440 ? '24:00' : fmt(b.to)}</span></div>${f.map(e => `<div class="pbE ${e.urgent || e.alarm ? 'u' : ''}">${fmt(e.at)} ${esc(shortTitle(e.title))}${e.urgent || e.alarm ? ' <em>传闻</em>' : ''}</div>`).join('') || `<div class="pbFree">${b.overtime ? '回家、植物园，或者加班' : '空档 · 可以专注'}</div>`}</div>`;
  }).join('');
  const perBlock = 20, gLeft = Math.max(0, 100 - S.grant), pLeft = Math.max(0, 100 - S.paper);
  const freeBlocks = (lastDay) => { let n = 0; for (let x = d; x <= lastDay; x++) n += 5; return n - BLOCKS.slice(0, 5).filter((b, i) => fixed(i).some(e => e.known)).length; };
  const rows = [];
  if (!S.submitted && d <= 4) rows.push(`<div><b>基金书 ${Math.floor(S.grant)}% · 评审预估 ${dossierScore('grant')} 分（≥ ${BAL.grantBar} 获批）</b>还需要约 <em>${Math.ceil(gLeft / perBlock)}</em> 段完整的专注时段；距周五截止还有约 ${freeBlocks(4)} 个时段（不算被会议和课占掉的）。${dossierHTML('grant', true)}</div>`);
  if (!S.paperSubmitted) rows.push(`<div><b>论文修改稿 ${Math.floor(S.paper)}% · 审稿预估 ${dossierScore('paper')} 分</b>还需要约 <em>${Math.ceil(pLeft / 23)}</em> 段专注时段，周日 23:59 截止。${dossierHTML('paper', true)}</div>`);
  rows.push(`<div><b>身心 ${Math.round(S.wb)}</b>${S.wb < 40 ? '偏低：专注会更难进入状态。回家一晚或六楼植物园能恢复。' : '还撑得住。加班会慢慢磨掉它。'}</div>`);
  const lowF = Object.entries(S.fam).sort((a, b) => a[1] - b[1])[0];
  rows.push(`<div class="${lowF[1] < 40 ? 'bad' : ''}"><b>家 · ${Object.entries(FAMILY).map(([k, f]) => `${f.n} ${Math.round(S.fam[k])}`).join(' · ')}</b>${S.famSkip >= 2 ? `已经 ${S.famSkip} 晚没回家。` : ''}${lowF[1] < 40 ? `${FAMILY[lowF[0]].n}那边快撑不住了：${lowF[0] === 'partner' ? '她会找你谈' : lowF[0] === 'child' ? '学校可能会打电话来' : '早上会找不到东西'}。` : '每个不回家的晚上都会掉一点；回家一晚身心 +' + FAM_HOME_WB + '。'}</div>`);
  (S.rumours || []).filter(r => r.day === d).forEach(r => rows.push(`<div><b>天台八卦</b>${esc(r.text)}</div>`));
  Object.keys(S.crisis).filter(id => S.crisis[id] === d).forEach(id => rows.push(`<div class="bad"><b>${STUDENTS[id].n}</b>昨天一整天都没怎么说话，今天早上想找你谈谈。</div>`));
  { const c = S.career, bits = [];
    if (c.post) bits.push(`你是${POSTS[c.post].n}：每天会多出几件行政事，周末也有。`);
    if (c.rank >= 3) bits.push('周三有一份人才计划会评的邀请。');
    if (c.rank >= ACADEMY.rank && c.acadNext) bits.push(c.acadNext === S.week ? '本周是院士增选周：周一定稿提名材料，周三学部答辩，周日出结果。' : `下一次院士增选：第 ${c.acadNext} 周。`);
    const nx = RANKS[c.rank + 1]; if (nx) { const un = reqUnmet(nx, c); bits.push(`下一个职称「${nx.n}」：还差 ${Math.max(0, nx.pts - c.pts)} 分${un.length ? '，以及' + un.join('、') : ''}。`); }
    rows.push(`<div class="${c.acadNext === S.week && c.rank >= ACADEMY.rank ? 'bad' : ''}"><b>职业生涯 · ${RANKS[c.rank].n}${postLabel(c)}</b>${bits.join('')}</div>`); }
  if (S.fin) rows.push(finPlannerRow(d));
  $('planNotes').innerHTML = rows.join(''); finPlannerBind(d);
  $('planTrust').innerHTML = Object.entries(STUDENTS).map(([id, p]) => { const lost = S.lost.includes(id), v = Math.round(S.trust[id]); return `<div class="${lost ? 'lost' : ''}"><img alt="" src="${portrait(CAST[id], lost ? 'normal' : v < 35 ? 'worried' : v > 75 ? 'happy' : 'normal', 'head')}"><span>${p.n}</span><i style="--v:${lost ? 0 : v}%;--c:${v < 35 ? 'var(--danger)' : v < 55 ? 'var(--warn)' : 'var(--ok)'}"></i><small>${lost ? '已离开' : '信任 ' + v}</small></div>`; }).join('');
  $('planIntents').innerHTML = INTENTS.map(x => `<button type="button" class="intent" data-id="${x.id}"><span class="ic">${x.ic}</span><b>${x.n}</b><small>${x.d}</small></button>`).join('');
  $('planIntents').querySelectorAll('.intent').forEach(b => { b.onclick = () => beginDay(d, b.dataset.id); b.onmouseenter = SFX.click; });
  show('scrPlan'); setTimeout(tutTick, 400);
}
function beginDay(d, intent) {
  CANTEEN.signDay = null;   // v11.2: the stalls change their line-up every day
  SFX.click(); tutHide(); S.planning = false; S.intent = intent; S.intents.push(intent); if (intent === 'self') S.v.energy = clamp(S.v.energy + 8);
  logIt(`今天的打算：${INTENTS.find(x => x.id === intent).n}。`);
  if (S.fin && S.fin.commute === 'metro') {
    if (S.fin.taxiToday === d) { finMove(-FIN.taxi, '打车上下班'); logIt(`打车上班，${fmtY(FIN.taxi)}。`); }
    else { S.t += FIN.metroLate; S.fin.metroReads = (S.fin.metroReads || 0) + 1; logIt(`坐地铁，${fmt(S.t)} 到岗。路上读了一篇文献。`);
      if (S.fin.metroReads % 2 === 0 && !S.submitted && d <= 4) (SIM ? (f) => f() : (f) => setTimeout(f, 2800))(() => { if (S && !S.ended) addStar('grant', 'idea', 1); }); }
  }
  saveGame();
  show(null); $('hud').classList.remove('hidden'); renderHUD();
  $('intro').classList.remove('hidden');
  $('introD').textContent = `WEEK ${S.week} · DAY ${d + 1} · ${dayDate(d)}`; $('introB').textContent = `${DAYS[d].name} · ${DAYS[d].theme}`; $('introSub').textContent = `今天的打算：${INTENTS.find(x => x.id === intent).n}`;
  const el = $('intro').firstElementChild; el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  setTimeout(() => { $('intro').classList.add('hidden'); if (S && !S.ended) S.paused = false; toast(`${DAYS[d].name} 08:00 到岗。专注时段要自己守住。`); }, 2600);
}
/* ---------------- v6: Monday tutorial — one-line hints, once per browser ---------------- */
const TUT_KEY = 'prof-tut-v6';
const TUT = { done: (() => { try { return JSON.parse(localStorage.getItem(TUT_KEY) || '{}'); } catch (e) { return {}; } })(), shown: null };
function tutSave() { try { localStorage.setItem(TUT_KEY, JSON.stringify(TUT.done)); } catch (e) { /* storage blocked */ } }
function tutHide() { TUT.shown = null; $('tut').classList.add('hidden'); }
function tutTick() {
  if (!S || S.week > 1 || TUT.done.all || TUT.shown || S.ended || S.quick || BM.m) return;
  if (!S.planning && (!S.running || S.paused)) return;
  const step = TUTORIAL.find(t => !TUT.done[t.id] && t.when());
  if (!step) return;
  TUT.shown = step.id; TUT.done[step.id] = 1; tutSave();
  const n = TUTORIAL.indexOf(step) + 1;
  $('tut').innerHTML = `<b>教学 ${n}/${TUTORIAL.length}</b><span>${esc(step.text)}</span><button type="button" id="tutOk">知道了</button><button type="button" id="tutSkip" title="以后不再提示">跳过教学</button>`;
  $('tut').classList.remove('hidden');
  $('tutOk').onclick = () => { SFX.click(); tutHide(); };
  $('tutSkip').onclick = () => { TUTORIAL.forEach(t => { TUT.done[t.id] = 1; }); TUT.done.all = 1; tutSave(); tutHide(); };
  setTimeout(() => { if (TUT.shown === step.id) tutHide(); }, 14000);
}
function togglePause(force) { if (!S || !S.running || S.planning) return; S.paused = force === undefined ? !S.paused : force; $('pauseVeil').classList.toggle('hidden', !S.paused); }

/* ---------------- input ---------------- */
addEventListener('keydown', (e) => {
  if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
  keys[e.code] = true;
  if (BM.m) { bmKey(e); return; }
  if (!$('saveSheet').classList.contains('hidden')) { if (e.code === 'Escape' || e.code === 'KeyO') toggleSave(false); return; }
  if (!S || !S.running) { if (e.key === 'Enter' && !$('scrHand').classList.contains('hidden')) startGame(); return; }
  if (S.planning) { if (/^Digit[1-4]$/.test(e.code)) beginDay(S.day, INTENTS[+e.code.slice(5) - 1].id); return; }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (!$('navSheet').classList.contains('hidden')) { if (e.code === 'KeyN' || e.code === 'Escape') toggleNav(false); return; }
  if (e.code === 'KeyP') return togglePause();
  if (S.paused) return;
  const d = S.dialog;
  if (d) {
    if (d.choices && /^Digit[1-9]$/.test(e.code)) { const c = d.choices[+e.code.slice(5) - 1]; if (c) pick(c); }
    if (e.code === 'KeyC' && d.mini && d.mini.press) d.mini.press();
    if (d.mini && d.mini.answer && /^Digit[1-4]$/.test(e.code)) d.mini.answer(+e.code.slice(5) - 1);
    if (e.key === 'Enter' && $('dlgDone')) { e.preventDefault(); closeDialog(); }
    return;
  }
  if (e.code === 'KeyE' || e.code === 'Space') interact();
  if (e.code === 'KeyM') toggleOverview();
  if (e.code === 'KeyN') toggleNav(true);
  if (e.code === 'KeyH') foldAll();   // v11.2: fold / unfold every HUD box
  if (e.code === 'KeyO') toggleSave(true);
  if (e.code === 'KeyF') cycleSpeed();
  if (e.code === 'KeyQ') rotateView(-1);
  if (e.code === 'KeyR') rotateView(1);
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('#hud button, #dlg button'); if (b) b.blur(); });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function cycleSpeed() { S.speed = S.speed === 1 ? 2 : S.speed === 2 ? 4 : 1; $('speedLbl').textContent = S.speed + '×'; SFX.click(); }
$('bPause').onclick = () => togglePause();
$('pauseVeil').onclick = () => togglePause(false);
$('bMap').onclick = () => toggleOverview();
$('bRotL').onclick = () => rotateView(-1);
$('bRotR').onclick = () => rotateView(1);
$('bSpeed').onclick = () => cycleSpeed();
// v11.2: the music button opens a track list (auto, each track, off); the choice is remembered
$('bMusic').onclick = (e) => {
  e.stopPropagation(); ensureAudio(); if (actx && actx.state === 'suspended') actx.resume();
  let m = $('musicMenu'); if (m) { m.remove(); return; }
  m = document.createElement('div'); m.id = 'musicMenu'; m.className = 'panel';
  const tracks = MUSIC.data ? MUSIC.data.tracks : [];
  const row = (id, label, sub) => `<button type="button" data-m="${id}" class="${MUSIC.pick === id ? 'on' : ''}"><b>${label}</b>${sub ? `<span>${sub}</span>` : ''}</button>`;
  m.innerHTML = '<div class="eyebrow">Music · 音乐</div>' + row('auto', '自动', '按时间换曲；天台咖啡馆放爵士') + tracks.map(t => row(t.id, t.zh, `${t.en} · ${t.bpm} BPM`)).join('') + row('off', '关闭', '');
  m.querySelectorAll('[data-m]').forEach(b => { b.onclick = (ev) => { ev.stopPropagation(); MUSIC.pick = b.dataset.m; musicOn = MUSIC.pick !== 'off'; try { localStorage.setItem('prof-music', MUSIC.pick); } catch (er) { /* storage blocked */ } $('bMusic').classList.toggle('on', musicOn); m.remove(); toast(musicOn ? `音乐：${b.querySelector('b').textContent}` : '音乐已关闭'); }; });
  $('rightCol').appendChild(m);
  setTimeout(() => addEventListener('click', function off() { const mm = $('musicMenu'); if (mm) mm.remove(); removeEventListener('click', off); }), 0);
};
$('bMusic').classList.toggle('on', musicOn);
$('bSound').onclick = () => { soundOn = !soundOn; $('bSound').classList.toggle('on', soundOn); };
const QNAME = { high: '高', mid: '中', low: '低' };
$('qualLbl').textContent = '画质 ' + QNAME[QUALITY];
$('bQual').onclick = () => { const order = ['high', 'mid', 'low']; const nq = order[(order.indexOf(QUALITY) + 1) % 3]; if ($('bQual').dataset.arm === nq) return setQuality(nq); $('bQual').dataset.arm = nq; $('qualLbl').textContent = `画质 ${QNAME[nq]}？`; toast(`再点一次切换到「${QNAME[nq]}」画质。页面会重新载入，今天的进度会清空。`); };
// v11.1 art style: title-page pair and a top-bar toggle (two taps, as for quality: it reloads the page)
document.querySelectorAll('.qualRow [data-q]').forEach(b => { b.classList.toggle('on', b.dataset.q === QUALITY); b.onclick = () => { if (b.dataset.q !== QUALITY) setQuality(b.dataset.q); }; });
$('bEnd').onclick = () => { if (S && S.running && !S.dialog) { if (S.activity && S.activity.cancelable) finishActivity(false); if (!S.activity) confirmHome(); } };
$('btnE').onclick = () => { if (S && S.dialog && S.dialog.mini && S.dialog.mini.press) S.dialog.mini.press(); else interact(); };
$('dlgLog').addEventListener('click', () => { if (S && S.dialog) S.dialog.typing.forEach(j => j.finish()); });
(() => {
  const j = $('joy'), k = $('joyKnob'); let id = null, cx = 0, cy = 0;
  j.addEventListener('pointerdown', (e) => { id = e.pointerId; const r = j.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; j.setPointerCapture(id); mv(e); });
  const mv = (e) => { if (e.pointerId !== id) return; let dx = (e.clientX - cx) / 50, dy = (e.clientY - cy) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.x = dx; joy.y = -dy; k.style.transform = `translate(${dx * 34}px,${dy * 34}px)`; };
  j.addEventListener('pointermove', mv);
  const up = (e) => { if (e.pointerId !== id) return; id = null; joy.x = joy.y = 0; k.style.transform = ''; };
  j.addEventListener('pointerup', up); j.addEventListener('pointercancel', up);
})();
(() => {
  let down = null, drag = null; const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), v2 = new THREE.Vector2(), hit = new THREE.Vector3();
  const el = renderer.domElement;
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now(), b: e.button }; if (e.button === 2 || e.button === 1) drag = { x: e.clientX, az: camState.wantAz }; });
  el.addEventListener('pointermove', (e) => { if (drag) camState.wantAz = drag.az - (e.clientX - drag.x) * 0.006; });
  el.addEventListener('pointerup', (e) => {
    const wasDrag = drag; drag = null;
    if (!down || down.b !== 0 || wasDrag || !S || !S.running || S.dialog || S.activity || S.paused) return;
    if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 12 || performance.now() - down.t > 500) return;
    const r = el.getBoundingClientRect();
    v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v2, cam); if (!ray.ray.intersectPlane(plane, hit)) return;
    if (camState.overview) toggleOverview(false);
    S.autoRoute = null; S.autoNext = null;
    const ev = eventAt(hit.x, hit.z);
    walkTo(hit.x, hit.z, ev && Math.hypot(HS[ev.loc].x - hit.x, HS[ev.loc].z - hit.z) < 1.2 ? ev : null);
  });
  el.addEventListener('wheel', (e) => { e.preventDefault(); camState.followDist = clamp(camState.followDist * (1 + Math.sign(e.deltaY) * 0.1), 13, 44); }, { passive: false });
})();
$('quickBM').onclick = () => quickMenu();
// v14.0.1: browsers only let audio start inside a user gesture, so the title page was silent until a mode button was
// pressed. The first tap or key anywhere (the title's lede, the emblem, a scroll on mobile) now opens the audio context;
// musicTick() then plays the evening track behind the title as it already intended.
['pointerdown', 'keydown', 'touchstart'].forEach(k => addEventListener(k, () => { ensureAudio(); if (actx && actx.state === 'suspended') actx.resume(); }, { once: true, capture: true, passive: true }));
$('modeBasic').onclick = () => { setup.mode = 'basic'; ensureAudio(); renderSetup(); show('scrSetup'); };
$('modePro').onclick = () => { if (!AI.ready()) return openAI('先选择服务商并填写 API Key，保存后再点「学者 Pro 版」。'); setup.mode = 'pro'; ensureAudio(); renderSetup(); show('scrSetup'); };
$('aiBtnTitle').onclick = () => openAI();
$('bAI').onclick = () => openAI();
$('nextDayBtn').onclick = () => { SFX.click(); startDay(S.day + 1); };
$('dayHomeBtn').onclick = () => { show('scrTitle'); refreshContinue(); };
$('setupBack').onclick = () => { SFX.click(); show('scrTitle'); };
$('setupNext').onclick = () => { SFX.click(); renderHandover(); show('scrHand'); };
$('handBack').onclick = () => { SFX.click(); show('scrSetup'); };
$('startBtn').onclick = startGame;
$('againBtn').onclick = () => { SFX.click(); const c = loadCareer(); if (c && c.done) { try { localStorage.removeItem(CAREER_KEY); } catch (e) { /* storage blocked */ } show('scrTitle'); refreshContinue(); } else nextWeek(); };
$('homeBtn').onclick = () => { show('scrTitle'); refreshContinue(); };
// v14.0 week review buttons: the same actions as the dashboard's, plus the detail toggle
$('wkAgain').onclick = () => $('againBtn').onclick();
$('wkHome').onclick = () => $('homeBtn').onclick();
$('wkCard').onclick = () => { SFX.click(); weeklyCardSave(); };
$('wkDetail').onclick = () => { const sc = $('scrEnd'), open = !sc.classList.contains('open'); sc.classList.toggle('open', open); $('wkDetail').textContent = open ? '收起 ▴' : '看详细 ▾'; SFX.click(); };
setTimeout(() => (CONTENT.p || Promise.resolve()).then(refreshContinue), 0);   // the label names the day, which comes with the content
initAI();
(async () => {
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const s = await window.claude.use('sample');
      if (s) { sampleFn = s; if (!AI.cfg.apiKey) AI.save({ provider: 'claude-app' }); }
    }
  } catch (e) { /* unavailable */ }
  refreshProCard();
})();

function onZoneChange(z) { setEnvFor(z); if (z.id === 'f1') canteenSigns(); loadVisibleModels(); cityGroup.visible = !z.outdoor; scene.fog.near = z.outdoor ? 160 : 90; scene.fog.far = z.outdoor ? 420 : 330; }
onZoneChange(Z);
