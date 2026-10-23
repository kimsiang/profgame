/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   PARTICLES
   ========================================================= */
class PSys {
  constructor(max, tex, o = {}) {
    this.max = max; this.p = [];
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(max * 3); this.size = new Float32Array(max); this.alpha = new Float32Array(max); this.col = new Float32Array(max * 3);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, uScale: { value: 400 } }, transparent: true, depthWrite: false,
      blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: 'attribute float aSize; attribute float aAlpha; attribute vec3 aColor; uniform float uScale; varying float vA; varying vec3 vC; void main(){ vA = aAlpha; vC = aColor; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize * uScale / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying float vA; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, t.a * vA); }',
    });
    this.points = new THREE.Points(this.geo, this.mat); this.points.frustumCulled = false; scene.add(this.points);
  }
  emit(o) { if (this.p.length >= this.max) this.p.shift(); this.p.push(Object.assign({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 1, max: 1, size: 0.2, grow: 0, a: 1, c: [1, 1, 1], drag: 0, g: 0 }, o)); }
  update(dt) {
    let n = 0;
    for (let i = this.p.length - 1; i >= 0; i--) { const q = this.p[i]; q.life -= dt; if (q.life <= 0) { this.p.splice(i, 1); continue; } q.vy += q.g * dt; q.vx *= 1 - q.drag * dt; q.vz *= 1 - q.drag * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.size += q.grow * dt; }
    for (const q of this.p) { const k = q.life / q.max, fade = Math.min(1, k * 3) * Math.min(1, (1 - k) * 6 + 0.001); this.pos[n * 3] = q.x; this.pos[n * 3 + 1] = q.y; this.pos[n * 3 + 2] = q.z; this.size[n] = q.size; this.alpha[n] = q.a * fade; this.col[n * 3] = q.c[0]; this.col[n * 3 + 1] = q.c[1]; this.col[n * 3 + 2] = q.c[2]; n++; }
    this.geo.setDrawRange(0, n);
    ['position', 'aSize', 'aAlpha', 'aColor'].forEach(k => { this.geo.attributes[k].needsUpdate = true; });
  }
}
const FX = {
  dust: new PSys(260, softDot, { additive: true }),
  steam: new PSys(80, softDot),
  fog: new PSys(140, softDot),
  spark: new PSys(160, softDot, { additive: true }),
};
onResizeHooks.push((w, h) => { const s = h / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))); Object.values(FX).forEach(f => { f.mat.uniforms.uScale.value = s * Math.min(window.devicePixelRatio || 1, 2); }); });
function burst(x, y, z, color = [1.6, 1.3, 0.5], n = 40, speed = 2.5) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, e = Math.random() * 1.2; FX.spark.emit({ x, y, z, vx: Math.cos(a) * Math.cos(e) * speed, vy: Math.sin(e) * speed + 1, vz: Math.sin(a) * Math.cos(e) * speed, g: -3, drag: 1.5, life: 0.9 + Math.random() * 0.6, max: 1.5, size: 0.12 + Math.random() * 0.1, c: color }); }
}

/* =========================================================
   QUEST MARKERS, MUONS, CLICK RIPPLES
   ========================================================= */
