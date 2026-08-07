/**
 * staging-verify.mjs — does the page we BUILT in Webflow still behave like the
 * page we DESIGNED locally?
 *
 *   node deliver/brandklout/scripts/staging-verify.mjs \
 *     --url https://grand-mission.webflow.io/implant-ai \
 *     --baseline deliver/brandklout/grand-mission-dentistry/workflows/04-design/.tmp/implant-landing-page
 *
 *   --url       staging URL of the built page          (required)
 *   --baseline  local package directory holding index.html   (optional but
 *               this is the whole point — without it you only get absolute
 *               checks, not a diff)
 *   --json      emit machine-readable results as well
 *   --keep      leave Chrome running (debugging this script)
 *
 * WHY THIS EXISTS
 * ---------------
 * The markup converts to Webflow cleanly and the motion layer does NOT travel
 * with it. GSAP is vendored locally in these packages, so its relative <script
 * src> resolves to nothing on webflow.io; the per-page runtime lives in
 * external app.js / page.js files that the clipboard payload never carries.
 * A page that lost all of that still renders every section, still looks
 * finished, and passes any screenshot review — it is simply a stack of static
 * bands, which is the exact failure this campaign was rebuilt to escape.
 *
 * So the check cannot be "does it look right". It has to be "does it still
 * DO the same things", measured the same way on both sides and diffed.
 *
 * WHAT IT COMPARES
 *   - pinned scenes, BY ELEMENT ID. Not a count — the ids themselves, so a
 *     page that pins three different things does not pass by arithmetic.
 *   - the scrub proof, per pin: step to 25/50/75% of that pin's own range and
 *     require three DIFFERENT intermediate states. A scene that snaps between
 *     two states is a triggered scene wearing a costume.
 *   - GSAP and its plugins actually present and registered.
 *   - requests that failed or 404'd — this is what catches vendored asset
 *     paths that did not survive the move.
 *   - console errors.
 *
 * Pins are DISCOVERED from ScrollTrigger at runtime, never configured. That is
 * deliberate: a hard-coded selector list would have to be maintained per page,
 * and — worse — a page whose JS never ran would simply report "0 of 0 pins
 * scrubbed" and pass. Discovering from the live ScrollTrigger registry means
 * a dead page reports zero pins against a baseline of three and fails loudly.
 *
 * NOTES THAT COST TIME ELSEWHERE IN THIS REPO — do not relearn them:
 *  - Test in a FOCUSED tab. Background renderers freeze timers, transitions
 *    and IntersectionObserver, and report false failures. Focus emulation is
 *    asserted on every load, not once at startup.
 *  - Never kill Chrome by process name; the user's real browser is running.
 *    Shut down a stale instance through its own debugging port.
 *  - `python -m http.server` resets connections under these pages' parallel
 *    image loads and manufactures failures. The baseline server here is Node.
 *  - Settle on a layout that has stopped moving, not on readyState. These
 *    pages call ScrollTrigger.refresh() on load; measuring before that lands
 *    puts every pin range in the wrong place.
 *  - The two clients boot under different globals (WZ/wz-ready for Grand
 *    Mission, MPD/mpd-ready for Mason Park). Both are probed, plus a generic
 *    fallback, so this stays client-agnostic.
 */
import { spawn } from 'node:child_process'
import { tmpdir } from 'node:os'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'

/* ----------------------------------------------------------------- args */
function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}
const URL_ARG = arg('url')
const BASELINE = arg('baseline')
const AS_JSON = process.argv.includes('--json')
const KEEP = process.argv.includes('--keep')

if (!URL_ARG) {
  console.error('usage: staging-verify.mjs --url <staging url> [--baseline <local package dir>]')
  process.exit(2)
}

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
/* Derived from the pid so a parent, its children and two concurrent runs never
   contend for the same pair. */
const PORT = 8820 + (process.pid % 60)
const CDP_PORT = 9220 + (process.pid % 60)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
}

