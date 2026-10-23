/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   v5 DATA — time blocks, intentions, ranks, NPC memory lines,
   student-crisis and flag-gated events. Pure data + builders;
   the rules that use them live in 5_game.js.
   ========================================================= */

/* The working day in five blocks plus overtime (minutes since midnight). */
const BLOCKS = [
  { id: 'b0', name: '早晨', from: hm(8), to: hm(10) },
  { id: 'b1', name: '上午', from: hm(10), to: hm(12) },
  { id: 'b2', name: '午间', from: hm(12), to: hm(14) },
  { id: 'b3', name: '下午', from: hm(14), to: hm(17) },
  { id: 'b4', name: '傍晚', from: hm(17), to: hm(21) },
  { id: 'b5', name: '晚上', from: hm(21), to: hm(24), overtime: true },
];
/* Where minutes go. Order = display order. */
const CATS = {
  grant: { n: '基金', c: '#2251FF', i: '书' },
  paper: { n: '论文', c: '#FFC857', i: '文' },
  research: { n: '读文献', c: '#7FD1FF', i: '读' },
  events: { n: '杂事与人', c: '#FF8A5B', i: '人' },
  teach: { n: '教学', c: '#B78CFF', i: '课' },
  meet: { n: '开会', c: '#8FA8BA', i: '会' },
  self: { n: '照顾自己', c: '#3DDC97', i: '息' },
  sport: { n: '运动', c: '#00E0B0', i: '球' },
  travel: { n: '走路与电梯', c: '#4A6A80', i: '行' },
  home: { n: '在家', c: '#FF9ECB', i: '家' },
  idle: { n: '发呆', c: '#2A3D4D', i: '·' },
};
/* Daily intention chosen in the morning planner. */
const INTENTS = [];   // v12.1: filled from assets/data/content by loadContent()
/* Career track. pts = cumulative career points needed. */
/* v8: titles (职称) rise on points AND a record; posts (职务) are offered and run in parallel; 院士 is an election. */
const RANKS = [
  { n: '助理教授', en: 'Assistant Professor', pts: 0 },
  { n: '副教授（长聘）', en: 'Associate Professor, tenured', pts: 8 },
  { n: '教授', en: 'Full Professor', pts: 18 },
  { n: '特聘教授', en: 'Distinguished Professor', pts: 70, req: [{ k: 'grants', n: 3, t: '基金获批', en: 'funded grants' }] },
  { n: '讲席教授', en: 'Chair Professor', pts: 110, req: [{ k: 'accepts', n: 2, t: '论文直接接收', en: 'papers accepted as is' }, { k: 'trust', n: 70, t: '学生平均信任', en: 'average student trust' }] },
];
const POSTS = {
  vice_dean: { n: '副院长', en: 'Vice Dean', perDay: [3, 4], weekend: 1 },
  dean: { n: '院长', en: 'Dean', perDay: [6, 7], weekend: 2 },
};
const ACADEMY = { rank: 4, every: 4 };   // eligible from 讲席教授; one election every 4 weeks
/* Administrative work that comes with a post. post: 'any' | 'dean'. Same shape as C(): [text, fx, minutes, feedback]. */
const ADMIN_EVENTS = [];   // v12.1: filled from assets/data/content by loadContent()
/* 人才帽子 review: one per week from 特聘教授 on. */
const HAT_EVENT = {};   // v12.1: filled from assets/data/content by loadContent()
/* Academy election week: three scenes. Flags feed the vote at week's end. */
const ACADEMY_EVENTS = [];   // v12.1: filled from assets/data/content by loadContent()

/* XP levels now describe composure, not academic rank. */
LEVELS.splice(0, LEVELS.length, [0, '手忙脚乱'], [120, '渐入佳境'], [300, '游刃有余'], [540, '从容不迫'], [820, '运筹帷幄'], [1150, '举重若轻'], [1500, '一代宗师']);

/* =========================================================
   v6 DATA — "Home and craft" / 家与手艺
   These tables are content, not logic: the dossier components, the family,
   the evening scenes and the tutorial steps. Code below only reads them.
   ========================================================= */
/* Dossier: the grant and the paper are assembled from components, 0–3 stars each.
   src tells the player where a star comes from; w is the weight in the verdict. */
