/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
// v13.0 (moved from architecture.js): the prop builders are declared in this file, so the kit wrapping happens here, before any prop is built.
desk = kitWrap('desk', desk); chair = kitWrap('chair', chair); monitor = kitWrap('monitor', monitor); plant = kitWrap('plant', plant);
shelf = kitWrap('shelf', shelf);   // bench, tree and lampPost are wrapped at the top of floors.js, where they are declared
/* =========================================================
   PROPS
   ========================================================= */
const screens = [];
const SCREEN_KINDS = ['code', 'plot', 'paper', 'chat', 'sim'];
const screenTex = {};
SCREEN_KINDS.forEach(k => {
  screenTex[k] = canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = k === 'paper' ? '#f4f6f8' : '#0b1b2a'; g.fillRect(0, 0, w, h);
    if (k === 'code') { const cols = ['#7fd3ff', '#ffb547', '#9be37a', '#ff7aa8', '#cdd9e5']; for (let i = 0; i < 13; i++) { g.fillStyle = cols[(i * 7) % 5]; g.fillRect(12 + (i % 4) * 10, 10 + i * 11, 40 + Math.random() * 140, 5); } }
    if (k === 'plot') { g.strokeStyle = 'rgba(255,255,255,.15)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(20, 20 + i * 24); g.lineTo(w - 10, 20 + i * 24); g.stroke(); } g.fillStyle = '#00A9F4'; for (let i = 0; i < 22; i++) { const v = Math.exp(-i / 5) * 110 + 8; g.fillRect(22 + i * 10, h - 18 - v, 7, v); } g.strokeStyle = '#ffb547'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 22; i++) { const v = Math.exp(-i / 5) * 110 + 8; i ? g.lineTo(25 + i * 10, h - 18 - v) : g.moveTo(25, h - 18 - v); } g.stroke(); }
    if (k === 'paper') { g.fillStyle = '#0A2436'; g.fillRect(30, 14, 196, 10); for (let i = 0; i < 12; i++) { g.fillStyle = '#9aa7b3'; g.fillRect(30, 36 + i * 9, i % 4 === 3 ? 120 : 196, 4); } }
    if (k === 'chat') { for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#2251FF' : '#1d3550'; const ww = 80 + Math.random() * 90; g.fillRect(i % 2 ? w - ww - 12 : 12, 10 + i * 24, ww, 18); } }
    if (k === 'sim') { g.strokeStyle = '#00A9F4'; for (let i = 0; i < 30; i++) { g.strokeStyle = `hsla(${190 + Math.random() * 40},90%,60%,.8)`; g.beginPath(); g.moveTo(w / 2, h / 2); g.lineTo(w / 2 + (Math.random() - .5) * 240, h / 2 + (Math.random() - .5) * 150); g.stroke(); } g.strokeStyle = '#ffb547'; g.strokeRect(w / 2 - 30, h / 2 - 20, 60, 40); }
  });
});
function screenMat(kind) { const m = new THREE.MeshBasicMaterial({ map: screenTex[kind], toneMapped: false }); m.color.setScalar(1.25); return m; }
function monitor(x, z, ry = 0, kind) {
  const g = new THREE.Group(); g.position.set(x, 0.76, z); g.rotation.y = ry; Z.group.add(g);
  add(new THREE.Mesh(rbox(0.62, 0.4, 0.04, 0.015), mat('#1a2431', { roughness: 0.3, metalness: 0.5 })), { parent: g }).position.set(0, 0.36, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.04), mat('#2c3a49', { metalness: 0.6 })), { parent: g }).position.set(0, 0.1, -0.02);
  add(new THREE.Mesh(rbox(0.22, 0.02, 0.14, 0.008), mat('#2c3a49', { metalness: 0.6 })), { parent: g }).position.set(0, 0.01, -0.02);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.34), screenMat(kind || SCREEN_KINDS[(Math.random() * 5) | 0]));
  s.position.set(0, 0.36, 0.022); g.add(s); screens.push(s);
  return g;
}
function mug(x, y, z, color = '#ffffff') { const m = cyl(0.045, 0.04, 0.1, mat(color, { roughness: 0.3 }), x, y, z, { seg: 16 }); const hnd = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.009, 6, 12), mat(color)); hnd.position.set(0.05, 0, 0); hnd.rotation.y = Math.PI / 2; m.add(hnd); return m; }
function desk(x, z, w = 1.5, d = 0.8, o = {}) {
  box(w, 0.05, d, mat(o.top || '#f2efe8', { roughness: 0.45 }), x, 0.71, z, { block: true, round: 0.02 });
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => cyl(0.022, 0.022, 0.71, mat('#56677a', { metalness: 0.8, roughness: 0.3 }), x + sx * (w / 2 - 0.06), 0, z + sz * (d / 2 - 0.06), { seg: 8 }));
  if (o.monitor !== false) { monitor(x - (o.dual ? 0.33 : 0), z - d / 2 + 0.18, 0, o.kind); if (o.dual) monitor(x + 0.36, z - d / 2 + 0.22, -0.25); }
  box(0.42, 0.018, 0.13, mat('#26313d', { roughness: 0.5 }), x, 0.76, z + 0.08, { round: 0.006 });
  if (Math.random() < 0.7) mug(x + w / 2 - 0.2, 0.76, z + 0.1, ['#ffffff', '#2251FF', '#FFB547', '#c0392b'][(Math.random() * 4) | 0]);
  if (Math.random() < 0.6) { const p = box(0.24, 0.012, 0.32, mat('#fafafa'), x - w / 2 + 0.25, 0.76, z + 0.05); p.rotation.y = Math.random() - 0.5; }
}
function chair(x, z, ry = 0, color = '#24364a') {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; Z.group.add(g);
  add(new THREE.Mesh(rbox(0.48, 0.08, 0.46, 0.035), mat(color, { roughness: 0.8 })), { parent: g }).position.set(0, 0.48, 0);
  add(new THREE.Mesh(rbox(0.46, 0.5, 0.07, 0.035), mat(color, { roughness: 0.8 })), { parent: g }).position.set(0, 0.82, 0.22);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), mat('#56677a', { metalness: 0.8 })), { parent: g }).position.set(0, 0.25, 0);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.04, 5), mat('#56677a', { metalness: 0.8 })), { parent: g, cast: false }).position.set(0, 0.03, 0);
  return g;
}
function plant(x, z, s = 1, block = true) {
  const pot = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0, 0), new THREE.Vector2(0.17, 0), new THREE.Vector2(0.22, 0.38), new THREE.Vector2(0.24, 0.42), new THREE.Vector2(0.2, 0.42)].map(v => v.multiplyScalar(s)), 20), mat('#e9e4dc', { roughness: 0.5 }));
  pot.position.set(x, 0, z); add(pot);
  const leafM = mat('#3d9a5f', { roughness: 0.6 }), leafM2 = mat('#2f7d4c', { roughness: 0.6 });
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * Math.PI * 2, l = new THREE.Mesh(new THREE.SphereGeometry(0.16 * s, 10, 8), i % 2 ? leafM : leafM2);
    l.scale.set(0.45, 1.6, 0.25); l.position.set(x + Math.cos(a) * 0.14 * s, (0.6 + (i % 3) * 0.12) * s, z + Math.sin(a) * 0.14 * s);
    l.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); add(l);
  }
  if (block) blockRect(x - 0.22 * s, z - 0.22 * s, x + 0.22 * s, z + 0.22 * s);
}
function shelf(x, z, w, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; Z.group.add(g);
  add(new THREE.Mesh(rbox(w, 1.9, 0.38, 0.02), mat('#d8cdbd', { roughness: 0.7 })), { parent: g }).position.set(0, 0.95, 0);
  const cols = ['#2251FF', '#c0392b', '#f2c574', '#0f8b8d', '#7a5cff', '#e8e8e8', '#0A2436', '#3DDC97'];
  const tex = canvasTex(512, 384, (c, cw, ch) => { c.fillStyle = '#3b3128'; c.fillRect(0, 0, cw, ch); for (let r = 0; r < 4; r++) { const y0 = r * 96; c.fillStyle = '#d8cdbd'; c.fillRect(0, y0 + 88, cw, 8); let px = 6; while (px < cw - 10) { const bw = 10 + Math.random() * 14, bh = 52 + Math.random() * 30; c.fillStyle = cols[(Math.random() * cols.length) | 0]; c.fillRect(px, y0 + 88 - bh, bw, bh); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(px + 2, y0 + 88 - bh + 8, bw - 4, 3); px += bw + 2; } } });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, 1.78), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, envMapIntensity: 0.3 })); front.position.set(0, 0.95, 0.195); g.add(front);
  blockRect(x - (ry ? 0.2 : w / 2), z - (ry ? w / 2 : 0.2), x + (ry ? 0.2 : w / 2), z + (ry ? w / 2 : 0.2));
}
function boardTex(w, h, draw) { return canvasTex(w, h, (g, cw, ch) => { g.fillStyle = '#f7fbff'; g.fillRect(0, 0, cw, ch); draw(g, cw, ch); }); }
function whiteboard(x, y, z, ry, w, h, tex) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; Z.group.add(g);
  add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.03), frameM), { parent: g, cast: false });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.25, envMapIntensity: 0.6 })); s.position.z = 0.017; g.add(s);
  return g;
}
function poster(x, y, z, ry, w, h, draw) {
  const tex = canvasTex(256, Math.round(256 * h / w), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
  m.position.set(x, y, z); m.rotation.y = ry; Z.group.add(m); return m;
}
const lightPools = [];
function lightPool(x, z, r, color, base = 0.12) {
  color = '#fff1dc'; base *= 0.55;   // v11.0: real ceiling light falls warm-white and soft, not tinted
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshBasicMaterial({ map: radialTex, color, transparent: true, opacity: base, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.02, z); Z.group.add(m); lightPools.push({ m, base }); return m;
}

/* ---- 503 office ---- */
desk(3, 3, 2.4, 1.1, { dual: true, top: '#7a5638', kind: 'paper' });
chair(3, 3.95, Math.PI, '#1d2a38');
shelf(6.2, 0.4, 3.0);
const sofaM = mat('#2d4d72', { roughness: 0.85 });
box(1.0, 0.42, 2.6, sofaM, 1.0, 0, 8, { block: true, round: 0.08 }); box(0.28, 0.5, 2.6, sofaM, 0.62, 0.3, 8, { round: 0.1 });
box(0.9, 0.3, 0.3, sofaM, 1.0, 0.3, 6.8, { round: 0.08 }); box(0.9, 0.3, 0.3, sofaM, 1.0, 0.3, 9.2, { round: 0.08 });
box(0.4, 0.12, 0.3, mat('#ffb547'), 1.1, 0.45, 7.4, { round: 0.05 }).rotation.y = 0.3;
box(0.62, 0.38, 0.62, mat('#7a5638', { roughness: 0.5 }), 2.2, 0, 9.9, { block: true, round: 0.02 });
mug(2.2, 0.38, 9.9, '#2251FF');
plant(7.2, 10.2, 1.1);
const rugM = new THREE.MeshStandardMaterial({ map: canvasTex(256, 256, (g) => { g.fillStyle = '#1f3d63'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#ffb547'; g.lineWidth = 6; g.strokeRect(16, 16, 224, 224); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2; g.strokeRect(30, 30, 196, 196); }), roughness: 1 });
plane(2.6, 3.4, rugM, 3.4, 0.012, 7.6, { rx: -Math.PI / 2, receive: true });
whiteboard(0.13, 1.25, 4.6, Math.PI / 2, 2.2, 0.95, boardTex(512, 220, (g) => { g.fillStyle = '#0A2436'; g.font = `700 30px ${CN_FONT}`; g.fillText('a_μ = (g − 2) / 2', 24, 54); g.fillStyle = '#c0392b'; g.fillText('基金截止 23:59 !!!', 24, 118); g.fillStyle = '#2251FF'; g.font = `600 24px ${CN_FONT}`; g.fillText('τ_μ = 2.197 μs    γ = 1/√(1−β²)', 24, 176); }));
poster(0.13, 1.2, 9.2, Math.PI / 2, 0.8, 1.1, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0341B3'); gr.addColorStop(1, '#01254F'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.strokeStyle = '#00A9F4'; g.lineWidth = 6; g.beginPath(); g.arc(w / 2, h * 0.42, 70, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.font = `800 30px ${CN_FONT}`; g.textAlign = 'center'; g.fillText('MUON g−2', w / 2, h * 0.82); });
lightPool(3.5, 5, 3.4, '#ffd9a0');

/* ---- 505 student bay ---- */
const bayDesks = [[10.6, 3.2], [13.8, 3.2], [17.0, 3.2], [10.6, 7.2], [13.8, 7.2], [17.0, 7.2]];
bayDesks.forEach(([x, z], i) => { desk(x, z, 1.5, 0.8, { kind: ['plot', 'code', 'paper', 'sim', 'chat', 'code'][i] }); chair(x, z + 0.75, Math.PI); });
whiteboard(14, 1.3, 0.14, 0, 4, 1.0, boardTex(640, 160, (g) => { g.fillStyle = '#0A2436'; g.font = `700 26px ${CN_FONT}`; g.fillText('组会 周五 14:00 · 每人 3 页', 20, 46); g.fillStyle = '#2251FF'; g.fillText('N(t) = N₀ e^(−t/τ) + B', 20, 96); g.fillStyle = '#56718a'; g.font = `500 20px ${CN_FONT}`; g.fillText('先看残差，再改模型', 20, 136); }));
shelf(19.6, 9.2, 2.6, Math.PI / 2);
plant(19.2, 0.8, 1); plant(8.8, 10.2, 0.9);
lightPool(14, 5, 5, '#cfe6ff');

/* ---- 507 muon lab ---- */
const detSlabs = [];
for (let k = 0; k < 4; k++) {
  const s = new THREE.Mesh(rbox(4, 0.1, 2, 0.03), new THREE.MeshStandardMaterial({ color: '#4d7dff', emissive: '#1b4dff', emissiveIntensity: 0.6, transparent: true, opacity: 0.78, roughness: 0.15, metalness: 0.1, envMapIntensity: 1.2 }));
  s.position.set(26, 0.42 + k * 0.32, 4); add(s); detSlabs.push(s);
  [23.85, 28.15].forEach(px => { const p = cyl(0.075, 0.075, 0.3, mat('#1b2430', { metalness: 0.7, roughness: 0.3 }), px, 0.34 + k * 0.32, 4, { seg: 12 }); p.rotation.z = Math.PI / 2; });
}
[[24, 3], [28, 3], [24, 5], [28, 5]].forEach(([x, z]) => box(0.08, 1.6, 0.08, frameM, x, 0, z));
box(4.2, 0.06, 2.2, frameM, 26, 1.6, 4, { cast: false });
blockRect(24, 3, 28, 5);
/* cables from PMTs to the DAQ rack */
const cableM = mat('#111820', { roughness: 0.6 });
for (let k = 0; k < 4; k++) {
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(23.7, 0.4 + k * 0.32, 4), new THREE.Vector3(23.2, 0.05, 3.2), new THREE.Vector3(22.2, 0.05, 1.6), new THREE.Vector3(21.4 + k * 0.15, 0.6, 1.0)]);
  add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.018, 6), [cableM, mat('#c0392b'), mat('#2251FF'), mat('#f2c574')][k]), { cast: false });
}
/* hazard ring around the high-voltage zone */
plane(6.2, 3.8, new THREE.MeshStandardMaterial({ map: canvasTex(512, 320, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#f2c230'; g.lineWidth = 16; g.setLineDash([26, 22]); g.strokeRect(10, 10, w - 20, h - 20); g.fillStyle = '#f2c230'; g.font = `800 26px ${CN_FONT}`; g.fillText('⚠ HIGH VOLTAGE 高压区', 30, h - 28); }), transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }), 26, 0.013, 4, { rx: -Math.PI / 2, receive: true });
const holoCanvas = document.createElement('canvas'); holoCanvas.width = 520; holoCanvas.height = 260;
const holoTex = new THREE.CanvasTexture(holoCanvas); holoTex.encoding = THREE.sRGBEncoding;
const holoMat = new THREE.MeshBasicMaterial({ map: holoTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending });
holoMat.color.setScalar(1.6);
const holo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), holoMat); holo.position.set(26, 2.6, 3.0); Z.group.add(holo);
const holoHist = new Array(26).fill(0);
function drawHolo(t) {
  const g = holoCanvas.getContext('2d'), w = 520, h = 260;
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(0,60,120,.35)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#00A9F4'; g.lineWidth = 2; g.strokeRect(2, 2, w - 4, h - 4);
  g.fillStyle = '#CDEEFF'; g.font = `700 20px ${CN_FONT}`; g.fillText('μ TELESCOPE · LIVE', 16, 32);
  g.fillStyle = '#7fe3ff'; g.font = `500 15px ${CN_FONT}`; g.fillText(`events ${holoHist.reduce((a, b) => a + b, 0)}   τ → 2.19 μs`, 290, 32);
  const mx = Math.max(10, ...holoHist);
  holoHist.forEach((v, i) => { const hh = v / mx * 170; g.fillStyle = '#00A9F4'; g.fillRect(16 + i * 19, h - 20 - hh, 13, hh); });
  g.fillStyle = 'rgba(127,227,255,.6)'; g.fillRect(16 + ((t * 40) % 494), 44, 2, h - 64);
  holoTex.needsUpdate = true;
}
box(2.2, 1.9, 0.8, mat('#1e2733', { roughness: 0.4, metalness: 0.5 }), 21.4, 0, 0.6, { block: true, round: 0.03 });
const ledCanvas = document.createElement('canvas'); ledCanvas.width = 128; ledCanvas.height = 128;
const ledTex = new THREE.CanvasTexture(ledCanvas); ledTex.encoding = THREE.sRGBEncoding;
function drawLeds() { const g = ledCanvas.getContext('2d'); g.fillStyle = '#05080c'; g.fillRect(0, 0, 128, 128); for (let r = 0; r < 12; r++) { g.fillStyle = '#1a2330'; g.fillRect(4, 4 + r * 10, 120, 8); for (let c = 0; c < 14; c++) { if (Math.random() < 0.55) { g.fillStyle = Math.random() < 0.8 ? '#3DDC97' : (Math.random() < .5 ? '#00A9F4' : '#FFB547'); g.fillRect(8 + c * 8, 6 + r * 10, 3, 3); } } } ledTex.needsUpdate = true; }
drawLeds();
const ledMat = new THREE.MeshBasicMaterial({ map: ledTex, toneMapped: false }); ledMat.color.setScalar(2.2);
plane(2.0, 1.7, ledMat, 21.4, 0.98, 1.01);
/* oscilloscope */
box(0.9, 0.06, 0.6, mat('#f2efe8'), 22, 0.72, 8.6, { block: true });
desk(22, 8.6, 1.6, 0.8, { monitor: false });
box(0.5, 0.32, 0.36, mat('#3a4a5c', { metalness: 0.4 }), 21.7, 0.76, 8.45, { round: 0.02 });
const scopeCanvas = document.createElement('canvas'); scopeCanvas.width = 160; scopeCanvas.height = 100;
const scopeTex = new THREE.CanvasTexture(scopeCanvas);
const scopeMat = new THREE.MeshBasicMaterial({ map: scopeTex, toneMapped: false }); scopeMat.color.setScalar(1.8);
plane(0.34, 0.22, scopeMat, 21.7, 0.93, 8.635);
function drawScope(t) { const g = scopeCanvas.getContext('2d'); g.fillStyle = '#021014'; g.fillRect(0, 0, 160, 100); g.strokeStyle = 'rgba(80,255,180,.2)'; for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * 20, 0); g.lineTo(i * 20, 100); g.stroke(); } g.strokeStyle = '#4dffb0'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x < 160; x++) { const p = (x + t * 60) % 160; const y = 50 - (p > 60 && p < 72 ? -Math.exp(-(p - 60) / 4) * 38 : 0) + Math.sin(x * 0.7 + t * 9) * 1.2; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); scopeTex.needsUpdate = true; }
chair(22, 9.35, Math.PI);
/* optics table with live laser beams */
box(2.4, 0.86, 1.4, mat('#36475a', { roughness: 0.3, metalness: 0.6 }), 29.6, 0, 2.6, { block: true, round: 0.03 });
box(2.3, 0.03, 1.3, mat('#5d6f82', { roughness: 0.25, metalness: 0.8 }), 29.6, 0.86, 2.6);
box(0.4, 0.18, 0.2, mat('#c0392b', { metalness: 0.3 }), 28.7, 0.89, 2.3, { round: 0.02 });
[[29.3, 2.3], [30.2, 2.9], [29.0, 2.9]].forEach(([x, z]) => cyl(0.04, 0.04, 0.2, mat('#c9d4de', { metalness: 0.9, roughness: 0.2 }), x, 0.89, z, { seg: 10 }));
const laserM = glow('#ff3344', 4);
[[28.9, 2.3, 29.3, 2.3], [29.3, 2.3, 30.2, 2.9], [30.2, 2.9, 29.0, 2.9]].forEach(([a, b, c, d]) => { const len = Math.hypot(c - a, d - b); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 6), laserM); m.position.set((a + c) / 2, 1.0, (b + d) / 2); m.rotation.z = Math.PI / 2; m.rotation.y = -Math.atan2(d - b, c - a); Z.group.add(m); });
/* liquid nitrogen dewar */
cyl(0.42, 0.42, 1.25, mat('#d6dee6', { metalness: 0.85, roughness: 0.22 }), 30.6, 0, 8.7, { block: true });
cyl(0.2, 0.3, 0.12, mat('#9aa7b3', { metalness: 0.8 }), 30.6, 1.25, 8.7);
cyl(0.05, 0.05, 0.2, mat('#2251FF'), 30.6, 1.37, 8.7, { seg: 10 });
const o2 = plane(0.42, 0.26, glow('#3DDC97', 2), 27.6, 1.25, 10.88, { ry: Math.PI });
box(1.2, 0.8, 0.6, mat('#e2c06a', { roughness: 0.7 }), 31.2, 0, 5.8, { block: true, round: 0.02 }); box(0.8, 0.5, 0.5, mat('#d1ad55', { roughness: 0.7 }), 31.3, 0.8, 5.8, { round: 0.02 });
poster(31.88, 1.2, 9.6, -Math.PI / 2, 0.8, 1.0, (g, w, h) => { g.fillStyle = '#f2c230'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = `800 28px ${CN_FONT}`; g.textAlign = 'center'; g.fillText('液氮', w / 2, 60); g.font = `700 18px ${CN_FONT}`; g.fillText('缺氧危险', w / 2, 96); g.fillText('ASPHYXIATION', w / 2, 126); g.font = `900 96px ${CN_FONT}`; g.fillText('⚠', w / 2, 260); });
lightPool(26, 5, 5.5, '#4fc3ff', 0.16);

