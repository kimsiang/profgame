/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* ---------------- interaction targets ---------------- */
function amenityAt(x, z) {
  const near = (h, r = 1.25) => (HS[h].zone || 'f5') === Z.id && Math.hypot(HS[h].x - x, HS[h].z - z) < r;
  for (const p of Z.portals) if (Math.hypot(p.x - x, p.z - z) < 1.3) return p.kind === 'elevator' ? { label: '乘电梯', code: FLOOR_LABEL[Z.id] || Z.name, act: openElevator } : { label: p.label || '出门', code: '门', act: () => travel(p.to, p) };
  if (near('canteen')) return { label: S.t >= hm(10, 30) && S.t < hm(20, 30) && CANTEEN.data ? '食堂：今天 6 个世界美食档口 · 选一家' : `食堂打饭：${FOOD()[0]}`, code: '1F', act: () => canteenMenu() };
  if (near('libdesk', 1.6)) return { label: '读 30 分钟论文 · 论文进度 + 基金创新点', code: '3F', act: () => ACT.read(30) };
  if (near('tennis', 1.8)) return { label: `和陈老师打 30 分钟网球 · 声誉 + 身心${S.flags.ally_coach ? '' : ' · 也许能谈成合作'}`, code: '4F', act: () => ACT.tennis(30) };
  if (near('garden', 1.8)) return { label: `在植物园里走 20 分钟 · 身心 +9（现在 ${Math.round(S.wb)}）${companionsFor('garden').ok.length ? ' · 可以给阿玲打电话' : ''}`, code: '6F', act: openGarden };
  if (near('roofcafe', 1.6)) return { label: `天台咖啡（第 ${S.coffees + 1} 杯）· 顺便听听明天的八卦`, code: 'R', act: openRoofCafe };
  if (near('pitch', 2.5)) return { label: `和本科生踢 40 分钟球 · 团队 + 身心${S.recruit ? '' : ' · 也许能招到人'}`, code: '校园', act: () => ACT.soccer(40) };
  if (near('courtB', 2.0)) return { label: '和阿丹打一局羽毛球（7 分）· 学生信任 +', code: '体育馆', act: () => bmOffer('aqiang') };
  if (near('desk')) return { label: `办公桌 · 专注写到 ${fmt(commitEnd())} · 基金 ${S.submitted ? '已交' : Math.floor(S.grant) + '%'} · 论文 ${S.paperSubmitted ? '已交' : Math.floor(S.paper) + '%'}`, code: '503', act: openDesk };
  if (near('sofa')) return { label: '在沙发上小睡 25 分钟', code: '503', act: ACT.nap };
  if (near('coffee')) return { label: `冲一杯咖啡（今天第 ${S.coffees + 1} 杯）`, code: '508', act: ACT.coffee };
  if (near('food')) return { label: '吃' + FOOD_PANTRY()[0], code: '508', act: ACT.eat };
  if (near('wc', 1.6)) return { label: '上厕所', code: 'WC', act: ACT.wc };
  return null;
}
function eventAt(x, z) {
  let best = null, bd = 1.45;
  for (const ev of activeEvents()) { if (ev.phone) continue; const h = HS[ev.loc]; if ((h.zone || 'f5') !== Z.id) continue; const d = Math.hypot(h.x - x, h.z - z); if (d < bd) { bd = d; best = ev; } }
  return best;
}
let currentTarget = null;
function updatePrompt() {
  const el = $('prompt');
  if (!S.running || S.dialog || S.activity || camState.overview) { el.classList.add('hidden'); currentTarget = null; return; }
  const p = player.position, ev = eventAt(p.x, p.z);
  if (ev) { currentTarget = { ev }; el.innerHTML = `<span class="key">E</span><span class="tag">${esc(HS[ev.loc].code)}</span>处理：${esc(ev.title)}`; el.classList.remove('hidden'); return; }
  const am = amenityAt(p.x, p.z);
  if (am) { currentTarget = { am }; el.innerHTML = `<span class="key">E</span><span class="tag">${esc(am.code)}</span>${esc(am.label)}`; el.classList.remove('hidden'); return; }
  currentTarget = null; el.classList.add('hidden');
}
function interact() {
  if (!S || !S.running || S.paused || S.ended || S.dialog) return;
  if (S.activity) { if (S.activity.cancelable) finishActivity(false); return; }
  if (!currentTarget) return;
  if (currentTarget.ev) openDialog(currentTarget.ev);
  else if (currentTarget.am && currentTarget.am.act) { SFX.click(); currentTarget.am.act(); }
}
function openDesk() {
  const ch = [], gs = dossierScore('grant'), ps = dossierScore('paper');
  const missing = DOSSIER.grant.comps.filter(c => S.dos.grant[c.id] < 2).map(c => `${c.n}（${c.src}）`);
  if (!S.submitted && S.day <= 4) ch.push(S.grant >= 100 ? (gs < BAL.grantBar && S.day < 4 ? { t: '提交基金申请书', d: `评审预估只有 ${gs} 分 · 周五前还能补`, next: 'warn' } : { t: '提交基金申请书', d: `评审预估 ${gs} 分 · 周五 23:59 截止`, run: () => ACT.submit('grant') }) : { t: `写基金申请书到 ${fmt(commitEnd())}（${Math.floor(S.grant)}%）`, d: `一整段专注时间 · 中途停下会打断专注 · 周五 23:59 截止`, run: () => ACT.write('grant') });
  if (!S.submitted && S.day <= 3 && !S.dataReq && !S.lost.includes('chen')) ch.push({ t: `请小陈整理预实验数据（信任 ${Math.round(S.trust.chen)}）`, d: S.trust.chen >= 80 ? '他会做得很漂亮，明天给你' : S.trust.chen >= 60 ? '明天给你' : '他最近和你不太亲近：会晚一天，而且只是一张表', run: () => requestData('chen') });
  if (!S.paperSubmitted) ch.push(S.paper >= 100 ? { t: '提交论文修改稿', d: `审稿预估 ${ps} 分 · 周日 23:59 截止`, run: () => ACT.submit('paper') } : { t: `改论文修改稿到 ${fmt(commitEnd())}（${Math.floor(S.paper)}%）`, d: '一整段专注时间 · 中途停下会打断专注 · 周日 23:59 截止', run: () => ACT.write('paper') });
  if (S.fin && S.v.full < 70 && S.t >= hm(11) && S.t < hm(21)) ch.push({ t: `点外卖到办公室（${fmtY(FIN.takeout)}）`, d: '不用下楼，10 分钟吃完 · 身心 −2', run: () => { finSpend(FIN.takeout, '外卖', { full: 45, wellbeing: -2 }); S.meals++; S.mealsWeek++; simulate(10); logIt(`在办公桌上吃了外卖（${fmtY(FIN.takeout)}）。`); } });
  ch.push({ t: '看看两份清单', d: '每颗星从哪里来', next: 'dos' });
  ch.push({ t: '只是坐一会儿', d: '回到楼层' });
  const starLine = (p) => DOSSIER[p].comps.map(c => `${c.n} ${STAR(S.dos[p][c.id])}`).join(' · ');
  openDialog({ id: 'desk', loc: 'desk', who: '503 · 你的办公桌', tag: '办公桌', title: '今天先做哪一件？', synthetic: true, start: 'a',
    status: [['基金申请书', S.submitted ? '已提交' : (S.day > 4 ? '已截止' : Math.floor(S.grant) + '% · 预估 ' + gs), S.submitted ? 'good' : gs >= BAL.grantBar ? 'good' : ''], ['论文修改稿', S.paperSubmitted ? '已提交' : Math.floor(S.paper) + '% · 预估 ' + ps, S.paperSubmitted ? 'good' : ps >= 55 ? 'good' : '']],
    nodes: { a: { say: [['', '桌上堆着打印出来的审稿意见、基金书草稿，还有一杯早就凉了的咖啡。'], ['', `基金：${starLine('grant')}`], ['', `论文：${starLine('paper')}`]], choices: ch },
      warn: { say: [['', `文本写完了，但评审预估只有 ${gs} 分（≥ ${BAL.grantBar} 才可能获批）。还缺：${missing.join('、')}。`], ['', '现在提交就改不了了；周五 23:59 前都可以先补齐再交。']], choices: [{ t: '先不交，补齐再说', d: '回到办公桌', next: 'a' }, { t: '就这样交了', d: '提交后不可修改', run: () => ACT.submit('grant') }] },
      dos: { say: [['', '申请书清单 · 评审看四样东西：' + DOSSIER.grant.comps.map(c => `${c.n}（${c.w}%）${STAR(S.dos.grant[c.id])}——${c.src}`).join('；')], ['', '修改稿清单：' + DOSSIER.paper.comps.map(c => `${c.n}（${c.w}%）${STAR(S.dos.paper[c.id])}——${c.src}`).join('；')], ['', '只靠埋头写，评审分到不了及格线；光有想法没有写出来也一样。']], choices: [{ t: '回到办公桌', d: '', next: 'a' }] } } });
}
function openElevator() {
  const ch = FLOOR_IDS.filter(id => id !== Z.id).map(id => ({ t: `${FLOOR_LABEL[id]} · ${ZONES[id].name.split(' · ')[1] || ZONES[id].name}`, d: `${travelMinutes(Z.id, id)} 分钟`, run: () => travel(id) }));
  if (Z.id !== 'f1') ch.unshift(ch.splice(ch.findIndex(c => c.t.startsWith('1F')), 1)[0]);
  if (S.t > hm(8, 30)) ch.push({ t: 'B1 · 停车场 · 下班回家', d: '结束今天', run: confirmHome });
  ch.push({ t: '不坐了', d: '回到楼层' });
  openDialog({ id: 'elev', loc: 'elevator', who: '物理楼电梯', tag: '电梯', title: `现在在 ${FLOOR_LABEL[Z.id]}，去几楼？`, synthetic: true, start: 'a', status: [['当前', ZONES[Z.id].name], ['时间', fmt(S.t)]],
    nodes: { a: { say: [['', '电梯门打开了。镜面里的你看起来比早上累一点。']], choices: ch } } });
}
function openRoofCafe() {
  const gain = [14, 12, 10, 8, 6][Math.min(4, S.coffees)];
  openDialog({ id: 'roofcafe', loc: 'roofcafe', who: '咖啡师 · 天台咖啡馆', tag: '天台', title: '要点什么？', synthetic: true, start: 'a', status: [['精力', Math.round(S.v.energy) + '%'], ['饱腹', Math.round(S.v.full) + '%']],
    nodes: { a: { say: [['咖啡师', '教授好，今天风不大，坐外面吧？']], choices: [
      { t: `一杯手冲，坐在天台喝完（精力 +${gain}）`, d: '15 分钟', run: () => ACT.roofcoffee(15) },
      ...companionsFor('cafe').ok.map(id => ({ t: `约${compName(id)}喝一杯（请客 ${fmtY(TABLE.treat.cafe)}）`, d: `20 分钟 · ${compPerk(id)}`, run: () => ACT.roofcoffee(20, id) })),
      { t: '三明治加一杯拿铁', d: '20 分钟', run: () => ACT.roofeat(20) },
      { t: '只是看看风景', d: '回到天台' },
    ] } } });
}
function travel(zoneId, portal, cb) {
  if (!S || S.dialog || S.ended) return;
  const from = Z.id, mins = travelMinutes(from, zoneId);
  const p = portal || (FLOOR_IDS.includes(zoneId) ? null : null);
  S.path = []; S.autoTarget = null; player.userData.state = 'idle';
  fadeTo(() => {
    setZone(zoneId);
    const sp = (p && p.spawn) || ZONES[zoneId].spawn; player.position.set(sp.x, 0, sp.z);
    if (p && p.spawn) face(player, Z.W / 2, Z.D / 2); else face(player, Z.spawn.x - 2, Z.spawn.z);
    camState.target.copy(player.position); camState.wantAz = camState.az = Math.PI / 4; questsDirty = true;
    renderNavChip();
    S.traveling = true; simulate(mins); S.traveling = false; if (S.ended) return;
    if (!S.zones[zoneId]) { S.zones[zoneId] = 1; if (Object.keys(S.zones).length >= Object.keys(ZONES).length) unlock('campus'); }
    toast(`${ZONES[zoneId].name} · ${fmt(S.t)}`);
    if (cb) cb();
  });
}
function routeTo(x, z, zoneId, ev) {
  zoneId = zoneId || 'f5';
  if (zoneId === Z.id) { S.autoRoute = null; S.autoNext = null; return walkTo(x, z, ev); }
  const hops = zoneHops(Z.id, zoneId); if (!hops || hops.length < 2) return;
  S.autoRoute = { zone: zoneId, x, z, ev }; S.autoNext = hops[1];
  const p = portalToward(Z.id, hops[1]); walkTo(p.x, p.z, null);
  toast(`前往 ${ZONES[zoneId].name}：先去${p.kind === 'elevator' ? '电梯' : '门口'}。`);
}
function continueRoute() {
  const r = S.autoRoute; if (!r) return;
  if (Z.id === r.zone) { S.autoRoute = null; S.autoNext = null; walkTo(r.x, r.z, r.ev); }
  else routeTo(r.x, r.z, r.zone, r.ev);
}
function confirmHome() {
  const late = S.t >= hm(23), low = Object.entries(S.fam).sort((a, b) => a[1] - b[1])[0];
  openDialog({
    id: 'home', loc: 'elevator', who: '电梯 · B1 停车场', tag: '下班', title: '现在就下班吗？', status: [['基金', S.submitted ? '已提交' : Math.floor(S.grant) + '%', S.submitted ? 'good' : 'bad'], ['还有待办', activeEvents().length + ' 件', activeEvents().length ? 'bad' : 'good'], ['家里', `${FAMILY[low[0]].n} ${Math.round(low[1])}`, low[1] < 40 ? 'bad' : '']],
    card: null, synthetic: true, start: 'a',
    nodes: { a: { say: [['', S.submitted ? '电梯门开了。整层楼的灯在你身后一盏盏熄灭。' : '基金还没提交。现在走，今晚就不会再回来了。'], ['', late ? '已经过了十一点，家里的灯应该都黑了。' : S.famSkip >= 2 ? `你已经 ${S.famSkip} 个晚上没在家吃饭了。` : '家里的人在等你。']], choices: [
      { t: late ? '回家 · 轻手轻脚' : '回家', d: late ? '家人都睡了，明天再说' : `今晚在家 · 身心 +${FAM_HOME_WB}`, run: goHome },
      ...(S.fin && !late && S.fin.giftWeek !== S.week ? [{ t: `回家，路上给阿玲带束花（${fmtY(FIN.gift)}）`, d: '阿玲 +4 · 每周只有第一次管用', run: () => { S.fin.giftWeek = S.week; finSpend(FIN.gift, '给阿玲的花', { partner: 4 }); goHome(); } }] : []),
      { t: '再待一会儿', d: '回到楼层' },
    ] } },
  });
}
/* v6: an evening at home. One scene, two choices, then sleep. After 23:00 the family is asleep. */
function famFx(fx) { return Object.entries(fx || {}).filter(([k]) => k in FAMILY).map(([k, d]) => `${FAMILY[k].n} ${d > 0 ? '+' : ''}${d}`).join(' · '); }
function pickHomeScene() {
  const low = Object.entries(S.fam).sort((a, b) => a[1] - b[1])[0][0], seen = S.flags.scenes || (S.flags.scenes = {});
  const pool = HOME_SCENES.filter(sc => !seen[sc.id] && sc.days.includes(S.day));
  const sc = pool.find(x => x.m === low) || pool[0] || HOME_SCENES.find(x => !seen[x.id]) || HOME_SCENES[S.day % HOME_SCENES.length];
  seen[sc.id] = 1; return sc;
}
function goHome() {
  S.path = []; S.autoTarget = null; S.atHome = true; S.homeToday = true; S.homeNights++;
  if (S.t >= hm(23)) { S.wb = clamp(S.wb + 4); logIt('回到家，灯都黑了。你在沙发上坐了一会儿。'); Object.keys(S.fam).forEach(k => { S.fam[k] = clamp(S.fam[k] - FAM_DRIFT / 2); }); return endDay('home'); }
  S.wb = clamp(S.wb + FAM_HOME_WB); logIt(`${fmt(S.t)} 回家。`);
  const sc = pickHomeScene(), open = parseLines(sc.open);
  if (S.famSkip >= 2 && sc.who) open.unshift([sc.who, S.famSkip >= 3 ? '你回来了？我以为你这周都住办公室了。' : '你上次说今天会早点回来的。']);
  openDialog({ id: 'homeScene', loc: 'elevator', who: `家 · ${fmt(S.t)}`, tag: '回家', title: sc.who ? `${sc.who}在等你` : '家里的事', synthetic: true, start: 'a', status: Object.entries(FAMILY).map(([k, f]) => [f.n, Math.round(S.fam[k]), S.fam[k] < 40 ? 'bad' : S.fam[k] >= 70 ? 'good' : '']),
    nodes: { a: { say: open, choices: sc.ch.map(([t, fx, fb]) => ({ t, d: famFx(parseFx(fx)), fx: parseFx(fx), flags: (fx.match(/@\w+/g) || []).map(f => f.slice(1)), fb: parseLines(fb), min: Math.max(10, Math.min(60, 1430 - S.t)), next: 'end' })) },
      end: { say: [['', '洗漱、关灯。明天的事明天再说。']], choices: [{ t: '睡觉 · 结束今天', d: '进入结算', run: () => endDay('home') }] } } });
}
/* Family consequences that show up at work: a partner who wants to talk, the school calling, a parents' meeting you promised. */
function familyEvents(d) {
  if (!S || !S.fam) return [];
  const F = S.flags, out = [];
  if (S.fam.partner < 40 && !F.fam_talk) out.push(Object.assign(mkC(d, '10:00', 'phone', '阿玲 · 消息', '家', '阿玲：我们得谈谈', '阿玲：你今晚能回来吗？我们得谈谈。',
    '阿玲：不是吵架。就是……我一个人撑着这个家，有点撑不住了。你今晚回不回来？', [
      ['现在就回家一趟，中午再回来', 'partner+18 wellbeing+4 energy-6 @fam_talk', 90, '你在客厅坐了一个半小时，大部分时间在听。回学校的路上，你觉得轻了一些。'],
      ['今晚一定回家，今天真的走不开', 'partner-4 @fam_talk', 5, '阿玲：好。（你知道这个“好”值多少。）'],
      ['回消息：周末再说', 'partner-14 @fam_talk', 2, '对话框里显示“已读”，然后没有然后了。'],
    ], { id: 'fam_talk_' + d, u: true, win: 120, exp: 'partner-10|阿玲的消息你一直没回。', pro: false })));
  if (S.fam.child < 40 && !F.fam_school) out.push(Object.assign(mkC(d, '14:10', 'phone', '小宇的班主任 · 电话', '家', '班主任：小宇在学校出了点事', '班主任：家长您好，小宇今天在学校……',
    '班主任：小宇今天上课一直趴着，问他说家里没人管作业。孩子情绪不太好，您能来学校一趟吗？', [
      ['现在去学校接他', 'child+16 partner+4 energy-8 @fam_school', 100, '他在校门口看到你，先是愣了一下，然后哭了。'],
      ['让阿玲去，你下班就回家', 'child+2 partner-8 @fam_school', 4, '阿玲请了半天假。她没说什么。'],
    ], { id: 'fam_school_' + d, u: true, win: 60, exp: 'child-10 partner-6|班主任的电话没接到。', pro: false })));
  if (F.pta && !F.pta_done && d === 4) out.push(Object.assign(mkC(d, '14:30', 'phone', '小宇 · 消息', '家', '小宇：家长会开始了', '小宇：爸爸妈妈你们到了吗？',
    '小宇：老师说家长会三点开始，你们在哪？我在教室门口等。', [
      ['去家长会，基金晚上再写', 'child+14 partner+8 energy-6 @pta_done', 120, '两个小时的家长会，你拍了小宇贴在墙上的画。'],
      ['发消息：今天实在去不了', 'child-14 partner-10 @pta_done', 2, '小宇回了一个“哦”。'],
    ], { id: 'fam_pta', u: true, win: 45, exp: 'child-14 partner-10|小宇等到家长会结束。', pro: false })));
  out.forEach(e => { e.state = 'pending'; });
  return out;
}

