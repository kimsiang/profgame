# 导师的一周 / My Advisor's Week

## 开发 / Development (v13.1)
```
npm install            # three.js r128 and the fonts come from npm; no CDN, no Google Fonts
npm run sync-vendor    # copies them into vendor/ (git-ignored) for the source tree
python3 -m http.server 8123   # then open http://localhost:8123/index.html — the source tree runs as is
npm run build          # Vite → dist/ (one game.js, one three.js, hashed CSS and fonts, assets/ copied)
```
`main` is built and published by `.github/workflows/pages.yml` (Settings → Pages → Source: GitHub Actions). Tests: `tools/e2e/` (`node run.mjs <scenario>.mjs` against :8123), `node tools/validate-data.mjs`, `npm run balance`.

## 版权 / Copyright
© 2026 许金祥 Khaw Kim Siang. 保留所有权利。本仓库公开仅为托管与演示，不构成任何许可；详见 [LICENSE](LICENSE)。第三方组件及其许可见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。