/* ---- 509 server room ---- */
const rackFront = canvasTex(256, 256, () => {});
const rackCanvas = rackFront.userData.canvas;
function drawRack() { const g = rackCanvas.getContext('2d'); g.fillStyle = '#0a0f15'; g.fillRect(0, 0, 256, 256); for (let u = 0; u < 20; u++) { g.fillStyle = u % 5 === 0 ? '#16212c' : '#111a23'; g.fillRect(6, 6 + u * 12.4, 244, 10); for (let c = 0; c < 16; c++) if (Math.random() < 0.5) { g.fillStyle = Math.random() < 0.85 ? '#3DDC97' : '#00A9F4'; g.fillRect(12 + c * 6, 9 + u * 12.4, 3, 3); } g.fillStyle = 'rgba(120,160,200,.25)'; g.fillRect(140, 9 + u * 12.4, 100, 4); } rackFront.needsUpdate = true; }
drawRack();
const rackFrontM = new THREE.MeshBasicMaterial({ map: rackFront, toneMapped: false }); rackFrontM.color.setScalar(1.8);
[2.4, 5.4].forEach(z => {
  for (let i = 0; i < 6; i++) { box(0.92, 2.1, 1, mat('#1a222c', { roughness: 0.35, metalness: 0.6 }), 33.5 + i * 1.0, 0, z, { round: 0.02 }); plane(0.82, 1.95, rackFrontM, 33.5 + i * 1.0, 1.05, z + 0.505); }
  blockRect(33, z - 0.5, 39, z + 0.5);
  const strip = plane(6, 0.6, glow('#2251FF', 1.2, 0.35), 36, 0.015, z + 0.95, { rx: -Math.PI / 2 }); strip.material.blending = THREE.AdditiveBlending;
});
box(1.4, 0.9, 0.7, mat('#9aa7b3', { metalness: 0.5 }), 39, 0, 9.6, { block: true, round: 0.03 });
lightPool(36, 4, 4.5, '#5c8dff', 0.14);

