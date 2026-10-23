// Bug hunt: opens every panel and dialog in a rendered session and reports page errors and thrown calls.
export default async ({ page, sleep, logs }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  const errs = []; page.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));
  await page.goto(`http://localhost:${process.env.PORT || 8123}/index.html?debug`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready'), { timeout: 120000 });
  const tryCall = async (label, code) => { const r = await ev(`(() => { try { ${code}; return 'ok'; } catch (e) { return 'THROW ' + String(e).slice(0, 160); } })()`); if (r !== 'ok') errs.push(label + ': ' + r); await sleep(250); };
  // title-screen panels
  await tryCall('openAI', `openAI()`); await tryCall('closeAI', `document.querySelectorAll('#aiSheet .close, #aiClose, [data-close]').forEach(b => b.click())`);
  await tryCall('toggleSave', `toggleSave()`); await tryCall('toggleSave2', `toggleSave()`);
  await tryCall('renderSetup', `renderSetup()`);
  await ev(`(() => { localStorage.clear(); setup.mode = 'basic'; startGame(); return 1; })()`); await sleep(1500);
  await tryCall('showPlanner', `showPlanner(0)`);
  await ev(`beginDay(0, INTENTS[0].id)`); await sleep(2500);
  await tryCall('tutorial hide', `if (typeof TUT !== 'undefined') TUT.done.all = true; tutHide()`);
  await tryCall('openDesk', `openDesk()`); await tryCall('closeDialog', `closeDialog()`);
  await tryCall('toggleNav', `toggleNav()`); await tryCall('toggleNav2', `toggleNav()`);
  await tryCall('togglePause', `togglePause()`); await tryCall('togglePause2', `togglePause()`);
  await tryCall('toggleOverview', `toggleOverview(true)`); await tryCall('toggleOverview2', `toggleOverview(false)`);
  await tryCall('showQuickMenu', `showQuickMenu()`); await tryCall('closeQuick', `closeDialog()`);
  await tryCall('openElevator', `openElevator()`); await tryCall('closeElevator', `closeDialog()`);
  for (const z of ['f1', 'f2', 'f3', 'f4', 'f6', 'roof', 'campus', 'gym', 'f5']) { await tryCall('zone ' + z, `setZone('${z}'); player.position.set(ZONES['${z}'].spawn.x, 0, ZONES['${z}'].spawn.z)`); await sleep(600); }
  await tryCall('canteen', `S.t = hm(12, 10); setZone('f1'); canteenMenu()`); await tryCall('close canteen', `closeDialog()`);
  await tryCall('roofcafe', `setZone('roof'); openRoofCafe()`); await tryCall('close cafe', `closeDialog()`);
  await tryCall('garden', `setZone('f6'); openGarden()`); await tryCall('close garden', `closeDialog()`);
  await tryCall('confirmHome', `S.t = hm(19); confirmHome()`); await tryCall('close home', `closeDialog()`);
  await tryCall('first event', `const e = S.events.find(x => x.state === 'active'); if (e) openDialog(e)`); await tryCall('pick 1', `if (S.dialog && S.dialog.choices && S.dialog.choices.length) pick(S.dialog.choices[0])`); await tryCall('close ev', `if (S.dialog) closeDialog()`);
  await tryCall('renderHUD', `renderHUD(); renderQuests(); renderXP(); renderBlocks && renderBlocks()`);
  await tryCall('saveGame', `saveGame(true)`); await tryCall('renderSaveSheet', `renderSaveSheet()`);
  await tryCall('dossier', `openDesk(); if (S.dialog && S.dialog.choices) { const c = S.dialog.choices.find(x => /申请书|论文/.test(x.t)); if (c) pick(c); }`); await tryCall('close dossier', `while (S.dialog) closeDialog()`);
  await tryCall('endDay', `endDay('home')`); await sleep(1500);
  await tryCall('showDaySummary', `typeof showDaySummary === 'function' && showDaySummary()`);
  await tryCall('startDay1', `startDay(1)`); await sleep(1500);
  await tryCall('lang en', `localStorage.setItem('prof-lang', 'en')`);
  console.log('SWEEP errors', errs.length); errs.slice(0, 20).forEach((e) => console.log(' - ' + e));
  console.log('PAGEERRORS', logs.filter((l) => /pageerror/.test(l)).slice(0, 8).join('\n') || 'none');
};