/* ------------------------------------------------------ baseline server */
/* Node, not python -m http.server: the latter resets connections under the
   parallel image loads these pages fire and invents failures. */
function serve(root) {
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(req.url.split('?')[0])
      const file = join(root, path === '/' ? '/index.html' : path)
      const body = await readFile(file)
      res.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  return new Promise((ok) => server.listen(PORT, '127.0.0.1', () => ok(server)))
}

/* ------------------------------------------------------------------ cdp */
async function connect() {
  /* A run killed mid-flight leaves its headless Chrome alive holding the port
     and profile; the next run then attaches to it and measures a page nobody
     navigated. Shut it down through its OWN debugging port — never by process
     name, because the user's real Chrome is running on this machine. */
  try {
    const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(700) })
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

  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--user-data-dir=' + join(tmpdir(), 'bk-staging-verify-' + process.pid),
    '--window-size=1440,1000',
    'about:blank',
  ], { stdio: 'ignore' })

  let target
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json()
      target = list.find((t) => t.type === 'page')
      if (target) break
    } catch { /* not up yet */ }
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
  /* Reset per load rather than accumulated for the whole run, or the staging
     page inherits the baseline's failures and vice versa. */
  let net = { failed: [], errors: [] }

  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data)
    if (msg.id && pending.has(msg.id)) {
      const { ok, fail } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? fail(new Error(msg.error.message)) : ok(msg.result)
    }
    /* The vendored-asset trap shows up here and nowhere else: a <script src>
       that 404s throws no console error and leaves no visible mark. */
    if (msg.method === 'Network.loadingFailed' && !msg.params.canceled) {
      net.failed.push(`${msg.params.type} ${msg.params.errorText}`)
    }
    if (msg.method === 'Network.responseReceived' && msg.params.response.status >= 400) {
      net.failed.push(`${msg.params.response.status} ${msg.params.response.url}`)
    }
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      net.errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '))
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      net.errors.push(msg.params.exceptionDetails.text)
    }
  })

  /* Every call is bounded. A CDP client that waits forever turns a lost
     message into a silent hang with no diagnostic — strictly worse than a
     failed check. */
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
  await send('Network.enable')
  await send('Emulation.setFocusEmulationEnabled', { enabled: true })
  await send('Page.bringToFront')
  return { send, chrome, ws, net, resetNet: () => { net.failed = []; net.errors = [] } }
}

const evaluate = async (send, expression) => {
  const { result, exceptionDetails } = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text)
  }
  return result.value
}

/* ------------------------------------------------------- page lifecycle */
/* Scroll through whichever smoother the client happens to use. Both Brandklout
   runtimes expose one under a client-specific global; a page whose JS did not
   survive has neither, and plain scrollTo is then the honest fallback. */
const SCROLL = (y) => `(async () => {
  const sm = (window.WZ && WZ.smoother) || (window.MPD && MPD.smoother) || null;
  if (sm) { sm.scrollTo ? sm.scrollTo(${y}, false) : sm.scrollTop(${y}); }
  else { document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, ${y}); }
  await new Promise(r => setTimeout(r, 280));
  if (window.ScrollTrigger) ScrollTrigger.update();
  await new Promise(r => setTimeout(r, 560));
  return Math.round(window.scrollY);
})()`