/* ---- 502 lecture hall ---- */
const seats = [];
[17.3, 18.7, 20.1].forEach(z => {
  [[1.2, 5.2], [6.8, 10.8]].forEach(([a, b]) => {
    box(b - a, 0.05, 0.34, mat('#c9a77d', { roughness: 0.5 }), (a + b) / 2, 0.72, z + 0.44, { round: 0.02 });
    box(b - a, 0.72, 0.05, mat('#24364a'), (a + b) / 2, 0, z + 0.6);
    box(b - a, 0.45, 0.46, mat('#2b4a72', { roughness: 0.8 }), (a + b) / 2, 0, z, { round: 0.04 });
    box(b - a, 0.5, 0.08, mat('#2b4a72', { roughness: 0.8 }), (a + b) / 2, 0.45, z - 0.22, { round: 0.03 });
    blockRect(a, z - 0.26, b, z + 0.62);
    for (let x = a + 0.35; x < b; x += 0.7) seats.push([x, z]);
  });
});
box(0.9, 1.05, 0.6, mat('#2b3d52', { roughness: 0.4, metalness: 0.4 }), 6, 0, 23.7, { block: true, round: 0.04 });
plane(0.3, 0.2, screenMat('code'), 6, 1.16, 23.39, { rx: -0.5 });
const slideCanvas = document.createElement('canvas'); slideCanvas.width = 1024; slideCanvas.height = 160;
const slideTex = new THREE.CanvasTexture(slideCanvas); slideTex.encoding = THREE.sRGBEncoding;
const SLIDES = [['大学物理（二）· 狭义相对论', '第 7 讲  时间膨胀与宇宙线缪子'], ['宇宙线缪子：15 km 高空产生', '静止寿命 τ = 2.2 μs，却能到达地面'], ['t′ = γ t,   γ = 1 / √(1 − v²/c²)', 'v = 0.998c → γ ≈ 15.8'], ['课堂抢答', '准备好了吗？']];
function drawSlide(i) { const g = slideCanvas.getContext('2d'), [a, b] = SLIDES[i % SLIDES.length]; g.fillStyle = '#0A2436'; g.fillRect(0, 0, 1024, 160); g.fillStyle = '#00A9F4'; g.fillRect(0, 0, 10, 160); g.fillStyle = '#EAF4FB'; g.font = `800 50px ${CN_FONT}`; g.fillText(a, 36, 70); g.fillStyle = '#CDEEFF'; g.font = `500 30px ${CN_FONT}`; g.fillText(b, 36, 126); slideTex.needsUpdate = true; }
drawSlide(0);
const slideM = new THREE.MeshBasicMaterial({ map: slideTex, toneMapped: false }); slideM.color.setScalar(1.4);
box(7.8, 1.3, 0.06, frameM, 6, 0.55, 25.88, { cast: false });
plane(7.5, 1.17, slideM, 6, 1.2, 25.84, { ry: Math.PI });
lightPool(6, 23, 3, '#ffe2b0', 0.1); lightPool(6, 19, 5, '#ffe9c8', 0.08);

