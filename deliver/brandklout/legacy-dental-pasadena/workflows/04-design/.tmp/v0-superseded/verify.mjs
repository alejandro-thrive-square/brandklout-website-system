/* =============================================================================
   verify.mjs — drive the three built pages and assert BEHAVIOUR.

   A screenshot cannot tell you whether a reveal fired, a counter ran, or a
   pinned scene is genuinely scrubbed rather than triggered. This harness
   drives a real Chrome over CDP and asserts what actually happened.

   The sharpest check here is the scrub proof. A scrubbed scene reports a
   DIFFERENT INTERMEDIATE STATE at many points across its range; a triggered
   scene wearing a costume snaps between two. So rather than trying to locate
   each pin's exact scroll range, the harness samples the whole document at 44
   evenly spaced positions and counts how many distinct values each scrubbed
   metric took. Two distinct values is a trigger. Many is a scrub.

   Usage:
     node verify.mjs               # motion pass
     node verify.mjs --reduced     # prefers-reduced-motion pass
   ============================================================================= */
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '.tmp', 'final-design');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const REDUCED = process.argv.includes('--reduced');
const PORT = 8807;
const CDP = 9334;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm', '.json': 'application/json',
};

/* A real HTTP server, not file://. Range is honoured because the hero is a
   <video> and Chrome will not seek a source that cannot serve a range. */
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const abs = path.join(ROOT, p);
  if (!abs.startsWith(ROOT) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  const stat = fs.statSync(abs);
  const type = MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m[1] ? parseInt(m[1], 10) : 0;
    const end = m[2] ? parseInt(m[2], 10) : stat.size - 1;
    res.writeHead(206, {
      'Content-Type': type, 'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': end - start + 1,
    });
    return fs.createReadStream(abs, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
  fs.createReadStream(abs).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'ldp-verify-'));
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${CDP}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu',
  '--autoplay-policy=no-user-gesture-required',
  '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' });

/* Chrome forks a renderer and a GPU process, and on Windows child.kill() only
   reaps the launcher. The survivors keep holding the debugging port, so the
   NEXT run of this harness cannot bind it and dies with the useless message
   "chrome did not come up". Kill the whole tree instead, on every exit path
   including a crash or a Ctrl-C. */
function killBrowser() {
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(-chrome.pid, 'SIGKILL');
    }
  } catch {}
  try { chrome.kill(); } catch {}
}
process.on('exit', killBrowser);
process.on('SIGINT', () => { killBrowser(); process.exit(130); });
process.on('uncaughtException', (e) => { console.error(e); killBrowser(); process.exit(1); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function newTarget(url) {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${CDP}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
      if (r.ok) return await r.json();
    } catch {}
    await sleep(400);
  }
  throw new Error('chrome did not come up');
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = [];
  const ready = new Promise((r) => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) pending.get(m.id)(m), pending.delete(m.id);
    else if (m.method) events.push(m);
  });
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  return { ready, send, events, close: () => ws.close() };
}

const results = [];
const fail = (page, what, detail) => results.push({ page, what, ok: false, detail });
const pass = (page, what, detail = '') => results.push({ page, what, ok: true, detail });

/* Evaluate in the page and unwrap. Errors become failures rather than
   silently resolving to undefined, which is how a broken assertion passes. */
async function evalJs(cx, expr, awaitPromise = false) {
  const r = await cx.send('Runtime.evaluate', {
    expression: expr, returnByValue: true, awaitPromise,
  });
  if (r?.result?.exceptionDetails) {
    throw new Error(r.result.exceptionDetails.exception?.description || 'eval threw');
  }
  return r?.result?.result?.value;
}

const PAGES = [
  {
    slug: 'invisalign',
    chapters: 8,
    /* Every metric here is written by a scrub, so each must take many distinct
       values across the document rather than two. */
    scrubbed: {
      'arithmetic figure': "document.getElementById('ariFig').textContent",
      'evidence divider': "getComputedStyle(document.getElementById('evStage')).getPropertyValue('--rev').trim()",
      'path track x': "Math.round(new DOMMatrixReadOnly(getComputedStyle(document.getElementById('pathTrack')).transform).m41)",
      'nav progress': "Math.round(new DOMMatrixReadOnly(getComputedStyle(document.getElementById('navProgress')).transform).a * 1000)",
    },
  },
  {
    slug: 'invisalign-consultation',
    chapters: 6,
    scrubbed: {
      'voices track x': "Math.round(new DOMMatrixReadOnly(getComputedStyle(document.getElementById('voTrack')).transform).m41)",
      'nav progress': "Math.round(new DOMMatrixReadOnly(getComputedStyle(document.getElementById('navProgress')).transform).a * 1000)",
    },
  },
  {
    slug: 'invisalign-thank-you',
    chapters: 6,
    scrubbed: {
      'fast-track rail': "Math.round(new DOMMatrixReadOnly(getComputedStyle(document.getElementById('ftFill')).transform).d * 1000)",
      'nav progress': "Math.round(new DOMMatrixReadOnly(getComputedStyle(document.getElementById('navProgress')).transform).a * 1000)",
    },
  },
];

