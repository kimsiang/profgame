/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   校园 · CAMPUS
   ========================================================= */
(() => {
  beginZone('campus', { name: '校园', floor: 0, outdoor: true, view: 240, W: 108, D: 60 });   // v11.4: 18 m wider to the east for the research tower
  slab(108, 60, 54, 30, '#2a3b2e');
  const grass = tiled((g, w, h) => { g.fillStyle = '#4a7a38'; g.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(${40 + Math.random() * 30},${80 + Math.random() * 30},${30 + Math.random() * 20},.35)`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 10 + Math.random() * 30, 6 + Math.random() * 18, Math.random() * 3, 0, 6.3); g.fill(); } for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${45 + Math.random() * 60},${100 + Math.random() * 50},${30 + Math.random() * 30},.5)`; g.fillRect(Math.random() * w, Math.random() * h, 2, 5); } }, 22, 15);
  floorPlane(0, 0, 108, 60, mat('#ffffff', { map: grass, roughness: 1, envMapIntensity: 0.2 }));
  const pave = (x0, z0, x1, z1) => floorPlane(x0, z0, x1, z1, mat('#ffffff', { map: (() => { const t = T.concrete(1, 1); t.repeat.set((x1 - x0) / 4, (z1 - z0) / 4); return t; })(), roughness: 0.4 }), 0.006);
  pave(0, 28, 108, 32); pave(28, 28, 32, 60); pave(68, 20, 72, 32); pave(8, 0, 54, 30 - 0.2); pave(95, 20, 101, 28); pave(25, 44, 29, 50); // plaza in front of physics bldg, paths to the tower and the old teaching block
  /* physics building (outside view). v11.4: built from the facade kit (assets/js/facade.js) with the spec in assets/data/campus.json.
     The data file is fetched at boot; until it arrives (or if it fails) the inline spec below is used, so the campus never builds without its main building. */
  const PHYS_SPEC = { id: 'physics', x: 30, z: 14, w: 40, d: 26, style: 'tileA', floors: 5, floorH: 3.4, podium: { floors: 2, h: 4.1 }, module: 3.0, winW: 1.8, winH: 1.7, sill: 0.9, entrance: { side: 's', w: 10, u: 0, sign: '物理楼 · 门禁' }, roof: { plant: true, tank: true, ac: true, antenna: true, dome: true, rail: true }, ac: ['e', 'w'], seed: 31 };
  const physB = FacadeKit.building(THREE, PHYS_SPEC, { quality: QUALITY, seed: 31 });
  Z.group.add(physB.group); physB.blocks.forEach(r => blockRect(r[0], r[1], r[2], r[3], 0.2)); FACADES.push(physB); physB.spec = PHYS_SPEC; physB.zone = Z;
  const nameplate = plane(12, 1.05, new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(1024, 160, (g, w, h) => { g.fillStyle = '#0A2436'; g.fillRect(0, 0, w, h); g.fillStyle = '#00A9F4'; g.fillRect(0, 0, 14, h); g.fillStyle = '#EAF4FB'; g.font = `900 92px ${CN_FONT}`; g.fillText('物 理 楼', 60, 110); g.fillStyle = '#CDEEFF'; g.font = `600 40px ${CN_FONT}`; g.fillText('PHYSICS BUILDING', 520, 105); }) }), 30, physB.H + 0.62, 27.07); nameplate.material.color.setScalar(1.3);
  plane(7, 0.12, thresholdM, 30, 0.05, 29.9, { rx: -Math.PI / 2 });
  decal('物理楼 · 正门', 30, 33, 3.2, 0.6, { sub: 'MAIN ENTRANCE · 1F', to: 'n' });
  Z.portals.push({ kind: 'door', x: 30, z: 30.6, to: 'f1', spawn: { x: 20, z: 24.4 }, label: '进入物理楼' }); Z.spawn = { x: 30, z: 31.2 };
  /* gym building. v11.4: from the facade kit's hall(): concrete base, ribbed metal panels, high windows, louvres, a glazed gable with the doors, standing-seam barrel roof */
  const GYM_SPEC = { id: 'gym', x: 72, z: 11, w: 28, d: 18, h: 9, gable: 's', doorW: 6, rise: 4.6 };
  const gymB = FacadeKit.hall(THREE, GYM_SPEC, { quality: QUALITY }); Z.group.add(gymB.group); gymB.blocks.forEach(r => blockRect(r[0], r[1], r[2], r[3], 0.2)); FACADES.push(gymB); gymB.spec = GYM_SPEC; gymB.zone = Z; gymB.kind = 'hall';
  const gymSign = plane(10, 1.6, new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(800, 128, (g, w, h) => { g.fillStyle = '#1b2430'; g.fillRect(0, 0, w, h); g.fillStyle = '#FFB547'; g.font = `900 70px ${CN_FONT}`; g.fillText('体育馆 · GYMNASIUM', 40, 90); }) }), 72, 7.0, 20.1); gymSign.material.color.setScalar(1.3);
  plane(5, 0.12, thresholdM, 70, 0.012, 21.2, { rx: -Math.PI / 2 });
  decal('体育馆 · 羽毛球馆', 70, 24.5, 3.4, 0.6, { sub: 'BADMINTON HALL', to: 'n' });
  Z.portals.push({ kind: 'door', x: 70, z: 21.8, to: 'gym', spawn: { x: 20, z: 24.2 }, label: '进入体育馆' });
  /* soccer field */
  const fieldTex = canvasTex(1024, 640, (g, w, h) => { for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#3f8a3a' : '#469a40'; g.fillRect(i * w / 10, 0, w / 10, h); } g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(30, 30, w - 60, h - 60); g.beginPath(); g.moveTo(w / 2, 30); g.lineTo(w / 2, h - 30); g.stroke(); g.beginPath(); g.arc(w / 2, h / 2, 80, 0, 7); g.stroke(); g.strokeRect(30, h / 2 - 150, 150, 300); g.strokeRect(w - 180, h / 2 - 150, 150, 300); g.strokeRect(30, h / 2 - 70, 60, 140); g.strokeRect(w - 90, h / 2 - 70, 60, 140); });
  floorPlane(36, 34, 86, 58, mat('#ffffff', { map: fieldTex, roughness: 0.9 }), 0.007);
  const goal = (x, flip) => { const g = new THREE.Group(); g.position.set(x, 0, 46); if (flip) g.rotation.y = Math.PI; Z.group.add(g); [-3.5, 3.5].forEach(dz => add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), mat('#ffffff')), { parent: g }).position.set(0, 1.2, dz)); const bar = add(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.1, 8), mat('#ffffff')), { parent: g }); bar.position.set(0, 2.4, 0); bar.rotation.x = Math.PI / 2; const nt = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.4, 7), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.18, side: THREE.DoubleSide })); nt.position.set(-0.75, 1.2, 0); g.add(nt); blockRect(x - 1.6, 42.3, x + 0.2, 49.7); };
  goal(37.6, false); goal(84.4, true);
  /* v11.2: a kick-about on the ground. Two teams of three; the nearest player runs to the ball and passes or shoots, the others
     keep their shape and drift with play. The ball rolls (with friction) and is only chipped now and then. Pitch 37.6–84.4 × 34.6–57.4. */
  const FIELD = { x0: 38.2, x1: 83.8, z0: 35.2, z1: 56.8 }, players = [];
  [[46, 40, 0], [50, 50, 0], [58, 45, 0], [64, 40, 1], [72, 51, 1], [77, 45, 1]].forEach(([x, z, team], i) => {
    const p = makeChar({ shirt: team ? '#c0392b' : '#2251FF', hairStyle: ['short', 'pony', 'spiky', 'bob', 'short', 'short'][i], pants: '#ffffff' });
    p.position.set(x, 0, z); face(p, 61, 46); p.userData.baseState = 'idle'; p.userData.state = 'idle'; Z.npcs.push(p);
    players.push({ p, team, hx: x, hz: z, cool: 0 });
  });
  const sb = ball(58, 0.22, 46, 0.22, '#ffffff', 'soccer'); sb.sim = true;   // driven here, not by the generic ball bobbing
  const bs = { x: 58, z: 46, y: 0.22, vx: 0, vz: 0, vy: 0, last: null };
  let lastT = null;
  Z.anims.push((t) => {
    const dt = lastT == null ? 0 : Math.min(0.05, t - lastT); lastT = t; if (!dt) return;
    // ball: roll with friction, chip arcs fall under gravity, bounce off the pitch edges
    bs.x += bs.vx * dt; bs.z += bs.vz * dt; const sp = Math.hypot(bs.vx, bs.vz), f = Math.max(0, 1 - 0.9 * dt);
    bs.vx *= f; bs.vz *= f;
    if (bs.y > 0.22 || bs.vy > 0) { bs.vy -= 9.8 * dt; bs.y += bs.vy * dt; if (bs.y < 0.22) { bs.y = 0.22; bs.vy = Math.abs(bs.vy) > 1.5 ? -bs.vy * 0.35 : 0; } }
    if (bs.x < FIELD.x0 || bs.x > FIELD.x1) { bs.vx *= -0.6; bs.x = Math.min(FIELD.x1, Math.max(FIELD.x0, bs.x)); }
    if (bs.z < FIELD.z0 || bs.z > FIELD.z1) { bs.vz *= -0.6; bs.z = Math.min(FIELD.z1, Math.max(FIELD.z0, bs.z)); }
    sb.m.position.set(bs.x, bs.y, bs.z); sb.y = bs.y; if (sp > 0.05) { sb.m.rotation.z -= bs.vx * dt / 0.22; sb.m.rotation.x += bs.vz * dt / 0.22; }
    // players: the one nearest the ball chases it; the rest hold a shape shifted toward the ball
    let chaser = null, best = 1e9;
    players.forEach(q => { const d = Math.hypot(q.p.position.x - bs.x, q.p.position.z - bs.z); if (d < best && q.cool <= 0) { best = d; chaser = q; } });
    players.forEach(q => {
      q.cool = Math.max(0, q.cool - dt);
      const P = q.p.position, u = q.p.userData;
      let tx, tz, speed;
      if (q === chaser) { tx = bs.x; tz = bs.z; speed = 5.2; }
      else { tx = q.hx + (bs.x - 61) * 0.45; tz = q.hz + (bs.z - 46) * 0.35; speed = 2.4; }
      const dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz);
      if (d > 0.35) { const st = Math.min(d, speed * dt); P.x += dx / d * st; P.z += dz / d * st; q.p.rotation.y = Math.atan2(dx, dz); u.state = speed > 4 && d > 1 ? 'run' : 'walk'; }
      else u.state = 'idle';
      // kick: pass to a teammate ahead, or shoot when close to the opponent's goal
      if (q === chaser && d < 0.6 && bs.y < 0.4) {
        const goalX = q.team ? 37.6 : 84.4, mates = players.filter(o => o.team === q.team && o !== q), toGoal = Math.abs(goalX - P.x);
        let ax, az, power;
        if (toGoal < 16) { ax = goalX - P.x; az = 46 + (Math.random() - 0.5) * 5 - P.z; power = 13; }
        else { const m = mates[(Math.random() * mates.length) | 0]; ax = m.p.position.x - P.x + (goalX - P.x) * 0.15; az = m.p.position.z - P.z; power = 7 + Math.random() * 3; }
        const al = Math.hypot(ax, az) || 1; bs.vx = ax / al * power; bs.vz = az / al * power; if (Math.random() < 0.2) bs.vy = 4;   // an occasional chip
        q.cool = 1.2; q.p.rotation.y = Math.atan2(ax, az); bs.last = q;
      }
    });
    if (bs.x < 38.4 || bs.x > 83.6) { if (Math.abs(bs.z - 46) < 3.4) { bs.x = 61; bs.z = 46; bs.vx = bs.vz = 0; bs.y = 0.22; bs.vy = 0; } }   // a goal: back to the centre spot
  });
  [[36, 60], [86, 60], [36, 32], [86, 32]].forEach(([x, z]) => lampPost(x - (x > 50 ? 0.6 : -0.6), z - (z > 40 ? 1.2 : -1.2), 5));
  bench(40, 32.8, 0); bench(50, 32.8, 0); bench(60, 32.8, 0);
  decal('足球场 · FOOTBALL', 61, 35.3, 4, 0.7, { sub: '校队训练 周二 / 周四 17:00', bg: 'rgba(30,70,40,.85)', accent: '#7aa83a' });
  /* v11.4: two buildings you cannot enter, for the campus to read as a campus: an old red-brick teaching block and a new glass research tower */
  const NB_SPECS = [
    { id: 'teach2', x: 14, z: 47, w: 22, d: 12, style: 'brick', floors: 5, floorH: 3.3, module: 2.7, winW: 1.5, winH: 1.8, sill: 0.9, entrance: { side: 'e', w: 5, u: 0, sign: '第二教学楼' }, roof: { plant: false, tank: true, ac: false, antenna: true, dome: false, rail: false }, ac: ['s', 'n', 'w'], planters: false, seed: 7 },
    { id: 'tower', x: 98, z: 13, w: 16, d: 16, style: 'glass', floors: 11, floorH: 3.3, podium: { floors: 1, h: 4.5 }, module: 2.0, winW: 1.7, winH: 2.4, sill: 0.5, entrance: { side: 's', w: 6, u: 0, sign: '交叉科学楼' }, roof: { plant: true, tank: false, ac: true, antenna: true, dome: false, rail: true }, ac: [], seed: 19 },
  ];
  NB_SPECS.forEach(sp => { const b = FacadeKit.building(THREE, sp, { quality: QUALITY, seed: sp.seed }); Z.group.add(b.group); b.blocks.forEach(r => blockRect(r[0], r[1], r[2], r[3], 0.2)); FACADES.push(b); b.spec = sp; b.zone = Z; });
  /* trees, lamps, bikes */
  // v11.4: London planes (悬铃木) from the kit instead of the three-ball trees; rows along the main path (west half) and the south edge
  { const trees = [[4, 6], [6, 20], [4, 36], [22, 38], [8, 57], [20, 57], [88, 4], [86, 24], [60, 4], [58, 26], [80, 28], [92, 38], [104, 42], [100, 56], [8, 33.5], [16, 33.5], [24, 33.5], [92, 48], [54, 3], [2, 50], [2, 58]].map(([x, z], i) => [x, z, 1 + (i % 3) * 0.15, i + 1]);
    const f = FacadeKit.forest(THREE, trees, { quality: QUALITY }); Z.group.add(f.group); f.blocks.forEach(r => blockRect(...r)); }
  [[14, 30.5], [46, 30.5], [66, 30.5], [29.5, 44], [29.5, 56], [70, 26], [90, 30.5], [104, 30.5]].forEach(([x, z]) => lampPost(x, z, 3.6));
  // v11.4: bike sheds (a campus is where the bikes are) by the plaza and by the gym
  [[14.5, 34.8, 10, 0], [62, 24.2, 9, 0]].forEach(([x, z, len, ry]) => { const sh = FacadeKit.bikeShed(THREE, x, z, len, ry, { quality: QUALITY }); Z.group.add(sh.group); blockRect(...sh.block); });

  box(2.6, 1.4, 0.3, mat('#2b3d52'), 20, 0, 34.6, { block: true });
  const map = plane(2.4, 1.2, new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(480, 240, (g, w, h) => { g.fillStyle = '#0A2436'; g.fillRect(0, 0, w, h); g.fillStyle = '#EAF4FB'; g.font = `800 30px ${CN_FONT}`; g.fillText('校园导览', 20, 44); g.fillStyle = '#2251FF'; g.fillRect(40, 70, 200, 90); g.fillStyle = '#FFB547'; g.fillRect(300, 70, 120, 60); g.fillStyle = '#3DDC97'; g.fillRect(160, 170, 280, 50); g.fillStyle = '#fff'; g.font = `600 22px ${CN_FONT}`; g.fillText('物理楼', 100, 120); g.fillText('体育馆', 320, 108); g.fillText('足球场', 260, 202); }) }), 20, 0.75, 34.44); map.material.color.setScalar(1.3);
  const wk = [['#5a6b7c', 'short'], ['#e67e22', 'pony']]; wk.forEach(([c, h], i) => { const p = makeChar({ shirt: c, hairStyle: h }); p.position.set(10 + i * 30, 0, 30); face(p, 45, 30); Z.npcs.push(p); });
  Z.rooms = { plaza: { x0: 8, z0: 26, x1: 54, z1: 34, name: '物理楼前广场' }, field: { x0: 36, z0: 34, x1: 86, z1: 58, name: '足球场' }, gym: { x0: 58, z0: 0, x1: 86, z1: 26, name: '体育馆外' }, tower: { x0: 88, z0: 2, x1: 108, z1: 28, name: '交叉科学楼' }, teach2: { x0: 2, z0: 40, x1: 27, z1: 54, name: '第二教学楼' } };
})();

