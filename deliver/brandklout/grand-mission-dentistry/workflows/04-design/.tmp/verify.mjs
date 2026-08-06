/**
 * Functional verification for the Grand Mission landing pages.
 *
 * The design standard (deliver/brandklout/docs/DESIGN-STANDARD.md) is explicit:
 * a screenshot cannot tell you whether a reveal fired, a counter ran, or
 * reduced motion is respected. This drives the real pages in Chrome over CDP
 * and asserts behaviour.
 *
 *   node verify.mjs               # all pages
 *   node verify.mjs implant       # one package
 *
 * Notes that cost time to learn:
 *  - Test in a FOCUSED tab. Background tabs freeze transitions, timers and
 *    IntersectionObserver, and report false failures. We enable focus
 *    emulation and bring the page to front.
 *  - ScrollSmoother transforms the content, so scripted scrolling has to go
 *    through the smoother and then settle before asserting.
 *  - ScrollSmoother also breaks full-page screenshots, so captures are taken
 *    in the reduced-motion pass, where no smoother exists.
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)))
const SHOTS = join(ROOT, 'verify-shots')
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 8931
const CDP_PORT = 9331

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

const PAGES = {
  implant: 'implant-landing-page',
  cosmetic: 'cosmetic-landing-page',
  'thank-you': 'thank-you-landing-page',
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
      // Profile stays out of the repo; Chrome writes paths longer than Git can
      // index on Windows.
      '--user-data-dir=' + join(tmpdir(), 'gmd-verify-chrome'),
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

  const send = (method, params = {}) =>
    new Promise((ok, fail) => {
      const msgId = ++id
      pending.set(msgId, { ok, fail })
      ws.send(JSON.stringify({ id: msgId, method, params }))
    })

  await send('Runtime.enable')
  await send('Page.enable')
  await send('Emulation.setFocusEmulationEnabled', { enabled: true })
  await send('Page.bringToFront')
  return { send, chrome, ws, consoleErrors }
}

const evaluate = async (send, expression) => {
  const { result, exceptionDetails } = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (exceptionDetails) throw new Error(exceptionDetails.text + ' :: ' + expression.slice(0, 90))
  return result.value
}

/* ------------------------------------------------------------------ checks */
const results = []
function check(page, name, pass, detail = '') {
  results.push({ page, name, pass: !!pass, detail })
  console.log(`  ${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

/* Scrolling has to go through the smoother, and then settle. */
const SCROLL = (y) => `(async () => {
  if (window.WZ && WZ.smoother) { WZ.smoother.scrollTo(${y}, false); }
  else { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, ${y}); }
  await new Promise(r => setTimeout(r, 260));
  if (window.ScrollTrigger) ScrollTrigger.update();
  await new Promise(r => setTimeout(r, 420));
  return Math.round(window.scrollY);
})()`

/* offsetTop is 0 inside ScrollSmoother's transformed content — the offset
   parent is the transformed wrapper, not the document. Measure from the
   rect instead, and only while the page sits at the top. */
const TOP_OF = (sel) => `(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  return Math.round(el.getBoundingClientRect().top + window.scrollY);
})()`

async function load(send, slug, { reduced = false, width = 1440, height = 1000 } = {}) {
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
  await new Promise((r) => setTimeout(r, 4200))
}

/* ------------------------------------------------------- motion essentials */
async function motionStack(send, key, { pins }) {
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
  check(key, 'split-text headlines built', lines >= 10, `${lines} lines`)
  const pinCount = await evaluate(send, `ScrollTrigger.getAll().filter(t => t.pin).length`)
  check(key, `${pins} pinned section(s)`, pinCount === pins, `${pinCount} found`)
  const triggers = await evaluate(send, `ScrollTrigger.getAll().length`)
  check(key, 'scroll choreography registered', triggers > 25, `${triggers} triggers`)
}

async function sharedBehaviour(send, key) {
  /* Reveals actually fire as the page is walked. */
  const revealed = await evaluate(
    send,
    `(async () => {
       const step = window.innerHeight * 0.75;
       for (let y = 0; y < document.body.scrollHeight; y += step) {
         if (WZ.smoother) WZ.smoother.scrollTo(y, false); else window.scrollTo(0, y);
         await new Promise(r => setTimeout(r, 130));
         ScrollTrigger.update();
       }
       await new Promise(r => setTimeout(r, 900));
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

  /* Magnetic CTA reacts to the pointer. */
  const magnetic = await evaluate(
    send,
    `(async () => {
       const el = document.querySelector('.magnetic');
       if (!el) return 'no magnetic element';
       const r = el.getBoundingClientRect();
       el.dispatchEvent(new PointerEvent('pointermove', {
         clientX: r.left + r.width, clientY: r.top + r.height, bubbles: true }));
       await new Promise(r2 => setTimeout(r2, 400));
       const moved = Math.abs(gsap.getProperty(el, 'x')) + Math.abs(gsap.getProperty(el, 'y'));
       el.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
       return moved;
     })()`
  )
  check(key, 'magnetic CTA follows the pointer', typeof magnetic === 'number' && magnetic > 1, String(magnetic))

  /* Lightbox opens and closes on Escape. */
  check(
    key,
    'lightbox opens and closes on Escape',
    await evaluate(
      send,
      `(async () => {
         const t = document.querySelector('[data-lightbox]');
         if (!t) return false;
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

  /* Assets + contrast. */
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
     and a ghost button inheriting dark ink onto a dark band, are the same bug
     wearing different clothes — and both are invisible to a screenshot. */
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
}

/* Reduced motion: motion off, content on, offer still reachable. */
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
    (await evaluate(send, `document.body.scrollHeight > window.innerHeight * 2`))
  )
  check(
    key,
    'reduced motion: sticky call bar and phone still present',
    await evaluate(send, `!!document.getElementById('mobileBar') && !!document.querySelector('[data-tel-link]')`)
  )
}

async function shoot(send, name, { width, height, slug }) {
  /* Captures run in the reduced-motion pass: ScrollSmoother breaks full-page
     screenshots, and reduced motion leaves every section painted. */
  await load(send, slug, { reduced: true, width, height })
  /* A full-page capture does not scroll, so loading="lazy" images below the
     fold never fetch and the shot shows empty frames. Force them eager and
     wait for the decode. */
  await evaluate(
    send,
    `(async () => {
       document.querySelectorAll('img[loading="lazy"]').forEach(i => { i.loading = 'eager'; });
       const imgs = [...document.images].filter(i => (i.getAttribute('src') || '').trim() !== '');
       await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
       return imgs.length;
     })()`
  )
  await new Promise((r) => setTimeout(r, 1400))
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  await writeFile(join(SHOTS, `${name}.png`), Buffer.from(data, 'base64'))
}

/* --------------------------------------------------------------- implant */
async function verifyImplant(send) {
  const key = 'implant'
  await load(send, PAGES.implant)

  await motionStack(send, key, { pins: 2 })

  check(
    key,
    'hero price counts up to the token value',
    await evaluate(
      send,
      `(async () => {
         await new Promise(r => setTimeout(r, 1600));
         return document.querySelector('[data-offer-count]').textContent.trim() === '$2,999';
       })()`
    )
  )

  /* Pinned scrubbed stat band. */
  await evaluate(send, SCROLL(0))
  const statsY = await evaluate(send, TOP_OF('#stats'))
  await evaluate(send, SCROLL(statsY + 400))
  const scrubbed = await evaluate(
    send,
    `[...document.querySelectorAll('[data-scrub-count]')].map(el => el.textContent.trim())`
  )
  check(
    key,
    'stat band scrubs its counters while pinned',
    scrubbed.some((v) => v !== '0.0%' && v !== '0 yrs' && v !== '0+' && v !== 'Up to 0%'),
    scrubbed.join(' / ')
  )
  check(
    key,
    'stat band is actually pinned',
    await evaluate(send, `ScrollTrigger.getAll().some(t => t.pin && t.pin.closest('#stats'))`)
  )

  /* Pinned horizontal track — the signature moment. */
  await evaluate(send, SCROLL(0))
  const trackY = await evaluate(send, TOP_OF('.track'))
  await evaluate(send, SCROLL(trackY + 900))
  const trackX = await evaluate(send, `gsap.getProperty('#trackRail', 'x')`)
  check(key, 'horizontal track translates while pinned', trackX < -50, `x = ${Math.round(trackX)}px`)
  const trackBar = await evaluate(send, `gsap.getProperty('#trackBar', 'scaleX')`)
  check(key, 'track progress bar tracks the scrub', trackBar > 0.05, `scaleX = ${trackBar.toFixed?.(2)}`)

  /* Matrix + accordion + gallery. */
  await evaluate(send, SCROLL(0))
  const faqY = await evaluate(send, TOP_OF('#faq'))
  await evaluate(send, SCROLL(faqY))
  check(
    key,
    'FAQ accordion animates open and reports state',
    await evaluate(
      send,
      `(async () => {
         const item = document.querySelector('.faq__item');
         item.querySelector('.faq__q').click();
         await new Promise(r => setTimeout(r, 800));
         return item.classList.contains('is-open')
           && item.querySelector('.faq__q').getAttribute('aria-expanded') === 'true'
           && item.querySelector('.faq__a').getBoundingClientRect().height > 30;
       })()`
    )
  )
  check(
    key,
    'accordion closes the previously open item',
    await evaluate(
      send,
      `(async () => {
         const items = [...document.querySelectorAll('.faq__item')];
         items[1].querySelector('.faq__q').click();
         await new Promise(r => setTimeout(r, 800));
         return items[1].classList.contains('is-open') && !items[0].classList.contains('is-open');
       })()`
    )
  )

  await sharedBehaviour(send, key)

  /* Quiz. */
  await evaluate(send, SCROLL(0))
  check(
    key,
    'quiz advances on choice and returns on Back',
    await evaluate(
      send,
      `(async () => {
         document.querySelector('input[name="missing_teeth"]').click();
         await new Promise(r => setTimeout(r, 500));
         const onTwo = document.querySelector('.step[data-step="2"]').classList.contains('is-active');
         const bar = parseFloat(document.getElementById('quizBar').style.width);
         document.getElementById('quizBack').click();
         await new Promise(r => setTimeout(r, 350));
         return onTwo && bar > 20 && document.querySelector('.step[data-step="1"]').classList.contains('is-active');
       })()`
    )
  )
  check(
    key,
    'contact step blocks an empty submit and flags the fields',
    await evaluate(
      send,
      `(async () => {
         for (const name of ['missing_teeth','time_since_loss','timeline','payment_preference']) {
           document.querySelector('input[name="' + name + '"]').click();
           await new Promise(r => setTimeout(r, 380));
         }
         const onFinal = document.querySelector('.step[data-step="5"]').classList.contains('is-active');
         document.getElementById('quizNext').click();
         await new Promise(r => setTimeout(r, 350));
         return onFinal
           && !document.getElementById('quiz').classList.contains('is-done')
           && document.querySelectorAll('[aria-invalid="true"]').length >= 3;
       })()`
    )
  )
  check(
    key,
    'honeypot blocks a bot-style submit',
    await evaluate(
      send,
      `(async () => {
         document.getElementById('f-name').value = 'Bot';
         document.getElementById('f-email').value = 'bot@example.com';
         document.getElementById('f-phone').value = '2815550123';
         document.getElementById('f-consent').checked = true;
         document.getElementById('f-website').value = 'http://spam.example';
         document.getElementById('quizNext').click();
         await new Promise(r => setTimeout(r, 400));
         return !document.getElementById('quiz').classList.contains('is-done');
       })()`
    )
  )
  check(
    key,
    'valid submit reaches the success state',
    await evaluate(
      send,
      `(async () => {
         document.getElementById('f-website').value = '';
         document.getElementById('quizNext').click();
         await new Promise(r => setTimeout(r, 600));
         return document.getElementById('quiz').classList.contains('is-done')
           && getComputedStyle(document.getElementById('quizSuccess')).display !== 'none';
       })()`
    )
  )

  /* Mobile: track becomes a swipe rail, call bar appears. */
  await load(send, PAGES.implant, { width: 390, height: 844 })
  check(
    key,
    'mobile: horizontal track becomes a swipe rail, not a pin',
    await evaluate(
      send,
      `getComputedStyle(document.getElementById('trackRail')).overflowX === 'auto'
       && ScrollTrigger.getAll().filter(t => t.pin && t.pin.closest('.track')).length === 0`
    )
  )
  await evaluate(send, SCROLL(900))
  check(
    key,
    'mobile: sticky call bar appears on scroll',
    await evaluate(
      send,
      `document.getElementById('mobileBar').classList.contains('is-visible')
       && getComputedStyle(document.getElementById('mobileBar')).display === 'flex'`
    )
  )
  check(
    key,
    'mobile: no horizontal overflow at 390px',
    await evaluate(send, `document.documentElement.scrollWidth <= window.innerWidth + 1`)
  )

  await reducedMotion(send, key, PAGES.implant)
  await shoot(send, 'implant-desktop', { width: 1440, height: 1000, slug: PAGES.implant })
  await shoot(send, 'implant-mobile', { width: 390, height: 844, slug: PAGES.implant })
}

/* -------------------------------------------------------------- cosmetic */
async function verifyCosmetic(send) {
  const key = 'cosmetic'
  await load(send, PAGES.cosmetic)

  await motionStack(send, key, { pins: 1 })

  check(
    key,
    'both doctors present with their real bios',
    await evaluate(
      send,
      `document.body.textContent.includes('Dr. William Sung, DMD')
       && document.body.textContent.includes('Dr. Van Nguyen, DDS')
       && document.body.textContent.includes('University of Minnesota')`
    )
  )

  /* Pillars take the stage in turn. */
  await evaluate(send, SCROLL(0))
  const pillarsY = await evaluate(send, TOP_OF('.pillars__list'))
  /* Walk the list rather than guessing one offset: the active band is
     top 62% → bottom 42%, so a single arbitrary scroll position can sit
     between two pillars and read as "nothing activated". */
  let sawActive = 0
  for (const delta of [-200, 0, 200, 400, 600, 800]) {
    await evaluate(send, SCROLL(pillarsY + delta))
    sawActive = Math.max(
      sawActive,
      await evaluate(send, `document.querySelectorAll('.pillar.is-active').length`)
    )
    if (sawActive) break
  }
  check(key, 'a pillar activates as it takes the stage', sawActive >= 1)
  check(
    key,
    'pillar rail tracks progress',
    (await evaluate(send, `gsap.getProperty('#pillarBar', 'scaleX')`)) > 0
  )

  /* Offer counters. */
  await evaluate(send, SCROLL(0))
  const offersY = await evaluate(send, TOP_OF('.offers'))
  await evaluate(send, SCROLL(offersY - 300))
  check(
    key,
    'offer counters reach $189 and $3,799',
    await evaluate(
      send,
      `(async () => {
         await new Promise(r => setTimeout(r, 2200));
         const v = [...document.querySelectorAll('[data-offer-count]')].map(e => e.textContent.trim());
         return v.includes('189') && v.includes('3,799');
       })()`
    )
  )

  /* Signature ribbon. */
  await evaluate(send, SCROLL(0))
  const ribbonY = await evaluate(send, TOP_OF('.ribbon'))
  await evaluate(send, SCROLL(ribbonY + 1100))
  const ribbonX = await evaluate(send, `gsap.getProperty('#ribbonRail', 'x')`)
  check(key, 'patient ribbon translates while pinned', ribbonX < -50, `x = ${Math.round(ribbonX)}px`)
  check(
    key,
    'eight real patient cases on the ribbon',
    (await evaluate(send, `document.querySelectorAll('.ribbon__case').length`)) === 8
  )

  await sharedBehaviour(send, key)

  /* Form. */
  await evaluate(send, SCROLL(0))
  check(
    key,
    'empty submit is blocked and flagged',
    await evaluate(
      send,
      `(async () => {
         document.getElementById('formSubmit').click();
         await new Promise(r => setTimeout(r, 350));
         return !document.getElementById('book').classList.contains('is-done')
           && document.querySelectorAll('[aria-invalid="true"]').length >= 4;
       })()`
    )
  )
  check(
    key,
    'valid submit reaches the success state',
    await evaluate(
      send,
      `(async () => {
         document.getElementById('f-name').value = 'Test Patient';
         document.getElementById('f-email').value = 'test@example.com';
         document.getElementById('f-phone').value = '2815550123';
         document.getElementById('f-consent').checked = true;
         document.getElementById('formSubmit').click();
         await new Promise(r => setTimeout(r, 600));
         return document.getElementById('book').classList.contains('is-done')
           && getComputedStyle(document.getElementById('formSuccess')).display !== 'none';
       })()`
    )
  )

  await load(send, PAGES.cosmetic, { width: 390, height: 844 })
  check(
    key,
    'mobile: ribbon becomes a swipe rail, not a pin',
    await evaluate(
      send,
      `getComputedStyle(document.getElementById('ribbonRail')).overflowX === 'auto'
       && ScrollTrigger.getAll().filter(t => t.pin && t.pin.closest('.ribbon')).length === 0`
    )
  )
  await evaluate(send, SCROLL(900))
  check(
    key,
    'mobile: sticky call bar appears (Asana section 6)',
    await evaluate(
      send,
      `document.getElementById('mobileBar').classList.contains('is-visible')
       && getComputedStyle(document.getElementById('mobileBar')).display === 'flex'`
    )
  )
  check(
    key,
    'mobile: no horizontal overflow at 390px',
    await evaluate(send, `document.documentElement.scrollWidth <= window.innerWidth + 1`)
  )

  await reducedMotion(send, key, PAGES.cosmetic)
  await shoot(send, 'cosmetic-desktop', { width: 1440, height: 1000, slug: PAGES.cosmetic })
  await shoot(send, 'cosmetic-mobile', { width: 390, height: 844, slug: PAGES.cosmetic })
}

/* ------------------------------------------------------------- thank-you */
/* Not yet rebuilt to the motion standard — still the first-pass build, kept
   verified so a regression there is still caught. */
async function verifyThankYou(send) {
  const key = 'thank-you'
  await load(send, PAGES['thank-you'])
  check(
    key,
    'all four spec sections present',
    await evaluate(send, `['top','fast-track','what-to-expect','practice'].every(id => document.getElementById(id))`)
  )
  check(
    key,
    'open/closed banner resolves against the hours table',
    await evaluate(
      send,
      `(() => {
         const s = document.getElementById('openStatus').textContent;
         return (s === 'Open now' || s === 'Closed right now')
           && document.getElementById('openNext').textContent.length > 10;
       })()`
    )
  )
  check(
    key,
    'map and booking links point at the practice',
    await evaluate(
      send,
      `document.querySelector('.practice__map iframe').src.includes('Grand%20Mission%20Blvd')
       && !!document.querySelector('a[href*="flexbook.me/gmdent"]')`
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
}

/* --------------------------------------------------------------------- run */
const only = process.argv[2]
await mkdir(SHOTS, { recursive: true })
const server = await serve()
const { send, chrome, ws, consoleErrors } = await connect()

try {
  if (!only || only === 'implant') {
    console.log('\nimplant-landing-page')
    await verifyImplant(send)
  }
  if (!only || only === 'cosmetic') {
    console.log('\ncosmetic-landing-page')
    await verifyCosmetic(send)
  }
  if (!only || only === 'thank-you') {
    console.log('\nthank-you-landing-page')
    await verifyThankYou(send)
  }
} catch (err) {
  /* A suite that dies halfway used to print "all passed" — the checks it never
     reached simply did not exist. Record the crash as a failure. */
  console.error('\nSUITE CRASHED:', err.message)
  results.push({ page: 'suite', name: 'ran to completion', pass: false, detail: err.message })
} finally {
  const realErrors = consoleErrors.filter((e) => !/favicon|maps\.google|ERR_BLOCKED|net::ERR/i.test(e))
  console.log('\nconsole errors:', realErrors.length ? '\n  ' + realErrors.join('\n  ') : 'none')
  if (realErrors.length) results.push({ page: 'all', name: 'no console errors', pass: false, detail: '' })

  const failed = results.filter((r) => !r.pass)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length) {
    console.log('FAILURES:')
    failed.forEach((f) => console.log(`  ${f.page}: ${f.name} ${f.detail}`))
  }
  ws.close()
  chrome.kill()
  server.close()
  process.exit(failed.length ? 1 : 0)
}
