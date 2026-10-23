/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
// v13.0 (moved from architecture.js): these three builders are declared in this file, so their kit wrapping happens here.
bench = kitWrap('bench', bench); tree = kitWrap('tree', tree); lampPost = kitWrap('lampPost', lampPost);
/* =========================================================
   THE REST OF THE BUILDING AND THE CAMPUS
   1F lobby + canteen · 2F classrooms · 3F library · 4F tennis
   6F botanical garden · rooftop café · campus · gym (badminton)
   ========================================================= */
const FLOOR_IDS = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'roof'];
const FLOOR_LABEL = { f1: '1F', f2: '2F', f3: '3F', f4: '4F', f5: '5F', f6: '6F', roof: 'R' };
const ELEV = { x: 38.2, z: 18.6 };

/* wall runs in the 5F style */
function wallRun(x0, z0, x1, z1, kind) {
  const horiz = z0 === z1, len = (horiz ? x1 - x0 : z1 - z0) + 0.2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, t = 0.2;
  blockRect(Math.min(x0, x1) - 0.1, Math.min(z0, z1) - 0.1, Math.max(x0, x1) + 0.1, Math.max(z0, z1) + 0.1);
  if (kind === 'low') { seg(cx, cz, horiz, len, 0, 0.42, t + 0.04, capM); seg(cx, cz, horiz, len, 0.42, 0.025, t + 0.06, trimGlow, false); return; }
  if (kind === 'glass' || kind === 'window') {
    const H = kind === 'window' ? 2.4 : WALL_H;
    seg(cx, cz, horiz, len, 0, 0.32, t, kind === 'window' ? capM : frameM);
    seg(cx, cz, horiz, len, 0.32, H - 0.4, 0.04, glassM, false);
    seg(cx, cz, horiz, len, H - 0.08, 0.08, t, frameM); seg(cx, cz, horiz, len, H, 0.02, t + 0.02, trimGlow, false);
    const n = Math.max(1, Math.round(len / 1.6));
    for (let i = 0; i <= n; i++) { const p = -len / 2 + i * len / n; seg(horiz ? cx + p : cx, horiz ? cz : cz + p, horiz, 0.07, 0.32, H - 0.4, 0.09, frameM); }
    return;
  }
  seg(cx, cz, horiz, len, 0, 0.1, t + 0.02, baseB); seg(cx, cz, horiz, len, 0.1, 0.52, t, wallLower);
  seg(cx, cz, horiz, len, 0.62, WALL_H - 0.62, t, wallUpper); seg(cx, cz, horiz, len, WALL_H, 0.05, t + 0.04, capM);
  seg(cx, cz, horiz, len, WALL_H + 0.05, 0.018, t - 0.06, trimGlow, false);
}
function hWall(z, x0, x1, gaps = [], kind) { let s0 = x0; gaps.sort((a, b) => a[0] - b[0]); for (const [a, b] of gaps) { if (a > s0) wallRun(s0, z, a, z, kind); s0 = b; } if (x1 > s0) wallRun(s0, z, x1, z, kind); }
function vWall(x, z0, z1, gaps = [], kind) { let s0 = z0; gaps.sort((a, b) => a[0] - b[0]); for (const [a, b] of gaps) { if (a > s0) wallRun(x, s0, x, a, kind); s0 = b; } if (z1 > s0) wallRun(x, s0, x, z1, kind); }
function perimeter(kind = 'window') { hWall(0, 0, W, [], kind); hWall(D, 0, W, [], 'low'); vWall(0, 0, D, [], kind); vWall(W, 0, D, [[16.2, 21.8]], 'low'); }
function elevatorLobby() {
  [17.5, 20.5].forEach(z => { box(0.1, 2.1, 1.5, mat('#bcc8d3', { metalness: 0.9, roughness: 0.18 }), 39.9, 0, z); plane(0.28, 0.14, glow('#FFB547', 2.4), 39.84, 2.3, z, { ry: -Math.PI / 2 }); plane(0.08, 0.08, glow('#00A9F4', 3), 39.84, 1.1, z + 0.95, { ry: -Math.PI / 2 }); });
  blockRect(39.6, 16.2, 40, 21.8);
  decal(`${FLOOR_LABEL[Z.id]} · 电梯厅`, 37.5, 15.6, 2.4, 0.55, { sub: 'ELEVATOR', to: 's' });
  Z.portals.push({ kind: 'elevator', x: ELEV.x, z: ELEV.z }); Z.spawn = { x: 38, z: 18.6 };
}
function tree(x, z, s = 1, kind = 0) {
  const trunk = cyl(0.12 * s, 0.18 * s, 1.6 * s, mat('#6b4a2e', { roughness: 0.9 }), x, 0, z, { block: true });
  const cols = [['#3f8f5a', '#2f7d4c'], ['#7aa83a', '#5c8a2a'], ['#c97a3a', '#a85a22'], ['#4f9f6f', '#3a7f55']][kind % 4];
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry((0.9 - i * 0.18) * s, 10, 8), mat(cols[i % 2], { roughness: 0.85, flatShading: true })); b.position.set(x + (i ? (Math.random() - 0.5) * 0.5 * s : 0), (1.9 + i * 0.6) * s, z + (i ? (Math.random() - 0.5) * 0.5 * s : 0)); add(b); }
  return trunk;
}
function lampPost(x, z, h = 3.2) {
  cyl(0.05, 0.07, h, mat('#2b3d52', { metalness: 0.7 }), x, 0, z, { seg: 8 });
  const g = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), glow('#ffd9a0', 2.6)); g.position.set(x, h + 0.1, z); Z.group.add(g);
  lightPool(x, z, 3.2, '#ffd9a0', 0.1); addLamp(x, z, '#ffd9a0', 9);
}
function bench(x, z, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; Z.group.add(g);
  add(new THREE.Mesh(rbox(1.6, 0.06, 0.45, 0.02), mat('#a87a4a', { roughness: 0.7 })), { parent: g }).position.set(0, 0.45, 0);
  add(new THREE.Mesh(rbox(1.6, 0.4, 0.06, 0.02), mat('#a87a4a', { roughness: 0.7 })), { parent: g }).position.set(0, 0.7, -0.2);
  [-0.65, 0.65].forEach(dx => add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.4), mat('#2b3d52', { metalness: 0.6 })), { parent: g, cast: false }).position.set(dx, 0.22, 0));
  blockRect(x - 0.8, z - 0.25, x + 0.8, z + 0.25);
}
function ball(x, y, z, r, color, kind = 'bounce') { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(color, { roughness: 0.6 })); m.position.set(x, y, z); m.castShadow = true; Z.group.add(m); const b = { m, x, y, z, t: Math.random() * 10, kind, active: false, from: [x, z], to: [x, z] }; Z.balls.push(b); return b; }
function sportNPC(id, look, x, z, lx, lz) { look._id = id; const p = makeChar(look); attachModel(p, id); p.position.set(x, 0, z); face(p, lx, lz); p.userData.baseState = 'idle'; Z.npcs.push(p); NPC[id] = p; blockRect(x - 0.2, z - 0.2, x + 0.2, z + 0.2, 0.3); return p; }

