# Design note — v12 "A week with weight" / 让这一周有分量

Status: **approved 2026-10-23** (all four decisions as recommended: roster as drafted, harness first, all content to JSON in v12.1, §2.3 targets as first guesses). Adjustments made during the build go in the table at the end.
Builds on: v5 blocks/intents/trust/memory, v6 dossier and home, v8 career, v9 money, v11.2 places (canteen, café, garden, pitch, gym).
Execution: once approved, hand to Opus milestone by milestone (section "Build plan"); each milestone is one branch, one tag, one test note.

---

## The design problem in one line
Since v9 every version added **places** (gym, garden, café, canteen, music) and none added **decisions**. A player now walks through a beautiful campus to make the same ~20 scripted choices a day, and the new rooms only pay flat wellbeing. v12 adds no rooms, no 3D, no music. It makes the rooms we have matter, proves the week is balanced with bots, and moves the content into data so v13+ can grow without touching code.

Reference lessons:
- **Stardew Valley** — the saloon is not a wellbeing dispenser; it is where you meet people. Every amenity should route back to a relationship or a resource.
- **Persona 5** — hanging out with a confidant costs an evening and returns a *mechanical* perk, never only a number. Our perks: intel, dossier stars, flow carry, event unlocks.
- **Game Dev Tycoon / Papers, Please** — the designer ran bots before players. We have none; v9's "lazy spender" target quietly failed because nobody ran the loop a hundred times.

Not in v12 (explicit cuts, see §6): new rooms, new characters, new music, Pro-mode rewrites, the JA/MS translations, Steam page.

---

## 1. Places that matter / 让地点有用

### 1.1 The rule
Every amenity action gains an optional **companion** (约人). Alone it works as today. With a companion it costs the same minutes plus sometimes money, and returns something *other than* wellbeing: trust, intel, a dossier star, flow carry, or an unlocked event. The place decides what the company is good for.

