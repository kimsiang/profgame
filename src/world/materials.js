/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   WORLD — 物理楼 5F diorama: architecture, props, people,
   particles, markers, path finding
   ========================================================= */
const RBox = THREE.RoundedBoxGeometry || null;
const geoCache = {};
function rbox(w, h, d, r = 0.04) {
  const k = [w, h, d, r].join(',');
  if (!geoCache[k]) geoCache[k] = RBox ? new RBox(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d);
  return geoCache[k];
}

/* ---------- collision grid ---------- */
function blockRect(x0, z0, x1, z1, m = 0.32) {
  for (let j = 0; j < GD; j++) for (let i = 0; i < GW; i++) {
    const cx = (i + 0.5) * CELL, cz = (j + 0.5) * CELL;
    if (cx >= x0 - m && cx <= x1 + m && cz >= z0 - m && cz <= z1 + m) grid[j * GW + i] = 1;
  }
}
function cellOf(x, z) { return [Math.max(0, Math.min(GW - 1, Math.floor(x / CELL))), Math.max(0, Math.min(GD - 1, Math.floor(z / CELL)))]; }
function freeCell(i, j) { return i >= 0 && j >= 0 && i < GW && j < GD && !grid[j * GW + i]; }
function freeAt(x, z) { if (x < 0.3 || z < 0.3 || x > W - 0.3 || z > D - 0.3) return false; const [i, j] = cellOf(x, z); return freeCell(i, j); }