/* ---------------- dialogue ---------------- */
function speakerOf(ev) { return ev.npc ? Object.keys(SPEAKERS).find(k => SPEAKERS[k] === ev.npc) : ''; }
function bustFor(name, mood) {
  const id = SPEAKERS[name]; if (!id) return '';
  return portrait(CAST[id], mood || 'normal');
}
function showBust(name, mood) {
  const src = bustFor(name, mood); const img = $('bustImg');
  if (!src) { if (!img.getAttribute('src')) img.style.visibility = 'hidden'; return; }
  if (img.getAttribute('src') !== src) { img.src = src; img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; }
  img.style.visibility = 'visible';
}
function openDialog(ev) {
  if (S.activity && S.activity.deep && ev.id !== 'intr') breakFocus();
  document.body.classList.add('talking');
  S.path = []; S.autoTarget = null; S.dialog = { ev, node: null, turns: [], busy: false, ctl: null, typing: [] };
  $('dlg').classList.remove('hidden'); SFX.click();
  const urgent = ev.urgent || ev.alarm;
  $('dlgLoc').textContent = ev.phone ? 'CALL' : (HS[ev.loc] ? HS[ev.loc].code : '—');
  $('dlgLoc').className = urgent ? '' : 'calm';
  $('dlgTitle').textContent = ev.title;
  $('dlgWho').textContent = `${ev.tag} · ${ev.who}${ev.deadline ? ' · 最晚 ' + fmt(ev.deadline) : ''}`;
  $('dlgStatus').innerHTML = (ev.status || []).map(([k, v, c]) => `<div class="${c || ''}">${esc(k)}<b>${esc(String(v).replace('{coffee}', S.coffees))}</b></div>`).join('');
  $('dlgStatus').classList.toggle('hidden', !(ev.status || []).length);
  $('dlgLog').innerHTML = '';
  const img = $('bustImg'); img.removeAttribute('src'); img.style.visibility = 'hidden';
  const n = ev.npc && NPC[ev.npc];
  if (n) { face(n, player.position.x, player.position.z); face(player, n.position.x, n.position.z); n.userData.state = 'talk'; setEmote(n, null); if (ev.mood) setExpr(n, ev.mood); }
  if (!S.activity) player.userData.state = 'idle';
  camState.cine = n ? { x: (n.position.x + player.position.x) / 2, z: (n.position.z + player.position.z) / 2 } : { x: player.position.x, z: player.position.z };
  const first = (ev.nodes[ev.start].say || []).find(l => l[0] && SPEAKERS[l[0]]);
  showBust(first ? first[0] : speakerOf(ev), ev.mood);
  const ml = !ev.synthetic && ev.npc ? memoryLine(ev) : null;
  if (ml) { bubble(ml[0], ml[1], 'mem', true); S.dialog.memory = ml[1]; }
  gotoNode(ev.start);
}
function bubble(who, text, cls = '', typed = false) {
  const el = document.createElement('div');
  const me = who === '你';
  el.className = 'bub ' + (me ? 'me ' : '') + (!who ? 'nar ' : '') + cls;
  el.innerHTML = `<span class="w">${esc(who || '')}</span><span class="tx"></span>`;
  const tx = el.querySelector('.tx');
  $('dlgLog').appendChild(el);
  if (typed && !matchMedia('(prefers-reduced-motion:reduce)').matches) {
    let i = 0; const job = { done: false, finish() { tx.textContent = text; this.done = true; } };
    const step = () => { if (job.done) return; i = Math.min(text.length, i + 2); tx.textContent = text.slice(0, i); if (i % 6 === 0) SFX.type(); $('dlgLog').scrollTop = 1e6; if (i < text.length) setTimeout(step, 22); else job.done = true; };
    step(); if (S.dialog) S.dialog.typing.push(job);
  } else tx.textContent = text;
  if (who && SPEAKERS[who]) showBust(who, S.dialog && S.dialog.mood || (S.dialog && S.dialog.ev.mood));
  $('dlgLog').scrollTop = 1e6; return el;
}
function fxLine(list) {
  if (!list.length) return;
  const el = document.createElement('div'); el.className = 'fxline';
  el.innerHTML = list.map(([k, d]) => `<span class="${(k === 'bladder' ? d < 0 : d > 0) ? 'p' : 'm'}">${d > 0 ? '+' : ''}${d} ${FXNAME[k]}</span>`).join('');
  $('dlgLog').appendChild(el); $('dlgLog').scrollTop = 1e6;
}
function sayLines(lines) { (lines || []).forEach(([w, t, c]) => bubble(w, t, c === 'alarm' ? 'alarm' : '', !!w && w !== '你')); }
function gotoNode(key) {
  const d = S.dialog, ev = d.ev, node = ev.nodes[key]; d.node = node; d.key = key;
  sayLines(node.sayFn ? node.sayFn(S) : node.say);
  if (S.mode === 'pro' && ev.pro && ev.persona && key === ev.start && AI.ready() && !d.fallback) return renderPro();
  if (node.mini) return renderMini(node);
  renderChoices(node.choices);
}
function renderChoices(choices) {
  const f = $('dlgFoot');
  const grid = S.dialog && S.dialog.ev && S.dialog.ev.id === 'elev';   // floor buttons in two columns so all floors fit without scrolling
  f.innerHTML = `<div class="choices${grid ? ' grid2' : ''}">${choices.map((c, i) => `<button class="choice" type="button" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(c.t)}${c.d ? `<small>${esc(c.d)}</small>` : ''}</span><span class="t">${c.min ? c.min + ' 分' : ''}</span></button>`).join('')}</div>`;
  f.querySelectorAll('.choice').forEach(b => { b.onclick = () => pick(choices[+b.dataset.i]); b.onmouseenter = SFX.click; });
  S.dialog.choices = choices;
}
function pick(c) {
  const d = S.dialog; if (!d || d.busy) return;
  d.typing.forEach(j => j.finish()); d.choices = null;
  if (c.home) { closeDialog(); return endDay('home'); }
  if (c.run) { closeDialog(); return c.run(); }
  if (d.ev.synthetic && !c.next) { closeDialog(); return; }
  bubble('你', c.t);
  d.picked = c;
  if (c.flag) S.flags[c.flag] = 1;
  (c.flags || []).forEach(f => { S.flags[f] = 1; if (FLAG_STARS[f]) addStar(...FLAG_STARS[f]); if (f === 'data_in' && d.ev.dataStars) { addStar('grant', 'data', d.ev.dataStars); if (S.dataReq) S.dataReq.done = true; } });
  if (c.fx && c.fx.trust && d.ev.npc && S.trust[d.ev.npc] !== undefined) S.trust[d.ev.npc] = clamp(S.trust[d.ev.npc] + trustGain(c.fx.trust));
  if ((c.flags || []).includes('lose') && d.ev.crisisOf) loseStudent(d.ev.crisisOf);
  if ((c.flags || []).some(f => f.startsWith('kept_')) && d.ev.crisisOf) delete S.crisis[d.ev.crisisOf];
  if (c.fx) { const s = Object.values(c.fx).reduce((a, b) => a + b, 0); d.mood = s >= 0 ? 'happy' : 'worried'; const n = d.ev.npc && NPC[d.ev.npc]; if (n) setExpr(n, d.mood); }
  applyFx.label = shortTitle(d.ev.title); fxLine(applyFx(c.fx)); applyFx.label = null;
  (c.flags || []).filter(f => f.startsWith('fin_')).forEach(finFlag);
  sayLines(c.fb);
  if (c.ach) unlock(c.ach);
  if (d.ev.table) { const tl = S.tableLog[S.tableLog.length - 1]; if (tl && tl.id === d.ev.id) tl.said = c.t; }
  if (c.fx) { const s = Object.values(c.fx).reduce((a, b) => a + b, 0); (s >= 0 ? SFX.good : SFX.bad)(); }
  logIt(`${d.ev.title} → ${c.t}`);
  if (c.min) simulate(c.min);
  if (S.ended) return;
  if (c.next) gotoNode(c.next); else resolve(c.after);
}
function resolve(after) {
  const d = S.dialog, ev = d.ev;
  if (ev.table) { const fx = (d.picked && d.picked.fx) || {}; remember(ev, (fx.trust || 0) >= 0 ? 'good' : 'bad'); }   // v12.2: a table talk is judged by how the person took it; its trust is already in the choice
  else if (ev.npc && !ev.synthetic && !ev.crisisOf) {
    const fx = (d.picked && d.picked.fx) || {}, sum = Object.entries(fx).filter(([k]) => k !== 'trust').reduce((a, [, b]) => a + b, 0);
    remember(ev, sum >= 0 && (fx.team || 0) >= 0 ? 'good' : 'bad');
    if (S.trust[ev.npc] !== undefined) { const dt = Math.max(-10, Math.min(8, Math.round((fx.team || 0) * 1.1 + (sum >= 0 ? 1 : -3)))); S.trust[ev.npc] = clamp(S.trust[ev.npc] + (dt > 0 ? trustGain(dt) : dt)); }
  }
  if (ev.crisisOf && d.picked && !d.picked.t) { // Pro-mode crisis: judge by the AI's verdict
    const sum = Object.values(d.picked.fx || {}).reduce((a, b) => a + b, 0);
    if (sum >= 3) { S.trust[ev.crisisOf] = clamp(S.trust[ev.crisisOf] + 30); delete S.crisis[ev.crisisOf]; } else if (sum < 0) loseStudent(ev.crisisOf);
  }
  ev.state = 'resolved'; settleEvent(ev); questsDirty = true; gainXP(ev.phone ? 20 : 50);
  if (/^adm_/.test(ev.id)) S.adminDone = (S.adminDone || 0) + 1;
  if (ev.card && CARDS[ev.card] && !S.cards.includes(ev.card)) {
    S.cards.push(ev.card); gainXP(15);
    const c = CARDS[ev.card];
    const el = document.createElement('div'); el.className = 'card';
    el.innerHTML = `<div class="eyebrow">${S.cards.length} / ${Object.keys(CARDS).length}</div><h4>${esc(c.t)}</h4><p>${esc(c.b)}</p>`;
    $('dlgLog').appendChild(el); setTimeout(() => { $('dlgLog').scrollTop = 1e6; }, 30);
  }
  d.after = after;
  $('dlgFoot').innerHTML = `<div style="font-size:12px;color:var(--muted);margin-bottom:10px">${fmt(S.t)} · ${after ? '接下来：' + ({ lecture: '上课 ' + after.min + ' 分钟', meeting: '开会 ' + after.min + ' 分钟', multitask: '边开会边写基金' }[after.type]) : '处理完毕 · 获得经验'}</div><button class="btn gold" type="button" id="dlgDone">${after ? '开始' : '完成 · 回到楼层'} <span class="key" style="border-color:rgba(0,0,0,.4);color:#1a1205">Enter</span></button>`;
  $('dlgDone').onclick = closeDialog;
  $('dlgDone').focus({ preventScroll: true });
}
function closeDialog() {
  const d = S.dialog; if (!d) return;
  if (d.ctl) d.ctl.abort();
  if (d.mini && d.mini.stop) d.mini.stop();
  d.typing.forEach(j => j.finish());
  const n = d.ev.npc && NPC[d.ev.npc];
  if (n && d.ev.state === 'active') n.userData.state = (d.ev.urgent || d.ev.alarm) ? 'panic' : (n.userData.baseState || 'idle');
  S.dialog = null; camState.cine = null; document.body.classList.remove('talking'); $('dlg').classList.add('hidden'); $('dlgFoot').innerHTML = '';
  if (d.after) ACT[d.after.type](d.after.min);
}

