/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* ---------------- v10: badminton match on court 2 (core in assets/js/badminton.js, data in assets/data/badminton.json) ---------------- */
const BM = { data: null, m: null, shuttle: null };
/* v10.3: the match venue (assets/js/bm-venue.js). While it is on, the ordinary gym zone is hidden and the match is played in the
   same gym rebuilt for the broadcast camera, at the same world coordinates. Friday's match adds the crowd (setEvent). */
const BM_SCALE = 1.2;
const BMV = { built: null, cur: null, v: null, restore: [] };
function bmVenueOn() {
  if (BMV.cur || !window.BMVenue) return;
  const v = BMV.built || (BMV.built = BMVenue.build(THREE, { cx: 20, net: 13, quality: QUALITY, aniso: renderer.capabilities.getMaxAnisotropy(), font: CN_FONT, text: BM.data && BM.data.venue }));
  scene.add(v.group); BMV.cur = 'gym'; BMV.v = v; BM.camSnap = true; v.setEvent(false);

  Z.group.visible = false; cityGroup.visible = false;
  // the players on courts 1 and 3 and their shuttles keep playing beside you
  Z.npcs.forEach(p => { if (p.userData.baseState === 'play') bmVenueBorrow(p); });
  Z.balls.forEach(b => { if (b.kind === 'shuttle' && b.from[0] !== 20) bmVenueBorrow(b.m); });
}
// Move an object (an NPC) onto the venue for the match; it goes back to its old parent when the venue closes.
function bmVenueBorrow(obj) { if (!BMV.v || !obj || obj.parent === BMV.v.group) return; const par = obj.parent; BMV.v.group.add(obj); BMV.restore.push(() => { if (par) par.add(obj); }); }
function bmVenueOff() {
  if (!BMV.cur) return;
  BMV.restore.splice(0).reverse().forEach(f => f());
  if (BMV.v.group.parent) BMV.v.group.parent.remove(BMV.v.group);
  BMV.cur = null; BMV.v = null;
  Z.group.visible = true; cityGroup.visible = !Z.outdoor;
  cam.fov = 30; cam.updateProjectionMatrix();
}
const bmLayer = () => (BMV.v ? BMV.v.group : Z.group);
function bmShuttle() {
  if (BM.shuttle) return BM.shuttle;
  const g = new THREE.Group();
  const cork = new THREE.Mesh(new THREE.SphereGeometry(0.028, 20, 14), new THREE.MeshStandardMaterial({ color: '#f4efe6', roughness: 0.6 })); cork.position.z = 0.04;
  const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.075, 28, 2, true), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }));
  skirt.rotation.x = Math.PI / 2; skirt.position.z = 0;
  g.add(cork, skirt); g.scale.setScalar(2.2); cork.castShadow = skirt.castShadow = true;
  return (BM.shuttle = g);
}
/* Step 2 feel: timing ring at the player's feet, shuttle shadow and trail, landing mark. Built once, reused. */
function bmFx() {
  if (BM.fx) return BM.fx;
  const flat = (geo, color, op) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3 })); m.rotation.x = -Math.PI / 2; return m; };
  const ring = new THREE.Group();
  const inner = flat(new THREE.RingGeometry(0.46, 0.53, 96), '#ffffff', 0.8);
  const outer = flat(new THREE.RingGeometry(0.5, 0.56, 96), '#ffffff', 0.9);
  ring.add(inner, outer); ring.position.y = 0.03;
  const shadow = flat(new THREE.CircleGeometry(0.12, 20), '#000000', 0.38); shadow.position.y = 0.022;
  const mark = flat(new THREE.RingGeometry(0.16, 0.24, 32), '#3DDC97', 0); mark.position.y = 0.025;
  const N = 18, pos = new Float32Array(N * 3);
  const tg = new THREE.BufferGeometry(); tg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const trail = new THREE.Line(tg, new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.55, toneMapped: false }));
  trail.frustumCulled = false;
  // v10.3: glowing ribbon behind the shuttle (replaces the thin line where the post chain is on), the yellow ring where you are
  // running to, and camera-facing flash rings at each contact.
  const RN = 26, rpos = new Float32Array(RN * 2 * 3), rcol = new Float32Array(RN * 2 * 3), idx = [];
  for (let i = 0; i < RN - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3)); rg.setAttribute('color', new THREE.BufferAttribute(rcol, 3)); rg.setIndex(idx);
  const ribbon = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  ribbon.frustumCulled = false; ribbon.visible = false;
  const goal = flat(new THREE.RingGeometry(0.2, 0.27, 64), '#FFC83D', 0); goal.position.y = 0.028;
  const flashes = [0, 1, 2].map(() => { const f = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.9, 96), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); f.visible = false; f.userData.t = 9; return f; });
  return (BM.fx = { ring, inner, outer, shadow, mark, trail, N, pos, n: 0, markT: 0, ribbon, RN, rpos, rcol, rhist: [], goal, flashes, fi: 0 });
}
/* v10.3: rackets and swings. A racket in each player's right hand, and the arm posed over the animation clip:
   a wind-up while the shuttle comes in, the stroke at contact, a follow-through. Three strokes by contact height:
   overhead (clear, drop, smash), side (drive, push) and underarm (lift, net shot). Directions are given in the character's
   own frame (out = racket side, up, fwd) and solved per bone in world space, so the same table drives the GLB rigs
   (bones point along +Y) and the procedural cast (arm groups hang along -Y). */