async function load(send, resetNet, url) {
  /* Tear the previous page down first. Leaving one of these parked mid-pin
     with a smoother still ticking wedges the renderer, and then even a
     browser-level command never returns — it looks like a CDP bug and is
     really the page we never let go of. */
  await send('Page.navigate', { url: 'about:blank' })
  await new Promise((r) => setTimeout(r, 300))
  resetNet()

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  })
  await send('Page.navigate', { url })
  /* Re-assert focus on EVERY load. A renderer treated as hidden freezes its
     timers, and every wait below is a setTimeout — the symptom is not "the
     animation looks wrong", it is the CDP call never returning at all. */
  await send('Emulation.setFocusEmulationEnabled', { enabled: true })
  await send('Page.bringToFront')
  await new Promise((r) => setTimeout(r, 2600))

  /* Wait for the LAYOUT to stop moving, not for readyState. These pages
     refresh ScrollTrigger on window load; a refresh landing mid-run
     re-measures every pin and scrollTo then overshoots by a whole spacer.
     readyState is the wrong signal because it can simply never arrive. */
  return evaluate(send, `(async () => {
    const booted = () => document.documentElement.classList.contains('wz-ready')
      || document.documentElement.classList.contains('mpd-ready')
      || !!(window.WZ || window.MPD);
    const maxScroll = () => (window.ScrollTrigger && window.gsap)
      ? Math.round(ScrollTrigger.maxScroll(window))
      : document.body.scrollHeight;
    const bootDeadline = Date.now() + 9000;
    while (!booted() && Date.now() < bootDeadline) await new Promise(r => setTimeout(r, 100));
    const deadline = Date.now() + 15000;
    let last = -1, stable = 0;
    while (Date.now() < deadline && stable < 2) {
      await new Promise(r => setTimeout(r, 500));
      let now; try { now = maxScroll(); } catch (e) { now = document.body.scrollHeight; }
      stable = now === last ? stable + 1 : 0;
      last = now;
    }
    if (window.ScrollTrigger) ScrollTrigger.update();
    await new Promise(r => setTimeout(r, 400));
    return { height: last, booted: booted() };
  })()`)
}

/* --------------------------------------------------------- measurements */
/* Identify a pin by its element id. A count alone lets a page that pins three
   unrelated things pass by arithmetic. */
const DISCOVER = `(() => {
  if (!window.ScrollTrigger || !window.gsap) return null;
  return ScrollTrigger.getAll().filter(t => t.pin).map(t => ({
    id: t.pin.id || null,
    cls: (t.pin.className && t.pin.className.baseVal !== undefined
            ? t.pin.className.baseVal : String(t.pin.className || '')).split(/\\s+/)[0] || null,
    start: Math.round(t.start),
    end: Math.round(t.end),
  }));
})()`

const RUNTIME = `(() => ({
  gsap: !!window.gsap,
  gsapVersion: window.gsap ? gsap.version : null,
  scrollTrigger: !!window.ScrollTrigger,
  splitText: !!window.SplitText,
  scrollSmoother: !!window.ScrollSmoother,
  smoother: !!((window.WZ && WZ.smoother) || (window.MPD && MPD.smoother)),
  triggers: window.ScrollTrigger ? ScrollTrigger.getAll().length : 0,
  observers: typeof IntersectionObserver !== 'undefined' ? 1 : 0,
  sections: document.querySelectorAll('section').length,
}))()`

/* Sample the same three things the local harnesses sample: transform, clip
   path and text. Between them they cover every scrubbed mechanic these pages
   use — moves, wipes and counters. */
const SAMPLE = (id) => `(() => {
  const pin = document.getElementById(${JSON.stringify(id)});
  if (!pin) return null;
  const probes = [...pin.querySelectorAll('[data-scrub-probe]')];
  const els = probes.length ? probes : [...pin.querySelectorAll('*')].slice(0, 40);
  return els.map((el) => {
    const cs = getComputedStyle(el);
    return (el.getAttribute('data-scrub-probe') || el.tagName) + '=' +
      [cs.transform, cs.clipPath, cs.opacity, el.textContent.trim().slice(0, 40)].join('|');
  }).join(' ;; ');
})()`

const RANGE = (id) => `(() => {
  const el = document.getElementById(${JSON.stringify(id)});
  if (!el || !window.ScrollTrigger) return null;
  const t = ScrollTrigger.getAll().find(t => t.pin === el);
  return t ? { start: Math.round(t.start), end: Math.round(t.end) } : null;
})()`

/* The `+ 0` is not decoration. A correctly pinned element sits a hair ABOVE the
   viewport top (top = -0.265625), Math.round gives -0, and CDP's returnByValue
   cannot express negative zero in JSON — it sends unserializableValue:"-0" and
   no `value` at all, so the reading arrives as undefined. The check then fails
   exactly when the pin is behaving perfectly. Adding zero folds -0 to +0. */