/* =========================================================
   1F · 大厅与食堂
   ========================================================= */
(() => {
  beginZone('f1', { name: '1F · 大厅', floor: 1, view: 66 });
  slab(40, 26, 20, 13);
  floorPlane(0, 0, 40, 26, mat('#ffffff', { map: T.tile(10, 6.5, '#aab5bf', '#8f9ca8'), roughness: 0.35, envMapIntensity: 0.5 }));
  floorPlane(22, 0, 40, 12, mat('#ffffff', { map: T.wood(6, 4), roughness: 0.5 }), 0.005);
  perimeter('window');
  hWall(12, 22, 40, [[26, 29]]); vWall(22, 0, 12, [[4, 8]], 'glass');
  /* reception */
  box(4, 1.05, 0.9, mat('#1d2a38', { roughness: 0.4 }), 8, 0, 4, { block: true, round: 0.04 }); box(4.2, 0.05, 1.0, mat('#f3f1ec'), 8, 1.05, 4);
  const sign = plane(5, 0.9, new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(640, 120, (g, w, h) => { g.fillStyle = '#0A2436'; g.fillRect(0, 0, w, h); g.fillStyle = '#00A9F4'; g.fillRect(0, 0, 10, h); g.fillStyle = '#EAF4FB'; g.font = `800 48px ${CN_FONT}`; g.fillText('物理楼 · PHYSICS BUILDING', 30, 78); }) }), 8, 2.0, 0.13); sign.material.color.setScalar(1.3);
  sportNPC('guard', { shirt: '#2f3e52', hair: '#333', hairStyle: 'short', label: '保安', badge: true }, 8, 3.2, 8, 8);
  NPC.guard.userData.seated = true; NPC.guard.userData.state = 'sit'; NPC.guard.userData.baseState = 'sit';
  /* turnstiles */
  [14, 15.2, 16.4].forEach(x => { box(0.3, 1.0, 1.2, mat('#c9d4de', { metalness: 0.7, roughness: 0.3 }), x, 0, 13, { block: true, round: 0.03 }); plane(0.1, 0.1, glow('#3DDC97', 3), x, 1.05, 13.62); });
  /* notice board + sofas */
  whiteboard(0.13, 1.25, 8, Math.PI / 2, 3, 1.1, boardTex(640, 240, (g) => { g.fillStyle = '#0A2436'; g.font = `800 30px ${CN_FONT}`; g.fillText('本周学术活动', 20, 44); ['周二 14:00 · 暗物质直接探测（报告厅）', '周四 10:00 · 缪子 EDM 进展', '周六 10:00 · 校园开放日科普讲座'].forEach((t, i) => { g.fillStyle = ['#2251FF', '#c0392b', '#0f8b8d'][i]; g.fillRect(20, 70 + i * 50, 600, 38); g.fillStyle = '#fff'; g.font = `600 22px ${CN_FONT}`; g.fillText(t, 30, 97 + i * 50); }); }));
  [[4, 17], [4, 21]].forEach(([x, z]) => { box(2.2, 0.42, 0.9, mat('#2d4d72', { roughness: 0.85 }), x, 0, z, { block: true, round: 0.08 }); box(2.2, 0.5, 0.25, mat('#2d4d72'), x, 0.4, z - 0.35, { round: 0.08 }); });
  plant(1.2, 24.5, 1.3); plant(12, 24.5, 1.1); plant(21, 0.9, 1.2);
  /* canteen */
  box(1.0, 0.95, 9, mat('#e8edf2', { roughness: 0.3 }), 23.2, 0, 6, { block: true, round: 0.02 }); box(1.0, 0.04, 9, mat('#2b3d52', { metalness: 0.3 }), 23.2, 0.95, 6);
  [2.5, 4.5, 6.5, 8.5].forEach((z, i) => { box(0.5, 0.18, 0.4, mat(['#c0392b', '#f2c574', '#3f8f5a', '#e8e8e8'][i], { roughness: 0.5 }), 23.2, 0.99, z, { round: 0.03 }); });
  plane(0.8, 3.2, glow('#ffd9a0', 1.3, 0.3), 23.2, 1.9, 6, { rx: -Math.PI / 2 });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { const x = 28 + c * 6, z = 4.6 + r * 2.7; box(2.4, 0.06, 1.1, mat('#f3f1ec'), x, 0.74, z, { block: true, round: 0.02 }); box(0.12, 0.74, 0.12, mat('#9aa7b3', { metalness: 0.5 }), x, 0, z); [-0.8, 0, 0.8].forEach(dx => { chair(x + dx, z - 0.9, 0, '#c86b3c'); chair(x + dx, z + 0.9, Math.PI, '#c86b3c'); }); }
  decal('食堂 · CANTEEN', 31, 11.2, 3.2, 0.6, { sub: '07:00 – 20:00 · 世界美食档口 WORLD KITCHENS' });
  /* v11.2: six world-cuisine stalls along the north wall; their signs are redrawn each day (canteenSigns) */
  CANTEEN.stalls = [];
  for (let k = 0; k < 6; k++) {
    const x = 25.6 + k * 2.4;
    box(2.2, 0.95, 0.8, mat('#d9dee3', { roughness: 0.25, metalness: 0.6 }), x, 0, 1.2, { block: true, round: 0.02 });
    box(2.2, 0.04, 0.9, mat('#2b2f33', { roughness: 0.3 }), x, 0.95, 1.2, { cast: false });
    [-0.6, 0, 0.6].forEach((dx, j) => box(0.45, 0.12, 0.35, mat(['#c8a27a', '#e9e2d4', '#7aa83a'][(j + k) % 3], { roughness: 0.5 }), x + dx, 0.99, 1.15, { cast: false, round: 0.03 }));
    box(2.2, 2.3, 0.1, mat('#3a3f45', { roughness: 0.6 }), x, 0, 0.25, { cast: false });
    const sign = plane(2.0, 0.95, new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(400, 190, () => {}) }), x, 1.9, 0.32);
    sign.material.color.setScalar(1.15);
    CANTEEN.stalls.push(sign);
  }
  plane(14.4, 0.6, glow('#ffd9a0', 1.1, 0.25), 31.6, 2.55, 1.2, { rx: -Math.PI / 2 });
  sportNPC('cook', { shirt: '#ffffff', hair: '#222', hairStyle: 'bald', label: '食堂师傅', skin: '#e9b58a' }, 22.4, 6, 24, 6);
  [['#2251FF', 'pony'], ['#7a5cff', 'short'], ['#3DDC97', 'bob']].forEach(([c, h], i) => { const p = makeChar({ shirt: c, hairStyle: h }); p.position.set(28 + (i % 2) * 6, 0, 4.6 + Math.floor(i / 2) * 2.7 - 0.9); p.rotation.y = 0; p.userData.seated = true; p.userData.state = 'sit'; p.userData.baseState = 'sit'; Z.npcs.push(p); });
  lightPool(31, 6, 6, '#ffd9a0', 0.12); lightPool(8, 8, 6, '#cfe6ff', 0.1); addLamp(31, 6, '#ffd9a0'); addLamp(8, 10, '#cfe6ff');
  /* main door to campus */
  [18, 22].forEach(x => box(0.2, 2.6, 0.3, frameM, x, 0, 26));
  seg(20, 25.9, true, 4, 2.3, 0.3, 0.3, frameM); plane(4, 0.1, thresholdM, 20, 0.012, 25.6, { rx: -Math.PI / 2 });
  decal('出口 · 校园', 20, 24.3, 2.4, 0.55, { sub: 'EXIT · CAMPUS', accent: '#3DDC97', to: 's' });
  Z.portals.push({ kind: 'door', x: 20, z: 25.2, to: 'campus', spawn: { x: 30, z: 31.2 }, label: '走出物理楼' });
  elevatorLobby();
  Z.rooms = { lobby: { x0: 0, z0: 0, x1: 22, z1: 26, name: '大厅' }, canteen: { x0: 22, z0: 0, x1: 40, z1: 12, name: '食堂' }, lobby2: { x0: 22, z0: 12, x1: 40, z1: 26, name: '大厅' } };
})();