/* ---- 504 meeting room ---- */
box(1.8, 0.06, 4.4, mat('#f3f1ec', { roughness: 0.3 }), 16, 0.74, 21.6, { block: true, round: 0.03 });
box(0.4, 0.74, 3.6, mat('#9aa7b3', { metalness: 0.5 }), 16, 0, 21.6, { cast: false });
for (let k = 0; k < 4; k++) { chair(14.75, 19.9 + k * 1.15, Math.PI / 2, '#3a2d4a'); chair(17.25, 19.9 + k * 1.15, -Math.PI / 2, '#3a2d4a'); }
[[15.6, 20.4], [16.4, 22.8]].forEach(([x, z]) => { box(0.3, 0.015, 0.22, mat('#c9d4de', { metalness: 0.7 }), x, 0.77, z); });
const meetCanvas = document.createElement('canvas'); meetCanvas.width = 768; meetCanvas.height = 200;
const meetTex = new THREE.CanvasTexture(meetCanvas); meetTex.encoding = THREE.sRGBEncoding;
function drawMeetScreen(mode) {
  const g = meetCanvas.getContext('2d'), w = 768, h = 200;
  g.fillStyle = '#0A2436'; g.fillRect(0, 0, w, h);
  if (mode === 'fnal') {
    const cols = ['#c86b3c', '#7a5cff', '#0f8b8d', '#2251FF', '#c0392b', '#f2c574'];
    for (let i = 0; i < 6; i++) { const x = 8 + (i % 3) * 122, y = 8 + Math.floor(i / 3) * 94; g.fillStyle = '#16324a'; g.fillRect(x, y, 116, 88); g.fillStyle = cols[i]; g.beginPath(); g.arc(x + 58, y + 40, 18, 0, 7); g.fill(); g.fillRect(x + 34, y + 60, 48, 28); }
    g.fillStyle = '#EAF4FB'; g.font = `800 32px ${CN_FONT}`; g.fillText('Muon g-2 · Analysis', 390, 70); g.fillStyle = '#CDEEFF'; g.font = `500 22px ${CN_FONT}`; g.fillText('Batavia 09:00 CDT · 上海 22:00', 390, 120); g.fillStyle = '#ff5a6e'; g.beginPath(); g.arc(398, 160, 8, 0, 7); g.fill(); g.fillStyle = '#CDEEFF'; g.fillText('REC', 414, 168);
  } else if (mode === 'dean') { g.fillStyle = '#00A9F4'; g.fillRect(0, 0, 10, h); g.fillStyle = '#EAF4FB'; g.font = `800 40px ${CN_FONT}`; g.fillText('学院 2026 学科评估 · 院务会', 32, 76); g.fillStyle = '#CDEEFF'; g.font = `500 26px ${CN_FONT}`; g.fillText('议程：国际合作材料分工', 32, 136); }
  else { g.fillStyle = '#16324a'; g.fillRect(0, 0, w, h); g.fillStyle = '#56718a'; g.font = `500 28px ${CN_FONT}`; g.fillText('会议室空闲 · AVAILABLE', 32, 110); }
  meetTex.needsUpdate = true;
}
drawMeetScreen('idle');
const meetM = new THREE.MeshBasicMaterial({ map: meetTex, toneMapped: false }); meetM.color.setScalar(1.3);
box(3.8, 1.05, 0.06, frameM, 16, 0.68, 25.88, { cast: false });
plane(3.6, 0.95, meetM, 16, 1.2, 25.84, { ry: Math.PI });
lightPool(16, 21.6, 3.5, '#f2d9ff', 0.1);

