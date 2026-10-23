/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* ---------------- saves (v2, with v1 migration) + career ---------------- */
const SAVE_KEY = 'prof-week-save-v2', SAVE_V1 = 'prof-week-save-v1', CAREER_KEY = 'prof-career-v1';
const PERSIST = ['bm', 'k', 'xp', 'level', 'ach', 'cards', 'log', 'grant', 'submitted', 'paper', 'paperSubmitted', 'day', 'collapses', 'lastEnd', 'totals', 'muons', 'rooms', 'zones', 'sports', 'reads', 'clears', 'flags', 'coffeesWeek', 'mealsWeek', 'mode', 'avatar',
  'week', 'career', 'wb', 'trust', 'mem', 'lost', 'gq', 'intel', 'crisis', 'crisisSeen', 'timeWeek', 'focusBlocks', 'recruit', 'intents', 'rumours', 'subWb', 'endT',
  'dos', 'dataReq', 'fam', 'homeNights', 'famSkip', 'famEvents', 'fin', 'companions', 'tableSeen', 'tableLog', 'inspired', 'zhaoFlow', 'coachWeek', 'mealsOut', 'mealsAlone', 'tiredDay'];
/* v10.2 saves. Day boundaries save PERSIST (as before). During a day, an autosave every 20 s (and when the tab is hidden)
   also stores a mid-day snapshot ("mid"): the whole state minus 3D objects, dialogs and activities, plus the state the
   day started from ("dayBase") so the day's events can be rebuilt with their functions, then given their saved states.
   Three manual slots and a JSON export/import sit on top. */