/* =========================================================
   2F · 教学楼层
   ========================================================= */
(() => {
  beginZone('f2', { name: '2F · 教学楼层', floor: 2, view: 66 });
  slab(40, 26, 20, 13);
  floorPlane(0, 0, 40, 26, mat('#ffffff', { map: T.concrete(10, 6.5), roughness: 0.32, envMapIntensity: 0.9 }));
  floorPlane(0, 0, 36, 11, mat('#ffffff', { map: T.carpet(9, 3, '#4a5a6b', '#41505f'), roughness: 0.95, envMapIntensity: 0.25 }), 0.004);
  floorPlane(0, 15, 36, 26, mat('#ffffff', { map: T.carpet(9, 3, '#5b4a6e', '#524265'), roughness: 0.95, envMapIntensity: 0.25 }), 0.004);
  perimeter('window');
  hWall(11, 0, 36, [[3, 5], [12, 14], [21, 23], [30, 32]]); hWall(15, 0, 36, [[7, 9], [25, 27]]);
  vWall(9, 0, 11); vWall(18, 0, 11); vWall(27, 0, 11); vWall(36, 0, 11); vWall(18, 15, 26); vWall(36, 15, 26);
  const roomNames = [['201', 0], ['202', 9], ['203', 18], ['204', 27]];
  roomNames.forEach(([n, x0]) => {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const x = x0 + 1.6 + c * 2.6, z = 2.6 + r * 2.4; box(1.6, 0.05, 0.6, mat('#e8dcc4', { roughness: 0.5 }), x, 0.72, z, { block: true, round: 0.02 }); box(0.08, 0.72, 0.5, mat('#9aa7b3'), x - 0.7, 0, z); box(0.08, 0.72, 0.5, mat('#9aa7b3'), x + 0.7, 0, z); chair(x, z + 0.65, Math.PI, '#2b4a72'); }
    const bd = whiteboard(x0 + 4.5, 1.3, 0.14, 0, 5, 1.0, boardTex(640, 128, (g) => { g.fillStyle = '#0A2436'; g.font = `700 36px ${CN_FONT}`; g.fillText(['∇·E = ρ/ε₀', 'F = dp/dt', 'E = γmc²', 'ψ(x,t)'][+n[2] - 1], 24, 80); }));
    decal(`教室 ${n}`, x0 + 4.5, 11.9, 1.8, 0.5, { sub: 'CLASSROOM', to: 'n' });
  });
  for (let k = 0; k < 2; k++) { const x0 = k * 18; box(5.5, 0.06, 1.8, mat('#f3f1ec'), x0 + 9, 0.74, 21, { block: true, round: 0.03 }); box(0.4, 0.74, 1.4, mat('#9aa7b3'), x0 + 9, 0, 21); for (let i = 0; i < 5; i++) { chair(x0 + 6.8 + i * 1.1, 19.9, 0, '#3a2d4a'); chair(x0 + 6.8 + i * 1.1, 22.1, Math.PI, '#3a2d4a'); } decal(k ? '讨论室 206' : '讨论室 205', x0 + 9, 14.4, 2.4, 0.5, { sub: 'SEMINAR' }); }
  box(0.9, 1.9, 0.7, mat('#1d2a38', { roughness: 0.35, metalness: 0.4 }), 37.5, 0, 12.5, { block: true, round: 0.04 });
  plane(0.72, 1.5, new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(128, 256, (g) => { g.fillStyle = '#0d1d2b'; g.fillRect(0, 0, 128, 256); const c = ['#e74c3c', '#2251FF', '#3DDC97', '#f2c574']; for (let r = 0; r < 6; r++) for (let i = 0; i < 4; i++) { g.fillStyle = c[(r + i) % 4]; g.fillRect(10 + i * 28, 14 + r * 34, 18, 26); } }) }), 37.5, 1.05, 12.86);
  [[2, 13], [20, 13], [34, 13]].forEach(([x, z]) => lightPool(x, z, 2.5, '#cfe6ff', 0.09));
  [['#5a6b7c', 'short'], ['#e67e22', 'pony'], ['#2ecc71', 'bob'], ['#7a5cff', 'spiky']].forEach(([c, h], i) => { const p = makeChar({ shirt: c, hairStyle: h }); p.position.set(4 + i * 9, 0, 12.4 + (i % 2)); face(p, 20, 13); Z.npcs.push(p); });
  addLamp(10, 13, '#cfe6ff'); addLamp(28, 13, '#cfe6ff');
  elevatorLobby();
  Z.rooms = { c1: { x0: 0, z0: 0, x1: 9, z1: 11, name: '教室 201' }, c2: { x0: 9, z0: 0, x1: 18, z1: 11, name: '教室 202' }, c3: { x0: 18, z0: 0, x1: 27, z1: 11, name: '教室 203' }, c4: { x0: 27, z0: 0, x1: 36, z1: 11, name: '教室 204' }, s1: { x0: 0, z0: 15, x1: 18, z1: 26, name: '讨论室 205' }, s2: { x0: 18, z0: 15, x1: 36, z1: 26, name: '讨论室 206' }, lobby: { x0: 36, z0: 11, x1: 40, z1: 26, name: '电梯厅' } };
})();