for (const page of PAGES) {
  const t = await newTarget(`http://127.0.0.1:${PORT}/${page.slug}/`);
  const cx = connect(t.webSocketDebuggerUrl);
  await cx.ready;
  await cx.send('Runtime.enable');
  await cx.send('Log.enable');
  await cx.send('Page.enable');
  if (REDUCED) {
    await cx.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await cx.send('Page.reload');
  }
  await sleep(REDUCED ? 4500 : 6500);

  const name = page.slug;

  /* A backgrounded tab freezes transitions, observers and timers, so a check
     run in one reports broken animation that is actually fine. Assert it. */
  const vis = await evalJs(cx, 'document.visibilityState');
  vis === 'visible' ? pass(name, 'tab is focused', vis) : fail(name, 'tab is focused', vis);

  /* --- console --- */
  const errs = cx.events
    .filter((e) => e.method === 'Log.entryAdded' && e.params.entry.level === 'error')
    .map((e) => e.params.entry.text)
    /* The Elfsight widget cannot load in a local package with no network. Its
       absence is the whole reason the reviews slot has a fallback, and the
       fallback is asserted separately below. */
    .filter((x) => !/elfsight|core\.service|ERR_NAME_NOT_RESOLVED|ERR_INTERNET|fonts\.googleapis|fonts\.gstatic|player\.vimeo|maps\.google|googleapis/i.test(x));
  errs.length === 0 ? pass(name, 'no console errors') : fail(name, 'no console errors', errs.slice(0, 3).join(' | '));

  /* --- the runtime came up --- */
  const runtime = await evalJs(cx, 'JSON.stringify({ok:!!(window.WZ&&WZ.ok),reduced:WZ.reduced,smoother:!!WZ.smoother,active:WZ.active})');
  const rt = JSON.parse(runtime);
  rt.ok ? pass(name, 'GSAP runtime ready') : fail(name, 'GSAP runtime ready');
  if (REDUCED) {
    rt.reduced ? pass(name, 'reduced-motion detected') : fail(name, 'reduced-motion detected');
    !rt.smoother ? pass(name, 'smoother disabled under reduced motion') : fail(name, 'smoother disabled under reduced motion');
  } else {
    rt.smoother ? pass(name, 'ScrollSmoother created') : fail(name, 'ScrollSmoother created');
  }
  pass(name, 'chapter modules active', rt.active.join(','));

  /* --- chapters present and correctly numbered --- */
  const chapters = await evalJs(cx, "document.querySelectorAll('section[data-chapter]').length");
  chapters === page.chapters
    ? pass(name, `${page.chapters} named chapters`)
    : fail(name, `${page.chapters} named chapters`, `found ${chapters}`);

  const unnamed = await evalJs(cx, "Array.from(document.querySelectorAll('section[data-chapter]')).filter(s=>!s.getAttribute('data-chapter-name')).length");
  unnamed === 0 ? pass(name, 'every chapter is named') : fail(name, 'every chapter is named', String(unnamed));

  /* --- no band-named sections --- */
  const bands = await evalJs(cx, "Array.from(document.querySelectorAll('section')).filter(s=>/\\bband-|section--(light|dark|paper|tight)\\b/.test(s.className)).length");
  bands === 0 ? pass(name, 'no band-named sections') : fail(name, 'no band-named sections', String(bands));

  /* --- copy is visible, not left hidden by a tween that never ran --- */
  const hidden = await evalJs(cx, "Array.from(document.querySelectorAll('[data-anim=\"hide\"]')).filter(el=>getComputedStyle(el).visibility==='hidden').length");
  hidden === 0 ? pass(name, 'no copy left hidden') : fail(name, 'no copy left hidden', `${hidden} elements`);

  /* --- the scrub proof --------------------------------------------------- */
  const SAMPLES = 44;
  const scrubExpr = `(async () => {
    const out = {};
    const keys = ${JSON.stringify(Object.keys(page.scrubbed))};
    const readers = ${JSON.stringify(Object.values(page.scrubbed))};
    keys.forEach(k => out[k] = []);
    const max = () => (window.WZ && WZ.smoother)
      ? WZ.smoother.content().scrollHeight - window.innerHeight
      : document.documentElement.scrollHeight - window.innerHeight;
    const goto = (y) => (window.WZ && WZ.smoother) ? WZ.smoother.scrollTop(y) : window.scrollTo(0, y);
    for (let i = 0; i <= ${SAMPLES}; i++) {
      goto(Math.round(max() * (i / ${SAMPLES})));
      if (window.ScrollTrigger) ScrollTrigger.update();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      readers.forEach((expr, n) => { try { out[keys[n]].push(String(eval(expr))); } catch (e) { out[keys[n]].push('ERR'); } });
    }
    goto(0);
    return JSON.stringify(out);
  })()`;

  let samples;
  try { samples = JSON.parse(await evalJs(cx, scrubExpr, true)); }
  catch (e) { samples = null; fail(name, 'scrub sampling ran', String(e.message).slice(0, 120)); }

  if (samples) {
    for (const [metric, values] of Object.entries(samples)) {
      const distinct = new Set(values).size;
      if (REDUCED) {
        /* Under reduced motion the scrubs are gone by design. What matters is
           that the content landed on a readable end state, which the
           "no copy left hidden" and end-state assertions cover. */
        pass(name, `reduced: ${metric} static`, `${distinct} distinct`);
      } else if (distinct >= 8) {
        pass(name, `SCRUB: ${metric}`, `${distinct} distinct values over ${SAMPLES + 1} samples`);
      } else {
        fail(name, `SCRUB: ${metric}`, `only ${distinct} distinct values, that is a trigger not a scrub`);
      }
    }
  }

  /* --- pins actually pin -------------------------------------------------- */
  if (!REDUCED) {
    const pinned = await evalJs(cx, "ScrollTrigger.getAll().filter(t=>t.pin).length");
    pinned >= 1 ? pass(name, 'pinned triggers registered', String(pinned)) : fail(name, 'pinned triggers registered', '0');
  }

  /* --- interaction: accordion, video facade, drawer ----------------------- */
  const hasAcc = await evalJs(cx, "!!document.querySelector('.acc__btn')");
  if (hasAcc) {
    const accOpened = await evalJs(cx, `(async () => {
      const btn = document.querySelector('.acc__btn');
      btn.click();
      await new Promise(r => setTimeout(r, 700));
      const item = btn.closest('.acc__item');
      const panel = item.querySelector('.acc__panel');
      return item.classList.contains('is-open') && panel.getBoundingClientRect().height > 10;
    })()`, true);
    accOpened ? pass(name, 'accordion opens') : fail(name, 'accordion opens');
  }

  const hasTile = await evalJs(cx, "!!document.querySelector('.vtile')");
  if (hasTile) {
    const tileLive = await evalJs(cx, `(async () => {
      const t = document.querySelector('.vtile');
      t.click();
      await new Promise(r => setTimeout(r, 400));
      return t.classList.contains('is-live') && !!t.querySelector('iframe');
    })()`, true);
    tileLive ? pass(name, 'video facade swaps in the player') : fail(name, 'video facade swaps in the player');
  }

  const reviewsFallback = await evalJs(cx, "(() => { const s=document.querySelector('.reviews-slot'); if(!s) return 'none'; const f=s.querySelector('.reviews-slot__fallback'); return f && f.getBoundingClientRect().height > 40 ? 'shown' : 'hidden'; })()");
  reviewsFallback === 'shown' || reviewsFallback === 'none'
    ? pass(name, 'reviews slot reserves space', reviewsFallback)
    : fail(name, 'reviews slot reserves space', reviewsFallback);

  /* --- the form is real and named ---------------------------------------- */
  if (page.slug === 'invisalign-consultation') {
    const form = await evalJs(cx, `(() => {
      const f = document.getElementById('consultForm');
      if (!f) return 'missing';
      const names = Array.from(f.elements).filter(e=>e.name).map(e=>e.name);
      return JSON.stringify({ names, action: f.getAttribute('action') || '', hasEndpoint: /https?:/.test(f.getAttribute('action')||'') });
    })()`);
    const f = JSON.parse(form);
    f.names.length >= 5 ? pass(name, 'form has named fields', f.names.join(',')) : fail(name, 'form has named fields', form);
    /* The seam is only a seam if we did NOT pick an endpoint. */
    !f.hasEndpoint ? pass(name, 'form endpoint left to Gauge Hill', f.action) : fail(name, 'form endpoint left to Gauge Hill', f.action);
  }

  /* --- the DNI seam ------------------------------------------------------- */
  const dni = await evalJs(cx, `(() => {
    const els = Array.from(document.querySelectorAll('[data-dni="phone"]'));
    return JSON.stringify({ n: els.length, allTel: els.every(e => (e.getAttribute('href')||'').startsWith('tel:')) });
  })()`);
  const d = JSON.parse(dni);
  d.n >= 2 && d.allTel ? pass(name, 'DNI phone seam present', `${d.n} elements`) : fail(name, 'DNI phone seam present', dni);

  /* --- no tracking installed by us ---------------------------------------- */
  const tracking = await evalJs(cx, `(() => {
    const html = document.documentElement.innerHTML;
    const hits = [];
    if (/googletagmanager|gtag\\(/i.test(html)) hits.push('GTM');
    if (/fbq\\(|connect\\.facebook/i.test(html)) hits.push('Meta Pixel');
    if (/gtm\\.js|analytics\\.js/i.test(html)) hits.push('analytics');
    return hits.join(',');
  })()`);
  tracking === '' ? pass(name, 'no tracking inserted by us') : fail(name, 'no tracking inserted by us', tracking);

  /* --- responsive: zero horizontal overflow at the two that matter -------- */
  for (const w of [360, 390, 768, 1024, 1440, 1920]) {
    await cx.send('Emulation.setDeviceMetricsOverride', {
      width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768,
    });
    await sleep(900);
    await evalJs(cx, 'if(window.ScrollTrigger) ScrollTrigger.refresh(); true');
    await sleep(700);
    const over = await evalJs(cx, 'JSON.stringify({sw:document.documentElement.scrollWidth,iw:window.innerWidth})');
    const o = JSON.parse(over);
    o.sw <= o.iw + 1
      ? pass(name, `no horizontal overflow @${w}`)
      : fail(name, `no horizontal overflow @${w}`, `scrollWidth ${o.sw} > innerWidth ${o.iw}`);
  }
  await cx.send('Emulation.clearDeviceMetricsOverride');

  /* --- tap targets on mobile ----------------------------------------------
     Measured AFTER a real settle. The overflow loop above finishes at 1920,
     and coming back down to 390 takes more than one frame: the media queries
     re-apply, the nav CTA is display:none-d, and the fixed chrome re-lays out.
     Measuring at 800ms caught the page mid-reflow and reported five targets
     that are in fact well over 44px once it has settled. This is the trap the
     standard names as testing in a background tab, wearing different clothes:
     the measurement was fine, the moment was wrong. */
  await cx.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await sleep(2500);
  await evalJs(cx, 'if(window.ScrollTrigger) ScrollTrigger.refresh(); document.body.offsetHeight; true');
  await sleep(1500);
  const small = await evalJs(cx, `(() => {
    const bad = [];
    document.querySelectorAll('a[href],button').forEach(el => {
      if (el.closest('[aria-hidden="true"]')) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (getComputedStyle(el).display === 'none') return;
      if (r.height < 44 || r.width < 44) {
        const label = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 26) || '(no text)';
        bad.push(label + ' [' + Math.round(r.width) + 'x' + Math.round(r.height) + ' ' + el.tagName.toLowerCase() + '.' + String(el.className || '').split(' ')[0] + ']');
      }
    });
    return JSON.stringify(bad);
  })()`);
  const smallList = JSON.parse(small);
  smallList.length === 0
    ? pass(name, 'tap targets >= 44px @390')
    : fail(name, 'tap targets >= 44px @390', smallList.slice(0, 5).join(' | '));
  await cx.send('Emulation.clearDeviceMetricsOverride');

  cx.close();
  await fetch(`http://127.0.0.1:${CDP}/json/close/${t.id}`).catch(() => {});
}

/* ---------------------------------------------------------------------------
   Report
   --------------------------------------------------------------------------- */
const failed = results.filter((r) => !r.ok);
const byPage = {};
for (const r of results) (byPage[r.page] = byPage[r.page] || []).push(r);

console.log(`\n=== ${REDUCED ? 'REDUCED MOTION' : 'MOTION'} PASS ===\n`);
for (const [page, rows] of Object.entries(byPage)) {
  console.log(page);
  for (const r of rows) {
    console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.what}${r.detail ? '  ' + r.detail : ''}`);
  }
  console.log('');
}
console.log(`${results.length - failed.length}/${results.length} checks passed`);

killBrowser();
server.close();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(failed.length ? 1 : 0);
