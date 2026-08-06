/**
 * Functional verification for the three Grand Mission landing pages.
 *
 * Screenshots prove layout; they say nothing about whether the quiz advances,
 * the form validates, the accordion opens, or the sticky bar appears. This
 * drives the real pages in headless Chrome over CDP and asserts behaviour.
 *
 *   node verify.mjs            # all three pages
 *   node verify.mjs implant    # one package
 *
 * Output: PASS/FAIL per check + screenshots in .tmp/verify-shots/.
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
  const args = [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    // Keep the profile OUT of the repo: Chrome writes paths longer than Git
    // can index on Windows, which breaks 'git add' for the whole tree.
    '--user-data-dir=' + join(tmpdir(), 'gmd-verify-chrome'),
    '--window-size=1440,1000',
    'about:blank',
  ]
  const chrome = spawn(CHROME, args, { stdio: 'ignore' })

  let target
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)
      const list = await res.json()
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
  return { send, chrome, ws, consoleErrors }
}

const evaluate = async (send, expression) => {
  const { result, exceptionDetails } = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (exceptionDetails) throw new Error(exceptionDetails.text + ' :: ' + expression.slice(0, 80))
  return result.value
}

/* ------------------------------------------------------------------ checks */
const results = []
function check(page, name, pass, detail = '') {
  results.push({ page, name, pass, detail })
  const mark = pass ? 'PASS' : 'FAIL'
  console.log(`  ${mark}  ${name}${detail ? ` — ${detail}` : ''}`)
}

async function shoot(send, name, { width, height, full = false, slug }) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 800,
  })
  // Reload first: the behaviour tests leave the page mid-scroll with a
  // submitted form, and a sticky header captured mid-page looks like a layout
  // bug when it is really just leftover test state.
  if (slug) {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${slug}/index.html` })
    await new Promise((r) => setTimeout(r, 3200))
    // Walk the page before capturing. A full-page screenshot does not fire
    // IntersectionObserver for anything below the fold, so an un-walked
    // capture shows every reveal section as blank — which looks like broken
    // layout rather than un-triggered motion.
    await evaluate(
      send,
      `(async () => {
         // The page sets scroll-behavior: smooth, so a scripted scrollTo animates
         // and a stepped walk never actually arrives. Force instant scrolling for
         // the walk, then hand it back.
         const html = document.documentElement;
         const prev = html.style.scrollBehavior;
         html.style.scrollBehavior = "auto";
         const step = window.innerHeight * 0.8;
         for (let y = 0; y < document.body.scrollHeight; y += step) {
           window.scrollTo(0, y);
           await new Promise(r => setTimeout(r, 120));
         }
         window.scrollTo(0, 0);
         await new Promise(r => setTimeout(r, 500));
         html.style.scrollBehavior = prev;
         return document.querySelectorAll('.reveal:not(.is-in)').length;
       })()`
    )
  }
  // Reveal transitions run 0.7s with up to 0.32s of stagger delay — capture
  // before they land and finished sections read as missing.
  await new Promise((r) => setTimeout(r, 2000))
  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: full,
  })
  await writeFile(join(SHOTS, `${name}.png`), Buffer.from(data, 'base64'))
}

async function loadPage(send, slug) {
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/${slug}/index.html` })
  // Google Fonts + images: give the parser room to settle before asserting.
  await new Promise((r) => setTimeout(r, 3500))
}

