# DESIGN — 教授的一周 / A Professor's Week

Living summary of the systems in the build. Full design notes (goal, player experience, data, edge cases, playtest questions) live in the claude.ai project under `design-notes/`.

## Systems and where they live in `index.html`
| Version | System | Data tables | Logic |
|---|---|---|---|
| v6 | Home block, dossier stars, Monday tutorial | `DOSSIER`, `FAMILY`, `HOME_SCENES`, `TUTORIAL` | `goHome`, `familyEvents`, `addStar`, `dossierScore` |
| v8 | Career ladder: titles, posts, academy election | `RANKS`, `POSTS`, `ACADEMY`, `ADMIN_EVENTS`, `ACADEMY_EVENTS` | `promote`, `careerEvents`, `academyVote` |
| v8.1 | Navigator | `NAV`, `NAV_ANCHOR` | `renderNavChip`, `toggleNav` |
| v9 | Money | `FIN`, `FIN_EVENTS` | `finSettle`, `financeEvents`, `finFlag`, `finPlannerRow` |
| v10.2 | Saves: autosave mid-day, 3 slots, export/import | `SAVE_KEY`, `SLOT_KEYS`, `PERSIST`, `SNAP_SKIP` | `saveGame(mid)`, `savePayload`, `continueGame`, `resumeMid`, `renderSaveSheet`, `exportSaves`, `importSaves` |
| v10 / v10.1 | Badminton: match, footwork, tactics, review, drills | `assets/data/badminton.json`, `badminton-tactics.json`, `badminton-drills.json` | core `assets/js/badminton.js` (`BMCore`, `BMCore.review`, `BMCore.drillReview`); UI in `index.html` (`bmOffer`, `bmStart`, `bmFrame`, `bmVisuals`, `bmEnd`, `quickMenu`, `drillEnd`) |
| v10.3 | Badminton presentation: match venue, broadcast camera, rackets and strokes, hit effects | `assets/data/badminton.json` (`venue`) | venue `assets/js/bm-venue.js` (`BMVenue.build`); UI in `index.html` (`bmVenueOn/Off`, `bmPoseArms`, `bmRig`, `bmLabel`, `bmFlash`, `bmThock`) |

## v9 Money — rules in one place
- 1 game week = 1 financial month; statement at Sunday 23:59 (`finSettle`).
- Salary by title (gross → take-home): 30万 → ¥18,910 · 35万 → ¥21,660 · 40万 → ¥24,410 · 45万 → ¥27,190 · 50万 → ¥30,310. 公积金 (both sides) only pays the mortgage.
- Posts: +¥3,000 / +¥6,000. Partner ¥12,000. Bonus every 4 weeks, 0–¥3万 by KPI average.
- Buy start: ¥350万 loan, 30 yr, 3.1% → ¥14,946/month. Car: ¥15万, 36 months, 3.5% → ¥4,395. Rent start: ¥4,500, lease 12 weeks, renew +15% or buy (down ¥150万; 安家费 first, then savings, then parents at partner −8).
- Credit line ¥5万: beyond it the mortgage bounces. Bank call below −¥3万 or on a bounce; two bounces → sell car / take consulting.
- Grant fund separate: starts ¥30万, stipends ¥1.5万/month, funded grant +¥40万.
- Money never raises the weekly grade directly.

## Balance (ledger-only runs, 12 weeks, v8 promotion pace)
| Profile | W1 | W6 | W12 |
|---|---|---|---|
| Buy + car, careful (¥4k spend, ¥3k side income) | ¥8.1万 | ¥12.8万 | ¥23.4万 |
| Buy + metro, careful | ¥8.6万 | ¥15.7万 | ¥29.3万 |
| Rent + car, careful | ¥8.8万 | ¥16.2万 | ¥28.7万 |
| Buy + car, unlucky (¥1.5万 shocks monthly, no side income) | ¥6.7万 | ¥3.9万 | ¥5.1万 |
| Buy + car, grinder (consulting every month) | ¥10.6万 | ¥27.5万 | ¥52.5万 |

## v10 / v10.1 Badminton — rules in one place
- Court 2 in the gym, BWF Law 1 geometry: 13.40 × 6.10 m, singles sidelines 0.46 m in, short service 1.98 m, net 1.524 m at the centre. Rally scoring to 7, win by 2, cap 9.
- Shuttle: quadratic drag, terminal speed 6.8 m/s (k = 0.212). Shots aim at a landing point; the solver finds speed (or, for a smash, the angle) and lifts the angle until the intended shot clears the tape by 0.22 m; execution error then grows with worse timing.
- Movement is automatic. The receiver plans the earliest reachable contact (height 0.25–2.65 m); the margin (time to spare) drives quality, footwork and the unforced/forced split.
- Timing windows by energy: ≥70: perfect ±110 ms, good ±200, fair ±300; ≥40: 80/160/250; below: 50/110/190. Player running speed also falls with energy.
- Footwork (rear court only, set ≥0.25 s before contact): default → round-the-head ball one grade down; 马来步 needs ≥0.75 s margin (else two grades down), smash +15%; 中国跳 replans contact 0.45 m higher and 0.25 m further, smash +10%, 2 energy each, below 40 energy 30% shaky landing (+0.2 s reaction next ball).
- Unforced error = net/out with margin ≥0.25 s and an incoming shuttle slower than 22 m/s.
- Career: play / play it out (`autoWin`, a little below the bot results) / don't. Friday 13:00 deciding singles vs 小吴: win team +3, rep +3, wellbeing +2. The usual 30-minute badminton activity follows either way. Records per opponent in `S.bm` (save).
- Quick play and drills from the title page never save; review history and drill bests are kept in localStorage only.

