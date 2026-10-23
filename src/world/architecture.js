/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   ARCHITECTURE
   ========================================================= */
function slab(w, d, cx, cz, color = REAL ? '#7a7b7c' : '#1b2c3d') {   // v11.0: a concrete floor slab in section (diorama: dark navy)
  // The slab's top sits 3 cm below the floor (y = 0). It used to be exactly at y = 0, coplanar with every
  // floor plane, so the GPU picked slab or tile at random per pixel per frame: the white/grey floor flicker.
  box(w + 1.2, 1.2, d + 1.2, mat(color, { roughness: 0.9 }), cx, -1.23, cz, { cast: false });
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 1.2, 0.02, d + 1.2)), (REAL ? new THREE.LineBasicMaterial({ color: '#4a4c4f' }) : new THREE.LineBasicMaterial({ color: new THREE.Color('#00A9F4').multiplyScalar(2.5), toneMapped: false })));
  e.position.set(cx, -0.04, cz); Z.group.add(e);
}
/* ---------- v7.3: prop kit (assets/props/kit.glb, built by tools/blender/build_props.py) ----------
   Every procedural builder below is wrapped so it records the meshes it made. When the kit loads, each
   recorded prop is swapped for its model at the same transform: the procedural meshes are hidden (not
   removed), collision stays in the grid, and monitor screens, keyboards and mugs stay procedural.
   Without the GLB (offline file, missing assets) nothing changes. */
