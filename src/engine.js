/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* v12 balance harness: with ?sim in the URL nothing renders and screens switch instantly; tools/balance drives the week through window.__sim. */
const SIM = /[?&]sim\b/.test(location.search);
/* =========================================================
   ENGINE — renderer, camera, image-based lighting, sky,
   post-processing (SSAO · bloom · tilt-shift · grade · SMAA)
   ========================================================= */
const CELL = 0.5;
let W = 40, D = 26, GW = 80, GD = 52, grid = new Uint8Array(GW * GD);
/* zones: every floor / outdoor area is its own group with its own collision grid */
const ZONES = {};
let Z = null;
function beginZone(id, o) {
  const z = Object.assign({ id, W: 40, D: 26, name: id, floor: 0, outdoor: false, rooms: {}, portals: [], spawn: { x: 20, z: 13 }, lamps: [], pools: [], balls: [], npcs: [], anims: [] }, o);
  z.GW = z.W / CELL; z.GD = z.D / CELL; z.grid = new Uint8Array(z.GW * z.GD);
  z.group = new THREE.Group(); z.group.visible = false; z.group.name = 'zone-' + id; scene.add(z.group);
  ZONES[id] = z; useZone(z); return z;
}
function useZone(z) { Z = z; W = z.W; D = z.D; GW = z.GW; GD = z.GD; grid = z.grid; }
function setZone(id) {
  if (Z && Z.id === id) return Z;
  Object.values(ZONES).forEach(z => { z.group.visible = false; });
  useZone(ZONES[id]); Z.group.visible = true;
  if (typeof onZoneChange === 'function') onZoneChange(Z);
  return Z;
}
const HAS_POST = !!(THREE.EffectComposer && THREE.RenderPass && THREE.ShaderPass && THREE.UnrealBloomPass);
const IS_TOUCH = matchMedia('(pointer:coarse)').matches;
// v11.1: art style (default 'diorama' since v12.3.5). 'real' = real materials, HDRI light and the Rocketbox cast (v11); 'diorama' = the stylised v10 look
// (chibi cast, procedural floors, cyan trim). Chosen on the title page or the top bar; reloads like the quality setting.
const ART = (() => { try { const a = localStorage.getItem('prof-art'); if (a === 'real' || a === 'diorama') return a; } catch (e) { /* storage blocked */ } return 'diorama'; })();   // v12.3.5: diorama is the default; a saved choice still wins
const REAL = ART === 'real';
function setArt(a) { try { localStorage.setItem('prof-art', a); } catch (e) { /* storage blocked */ } location.reload(); }
let QUALITY = (() => { try { const q = localStorage.getItem('prof-day-q'); if (q) return q; } catch (e) { /* storage blocked */ } return IS_TOUCH || innerWidth < 900 ? 'mid' : 'high'; })();
if (!HAS_POST && QUALITY !== 'low') QUALITY = 'low';

const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: QUALITY === 'low', powerPreference: 'high-performance' });
// v10.4: sharp everywhere. Supersample even on 1× screens (the composer has no MSAA); if the game runs below ~45 fps it drops
// back to the old pixel ratios for the rest of the session (see the monitor in frame()).
let PR_BOOST = QUALITY !== 'low';
const PR = () => { const d = window.devicePixelRatio || 1;
  if (PR_BOOST) return QUALITY === 'high' ? (d < 1.5 ? 1.5 : Math.min(d, 2)) : QUALITY === 'mid' ? (d < 1.25 ? 1.25 : Math.min(d, 1.5)) : Math.min(d, 1.5);
  return Math.min(d, QUALITY === 'high' ? 1.75 : QUALITY === 'mid' ? 1.3 : 1.25); };
renderer.setPixelRatio(PR());
renderer.shadowMap.enabled = QUALITY !== 'low';
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = QUALITY === 'low' ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = false;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#0b2a40', 90, 330);