/* ---------------- mini games ---------------- */
function renderMini(node) {
  const f = $('dlgFoot');
  const done = (r) => { if (!S.dialog) return; S.dialog.mini = null; const o = node.onMini(r); fxLine(applyFx(o.fx)); sayLines(o.fb); SFX.good(); gainXP(30);
    if (r.chi !== undefined && r.chi < 1.15) unlock('fit'); if (r.right === 3) unlock('lecture');
    if (node.mini === 'fit' && r.chi < 1.4 && !S.flags.fit_ok) { S.flags.fit_ok = 1; addStar(...FLAG_STARS.fit_ok); applyFx({ paper: 5 }); bubble('', '这张拟合图可以直接放进论文修改稿（论文 +5）。'); }
    if (node.mini === 'quiz' && r.right >= 2) S.flags.lecture_star = 1;
    logIt(`${S.dialog.ev.title} → 小游戏完成`); if (o.min) simulate(o.min); if (S.ended) return; if (o.next) gotoNode(o.next); else resolve(o.after); };
  if (SIM) return done(window.__simMini ? window.__simMini(node.mini) : { chi: 1.3, tau: 2.2, right: 2, acc: 0.75 });
  if (node.mini === 'fit') S.dialog.mini = miniFit(f, done);
  if (node.mini === 'rhythm') S.dialog.mini = miniRhythm(f, done);
  if (node.mini === 'quiz') S.dialog.mini = miniQuiz(f, done);
}
function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function gaussR(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function miniFit(f, done) {
  const NB = 20, BW = 0.5, TAU = 2.197, Btrue = 18; let data;
  const centers = Array.from({ length: NB }, (_, i) => (i + 0.5) * BW);
  const model = (tau, B, d) => { const e = centers.map(t => Math.exp(-t / tau)); const se = e.reduce((a, b) => a + b, 0); const sd = d.reduce((a, b) => a + b, 0); const A = Math.max(0, (sd - NB * B) / se); return e.map(x => A * x + B); };
  const chi = (tau, B, d) => { const m = model(tau, B, d); return m.reduce((s, mi, i) => s + (d[i] - mi) ** 2 / Math.max(mi, 1), 0) / (NB - 3); };
  for (let tries = 0; tries < 30; tries++) {
    const r = rng(1234 + tries * 97);
    data = centers.map(t => { const mu = 1250 * Math.exp(-t / TAU) + Btrue; return Math.max(0, Math.round(mu + gaussR(r) * Math.sqrt(mu))); });
    let best = 9; for (let tau = 1.8; tau < 2.6; tau += 0.01) for (let B = 8; B < 30; B += 0.5) best = Math.min(best, chi(tau, B, data));
    if (best < 1.15) break;
  }
  f.innerHTML = `<div class="mini"><canvas id="fitCv" width="460" height="200"></canvas>
    <div class="slider"><label for="sTau">寿命 τ</label><input id="sTau" type="range" min="0.8" max="5" step="0.005" value="3.8"><b id="vTau">3.800 μs</b></div>
    <div class="slider"><label for="sB">本底 B</label><input id="sB" type="range" min="0" max="60" step="0.5" value="0"><b id="vB">0.0</b></div>
    <div class="row" style="justify-content:space-between;width:100%"><span id="chiOut">χ²/ndf = —</span><button class="btn gold" type="button" id="fitOk">就是这个结果</button></div></div>`;
  const cv = $('fitCv'), g = cv.getContext('2d');
  const draw = () => {
    const tau = +$('sTau').value, B = +$('sB').value, m = model(tau, B, data), c = chi(tau, B, data);
    $('vTau').textContent = tau.toFixed(3) + ' μs'; $('vB').textContent = B.toFixed(1);
    const co = $('chiOut'); co.textContent = `χ²/ndf = ${c.toFixed(2)}`; co.style.color = c < 1.4 ? 'var(--ok)' : c < 3 ? 'var(--warn)' : 'var(--danger)';
    const W2 = cv.width, H2 = cv.height, L = 44, R = 12, Tp = 12, Bm = 28;
    g.fillStyle = '#04131f'; g.fillRect(0, 0, W2, H2);
    const ymin = Math.log10(5), ymax = Math.log10(2000);
    const X = (t) => L + t / (NB * BW) * (W2 - L - R), Y = (v) => Tp + (1 - (Math.log10(Math.max(v, 5)) - ymin) / (ymax - ymin)) * (H2 - Tp - Bm);
    g.strokeStyle = 'rgba(205,238,255,.12)'; g.lineWidth = 1; g.font = '11px JetBrains Mono, monospace'; g.fillStyle = '#8AA3B5';
    [10, 100, 1000].forEach(v => { g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(W2 - R, Y(v)); g.stroke(); g.fillText(String(v), 6, Y(v) + 4); });
    for (let t = 0; t <= 8; t += 2) g.fillText(t + '', X(t) - 4, H2 - 10);
    g.fillText('t / μs', W2 - 48, H2 - 10);
    g.strokeStyle = '#FFC857'; g.lineWidth = 2.5; g.shadowColor = '#FFC857'; g.shadowBlur = 8; g.beginPath();
    m.forEach((v, i) => { const x = X(centers[i]); i ? g.lineTo(x, Y(v)) : g.moveTo(x, Y(v)); }); g.stroke(); g.shadowBlur = 0;
    data.forEach((v, i) => { const x = X(centers[i]); g.strokeStyle = '#00A9F4'; g.beginPath(); g.moveTo(x, Y(v + Math.sqrt(v))); g.lineTo(x, Y(Math.max(5, v - Math.sqrt(v)))); g.stroke(); g.fillStyle = '#CDEEFF'; g.beginPath(); g.arc(x, Y(v), 3, 0, 7); g.fill(); });
  };
  $('sTau').oninput = draw; $('sB').oninput = draw; draw();
  $('fitOk').onclick = () => done({ tau: +$('sTau').value, chi: chi(+$('sTau').value, +$('sB').value, data) });
  return { stop() {} };
}
function miniRhythm(f, done) {
  const STEPS = 8; let hits = 0, presses = 0, phase = 0, raf = 0, last = performance.now(), flash = 0, flashGood = true, ended = false;
  f.innerHTML = `<div class="mini"><canvas id="rhCv" width="220" height="220"></canvas>
    <div><span class="mono" id="hvOut" style="font-size:22px;font-weight:700;color:var(--danger)">1650 V</span> · <span id="rhCount">0 / ${STEPS}</span> 档</div>
    <button class="btn gold" type="button" id="rhBtn" style="min-width:170px">降一档 <span class="key" style="border-color:rgba(0,0,0,.4);color:#1a1205">C</span></button></div>`;
  const cv = $('rhCv'), g = cv.getContext('2d');
  const radius = () => 102 - phase * 80;
  const press = () => {
    if (ended) return;
    const r = radius(), good = Math.abs(r - 48) < 10;
    presses++; if (good) hits++; flash = 1; flashGood = good; (good ? SFX.tick : SFX.bad)(); phase = 0;
    const hv = Math.max(0, Math.round(1650 * (1 - presses / STEPS)));
    $('hvOut').textContent = hv + ' V'; $('hvOut').style.color = hv > 800 ? 'var(--danger)' : hv > 0 ? 'var(--warn)' : 'var(--ok)';
    $('rhCount').textContent = `${presses} / ${STEPS}`;
    if (!good) burst(26, 1.2, 4.6, [2.2, 1.2, 0.3], 14, 2);
    if (presses >= STEPS) { ended = true; cancelAnimationFrame(raf); setTimeout(() => done({ acc: hits / STEPS }), 450); }
  };
  const loop = (now) => {
    const dt = (now - last) / 1000; last = now; phase += dt / 1.15; if (phase > 1) phase = 0;
    flash = Math.max(0, flash - dt * 3);
    g.fillStyle = '#04131f'; g.fillRect(0, 0, 220, 220);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.beginPath(); g.arc(110, 110, 48, 0, 7); g.stroke();
    g.fillStyle = flash ? (flashGood ? `rgba(61,220,151,${flash * .6})` : `rgba(255,90,110,${flash * .6})`) : 'rgba(255,90,110,.16)';
    g.beginPath(); g.arc(110, 110, 42, 0, 7); g.fill();
    const r = radius(), ok = Math.abs(r - 48) < 10; g.strokeStyle = ok ? '#3DDC97' : '#FFC857'; g.shadowColor = g.strokeStyle; g.shadowBlur = 14; g.lineWidth = 4; g.beginPath(); g.arc(110, 110, r, 0, 7); g.stroke(); g.shadowBlur = 0;
    g.fillStyle = '#EAF4FB'; g.font = '700 14px Inter, sans-serif'; g.textAlign = 'center'; g.fillText(hits + ' 次平稳', 110, 115);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  $('rhBtn').onclick = press;
  return { press, stop() { ended = true; cancelAnimationFrame(raf); } };
}
function miniQuiz(f, done) {
  const qs = QUIZ.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  let i = 0, right = 0, timer = 0, left = 12, locked = false;
  const show = () => {
    const q = qs[i]; locked = false; left = 12; drawSlide(i + 1);
    f.innerHTML = `<div class="mini" style="align-items:stretch;text-align:left"><div class="row" style="justify-content:space-between"><span class="eyebrow">抢答 ${i + 1} / 3</span><span class="mono" id="qLeft">12 s</span></div>
      <div class="qtimer"><i id="qBar" style="width:100%"></i></div>
      <div style="font-size:14px;font-weight:600;line-height:1.5">${esc(q.q)}</div>
      <div class="qopts">${q.o.map((o, k) => `<button type="button" data-k="${k}">${'ABCD'[k]}. ${esc(o)}</button>`).join('')}</div></div>`;
    f.querySelectorAll('.qopts button').forEach(b => b.onclick = () => answer(+b.dataset.k));
    clearInterval(timer);
    timer = setInterval(() => { left -= 0.1; const bar = $('qBar'); if (bar) bar.style.width = Math.max(0, left / 12 * 100) + '%'; const ql = $('qLeft'); if (ql) ql.textContent = Math.max(0, Math.ceil(left)) + ' s'; if (left <= 0) answer(-1); }, 100);
  };
  const answer = (k) => {
    if (locked) return; locked = true; clearInterval(timer);
    const q = qs[i], btns = f.querySelectorAll('.qopts button');
    btns.forEach((b, j) => { if (j === q.a) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); });
    if (k === q.a) { right++; SFX.good(); crowd.children.forEach(c => { if (Math.random() < 0.4) { c.userData.state = 'talk'; setExpr(c, 'happy'); } }); setTimeout(() => crowd.children.forEach(c => { c.userData.state = 'sit'; setExpr(c, 'normal'); }), 1400); } else SFX.bad();
    setTimeout(() => { i++; if (i < qs.length) show(); else done({ right }); }, 1000);
  };
  show();
  return { answer, stop() { clearInterval(timer); } };
}

/* ---------------- Pro mode: Claude plays the character ---------------- */
function renderPro() {
  const d = S.dialog;
  $('dlgFoot').innerHTML = `<div class="proBox"><label for="proIn" style="font-size:11px;color:var(--muted)">用你自己的话回应 · Claude 扮演对方 · 第 ${d.turns.length / 2 + 1} / 4 轮</label>
    <textarea id="proIn" placeholder="例如：先别急，我们一起看看……"></textarea>
    <div class="row" style="justify-content:space-between;margin-top:8px"><button class="link" type="button" id="proFallback">改用选项回答</button><button class="btn gold" type="button" id="proSend">发送 <span class="key" style="border-color:rgba(0,0,0,.4);color:#1a1205">Ctrl+Enter</span></button></div></div>`;
  const ta = $('proIn'); ta.focus({ preventScroll: true });
  ta.onkeydown = (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); proSend(); } e.stopPropagation(); };
  $('proSend').onclick = proSend;
  $('proFallback').onclick = () => { d.fallback = true; renderChoices(d.ev.nodes[d.ev.start].choices); };
}
async function proSend() {
  const d = S.dialog; if (!d || d.busy) return;
  const text = ($('proIn').value || '').trim(); if (!text) return;
  const ev = d.ev; bubble('你', text); d.turns.push({ who: '教授', text });
  d.busy = true; $('proSend').disabled = true;
  const name = ev.who.split(' · ')[0];
  const ph = bubble(name, '……（思考中）');
  const history = d.turns.map(x => `${x.who}：${x.text}`).join('\n');
  const opening = (ev.nodes[ev.start].say || []).filter(l => l[0]).map(l => `${l[0]}：${l[1]}`).join('\n');
  const round = d.turns.filter(x => x.who === '教授').length;
  const prompt = `你在一款中文教育游戏《导师的一周》中扮演一个角色，玩家扮演一位物理系教授。
角色：${ev.persona}
情境：${ev.scene}${ev.npc && S.trust[ev.npc] !== undefined ? `
你对教授的信任：${Math.round(S.trust[ev.npc])}/100（低于 40 时语气更疏远、更防备；高于 75 时更坦诚）。` : ''}${ev.npc && memorySummary(ev.npc) ? `
你和教授这周的过往：${memorySummary(ev.npc)}。可以自然地提一句，但不要反复纠缠。` : ''}
评分重点：${ev.rubric}
规则：用角色的口吻、简体中文口语回复教授最新的一句话，不超过 70 字；不要替教授说话，不要跳出角色，不要提到游戏或 AI。
如果问题已经被妥善处理、对话自然结束，或这已是第 4 轮（现在是第 ${round} 轮），则 done=true，并给出 fx 和 comment。
只回复一个 JSON 对象，格式：
{"reply":"角色的回复","mood":"normal|happy|worried|shock","done":false,"fx":{"research":0,"teaching":0,"team":0,"rep":0,"safety":0,"integrity":0},"comment":""}
mood 是角色此刻的表情；fx 每项是 -10 到 10 的整数，只在 done=true 时给出非零值；comment 在 done=true 时用一句话（不超过 40 字）点评教授的处理，否则为空字符串。

开场：
${opening}

对话记录：
${history}`;
  d.ctl = new AbortController();
  try {
    const r = await AI.json(prompt, d.ctl.signal);
    if (S.dialog !== d) return;
    const reply = String((r && r.reply) || '……').slice(0, 200);
    const mood = ['normal', 'happy', 'worried', 'shock'].includes(r && r.mood) ? r.mood : 'normal';
    d.mood = mood; ph.remove(); bubble(name, reply, '', true);
    if (ev.npc && NPC[ev.npc]) setExpr(NPC[ev.npc], mood);
    d.turns.push({ who: name, text: reply });
    simulate(4);
    if (S.ended) return;
    if ((r && r.done) || round >= 4) {
      const fx = {}; for (const [k, v] of Object.entries((r && r.fx) || {})) if (k in S.k) fx[k] = Math.max(-10, Math.min(10, Math.round(+v || 0)));
      fxLine(applyFx(fx)); d.picked = { fx };
      if (r && r.comment) bubble('', '点评：' + String(r.comment).slice(0, 120));
      logIt(`${ev.title} → 开放式对话 ${round} 轮`);
      d.busy = false; return resolve(null);
    }
    d.busy = false; renderPro();
  } catch (e) {
    if (S.dialog !== d) return;
    d.busy = false;
    if (e && e.code === 'cancelled') return;
    ph.remove();
    bubble('', e && (e.code === 'not_granted' || e.code === 'sampling_disabled') ? '没有获得调用 Claude 的权限，这一段改用选项。' : e && e.code === 'auth' ? 'API Key 无效或没有权限，请在「AI 设置」里检查。这一段改用选项。' : e && e.code === 'rate_limited' ? 'AI 现在有点忙（请求太频繁或额度用完），这一段先用选项吧。' : `对话中断了（${(e && e.message) || '未知错误'}），这一段改用选项。`);
    d.fallback = true; renderChoices(ev.nodes[ev.start].choices);
  }
}