const KIT = { slots: [], stack: [], ready: false, models: {}, tints: {} };
function kitWrap(kind, fn) {
  return function (...args) {
    const zone = Z, zg = Z.group, n0 = zg.children.length;
    KIT.stack.push([]);
    const ret = fn.apply(this, args);
    const claimed = new Set(KIT.stack.pop());
    const created = zg.children.slice(n0).filter(o => !claimed.has(o));
    const slot = { kind, args, zone, created, ret };
    KIT.slots.push(slot);
    if (KIT.stack.length) KIT.stack[KIT.stack.length - 1].push(...created);   // a nested prop (monitor in desk) is not its parent's
    if (KIT.ready) kitApply(slot);
    return ret;
  };
}
// v13.0: the kitWrap() of desk/chair/… now sits at the top of props-5f.js, next to those functions.
const KIT_TREE = ['#3f8f5a', '#7aa83a', '#c97a3a', '#4f9f6f'];
function kitClone(kind, tint) {
  const c = KIT.models[kind].clone(true);
  c.traverse(n => {
    if (!n.isMesh) return;
    n.castShadow = true; n.receiveShadow = true;
    if (tint && n.material.name === 'kit_tint') {
      const k = n.material.uuid + tint;
      if (!KIT.tints[k]) { const m = n.material.clone(); m.color.set(tint); m.envMapIntensity = 0.25; KIT.tints[k] = m; matCache['kit:' + k] = m; }
      n.material = KIT.tints[k];
    }
  });
  return c;
}
// v11.0: oak veneer desk tops. The kit has no UVs, so project them from the geometry (box mapping by face normal), once per geometry.
function planarUV(geo, tile) {
  if (geo.attributes.uv) return geo;
  const p = geo.attributes.position, n = geo.attributes.normal, a = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const [u, v] = ay >= ax && ay >= az ? [p.getX(i), p.getZ(i)] : ax >= az ? [p.getZ(i), p.getY(i)] : [p.getX(i), p.getY(i)];
    a[i * 2] = u / tile; a[i * 2 + 1] = v / tile; }
  geo.setAttribute('uv', new THREE.BufferAttribute(a, 2)); return geo;
}
const OAK = {};
function deskOak(m, top) {
  const key = top || 'oak', om = OAK[key] || (OAK[key] = pbr('oak_veneer_01', { tile: 1.2, tint: top && top !== '#f2efe8' ? top : '#ffffff', env: 0.35, fallback: top || '#c8a27a' }));
  m.traverse(n => { if (n.isMesh && /kit_tint/.test(n.material.name || '') || (n.isMesh && n.material.userData && n.material.userData.kitTint)) { planarUV(n.geometry, 1.2); n.material = om; } });
}
function kitApply(s) {
  if (s.applied || !KIT.models[s.kind === 'lampPost' ? 'lamp' : s.kind]) return; s.applied = true;
  const a = s.args, zg = s.zone.group, grp = s.created.find(o => o.isGroup), hide = (list) => list.forEach(o => { o.visible = false; });
  let m;
  switch (s.kind) {
    case 'desk': {   // top + four legs are the first five meshes; keyboard, mug and papers stay
      const [x, z, w = 1.5, d = 0.8, o = {}] = a;
      hide(s.created.slice(0, 5)); m = kitClone('desk', o.top || '#f2efe8'); m.position.set(x, 0, z); m.scale.set(w / 1.5, 1, d / 0.8); zg.add(m); if (REAL) deskOak(m, o.top); break;
    }
    case 'monitor':  // bezel, neck, base; the animated screen plane stays in front
      hide(grp.children.slice(0, 3)); m = kitClone('monitor'); grp.add(m); break;
    case 'chair':
      hide(grp.children.slice()); m = kitClone('chair', a[3] || '#24364a'); grp.add(m); break;
    case 'bench':
      hide(grp.children.slice()); m = kitClone('bench'); grp.add(m); break;
    case 'shelf': {  // 0.9 m bays tiled to the requested width
      const w = a[2], n = Math.max(1, Math.round(w / 0.9)), bw = w / n;
      hide(grp.children.slice());
      for (let i = 0; i < n; i++) {   // three book arrangements, alternate bays mirrored: no visible repeat down an aisle
        const v = ['shelf', 'shelf_b', 'shelf_c'][Math.abs(Math.round(a[0] * 3 + a[1] * 7 + i * 5)) % 3];
        m = kitClone(KIT.models[v] ? v : 'shelf'); m.position.x = -w / 2 + bw * (i + 0.5); m.scale.x = (i % 2 ? -1 : 1) * bw / 0.9; grp.add(m);
      }
      break;
    }
    case 'plant': {
      const [x, z, sc = 1] = a; hide(s.created); m = kitClone('plant'); m.position.set(x, 0, z); m.scale.setScalar(sc); m.rotation.y = (x * 7.3 + z * 3.1) % (Math.PI * 2); zg.add(m); break;
    }
    case 'tree': {
      const [x, z, sc = 1, kind = 0] = a; hide(s.created); m = kitClone('tree', KIT_TREE[kind % 4]); m.position.set(x, 0, z); m.scale.setScalar(sc); m.rotation.y = (x * 5.7 + z * 2.3) % (Math.PI * 2); zg.add(m); break;
    }
    case 'lampPost': {   // only the pole is replaced; the glowing sphere, light pool and point light stay
      const [x, z, h = 3.2] = a; hide(s.created.slice(0, 1)); m = kitClone('lamp'); m.position.set(x, 0, z); m.scale.set(1, h / 3.2, 1); zg.add(m); break;
    }
  }
}
if (THREE.GLTFLoader) new THREE.GLTFLoader().load('assets/props/kit.glb', (g) => {
  g.scene.children.forEach(n => { n.position.set(0, 0, 0); KIT.models[n.name] = n; });
  // glTF materials default to envMapIntensity 1; the world's mat() uses 0.25 (metal 0.45). Match it, or the kit glows.
  g.scene.traverse(n => { if (n.isMesh && !matCache['kit:' + n.material.uuid]) { n.material.envMapIntensity = n.material.name === 'kit_metal' ? 0.45 : 0.25; matCache['kit:' + n.material.uuid] = n.material; } });
  KIT.ready = true; KIT.slots.forEach(kitApply); if (typeof lighting === 'function') lighting.envK = -1;   // v13.0: the kit may arrive before main.js has loaded; the first lighting() call refreshes anyway
}, undefined, () => { /* no kit: keep the procedural props */ });