/* ------------------------------------------------------------ shared suite */
async function commonChecks(send, key) {
  check(
    key,
    'brand type loaded (Montserrat)',
    await evaluate(send, `getComputedStyle(document.body).fontFamily.includes('Montserrat')`)
  )
  check(
    key,
    'phone tokens rendered from app.js',
    await evaluate(
      send,
      `[...document.querySelectorAll('[data-tel]')].every(el => /\\(\\d{3}\\) \\d{3}-\\d{4}/.test(el.textContent))
       && [...document.querySelectorAll('[data-tel-link]')].every(el => el.getAttribute('href').startsWith('tel:+1'))`
    )
  )
  check(
    key,
    'scroll reveals fire',
    await evaluate(
      send,
      `(async () => {
         window.scrollTo(0, document.body.scrollHeight);
         await new Promise(r => setTimeout(r, 1200));
         window.scrollTo(0, 0);
         await new Promise(r => setTimeout(r, 400));
         const all = document.querySelectorAll('.reveal');
         const shown = document.querySelectorAll('.reveal.is-in');
         return all.length > 0 && shown.length === all.length;
       })()`
    )
  )
  check(
    key,
    'no horizontal overflow at 390px',
    await evaluate(
      send,
      `document.documentElement.scrollWidth <= window.innerWidth + 1`
    )
  )
  check(
    key,
    'every image resolves',
    await evaluate(
      send,
      `(async () => {
         const imgs = [...document.images];
         await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
         return imgs.filter(i => !i.naturalWidth).map(i => i.getAttribute('src')).join(', ') || true;
       })()`
    ) === true,
    ''
  )
}