/* image-based lighting from a neutral studio room */
if (THREE.RoomEnvironment) {
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  pm.dispose();
}
/* v11.0: real image-based lighting from Poly Haven HDRIs (CC0): an office interior indoors, a partly cloudy sky outdoors.
   The studio room above stays until they load, and if they cannot. setEnvFor(zone) is called on every zone change. */
const ENV = { room: scene.environment, hdr: {}, want: 'indoor' };
function envLoad(key, file) {
  if (ENV.hdr[key] !== undefined || !THREE.RGBELoader) return;
  ENV.hdr[key] = null;
  new THREE.RGBELoader().setDataType(THREE.UnsignedByteType).load('assets/textures/' + file, (t) => {
    const pm = new THREE.PMREMGenerator(renderer); ENV.hdr[key] = pm.fromEquirectangular(t).texture; pm.dispose(); t.dispose();
    if (ENV.want === key) { if (REAL) scene.environment = ENV.hdr[key]; cityEnv(); }
  }, undefined, () => { /* keep the studio room */ });
}
// v12.3.6: the diorama keeps the studio room for its own rooms, but the skyline and the campus facades reflect the same
// HDRIs as the realistic look, so both styles share one background (the white studio room washed the towers out to a pale grey).
function cityEnv() {
  if (REAL) return;
  let list; try { list = city; } catch (e) { return; }   // skyline not built yet
  const put = (m, env) => { if (m && m.envMap !== env) { m.envMap = env; m.needsUpdate = true; } };
  const env = ENV.hdr[ENV.want] || null;
  list.forEach(b => put(b.material, env));
  // v11.4 campus facades (physics building, gym, neighbours) stand outdoors: they reflect the sky HDRI, as in 写实
  let fac; try { fac = FACADES; } catch (e) { return; }
  const sky = ENV.hdr.outdoor || null;
  fac.forEach(f => f.group && f.group.traverse(n => { if (n.isMesh || n.isInstancedMesh) [].concat(n.material).forEach(m => put(m, sky)); }));
}
function setEnvFor(z) { const k = z && z.outdoor ? 'outdoor' : 'indoor'; ENV.want = k; if (REAL) scene.environment = ENV.hdr[k] || ENV.room; cityEnv(); }
envLoad('indoor', 'blender_institute_1k.hdr'); envLoad('outdoor', 'kloofendal_48d_partly_cloudy_puresky_1k.hdr');   // both styles: the skyline uses them

/* ---------- camera (perspective, orbit around the player) ---------- */
const cam = new THREE.PerspectiveCamera(30, 1, 1, 900);
const camState = {
  target: new THREE.Vector3(20, 0, 13), az: Math.PI / 4, wantAz: Math.PI / 4,
  el: 0.9, wantEl: 0.9, dist: 70, wantDist: 70, followDist: IS_TOUCH ? 23 : 19, overview: false, orbit: 0, cine: null, lift: 0,
};
function camBasis() {
  return { right: new THREE.Vector3(Math.cos(camState.az), 0, -Math.sin(camState.az)), fwd: new THREE.Vector3(-Math.sin(camState.az), 0, -Math.cos(camState.az)) };
}
function placeCamera() {
  const a = camState.az, e = camState.el, d = camState.dist;
  cam.position.set(camState.target.x + Math.sin(a) * Math.cos(e) * d, camState.target.y + Math.sin(e) * d, camState.target.z + Math.cos(a) * Math.cos(e) * d);
  cam.lookAt(camState.target);
}

