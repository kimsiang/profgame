// Headless test harness: serves CDN three.js from node_modules, then runs a scenario file.
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
const NM = new URL("./node_modules/three", import.meta.url).pathname;
const scenario = (await import(path.resolve(process.argv[2]))).default;
const browser = await puppeteer.launch({ executablePath: await chromium.executablePath(), headless: 'shell', pipe: true, protocolTimeout: 900000,
  args: chromium.args, defaultViewport: { width: +(process.env.W || 1280), height: +(process.env.H || 800), deviceScaleFactor: +(process.env.DPR || 1) } });
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.setRequestInterception(true);
const route = (r) => {
  const u = r.url();
  let m = u.match(/three\.js\/r128\/three\.min\.js/);
  if (m) return r.respond({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(NM + '/build/three.min.js') });
  m = u.match(/three@0\.128\.0\/(examples\/js\/.+\.js)/);
  if (m) { const f = NM + '/' + m[1]; return fs.existsSync(f) ? r.respond({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(f) }) : r.respond({ status: 404, body: '' }); }
  if (u.startsWith('http://localhost')) return r.continue();
  return r.respond({ status: 404, body: '' });
};
page.on('request', route); page.__route = route;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try { await scenario({ page, sleep, logs, browser }); }
catch (e) { console.log('SCENARIO ERROR', e.message); }
console.log('--- console ---\n' + logs.filter((l) => !/favicon|Failed to load resource/.test(l)).slice(-25).join('\n'));
await browser.close();