const DOSSIER = {
  grant: { n: '基金申请书', comps: [
    { id: 'write', n: '写作', src: '办公桌 · 完整的专注时段', w: 35 },
    { id: 'idea', n: '创新点', src: '3F 图书馆 · 每读一次 +1', w: 30 },
    { id: 'data', n: '预实验数据', src: '在办公桌请小陈整理 · 看他对你的信任', w: 25 },
    { id: 'letter', n: '合作支持信', src: '4F 网球 · 陈老师周五来信', w: 10 },
  ] },
  paper: { n: '论文修改稿', comps: [
    { id: 'figure', n: '图与正文', src: '办公桌 · 完整的专注时段', w: 35 },
    { id: 'result', n: '关键结果', src: '小陈的寿命拟合（周一）', w: 25 },
    { id: 'r2', n: '回复审稿人 2', src: '补温度分析（周二、周三）', w: 30 },
    { id: 'cover', n: '逐条回复信', src: '周四与合作者过回复信', w: 10 },
  ] },
};
const STAR = (n) => '★'.repeat(n) + '☆'.repeat(3 - n);

/* The family at home. Names are data so a setup screen can change them later. */
const FAMILY = {
  partner: { n: '阿玲', en: 'Ling', role: '伴侣', ic: '伴' },
  child: { n: '小宇', en: 'Xiaoyu', role: '孩子 · 小学三年级', ic: '娃' },
  house: { n: '家', en: 'Home', role: '家务与账单', ic: '务' },
};
/* v12.3 balance (tools/balance): the numbers the harness tuned. See design-notes/v12-week-with-weight.md, adjustments. */
const BAL = {
  kpiGain: 0.4,                 // every KPI gain is scaled: the written rewards add up to +100–200 per KPI in a week
  kpiSoft: [50, 105, 0.15],     // and shrinks above 50, toward 15% near 100 (a good week no longer pins every KPI at 100)
  kpiNight: 0.05,               // each night every KPI slides 5% of the way back toward 50: standing is kept, not banked
  wbDrain: [0.04, 0.045, 0.06],  // wellbeing per minute: working day, 19–21, after 21
  wbMorning: [6, 4, 2, 0],      // overnight recovery by when you left: before 19, 21, 23, later
  expiredWb: 2,                 // wellbeing lost per event that expired
  grantNoise: 20,               // reviewer noise on the grant score: ± half of this
  grantBar: 70, grantTop: 82,
  wbFloor: 40, wbPenalty: 0.4,  // the grade counts how you came out of the week: each point of Sunday wellbeing under 40 costs 0.4
  grades: [92, 84, 60, 46],     // S, A, B, C (was 82, 70, 58, 46: careful play got S every week)   // funded / funded with priority (was 58 / 75: a careful dossier always passed)
};
const FAM_DRIFT = 6;           // per night not at home (weekend ×2)
const FAM_HOME_WB = 10;        // wellbeing restored by an evening at home
/* Evening scenes: picked by the lowest meter, then by day. fx keys: partner child house wellbeing energy.
   [text, fx, feedback] — the second choice is never simply worse; it trades one meter for another. */
const HOME_SCENES = [];   // v12.1: filled from assets/data/content by loadContent()

/* Tutorial: one-line hints shown once per browser, in this order. when() decides the trigger. */
const TUTORIAL = [
  { id: 'plan', text: '早上先选一个「今天的打算」。它决定今天哪种事做得更快。', when: () => S.planning },
  { id: 'move', text: '光柱的地方有人在等你。走过去按 E（或点屏幕上的 E）处理。', when: () => S.running && !S.planning && !S.dialog && S.t >= hm(8, 2) },
  { id: 'desk', text: '503 的办公桌：写基金会一直写到时段结束，前 30 分钟是进入状态。被打断就要重来。', when: () => S.events.some(e => e.state === 'resolved') && !S.dialog },
  { id: 'dossier', text: '基金不只是写：图书馆攒创新点、请学生整理数据、网球场结识合作者。看看桌上的「申请书清单」。', when: () => S.focusBlocks >= 1 || S.t >= hm(12) },
  { id: 'home', text: '晚上有三种过法：加班、去植物园，或者回家。家里的人也在等你——电梯按 B1，或右上角「下班」。', when: () => S.t >= hm(20, 30) },
];