/* =========================================================
   3F · 图书馆
   ========================================================= */
(() => {
  beginZone('f3', { name: '3F · 图书馆', floor: 3, view: 66 });
  slab(40, 26, 20, 13);
  floorPlane(0, 0, 40, 26, mat('#ffffff', { map: T.carpet(10, 6.5, '#3b4c5e', '#334354'), roughness: 0.95, envMapIntensity: 0.25 }));
  floorPlane(0, 12, 36, 26, mat('#ffffff', { map: T.wood(7, 3), roughness: 0.5 }), 0.004);
  perimeter('window'); vWall(36, 0, 15, [], 'glass');
  /* stacks */
  for (let r = 0; r < 4; r++) { const z = 2.2 + r * 2.5; shelf(9.5, z, 15); shelf(26.5, z, 15); }
  decal('书库 · STACKS', 18, 10.9, 2.6, 0.5, { sub: 'QC 1–999 · 物理' });
  /* librarian */
  box(3.2, 1.0, 0.9, mat('#1d2a38', { roughness: 0.4 }), 34, 0, 13.2, { block: true, round: 0.04 }); box(3.4, 0.05, 1.0, mat('#f3f1ec'), 34, 1.0, 13.2); monitor(34.6, 12.9, 0, 'paper');
  sportNPC('librarian', { shirt: '#5c8a2a', hair: '#6b4a2a', hairStyle: 'bun', glasses: true, label: '馆员' }, 34, 12.2, 34, 16);
  NPC.librarian.userData.seated = true; NPC.librarian.userData.state = 'type'; NPC.librarian.userData.baseState = 'type';
  /* reading tables with lamps */
  for (let i = 0; i < 4; i++) { const x = 5 + i * 8, z = 19.5; box(3.6, 0.06, 1.6, mat('#7a5638', { roughness: 0.45 }), x, 0.74, z, { block: true, round: 0.02 }); [-1.3, 1.3].forEach(dx => box(0.1, 0.74, 1.4, mat('#4a3522'), x + dx, 0, z)); [-1.1, 0, 1.1].forEach(dx => { chair(x + dx, z - 1.2, 0, '#2b4a72'); chair(x + dx, z + 1.2, Math.PI, '#2b4a72'); });
    [-1, 1].forEach(dx => { cyl(0.03, 0.03, 0.4, mat('#2b3d52', { metalness: 0.7 }), x + dx, 0.77, z, { seg: 8 }); const sh = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.14, 12, 1, true), mat('#2f7d4c', { side: THREE.DoubleSide })); sh.position.set(x + dx, 1.17, z); Z.group.add(sh); const gl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glow('#ffe2a8', 3)); gl.position.set(x + dx, 1.12, z); Z.group.add(gl); });
    lightPool(x, z, 2.6, '#ffe2a8', 0.14);
    if (i < 3) { const p = makeChar({ shirt: ['#2251FF', '#c0392b', '#f2c574'][i], hairStyle: ['pony', 'short', 'bob'][i], glasses: i === 1 }); p.position.set(x + (i - 1) * 1.1, 0, z + 1.2); p.rotation.y = Math.PI; p.userData.seated = true; p.userData.state = 'read'; p.userData.baseState = 'read'; Z.npcs.push(p); const bk = box(0.3, 0.03, 0.22, mat(['#e8e8e8', '#f2c574', '#7a5cff'][i]), x + (i - 1) * 1.1, 0.77, z + 0.45); bk.rotation.y = 0.2; }
  }
  decal('阅览区 · READING ROOM', 18, 15.6, 3.6, 0.55, { sub: '请保持安静 · QUIET' });
  /* periodicals + study pods */
  box(4, 1.3, 0.4, mat('#d8cdbd'), 4, 0, 13.2, { block: true, round: 0.02 }); for (let i = 0; i < 9; i++) box(0.3, 0.42, 0.04, mat(['#2251FF', '#c0392b', '#0f8b8d'][i % 3]), 2.3 + i * 0.42, 0.75, 13.42, { cast: false });
  plant(1.0, 24.8, 1.2); plant(36.5, 24.8, 1.1); plant(21, 13, 0.9);
  box(0.6, 0.9, 0.6, mat('#1d2a38'), 38.5, 0, 2, { block: true, round: 0.03 }); monitor(38.5, 1.7, 0, 'paper'); decal('检索', 38.5, 3.2, 1.2, 0.5, { sub: 'OPAC' });
  addLamp(10, 19, '#ffe2a8'); addLamp(26, 19, '#ffe2a8'); addLamp(18, 6, '#cfe6ff');
  elevatorLobby();
  Z.rooms = { stacks: { x0: 0, z0: 0, x1: 36, z1: 12, name: '书库' }, reading: { x0: 0, z0: 12, x1: 36, z1: 26, name: '阅览区' }, lobby: { x0: 36, z0: 0, x1: 40, z1: 26, name: '电梯厅' } };
})();

/* =========================================================
   4F · 网球馆
   ========================================================= */