/* =========================================================
   体育馆 · 羽毛球馆
   ========================================================= */
(() => {
  beginZone('gym', { name: '体育馆 · 羽毛球馆', floor: 0, view: 66 });
  slab(40, 26, 20, 13);
  floorPlane(0, 0, 40, 26, mat('#ffffff', { map: T.wood(10, 6.5), roughness: 0.45, envMapIntensity: 0.6 }));
  perimeter('window');
  /* BWF court (Laws of Badminton, Law 1): 13.40 × 6.10 m, lines 40 mm wide and part of the area they bound.
     Singles sidelines 0.46 m inside the doubles sidelines; short service lines 1.98 m from the net;
     doubles long service lines 0.76 m inside the back boundary; centre line from short service line to back boundary.
     Canvas x = court width (world x), canvas y = court length (world z), 80 px per metre. */
  const courtTex = canvasTex(488, 1072, (g, w, h) => {
    const k = 80, L = 0.04 * k, net = h / 2;
    g.fillStyle = '#2f7f5a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    const hl = (y) => g.fillRect(0, y, w, L), vl = (x, y0, y1) => g.fillRect(x, y0, L, y1 - y0);
    hl(0); hl(h - L);                                   // back boundary lines
    vl(0, 0, h); vl(w - L, 0, h);                       // doubles sidelines
    vl(0.46 * k, 0, h); vl(w - 0.46 * k - L, 0, h);     // singles sidelines
    hl(0.76 * k - L); hl(h - 0.76 * k);                 // doubles long service lines (outer edge 0.76 m from the back)
    hl(net - 1.98 * k); hl(net + 1.98 * k - L);         // short service lines (edge nearest the net at 1.98 m)
    vl(w / 2 - L / 2, 0, net - 1.98 * k); vl(w / 2 - L / 2, net + 1.98 * k, h);   // centre lines
  }); courtTex.anisotropy = 8;
  const netTex = canvasTex(128, 32, (g) => { g.clearRect(0, 0, 128, 32); g.strokeStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 128; i += 4) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 32); g.stroke(); } for (let j = 0; j < 32; j += 4) { g.beginPath(); g.moveTo(0, j); g.lineTo(128, j); g.stroke(); } g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 3); }); netTex.wrapS = THREE.RepeatWrapping; netTex.repeat.set(8, 1);
  [7, 20, 33].forEach((cx, i) => {
    floorPlane(cx - 3.05, 6.3, cx + 3.05, 19.7, mat('#ffffff', { map: courtTex, roughness: 0.6 }), 0.006);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(6.1, 0.76), new THREE.MeshStandardMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.2 })); net.position.set(cx, 1.524 - 0.38, 13); Z.group.add(net);
    [cx - 3.05, cx + 3.05].forEach(x => cyl(0.02, 0.02, 1.55, mat('#1b2430', { metalness: 0.6 }), x, 0, 13, { seg: 8 }));   // posts on the doubles sidelines, 1.55 m
    blockRect(cx - 3.05, 12.85, cx + 3.05, 13.15, 0.1);
    if (i !== 1) { const a = makeChar({ shirt: ['#2251FF', '#3DDC97'][i / 2 | 0], hairStyle: 'short', pants: '#ffffff' }); a.position.set(cx, 0, 9); face(a, cx, 17); a.userData.state = 'play'; a.userData.baseState = 'play'; Z.npcs.push(a); const b = makeChar({ shirt: ['#c0392b', '#f2c574'][i / 2 | 0], hairStyle: 'pony', pants: '#ffffff' }); b.position.set(cx, 0, 17); face(b, cx, 9); b.userData.state = 'play'; b.userData.baseState = 'play'; Z.npcs.push(b); const sh = ball(cx, 1.6, 13, 0.07, '#ffffff', 'shuttle'); sh.from = [cx, 9.5]; sh.to = [cx, 16.5]; sh.active = true; }
  });
  sportNPC('grad1', { shirt: '#7a5cff', hairStyle: 'spiky', pants: '#ffffff', label: '研究生会 · 阿丹' }, 20, 9.5, 20, 16);
  { const wu = makeChar({ model: 'gen_f1', shirt: '#f2c574', hair: '#1a1a1e', hairStyle: 'pony', pants: '#ffffff', accent: '#c0392b', label: '化学系 · 阿龙' }); wu.position.set(24.4, 0, 9); face(wu, 20, 9); wu.userData.baseState = 'idle'; wu.visible = false; Z.npcs.push(wu); NPC.wu = wu; }
  { const jay = makeChar({ model: 'gen_m4', shirt: '#FFCC00', hair: '#121216', hairStyle: 'spiky', pants: '#1b2430', accent: '#2251FF', label: '槟城 · 阿伟' }); jay.position.set(24.4, 0, 7.5); face(jay, 20, 7.5); jay.userData.baseState = 'idle'; jay.visible = false; Z.npcs.push(jay); NPC.jay = jay; }
  const sh2 = ball(20, 1.6, 13, 0.07, '#ffffff', 'shuttle'); sh2.from = [20, 9.8]; sh2.to = [20, 16.6];
  bench(6, 2.4, 0); bench(20, 2.4, 0); bench(33, 2.4, 0); bench(6, 23.6, Math.PI); bench(33, 23.6, Math.PI);
  for (let i = 0; i < 6; i++) { box(0.5, 0.04, 0.02, mat(['#c0392b', '#2251FF', '#3DDC97'][i % 3]), 4.4 + i * 0.5, 0.52, 2.4, { cast: false }); }
  const board = plane(4, 1.0, new THREE.MeshBasicMaterial({ toneMapped: false, map: canvasTex(512, 128, (g, w, h) => { g.fillStyle = '#0a1a28'; g.fillRect(0, 0, w, h); g.fillStyle = '#FFB547'; g.font = `800 40px ${CN_FONT}`; g.fillText('研究生羽毛球赛 · 周五', 20, 56); g.fillStyle = '#EAF4FB'; g.font = `600 26px ${CN_FONT}`; g.fillText('物理 vs 化学 · 13:00 开赛', 20, 104); }) }), 20, 2.0, 0.14); board.material.color.setScalar(1.5);
  lightPool(20, 13, 14, '#ffffff', 0.08); addLamp(8, 13, '#ffffff', 14); addLamp(32, 13, '#ffffff', 14);
  /* door to campus */
  [18, 22].forEach(x => box(0.2, 2.6, 0.3, frameM, x, 0, 26)); seg(20, 25.9, true, 4, 2.3, 0.3, 0.3, frameM); plane(4, 0.1, thresholdM, 20, 0.012, 25.6, { rx: -Math.PI / 2 });
  decal('出口 · 校园', 20, 24.0, 2.4, 0.55, { sub: 'EXIT · CAMPUS', accent: '#3DDC97', to: 's' });
  Z.portals.push({ kind: 'door', x: 20, z: 25.2, to: 'campus', spawn: { x: 70, z: 23.2 }, label: '走出体育馆' }); Z.spawn = { x: 20, z: 24.2 };
  Z.rooms = { c1: { x0: 2, z0: 5, x1: 12, z1: 21, name: '1 号场' }, c2: { x0: 15, z0: 5, x1: 25, z1: 21, name: '2 号场' }, c3: { x0: 28, z0: 5, x1: 38, z1: 21, name: '3 号场' }, hall: { x0: 0, z0: 0, x1: 40, z1: 26, name: '羽毛球馆' } };
})();

/* start on 5F */
setZone('f5');
/* zone graph for routing */
function zoneHops(from, to) {
  const nb = (z) => FLOOR_IDS.includes(z) ? FLOOR_IDS.filter(f => f !== z).concat(z === 'f1' ? ['campus'] : []) : z === 'campus' ? ['f1', 'gym'] : ['campus'];
  const prev = { [from]: null }, q = [from];
  while (q.length) { const c = q.shift(); if (c === to) break; nb(c).forEach(n => { if (!(n in prev)) { prev[n] = c; q.push(n); } }); }
  if (!(to in prev)) return null;
  const out = []; for (let k = to; k; k = prev[k]) out.unshift(k); return out;
}
function portalToward(zoneId, nextId) {
  const z = ZONES[zoneId];
  if (FLOOR_IDS.includes(zoneId) && FLOOR_IDS.includes(nextId)) return z.portals.find(p => p.kind === 'elevator');
  return z.portals.find(p => p.kind === 'door' && p.to === nextId) || z.portals[0];
}
function travelMinutes(from, to) {
  if (FLOOR_IDS.includes(from) && FLOOR_IDS.includes(to)) return 1 + Math.abs(ZONES[from].floor - ZONES[to].floor) * 0.5;
  return 3;
}
