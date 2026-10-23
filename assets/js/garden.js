/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE. */
/* v11.2 botanical garden (6F): four climate zones, one per corner bed: tropical rainforest, desert, temperate forest and alpine.
   Procedural plants, modelled on real species (banana, monstera, tree fern, bromeliad; saguaro, barrel cactus, prickly pear,
   agave, aloe; oak, maple, birch, fern, foxglove; dwarf pine, cushion plants, edelweiss, gentian). Repeated parts are instanced.
   Pure scene building: GardenKit.bed(THREE, opts) returns a Group. opts: { kind, x0, z0, x1, z1, y, seed, avoid: [x, z, r], quality } */
(function (root) {
  'use strict';
  function bed(THREE, o) {
    const G = new THREE.Group(), Q = o.quality || 'high', hiQ = Q !== 'low';
    let s = o.seed || 7; const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const M = {}, mat = (c, x = {}) => M[c + JSON.stringify(x)] || (M[c + JSON.stringify(x)] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, envMapIntensity: 0.25 }, x)));
    const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; };
    const Y = o.y || 0.3, W = o.x1 - o.x0, D = o.z1 - o.z0;
    const shadow = (m) => { m.castShadow = hiQ; m.receiveShadow = true; return m; };
    const add = (m, x, y, z) => { m.position.set(x, y, z); G.add(m); return m; };
    const spot = (margin = 0.5) => { for (let k = 0; k < 30; k++) { const x = o.x0 + margin + rnd() * (W - 2 * margin), z = o.z0 + margin + rnd() * (D - 2 * margin); if (!o.avoid || Math.hypot(x - o.avoid[0], z - o.avoid[1]) > o.avoid[2]) return [x, z]; } return [o.x0 + W / 2, o.z0 + 0.6]; };
    const _o = new THREE.Object3D();
    const inst = (geo, m, list, cast = true) => {   // list of [x, y, z, rx, ry, rz, sx, sy, sz, colour?]
      const im = new THREE.InstancedMesh(geo, m, list.length);
      list.forEach((a, i) => { _o.position.set(a[0], a[1], a[2]); _o.rotation.set(a[3] || 0, a[4] || 0, a[5] || 0, 'YXZ'); _o.scale.set(a[6] || 1, a[7] || a[6] || 1, a[8] || a[6] || 1); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); if (a[9] && im.setColorAt) im.setColorAt(i, new THREE.Color(a[9])); });
      im.castShadow = cast && hiQ; im.receiveShadow = true; G.add(im); return im;
    };
    // a leaf: a plane bent along its length and across its width, so it droops and cups like a real blade.
    // It lies along -z; an instance's rx (positive) lifts it above the horizontal before the droop pulls the tip down.
    const leafGeo = (w, l, droop, cup, segs = 8) => { const g = new THREE.PlaneGeometry(w, l, 2, segs); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const v = (p.getY(i) + l / 2) / l, u = p.getX(i) / (w / 2); p.setZ(i, -droop * v * v * l + cup * u * u * w * 0.3); p.setY(i, p.getY(i) + l / 2); }
      g.rotateX(-Math.PI / 2); g.computeVertexNormals(); return g; };
    const veinTex = (base, vein, holes) => tex(128, 256, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = base; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = vein; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 4); g.lineTo(w / 2, h - 4); g.stroke(); g.lineWidth = 1.2;
      for (let y = 18; y < h - 10; y += 12) { g.beginPath(); g.moveTo(w / 2, y); g.lineTo(6, y + 16); g.moveTo(w / 2, y); g.lineTo(w - 6, y + 16); g.stroke(); }
      if (holes) { g.globalCompositeOperation = 'destination-out'; for (let y = 40; y < h - 30; y += 34) { [0, 1].forEach(sd => { g.beginPath(); g.ellipse(sd ? w * 0.72 : w * 0.28, y, 7, 13, sd ? 0.5 : -0.5, 0, Math.PI * 2); g.fill(); g.fillRect(sd ? w * 0.82 : 0, y - 3, w * 0.18, 5); }); } g.globalCompositeOperation = 'source-over'; }
    });
    const frondTex = (c1, c2) => tex(64, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = c1; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
      for (let y = 6; y < h - 4; y += 6) { const l = (w / 2 - 2) * Math.sin(Math.PI * y / h); g.strokeStyle = y % 12 ? c1 : c2; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, y); g.lineTo(w / 2 - l, y + 9); g.moveTo(w / 2, y); g.lineTo(w / 2 + l, y + 9); g.stroke(); } });
    const ground = (draw, rep) => { const t = tex(256, 256, draw); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(W / rep, D / rep);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, D - 0.1), new THREE.MeshStandardMaterial({ map: t, roughness: 0.95, envMapIntensity: 0.15 })); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; add(m, o.x0 + W / 2, Y + 0.004, o.z0 + D / 2); };
    const rock = (x, z, sc, col) => { const geo = new THREE.DodecahedronGeometry(1, 1), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.8 + rnd() * 0.35; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.7, p.getZ(i) * k); } geo.computeVertexNormals();
      const m = shadow(new THREE.Mesh(geo, mat(col, { roughness: 0.95, flatShading: true }))); m.scale.setScalar(sc); m.rotation.y = rnd() * 6; return add(m, x, Y + sc * 0.25, z); };

    if (o.kind === 'rainforest') {
      ground((g, w, h) => { g.fillStyle = '#2c2418'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { g.fillStyle = rnd() < 0.5 ? `rgba(60,110,40,${0.3 + rnd() * 0.4})` : `rgba(90,60,30,${0.3 + rnd() * 0.3})`; g.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 5, 2 + rnd() * 3); } }, 2);
      // banana plants: pseudo-stem and big torn leaves
      const bananaLeaf = leafGeo(0.55, 1.9, 0.45, 0.25), bm = new THREE.MeshStandardMaterial({ map: veinTex('#3f8f3a', '#9cc25a'), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.6 });
      const bLeaves = [];
      for (let i = 0; i < 4; i++) { const [x, z] = spot(1.0), h = 1.6 + rnd() * 0.9; add(shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, h, 8), mat('#6f8a3a', { roughness: 0.9 }))), x, Y + h / 2, z);
        for (let k = 0; k < 7; k++) bLeaves.push([x, Y + h - 0.1, z, 0.35 + rnd() * 0.45, k / 7 * Math.PI * 2 + rnd() * 0.4, 0, 1, 1 + rnd() * 0.3, 1]); }
      inst(bananaLeaf, bm, bLeaves);
      // monstera: split leaves on long petioles
      const monLeaf = leafGeo(0.7, 0.8, 0.25, 0.1), mm = new THREE.MeshStandardMaterial({ map: veinTex('#2f6e33', '#6fa45a', true), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 });
      const mLeaves = []; for (let i = 0; i < 6; i++) { const [x, z] = spot(0.6); for (let k = 0; k < 6; k++) mLeaves.push([x, Y + 0.25 + rnd() * 0.5, z, 0.3 + rnd() * 0.5, rnd() * 6.3, 0, 0.8 + rnd() * 0.5]); }
      inst(monLeaf, mm, mLeaves);
      // tree ferns: a fibrous trunk and a crown of fronds
      const frondG = leafGeo(0.5, 1.6, 0.6, 0.05), fm = new THREE.MeshStandardMaterial({ map: frondTex('#2f7d3a', '#4a9a48'), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.7 });
      const fr = []; for (let i = 0; i < 3; i++) { const [x, z] = spot(1.0), h = 1.8 + rnd() * 0.8; add(shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, h, 7), mat('#4a3424', { roughness: 1, flatShading: true }))), x, Y + h / 2, z);
        for (let k = 0; k < 10; k++) fr.push([x, Y + h, z, 0.15 + rnd() * 0.45, k / 10 * 6.28, 0, 1, 1, 1]); }
      // ground ferns
      for (let i = 0; i < 14; i++) { const [x, z] = spot(0.4); for (let k = 0; k < 8; k++) fr.push([x, Y + 0.02, z, 0.6 + rnd() * 0.4, k / 8 * 6.28 + rnd(), 0, 0.45 + rnd() * 0.2]); }
      inst(frondG, fm, fr);
      // bromeliads: strap leaves round a red heart
      const strap = leafGeo(0.08, 0.45, 0.3, 0.6), br = [];
      for (let i = 0; i < 10; i++) { const [x, z] = spot(0.4); for (let k = 0; k < 9; k++) br.push([x, Y + 0.02, z, 0.45 + rnd() * 0.6, k / 9 * 6.28, 0, 1, 1, 1, k % 3 ? '#4f8f3f' : '#2f6a33']);
        add(new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 6), mat(['#e23b4a', '#ff7a2f', '#d9418a'][i % 3], { roughness: 0.4 })), x, Y + 0.14, z); }
      inst(strap, new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 0.6 }), br);
      // orchids on stems
      const orch = []; for (let i = 0; i < 14; i++) { const [x, z] = spot(0.4); for (let k = 0; k < 4; k++) orch.push([x + (rnd() - 0.5) * 0.15, Y + 0.45 + k * 0.07, z + (rnd() - 0.5) * 0.15, 0, rnd() * 6, 0, 1, 1, 1, ['#e8a0d8', '#ffffff', '#c86ad8'][i % 3]]); }
      inst(new THREE.SphereGeometry(0.045, 6, 4), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 }), orch, false);
      // mist: a few soft sprites (rainforest humidity)
      const mist = new THREE.SpriteMaterial({ color: '#e8f4ee', transparent: true, opacity: 0.12, depthWrite: false });
      for (let i = 0; i < 6; i++) { const [x, z] = spot(1); const sp = new THREE.Sprite(mist); sp.scale.set(3, 1.2, 1); add(sp, x, Y + 0.6 + rnd() * 0.8, z); }
    }

    if (o.kind === 'desert') {
      ground((g, w, h) => { g.fillStyle = '#d6b07a'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 7) { g.strokeStyle = `rgba(150,110,60,${0.15 + rnd() * 0.1})`; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= w; x += 8) g.lineTo(x, y + Math.sin(x * 0.08 + y) * 2); g.stroke(); } for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${120 + rnd() * 80},${90 + rnd() * 60},${50 + rnd() * 40},.5)`; g.fillRect(rnd() * w, rnd() * h, 2, 2); } }, 2);
      // saguaro: ribbed column with arms that turn upward
      const ribbed = (r, h) => { const g = new THREE.CylinderGeometry(r, r * 1.05, h, 20, 6), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + 0.08 * Math.cos(a * 10); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } g.computeVertexNormals(); return g; };
      const cact = mat('#4f7a3f', { roughness: 0.7 });
      for (let i = 0; i < 3; i++) { const [x, z] = spot(1.2), h = 2.2 + rnd() * 1.2; add(shadow(new THREE.Mesh(ribbed(0.17, h), cact)), x, Y + h / 2, z); add(new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 8, 0, 6.3, 0, 1.6), cact), x, Y + h, z);
        for (let a = 0; a < 1 + (i % 2); a++) { const sd = a ? -1 : 1, ah = 0.6 + rnd() * 0.5, y0 = Y + h * (0.45 + rnd() * 0.2), ax = x + sd * 0.42;
          const arm = shadow(new THREE.Mesh(ribbed(0.11, 0.42), cact)); arm.rotation.z = sd * Math.PI / 2; add(arm, x + sd * 0.22, y0, z);
          add(shadow(new THREE.Mesh(ribbed(0.11, ah), cact)), ax, y0 + ah / 2, z); add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 6, 0, 6.3, 0, 1.6), cact), ax, y0 + ah, z); } }
      // barrel cacti with yellow crowns
      for (let i = 0; i < 7; i++) { const [x, z] = spot(0.5), r = 0.18 + rnd() * 0.14, g = ribbed(r, r * 1.6); add(shadow(new THREE.Mesh(g, mat('#5f8a43', { roughness: 0.6 }))), x, Y + r * 0.8, z);
        for (let k = 0; k < 5; k++) add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), mat('#ffd23f', { roughness: 0.5 })), x + Math.cos(k * 1.26) * r * 0.4, Y + r * 1.62, z + Math.sin(k * 1.26) * r * 0.4); }
      // prickly pear: stacked pads with magenta fruit
      const pad = new THREE.SphereGeometry(0.22, 12, 8); pad.scale(1, 1.3, 0.25); const pads = [];
      for (let i = 0; i < 4; i++) { const [x, z] = spot(0.7); pads.push([x, Y + 0.28, z, 0, rnd() * 3, 0]); for (let k = 0; k < 5; k++) pads.push([x + (rnd() - 0.5) * 0.5, Y + 0.6 + rnd() * 0.5, z + (rnd() - 0.5) * 0.3, 0, rnd() * 3, (rnd() - 0.5) * 0.8, 0.7 + rnd() * 0.3]);
        for (let k = 0; k < 4; k++) add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), mat('#c2185b')), x + (rnd() - 0.5) * 0.5, Y + 0.95 + rnd() * 0.3, z + (rnd() - 0.5) * 0.2); }
      inst(pad, mat('#6f9a4a', { roughness: 0.6 }), pads);
      // agave and aloe rosettes
      const agLeaf = new THREE.ConeGeometry(0.07, 0.9, 4).translate(0, 0.45, 0); agLeaf.scale(1, 1, 0.35);
      const ag = []; for (let i = 0; i < 6; i++) { const [x, z] = spot(0.6), big = i < 3; for (let k = 0; k < 14; k++) ag.push([x, Y, z, 0.35 + rnd() * 0.75, k / 14 * 6.28 + rnd() * 0.2, 0, big ? 1 : 0.55, big ? 1 : 0.55, big ? 1 : 0.55, big ? '#7d9e9a' : '#6f9a50']); }
      inst(agLeaf, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55, flatShading: true }), ag);
      for (let i = 0; i < 8; i++) { const [x, z] = spot(0.4); rock(x, z, 0.15 + rnd() * 0.3, ['#b98a5a', '#a87650', '#c9a27a'][i % 3]); }
    }

    if (o.kind === 'temperate') {
      ground((g, w, h) => { g.fillStyle = '#3c3322'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { g.fillStyle = [`rgba(160,90,30,.55)`, `rgba(190,140,50,.5)`, `rgba(70,110,40,.5)`, `rgba(120,60,30,.5)`][(rnd() * 4) | 0]; g.save(); g.translate(rnd() * w, rnd() * h); g.rotate(rnd() * 6); g.fillRect(-3, -1.5, 6, 3); g.restore(); } }, 2);
      // broadleaf trees: trunk, two forks, a crown of lumpy leaf masses (oak green, one maple in autumn red, one birch)
      const lump = (r) => { const g = new THREE.IcosahedronGeometry(r, 1), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.85 + rnd() * 0.3; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.85, p.getZ(i) * k); } g.computeVertexNormals(); return g; };
      const birchTex = tex(64, 256, (g, w, h) => { g.fillStyle = '#ecebe4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.fillStyle = '#2a2a28'; g.fillRect(rnd() * w, rnd() * h, 6 + rnd() * 18, 2 + rnd() * 3); } });
      [['#4f7f35', '#3f6e2c', '#5f8f3e'], ['#c4471f', '#e0702a', '#b33a1c'], ['#7faa45', '#93b852', '#6f9a3c']].forEach((cols, t) => {
        const [x, z] = spot(1.4), h = 2.2 + rnd() * 0.6, birch = t === 2;
        const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(birch ? 0.07 : 0.11, birch ? 0.1 : 0.17, h, 8), birch ? new THREE.MeshStandardMaterial({ map: birchTex, roughness: 0.8 }) : mat('#5a4430', { roughness: 0.95, flatShading: true }))); add(trunk, x, Y + h / 2, z);
        for (let k = 0; k < 2; k++) { const b = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 1.0, 6), trunk.material)); b.rotation.z = (k ? -1 : 1) * 0.6; add(b, x + (k ? -0.25 : 0.25), Y + h - 0.1, z); }
        for (let k = 0; k < 6; k++) { const m = shadow(new THREE.Mesh(lump(0.55 + rnd() * 0.35), mat(cols[k % 3], { roughness: 0.85, flatShading: true }))); add(m, x + (rnd() - 0.5) * 1.3, Y + h + 0.3 + rnd() * 0.8, z + (rnd() - 0.5) * 1.1); }
      });
      // ferns, foxgloves, moss, a fallen log, mushrooms
      const frondG = leafGeo(0.3, 0.8, 0.55, 0.05), fm = new THREE.MeshStandardMaterial({ map: frondTex('#4a8a3a', '#6aa24a'), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.75 }), fr = [];
      for (let i = 0; i < 12; i++) { const [x, z] = spot(0.4); for (let k = 0; k < 7; k++) fr.push([x, Y + 0.02, z, 0.55 + rnd() * 0.45, k / 7 * 6.28 + rnd(), 0, 0.7 + rnd() * 0.4]); }
      inst(frondG, fm, fr);
      const fox = []; for (let i = 0; i < 9; i++) { const [x, z] = spot(0.4); add(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.9, 5), mat('#4a7a35')), x, Y + 0.45, z); for (let k = 0; k < 8; k++) fox.push([x + 0.03, Y + 0.45 + k * 0.055, z, 0.4, k * 1.3, 0, 1, 1, 1, ['#c86ad8', '#e8a0d8', '#ffffff'][i % 3]]); }
      inst(new THREE.ConeGeometry(0.03, 0.06, 6, 1, true), new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 0.5 }), fox, false);
      const moss = []; for (let i = 0; i < 10; i++) { const [x, z] = spot(0.3); moss.push([x, Y, z, 0, rnd() * 6, 0, 0.25 + rnd() * 0.3, 0.1, 0.25 + rnd() * 0.3]); }
      inst(new THREE.SphereGeometry(1, 10, 6, 0, 6.3, 0, 1.57), mat('#4f7f2f', { roughness: 1 }), moss);
      { const [x, z] = spot(1.2); const log = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.8, 10), mat('#5a4632', { roughness: 1, flatShading: true }))); log.rotation.z = Math.PI / 2; log.rotation.y = rnd() * 3; add(log, x, Y + 0.16, z);
        for (let k = 0; k < 4; k++) { add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.01, 0.06, 5), mat('#efe6d0')), x + (k - 1.5) * 0.25, Y + 0.33, z); add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 4, 0, 6.3, 0, 1.6), mat('#b5402a')), x + (k - 1.5) * 0.25, Y + 0.36, z); } }
    }

    if (o.kind === 'alpine') {
      ground((g, w, h) => { g.fillStyle = '#7d7d76'; g.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { const c = 90 + rnd() * 90; g.fillStyle = `rgb(${c},${c},${c - 6})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1 + rnd() * 3, 0, 6.3); g.fill(); } for (let i = 0; i < 120; i++) { g.fillStyle = 'rgba(80,110,50,.6)'; g.fillRect(rnd() * w, rnd() * h, 6, 4); } }, 2);
      // granite boulders and scree
      for (let i = 0; i < 9; i++) { const [x, z] = spot(0.5); rock(x, z, 0.25 + rnd() * 0.45, ['#6d6c66', '#7b7a73', '#5f5e58'][i % 3]); }
      // dwarf pines: a short trunk and stacked needle cones
      const cone = new THREE.ConeGeometry(1, 1, 9), pines = [];
      for (let i = 0; i < 6; i++) { const [x, z] = spot(0.6), h = 0.8 + rnd() * 0.9; add(shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.3, 6), mat('#4a3626'))), x, Y + 0.15, z);
        for (let k = 0; k < 3; k++) pines.push([x, Y + 0.3 + h * (0.25 + k * 0.28), z, 0, rnd() * 3, 0, h * (0.38 - k * 0.09), h * 0.45, h * (0.38 - k * 0.09)]); }
      inst(cone, mat('#1f3a26', { roughness: 0.9, flatShading: true }), pines);
      // cushion plants with pink flowers, edelweiss stars, gentian cups
      const cush = []; for (let i = 0; i < 10; i++) { const [x, z] = spot(0.3); cush.push([x, Y, z, 0, 0, 0, 0.18 + rnd() * 0.12, 0.08, 0.18 + rnd() * 0.12, i % 2 ? '#5f7f3a' : '#6e8a45']); }
      inst(new THREE.SphereGeometry(1, 10, 6, 0, 6.3, 0, 1.57), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }), cush);
      const fl = [];
      cush.forEach(c => { for (let k = 0; k < 6; k++) fl.push([c[0] + (rnd() - 0.5) * c[6], Y + 0.09, c[2] + (rnd() - 0.5) * c[8], 0, 0, 0, 1, 1, 1, '#e889b7']); });
      for (let i = 0; i < 14; i++) { const [x, z] = spot(0.3); fl.push([x, Y + 0.07, z, 0, 0, 0, 1.6, 0.6, 1.6, '#f4f2e8']); }    // edelweiss
      for (let i = 0; i < 14; i++) { const [x, z] = spot(0.3); fl.push([x, Y + 0.06, z, 0, 0, 0, 1.2, 1.6, 1.2, '#1f3fbf']); }    // trumpet gentians
      inst(new THREE.SphereGeometry(0.025, 6, 4), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }), fl, false);
      // patches of old snow in the shade of the rocks
      for (let i = 0; i < 4; i++) { const [x, z] = spot(0.6); const sn = new THREE.Mesh(new THREE.CircleGeometry(0.3 + rnd() * 0.4, 12), mat('#f4f7fa', { roughness: 0.6 })); sn.rotation.x = -Math.PI / 2; sn.scale.y = 0.6 + rnd() * 0.4; add(sn, x, Y + 0.01, z); }
    }
    return G;
  }
  root.GardenKit = { bed };
})(typeof window !== 'undefined' ? window : globalThis);
