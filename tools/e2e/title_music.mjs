// v14.0.1: a tap anywhere on the title page starts the audio context and the title track.
export default async ({ page, sleep }) => {
  const ev = (code) => page.evaluate((c) => window.__prof(c), code);
  await page.goto(`http://localhost:${process.env.PORT || 8123}/index.html?debug`, { waitUntil: 'load', timeout: 180000 });
  await sleep(2500);
  console.log('BEFORE', JSON.stringify(await ev(`({ actx: !!actx, music: !!MUSIC.data })`)));
  await page.mouse.click(640, 760); await sleep(1500);
  await sleep(1500); console.log('DBG', JSON.stringify(await ev(`(() => { let err = null; try { musicTick(0.016); } catch (e) { err = String(e); } return { err, cur: ProfMusic.current(), on: musicOn, pick: MUSIC.pick, bus: !!musicBus, frames: renderer.info.render.frame }; })()`)));
  console.log('AFTER', JSON.stringify(await ev(`({ actx: !!actx, state: actx && actx.state, music: !!MUSIC.data, track: ProfMusic.current(), want: musicWant(), title: !$('scrTitle').classList.contains('hidden') })`)));
};
