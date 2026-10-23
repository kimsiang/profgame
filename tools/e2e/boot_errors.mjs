// Prints every page error with its location while the page boots (used for the v13 split).
export default async ({ page, sleep }) => {
  const errs = [];
  page.on('pageerror', (e) => errs.push((e.stack || e.message).split('\n').slice(0, 2).join(' | ')));
  await page.goto(`http://localhost:${process.env.PORT || 8123}/index.html?debug`, { waitUntil: 'load', timeout: 180000 });
  await sleep(4000);
  console.log('BOOT ERRORS ' + errs.length); errs.slice(0, 12).forEach((e) => console.log(' - ' + e.replace(/http:\/\/localhost:\d+\//g, '')));
};