const beamGeo = new THREE.CylinderGeometry(0.34, 0.34, 3.2, 20, 1, true);
function makeMarker(x, z, urgent, zoneId) {
  const col = urgent ? '#FF4D63' : '#FFB547';
  const grp = new THREE.Group(); grp.position.set(x, 0, z);
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), glow(col, 3)); gem.scale.set(1, 1.5, 1); gem.position.y = 2.55; grp.add(gem);
  const bang = nameTag(urgent ? '紧急' : '任务'); bang.position.y = 2.98; bang.scale.multiplyScalar(0.85); grp.add(bang);
  const beamM = new THREE.MeshBasicMaterial({ map: beamTex, color: col, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }); beamM.color.multiplyScalar(1.6);
  const beam = new THREE.Mesh(beamGeo, beamM); beam.position.y = 1.6; beam.rotation.x = Math.PI; grp.add(beam);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 40), glow(col, 2.2, 0.9)); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.03; grp.add(ring);
  grp.userData = { gem, ring, beam, urgent };
  (ZONES[zoneId] || Z).group.add(grp); return grp;
}
const ripples = [];
function ripple(x, z, color = '#00A9F4') {
  const mt = glow(color, 2.5, 1); mt.transparent = true; mt.depthWrite = false;   // must be transparent, or the fade below never shows
  const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.28, 32), mt); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.03, z); Z.group.add(m); ripples.push({ m, t: 0 });
}
const muonPool = [];
for (let i = 0; i < 16; i++) {
  const geo2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const m = new THREE.LineBasicMaterial({ color: new THREE.Color('#7fe3ff').multiplyScalar(3), transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const l = new THREE.Line(geo2, m); l.frustumCulled = false; scene.add(l); muonPool.push({ l, life: 0 });
}
let detFlash = 0;
function spawnMuon() {
  const m = muonPool.find(m => m.life <= 0); if (!m) return;
  const x = Math.random() * 42 - 1, z = Math.random() * 28 - 1;
  const th = Math.acos(Math.pow(Math.random(), 1 / 3)) * 0.8, ph = Math.random() * Math.PI * 2;
  const top = 18, dx = Math.tan(th) * Math.cos(ph) * top, dz = Math.tan(th) * Math.sin(ph) * top;
  const p = m.l.geometry.attributes.position; p.setXYZ(0, x + dx, top, z + dz); p.setXYZ(1, x, 0, z); p.needsUpdate = true;
  m.life = 0.4;
  if (x > 0 && x < 40 && z > 0 && z < 26) FX.spark.emit({ x, y: 0.05, z, life: 0.35, max: 0.35, size: 0.35, grow: 1.2, c: [0.6, 1.6, 2.2], a: 0.8 });
  if (x > 24 && x < 28 && z > 3 && z < 5) { detFlash = 1; holoHist[Math.min(25, Math.floor(-Math.log(Math.random()) * 2.197 / 0.5))]++; }
}

/* =========================================================
   INTERIOR LIGHTS (ramp up at dusk)
   ========================================================= */
const lamps = [];
function addLamp(x, z, c, dist = 9) { if (QUALITY === 'low') return null; const l = new THREE.PointLight(c, 0, dist, 1.6); l.position.set(x, 2.6, z); Z.group.add(l); lamps.push(l); return l; }
if (QUALITY !== 'low') {
  [[4, 5, '#ffd39a'], [14, 5, '#d6e8ff'], [26, 5, '#59c8ff'], [36, 4, '#6f97ff'], [6, 20, '#ffe1b0'], [16, 21, '#f0d8ff'], [23, 21, '#fff0d6'], [29, 21, '#ffd39a'], [12, 13, '#d6e8ff'], [32, 13, '#d6e8ff']].slice(0, QUALITY === 'high' ? 10 : 6).forEach(([x, z, c]) => {
    const l = new THREE.PointLight(c, 0, 9, 1.6); l.position.set(x, 2.6, z); Z.group.add(l); lamps.push(l);
  });
}
const alarmLight = new THREE.PointLight('#ff2a44', 0, 14, 1.6); alarmLight.position.set(26, 2.4, 6); Z.group.add(alarmLight);
const hvLight = new THREE.PointLight('#ff8a2a', 0, 8, 1.8); hvLight.position.set(26, 2, 4); Z.group.add(hvLight);

/* =========================================================
   PATH FINDING (A* on the 0.5 m grid)
   ========================================================= */
function nearestFree(i, j) {
  if (freeCell(i, j)) return [i, j];
  for (let r = 1; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
    if (freeCell(i + di, j + dj)) return [i + di, j + dj];
  }
  return null;
}
function astar(sx, sz, tx, tz) {
  const s = nearestFree(...cellOf(sx, sz)), t = nearestFree(...cellOf(tx, tz));
  if (!s || !t) return null;
  const N = GW * GD, g = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const si = s[1] * GW + s[0], ti = t[1] * GW + t[0];
  const heap = [[0, si]]; g[si] = 0;
  const h = (k) => { const x = k % GW, y = (k / GW) | 0, dx = Math.abs(x - t[0]), dy = Math.abs(y - t[1]); return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy); };
  const push = (it) => { heap.push(it); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  while (heap.length) {
    const [, k] = pop(); if (closed[k]) continue; closed[k] = 1;
    if (k === ti) break;
    const x = k % GW, y = (k / GW) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (!freeCell(nx, ny)) continue;
      if (dx && dy && (!freeCell(x + dx, y) || !freeCell(x, y + dy))) continue;
      const nk = ny * GW + nx, ng = g[k] + (dx && dy ? Math.SQRT2 : 1);
      if (ng < g[nk]) { g[nk] = ng; came[nk] = k; push([ng + h(nk), nk]); }
    }
  }
  if (came[ti] === -1 && si !== ti) return null;
  const cells = []; for (let k = ti; k !== -1; k = came[k]) { cells.push(k); if (k === si) break; }
  cells.reverse();
  const pts = cells.map(k => new THREE.Vector3(((k % GW) + 0.5) * CELL, 0, (((k / GW) | 0) + 0.5) * CELL));
  const out = [pts[0]]; let a = 0;
  for (let i = 2; i < pts.length; i++) if (!lineFree(pts[a], pts[i])) { out.push(pts[i - 1]); a = i - 1; }
  out.push(pts[pts.length - 1]); out.shift();
  return out;
}
function lineFree(a, b) {
  const d = a.distanceTo(b), n = Math.ceil(d / 0.2);
  for (let i = 1; i < n; i++) { const x = a.x + (b.x - a.x) * i / n, z = a.z + (b.z - a.z) * i / n; if (!freeAt(x, z)) return false; }
  return true;
}
function roomAt(x, z) {
  for (const [id, r] of Object.entries(Z.rooms)) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return id;
  return 'corridor';
}
F5.rooms = {
  office: { x0: 0, z0: 0, x1: 8, z1: 11, name: '教授办公室' }, bay: { x0: 8, z0: 0, x1: 20, z1: 11, name: '学生办公区' },
  lab: { x0: 20, z0: 0, x1: 32, z1: 11, name: '缪子实验室' }, server: { x0: 32, z0: 0, x1: 40, z1: 11, name: '计算机房' },
  hall: { x0: 0, z0: 15, x1: 12, z1: 26, name: '报告厅' }, meet: { x0: 12, z0: 15, x1: 20, z1: 26, name: '会议室' },
  admin: { x0: 20, z0: 15, x1: 26, z1: 26, name: '院办' }, pantry: { x0: 26, z0: 15, x1: 32, z1: 26, name: '茶水间' },
  wc: { x0: 32, z0: 15, x1: 36, z1: 26, name: '洗手间' }, lobby: { x0: 36, z0: 15, x1: 40, z1: 26, name: '电梯厅' },
};
F5.lamps = lamps.slice(); F5.pools = lightPools.slice();