(() => {
  beginZone('f4', { name: '4F · 网球馆', floor: 4, view: 66 });
  slab(40, 26, 20, 13);
  const courtTex = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#2b6f9e'; g.fillRect(0, 0, w, h); g.fillStyle = '#3d8f5a'; const L = 120, R = w - 120, T2 = 90, B = h - 90; g.fillRect(L, T2, R - L, B - T2);
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(L, T2, R - L, B - T2);
    const sl = (B - T2) * 1.37 / 10.97 / 2; g.beginPath(); g.moveTo(L, T2 + sl); g.lineTo(R, T2 + sl); g.moveTo(L, B - sl); g.lineTo(R, B - sl); const svc = (R - L) * 6.4 / 23.77; g.moveTo(w / 2 - svc, T2 + sl); g.lineTo(w / 2 - svc, B - sl); g.moveTo(w / 2 + svc, T2 + sl); g.lineTo(w / 2 + svc, B - sl); g.moveTo(w / 2 - svc, h / 2); g.lineTo(w / 2 + svc, h / 2); g.moveTo(w / 2, T2); g.lineTo(w / 2, B); g.stroke();
  });
  floorPlane(0, 0, 40, 26, mat('#ffffff', { map: T.concrete(10, 6.5), roughness: 0.35 }));
  const court = floorPlane(4, 6, 32, 20, mat('#ffffff', { map: courtTex, roughness: 0.6 }), 0.006);
  perimeter('window');
  /* net */
  const netTex = canvasTex(128, 32, (g) => { g.clearRect(0, 0, 128, 32); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1; for (let i = 0; i < 128; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 32); g.stroke(); } for (let j = 0; j < 32; j += 4) { g.beginPath(); g.moveTo(0, j); g.lineTo(128, j); g.stroke(); } g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 3); }); netTex.wrapS = THREE.RepeatWrapping; netTex.repeat.set(12, 1);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(11.6, 0.95), new THREE.MeshStandardMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.2 })); net.position.set(18, 0.5, 13); net.rotation.y = Math.PI / 2; Z.group.add(net);
  [7.1, 18.9].forEach(z => cyl(0.05, 0.05, 1.07, mat('#1b2430', { metalness: 0.6 }), 18, 0, z, { seg: 8 }));
  blockRect(17.8, 7, 18.2, 19, 0.15);
  /* benches, machine, scoreboard */
  bench(10, 3.2, 0); bench(26, 3.2, 0); bench(10, 22.8, Math.PI); bench(26, 22.8, Math.PI);
  box(0.8, 0.9, 0.8, mat('#2f3e52', { metalness: 0.5 }), 34.5, 0, 4, { block: true, round: 0.05 }); cyl(0.2, 0.2, 0.3, mat('#1b2430'), 34.5, 0.9, 4);
  for (let i = 0; i < 14; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), mat('#d8ff3a', { roughness: 0.8 })); b.position.set(33.6 + (i % 5) * 0.15, 0.07 + Math.floor(i / 5) * 0.12, 5.2 + Math.floor(i / 5) * 0.14); Z.group.add(b); }
  const sb = plane(3.6, 1.0, new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(512, 140, (g, w, h) => { g.fillStyle = '#0a1a28'; g.fillRect(0, 0, w, h); g.fillStyle = '#3DDC97'; g.font = `800 72px ${CN_FONT}`; g.fillText('3 : 2', 180, 92); g.fillStyle = '#EAF4FB'; g.font = `600 26px ${CN_FONT}`; g.fillText('物理楼网球馆', 20, 40); }) }), 20, 2.0, 0.14); sb.material.color.setScalar(1.5);
  sportNPC('coach', CAST.coach, 26, 13, 10, 13);
  const bl = ball(12, 1.0, 13, 0.07, '#d8ff3a', 'tennis'); bl.from = [11, 12.2]; bl.to = [25, 13.8];
  box(0.5, 0.05, 0.02, mat('#c0392b'), 26.2, 1.1, 13.3); // racket on bench
  decal('网球馆 · TENNIS', 18, 23.6, 3, 0.55, { sub: '08:00 – 22:00 · 请穿运动鞋' });
  lightPool(18, 13, 12, '#ffffff', 0.08); addLamp(12, 13, '#ffffff', 14); addLamp(24, 13, '#ffffff', 14);
  elevatorLobby();
  Z.rooms = { court: { x0: 2, z0: 4, x1: 34, z1: 22, name: '网球场' }, side: { x0: 0, z0: 0, x1: 40, z1: 26, name: '看台' } };
})();

/* =========================================================
   6F · 植物园
   ========================================================= */
(() => {
  beginZone('f6', { name: '6F · 植物园', floor: 6, view: 66 });
  slab(40, 26, 20, 13, '#2a3b2e');
  const grass = tiled((g, w, h) => { g.fillStyle = '#3f7a34'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${30 + Math.random() * 60},${95 + Math.random() * 60},${25 + Math.random() * 30},.6)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 5); } }, 10, 6.5);
  floorPlane(0, 0, 40, 26, mat('#ffffff', { map: grass, roughness: 1, envMapIntensity: 0.2 }));
  const stone = tiled((g, w, h) => { g.fillStyle = '#9aa39a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6f7a70'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); }, 1, 1);
  const path = (x0, z0, x1, z1) => { const t = stone.clone(); t.needsUpdate = true; t.repeat.set((x1 - x0) / 1.2, (z1 - z0) / 1.2); floorPlane(x0, z0, x1, z1, mat('#ffffff', { map: t, roughness: 0.8 }), 0.006); };
  path(1, 11.5, 36, 14.5); path(18.5, 1, 21.5, 25); path(36, 15, 40, 26);
  perimeter('glass');
  /* glasshouse ridge */
  for (let i = 0; i <= 6; i++) { const x = 2 + i * 6; box(0.08, 0.08, 26, frameM, x, 3.2, 13, { cast: false }); }
  box(40, 0.08, 0.08, frameM, 20, 3.3, 13, { cast: false }); box(40, 0.04, 26, new THREE.MeshStandardMaterial({ color: '#a6e2ff', transparent: true, opacity: 0.04, roughness: 0.05, depthWrite: false }), 20, 3.34, 13, { cast: false });
  /* v11.2: four climate zones, one per corner bed (assets/js/garden.js): rainforest NW, desert NE, temperate forest SW, alpine SE.
     The alpine bed is a low rock garden round the pond (an alpine tarn). */
  const ZONES6 = [
    { kind: 'rainforest', b: [1.5, 1.5, 17, 10.5], h: 0.3, soil: '#3a2c1c', zh: '热带雨林', en: 'TROPICAL RAINFOREST', accent: '#3DDC97' },
    { kind: 'desert', b: [23, 1.5, 38.5, 10.5], h: 0.3, soil: '#b8915e', zh: '沙漠', en: 'DESERT', accent: '#FFB547' },
    { kind: 'temperate', b: [1.5, 15.5, 17, 24.5], h: 0.3, soil: '#4a3a26', zh: '温带森林', en: 'TEMPERATE FOREST', accent: '#c86b3c' },
    { kind: 'alpine', b: [23, 15.5, 34.5, 24.5], h: 0.12, soil: '#77766f', zh: '高山', en: 'ALPINE', accent: '#9fd0ff' },
  ];
  ZONES6.forEach((zn, bi) => {
    const [x0, z0, x1, z1] = zn.b;
    box(x1 - x0 + 0.4, zn.h, z1 - z0 + 0.4, mat(zn.soil, { roughness: 0.95 }), (x0 + x1) / 2, 0, (z0 + z1) / 2, { cast: false });
    if (window.GardenKit) Z.group.add(GardenKit.bed(THREE, { kind: zn.kind, x0, z0, x1, z1, y: zn.h, seed: 11 + bi * 97, quality: QUALITY, avoid: zn.kind === 'alpine' ? [30.5, 19.5, 4.0] : null }));
    blockRect(x0, z0, x1, z1, 0.1);
    decal(zn.zh + '区', (x0 + x1) / 2, z0 < 12 ? z1 + 0.65 : z0 - 0.65, 2.6, 0.5, { sub: zn.en, accent: zn.accent });
  });
  /* pond */
  const pond = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), new THREE.MeshStandardMaterial({ color: '#2a7fa8', roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.85, envMapIntensity: 1.4 })); pond.rotation.x = -Math.PI / 2; pond.position.set(30.5, 0.14, 19.5); Z.group.add(pond);
  const rim = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.6, 32), mat('#8a8f86', { roughness: 0.9 })); rim.rotation.x = -Math.PI / 2; rim.position.set(30.5, 0.145, 19.5); Z.group.add(rim);
  for (let i = 0; i < 7; i++) { const a = i * 0.9, r = 0.8 + (i % 3) * 0.7; const lp = new THREE.Mesh(new THREE.CircleGeometry(0.25, 10), mat('#3f8f5a')); lp.rotation.x = -Math.PI / 2; lp.position.set(30.5 + Math.cos(a) * r, 0.15, 19.5 + Math.sin(a) * r); Z.group.add(lp); if (i % 2) { const fl = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), mat('#ff8ad8', { emissive: '#ff8ad8', emissiveIntensity: 0.3 })); fl.position.set(lp.position.x, 0.22, lp.position.z); Z.group.add(fl); } }
  blockRect(27, 16, 34, 23, 0.1);
  Z.anims.push((t) => { pond.material.opacity = 0.8 + Math.sin(t * 1.3) * 0.05; });
  /* pergola + benches */
  [[12, 11.5], [12, 14.5], [26, 11.5], [26, 14.5]].forEach(([x, z]) => cyl(0.08, 0.08, 2.6, mat('#7a5638'), x, 0, z, { seg: 8 }));
  [11.5, 14.5].forEach(z => box(15, 0.1, 0.12, mat('#7a5638'), 19, 2.6, z, { cast: false })); for (let i = 0; i < 12; i++) box(0.08, 0.06, 3.4, mat('#7a5638'), 12.6 + i * 1.2, 2.7, 13, { cast: false });
  for (let i = 0; i < 16; i++) { const v = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 6), mat('#4f9f6f', { flatShading: true })); v.position.set(12 + Math.random() * 14, 2.5 + Math.random() * 0.4, 11.4 + Math.random() * 3.2); Z.group.add(v); }
  bench(8, 10.9, 0); bench(30, 10.9, 0); bench(8, 15.1, Math.PI); bench(24, 15.1, Math.PI);
  sportNPC('oldprof', { shirt: '#8a9bb0', coat: '#5a6b7c', hair: '#cfcfcf', hairStyle: 'bald', glasses: true, label: '退休的老教授', skin: '#efc6a2' }, 30, 10.3, 30, 14);
  NPC.oldprof.userData.seated = true; NPC.oldprof.userData.state = 'sit'; NPC.oldprof.userData.baseState = 'sit';
  const p2 = makeChar({ shirt: '#ff8ad8', hairStyle: 'bob' }); p2.position.set(8, 0, 15.7); p2.rotation.y = 0; p2.userData.seated = true; p2.userData.state = 'read'; p2.userData.baseState = 'read'; Z.npcs.push(p2);
  decal('植物园 · 休憩区', 20, 13.0, 3.4, 0.6, { sub: 'BOTANICAL GARDEN · 6F', bg: 'rgba(30,70,40,.85)', accent: '#7aa83a' });
  lightPool(19, 13, 8, '#ffe9c8', 0.08); addLamp(12, 13, '#ffe9c8'); addLamp(27, 13, '#ffe9c8');
  elevatorLobby();
  Z.rooms = { g1: { x0: 0, z0: 0, x1: 40, z1: 26, name: '植物园' }, lobby: { x0: 36, z0: 15, x1: 40, z1: 26, name: '电梯厅' } };
})();

