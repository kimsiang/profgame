/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   SURROUNDINGS — skyline and the city far below
   ========================================================= */
const city = []; const cityGroup = new THREE.Group(); scene.add(cityGroup);
function windowsTex(lit) { const t = canvasTex(64, 128, (g) => { g.fillStyle = '#000'; g.fillRect(0, 0, 64, 128); for (let r = 0; r < 16; r++) for (let c = 0; c < 6; c++) if (Math.random() < lit) { g.fillStyle = Math.random() < 0.7 ? '#ffd38a' : '#9fd8ff'; g.fillRect(4 + c * 10, 4 + r * 8, 6, 4); } }, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
// v11.4: three building types from the facade kit (slabs, towers, podium towers), placed around the campus plateau; seeded, so the skyline is the same every boot.
{ let sd = 2026; const rnd = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; const list = [];
  for (let i = 0; i < 52; i++) {
    let x, z, r; do { x = -100 + rnd() * 240; z = -90 + rnd() * 210; r = Math.hypot(x - 54, z - 30); } while ((x > -16 && x < 124 && z > -14 && z < 74) || r > 150);
    const type = ['slab', 'tower', 'podium', 'slab', 'tower'][i % 5], w = type === 'slab' ? 22 + rnd() * 18 : 10 + rnd() * 8, d = type === 'slab' ? 9 + rnd() * 4 : 10 + rnd() * 8;
    const top = r > 95 ? -8 + rnd() * 30 : -6 - rnd() * 22, h = top + 70; list.push([x, z, type, w, d, top, h, i + 1]);
  }
  const sk = FacadeKit.skyline(THREE, list, { quality: QUALITY }); cityGroup.add(sk.group); city.push({ material: sk.material });
}
const streetGeo = new THREE.BufferGeometry(); const sg = [];
for (let i = 0; i < 1400; i++) { const lane = Math.random() < 0.5; const x = lane ? -120 + Math.random() * 280 : -100 + Math.floor(Math.random() * 12) * 22, z = lane ? -100 + Math.floor(Math.random() * 10) * 24 : -120 + Math.random() * 260; sg.push(x, -62, z); }
streetGeo.setAttribute('position', new THREE.Float32BufferAttribute(sg, 3));
const streetLights = new THREE.Points(streetGeo, new THREE.PointsMaterial({ color: new THREE.Color('#ffc477').multiplyScalar(2), size: 1.4, transparent: true, opacity: 0.85, toneMapped: false, depthWrite: false }));
cityGroup.add(streetLights);

