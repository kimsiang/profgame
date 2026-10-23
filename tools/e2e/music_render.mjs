// v11.2: render every music track offline (12 s each) to out/music/<id>.wav, and report loudness. No game needed.
import fs from 'fs';
const OUT = new URL('./out/music/', import.meta.url).pathname;
export default async ({ page, sleep }) => {
  fs.mkdirSync(OUT, { recursive: true });
  await page.goto('http://localhost:8123/tools/rocketbox/portrait.html', { waitUntil: 'load', timeout: 120000 });
  await page.addScriptTag({ url: 'http://localhost:8123/src/music.js' });
  const data = JSON.parse(fs.readFileSync(new URL('../../assets/data/music.json', import.meta.url)));
  for (const t of data.tracks) {
    const res = await page.evaluate(async (data, id) => {
      const sr = 32000, sec = 12, ctx = new OfflineAudioContext(2, sr * sec, sr);
      const m = ctx.createGain(); m.gain.value = 0.9; m.connect(ctx.destination);
      ProfMusic.init(ctx, m, data); ProfMusic.setTrack(id); ProfMusic.setVolume(0.6); ProfMusic.prime(sec);
      const buf = await ctx.startRendering(), L = buf.getChannelData(0);
      let s2 = 0, pk = 0; for (let i = 0; i < L.length; i++) { s2 += L[i] * L[i]; pk = Math.max(pk, Math.abs(L[i])); }
      const pcm = new Int16Array(L.length); for (let i = 0; i < L.length; i++) pcm[i] = Math.max(-1, Math.min(1, L[i])) * 32767;
      return { rms: Math.sqrt(s2 / L.length), pk, pcm: Array.from(pcm), sr };
    }, data, t.id);
    const n = res.pcm.length, b = Buffer.alloc(44 + n * 2);
    b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
    b.writeUInt32LE(res.sr, 24); b.writeUInt32LE(res.sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
    res.pcm.forEach((v, i) => b.writeInt16LE(v, 44 + i * 2)); fs.writeFileSync(OUT + t.id + '.wav', b);
    console.log(t.id, 'rms', res.rms.toFixed(3), 'peak', res.pk.toFixed(2));
  }
};
