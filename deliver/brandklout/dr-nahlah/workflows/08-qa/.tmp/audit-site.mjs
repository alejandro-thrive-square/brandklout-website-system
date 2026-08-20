/* audit-site.mjs — a page-by-page audit of the whole Dr. Nahlah site as a
 * browser actually renders it.
 *
 * WHY THIS EXISTS
 * ---------------
 * Every gate this project owns was green while the before/after sliders were
 * dead on the live site, because each gate looks at one layer:
 *   - `site-test` / `fluid-qa` read the LOCAL build,
 *   - `sim-check` reads the pulled Instatic documents against the LOCAL
 *     site.css + site.js (it never loaded runtime-states.css, which is where
 *     the rule that killed the sliders lived),
 *   - `verify-all` compares node counts, which a CSS override cannot change.
 * Nothing drove the real served page. This does: one headless Chrome, every
 * URL, and only conclusions a renderer can reach.
 *
 *   node audit-site.mjs --base https://encorercm.com          # published site
 *   node audit-site.mjs --base http://127.0.0.1:8907 --local  # local build
 *   node audit-site.mjs --only veneers,smile-gallery
 *   node audit-site.mjs --resume        # skip URLs already audited
 *
 * Writes one JSON per URL into ./audit-out/<name>.json.
 * Resumable on purpose: 77 URLs is long enough that a bridge hiccup or a
 * closed laptop should not cost the whole run.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

const HERE = import.meta.dirname;
const argv = process.argv.slice(2);
const arg = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const flag = (n) => argv.includes('--' + n);

const BASE = (arg('base', 'https://encorercm.com')).replace(/\/$/, '');
const LOCAL = flag('local');                 // local build serves index.html, not /
const OUT = path.join(HERE, arg('out', 'audit-out'));
fs.mkdirSync(OUT, { recursive: true });

/* The page list is DERIVED, never typed twice. A hardcoded copy is how a gate
   quietly stops covering the pages that were added after it was written --
   which is exactly what happened when the blog arrived. `post` is excluded on
   purpose: it is registered as the postTypes template, so Instatic serves 404
   at /post and every entry renders through it instead. */
const PAGES = (() => {
  const spec = fs.readFileSync(path.resolve(HERE, '../../04-design/.tmp/site-src/build-site.mjs'), 'utf8');
  const block = /const PAGES\s*=\s*\[([\s\S]*?)\n\];/.exec(spec);
  if (!block) throw new Error('could not read the page list out of build-site.mjs');
  const TEMPLATES = new Set(['post']);
  return [...block[1].matchAll(/\{\s*slug:\s*"([^"]+)"/g)]
    .map((m) => m[1])
    .filter((slug) => !TEMPLATES.has(slug));
})();

const POSTS = (() => {
  const p = path.resolve(HERE, '../../13-content-export-import/.tmp/posts.json');
  if (!fs.existsSync(p)) return [];
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return (Array.isArray(j) ? j : j.posts || []).map((x) => x.slug);
})();

/** URL for a slug. Instatic serves path style and the home page at "/". */
function urlFor(kind, slug) {
  if (LOCAL) return BASE + '/' + slug + '.html';
  if (kind === 'post') return BASE + '/posts/' + slug;
  return slug === 'index' ? BASE + '/' : BASE + '/' + slug;
}

let TARGETS = [
  ...PAGES.map((s) => ({ kind: 'page', slug: s, url: urlFor('page', s) })),
  ...POSTS.map((s) => ({ kind: 'post', slug: s, url: urlFor('post', s) })),
];
const only = arg('only');
if (only) { const want = new Set(only.split(',')); TARGETS = TARGETS.filter((t) => want.has(t.slug)); }
if (flag('pages-only')) TARGETS = TARGETS.filter((t) => t.kind !== 'post');
if (flag('resume')) TARGETS = TARGETS.filter((t) => !fs.existsSync(path.join(OUT, t.slug + '.json')));

console.log('auditing ' + TARGETS.length + ' URLs against ' + BASE);

/* ---- headless Chrome over CDP ------------------------------------------ */
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9800 + Math.floor(Math.random() * 90);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-audit-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--remote-debugging-port=' + PORT, '--remote-allow-origins=*', '--force-device-scale-factor=1',
  '--window-size=1440,900', '--no-first-run', '--no-default-browser-check',
  '--autoplay-policy=no-user-gesture-required', '--user-data-dir=' + profile, 'about:blank']);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const gj = (p) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)));
  }).on('error', rej);
});
let wsu;
for (let i = 0; i < 200; i++) {
  try { const v = await gj('/json/version'); if (v.webSocketDebuggerUrl) { wsu = v.webSocketDebuggerUrl; break; } } catch { /* not up yet */ }
  await wait(300);
}
if (!wsu) { console.error('chrome did not come up'); process.exit(2); }