/* ---------- lights ---------- */
const hemi = new THREE.HemisphereLight('#e4f1ff', '#2a3442', 0.45);
const amb = new THREE.AmbientLight('#8fa8d8', 0.12);
const sun = new THREE.DirectionalLight('#fff1dc', 1.2);
sun.castShadow = QUALITY !== 'low';
sun.shadow.mapSize.set(QUALITY === 'high' ? 2048 : 1024, QUALITY === 'high' ? 2048 : 1024);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 20, bottom: -20, near: 1, far: 140 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 3;
scene.add(hemi, amb, sun, sun.target);
// v10.4: a denser shadow map while the game runs sharp (high 4096², mid 2048²); back to 2048² / 1024² if it falls back.
const sharpFps = { n: 0, s: 0 };
function sharpShadows(hi) {
  if (QUALITY === 'low') return;
  const n = hi ? (QUALITY === 'high' ? 4096 : 2048) : (QUALITY === 'high' ? 2048 : 1024);
  if (sun.shadow.mapSize.x === n) return;
  sun.shadow.mapSize.set(n, n); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; }
}
sharpShadows(PR_BOOST);

/* ---------- material helpers ---------- */
const matCache = {};
function mat(color, o = {}) {
  const key = color + JSON.stringify(o);
  if (!matCache[key]) matCache[key] = new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.62, metalness: 0.02, envMapIntensity: 0.25 }, o));
  return matCache[key];
}
/* HDR emissive: intensity > 1 feeds the bloom pass */
function glow(color, intensity = 2.2, opacity = 1) {
  const m = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false, fog: false });
  m.color.multiplyScalar(intensity); return m;
}
// v10.4: canvas textures are drawn at 2× (high) / 1.5× (mid) of their logical size. The 2D context keeps the scale, so draw
// code and later redraws (screens, LEDs, slides) keep using logical coordinates. Capped at 4096 px.
const TEX_SS = QUALITY === 'high' ? 2 : QUALITY === 'mid' ? 1.5 : 1;
const MAX_ANISO = Math.min(16, renderer.capabilities.getMaxAnisotropy() || 8);
function canvasTex(w, h, draw, srgb = true) {
  const k = Math.min(TEX_SS, 4096 / Math.max(w, h)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  const g = c.getContext('2d'); g.scale(c.width / w, c.height / h);
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.encoding = THREE.sRGBEncoding;
  t.anisotropy = MAX_ANISO; t.userData = t.userData || {}; t.userData.canvas = c;
  return t;
}
const CN_FONT = '"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif';
const radialTex = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }, false);
const softDot = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }, false);
const beamTex = canvasTex(4, 128, (g) => { const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.75, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,.9)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); }, false);

/* ---------- sky dome + stars ---------- */
const skyUni = { top: { value: new THREE.Color('#1c5a8c') }, mid: { value: new THREE.Color('#7fb4d8') }, bot: { value: new THREE.Color('#0a2236') } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyUni, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 mid; uniform vec3 bot; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, pow(h, 0.55)) : mix(mid, bot, pow(-h, 0.4)); gl_FragColor = vec4(c, 1.0); }',
}));
scene.add(sky);
const starGeo = new THREE.BufferGeometry(); const sp = [];
for (let i = 0; i < 900; i++) { const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 0.9 + 0.08); sp.push(Math.sin(ph) * Math.cos(th) * 560, Math.cos(ph) * 560, Math.sin(ph) * Math.sin(th) * 560); }
starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#dff1ff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
scene.add(stars);