### Balance (bot, timing noise σ = 85 ms, no footwork, 80 games per cell — `node tools/bm_balance.js 80`)
| Opponent | energy 95 | 70 | 50 | 25 |
|---|---|---|---|---|
| 阿强 | 88% | 79% | 59% | 29% |
| 小吴 | 63% | 43% | 43% | 18% |
| 阿杰 | 45% | 39% | 25% | 13% |

Games last about 2 minutes (84–138 s). Energy 95 vs 25 is a 32–59 point swing in win rate, which meets the design target of 25–40 points for 小吴 and 阿杰 and exceeds it for 阿强.

## v10.3 Badminton presentation — how it works
- **Same gym, rebuilt for the camera.** While a match is on (and on the quick-play menu), the gym zone is hidden and `BMVenue` shows court 2 of the same gym at the same world coordinates: window walls on three sides, courts 1 and 3 still in use (their players and shuttles are borrowed from the zone and returned), umpire's chair, benches. Friday's 物理 vs 化学 adds bleachers with a crowd, boards, banners and a live scoreboard (`setEvent`). No ceiling: the camera sits above the roof line, as in the diorama view.
- **Broadcast camera.** Behind the player's baseline, 46° lens (40° in portrait), framing fitted to the reference video (far baseline ≈ 30 % from the top, net ≈ 45 %, near baseline ≈ 92 %); drifts 30 % with the player; cuts rather than flies in. Fixed afternoon light and a punchier grade in the venue; bloom held back so the floor does not haze.
- **Players.** 1.2× during matches; a racket in the right hand; arms posed over the clip each frame by world-space aiming of upper arm, forearm and the free arm: wind-up as the shuttle comes in (type from predicted contact height), stroke at contact, follow-through, release. Overhead > 1.75 m, underarm < 0.95 m and serves, side otherwise. The GLB hand prop (a book) is scaled away.
- **Feedback.** Contact flash ring; floating label over the hitter (your quality, shot, tactic tag, footwork; smashes show km/h from launch speed); ribbon trail (amber at smash speed); yellow ring at your run target. Perfect smash: 70 ms hit-stop, shake, speed lines. Central pop text is kept for misses, points and match messages.
- **Sharpness (v10.3.1).** While the venue is on: pixel ratio boosted (`PR_BOOST`, high 1.5–2×, mid 1.25–1.6×), tilt-shift and grain off, shadow camera ±11 m with a 4096² (high) / 2048² (mid) map. Falls back to normal resolution if the 150-frame average is below 45 fps.
- **Rules untouched.** `badminton.js` is unchanged; balance numbers below still hold.

## v10.4 Sharpness — how it works
- `PR()` returns a supersampled pixel ratio while `PR_BOOST` is on (high: 1.5 on 1× screens, device ratio up to 2 otherwise; mid: 1.25–1.5). `resize()` keys on size and ratio, so a change applies on the next frame.
- `canvasTex` draws at `TEX_SS` (2 high, 1.5 mid, capped at 4096 px) by scaling the 2D context; draw and redraw code keeps logical coordinates. Name tags do the same. Anisotropy = GPU max (≤ 16).
- `sharpShadows(true)`: 4096² / 2048² sun shadow map. Tilt-shift only in the dialogue camera; grain 0.
- Fallback: after 8 s, if the 150-frame mean frame time is above 1/45 s, `PR_BOOST` turns off and shadows go back to 2048² / 1024² until reload. The quality menu (高/中/低) still works as before on top of this.

## v10.2 Saves — how a mid-day save works
- Day boundaries store `PERSIST` only (as before). During a day, `saveGame(true)` also stores `mid`: the whole state minus 3D objects, dialogs and activities (`SNAP_SKIP`), the zone and the player's position, and `dayBase` (the state captured at the start of the day, before its events were built).
- On load, `resumeMid` rebuilds the day's events from `dayBase` with `buildDay` (so data-driven events get their functions back), then copies each saved event's scalar fields (state, deadline, …) onto it. Events created during the day that the rebuild does not produce are restored from the save as plain data.
- Autosave: every 20 s of real time when not in a dialog or a match, and on `visibilitychange`/`pagehide`. Quick play never saves.