const sock = new WebSocket(wsu);
let id = 0; const pend = new Map(); const listeners = [];
sock.addEventListener('message', async (ev2) => {
  const raw = typeof ev2.data === 'string' ? ev2.data : await ev2.data.text();
  const m = JSON.parse(raw);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return; }
  if (m.method) listeners.forEach((fn) => fn(m));
});
await new Promise((r) => sock.addEventListener('open', r, { once: true }));
const send = (method, params = {}, sid) => new Promise((res, rej) => {
  const mid = ++id;
  const t = setTimeout(() => rej(new Error('timeout ' + method)), 90000);
  pend.set(mid, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result); });
  sock.send(JSON.stringify({ id: mid, method, params, sessionId: sid }));
});
const tg = (await gj('/json/list')).find((t) => t.type === 'page');
const { sessionId } = await send('Target.attachToTarget', { targetId: tg.id, flatten: true });
const S = (m, p = {}) => send(m, p, sessionId);
await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable'); await S('Log.enable');
/* --mobile is not a nicety. The drawer, the burger and the touch behaviour of
   the sliders exist ONLY at phone widths, so a desktop-only sweep cannot see
   them at all -- which is how a drawer with nine unreachable links survived
   every check this project owns. */
if (flag('mobile')) {
  await S('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  await S('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
}
const ev = async (expression) => (await S('Runtime.evaluate',
  { expression, returnByValue: true, awaitPromise: true })).result.value;

/* Per-page collectors, reset before each navigate. */
let bucket = null;
listeners.push((m) => {
  if (!bucket) return;
  if (m.method === 'Runtime.exceptionThrown') {
    const d = m.params.exceptionDetails;
    bucket.jsErrors.push(String((d.exception && (d.exception.description || d.exception.value)) || d.text).slice(0, 300));
  } else if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
    const txt = m.params.args.map((a) => a.value ?? a.description ?? a.type).join(' ');
    (m.params.type === 'error' ? bucket.consoleErrors : bucket.consoleWarnings).push(String(txt).slice(0, 300));
  } else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
    bucket.logErrors.push((m.params.entry.source + ': ' + m.params.entry.text).slice(0, 300));
  } else if (m.method === 'Network.responseReceived') {
    const r = m.params.response;
    if (r.status >= 400) bucket.badResponses.push(r.status + ' ' + r.url);
    if (m.params.type === 'Document' && bucket.status === null) { bucket.status = r.status; bucket.finalUrl = r.url; }
  } else if (m.method === 'Network.loadingFailed') {
    if (!/net::ERR_ABORTED/.test(m.params.errorText || '')) bucket.netFailed.push(m.params.errorText + ' ' + (m.params.type || ''));
  }
});

