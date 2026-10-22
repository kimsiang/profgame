#!/usr/bin/env python3
"""v11.1 Rocketbox pipeline, step 1 (driver): fetch, convert, texture, pack.

python3 build.py <work> [ids...]
  <work> needs: rb/ (a --filter=blob:none --no-checkout clone of microsoft/Microsoft-Rocketbox, sparse checkout on),
                tools/node_modules with fbx2gltf and @gltf-transform/{core,functions}.
Writes assets/characters/real/<id>.glb, anim_m.glb, anim_f.glb next to this repo.
Textures: colour 1024 JPG, normal 512 JPG, hair/lashes/glasses with alpha 1024 PNG.
"""
import json, os, subprocess, sys, shutil, glob
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(REPO, 'assets', 'characters', 'real')
work = os.path.abspath(sys.argv[1]); only = sys.argv[2:]
RB, TOOLS = os.path.join(work, 'rb'), os.path.join(work, 'tools')
FBX2GLTF = os.path.join(TOOLS, 'node_modules', 'fbx2gltf', 'bin', 'Linux', 'FBX2glTF')
CAST = json.load(open(os.path.join(HERE, 'cast.json')))
os.makedirs(OUT, exist_ok=True)
for f in ('finish.mjs', 'pack.mjs'): shutil.copy(os.path.join(HERE, f), TOOLS)


def sh(*a, cwd=None):
    r = subprocess.run(a, cwd=cwd, capture_output=True, text=True)
    if r.returncode: raise SystemExit(f'failed: {a}\n{r.stdout[-800:]}\n{r.stderr[-800:]}')
    return r.stdout


def fetch(paths):
    sh('git', 'sparse-checkout', 'add', *paths, cwd=RB)
    sh('git', 'checkout', '-q', cwd=RB)


def textures(src_dir, dst):
    os.makedirs(dst, exist_ok=True)
    for t in glob.glob(os.path.join(src_dir, '*.tga')):
        b = os.path.basename(t)[:-4]
        if b.endswith('_specular'): continue
        im = Image.open(t)
        if b.endswith('_opacity_color'):   # RGBA: hair cards, lashes, glasses
            im.convert('RGBA').resize((1024, 1024), Image.LANCZOS).save(os.path.join(dst, b + '.png'), optimize=True)
        elif b.endswith('_normal'):
            im.convert('RGB').resize((512, 512), Image.LANCZOS).save(os.path.join(dst, b + '.jpg'), quality=88)
        else:
            im.convert('RGB').resize((1024, 1024), Image.LANCZOS).save(os.path.join(dst, b + '.jpg'), quality=86)


def avatar(cid, a):
    src = 'Assets/Avatars/' + a['src']; name = os.path.basename(a['src'])
    fetch([f'{src}/Export/{name}.fbx', f'{src}/Textures/*'])
    tmp = os.path.join(work, 'build', cid); os.makedirs(tmp, exist_ok=True)
    sh(FBX2GLTF, '--binary', '--input', os.path.join(RB, src, 'Export', name + '.fbx'), '--output', os.path.join(tmp, 'raw'))
    textures(os.path.join(RB, src, 'Textures'), os.path.join(tmp, 'tex'))
    print(sh('node', 'finish.mjs', os.path.join(tmp, 'raw.glb'), os.path.join(tmp, 'tex'), os.path.join(OUT, cid + '.glb'), cwd=TOOLS).strip())
    # free the big TGAs again
    for t in glob.glob(os.path.join(RB, src, 'Textures', '*.tga')): os.remove(t)


def pack(g):
    tmp = os.path.join(work, 'build', 'anim_' + g); os.makedirs(tmp, exist_ok=True)
    pairs = []
    for clip, pat in CAST['clips'].items():
        sub, base = pat.format(g=g).split('/')
        path = f'Assets/Animations/all_animations_max_motextr_{sub}/{base}.max.fbx'
        fetch([path])
        sh(FBX2GLTF, '--binary', '--input', os.path.join(RB, path), '--output', os.path.join(tmp, clip))
        pairs.append(f'{clip}={os.path.join(tmp, clip + ".glb")}')
    print(sh('node', 'pack.mjs', os.path.join(OUT, f'anim_{g}.glb'), *pairs, cwd=TOOLS).strip())


for cid, a in CAST['avatars'].items():
    if only and cid not in only: continue
    avatar(cid, a)
if not only or 'anim' in only:
    pack('m'); pack('f')


# manifest for the game: every built avatar, its gender's animation pack, the clip names (same as the game's states)
man = {}
for cid, a in CAST['avatars'].items():
    if os.path.exists(os.path.join(OUT, cid + '.glb')):
        man[cid] = {'url': f'assets/characters/real/{cid}.glb', 'real': True, 'anims': f'assets/characters/real/anim_{a["g"]}.glb',
                    'clips': {k: k for k in CAST['clips']}, 'speed': {'walk': 1.0, 'run': 1.0}, 'src': 'Microsoft Rocketbox ' + os.path.basename(a['src'])}
        pp = os.path.join(OUT, 'portraits', cid + '.webp')
        if os.path.exists(pp):
            man[cid]['portrait'] = {'url': f'assets/characters/real/portraits/{cid}.webp', 'cell': [400, 500], 'exprs': ['normal', 'happy', 'worried', 'shock', 'sleepy'], 'head': [80, 30, 240, 240]}
json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1, ensure_ascii=False)
print('manifest:', len(man), 'characters')
