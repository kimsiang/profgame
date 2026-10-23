// Campus frame for the v11.4 facade work. ART=real|diorama, OUT names the file, X/Z place the player, AZ rotates the camera.
const SHOT = new URL('./out/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  const port = process.env.PORT || 8123;
  await page.evaluateOnNewDocument((q) => { try { localStorage.clear(); localStorage.setItem('prof-day-q', q[0]); if (q[1]) localStorage.setItem('prof-art', q[1]); } catch (e) {} }, [process.env.Q || 'high', process.env.ART || 'real']);
  await page.goto(`http://localhost:${port}/index.html?debug`, { waitUntil: 'load', timeout: 180000 });
  await sleep(3000);
  await ev(`setup.mode = 'basic'; startGame();`); await sleep(2500);
  await ev(`beginDay(0, INTENTS[0].id)`); await sleep(3000);
  const az = process.env.AZ || ''; await ev(`(() => { const process_az = ${az || 'null'}; if (typeof TUT !== 'undefined') TUT.done.all = true; const t = document.getElementById('tut'); if (t) t.classList.add('hidden'); setZone('campus'); const x = ${process.env.X || 30}, z = ${process.env.Z || 40}, dist = ${process.env.DIST || 32}; player.position.set(x, 0, z); camState.followDist = dist; camState.dist = dist; camState.target.set(x, 0.6, z); camState.overview = false; if (process_az) camState.wantAz = camState.az = process_az; S.paused = true; const cam_ = '${process.env.CAM || ''}'; if (cam_) { const v = cam_.split(',').map(Number); placeCamera = () => { cam.position.set(v[0], v[1], v[2]); cam.lookAt(v[3], v[4], v[5]); }; } if ('${process.env.HUD || ''}' === '0') $('hud').style.display = 'none'; })()`);
  await sleep(7000);
  console.log('RENDER', JSON.stringify(await ev(`(() => { let n = 0, t = 0; FACADES.forEach(f => f.group.traverse(m => { if (m.isMesh) { n++; const g = m.geometry, c = m.isInstancedMesh ? m.count : 1; t += (g.index ? g.index.count : g.attributes.position.count) / 3 * c; } })); return { meshes: n, tris: Math.round(t), facades: FACADES.length }; })()`)));
  await page.screenshot({ path: SHOT + (process.env.OUT || 'campus') + '.png' });
};
