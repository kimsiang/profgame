/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   v9 DATA — "Money" / 钱：工资、房贷与时间
   One game week = one financial month. Money only matters where it buys time or family meters,
   or costs time to earn. Amounts in yuan. These tables are content; the ledger below only reads them.
   ========================================================= */
const FIN = {
  // Net = gross − 17.5% personal 社保+公积金 (base capped ¥36,921) − 个税. gjj = both sides of 公积金, mortgage only.
  salary: [
    { gross: 300000, net: 18910, gjj: 3500 },   // 助理教授
    { gross: 350000, net: 21660, gjj: 4100 },   // 副教授
    { gross: 400000, net: 24410, gjj: 4700 },   // 教授
    { gross: 450000, net: 27190, gjj: 5200 },   // 特聘教授
    { gross: 500000, net: 30310, gjj: 5200 },   // 讲席教授
  ],
  post: { vice_dean: 3000, dean: 6000 },        // deliberately small: nobody becomes dean for the money
  partner: 12000,                               // 阿玲's take-home
  bonusEvery: 4, bonusMax: 30000,               // 绩效奖, from the week's KPI average
  settle: 500000,                               // 特聘教授 安家费, once — a housing subsidy: it prepays the mortgage (renters: kept for the down payment)
  fixed: [['living', '家用（吃饭、水电、话费）', 8000], ['school', '小宇的学校', 3000], ['parents', '给父母', 2000]],
  tutor: 2500, help: 2500,                      // 补习班 / 请阿姨, monthly toggles
  savings: 80000,
  mortgage: { price: 5000000, loan: 3500000, rate: 0.031, months: 360 },
  car: { price: 200000, loan: 150000, rate: 0.035, months: 36, dep: 0.015 },   // a ¥20万 car on a ¥15万 loan; resale loses ~1.5% a month
  rent: { amount: 4500, lease: 12, rise: 0.15, down: 1500000 },
  credit: 50000,                                // 信用卡 + 借呗: below −¥5万 the mortgage bounces
  bankLine: -30000, debtRate: 0.01,             // interest per month on a negative balance
  fund: { start: 300000, stipends: 15000, award: 400000 },   // 课题经费: pays 劳务费, never the mortgage
  taxi: 120, takeout: 45, gift: 300,
  metroLate: 20,                                // minutes later to the office by metro (but you read)
  audit: 0.15,
};
// Monthly payment of an amortised loan.
const pmt = (P, rate, n) => { const r = rate / 12; return r ? P * r / (1 - Math.pow(1 + r, -n)) : P / n; };
const fmtY = (n) => { n = Math.round(n); const a = Math.abs(n), s = n < 0 ? '−' : ''; return a >= 10000 ? `${s}¥${(a / 10000).toFixed(a >= 1e6 ? 0 : 1)}万` : `${s}¥${a.toLocaleString('zh-CN')}`; };
// Seeded, but hashed first: Park–Miller's first draw moves almost linearly with the seed, so week-by-week seeds would correlate.
function finRng(n) { let h = Math.imul((n >>> 0) ^ 0x9e3779b9, 2654435761) >>> 0; h = (h ^ (h >>> 16)) >>> 0; h = Math.imul(h, 2246822507) >>> 0; h = (h ^ (h >>> 13)) >>> 0; const r = rng(h % 2147483646 + 1); r(); r(); return r; }
function newLoan(o) { return { bal: o.loan, rate: o.rate, left: o.months, pay: Math.round(pmt(o.loan, o.rate, o.months)) }; }
function freshFin(house = 'buy', commute = 'car') {
  return { fv: 1, house, commute, cash: FIN.savings, fund: FIN.fund.start,
    mortgage: house === 'buy' ? newLoan(FIN.mortgage) : null, car: commute === 'car' ? newLoan(FIN.car) : null,
    rent: house === 'rent' ? { amount: FIN.rent.amount, until: 1 + FIN.rent.lease } : null,
    help: false, tutor: false, settled: false, missed: 0, reimb: [], consult: 0, bookDone: false, metroReads: 0,
    next: {}, wk: { earn: 0, spend: 0, items: [] }, log: [] };
}