const BM_SW = {
  over:  { wind: [[0.5, 0.75, -0.45], [0.1, -0.25, -1]], hit: [[0.25, 1, 0.15], [0.05, 1, 0.3]], fol: [[-0.25, -0.1, 1], [-0.6, -0.7, 0.4]], left: [0.35, 0.85, 0.5] },
  side:  { wind: [[1, -0.1, -0.25], [0.6, 0.25, -0.8]], hit: [[0.8, -0.05, 0.6], [0.4, 0.2, 1]], fol: [[0.1, 0, 1], [-0.8, 0.1, 0.6]], left: [0.6, -0.3, 0.4] },
  under: { wind: [[0.45, -0.8, -0.2], [0.4, -0.6, -0.7]], hit: [[0.25, -0.5, 0.8], [0.15, -0.25, 1]], fol: [[0.1, 0.5, 0.85], [0, 0.9, 0.4]], left: [0.5, 0.1, 0.4] },
};
const _bq1 = new THREE.Quaternion(), _bq2 = new THREE.Quaternion(), _bq3 = new THREE.Quaternion(), _bv1 = new THREE.Vector3(), _bv2 = new THREE.Vector3(), _bv3 = new THREE.Vector3();
function bmRacketMesh() {
  const g = new THREE.Group(), frame = new THREE.MeshStandardMaterial({ color: '#1b2430', metalness: 0.5, roughness: 0.35 });
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.16, 16), new THREE.MeshStandardMaterial({ color: '#e8543a', roughness: 0.6 })); grip.position.y = 0.06; g.add(grip);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), frame); shaft.position.y = 0.24; g.add(shaft);
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 10, 48), new THREE.MeshStandardMaterial({ color: '#2251FF', metalness: 0.4, roughness: 0.3 })); head.scale.set(0.85, 1.15, 1); head.position.y = 0.45; g.add(head);
  BM.strTex = BM.strTex || canvasTex(128, 128, (g2, w, h) => { g2.clearRect(0, 0, w, h); g2.strokeStyle = 'rgba(255,255,255,.95)'; g2.lineWidth = 1.5; for (let i = 4; i < w; i += 8) { g2.beginPath(); g2.moveTo(i, 0); g2.lineTo(i, h); g2.stroke(); g2.beginPath(); g2.moveTo(0, i); g2.lineTo(w, i); g2.stroke(); } }, false);
  const str = new THREE.Mesh(new THREE.CircleGeometry(0.1, 40), new THREE.MeshBasicMaterial({ map: BM.strTex, color: '#ffffff', transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }));   // strung, not a disc str.scale.set(0.85, 1.15, 1); str.position.y = 0.45; g.add(str);
  g.traverse(n => { if (n.isMesh) n.castShadow = true; });
  return g;
}
// Find (or lazily attach) the arm joints and racket of a character; GLB models load asynchronously, so retry until found.
function bmRig(c) {
  const u = c.userData;
  if (u.bmRig && u.bmRig.kind === (u.model ? 'glb' : 'proc')) return u.bmRig;
  let r = null;
  if (u.model) {
    const bone = (n) => c.getObjectByName(n) || c.getObjectByName(n.replace('.', ''));   // GLTFLoader strips the dot from bone names
    if (u.model.real) {   // v11.1 Rocketbox (3ds Max Biped): bones point along their child, whatever the local axis is
      const ua = bone('Bip01_R_UpperArm'), fa = bone('Bip01_R_Forearm'), hd = bone('Bip01_R_Hand'), ul = bone('Bip01_L_UpperArm');
      if (ua && fa && hd) r = { kind: 'glb', ua, fa, ul, hand: hd, axisU: fa.position.clone().normalize(), axisF: hd.position.clone().normalize(), axis: hd.position.clone().normalize() };
    } else {
    const ua = bone('upper_arm.R'), fa = bone('forearm.R'), hd = bone('hand.R'), ul = bone('upper_arm.L');
    if (ua && fa && hd) r = { kind: 'glb', ua, fa, ul, hand: hd, axis: new THREE.Vector3(0, 1, 0) };
    }
  } else if (u.P && u.P.shR && u.P.elR) r = { kind: 'proc', ua: u.P.shR, fa: u.P.elR, ul: u.P.shL, hand: u.P.elR, axis: new THREE.Vector3(0, -1, 0), off: -0.2 };
  if (!r) return null;
  if (u.bmRacket && u.bmRacket.parent) u.bmRacket.parent.remove(u.bmRacket);
  const rk = u.bmRacket || (u.bmRacket = bmRacketMesh());
  r.hand.add(rk); c.updateMatrixWorld(true);
  rk.position.set(0, r.off || 0.04, 0); rk.quaternion.identity();
  if (r.axis.y < 0) rk.rotation.x = Math.PI;   // the procedural forearm hangs along -Y
  if (u.model && u.model.real) {   // Rocketbox: grip in the palm, shaft along the middle finger
    const f = c.getObjectByName('Bip01_R_Finger2') || c.getObjectByName('Bip01_R_Finger1'), ax = f ? f.position.clone().normalize() : new THREE.Vector3(1, 0, 0);
    rk.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ax); rk.position.copy(ax).multiplyScalar(0.05);
  }
  const ws = r.hand.getWorldScale(_bv1).x, cs = c.getWorldScale(_bv2).x; rk.scale.setScalar(cs / (ws || 1) * (u.model && u.model.real ? 1.2 : 1.6));   // chibi proportions: an oversized racket reads at broadcast distance
  if (r.kind === 'proc') rk.position.y = r.off;
  // which local x is the racket side (the rig's right arm), measured once from the shoulder position
  c.worldToLocal(r.ua.getWorldPosition(_bv1)); r.sx = Math.sign(_bv1.x) || -1;
  return (u.bmRig = r);
}
// Turn one joint so its bone axis points along a world direction; w blends from the clip pose (0) to the target (1).
function bmAim(j, axis, dir, w) {
  if (w <= 0.001) return;
  j.getWorldQuaternion(_bq1);
  const cur = _bv3.copy(axis).applyQuaternion(_bq1).normalize();
  _bq2.setFromUnitVectors(cur, dir).multiply(_bq1);                         // target world rotation
  j.parent.getWorldQuaternion(_bq3).invert().multiply(_bq2);               // into the parent's frame
  j.quaternion.slerp(_bq3, w); j.updateMatrixWorld(true);
}
function bmLocalDir(c, r, v, out) { c.getWorldQuaternion(_bq1); return out.set(v[0] * r.sx, v[1], v[2]).normalize().applyQuaternion(_bq1); }
// Pose one side's arms for this frame. sw: { type, t } of the last stroke; inc: the incoming shuttle for this side, if any.
function bmPoseArms(c, side, m, B) {
  const r = bmRig(c); if (!r) return;
  if (r.kind === 'glb' && !r.prop) r.prop = c.getObjectByName('prop') || 1; if (r.prop && r.prop.scale) r.prop.scale.setScalar(0.001);   // the clip may key the prop bone
  const sw = B.sw[side], since = sw ? m.t - sw.t : 9;
  let type, a, b, k, w;
  if (since < 0.55) {   // stroke: snap to contact, sweep to the follow-through, then let go
    type = BM_SW[sw.type]; const u = since / 0.3;
    a = u < 1 ? type.hit : type.fol; b = type.fol; k = Math.min(1, u); w = since < 0.3 ? 1 : 1 - (since - 0.3) / 0.25;
  } else {
    const inc = m.inc, left = inc && inc.recv === side && !inc.done && inc.c ? inc.c.t - m.t : 9;
    if (left > 0.9) w = 0;
    else { const y = inc.c.y; type = BM_SW[y > 1.75 ? 'over' : y < 0.95 ? 'under' : 'side']; a = b = type.wind; k = 0; w = Math.min(1, (0.9 - left) / 0.5); }
  }
  if (!type || w <= 0) return;
  c.updateMatrixWorld(true);
  const d1 = bmLocalDir(c, r, [a[0][0] + (b[0][0] - a[0][0]) * k, a[0][1] + (b[0][1] - a[0][1]) * k, a[0][2] + (b[0][2] - a[0][2]) * k], _bv1);
  bmAim(r.ua, r.axisU || r.axis, d1, w);
  const d2 = bmLocalDir(c, r, [a[1][0] + (b[1][0] - a[1][0]) * k, a[1][1] + (b[1][1] - a[1][1]) * k, a[1][2] + (b[1][2] - a[1][2]) * k], _bv2);
  bmAim(r.fa, r.axisF || r.axis, d2, w);
  if (r.ul) { const l = type.left, d3 = bmLocalDir(c, r, [-l[0], l[1], l[2]], _bv1); bmAim(r.ul, r.axisU || r.axis, d3, w * 0.8); }
}
/* v10.3 juice: floating labels over the hitter, contact flashes, hit-stop and shake, speed lines, racket sounds. */
BM.labels = [];
function bmLabel(html, cls, who, life = 1.1) {
  const box = $('bmLabels'); if (!box) return;
  while (BM.labels.length > 4) { const o = BM.labels.shift(); o.el.remove(); }
  const el = document.createElement('div'); el.className = 'lb ' + (cls || ''); el.innerHTML = html; box.appendChild(el);
  BM.labels.push({ el, who, t: 0, life });
}
const _lbV = new THREE.Vector3();
function bmLabelsTick(dt) {
  const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight;
  for (let i = BM.labels.length - 1; i >= 0; i--) {
    const L = BM.labels[i]; L.t += dt;
    if (L.t > L.life) { L.el.remove(); BM.labels.splice(i, 1); continue; }
    const c = L.who; if (!c) continue;
    _lbV.set(c.position.x, c.position.y + 2.15 * c.scale.y, c.position.z).project(cam);
    const rise = Math.min(1, L.t / 0.25), y = (1 - _lbV.y) / 2 * h - 26 * rise - L.t * 14, x = (_lbV.x + 1) / 2 * w;
    L.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(-50%,-100%) scale(${(0.7 + 0.3 * rise).toFixed(3)})`;
    L.el.style.opacity = String(Math.min(1, (L.life - L.t) / 0.25));
  }
}
function bmFlash(c, big) {
  const fx = BM.fx; if (!fx) return;
  const f = fx.flashes[fx.fi++ % fx.flashes.length];
  f.visible = true; f.userData.t = 0; f.userData.big = !!big; f.userData.who = c;
  f.material.color.set(big ? '#FFB547' : '#ffffff').multiplyScalar(big ? 2.4 : 1.6);
}
function bmFlashTick(dt) {
  BM.fx.flashes.forEach(f => {
    const u = f.userData; if (!f.visible) return; u.t += dt;
    const T = u.big ? 0.42 : 0.3; if (u.t > T) { f.visible = false; return; }
    const k = u.t / T, c = u.who, sc = c ? c.scale.y : 1;
    if (c) f.position.set(c.position.x, c.position.y + 1.05 * sc, c.position.z);
    f.quaternion.copy(cam.quaternion);
    const r = (u.big ? 0.7 : 0.55) + k * (u.big ? 1.3 : 0.8); f.scale.setScalar(r * sc);
    f.material.opacity = (1 - k) * (u.big ? 1 : 0.8);
  });
}
let bmNoise = null;
function bmThock(speed, smash) {
  if (!actx || !soundOn) return;
  if (!bmNoise) { const n = actx.sampleRate * 0.2, b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); bmNoise = b; }
  const t0 = actx.currentTime, src = actx.createBufferSource(), bp = actx.createBiquadFilter(), g = actx.createGain();
  src.buffer = bmNoise; bp.type = 'bandpass'; bp.frequency.value = smash ? 2200 : 3200 + Math.random() * 600; bp.Q.value = smash ? 1.2 : 2.2;
  const v = Math.min(0.5, 0.12 + speed / 160) * (smash ? 1.5 : 1);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + (smash ? 0.16 : 0.08));
  src.connect(bp).connect(g).connect(master); src.start(t0); src.stop(t0 + 0.2);
  if (smash) tone(110, 0.12, 'sine', 0.12);
}
function bmCrowd(k) {
  if (!actx || !soundOn || !bmNoise) return;
  const t0 = actx.currentTime, src = actx.createBufferSource(), lp = actx.createBiquadFilter(), g = actx.createGain();
  const n = actx.sampleRate * 1.6, b = actx.createBuffer(1, n, actx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  src.buffer = b; lp.type = 'bandpass'; lp.frequency.value = 900; lp.Q.value = 0.6;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09 * k, t0 + 0.25); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);
  src.connect(lp).connect(g).connect(master); src.start(t0); src.stop(t0 + 1.6);
}
function bmShowRackets(on) { [player, BM.m && BM.m.npc].forEach(c => { if (!c) return; if (on) bmRig(c); if (c.userData.bmRacket) c.userData.bmRacket.visible = on; const pr = c.getObjectByName('prop'); if (pr) pr.scale.setScalar(on ? 0.001 : 1); }); }   // the hand prop (a book, skinned to the 'prop' bone) is put away while playing
const BM_COL = { green: new THREE.Color('#3DDC97').multiplyScalar(1.6), amber: new THREE.Color('#FFB547').multiplyScalar(1.4), white: new THREE.Color('#ffffff'), red: new THREE.Color('#ff6b5e').multiplyScalar(1.3), smash: new THREE.Color('#FFB547').multiplyScalar(1.8) };
async function bmLoad() {
  if (BM.data) return BM.data;
  const r = await fetch('assets/data/badminton.json'); if (!r.ok) throw 0; const d = await r.json();
  for (const [k, f] of [['tactics', 'badminton-tactics.json'], ['drills', 'badminton-drills.json']]) { try { const t = await fetch('assets/data/' + f); if (t.ok) { const j = await t.json(); d[k] = k === 'drills' ? j.drills : j; } } catch (e) { /* optional */ } }
  return (BM.data = d);
}
// Career: at the court, choose to play, to let it play out, or not to. Energy sets the timing window, so say so.
async function bmOffer(opp, ctx = {}) {
  let D; try { D = await bmLoad(); } catch (e) { return ACT.badminton(30); }
  const O = D.opponents[opp], e = Math.round(S.v.energy), W = D.timing.find(w => e >= w.minEnergy) || D.timing[D.timing.length - 1];
  const rec = (S.bm || {})[opp], p = Math.round(BMCore.autoWin(D, opp, e) * 100);
  const line = rec ? (rec.last === 'w' ? O.lines.rematchWon_zh : O.lines.rematchLost_zh) : O.lines.intro_zh;
  const ch = [
    { t: `上场打一局（7 分）`, d: `体力 ${e} · ${W.label_zh}`, run: () => bmStart(opp, null, ctx) },
    { t: '直接打完（自动结算）', d: `按现在的体力，胜率约 ${p}%`, run: () => bmAuto(opp, ctx) },
  ];
  if (!ctx.event) ch.push({ t: '不打了', d: '回到球馆' });
  openDialog({ id: 'bmOffer', loc: 'courtB', who: `${O.name_zh} · ${O.level_zh}`, tag: '羽毛球', title: ctx.event ? '物理 vs 化学 · 决胜单打' : '2 号场 · 来一局？', synthetic: true, start: 'a',
    status: [['体力', String(e)], ['战绩', rec ? `${rec.w} 胜 ${rec.l} 负` : '第一次交手']],
    nodes: { a: { say: [['', line]], choices: ch } } });
}
function bmRecord(opp, win) { S.bm = S.bm || {}; const r = S.bm[opp] || (S.bm[opp] = { w: 0, l: 0, last: null }); r[win ? 'w' : 'l']++; r.last = win ? 'w' : 'l'; }
// Outcome-dependent effects for the Friday match; ordinary games keep the usual badminton effects.
function bmAfter(opp, win, ctx, score) {
  bmRecord(opp, win);
  if (ctx && ctx.event === 'chem') {
    applyFx(win ? { team: 3, rep: 3, wellbeing: 2 } : { rep: 1 });
    logIt(win ? `决胜单打 ${score} 赢了化学系的阿龙，物理系拿下研究生羽毛球赛。` : `决胜单打 ${score} 输给化学系的阿龙。阿丹说明年再来。`);
    if (win) S.flags.chemWin = 1;
  }
  ACT.badminton(30);
}
function bmAuto(opp, ctx) {
  const D = BM.data, O = D.opponents[opp], win = Math.random() < BMCore.autoWin(D, opp, S.v.energy);
  const lo = 2 + Math.floor(Math.random() * 4), score = win ? `7:${lo}` : `${lo}:7`;
  toast(`${win ? '赢了' : '输了'} ${score} · ${win ? O.lines.win_zh : O.lines.lose_zh}`, win ? 'good' : '');
  bmAfter(opp, win, ctx, score);
}
const BM_TUT = 'prof-bm-tut-v1';
function bmTutorial(force) {
  const B = BM.m, T = B && B.D.tutorial; if (!T) return;
  let seen = false; try { seen = !!localStorage.getItem(BM_TUT); } catch (e) { /* storage blocked */ }
  if (seen && !force) return;
  B.paused = true;
  const box = $('bmEndBox'); box.className = 'panel';
  box.innerHTML = `<h3>${esc(T.title_zh)}</h3>${T.lines_zh.map(l => `<p style="text-align:left;color:#EAF4FB">${esc(l)}</p>`).join('')}<button class="btn gold" type="button" id="bmTutGo">开始 <span class="key" style="border-color:rgba(0,0,0,.4);color:#1a1205">Enter</span></button>`;
  const go = () => { try { localStorage.setItem(BM_TUT, '1'); } catch (e) { /* storage blocked */ } box.className = 'panel hidden'; if (BM.m) BM.m.paused = false; };
  $('bmTutGo').onclick = go; $('bmTutGo').focus({ preventScroll: true });
}
async function bmStart(opp, drillId, ctx) {
  if (!window.BMCore) { toast('羽毛球脚本没加载上，先按原来的方式打。'); return ACT.badminton(30); }
  if (!BM.data) { try { await bmLoad(); } catch (e) { toast('球场数据没加载上，先按原来的方式打。'); return ACT.badminton(30); } }
  const D = BM.data, O = D.opponents[opp], npc = NPC[O.npc];
  const drill = drillId && D.drills ? D.drills[drillId] : null;
  const core = BMCore(D, { opp, energy: S.v.energy, drill });
  const decor = Z.balls.filter(b => b.kind === 'shuttle' && b.from[0] === 20);
  decor.forEach(b => { b.m.visible = false; });
  bmVenueOn(); if (npc) bmVenueBorrow(npc); BM.camSnap = true; BMV.v && BMV.v.setEvent(!!(ctx && ctx.event));
  const sh = bmShuttle(); bmLayer().add(sh);
  const fx = bmFx(); bmLayer().add(fx.ring, fx.shadow, fx.mark, fx.trail, fx.ribbon, fx.goal, ...fx.flashes); fx.rhist.length = 0; fx.n = 0; fx.markT = 0; fx.mark.material.opacity = 0; fx.ring.visible = false;
  const bmS = (c) => c.userData.real ? 1 : BM_SCALE;   // realistic adults are already life size
  player.scale.setScalar(bmS(player)); if (npc) npc.scale.setScalar(bmS(npc));   // players read at broadcast size
  BM.m = { sw: {}, core, D, O, opp, ctx: ctx || {}, drillId: drill ? drillId : null, drill, npc, sh, decor, npcHome: npc ? npc.position.clone() : null, npcRot: npc ? npc.rotation.y : 0, npcVis: npc ? npc.visible : true, pop: 0 };
  if (npc) npc.visible = true;
  bmShowRackets(true);
  const aq = NPC.grad1; if (aq && npc !== aq) { BM.m.aqHome = aq.position.clone(); BM.m.aqRot = aq.rotation.y; aq.position.set(24.3, 0, 11.5); face(aq, 20, 13); }
  $('bmEndBox').classList.add('hidden'); $('bmQuit').classList.remove('hidden');
  S.path = []; S.autoTarget = null; S.moving = false;
  document.body.classList.add('bm'); $('bm').classList.remove('hidden');
  bmTutorial();
  if (drill) bmPop('训练 · ' + drill.zh, '', 1.6); else bmPop(O.lines.intro_zh.split('：').slice(1).join('：') || '', '', 2.2);
  bmScore(); bmHint(); if (drill) { $('bmHint').textContent = drill.intro_zh; BM.m.introT = 6; }
  SFX.click();
}
function bmScore() {
  const B = BM.m, m = B.core.m;
  if (B.drill) { $('bmScore').classList.remove('pills'); $('bmScore').innerHTML = `<span>${esc(B.drill.zh)}</span><span>第</span><b>${Math.min(B.drill.balls, m.drill.i + (m.phase === 'rally' ? 1 : 0))}</b><span>/ ${B.drill.balls} 球 · 得分</span><b>${m.drill.score}</b>`; return; }
  if (BMV.v) BMV.v.setScore(m.score.P, m.score.O, ['物理 · 你', B.O.name_zh]);
  $('bmScore').classList.add('pills');
  $('bmScore').innerHTML = `<span class="pl me${m.score.P > m.score.O ? ' lead' : ''}">${m.server === 'P' ? '<span class="srv">●</span>' : ''}你 <b>${m.score.P}</b></span><span class="pl op${m.score.O > m.score.P ? ' lead' : ''}"><b>${m.score.O}</b> ${esc(B.O.name_zh)}${m.server === 'O' ? '<span class="srv">●</span>' : ''}</span>`;
}
const core0 = () => BM.m.core;
function bmHint() {
  if (BM.m.introT > 0) return;
  const m = BM.m.core.m;
  $('bmHint').innerHTML = m.phase === 'serve' && m.server === 'P' ? '发球：上滑 / <span class="key">W</span> 高远球 · 下滑 / <span class="key">S</span> 网前球'
    : (core0().ring() && core0().ring().rear ? '后场球：按住再滑 / <span class="key">K</span> 马来步 · 双击再滑 / <span class="key">L</span> 中国跳 · ' : '') + '上滑 <span class="key">W</span> 高远 · 下滑 <span class="key">S</span> 吊球 · 斜滑 <span class="key">Q</span><span class="key">E</span><span class="key">Z</span><span class="key">C</span> 选左右角 · 左右 <span class="key">A</span><span class="key">D</span> 平抽 · 头顶点击 <span class="key">空格</span> 杀球';
}
function bmPop(text, cls, sec = 0.9) { const el = $('bmPop'); el.textContent = text; el.className = 'on ' + (cls || ''); el.style.fontSize = text.length > 14 ? '22px' : ''; BM.m.pop = sec; }
function bmSwing(g) {
  const B = BM.m; if (!B || B.paused || B.core.m.phase === 'over') return;
  const r = B.core.swing(g); if (!r) return;
  const D = B.D;
  if (r.r === 'serve') { SFX.click(); bmHint(); return; }
  if (r.foot || r.footNote) B.jump = { t: 0, foot: r.foot, note: r.footNote };
  if (D.quality[r.r]) { const lg = B.core.m.log[B.core.m.log.length - 1], tg = (lg && lg.tags || []).map(t => D.tactics && D.tactics.rules[t] ? D.tactics.rules[t].zh : '').filter(Boolean)[0]; B.lastNote = { tg, foot: r.footNote && D.footwork.zh[r.footNote] ? D.footwork.zh[r.footNote] : '', risky: !!(lg && lg.tags.includes('risky')) }; if (r.r === 'perfect') SFX.good(); }   // the label itself is drawn on the hit event, over your head
  else { bmPop(D.misses[r.r].zh, 'bad'); SFX.bad(); }
}
function bmPrep(foot) {
  const B = BM.m; if (!B) return;
  const r = B.core.prep(foot), FWT = B.D.footwork.zh; if (!r) return;
  if (r.r === 'ok') { bmPop(FWT[foot] + ' · 准备', '', 0.7); SFX.tick(); } else bmPop(FWT[r.r], 'bad', 0.8);
}
function bmKey(e) {
  if (BM.m.paused) { if (e.key === 'Enter' && $('bmTutGo')) { e.preventDefault(); $('bmTutGo').click(); } return; }
  if (e.code === 'Slash' || e.key === '?') return bmTutorial(true);
  if (e.code === 'KeyK' && !e.repeat) { e.preventDefault(); return bmPrep('malay'); }
  if (e.code === 'KeyL' && !e.repeat) { e.preventDefault(); return bmPrep('china'); }
  const map = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'tap', KeyJ: 'tap', KeyQ: 'upleft', KeyE: 'upright', KeyZ: 'downleft', KeyC: 'downright' };
  if (map[e.code]) { e.preventDefault(); if (!e.repeat) bmSwing(map[e.code]); }
  else if (e.code === 'Escape') bmEnd(false);
}
(() => {
  const el = $('bm'); let down = null;
  let lastTap = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    down = { x: e.clientX, y: e.clientY, id: e.pointerId, t: performance.now(), moved: false };
    // Hold still ≥ 0.22 s before swiping = 马来步 (turn and set the feet first).
    const d0 = down; setTimeout(() => { if (down === d0 && !d0.moved) { d0.held = true; bmPrep('malay'); } }, 220);
    el.setPointerCapture(e.pointerId); e.preventDefault();
  });
  el.addEventListener('pointermove', (e) => { if (down && down.id === e.pointerId && Math.hypot(e.clientX - down.x, e.clientY - down.y) >= 24) down.moved = true; });
  el.addEventListener('pointerup', (e) => {
    if (!down || down.id !== e.pointerId) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y, d0held = !!down.held; down = null;
    if (Math.hypot(dx, dy) < 24) {
      if (d0held) return;   // a hold without a swipe only sets the feet
      // Double tap = 中国跳: the first tap is ignored by the core when the shuttle is still far.
      const now = performance.now(), B = BM.m, rg = B && B.core.ring();
      if (rg && rg.rear && now - lastTap < 350 && rg.left > B.D.footwork.prepLead) { lastTap = 0; return bmPrep('china'); }
      lastTap = now; return bmSwing('tap');
    }
    // Eight 45° sectors, screen up = -y.
    const a = Math.atan2(-dy, dx) * 180 / Math.PI, i = ((Math.round(a / 45) % 8) + 8) % 8;
    bmSwing(['right', 'upright', 'up', 'upleft', 'left', 'downleft', 'down', 'downright'][i]);
  });
  el.addEventListener('pointercancel', () => { down = null; });
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  $('bmQuit').onclick = () => bmEnd(false);
  $('bmHelp').onclick = () => bmTutorial(true);
})();
const _bmV = new THREE.Vector3();
function bmFrame(dt) {
  const B = BM.m, core = B.core, m = core.m;
  let cdt = B.paused ? 0 : dt; if (B.stop > 0) { B.stop -= dt; cdt = 0; }   // hit-stop on a perfect smash
  const evs = core.update(cdt);
  const P = m.ch.P, Oc = m.ch.O, st = (c) => (c.moving ? 'run' : 'idle');   // strokes are posed by bmPoseArms, not the 'play' clip
  player.position.set(P.x, 0, P.z); player.rotation.y = Math.PI; player.userData.state = st(P); player.userData.seated = false; player.visible = true;
  if (B.npc) { B.npc.position.set(Oc.x, 0, Oc.z); B.npc.rotation.y = 0; B.npc.userData.state = st(Oc); }
  playerRing.visible = false;
  if (B.jump) {   // 中国跳: straight up, no turn. 马来步: quarter turn toward the backhand side, then a lower jump.
    const j = B.jump; j.t += dt; const u = Math.min(1, j.t / 0.5), arc = Math.sin(Math.PI * u);
    if (j.foot === 'china') player.position.y = 0.5 * arc;
    else if (j.foot === 'malay') { player.position.y = 0.3 * arc; player.rotation.y = Math.PI + Math.PI / 2 * arc; }
    else if (j.note === 'stumble') player.position.y = 0;
    if (u >= 1) B.jump = null;
  }
  bmPoseArms(player, 'P', m, B); if (B.npc) bmPoseArms(B.npc, 'O', m, B);
  const p = core.pos(), sh = B.sh;
  if (p) { sh.visible = true; sh.position.set(p.x, Math.max(0.03, p.y), p.z); if (p.y > 0.02) sh.lookAt(_bmV.set(p.x + p.vx, p.y + p.vy, p.z + p.vz)); }
  else { const who = m.drill ? 'O' : m.server, s = m.ch[who]; sh.visible = true; sh.position.set(s.x + 0.25, 1.0, s.z - (who === 'P' ? 0.35 : -0.35)); sh.rotation.set(Math.PI / 2, 0, 0); }
  bmVisuals(dt, p); bmFlashTick(dt); bmLabelsTick(dt);
  { const rr = !!(core.ring() && core.ring().rear); if (rr !== B.rearHint) { B.rearHint = rr; bmHint(); } }
  for (const ev of evs) {
    if (ev.type === 'hit') { const rec = m.fl && m.fl.rec, y = rec ? rec.from.y : 1.5; B.sw[ev.side] = { t: m.t, type: ev.serve ? 'under' : y > 1.75 || ev.shot === 'smash' ? 'over' : y < 0.95 ? 'under' : 'side' }; }
    if (ev.type === 'hit' && ev.q === 'perfect') { const q = core.pos(); if (q) burst(q.x, q.y, q.z, ev.side === 'P' ? [0.6, 2.4, 1.3] : [2.2, 1.6, 0.6], 18, 1.8); }
    if (ev.type === 'hit') {
      const who = ev.side === 'P' ? player : B.npc, smash = ev.shot === 'smash', kmh = Math.round(ev.speed * 3.6), D = B.D, sname = (D.shots[ev.shot] || {}).zh || '';
      bmFlash(who, smash); bmThock(ev.speed, smash);
      if (smash) { BM.shake = ev.q === 'perfect' ? 0.5 : 0.28; if (ev.q === 'perfect') B.stop = 0.07; const sp = $('bmSpeed'); sp.style.transition = 'none'; sp.style.opacity = ev.side === 'P' ? '0.75' : '0.4'; requestAnimationFrame(() => { sp.style.transition = 'opacity .45s ease-out'; sp.style.opacity = '0'; }); }
      if (ev.side === 'P' && !ev.serve) {
        const n = B.lastNote || {}, ql = (D.quality[ev.q] || {}).label_zh || '';
        if (smash) bmLabel(`${esc(sname)} ${kmh} km/h · ${esc(ql)}`, 'big', who, 1.4);
        else bmLabel(`${esc(ql)} ${esc(sname)}${n.tg ? `<small>${esc(n.tg)}</small>` : ''}${n.foot ? `<small>${esc(n.foot)}</small>` : ''}`, ev.q === 'perfect' ? 'good' : n.risky ? 'bad' : '', who);
        B.lastNote = null;
      } else if (ev.side === 'O') bmLabel(smash ? `${esc(sname)} ${kmh} km/h` : esc(sname), smash ? 'bad' : '', who, smash ? 1.2 : 0.8);
    }
    if (ev.type === 'point') { const l = m.fl && m.fl.land; if (l) { const fx = BM.fx; fx.mark.position.x = l.x; fx.mark.position.z = l.z; fx.mark.material.color.copy(ev.why === 'in' ? BM_COL.green : BM_COL.red); fx.markT = 1.6; } }
    if (ev.type === 'hit' && ev.side === 'O') SFX.tick();
    if (ev.type === 'miss' && ev.side === 'O' && ev.why === 'leave') bmPop('对手没接：看会不会出界…', '', 0.9);
    if (ev.type === 'miss' && ev.side === 'P') { if (ev.why === 'leave') bmPop(B.D.misses.leave.zh, 'good'); else if (ev.why !== 'early') { bmPop(B.D.misses[ev.why].zh, 'bad'); SFX.bad(); } }
    if (ev.type === 'point') { if (BMV.v) BMV.v.cheer(ev.winner === 'P' ? 1 : 0.5); if (B.ctx && B.ctx.event) bmCrowd(ev.winner === 'P' ? 1 : 0.5); bmScore(); const why = { net: '下网', out: '出界', in: '界内' }[ev.why]; bmPop(`${ev.winner === 'P' ? '得分' : '失分'} · ${why}`, ev.winner === 'P' ? 'good' : 'bad', 1.3); (ev.winner === 'P' ? SFX.good : SFX.bad)(); }
    if (ev.type === 'serveReady') bmHint();
    if (ev.type === 'feed') bmScore();
    if (ev.type === 'drillBall') { const r = ev.res; bmScore(); if (r.ok) { bmPop(`+${r.pts}${r.foot ? ' · ' + B.D.footwork.zh[r.foot] : ''}`, r.pts >= 4 ? 'good' : '', 1.0); SFX.good(); } else { bmPop({ net: '下网', out: '出界', early: '早了', late: '晚了', far: '够不到', miss: '没接到', leave: '没接' }[r.why] || '没接到', 'bad', 1.0); SFX.bad(); } }
    if (ev.type === 'over' && ev.drill) { bmPop(`训练结束 · ${m.drill.score} 分`, 'good', 2); B.overT = 1.8; continue; }
    if (ev.type === 'over') { const w = ev.winner === 'P'; player.userData.state = w ? 'celebrate' : 'disappointed'; if (B.npc) B.npc.userData.state = w ? 'disappointed' : 'celebrate'; bmPop(w ? `赢了 ${m.score.P}:${m.score.O}！` : `输了 ${m.score.P}:${m.score.O}`, w ? 'good' : 'bad', 3); B.overT = 2.4; }
  }
  if (B.introT > 0) { B.introT -= dt; if (B.introT <= 0) bmHint(); }
  if (B.pop > 0) { B.pop -= dt; if (B.pop <= 0) $('bmPop').classList.remove('on'); }
  if (B.overT != null) { if (m.phase === 'over' && !B.drill) { player.userData.state = m.winner === 'P' ? 'celebrate' : 'disappointed'; if (B.npc) B.npc.userData.state = m.winner === 'P' ? 'disappointed' : 'celebrate'; } B.overT -= dt; if (B.overT <= 0) bmEnd(true); }
}
function bmVisuals(dt, p) {
  const B = BM.m, core = B.core, m = core.m, fx = BM.fx, rg = core.ring();
  // Timing ring: the outer ring closes onto the inner one at the ideal moment; green inside the "good" window.
  if (rg) {
    const left = rg.left, a = Math.abs(left), W = rg.W;
    fx.ring.visible = true; fx.ring.position.x = player.position.x; fx.ring.position.z = player.position.z;
    const k = 1 + Math.min(1.4, Math.max(0, left)) * 1.1; fx.outer.scale.set(k, k, 1);   // v10.3: tighter, the camera is closer now
    const col = !rg.reach ? BM_COL.red : a <= W.good ? BM_COL.green : a <= W.fair ? BM_COL.amber : BM_COL.white;
    fx.outer.material.color.copy(col); fx.inner.material.color.copy(a <= W.perfect && rg.reach ? BM_COL.green : BM_COL.white);
    fx.outer.material.opacity = left < -W.fair ? 0.2 : 0.75; fx.inner.material.opacity = 0.6;
  } else fx.ring.visible = false;
  // Shadow straight below the shuttle: smaller and fainter the higher it is, which is how you read depth.
  if (p) {
    fx.shadow.visible = true; fx.shadow.position.x = p.x; fx.shadow.position.z = p.z;
    const h = Math.max(0, p.y), s = 1 / (1 + h * 0.35); fx.shadow.scale.set(s, s, 1); fx.shadow.material.opacity = 0.42 * s;
    // Trail: last ~0.3 s of flight; amber for a smash-speed shuttle.
    const P = fx.pos, N = fx.N;
    P.copyWithin(3, 0, (N - 1) * 3); P[0] = p.x; P[1] = Math.max(0.03, p.y); P[2] = p.z; fx.n = Math.min(N, fx.n + 1);
    if (fx.n === 1) for (let i = 1; i < N; i++) { P[i * 3] = p.x; P[i * 3 + 1] = Math.max(0.03, p.y); P[i * 3 + 2] = p.z; }
    fx.trail.geometry.attributes.position.needsUpdate = true; fx.trail.geometry.setDrawRange(0, fx.n); fx.trail.visible = true;
    const spd = Math.hypot(p.vx, p.vy, p.vz); fx.trail.material.color.copy(spd > B.D.smashSpeed ? BM_COL.smash : BM_COL.white); fx.trail.material.opacity = Math.min(0.7, 0.15 + spd / 40);
    // v10.3 ribbon: a camera-facing strip over the last few metres of flight, wider and amber at smash speed
    fx.trail.visible = false;
    const H = fx.rhist; H.unshift(p.x, Math.max(0.03, p.y), p.z); if (H.length > fx.RN * 3) H.length = fx.RN * 3;
    const fast = spd > B.D.smashSpeed, maxL = fast ? 4.5 : 2.4, w0 = fast ? 0.15 : 0.065, n = H.length / 3, R = fx.rpos, Cc = fx.rcol, cp = cam.position;
    const base = fast ? [2.6, 1.5, 0.45] : [1.3, 1.4, 1.5];
    let L = 0, last = 0;
    for (let i = 0; i < fx.RN; i++) {
      const j = Math.min(i, n - 1), x = H[j * 3], y = H[j * 3 + 1], z = H[j * 3 + 2];
      if (i > 0 && i < n) L += Math.hypot(x - H[(j - 1) * 3], y - H[(j - 1) * 3 + 1], z - H[(j - 1) * 3 + 2]);
      const a = Math.max(0, j - 1), b = Math.min(n - 1, j + 1);
      _bv1.set(H[a * 3] - H[b * 3], H[a * 3 + 1] - H[b * 3 + 1], H[a * 3 + 2] - H[b * 3 + 2]); _bv2.set(x - cp.x, y - cp.y, z - cp.z);
      _bv3.crossVectors(_bv1, _bv2); const ln = _bv3.length() || 1;
      const f = i >= n || L > maxL ? 0 : Math.pow(1 - Math.min(1, L / maxL), 1.4), w = w0 * f / ln;
      R[i * 6] = x + _bv3.x * w; R[i * 6 + 1] = y + _bv3.y * w; R[i * 6 + 2] = z + _bv3.z * w; R[i * 6 + 3] = x - _bv3.x * w; R[i * 6 + 4] = y - _bv3.y * w; R[i * 6 + 5] = z - _bv3.z * w;
      for (let k = 0; k < 2; k++) { Cc[i * 6 + k * 3] = base[0] * f; Cc[i * 6 + k * 3 + 1] = base[1] * f; Cc[i * 6 + k * 3 + 2] = base[2] * f; }
      last = i;
    }
    fx.ribbon.geometry.attributes.position.needsUpdate = true; fx.ribbon.geometry.attributes.color.needsUpdate = true; fx.ribbon.visible = n > 1 && last > 0;
  } else { fx.shadow.visible = false; fx.trail.visible = false; fx.n = 0; fx.rhist.length = 0; fx.ribbon.visible = false; }
  // where you are running to: a small yellow ring, like the reference broadcast games
  { const P = m.ch.P, far = P.moving && Math.hypot(P.tx - P.x, P.tz - P.z) > 0.5, g = fx.goal; g.position.x = P.tx; g.position.z = P.tz;
    g.material.opacity += ((far ? 0.95 : 0) - g.material.opacity) * Math.min(1, dt * 10); g.visible = g.material.opacity > 0.02; }
  if (fx.markT > 0) { fx.markT -= dt; fx.mark.material.opacity = Math.min(1, fx.markT) * 0.9; const k = 1 + (1.6 - fx.markT) * 0.6; fx.mark.scale.set(k, k, 1); }
  // A short swing pose is already shown for 0.35 s after each hit; lean the player toward the shuttle while it is coming.
  if (rg && rg.reach && player.userData.state !== 'play') player.rotation.y = Math.PI + Math.max(-0.5, Math.min(0.5, (rg.c.x - player.position.x) * 0.4));
}
/* Step 3: post-match review (analysis in BMCore.review, words in badminton-tactics.json). History: last 10 games, local only. */
const BM_HIST = 'prof-bm-hist-v1';
function bmHist(add) {
  let h = []; try { h = JSON.parse(localStorage.getItem(BM_HIST) || '[]'); } catch (e) { h = []; }
  if (add) { h.push(add); h = h.slice(-10); try { localStorage.setItem(BM_HIST, JSON.stringify(h)); } catch (e) { /* storage blocked */ } }
  return h;
}
function bmCourtSVG(dots, cx) {
  const s = 17, W = 6.1 * s, H = 13.4 * s, X = (x) => (x - cx + 3.05) * s + 6, Y = (z) => (z - 6.3) * s + 6;
  const ln = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  const sx = 0.46 * s, ss = 1.98 * s, net = 6.7 * s + 6;
  const col = { win: '#3DDC97', err: '#ff6b5e', rally: '#00A9F4' };
  const dd = dots.map(d => `<circle cx="${X(d.x).toFixed(1)}" cy="${Y(d.z).toFixed(1)}" r="${d.kind === 'rally' ? 2.4 : 3.6}" fill="${d.side === 'P' ? col[d.kind] : (d.kind === 'win' ? '#FFB547' : 'rgba(205,238,255,.35)')}" ${d.kind === 'err' && d.side === 'P' ? 'stroke="#fff" stroke-width=".8"' : ''}/>`).join('');
  return `<svg width="${W + 12}" height="${H + 12}" viewBox="0 0 ${W + 12} ${H + 12}" role="img" aria-label="落点图"><g stroke="rgba(234,244,251,.55)" stroke-width="1" fill="none">
    <rect x="6" y="6" width="${W}" height="${H}"/>${ln(6 + sx, 6, 6 + sx, H + 6)}${ln(W + 6 - sx, 6, W + 6 - sx, H + 6)}
    ${ln(6, net - ss, W + 6, net - ss)}${ln(6, net + ss, W + 6, net + ss)}${ln(W / 2 + 6, 6, W / 2 + 6, net - ss)}${ln(W / 2 + 6, net + ss, W / 2 + 6, H + 6)}</g>
    <line x1="2" y1="${net}" x2="${W + 10}" y2="${net}" stroke="#fff" stroke-width="2"/>${dd}
    <text x="${W / 2 + 6}" y="${net - 4}" fill="rgba(205,238,255,.6)" font-size="9" text-anchor="middle">对手半场</text><text x="${W / 2 + 6}" y="${net + 12}" fill="rgba(205,238,255,.6)" font-size="9" text-anchor="middle">你的半场</text></svg>`;
}
function bmReviewHTML(B, done) {
  const m = B.core.m, w = done && m.winner === 'P';
  const title = `<h3>${done ? (w ? '你赢了' : '输了') : '没打完'} ${m.score.P}:${m.score.O}</h3><p>${done ? esc(w ? B.O.lines.win_zh : B.O.lines.lose_zh) : ''}</p>`;
  if (!window.BMCore.review || m.points.length < 3) return title + `<p>完美 ${m.stats.perfect} 次 · 杀球 ${m.stats.smashes} 次 · 最长回合 ${m.stats.longest} 拍</p>`;
  const R = BMCore.review(m, B.D, 'zh'), n = R.nums;
  const h = bmHist(done ? { t: Date.now(), opp: B.opp, P: m.score.P, O: m.score.O, u: n.unforced, ms: n.meanMs } : null).slice(-10);
  const trend = h.length > 1 ? `<div class="lg" style="margin-top:6px">最近 ${h.length} 局主动失误：${h.map(x => x.u).join(' · ')}　出手偏差：${h.map(x => (x.ms > 0 ? '+' : '') + x.ms).join(' · ')} ms</div>` : '';
  const ms = n.meanMs === 0 ? '准' : `${n.meanMs < 0 ? '早' : '晚'} ${Math.abs(n.meanMs)} ms`;
  return title + `<div class="bmRev">${bmCourtSVG(R.dots, B.D.court.cx)}<div style="min-width:0">
    <div class="head">${esc(R.headline)}</div>${R.items[1] ? `<div style="font-size:13px;color:#CDEEFF;margin:-4px 0 6px">${esc(R.items[1].text)}</div>` : ''}
    ${Object.keys(R.oppPat || {}).length && B.D.tactics.patterns ? `<div class="lg" style="margin-bottom:6px">${esc(B.O.name_zh)}这局的套路：${Object.entries(R.oppPat).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${B.D.tactics.patterns[k] ? B.D.tactics.patterns[k].zh : k} ${v} 次`).join(' · ')}</div>` : ''}
    <div class="num"><span>制胜球</span><b>${n.winners}</b><span>主动失误</span><b>${n.unforced}</b><span>被动失误</span><b>${n.forced}</b><span>时机失误（早/晚）</span><b>${n.timingMiss}</b><span>被调动够不到</span><b>${n.far}</b><span>出手平均偏差</span><b>${ms}</b><span>稳定度（±）</span><b>${n.sdMs} ms</b><span>最长回合</span><b>${n.longest} 拍</b><span>马来步 / 中国跳</span><b>${n.malay} / ${n.china}</b></div>
    ${R.cues.map(c => `<div class="cue">${esc(c.text)}</div>`).join('')}
    <div class="lg"><i style="background:#3DDC97"></i>你的得分球<i style="background:#ff6b5e"></i>你的失误<i style="background:#00A9F4"></i>你的来回球<i style="background:#FFB547"></i>对手得分球</div>${trend}
  </div></div>`;
}
function bmEnd(done) {
  const B = BM.m; if (!B) return;
  bmShowRackets(false);
  BM.m = null;
  document.body.classList.remove('bm'); $('bm').classList.add('hidden'); $('bmPop').className = '';
  if (B.sh.parent) B.sh.parent.remove(B.sh);
  if (BM.fx) [BM.fx.ring, BM.fx.shadow, BM.fx.mark, BM.fx.trail, BM.fx.ribbon, BM.fx.goal, ...BM.fx.flashes].forEach(o => o.parent && o.parent.remove(o));
  $('bmLabels').innerHTML = ''; BM.labels = []; BM.shake = 0;
  B.decor.forEach(b => { b.m.visible = true; });
  const home = () => {
    player.scale.setScalar(1); if (B.npc) B.npc.scale.setScalar(1);
    if (B.npc && B.npcHome) { B.npc.position.copy(B.npcHome); B.npc.rotation.y = B.npcRot; B.npc.userData.state = B.npc.userData.baseState || 'idle'; B.npc.visible = B.npcVis; }
    if (B.aqHome) { NPC.grad1.position.copy(B.aqHome); NPC.grad1.rotation.y = B.aqRot; }
  };
  if (BMV.cur) BMV.restore.unshift(home); else home();   // opponents stay on the venue for the review, go home when it closes
  const m = B.core.m;
  if (S.quick) return quickEnd(B, done);
  if (!done) { bmVenueOff(); pose('idle', 20, 17.5, Math.PI); if (B.ctx && B.ctx.event) { toast('比赛中途离场，算物理系输了。', 'bad'); bmAfter(B.opp, false, B.ctx, `${m.score.P}:${m.score.O}`); } else toast('不打了，收拍。'); return; }
  const w = m.winner === 'P';
  // Career: the review comes first, with the clock held; "继续" runs the usual 30-minute activity.
  const wasPaused = S.paused; S.paused = true;
  document.body.classList.add('bm'); $('bm').classList.remove('hidden'); $('bmQuit').classList.add('hidden'); $('bmHint').textContent = '赛后复盘 · 看完再走';
  const box = $('bmEndBox'); box.className = 'panel rev';
  box.innerHTML = bmReviewHTML(B, true) + '<button class="btn gold" type="button" id="bmGo">收拍 · 继续（30 分钟） <span class="key" style="border-color:rgba(0,0,0,.4);color:#1a1205">Enter</span></button>';
  $('bmGo').onclick = () => {
    box.className = 'panel hidden'; document.body.classList.remove('bm'); $('bm').classList.add('hidden'); S.paused = wasPaused; bmVenueOff();
    toast(`${w ? '赢了' : '输了'} ${m.score.P}:${m.score.O} · ${(w ? B.O.lines.win_zh : B.O.lines.lose_zh)}`, w ? 'good' : '');
    if (m.chinaUses) S.v.energy = clamp(S.v.energy - B.D.footwork.chinaEnergy * m.chinaUses);   // jumping costs legs
    bmAfter(B.opp, w, B.ctx, `${m.score.P}:${m.score.O}`);
  };
  $('bmGo').focus({ preventScroll: true });
}
/* Quick play from the title page: one match in the gym, no career, nothing saved. */
const BM_BEST = 'prof-bm-drill-best-v1';
function bmBest(id, score) {
  let b = {}; try { b = JSON.parse(localStorage.getItem(BM_BEST) || '{}'); } catch (e) { b = {}; }
  if (score != null && score > (b[id] || 0)) { b[id] = score; try { localStorage.setItem(BM_BEST, JSON.stringify(b)); } catch (e) { /* storage blocked */ } }
  return b[id] || 0;
}
// Title page → gym, then a small menu: two opponents and two drills.
function quickMenu() { quickBadminton(null); }
function showQuickMenu() {
  S.running = false;
  document.body.classList.add('bm'); $('bm').classList.remove('hidden'); $('bmQuit').classList.add('hidden');
  $('bmScore').classList.remove('pills'); $('bmScore').innerHTML = '<span>体育馆 · 2 号场</span>'; $('bmHint').textContent = '快速对局和训练都不影响职业生涯存档。';
  const box = $('bmEndBox'); box.className = 'panel';
  box.innerHTML = `<h3>打一局，还是练一练？</h3>
    <button class="btn gold" type="button" data-o="aqiang">对阿丹 · 研究生 · 业余</button>
    <button class="btn" type="button" data-o="wu">对阿龙 · 化学系博士后 · 校队</button>
    <button class="btn" type="button" data-o="jay">对阿伟 · 槟城来的交换博士后 · 快攻</button>
    <p style="margin-top:6px">训练 · 每组 10 球</p>
    <button class="btn" type="button" data-d="rearHead">后场头顶区 · 马来步还是中国跳${bmBest('rearHead') ? ` · 最好 ${bmBest('rearHead')} 分` : ''}</button>
    <button class="btn" type="button" data-d="defense">接杀 · 挡网前或挑后场${bmBest('defense') ? ` · 最好 ${bmBest('defense')} 分` : ''}</button>
    <button class="btn ghost" type="button" id="bmHome">回首页</button>`;
  box.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => quickBadminton(b.dataset.o); });
  box.querySelectorAll('[data-d]').forEach(b => { b.onclick = () => quickBadminton('aqiang', b.dataset.d); });
  $('bmHome').onclick = quickHome;
}
function quickHome() { fadeTo(() => { bmVenueOff(); $('bmEndBox').className = 'panel hidden'; document.body.classList.remove('bm'); $('bm').classList.add('hidden'); S = null; if (player) player.visible = false; setZone('f5'); camState.orbit = 0.0001; show('scrTitle'); }); }
function quickBadminton(opp = 'aqiang', drillId) {
  ensureAudio(); if (actx && actx.state === 'suspended') actx.resume();
  fadeTo(() => {
    if (!S || !S.quick) { S = newState(freshCareer()); S.quick = true; }
    Object.assign(S, { day: 0, t: hm(17, 30), running: true, paused: false, planning: false, activity: null, dialog: null, ended: false, path: [], autoTarget: null, v: { energy: 85, full: 60, bladder: 15 } });
    setZone('gym'); if (!player || !player.parent) makePlayer(setup.avatar === 'f'); player.visible = true;
    camState.orbit = 0; camState.overview = false; camState.wantAz = camState.az = 0; camState.target.set(20, 0, 14);
    show(null); $('hud').classList.add('hidden');
    $('bmEndBox').className = 'panel hidden';
    bmVenueOn(); pose('idle', 20, 17.2, Math.PI);
    if (!opp) return showQuickMenu();
    bmStart(opp, drillId);
  });
}
function quickEnd(B, done) {
  const m = B.core.m, w = done && m.winner === 'P', st = m.stats;
  S.running = false;
  if (B.drill) return drillEnd(B, done);
  document.body.classList.add('bm'); $('bm').classList.remove('hidden'); $('bmQuit').classList.add('hidden');
  $('bmScore').classList.remove('pills'); $('bmScore').innerHTML = `<span>你</span><b>${m.score.P}</b><span>:</span><b>${m.score.O}</b><span>${esc(B.O.name_zh)}</span>`;
  $('bmHint').textContent = '这是快速对局，不影响职业生涯存档。';
  const box = $('bmEndBox');
  box.className = 'panel rev';
  box.innerHTML = bmReviewHTML(B, done) + `
    <button class="btn gold" type="button" data-o="${B.opp}">再来一局</button>
    ${(() => { const nx = { aqiang: 'wu', wu: 'jay', jay: 'aqiang' }[B.opp] || 'aqiang', o = B.D.opponents[nx]; return `<button class="btn" type="button" data-o="${nx}">${nx === 'aqiang' ? '换' : '挑战'}${esc(o.name_zh)}（${esc(o.level_zh)}）</button>`; })()}
    <button class="btn ghost" type="button" id="bmMenu">回菜单</button><button class="btn ghost" type="button" id="bmHome">回首页</button>`;
  box.classList.remove('hidden');
  box.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => { box.classList.add('hidden'); quickBadminton(b.dataset.o); }; });
  $('bmMenu').onclick = showQuickMenu;
  $('bmHome').onclick = () => fadeTo(() => { bmVenueOff(); box.classList.add('hidden'); document.body.classList.remove('bm'); $('bm').classList.add('hidden'); S = null; if (player) player.visible = false; setZone('f5'); camState.orbit = 0.0001; show('scrTitle'); });
}
function drillEnd(B, done) {
  const m = B.core.m, R = BMCore.drillReview(m, 'zh'), id = B.drillId, prev = bmBest(id), best = done ? bmBest(id, R.score) : prev;
  document.body.classList.add('bm'); $('bm').classList.remove('hidden'); $('bmQuit').classList.add('hidden');
  bmScoreStatic(`<span>${esc(B.drill.zh)}</span><b>${R.score}</b><span>/ ${R.max} 分</span>`);
  $('bmHint').textContent = '训练不影响职业生涯存档。';
  const box = $('bmEndBox'); box.className = 'panel';
  const dots = m.drill.results.map(r => `<span title="${r.tag}" style="display:inline-block;width:22px;text-align:center;font-weight:800;color:${r.ok ? (r.pts >= 4 ? '#3DDC97' : '#CDEEFF') : '#ff6b5e'}">${r.ok ? r.pts : '×'}</span>`).join('');
  box.innerHTML = `<h3>${done ? '训练完成' : '没练完'} · ${esc(B.drill.zh)}</h3>
    <p>${R.ok} / ${R.balls} 球回到界内${R.right != null ? ` · 步法选对 ${R.right} 次` : ''}${R.meanMs ? ` · 出手平均${R.meanMs < 0 ? '早' : '晚'} ${Math.abs(R.meanMs)} ms` : ''}<br>${done && R.score > prev && prev ? '新纪录！' : ''}最好成绩 ${best} 分</p>
    <div style="font-family:var(--mono,monospace);font-size:14px">${dots}</div>
    <div class="cue" style="text-align:left;border-left:2px solid #00A9F4;padding-left:10px;font-size:13px;color:#CDEEFF;line-height:1.6">${esc(R.tip)}</div>
    <button class="btn gold" type="button" id="bmAgain">再练一组</button><button class="btn ghost" type="button" id="bmMenu">回菜单</button><button class="btn ghost" type="button" id="bmHome">回首页</button>`;
  box.classList.remove('hidden');
  $('bmAgain').onclick = () => quickBadminton('aqiang', id); $('bmMenu').onclick = showQuickMenu; $('bmHome').onclick = quickHome;
}
function bmScoreStatic(html) { $('bmScore').classList.remove('pills'); $('bmScore').innerHTML = html; }