/* ---- 506 admin ---- */
desk(23, 21.2, 2.0, 0.9, { kind: 'chat' }); chair(23, 22.2, 0, '#3a2d4a');
for (let i = 0; i < 3; i++) box(0.5, 1.4, 0.8, mat('#c9d4de', { metalness: 0.4, roughness: 0.4 }), 20.5, 0, 19.8 + i * 0.85, { block: true, round: 0.02 });
box(0.8, 0.9, 0.6, mat('#e8edf2', { roughness: 0.4 }), 25.3, 0, 24.8, { block: true, round: 0.03 }); box(0.55, 0.12, 0.45, mat('#3a4654'), 25.3, 0.9, 24.8, { round: 0.02 });
[0, 1, 2].forEach(i => box(0.32, 0.26, 0.24, mat(['#2251FF', '#c0392b', '#f2c574'][i]), 22.2 + i * 0.36, 0.76, 20.9, { round: 0.01 }));
plant(25.4, 16, 0.9);
poster(20.14, 1.25, 23.6, Math.PI / 2, 1.2, 0.8, (g, w, h) => { g.fillStyle = '#e8eef3'; g.fillRect(0, 0, w, h); g.fillStyle = '#0A2436'; g.font = `800 20px ${CN_FONT}`; g.fillText('报销须知', 14, 34); for (let i = 0; i < 6; i++) { g.fillStyle = '#9aa7b3'; g.fillRect(14, 50 + i * 16, 200 - i * 12, 6); } g.fillStyle = '#c0392b'; g.fillText('票据须真实合规', 14, 160); });
lightPool(23, 21, 3, '#fff0d6', 0.1);

