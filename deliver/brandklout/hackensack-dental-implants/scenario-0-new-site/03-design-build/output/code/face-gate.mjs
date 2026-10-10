// Client script, 2026-10-09. The face gate: no head is ever cut, at rest or while the page moves.
// For every photograph with a face, it takes the head of each subject (site-src/js/01-faces.js, the
// list code/faces.py writes and the runtime itself reads), maps it through the image's object-fit / object-position
// and every transform (zoom, drift, pins), and intersects it with everything that clips the photo:
// frames with overflow hidden (their rounded corners too) and clip-path wipes, irises and insets.
// It samples each page with motion ON: during the arrival (0.3 to 3 s after load), then scrolling down
// in steps of 40% of the window, so scroll-scrubbed drift and mid-wipe reveals are seen, not only the
// settled crop (reduced-motion screenshots cannot see a cut that only happens while scrolling).
// A head must stay at least 98% visible in every sample where its photo is on screen and not hidden.
// Usage (from the step's output/ folder; never pipe Node on Windows):
//   node code/face-gate.mjs [slug ...] [--widths 1440,1100,820,390] [--base https://staging] > face-gate.txt
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..');
const DIST = path.join(here, 'site-src', 'dist');
const FACES_JS = fs.readFileSync(path.join(here, 'site-src', 'js', '01-faces.js'), 'utf8');
const subjects = JSON.parse(FACES_JS.slice(FACES_JS.indexOf('{'), FACES_JS.lastIndexOf('}') + 1));
const require = createRequire(path.resolve(OUT, '../../../scenario-1-migration/01-old-site-capture/scripts/package.json'));
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const take = (flag) => { const i = argv.indexOf(flag); return i >= 0 ? argv.splice(i, 2)[1] : null; };
const WIDTHS = (take('--widths') || '1440,1100,820,390').split(',').map(Number);
const BASE_ARG = take('--base');
const PASS = 0.98;


