/**
 * Functional verification for the Grand Mission landing pages.
 *
 * The design standard (deliver/brandklout/docs/DESIGN-STANDARD.md) is explicit:
 * a screenshot cannot tell you whether a reveal fired, a counter ran, or a
 * scrubbed scene actually scrubs. This drives the real pages in Chrome over
 * CDP and asserts behaviour.
 *
 *   node verify.mjs               # all pages
 *   node verify.mjs implant       # one package
 *
 * THE CENTRAL CHECK IS THE SCRUB PROOF. For every pinned chapter it steps the
 * page to 25%, 50% and 75% of that chapter's own scroll range and asserts the
 * scene is in three *different* intermediate states. A scene that snaps
 * between two states is a triggered scene wearing a costume, and this is the
 * check that catches it. Chapters declare what to sample with
 * [data-scrub-probe] in the markup, so the proof needs to know nothing about
 * what any particular scene is doing.
 *
 * Notes that cost time to learn:
 *  - Test in a FOCUSED tab. Background tabs freeze transitions, timers and
 *    IntersectionObserver, and report false failures. Focus emulation is on
 *    and the page is brought to front.
 *  - ScrollSmoother transforms the content, so scripted scrolling has to go
 *    through the smoother and then settle before asserting. The settle after
 *    the scroll matters more than the scroll itself: a scrub of 0.3 is still
 *    catching up 300ms after the position has stopped moving.
 *  - offsetTop reads 0 inside the smoother's transformed content — measure
 *    from getBoundingClientRect instead.
 *  - Pin ranges are read off the live ScrollTrigger rather than recomputed:
 *    the trigger already knows exactly where it starts and ends.
 *  - ScrollSmoother breaks full-page screenshots. Layout captures live in
 *    qa-shots.mjs, which runs the reduced-motion pass at six breakpoints.
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)))
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
/* Derived from the pid so a parent, its children, and two concurrent runs
   never contend for the same pair. */
const PORT = 8900 + (process.pid % 60)
const CDP_PORT = 9300 + (process.pid % 60)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
}

/* --------------------------------------------------------------------------
   PAGE MANIFEST
   Each pinned chapter declares the element that gets pinned. Everything else
   the proof needs it reads off the live page.
   -------------------------------------------------------------------------- */
const PAGES = {
  implant: {
    slug: 'implant-landing-page',
    chapters: 8,
    pins: [
      { name: 'The Loss', pin: '#lossPin' },
      { name: 'The Answer', pin: '#answerPin' },
      { name: 'The Options', pin: '#optionsPin' },
    ],
    formPanel: '#quiz',
    minLines: 10,
    minTriggers: 25,
  },
  cosmetic: {
    slug: 'cosmetic-landing-page',
    chapters: 7,
    pins: [
      { name: 'The Work', pin: '#workPin' },
      { name: 'The Standard', pin: '#pillarsPin' },
      { name: 'The Proof', pin: '#proofPin' },
    ],
    formPanel: '#book',
    minLines: 10,
    minTriggers: 22,
  },
  'thank-you': {
    slug: 'thank-you-landing-page',
    chapters: 6,
    pins: [
      { name: 'The Path', pin: '#pathPin' },
      { name: 'The Preparation', pin: '#prepPin' },
      { name: 'The Place', pin: '#placePin' },
    ],
    /* A confirmation page has no form — calling is the conversion. */
    formPanel: null,
    minLines: 5,
    minTriggers: 16,
  },
}

