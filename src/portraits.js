/* 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
   v13.0: this file is one section of what was a single script in index.html; the files load in order and share the global scope. */
'use strict';
/* =========================================================
   PORTRAITS — a second tiny renderer paints character busts
   ========================================================= */
const portrait = (() => {
  let r = null; const cache = {};
  const pScene = new THREE.Scene();
  pScene.add(new THREE.HemisphereLight('#dfeaff', '#3a4a60', 0.3));
  const key = new THREE.DirectionalLight('#fff1e0', 0.85); key.position.set(1.2, 2, 2.4); pScene.add(key);
  const rim = new THREE.DirectionalLight('#5cc8ff', 0.9); rim.position.set(-2, 1.5, -2); pScene.add(rim);
  const pc = new THREE.PerspectiveCamera(24, 0.8, 0.1, 20);
  const cv = document.createElement('canvas');
  function fromAtlas(A, expr, framing) {
    const p = A.p, i = Math.max(0, p.exprs.indexOf(expr === 'blink' ? 'normal' : expr)), [cw, ch] = p.cell;
    if (framing === 'bust') { cv.width = cw; cv.height = ch; const g = cv.getContext('2d'); g.clearRect(0, 0, cw, ch); g.drawImage(A.img, i * cw, 0, cw, ch, 0, 0, cw, ch); }
    else { const [hx, hy, hw, hh] = p.head; cv.width = cv.height = 256; const g = cv.getContext('2d'); g.clearRect(0, 0, 256, 256); g.drawImage(A.img, i * cw + hx, hy, hw, hh, 0, 0, 256, 256); }
    return cv.toDataURL('image/png');
  }
  return function (look, expr = 'normal', framing = 'bust') {
    const A = look && look._id && PORTRAIT_IMG[look._id];
    const k = JSON.stringify(look) + expr + framing + (A ? 'A' : ''); if (cache[k]) return cache[k];
    if (A) { try { cache[k] = fromAtlas(A, expr, framing); return cache[k]; } catch (e) { /* tainted or broken: fall through */ } }
    try {
      if (!r) { r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); r.outputEncoding = THREE.sRGBEncoding; r.setPixelRatio(1); }
      const W2 = framing === 'bust' ? 400 : 256, H2 = framing === 'bust' ? 500 : 256; r.setSize(W2, H2, false); pc.aspect = W2 / H2; pc.updateProjectionMatrix();
      const c = makeChar(Object.assign({}, look, { label: null, portrait: true }), pScene); setExpr(c, expr); c.rotation.y = -0.28;
      if (look.mic) c.userData.P.shR.rotation.x = -1.2;
      if (framing === 'bust') { pc.position.set(0.0, 1.12, 3.0); pc.lookAt(0, 1.0, 0); } else { pc.position.set(0, 1.22, 1.55); pc.lookAt(0, 1.18, 0); }
      r.render(pScene, pc);
      cache[k] = r.domElement.toDataURL('image/png');
      pScene.remove(c);
    } catch (e) { cache[k] = ''; }
    return cache[k];
  };
})();
