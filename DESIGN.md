# DESIGN — 教授的一周 / A Professor's Week

Living summary of the systems in the build. Full design notes (goal, player experience, data, edge cases, playtest questions) live in the claude.ai project under `design-notes/`.

## Systems and where they live in `index.html`
| Version | System | Data tables | Logic |
|---|---|---|---|
| v6 | Home block, dossier stars, Monday tutorial | `DOSSIER`, `FAMILY`, `HOME_SCENES`, `TUTORIAL` | `goHome`, `familyEvents`, `addStar`, `dossierScore` |
| v8 | Career ladder: titles, posts, academy election | `RANKS`, `POSTS`, `ACADEMY`, `ADMIN_EVENTS`, `ACADEMY_EVENTS` | `promote`, `careerEvents`, `academyVote` |
| v8.1 | Navigator | `NAV`, `NAV_ANCHOR` | `renderNavChip`, `toggleNav` |
| v9 | Money | `FIN`, `FIN_EVENTS` | `finSettle`, `financeEvents`, `finFlag`, `finPlannerRow` |

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
