// v10.3 swings: rackets in hand, stroke poses. Low quality for speed; frames out/sw_*.png
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.evaluateOnNewDocument((q) => { try { localStorage.setItem('prof-day-q', q); localStorage.setItem('prof-bm-tut-v1', '1'); } catch (e) {} }, process.env.Q || 'low');
  await page.goto('http://localhost:8123/index.html?debug', { waitUntil: 'load' });
  await sleep(2500);
  await ev(`quickBadminton('aqiang')`); await sleep(3500);
  console.log(JSON.stringify(await ev(`(() => { const r = bmRig(player); if (!r) return 'no rig'; const a = r.fa.getWorldPosition(new THREE.Vector3()), h = r.hand.getWorldPosition(new THREE.Vector3()); const ax = new THREE.Vector3(0, 1, 0).applyQuaternion(r.fa.getWorldQuaternion(new THREE.Quaternion())); return { kind: r.kind, sx: r.sx, dot: ax.dot(h.sub(a).normalize()), rk: player.userData.bmRacket.getWorldScale(new THREE.Vector3()).x }; })()`)));
  // freeze time and pose each stroke by hand
  for (const [name, type, dt] of [['wind_over', 'over', -1], ['hit_over', 'over', 0.02], ['fol_over', 'over', 0.3], ['hit_side', 'side', 0.02], ['hit_under', 'under', 0.02]]) {
    await ev(`(() => { const B = BM.m, m = B.core.m; B.paused = true; if (${dt} < 0) { B.sw.P = null; m.inc = { recv: 'P', c: { t: m.t + 0.2, y: 2.4, x: m.ch.P.x, z: m.ch.P.z, reach: true } }; } else { m.inc = null; B.sw.P = { type: '${type}', t: m.t - ${dt} }; } })()`);
    await sleep(1500);
    await page.screenshot({ path: SHOT + 'sw_' + name + '.png', clip: { x: 440, y: 300, width: 400, height: 380 } });
  }
};