/* ---- 508 pantry ---- */
box(5.2, 0.92, 0.7, mat('#e8edf2', { roughness: 0.35 }), 29, 0, 25.3, { block: true, round: 0.02 });
box(5.2, 0.04, 0.72, mat('#2b3d52', { roughness: 0.2, metalness: 0.3 }), 29, 0.92, 25.3);
box(0.5, 0.58, 0.45, mat('#1b2430', { roughness: 0.3, metalness: 0.6 }), 27.6, 0.96, 25.3, { round: 0.04 });
const coffeeLed = plane(0.14, 0.06, glow('#00A9F4', 3), 27.6, 1.38, 25.07, { ry: Math.PI });
cyl(0.05, 0.05, 0.1, mat('#ffffff'), 27.6, 0.98, 25.0, { seg: 12 });
box(0.62, 0.36, 0.42, mat('#d0d6dc', { roughness: 0.3, metalness: 0.4 }), 30.2, 0.96, 25.3, { round: 0.03 });
plane(0.12, 0.05, glow('#3DDC97', 2.5), 30.42, 1.2, 25.08, { ry: Math.PI });
box(0.78, 1.9, 0.72, mat('#dfe6ec', { roughness: 0.3, metalness: 0.3 }), 31.4, 0, 22.6, { block: true, round: 0.05 });
box(0.04, 0.5, 0.05, mat('#9aa7b3', { metalness: 0.9 }), 31.0, 1.0, 22.95);
cyl(0.6, 0.6, 0.05, mat('#f3f1ec', { roughness: 0.3 }), 28.6, 0.72, 19.6, { block: true }); cyl(0.06, 0.1, 0.72, mat('#9aa7b3', { metalness: 0.7 }), 28.6, 0, 19.6, { seg: 12 });
[0, 1, 2].forEach(i => { const a = i / 3 * Math.PI * 2; chair(28.6 + Math.cos(a) * 0.95, 19.6 + Math.sin(a) * 0.95, -a - Math.PI / 2, '#c86b3c'); });
[[28.4, 19.5, '#e74c3c'], [28.7, 19.7, '#f2c574'], [28.55, 19.45, '#3DDC97']].forEach(([x, z, c]) => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), mat(c, { roughness: 0.4 })); f.position.set(x, 0.81, z); add(f); });
lightPool(29, 21, 4, '#ffd9a0', 0.12);