const SLOT_KEYS = ['prof-week-slot-1', 'prof-week-slot-2', 'prof-week-slot-3'];
const SNAP_SKIP = new Set(['marker', 'dialog', 'activity', 'ctl', 'typing', 'dayBase', 'autoTarget']);
function snapState(st, keepBase) {
  const seen = new WeakSet();
  return JSON.parse(JSON.stringify(st, function (k, v) {
    if (SNAP_SKIP.has(k) && !(keepBase && k === 'dayBase')) return undefined;
    if (v && typeof v === 'object') { if (v.isObject3D || v.isMaterial || v.isTexture) return undefined; if (seen.has(v)) return undefined; seen.add(v); }
    return v;
  }));
}
function canSnapMid() { return !!(S && S.running && !S.ended && !S.planning && !S.quick && !S.dialog && !BM.m && S.dayBase && player); }
function savePayload(mid) {
  const o = {}; PERSIST.forEach(k => { o[k] = S[k]; });
  const x = { v: 6, setup: Object.assign({}, setup), S: o, at: Date.now(), mid: null };
  if (mid && canSnapMid()) x.mid = { S: Object.assign(snapState(S), { dayBase: S.dayBase }), zone: Z.id, pos: { x: player.position.x, z: player.position.z, ry: player.rotation.y } };
  return x;
}
function saveGame(mid) { if (S && S.quick) return false; try { localStorage.setItem(SAVE_KEY, JSON.stringify(savePayload(mid))); return true; } catch (e) { return false; } }
function saveLabel(x) {
  if (!x || !x.S) return '';
  const st = x.mid ? x.mid.S : x.S, c = st.career, day = Math.max(0, Math.min(6, st.day || 0));
  return `第 ${st.week || 1} 周 · ${DAYS[day] ? DAYS[day].name : '周' + '一二三四五六日'[day]}${x.mid ? ' ' + fmt(st.t) : ' 早上'}${c && RANKS[c.rank] ? ' · ' + RANKS[c.rank].n : ''}`;
}
const fmtWhen = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
function readSlot(i) { try { return migrateSave(JSON.parse(localStorage.getItem(SLOT_KEYS[i]) || 'null')); } catch (e) { return null; } }
function saveToSlot(i) {
  if (!S || S.quick) return;
  const x = savePayload(true); x.career = loadCareer();
  try { localStorage.setItem(SLOT_KEYS[i], JSON.stringify(x)); saveGame(true); toast(`已存到存档 ${i + 1}：${saveLabel(x)}`, 'good'); } catch (e) { toast('存档失败：浏览器存储空间不足或被禁用。', 'bad'); }
  if (S.activity) toast('正在做的事不会存进去：读档后要重新开始。');
  renderSaveSheet();
}
function loadSlot(i) {
  if (!needContent(() => loadSlot(i))) return;
  const x = readSlot(i); if (!x) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(x)); if (x.career) saveCareer(x.career); } catch (e) { return toast('读档失败：浏览器存储被禁用。', 'bad'); }
  toggleSave(false, true); continueGame();
}
function exportSaves() {
  const data = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('prof-')) data[k] = localStorage.getItem(k); }
  const blob = new Blob([JSON.stringify({ game: 'professor-week', v: 1, exported: new Date().toISOString(), data }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'), d = new Date(); a.href = URL.createObjectURL(blob);
  a.download = `professor-week-saves-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.json`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast('已导出：自动存档、三个存档位、职业生涯和设置都在这个文件里。', 'good');
}
function importSaves(file) {
  const r = new FileReader();
  r.onload = () => {
    let j; try { j = JSON.parse(r.result); } catch (e) { return toast('这个文件不是存档文件。', 'bad'); }
    if (!j || j.game !== 'professor-week' || !j.data) return toast('这个文件不是《导师的一周》的存档。', 'bad');
    if (!confirm('导入会覆盖这个浏览器里现有的存档、存档位和职业生涯。继续吗？')) return;
    try { Object.keys(localStorage).filter(k => k.startsWith('prof-')).forEach(k => localStorage.removeItem(k)); Object.entries(j.data).forEach(([k, v]) => { if (k.startsWith('prof-')) localStorage.setItem(k, v); }); }
    catch (e) { return toast('导入失败：浏览器存储被禁用或空间不足。', 'bad'); }
    toast('导入完成。', 'good'); refreshContinue(); renderSaveSheet();
  };
  r.readAsText(file);
}
let saveWasPaused = false;
function toggleSave(open, silent) {
  const sh = $('saveSheet'); open = open === undefined ? sh.classList.contains('hidden') : open;
  if (open) { if (S && S.running && !S.planning) { saveWasPaused = S.paused; S.paused = true; } renderSaveSheet(); sh.classList.remove('hidden'); if (!silent) SFX.click(); }
  else { sh.classList.add('hidden'); if (S && S.running && !S.planning && !silent) S.paused = saveWasPaused; }
}
function renderSaveSheet() {
  const inGame = !!(S && S.running && !S.quick), auto = loadSave();
  const row = (title, x, btns) => `<div class="slot"><div class="info"><b>${esc(title)}</b><small>${x ? esc(saveLabel(x)) + ' · 存于 ' + fmtWhen(x.at || Date.now()) : '空'}</small></div>${btns}</div>`;
  let h = `<h3>存档 / 读档</h3><div class="sub">每 20 秒和每天开始、结束时自动存档；关掉网页再打开，点首页「继续」就能接着玩。三个存档位可以手动保存，存档只保存在这个浏览器里，换电脑请用「导出」。${inGame && S.dialog ? '<br>对话中不能存档，先把这件事处理完。' : ''}</div>`;
  h += row('自动存档', auto, auto ? `<button class="btn" type="button" data-auto="1">读取</button>` : '');
  SLOT_KEYS.forEach((k, i) => { const x = readSlot(i);
    h += row(`存档 ${i + 1}`, x, (inGame && !S.dialog && !BM.m ? `<button class="btn gold" type="button" data-save="${i}">${x ? '覆盖' : '存到这里'}</button>` : '') + (x ? `<button class="btn" type="button" data-load="${i}">读取</button><button class="btn ghost" type="button" data-del="${i}" title="删除">删除</button>` : '')); });
  h += `<div class="saveFoot"><button class="btn ghost" type="button" id="saveExport">导出全部存档</button><button class="btn ghost" type="button" id="saveImport">导入存档文件</button><span style="flex:1"></span><button class="btn" type="button" id="saveClose">关闭 <span class="key">Esc</span></button></div>`;
  const box = $('saveBox'); box.innerHTML = h;
  box.querySelectorAll('[data-save]').forEach(b => { b.onclick = () => { const i = +b.dataset.save; if (readSlot(i) && !confirm(`覆盖存档 ${i + 1}？`)) return; saveToSlot(i); }; });
  box.querySelectorAll('[data-load]').forEach(b => { b.onclick = () => { if (inGame && !confirm('读取存档会放弃当前没存的进度。继续吗？')) return; loadSlot(+b.dataset.load); }; });
  box.querySelectorAll('[data-del]').forEach(b => { b.onclick = () => { const i = +b.dataset.del; if (!confirm(`删除存档 ${i + 1}？这一步不能撤销。`)) return; try { localStorage.removeItem(SLOT_KEYS[i]); } catch (e) { /* storage blocked */ } renderSaveSheet(); }; });
  const ab = box.querySelector('[data-auto]'); if (ab) ab.onclick = () => { if (inGame && !confirm('读取自动存档会回到上一次自动保存的位置。继续吗？')) return; toggleSave(false, true); continueGame(); };
  $('saveExport').onclick = exportSaves;
  $('saveImport').onclick = () => { $('saveFile').value = ''; $('saveFile').click(); };
  $('saveClose').onclick = () => toggleSave(false);
}
$('saveFile').onchange = (e) => { const f = e.target.files && e.target.files[0]; if (f) importSaves(f); };
$('bSave').onclick = () => toggleSave(true);
$('loadBtnTitle').onclick = () => toggleSave(true);
// Autosave the day in progress when the tab is hidden or closed.
addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && canSnapMid()) saveGame(true); });
addEventListener('pagehide', () => { if (canSnapMid()) saveGame(true); });
// v1 saves (v3/v4 builds) have no career, trust or wellbeing: start them as week 1 with defaults.
function migrateSave(x) {
  if (!x || !x.S) return null;
  if (!x.v) {
    const st = x.S, c = freshCareer(); x.v = 2;
    Object.assign(st, { week: 1, career: c, wb: c.wb, lost: [], mem: {}, gq: 40, intel: {}, crisis: {}, crisisSeen: {}, timeWeek: {}, focusBlocks: 0, recruit: false, intents: [], rumours: [] });
    st.trust = {}; Object.keys(STUDENTS).forEach(id => { st.trust[id] = 60; });
  }
  // v2 → v3 (v6 build): derive dossier stars from what the v5 save already knew; start the family fresh.
  if (x.v === 2) {
    const st = x.S, dos = freshDossier(); x.v = 3;
    dos.grant.write = Math.min(3, st.focusBlocks || 0); dos.grant.idea = Math.min(3, st.reads || 0); if (st.flags && st.flags.letter) dos.grant.letter = 2;
    const F = st.flags || {}; for (const f in FLAG_STARS) if (F[f]) { const [p, c, n] = FLAG_STARS[f]; dos[p][c] = Math.min(3, dos[p][c] + n); }
    Object.assign(st, { dos, dataReq: null, fam: freshFamily(), homeNights: 0, famSkip: 0, famEvents: {} });
  }
  // v3 → v4 (v8 build): career gains posts and the academy; old top rank remapped.
  if (x.v === 3) { if (x.S.career) migrateCareer(x.S.career); x.v = 4; }
  // v4 → v5 (v9 build): money. The week in progress takes the career's ledger.
  if (x.v === 4) { if (x.S.career) { migrateCareer(x.S.career); migrateFin(x.S.career); } if (!x.S.fin) x.S.fin = JSON.parse(JSON.stringify((x.S.career && x.S.career.fin) || freshFin())); x.v = 5; }
  // v5 → v6 (v10.2): optional mid-day snapshot; older saves resume at the start of their day, as before.
  if (x.v === 5) { x.mid = null; x.v = 6; }
  return x;
}
function loadSave() {
  try {
    let x = migrateSave(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'));
    if (!x) { x = migrateSave(JSON.parse(localStorage.getItem(SAVE_V1) || 'null')); if (x) { localStorage.setItem(SAVE_KEY, JSON.stringify(x)); localStorage.removeItem(SAVE_V1); } }
    return x && x.S && x.S.day >= 0 && x.S.day <= 6 ? x : null;
  } catch (e) { return null; }
}
function clearSave() { try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_V1); } catch (e) { /* storage blocked */ } }
function loadCareer() { try { const c = JSON.parse(localStorage.getItem(CAREER_KEY) || 'null'); return c && c.week ? migrateCareer(c) : null; } catch (e) { return null; } }
function saveCareer(c) { try { localStorage.setItem(CAREER_KEY, JSON.stringify(c)); } catch (e) { /* storage blocked */ } }
function refreshContinue() {
  const sv = loadSave(), c = loadCareer(), btn = $('contBtn');
  if (sv) { btn.classList.remove('hidden'); btn.textContent = `继续：${saveLabel(sv)}`; btn.onclick = continueGame; }
  else if (c && c.week > 1 && !c.done) { btn.classList.remove('hidden'); btn.textContent = `继续职业生涯：第 ${c.week} 周 · ${RANKS[c.rank].n}${postLabel(c)}`; btn.onclick = nextWeek; }
  else btn.classList.add('hidden');
}
function nextWeek() {
  if (!needContent(nextWeek)) return;
  const c = loadCareer() || freshCareer();
  ensureAudio(); if (actx && actx.state === 'suspended') actx.resume();
  if (c.setup) Object.assign(setup, c.setup);
  if (S) S.events.forEach(ev => { if (ev.marker) ev.marker.parent.remove(ev.marker); });
  S = newState(c); startDay(0);
}