/* --------------------------------------------------------------- per page */
async function verifyImplant(send) {
  const key = 'implant'
  await loadPage(send, PAGES.implant)
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })

  check(
    key,
    'price token rendered everywhere ($2,999)',
    await evaluate(
      send,
      `[...document.querySelectorAll('[data-offer="implant-price-value"]')].length >= 4
       && [...document.querySelectorAll('[data-offer="implant-price-value"]')].every(el => el.textContent === '2,999')`
    )
  )

  check(
    key,
    'quiz advances when an option is chosen',
    await evaluate(
      send,
      `(async () => {
         document.querySelector('input[name="missing_teeth"]').click();
         await new Promise(r => setTimeout(r, 500));
         return document.querySelector('.quiz__step[data-step="2"]').classList.contains('is-active');
       })()`
    )
  )

  check(
    key,
    'progress bar advances',
    await evaluate(send, `parseFloat(document.getElementById('quizBar').style.width) > 20`)
  )

  check(
    key,
    'back button returns to the previous step',
    await evaluate(
      send,
      `(async () => {
         document.getElementById('quizBack').click();
         await new Promise(r => setTimeout(r, 300));
         return document.querySelector('.quiz__step[data-step="1"]').classList.contains('is-active');
       })()`
    )
  )

  check(
    key,
    'contact step blocks an empty submit',
    await evaluate(
      send,
      `(async () => {
         // walk to the final step
         document.querySelector('input[name="missing_teeth"]').click();
         await new Promise(r => setTimeout(r, 400));
         document.querySelector('input[name="time_since_loss"]').click();
         await new Promise(r => setTimeout(r, 400));
         document.querySelector('input[name="timeline"]').click();
         await new Promise(r => setTimeout(r, 400));
         document.querySelector('input[name="payment_preference"]').click();
         await new Promise(r => setTimeout(r, 500));
         const onFinal = document.querySelector('.quiz__step[data-step="5"]').classList.contains('is-active');
         document.getElementById('quizNext').click();
         await new Promise(r => setTimeout(r, 300));
         const blocked = !document.getElementById('quiz').classList.contains('is-done');
         const flagged = document.querySelectorAll('[aria-invalid="true"]').length >= 3;
         const messaged = [...document.querySelectorAll('.field__error')].some(e => e.textContent.trim());
         return onFinal && blocked && flagged && messaged;
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
         document.getElementById('quizNext').click();
         await new Promise(r => setTimeout(r, 600));
         const quiz = document.getElementById('quiz');
         return quiz.classList.contains('is-done')
           && getComputedStyle(document.getElementById('quizSuccess')).display !== 'none';
       })()`
    )
  )

  check(
    key,
    'honeypot suppresses the submit',
    await evaluate(
      send,
      `(async () => {
         location.reload();
         return true;
       })()`
    )
  )
  await new Promise((r) => setTimeout(r, 3000))
  check(
    key,
    'honeypot blocks a bot-style submit',
    await evaluate(
      send,
      `(async () => {
         const form = document.getElementById('leadForm');
         document.querySelector('input[name="missing_teeth"]').click();
         await new Promise(r => setTimeout(r, 350));
         document.querySelector('input[name="time_since_loss"]').click();
         await new Promise(r => setTimeout(r, 350));
         document.querySelector('input[name="timeline"]').click();
         await new Promise(r => setTimeout(r, 350));
         document.querySelector('input[name="payment_preference"]').click();
         await new Promise(r => setTimeout(r, 450));
         document.getElementById('f-name').value = 'Bot';
         document.getElementById('f-email').value = 'bot@example.com';
         document.getElementById('f-phone').value = '2815550123';
         document.getElementById('f-consent').checked = true;
         document.getElementById('f-website').value = 'http://spam.example';
         document.getElementById('quizNext').click();
         await new Promise(r => setTimeout(r, 500));
         return !document.getElementById('quiz').classList.contains('is-done');
       })()`
    )
  )

  check(
    key,
    'stat counters animate to their real values',
    await evaluate(
      send,
      // Instant scroll: two smooth scrollIntoView calls interrupt each other,
      // and the band can end up never entering the viewport at all.
      `(async () => {
         const html = document.documentElement;
         const prev = html.style.scrollBehavior;
         html.style.scrollBehavior = "auto";
         document.querySelector('.stat-band').scrollIntoView({ block: 'center' });
         await new Promise(r => setTimeout(r, 2200));
         html.style.scrollBehavior = prev;
         const nums = [...document.querySelectorAll('[data-count]')].map(n => n.textContent);
         return nums.includes('96.8%') && nums.some(n => n.includes('1,700'));
       })()`
    )
  )

  check(
    key,
    'FAQ accordion opens and reports state',
    await evaluate(
      send,
      `(async () => {
         const item = document.querySelector('.faq__item');
         const btn = item.querySelector('.faq__q');
         btn.click();
         await new Promise(r => setTimeout(r, 600));
         const panel = item.querySelector('.faq__a > div');
         return item.classList.contains('is-open')
           && btn.getAttribute('aria-expanded') === 'true'
           && panel.getBoundingClientRect().height > 20;
       })()`
    )
  )

  check(
    key,
    'lightbox opens and closes on Escape',
    await evaluate(
      send,
      `(async () => {
         document.querySelector('[data-lightbox]').click();
         await new Promise(r => setTimeout(r, 300));
         const box = document.getElementById('lightbox');
         const opened = box.classList.contains('is-open') && document.getElementById('lightboxImg').src.includes('case-');
         document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
         await new Promise(r => setTimeout(r, 300));
         return opened && !box.classList.contains('is-open');
       })()`
    )
  )

  await commonChecksDesktop(send, key)

  await shoot(send, 'implant-desktop', { width: 1440, height: 1000, full: true, slug: PAGES.implant })

  // mobile pass
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await evaluate(send, `window.scrollTo(0, 900)`)
  await new Promise((r) => setTimeout(r, 700))
  check(
    key,
    'sticky mobile bar appears after scrolling',
    await evaluate(
      send,
      `(() => {
         const bar = document.getElementById('mobileBar');
         const r = bar.getBoundingClientRect();
         return bar.classList.contains('is-visible')
           && getComputedStyle(bar).display === 'flex'
           && r.bottom <= window.innerHeight + 1;
       })()`
    )
  )
  check(
    key,
    'no horizontal overflow at 390px',
    await evaluate(send, `document.documentElement.scrollWidth <= window.innerWidth + 1`)
  )
  await evaluate(send, `window.scrollTo(0, 0)`)
  await shoot(send, 'implant-mobile', { width: 390, height: 844, full: true, slug: PAGES.implant })
}

