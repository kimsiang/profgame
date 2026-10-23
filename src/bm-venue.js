/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE. */
/* Badminton venue (v10.3): the gym, rebuilt as a match stage for the broadcast camera.
   While a match is on, index.html hides the ordinary gym zone and shows this group instead. It is the same room
   (40 × 26 m, three courts, court 2 in the middle), dressed for a low camera: tall window walls, side courts in use,
   and for Friday's 物理 vs 化学 match a bleacher crowd, boards, banners and a scoreboard (setEvent(true)).
   Pure scene building, no game state. Built at world coordinates so characters can be parented here unchanged.
   Layout matches assets/js/badminton.js: court centre (cx, net), length along z, the player's half at z > net. */
(function (root) {
  'use strict';

  function build(THREE, o) {
    const cx = o.cx, cz = o.net, Q = o.quality || 'high';
    const T = o.text || {};
    const group = new THREE.Group(); group.name = 'bmVenue';
    const ev = new THREE.Group(); ev.visible = false; group.add(ev);   // match-day dressing
    const anims = [];
    const font = o.font || 'sans-serif';

    /* ---------- helpers ---------- */
    const mats = {};
    const M = (color, x = {}) => { const k = color + JSON.stringify(x); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.75, metalness: 0.02, envMapIntensity: 0.3 }, x))); };
    const tex = (w, h, draw, rep) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = o.aniso || 8;
      if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
      return t;
    };
    const shadowy = (m, cast = true, recv = true) => { m.castShadow = cast && Q !== 'low'; m.receiveShadow = recv; return m; };
    const add = (m, x, y, z, ry, par) => { m.position.set(cx + x, y, cz + z); if (ry) m.rotation.y = ry; (par || group).add(m); return m; };
    const box = (w, h, d, mat, x, y, z, o2 = {}) => { const m = shadowy(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), o2.cast !== false, true); add(m, x, y + h / 2, z, o2.ry, o2.par); return m; };
    const cyl = (r0, r1, h, mat, x, y, z, seg = 10) => { const m = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat)); add(m, x, y + h / 2, z); return m; };
    const flat = (w, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.receiveShadow = true; add(m, x, y, z); return m; };
    const wallPlane = (w, h, mat, x, y, z, ry, par) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); add(m, x, y, z, ry, par); return m; };
    const _o = new THREE.Object3D();
    // Instanced mesh from [x, y, z, ry, sx, sy, sz] in venue-local coordinates.
    const inst = (geo, mat, list, cast, colors, par) => {
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((a, i) => {
        _o.position.set(cx + a[0], a[1], cz + a[2]); _o.rotation.set(0, a[3] || 0, 0); _o.scale.set(a[4] || 1, a[5] || a[4] || 1, a[6] || a[4] || 1); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix);
        if (colors && im.setColorAt) im.setColorAt(i, new THREE.Color(colors[i % colors.length]));
      });
      im.castShadow = !!cast && Q !== 'low'; im.receiveShadow = true; (par || group).add(im); return im;
    };
    const rnd = (() => { let s = 11; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();   // same layout every time

    /* ---------- floor: sprung maple boards ---------- */
    // 1024² texture, 2 px gaps between boards, grain streaks; v10.3.1 doubled from 512²
    const planks = tex(1024, 1024, (g, w, h) => {
      g.fillStyle = '#8f6236'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 4; x++) { const s = 0.86 + rnd() * 0.18; g.fillStyle = `rgb(${196 * s | 0},${142 * s | 0},${88 * s | 0})`; g.fillRect(((x * 256 + (y % 2) * 128) % w), y * 64 + 1, 254, 62); if ((y % 2) && x === 3) g.fillRect(0, y * 64 + 1, 126, 62); }
      for (let i = 0; i < 3200; i++) { g.fillStyle = `rgba(90,50,20,${0.03 + rnd() * 0.05})`; g.fillRect(rnd() * w, rnd() * h, 30 + rnd() * 80, 1); }
    }, [10, 7]);
    flat(40, 26, new THREE.MeshStandardMaterial({ map: planks, roughness: 0.38, metalness: 0.0, envMapIntensity: 0.7 }), 0, 0.0, 0);

    /* ---------- courts (BWF Law 1). Court 2 is the match court; 1 and 3 stay in use beside it. ---------- */
    const courtTex = tex(1220, 2680, (g, w, h) => {
      const k = 200; g.fillStyle = '#2c7d58'; g.fillRect(0, 0, w, h);   // 200 px per metre: a 40 mm line is 8 px wide
      for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(255,255,255,${0.01 + rnd() * 0.02})`; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1); }
      const L = 0.04 * k, net = h / 2; g.fillStyle = '#ffffff';
      const hl = (y) => g.fillRect(0, y, w, L), vl = (x, y0, y1) => g.fillRect(x, y0, L, y1 - y0);
      hl(0); hl(h - L); vl(0, 0, h); vl(w - L, 0, h); vl(0.46 * k, 0, h); vl(w - 0.46 * k - L, 0, h);
      hl(0.76 * k - L); hl(h - 0.76 * k); hl(net - 1.98 * k); hl(net + 1.98 * k - L);
      vl(w / 2 - L / 2, 0, net - 1.98 * k); vl(w / 2 - L / 2, net + 1.98 * k, h);
    });
    const courtMat = new THREE.MeshStandardMaterial({ map: courtTex, roughness: 0.6, envMapIntensity: 0.4 });
    const netTex = tex(1024, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(16,20,26,.92)'; g.lineWidth = 2; for (let i = 0; i <= w; i += 10) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); } for (let j = 0; j <= h; j += 10) { g.beginPath(); g.moveTo(0, j); g.lineTo(w, j); g.stroke(); } }, [6, 1]);
    const netMat = new THREE.MeshStandardMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, alphaTest: 0.15, roughness: 0.9 });
    const tape = M('#ffffff', { roughness: 0.5 }), postM = M('#1b2430', { metalness: 0.5, roughness: 0.4 }), baseM = M('#20262e', { roughness: 0.5 });
    [-13, 0, 13].forEach(x0 => {
      // a slightly darker surround mat under court 2 so the match court reads first
      if (x0 === 0) flat(7.6, 15.4, M('#12493a', { roughness: 0.95, envMapIntensity: 0.02 }), 0, 0.003, 0);
      flat(6.1, 13.4, courtMat, x0, 0.006, 0);
      add(new THREE.Mesh(new THREE.PlaneGeometry(6.1, 0.76), netMat), x0, 1.524 - 0.38, 0);
      box(6.1, 0.07, 0.012, tape, x0, 1.524 - 0.07, 0, { cast: false });
      [-3.05, 3.05].forEach(x => { cyl(0.028, 0.028, 1.55, postM, x0 + x, 0, 0, 16); cyl(0.17, 0.2, 0.09, baseM, x0 + x, 0, 0, 32); });
    });

    /* ---------- the room: window walls on three sides, open toward the camera ---------- */
    const wallM = M('#dfe6ec', { roughness: 0.85 }), trim = M('#2b3d52', { roughness: 0.6 }), kick = M('#2c6e8f', { roughness: 0.7 });
    const H = 7.5;
    box(40, H, 0.3, wallM, 0, 0, -13.15, { cast: false }); box(0.3, H, 26, wallM, -20.15, 0, 0, { cast: false }); box(0.3, H, 26, wallM, 20.15, 0, 0, { cast: false });
    box(40, 1.1, 0.34, kick, 0, 0, -13.1, { cast: false }); box(0.34, 1.1, 26, kick, -20.1, 0, 0, { cast: false }); box(0.34, 1.1, 26, kick, 20.1, 0, 0, { cast: false });   // kick panels
    const winTex = tex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#eaf6ff'); gr.addColorStop(1, '#a9d4f0'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#2b3d52'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8); g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h); g.fillRect(w / 2 - 4, 0, 8, h); g.fillRect(0, h * 0.55, w, 6); });
    const winM = new THREE.MeshBasicMaterial({ map: winTex, toneMapped: false }); winM.color.setScalar(1.25);
    for (let x = -17; x <= 17; x += 4.25) wallPlane(3.4, 3.2, winM, x, 4.4, -12.98);
    for (let z = -10; z <= 10; z += 4.4) { wallPlane(3.4, 3.2, winM, -19.98, 4.4, z, Math.PI / 2); wallPlane(3.4, 3.2, winM, 19.98, 4.4, z, -Math.PI / 2); }
    box(40, 0.25, 0.4, trim, 0, H - 0.25, -13.1, { cast: false });
    // no ceiling: the broadcast camera sits above the roof line, as in the diorama view

    /* ---------- everyday gym dressing ---------- */
    const benchAt = (x, z, ry) => { const g = new THREE.Group(), w = M('#a87a4a', { roughness: 0.7 }), ir = M('#3a3f46', { metalness: 0.4 }); const s = shadowy(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.45), w)); s.position.y = 0.45; g.add(s); const b = shadowy(new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.36, 0.05), w)); b.position.set(0, 0.72, -0.21); g.add(b); [-0.8, 0.8].forEach(a => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.42), ir); l.position.set(a, 0.225, 0); g.add(l); }); add(g, x, 0, z, ry); };
    [-13, 0, 13].forEach(x => benchAt(x, -10.6, 0));
    benchAt(-6.6, -4.5, Math.PI / 2); benchAt(6.6, 4.5, -Math.PI / 2);
    // kit bags and water bottles between the courts
    [['#c0392b', -7.0, -3.2], ['#2251FF', -6.9, -2.4], ['#1b2430', 7.0, 3.3], ['#3DDC97', 6.9, 5.8]].forEach(([c, x, z]) => { const b = box(0.32, 0.3, 0.8, M(c, { roughness: 0.6 }), x, 0, z); b.rotation.y = 0.15; });
    inst(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 8).translate(0, 0.11, 0), M('#ffffff', { roughness: 0.4 }), [[-6.4, 0, -5.5], [-6.3, 0, -5.4], [6.4, 0, 5.2]], true, ['#00A9F4', '#ffffff', '#00A9F4']);
    { const t = tex(512, 128, (g, w, h) => { g.fillStyle = '#0a1a28'; g.fillRect(0, 0, w, h); g.fillStyle = '#FFB547'; g.font = `800 40px ${font}`; g.fillText(T.notice1 || '研究生羽毛球赛 · 周五', 20, 56); g.fillStyle = '#EAF4FB'; g.font = `600 26px ${font}`; g.fillText(T.notice2 || '物理 vs 化学 · 13:00 开赛', 20, 104); }); const m = new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); m.color.setScalar(1.3); wallPlane(4, 1, m, 0, 2.0, -12.97); }
    // umpire's chair at the net of court 2
    { const fr = M('#e9edf2', { metalness: 0.3, roughness: 0.4 }), sm = M('#1d3d7a'); [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(([a, c]) => box(0.05, 1.7, 0.05, fr, -4.6 + a, 0, c)); box(0.7, 0.06, 0.7, fr, -4.6, 1.0, 0); box(0.55, 0.06, 0.5, sm, -4.6, 1.7, 0); box(0.06, 0.5, 0.5, sm, -4.85, 1.76, 0); }

    /* ---------- match day (Friday, 物理 vs 化学): bleachers and a crowd behind the far baseline, boards, banners, scoreboard ---------- */
    const tier = M('#2b3442', { roughness: 0.8 }), seatM = M('#0341B3', { roughness: 0.6 });
    const seats = [], fans = [];
    for (let r = 0; r < 4; r++) {
      const y = 0.45 + r * 0.5, z = -9.4 - r * 0.85;
      box(36, y, 0.85, tier, 0, 0, z, { cast: false, par: ev });
      for (let x = -17.5; x <= 17.5; x += 0.7) { seats.push([x, y, z, 0]); if (rnd() < 0.8) fans.push([x + (rnd() - 0.5) * 0.1, y, z + 0.05, 0]); }
    }
    inst(new THREE.BoxGeometry(0.5, 0.1, 0.45).translate(0, 0.05, 0), seatM, seats, false, null, ev);
    const cols = ['#0341B3', '#2251FF', '#00A9F4', '#ffffff', '#b8322a', '#e8543a', '#f2c12e', '#1b2430', '#20a58c'];
    const crowd = inst(new THREE.CylinderGeometry(0.17, 0.2, 0.62, 6).translate(0, 0.43, 0), M('#ffffff', { roughness: 0.8 }), fans, false, cols, ev);
    const heads = inst(new THREE.SphereGeometry(0.13, 8, 6).translate(0, 0.86, 0), M('#e9c3a0', { roughness: 0.8 }), fans, false, ['#e9c3a0', '#d8a982', '#f1d2b6', '#c68e66'], ev);
    const fanBase = fans.map(f => ({ x: f[0], y: f[1], z: f[2], ph: rnd() * 6 }));
    let cheer = 0;
    anims.push((dt, t) => {
      if (!ev.visible) return;
      cheer = Math.max(0, cheer - dt * 0.6);
      fanBase.forEach((f, i) => {
        const j = cheer > 0 ? Math.max(0, Math.sin(t * 11 + f.ph)) * 0.2 * Math.min(1, cheer * 2) : Math.sin(t * 1.3 + f.ph) * 0.012;
        _o.position.set(cx + f.x, f.y + j, cz + f.z); _o.rotation.set(0, 0, 0); _o.scale.set(1, 1, 1); _o.updateMatrix();
        crowd.setMatrixAt(i, _o.matrix); heads.setMatrixAt(i, _o.matrix);
      });
      crowd.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
    });
    const boardTex = (txt, sub, col) => tex(512, 96, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#051C2C'); gr.addColorStop(1, '#0341B3'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = col; g.font = `800 40px ${font}`; g.textBaseline = 'middle'; g.fillText(txt, 22, h / 2 - (sub ? 10 : 0)); if (sub) { g.fillStyle = '#CDEEFF'; g.font = `500 20px ${font}`; g.fillText(sub, 24, h / 2 + 26); } });
    const boards = (T.boards || [['物理 vs 化学', 'PHYSICS vs CHEMISTRY', '#00A9F4'], ['研究生羽毛球赛', 'GRADUATE OPEN', '#FFB547'], ['导师的一周', "MY ADVISOR'S WEEK", '#ffffff']]).map(b => new THREE.MeshBasicMaterial({ map: boardTex(b[0], b[1], b[2]), toneMapped: false }));
    const bGeo = new THREE.BoxGeometry(3.0, 0.7, 0.1);
    let bi = 0;
    for (let x = -4.5; x <= 4.5; x += 3.0) add(new THREE.Mesh(bGeo, boards[bi++ % boards.length]), x, 0.35, -8.2, 0, ev);
    for (let z = -6; z <= 6; z += 3.0) [-1, 1].forEach(sd => add(new THREE.Mesh(bGeo, boards[bi++ % boards.length]), sd * 4.9, 0.35, z, sd * -Math.PI / 2, ev));
    const banner = (txt, col) => new THREE.MeshStandardMaterial({ map: tex(512, 128, (g, w, h) => { g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = `900 80px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 4); }), roughness: 0.9 });
    (T.banners || [['物理必胜', '#0341B3'], ['化学加油', '#b8322a']]).forEach(([txt, col], i) => wallPlane(5.2, 1.3, banner(txt, col), i ? 11 : -11, 6.6, -12.95, 0, ev));
    const sc = document.createElement('canvas'); sc.width = 512; sc.height = 192;
    const st = new THREE.CanvasTexture(sc); st.encoding = THREE.sRGBEncoding;
    wallPlane(5.6, 2.1, new THREE.MeshBasicMaterial({ map: st, toneMapped: false }), 0, 5.3, -12.94, 0, ev);
    let scoreKey = '';

    return {
      group,
      update(dt, t) { anims.forEach(f => f(dt, t)); },
      setEvent(on) { ev.visible = !!on; },
      cheer(k = 1) { cheer = Math.max(cheer, k); },
      setScore(p, q, names) {
        const key = p + ':' + q + ':' + names; if (key === scoreKey) return; scoreKey = key;
        const g = sc.getContext('2d'), w = sc.width, h = sc.height;
        g.fillStyle = '#051C2C'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2251FF'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
        g.textBaseline = 'middle'; g.textAlign = 'center';
        g.fillStyle = '#CDEEFF'; g.font = `600 30px ${font}`; g.fillText(names[0], w * 0.22, 44); g.fillText(names[1], w * 0.78, 44);
        g.fillStyle = '#ffffff'; g.font = `900 96px ${font}`; g.fillText(String(p), w * 0.22, 126); g.fillText(String(q), w * 0.78, 126);
        g.fillStyle = '#00A9F4'; g.font = `900 60px ${font}`; g.fillText(':', w / 2, 120);
        st.needsUpdate = true;
      },
    };
  }
  root.BMVenue = { build };
})(typeof window !== 'undefined' ? window : globalThis);