const RECT_TOP = (id) =>
  `(() => { const el = document.getElementById(${JSON.stringify(id)});
            return el ? Math.round(el.getBoundingClientRect().top) + 0 : null; })()`

/* Step a pin through its own range and report whether the three samples differ.
   Re-reads the range before every step so a refresh landing mid-loop moves the
   target honestly instead of silently invalidating the measurement. */
async function scrub(send, id) {
  const range = await evaluate(send, RANGE(id))
  if (!range) return { id, registered: false }

  const samples = []
  const tops = []
  for (const f of [0.25, 0.5, 0.75]) {
    const now = (await evaluate(send, RANGE(id))) ?? range
    await evaluate(send, SCROLL(now.start + Math.round((now.end - now.start) * f)))
    samples.push(await evaluate(send, SAMPLE(id)))
    tops.push(await evaluate(send, RECT_TOP(id)))
  }
  const distinct = new Set(samples).size

  /* Release at both ends: before and after its range the scene must travel
     with the page again rather than stay stuck to the viewport. */
  const live = (await evaluate(send, RANGE(id))) ?? range
  await evaluate(send, SCROLL(Math.max(0, live.start - 400)))
  const before = await evaluate(send, RECT_TOP(id))
  await evaluate(send, SCROLL(live.end + 600))
  const after = await evaluate(send, RECT_TOP(id))

  return {
    id,
    registered: true,
    range,
    distinct,
    samples,
    /* A few pixels of slack — the smoother interpolates and is never exactly
       settled. */
    holds: tops.every((t) => t !== null && Math.abs(t) <= 8),
    tops,
    releases: before > 30 && after < -30,
    release: { before, after },
  }
}

async function measure(send, resetNet, net, url, label) {
  process.stderr.write(`  · loading ${label} …\n`)
  const boot = await load(send, resetNet, url)
  const runtime = await evaluate(send, RUNTIME)
  const pins = await evaluate(send, DISCOVER)

  const scrubs = []
  for (const p of pins ?? []) {
    if (!p.id) { scrubs.push({ id: null, registered: true, distinct: 0, note: 'pin has no id — cannot sample' }); continue }
    scrubs.push(await scrub(send, p.id))
  }
  return {
    label, url, boot, runtime,
    pins: pins ?? [],
    scrubs,
    /* Copy, not reference — net is reused across loads. */
    failed: [...new Set(net.failed)],
    errors: [...new Set(net.errors)],
  }
}

/* ----------------------------------------------------------------- main */
const results = []
const record = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  process.stdout.write(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}\n`)
}

/* Serve the package's PARENT and navigate into it, rather than serving the
   package itself. Packages are not self-contained: Mason Park's pages pull
   `shared/mpd.css` and `shared/mpd.js` from one level ABOVE the package dir.
   Rooting the server at the package makes that runtime 404, the journey never
   boots, and the baseline reports zero pins — which used to make every diff
   check below pass vacuously. Grand Mission's packages keep their assets
   inside, and those still resolve correctly through the parent. */
const server = BASELINE ? await serve(dirname(resolve(BASELINE))) : null
const BASELINE_ENTRY = BASELINE ? `${basename(resolve(BASELINE))}/index.html` : null
const { send, chrome, ws, net, resetNet } = await connect()

let staging, base
try {
  staging = await measure(send, resetNet, net, URL_ARG, 'staging')
  if (server) base = await measure(send, resetNet, net, `http://127.0.0.1:${PORT}/${BASELINE_ENTRY}`, 'baseline')
} finally {
  if (!KEEP) {
    try { ws.close() } catch { /* already gone */ }
    try { chrome.kill() } catch { /* already gone */ }
    server?.close()
  }
}

process.stdout.write(`\n--- ${URL_ARG}\n`)

/* The single most important line in the report. A page that arrived without
   its motion layer fails here and everything below it is noise. */