/* ---------- geometry builders ---------- */
function add(mesh, o = {}) {
  mesh.castShadow = o.cast !== false; mesh.receiveShadow = o.receive !== false;
  (o.parent || Z.group).add(mesh); return mesh;
}
function box(w, h, d, material, x, y, z, o = {}) {
  const m = new THREE.Mesh(o.round ? rbox(w, h, d, o.round) : new THREE.BoxGeometry(w, h, d), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y + h / 2, z); if (o.ry) m.rotation.y = o.ry;
  if (o.cast === undefined) o.cast = Math.max(w, h, d) > 0.4;
  add(m, o);
  if (o.block) blockRect(x - w / 2, z - d / 2, x + w / 2, z + d / 2, o.margin ?? 0.32);
  return m;
}
function cyl(rt, rb, h, material, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 24, 1, !!o.open), typeof material === 'string' ? mat(material) : material);
  m.position.set(x, y + h / 2, z); add(m, o);
  if (o.block) blockRect(x - rb, z - rb, x + rb, z + rb);
  return m;
}
function plane(w, h, material, x, y, z, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.set(x, y, z); if (o.rx !== undefined) m.rotation.x = o.rx; if (o.ry !== undefined) m.rotation.y = o.ry;
  m.receiveShadow = !!o.receive; m.castShadow = false; (o.parent || Z.group).add(m); return m;
}
function floorPlane(x0, z0, x1, z1, material, y = 0) {
  const geo = new THREE.PlaneGeometry(x1 - x0, z1 - z0), P = material.userData && material.userData.pbr;
  if (P) { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + uv.getX(i) * (x1 - x0)) / P.tile, (z0 + uv.getY(i) * (z1 - z0)) / P.tile); }   // v11: world-metre UVs, so floors line up across rooms
  const m = new THREE.Mesh(geo, material);
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true; Z.group.add(m);
  // A layer laid on top of a base floor (y > 0) always wins the depth test, whatever the depth-buffer precision.
  if (y > 0) { const mt = m.material = material.clone(); mt.polygonOffset = true; mt.polygonOffsetFactor = -1; mt.polygonOffsetUnits = -Math.round(y * 1000); if (P) pbrApply(mt); }
  return m;
}
function tiled(draw, rx, ry, srgb = true) { const t = canvasTex(256, 256, draw, srgb); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; }
const T = {
  wood: (rx, ry) => tiled((g, w, h) => { for (let y = 0; y < h; y += 32) { const base = 150 + ((y / 32) % 3) * 9; g.fillStyle = `rgb(${base + 40},${base + 4},${base - 40})`; g.fillRect(0, y, w, 32); for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,50,20,${Math.random() * 0.08})`; g.fillRect(Math.random() * w, y + Math.random() * 30, 30 + Math.random() * 80, 1); } g.fillStyle = 'rgba(60,30,10,.35)'; g.fillRect(0, y + 31, w, 1); g.fillRect(((y / 32) % 2) * 128 + 60, y, 1, 32); } }, rx, ry),
  carpet: (rx, ry, a = '#3f5368', b = '#394b5e') => tiled((g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = Math.random() < .5 ? b : 'rgba(255,255,255,.05)'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); }, rx, ry),
  tile: (rx, ry, a = '#d7dee5', line = '#b9c4ce') => tiled((g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.03})`; g.fillRect(Math.random() * w, Math.random() * h, 6, 6); } g.strokeStyle = line; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, h); g.moveTo(0, 128); g.lineTo(w, 128); g.stroke(); }, rx, ry),
  concrete: (rx, ry) => tiled((g, w, h) => { g.fillStyle = '#b4c0cb'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '20,40,60'},${Math.random() * 0.05})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 3, 0, 7); g.fill(); } g.fillStyle = 'rgba(30,50,70,.18)'; g.fillRect(0, 0, w, 2); }, rx, ry),
  labGrid: (rx, ry) => tiled((g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2aa8ff'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); g.strokeStyle = 'rgba(42,168,255,.35)'; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, h); g.moveTo(0, 128); g.lineTo(w, 128); g.stroke(); }, rx, ry, false),
};

/* ---------- v11.0: real materials (Poly Haven, CC0) ----------
   Files: assets/textures/<id>_diff_1k.jpg (colour), _nor_gl_1k.jpg (normal), _arm_1k.jpg (AO / roughness / metal).
   pbr(id, o) returns a material at once, showing o.fallback (a colour or procedural map) until the files arrive;
   a missing file just keeps the fallback. Textures are shared: floorPlane() scales the plane's UVs to world metres
   (o.tile = metres per texture repeat; Poly Haven surfaces are about 2 m), so one texture serves every floor. */
const PBR_DIR = 'assets/textures/', PBR_TEX = {}, PBR_MATS = [];
function pbrTex(id, m, srgb) {
  const k = id + '_' + m;
  if (!PBR_TEX[k]) PBR_TEX[k] = new Promise(ok => new THREE.TextureLoader().load(`${PBR_DIR}${id}_${m}_1k.jpg`,
    t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = MAX_ANISO; if (srgb) t.encoding = THREE.sRGBEncoding; ok(t); }, undefined, () => ok(null)));
  return PBR_TEX[k];
}
function pbrApply(m) {
  const P = m.userData.pbr;
  if (!P.noDiff) pbrTex(P.id, 'diff', true).then(t => { if (t) { m.map = t; m.color.set(P.tint || '#ffffff'); m.needsUpdate = true; } });
  pbrTex(P.id, 'nor_gl', false).then(t => { if (t) { m.normalMap = t; m.normalScale.set(P.ns || 1, P.ns || 1); m.needsUpdate = true; } });
  pbrTex(P.id, 'arm', false).then(t => { if (t) { m.roughnessMap = t; m.roughness = P.roughK || 1; if (P.metal) { m.metalnessMap = t; m.metalness = 1; } m.needsUpdate = true; } });
}
function pbr(id, o = {}) {
  const fb = o.fallback;
  const m = new THREE.MeshStandardMaterial({ color: typeof fb === 'string' ? fb : '#ffffff', map: fb && fb.isTexture ? fb : null, roughness: o.rough ?? 0.6, metalness: 0, envMapIntensity: o.env ?? 0.45 });
  m.userData.pbr = { id, tint: o.tint, ns: o.ns, roughK: o.roughK, metal: !!o.metal, tile: o.tile || 2, noDiff: !!o.noDiff };   // noDiff: relief and roughness only, over a clean paint colour
  PBR_MATS.push(m); pbrApply(m); return m;
}

// v11.2 canteen data (assets/data/canteen.json); declared before the 1F build, which makes the stall signs
const CANTEEN = { data: null, stalls: [], signDay: null };
// v11.4 campus buildings (assets/data/campus.json) and the facades built from them (for the night lights)
const CAMPUS = { data: null }, FACADES = [];
// The zones are built at boot, before the fetch returns. A building whose JSON spec differs from the inline one is rebuilt in place,
// so campus.json is the file to edit; the inline spec is only the boot fallback.
fetch('assets/data/campus.json').then(r => r.json()).then(d => { CAMPUS.data = d;
  const core = (o) => { const c = Object.assign({}, o); delete c.name_zh; delete c.name_en; return JSON.stringify(c); };
  for (const b of d.buildings || []) { const f = FACADES.find(x => x.spec && x.spec.id === b.id); if (!f || core(f.spec) === core(b)) continue;
    const nb = FacadeKit.building(THREE, b, { quality: QUALITY, seed: b.seed || 31 }); f.zone.group.remove(f.group); f.zone.group.add(nb.group); Object.assign(f, nb, { spec: b }); }
}).catch(() => {});
fetch('assets/data/canteen.json').then(r => r.json()).then(d => { CANTEEN.data = d; CANTEEN.signDay = null; }).catch(() => { /* old fixed menu */ });

