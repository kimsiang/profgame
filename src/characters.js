/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   CHARACTERS — chibi toon people with faces and outlines
   ========================================================= */
const toonCache = {};
/* v7: a fresnel rim on every character material. RIM.value is retinted by lighting(): warm by day, cyan at night. */
const RIM = { value: new THREE.Color('#ffe0b8') };
// v12.4: the Q版 cast are vinyl figurines (PBR, same light and HDRI as the room). The name 'toon' stays for its callers.
function toon(color, o = {}) {
  const k = color + JSON.stringify(o);
  return toonCache[k] || (toonCache[k] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.48, metalness: 0, envMapIntensity: 0.9 }, o)));
}
function part(geo, m, parent, x = 0, y = 0, z = 0) {   // v12.4: no ink outline on figurines
  const mesh = new THREE.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = false; parent.add(mesh);
  return mesh;
}
/* faces are painted on a front patch of the head sphere */
const faceCache = {};
function faceTex(expr, eye = '#3a2618', brow = '#2a1c14') {
  const k = expr + eye + brow; if (faceCache[k]) return faceCache[k];
  const t = canvasTex(256, 256, (g) => {
    const L = 81, R = 175, Y = 150;
    const eyeOval = (x, ry = 22, rx = 15) => { g.fillStyle = eye; g.beginPath(); g.ellipse(x, Y, rx, ry, 0, 0, 7); g.fill(); const gr = g.createLinearGradient(0, Y - ry, 0, Y + ry); gr.addColorStop(0, 'rgba(0,0,0,.35)'); gr.addColorStop(1, 'rgba(255,255,255,.18)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, Y, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 5, Y - 9, 6, 0, 7); g.fill(); g.beginPath(); g.arc(x + 5, Y + 8, 2.6, 0, 7); g.fill(); };
    const arcEye = (x, up = true) => { g.strokeStyle = eye; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); up ? g.arc(x, Y + 8, 14, Math.PI * 1.15, Math.PI * 1.85) : g.arc(x, Y - 6, 14, Math.PI * 0.15, Math.PI * 0.85); g.stroke(); };
    const brows = (dy = 0, tilt = 0) => { g.strokeStyle = brow; g.lineWidth = 6; g.lineCap = 'round'; [L, R].forEach((x, i) => { const s = i ? -1 : 1; g.beginPath(); g.moveTo(x - 16, Y - 36 + dy + tilt * s); g.quadraticCurveTo(x, Y - 44 + dy, x + 16, Y - 36 + dy - tilt * s); g.stroke(); }); };
    const blush = (a = 0.32) => { g.fillStyle = `rgba(255,120,130,${a})`; [L - 4, R + 4].forEach(x => { g.beginPath(); g.ellipse(x, Y + 30, 17, 8, 0, 0, 7); g.fill(); }); };
    g.lineCap = 'round';
    if (expr === 'happy') { arcEye(L); arcEye(R); brows(-4); blush(0.45); g.fillStyle = '#7a2b2b'; g.beginPath(); g.moveTo(110, 186); g.quadraticCurveTo(128, 214, 146, 186); g.closePath(); g.fill(); g.fillStyle = '#ff8a8a'; g.beginPath(); g.ellipse(128, 200, 8, 4, 0, 0, 7); g.fill(); }
    else if (expr === 'worried') { eyeOval(L, 19, 13); eyeOval(R, 19, 13); brows(-2, -8); blush(0.25); g.strokeStyle = '#7a3b2b'; g.lineWidth = 4; g.beginPath(); g.moveTo(114, 194); g.quadraticCurveTo(121, 188, 128, 194); g.quadraticCurveTo(135, 200, 142, 194); g.stroke(); }
    else if (expr === 'shock') { [L, R].forEach(x => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, Y, 15, 19, 0, 0, 7); g.fill(); g.strokeStyle = eye; g.lineWidth = 3; g.stroke(); g.fillStyle = eye; g.beginPath(); g.arc(x, Y + 2, 6, 0, 7); g.fill(); }); brows(-10, 4); g.fillStyle = '#7a2b2b'; g.beginPath(); g.ellipse(128, 198, 9, 12, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(120,200,255,.9)'; g.beginPath(); g.moveTo(212, 92); g.quadraticCurveTo(226, 116, 212, 122); g.quadraticCurveTo(198, 116, 212, 92); g.fill(); }
    else if (expr === 'sleepy') { [L, R].forEach(x => { g.strokeStyle = eye; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 14, Y + 4); g.lineTo(x + 14, Y + 4); g.stroke(); }); brows(2, -3); g.strokeStyle = '#7a3b2b'; g.lineWidth = 4; g.beginPath(); g.arc(128, 192, 6, 0, Math.PI); g.stroke(); }
    else if (expr === 'blink') { arcEye(L, false); arcEye(R, false); brows(); blush(0.28); g.strokeStyle = '#7a3b2b'; g.lineWidth = 4; g.beginPath(); g.arc(128, 186, 10, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
    else { eyeOval(L); eyeOval(R); brows(); blush(0.28); g.strokeStyle = '#7a3b2b'; g.lineWidth = 4; g.beginPath(); g.arc(128, 186, 10, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke(); }
  });
  faceCache[k] = t; return t;
}
const geo = {
  head: new THREE.SphereGeometry(0.27, 32, 24),
  face: new THREE.SphereGeometry(0.2725, 24, 16, Math.PI / 2 - 0.9, 1.8, Math.PI / 2 - 0.75, 1.5),
  ear: new THREE.SphereGeometry(0.06, 10, 8),
  neck: new THREE.CylinderGeometry(0.07, 0.08, 0.12, 12),
  torso: new THREE.LatheGeometry([[0, 0], [0.17, 0], [0.22, 0.06], [0.235, 0.2], [0.225, 0.34], [0.19, 0.43], [0.1, 0.48], [0, 0.49]].map(p => new THREE.Vector2(p[0], p[1])), 28),
  coat: new THREE.LatheGeometry([[0.27, 0], [0.265, 0.12], [0.252, 0.32], [0.24, 0.46], [0.2, 0.55], [0.12, 0.58]].map(p => new THREE.Vector2(p[0], p[1])), 28, 0.42, Math.PI * 2 - 0.84),
  arm: (() => { const g = new THREE.CylinderGeometry(0.062, 0.054, 0.34, 12); g.translate(0, -0.17, 0); return g; })(),
  // v7: jointed limbs (upper/lower) so sitting, typing and talking read as poses rather than stiff sticks
  upperArm: (() => { const g = new THREE.CylinderGeometry(0.064, 0.058, 0.19, 12); g.translate(0, -0.085, 0); return g; })(),
  foreArm: (() => { const g = new THREE.CylinderGeometry(0.058, 0.05, 0.19, 12); g.translate(0, -0.085, 0); return g; })(),
  elbow: new THREE.SphereGeometry(0.06, 12, 10),
  thigh: (() => { const g = new THREE.CylinderGeometry(0.084, 0.08, 0.19, 12); g.translate(0, -0.085, 0); return g; })(),
  shin: (() => { const g = new THREE.CylinderGeometry(0.08, 0.072, 0.19, 12); g.translate(0, -0.085, 0); return g; })(),
  knee: new THREE.SphereGeometry(0.08, 12, 10),
  hand: new THREE.SphereGeometry(0.068, 12, 10),
  leg: (() => { const g = new THREE.CylinderGeometry(0.082, 0.075, 0.34, 12); g.translate(0, -0.17, 0); return g; })(),
  shoe: new THREE.SphereGeometry(0.1, 14, 10),
  cap: new THREE.SphereGeometry(0.29, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
  bobShell: new THREE.SphereGeometry(0.3, 28, 18, Math.PI / 2 + 0.78, Math.PI * 2 - 1.56, 0.25, Math.PI * 0.42),
  longShell: new THREE.SphereGeometry(0.305, 28, 18, Math.PI / 2 + 0.72, Math.PI * 2 - 1.44, 0.25, Math.PI * 0.55),
  fringe: new THREE.SphereGeometry(0.11, 12, 8),
  spike: new THREE.ConeGeometry(0.075, 0.2, 8),
  pony: new THREE.SphereGeometry(0.1, 14, 10),
  bun: new THREE.SphereGeometry(0.12, 16, 12),
  ring: new THREE.TorusGeometry(0.255, 0.055, 8, 28, Math.PI * 1.35),
  lens: new THREE.TorusGeometry(0.068, 0.012, 8, 22),
};
function makeChar(o = {}, parent = Z.group) {
  const root = new THREE.Group(); const body = new THREE.Group(); root.add(body);
  const skin = toon(o.skin || '#f3cba8'), shirt = toon(o.shirt || '#2251FF'), pants = toon(o.pants || '#26364a'), hairM = toon(o.hair || '#1c1c22');
  const P = {};
  const LO = !!o.low, OL = (v) => LO ? 0 : v;
  ['L', 'R'].forEach((s, i) => { const hip = new THREE.Group(); hip.position.set(i ? 0.1 : -0.1, 0.44, 0); body.add(hip); if (!LO) { part(geo.thigh, pants, hip); const kn = new THREE.Group(); kn.position.set(0, -0.17, 0); hip.add(kn); part(geo.knee, pants, kn, 0, 0, 0, 0.012); part(geo.shin, pants, kn); const sh = part(geo.shoe, toon(o.shoes || '#1b2430'), kn, 0, -0.21, 0.04); sh.scale.set(0.9, 0.55, 1.35); P['kn' + s] = kn; } P['hip' + s] = hip; });
  P.torso = part(geo.torso, shirt, body, 0, 0.42, 0, OL(0.016));
  if (o.coat) part(geo.coat, toon(o.coat, { side: THREE.DoubleSide }), body, 0, 0.3, 0, 0.012);
  if (o.tie) { const tie = part(new THREE.BoxGeometry(0.05, 0.22, 0.02), toon(o.tie), body, 0, 0.74, 0.215, 0.008); tie.rotation.x = -0.12; }
  if (o.badge) part(new THREE.BoxGeometry(0.08, 0.1, 0.01), toon('#ffffff'), body, 0.13, 0.7, 0.24, 0.006);
  if (!LO) part(geo.neck, skin, body, 0, 0.93, 0, 0.01);
  ['L', 'R'].forEach((s, i) => { const sh = new THREE.Group(); sh.position.set(i ? 0.265 : -0.265, 0.86, 0); sh.rotation.z = i ? 0.12 : -0.12; body.add(sh); const am = o.coat ? toon(o.coat) : shirt;
    if (LO) part(geo.arm, am, sh, 0, 0, 0, 0);
    else { part(geo.upperArm, am, sh, 0, 0, 0, 0.016); const el = new THREE.Group(); el.position.set(0, -0.17, 0); sh.add(el); part(geo.elbow, am, el, 0, 0, 0, 0.012); part(geo.foreArm, am, el); part(geo.hand, skin, el, 0, -0.2, 0, 0.012); P['el' + s] = el; }
    P['sh' + s] = sh; });
  const head = new THREE.Group(); head.position.set(0, 1.2, 0); body.add(head); P.head = head;
  part(geo.head, skin, head, 0, 0, 0, OL(0.018));
  if (!LO) { part(geo.ear, skin, head, -0.265, -0.02, 0, 0.01); part(geo.ear, skin, head, 0.265, -0.02, 0, 0.01); }
  const faceM = new THREE.MeshStandardMaterial({ map: faceTex('normal', o.eye, o.brow), transparent: true, alphaTest: 0.35, roughness: 0.48, polygonOffset: true, polygonOffsetFactor: -1 });
  const face = new THREE.Mesh(geo.face, faceM); head.add(face);
  const hs = o.hairStyle || 'short';
  if (hs !== 'bald') { const c = part(geo.cap, hairM, head, 0, 0.012, -0.005, OL(0.016)); c.rotation.x = -0.32; }
  if (LO) { root.userData = Object.assign(root.userData, { P, faceM, face: o, state: 'sit', expr: 'normal', blinkT: 99, phase: Math.random() * 6, baseY: 0, emote: null, seated: true }); parent.add(root); return root; }
  if (hs === 'short' || hs === 'spiky') { [-0.1, 0, 0.1].forEach((x, i) => { const f = part(geo.fringe, hairM, head, x, 0.17 - Math.abs(x) * 0.3, 0.19, 0); f.scale.set(1, 0.55, 0.7); f.rotation.z = (i - 1) * 0.3; }); }
  if (hs === 'spiky') for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const s = part(geo.spike, hairM, head, Math.cos(a) * 0.17, 0.24, Math.sin(a) * 0.17 - 0.03, 0.012); s.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8); }
  if (hs === 'bob' || hs === 'pony' || hs === 'bun' || hs === 'long') { part(hs === 'long' ? geo.longShell : geo.bobShell, toon(o.hair || '#1c1c22', { side: THREE.DoubleSide }), head, 0, 0.0, 0, 0.012); [-0.13, 0.13].forEach(x => { const f = part(geo.fringe, hairM, head, x, 0.14, 0.18, 0); f.scale.set(1.1, 0.6, 0.6); }); }
  if (hs === 'pony') { const p = part(geo.pony, hairM, head, 0, -0.04, -0.33, 0.014); p.scale.set(1, 1.9, 1); part(new THREE.TorusGeometry(0.05, 0.018, 6, 12), toon(o.accent || '#ff5a6e'), head, 0, 0.12, -0.29, 0).rotation.x = 1.2; }
  if (hs === 'bun') part(geo.bun, hairM, head, 0, 0.22, -0.2, 0.014);
  if (hs === 'bald') { const r = part(geo.ring, hairM, head, 0, 0.02, 0, 0.012); r.rotation.set(Math.PI / 2, 0, Math.PI * 0.32 + Math.PI / 2); }
  if (o.glasses) { const gm = toon(o.glasses === true ? '#141a22' : o.glasses); [-0.088, 0.088].forEach(x => part(geo.lens, gm, head, x, -0.035, 0.275, 0)); part(new THREE.BoxGeometry(0.06, 0.012, 0.012), gm, head, 0, -0.03, 0.285, 0); }
  if (o.mic) { const m = part(new THREE.CylinderGeometry(0.025, 0.02, 0.22, 8), toon('#222'), P.shR, 0, -0.42, 0.06, 0.008); m.rotation.x = 1.2; part(new THREE.SphereGeometry(0.045, 10, 8), toon('#444'), m, 0, 0.12, 0, 0.008); }
  if (o.clipboard) { const cb = part(new THREE.BoxGeometry(0.22, 0.3, 0.02), toon('#c8a46e'), P.shL, 0.02, -0.38, 0.1, 0.008); cb.rotation.x = -0.4; }
  if (o.label) { const s = nameTag(o.label); s.position.y = 1.86; root.add(s); root.userData.tag = s; }
  root.userData = Object.assign(root.userData, { P, faceM, face: o, state: 'idle', expr: 'normal', blinkT: 1 + Math.random() * 3, phase: Math.random() * 6, baseY: 0, emote: null });
  parent.add(root);
  return root;
}
function setExpr(c, e) { const u = c.userData; if (u.expr === e) return; u.expr = e; if (u.model) return applyMorph(c); u.faceM.map = faceTex(e, u.face.eye, u.face.brow); u.faceM.needsUpdate = true; }
function nameTag(text) {
  const fs = 34, c = document.createElement('canvas'), g = c.getContext('2d');
  g.font = `700 ${fs}px ${CN_FONT}`; const tw = g.measureText(text).width;
  const W = Math.ceil(tw + 44), H = 58; c.width = Math.round(W * TEX_SS); c.height = Math.round(H * TEX_SS); g.scale(TEX_SS, TEX_SS); g.font = `700 ${fs}px ${CN_FONT}`;   // v10.4: supersampled
  g.fillStyle = 'rgba(5,28,44,.82)'; const r = 29; g.beginPath(); g.moveTo(r, 0); g.arcTo(W, 0, W, H, r); g.arcTo(W, H, 0, H, r); g.arcTo(0, H, 0, 0, r); g.arcTo(0, 0, W, 0, r); g.fill();
  g.strokeStyle = 'rgba(0,169,244,.7)'; g.lineWidth = 2; g.stroke();
  g.fillStyle = '#EAF4FB'; g.textBaseline = 'middle'; g.fillText(text, 22, 31);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = MAX_ANISO;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true, toneMapped: false }));
  s.scale.set(W * 0.0062, H * 0.0062, 1); s.renderOrder = 10; return s;
}
const EMOTES = {};
['!', '?', '…', 'zz', '♪', '!!'].forEach(k => { EMOTES[k] = canvasTex(128, 128, (g) => { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(64, 56, 52, 44, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(46, 92); g.lineTo(40, 120); g.lineTo(70, 96); g.fill(); g.fillStyle = k === '!!' || k === '!' ? '#FF5A6E' : '#0A2436'; g.font = '900 56px Georgia,serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k, 64, 60); }); });
function setEmote(c, k) {
  const u = c.userData;
  if (u.emote) { c.remove(u.emote); u.emote = null; }
  if (!k) return;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: EMOTES[k], depthTest: false, transparent: true, toneMapped: false }));
  s.scale.set(0.5, 0.5, 1); s.position.y = 2.25; s.renderOrder = 12; c.add(s); u.emote = s; u.emoteT = 0;
}
function animChar(c, t, dt) {
  const u = c.userData, P = u.P; if (!P) return;
  if (u.model) { animModel(c, dt); if (u.emote) { u.emoteT = (u.emoteT || 0) + dt; u.emote.position.y = 2.25 + Math.sin(u.emoteT * 4) * 0.05; } return; }
  const st = u.state, ph = u.phase;
  const lerp = (o, k, v, s = 10) => { o[k] += (v - o[k]) * Math.min(1, dt * s); };
  let hipX = 0, hipXR = 0, shX = 0, shXR = 0, shZ = 0.12, bodyY = 0, headX = 0, headY = 0, lean = 0, elL = -0.18, elR = -0.18, knL = 0, knR = 0;
  if (st === 'walk' || st === 'run') {
    const sp = st === 'run' ? 14 : 9.5, s = Math.sin(t * sp + ph);
    hipX = s * 0.75; hipXR = -s * 0.75; shX = -s * 0.65; shXR = s * 0.65; bodyY = Math.abs(Math.cos(t * sp + ph)) * 0.05; lean = st === 'run' ? 0.18 : 0.06;
    knL = Math.max(0, -s) * 0.9 + 0.1; knR = Math.max(0, s) * 0.9 + 0.1; elL = elR = st === 'run' ? -1.4 : -0.5;
  } else if (st === 'sit' || st === 'type') {
    hipX = hipXR = -1.45; bodyY = 0.06;
    knL = knR = 1.5;
    if (st === 'type') { shX = -0.55 + Math.sin(t * 16 + ph) * 0.05; shXR = -0.55 + Math.sin(t * 16 + ph + 2) * 0.05; elL = elR = -1.25; headX = 0.12; }
    else { shX = shXR = -0.3; elL = elR = -0.9; }
  } else if (st === 'talk') {
    shXR = -0.3 + Math.sin(t * 3 + ph) * 0.25; elR = -1.3 + Math.sin(t * 3 + ph) * 0.4; elL = -0.5; headX = Math.sin(t * 5 + ph) * 0.06; shZ = 0.2;
  } else if (st === 'panic') {
    shX = shXR = -1.9 + Math.sin(t * 14) * 0.3; elL = elR = -1.5; shZ = 0.5; bodyY = Math.abs(Math.sin(t * 12)) * 0.06; headY = Math.sin(t * 9) * 0.25; knL = knR = 0.25;
  } else if (st === 'play') {
    const s = Math.sin(t * 7 + ph); shX = -0.6 + s * 0.9; shXR = -1.9 - s * 1.1; elL = -0.6; elR = -0.9 + s * 0.5; shZ = 0.45; bodyY = Math.abs(Math.sin(t * 7 + ph)) * 0.07; headY = s * 0.2; lean = 0.1; knL = knR = 0.3;
  } else if (st === 'read') {
    hipX = hipXR = -1.45; knL = knR = 1.5; bodyY = 0.06; shX = shXR = -0.5; elL = elR = -1.5; shZ = 0.05; headX = 0.42;
  } else if (st === 'present') {
    shXR = -1.2; elR = -1.0; shZ = 0.15; headY = Math.sin(t * 0.8) * 0.3;
  } else {
    shX = Math.sin(t * 1.6 + ph) * 0.04; shXR = -shX; headY = Math.sin(t * 0.5 + ph) * 0.15;
  }
  if (u.seated && st !== 'type' && st !== 'read') { hipX = hipXR = -1.45; knL = knR = 1.5; bodyY = 0.06; if (st !== 'talk' && st !== 'panic') { shX = shXR = -0.3; elL = elR = -0.9; } }
  lerp(P.hipL.rotation, 'x', hipX); lerp(P.hipR.rotation, 'x', hipXR);
  lerp(P.shL.rotation, 'x', shX); lerp(P.shR.rotation, 'x', shXR);
  lerp(P.shL.rotation, 'z', -shZ); lerp(P.shR.rotation, 'z', shZ);
  if (P.elL) { lerp(P.elL.rotation, 'x', elL); lerp(P.elR.rotation, 'x', elR); lerp(P.knL.rotation, 'x', knL); lerp(P.knR.rotation, 'x', knR); }
  lerp(P.head.rotation, 'x', headX, 6); lerp(P.head.rotation, 'y', headY, 4);
  lerp(c.children[0].rotation, 'x', lean, 6);
  c.children[0].position.y = bodyY + (st === 'idle' || st === 'talk' ? Math.sin(t * 2.2 + ph) * 0.008 : 0);
  P.torso.scale.y = 1 + Math.sin(t * 2.2 + ph) * 0.015;
  c.position.y = u.baseY;
  // blinking
  u.blinkT -= dt;
  if (u.blinkT < 0) { if (u.expr === 'normal') { setExpr(c, 'blink'); u.blinking = 0.12; } u.blinkT = 2.5 + Math.random() * 3.5; }
  if (u.blinking !== undefined && u.blinking > 0) { u.blinking -= dt; if (u.blinking <= 0) { if (u.expr === 'blink') setExpr(c, 'normal'); } }
  if (u.emote) { u.emoteT += dt; u.emote.position.y = 2.25 + Math.sin(u.emoteT * 4) * 0.04; const k = Math.min(1, u.emoteT * 6); u.emote.scale.set(0.5 * k, 0.5 * k, 1); }
}
function face(p, x, z) { p.rotation.y = Math.atan2(x - p.position.x, z - p.position.z); }

/* ---------- cast ---------- */
const CAST = {
  wang: { shirt: '#7a5cff', hair: '#2a1a14', hairStyle: 'bun', pants: '#3a2d4a', label: '王老师', clipboard: true, badge: true },
  chen: { shirt: '#c0392b', hair: '#121216', hairStyle: 'spiky', glasses: true, pants: '#2b3b4f', label: '小陈' },
  zhou: { shirt: '#f2c574', hair: '#3a2418', hairStyle: 'pony', pants: '#3b4a5a', label: '小周', accent: '#2251FF' },
  yu: { shirt: '#0f8b8d', hair: '#2b1a12', hairStyle: 'bob', pants: '#2a3442', label: '小雨', eye: '#2b2a3a' },
  lin: { shirt: '#c86b3c', coat: '#f3f1ec', hair: '#1a1a1e', hairStyle: 'short', label: '小林', glasses: '#2251FF', badge: true },
  zhao: { shirt: '#24364a', hair: '#121216', hairStyle: 'short', glasses: true, pants: '#1b2430', label: '赵博士' },
  dean: { shirt: '#e8edf2', coat: '#2f3e52', tie: '#c0392b', hair: '#9a9a9e', hairStyle: 'bald', glasses: true, pants: '#2f3e52', label: '院长', skin: '#efc6a2' },
  rep: { shirt: '#e74c3c', hair: '#3a2418', hairStyle: 'long', pants: '#1b2430', label: '记者', mic: true },
  s1: { shirt: '#5a6b7c', hair: '#151518', hairStyle: 'short' },
  // v12.3.2: 阿杰 (first-year master's) was a voice with no body: seven events, no figure, no trust. Now a real member of the group at bay4.
  jie: { shirt: '#3d7a3a', hair: '#151518', hairStyle: 'short', pants: '#2a3442', label: '阿杰', accent: '#f2c574' },
  min: { shirt: '#8e44ad', hair: '#4a2a1a', hairStyle: 'pony', pants: '#2a3442', label: '小敏', accent: '#f2c574' },   // 博士一年级, bay5 (was the anonymous s2)
  nb: { shirt: '#5d6d7e', coat: '#2c3e50', hair: '#3a3a3e', hairStyle: 'short', glasses: true, pants: '#2c3e50', label: '隔壁组老师' },   // visitor: only shown while his event is active
  coach: { shirt: '#ffffff', pants: '#2251FF', hair: '#2a1a14', hairStyle: 'pony', label: '陈老师 · 化学系', accent: '#2251FF', skin: '#e9b58a' },   // same look as the tennis-court figure; here so her bust renders
  s2: { shirt: '#8e44ad', hair: '#4a2a1a', hairStyle: 'pony', accent: '#f2c574' },
  // family (v7.1): portraits for the evening scenes; looks follow docs/characters/roster.json
  partner_ling: { shirt: '#c9a7b8', coat: '#5a6b7c', hair: '#2a1a14', hairStyle: 'bob', pants: '#2a3442', eye: '#2b2a3a', accent: '#e8a0b4' },
  child_xiaoyu: { shirt: '#ffd23f', hair: '#1a1a1e', hairStyle: 'short', pants: '#2251FF', skin: '#f6d3b5', eye: '#3a2618' },
};
Object.keys(CAST).forEach(k => { CAST[k]._id = k; });
const NPC = {};
/* ---------- v7.2: Blender-built cast (tools/blender/build_characters.py) ----------
   assets/characters/manifest.json lists, per character id: the GLB (rigged, 16 clips, 5 expression morphs),
   the state -> clip map, clip speeds, and a 5-expression portrait atlas rendered in Cycles.
   Models load lazily: only for characters in the zone you are in. Until a model arrives (or if the folder is
   missing, e.g. the offline file opened from disk) the procedural cast stays. */
const CHAR_MODELS = {}, MODEL_WANT = [], GLTF_CACHE = {}, PORTRAIT_IMG = {};
let MODELS_READY = false;
const EXPR_KEYS = ['blink', 'happy', 'worried', 'shock', 'sleepy'];
(async () => {
  try {
    const r = await fetch('assets/characters/manifest.json'); if (!r.ok) return;
    Object.assign(CHAR_MODELS, await r.json());
    if (CHAR_MODELS.s1 && !CHAR_MODELS.jie) CHAR_MODELS.jie = CHAR_MODELS.s1;   // v12.3.2: 阿杰 reuses the stylised figure that sat at bay4
    if (CHAR_MODELS.s2 && !CHAR_MODELS.min) CHAR_MODELS.min = CHAR_MODELS.s2;   // 小敏 likewise, bay5
    if (CHAR_MODELS.oldprof && !CHAR_MODELS.nb) CHAR_MODELS.nb = CHAR_MODELS.oldprof;
    MODELS_READY = true;
    for (const [id, m] of Object.entries(CHAR_MODELS)) if (m.portrait) { const img = new Image(); img.onload = () => { PORTRAIT_IMG[id] = { img, p: m.portrait }; }; img.src = m.portrait.url; }
    loadVisibleModels();
  } catch (e) { /* no asset folder: procedural cast */ }
})();
function inActiveZone(c) { for (let p = c; p; p = p.parent) { if (p.name && p.name.startsWith('zone-')) return p.visible; } return true; }
function loadVisibleModels() { if (MODELS_READY && !SIM) MODEL_WANT.forEach(c => { if (!c.userData.model && !c.userData.modelLoading && c.parent && inActiveZone(c)) loadModelFor(c); }); }
function attachModel(c, id) { if (c.userData.modelId === id) return; c.userData.modelId = id; MODEL_WANT.push(c); if (MODELS_READY && inActiveZone(c)) loadModelFor(c); }
function gltfFor(url) {
  if (!GLTF_CACHE[url]) GLTF_CACHE[url] = new Promise((ok, bad) => new THREE.GLTFLoader().load(url, (g) => {
    // vertex colours are linear in glTF; the procedural cast feeds hex values straight into toon materials, so match that.
    g.scene.traverse(n => { const col = n.isMesh && n.geometry.attributes.color; if (col && !col.isInterleavedBufferAttribute && !n.geometry.userData.srgb) {   // v11.1: never on interleaved data (it shares a buffer with the skin indices) or the realistic cast n.geometry.userData.srgb = 1; const k = col.normalized ? 255 : 1;
      const toSRGB = (v) => v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
      for (let i = 0; i < col.count; i++) for (let j = 0; j < Math.min(3, col.itemSize); j++) { const ix = i * col.itemSize + j, v = toSRGB(col.array[ix] / k); col.array[ix] = k === 1 ? v : Math.round(v * k); }
      col.needsUpdate = true; } });
    ok(g);
  }, undefined, bad));
  return GLTF_CACHE[url];
}
const castMats = {};
function castMat(name, morph) {
  const k = name + (morph ? 'm' : '');
  if (!castMats[k]) castMats[k] = /emit/.test(name)
    ? new THREE.MeshBasicMaterial({ vertexColors: true, skinning: true, morphTargets: morph, toneMapped: false })
    : toon('#ffffff', { vertexColors: true, skinning: true, morphTargets: morph });
  return castMats[k];
}
function loadModelFor(c) {
  const spec = CHAR_MODELS[c.userData.modelId]; if (!spec || !THREE.GLTFLoader || !THREE.SkeletonUtils) return;
  c.userData.modelLoading = true;
  gltfFor(spec.url).then((g) => {
    if (!c.parent) return;   // replaced (e.g. a new day made a new player) before the model arrived
    const m = THREE.SkeletonUtils.clone(g.scene); m.scale.setScalar(spec.scale || 1);
    const morphs = [];
    m.traverse(n => {
      if (!n.isMesh) return;
      const morph = !!(n.morphTargetInfluences && n.morphTargetInfluences.length);
      n.material = castMat(n.material.name || '', morph); n.castShadow = true; n.frustumCulled = false;
      if (morph) morphs.push(n);
    });
    c.children.forEach(ch => { if (!ch.isSprite) ch.visible = false; }); c.add(m);
    const mixer = new THREE.AnimationMixer(m), clips = {};
    (g.animations || []).forEach(a => { const act = mixer.clipAction(a); clips[a.name] = act; });
    const sp = spec.speed || {};
    if (clips[spec.clips.walk]) clips[spec.clips.walk].timeScale = sp.walk || 1;
    if (clips[spec.clips.run]) clips[spec.clips.run].timeScale = sp.run || 1;
    c.userData.model = { mixer, clips, map: spec.clips || {}, cur: null, morphs, blinkT: 1 + Math.random() * 3, blinking: 0 };
    applyMorph(c);
  }).catch(() => { c.userData.modelLoading = false; });
}
function applyMorph(c) {
  const u = c.userData, M = u.model; if (!M) return;
  const e = u.expr === 'blink' ? 'normal' : u.expr;
  M.morphs.forEach(n => { const d = n.morphTargetDictionary; EXPR_KEYS.forEach(k => { if (d[k] !== undefined) n.morphTargetInfluences[d[k]] = (k === e || (k === 'blink' && M.blinking > 0 && (e === 'normal' || e === 'worried'))) ? 1 : 0; }); });
}
function animModel(c, dt) {
  const u = c.userData, M = u.model;
  let st = u.state || 'idle';
  if (u.seated && !['type', 'read', 'sit'].includes(st)) st = st === 'talk' ? 'sittalk' : 'sit';
  const want = M.clips[M.map[st]] || M.clips[M.map[u.seated ? 'sit' : 'idle']] || Object.values(M.clips)[0];
  if (want && want !== M.cur) { if (M.cur) M.cur.fadeOut(0.22); want.reset().fadeIn(0.22).play(); M.cur = want; }
  M.mixer.update(dt);
  // blink every few seconds
  M.blinkT -= dt;
  if (M.blinkT <= 0) { M.blinking = 0.13; M.blinkT = 2 + Math.random() * 3.5; applyMorph(c); }
  else if (M.blinking > 0) { M.blinking -= dt; if (M.blinking <= 0) applyMorph(c); }
}
function placeNPC(id, x, z, lx, lz, o = {}) {
  const p = makeChar(CAST[id]); p.position.set(x, 0, z); face(p, lx, lz); NPC[id] = p; attachModel(p, id);
  if (o.seated) { p.userData.seated = true; p.userData.state = o.type ? 'type' : 'sit'; p.userData.baseState = p.userData.state; }
  else p.userData.baseState = 'idle';
  if (o.block !== false) blockRect(x - 0.2, z - 0.2, x + 0.2, z + 0.2, 0.3);
  return p;
}
placeNPC('wang', 23, 22.1, 23, 20, { seated: true, type: true });
placeNPC('chen', 10.6, 3.95, 10.6, 3, { seated: true, type: true });
placeNPC('zhou', 13.8, 3.95, 13.8, 3, { seated: true, type: true });
placeNPC('yu', 17.0, 7.95, 17.0, 7, { seated: true, type: true });
placeNPC('lin', 23.4, 6.2, 26, 4);
placeNPC('zhao', 34.2, 8.3, 36, 6);
placeNPC('jie', 17.0, 3.95, 17, 3, { seated: true, type: true });   // bay4 · 阿杰的座位
const s1 = placeNPC('s1', 17.0, 3.95, 17, 3, { seated: true, type: true, block: false }); s1.visible = false;   // 课代表: bust only, lives in the lecture hall
placeNPC('min', 10.6, 7.95, 10.6, 7, { seated: true, type: true });   // bay5 · 小敏的座位
const s2 = placeNPC('s2', 10.6, 7.95, 10.6, 7, { seated: true, type: true, block: false }); s2.visible = false;
const nb = placeNPC('nb', 29, 25.5, 27.6, 23.9, { block: false }); nb.visible = false; nb.userData.visitor = true;   // 隔壁组: appears at the pantry when he has something to ask
const dean = placeNPC('dean', 16, 24.4, 16, 20, { block: false });
const reporter = placeNPC('rep', 38.4, 21.2, 38, 18, { block: false });
dean.visible = false; reporter.visible = false;
NPC.lin.userData.state = 'idle';
/* lecture crowd */
const crowd = new THREE.Group(); Z.group.add(crowd);
const crowdShirts = ['#2251FF', '#c0392b', '#f2c574', '#0f8b8d', '#7a5cff', '#5a6b7c', '#e67e22', '#ecf0f1', '#2ecc71'];
const crowdHair = ['short', 'pony', 'bob', 'spiky', 'short', 'long'];
seats.forEach(([x, z], i) => { if (Math.random() < 0.72) { const p = makeChar({ low: true, shirt: crowdShirts[i % 9], hairStyle: crowdHair[i % 6], hair: Math.random() < .2 ? '#6b4a2a' : '#151518' }, crowd); p.position.set(x, 0, z); p.rotation.y = 0; p.userData.seated = true; p.userData.state = 'sit'; p.userData.baseY = 0.0; } });
crowd.visible = false;

/* the player */
let player = null;
const playerRing = new THREE.Group(); scene.add(playerRing);
const ringIn = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 48), glow('#00A9F4', 2.2, 0.9)); ringIn.rotation.x = -Math.PI / 2; playerRing.add(ringIn);
const ringOut = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.64, 48, 1, 0, Math.PI * 1.6), glow('#2251FF', 2.4, 0.8)); ringOut.rotation.x = -Math.PI / 2; playerRing.add(ringOut);
const shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.25, depthWrite: false })); shadowBlob.rotation.x = -Math.PI / 2; shadowBlob.position.y = 0.01; playerRing.add(shadowBlob);
const PLAYER_LOOK = (f) => f ? { _id: 'player_f', shirt: '#bfe3ff', coat: '#0A2436', hair: '#1c1410', hairStyle: 'long', glasses: true, badge: true, pants: '#1b2a3a', eye: '#2b2a3a' } : { _id: 'player_m', shirt: '#bfe3ff', coat: '#0A2436', hair: '#16161a', hairStyle: 'short', glasses: true, badge: true, pants: '#1b2a3a', tie: '#2251FF' };
function makePlayer(female) {
  // v12: keep the same character from day to day (a new one every morning leaked its meshes and textures)
  if (player && player.userData.female === !!female && player.parent === scene) {
    Object.assign(player.userData, { state: 'idle', seated: false }); player.visible = true; setExpr(player, 'normal'); setEmote(player, null);
  } else {
    if (player) scene.remove(player);
    player = makeChar(PLAYER_LOOK(female), scene); attachModel(player, female ? 'player_f' : 'player_m'); player.userData.female = !!female;
  }
  player.position.set(38, 0, 18.6);
}

/* corridor walkers */
const walkers = [];
['#2ecc71', '#e67e22', '#5a6b7c', '#7a5cff'].forEach((c, i) => { const p = makeChar({ shirt: c, hairStyle: ['short', 'pony', 'bob', 'spiky'][i], hair: '#1a1410' }); p.position.set(4 + Math.random() * 32, 0, 12.4 + Math.random() * 1.4); walkers.push({ p, path: [], wait: Math.random() * 4 }); });
const walkerSpots = [[3, 13], [12, 13.5], [20, 12.4], [29, 13.6], [38, 13], [29, 20], [23, 19.4], [14.5, 9.6], [6, 18.2], [36, 12.6]];

