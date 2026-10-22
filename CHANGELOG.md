# Changelog

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
