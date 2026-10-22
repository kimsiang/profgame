// v11.1 Rocketbox pipeline, step 3 of 3: one animation pack per gender.
// node pack.mjs <out.glb> name=<clip.glb> [name=<clip.glb> ...]
// Clips are re-targeted by bone name onto the first file's skeleton. Only rotations are kept (plus the root's height),
// so the motion fits any Rocketbox body: bone translations would carry the capture actor's proportions.
// Walk and run come from the "xy" set (root moves forward); the forward drift is removed so they play in place.
import { NodeIO } from '@gltf-transform/core';
import { prune, dedup, resample } from '@gltf-transform/functions';
import fs from 'fs';

const [out, ...pairs] = process.argv.slice(2);
const FACE = /Eye|Jaw|Lip|Mouth|Masseter|Caninus|Cheek|Brow|Tongue|Nose|Ear|Lid|Nub$/;
const io = new NodeIO();
const list = pairs.map((p) => { const i = p.indexOf('='); return [p.slice(0, i), p.slice(i + 1)]; });
const base = await io.read(list[0][1]);
const R = base.getRoot(), buf = R.listBuffers()[0];
const byName = new Map(R.listNodes().map((n) => [n.getName(), n]));
R.listAnimations().forEach((a) => a.dispose());
for (const [name, file] of list) {
  const src = await io.read(file), A = src.getRoot().listAnimations()[0];
  if (!A) { console.warn('no animation in', file); continue; }
  const anim = base.createAnimation(name);
  for (const ch of A.listChannels()) {
    const node = ch.getTargetNode(), path = ch.getTargetPath(), tgt = node && byName.get(node.getName());
    if (!tgt) continue;
    if (FACE.test(node.getName())) continue;   // face rig stays at rest: these clips carry no facial performance worth 3 MB
    const isRoot = node.getName() === 'Bip01';
    if (path === 'translation' && !isRoot) continue;
    if (path === 'scale') continue;
    const s = ch.getSampler(), inp = s.getInput(), outp = s.getOutput();
    let arr = outp.getArray().slice();
    if (path === 'translation' && isRoot) {   // keep the bob, drop the travel: x and z pinned to the first frame
      for (let i = 3; i < arr.length; i += 3) { arr[i] = arr[0]; arr[i + 2] = arr[2]; }
    }
    const ai = base.createAccessor().setType(inp.getType()).setArray(inp.getArray().slice()).setBuffer(buf);
    const ao = base.createAccessor().setType(outp.getType()).setArray(arr).setBuffer(buf);
    const smp = base.createAnimationSampler().setInput(ai).setOutput(ao).setInterpolation(s.getInterpolation());
    anim.addSampler(smp).addChannel(base.createAnimationChannel().setTargetNode(tgt).setTargetPath(path).setSampler(smp));
  }
}
// The pack carries no meshes: drop them so only skeleton + clips ship.
R.listMeshes().forEach((m) => m.dispose());
R.listNodes().forEach((n) => { if (n.getSkin()) n.setSkin(null); });
await base.transform(resample({ tolerance: 1e-3 }), prune(), dedup());
await io.write(out, base);
console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB', R.listAnimations().map((a) => a.getName()).join(','));