/* Week epilogue: what the week's choices turned into. Each row: [ok|bad|mid, title, detail, points]. */
function weekOutcomes() {
  const F = S.flags, out = [];
  if (!S.submitted) out.push(['bad', '基金：没有提交', `停在 ${Math.floor(S.grant)}%。申报系统周五 23:59 准时关闭。`, 0]);
  else {
    // v6: the verdict is the dossier. Reviewer noise is seeded by the week so a reload cannot reroll it.
    const g = S.dos.grant, noise = Math.round((rng(S.week * 7919 + 17)() - 0.5) * BAL.grantNoise);
    const q = clamp(dossierScore('grant') + noise + (S.k.research >= 60 ? 3 : 0) + ((S.subWb ?? S.wb) < 40 ? -4 : 0));
    const why = [g.idea >= 2 ? '创新点清楚' : '创新性论证不足', g.data >= 2 ? '预实验数据有说服力' : g.data === 1 ? '预实验数据单薄' : '没有预实验数据', g.letter >= 2 && '化学系陈老师的合作意向', g.write >= 3 ? '写作完整、逻辑连贯' : g.write <= 1 ? '文本仓促、前后不一致' : null, (S.subWb ?? S.wb) < 40 && '赶工的痕迹（交稿时身心透支）'].filter(Boolean);
    const stars = DOSSIER.grant.comps.map(c => `${c.n}${STAR(g[c.id])}`).join(' ');
    out.push(q >= BAL.grantTop ? ['ok', '基金：优先资助 · 三个月后', `评审综合分 ${q}（≥ ${BAL.grantBar} 获批）。${stars}。评审意见：${why.join('、')}。`, 5] : q >= BAL.grantBar ? ['ok', '基金：获批 · 三个月后', `评审综合分 ${q}（≥ ${BAL.grantBar} 获批）。${stars}。评审意见：${why.join('、')}。`, 4] : ['bad', '基金：未获资助 · 三个月后', `评审综合分 ${q}（≥ ${BAL.grantBar} 获批）。${stars}。评审意见：${why.join('、')}${g.write >= 2 && g.idea + g.data === 0 ? '——“写得不错，但新在哪里？”' : ''}。`, 0]);
  }
  if (!S.paperSubmitted) out.push(['bad', '论文：被标记为撤回', '修改稿没能在周日截止前提交。', 0]);
  else {
    const pp = S.dos.paper, pn = Math.round((rng(S.week * 104729 + 5)() - 0.5) * 8);
    const q = clamp(dossierScore('paper') + pn + Math.round((S.k.integrity - 60) * 0.2));
    const why = [pp.r2 >= 3 ? '补了审稿人 2 要的温度分析' : '没有回应审稿人 2 的系统误差问题', pp.cover >= 2 && '逐条回复信', pp.result >= 2 && '小陈那张漂亮的寿命拟合', F.sys_ok && '诚实报告的系统误差检查', pp.figure >= 3 ? '图和正文改得完整' : pp.figure <= 1 ? '正文改动太少' : null].filter(Boolean).join('、') + '。' + DOSSIER.paper.comps.map(c => `${c.n}${STAR(pp[c.id])}`).join(' ');
    out.push(q >= 70 ? ['ok', '论文：直接接收', `编辑：“All concerns have been addressed.” 关键：${why}。`, 3] : q >= 55 ? ['ok', '论文：小修后接收', `再改两处就能发表。关键：${why}。`, 2] : q >= 40 ? ['mid', '论文：大修', `审稿人还不满意。关键：${why}。`, 1] : ['bad', '论文：拒稿', `编辑认为修改不充分。关键：${why}。`, 0]);
  }
  Object.entries(STUDENTS).forEach(([id, p]) => {
    if (S.lost.includes(id)) return out.push(['bad', `${p.n}：已离开课题组`, '转去了别的导师那里。组里少了一个人，剩下的人都看在眼里。', 0]);
    const v = Math.round(S.trust[id]);
    if (v < 30) { S.lost.push(id); return out.push(['bad', `${p.n}：假期后换了导师`, `信任只剩 ${v}。这周${p.he}找过你几次，你都在忙。`, 0]); }
    out.push(v >= 60 ? ['ok', `${p.n}：留在组里，干劲十足`, `信任 ${v}。`, 1] : ['mid', `${p.n}：留下了，但有点疏远`, `信任 ${v}。下周多花点时间在${p.he}身上。`, 0]);
  });
  if (S.recruit) out.push(F.recruit_ok ? ['ok', '新人：大二的小吴下周来旁听组会', '踢一场球换来的。', 1] : ['mid', '新人：小吴还在等你的回信', '踢球时认识的本科生。', 0]);
  if (F.ally_coach) out.push(['ok', '合作伙伴：化学系陈老师', '网球场上的交情。以后每周五他都可能帮你一把。', 0]);
  if (S.k.rep >= 70) out.push(['ok', '学院里的口碑不错', `声誉 ${Math.round(S.k.rep)}。`, 1]);
  const famMin = Math.min(...Object.values(S.fam)), famAvg = Object.values(S.fam).reduce((a, b) => a + b, 0) / 3;
  out.push(famMin < 35 ? ['bad', `家：${FAMILY[Object.entries(S.fam).sort((a, b) => a[1] - b[1])[0][0]].n}快撑不住了`, `这周在家 ${S.homeNights} 晚。${S.fam.partner < 35 ? '阿玲开始一个人做决定。' : S.fam.child < 35 ? '小宇不再问你题了。' : '家里乱成一团。'}`, 0] : famAvg >= 60 ? ['ok', `家：这周在家 ${S.homeNights} 晚`, `${Object.entries(FAMILY).map(([k, f]) => `${f.n} ${Math.round(S.fam[k])}`).join(' · ')}。${S.homeNights >= 4 ? '小宇说下周还要一起拼乐高。' : '还算把家顾住了。'}`, 1] : ['mid', `家：这周在家 ${S.homeNights} 晚`, `${Object.entries(FAMILY).map(([k, f]) => `${f.n} ${Math.round(S.fam[k])}`).join(' · ')}。他们没说什么，这才是问题。`, 0]);
  out.push(S.collapses ? ['bad', `累倒了 ${S.collapses} 次`, '身体比截止日更难商量。', 0] : ['ok', '一周没有累倒', '', 1]);
  out.push(S.wb < 30 ? ['bad', `身心透支（${Math.round(S.wb)}）`, '下周会从疲惫开始。', 0] : ['ok', `身心 ${Math.round(S.wb)}`, S.wb >= 60 ? '这周照顾好了自己。' : '还撑得住。', 0]);
  return out;
}
/* v8: a post offer (or the option to step down) on the week's end screen. Decisions write straight to the saved career. */
function renderOffer(offer, c) {
  const el = $('endOffer'); if (!el) return;
  const set = (fn, msg) => { const cc = loadCareer(); if (!cc) return; fn(cc); saveCareer(cc); el.innerHTML = `<div class="offerDone">${esc(msg)}</div>`; SFX.click(); };
  if (offer === 'vice_dean') {
    el.innerHTML = `<div class="offer"><b>院长：“下学期想请你当副院长，分管科研。”</b><small>每天多 3–4 件行政事务（院务会、评估、招聘、预算），声誉和团队更容易涨，专注时段会更少。三周后若声誉 ≥ 75，可能被提名为院长。</small><div class="row"><button class="btn gold" type="button" id="ofYes">接受</button><button class="btn ghost" type="button" id="ofNo">婉拒，专心做科研</button></div></div>`;
    $('ofYes').onclick = () => set(cc => { cc.post = 'vice_dean'; cc.postWeeks = 0; (cc.postLog = cc.postLog || []).push({ week: cc.week, n: '副院长' }); }, '你接受了。下周起，你是副院长。');
    $('ofNo').onclick = () => set(cc => { cc.postCool = 3; }, '你婉拒了。院长说：“那过一阵再说。”');
  } else if (offer === 'dean') {
    el.innerHTML = `<div class="offer"><b>学院换届：你被提名为院长</b><small>行政事务翻倍，会遇到利益冲突、人才引进、指标这些真正难的事。院士增选看科研，不看职务。</small><div class="row"><button class="btn gold" type="button" id="ofYes">接受提名</button><button class="btn ghost" type="button" id="ofNo">继续当副院长</button></div></div>`;
    $('ofYes').onclick = () => set(cc => { cc.post = 'dean'; cc.postWeeks = 0; (cc.postLog = cc.postLog || []).push({ week: cc.week, n: '院长' }); }, '下周起，你是院长。');
    $('ofNo').onclick = () => set(cc => { cc.postWeeks = 0; }, '你留在副院长的位置上。');
  } else if (c.post) {
    el.innerHTML = `<div class="offer"><b>${POSTS[c.post].n} · 第 ${c.postWeeks} 周</b><small>想把时间还给实验室，可以卸任。卸任后四周内不会再被邀请。</small><div class="row"><button class="btn ghost" type="button" id="ofQuit">卸任</button></div></div>`;
    $('ofQuit').onclick = () => set(cc => { (cc.postLog = cc.postLog || []).push({ week: cc.week, n: '卸任' + POSTS[cc.post].n }); cc.post = null; cc.postWeeks = 0; cc.postCool = 4; }, '你卸任了。下周起，只做教授。');
  } else el.innerHTML = '';
}
/* v12.2 "你的一周": who you spent time with, what was said at the table, when you first ran low. Shown on the week's end screen. */
function peopleRows() {
  const inv = Object.values(S.companions || {}).flatMap(d => Object.keys(d)), who = [...new Set(inv)].map(compName);
  const rows = [[inv.length >= 4 ? 'ok' : inv.length ? 'mid' : 'bad', `约人 ${inv.length} 次`, inv.length ? `和${who.join('、')}一起吃饭、喝咖啡或散步。` : '这周一直是一个人吃饭。']];
  (S.tableLog || []).forEach(x => { const e = (TABLE.events || []).find(t => t.id === x.id); if (e) rows.push(['mid', `${DAYS[x.day].name} · ${e.title}`, x.said ? `你：${x.said}` : '']); });
  if (S.mealsOut) rows.push([S.mealsAlone / S.mealsOut > 0.7 ? 'bad' : 'ok', `午饭和晚饭：${S.mealsOut - S.mealsAlone} / ${S.mealsOut} 顿有人一起`, '']);
  rows.push(S.tiredDay == null ? ['ok', '一整周精力都没跌破 30', ''] : ['mid', `${DAYS[S.tiredDay].name}第一次累到精力 30 以下`, S.tiredDay <= 1 ? '一周才刚开始。' : '']);
  return rows;
}
function careerEpilogue(c) {
  const st = careerStats(c), grades = c.history.map(h => h.grade).join('');
  const path = [{ week: 1, n: '助理教授' }].concat(c.rankLog || [], c.postLog || []).sort((a, b) => a.week - b.week).concat([{ week: c.academician, n: '院士' }]);
  const fam = S.fam ? Object.entries(FAMILY).map(([k, f]) => `${f.n} ${Math.round(S.fam[k])}`).join(' · ') : '';
  return `<div class="epi"><b>职业生涯 · ${c.academician} 周</b><div class="epiPath">${path.map(x => `<span><em>W${x.week}</em>${esc(x.n)}</span>`).join('')}</div><small>基金获批 ${st.grants} 次 · 论文直接接收 ${st.accepts} 篇 · 走掉的学生 ${c.lost.length} 人 · 每周评级 ${grades}${fam ? ' · 家里：' + fam : ''}</small><small>增选了 ${c.acadTries} 次。电话是王老师打来的，她比你先知道。</small>${S.fin ? `<small>财务：余额 ${fmtY(S.fin.cash)}${S.fin.mortgage ? ` · 房贷还剩 ${fmtY(S.fin.mortgage.bal)}` : ''}${S.fin.car ? ` · 车贷还剩 ${S.fin.car.left} 期` : (c.setup && c.setup.commute === 'car' && S.fin.commute === 'car' ? ' · 车贷还清了' : '')}${(S.fin.log || []).length ? ' · ' + S.fin.log.map(([w, t]) => `W${w} ${t}`).join('、') : ''}</small>` : ''}</div>`;
}
function endWeek(reason) {
  const T = S.totals;
  if (!S.collapses) unlock('week'); if (S.k.team >= 85) unlock('mentor7'); if (S.k.safety >= 80) unlock('safe7'); if (S.cards.length >= 20) unlock('scholar');
  const outs = weekOutcomes(), pts = outs.reduce((a, o) => a + o[3], 0);
  const avg = KPI.reduce((s, [k]) => s + S.k[k], 0) / KPI.length;
  // v6: the epilogue (grant, paper, students, family) carries the grade; the KPI average is half-weighted.
  // v13.2: the arithmetic lives in src/rules/pure.js (tested in Node); the home cap, the wellbeing floor and the bands are unchanged.
  const { score, grade, homeCap } = Rules.weekScore({ avg, pts, done: T.done, all: T.all, collapses: S.collapses, wb: S.wb, homeNights: S.homeNights }, BAL);
  const wbCost = Math.max(0, BAL.wbFloor - S.wb) * BAL.wbPenalty;   // shown in the review panel
  const G = [grade, { S: '院士候选人的一周', A: '稳健的长聘教授', B: '忙而不乱的青年教师', C: '被截止日追着跑的一周', D: '下周，请先睡一觉' }[grade]];
  // career
  S.weekResult = { grade: G[0], score: Math.round(score), pts, homeCap, kAvg: Math.round(avg), grantQ: S.submitted ? dossierScore('grant') : null, paperQ: S.paperSubmitted ? dossierScore('paper') : null, outs: outs.map(o => [o[0], o[1], o[3]]) };
  const c = S.career, rank0 = c.rank, post0 = c.post;
  c.pts += pts;
  c.history.push({ week: S.week, grade: G[0], pts, grant: outs[0][1], paper: outs[1][1], lost: S.lost.length, grantOk: outs[0][0] === 'ok', accept: /直接接收/.test(outs[1][1]), trust: Math.round(avgTrust()) });
  // v8: titles need points and a record; posts are offered; 院士 is voted on every 4 weeks from 讲席教授.
  const blocked = promote(c, S.week);
  if (c.post) {
    c.postWeeks = (c.postWeeks || 0) + 1;
    // The visible cost of a post: the lab sees less of you. It feeds next week's research and the academy vote.
    const drift = c.post === 'dean' ? 4 : 2, done = S.adminDone || 0, missed = S.adminMissed || 0;
    S.k.research = clamp(S.k.research - drift); c.k = Object.assign({}, S.k);
    outs.push(['mid', `行政：本周处理 ${done} 件，错过 ${missed} 次会议`, `${POSTS[c.post].n}的一周。实验室这周没怎么见到你：科研 −${drift}。`, 0]);
  }
  if (c.postCool > 0) c.postCool--;
  let offer = null;
  if (!c.post && c.rank >= 2 && !(c.postCool > 0)) offer = 'vice_dean';
  else if (c.post === 'vice_dean' && c.postWeeks >= 3 && S.k.rep >= 75) offer = 'dean';
  let vote = null;
  if (c.rank >= ACADEMY.rank) {
    if (!c.acadNext) c.acadNext = S.week + ACADEMY.every;
    else if (c.acadNext === S.week) { vote = academyVote(c); c.acadTries = (c.acadTries || 0) + 1; if (vote.elected) { c.done = true; c.academician = S.week; } else c.acadNext = S.week + ACADEMY.every; }
  }
  if (vote) outs.unshift(vote.elected ? ['ok', '院士增选：当选！', `当选把握约 ${vote.p}%：${vote.parts.map(([t, v]) => `${t}（${v >= 0 ? '+' : ''}${Math.round(v)}）`).join('、')}。`, 0]
    : ['bad', '院士增选：这一轮没有当选', `当选把握约 ${vote.p}%：${vote.parts.map(([t, v]) => `${t}（${v >= 0 ? '+' : ''}${Math.round(v)}）`).join('、')}。下一轮：第 ${c.acadNext} 周。`, 0]);
  if (blocked) outs.push(['mid', `「${RANKS[c.rank + 1].n}」：积分够了，还差记录`, `还需要：${blocked.join('、')}。`, 0]);
  // v9: the monthly statement. Salary follows the title held this week; the 安家费 arrives with 特聘教授.
  let money = null;
  if (S.fin) {
    const settle = c.rank >= 3 && !S.fin.settled; if (settle) S.fin.settled = true;
    if (S.fin.consult === S.week) { S.k.research = clamp(S.k.research - 2); c.k = Object.assign({}, S.k); }
    if (S.fin.tutor) S.fam.child = clamp(S.fam.child - 3);
    money = finSettle({ rank: rank0, post: post0, avg, grantOk: outs.some(o => /^基金：(获批|优先资助)/.test(o[1])), settle });
    const F = S.fin;
    outs.push(F.cash < 0 ? ['bad', `钱：余额 ${fmtY(F.cash)}`, `${money.missed ? '房贷这个月没扣上。' : '靠信用卡撑着，每月 1% 的利息。'}${F.consult === S.week ? '横向课题：科研 −2。' : ''}`, 0]
      : ['ok', `钱：余额 ${fmtY(F.cash)} · 本月 ${money.net >= 0 ? '+' : ''}${fmtY(money.net)}`, `${F.mortgage ? `房贷还剩 ${fmtY(F.mortgage.bal)}。` : ''}${F.consult === S.week ? '这个月接了横向：科研 −2。' : ''}${money.aud ? '有一张“会议餐费”被审计了。' : ''}`, 0]);
  }
  const carry = freshDossier(); carry.grant.letter = S.dos.grant.letter; carry.grant.idea = Math.max(0, S.dos.grant.idea - 1); carry.grant.data = Math.max(0, S.dos.grant.data - 1);
  Object.assign(c, { week: S.week + 1, trust: Object.assign({}, S.trust), lost: S.lost.slice(), flags: S.flags.ally_coach ? { ally_coach: 1 } : {}, wb: clamp(S.wb + 8), k: Object.assign({}, S.k), setup: Object.assign({}, setup), fam: Object.assign({}, S.fam), dos: carry, tableSeen: (S.tableSeen || []).slice(), fin: S.fin ? JSON.parse(JSON.stringify(S.fin)) : c.fin });
  saveCareer(c);
  const promoted = c.rank > rank0, nxt = RANKS[c.rank + 1], elected = !!(vote && vote.elected);
  if (elected) unlock('academician');
  $('endEyebrow').textContent = elected ? `第 ${S.week} 周 · 职业生涯结局` : `第 ${S.week} 周 · 周日 23:59 · 一周结束`;
  $('endHead').textContent = elected ? '当选院士' : promoted ? `晋升：${RANKS[c.rank].n}！` : reason === 'collapse' ? '周日晚上，你在办公桌前睡着了' : '这一周结束了';
  $('endGrade').textContent = G[0];
  $('endImg').src = portrait(PLAYER_LOOK(S.avatar === 'f'), promoted || G[0] === 'S' || G[0] === 'A' ? 'happy' : G[0] === 'D' ? 'sleepy' : 'normal');
  $('endTitle').textContent = elected ? `院士 · ${RANKS[c.rank].n}${postLabel(c)}` : G[1] + ` · ${RANKS[c.rank].n}${postLabel(c)}`;
  $('endSummary').textContent = [`这一周一共冒出 ${T.all} 件事，你亲手处理了 ${T.done} 件，累倒 ${S.collapses} 次。`, `完整的专注时段 ${S.focusBlocks} 段。`, `约有 ${Math.floor(S.muons).toLocaleString('zh-CN')} 个宇宙线缪子在这一周里穿过了你的身体。`].join('');
  $('endOutcomes').innerHTML = outs.map(([k, t, d, p]) => `<div class="oc ${k}"><span class="m">${k === 'ok' ? '✓' : k === 'bad' ? '✕' : '~'}</span><div><b>${esc(t)}</b><small>${esc(d)}</small></div><em>${p ? '+' + p : ''}</em></div>`).join('');
  const pct = nxt ? clamp((c.pts - RANKS[c.rank].pts) / (nxt.pts - RANKS[c.rank].pts) * 100) : 100;
  const st = careerStats(c), nextReq = nxt ? reqUnmet(nxt, c) : [];
  const acadLine = c.rank >= ACADEMY.rank ? (elected ? '' : ` · 下一次院士增选：第 ${c.acadNext} 周`) : '';
  $('endCareer').innerHTML = `<div class="crTop"><b>${RANKS[c.rank].n}${postLabel(c)}</b><span>${RANKS[c.rank].en}${c.post ? ' · ' + POSTS[c.post].en : ''}</span></div><div class="crBar"><i style="width:${pct}%"></i></div><div class="crSub">本周 +${pts} 分 · 职业生涯累计 ${c.pts} 分${nxt ? ` · 距离「${nxt.n}」还差 ${Math.max(0, nxt.pts - c.pts)} 分${nextReq.length ? '，以及' + nextReq.join('、') : ''}` : ' · 职称已到顶'}${acadLine} · 累计基金获批 ${st.grants} 次、论文直接接收 ${st.accepts} 篇</div><div class="crHist">${c.history.slice(-8).map(h => `<span title="${esc(h.grant + ' / ' + h.paper)}">W${h.week} <b>${h.grade}</b> +${h.pts}</span>`).join('')}</div>`;
  const tw = S.timeWeek, totMin = Object.values(tw).reduce((a, b) => a + b, 0) || 1, waste = ((tw.travel || 0) + (tw.idle || 0)) / totMin;
  $('endTime').innerHTML = catBars(tw);
  $('endMetrics').innerHTML = [['过期事件比例', Math.round(T.missed / Math.max(1, T.all) * 100) + '%', '目标 20–35%：说明你在取舍'], ['完整专注时段', S.focusBlocks + ' 段', '≥ 90 分钟不被打断'], ['时间利用率', Math.round((1 - waste) * 100) + '%', '走路、等电梯和发呆以外的时间'], ['平均学生信任', Math.round(avgTrust()), ''], ['在家的晚上', S.homeNights + ' 晚', homeCap ? '少于 2 晚：评级上限 B' : '目标 3–4 晚'], ['周日身心', Math.round(S.wb), wbCost ? `低于 ${BAL.wbFloor}：综合分 −${Math.round(wbCost)}` : `${BAL.wbFloor} 以上不扣分`]].map(([a, b, c2]) => `<tr><td>${a}<br><span class="note">${c2}</span></td><td>${b}</td></tr>`).join('');
  $('endKpis').innerHTML = KPI.map(([k, n]) => `<tr><td><span class="dot" style="background:${S.k[k] < 40 ? 'var(--danger)' : S.k[k] < 55 ? 'var(--warn)' : 'var(--cyan)'}"></span>${n}</td><td>${Math.round(S.k[k])}</td></tr>`).join('') + `<tr><td><span class="dot" style="background:var(--gold)"></span>综合得分</td><td>${Math.round(score)}</td></tr>`;
  $('endAch').innerHTML = Object.entries(ACHIEVEMENTS).map(([id, [n, d]]) => `<div class="${S.ach.includes(id) ? '' : 'off'}"><span class="medal">★</span><span><b>${esc(n)}</b><small>${esc(d)}</small></span></div>`).join('');
  $('endLog').innerHTML = S.log.map(l => `<div><span class="t">${DAYS[l.day || 0].name.slice(1)} ${fmt(l.t)}</span><span>${esc(l.text)}</span></div>`).join('');
  $('cardsHead').textContent = `本周收集的科普卡 · ${S.cards.length} / ${Object.keys(CARDS).length}`;
  $('endCards').innerHTML = S.cards.map(c2 => `<div class="card"><h4>${esc(CARDS[c2].t)}</h4><p>${esc(CARDS[c2].b)}</p></div>`).join('');
  $('againBtn').textContent = elected ? '开始新的职业生涯 ▶' : `开始第 ${c.week} 周 ▶`;
  if (elected) $('endOffer').innerHTML = ''; else renderOffer(offer, c);
  if (elected) $('endCareer').innerHTML += careerEpilogue(c);
  $('endMoney').innerHTML = money ? finStatementHTML(money) : '';
  $('endPeople').innerHTML = peopleRows().map(([k, t, d]) => `<div class="oc ${k}"><span class="m">${k === 'ok' ? '✓' : k === 'bad' ? '✕' : '~'}</span><div><b>${esc(t)}</b><small>${esc(d)}</small></div><em></em></div>`).join('');
  clearSave(); refreshContinue();
  if (promoted) setTimeout(() => { SFX.level(); }, 700);
  try { const best = +localStorage.getItem('prof-day-best') || 0; if (score > best) localStorage.setItem('prof-day-best', String(Math.round(score))); } catch (e) { /* storage unavailable */ }
  fadeTo(() => { $('hud').classList.add('hidden'); show('scrEnd'); toggleOverview(true); camState.orbit = 0.0001; });
}
