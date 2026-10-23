/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   MAIN LOOP
   ========================================================= */
const clock = { last: performance.now(), hud: 0, led: 0, muon: 0, dust: 0, steam: 0, map: 0, slide: 0, slideI: 0, fps: [], fpsChecked: false };
const CC = (h) => new THREE.Color(h);
const SKY = { dayTop: CC('#2a6fa8'), dayMid: CC('#a9d3ee'), dayBot: CC('#16405f'), duskTop: CC('#253a6b'), duskMid: CC('#f0a26a'), duskBot: CC('#1a1f3a'), nightTop: CC('#040c1a'), nightMid: CC('#0d2340'), nightBot: CC('#02060c') };
const tmp1 = new THREE.Color(), tmp2 = new THREE.Color(), tmp3 = new THREE.Color();
/* Stable sun shadows (v9.0.3). Shadow edges on the floor shimmered (floor flipping white/grey) for two reasons:
   1) the sun's direction was recomputed from the clock every frame, so every shadow edge crept a fraction of a texel;
   2) the shadow camera followed the player continuously, so the shadow-map grid slid under the floor.
   Fix: the sun direction moves in 20-minute steps, and the light is moved only in whole shadow-map texels. */
const SUN_STEP = 20;   // in-game minutes between sun-direction updates
const sunLX = new THREE.Vector3(), sunLY = new THREE.Vector3(), sunLZ = new THREE.Vector3(), sunOff = new THREE.Vector3(), sunT = new THREE.Vector3();
function placeSun(t, f, sc) {
  const tq = Math.round(t / SUN_STEP) * SUN_STEP;
  const fq = tq < hm(16, 30) ? 1 : tq < hm(19, 30) ? 1 - (tq - hm(16, 30)) / 180 : 0;
  const sunAz = 0.4 + (tq - 480) / 960 * 2.2;
  sunOff.set(Math.cos(sunAz) * 30, 14 + 30 * fq, -18 + Math.sin(sunAz) * 8);
  // Light-space axes, matching the shadow camera's lookAt (camera at target + sunOff, looking at target, world up).
  sunLZ.copy(sunOff).normalize();
  sunLX.set(0, 1, 0).cross(sunLZ).normalize();
  sunLY.copy(sunLZ).cross(sunLX);
  const ms = sun.shadow.mapSize, tx = (2 * sc) / ms.x, ty = (1.7 * sc) / ms.y;   // world size of one shadow texel
  sunT.copy(camState.target);
  const px = sunT.dot(sunLX), py = sunT.dot(sunLY);
  sunT.addScaledVector(sunLX, Math.round(px / tx) * tx - px).addScaledVector(sunLY, Math.round(py / ty) * ty - py);
  sun.target.position.copy(sunT);
  sun.position.copy(sunT).add(sunOff);
}
function lighting(t, now) {
  const f = t < hm(16, 30) ? 1 : t < hm(19, 30) ? 1 - (t - hm(16, 30)) / 180 : 0;
  const dusk = Math.max(0, 1 - Math.abs(t - hm(18)) / 70);
  const sc = BMV.cur ? 11 : (camState.overview || !S || !S.running) ? Math.max(26, Z.W * 0.62) : (Z.outdoor ? 30 : 15);   // v11.4: 30 outdoors so the physics building's shadow fits; v10.3.1: the match court only, so shadow texels are ~2× denser if (sun.shadow.camera.right !== sc) { Object.assign(sun.shadow.camera, { left: -sc, right: sc, top: sc * 0.85, bottom: -sc * 0.85 }); sun.shadow.camera.updateProjectionMatrix(); }
  placeSun(t, f, sc);
  sun.intensity = 0.1 + 1.1 * f;
  sun.color.setRGB(1, 0.92 - dusk * 0.25, 0.82 - dusk * 0.4);
  hemi.intensity = 0.07 + 0.33 * f; amb.intensity = 0.06 + (1 - f) * 0.05;
  tmp1.copy(SKY.nightTop).lerp(SKY.dayTop, f).lerp(SKY.duskTop, dusk * 0.7); skyUni.top.value.copy(tmp1);
  tmp2.copy(SKY.nightMid).lerp(SKY.dayMid, f).lerp(SKY.duskMid, dusk * 0.8); skyUni.mid.value.copy(tmp2);
  tmp3.copy(SKY.nightBot).lerp(SKY.dayBot, f).lerp(SKY.duskBot, dusk * 0.5); skyUni.bot.value.copy(tmp3);
  scene.fog.color.copy(tmp2).lerp(tmp3, 0.5);
  stars.material.opacity = (1 - f) * 0.9;
  const night = 1 - f;
  const envK = Math.round((0.18 + 0.82 * f) * 50) / 50;
  if (envK !== lighting.envK) { lighting.envK = envK; Object.values(matCache).forEach(m => { if (m.userData_base === undefined) m.userData_base = m.envMapIntensity; m.envMapIntensity = m.userData_base * envK; }); }
  lamps.forEach(l => { l.intensity = 0.2 + night * 2.1; });
  lightPools.forEach(p => { p.m.material.opacity = p.base * (0.6 + night * 2.2); });
  city.forEach(b => { b.material.emissiveIntensity = 0.15 + night * 1.6; });
  FACADES.forEach(f => f.night(night));
  streetLights.material.opacity = 0.2 + night * 0.8;
  // v7: time-of-day grade. Cool blue morning, neutral noon, amber 17:00, teal-shadow night.
  const morn = Math.max(0, 1 - Math.abs(t - hm(8, 30)) / 120), warm = Math.max(0, 1 - Math.abs(t - hm(17, 15)) / 110);
  RIM.value.setRGB(1 + warm * 0.1, 0.88 - night * 0.25 + warm * 0.02, 0.72 - warm * 0.2 + night * 0.4);
  if (post.grade) { const u = post.grade.uniforms; u.exposure.value = 0.92 + night * 0.12; u.tint.value.set(1 + warm * 0.09 - morn * 0.03 - night * 0.06, 1 + warm * 0.01 - night * 0.02, 1 - warm * 0.12 + morn * 0.06 + night * 0.12); u.sat.value = 1.08 + warm * 0.08 - night * 0.12; u.contrast.value = 1.05 + night * 0.06; u.vig.value = 0.55 + night * 0.15 + (camState.cine ? 0.2 : 0); }
  else renderer.toneMappingExposure = 1.0 + night * 0.1;
  const ln2 = S && S.events.find(e => e.id === 'ln2' && e.state === 'active');
  alarmLight.intensity = ln2 ? 2.4 + Math.sin(now * 0.012) * 2 : 0;
  o2.material.color.set(ln2 ? (Math.sin(now * 0.012) > 0 ? '#FF5A6E' : '#5a1a22') : '#3DDC97').multiplyScalar(2);
  const hv = S && S.events.find(e => e.id === 'hv' && e.state === 'active');
  hvLight.intensity = hv ? 1.8 + Math.sin(now * 0.02) * 1.2 : 0;
  return { ln2, hv, night };
}
const _want = new THREE.Vector3();
function frame(now) {
  if (SIM) return;   // the harness advances game time itself; no rendering
  const dt = Math.min(0.05, (now - clock.last) / 1000); clock.last = now;
  const tsec = now / 1000;
  if (S && S.running && !S.paused && !S.dialog && !S.ended && !BM.m) {
    const mult = S.activity ? S.activity.ff * S.speed : S.speed;
    let dm = dt * mult;
    while (dm > 0 && S.running && !S.ended && !S.dialog) { const d = Math.min(1, dm); minuteTick(d); dm -= d; }
  }
  if (S && S.running && !BM.m) movePlayer(dt);
  musicTick(dt);
  if (player) { animChar(player, tsec, dt); playerRing.position.set(player.position.x, 0.025, player.position.z); ringOut.rotation.z += dt * 1.5; ringIn.material.opacity = 0.6 + Math.sin(tsec * 4) * 0.25; playerRing.visible = player.visible && !(S && S.activity); }
  else playerRing.visible = false;
  if (Z.id === 'f5') Object.values(NPC).forEach(p => { if (p.visible && p.parent === F5.group) animChar(p, tsec, dt); });
  else Z.npcs.forEach(p => animChar(p, tsec, dt));
  if (BM.m) bmFrame(dt);
  Z.balls.forEach(b => { if (b.sim) return; if (!b.active) { b.m.position.y += (b.y - b.m.position.y) * 0.1; return; } b.t += dt; const u = (Math.sin(b.t * 1.4) + 1) / 2, h = Math.sin(((b.t * 1.4) % Math.PI)) ; b.m.position.set(b.from[0] + (b.to[0] - b.from[0]) * u, 0.3 + Math.abs(Math.sin(b.t * 1.4)) * (b.kind === 'soccer' ? 0.9 : 1.6), b.from[1] + (b.to[1] - b.from[1]) * u); });
  Z.anims.forEach(f => f(tsec));
  if (S && S.activity && S.activity.perFrame) S.activity.perFrame(tsec);
  const tt = S ? S.t : hm(17, 50);
  const evOn = (id) => S && S.events.find(e => e.id === id && e.state === 'active');
  const actIs = (type) => !!(S && S.activity && S.activity.type === type);
  crowd.visible = !S ? true : !!(evOn('lecture') || evOn('lecture_w') || actIs('lecture') || ((S.day === 0 || S.day === 2) && tt >= hm(9, 50) && tt < hm(11, 40)) || (S.day === 5 && tt >= hm(9, 50) && tt < hm(10, 50)));
  if (crowd.visible) crowd.children.forEach(p => animChar(p, tsec, dt));
  dean.visible = !S ? true : !!(evOn('meeting') || (actIs('meeting') && tt < hm(16)));
  reporter.visible = !!evOn('media');
  const mode = (S && (evOn('fnal') || ((actIs('meeting') || actIs('multitask')) && tt > hm(21)))) ? 'fnal' : (!S || evOn('meeting') || (actIs('meeting') && tt < hm(16))) ? 'dean' : 'idle';
  if (mode !== drawMeetScreen.last) { drawMeetScreen(mode); drawMeetScreen.last = mode; }
  if (actIs('lecture')) { clock.slide += dt; if (clock.slide > 2.5) { clock.slide = 0; drawSlide(++clock.slideI); } }
  if (Z.id === 'f5') walkers.forEach(w => {
    const u = w.p.userData;
    if (w.wait > 0) { w.wait -= dt; u.state = 'idle'; animChar(w.p, tsec, dt); return; }
    if (!w.path.length) { const s = walkerSpots[(Math.random() * walkerSpots.length) | 0]; w.path = astar(w.p.position.x, w.p.position.z, s[0], s[1]) || []; w.wait = 1 + Math.random() * 5; return; }
    const tg = w.path[0], d = Math.hypot(tg.x - w.p.position.x, tg.z - w.p.position.z);
    if (d < 0.1) { w.path.shift(); return; }
    const sp = 1.7 * dt; w.p.position.x += (tg.x - w.p.position.x) / d * sp; w.p.position.z += (tg.z - w.p.position.z) / d * sp;
    w.p.rotation.y = Math.atan2(tg.x - w.p.position.x, tg.z - w.p.position.z); u.state = 'walk'; animChar(w.p, tsec, dt);
  });
  if (S) S.events.forEach(ev => { if (ev.marker) { const u = ev.marker.userData; u.gem.rotation.y += dt * 2; u.gem.position.y = 2.55 + Math.sin(tsec * 3) * 0.1; const k = 1 + (tsec * 1.2 % 1) * 0.9; u.ring.scale.set(k, k, k); u.ring.material.opacity = 1 - (tsec * 1.2 % 1); u.beam.material.opacity = 0.4 + Math.sin(tsec * 4) * 0.12; } });
  for (let i = ripples.length - 1; i >= 0; i--) { const r = ripples[i]; r.t += dt; const k = 1 + r.t * 5; r.m.scale.set(k, k, k); r.m.material.opacity = Math.max(0, 1 - r.t * 1.6); if (r.t > 0.7) { if (r.m.parent) r.m.parent.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); ripples.splice(i, 1); } }   // the ring lives in its floor's group, not the scene root
  clock.led += dt;
  if (clock.led > 0.18 && Z.id === 'f5') { clock.led = 0; drawLeds(); if (Math.random() < 0.5) drawRack(); drawScope(tsec); drawHolo(tsec); }
  clock.muon += dt; if (clock.muon > 0.08 && !BMV.cur) { clock.muon = 0; spawnMuon(); }   // no muon tracks over the match court
  muonPool.forEach(m => { m.l.visible = !BMV.cur; if (m.life > 0) { m.life -= dt; m.l.material.opacity = Math.max(0, m.life / 0.4); } else m.l.material.opacity = 0; });
  detFlash = Math.max(0, detFlash - dt * 2.5);
  detSlabs.forEach((s, i) => { s.material.emissiveIntensity = 0.6 + detFlash * (3 - i * 0.4); });
  holo.rotation.y = Math.sin(tsec * 0.4) * 0.15;
  coffeeLed.visible = Math.sin(tsec * 3) > -0.6;
  clock.dust += dt;
  if (clock.dust > 0.05 && !BMV.cur) { clock.dust = 0; const c = camState.target; FX.dust.emit({ x: c.x + (Math.random() - 0.5) * 22, y: 0.3 + Math.random() * 2.4, z: c.z + (Math.random() - 0.5) * 16, vx: (Math.random() - 0.5) * 0.08, vy: (Math.random() - 0.3) * 0.05, vz: (Math.random() - 0.5) * 0.08, life: 6, max: 6, size: 0.05 + Math.random() * 0.05, a: 0.45, c: [1.4, 1.35, 1.2] }); }
  clock.steam += dt;
  if (clock.steam > 0.25) { clock.steam = 0; FX.steam.emit({ x: 27.6 + (Math.random() - 0.5) * 0.1, y: 1.1, z: 25.0, vx: (Math.random() - 0.5) * 0.05, vy: 0.35, vz: 0, life: 2.2, max: 2.2, size: 0.12, grow: 0.25, a: 0.35, c: [1, 1, 1] }); FX.steam.emit({ x: 2.2, y: 0.5, z: 9.9, vy: 0.3, life: 1.8, max: 1.8, size: 0.08, grow: 0.15, a: 0.25, c: [1, 1, 1] }); }
  const L = lighting(BMV.cur ? hm(15, 0) : tt, now);   // venues are always played in good light
  if (BMV.v) BMV.v.update(dt, tsec);
  if (PR_BOOST && !document.hidden && now > 8000) {   // v10.4: keep 60 fps first; on a slow machine give up the extra sharpness for this session
    const f = sharpFps; f.n++; f.s += dt;
    if (f.n >= 150) { if (f.s / f.n > 1 / 45) { PR_BOOST = false; sharpShadows(false); } f.n = 0; f.s = 0; }
  }
  if (post.bloom) { post.bloom.strength = BMV.cur ? 0.32 : 0.6; post.bloom.threshold = BMV.cur ? 2.0 : 1.6; }   // the bright floor would bloom into a haze
  if (BMV.cur && post.grade) { const u = post.grade.uniforms; u.exposure.value = 0.86; u.sat.value = 1.22; u.contrast.value = 1.1; u.vig.value = 0.45; u.grain.value = 0; }    // punchier, sports-broadcast grade
  if (L.ln2 && Math.random() < 0.7) FX.fog.emit({ x: 30.4 + (Math.random() - 0.5) * 0.6, y: 0.15, z: 8.4 + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.7) * 1.2, vy: 0.02, vz: (Math.random() - 0.5) * 1.2, drag: 0.6, life: 4, max: 4, size: 0.6, grow: 0.9, a: 0.35, c: [0.92, 0.97, 1] });
  if (L.hv && Math.random() < 0.25) burst(23.9 + Math.random() * 4.2, 0.4 + Math.random() * 1.2, 3 + Math.random() * 2, [2.4, 1.4, 0.4], 4, 1.6);
  Object.values(FX).forEach(f => f.update(dt));
  // camera
  camState.az += (camState.wantAz - camState.az) * Math.min(1, dt * 6);
  let wantDist, wantEl;
  if (BMV.cur && player) {
    // v10.3 broadcast camera: low behind the player's baseline, wider lens, drifting a little with the player.
    const a = (stage.clientWidth || innerWidth) / (stage.clientHeight || innerHeight), P = BM.m && BM.m.core.m.ch.P;
    if (P) { _want.set(20 + (P.x - 20) * 0.3, 0.5, (a < 0.8 ? 13 : 15.3) + (P.z - 16.5) * 0.25); wantDist = a < 0.8 ? 25 : a < 1.3 ? 13.5 : 10.5; wantEl = a < 0.8 ? 0.8 : a < 1.3 ? 0.52 : 0.45; camState.wantAz = 0; }
    else { _want.set(20, 1.2, 10.5); wantDist = a < 0.8 ? 30 : 24; wantEl = 0.42; camState.wantAz = Math.sin(tsec * 0.08) * 0.35; }
    const fov = a < 0.8 ? 40 : 46; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    if (BM.camSnap) { BM.camSnap = false; camState.target.copy(_want); camState.dist = wantDist; camState.el = wantEl; camState.az = camState.wantAz; }   // a cut, not a fly-in
  }
  else if (!S || !S.running || camState.overview || !player) { _want.set(Z.W / 2, 0, Z.D / 2); wantDist = (Z.view || 66) * ((stage.clientWidth || innerWidth) < 700 ? 1.4 : 1); wantEl = 0.82; }
  else if (camState.cine) { camState.cineT = (camState.cineT || 0) + dt; _want.set(camState.cine.x, 1.15, camState.cine.z); wantDist = ((stage.clientWidth || innerWidth) < 900 ? 11.5 : 9.5) - Math.min(1.2, camState.cineT * 0.12); wantEl = 0.3; const b = camBasis(); _want.addScaledVector(b.fwd, -2.2); camState.wantAz += dt * 0.012; }
  else { _want.set(player.position.x, 0.6, player.position.z); wantDist = camState.followDist; wantEl = 0.86; }
  if (!camState.cine) camState.cineT = 0;
  camState.target.lerp(_want, Math.min(1, dt * (camState.cine ? 3.5 : 5)));
  camState.dist += (wantDist - camState.dist) * Math.min(1, dt * 3); camState.el += (wantEl - camState.el) * Math.min(1, dt * 3);
  if (camState.orbit && (!S || !S.running)) camState.wantAz += dt * 0.04;
  resize(); placeCamera();
  if (BM.shake > 0) { BM.shake = Math.max(0, BM.shake - dt * 2.2); const k = BM.shake * BM.shake * 0.35; cam.position.x += (Math.random() - 0.5) * k; cam.position.y += (Math.random() - 0.5) * k; }
  if (S && S.running) {
    clock.hud += dt; if (clock.hud > 0.12) { clock.hud = 0; renderHUD(); } updatePrompt();
    clock.save = (clock.save || 0) + dt; if (clock.save > 20) { clock.save = 0; if (canSnapMid()) saveGame(true); }
    clock.map += dt; if (clock.map > 0.1) { clock.map = 0; drawMinimap(); renderNavChip(); }
    if (!clock.fpsChecked && QUALITY === 'high' && !S.paused) { clock.fps.push(dt); if (clock.fps.length > 240) { clock.fpsChecked = true; const avg = clock.fps.reduce((a, b) => a + b, 0) / clock.fps.length; if (avg > 1 / 26) toast('画面有点卡？右上角可以把画质调成「中」。'); } }
  }
  const tilt = camState.cine && !BMV.cur ? (post.bokeh ? 1.1 : 2.2) : 0;   // v10.4: no edge blur while walking; the dialogue two-shot keeps its depth of field
  renderFrame(tsec, tilt);
  requestAnimationFrame(frame);
}
camState.orbit = 0.0001; camState.dist = 70;
buildPost(); resize(); onResizeHooks.forEach(f => f(stage.clientWidth || innerWidth, stage.clientHeight || innerHeight));
renderSetup();
requestAnimationFrame(frame);
// Dev/test hook, only with ?debug in the URL: headless tests (tools/) read and drive the game state through it.
if (/[?&]debug\b/.test(location.search)) window.__prof = (code) => eval(code);
/* v12.1 content: the authored week, event pools, people, calendar and codex are data in assets/data/content/*.json.
   They are fetched once at boot; the buttons that start or resume a week wait for them. */
