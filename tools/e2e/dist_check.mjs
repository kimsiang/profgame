// v13.1: the built dist/ boots with no errors and no failed requests (serve dist/ on :8123 first).
export default async ({ page, sleep }) => {
  const errs = [], failed = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().replace(/http:\/\/localhost:\d+\//, '')); });
  await page.goto(`http://localhost:${process.env.PORT || 8123}/index.html?debug`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__prof && window.__prof('CONTENT.ready'), { timeout: 120000 });
  await page.evaluate(() => window.__prof(`(() => { localStorage.clear(); setup.mode = 'basic'; startGame(); return 1; })()`)); await sleep(1500);
  await page.evaluate(() => window.__prof(`beginDay(0, INTENTS[0].id)`)); await sleep(3000);
  const fonts = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight).slice(0, 12));
  console.log('DIST errors', errs.length, errs.slice(0, 3)); console.log('DIST failed requests', failed.length, failed.slice(0, 5)); console.log('DIST fonts loaded', fonts.join(', '));
  console.log('DIST day', JSON.stringify(await page.evaluate(() => window.__prof(`(() => { simulate(120); return { t: S.t, active: activeEvents().length }; })()`))));
};
