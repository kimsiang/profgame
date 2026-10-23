// Balance arithmetic (src/rules/pure.js) checked in Node: `npm test`. Numbers quoted are the ones in the design notes.
const test = require('node:test'), assert = require('node:assert/strict');
// pure.js is a classic browser script (the repo is "type": "module"), so load it in a sandbox the way the page does.
const vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
const sandbox = { window: undefined }; vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/rules/pure.js'), 'utf8'), sandbox);
const Rules = sandbox.Rules;
const BAL = { grades: [92, 84, 60, 46], wbFloor: 40, wbPenalty: 0.4 };

test('mortgage: ¥350万 over 30 years at 3.1% is ¥14,946 a month (v9)', () => {
  assert.equal(Math.round(Rules.pmt(3500000, 0.031, 360)), 14946);
  assert.equal(Math.round(Rules.pmt(150000, 0, 36)), 4167);   // zero-rate loans divide evenly
});

test('dossier: weights × stars/3, rounded (v6)', () => {
  const comps = [{ id: 'write', w: 35 }, { id: 'idea', w: 30 }, { id: 'data', w: 25 }, { id: 'letter', w: 10 }];
  assert.equal(Rules.dossierScore(comps, { write: 3, idea: 3, data: 3, letter: 3 }), 100);
  assert.equal(Rules.dossierScore(comps, { write: 3 }), 35);          // pure writing tops out well under the 70 pass mark
  assert.equal(Rules.dossierScore(comps, { write: 3, idea: 2, data: 2, letter: 1 }), Math.round(35 + 20 + 16.667 + 3.333));
});

test('grades: bands S 92 / A 84 / B 60 / C 46 (v12.3)', () => {
  assert.deepEqual([95, 92, 91.9, 84, 70, 60, 50, 46, 10].map((s) => Rules.gradeOf(s, BAL.grades)), ['S', 'S', 'A', 'A', 'B', 'B', 'C', 'C', 'D']);
});

test('week score: a week that never went home cannot grade above B', () => {
  const good = { avg: 90, pts: 13, done: 20, all: 20, collapses: 0, wb: 70, homeNights: 4 };   // 45 + 41.6 + 8 = 94.6
  assert.equal(Rules.weekScore(good, BAL).grade, 'S');
  const r = Rules.weekScore({ ...good, homeNights: 1 }, BAL);
  assert.equal(r.homeCap, true); assert.equal(r.grade, 'B'); assert.equal(r.score, 83);
});

test('week score: Sunday wellbeing under 40 costs 0.4 a point', () => {
  const w = { avg: 60, pts: 5, done: 10, all: 20, collapses: 1, wb: 20, homeNights: 3 };
  const base = 60 * 0.5 + 5 * 3.2 + 0.5 * 8 - 4;
  assert.equal(Rules.weekScore(w, BAL).score, base - 20 * 0.4);
  assert.equal(Rules.weekScore({ ...w, wb: 40 }, BAL).score, base);
});

test('trust: ×1.5 on a 学生优先 day, gains only', () => {
  assert.equal(Rules.trustGain(6, 'students'), 9);
  assert.equal(Rules.trustGain(6, 'grant'), 6);
  assert.equal(Rules.trustGain(-6, 'students'), -6);
});

test('endings: leave on three failed grants, two lost students or three collapse weeks; teacher and industry need the chosen flag', () => {
  const E = JSON.parse(fs.readFileSync(path.join(__dirname, '../assets/data/content/endings.json'), 'utf8')).endings;
  const wk = (o) => Object.assign({ grade: 'B', grantOk: true, collapses: 0, trust: 60, k: { teaching: 60 } }, o);
  const none = { history: [wk({}), wk({})], lost: [], flags: {} };
  assert.equal(Rules.ending(Rules.careerFacts(none), E), null);
  assert.equal(Rules.ending(Rules.careerFacts({ history: [wk({ grantOk: false }), wk({ grantOk: false }), wk({ grantOk: false })], lost: [], flags: {} }), E).id, 'leave');
  assert.equal(Rules.ending(Rules.careerFacts({ history: [wk({ grantOk: true }), wk({ grantOk: false }), wk({ grantOk: false })], lost: [], flags: {} }), E), null);
  assert.equal(Rules.ending(Rules.careerFacts({ history: [wk({})], lost: ['lin', 'zhou'], flags: {} }), E), null);                 // not in the first week
  assert.equal(Rules.ending(Rules.careerFacts({ history: [wk({}), wk({}), wk({})], lost: ['lin', 'zhou'], flags: {} }), E).id, 'leave');
  assert.equal(Rules.ending(Rules.careerFacts({ history: [wk({ collapses: 2 }), wk({ collapses: 3 }), wk({ collapses: 2 })], lost: [], flags: {} }), E).id, 'leave');
  const good = [wk({ trust: 80, k: { teaching: 80 } }), wk({ trust: 80, k: { teaching: 78 } }), wk({ trust: 80, k: { teaching: 76 } }), wk({ trust: 80, k: { teaching: 90 } })];
  assert.equal(Rules.ending(Rules.careerFacts({ history: good, lost: [], flags: {} }), E), null);                    // no choice made yet
  assert.equal(Rules.ending(Rules.careerFacts({ history: good, lost: [], flags: { end_teach: 1 } }), E).id, 'teacher');
  assert.equal(Rules.ending(Rules.careerFacts({ history: good.slice(0, 3), lost: [], flags: { end_teach: 1 } }), E), null);   // needs four weeks
  assert.equal(Rules.ending(Rules.careerFacts({ history: [wk({})], lost: [], flags: { end_industry: 1 } }), E).id, 'industry');
});