/* ------------------------------------------------------------------ server */
function serve() {
  const server = createServer(async (req, res) => {
    try {
      const url = decodeURIComponent(req.url.split('?')[0])
      const path = join(ROOT, url.endsWith('/') ? `${url}index.html` : url)
      const body = await readFile(path)
      res.writeHead(200, { 'Content-Type': MIME[extname(path)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  return new Promise((ok) => server.listen(PORT, () => ok(server)))
}

/* --------------------------------------------------------------------- cdp */
async function connect() {
  /* A previous run killed mid-flight (SIGPIPE from a `| grep`, a cancelled
     shell) leaves its headless Chrome alive holding both the debugging port
     and the profile directory. The next run then attaches to that stale
     instance and measures a page nobody navigated.
     Shut it down through its OWN debugging port, never by process name: the
     user's real browser is running on this machine and `taskkill /IM
     chrome.exe` would close their windows. Only this port is ours. */
  try {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`, {
      signal: AbortSignal.timeout(700),
    })
    const { webSocketDebuggerUrl } = await res.json()
    if (webSocketDebuggerUrl) {
      const dead = new WebSocket(webSocketDebuggerUrl)
      await new Promise((done) => {
        dead.addEventListener('open', () => {
          dead.send(JSON.stringify({ id: 1, method: 'Browser.close' }))
          setTimeout(done, 500)
        }, { once: true })
        dead.addEventListener('error', done, { once: true })
        setTimeout(done, 1500)
      })
      try { dead.close() } catch { /* already gone */ }
      await new Promise((r) => setTimeout(r, 500))
    }
  } catch {
    /* nothing listening on our port — the normal case */
  }

  /* And do not spawn until the port is actually free, or the new instance
     cannot bind it and we attach to the old one again. */
  for (let i = 0; i < 40; i++) {
    try {
      await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(400) })
      await new Promise((r) => setTimeout(r, 400))
    } catch {
      break // nothing listening — the port is ours
    }
  }

  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${CDP_PORT}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      // Keep the tab awake: a throttled renderer reports broken animation that
      // is actually fine.
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-background-timer-throttling',
      // Profile stays out of the repo (Chrome writes paths longer than Git can
      // index on Windows) AND is unique per run. A shared profile directory is
      // the whole reason back-to-back runs were flaky: if the previous
      // headless Chrome has not fully exited, a new chrome.exe pointed at the
      // same profile hands off to it and exits immediately, /json/list returns
      // the DYING browser's target, and every measurement is taken against a
      // page whose layout is being torn down.
      '--user-data-dir=' + join(tmpdir(), 'gmd-verify-chrome-' + process.pid),
      '--window-size=1440,1000',
      'about:blank',
    ],
    { stdio: 'ignore' }
  )

  let target
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
      target = list.find((t) => t.type === 'page')
      if (target) break
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  if (!target) throw new Error('Chrome did not expose a page target')

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((ok, fail) => {
    ws.addEventListener('open', ok, { once: true })
    ws.addEventListener('error', fail, { once: true })
  })

  let id = 0
  const pending = new Map()
  const consoleErrors = []
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { ok, fail } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? fail(new Error(msg.error.message)) : ok(msg.result)
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '))
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.text)
    }
  })

  /* Every call is bounded. A CDP client that waits forever for a reply turns
     any lost message — a discarded execution context, a renderer that went
     away — into a silent hang with no diagnostic, which is strictly worse than
     a failed check. */
  const send = (method, params = {}, timeoutMs = 60000) =>
    new Promise((ok, fail) => {
      const msgId = ++id
      const timer = setTimeout(() => {
        pending.delete(msgId)
        fail(new Error(`CDP timeout after ${timeoutMs}ms: ${method}`))
      }, timeoutMs)
      pending.set(msgId, {
        ok: (v) => { clearTimeout(timer); ok(v) },
        fail: (e) => { clearTimeout(timer); fail(e) },
      })
      ws.send(JSON.stringify({ id: msgId, method, params }))
    })

  await send('Runtime.enable')
  await send('Page.enable')
  await send('Emulation.setFocusEmulationEnabled', { enabled: true })
  await send('Page.bringToFront')
  return { send, chrome, ws, consoleErrors }
}

const evaluate = async (send, expression) => {
  let result, exceptionDetails
  try {
    ;({ result, exceptionDetails } = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    }))
  } catch (err) {
    /* A bare "CDP timeout on Runtime.evaluate" tells you nothing about which
       of forty calls stalled. Carry the expression into the message. */
    throw new Error(`${err.message} :: ${expression.replace(/\s+/g, ' ').slice(0, 120)}`)
  }
  if (exceptionDetails) throw new Error(exceptionDetails.text + ' :: ' + expression.slice(0, 90))
  /* JSON cannot represent -0, NaN or Infinity, so CDP sends those as
     `unserializableValue` and leaves `value` undefined. That matters here more
     than it sounds: a pinned element sitting one sub-pixel above the viewport
     top rounds to -0, and reading `.value` silently returned undefined — which
     made three working pins report as broken. */
  if (result.value === undefined && result.unserializableValue !== undefined) {
    return Number(result.unserializableValue)
  }
  return result.value
}

/* ------------------------------------------------------------------ checks */
const results = []
function check(page, name, pass, detail = '') {
  results.push({ page, name, pass: !!pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const SCROLL = (y) => `(async () => {
  if (window.WZ && WZ.smoother) { WZ.smoother.scrollTo(${y}, false); }
  else { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, ${y}); }
  await new Promise(r => setTimeout(r, 280));
  if (window.ScrollTrigger) ScrollTrigger.update();
  await new Promise(r => setTimeout(r, 560));
  return Math.round(window.scrollY);
})()`

const RECT_TOP = (sel) =>
  `Math.round(document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().top)`

async function load(send, slug, { reduced = false, width = 1440, height = 1000 } = {}) {
  /* Tear the previous page down BEFORE anything else, emulation included.
     Leaving one of these pages parked mid-pin with the smoother still ticking
     wedges the renderer, and then even a nominally browser-level command like
     Emulation.setEmulatedMedia never returns — the failure looked like a CDP
     bug and was really the page we had not let go of. */
  await send('Page.navigate', { url: 'about:blank' })
  await new Promise((r) => setTimeout(r, 300))

  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }],
  })
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 800,
  })

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${slug}/index.html` })
  /* Re-assert focus on every load. A renderer that is treated as hidden
     freezes its timers, and every wait in this file is a setTimeout — the
     symptom is not "animation looks wrong", it is the CDP call never
     returning at all. */
  await send('Emulation.setFocusEmulationEnabled', { enabled: true })
  await send('Page.bringToFront')
  await new Promise((r) => setTimeout(r, 2600))

  /* Wait for the LAYOUT to stop moving, not for readyState.
     Pinned scenes measure wrong if fonts or images land late, so the page
     calls ScrollTrigger.refresh() on window load — correct behaviour, and a
     trap for a harness that starts measuring before it happens. The
     cross-origin map frame can hold `load` well past any fixed timeout, and a
     refresh landing mid-run re-measured every pin: scrollTo then overshot by
     exactly one pin spacer and three working scenes reported as never
     scrubbing. readyState is the wrong signal because it can simply never
     arrive; a scroll height that has stopped changing is the right one. */
  await evaluate(
    send,
    `(async () => {
       // window.ScrollTrigger existing is not the same as it being
       // registered. Setup now waits for the webfont, so for the first second
       // or so the plugin object is loaded but has no scroller wired up, and
       // maxScroll() throws deep inside GSAP on an undefined. wz-ready is the
       // page's own signal that boot has actually run.
       const booted = () => document.documentElement.classList.contains('wz-ready');
       const maxScroll = () => (booted() && window.ScrollTrigger)
         ? Math.round(ScrollTrigger.maxScroll(window))
         : document.body.scrollHeight;
       const bootDeadline = Date.now() + 8000;
       while (!booted() && Date.now() < bootDeadline) {
         await new Promise(r => setTimeout(r, 100));
       }
       const deadline = Date.now() + 14000;
       let last = -1, stable = 0;
       while (Date.now() < deadline && stable < 2) {
         await new Promise(r => setTimeout(r, 500));
         const now = maxScroll();
         stable = now === last ? stable + 1 : 0;
         last = now;
       }
       if (window.ScrollTrigger) ScrollTrigger.update();
       await new Promise(r => setTimeout(r, 400));
       return last;
     })()`
  )
}

/* =========================================================================
   THE SCRUB PROOF
   ========================================================================= */
const SAMPLE = (pinSel) => `(() => {
  const pin = document.querySelector(${JSON.stringify(pinSel)});
  const probes = [...pin.querySelectorAll('[data-scrub-probe]')];
  return probes.map((el) => {
    const cs = getComputedStyle(el);
    return el.getAttribute('data-scrub-probe') + '=' +
      [cs.transform, cs.clipPath, el.textContent.trim().slice(0, 40)].join('|');
  }).join(' ;; ');
})()`

/* Read the range off the trigger. Recomputing it here would just be a second,
   less reliable implementation of the same arithmetic — and it is re-read
   before every step, so a refresh that lands mid-loop moves the target
   honestly instead of silently invalidating the whole measurement. */
const RANGE = (pin) => `(() => {
  const el = document.querySelector(${JSON.stringify(pin)});
  const t = ScrollTrigger.getAll().find(t => t.pin === el);
  return t ? { start: Math.round(t.start), end: Math.round(t.end) } : null;
})()`

async function scrubProof(send, key, pins) {
  for (const { name, pin } of pins) {
    const range = await evaluate(send, RANGE(pin))
    if (!range) {
      check(key, `${name}: pinned scene registered`, false, `no pinned ScrollTrigger on ${pin}`)
      continue
    }
    check(key, `${name}: pinned scene registered`, true, `${range.start}→${range.end}px`)

    const samples = []
    const tops = []
    for (const f of [0.25, 0.5, 0.75]) {
      const now = (await evaluate(send, RANGE(pin))) ?? range
      await evaluate(send, SCROLL(now.start + Math.round((now.end - now.start) * f)))
      samples.push(await evaluate(send, SAMPLE(pin)))
      tops.push(await evaluate(send, RECT_TOP(pin)))
    }

    const distinct = new Set(samples).size
    check(
      key,
      `${name}: scrubs — a different state at 25/50/75%`,
      distinct === 3,
      distinct === 3
        ? '3 distinct states'
        : `only ${distinct} distinct state(s): ${samples.join('  //  ')}`
    )

    /* While pinned the scene holds still against the viewport. A few pixels of
       slack: the smoother interpolates and is never exactly settled. */
    check(
      key,
      `${name}: holds the viewport while it plays`,
      tops.every((t) => Math.abs(t) <= 8),
      `top offsets ${tops.join(', ')}`
    )

    /* Release at both ends — before the range and after it the scene must be
       travelling with the page again, not stuck to the viewport. */
    const live = (await evaluate(send, RANGE(pin))) ?? range
    await evaluate(send, SCROLL(Math.max(0, live.start - 400)))
    const before = await evaluate(send, RECT_TOP(pin))
    await evaluate(send, SCROLL(live.end + 600))
    const after = await evaluate(send, RECT_TOP(pin))
    check(
      key,
      `${name}: releases cleanly at both ends`,
      before > 30 && after < -30,
      `before ${before}px, after ${after}px`
    )
  }
}

/* ------------------------------------------------------- motion essentials */
async function motionStack(send, key, cfg) {
  check(key, 'GSAP 3.13 loaded', (await evaluate(send, `window.gsap && gsap.version`)) === '3.13.0')
  check(
    key,
    'plugins registered in body (ScrollTrigger, ScrollSmoother, SplitText)',
    await evaluate(
      send,
      `!!(window.ScrollTrigger && window.ScrollSmoother && window.SplitText)
       && gsap.core.globals().ScrollTrigger !== undefined`
    )
  )
  check(key, 'ScrollSmoother is live', await evaluate(send, `!!(window.WZ && WZ.smoother)`))
  const lines = await evaluate(send, `document.querySelectorAll('.wz-line').length`)
  check(key, 'split-text headlines built', lines >= cfg.minLines, `${lines} lines`)
  const pinCount = await evaluate(send, `ScrollTrigger.getAll().filter(t => t.pin).length`)
  check(key, `${cfg.pins.length} pinned chapters`, pinCount === cfg.pins.length, `${pinCount} found`)
  const triggers = await evaluate(send, `ScrollTrigger.getAll().length`)
  check(key, 'scroll choreography registered', triggers >= cfg.minTriggers, `${triggers} triggers`)
}

/* ---------------------------------------------------- journey architecture */
async function journey(send, key, cfg) {
  const chapters = await evaluate(
    send,
    `[...document.querySelectorAll('section[data-chapter]')].map(s => ({
       n: s.getAttribute('data-chapter'),
       name: s.getAttribute('data-chapter-name'),
       cls: s.className,
     }))`
  )
  check(key, `${cfg.chapters} named chapters`, chapters.length === cfg.chapters, `${chapters.length} found`)
  check(
    key,
    'chapters numbered in document order',
    chapters.every((c, i) => Number(c.n) === i),
    chapters.map((c) => `${c.n} ${c.name}`).join(' · ')
  )
  check(
    key,
    'every chapter named for its beat, not its background',
    chapters.every((c) => /\bch-[a-z-]+\b/.test(c.cls) && !/section--|band-/.test(c.cls))
  )

  /* Reading progress must track real document progress, not merely exist. */
  const progress = await evaluate(
    send,
    `(async () => {
       const bar = document.getElementById('readProgress');
       const max = ScrollTrigger.maxScroll(window);
       const read = () => new DOMMatrixReadOnly(getComputedStyle(bar).transform).a;
       const at = [];
       for (const f of [0.2, 0.6, 0.9]) {
         WZ.smoother.scrollTo(max * f, false);
         await new Promise(r => setTimeout(r, 340));
         ScrollTrigger.update();
         await new Promise(r => setTimeout(r, 460));
         at.push({ want: f, got: read() });
       }
       return at;
     })()`
  )
  check(
    key,
    'reading progress tracks document progress',
    progress.every((p) => Math.abs(p.got - p.want) < 0.18) &&
      progress[0].got < progress[1].got &&
      progress[1].got < progress[2].got,
    progress.map((p) => `${p.want}→${p.got.toFixed(2)}`).join(' ')
  )

  /* The chapter readout has to name the chapter you are actually in. */
  const readout = await evaluate(
    send,
    `(async () => {
       // Measure from the top. rect.top + scrollY only gives the document
       // position while the smoother's translate matches scrollY, and after a
       // scripted jump it is still interpolating — reading mid-glide put the
       // target a whole chapter out.
       WZ.smoother.scrollTo(0, false);
       await new Promise(r => setTimeout(r, 700));
       const secs = [...document.querySelectorAll('section[data-chapter]')];
       const target = secs[Math.floor(secs.length / 2)];
       const box = target.getBoundingClientRect();
       // Land in the middle of the chapter, where only its own range is live.
       const y = box.top + window.scrollY + box.height / 2 - window.innerHeight / 2;
       WZ.smoother.scrollTo(y, false);
       await new Promise(r => setTimeout(r, 500));
       ScrollTrigger.update();
       await new Promise(r => setTimeout(r, 620));
       return {
         want: target.getAttribute('data-chapter-name'),
         got: document.getElementById('chName').textContent.trim(),
       };
     })()`
  )
  check(
    key,
    'chapter readout names the chapter you are in',
    readout.want === readout.got,
    `${readout.got} (expected ${readout.want})`
  )
}

/* --------------------------------------------------------------- behaviour */
async function sharedBehaviour(send, key, cfg) {
  /* Walk the page: jumping straight to the bottom never crosses the middle
     triggers, so a reveal that never fires would go unnoticed. */
  const revealed = await evaluate(
    send,
    `(async () => {
       // Snapshot the height and cap the walk. Recomputing scrollHeight each
       // iteration is a runaway: every step loads more lazy images, which
       // makes the page taller, which extends the loop — on the 16,000px
       // implant page it simply never terminated.
       const step = window.innerHeight * 0.7;
       const end = document.body.scrollHeight;
       for (let y = 0, n = 0; y < end && n < 60; y += step, n++) {
         if (WZ.smoother) WZ.smoother.scrollTo(y, false); else window.scrollTo(0, y);
         await new Promise(r => setTimeout(r, 150));
         ScrollTrigger.update();
       }
       await new Promise(r => setTimeout(r, 1000));
       const all = [...document.querySelectorAll('[data-rv],[data-split]')];
       const hidden = all.filter(el => parseFloat(getComputedStyle(el).opacity) < 0.9);
       return {
         total: all.length,
         hidden: hidden.length,
         which: hidden.map(el => (el.className || el.tagName) + ' :: ' + el.textContent.trim().slice(0, 40)),
       };
     })()`
  )
  check(
    key,
    'every reveal element ends visible',
    revealed.hidden === 0,
    `${revealed.total} tracked, ${revealed.hidden} hidden${revealed.which.length ? ': ' + revealed.which.join(' | ') : ''}`
  )

  /* Chapter tag rules draw themselves in rather than sitting at scaleX(0). */
  const tags = await evaluate(
    send,
    `[...document.querySelectorAll('.chapter-tag i')]
       .filter(i => new DOMMatrixReadOnly(getComputedStyle(i).transform).a < 0.5).length`
  )
  check(key, 'every chapter tag rule drew in', tags === 0, `${tags} still at zero`)

  /* Magnetic CTA reacts to the pointer. */
  const magnetic = await evaluate(
    send,
    `(async () => {
       const el = document.querySelector('.magnetic');
       if (!el) return 'no magnetic element';
       const r = el.getBoundingClientRect();
       el.dispatchEvent(new PointerEvent('pointermove', {
         clientX: r.left + r.width, clientY: r.top + r.height, bubbles: true }));
       await new Promise(r2 => setTimeout(r2, 800));
       const moved = Math.abs(gsap.getProperty(el, 'x')) + Math.abs(gsap.getProperty(el, 'y'));
       el.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
       return moved;
     })()`
  )
  check(key, 'magnetic CTA follows the pointer', typeof magnetic === 'number' && magnetic > 1, String(magnetic))

  /* Lightbox opens and closes on Escape — only where the page has one. */
  if (await evaluate(send, `!!document.querySelector('[data-lightbox]')`))
    check(
      key,
      'lightbox opens and closes on Escape',
      await evaluate(
        send,
        `(async () => {
           const t = document.querySelector('[data-lightbox]');
           t.click();
           await new Promise(r => setTimeout(r, 400));
           const opened = document.getElementById('lightbox').classList.contains('is-open')
             && document.getElementById('lightboxImg').src.includes('case-');
           document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
           await new Promise(r => setTimeout(r, 300));
           return opened && !document.getElementById('lightbox').classList.contains('is-open');
         })()`
      )
    )

  const missing = await evaluate(
    send,
    `(async () => {
       const imgs = [...document.images].filter(i => (i.getAttribute('src') || '').trim() !== '');
       await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
       return imgs.filter(i => !i.naturalWidth).map(i => i.getAttribute('src'));
     })()`
  )
  check(key, 'every image resolves', missing.length === 0, missing.join(', '))

  /* Every button, not just the footer's: walk up for the first painted
     background and compare. `.footer a { color:#fff }` beating a .btn--light,
     and a ghost button inheriting dark ink onto a dark chapter, are the same
     bug wearing different clothes — and both are invisible to a screenshot. */
  const lowContrast = await evaluate(
    send,
    `(() => {
       const bgOf = (el) => {
         let node = el;
         while (node && node !== document.documentElement) {
           const bg = getComputedStyle(node).backgroundColor;
           if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
           node = node.parentElement;
         }
         return 'rgb(255, 255, 255)';
       };
       const lum = (c) => {
         // Double backslash: this lives in a template literal, where a lone
         // \\d collapses to "d" and the regex silently stops matching numbers.
         const [r, g, b] = c.match(/[\\d.]+/g).map(Number);
         const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
         return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
       };
       return [...document.querySelectorAll('.btn')].filter((b) => {
         const fg = lum(getComputedStyle(b).color);
         const bg = lum(bgOf(b));
         const ratio = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
         return ratio < 3;
       }).map((b) => b.textContent.trim().slice(0, 40));
     })()`
  )
  check(key, 'every button is legible against its background', lowContrast.length === 0, lowContrast.join(' | '))

  check(
    key,
    'phone + offer tokens rendered from app.js',
    await evaluate(
      send,
      `[...document.querySelectorAll('[data-tel]')].every(el => /\\(\\d{3}\\) \\d{3}-\\d{4}/.test(el.textContent))
       && [...document.querySelectorAll('[data-tel-link]')].every(el => (el.getAttribute('href')||'').startsWith('tel:+1'))`
    )
  )

  /* The offer has to stay reachable from the deepest point of the page. */
  if (cfg.formPanel)
    check(
      key,
      'form is reachable from the deepest point of the page',
      await evaluate(
        send,
        `(async () => {
           WZ.smoother.scrollTo(document.body.scrollHeight, false);
           await new Promise(r => setTimeout(r, 500));
           return document.querySelectorAll('a[href="${cfg.formPanel}"]').length > 0;
         })()`
      )
    )
}

/* ---------------------------------------------------- responsive integrity */
async function responsive(send, key, slug) {
  for (const width of [360, 390]) {
    await load(send, slug, { width, height: 780 })
    const overflow = await evaluate(
      send,
      `(async () => {
         // Snapshot and cap — see the walk in sharedBehaviour.
         const step = window.innerHeight * 0.7;
         const end = document.body.scrollHeight;
         for (let y = 0, n = 0; y < end && n < 60; y += step, n++) {
           window.scrollTo(0, y);
           await new Promise(r => setTimeout(r, 90));
         }
         window.scrollTo(0, 0);
         await new Promise(r => setTimeout(r, 300));
         // Which element is sticking out matters more than the fact that one
         // is — name the first few so the fix is obvious.
         const wide = [...document.querySelectorAll('body *')].filter(el => {
           const r = el.getBoundingClientRect();
           return r.width > 0 && r.right > window.innerWidth + 2
             && getComputedStyle(el).position !== 'fixed';
         }).slice(0, 5).map(el => (el.className || el.tagName) + '@' + Math.round(el.getBoundingClientRect().right));
         return { scrollWidth: document.documentElement.scrollWidth, inner: window.innerWidth, wide };
       })()`
    )
    check(
      key,
      `no horizontal overflow at ${width}px`,
      overflow.scrollWidth <= overflow.inner,
      `scrollWidth ${overflow.scrollWidth} vs ${overflow.inner}${overflow.wide.length ? ' — ' + overflow.wide.join(', ') : ''}`
    )

    /* A sticky call bar that is missing, or too short to hit, is worse than no
       call bar: the page promised the phone was always one tap away. */
    const bar = await evaluate(
      send,
      `(async () => {
         window.scrollTo(0, 900);
         await new Promise(r => setTimeout(r, 700));
         const b = document.getElementById('mobileBar');
         if (!b) return { ok: false, why: 'no mobile bar' };
         const r = b.getBoundingClientRect();
         return {
           ok: getComputedStyle(b).display !== 'none' && r.height >= 44,
           why: 'h=' + Math.round(r.height) + ' display=' + getComputedStyle(b).display,
         };
       })()`
    )
    check(key, `sticky call bar present and tappable at ${width}px`, bar.ok, bar.why)

    /* Two floors, because they are two different things. Prose has to be
       comfortably readable; eyebrow labels, legal fine print and captions are
       deliberately small and holding them to the prose floor would just mean
       deleting the typographic hierarchy to satisfy a check. Neither may drop
       to a size nobody can read. */
    const MICRO = '.label, .chapter-tag, .disclaimer, .panel__foot, .offers__fine, .doctor__role, .doc__role, .now__langs, figcaption, .footer__bottom, .consent'
    const type = await evaluate(
      send,
      `(() => {
         const micro = (el) => el.closest(${JSON.stringify(MICRO)}) !== null;
         const size = (el) => parseFloat(getComputedStyle(el).fontSize);
         const nodes = [...document.querySelectorAll('p, li, td, dd, .lede')]
           .filter(el => el.textContent.trim().length > 20);
         const name = (el) => (el.className || el.tagName) + ':' + getComputedStyle(el).fontSize;
         return {
           prose: nodes.filter(el => !micro(el) && size(el) < 13.5).slice(0, 5).map(name),
           fine: [...document.querySelectorAll(${JSON.stringify(MICRO)})]
             .filter(el => el.textContent.trim().length > 8 && size(el) < 11).slice(0, 5).map(name),
         };
       })()`
    )
    check(key, `body copy stays >=13.5px at ${width}px`, type.prose.length === 0, type.prose.join(', '))
    check(key, `labels and fine print stay >=11px at ${width}px`, type.fine.length === 0, type.fine.join(', '))
  }
}

/* --------------------------------- reduced motion: motion off, content on */
async function reducedMotion(send, key, slug) {
  await load(send, slug, { reduced: true })
  check(key, 'reduced motion: no ScrollSmoother', !(await evaluate(send, `!!(window.WZ && WZ.smoother)`)))
  check(
    key,
    'reduced motion: nothing left hidden',
    (await evaluate(
      send,
      `[...document.querySelectorAll('[data-rv],[data-split],[data-wipe]')]
         .filter(el => parseFloat(getComputedStyle(el).opacity) < 0.9).length`
    )) === 0
  )
  check(
    key,
    'reduced motion: no pinned scene left half-drawn',
    (await evaluate(
      send,
      // Every "not yet reached" state the pinned scenes own. Motion off means
      // the scene ships resolved, not dimmed at its opening value.
      `[...document.querySelectorAll('[data-reason],[data-pillar],[data-prep],[data-step-card],[data-detail]')]
         .filter(el => parseFloat(getComputedStyle(el).opacity) < 0.9).length`
    )) === 0
  )
  check(
    key,
    'reduced motion: counters print their final values',
    await evaluate(
      send,
      `[...document.querySelectorAll('[data-count]')].every(el => /\\d/.test(el.textContent)
         && !/^0[^\\d]?$/.test(el.textContent.trim()))`
    )
  )
  check(
    key,
    'reduced motion: scrubbed figures print their final values',
    await evaluate(
      send,
      // Strip everything but the digits: a scrubbed figure that never ran
      // reads as 0, 0.0, "Up to 0%" or "0 yrs" depending on its affixes.
      `[...document.querySelectorAll('[data-scrub-count]')].every(el => {
         const digits = el.textContent.replace(/[^0-9]/g, '');
         return digits.length > 0 && Number(digits) > 0;
       })`
    )
  )
  check(
    key,
    'reduced motion: page is still scrollable',
    await evaluate(send, `document.body.scrollHeight > window.innerHeight * 2`)
  )
  check(
    key,
    'reduced motion: sticky call bar and phone still present',
    await evaluate(send, `!!document.getElementById('mobileBar') && !!document.querySelector('[data-tel-link]')`)
  )
}

/* ------------------------------------------------------- per-page specifics */
async function implantExtras(send, key) {
  check(
    key,
    'hero price counts up to the token value',
    await evaluate(
      send,
      `(async () => {
         await new Promise(r => setTimeout(r, 1800));
         return document.querySelector('[data-offer-count]').textContent.trim() === '$2,999';
       })()`
    )
  )
  check(
    key,
    'candidacy quiz advances through its steps',
    await evaluate(
      send,
      `(async () => {
         document.querySelector('[name="missing_teeth"]').click();
         document.getElementById('quizNext').click();
         await new Promise(r => setTimeout(r, 400));
         return document.querySelector('.step[data-step="2"]').classList.contains('is-active');
       })()`
    )
  )
  check(
    key,
    'FAQ accordion opens',
    await evaluate(
      send,
      `(async () => {
         const q = document.querySelector('.faq__q');
         q.click();
         await new Promise(r => setTimeout(r, 700));
         return q.closest('.faq__item').querySelector('.faq__a').getBoundingClientRect().height > 20;
       })()`
    )
  )
}

async function cosmeticExtras(send, key) {
  /* The pinned index has to actually change the stage as it travels — a
     marker moving without the content following would be decoration. */
  check(
    key,
    'service stage changes as the index is scrubbed',
    await evaluate(
      send,
      `(async () => {
         const pin = document.getElementById('workPin');
         const t = ScrollTrigger.getAll().find(t => t.pin === pin);
         const seen = new Set();
         for (const f of [0.08, 0.5, 0.95]) {
           WZ.smoother.scrollTo(t.start + (t.end - t.start) * f, false);
           await new Promise(r => setTimeout(r, 800));
           seen.add(document.getElementById('workTitle').textContent.trim());
         }
         return seen.size === 3;
       })()`
    )
  )
}

async function thankYouExtras(send, key) {
  check(
    key,
    'receipt stamp draws its check',
    await evaluate(
      send,
      `(async () => {
         await new Promise(r => setTimeout(r, 2400));
         const p = document.getElementById('stampPath');
         return Math.abs(parseFloat(getComputedStyle(p).strokeDashoffset) || 0) < 1;
       })()`
    )
  )
  check(
    key,
    'open/closed status resolved from the hours table',
    await evaluate(
      send,
      `(() => {
         const el = document.getElementById('openStatus');
         const txt = document.getElementById('openStatusText').textContent.trim();
         return txt !== 'Checking…' && (el.classList.contains('is-open') || el.classList.contains('is-closed'));
       })()`
    )
  )
  /* A cross-origin iframe does not paint into captureBeyondViewport, so the
     map has to be proven by its load event rather than by looking at a
     picture. Reassign src: the original load already fired. */
  check(
    key,
    'location map frame loads (not X-Frame-Options blocked)',
    await evaluate(
      send,
      `(async () => {
         const f = document.getElementById('practiceMap');
         // The frame is loading="lazy" and lives in the last chapter, so at
         // scroll 0 it has not started and reassigning src would just be
         // deferred again. What is under test is whether the URL is frameable,
         // not whether lazy loading works.
         f.loading = 'eager';
         const done = new Promise(r => { f.addEventListener('load', () => r(true), { once: true }); });
         f.src = f.src;
         return await Promise.race([done, new Promise(r => setTimeout(() => r(false), 12000))]);
       })()`
    )
  )
}

/* -------------------------------------------------------------------- main */
async function verifyPage(send, key, consoleErrors) {
  const cfg = PAGES[key]
  console.log(`\n${cfg.slug}`)
  consoleErrors.length = 0

  await load(send, cfg.slug)
  await motionStack(send, key, cfg)
  await journey(send, key, cfg)
  await scrubProof(send, key, cfg.pins)

  await load(send, cfg.slug)
  if (key === 'implant') await implantExtras(send, key)
  if (key === 'cosmetic') await cosmeticExtras(send, key)
  if (key === 'thank-you') await thankYouExtras(send, key)

  await load(send, cfg.slug)
  await sharedBehaviour(send, key, cfg)

  await responsive(send, key, cfg.slug)
  await reducedMotion(send, key, cfg.slug)

  const real = consoleErrors.filter((e) => !/favicon|maps\.google|ERR_BLOCKED|net::ERR/i.test(e))
  check(key, 'no console errors', real.length === 0, real.slice(0, 3).join(' | '))
}

const only = process.argv[2]
const keys = only ? [only] : Object.keys(PAGES)
for (const k of keys) if (!PAGES[k]) throw new Error(`unknown page "${k}" — use ${Object.keys(PAGES).join(', ')}`)

/* ---------------------------------------------------------------- dispatch
   With no argument, run each page in its OWN node process rather than looping
   inside one. Driving three heavy pinned pages from a single long-lived
   browser wedged the renderer at a different point on almost every run —
   always mid-scroll, always a CDP call that never came back — while the same
   pages verified cleanly one at a time. A process per page is the isolation
   that demonstrably works, and it also means one page hanging cannot take the
   other two's results down with it.
   -------------------------------------------------------------------------- */
if (!only) {
  const summary = []
  for (const key of Object.keys(PAGES)) {
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), key], { stdio: 'inherit' })
    const code = await new Promise((done) => child.on('exit', done))
    summary.push({ key, ok: code === 0 })
  }
  const bad = summary.filter((s) => !s.ok)
  console.log(`\n${summary.length - bad.length}/${summary.length} pages verified clean`)
  if (bad.length) console.log('  failing: ' + bad.map((b) => b.key).join(', '))
  process.exit(bad.length ? 1 : 0)
}

const server = await serve()
const { send, chrome, ws, consoleErrors } = await connect()

try {
  await verifyPage(send, only, consoleErrors)
} catch (err) {
  /* A suite that dies halfway used to print "all passed" — the checks it never
     reached simply did not exist. Record the crash as a failure. */
  check(only, 'verification run completed', false, String(err && err.message))
} finally {
  try { ws.close() } catch { /* already closed */ }
  chrome.kill()
  server.close()
}

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length) {
  console.log('\nFAILURES')
  for (const f of failed) console.log(`  ${f.page}: ${f.name}${f.detail ? ` — ${f.detail}` : ''}`)
}
process.exit(failed.length ? 1 : 0)
