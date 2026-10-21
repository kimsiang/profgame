# Changelog

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