/* ---------- post-processing ---------- */
const post = { composer: null, bloom: null, ssao: null, tiltH: null, tiltV: null, grade: null, smaa: null, bokeh: null };
const GradeShader = {
  uniforms: { tDiffuse: { value: null }, exposure: { value: 1.0 }, vig: { value: 0.55 }, sat: { value: 1.08 }, contrast: { value: 1.05 }, tint: { value: new THREE.Vector3(1, 1, 1) }, time: { value: 0 }, grain: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float exposure, vig, sat, contrast, time, grain; uniform vec3 tint; varying vec2 vUv;
  void main(){
    vec3 c = texture2D(tDiffuse, vUv).rgb * exposure;
    c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
    c = clamp(c, 0.0, 1.0);
    c = pow(c, vec3(1.0 / 2.2));
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(l), c, sat);
    c = (c - 0.5) * contrast + 0.5;
    c *= tint;
    vec2 d = vUv - 0.5; c *= 1.0 - vig * dot(d, d) * 1.5;
    c += (fract(sin(dot(vUv * 913.0 + time, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * grain;
    gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
  }`,
};
function buildPost() {
  post.composer = null;
  if (QUALITY === 'low' || !HAS_POST) return;
  const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight, pr = PR();
  // stencilBuffer: true is how r128 gets a 24-bit depth buffer (DEPTH_STENCIL); without it render targets get DEPTH_COMPONENT16,
  // which at our camera distance cannot separate floor layers a few millimetres apart, so the tiles flickered.
  const rt = new THREE.WebGLRenderTarget(w * pr, h * pr, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, stencilBuffer: true });
  const c = new THREE.EffectComposer(renderer, rt);
  c.setPixelRatio(pr); c.setSize(w, h);
  if (QUALITY === 'high' && THREE.SSAOPass && THREE.SimplexNoise) {
    const s = new THREE.SSAOPass(scene, cam, w, h);
    s.beautyRenderTarget.texture.type = THREE.HalfFloatType; s.beautyRenderTarget.stencilBuffer = true;   // 24-bit depth, as above
    s.kernelRadius = 0.55; s.minDistance = 0.0006; s.maxDistance = 0.02;
    c.addPass(s); post.ssao = s;
  } else c.addPass(new THREE.RenderPass(scene, cam));
  post.bloom = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), 0.6, 0.45, 1.6);
  c.addPass(post.bloom);
  // v7: depth of field for the dialogue camera (two-shot); off while walking so the diorama stays crisp.
  if (THREE.BokehPass) { post.bokeh = new THREE.BokehPass(scene, cam, { focus: 12, aperture: 0.0018, maxblur: 0.012, width: w, height: h }); post.bokeh.enabled = false; c.addPass(post.bokeh); }
  if (THREE.HorizontalTiltShiftShader && THREE.VerticalTiltShiftShader) {
    post.tiltH = new THREE.ShaderPass(THREE.HorizontalTiltShiftShader); post.tiltV = new THREE.ShaderPass(THREE.VerticalTiltShiftShader);
    c.addPass(post.tiltH); c.addPass(post.tiltV);
  }
  post.grade = new THREE.ShaderPass(GradeShader); c.addPass(post.grade);
  if (QUALITY === 'high' && THREE.SMAAPass) { post.smaa = new THREE.SMAAPass(w * pr, h * pr); c.addPass(post.smaa); }
  post.composer = c;
}
function setQuality(q) {
  QUALITY = q; try { localStorage.setItem('prof-day-q', q); } catch (e) { /* storage blocked */ }
  location.reload();
}
const onResizeHooks = [];
let lastSize = '';
function resize() {
  const w = stage.clientWidth || innerWidth, h = stage.clientHeight || innerHeight, pr = PR(), key = w + 'x' + h + '@' + pr;
  if (key === lastSize) return; lastSize = key;
  renderer.setPixelRatio(pr); renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  if (post.composer) {
    post.composer.setPixelRatio(pr); post.composer.setSize(w, h);
    if (post.ssao) post.ssao.setSize(w * PR(), h * PR());
  }
  onResizeHooks.forEach(f => f(w, h));
}
addEventListener('resize', resize);
function renderFrame(tsec, tilt) {
  if (post.composer) {
    const h = stage.clientHeight || innerHeight, w = stage.clientWidth || innerWidth;
    if (post.tiltH) { post.tiltH.uniforms.h.value = tilt / w; post.tiltV.uniforms.v.value = tilt / h; post.tiltH.uniforms.r.value = post.tiltV.uniforms.r.value = 0.52; }
    if (post.bokeh) { const on = !!camState.cine; post.bokeh.enabled = on; if (on) { post.bokeh.uniforms.focus.value = camState.dist; post.bokeh.uniforms.aperture.value = 0.0022; } }
    post.grade.uniforms.time.value = tsec % 100;
    post.composer.render();
  } else renderer.render(scene, cam);
}
