/**
 * Same keying as compare-live.mjs (tag + sorted class list, indexed per key),
 * so a finding's key can be looked up on both sides and the ELEMENT named.
 *
 * node probe-key.mjs <page> <key> <prop...>       e.g. treatments div.container-large#4 margin-left
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import puppeteer from 'puppeteer-core';

// fileURLToPath, not `new URL(...).pathname`: the path contains spaces and the
// URL form percent-encodes them, so every fs call silently misses and the
// local server 404s the page into a blank body.
const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const LOCAL_ROOT = path.resolve(HERE, '../../04-design/.tmp/med-spa/final-site');
// Target follows INSTATIC_BASE_URL like every other script here, so a probe
// run during a staging push does not silently measure production instead.
const REMOTE = (process.env.INSTATIC_BASE_URL || 'https://stone-med-spa-production.up.railway.app').replace(/\/$/, '');
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const [page, wantKey, ...props] = process.argv.slice(2);
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

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'] });

async function look(url) {
  const p = await browser.newPage();
  await p.setViewport({ width, height: 900 });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(url, { waitUntil: 'networkidle0', timeout: 90000 });
  const out = await p.evaluate(
    (want, ps) => {
      const skip = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD', 'svg', 'path', 'circle', 'rect']);
      const seen = new Map();
      for (const el of document.querySelectorAll('body *')) {
        if (skip.has(el.tagName)) continue;
        const cls = (el.className && el.className.toString ? el.className.toString() : '')
          .split(/\s+/).filter(Boolean).filter((c) => !/^(is-|js$)/.test(c)).sort().join('.');
        if (!cls) continue;
        const base = el.tagName.toLowerCase() + '.' + cls;
        const n = seen.get(base) ?? 0;
        seen.set(base, n + 1);
        if (base + '#' + n !== want) continue;
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
          box: [Math.round(r.width), Math.round(r.height), Math.round(r.x), Math.round(r.y + window.scrollY)],
          parent: el.parentElement ? el.parentElement.tagName.toLowerCase() + '.' + el.parentElement.className + ' w=' + Math.round(el.parentElement.getBoundingClientRect().width) : null,
          html: el.outerHTML.slice(0, 160),
          rules,
        };
      }
      return { error: 'key not found: ' + want };
    },
    wantKey, props,
  );
  await p.close();
  return out;
}

const local = await look(`http://127.0.0.1:${port}/${page}.html`);
const live = await look(`${REMOTE}/${page === 'index' ? '' : page}`);
for (const [name, r] of [['LOCAL', local], ['LIVE', live]]) {
  console.log(`\n===== ${name}`);
  if (r.error) { console.log(r.error); continue; }
  console.log('computed:', JSON.stringify(r.computed));
  console.log('box:     ', JSON.stringify(r.box), '  parent:', r.parent);
  console.log('markup:  ', r.html.replace(/\s+/g, ' '));
  for (const x of r.rules) console.log('  ' + x);
}

await browser.close();
server.close();
