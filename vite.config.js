// 导师的一周 / My Advisor's Week — Copyright © 2026 Khaw Kim Siang. All rights reserved. See LICENSE.
// v13.1 build. The game code is still classic scripts sharing the global scope (see DESIGN.md, v13.0), so a small plugin
// concatenates them in page order into one IIFE (the shape the single script had before the cut), and the vendored
// three.js files into another. Vite handles the stylesheets, the fonts and the hashing; assets/ is copied as is.
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = path.dirname(new URL(import.meta.url).pathname);
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
function bundleClassic(tagsRe, name, wrap) {
  let code = null;
  return {
    name: `classic-bundle-${name}`, apply: 'build',
    transformIndexHtml: { order: 'pre', handler(html) {
      const files = [...html.matchAll(tagsRe)].map((m) => m[1]); if (!files.length) return html;
      code = files.map((f) => `// ---- ${f}\n` + fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');
      if (wrap) code = `(function(){\n${code}\n})();\n`;
      const first = html.indexOf(`<script src="${files[0]}"></script>`);
      html = html.replace(tagsRe, '');
      return html.slice(0, first) + `<script src="./${name}.js?v=${version}"></script>\n` + html.slice(first);
    } },
    generateBundle() { if (code !== null) this.emitFile({ type: 'asset', fileName: `${name}.js`, source: code }); },
  };
}
export default defineConfig({
  base: './',
  publicDir: false,
  build: { outDir: 'dist', emptyOutDir: true, assetsInlineLimit: 0, assetsDir: 'build', rollupOptions: { input: 'index.html' } },
  plugins: [
    { name: 'sync-vendor', apply: 'build', buildStart() { execSync('node tools/sync-vendor.mjs', { cwd: root, stdio: 'inherit' }); } },
    bundleClassic(/<script src="(vendor\/(?:three|qrcode)\/[^"]+)"><\/script>\n?/g, 'three', false),
    bundleClassic(/<script src="(src\/[^"]+\.js)"><\/script>\n?/g, 'game', false),
    { name: 'copy-assets', apply: 'build', closeBundle() { fs.cpSync(path.join(root, 'assets'), path.join(root, 'dist', 'assets'), { recursive: true }); for (const f of ['LICENSE', 'THIRD-PARTY-NOTICES.md']) fs.copyFileSync(path.join(root, f), path.join(root, 'dist', f)); } },
  ],
});
