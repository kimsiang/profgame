# Changelog

## v12.3.5 — Diorama by default (2026-10-23)
- New players start in 微缩模型 (stylised diorama, Q 版人物). 写实 is still one tap away on the title page or the top bar.
- Players who already picked a style keep it (`prof-art` in localStorage is read first).
- Title-page buttons reordered: 微缩模型 first, marked 默认. `real_shot.mjs` now sets `prof-art=real` itself.
- Test: clear site data (or a private window), open the game → 5F is the diorama and the top bar reads 微缩模型.

## v12.3.4 — Disclaimer (2026-10-23)
- Title screen, under the English name: 虚构设定，不针对任何单位和个人 (zh + en). The footer's existing fiction note says the same in full.

## v12.3.3 — No more ghosts; badminton names (2026-10-23)
- 小敏 (博士一年级) is a member of the group (`min`): seated at bay5, trust, memory lines, lunch companion. The anonymous `s2` figure that sat there is hidden.
- 陈老师 (化学系) now shows her bust in dialogs (she already had a figure on the tennis court).
- 隔壁组老师 (`nb`) is a visitor: he appears beside the pantry while his Tuesday event is active and leaves afterwards. Visitors always register a home position, so they hide again even when standing right at the hotspot.
- Badminton opponents renamed on Kim's list: 研究生会 阿强 → **阿丹**, 化学系博士后 小吴 → **阿龙**, 槟城交换博士后 → **阿伟** (v12.3.2). **阿嘉** is reserved for the next badminton character. Ids (`aqiang`, `wu`, `jay`) unchanged, so saves and the balance tables still line up. The sophomore recruit 小吴 (football, email) is a different person and keeps his name.
- Test: `node tools/e2e/run.mjs ghosts.mjs` — roster has 7 students, three busts render, 隔壁组老师 visible at 13:05 Tuesday, hidden again after the talk.

## v12.3.2 — 阿杰 has a body (2026-10-23)
- Bug: "阿杰在茶水间等你" put a marker at the pantry and nobody there. 阿杰 (硕士一年级) had seven events in `week.json` but no NPC, no portrait, no trust, no memory — a voice with no body. He is now a member of the group (`jie`): seated at bay4 (his desk was already labelled 阿杰的座位), in `SPEAKERS`, `people.json` (trust and memory lines) and the canteen companion list.
- New rule for every NPC: while one of his events is active he stands beside the event's hotspot (same floor only; not if he is already within 2.5 m, e.g. at his own desk) and goes back to his seat when the event settles. So "小林在门口" and "阿杰在茶水间" now look like what they say.
- The badminton exchange postdoc from Penang was also called 阿杰; he is now 阿伟 (`jay` id unchanged) so the two cannot be confused.
- The anonymous 课代表 figure (`s1`) that used to sit at bay4 is hidden; his bust still appears in the lecture.
- Test: `node tools/e2e/run.mjs ajie.mjs` — 阿杰 at the pantry at 12:20, bust shown, trust 60 → 67, back at bay4 after the talk.
- Still bodiless (validator warnings): 隔壁组老师, 小敏 (2 events), 陈老师. Candidates for the same treatment.

## v12.3.1 — Renamed to 导师的一周 / My Advisor's Week (2026-10-23)
- The game is now 《导师的一周》 / *My Advisor's Week* (was 教授的一周 / A Professor's Week; the title screen still said 教授的一天). Main audience is students, so the name takes their point of view: you sit in your advisor's chair for a week.
- Changed: page title, title screen, Pro-mode system prompt, save-import toast, the gym scoreboard text, the student-council poster line in `week.json`, README and DESIGN headers.
- Unchanged on purpose: save file tag `professor-week`, localStorage keys, repo name, old design notes.

