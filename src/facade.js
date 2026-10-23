/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE. */
/* v11.4 campus facades. A modular building kit: every building on campus is built from the same parts
   (floor bands, piers, recessed windows with aluminium frames and glass, a glass podium, entrance canopy and steps,
   parapet, roof plant, downpipes, AC units, lamps), driven by a spec from assets/data/campus.json.
   Pure scene building: FacadeKit.building(THREE, spec, o) returns { group, blocks, night(k) }.
   Everything repeated is instanced, so a 9-floor block costs ~25 draw calls.
   spec: { x, z, w, d, floors, floorH, podium: { floors, h }, style, entrance: { side, w }, roof: {...}, ac: ['e','w'] }
   o: { quality, seed } */
(function (root) {
  'use strict';
  function building(THREE, spec, o = {}) {
    const G = new THREE.Group(), Q = o.quality || 'high', hiQ = Q !== 'low';
    let s = (o.seed || 11) | 0; const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const dummy = new THREE.Object3D();
    const M = {}, mat = (c, x = {}) => M[c + JSON.stringify(x)] || (M[c + JSON.stringify(x)] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, metalness: 0.0, envMapIntensity: 0.35 }, x)));
    const tex = (w, h, draw, srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
    const shadow = (m, cast = true) => { m.castShadow = cast && hiQ; m.receiveShadow = true; return m; };
    const inst = (geo, m, list, cast = true) => {   // [x, y, z, ry, sx, sy, sz, colour?]
      if (!list.length) return null;
      const im = new THREE.InstancedMesh(geo, m, list.length);
      list.forEach((a, i) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, a[3] || 0, 0); dummy.scale.set(a[4] || 1, a[5] || 1, a[6] || 1); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); if (a[7]) im.setColorAt(i, new THREE.Color(a[7])); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      shadow(im, cast); G.add(im); return im;
    };
    const box = (w, h, d, m, x, y, z, ry = 0, cast = true) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); b.rotation.y = ry; shadow(b, cast); G.add(b); return b; };

    /* ---------- materials ---------- */
    const STYLE = {
      // A: light grey ceramic tiles, dark anodised frames (a 2000s Chinese lab block)
      tileA: { wall: '#cfd1cd', wall2: '#bfc2bd', grout: '#a3a6a1', frame: '#2f3438', spandrel: '#aeb2ad', tile: [0.6, 0.3] },
      // B: beige render, white frames (1990s teaching block)
      render: { wall: '#d9cfb8', wall2: '#cfc4aa', grout: null, frame: '#e8e8e4', spandrel: '#c4b89c', tile: [1, 1] },
      // brick: red brick, green frames (old teaching building)
      brick: { wall: '#9a4a3a', wall2: '#7f3b2f', grout: '#c7b9a8', frame: '#3f6b4a', spandrel: '#8c4538', tile: [0.24, 0.08] },
      // glass: curtain wall tower
      glass: { wall: '#6e8898', wall2: '#5e7585', grout: null, frame: '#3a4248', spandrel: '#4a5a66', tile: [1, 1] },
    };
    const st = STYLE[spec.style] || STYLE.tileA;
    const wallTex = tex(512, 512, (g, w, h) => {
      g.fillStyle = st.wall; g.fillRect(0, 0, w, h);
      const tw = Math.round(w * st.tile[0] / 2), th = Math.round(h * st.tile[1] / 2);   // texture = 2 m × 2 m
      if (st.grout) {
        for (let y = 0, r = 0; y < h; y += th, r++) for (let x = (r % 2) * tw / 2 - tw; x < w; x += tw) {
          g.fillStyle = Math.random() < 0.5 ? st.wall : st.wall2; g.globalAlpha = 0.5 + Math.random() * 0.5; g.fillRect(x, y, tw, th); g.globalAlpha = 1;
          g.strokeStyle = st.grout; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, tw - 2, th - 2);
        }
      } else { for (let i = 0; i < 4000; i++) { g.fillStyle = Math.random() < 0.5 ? st.wall : st.wall2; g.globalAlpha = 0.15; g.fillRect(Math.random() * w, Math.random() * h, 6, 6); } g.globalAlpha = 1; }
      // weathering: faint streaks running down
      for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(40,40,40,0.06)'; g.fillRect(Math.random() * w, 0, 2 + Math.random() * 6, h); }
    });
    const wallM = new THREE.MeshStandardMaterial({ color: '#ffffff', map: wallTex, roughness: 0.85, metalness: 0, envMapIntensity: 0.2 });
    // tiles are mapped in world metres (one repeat = 2 m), so instanced piers, bands and parapets of any size line up
    wallM.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
#ifdef USE_INSTANCING
  vec4 fkW = modelMatrix * instanceMatrix * vec4(position, 1.0);
#else
  vec4 fkW = modelMatrix * vec4(position, 1.0);
