# Changelog

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