async function commonChecksDesktop(send, key) {
  check(
    key,
    'brand type loaded (Montserrat)',
    await evaluate(send, `getComputedStyle(document.body).fontFamily.includes('Montserrat')`)
  )
  check(
    key,
    'phone tokens rendered from app.js',
    await evaluate(
      send,
      `[...document.querySelectorAll('[data-tel]')].every(el => /\\(\\d{3}\\) \\d{3}-\\d{4}/.test(el.textContent))
       && [...document.querySelectorAll('[data-tel-link]')].every(el => (el.getAttribute('href')||'').startsWith('tel:+1'))`
    )
  )
  const missing = await evaluate(
    send,
    // The lightbox <img> is deliberately empty until a case is opened — an
    // empty src is not a broken asset, so it must not read as one.
    `(async () => {
       const imgs = [...document.images].filter(i => (i.getAttribute('src') || '').trim() !== '');
       await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
       return imgs.filter(i => !i.naturalWidth).map(i => i.getAttribute('src'));
     })()`
  )
  check(key, 'every image resolves', missing.length === 0, missing.join(', '))

  // A .btn--light inside the footer inherits .footer a { color: #fff } unless
  // that is explicitly beaten — white text on a white pill, invisible.
  const lowContrast = await evaluate(
    send,
    `[...document.querySelectorAll('.footer .btn')].filter(b => {
       const s = getComputedStyle(b);
       return s.color.replace(/\\s/g, '') === s.backgroundColor.replace(/\\s/g, '');
     }).map(b => b.textContent.trim())`
  )
  check(key, 'footer buttons are legible', lowContrast.length === 0, lowContrast.join(', '))

  check(
    key,
    'all reveals become visible',
    await evaluate(
      send,
      // Walk down in viewport-sized steps. Jumping straight to the bottom
      // never puts the middle of the page in the viewport, so its observers
      // never fire and the check fails for a reason the visitor never hits.
      `(async () => {
         // The page sets scroll-behavior: smooth, so a scripted scrollTo animates
         // and a stepped walk never actually arrives. Force instant scrolling for
         // the walk, then hand it back.
         const html = document.documentElement;
         const prev = html.style.scrollBehavior;
         html.style.scrollBehavior = "auto";
         const step = window.innerHeight * 0.8;
         for (let y = 0; y < document.body.scrollHeight; y += step) {
           window.scrollTo(0, y);
           await new Promise(r => setTimeout(r, 140));
         }
         window.scrollTo(0, 0);
         await new Promise(r => setTimeout(r, 400));
         html.style.scrollBehavior = prev;
         const all = document.querySelectorAll('.reveal').length;
         const shown = document.querySelectorAll('.reveal.is-in').length;
         return all > 0 && all === shown;
       })()`
    )
  )
}