/* ---- restroom ---- */
for (let k = 0; k < 2; k++) { box(1.5, 1.6, 0.06, mat('#8fb3cc', { roughness: 0.3 }), 33 + k * 1.6, 0, 23.5, { round: 0.02 }); box(0.06, 1.6, 2.5, mat('#b9cfdd'), 32.2 + k * 1.6, 0, 24.75); }
box(0.06, 1.6, 2.5, mat('#b9cfdd'), 35.4, 0, 24.75);
blockRect(32.2, 23.4, 35.8, 26);
box(0.5, 0.85, 1.8, mat('#e8edf2', { roughness: 0.2 }), 35.6, 0, 17.6, { block: true, round: 0.03 });
plane(1.6, 0.7, new THREE.MeshStandardMaterial({ color: '#cfe6f5', roughness: 0.02, metalness: 1, envMapIntensity: 1.4 }), 35.88, 1.35, 17.6, { ry: -Math.PI / 2 });

/* ---- elevator lobby ---- */
[17.5, 20.5].forEach(z => {
  box(0.1, 2.1, 1.5, mat('#bcc8d3', { metalness: 0.9, roughness: 0.18 }), 39.9, 0, z);
  plane(0.28, 0.14, glow('#FFB547', 2.4), 39.84, 2.3, z, { ry: -Math.PI / 2 });
  plane(0.08, 0.08, glow('#00A9F4', 3), 39.84, 1.1, z + 0.95, { ry: -Math.PI / 2 });
});
blockRect(39.6, 16.2, 40, 21.8);
box(0.6, 0.45, 1.8, mat('#2b4a72', { roughness: 0.8 }), 37, 0, 24.6, { block: true, round: 0.06 });
plant(39.3, 25.3, 1.1); plant(0.8, 13.0, 1); plant(39.2, 11.8, 1);
lightPool(38, 19, 3, '#cfe6ff', 0.1);

