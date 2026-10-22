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
for (const m of root.listMaterials()) {
  const n = m.getName(), f = (s) => path.join(texdir, n + s);
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