| Place / action | Who can come | Returns (beyond today's wellbeing) | Cost |
|---|---|---|---|
| 食堂 lunch or dinner | one student (小陈 小周 小雨 小林), 赵博士 | trust +6 (×1.5 on 学生优先); 25% chance the student *says something* → a **table event** (see 1.3) | 请客 ¥35–60 from the personal wallet (grant wallet is the 报销 temptation again) |
| 天台咖啡 | 赵博士, 陈老师 (化学系), 王老师 | 赵博士: next 写 block starts with flow carry (+15 min of flow); 陈老师: +1 合作信 letter star once per week; 王老师: tomorrow's admin event shown in 待处理 a day early | ¥28 × 2 |
| 植物园散步 | alone, or 阿玲 by phone (evening only) | alone, ≥ 20 min: **灵感** flag — next 写 block +1 创新点 idea progress; 阿玲: partner +3 and `homeToday` not required for the home cap that night | time only |
| 羽毛球 (existing bmOffer) | 院长, 陈老师, 赵博士 | win vs 院长: rep +4 and the next 院务会 offers a 4th "the dean owes you one" choice; lose: nothing lost, rep +1 "至少去了" | energy as today |
| 足球 / 网球 | unchanged | unchanged | — |

Availability is the trade-off: a student can only come when they are in the building and not in a block you have booked for them (same `loc` data as today); 陈老师 only Tue/Thu; 院长 only when `trust.dean ≥ 55` or a post is held. Each companion once per day; the game says why not ("小陈在做 HV 调试，别叫他").

### 1.2 Player experience
At the canteen stall choice dialog a second row appears: **"叫谁一起？"** with the people in range of the hotspot plus "一个人吃". Same pattern at the café and gym. Nothing new to learn: it is the existing dialog with one more question. In the HUD the companion appears next to the activity label ("午饭 · 和小周 · 到 13:05").

### 1.3 Table events / 饭桌上说的话
A small pool (target 16 at launch, ~3 per student + 4 for 赵博士) of two-choice events that can **only** fire with a companion. They use the existing `C()` shape but `loc: 'table'` and `needs: ['companion:zhou']`. Examples, each with a cost:
- 小周 (本科四年级): "老师……我可能不读博了。" → encourage (trust +8, lose a future RA hour this week) / respect it (trust +4, integrity +1) / change subject (trust −6, `remember('ignored')`).
- 小林: confesses he skipped a gas-cylinder check → fix now (safety +3, afternoon block −40 min) / lecture (safety +1, trust −4) / let it go (safety −6, flag `cyl_risk` feeds Thursday's inspection).
- 赵博士: has an industry offer → support (team −6 next week, rep +3, his letter is +2 stars) / counter (grant wallet −¥2万 as a top-up, team +4) / stall (trust −8).

These reuse the memory system: whatever you say at lunch comes back on Thursday in a `MEMLINES` opener. That is the whole point of the feature — the canteen becomes where the week's human decisions happen.

### 1.4 Edge cases
- Companion lost (`S.lost`) or in crisis → not offered.
- Player already ate (`meals`) → the invite dialog still works as 喝杯东西 at 30% cost.
- Pro mode on: the table event's `open` can be LLM-written from the same JSON stub; deltas stay from data.
- Save: `S.companions = {dayIdx: {npcId: true}}`, `S.inspired` flag, `S.oweDean`. Save v6 migration = defaults.
- Reload abuse: table-event chance is seeded `rng(week*31 + day*7 + npcHash)` like the dossier noise.

---

## 2. Balance harness / 先跑一百周再加东西

### 2.1 Goal
A headless mode that plays a whole week under a fixed **policy**, with no rendering, in < 2 s per week, and prints the metrics in §2.3. Run before every release from v12 on (`npm run balance`).

### 2.2 Design
- `window.__sim = { run(policy, weeks, seed) }` inside index.html, guarded so it only exists with `?sim=1`. It calls the real `beginDay / tick / endDay / endWeek` with the render loop and audio stubbed (Three.js scene still builds once; models are not loaded: `MODEL_WANT` cleared).
- Time is advanced in 1-minute steps through the same `tick(dm)` the game uses.
- The policy is a pure function `(S, options) → choice` called at every dialog, every free block and every planner. Four built-in policies in `tools/balance/policies.js`:
  1. **grinder** — 基金冲刺 every day, never home, canteen alone, no sport.
  2. **mentor** — 学生优先, accepts every student request, companion every lunch.
  3. **balanced** — the "intended" play: write mornings, people afternoons, home 4 nights, one sport.
  4. **random** — uniform over options; the floor.
- Determinism: all randomness already goes through `rng(seed)`; the harness sets the week seed, so a failing week can be replayed.

### 2.3 Metrics and targets (first targets, to be revised after the first run)
| Metric | Target |
|---|---|
| Grade distribution per policy over 100 weeks | balanced: median B, ≥ 20% A; grinder: never S, ≤ 50% A (home cap works); random: median D |
| Grant pass rate | balanced 55–70%, grinder 70–85%, mentor 30–45% |
| Wellbeing at Sunday | balanced 50–70; grinder < 40 at least 1 week in 3; collapses ≤ 0.3/week balanced |
| Average student trust | mentor ≥ 75; grinder ≤ 50; `lost` event in ≥ 10% grinder weeks |
| Cash at month end (v9) | balanced > 0 in ≥ 85% of months |
| Choices with consequence per day | ≥ 8 decisions where the option changes a tracked value by ≥ 3 |
| Dominant-strategy test | no policy beats *balanced* on **both** grade and wellbeing |

The last line is the one that matters. If grinder wins on grade and keeps wellbeing > 50, the home cap and energy drain are too soft and the harness says so before a player does.

### 2.4 Edge cases
- Dialogs that open other dialogs (dossier, planner) must resolve synchronously in sim; audit the ~12 `openDialog` callers that chain.
- The badminton match is real-time physics; in sim it is replaced by the existing expected-result table (`bmOffer` already has one for skipped matches).
- Pro mode is forced off in sim.

---

## 3. Content to data / 把内容搬进 JSON（v13 的前提）

### 3.1 What moves
| From index.html | To | Notes |
|---|---|---|
| 136 `C(...)` scripted events, `ADMIN_EVENTS`, `ACADEMY_EVENTS`, `FIN_EVENTS`, `HOME_SCENES`, new table events | `assets/data/events/*.json` (one file per day + `admin`, `academy`, `finance`, `home`, `table`) | `fx` strings and `|`-separated lines are already data; keep them. |
| `STUDENTS`, `MEMLINES`, NPC names and roles | `assets/data/npcs.json` | portraits/model ids stay in the manifest |
| `DAYS`, `BLOCKS`, `INTENTS`, `CATS` labels | `assets/data/week.json` | |
| `QUIZ`, `SLIDES` | `assets/data/teaching.json` | |

Code-only hooks (24 events with `pro:`, 20 with `win:`, 9 with `id:`) are already plain values. Events with function callbacks (`card:` 22 — check whether any are functions) get a `hook: 'name'` string resolved in a small `HOOKS` registry. Target: **zero game text left in index.html** outside the HUD (HUD strings are §3.3's job).

### 3.2 Loader and validation
- One `loadData()` at boot fetching all JSON in parallel (same pattern as `canteen.json`), with the current in-code data kept as a fallback only until the migration is verified, then deleted.
- `tools/validate-data.mjs`: every event has `day/time/loc/who/title/line/open/ch`, every `fx` token parses, every `needs` references a known flag or `companion:id`, every `loc` is a known hotspot. Runs in CI with the e2e tests.

### 3.3 Localization groundwork (only the plumbing)
Every string in the JSON becomes `{zh, en}`; the loader picks by `LANG` (localStorage `prof-lang`, default zh). `t(key)` already exists for 270 HUD strings; the remaining hard-coded HUD strings (toasts, labels) are swept into the same table. JA/MS **not** written in v12 — but after v12 a translator can work without opening code, which is the goal.

### 3.4 Edge cases
- Event ids are stable strings, because saves store `S.events[].id` and memory stores event titles; a renamed id must have an `alias`.
- Fetch failure on GitHub Pages (offline) → show "内容文件加载失败" with a retry; never a blank campus.
- Load size: ~140 events ≈ 120 KB JSON; fine, no lazy loading needed.

---

## 4. Playtest questions (first external playtest, 5 people, after v12.2)
1. Who did you invite to lunch, and why that person? (Tests whether the companion choice reads as a decision or a chore.)
2. Did anything a student said at the table change what you did that afternoon?
3. When did you first feel you could not do everything? Which day? (Target: Tuesday. If Friday, the week is too easy.)
4. Did you ever go to the garden on purpose? What for?
5. Name the one moment you would tell a friend about.

## 5. Metrics to log (anonymous, local, shown on the week review as "你的一周")
- companions invited / week (target 4–8)
- table events fired and the chosen option distribution
- first day `energy < 30`
- share of lunches eaten alone

## 6. Scope and cuts
Cut from this version, with the reason:
- **New NPCs (a rival, a journal editor as a person)** — the current seven already have memory lines; adding faces before the companion system proves itself is scope without fun.
- **Café stage / live music** — v11.2 already made the café pretty; beauty is not a trade-off.
- **Dating / romance threads for students** — never; the game is about a professor's duty of care, and it would poison the companion system.
- **Grant-office minigame** — the dossier already carries the grant's quality.
- **JA/MS translations** — plumbing only; translation is a content job for later.

Estimate: §1 companions + table events 1.5 days, §2 harness 1 day (+0.5 for the first balance pass), §3 data migration 1.5 days, docs and tests 0.5 day. About a week of Opus sessions.

## 7. Build plan for Opus (one milestone = one branch, one tag)
| Tag | Branch | Deliverable | Test |
|---|---|---|---|
| v12.0 | `feature/v12-harness` | `?sim=1` + `__sim.run`, four policies, `npm run balance` prints the §2.3 table for the **current** game. Baseline before any change. | `node tools/balance/run.mjs --weeks 100` finishes < 5 min, writes `tools/balance/out/baseline.json` |
| v12.1 | `feature/v12-data` | Events, NPCs, week, teaching in JSON with validator; game text in index.html = 0; saves migrate (v6) | e2e `v112_shots` unchanged; `validate-data` green; balance table identical to baseline (data move must not change numbers) |
| v12.2 | `feature/v12-companions` | Companion invites at canteen / café / garden / gym, 16 table events, memory hooks, 请客 money | new e2e `companion.mjs` (invite 小周, fire a seeded table event, check trust and `MEMLINES` on Thu); balance: mentor trust ≥ 75, dominant-strategy test passes |
| v12.3 | `feature/v12-balance` | Tune from the harness; week-review "你的一周" panel; CHANGELOG, DESIGN, this note's adjustment table | all §2.3 targets met or the miss documented with the lever |

Rules for Opus during the build: a design question that changes a number in §1 or §2.3 goes into the adjustment table at the end of this note, not into chat; no new 3D; keep 60 fps (the harness must not ship any per-frame cost when `?sim` is absent).

## 8. Steam/trailer hook
"Your grant is due Friday. Your student just told you, over noodles, that she's quitting." Trailer moment: the canteen invite row, the student's line, the hard cut to the Friday 23:59 submission screen.

---

## Decisions for Kim
1. Companions and table events as in §1 — yes / change the roster?
2. Harness first (v12.0 baseline before any gameplay change) — yes?
3. Move **all** content to JSON in v12.1, or only the new table events now and the 136 old events later? (I recommend all now: the migration is mechanical and the harness makes it safe.)
4. Balance targets in §2.3 — accept as first guesses, to be revised after the baseline run?

---

## Implementation adjustments
| Draft | Built | Why |
|---|---|---|
| §3.1 one file per day | `week.json` (all days, `day` field) + `events.json`, `people.json`, `calendar.json`, `codex.json` | Script order matters for same-time events; one file keeps it and is easier to diff. |
| §3.1 zero game text in index.html | Event content moved; events with mini-game callbacks, crisis/family templates, outcome and HUD text stay in code | Those carry functions or format live state; moving them is a localisation job, not a data job. |
| §3.3 "`t(key)` already exists for 270 HUD strings" | It does not exist: there was no string table at all. v12.1 adds content-level `{zh, en, ja, ms}` + `prof-lang` only | My draft misread a grep count. The HUD sweep is a separate localisation milestone. |
| §3.3 every JSON string `{zh, en}` | Existing content stays 中文-only; new content (v12.2 table talks) is written zh + en | Translating 200 events is content work; the loader and validator accept both forms. |
| §7 v12.1 saves v6 migration | No save change needed | Event ids and state keys are unchanged; v12.2's new state fields default in `newState`. |
| Harness: one page for all runs | A fresh page per career | Memory grew to 4 GB over 400 weeks (the player was rebuilt every morning; also fixed). |
| §1.1 gym: 院长, 陈老师, 赵博士 as badminton partners | Not in v12.2 | The playable match needs an opponent profile and court NPC per person; the companion rule works without it. Candidate for later. |
| §1.1 王老师: tomorrow's admin event a day early | One reimbursement fixed, or office tasks +60 min | The café already gives tomorrow's rumours; Wang needed a perk of her own. |
| §1.1 canteen cost ¥35–60 | ¥45 flat | Simpler to read on the button. |
| §1.4 "already ate → coffee at 30% cost" | Invites only at lunch and dinner | Fewer rules to explain; the café covers coffee. |
| §1.3 memory by the generic rule (sum of fx) | Table talks are remembered by their trust delta | An encouraging answer that costs research read as "bad" in her memory. |
