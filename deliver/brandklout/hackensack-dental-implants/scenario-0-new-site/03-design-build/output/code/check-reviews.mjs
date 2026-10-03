// Client script, 2026-10-02. Renders the Google reviews widget on the live page the way a visitor
// sees it (scrolled to #reviews: it boots only near the viewport) and reads its shadow root for the
// listing's rating, count and first reviewers. Read-only.
// Usage (from the step folder): node output/code/check-reviews.mjs [url] > output/check-reviews.txt
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(path.resolve(process.cwd(), '../../scenario-1-migration/01-old-site-capture/scripts/package.json'));
const puppeteer = require('puppeteer-core');
const URL_ = (process.argv[2] || 'https://hackensack-dental-implants-staging.up.railway.app').replace(/\/$/, '') + '/';
const WIDGET = '948f2cd1-3863-46db-a63b-689bfc31ace0';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let failed = 0;
const say = (ok, name, detail = '') => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
for (const [w, h] of [[1512, 735], [390, 844]]) {
  const pg = await browser.newPage();
  await pg.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36');
  await pg.setViewport({ width: w, height: h, isMobile: w < 500, hasTouch: w < 500 });
  await pg.goto(URL_, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3000);
  await pg.evaluate(() => { const el = document.querySelector('#reviews'); if (window.WZ && WZ.smoother) WZ.smoother.scrollTo(el, false, 'top 10%'); else window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60); });
  let r = null;
  for (let i = 0; i < 20; i++) {
    await sleep(1000);
    r = await pg.evaluate((id) => {
      const mount = document.querySelector('.elfsight-app-' + id);
      const old = document.querySelectorAll('.elfsight-app-cf96ca10-8feb-4ac7-8668-ddf398e0f61f').length;
      if (!mount) return { mount: false, old };
      const hosts = [mount, ...mount.querySelectorAll('*')].filter((e) => e.shadowRoot);
      const text = (hosts.map((e) => e.shadowRoot.textContent).join(' ') + ' ' + mount.textContent).replace(/\s+/g, ' ').trim();
      return { mount: true, old, height: Math.round(mount.getBoundingClientRect().height), text: text.slice(0, 400) };
    }, WIDGET);
    if (r.mount && r.height > 100 && /review/i.test(r.text)) break;
  }
  say(r.mount && r.old === 0, `${w}: only the new widget (${WIDGET.slice(0, 8)}) is on the page`, JSON.stringify({ mount: r.mount, old: r.old }));
  say(r.mount && r.height > 100 && /5\.0/.test(r.text) && !/1,104|1104/.test(r.text), `${w}: it renders the office listing (5.0), not the 1,104-review host listing`, `${r.height}px | ${r.text}`);
  await pg.close();
}
await browser.close();
console.log(failed ? `\n${failed} FAILED` : '\nall passed');
process.exitCode = failed ? 1 : 0;