const F5 = beginZone('f5', { name: '5F · 缪子物理组', floor: 5, spawn: { x: 38, z: 18.6 }, portals: [{ kind: 'elevator', x: 38.2, z: 18.6 }] });
slab(40, 26, 20, 13);

// v11.0: real floors (Poly Haven). Fallbacks are the old procedural maps until a file arrives.
const F5_FLOOR = !REAL ? {
  // diorama (v10): procedural maps and the glowing lab grid
  corridor: mat('#ffffff', { map: T.concrete(10, 1), roughness: 0.32, envMapIntensity: 0.9 }),
  office: mat('#ffffff', { map: T.wood(3, 4), roughness: 0.48 }), office2: mat('#ffffff', { map: T.wood(5, 5), roughness: 0.5 }),
  carpet: mat('#ffffff', { map: T.carpet(5, 4), roughness: 0.95, envMapIntensity: 0.25 }), carpet2: mat('#ffffff', { map: T.carpet(4, 5, '#5b4a6e', '#524265'), roughness: 0.95, envMapIntensity: 0.25 }), carpet3: mat('#ffffff', { map: T.carpet(3, 5, '#4d6578', '#455c6e'), roughness: 0.95, envMapIntensity: 0.25 }),
  lab: mat('#16283a', { roughness: 0.28, metalness: 0.15, emissive: '#ffffff', emissiveMap: T.labGrid(6, 5.5), emissiveIntensity: 0.32, envMapIntensity: 1 }),
  server: mat('#ffffff', { map: T.tile(8, 11, '#2a3746', '#1b2531'), roughness: 0.4, metalness: 0.3 }),
  pantry: mat('#ffffff', { map: T.tile(5, 9, '#e7e2d8', '#cfc6b7'), roughness: 0.35 }), wc: mat('#ffffff', { map: T.tile(4, 11, '#cfe0ea', '#a9c0cf'), roughness: 0.3 }),
  lobby: mat('#ffffff', { map: T.concrete(2, 5), roughness: 0.3, envMapIntensity: 0.9 }),
} : {
  corridor: pbr('interior_tiles', { tile: 1.6, tint: '#ece9e4', fallback: T.concrete(10, 1) }),
  office:   pbr('laminate_floor_02', { tile: 2, fallback: T.wood(3, 4) }),
  carpet:   pbr('dirty_carpet', { tile: 2, rough: 0.95, env: 0.15, fallback: T.carpet(5, 4) }),
  lab:      pbr('concrete_floor_painted', { tile: 3, noDiff: true, ns: 0.6, fallback: '#9aa1a6' }),   // grey epoxy: the texture's relief, not its dirt
  server:   pbr('concrete_floor_painted', { tile: 3, noDiff: true, ns: 0.6, fallback: '#6f777d' }),
  pantry:   pbr('interior_tiles', { tile: 1.4, fallback: T.tile(5, 9, '#e7e2d8', '#cfc6b7') }),
  wc:       pbr('interior_tiles', { tile: 1.2, noDiff: true, ns: 1.2, fallback: '#cfd7dc' }),   // pale grey tiles: grey_cartago_01 turned out to be a rusty slate, not a washroom floor
  lobby:    pbr('terrazzo_tiles', { tile: 2.5, tint: '#e9e2d9', fallback: T.concrete(2, 5) }),
};
floorPlane(0, 11, 40, 15, F5_FLOOR.corridor);
floorPlane(0, 0, 8, 11, F5_FLOOR.office);
floorPlane(8, 0, 20, 11, F5_FLOOR.carpet);
floorPlane(20, 0, 32, 11, F5_FLOOR.lab);
floorPlane(32, 0, 40, 11, F5_FLOOR.server);
floorPlane(0, 15, 12, 26, F5_FLOOR.office2 || F5_FLOOR.office);
floorPlane(12, 15, 20, 26, F5_FLOOR.carpet2 || F5_FLOOR.carpet);
floorPlane(20, 15, 26, 26, F5_FLOOR.carpet3 || F5_FLOOR.carpet);
floorPlane(26, 15, 32, 26, F5_FLOOR.pantry);
floorPlane(32, 15, 36, 26, F5_FLOOR.wc);
floorPlane(36, 15, 40, 26, F5_FLOOR.lobby);

