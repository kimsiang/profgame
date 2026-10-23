// v13.1: copies the third-party files the page loads from node_modules into vendor/ (git-ignored), so the game
// needs no CDN and no Google Fonts: three.js r128 + the examples modules, and the fonts as self-hosted woff2 subsets.
// Run after `npm install` (the build runs it too): node tools/sync-vendor.mjs
import fs from 'fs';
import path from 'path';
const root = new URL('../', import.meta.url).pathname, nm = path.join(root, 'node_modules'), out = path.join(root, 'vendor');
fs.rmSync(path.join(out, 'fonts'), { recursive: true, force: true });   // vendor/three is tracked in git (so the raw repo still runs); vendor/fonts is generated
// three.js: the same files the page used to load from cdnjs / jsDelivr, in the same order
const THREE = ['build/three.min.js', 'examples/js/utils/BufferGeometryUtils.js', 'examples/js/shaders/CopyShader.js', 'examples/js/shaders/LuminosityHighPassShader.js', 'examples/js/shaders/SSAOShader.js', 'examples/js/shaders/SMAAShader.js', 'examples/js/shaders/HorizontalTiltShiftShader.js', 'examples/js/shaders/VerticalTiltShiftShader.js', 'examples/js/shaders/BokehShader.js', 'examples/js/postprocessing/EffectComposer.js', 'examples/js/postprocessing/RenderPass.js', 'examples/js/postprocessing/ShaderPass.js', 'examples/js/postprocessing/UnrealBloomPass.js', 'examples/js/postprocessing/SSAOPass.js', 'examples/js/postprocessing/SMAAPass.js', 'examples/js/postprocessing/BokehPass.js', 'examples/js/loaders/GLTFLoader.js', 'examples/js/loaders/RGBELoader.js', 'examples/js/math/SimplexNoise.js', 'examples/js/geometries/RoundedBoxGeometry.js', 'examples/js/environments/RoomEnvironment.js', 'examples/js/utils/SkeletonUtils.js'];
for (const f of THREE) { const d = path.join(out, 'three', f); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(nm, 'three', f), d); }
fs.copyFileSync(path.join(nm, 'three', 'LICENSE'), path.join(out, 'three', 'LICENSE'));
// fonts: only the weights the stylesheet uses; woff2 only; CJK stays split by unicode-range so a page fetches only the chunks it shows
const FONTS = { inter: [300, 400, 600, 700], 'playfair-display': [700, 900], 'jetbrains-mono': [500, 700], rajdhani: [600, 700], 'noto-serif-sc': [600, 900] };
let css = '/* self-hosted fonts (SIL OFL 1.1), copied from @fontsource by tools/sync-vendor.mjs */\n';
fs.mkdirSync(path.join(out, 'fonts', 'files'), { recursive: true });
for (const [pkg, weights] of Object.entries(FONTS)) {
  for (const w of weights) {
    const src = fs.readFileSync(path.join(nm, '@fontsource', pkg, `${w}.css`), 'utf8');
    // keep the latin, latin-ext and (numbered) CJK chunks only — no cyrillic / greek / vietnamese / devanagari; woff2 only
    const keep = (name) => /-(latin|latin-ext|\d+)-/.test(name);
    const faces = src.split(/\n(?=\/\* )/).filter((blk) => { const m = blk.match(/files\/([^)]*\.woff2)/); return m && keep(m[1]); });
    css += faces.map((blk) => blk.replace(/,\s*url\([^)]*\.woff\) format\('woff'\)/g, '')).join('\n') + '\n';
    for (const f of fs.readdirSync(path.join(nm, '@fontsource', pkg, 'files'))) if (f.endsWith(`-${w}-normal.woff2`) && keep(f)) fs.copyFileSync(path.join(nm, '@fontsource', pkg, 'files', f), path.join(out, 'fonts', 'files', f));
  }
  const lic = path.join(nm, '@fontsource', pkg, 'LICENSE'); if (fs.existsSync(lic)) fs.copyFileSync(lic, path.join(out, 'fonts', `LICENSE-${pkg}`));
}
fs.writeFileSync(path.join(out, 'fonts', 'fonts.css'), css);
const size = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? size(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
console.log(`vendor/three ${(size(path.join(out, 'three')) / 1e6).toFixed(1)} MB, vendor/fonts ${(size(path.join(out, 'fonts')) / 1e6).toFixed(1)} MB`);