/* Money events. Same shape as C(): [text, fx, minutes, feedback]. fx "cash±n" moves your own money; @fin_* flags
   are read by finFlag(). Every income costs time; every saving costs a meter or a risk. */
const FIN_EVENTS = {};   // v12.1: filled from assets/data/content by loadContent()

/* ---------------- v9: money logic ---------------- */
// Week's cash movement from events, gifts and daily spends, so the statement can say where it went.
function finMove(d, label) {
  const F = S && S.fin; if (!F || !d) return;
  F.cash += d; if (d > 0) F.wk.earn += d; else F.wk.spend -= d;
  if (label) F.wk.items.push([label, d]);
}
function finSpend(n, label, fx) {
  finMove(-n, label); toast(`${label} ${fmtY(-n)} · 余额 ${fmtY(S.fin.cash)}`, S.fin.cash < 0 ? 'bad' : '');
  if (fx) applyFx(fx); SFX.click(); renderMoney();
}
// @fin_* flags from choices. They act on the ledger and are removed so they never gate other events.
function finFlag(f) {
  const F = S.fin; delete S.flags[f];
  if (f === 'fin_consult') { F.consult = S.week; F.consultHalf = false; F.log.push([S.week, '接了一个横向课题']); }
  else if (f === 'fin_consult_half') F.consultHalf = true;
  else if (f === 'fin_reimb') F.reimb.push({ week: S.week, amt: 800 });
  else if (f === 'fin_book') F.bookDone = true;
  else if (f === 'fin_sellcar' && F.car) { const value = FIN.car.price * Math.pow(1 - FIN.car.dep, FIN.car.months - F.car.left), gain = value - F.car.bal; F.car = null; F.commute = 'metro'; finMove(Math.round(gain), '卖车（还清车贷后）'); F.log.push([S.week, '卖了车']); }
  else if (f === 'fin_buy') {
    const down = FIN.rent.down, hf = Math.min(down, F.houseFund || 0), own = Math.max(0, Math.min(F.cash - 20000, down - hf)), parents = down - hf - own;
    F.houseFund = (F.houseFund || 0) - hf; finMove(-own, '首付（自己）'); F.rent = null; F.house = 'buy'; F.mortgage = newLoan(FIN.mortgage);
    if (parents > 0) { applyFx({ partner: -8, wellbeing: -4 }); F.log.push([S.week, `买房，父母支援首付 ${fmtY(parents)}`]); } else F.log.push([S.week, '买房']);
  } else if (f === 'fin_renew') { F.rent.amount = Math.round(F.rent.amount * (1 + FIN.rent.rise)); F.rent.until = S.week + FIN.rent.lease; }
}
// Events money brings into a day. Seeded by week and day so a reload cannot reroll them.
function financeEvents(d) {
  if (typeof S === 'undefined' || !S || !S.fin) return [];
  const F = S.fin, c = S.career, out = [], R = finRng(S.week * 6151 + 29);
  const add = (e, id, extra = {}) => { const ev = mkC(d, e.time, e.loc, e.who, e.tag, e.title, e.line, e.open, e.ch, Object.assign({ id, win: e.loc === 'phone' ? 90 : 120, pro: false }, extra)); ev.state = 'pending'; out.push(ev); };
  const E = FIN_EVENTS, nx = F.next || {};
  if (d === 0 && nx.forced) add(F.car ? E.forced : E.forcedNoCar, 'fin_forced', { u: true, win: 240, exp: 'partner-10|阿玲的消息你一直没回。' });
  else if (d === 0 && nx.bank) add(E.bank, 'fin_bank', { u: true, win: 60, exp: 'partner-8|银行的电话没接。阿玲替你接了。' });
  if (d === 0 && nx.stipend) add(E.stipend, 'fin_stipend', { win: 240, exp: 'team-10|劳务费停发了，学生们是从财务那里知道的。' });
  if (d === 0 && nx.lease) add(E.lease, 'fin_lease', { win: 600, exp: '|物业按续租处理了。' });
  const rolls = [R(), R(), R(), R(), R(), R()];
  if (d === 0 && !nx.forced && F.consult !== S.week && rolls[0] < 0.45) add(E.consultOffer, 'fin_consultOffer');
  if (d === E.consultMeet.day && F.consult === S.week) add(E.consultMeet, 'fin_consultMeet', { u: true, win: 30, exp: 'rep-1|企业周会你没出现。顾问费减半。' });
  if (d === E.consultCoi.day && F.consult === S.week && c.post) add(E.consultCoi, 'fin_coi');
  if (d === E.review.day && rolls[1] < 0.6) add(E.review, 'fin_review', { win: 25 });
  if (d === E.talk.day && rolls[2] < 0.55) add(E.talk, 'fin_talk');
  if (d === E.book.day && !F.bookDone && c.rank >= 1 && rolls[3] < 0.5) add(E.book, 'fin_book', { win: 300 });
  if (d === E.reimb.day && rolls[4] < 0.5) add(E.reimb, 'fin_reimb');
  // One household shock in most months, from those that fit this household.
  const pool = E.shocks.filter(x => x.need === 'any' || (x.need === 'car' && F.car) || (x.need === 'rent' && F.rent));
  const sh = rolls[5] < 0.75 ? pool[Math.floor(R() * pool.length)] : null;
  if (sh && sh.day === d) add(sh, 'fin_shock_' + sh.id, { win: 180, exp: 'house-4|' + sh.title + '：拖着没处理。' });
  return out;
}
// The monthly statement, run at Sunday 23:59. Mutates S.fin and returns the lines the end screen shows.
// ctx: rank and post held during the week, KPI average, whether this week's grant was funded.
function finSettle(ctx) {
  const F = S.fin, L = [], add = (t, v, note = '') => { L.push([t, v, note]); return v; };
  const sal = FIN.salary[ctx.rank] || FIN.salary[0];
  let cash = F.cash;
  const wkSpend = F.wk.spend, wkEarn = F.wk.earn;
  add(`工资（${RANKS[ctx.rank].n}，年薪 ${fmtY(sal.gross)}，到手）`, sal.net);
  if (ctx.post) add(`${POSTS[ctx.post].n}岗位津贴`, FIN.post[ctx.post]);
  add('阿玲的工资', FIN.partner);
  if (S.week % FIN.bonusEvery === 0) add('季度绩效奖', Math.round(clamp((ctx.avg - 50) / 40, 0, 1) * FIN.bonusMax / 500) * 500, `本周表现平均 ${Math.round(ctx.avg)}`);
  if (F.consult === S.week) add(F.consultHalf ? '横向课题顾问费（缺席周会，减半）' : '横向课题顾问费', F.consultHalf ? 10000 : 20000);
  let inflow = L.reduce((a, x) => a + x[1], 0);
  if (ctx.settle) {
    if (F.mortgage) { const M = F.mortgage, cut = Math.min(M.bal, FIN.settle), was = M.pay; M.bal -= cut; M.pay = Math.round(pmt(M.bal, M.rate, M.left)); L.push(['特聘教授安家费：只能用于住房，提前还房贷', 0, `还掉 ${fmtY(cut)}，月供从 ${fmtY(was)} 降到 ${fmtY(M.pay)}`]); }
    else { F.houseFund = (F.houseFund || 0) + FIN.settle; L.push(['特聘教授安家费：只能用于住房，存作首付', 0, `${fmtY(FIN.settle)}，买房时先用这笔`]); }
    F.log.push([S.week, '拿到安家费']);
  }
  cash += inflow;
  if (wkEarn) L.push(['本周外快（评审、讲座、稿费……）', wkEarn, '已经到账']);
  // Outgoings. The mortgage goes last: if the card is maxed it is the one that bounces.
  const out = [];
  const pay = (t, v, note = '') => { out.push([t, -v, note]); cash -= v; return v; };
  FIN.fixed.forEach(([, t, v]) => pay(t, v));
  if (F.tutor) pay('补习班', FIN.tutor);
  if (F.help) pay('阿姨（每周三次）', FIN.help);
  if (F.rent) pay('人才公寓房租', F.rent.amount);
  if (F.car) { const it = F.car.bal * F.car.rate / 12; pay(`车贷（还剩 ${F.car.left} 期）`, F.car.pay); F.car.bal = Math.max(0, F.car.bal - (F.car.pay - it)); F.car.left--; if (F.car.left <= 0) { F.car = null; F.log.push([S.week, '最后一期车贷']); out.push(['车贷还清了！', 0, '']); if (typeof unlock === 'function') unlock('carfree'); } }
  let missed = false;
  if (F.mortgage) {
    const M = F.mortgage, own = M.pay - Math.min(M.pay, sal.gjj);
    if (cash - own < -FIN.credit) { missed = true; out.push(['房贷：扣款失败', 0, `需要 ${fmtY(own)}，信用卡也刷不出来了`]); }
    else { const it = M.bal * M.rate / 12; pay('房贷（公积金之外的部分）', own, `月供 ${fmtY(M.pay)}，公积金抵 ${fmtY(Math.min(M.pay, sal.gjj))}`); M.bal = Math.max(0, M.bal - (M.pay - it)); M.left--; }
  }
  if (cash < 0) pay('信用卡与借呗利息', Math.round(-cash * FIN.debtRate));
  // Grant money: a separate wallet. It pays stipends and can never touch the mortgage.
  if (ctx.grantOk) { F.fund += FIN.fund.award; out.push(['课题经费：新基金拨款到账', 0, `+${fmtY(FIN.fund.award)}（只能用于科研）`]); }
  let stipendGap = false;
  if (F.fund >= FIN.fund.stipends) F.fund -= FIN.fund.stipends; else stipendGap = true;
  // Audit: each dinner booked to the grant may surface later. 15% a month, gone after six months.
  const aud = [];
  F.reimb = F.reimb.filter(r => { if (r.week === S.week) return true; if (finRng(r.week * 389 + S.week * 7 + 1)() < FIN.audit) { aud.push(r); return false; } return S.week - r.week < 6; });
  aud.forEach(r => { pay(`审计：第 ${r.week} 周的“会议餐费”退回并罚款`, r.amt * 2, '诚信 −8'); S.k.integrity = clamp(S.k.integrity - 8); });
  // Next week's consequences.
  F.missed = missed ? F.missed + 1 : 0;
  F.next = { bank: missed || cash < FIN.bankLine, forced: F.missed >= 2, stipend: stipendGap, lease: !!(F.rent && S.week + 1 >= F.rent.until) };
  const net = Math.round(cash - F.cash + wkEarn - wkSpend);   // the whole month, including what moved during the week
  F.cash = Math.round(cash); F.lastNet = net;
  F.wk = { earn: 0, spend: 0, items: [] }; F.consultHalf = false;
  return { inc: L, out, wkSpend, net, missed, aud: aud.length, stipendGap };
}
function finStatementHTML(st) {
  const F = S.fin, row = ([t, v, n]) => `<tr><td>${esc(t)}${n ? `<br><span class="note">${esc(n)}</span>` : ''}</td><td class="${v > 0 ? 'p' : v < 0 ? 'm' : ''}">${v ? (v > 0 ? '+' : '') + fmtY(v).replace('−', '−') : ''}</td></tr>`;
  const debts = [F.mortgage && `房贷还剩 ${fmtY(F.mortgage.bal)}（${F.mortgage.left} 期）`, F.car && `车贷还剩 ${fmtY(F.car.bal)}（${F.car.left} 期）`, F.rent && `人才公寓租到第 ${F.rent.until} 周`].filter(Boolean).join(' · ');
  const warn = [st.missed && '房贷这个月没扣上：下周一银行会来电话。', F.next.forced && '连着两个月没还上：阿玲周一要和你商量卖车还是接横向。', !st.missed && F.cash < FIN.bankLine && '余额低于 −¥3万：信用卡快刷爆了，银行会来电话。', st.stipendGap && '课题经费不够发下个月的劳务费。', F.next.lease && '人才公寓下周到期：续租还是买房？'].filter(Boolean);
  return `<div class="money"><div class="crTop"><b>${fmtY(F.cash)}</b><span>本月账单 · 第 ${S.week} 周 = 一个月 · 净 ${st.net >= 0 ? '+' : ''}${fmtY(st.net)}</span></div>
    <table class="endKpis mtab">${st.inc.map(row).join('')}${st.wkSpend ? row(['本周零花（打车、外卖、礼物、意外……）', -st.wkSpend, '已经付了']) : ''}${st.out.map(row).join('')}</table>
    <div class="crSub">${esc(debts)} · 课题经费 ${fmtY(F.fund)}（只能用于科研）${F.reimb.length ? ` · 还有 ${F.reimb.length} 张“会议餐费”可能被审计` : ''}</div>
    ${warn.map(w => `<div class="mwarn">${esc(w)}</div>`).join('')}</div>`;
}
// HUD line under the vitals: your money, and the grant money you cannot spend on yourself.
function renderMoney() {
  if (!S || !S.fin || !$('pMoney')) return;
  const F = S.fin, k = Math.round(F.cash) + '|' + F.fund;
  if (renderMoney.k === k) return; renderMoney.k = k;
  $('pMoney').innerHTML = `<span class="${F.cash < 0 ? 'neg' : ''}">${fmtY(F.cash)}</span><small>课题经费 ${fmtY(F.fund)}</small>`;
}
// Monthly levers and today's commute, shown in the morning planner. Toggles only on Monday (月初).
function finPlannerRow(d) {
  const F = S.fin, sal = FIN.salary[S.career.rank], btn = (id, t, on) => `<button type="button" class="mbtn ${on ? 'on' : ''}" data-fin="${id}">${t}</button>`;
  const monthly = (F.mortgage ? F.mortgage.pay - Math.min(F.mortgage.pay, sal.gjj) : 0) + (F.car ? F.car.pay : 0) + (F.rent ? F.rent.amount : 0) + FIN.fixed.reduce((a, x) => a + x[2], 0) + (F.tutor ? FIN.tutor : 0) + (F.help ? FIN.help : 0);
  const inc = sal.net + FIN.partner + (S.career.post ? FIN.post[S.career.post] : 0);
  const commute = F.commute === 'metro' ? (F.taxiToday === d ? '今天打车：08:00 到岗。' : `坐地铁：08:${FIN.metroLate} 到岗，路上能读一篇文献（每两天 +1 颗创新点星）。`) : '开车：08:00 到岗。';
  return `<div class="${F.cash < 0 ? 'bad' : ''}"><b>钱 · 余额 ${fmtY(F.cash)} · 课题经费 ${fmtY(F.fund)}</b>每月到手约 ${fmtY(inc)}，固定支出约 ${fmtY(monthly)}，结余约 ${fmtY(inc - monthly)}（意外和零花另算）。${commute}
    <div class="mrow">${F.commute === 'metro' && F.taxiToday !== d ? btn('taxi', `今天打车 · ${fmtY(FIN.taxi)}`, false) : ''}${d === 0 ? btn('help', `请阿姨 · ${fmtY(FIN.help)}/月${F.help ? ' ✓' : ''}`, F.help) + btn('tutor', `补习班 · ${fmtY(FIN.tutor)}/月${F.tutor ? ' ✓' : ''}`, F.tutor) : `<span class="note">阿姨 ${F.help ? '有' : '无'} · 补习班 ${F.tutor ? '有' : '无'}（周一可以改）</span>`}</div></div>`;
}
function finPlannerBind(d) {
  document.querySelectorAll('[data-fin]').forEach(b => b.onclick = () => {
    const F = S.fin, k = b.dataset.fin;
    if (k === 'taxi') { F.taxiToday = d; }
    else if (k === 'help') F.help = !F.help;
    else if (k === 'tutor') F.tutor = !F.tutor;
    SFX.click(); showPlanner(d);
  });
}