const walk = (d, pre = '') => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (/^(assets|media|fonts)$/.test(e.name) ? [] : walk(path.join(d, e.name), pre + e.name + '/')) : e.name.endsWith('.html') ? [pre + e.name.slice(0, -5)] : []);
const slugs = argv.length ? argv : walk(DIST).sort();
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index';
  let f = path.join(DIST, p);
  if (!path.extname(f)) f += '.html';
  if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = BASE_ARG || `http://127.0.0.1:${server.address().port}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* runs in the page: every photo with a subject on screen -> worst visible share of each head */
function measure(subjects) {
  const vw = innerWidth, vh = innerHeight;
  const out = [];
  const num = (v, size) => (/%$/.test(v) ? (parseFloat(v) / 100) * size : parseFloat(v) || 0);
  const posOf = (v) => ({ left: '0%', center: '50%', right: '100%', top: '0%', bottom: '100%' }[v] || v);
  const clipsOf = (img) => {
    const clips = [];
    for (let n = img; n && n !== document.body; n = n.parentElement) {
      /* the smooth-scroll wrappers clip only at the window's edge, which is not a cut */
      if (n.id === 'smooth-wrapper' || n.id === 'smooth-content') continue;
      const cs = getComputedStyle(n);
      const r = n.getBoundingClientRect();
      const k = n.offsetWidth ? r.width / n.offsetWidth : 1;
      /* a frame that hides its overflow, or the photo's own rounded corners */
      if (n === img ? parseFloat(cs.borderTopLeftRadius) > 0 || parseFloat(cs.borderTopRightRadius) > 0 : (cs.overflowX !== 'visible' || cs.overflowY !== 'visible')) {
        const rad = (p) => cs[p].split(' ').map((v) => num(v, r.width) * k);
        clips.push({ kind: 'frame ' + (n.className && n.className.split ? n.className.split(' ')[0] : n.tagName), l: r.left, t: r.top, r: r.right, b: r.bottom, rad: [rad('borderTopLeftRadius'), rad('borderTopRightRadius'), rad('borderBottomRightRadius'), rad('borderBottomLeftRadius')] });
      }
      const cp = cs.clipPath;
      if (cp && cp !== 'none') {
        let m = cp.match(/^inset\(([^)]*)\)/);
        if (m) {
          const parts = m[1].split(/\s+round\s+/)[0].trim().split(/\s+/);
          const [t, rr = t, b = t, l = rr] = parts;
          clips.push({ kind: 'clip-path ' + cp.slice(0, 40), l: r.left + num(l, r.width), t: r.top + num(t, r.height), r: r.right - num(rr, r.width), b: r.bottom - num(b, r.height), rad: [[0], [0], [0], [0]] });
        }
        m = cp.match(/^circle\(([^ ]+) at ([^ ]+) ([^ )]+)\)/);
        if (m) clips.push({ kind: 'clip-path circle', cx: r.left + num(m[2], r.width), cy: r.top + num(m[3], r.height), cr: num(m[1], Math.hypot(r.width, r.height) / Math.SQRT2) });
      }
    }
    return clips;
  };
  const inside = (x, y, c) => {
    if (c.cr !== undefined) return Math.hypot(x - c.cx, y - c.cy) <= c.cr + 0.5;
    if (x < c.l - 0.5 || x > c.r + 0.5 || y < c.t - 0.5 || y > c.b + 0.5) return false;
    const corners = [[c.l, c.t, c.rad[0], 1, 1], [c.r, c.t, c.rad[1], -1, 1], [c.r, c.b, c.rad[2], -1, -1], [c.l, c.b, c.rad[3], 1, -1]];
    for (const [cx0, cy0, rad, sx, sy] of corners) {
      const rx = rad[0] || 0, ry = rad.length > 1 ? rad[1] : rx;
      if (!rx || !ry) continue;
      const ox = cx0 + sx * rx, oy = cy0 + sy * ry;
      if ((x - ox) * sx < 0 && (y - oy) * sy < 0 && ((x - ox) / rx) ** 2 + ((y - oy) / ry) ** 2 > 1.0001) return false;
    }
    return true;
  };
  for (const img of document.querySelectorAll('img')) {
    /* the runtime's own key: Instatic serves /uploads/<21-character id>-<name>[-w<width>].webp */
    const src = (img.currentSrc || img.getAttribute('src') || '').split('?')[0];
    let stem = src.slice(src.lastIndexOf('/') + 1).replace(/\.[a-z0-9]+$/i, '');
    if (src.includes('/uploads/')) stem = stem.slice(22).replace(/-w\d+$/, '');
    if (!subjects[stem]) continue;
    if (!img.complete || !img.naturalWidth) continue;
    const r = img.getBoundingClientRect();
    if (r.width < 8 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
    let hidden = false;
    for (let n = img; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) { hidden = true; break; } }
    if (hidden) continue;
    const cs = getComputedStyle(img);
    const ow = img.offsetWidth, oh = img.offsetHeight, k = r.width / ow;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    let dw = ow, dh = oh;
    if (cs.objectFit === 'cover' || cs.objectFit === 'contain') { const s = (cs.objectFit === 'cover' ? Math.max : Math.min)(ow / nw, oh / nh); dw = nw * s; dh = nh * s; }
    const [px = '50%', py = '50%'] = cs.objectPosition.split(/\s+/).map(posOf);
    const ox = /%$/.test(px) ? (ow - dw) * parseFloat(px) / 100 : parseFloat(px);
    const oy = /%$/.test(py) ? (oh - dh) * parseFloat(py) / 100 : parseFloat(py);
    const clips = clipsOf(img);
    clips.push({ kind: 'image edge', l: r.left, t: r.top, r: r.right, b: r.bottom, rad: [[0], [0], [0], [0]] });
    subjects[stem].forEach(([hx, hy, hw, hh], i) => {
      let seen = 0, total = 0;
      const cut = {};
      for (let a = 0; a <= 8; a++) for (let b = 0; b <= 8; b++) {
        const fx = hx + (hw * a) / 8, fy = hy + (hh * b) / 8;
        const x = r.left + (ox + Math.min(1, Math.max(0, fx)) * dw) * k, y = r.top + (oy + Math.min(1, Math.max(0, fy)) * dh) * k;
        total++;
        /* a head running off the photo itself (hair above the top edge) is cut in the photograph */
        if (fx < 0 || fx > 1 || fy < 0 || fy > 1) { cut['the photograph itself (no headroom)'] = (cut['the photograph itself (no headroom)'] || 0) + 1; continue; }
        const miss = clips.find((c) => !inside(x, y, c));
        if (miss) cut[miss.kind] = (cut[miss.kind] || 0) + 1; else seen++;
      }
      out.push({ stem, face: i, seen: seen / total, cut: Object.entries(cut).sort((p, q) => q[1] - p[1]).map(([kk]) => kk).slice(0, 2).join(' + ') });
    });
  }
  return out;
}

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const worst = new Map();
const note = (slug, w, when, m) => {
  const key = `${slug} @${w} ${m.stem}#${m.face}`;
  const prev = worst.get(key);
  if (!prev || m.seen < prev.seen) worst.set(key, { ...m, when });
};
try {
  for (const w of WIDTHS) {
    const pg = await browser.newPage();
    if (!BASE_ARG) {
      await pg.setRequestInterception(true);
      pg.on('request', (q) => (q.url().startsWith(base) ? q.continue() : q.abort()));
    }
    await pg.setViewport({ width: w, height: w < 700 ? 844 : 900, isMobile: w < 700, hasTouch: w < 700 });
    for (const slug of slugs) {
      await pg.goto(`${base}/${slug === 'index' ? '' : slug}`, { waitUntil: 'load', timeout: 90000 });
      for (const t of [300, 800, 1600, 3000]) {
        await sleep(t - (t === 300 ? 0 : [300, 800, 1600, 3000][[300, 800, 1600, 3000].indexOf(t) - 1]));
        for (const m of await pg.evaluate(measure, subjects)) note(slug, w, `arrival ${t}ms`, m);
      }
      const height = await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; return document.documentElement.scrollHeight; });
      const vh = w < 700 ? 844 : 900;
      for (let y = 0; y < height; y += Math.round(vh * 0.4)) {
        await pg.evaluate((y) => { if (window.WZ && WZ.smoother) WZ.smoother.scrollTo(y, false); else window.scrollTo(0, y); }, y);
        await sleep(450);
        for (const m of await pg.evaluate(measure, subjects)) note(slug, w, `scroll ${y}px`, m);
      }
    }
    await pg.close();
  }
} finally {
  await browser.close();
  server.close();
}
const rows = [...worst.entries()].sort((a, b) => a[1].seen - b[1].seen);
const bad = rows.filter(([, m]) => m.seen < PASS);
for (const [key, m] of rows) console.log(`${m.seen < PASS ? 'CUT ' : 'ok  '} ${key.padEnd(64)} ${(m.seen * 100).toFixed(0).padStart(3)}% at ${m.when}${m.cut ? '  cut by ' + m.cut : ''}`);
console.log(`\n${rows.length} head(s) watched on ${slugs.length} page(s) at ${WIDTHS.join('/')}; ${bad.length ? bad.length + ' CUT' : 'none cut'}`);
process.exitCode = bad.length ? 1 : 0;