/* One evaluation, so a page is measured in a single consistent state. */
const PROBE = String.raw`(() => {
  const q = (s, r) => Array.from((r || document).querySelectorAll(s));
  const txt = (el) => (el ? el.textContent.trim().replace(/\s+/g, ' ') : null);
  const meta = (n) => { const m = document.querySelector('meta[name="' + n + '"]'); return m ? m.content : null; };

  /* Before/after: is the control a range, and does driving it move the wipe?
     A static 50/50 split looks perfectly fine in a screenshot. */
  const ba = q('.pk-ba').map((fig, i) => {
    const input = fig.querySelector('input');
    const after = fig.querySelector('img.ba-img-after');
    const out = {
      i: i, hasInput: !!input, type: input ? input.type : null,
      ariaLabel: input ? input.getAttribute('aria-label') : null,
      imgs: fig.querySelectorAll('img').length,
      hasLine: !!fig.querySelector('.ba-line'),
      tags: fig.querySelectorAll('.ba-tag').length,
      drives: false
    };
    if (input) {
      const cs = getComputedStyle(input);
      out.display = cs.display; out.pointerEvents = cs.pointerEvents;
      out.boxW = Math.round(input.getBoundingClientRect().width);
      out.visible = cs.display !== 'none' && cs.visibility !== 'hidden' && out.boxW > 20;
    }
    if (after) out.clipBefore = getComputedStyle(after).clipPath;
    if (input && out.visible) {
      input.value = 17; input.dispatchEvent(new Event('input', { bubbles: true }));
      out.posAfterDrag = fig.style.getPropertyValue('--pos');
      out.clipAfterDrag = after ? getComputedStyle(after).clipPath : null;
      out.drives = out.posAfterDrag === '17%' && out.clipAfterDrag !== out.clipBefore;
      input.value = 50; input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return out;
  });

  /* An empty alt is CORRECT where the image is decorative -- inside a control
     that carries its own aria-label (the video cards), or a figure whose
     figcaption already describes it. Flagging those produced 13 false
     positives on /video-library, whose thumbnails sit inside
     role="button" aria-label="Play: <title>". Only unlabelled ones count. */
  const imgs = Array.from(document.images).map((im) => {
    const fig = im.closest('figure');
    return {
      src: im.currentSrc || im.src, alt: im.alt || '',
      w: im.naturalWidth, h: im.naturalHeight,
      broken: im.complete && im.naturalWidth === 0,
      box: Math.round(im.getBoundingClientRect().width),
      labelled: !!im.closest('[aria-label],[aria-labelledby],[role="button"],button,a[aria-label]')
        || !!(fig && fig.querySelector('figcaption'))
    };
  });

  const de = document.documentElement;
  const burger = document.querySelector('.burger');
  let burgerBars = burger ? burger.querySelectorAll('span').length : -1;
  if (burger && burgerBars === 0) {
    // the importer drops empty spans; runtime-states.css rebuilds them as pseudo-elements
    const b = getComputedStyle(burger, '::before').content;
    const a = getComputedStyle(burger, '::after').content;
    burgerBars = (b !== 'none' ? 1 : 0) + (a !== 'none' ? 1 : 0);
  }

  return {
    title: document.title,
    titleLen: document.title.length,
    description: meta('description'),
    descriptionLen: (meta('description') || '').length,
    canonical: (document.querySelector('link[rel=canonical]') || {}).href || null,
    ogTitle: (document.querySelector('meta[property="og:title"]') || {}).content || null,
    ogImage: (document.querySelector('meta[property="og:image"]') || {}).content || null,
    lang: de.getAttribute('lang'),
    h1: q('h1').map(txt), h1Count: q('h1').length,
    h2Count: q('h2').length,
    jsonld: q('script[type="application/ld+json"]').map(function (s) {
      try { var j = JSON.parse(s.textContent); return Array.isArray(j['@graph']) ? j['@graph'].map(function (x) { return x['@type']; }).join('+') : j['@type']; }
      catch (e) { return 'UNPARSEABLE'; }
    }),
    words: (document.body.innerText || '').trim().split(/\s+/).length,

    imgTotal: imgs.length,
    imgBroken: imgs.filter(function (i) { return i.broken; }).map(function (i) { return i.src; }),
    imgNoAlt: imgs.filter(function (i) { return !i.alt && !i.broken && !i.labelled; }).map(function (i) { return i.src; }),
    imgAltDecorative: imgs.filter(function (i) { return !i.alt && !i.broken && i.labelled; }).length,
    imgLowRes: imgs.filter(function (i) { return !i.broken && i.w > 0 && i.box > 320 && i.w < i.box * 0.75; })
      .map(function (i) { return i.src.split('/').pop() + ' ' + i.w + 'px in ' + i.box + 'px'; }),

    ba: ba, baCount: ba.length,
    videos: q('video').map(function (v) { return { cls: v.className, poster: !!v.getAttribute('poster'), playing: !v.paused || v.currentTime > 0, src: (v.currentSrc || '').split('/').pop() }; }),
    iframes: q('iframe').map(function (f) { return f.src; }),
    forms: q('form').length,
    formActions: q('form').map(function (f) { return f.getAttribute('action'); }),

    burgerBars: burgerBars,
    btnSpans: q('.btn > span').length,
    btnCount: q('.btn').length,
    navLinks: q('.nav a').length,
    footerLinks: q('.foot a, footer a').length,

    gsap: typeof window.gsap !== 'undefined',
    scrollTriggers: (window.ScrollTrigger && ScrollTrigger.getAll) ? ScrollTrigger.getAll().length : -1,
    smoother: !!(window.ScrollSmoother && ScrollSmoother.get && ScrollSmoother.get()),
    revealsStuck: q('[data-rv]').filter(function (el) { return parseFloat(getComputedStyle(el).opacity) < 0.05; }).length,

    overflowX: Math.max(0, de.scrollWidth - de.clientWidth),
    docHeight: de.scrollHeight,
    links: q('a[href]').map(function (a) { return a.getAttribute('href'); }),
    telLinks: q('a[href^="tel:"]').map(function (a) { return a.getAttribute('href'); }),
    emDash: (document.body.innerText.match(/\u2014/g) || []).length,
    buildFlags: q('[data-build-flag]').map(function (e) { return e.getAttribute('data-build-flag'); }),
    loremIpsum: /lorem ipsum/i.test(document.body.innerText),
    placeholders: q('[data-placeholder]').length,
    emptyText: q('h1,h2,h3,p,li,td,figcaption').filter(function (e) { return !e.textContent.trim() && !e.querySelector('img,svg,video'); }).length
  };
})()`;