/* ---- corridor dressing ---- */
const vend = box(0.9, 1.9, 0.7, mat('#1d2a38', { roughness: 0.35, metalness: 0.4 }), 9.6, 0, 14.45, { block: true, round: 0.04 });
const vendM = new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(128, 256, (g) => { g.fillStyle = '#0d1d2b'; g.fillRect(0, 0, 128, 256); const c = ['#e74c3c', '#2251FF', '#3DDC97', '#f2c574', '#ffffff']; for (let r = 0; r < 6; r++) for (let i = 0; i < 4; i++) { g.fillStyle = c[(r + i) % 5]; g.fillRect(10 + i * 28, 14 + r * 34, 18, 26); } }) }); vendM.color.setScalar(1.5);
plane(0.72, 1.5, vendM, 9.6, 1.05, 14.09, { ry: Math.PI });
box(0.4, 1.1, 0.4, mat('#e8edf2', { roughness: 0.3 }), 18.6, 0, 14.6, { block: true, round: 0.05 });
cyl(0.16, 0.16, 0.38, mat('#7fd3ff', { transparent: true, opacity: 0.7, roughness: 0.05 }), 18.6, 1.1, 14.6);
cyl(0.09, 0.09, 0.5, mat('#c0392b', { roughness: 0.35, metalness: 0.2 }), 31.8, 0, 11.35, { seg: 12 });
box(1.6, 0.42, 0.5, mat('#2b3d52', { roughness: 0.5 }), 3.2, 0, 14.6, { block: true, round: 0.05 });
whiteboard(24.4, 1.2, 11.12, 0, 1.4, 0.8, boardTex(320, 180, (g) => { g.fillStyle = '#0A2436'; g.font = `800 22px ${CN_FONT}`; g.fillText('学术报告', 14, 32); ['周二 · 暗物质直接探测', '周四 · 缪子 EDM 进展', '周五 · 研究生沙龙'].forEach((t, i) => { g.fillStyle = ['#2251FF', '#c0392b', '#0f8b8d'][i]; g.fillRect(14, 52 + i * 40, 290, 30); g.fillStyle = '#fff'; g.font = `600 16px ${CN_FONT}`; g.fillText(t, 22, 72 + i * 40); }); }));
[6, 14, 22, 30, 38].forEach(x => lightPool(x, 13, 2.2, '#cfe6ff', 0.09));