#endif
  vUv = vec2(fkW.x + fkW.z, fkW.y) * 0.5;`); };
    const spandrelM = mat(st.spandrel, { roughness: 0.8 });
    const frameM = mat(st.frame, { roughness: 0.35, metalness: 0.7, envMapIntensity: 0.8 });
    const glassM = new THREE.MeshStandardMaterial({ color: '#a9c6d8', roughness: 0.06, metalness: 0.9, envMapIntensity: 1.3, transparent: true, opacity: 0.86 });
    const darkIn = mat('#1b2229', { roughness: 0.95, envMapIntensity: 0 });            // the room behind the glass
    const litM = new THREE.MeshStandardMaterial({ color: '#2a2a2a', emissive: '#ffd9a6', emissiveIntensity: 0.0, roughness: 1 });   // lit rooms (night)
    const curtainM = mat('#d9d4c7', { roughness: 1 });
    const concreteM = mat('#9b9d9a', { roughness: 0.9 });
    const steelM = mat('#c5c9cc', { roughness: 0.35, metalness: 0.85, envMapIntensity: 0.9 });
    const acM = mat('#c9ccca', { roughness: 0.6, metalness: 0.2 });
    const pipeM = mat('#8d9398', { roughness: 0.5, metalness: 0.6 });

    /* ---------- dimensions ---------- */
    const W = spec.w, D = spec.d, X = spec.x, Zc = spec.z;
    const fh = spec.floorH || 3.4, floors = spec.floors || 6;
    const pod = spec.podium || { floors: 0, h: 0 }, podH = pod.floors ? pod.floors * (pod.h || 4.2) : 0;
    const H = podH + floors * fh;
    const mod = spec.module || 3.0, winW = spec.winW || 1.8, winH = spec.winH || 1.7, sill = spec.sill || 0.9;
    const recess = 0.18, pierW = mod - winW;
    const faces = [   // [name, length, centre x, centre z, rotation, outward normal x, z]
      ['s', W, X, Zc + D / 2, 0, 0, 1], ['n', W, X, Zc - D / 2, Math.PI, 0, -1],
      ['e', D, X + W / 2, Zc, Math.PI / 2, 1, 0], ['w', D, X - W / 2, Zc, -Math.PI / 2, -1, 0],
    ];
    // local → world for a face: u along the face (−len/2..len/2), v outwards (0 at the wall plane), y up
    const toW = (f, u, v) => ({ x: f[2] + Math.cos(f[4]) * u + f[5] * v, z: f[3] - Math.sin(f[4]) * u + f[6] * v });

    /* ---------- core (solid, dark, so nothing reads through) ---------- */
    box(W - (recess + 0.3) * 2, H, D - (recess + 0.3) * 2, darkIn, X, 0, Zc, 0, false);

    /* ---------- upper floors: spandrels, piers, windows ---------- */
    const piers = [], frames = [], panes = [], lits = [], curtains = [], spandrels = [], acs = [];
    const acSides = spec.ac || [];
    for (const f of faces) {
      const len = f[1], n = Math.max(1, Math.floor((len - pierW) / mod)), start = -((n - 1) * mod) / 2;
      const ent = spec.entrance && spec.entrance.side === f[0] ? spec.entrance : null;
      for (let k = 0; k < floors; k++) {
        const y0 = podH + k * fh;
        // spandrel band (sill + lintel) runs the whole face, slightly proud of the pier plane
        const p1 = toW(f, 0, -recess / 2);
        spandrels.push([p1.x, y0 + sill / 2, p1.z, f[4], len, sill, recess]);
        spandrels.push([p1.x, y0 + sill + winH + (fh - sill - winH) / 2, p1.z, f[4], len, fh - sill - winH, recess]);
        // piers between windows, on the outer plane; wider end piers close the face
        for (let i = 1; i < n; i++) { const p = toW(f, start + (i - 0.5) * mod, -recess / 2); piers.push([p.x, y0 + sill + winH / 2, p.z, f[4], pierW, winH, recess]); }
        const endW = len / 2 - (Math.abs(start) + winW / 2);
        [-1, 1].forEach(sg => { const p = toW(f, sg * (len / 2 - endW / 2), -recess / 2); piers.push([p.x, y0 + sill + winH / 2, p.z, f[4], endW, winH, recess]); });
        // windows: frame + glass + room/curtain behind
        for (let i = 0; i < n; i++) {
          const u = start + i * mod; const p = toW(f, u, -recess - 0.02), q = toW(f, u, -recess - 0.14);
          frames.push([p.x, y0 + sill + winH / 2, p.z, f[4], winW, winH, 0.06]);
          panes.push([p.x, y0 + sill + winH / 2, p.z, f[4], winW - 0.12, winH - 0.12, 1]);
          const r = rnd();
          if (r < 0.22) lits.push([q.x, y0 + sill + winH / 2, q.z, f[4], winW - 0.1, winH - 0.1, 1]);
          else if (r < 0.4) curtains.push([q.x, y0 + sill + winH / 2 + 0.1, q.z, f[4], winW - 0.2, winH - 0.3, 1]);
          if (acSides.includes(f[0]) && rnd() < 0.3) { const a = toW(f, u + winW / 2 - 0.4, 0.3); acs.push([a.x, y0 + sill - 0.45, a.z, f[4], 1, 1, 1]); }
        }
      }
    }
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const pierM = wallM;
    inst(unit, pierM, piers); inst(unit, wallM, spandrels);
    // window frames: four thin bars per window, built as one geometry
    const frameGeo = (() => { const g = new THREE.BufferGeometry(); const parts = []; const t = 0.06;
      const add = (w, h, x, y) => { const b = new THREE.BoxGeometry(w, h, 0.08); b.translate(x, y, 0); parts.push(b); };
      add(1, t, 0, 0.5 - t / 2); add(1, t, 0, -0.5 + t / 2); add(t, 1, -0.5 + t / 2, 0); add(t, 1, 0.5 - t / 2, 0); add(t, 1, 0, 0);   // outer + a mullion
      const merged = THREE.BufferGeometryUtils ? THREE.BufferGeometryUtils.mergeBufferGeometries(parts) : parts[0]; return merged || g; })();
    inst(frameGeo, frameM, frames.map(a => [a[0], a[1], a[2], a[3], a[4], a[5], 1]));
    const paneGeo = new THREE.PlaneGeometry(1, 1);
    const paneIm = inst(paneGeo, glassM, panes, false);
    const litIm = inst(paneGeo, litM, lits, false);
    inst(paneGeo, curtainM, curtains, false);
    // AC outdoor units on the side walls, each with a bracket
    const acGeo = (() => { const parts = [new THREE.BoxGeometry(0.85, 0.62, 0.32)]; parts[0].translate(0, 0, 0.16); const br = new THREE.BoxGeometry(0.9, 0.05, 0.4); br.translate(0, -0.33, 0.2); parts.push(br); return THREE.BufferGeometryUtils ? THREE.BufferGeometryUtils.mergeBufferGeometries(parts) : parts[0]; })();
    inst(acGeo, acM, acs);

    /* ---------- podium: glass curtain wall with mullions, dark base ---------- */
    if (pod.floors) {
      const ph = pod.h || 4.2;
      for (const f of faces) {
        const len = f[1]; const c = toW(f, 0, -0.1);
        // base plinth 0.6 m, then glass to the podium top, with a 0.5 m dark fascia at each floor
        const b = box(len, 0.6, 0.3, mat('#3a3f44', { roughness: 0.6 }), c.x, 0, c.z, f[4]);
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(len - 0.2, podH - 0.6), glassM); const gp = toW(f, 0, -0.05); gl.position.set(gp.x, 0.6 + (podH - 0.6) / 2, gp.z); gl.rotation.y = f[4]; G.add(gl);
        const mull = []; for (let u = -len / 2 + 1.5; u < len / 2 - 1; u += 1.5) { const p = toW(f, u, 0.02); mull.push([p.x, 0.6 + (podH - 0.6) / 2, p.z, f[4], 0.08, podH - 0.6, 0.12]); }
        for (let k = 1; k <= pod.floors; k++) { const p = toW(f, 0, 0.02); mull.push([p.x, k * ph - 0.25, p.z, f[4], len, 0.5, 0.14]); }
        inst(unit, frameM, mull);
      }
      // the podium interior: a lit lobby glimpse — a warm plane inside the glass, lobby columns
      const lobby = new THREE.Mesh(new THREE.BoxGeometry(W - 2, podH - 0.8, D - 2), new THREE.MeshStandardMaterial({ color: '#d8cfbf', roughness: 0.9, emissive: '#ffe3b8', emissiveIntensity: 0.12 })); lobby.position.set(X, 0.6 + (podH - 0.8) / 2, Zc); G.add(lobby);
      const cols = []; for (let u = -W / 2 + 4; u < W / 2 - 3; u += 6) { cols.push([X + u, podH / 2, Zc + D / 2 - 1.2, 0, 0.6, podH, 0.6]); cols.push([X + u, podH / 2, Zc - D / 2 + 1.2, 0, 0.6, podH, 0.6]); }
      inst(unit, concreteM, cols);
    }

    /* ---------- entrance: canopy, steps, ramp, handrails, doors ---------- */
    const blocks = [[X - W / 2 - 0.3, Zc - D / 2 - 0.3, X + W / 2 + 0.3, Zc + D / 2 + 0.3]];
    if (spec.entrance) {
      const e = spec.entrance, f = faces.find(x => x[0] === e.side), ew = e.w || 10, u0 = e.u || 0;
      const at = (u, v) => toW(f, u0 + u, v);
      // canopy: a thin slab on two steel columns, 4.4 m up, projecting 4 m
      const cp = at(0, 2.2); box(ew + 2, 0.35, 4.2, mat('#3b4145', { roughness: 0.5, metalness: 0.4 }), cp.x, 4.4, cp.z, f[4]);
      box(ew + 2.4, 0.08, 4.6, steelM, cp.x, 4.75, cp.z, f[4], false);
      [-ew / 2 + 0.5, ew / 2 - 0.5].forEach(u => { const p = at(u, 3.9); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 4.4, 14), steelM); c.position.set(p.x, 2.2, p.z); shadow(c); G.add(c); blocks.push([p.x - 0.25, p.z - 0.25, p.x + 0.25, p.z + 0.25]); });
      // a low landing in front of the doors (walkable: 3 cm) with a tactile strip
      const land = at(0, 1.6); box(ew + 2, 0.03, 3.2, concreteM, land.x, 0, land.z, f[4], false);
      // doors: dark-framed double doors in the podium glass, steel pull handles
      const dp = at(0, -0.02); box(ew, 0.12, 0.2, frameM, dp.x, 3.0, dp.z, f[4]);
      [-1.6, 1.6, -0.05, 0.05].forEach(u => { const p = at(u, 0.04); box(0.08, 2.6, 0.12, frameM, p.x, 0.3, p.z, f[4]); });
      [-0.6, 0.6].forEach(u => { const h = at(u, 0.14); box(0.03, 0.9, 0.03, steelM, h.x, 0.95, h.z, f[4], false); });
      if (e.sign) { const sp = at(-ew / 2 - 2.6, 0.25); const t = tex(512, 128, (g, w, h) => { g.fillStyle = '#263238'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8eaed'; g.font = 'bold 54px "Noto Sans SC", sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(e.sign, 24, h / 2); g.fillStyle = '#00A9F4'; g.fillRect(0, 0, 10, h); }); const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.3 })); pl.position.set(sp.x, 1.6, sp.z); pl.rotation.y = f[4]; G.add(pl); }
    }

    /* ---------- parapet, floor-slab edge, downpipes, wall lamps ---------- */
    const parapet = []; for (const f of faces) { const p = toW(f, 0, -0.1); parapet.push([p.x, H + 0.6, p.z, f[4], f[1] + 0.2, 1.2, 0.3]); }
    inst(unit, wallM, parapet); const cap = []; for (const f of faces) { const p = toW(f, 0, -0.1); cap.push([p.x, H + 1.22, p.z, f[4], f[1] + 0.3, 0.06, 0.42]); } inst(unit, steelM, cap);
    const pipes = []; [['s', -W / 2 + 0.6], ['s', W / 2 - 0.6], ['n', -W / 2 + 0.6], ['n', W / 2 - 0.6]].forEach(([side, u]) => { const f = faces.find(x => x[0] === side); const p = toW(f, u, 0.12); pipes.push([p.x, H / 2, p.z, 0, 0.12, H, 0.12]); });
    inst(new THREE.CylinderGeometry(0.5, 0.5, 1, 10), pipeM, pipes);
    const lamps = []; for (const f of faces) { for (let u = -f[1] / 2 + 3; u < f[1] / 2 - 2; u += 8) { const p = toW(f, u, 0.15); lamps.push([p.x, podH ? podH - 0.4 : 3.4, p.z, f[4], 0.2, 0.3, 0.3]); } }
    const lampM = new THREE.MeshStandardMaterial({ color: '#2a2e32', emissive: '#ffe7c4', emissiveIntensity: 0.0, roughness: 0.5 }); inst(unit, lampM, lamps);

    /* ---------- roof: plant room, tank, AC rows, antenna, lightning rod, a small dome ---------- */
    const R = spec.roof || {};
    const ry = H;
    if (R.plant !== false) { box(8, 3.0, 5, wallM, X - W / 4, ry, Zc - D / 6); box(2.2, 2.2, 0.1, mat('#3a3f44'), X - W / 4, ry + 0.2, Zc - D / 6 + 2.55); }   // plant room + its door
    if (R.tank !== false) { const t = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.4, 20), steelM); t.position.set(X + W / 4, ry + 1.6, Zc - D / 4); shadow(t); G.add(t); const legs = []; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; legs.push([X + W / 4 + Math.cos(a) * 1.1, ry + 0.2, Zc - D / 4 + Math.sin(a) * 1.1, 0, 0.1, 0.4, 0.1]); } inst(unit, steelM, legs); }
    if (R.ac !== false) { const units = []; const rows = 2, per = Math.max(4, Math.floor(W / 4)); for (let r = 0; r < rows; r++) for (let i = 0; i < per; i++) units.push([X - W / 2 + 3 + i * ((W - 6) / (per - 1)), ry + 0.4, Zc + D / 4 + r * 2.2, 0, 1.2, 1, 1]); inst(new THREE.BoxGeometry(1.0, 0.9, 0.45), acM, units); }
    if (R.antenna !== false) { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 6, 8), steelM); a.position.set(X + W / 2 - 2, ry + 3, Zc + D / 2 - 2); G.add(a); const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 6), steelM); rod.position.set(X - W / 2 + 1, ry + 1.1 + 1, Zc - D / 2 + 1); G.add(rod); }
    if (R.dome) {   // the small observatory dome: a lab block should look like one
      const base = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 1.6, 24), mat('#e4e5e2', { roughness: 0.6 })); base.position.set(X + W / 4, ry + 0.8, Zc + D / 6); shadow(base); G.add(base);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(2.1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('#eef0ee', { roughness: 0.35, metalness: 0.3 })); dome.position.set(X + W / 4, ry + 1.6, Zc + D / 6); shadow(dome); G.add(dome);
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.2, 0.3), mat('#2b2f33')); slit.position.set(X + W / 4, ry + 2.6, Zc + D / 6 + 1.9); slit.rotation.x = -0.5; G.add(slit);
    }
    if (R.rail) { const rails = []; for (const f of faces) { for (let u = -f[1] / 2 + 0.5; u < f[1] / 2; u += 1.5) { const p = toW(f, u, -0.6); rails.push([p.x, H + 1.2 + 0.5, p.z, f[4], 0.04, 1.0, 0.04]); } const p = toW(f, 0, -0.6); rails.push([p.x, H + 2.2, p.z, f[4], f[1] - 1, 0.04, 0.04]); } inst(unit, steelM, rails); }

    /* ---------- ground: plinth, planters along the front ---------- */
    box(W + 2.4, 0.15, D + 2.4, concreteM, X, 0, Zc, 0, false);
    if (spec.planters !== false) {
      const front = spec.entrance ? spec.entrance.side : 's', f = faces.find(x => x[0] === front); const ew = spec.entrance ? (spec.entrance.w || 10) + 4 : 0;
      const pl = [], gr = [], eu = spec.entrance ? (spec.entrance.u || 0) : 0;
      for (let u = -f[1] / 2 + 2; u + 4 <= f[1] / 2 - 2; u += 4.8) {
        if (Math.abs(u + 2 - eu) < ew / 2 + 2) continue;
        const p = toW(f, u + 2, 2.4); pl.push([p.x, 0.15, p.z, f[4], 4, 0.5, 1.2]); gr.push([p.x, 0.65, p.z, f[4], 3.8, 0.45, 1.0]); blocks.push([p.x - 2.2, p.z - 0.8, p.x + 2.2, p.z + 0.8]);
      }
      inst(unit, mat('#8a8c88', { roughness: 0.9 }), pl); inst(unit, mat('#3d6b35', { roughness: 1 }), gr, false);
    }

    /* ---------- night ---------- */
    const night = (k) => { litM.emissiveIntensity = 1.4 * k; lampM.emissiveIntensity = 2.2 * k; glassM.opacity = 0.86 - 0.2 * k; };
    return { group: G, blocks, night, H };
  }

  /* ---------- a sports hall: concrete base, ribbed metal panels, louvres, a glazed gable, standing-seam barrel roof ---------- */
  function hall(THREE, spec, o = {}) {
    const G = new THREE.Group(), Q = o.quality || 'high', hiQ = Q !== 'low';
    const dummy = new THREE.Object3D();
    const M = {}, mat = (c, x = {}) => M[c + JSON.stringify(x)] || (M[c + JSON.stringify(x)] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.7, metalness: 0.0, envMapIntensity: 0.35 }, x)));
    const tex = (w, h, draw, srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; };
    const shadow = (m, cast = true) => { m.castShadow = cast && hiQ; m.receiveShadow = true; return m; };
    const inst = (geo, m, list, cast = true) => { if (!list.length) return null; const im = new THREE.InstancedMesh(geo, m, list.length); list.forEach((a, i) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, a[3] || 0, 0); dummy.scale.set(a[4] || 1, a[5] || 1, a[6] || 1); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); }); im.instanceMatrix.needsUpdate = true; shadow(im, cast); G.add(im); return im; };
    const box = (w, h, d, m, x, y, z, ry = 0, cast = true) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); b.rotation.y = ry; shadow(b, cast); G.add(b); return b; };
    const W = spec.w, D = spec.d, X = spec.x, Zc = spec.z, H = spec.h || 9, baseH = 1.4;
    const unit = new THREE.BoxGeometry(1, 1, 1);
    // ribbed metal panel, mapped in world metres like the tiles
    const ribTex = tex(256, 64, (g, w, h) => { g.fillStyle = '#d4d7d9'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 16) { g.fillStyle = '#c3c7ca'; g.fillRect(x, 0, 6, h); g.fillStyle = '#e4e6e8'; g.fillRect(x + 6, 0, 2, h); } for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(60,60,60,0.05)'; g.fillRect(Math.random() * w, 0, 1 + Math.random() * 3, h); } });
    const panelM = new THREE.MeshStandardMaterial({ color: '#ffffff', map: ribTex, roughness: 0.55, metalness: 0.35, envMapIntensity: 0.5 });
    panelM.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
#ifdef USE_INSTANCING
  vec4 fkW = modelMatrix * instanceMatrix * vec4(position, 1.0);
#else
  vec4 fkW = modelMatrix * vec4(position, 1.0);
#endif
  vUv = vec2((fkW.x + fkW.z) * 0.5, fkW.y * 2.0);`); };
    const concreteM = mat('#8e9091', { roughness: 0.9 }), frameM = mat('#2f3438', { roughness: 0.35, metalness: 0.7, envMapIntensity: 0.8 });
    const glassM = new THREE.MeshStandardMaterial({ color: '#a9c6d8', roughness: 0.06, metalness: 0.9, envMapIntensity: 1.3, transparent: true, opacity: 0.8 });
    const roofM = mat('#5d6670', { roughness: 0.4, metalness: 0.6, envMapIntensity: 0.7 }), steelM = mat('#c5c9cc', { roughness: 0.35, metalness: 0.85, envMapIntensity: 0.9 });
    const louvreM = mat('#6c7378', { roughness: 0.5, metalness: 0.5 });
    const darkIn = mat('#1b2229', { roughness: 0.95, envMapIntensity: 0 });
    // body: dark interior core, concrete base, panel walls above the base (long sides), louvre band under the eaves
    box(W - 0.6, H, D - 0.6, darkIn, X, 0, Zc, 0, false);
    box(W + 0.2, baseH, D + 0.2, concreteM, X, 0, Zc);
    const faces = [['s', W, X, Zc + D / 2, 0, 0, 1], ['n', W, X, Zc - D / 2, Math.PI, 0, -1], ['e', D, X + W / 2, Zc, Math.PI / 2, 1, 0], ['w', D, X - W / 2, Zc, -Math.PI / 2, -1, 0]];
    const toW = (f, u, v) => ({ x: f[2] + Math.cos(f[4]) * u + f[5] * v, z: f[3] - Math.sin(f[4]) * u + f[6] * v });
    const louvres = [], lamps = [], hiWin = [], hiFrame = [];
    for (const f of faces) {
      const len = f[1], gable = f[0] === spec.gable;
      if (!gable) {
        const c = toW(f, 0, -0.1); box(len, H - baseH - 1.2, 0.2, panelM, c.x, baseH, c.z, f[4]);
        // a band of high windows (sports halls light from above) and the louvre strip under the eaves
        for (let u = -len / 2 + 2; u + 2.4 <= len / 2 - 1.5; u += 3.2) { const p = toW(f, u + 1.2, 0.02); hiWin.push([p.x, H - 2.8, p.z, f[4], 2.4, 1.6, 0.06]); hiFrame.push([p.x, H - 3.6, p.z, f[4], 2.5, 0.06, 0.1], [p.x, H - 2.0, p.z, f[4], 2.5, 0.06, 0.1]); }
        for (let u = -len / 2 + 0.4; u < len / 2 - 0.4; u += 0.25) { const p = toW(f, u, -0.08); louvres.push([p.x, H - 0.6, p.z, f[4], 0.2, 1.2, 0.03]); }
      } else {
        // the glazed gable end: full-height curtain wall with a mullion grid, the entrance doors in it
        const gp = toW(f, 0, -0.06); const gl = new THREE.Mesh(new THREE.PlaneGeometry(len - 1, H - baseH), glassM); gl.position.set(gp.x, baseH + (H - baseH) / 2, gp.z); gl.rotation.y = f[4]; G.add(gl);
        const mull = []; for (let u = -len / 2 + 0.5; u <= len / 2 - 0.5; u += 2.0) { const p = toW(f, u, 0.0); mull.push([p.x, baseH + (H - baseH) / 2, p.z, f[4], 0.1, H - baseH, 0.16]); }
        for (let y = baseH + 2.6; y < H; y += 2.6) { const p = toW(f, 0, 0.0); mull.push([p.x, y, p.z, f[4], len - 1, 0.1, 0.16]); }
        inst(unit, frameM, mull);
        // entrance: a steel canopy on two columns, double doors with handles
        const ew = spec.doorW || 6, cp = toW(f, 0, 2.0); box(ew + 2, 0.3, 3.8, roofM, cp.x, 3.6, cp.z, f[4]); box(ew + 2.3, 0.06, 4.1, steelM, cp.x, 3.9, cp.z, f[4], false);
        [-ew / 2 - 0.3, ew / 2 + 0.3].forEach(u => { const p = toW(f, u, 3.6); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.6, 12), steelM); c.position.set(p.x, 1.8, p.z); shadow(c); G.add(c); });
        [-ew / 2, ew / 2, -0.04, 0.04].forEach(u => { const p = toW(f, u, 0.06); box(0.08, 2.8, 0.12, frameM, p.x, 0.0, p.z, f[4], false); });
        const dp = toW(f, 0, 0.06); box(ew + 0.1, 0.12, 0.14, frameM, dp.x, 2.8, dp.z, f[4], false);
        [-0.5, 0.5].forEach(u => { const h = toW(f, u, 0.16); box(0.03, 0.9, 0.03, steelM, h.x, 0.95, h.z, f[4], false); });
      }
      for (let u = -len / 2 + 3; u < len / 2 - 2; u += 7) { const p = toW(f, u, 0.15); lamps.push([p.x, 3.2, p.z, f[4], 0.2, 0.3, 0.3]); }
    }
    inst(unit, louvreM, louvres, false); inst(unit, glassM, hiWin, false); inst(unit, frameM, hiFrame, false);
    const lampM = new THREE.MeshStandardMaterial({ color: '#2a2e32', emissive: '#ffe7c4', emissiveIntensity: 0.0, roughness: 0.5 }); inst(unit, lampM, lamps);
    // roof: a standing-seam barrel vault along x (as before), with a ridge ventilator and eaves gutters
    const along = spec.gable === 's' || spec.gable === 'n';   // the barrel runs from gable to gable
    const span = along ? W : D, run = along ? D : W, r = span / 2;
    const seamTex = tex(256, 32, (g, w, h) => { g.fillStyle = '#8f98a1'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 12) { g.fillStyle = '#a3abb3'; g.fillRect(x, 0, 2, h); g.fillStyle = '#6f777f'; g.fillRect(x + 2, 0, 1, h); } });
    const roofSeamM = new THREE.MeshStandardMaterial({ map: seamTex, roughness: 0.4, metalness: 0.6, envMapIntensity: 0.7 }); seamTex.repeat.set(span / 2, 1);
    const vault = new THREE.Mesh(new THREE.CylinderGeometry(r, r, run + 0.6, 32, 1, false, 0, Math.PI), roofSeamM); vault.rotation.z = Math.PI / 2; vault.rotation.y = along ? Math.PI / 2 : 0; vault.position.set(X, H, Zc); vault.scale.set(spec.rise ? spec.rise / r : 0.5, 1, 1); shadow(vault); G.add(vault);
    const rise = spec.rise || r * 0.5;
    const vent = new THREE.Mesh(new THREE.BoxGeometry(along ? 1.6 : run * 0.6, 0.5, along ? run * 0.6 : 1.6), roofM); vent.position.set(X, H + rise + 0.2, Zc); shadow(vent); G.add(vent);
    const gut = []; for (const f of faces) { if (f[0] === spec.gable || f[0] === ({ s: 'n', n: 's', e: 'w', w: 'e' })[spec.gable]) continue; const p = toW(f, 0, 0.12); gut.push([p.x, H - 0.1, p.z, f[4], f[1] + 0.3, 0.18, 0.18]); }
    inst(unit, steelM, gut);
    const pipes = []; faces.filter(f => f[0] !== spec.gable).forEach(f => { [-f[1] / 2 + 0.6, f[1] / 2 - 0.6].forEach(u => { const p = toW(f, u, 0.14); pipes.push([p.x, H / 2, p.z, 0, 0.1, H, 0.1]); }); });
    inst(new THREE.CylinderGeometry(0.5, 0.5, 1, 10), steelM, pipes);
    box(W + 2.4, 0.12, D + 2.4, concreteM, X, 0, Zc, 0, false);
    const night = (k) => { lampM.emissiveIntensity = 2.2 * k; glassM.opacity = 0.8 - 0.15 * k; };
    return { group: G, blocks: [[X - W / 2 - 0.3, Zc - D / 2 - 0.3, X + W / 2 + 0.3, Zc + D / 2 + 0.3]], night, H };
  }

  /* ---------- London planes (悬铃木), the Shanghai campus tree. forest() builds a whole list of trees as three instanced meshes:
     mottled trunks with a few branches, and a crown of leaf cards (crossed alpha-cut planes) scattered through an ellipsoid,
     so the canopy has edges and holes instead of being a ball. list: [x, z, scale, seed] ---------- */
  function forest(THREE, list, o = {}) {
    const G = new THREE.Group(), hiQ = (o.quality || 'high') !== 'low', dummy = new THREE.Object3D();
    const bc = document.createElement('canvas'); bc.width = 128; bc.height = 256; { const g = bc.getContext('2d'); g.fillStyle = '#9a8d78'; g.fillRect(0, 0, 128, 256);
      for (let i = 0; i < 160; i++) { g.fillStyle = ['#c9bda2', '#7d7460', '#b3a78c', '#6d6552', '#d8cfb6'][i % 5]; g.beginPath(); g.ellipse(Math.random() * 128, Math.random() * 256, 6 + Math.random() * 14, 10 + Math.random() * 24, Math.random(), 0, Math.PI * 2); g.fill(); } }
    const bark = new THREE.CanvasTexture(bc); bark.encoding = THREE.sRGBEncoding; bark.wrapS = bark.wrapT = THREE.RepeatWrapping; bark.repeat.set(2, 3);
    const lc = document.createElement('canvas'); lc.width = 256; lc.height = 256; { const g = lc.getContext('2d'); g.clearRect(0, 0, 256, 256);
      // a cluster of maple-like leaves on a transparent card, denser in the middle
      for (let i = 0; i < 90; i++) { const a = Math.random() * Math.PI * 2, d = Math.pow(Math.random(), 0.6) * 105, px = 128 + Math.cos(a) * d, py = 128 + Math.sin(a) * d, r = 12 + Math.random() * 14;
        g.fillStyle = ['#4f8a3a', '#5c9a42', '#3f7a30', '#6ca84c', '#467f35', '#7fb356'][i % 6]; g.save(); g.translate(px, py); g.rotate(Math.random() * 6.3); g.beginPath();
        for (let k = 0; k < 5; k++) { const t = k / 5 * Math.PI * 2; g.lineTo(Math.cos(t) * r, Math.sin(t) * r); g.lineTo(Math.cos(t + 0.63) * r * 0.45, Math.sin(t + 0.63) * r * 0.45); } g.closePath(); g.fill(); g.restore(); } }
    const leaf = new THREE.CanvasTexture(lc); leaf.encoding = THREE.sRGBEncoding;
    const barkM = new THREE.MeshStandardMaterial({ map: bark, roughness: 0.9 });
    const leafM = new THREE.MeshStandardMaterial({ map: leaf, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85, color: '#ffffff' });
    const trunks = [], branches = [], cards = [], blocks = [];
    for (const [x, z, s0, seed] of list) {
      let sd = (seed || 1) * 7919 + 13; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
      const s = s0 || 1, th = (4.6 + rnd() * 1.4) * s;
      trunks.push([x, th / 2, z, rnd() * 6.3, s, th, s]);
      const crownY = th * 0.9, cr = (2.6 + rnd() * 0.9) * s;
      for (let i = 0; i < 5; i++) { const a = rnd() * Math.PI * 2, bl = cr * 1.1; branches.push([x, crownY + bl * 0.25, z, a, bl, s]); }
      const n = hiQ ? 55 + Math.floor(rnd() * 20) : 28;
      for (let i = 0; i < n; i++) {
        // a point in the crown ellipsoid (wider than tall), biased to the shell so the middle stays airy
        const u = rnd() * Math.PI * 2, v = Math.acos(2 * rnd() - 1), rr = cr * (0.55 + 0.45 * Math.pow(rnd(), 0.5));
        const px = x + Math.sin(v) * Math.cos(u) * rr, py = crownY + cr * 0.55 + Math.cos(v) * rr * 0.65, pz = z + Math.sin(v) * Math.sin(u) * rr;
        const cs = (0.9 + rnd() * 0.8) * s;
        cards.push([px, py, pz, rnd() * 6.3, (rnd() - 0.5) * 1.2, rnd() * 6.3, cs]);
      }
      blocks.push([x - 0.3 * s, z - 0.3 * s, x + 0.3 * s, z + 0.3 * s]);
    }
    const tim = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.28, 1, 9), barkM, trunks.length);
    trunks.forEach((a, i) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, a[3], 0); dummy.scale.set(a[4], a[5], a[6]); dummy.updateMatrix(); tim.setMatrixAt(i, dummy.matrix); }); tim.castShadow = hiQ; tim.receiveShadow = true; G.add(tim);
    const bg = new THREE.CylinderGeometry(0.06, 0.11, 1, 7); bg.translate(0, 0.5, 0);
    const bim = new THREE.InstancedMesh(bg, barkM, branches.length);
    branches.forEach((a, i) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, a[3], 0); dummy.rotateX(0.95); dummy.scale.set(a[5], a[4], a[5]); dummy.updateMatrix(); bim.setMatrixAt(i, dummy.matrix); }); bim.castShadow = hiQ; G.add(bim);
    const cg = (() => { const a = new THREE.PlaneGeometry(1.4, 1.1), b = new THREE.PlaneGeometry(1.4, 1.1); b.rotateY(Math.PI / 2); return THREE.BufferGeometryUtils ? THREE.BufferGeometryUtils.mergeBufferGeometries([a, b]) : a; })();
    const cim = new THREE.InstancedMesh(cg, leafM, cards.length);
    cards.forEach((a, i) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(a[4], a[3], a[5]); dummy.scale.set(a[6], a[6], a[6]); dummy.updateMatrix(); cim.setMatrixAt(i, dummy.matrix); }); cim.castShadow = hiQ; cim.receiveShadow = true; G.add(cim);
    return { group: G, blocks };
  }

  /* ---------- a bike shed: steel posts, a sloping polycarbonate roof, a row of bikes ---------- */
  function bikeShed(THREE, x, z, len, ry = 0, o = {}) {
    const G = new THREE.Group(), hiQ = (o.quality || 'high') !== 'low', dummy = new THREE.Object3D();
    const steel = new THREE.MeshStandardMaterial({ color: '#b9bec2', roughness: 0.35, metalness: 0.85, envMapIntensity: 0.9 });
    const poly = new THREE.MeshStandardMaterial({ color: '#cfe6f2', roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const roof = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 2.4), poly); roof.position.set(0, 2.35, 0); roof.rotation.x = -0.12; roof.castShadow = hiQ; G.add(roof);
    const posts = []; for (let u = -len / 2 + 0.4; u <= len / 2 - 0.3; u += 2.4) { posts.push([u, 1.1, -1.0, 0, 0.08, 2.2, 0.08]); posts.push([u, 1.25, 1.0, 0, 0.08, 2.5, 0.08]); }
    const unit = new THREE.BoxGeometry(1, 1, 1), pim = new THREE.InstancedMesh(unit, steel, posts.length + 2);
    posts.push([0, 2.22, -1.0, 0, len, 0.08, 0.08], [0, 2.5, 1.0, 0, len, 0.08, 0.08]);
    posts.forEach((a, i) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(a[4], a[5], a[6]); dummy.updateMatrix(); pim.setMatrixAt(i, dummy.matrix); }); pim.castShadow = hiQ; G.add(pim);
    // bikes: two wheels, a frame of three bars, a saddle; the whole row is three instanced meshes
    const nb = Math.floor(len / 0.7), wheels = [], bars = [], saddles = [], cols = ['#2251FF', '#c0392b', '#3DDC97', '#222222', '#e8e8e8', '#f2c574'];
    for (let i = 0; i < nb; i++) { if (i % 5 === 3) continue; const u = -len / 2 + 0.5 + i * 0.7, lean = (i % 2 ? 1 : -1) * 0.06;
      wheels.push([u, 0.34, -0.55, 0, 1, 1, 1], [u, 0.34, 0.55, 0, 1, 1, 1]);
      bars.push([u, 0.6, 0, 0, 0.03, 0.03, 1.0, cols[i % 6]], [u, 0.6, -0.15, 0.0, 0.03, 0.6, 0.03, cols[i % 6]], [u, 0.75, 0.35, 0, 0.03, 0.55, 0.03, cols[i % 6]]);
      saddles.push([u, 0.95, -0.15, 0, 0.1, 0.05, 0.25]); saddles.push([u, 1.0, 0.45, 0, 0.45, 0.025, 0.03]); }
    const wim = new THREE.InstancedMesh(new THREE.TorusGeometry(0.33, 0.025, 6, 18), new THREE.MeshStandardMaterial({ color: '#2a2d30', roughness: 0.7 }), wheels.length);
    wheels.forEach((a, i) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, Math.PI / 2, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); wim.setMatrixAt(i, dummy.matrix); }); wim.castShadow = hiQ; G.add(wim);
    const bim = new THREE.InstancedMesh(unit, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4, metalness: 0.5 }), bars.length);
    bars.forEach((a, i) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(a[4], a[5], a[6]); dummy.updateMatrix(); bim.setMatrixAt(i, dummy.matrix); bim.setColorAt(i, new THREE.Color(a[7])); }); bim.instanceColor.needsUpdate = true; G.add(bim);
    const sim = new THREE.InstancedMesh(unit, new THREE.MeshStandardMaterial({ color: '#2a2d30', roughness: 0.8 }), saddles.length);
    saddles.forEach((a, i) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(a[4], a[5], a[6]); dummy.updateMatrix(); sim.setMatrixAt(i, dummy.matrix); }); G.add(sim);
    G.position.set(x, 0, z); G.rotation.y = ry;
    const c = Math.cos(ry), sn = Math.sin(ry), hx = Math.abs(c) * len / 2 + Math.abs(sn) * 1.3, hz = Math.abs(sn) * len / 2 + Math.abs(c) * 1.3;
    return { group: G, block: [x - hx, z - hz, x + hx, z + hz] };
  }

  /* ---------- the skyline: the city around the campus, from three building types instead of random boxes.
     slab = a long thin residential block (板楼) with a flat roof and water tanks; tower = a point block (塔楼) with a crown;
     podium = a tower on a wide base. Bodies are instanced per material, every window is one card in one InstancedMesh
     (per-instance colour: lit warm / lit cool / dark), so ~50 buildings cost 6 draw calls. list: [x, z, type, w, d, top, h, seed] ---------- */
  function skyline(THREE, list, o = {}) {
    const G = new THREE.Group(), dummy = new THREE.Object3D();
    const bodyCols = ['#2b3b4c', '#3a4553', '#1f2d3b', '#4a5560'];
    const bodyM = bodyCols.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: 0.15, envMapIntensity: 0.3 }));
    const winM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.2, toneMapped: true });
    const topM = new THREE.MeshStandardMaterial({ color: '#56606b', roughness: 0.6, metalness: 0.4 });
    const bodies = bodyCols.map(() => []), wins = [], tops = [], beacons = [];
    const unit = new THREE.BoxGeometry(1, 1, 1);
    list.forEach((b, i) => {
      const [x, z, type, w, d, top, h] = b; let sd = (b[7] || i + 1) * 7919 + 17; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; };
      const cm = i % bodyCols.length, floorH = 3.2;
      const addBody = (bw, bh, bd, bx, by, bz) => { bodies[cm].push([bx, by + bh / 2, bz, 0, bw, bh, bd]); 
        // windows on the four faces of the top 40 m (what can be seen from the campus)
        const yTop = by + bh, yBot = Math.max(by, yTop - 40);
        [[bw, bx, bz + bd / 2 + 0.02, 0], [bw, bx, bz - bd / 2 - 0.02, Math.PI], [bd, bx + bw / 2 + 0.02, bz, Math.PI / 2], [bd, bx - bw / 2 - 0.02, bz, -Math.PI / 2]].forEach(([len, fx, fz, ry]) => {
          const n = Math.max(1, Math.floor(len / 2.8)), start = -((n - 1) * 2.8) / 2;
          for (let y = yTop - floorH * 0.55; y > yBot; y -= floorH) for (let k = 0; k < n; k++) { const u = start + k * 2.8; const px = fx + Math.cos(ry) * u, pz = fz - Math.sin(ry) * u; const r = rnd(); wins.push([px, y, pz, ry, 1.7, 1.6, 1, r < 0.3 ? '#ffd9a0' : r < 0.42 ? '#b9e4ff' : '#101a26']); }
        });
        tops.push([bx, yTop + 0.3, bz, 0, bw + 0.3, 0.6, bd + 0.3]);   // parapet / roof slab
      };
      if (type === 'slab') { addBody(w, h, d, x, top - h, z); for (let k = 0; k < 1 + Math.floor(rnd() * 3); k++) tops.push([x - w / 2 + 2 + rnd() * (w - 4), top + 1.4, z + (rnd() - 0.5) * (d - 3), 0, 1.6, 1.8, 1.6]); }
      else if (type === 'tower') { addBody(w, h, d, x, top - h, z); tops.push([x, top + 1.5, z, 0, w * 0.55, 2.4, d * 0.55]); if (rnd() < 0.7) beacons.push([x, top + 3.2, z]); }
      else { addBody(w * 1.8, Math.min(14, h), d * 1.8, x, top - h, z); addBody(w, h, d, x, top - h, z); if (rnd() < 0.5) beacons.push([x, top + 0.8, z]); }
    });
    bodies.forEach((lst, i) => { if (!lst.length) return; const im = new THREE.InstancedMesh(unit, bodyM[i], lst.length); lst.forEach((a, k) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(a[4], a[5], a[6]); dummy.updateMatrix(); im.setMatrixAt(k, dummy.matrix); }); G.add(im); });
    const wim = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), winM, wins.length);
    wins.forEach((a, k) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, a[3], 0); dummy.scale.set(a[4], a[5], 1); dummy.updateMatrix(); wim.setMatrixAt(k, dummy.matrix); wim.setColorAt(k, new THREE.Color(a[7])); }); wim.instanceColor.needsUpdate = true; G.add(wim);
    const tim = new THREE.InstancedMesh(unit, topM, tops.length); tops.forEach((a, k) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(a[4], a[5], a[6]); dummy.updateMatrix(); tim.setMatrixAt(k, dummy.matrix); }); G.add(tim);
    const beaconM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff4455').multiplyScalar(3), toneMapped: false, fog: false });
    const bim = new THREE.InstancedMesh(new THREE.SphereGeometry(0.35, 8, 6), beaconM, Math.max(1, beacons.length)); beacons.forEach((a, k) => { dummy.position.set(a[0], a[1], a[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); bim.setMatrixAt(k, dummy.matrix); }); if (beacons.length) G.add(bim);
    // night(k): windows glow; the per-instance colour keeps lit and dark apart
    const night = (k) => { winM.emissiveIntensity = 0.15 + 1.6 * k; };
    return { group: G, night, material: winM };
  }
  root.FacadeKit = { building, hall, forest, bikeShed, skyline };
})(typeof window !== 'undefined' ? window : this);