/* =========================================================
   天台 · 咖啡馆
   ========================================================= */
(() => {
  beginZone('roof', { name: '天台 · 咖啡馆', floor: 7, view: 66, outdoorLite: true });
  slab(40, 26, 20, 13, '#2b3542');
  floorPlane(0, 0, 40, 26, mat('#ffffff', { map: T.tile(10, 6.5, '#8a939e', '#767f8a'), roughness: 0.5 }));
  floorPlane(4, 2, 30, 24, mat('#ffffff', { map: T.wood(6, 5), roughness: 0.55 }), 0.005);
  /* glass railing all round */
  hWall(0, 0, 40, [], 'low'); hWall(26, 0, 40, [], 'low'); vWall(0, 0, 26, [], 'low'); vWall(40, 0, 26, [], 'low');
  for (let i = 0; i <= 20; i++) { box(0.05, 1.1, 0.05, frameM, i * 2, 0.42, 0.1); box(0.05, 1.1, 0.05, frameM, i * 2, 0.42, 25.9); }
  for (let i = 0; i <= 13; i++) { box(0.05, 1.1, 0.05, frameM, 0.1, 0.42, i * 2); box(0.05, 1.1, 0.05, frameM, 39.9, 0.42, i * 2); }
  box(40, 0.7, 0.03, glassM, 20, 0.75, 0.1, { cast: false }); box(40, 0.7, 0.03, glassM, 20, 0.75, 25.9, { cast: false }); box(0.03, 0.7, 26, glassM, 0.1, 0.75, 13, { cast: false }); box(0.03, 0.7, 26, glassM, 39.9, 0.75, 13, { cast: false });
  /* café kiosk */
  box(7, 2.6, 4, mat('#1d2a38', { roughness: 0.5 }), 9, 0, 4, { block: true, round: 0.05 });
  box(7.4, 0.1, 4.4, mat('#2b3d52'), 9, 2.6, 4, { cast: false });
  box(6, 1.0, 0.8, mat('#7a5638', { roughness: 0.5 }), 9, 0, 6.6, { block: true, round: 0.03 }); box(6.2, 0.05, 0.9, mat('#f3f1ec'), 9, 1.0, 6.6);
  box(0.5, 0.55, 0.45, mat('#1b2430', { roughness: 0.3, metalness: 0.6 }), 7, 1.04, 6.5, { round: 0.04 }); plane(0.14, 0.06, glow('#00A9F4', 3), 7, 1.46, 6.73);
  [0, 1, 2, 3].forEach(i => mug(9.5 + i * 0.3, 1.05, 6.4, ['#ffffff', '#2251FF', '#FFB547', '#c0392b'][i]));
  const menu = plane(5, 1.1, new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(640, 140, (g, w, h) => { g.fillStyle = '#111a24'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffc857'; g.font = `800 40px ${CN_FONT}`; g.fillText('天台咖啡 · ROOFTOP', 20, 52); g.fillStyle = '#EAF4FB'; g.font = `500 26px ${CN_FONT}`; g.fillText('手冲 ¥18 · 拿铁 ¥22 · 三明治 ¥25 · 看城市免费', 20, 108); }) }), 9, 1.9, 6.05); menu.material.color.setScalar(1.4);
  sportNPC('barista', { shirt: '#3a2d4a', coat: '#c86b3c', hair: '#2a1a14', hairStyle: 'bun', label: '咖啡师', badge: true }, 9, 5.6, 9, 9);
  /* tables with umbrellas */
  const spots = [[8, 13], [14, 11], [20, 14], [26, 11], [14, 18], [21, 20], [27, 18], [8, 20]];
  spots.forEach(([x, z], i) => {
    cyl(0.6, 0.6, 0.05, mat('#f3f1ec', { roughness: 0.3 }), x, 0.72, z, { block: true }); cyl(0.05, 0.08, 0.72, mat('#2b3d52', { metalness: 0.7 }), x, 0, z, { seg: 8 });
    cyl(0.03, 0.03, 2.4, mat('#2b3d52', { metalness: 0.7 }), x, 0.77, z, { seg: 6 });
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.5, 10, 1, true), mat(['#ffc857', '#2251FF', '#ff5a6e', '#ffffff'][i % 4], { side: THREE.DoubleSide, roughness: 0.8 })); um.position.set(x, 3.05, z); add(um);
    [0, 1, 2].forEach(k => { const a = k / 3 * Math.PI * 2 + i; chair(x + Math.cos(a) * 1.0, z + Math.sin(a) * 1.0, -a - Math.PI / 2, '#2b3d52'); });
    if (i % 3 === 1) mug(x + 0.2, 0.77, z - 0.1, '#ffffff');
  });
  [['#2251FF', 'pony'], ['#e67e22', 'short'], ['#3DDC97', 'bob']].forEach(([c, h], i) => { const [x, z] = spots[i * 2 + 1]; const a = i; const p = makeChar({ shirt: c, hairStyle: h }); p.position.set(x + Math.cos(a) * 1.0, 0, z + Math.sin(a) * 1.0); p.rotation.y = -a - Math.PI / 2 + Math.PI; p.userData.seated = true; p.userData.state = 'sit'; p.userData.baseState = 'sit'; Z.npcs.push(p); });
  /* planters + string lights */
  [[3, 10], [3, 16], [33, 6], [33, 20], [20, 24.3]].forEach(([x, z]) => { box(1.4, 0.5, 0.6, mat('#2f3e52', { roughness: 0.6 }), x, 0, z, { block: true, round: 0.03 }); for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat(['#3f8f5a', '#7aa83a', '#ff8ad8'][k], { flatShading: true })); b.position.set(x - 0.4 + k * 0.4, 0.7, z); add(b); } });
  const stringPts = [[4, 8], [16, 6], [30, 8], [34, 16], [20, 23], [6, 22], [4, 8]];
  for (let i = 0; i < stringPts.length - 1; i++) { const [ax, az] = stringPts[i], [bx, bz] = stringPts[i + 1]; const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 1.2); for (let k = 0; k <= n; k++) { const u = k / n; const l = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), glow(k % 2 ? '#ffe2a8' : '#ffc857', 2.4)); l.position.set(ax + (bx - ax) * u, 3.3 - Math.sin(u * Math.PI) * 0.35, az + (bz - az) * u); Z.group.add(l); } }
  for (let i = 0; i < stringPts.length; i++) { const [x, z] = stringPts[i]; if (i < stringPts.length - 1) cyl(0.03, 0.03, 3.3, frameM, x, 0, z, { seg: 6 }); }
  box(2.6, 2.3, 4.4, mat('#9fb0c0', { roughness: 0.5 }), 38.3, 0, 19, { cast: true }); // elevator machine room
  /* v11.2: the café dressed up — slatted oak cladding, pendant lamps, a chalkboard menu, a lounge corner with sofas, rugs and
     lanterns, a pergola with hanging plants, potted olives, and an art wall of three abstract canvases on the machine room. */
  {
    const slats = canvasTex(256, 256, (g, w, h) => { for (let x = 0; x < w; x += 16) { const v = 150 + ((x * 37) % 40); g.fillStyle = `rgb(${v + 40},${v - 5},${v - 50})`; g.fillRect(x, 0, 14, h); g.fillStyle = 'rgba(40,25,10,.6)'; g.fillRect(x + 14, 0, 2, h); } });
    slats.wrapS = slats.wrapT = THREE.RepeatWrapping; slats.repeat.set(3, 1);
    const clad = mat('#ffffff', { map: slats, roughness: 0.6 });
    box(7.05, 2.3, 0.06, clad, 9, 0.1, 6.03, { cast: false }); box(0.06, 2.3, 4.05, clad, 5.47, 0.1, 4, { cast: false }); box(0.06, 2.3, 4.05, clad, 12.53, 0.1, 4, { cast: false });
    // pendant lamps over the counter
    for (let i = 0; i < 3; i++) { const x = 7 + i * 2; cyl(0.006, 0.006, 0.9, mat('#222'), x, 1.75, 6.6, { seg: 4 }); const sh = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.28, 18, 1, true), mat('#1b1b1b', { side: THREE.DoubleSide, roughness: 0.4, metalness: 0.5 })); sh.position.set(x, 1.62, 6.6); add(sh); const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), glow('#ffcf8a', 3)); bulb.position.set(x, 1.5, 6.6); add(bulb); }
    // chalkboard menu
    const chalk = plane(1.6, 1.1, new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(320, 220, (g, w, h) => { g.fillStyle = '#1f2a24'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a6a44'; g.lineWidth = 10; g.strokeRect(0, 0, w, h);
      g.fillStyle = '#f2efe6'; g.font = `700 26px ${CN_FONT}`; g.fillText('今日手冲', 22, 42); g.font = `500 17px ${CN_FONT}`;
      [['埃塞俄比亚 耶加雪菲', '38'], ['云南 普洱 · 日晒', '32'], ['哥伦比亚 慧兰', '34'], ['燕麦拿铁', '28'], ['槟城白咖啡', '26']].forEach(([n, pr], i) => { g.fillText(n, 22, 76 + i * 28); g.fillText(pr, w - 50, 76 + i * 28); });
      g.fillStyle = '#e8b04a'; g.fillText('～ 慢一点，喝一杯 ～', 70, h - 14); }) }), 12.6, 1.4, 6.7, { ry: Math.PI / 2 });
    // lounge corner (south-east of the deck): sofas, a low table, a rug and lanterns
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.2), new THREE.MeshStandardMaterial({ roughness: 0.95, map: canvasTex(256, 192, (g, w, h) => { g.fillStyle = '#b8574a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#f0e2c8'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20); for (let i = 0; i < 6; i++) { g.strokeStyle = i % 2 ? '#2f4f6f' : '#e8b04a'; g.lineWidth = 3; g.beginPath(); g.moveTo(30, 30 + i * 26); g.lineTo(w - 30, 30 + i * 26); g.stroke(); } }) }));
    rug.rotation.x = -Math.PI / 2; rug.position.set(26, 0.012, 21.5); rug.receiveShadow = true; add(rug);
    const sofa = (x, z, ry, col) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; Z.group.add(g); const cm = mat(col, { roughness: 0.9 });
      [[2.0, 0.4, 0.85, 0, 0.2, 0], [2.0, 0.5, 0.2, 0, 0.55, -0.35], [0.2, 0.35, 0.85, -0.95, 0.45, 0], [0.2, 0.35, 0.85, 0.95, 0.45, 0]].forEach(([w, h, d, px, py, pz]) => { const b = new THREE.Mesh(rbox(w, h, d, 0.06), cm); b.position.set(px, py, pz); b.castShadow = b.receiveShadow = true; g.add(b); });
      [-0.5, 0.5].forEach(px => { const c = new THREE.Mesh(rbox(0.5, 0.35, 0.12, 0.05), mat('#e8dcc4', { roughness: 0.95 })); c.position.set(px, 0.6, -0.22); c.rotation.x = -0.2; g.add(c); }); };
    sofa(26, 19.9, 0, '#3f5a4a'); sofa(26, 23.1, Math.PI, '#3f5a4a'); sofa(23.4, 21.5, Math.PI / 2, '#6b5a44');
    blockRect(22.9, 19.3, 29.1, 23.7, 0.1);
    box(1.4, 0.35, 0.7, mat('#5a3f2a', { roughness: 0.5 }), 26, 0, 21.5, { round: 0.03 });
    const lantern = (x, y, z) => { box(0.18, 0.26, 0.18, new THREE.MeshStandardMaterial({ color: '#1b1b1b', metalness: 0.6, roughness: 0.4, transparent: true, opacity: 0.85 }), x, y, z, { cast: false }); const f = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), glow('#ffb25e', 3.2)); f.position.set(x, y + 0.11, z); add(f); };
    lantern(26, 0.35, 21.5); spots.forEach(([x, z]) => lantern(x - 0.2, 0.77, z + 0.15));
    // pergola with hanging plants over the lounge
    [[23.5, 19.2], [28.5, 19.2], [23.5, 23.8], [28.5, 23.8]].forEach(([x, z]) => box(0.14, 2.7, 0.14, mat('#6b4a32', { roughness: 0.8 }), x, 0, z));
    for (let i = 0; i < 7; i++) box(5.4, 0.08, 0.1, mat('#6b4a32', { roughness: 0.8 }), 26, 2.7, 19.2 + i * 0.77, { cast: false });
    for (let i = 0; i < 8; i++) { const x = 24 + (i % 4) * 1.4, z = 19.8 + Math.floor(i / 4) * 3.4; cyl(0.004, 0.004, 0.5, mat('#333'), x, 2.2, z, { seg: 3 }); const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.2, 10), mat('#c8a27a')); pot.position.set(x, 2.15, z); add(pot);
      for (let k = 0; k < 6; k++) { const v = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.6 + (k % 3) * 0.2, 4), mat(k % 2 ? '#4f8f3f' : '#3f7a35', { flatShading: true })); v.rotation.x = Math.PI; v.position.set(x + Math.cos(k) * 0.12, 1.85 - (k % 3) * 0.1, z + Math.sin(k) * 0.12); add(v); } }
    // potted olive trees
    [[3.2, 12.8], [3.2, 19.5], [31.5, 9], [31.5, 15], [15.5, 23.8]].forEach(([x, z]) => { cyl(0.32, 0.26, 0.55, mat('#d9cbb6', { roughness: 0.9 }), x, 0, z, { block: true }); cyl(0.04, 0.06, 1.1, mat('#6b5a44'), x, 0.55, z, { seg: 6 });
      for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), mat(['#7d8f62', '#8a9c6e', '#6f8456'][k % 3], { flatShading: true, roughness: 0.9 })); b.position.set(x + Math.cos(k * 1.3) * 0.25, 1.75 + (k % 2) * 0.25, z + Math.sin(k * 1.3) * 0.25); b.castShadow = true; add(b); } });
    // art wall: three abstract canvases on the machine room
    const art = (seed) => canvasTex(200, 260, (g, w, h) => { const pal = [['#e8b04a', '#c0392b', '#2f4f6f', '#f2efe6'], ['#2251FF', '#00A9F4', '#051C2C', '#f2efe6'], ['#3f8f5a', '#e8dcc4', '#b8574a', '#2b2b2b']][seed];
      g.fillStyle = pal[3]; g.fillRect(0, 0, w, h); for (let i = 0; i < 3; i++) { g.fillStyle = pal[i]; g.globalAlpha = 0.85; const y = 20 + i * 78; g.fillRect(16 + (seed * 7 + i * 5) % 20, y, w - 32, 60 + ((seed + i) % 2) * 14); } g.globalAlpha = 1;
      g.strokeStyle = pal[2]; g.lineWidth = 3; g.beginPath(); g.arc(w * 0.65, h * 0.5, 30 + seed * 6, 0, 6.3); g.stroke(); });
    [17.6, 19, 20.4].forEach((z, k) => { box(0.04, 1.36, 1.08, mat('#1b1b1b'), 36.97, 0.55, z, { cast: false }); plane(1.0, 1.28, new THREE.MeshStandardMaterial({ map: art(k), roughness: 0.85 }), 36.94, 1.23, z, { ry: -Math.PI / 2 }); });
    decal('天台咖啡 · 艺术角', 33.6, 22.6, 2.8, 0.55, { sub: 'ROOFTOP CAFÉ · ART WALL', accent: '#e8b04a' });
  }
  decal('天台 · ROOFTOP', 20, 9.4, 3, 0.55, { sub: '小心风大 · 请勿攀爬', bg: 'rgba(40,30,20,.85)', accent: '#ffc857' });
  lightPool(9, 8, 5, '#ffd9a0', 0.14); lightPool(18, 15, 10, '#ffe2a8', 0.08); addLamp(9, 7, '#ffd9a0'); addLamp(18, 15, '#ffe2a8', 14);
  /* elevator door in the machine room */
  box(0.1, 2.1, 1.5, mat('#bcc8d3', { metalness: 0.9, roughness: 0.18 }), 36.95, 0, 18.6); plane(0.28, 0.14, glow('#FFB547', 2.4), 36.9, 2.3, 18.6, { ry: -Math.PI / 2 });
  blockRect(37, 16.8, 40, 21.2); decal('R · 电梯', 36, 15.7, 1.8, 0.5, { sub: 'ELEVATOR', to: 's' });
  Z.portals.push({ kind: 'elevator', x: 36.2, z: 18.6 }); Z.spawn = { x: 35.4, z: 18.6 };
  Z.rooms = { cafe: { x0: 4, z0: 0, x1: 16, z1: 9, name: '咖啡馆' }, terrace: { x0: 0, z0: 0, x1: 40, z1: 26, name: '天台' } };
})();