/* walls */
const WALLS = [];
function wh(z, x0, x1, gaps = [], kind) { let s = x0; gaps.sort((a, b) => a[0] - b[0]); for (const [a, b] of gaps) { if (a > s) WALLS.push([s, z, a, z, kind]); s = b; } if (x1 > s) WALLS.push([s, z, x1, z, kind]); }
function wv(x, z0, z1, gaps = [], kind) { let s = z0; gaps.sort((a, b) => a[0] - b[0]); for (const [a, b] of gaps) { if (a > s) WALLS.push([x, s, x, a, kind]); s = b; } if (z1 > s) WALLS.push([x, s, x, z1, kind]); }
wh(0, 0, 40, [], 'window'); wv(0, 0, 26, [], 'window');
wh(26, 0, 40, [], 'low'); wv(40, 0, 26, [[16.2, 21.8]], 'low');
wh(11, 0, 20, [[5, 7], [13, 16]]); wh(11, 20, 40, [[25, 27], [35, 37]], 'glass');
wh(15, 0, 40, [[4.5, 7.5], [15, 17], [22, 24], [28, 30], [33, 35], [36.2, 39.8]]);
wv(8, 0, 11); wv(20, 0, 11); wv(32, 0, 11, [], 'glass');
wv(12, 15, 26); wv(20, 15, 26); wv(26, 15, 26); wv(32, 15, 26); wv(36, 15, 26);
const WALL_H = 1.35;
// v11.0: painted plaster walls, a grey wainscot and skirting, an aluminium cap. The neon trim is gone.
const DIO_WALLS = () => { return { wallUpper: mat('#dfe5eb', { roughness: 0.9, envMapIntensity: 0.3 }), wallLower: mat('#9fb2c4', { roughness: 0.8, envMapIntensity: 0.3 }), baseB: mat('#22344a', { roughness: 0.5 }), capM: mat('#2b3d52', { roughness: 0.4, metalness: 0.4 }) }; };
const REAL_WALLS = () => ({ wallUpper: pbr('plastered_wall', { tile: 2.5, noDiff: true, ns: 0.4, env: 0.25, fallback: '#eeebe5' }), wallLower: pbr('white_stucco', { tile: 1.5, noDiff: true, ns: 0.5, env: 0.25, fallback: '#cfcac1' }), baseB: mat('#5d6166', { roughness: 0.6 }), capM: mat('#b9bec3', { roughness: 0.35, metalness: 0.75 }) });   // walls: clean paint over real plaster relief
const { wallUpper, wallLower, baseB, capM } = REAL ? REAL_WALLS() : DIO_WALLS();
const trimGlow = REAL ? mat('#c8cdd2', { roughness: 0.3, metalness: 0.85 }) : glow('#00A9F4', 2.4);   // was glowing cyan; kept as a name so other zones pick up the metal trim too
const glassM = REAL ? new THREE.MeshStandardMaterial({ color: '#d6ebf2', roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.14, envMapIntensity: 1.4, depthWrite: false }) : new THREE.MeshStandardMaterial({ color: '#a6e2ff', roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.16, envMapIntensity: 1.6, depthWrite: false });   // v11.0: clear glass, less cyan
const frameM = REAL ? mat('#4a4f55', { roughness: 0.4, metalness: 0.65 }) : mat('#33475d', { roughness: 0.35, metalness: 0.6 });   // v11.0: anodised aluminium window and door frames
// v11.0: give a box UVs in metres (per face), so a tiled real material keeps its scale on every wall length.
function boxUVMetres(geo, w, h, d, tile) {
  const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];   // face order +x -x +y -y +z -z, 4 vertices each
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / tile, uv.getY(k) * dims[f][1] / tile); }
  return geo;
}
function seg(cx, cz, horiz, len, y, h, t, m, cast = true) {
  const P = m.userData && m.userData.pbr, bw = horiz ? len : t, bd = horiz ? t : len, geo = new THREE.BoxGeometry(bw, h, bd);
  if (P) boxUVMetres(geo, bw, h, bd, P.tile);
  const g = new THREE.Mesh(geo, m);
  g.position.set(cx, y + h / 2, cz); g.castShadow = cast; g.receiveShadow = true; Z.group.add(g); return g;
}
for (const [x0, z0, x1, z1, kind] of WALLS) {
  const horiz = z0 === z1, len = (horiz ? x1 - x0 : z1 - z0) + 0.2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, t = 0.2;
  blockRect(Math.min(x0, x1) - 0.1, Math.min(z0, z1) - 0.1, Math.max(x0, x1) + 0.1, Math.max(z0, z1) + 0.1);
  if (kind === 'low') {
    seg(cx, cz, horiz, len, 0, 0.42, t + 0.04, capM);
    seg(cx, cz, horiz, len, 0.42, 0.025, t + 0.06, trimGlow, false);
    continue;
  }
  if (kind === 'glass' || kind === 'window') {
    const H = kind === 'window' ? 2.4 : WALL_H;
    seg(cx, cz, horiz, len, 0, 0.32, t, kind === 'window' ? capM : frameM);
    seg(cx, cz, horiz, len, 0.32, H - 0.32 - 0.08, 0.04, glassM, false);
    seg(cx, cz, horiz, len, H - 0.08, 0.08, t, frameM);
    seg(cx, cz, horiz, len, H, 0.02, t + 0.02, trimGlow, false);
    const n = Math.max(1, Math.round(len / 1.6));
    for (let i = 0; i <= n; i++) { const p = -len / 2 + i * len / n; seg(horiz ? cx + p : cx, horiz ? cz : cz + p, horiz, 0.07, 0.32, H - 0.4, 0.09, frameM); }
    continue;
  }
  seg(cx, cz, horiz, len, 0, 0.1, t + 0.02, baseB);
  seg(cx, cz, horiz, len, 0.1, 0.52, t, wallLower);
  seg(cx, cz, horiz, len, 0.62, WALL_H - 0.62, t, wallUpper);
  seg(cx, cz, horiz, len, WALL_H, 0.05, t + 0.04, capM);
  seg(cx, cz, horiz, len, WALL_H + 0.05, 0.018, t - 0.06, trimGlow, false);
}
/* door frames with glowing thresholds */
const DOORS = [[5, 7, 11, 'h'], [13, 16, 11, 'h'], [25, 27, 11, 'h'], [35, 37, 11, 'h'], [4.5, 7.5, 15, 'h'], [15, 17, 15, 'h'], [22, 24, 15, 'h'], [28, 30, 15, 'h'], [33, 35, 15, 'h']];
const thresholdM = REAL ? mat('#a9aeb3', { roughness: 0.3, metalness: 0.9 }) : glow('#00A9F4', 1.6, 0.9);   // v11.0: stainless door thresholds instead of glowing strips
DOORS.forEach(([a, b, z]) => {
  [a, b].forEach(x => box(0.14, WALL_H + 0.12, 0.3, frameM, x, 0, z));
  plane(b - a, 0.08, thresholdM, (a + b) / 2, 0.012, z, { rx: -Math.PI / 2 });
});