const CONTENT = { ready: false, error: null, p: null };
// Localisation groundwork: any text in the content may be a plain string (中文) or { zh, en, ja, ms }; the player's language
// (localStorage prof-lang, default zh) is picked at load, falling back to 中文. The HUD strings are not keyed yet.
const LANGS = ['zh', 'en', 'ja', 'ms'];
const LANG = (() => { try { const l = localStorage.getItem('prof-lang'); return LANGS.includes(l) ? l : 'zh'; } catch (e) { return 'zh'; } })();
const isLoc = (v) => v && typeof v === 'object' && !Array.isArray(v) && typeof v.zh === 'string' && Object.keys(v).every(k => LANGS.includes(k));
const tr = (v) => isLoc(v) ? (v[LANG] || v.zh) : Array.isArray(v) ? v.map(tr) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, tr(x)])) : v;
function loadContent() {
  const get = (f) => fetch('assets/data/content/' + f).then(r => { if (!r.ok) throw new Error(f + ' ' + r.status); return r.json(); });
  CONTENT.error = null;
  CONTENT.p = Promise.all(['week.json', 'events.json', 'people.json', 'calendar.json', 'codex.json', 'table.json'].map(get)).then((files) => {
    const [wk, ev, pp, cal, cx, tb] = files.map(tr);
    Object.assign(TABLE, tb);
    if (CONTENT.ready) return;
    wk.events.forEach(e => { const { day, time, loc, who, tag, title, line, open, ch, ...o } = e; C(day, time, loc, who, tag, title, line, open, ch, o); });
    QUICK.push(...ev.quick.map(q => [q.who, q.title, q.open, q.ch]));
    ADMIN_EVENTS.push(...ev.admin); ACADEMY_EVENTS.push(...ev.academy); HOME_SCENES.push(...ev.home);
    Object.assign(HAT_EVENT, ev.hat); Object.assign(FIN_EVENTS, ev.finance);
    Object.assign(STUDENTS, pp.students); Object.assign(MEMLINES, pp.memlines);
    DAYS.push(...cal.days); INTENTS.push(...cal.intents);
    Object.assign(CARDS, cx.cards); Object.assign(ACHIEVEMENTS, cx.achievements); QUIZ.push(...cx.quiz);
    CONTENT.ready = true; $('contentErr').classList.add('hidden');
  }).catch(e => { CONTENT.error = e; console.warn('content failed to load', e); $('contentErr').classList.remove('hidden'); });
  return CONTENT.p;
}
// Entry points call this first: true when the content is in; otherwise the action runs once it arrives.
function needContent(fn) { if (CONTENT.ready) return true; (CONTENT.p || loadContent()).then(() => { if (CONTENT.ready) fn(); }); return false; }
$('contentRetry').onclick = loadContent;
loadContent();
/*DEBUG_HOOK*/
// v12 balance harness API (tools/balance/agent.js). Only exists with ?sim; costs nothing otherwise.
if (SIM) window.__sim = {
  get S() { return S; }, get ready() { return CONTENT.ready; }, setup, ACT, HS, ZONES, BLOCKS, DAYS, INTENTS, STUDENTS, KPI, FAMILY, CANTEEN, FIN: typeof FIN !== 'undefined' ? FIN : null,
  startGame, startDay, beginDay, nextWeek, pick, closeDialog, openDialog, openDesk, openRoofCafe, canteenMenu, canteenToday, confirmHome, goHome,
  openGarden, companionsFor, get TABLE() { return TABLE; }, BAL,
  minuteTick, simulate, activeEvents, travelMinutes, blockIdx, commitEnd, dossierScore, avgTrust, loadCareer, saveCareer, finishActivity, hm,
  clearAll() { try { localStorage.clear(); } catch (e) { /* storage blocked */ } },
};
