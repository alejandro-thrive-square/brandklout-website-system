/** node probe-sel.mjs <page> "<css selector>" <index> <prop...>  — with the rules that set them. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import puppeteer from 'puppeteer-core';

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const LOCAL_ROOT = path.resolve(HERE, '../../04-design/.tmp/med-spa/final-site');
// Target follows INSTATIC_BASE_URL like every other script here, so a probe
// run during a staging push does not silently measure production instead.
const REMOTE = (process.env.INSTATIC_BASE_URL || 'https://stone-med-spa-production.up.railway.app').replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [page, selector, idxRaw, ...props] = process.argv.slice(2);
const idx = Number(idxRaw);
const width = Number(process.env.W || 1440);

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const f = path.join(LOCAL_ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 300000, args: ['--no-sandbox', '--hide-scrollbars'] });

async function look(u) {
  const p = await browser.newPage();
  await p.setViewport({ width, height: 1000 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(u, { waitUntil: 'networkidle0', timeout: 120000 });
  await p.evaluate(async () => {
    await new Promise((r) => { let y = 0; const t = setInterval(() => { window.scrollBy(0, 700); y += 700; if (y > document.body.scrollHeight) { clearInterval(t); r(); } }, 25); });
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 3000));
  const out = await p.evaluate((sel, i, ps) => {
    const el = document.querySelectorAll(sel)[i];
    if (!el) return { error: 'no element for ' + sel + '#' + i };
    const cs = getComputedStyle(el);
    const rules = [];
    for (const sheet of document.styleSheets) {
      let list; try { list = sheet.cssRules; } catch { continue; }
      const walk = (rs, cond) => {
        for (const r of rs) {
          if (r.cssRules) { walk(r.cssRules, (cond ? cond + ' & ' : '') + (r.conditionText ?? r.media?.mediaText ?? '@')); continue; }
          if (!r.selectorText) continue;
          let m = false; try { m = el.matches(r.selectorText); } catch { continue; }
          if (!m) continue;
          for (const prop of ps) { const v = r.style.getPropertyValue(prop); if (v) rules.push(`${(sheet.href ?? 'inline').split('/').pop()}${cond ? ' @' + cond : ''}  {${r.selectorText}}  ${prop}: ${v}`); }
        }
      };
      walk(list, '');
    }
    const r = el.getBoundingClientRect();
    return {
      computed: Object.fromEntries(ps.map((k) => [k, cs.getPropertyValue(k)])),
      box: [Math.round(r.width), Math.round(r.height)],
      natural: el.tagName === 'IMG' ? [el.naturalWidth, el.naturalHeight, el.complete, el.currentSrc.split('/').pop()] : null,
      rules,
    };
  }, selector, idx, props);
  await p.close();
  return out;
}

for (const [name, u] of [['LOCAL', `http://127.0.0.1:${port}/${page}.html`], ['LIVE', `${REMOTE}/${page === 'index' ? '' : page}`]]) {
  const r = await look(u);
  console.log(`\n===== ${name}`);
  if (r.error) { console.log(r.error); continue; }
  console.log('computed:', JSON.stringify(r.computed));
  console.log('box:     ', JSON.stringify(r.box), ' natural:', JSON.stringify(r.natural));
  for (const x of r.rules) console.log('  ' + x);
}
await browser.close();
server.close();