/* ---------------- v8: career logic ---------------- */
// Record across finished weeks. Old history rows (v7) only kept titles, so fall back to reading them.
function careerStats(c) {
  const h = c.history || [];
  return {
    grants: h.filter(x => x.grantOk ?? /获批|优先资助/.test(x.grant || '')).length,
    accepts: h.filter(x => x.accept ?? /直接接收/.test(x.paper || '')).length,
    trust: h.length ? (h[h.length - 1].trust ?? 0) : 0,
  };
}
function reqUnmet(rank, c) {
  const st = careerStats(c);
  return (rank.req || []).filter(r => st[r.k] < r.n).map(r => `${r.t} ${st[r.k]}/${r.n}`);
}
// Promote while points and record allow. Returns the next rank's unmet conditions (if points alone would allow it).
function promote(c, week) {
  while (c.rank < RANKS.length - 1 && c.pts >= RANKS[c.rank + 1].pts) {
    const un = reqUnmet(RANKS[c.rank + 1], c);
    if (un.length) return un;
    c.rank++; (c.rankLog = c.rankLog || []).push({ week, n: RANKS[c.rank].n });
  }
  return null;
}
function postLabel(c) { return c && c.post && POSTS[c.post] ? ' · ' + POSTS[c.post].n : ''; }
// Events a title or post brings into a day: admin work, the weekly 帽子 review, the academy-election scenes.
function careerEvents(d) {
  if (typeof S === 'undefined' || !S || !S.career) return [];
  const c = S.career, out = [];
  const mk = (e, time, id, extra = {}) => { const ev = mkC(d, time, e.loc, e.who, e.tag, e.title, e.line, e.open, e.ch, Object.assign({ id, win: 150, pro: e.loc !== 'phone' }, extra)); ev.state = 'pending'; return ev; };
  if (c.post && POSTS[c.post]) {
    const P = POSTS[c.post], pool = ADMIN_EVENTS.filter(e => e.post === 'any' || c.post === 'dean');
    const n = d >= 5 ? P.weekend : P.perDay[0] + ((d + c.week) % (P.perDay[1] - P.perDay[0] + 1));
    let r = (c.week * 131 + d * 17 + 1) >>> 0; const rnd = () => (r = (r * 1103515245 + 12345) >>> 0) / 4294967296;
    const used = new Set();
    for (let i = 0; i < n && used.size < pool.length; i++) {
      let k; do { k = Math.floor(rnd() * pool.length); } while (used.has(k)); used.add(k);
      const e = pool[k];
      if (e.loc === 'meeting') {
        // Meetings are fixed: they land inside the two deep-work blocks and wait 30 minutes. Go, and the focus block
        // is gone; stay at the desk, and the room notices. This is the maker's-vs-manager's schedule the post costs.
        const slot = ['10:30', '11:00', '15:00', '15:30', '10:00', '14:30'][(Math.floor(rnd() * 6) + i) % 6];
        out.push(mk(e, slot, `adm_${d}_${i}`, { u: true, win: 30, exp: `rep-3 team-1|没去「${shortTitle(e.title)}」。会上有人问：“${POSTS[c.post].n}呢？”` }));
      } else {
        const h = 9 + Math.floor(rnd() * 9), m = [0, 15, 30, 45][Math.floor(rnd() * 4)];
        out.push(mk(e, `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, `adm_${d}_${i}`, { win: 120, exp: `rep-2|「${shortTitle(e.title)}」拖过了时限。` }));
      }
    }
  }
  if (c.rank >= 3 && d === 2) out.push(mk(HAT_EVENT, '09:30', 'hat_' + d, { win: 600 }));
  if (c.rank >= ACADEMY.rank && c.acadNext === S.week) ACADEMY_EVENTS.filter(e => e.day === d).forEach((e, i) => out.push(mk(e, e.time, `acad_${d}_${i}`, { win: 300 })));
  return out;
}
// The vote. Transparent on purpose: the epilogue shows the odds and what moved them.
function academyVote(c) {
  const st = careerStats(c), F = S.flags, tries = c.acadTries || 0;
  const parts = [
    // The record carries the vote; weekly KPIs only nudge it (a good week saturates them, a career does not).
    ['基金获批 ' + st.grants + ' 次', st.grants * 5], ['论文直接接收 ' + st.accepts + ' 篇', st.accepts * 7],
    ['科研 ' + Math.round(S.k.research), (S.k.research - 60) * 0.3], ['声誉 ' + Math.round(S.k.rep), (S.k.rep - 60) * 0.15], ['诚信 ' + Math.round(S.k.integrity), (S.k.integrity - 70) * 0.3],
    [F.acad_prep2 ? '材料自己重写' : F.acad_prep1 ? '材料按模板' : '材料没定稿', F.acad_prep2 ? 8 : F.acad_prep1 ? 3 : -6],
    [F.acad_def2 ? '答辩坦诚扎实' : F.acad_def1 ? '答辩回避了问题' : '没参加答辩', F.acad_def2 ? 10 : F.acad_def1 ? 3 : -10],
    F.acad_team && ['答辩讲了学生', 3], F.acad_inflate && ['材料夸大贡献', -15], F.acad_lobby && ['托人“打听”', -10],
    c.lost.length && ['走掉的学生 ' + c.lost.length, -3 * c.lost.length], tries && ['学部已经认识你（第 ' + (tries + 1) + ' 次）', tries * 5],
  ].filter(Boolean);
  const p = clamp(Math.round(-40 + parts.reduce((a, [, v]) => a + v, 0)), 5, 80);
  const roll = rng((c.week * 7919 + tries * 104729 + 3) % 2147483646 + 1)() * 100;
  return { elected: roll < p, p, parts };
}

/* People whose trust is tracked, with the hotspot where they sit. */
const STUDENTS = {};   // v12.1: filled from assets/data/content by loadContent()

/* Memory openers: {t} = the earlier event, shortened. */
const MEMLINES = {};   // v12.1: filled from assets/data/content by loadContent()

/* ---------------- v6: dossier logic ---------------- */
/* Flags set by choices that add stars: flag → [project, component, stars]. Stars add up and cap at 3. */
const FLAG_STARS = {
  letter: ['grant', 'letter', 2], letter3: ['grant', 'letter', 1],
  fit_ok: ['paper', 'result', 2], sys_ok: ['paper', 'result', 1],
  r2_data: ['paper', 'r2', 3],
  resp_full: ['paper', 'cover', 2], refs_ok: ['paper', 'cover', 1],
  fig_ok: ['paper', 'figure', 1], disc_ok: ['paper', 'figure', 1],
};
function addStar(p, c, n = 1, quiet) {
  if (!S || !S.dos || !S.dos[p]) return 0;
  const submitted = p === 'grant' ? S.submitted : S.paperSubmitted; if (submitted) return 0;
  const before = S.dos[p][c], after = Math.min(3, Math.max(0, before + n)); S.dos[p][c] = after;
  if (after !== before && !quiet) { const comp = DOSSIER[p].comps.find(x => x.id === c); toast(`${DOSSIER[p].n} · ${comp.n} ${STAR(after)}`, after > before ? 'good' : 'bad'); if (after > before) gainXP(10); }
  return after - before;
}
function starsOf(p) { return DOSSIER[p].comps.map(c => S.dos[p][c.id]); }
/* Verdict 0–100 from weighted stars; pure writing tops out at the writing weight. */
function dossierScore(p) { return Math.round(DOSSIER[p].comps.reduce((a, c) => a + c.w * (S.dos[p][c.id] / 3), 0)); }
function dossierHTML(p, compact) {
  return `<div class="dos ${compact ? 'compact' : ''}">${DOSSIER[p].comps.map(c => { const v = S.dos[p][c.id]; return `<div class="${v ? 'has' : ''}"><span>${esc(c.n)}</span><b>${STAR(v)}</b>${compact ? '' : `<small>${esc(c.src)}</small>`}</div>`; }).join('')}</div>`;
}
/* Asking a student for preliminary data: the stars depend on trust at the moment you ask. */
function requestData(id) {
  const p = STUDENTS[id], tr = S.trust[id];
  const stars = tr >= 80 ? 3 : tr >= 60 ? 2 : 1, late = tr < 60 ? 2 : 1;
  S.dataReq = { id, day: S.day + late, stars };
  const line = tr >= 60 ? `${p.n}：好的老师，明天早上给您。` : `${p.n}：……哦。我手头还有别的事，后天给您行吗？`;
  toast(line, tr >= 60 ? 'good' : ''); logIt(`请${p.n}整理基金的预实验数据（信任 ${Math.round(tr)}）。`);
  S.trust[id] = clamp(S.trust[id] + (tr >= 60 ? 2 : -2));
}
function dataEvents(d) {
  const r = S && S.dataReq; if (!r || r.day !== d || r.done || S.lost.includes(r.id)) return [];
  const p = STUDENTS[r.id];
  const fb = r.stars >= 3 ? `${p.n}不只整理了数据，还做了一张信噪比随厚度变化的图。可以直接放进申请书。` : r.stars === 2 ? `整理得清楚，就是少一张像样的图。` : `只有一张表，没有误差分析。你叹了口气。`;
  const e = mkC(d, '09:40', p.loc, `${p.n} · ${p.role}`, '基金', `${p.n}：预实验数据整理好了`, `${p.n}：老师，您要的数据`,
    `${p.n}把一个 U 盘放在你桌上。|${p.n}：老师，缪子穿透测试的数据都在里面了，按您说的格式。`, [
      ['当面过一遍，指出一处可以再补的分析', 'team+3 trust+4 @data_in', 20, fb + '你们一起看了二十分钟，他的眼睛亮了一下。'],
      ['谢谢，我自己看', 'trust+1 @data_in', 3, fb],
    ], { id: 'g_data', win: 300, mood: 'happy', exp: `rep-1|${p.n}的数据你一直没看。`, rubric: '学生按时交付了数据。好的导师会当面肯定并给具体反馈。' });
  e.dataStars = r.stars; e.state = 'pending';
  return [e];
}

/* Next-morning conversation when a person's trust has fallen below 30. */
function crisisEvents(d) {
  if (typeof S === 'undefined' || !S || !S.crisis) return [];
  return Object.entries(S.crisis).filter(([id, day]) => day === d && !S.lost.includes(id)).map(([id]) => {
    const p = STUDENTS[id];
    const e = mkC(d, '09:20', p.loc, `${p.n} · ${p.role}`, '谈心', `${p.n}想和你单独谈谈`, `${p.n}：老师，有空吗……就十分钟`,
      `${p.n}站在你面前，手里攥着一张纸，像是写了很久。|${p.n}：老师，我最近觉得……在组里有点待不下去了。我在想要不要换导师，或者干脆休学一段时间。`, [
        ['放下手头所有的事，关上门，认真听' + p.he + '说完', 'team+4 wellbeing-2 trust+32 @kept_' + id, 45, `${p.n}说了很多，你几乎没插话。最后${p.he}说：“谢谢老师，我想再试试。”`, '45 分钟，最好的选择'],
        ['先安抚，约好周末细谈', 'team+1 trust+12', 10, `${p.n}点点头：“好……”但眼神没有亮起来。`, '信任仍可能不够'],
        ['读研都辛苦，自己调整一下', 'team-6 @lose', 3, `${p.n}沉默了一会儿：“我明白了。”下午，${p.he}把转导师申请放在了院办。`],
      ], { win: 300, mood: 'worried', exp: `team-8|${p.n}没等到你，下午交了转导师申请。`, rubric: `学生正在考虑离开课题组。好的导师会放下手头工作、认真倾听、具体回应困难，不会说教或敷衍。` });
    e.id = 'crisis_' + id; e.state = 'pending'; e.crisisOf = id; e.expire.lose = true; e.urgent = true;
    return e;
  });
}

/* ---------------- flag-gated events ---------------- */
// Tennis partner from chemistry becomes an ally → letter of support on Friday.

// Reviewer 2 follow-up: reward or second chance.

// A recruited undergraduate writes in.

// Students-first week: the group notices.

