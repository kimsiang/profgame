// v11.1 Rocketbox pipeline, step 2 of 3: put real textures and sane PBR settings into an FBX2glTF output.
// node finish.mjs <in.glb> <texdir> <out.glb>
// For material <mat>: <texdir>/<mat>_color.jpg (or <mat>_opacity_color.png with alpha) and <mat>_normal.jpg.
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup } from '@gltf-transform/functions';
import fs from 'fs';
import path from 'path';

const [inp, texdir, out] = process.argv.slice(2);
const io = new NodeIO();
const doc = await io.read(inp);
const root = doc.getRoot();
const tex = (file, mime) => doc.createTexture(path.basename(file)).setImage(fs.readFileSync(file)).setMimeType(mime);
// 3ds Max Biped exported under another name (children use Bip02): rename so the shared clips bind by name.
for (const nd of root.listNodes()) { const nm = nd.getName(); if (/^Bip0[2-9]/.test(nm)) nd.setName(nm.replace(/^Bip0[2-9]/, 'Bip01')); }
const files = fs.readdirSync(texdir);
// Some avatars name materials and files differently (material f110_A_head, files f110_head_color_a.jpg): match by tokens.
const fuzzy = (n, kind) => { const t = n.toLowerCase().split('_').filter((x) => x.length > 1); return files.find((f) => f.includes('_' + kind) && t.every((x) => f.toLowerCase().includes(x))); };
for (const m of root.listMaterials()) {
  const n = m.getName(), f = (s) => { const p0 = path.join(texdir, n + s); if (fs.existsSync(p0)) return p0; const k = s.replace(/\.(jpg|png)$/, '').replace(/^_/, ''), alt = fuzzy(n, k); return alt && alt.endsWith(s.slice(-4)) ? path.join(texdir, alt) : p0; };
  m.setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setEmissiveTexture(null).setOcclusionTexture(null);
  m.setMetallicFactor(0).setRoughnessFactor(/head/.test(n) ? 0.55 : 0.75).setBaseColorFactor([1, 1, 1, 1]).setEmissiveFactor([0, 0, 0]);
  if (fs.existsSync(f('_color.jpg'))) m.setBaseColorTexture(tex(f('_color.jpg'), 'image/jpeg')).setAlphaMode('OPAQUE');
  else if (fs.existsSync(f('_opacity_color.png'))) m.setBaseColorTexture(tex(f('_opacity_color.png'), 'image/png')).setAlphaMode('MASK').setAlphaCutoff(0.45).setDoubleSided(true);
  else if (fs.existsSync(f('_color.png'))) m.setBaseColorTexture(tex(f('_color.png'), 'image/png')).setAlphaMode('MASK').setAlphaCutoff(0.45).setDoubleSided(true);
  else console.warn('no colour texture for', n);
  if (fs.existsSync(f('_normal.jpg'))) m.setNormalTexture(tex(f('_normal.jpg'), 'image/jpeg'));
  if (/glasses/.test(n)) m.setRoughnessFactor(0.2);
}
await doc.transform(prune(), dedup());
await io.write(out, doc);
console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB');