const DRAWER_PROBE = String.raw`(async () => {
  const b = document.getElementById('burger'), d = document.getElementById('drawer');
  if (!b || !d) return { drawer: !!d, burger: !!b, drawerLinks: 0, drawerUnreachable: -1 };
  const hidden = getComputedStyle(b).display === 'none';   // desktop: no burger, nothing to test
  if (hidden) return { drawer: true, burger: true, drawerHidden: true, drawerLinks: d.querySelectorAll('a').length, drawerUnreachable: 0 };
  b.click();
  await new Promise((r) => setTimeout(r, 1200));
  const links = Array.from(d.querySelectorAll('a'));
  const out = {
    drawer: true, burger: true,
    drawerOpen: d.classList.contains('is-open'),
    drawerLinks: links.length,
    /* Measured at scrollTop 0, which the open() leaves it at. Anything BELOW
       the fold is reachable by scrolling; anything above the top edge is not,
       because scrollTop cannot go negative. */
    drawerScrollTop: d.scrollTop,
    drawerUnreachable: links.filter((a) => a.getBoundingClientRect().top < 0).length,
    drawerClip: getComputedStyle(d).clipPath,
    bodyLocked: document.body.classList.contains('is-locked')
  };
  b.click();
  await new Promise((r) => setTimeout(r, 400));
  return out;
})()`;

async function audit(t) {
  bucket = { jsErrors: [], consoleErrors: [], consoleWarnings: [], logErrors: [], badResponses: [], netFailed: [], status: null, finalUrl: null };
  try {
    await S('Page.navigate', { url: t.url });
    await wait(4500);
    /* Scroll the whole page so lazy images load and every ScrollTrigger fires.
       ScrollSmoother lags the real scroll position by ~1.2s, so a fast sweep
       arrives at the bottom before the smoother does and the LAST section's
       reveals never fire -- which reads as three elements stranded at opacity 0
       on every page. It is the harness, not the site. Step slowly and hold at
       the bottom until the smoother catches up before measuring. */
    await ev('(async()=>{const H=document.documentElement.scrollHeight;'
      + 'for(let y=0;y<H;y+=500){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,110));}'
      + 'window.scrollTo(0,H);await new Promise(r=>setTimeout(r,2600));'
      + 'window.scrollTo(0,0);await new Promise(r=>setTimeout(r,900));})()');
    await wait(1200);
    const probe = await ev(PROBE);
    if (!probe) throw new Error('probe returned nothing');
    /* Open the menu and check every link is actually reachable. A column flex
       box that centres and overflows puts its first rows above scrollTop 0,
       where nothing can get to them, and the drawer still reports itself open. */
    const drawer = await ev(DRAWER_PROBE);
    Object.assign(probe, drawer);
    const rec = Object.assign({}, t, bucket, probe, { ok: true });
    fs.writeFileSync(path.join(OUT, t.slug + '.json'), JSON.stringify(rec, null, 1));
    const bad = [
      probe.h1Count !== 1 && 'h1x' + probe.h1Count,
      probe.imgBroken.length && 'broken:' + probe.imgBroken.length,
      probe.imgNoAlt.length && 'noalt:' + probe.imgNoAlt.length,
      probe.baCount && probe.ba.some(function (b) { return !b.drives; }) && 'slider:' + probe.ba.filter(function (b) { return !b.drives; }).length + '/' + probe.baCount,
      bucket.jsErrors.length && 'js:' + bucket.jsErrors.length,
      bucket.badResponses.length && 'http:' + bucket.badResponses.length,
      probe.overflowX > 1 && 'overflowX:' + probe.overflowX,
      !probe.jsonld.length && 'no-jsonld',
      !probe.description && 'no-description',
      probe.revealsStuck && 'stuck:' + probe.revealsStuck,
      probe.emDash && 'emdash:' + probe.emDash,
      probe.drawerUnreachable > 0 && 'drawer-unreachable:' + probe.drawerUnreachable + '/' + probe.drawerLinks,
      probe.burger && !probe.drawer && 'no-drawer'
    ].filter(Boolean);
    console.log((bad.length ? 'WARN' : ' ok ') + '  ' + t.slug.padEnd(46) + ' ' + (bucket.status === null ? '?' : bucket.status) + '  ' + bad.join(' '));
  } catch (e) {
    fs.writeFileSync(path.join(OUT, t.slug + '.json'), JSON.stringify(Object.assign({}, t, { ok: false, error: String(e) }), null, 1));
    console.log('ERR   ' + t.slug + '  ' + e.message);
  } finally { bucket = null; }
}

for (const t of TARGETS) await audit(t);
sock.close(); chrome.kill();
console.log('\nwrote ' + OUT);