record('GSAP present and registered', staging.runtime.gsap && staging.runtime.scrollTrigger,
  `gsap=${staging.runtime.gsapVersion ?? 'MISSING'} ScrollTrigger=${staging.runtime.scrollTrigger} SplitText=${staging.runtime.splitText}`)
record('page booted its own runtime', staging.boot.booted,
  staging.boot.booted ? '' : 'neither wz-ready/WZ nor mpd-ready/MPD appeared — the page runtime never ran')
record('no failed or 404 requests', staging.failed.length === 0,
  staging.failed.slice(0, 6).join(' | ') || 'clean')
record('no console errors', staging.errors.length === 0,
  staging.errors.slice(0, 4).join(' | ') || 'clean')
record('has pinned scenes', staging.pins.length > 0, `${staging.pins.length} pinned`)

for (const s of staging.scrubs) {
  if (!s.registered) { record(`#${s.id}: pinned scene registered`, false, 'no pinned ScrollTrigger'); continue }
  record(`#${s.id}: scrubs — a different state at 25/50/75%`, s.distinct === 3,
    s.distinct === 3 ? '3 distinct states' : `only ${s.distinct} distinct state(s)`)
  record(`#${s.id}: holds the viewport while it plays`, s.holds, `top offsets ${s.tops.join(', ')}`)
  record(`#${s.id}: releases cleanly at both ends`, s.releases,
    `before ${s.release.before}px, after ${s.release.after}px`)
}

if (base) {
  process.stdout.write(`\n--- diff against ${BASELINE}\n`)

  /* A baseline that never booted makes every check below pass for the wrong
     reason: `missing` is empty against zero pins, and `staging >= 0 * 0.8` is
     trivially true. That is the same vacuous-pass this script exists to
     prevent on the staging side, so it has to be an explicit failure here —
     otherwise a dead baseline silently certifies anything. Usually it means
     the package could not load a runtime file (see the parent-dir note above),
     not that the design is broken. */
  const baseUsable = base.runtime.gsap && base.pins.length > 0
  record('baseline is a usable reference', baseUsable,
    baseUsable
      ? `${base.pins.length} pins, ${base.runtime.triggers} triggers`
      : `baseline booted=${base.boot.booted} gsap=${base.runtime.gsap} pins=${base.pins.length}` +
        ` — the diff below is meaningless; fix the baseline before trusting it` +
        (base.failed.length ? ` | first failures: ${base.failed.slice(0, 3).join(' | ')}` : ''))

  const bIds = (base.pins.map((p) => p.id).filter(Boolean)).sort()
  const sIds = (staging.pins.map((p) => p.id).filter(Boolean)).sort()
  const missing = bIds.filter((i) => !sIds.includes(i))
  record('every pinned scene in the design is pinned on staging', missing.length === 0,
    missing.length ? `missing: ${missing.join(', ')}` : `${sIds.length}/${bIds.length} — ${sIds.join(', ')}`)
  record('trigger count did not collapse', staging.runtime.triggers >= base.runtime.triggers * 0.8,
    `staging ${staging.runtime.triggers} vs baseline ${base.runtime.triggers}`)
  record('section count matches', staging.runtime.sections === base.runtime.sections,
    `staging ${staging.runtime.sections} vs baseline ${base.runtime.sections}`)

  const bScrub = Object.fromEntries(base.scrubs.filter((s) => s.id).map((s) => [s.id, s.distinct]))
  for (const s of staging.scrubs.filter((s) => s.id)) {
    if (bScrub[s.id] === undefined) continue
    record(`#${s.id}: scrub fidelity matches the design`, s.distinct >= bScrub[s.id],
      `staging ${s.distinct} distinct vs baseline ${bScrub[s.id]}`)
  }
}

const failed = results.filter((r) => !r.pass)
process.stdout.write(`\n${results.length - failed.length}/${results.length} checks passed\n`)
if (AS_JSON) process.stdout.write(JSON.stringify({ staging, base, results }, null, 2) + '\n')
process.exit(failed.length ? 1 : 0)