/* signage on the corridor floor */
/* Floor signs. A sign only carries an arrow when it is told where its place is: o.to = 'n' | 's' | 'e' | 'w'
   (world directions: n = -z, s = +z, e = +x, w = -x). East/west signs get a pointed end; north/south signs get a
   separate flat chevron at the edge facing the place, so the arrow stays right however the camera turns.
   Signs without o.to are plain name plates. (v9.0.6: every sign used to point +x, whatever was there.) */
function decal(text, x, z, w = 3.2, h = 0.7, o = {}) {
  const to = o.to || null, tipR = to === 'e', tipL = to === 'w';
  const tex = canvasTex(512, Math.round(512 * h / w), (g, cw, ch) => {
    const t = ch * 0.4;
    g.fillStyle = REAL ? 'rgba(46,50,56,.78)' : (o.bg || 'rgba(5,28,44,.86)'); g.beginPath();   // realistic: printed floor vinyl, one neutral colour
    if (tipR) { g.moveTo(0, 0); g.lineTo(cw - t, 0); g.lineTo(cw, ch / 2); g.lineTo(cw - t, ch); g.lineTo(0, ch); }
    else if (tipL) { g.moveTo(t, 0); g.lineTo(cw, 0); g.lineTo(cw, ch); g.lineTo(t, ch); g.lineTo(0, ch / 2); }
    else { g.rect(0, 0, cw, ch); }
    g.fill();
    const x0 = tipL ? t + 6 : 0;
    g.fillStyle = o.accent || '#00A9F4'; g.fillRect(x0, 0, 10, ch);
    g.fillStyle = o.fg || '#EAF4FB'; g.font = `800 ${Math.round(ch * 0.44)}px ${CN_FONT}`; g.textBaseline = 'middle';
    g.fillText(text, x0 + 30, ch * 0.4);
    if (o.sub) { g.fillStyle = 'rgba(205,238,255,.75)'; g.font = `600 ${Math.round(ch * 0.19)}px ${CN_FONT}`; g.fillText(o.sub, x0 + 30, ch * 0.8); }
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4, envMapIntensity: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.015, z); m.receiveShadow = true; Z.group.add(m);
  if (to === 'n' || to === 's') {
    // Flat chevron just past the plate edge, apex toward the place.
    const sg = to === 'n' ? -1 : 1, a = 0.34, shp = new THREE.Shape();
    shp.moveTo(-a, 0); shp.lineTo(0, a * 0.9); shp.lineTo(a, 0); shp.lineTo(a * 0.55, 0); shp.lineTo(0, a * 0.5); shp.lineTo(-a * 0.55, 0); shp.closePath();
    const c = new THREE.Mesh(new THREE.ShapeGeometry(shp), (REAL ? new THREE.MeshStandardMaterial({ color: o.accent || '#00A9F4', roughness: 0.5, transparent: true, opacity: 0.9, polygonOffset: true, polygonOffsetFactor: -2 }) : new THREE.MeshBasicMaterial({ color: new THREE.Color(o.accent || '#00A9F4').multiplyScalar(1.6), toneMapped: false, transparent: true, opacity: 0.95, polygonOffset: true, polygonOffsetFactor: -2 })));
    // Shape lies in XY with apex +y; lay it on the floor so the apex points to world -z (n) or +z (s).
    c.rotation.x = -Math.PI / 2; if (sg > 0) c.rotation.z = Math.PI;
    c.position.set(x, 0.016, z + sg * (h / 2 + 0.12)); Z.group.add(c);
  }
  return m;
}
decal('教授办公室', 6, 12.05, 2.8, 0.6, { sub: '503 · PROFESSOR' , to: 'n' });
decal('学生办公区', 14.5, 12.05, 2.8, 0.6, { sub: '505 · MUON GROUP' , to: 'n' });
decal('缪子实验室', 26, 12.05, 2.8, 0.6, { sub: '507 · HV / LN₂', accent: '#FF5A6E' , to: 'n' });
decal('计算机房', 36, 12.05, 2.6, 0.6, { sub: '509 · GPU CLUSTER' , to: 'n' });
decal('报告厅', 6, 13.95, 2.4, 0.6, { sub: '502 · 200 SEATS' , to: 's' });
decal('会议室', 16, 13.95, 2.2, 0.6, { sub: '504 · MEETING' , to: 's' });
decal('院办', 23, 13.95, 1.9, 0.6, { sub: '506 · OFFICE' , to: 's' });
decal('茶水间', 29, 13.95, 2.1, 0.6, { sub: '508 · PANTRY' , to: 's' });
decal('洗手间', 34, 13.95, 1.9, 0.6, { sub: 'WC' , to: 's' });
decal('物理楼 5F', 20, 13.0, 4.4, 0.85, { bg: 'rgba(34,81,255,.9)', accent: '#00A9F4', sub: 'PHYSICS BUILDING · FLOOR 5' });