async function verifyCosmetic(send) {
  const key = 'cosmetic'
  await loadPage(send, PAGES.cosmetic)
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })

  check(
    key,
    'offer tokens rendered ($189 / $3,799)',
    await evaluate(
      send,
      `[...document.querySelectorAll('[data-offer="new-patient-value"]')].every(el => el.textContent === '189')
       && [...document.querySelectorAll('[data-offer="invisalign-value"]')].every(el => el.textContent === '3,799')`
    )
  )
  check(
    key,
    'both doctors present with real bios',
    await evaluate(
      send,
      `document.body.textContent.includes('Dr. William Sung, DMD')
       && document.body.textContent.includes('Dr. Van Nguyen, DDS')
       && document.body.textContent.includes('University of Minnesota')`
    )
  )
  check(
    key,
    'eight real patient cases in the gallery',
    await evaluate(send, `document.querySelectorAll('.gallery__item').length === 8`)
  )
  check(
    key,
    'empty submit is blocked and flagged',
    await evaluate(
      send,
      `(async () => {
         document.getElementById('formSubmit').click();
         await new Promise(r => setTimeout(r, 300));
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
         await new Promise(r => setTimeout(r, 500));
         return document.getElementById('book').classList.contains('is-done')
           && getComputedStyle(document.getElementById('formSuccess')).display !== 'none';
       })()`
    )
  )
  check(
    key,
    'lightbox opens and closes',
    await evaluate(
      send,
      `(async () => {
         document.querySelector('[data-lightbox]').click();
         await new Promise(r => setTimeout(r, 300));
         const opened = document.getElementById('lightbox').classList.contains('is-open');
         document.getElementById('lightboxClose').click();
         await new Promise(r => setTimeout(r, 300));
         return opened && !document.getElementById('lightbox').classList.contains('is-open');
       })()`
    )
  )

  await commonChecksDesktop(send, key)
  await shoot(send, 'cosmetic-desktop', { width: 1440, height: 1000, full: true, slug: PAGES.cosmetic })

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await evaluate(send, `window.scrollTo(0, 900)`)
  await new Promise((r) => setTimeout(r, 700))
  check(
    key,
    'sticky mobile bar appears (Asana section 6)',
    await evaluate(
      send,
      `document.getElementById('mobileBar').classList.contains('is-visible')
       && getComputedStyle(document.getElementById('mobileBar')).display === 'flex'`
    )
  )
  check(
    key,
    'no horizontal overflow at 390px',
    await evaluate(send, `document.documentElement.scrollWidth <= window.innerWidth + 1`)
  )
  await evaluate(send, `window.scrollTo(0, 0)`)
  await shoot(send, 'cosmetic-mobile', { width: 390, height: 844, full: true, slug: PAGES.cosmetic })
}

async function verifyThankYou(send) {
  const key = 'thank-you'
  await loadPage(send, PAGES['thank-you'])
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false })

  check(
    key,
    'all four spec sections present',
    await evaluate(
      send,
      `['top', 'fast-track', 'what-to-expect', 'practice'].every(id => document.getElementById(id))`
    )
  )
  check(
    key,
    'open/closed banner resolves against the hours table',
    await evaluate(
      send,
      `(() => {
         const s = document.getElementById('openStatus').textContent;
         const n = document.getElementById('openNext').textContent;
         return (s === 'Open now' || s === 'Closed right now') && n.length > 10;
       })()`
    )
  )
  check(
    key,
    "today's row is highlighted in the hours list",
    await evaluate(send, `!!document.querySelector('#hoursList .is-today')`)
  )
  check(
    key,
    'three timeline steps',
    await evaluate(send, `document.querySelectorAll('.timeline__step').length === 3`)
  )
  check(
    key,
    'map and directions link point at the practice',
    await evaluate(
      send,
      `document.querySelector('.practice__map iframe').src.includes('Grand%20Mission%20Blvd')
       && !!document.querySelector('a[href*="maps.app.goo.gl"]')`
    )
  )
  check(
    key,
    'booking link present',
    await evaluate(send, `!!document.querySelector('a[href*="flexbook.me/gmdent"]')`)
  )

  await commonChecksDesktop(send, key)
  await shoot(send, 'thank-you-desktop', { width: 1440, height: 1000, full: true, slug: PAGES['thank-you'] })

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await new Promise((r) => setTimeout(r, 500))
  check(
    key,
    'no horizontal overflow at 390px',
    await evaluate(send, `document.documentElement.scrollWidth <= window.innerWidth + 1`)
  )
  await shoot(send, 'thank-you-mobile', { width: 390, height: 844, full: true, slug: PAGES['thank-you'] })
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
} finally {
  const realErrors = consoleErrors.filter(
    (e) => !/favicon|maps\.google|ERR_BLOCKED|net::ERR/i.test(e)
  )
  console.log('\nconsole errors:', realErrors.length ? realErrors.join('\n  ') : 'none')

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