## v12.3 — A week with weight: balance pass (2026-10-23)
Tuned with the harness (`tools/balance/out/v12.3.json`, 400 weeks). Before → after for the "balanced" bot (sensible play: write in the mornings, people in the afternoons, home around 19:00):
- Grade: S every week → **median B, A in 37% of weeks** (bands now S 92 / A 84 / B 60 / C 46).
- Grant funded: 100% → **82%** (60% in a career's first five weeks); pass mark **70** (priority 82), reviewer noise ±10.
- Sunday wellbeing: 100 → **70**. A working day now wears you down (0.04 a minute), an evening at home gives +10, a good night's recovery +6. **Sunday wellbeing under 40 costs grade points** (0.4 each), shown in the week's metrics.
- KPIs: all six at 100 by Tuesday → **about 65**. Gains are scaled (×0.4), shrink above 50, and every KPI slides 5% back toward 50 each night.
- People-first play (the mentor bot) keeps students at trust 98 and wins most grants and papers, but ends the week at wellbeing ~20 and grades B. Grinding alone (never home, only urgent events) still grades D: grants need people.
- Fix: a good lifetime fit (the Monday mini game) now adds the paper's 关键结果 stars it always promised.
- The invite list shows a student's trust as "信任 +6（现在 50）".
- Harness: bots vary their choices and their leaving time, so careers differ (before, careers with the same week number played identically); bots hold a submission until the dossier is good or it is the deadline day; the report shows review scores and the KPI average.

## v12.2 — Lunch with someone / 约人 (2026-10-23)
- **Invite someone.** At lunch and dinner the canteen asks "叫谁一起？": 小陈, 小周, 小雨, 小林 or 赵博士, whoever is free (not waiting for you somewhere, not in crisis, not already invited today). You pay (¥45), the meal takes 10 minutes longer, and their trust rises (+6, ×1.5 on a students-first day).
- **Table talks / 饭桌上说的话.** Sixteen two- or three-choice conversations that only happen at the table (about a third of shared meals, a quarter of café coffees with 赵博士): 小周 might not do a PhD, 小林 skipped a gas-cylinder check, 小陈 found a bug in the fit that is already in your grant, 赵博士 has an industry offer… Each happens once per career, and what you said comes back in their memory lines later in the week. Written in 中文 and English.
- **Rooftop café with company.** 赵博士 (your next writing block starts in flow), 化学系陈老师 on Tue/Thu (+1 star on the collaboration letter, once a week), 王老师 (fixes one reimbursement, or gives office tasks an extra hour). ¥28 for their cup.
- **Garden.** A 20-minute walk alone before the grant is in gives an idea (+1 创新点 star when you next sit down to write it); from 19:00 you can walk and phone 阿玲 instead (阿玲 +3).
- **Week's end: "你的一周".** Who you spent time with, what was said at the table, how many meals you ate alone, and the first day you ran low on energy.
- Content: `assets/data/content/table.json` (places, people, perks, talks). The validator checks it, and now also catches narration that would show as a speaker ("小陈放下筷子：…").
- Tests: `tools/e2e/companion.mjs`; the balance bots invite people (mentor: every meal; balanced: a student whose trust is under 75, the café on weekdays).

## v12.1 — Content as data (2026-10-23)
- **The week is data now.** The 136 scripted events, the quick messages, admin, academy, money and home scenes, the students and their memory lines, the days and intentions, science cards, achievements and the lecture quiz moved out of `index.html` into `assets/data/content/` (week, events, people, calendar, codex). `index.html` is ~790 lines shorter.
- **Same game, proven:** 120 harness weeks (3 careers × 10 weeks × 4 policies) match the v12.0 baseline row for row (`tools/balance/compare.mjs`).
- `tools/validate-data.mjs` checks every event's shape, fx tokens, hotspots, flags (every `req` must be set somewhere), cards, achievements and follow-on activities. Run `node tools/validate-data.mjs` after editing content.
- Text in content files may be a plain string or `{ "zh": …, "en": …, "ja": …, "ms": … }`; the language comes from `localStorage prof-lang` (default 中文, which is also the fallback). The HUD itself is not translated yet.
- Starting, continuing, the next week and loading a slot wait for the content; if it fails to load (offline), a banner offers a retry.
- Fix: the player character is reused each morning instead of rebuilt (a new one every day leaked meshes and textures over a long career).

## v12.0 — Balance harness (2026-10-23)
- **Bots play the game.** With `?sim` in the URL nothing renders and the week runs on the real rules, driven by `tools/balance/agent.js`. Four policies: grinder (grant first, never home), mentor (students first), balanced (the intended play) and random.
- `cd tools/e2e && WEEKS=10 RUNS=10 node run.mjs balance.mjs` plays 10 careers of 10 weeks per policy and prints the design note's table; `tools/balance/out/baseline.json` is this version's result.
- **Baseline finding:** the week is too easy for sensible play. Balanced and mentor bots get S every week (100/100), fund every grant, go home every night and end on wellbeing ~100 with all six KPIs at 100. Only the grinder (D, wellbeing 0, students lost) and random play struggle; the paper is never accepted as is. v12.3 tunes this.

## v11.2 — Garden, café, football, world kitchens, folding HUD, new music (2026-10-23)
- **Botanical garden (6F): four climate zones**, one per corner, each signed: tropical rainforest (banana plants, monstera, tree ferns, bromeliads, orchids, a little mist), desert (saguaro, barrel cacti with yellow crowns, prickly pear with fruit, agave, rocks on rippled sand), temperate forest (oak, an autumn maple, a birch, ferns, foxgloves, moss, a fallen log with mushrooms) and alpine (granite boulders, dwarf pines, cushion plants, edelweiss, gentians, old snow) round the pond. `assets/js/garden.js`.
- **Rooftop café**: slatted oak cladding, pendant lamps, a chalkboard of the day's pour-overs, a lounge corner (sofas, rug, low table, lanterns) under a pergola with hanging plants, potted olives, and an art wall of three abstract canvases. The café always plays a relaxed jazz track.
- **Football pitch**: no more floating. The ball rolls along the ground with friction and is only chipped now and then; two teams of three run (not drift): the nearest player chases the ball and passes or shoots, the others keep their shape. A goal resets to the centre spot.
- **Canteen: world kitchens.** Six stalls along the back wall, from TasteAtlas's 2025/26 top-20 cuisines (Italy, Greece, Peru, Portugal, Spain, Japan, Türkiye, China, France, Indonesia, Mexico, Serbia, India, Poland, USA, Vietnam, Brazil, Croatia, South Korea, Lebanon). A different line-up and a different chef's signature every day; signs show rank, cuisine and today's dish. At lunch and dinner you choose a stall; a cuisine new to you this week gives a little more wellbeing. Breakfast rotates too. The 5F pantry keeps its everyday food. `assets/data/canteen.json`.
- **Folding HUD**: every box (你 · 值班教授, 今日表现, the clock, 待处理, the minimap) has a – / + button and folds to its header; H folds or unfolds all. Remembered in this browser; the performance box moves up under a folded player card.
- **Music**: a new sequencer with seven tracks, picked from the ♫ button: 清晨实验室 (102 BPM), 基金冲刺 (126), 缪子快跑 (142), 校园放克 (112), 槟城海风 (98), 天台咖啡 · 爵士 (84, swing), 安静夜晚 (70). "自动" changes track with the time of day (a new daytime track every two in-game hours). `assets/js/music.js`, `assets/data/music.json`.
- Tests: `tools/e2e/v112_shots.mjs` (garden, café, football, canteen, menu, folded HUD), `tools/e2e/music_render.mjs` (renders every track offline and reports levels).

## v11.1.1 — Fix (2026-10-23)
- Notices no longer cover the navigator chip on desktop: they now sit 8 px below it (or below the clock panel when the chip is hidden), wherever the panel has grown to. Test: `tools/e2e/toast_nav.mjs`.

## v11.1 — Realistic people, and a choice of art style (2026-10-23)
- **Art style setting: 写实 (realistic) or 微缩模型 (stylized diorama).** On the title page next to 画质, and in the top bar (tap twice; the page reloads, like the quality setting). Remembered in this browser. Realistic is the default.
  - Realistic: v11.0 real materials and HDRI lighting, plus the new realistic cast.
  - Diorama: the v10 look: chibi cast, procedural floors, glowing cyan trim and thresholds, navy slab, blue floor signs, tinted light pools.
- **Realistic cast** (Microsoft Rocketbox, MIT, see `assets/characters/real/LICENSE-Rocketbox.md`): all 21 named characters plus 8 generic extras who fill the lecture hall, corridors, campus and gym courts. Shared animation packs per gender (idle, walk, run, sit, type, talk, think, point, cheer, read, present and more), re-targeted by bone name; hip height scaled per body. Dialogue portraits baked from the same models.
- **Badminton** works with the realistic players at life size (racket in the palm, strokes posed on the Biped rig).
- Pipeline: `tools/rocketbox/` (cast.json, build.py, finish.mjs, pack.mjs, portrait.html; `tools/e2e/portraits.mjs`).
- Known limits: the library has few East Asian faces, so the cast is mixed; no facial expressions yet (portraits repeat one pose); seated people sit slightly off some chairs; racket grip still rough. About 50 MB of character assets, loaded per floor.

## v11.0 — Real materials on 5F (2026-10-22)
First step of the realistic look (design note `v11-realistic-look`: grounded realism, not photoreal). Characters are unchanged until v11.1.
- **Real floors on 5F** (Poly Haven, CC0, in `assets/textures/`): porcelain tiles in the corridor, pantry and washrooms, wood laminate in the offices, office carpet in the open offices and meeting rooms, grey epoxy in the muon lab and server room, terrazzo by the elevators. Patterns run continuously across rooms (UVs in world metres).
- **Walls everywhere**: clean paint over real plaster relief, a grey lower band and skirting, aluminium caps, anodised frames, clear glass, stainless thresholds.
- **Oak desks** (oak veneer with UVs projected from the kit geometry).
- **Real image-based lighting**: an office-interior HDRI indoors, a partly cloudy sky outdoors (the studio room stays as a fallback).
- **No more neon**: no glowing wall trim or door strips, a concrete slab edge, warm-white light pools, floor signs as grey printed vinyl.
- Credits: textures and HDRIs by Poly Haven (CC0).

## v10.4 — Sharp everywhere (2026-10-22)
The v10.3.1 badminton sharpness now applies to the whole game.
- **Render resolution**: supersampled on every screen (high: 1.5× on ordinary screens, up to 2× on Retina; mid: 1.25–1.5×). If the game runs below ~45 fps (averaged over 150 frames, after the first 8 s) it drops back to the old resolution and shadow size for the rest of the session.
- **No more edge blur while walking**: the tilt-shift "miniature" blur is off on the map, the overview and the title page. The dialogue two-shot keeps its depth of field. Film grain is off.
- **Textures**: every generated texture (floors, signs, posters, screens, slides, LED panels, name tags) is drawn at 2× (high) or 1.5× (mid), with the GPU's maximum anisotropic filtering, so floors and text stay crisp at an angle.
- **Shadows**: 4096² on high, 2048² on mid.

## v10.3.1 — Sharper badminton (2026-10-22)
- **Higher render resolution during matches**: supersampled even on 1× screens (high: 1.5–2×, mid: 1.25–1.6×), no tilt-shift blur and no film grain over the court. If a match runs below ~45 fps the extra resolution switches itself off.
- **Crisper shadows**: the shadow map covers only the match court and doubles in size (high 4096², mid 2048²) while a match is on.
- **Finer textures and models**: court 200 px/m (lines 8 px wide), 1024² floor boards, finer net mesh, max anisotropic filtering; smoother shuttle, posts, rings and racket, with a strung racket face.
- Smash label on a dark pill so it reads on the wooden floor. `tools/e2e/run.mjs` takes W, H, DPR for high-resolution captures.

## v10.3 — Badminton you can watch (2026-10-22)
Presentation pass modelled on a broadcast-style badminton game (reference video from Kim). Rules, timing and balance are unchanged.
- **Same gym, new camera.** Matches are still on court 2 of the gym, now rebuilt for a camera behind your baseline: window walls, courts 1 and 3 still in play beside you, the umpire's chair. Friday's 物理 vs 化学 fills a bleacher behind the far court with a cheering crowd, boards, banners and a live scoreboard.
- **Rackets and strokes.** Both players hold a racket and actually swing it: wind-up as the shuttle comes, overhead / side / underarm strokes by contact height, follow-through. Players are 1.2× bigger in matches.
- **Hit effects.** A flash ring at each contact, a floating label over the hitter ("杀球 184 km/h · 好球", "完美 高远球 · 拉吊四角"), a glowing trail, a yellow ring where you are running to. A perfect smash freezes for a beat, shakes the camera and throws speed lines. Racket sounds; the Friday crowd reacts to points.
- **HUD.** Score as two pills (the leader outlined); the timing ring is tighter for the closer camera.
- Tests: `tools/e2e/bm_venue.mjs`, `bm_fx.mjs` (steps the match in-page; headless WebGL is ~1 fps), `bm_mobile.mjs`, `bm_restore.mjs`, `swing.mjs`.

## v10.2 — Save and load (2026-10-22)
- **Resume where you stopped.** Besides the saves at the start and end of each day, the game now autosaves the day in progress every 20 seconds and whenever the tab is hidden or closed. "继续" on the title page brings you back to the same day, time, floor and spot, with the same events open, done or missed (before, it restarted the day at 08:00). Mid-dialog moments and badminton matches are not saved; the last save before them is used. Work you were doing (writing, a lecture) stops on load, its progress kept.
- **Three save slots** (存档 button in the top bar, or O): save, overwrite, load, delete. Loading a slot also restores the career it was saved with.
- **Export / import**: one JSON file with the autosave, the slots, the career and settings, for another browser or computer. Import asks before replacing.
- **Title page**: "读取存档" opens the same panel; "继续" shows the exact point, e.g. "第 1 周 · 周一 10:30 · 助理教授". Starting a new week asks before overwriting the autosave.
- Save format v6 (adds the optional mid-day snapshot); v5 saves load as before, at the start of their day.
- Fixes: the Monday tutorial hint no longer appears over the badminton score; long badminton pop-ups use a smaller font.
- Dev: `?debug` in the URL exposes a test hook; `tools/e2e/` runs headless browser checks (save → reload → continue, badminton screenshots).

## v10.1 — Badminton (2026-10-22)
Tag for the steps below. Also: DESIGN.md gains the badminton rules and balance table; "play it out" win chances re-fit to the final bot runs.

## v10.1-step7 — Badminton in the career (2026-10-22)
- **At court 2 you choose**: play a game to 7, let it play out (a win chance from your current energy, shown in the choice), or not play. The choice shows your energy and what it does to the timing window ("精力充沛 · 判定宽" … "很累 · 判定窄").
- **Friday's 物理 vs 化学 is now a real match**: the deciding singles against 小吴. Winning: team +3, reputation +3, wellbeing +2 and a log line; losing: reputation +1. Leaving mid-match counts as a loss. (Before, the result was written in: "你们 21:18 赢了第一局".)
- **Opponents remember**: a win/loss record per opponent this run (saved), shown in the choice, and a rematch line ("阿强：上次输给您之后，我回去练了一周反手。").
- **One-screen how-to** before your first match or drill (once per browser), reopened any time with the "?" button or the ? key. The match is frozen while it is open.

## v10.1-step6 — Opponents with a game plan (2026-10-22)
- Opponents now play patterns, set per opponent in `assets/data/badminton.json` (`tactics`): 拉吊四角 (move you front–back, away from where you stand), 压反手后场 (clears and lifts to your rear backhand), 杀后上网 (follow the smash in and kill the reply), 假动作变线 (a disguised shot: you start 0.15 s late, and the line changes to the side you are on).
- 小吴 plays 拉吊四角, your backhand and smash-and-follow. 阿强 only moves you around now and then.
- New opponent **阿杰**, an exchange postdoc from Penang (fictional): fast, China-jumps to meet the shuttle 0.4 m higher, heavy smashes (+10%), follows them in, and disguises about one shot in five. Hardest of the three.
- The review says which patterns the opponent used and which one won the most points from you, with the counter (for example: "对手压你反手后场：头顶区的来球用马来步转身，用正手回"). The trend line now covers your last 10 games.

## v10.1.1 — Fixes (2026-10-22)
- **Badminton courts follow the BWF Laws (Law 1).** The old texture was drawn sideways and squashed into a 6.6 m court. Now: 13.40 × 6.10 m, 40 mm lines counted inside the area they bound, singles sidelines 0.46 m in, short service lines 1.98 m from the net, doubles long service lines 0.76 m inside the back boundary, centre lines from the short service line to the back. Posts stand on the doubles sidelines at 1.55 m; the net is 6.1 m long, 760 mm deep, 1.524 m high at the centre (the match physics uses 1.524 m too).
- **Navigator chip no longer overlaps the clock panel** on desktop: it now sits 8 px below the panel, whatever the panel's height.

## v10.1-step5 — Badminton training (2026-10-22)
- "直接打一局羽毛球" on the title page now opens a small menu in the gym: play 阿强 or 小吴, or train. Nothing here touches the career save.
- **后场头顶区 (round-the-head corner)**: 10 feeds to your rear backhand corner, high-and-slow or flat-and-fast in a fixed mix. Points for a return that lands in (3/2/1 by timing) plus 2 for the right footwork: 马来步 on the slow ones, 中国跳 on the fast ones. The Malaysian step now needs 0.75 s to spare, so it genuinely fails on the fast feeds.
- **接杀 (smash defence)**: 10 smashes to your left, right and body. Points for getting it back in, plus 1 for a block to the net or a lift to the back.
- After each set: score, ball-by-ball marks, footwork choices, average timing offset, one tip from `assets/data/badminton-drills.json`, and your best score (kept in this browser).

## v10.1-step4 — Rear-court footwork: 马来步 and 中国跳 (2026-10-22)
Definitions follow the VICTOR coaching article (Sohu, 2020): the difference is whether the body turns.
- **Default (并步)**: a round-the-head ball on your backhand side drops one grade and smashes softer.
- **马来步 (Malaysian step)**: hold your finger still for a moment, then swipe (keyboard: K, then the shot). You turn and take the round-the-head ball on the forehand: no downgrade, smash +15%. It needs time: with less than 0.75 s to spare, "转身来不及" and the shot drops two grades. On the forehand rear corner the turn is wasted.
- **中国跳 (China jump)**: double-tap, then swipe (keyboard: L). No turn, one-foot take-off: you meet the shuttle earlier and higher (the ring re-plans), smash +10%. Each jump costs 2 energy; below 40 energy a landing can go wrong (30%) and you react late on the next ball.
- You have to set your feet at least 0.25 s before contact, and only for rear-court balls; the hint line tells you when one is coming.
- Animation: the China jump goes straight up, the Malaysian step turns a quarter toward the backhand and jumps lower.
- The review counts both and adds findings/cues for turning without time and jumping on tired legs.

## v10.1-step3 — Badminton: placement, tactics and the post-match review (2026-10-22)
- **Choose the corner.** Diagonal swipes pick the side: up-left / up-right clear to a rear corner, down-left / down-right drop to a front corner; straight up or down still plays to the open space. Keyboard: Q/E and Z/C. Tap with the shuttle overhead is still the smash.
- **Every shot gets a tactical tag** from `assets/data/badminton-tactics.json`: 拉吊四角, 打空档, 被动过渡, 冒险进攻 (forcing a smash from the baseline off balance), 攻反手后场, 杀后上网. The tag shows next to "完美 / 好球".
- **Every rally is classified**: your winner, opponent's winner (you could not reach it), unforced error (no pressure, still net or out), forced error, or a timing miss (early/late). Swing timing is recorded to the millisecond.
- **Post-match review** (quick play and career): one headline finding, a court map of where every shot landed (green your winners, red your errors, amber the opponent's winners), the numbers (winners, unforced/forced errors, average timing offset and spread, longest rally), two coaching cues, and the trend over your last 5 games (kept in this browser only, not in the save). In a career the clock waits until you press 继续.

## v10.0-step2.1 — Quick badminton from the title page (2026-10-22)
- Title page: "直接打一局羽毛球" goes straight to court 2 for a game to 7 against 阿强, without starting a career. Nothing is saved; your career save is untouched.
- After the game: play again, switch opponent (阿强 casual, or 小吴, chemistry postdoc and varsity player), or go back to the title page.
- 小吴 now exists in the gym (hidden until she plays); 阿强 steps to the sideline while she is on court.

## v10.0-step2 — Badminton feel (2026-10-22)
- Timing ring at your feet: the outer ring closes onto the inner one at the ideal moment. Amber = in time, green = good, both rings green = perfect. Red = you will not get there.
- The shuttle casts a shadow straight down (smaller and fainter the higher it is), so you can read depth, and leaves a short trail that turns amber at smash speed.
- Perfect hits throw sparks; when a rally ends, a ring on the floor marks where the shuttle landed (green in, red out or net).
- While a shot is coming the player turns slightly toward it.

## v9.0.6 — Fix (2026-10-22)
- Floor signs point where they say. Every sign had a pointed end facing east whatever was there (物理楼 · 正门 pointed along the road, not at the door). Signs now carry an arrow only when they name a place nearby: room signs in the 5F corridor and on 2F point to their door, entrance and exit signs to the door, elevator signs to the elevator. Title plates (物理楼 5F, 书库, 阅览区…) have no arrow. The "→" in the English subtitles is gone too.

## v10.0-step1 — Badminton you actually play (2026-10-22)
- Court 2 in the gym: press E to play a game to 7 against 阿强 instead of a 30-minute fast-forward. Movement is automatic; you only swing. Swipe (or drag with the mouse) up for a clear, down for a drop or net shot, left/right for a drive, tap when it is overhead to smash. Keyboard: W/S/A/D and Space. Esc or "退出比赛" leaves.
- Real shuttle flight: quadratic drag with a 6.8 m/s terminal speed, so clears rise and then fall almost straight down; shots that hit the tape drop on the hitter's side.
- The clock stops during the match; the result is followed by the usual 30-minute badminton activity and its effects.
- New files: `assets/js/badminton.js` (physics, rules, AI; no rendering), `assets/data/badminton.json` (shots, timing windows, opponents, lines in 中文/English), `tools/bm_balance.js` (bot balance runs: `node tools/bm_balance.js 200`).

## v9.0.5 — Fix (2026-10-22)
- Elevator: 1F was missing from the list. Dialogs bottom-aligned their choices in a way that pushed overflow above the top of the scroll area, so when a dialog had more choices than fit (the elevator has 8), the first ones could not be reached. Choices now scroll normally in every dialog, and the elevator shows its floors in two columns so all of them fit.

## v9.0.4 — Fix (2026-10-22)
- Floor flicker, the actual cause: every floor sits on a dark slab whose top face was at exactly the floor's height, so the two surfaces fought pixel by pixel every frame (white tile vs grey-blue slab). The slab now sits 3 cm lower. The v9.0.3 shadow change stays: it removes a smaller shimmer of shadow edges.

## v9.0.3 — Fix (2026-10-22)
- Floor no longer flickers between white and grey while you walk or as the clock runs. The real cause was the sun's shadow, not the floor: the shadow map followed the player continuously and the sun angle changed every in-game minute, so wall shadows crawled across the floor. The sun now moves in 20-minute steps and the shadow map shifts only in whole texels.

## v9.0.2 — Fix (2026-10-22)
- Floor tiles no longer flicker on 中/高 quality. Post-processing rendered into buffers with 16-bit depth (three r128's default), too coarse at our camera distance to separate floor layers laid 4–7 mm above the base floor. The buffers now request 24-bit depth, and raised floor layers use a polygon offset so they always draw on top.
- Desktop: the Performance card moved down so it no longer hides the ¥ line under the vitals.

## v9.0.1 — Fix (2026-10-22)
- The ring that marks where you clicked now fades and disappears. It was attached to the floor but removed from the scene root (a no-op), and its material was not transparent, so the fade never showed and the ring stayed on the floor.

## v9.0 — Money / 钱：工资、房贷与时间 (2026-10-22)
- One game week = one financial month. Sunday's review adds a **monthly statement**: salary by title (¥30/35/40/45/50万 a year, shown as take-home), post allowance, 阿玲's pay, quarterly bonus, side income; then household costs, mortgage (net of 公积金), car loan, rent, interest.
- **Setup** gains two choices: buy (¥500万 flat, ¥350万 mortgage) or rent a talent flat (lease ends week 12 → buy or renew); drive (car loan) or metro (08:20 start, but every two days of reading on the train adds an Idea star; taxi ¥120 when you need 08:00).
- **Money buys time or meters**: takeout at the desk (¥45), housekeeper (¥2,500/month → no household drift), tutoring (¥2,500/month → child drifts half as fast, −3 a month), flowers on the way home (¥300, 阿玲 +4, once a week).
- **Money costs time**: review panels (afternoon, ¥3,000), evening industry talks (¥5,000, family meters drop), 横向 consulting (¥2万, Thursday meeting, research −2; conflict-of-interest scene if you hold a post), a popular-science book advance (¥3万).
- **Two wallets**: 课题经费 pays students' stipends and never the mortgage. Booking a dinner to the grant saves ¥800 now; each one has a 15% monthly audit chance (refund ×2, integrity −8).
- Household shocks (water heater, braces, car scrape, parent's hospital deposit, fee rise), at most one a month.
- No game over: below −¥3万 or a bounced mortgage brings the bank's call; two bounced months in a row bring the choice to sell the car or take consulting.
- 特聘教授 安家费 (¥50万) is housing-only: it prepays the mortgage (月供 drops ~¥2,100) or is kept for the down payment.
- HUD shows your money and the grant fund; the planner shows this month's margin and the monthly levers (Monday only).
- Saves v5 / career v3: older careers start on the default household with loans paid down for the weeks already played.
- Fix: the tutorial hint no longer squeezes into a one-character column on phones.

## v8.1 — Navigator / 我在哪 (2026-10-22)
- "You are here" chip on screen at all times: building · floor › room, plus how many tasks wait on other floors. Desktop: under the clock. Phone: between the joystick and the E button (the minimap is hidden on phones).
- Tap the chip or press **N**: a whole-campus sheet lists the building floor by floor (R → 1F), the campus and the gym, with pending tasks per place, walking minutes from where you stand, and a "去这里" button that walks you there (elevator time counts). The clock pauses while it is open; Esc or N closes it.
