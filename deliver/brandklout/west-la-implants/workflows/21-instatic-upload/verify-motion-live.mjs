#!/usr/bin/env node
/**
 * Step 9 — GATE. DRIVE THE PUBLISHED PAGE AND WATCH IT MOVE.
 *
 * Every other gate here looks at a page that is standing still. `verify-live`
 * fetches it, `css-parity` reads its stylesheets, and `compare-live` and
 * `visual-diff` both capture with `prefers-reduced-motion: reduce` — on purpose,
 * because a comparison of two animations is a comparison of two moments. The
 * consequence is that **the entire motion layer of this build is invisible to
 * all four of them.** A published page with no ScrollSmoother, no pins and no
 * SplitText passes every one of them: the markup is whole, the CSS arrived, and
 * the settled render is identical, because a chapter that never animates looks
 * exactly like a chapter that has finished animating.
 *
 * That is not a hypothetical on this site. West LA Implants is eight chapters
 * of scroll choreography and four pinned sections; the bundle that carries them
 * is assembled by `push-site.mjs` out of seven files whose ORDER is load-bearing
 * and which fails SILENTLY when it is wrong (`js/00-runtime.js` guards on
 * `window.gsap` rather than throwing). There has to be one gate that scrolls.
 *
 * It asserts, against the LIVE page:
 *   - zero console errors and zero page errors
 *   - ScrollSmoother took over at 1440 (`WZ.smoother`)
 *   - the four pins exist: reality, answer, precisionPin, transPin
 *   - the reality words light up progressively as the pin scrubs
 *   - the precision clip-path iris opens
 *   - the transformation stories swap
 *   - both typefaces are LOADED, by family name (a dead @font-face is invisible:
 *     the family still resolves and the browser falls back to Georgia)
 *   - the hero <video> has a src that answers 200 and has readyState >= 1
 *   - no horizontal overflow at 390
 *
 * Screenshots of every sampled position go to
 * `08-qa/.tmp/screenshots/live/`, at 1440 and at 390.
 *
 * Usage:  node verify-motion-live.mjs            # both widths
 *         node verify-motion-live.mjs 1440       # one
 */
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/* puppeteer-core is not a dependency of this repo — there is no package.json
   here that owns it. `bk-stone` has it installed and it is resolved from there
   by absolute path, deliberately: adding a lockfile to a delivery worktree to
   run one gate is a worse trade than one explicit path. Override with
   PUPPETEER_DIR if that worktree is gone. */
const PUPPETEER_DIR =
  process.env.PUPPETEER_DIR ||
  'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-stone/node_modules/'
const puppeteer = createRequire(PUPPETEER_DIR)('puppeteer-core')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SHOTS = path.resolve(HERE, '../08-qa/.tmp/screenshots/live')

function loadEnv() {
  let dir = HERE
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, '.env')
    if (fs.existsSync(c)) {
      for (const line of fs.readFileSync(c, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
      return
    }
    const up = path.dirname(dir)
    if (up === dir) return
    dir = up
  }
}
loadEnv()
const BASE = (process.env.INSTATIC_BASE_URL || '').replace(/\/$/, '')
if (!BASE) throw new Error('INSTATIC_BASE_URL is not set')

const WIDTHS = process.argv.slice(2).filter((a) => /^\d+$/.test(a)).map(Number)
const RUN = WIDTHS.length ? WIDTHS : [1440, 390]
const WANT_PINS = ['reality', 'answer', 'precisionPin', 'transPin']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fails = []
const notes = []

fs.mkdirSync(SHOTS, { recursive: true })

/* Console noise that is not this site's. Kept explicit and short: a gate that
   filters generously stops being a gate. */
const IGNORE_CONSOLE = [
  /favicon\.ico/i, // no favicon yet — see the directive's "What is NOT done"
]

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: 300000,
  // Without this the hero film never starts and `readyState` stays 0 — which
  // would be reported as a broken video rather than as Chrome's autoplay policy.
  args: ['--no-sandbox', '--disable-gpu', '--autoplay-policy=no-user-gesture-required'],
})

for (const width of RUN) {
  const height = width < 700 ? 844 : 900
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message))
  /* Chrome's console message for a failed subresource is
     "Failed to load resource: the server responded with a status of 404 ()" —
     WITH NO URL IN IT, so a filter written against the message text cannot tell
     the favicon from a missing photograph. Attach the URL from the response
     event that produced it. */
  page.on('response', (r) => {
    if (r.status() < 400) return
    if (IGNORE_CONSOLE.some((re) => re.test(r.url()))) return
    errors.push(`${r.status()} ${r.url()}`)
  })
  page.on('console', (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return
    const t = m.text()
    // The bare "Failed to load resource" line is the response handler's job.
    if (/Failed to load resource/i.test(t)) return
    if (IGNORE_CONSOLE.some((r) => r.test(t))) return
    errors.push(m.type() + ' ' + t)
  })
  await page.setViewport({ width, height })
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 120000 })
  await sleep(3000)

  /* ALL SIX GSAP GLOBALS, BY NAME. See trap 36: Instatic bundles the script
     asset as CommonJS and esbuild rewrites the UMDs' top-level `this` to
     `exports`, so a library that does not self-register with gsap never
     reaches `window` — and the page then pins and scrubs perfectly with its
     split headlines silently unsplit. `gsap.core.globals()` is NOT the check:
     ScrollTrigger's internal Observer shows up there as `Observer2` whether or
     not the standalone file loaded. */
  const globals = await page.evaluate(() =>
    Object.fromEntries(
      ['gsap', 'ScrollTrigger', 'ScrollToPlugin', 'ScrollSmoother', 'SplitText', 'Observer'].map((k) => [k, typeof window[k]]),
    ),
  )
  const absent = Object.entries(globals).filter(([, t]) => t === 'undefined').map(([k]) => k)
  if (absent.length) fails.push(`[${width}] not on window: ${absent.join(', ')} — the UMD exported to the CJS wrapper (trap 36)`)

  const info = await page.evaluate(() => ({
    hasWZ: !!window.WZ,
    ok: !!(window.WZ && window.WZ.ok),
    smoother: !!(window.WZ && window.WZ.smoother),
    active: window.WZ ? window.WZ.active : [],
    triggers: window.ScrollTrigger ? ScrollTrigger.getAll().length : 0,
    pins: window.ScrollTrigger
      ? ScrollTrigger.getAll()
          .filter((t) => t.pin)
          .map((t) => ({ id: t.trigger.id || t.trigger.className, start: Math.round(t.start), end: Math.round(t.end) }))
      : [],
  }))
  console.log(`\n=== ${width}  triggers ${info.triggers}, pins ${info.pins.map((p) => p.id).join(', ') || '(none)'}`)
  console.log(`    sections active: ${info.active.join(', ')}`)

  if (!info.hasWZ) fails.push(`[${width}] window.WZ is undefined — the site bundle did not run`)
  if (!info.ok) fails.push(`[${width}] WZ.ok is false — gsap or ScrollTrigger is missing from the bundle`)

  /* The smoother is DESKTOP-ONLY by design: with a smoother present
     ScrollTrigger pins by transform and a phone drifts against the finger, so
     `90-boot.js` gates it on `(hover:none) and (pointer:coarse)`. A headless
     Chrome at 390 is still a fine pointer, so the correct expectation at 390 is
     "the page works", not "there is no smoother". */
  if (width >= 1440 && !info.smoother) {
    fails.push(`[${width}] WZ.smoother is falsy — ScrollSmoother did not take over`)
  }

  /* `answer` IS ABSENT BELOW 768 ON PURPOSE, on both copies. The answer chapter
     is a pinned horizontal journey on a desktop and a NATIVE SWIPE RAIL on a
     phone — `sections/chapters.js` takes an early return at
     `(hover:none) and (pointer:coarse) || innerWidth < 768` and wires the
     progress bar to the rail's own `scroll` event instead of creating a
     ScrollTrigger. Demanding four pins at 390 fails a page that is behaving
     exactly as designed, so the expectation is per width. */
  const havePins = info.pins.map((p) => p.id)
  for (const want of WANT_PINS) {
    if (want === 'answer' && width < 768) continue
    if (!havePins.includes(want)) fails.push(`[${width}] pin "${want}" does not exist`)
  }
  if (width < 768) {
    if (havePins.includes('answer')) fails.push(`[${width}] the answer chapter pinned at ${width}px — it should be a native swipe rail below 768`)
    const rail = await page.evaluate(() => {
      const t = document.getElementById('answerTrack')
      return t ? { scrollWidth: t.scrollWidth, clientWidth: t.clientWidth, overflowX: getComputedStyle(t).overflowX } : null
    })
    if (!rail) fails.push(`[${width}] #answerTrack is not on the page`)
    else if (!(rail.scrollWidth > rail.clientWidth + 1)) {
      fails.push(`[${width}] the answer rail does not scroll (scrollWidth ${rail.scrollWidth} <= clientWidth ${rail.clientWidth}) — the six cards are unreachable`)
    } else notes.push(`[${width}] answer rail swipes: ${rail.clientWidth} of ${rail.scrollWidth}px, overflow-x ${rail.overflowX}`)
  }

  // --- fonts. By FAMILY, from document.fonts, and only faces that LOADED.
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready
    const loaded = new Set()
    document.fonts.forEach((f) => { if (f.status === 'loaded') loaded.add(f.family.replace(/['"]/g, '')) })
    return {
      loaded: [...loaded],
      declared: document.fonts.size,
      displayFamily: getComputedStyle(document.querySelector('.display')).fontFamily,
    }
  })
  console.log(`    fonts loaded: ${fonts.loaded.join(', ') || '(none)'}  (${fonts.declared} declared)`)
  for (const fam of ['Bodoni Moda', 'Manrope']) {
    if (!fonts.loaded.includes(fam)) fails.push(`[${width}] "${fam}" is declared but never loaded — the page is rendering in a fallback`)
  }

  // --- the hero film. A poster with no playable src looks exactly like a video.
  const film = await page.evaluate(() => {
    const v = document.getElementById('heroFilm')
    if (!v) return null
    return { src: v.currentSrc || v.src, readyState: v.readyState, poster: v.poster, w: v.videoWidth, h: v.videoHeight }
  })
  if (!film) fails.push(`[${width}] #heroFilm is not on the page`)
  else {
    const status = film.src ? (await fetch(film.src, { method: 'HEAD' }).then((r) => r.status).catch(() => 0)) : 0
    console.log(`    heroFilm: ${film.src.replace(BASE, '')} -> ${status}, readyState ${film.readyState}, ${film.w}x${film.h}`)
    if (!film.src) fails.push(`[${width}] #heroFilm has no src — the data-src hydration did not run`)
    if (status !== 200) fails.push(`[${width}] #heroFilm src answered ${status}`)
    if (film.readyState < 1) fails.push(`[${width}] #heroFilm readyState is ${film.readyState} — no metadata, nothing will play`)
  }

  // --- horizontal overflow. Only at the narrow width, where it is a real bug
  //     rather than a scrollbar.
  if (width < 700) {
    const over = await page.evaluate(() => {
      const w = document.documentElement.clientWidth
      const wide = [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > w + 1)
        .slice(0, 8)
        .map((el) => el.tagName.toLowerCase() + '.' + el.className + ' right=' + Math.round(el.getBoundingClientRect().right))
      return { scrollWidth: document.documentElement.scrollWidth, client: w, wide }
    })
    console.log(`    scrollWidth ${over.scrollWidth} vs ${over.client}`)
    if (over.scrollWidth > over.client + 1) {
      fails.push(`[${width}] horizontal overflow: scrollWidth ${over.scrollWidth} > ${over.client}${over.wide.length ? ' — ' + over.wide.join(' | ') : ''}`)
    }
  }

  // --- drive the pins -----------------------------------------------------
  const go = async (y) => {
    await page.evaluate((y) => {
      if (window.WZ && WZ.smoother) WZ.smoother.scrollTo(y, false)
      else window.scrollTo(0, y)
    }, y)
    await sleep(1100)
  }
  const sample = () =>
    page.evaluate(() => {
      const q = (s) => document.querySelector(s)
      const words = [...document.querySelectorAll('#realityBig .wz-word')]
      const lit = words.filter((w) => parseFloat(getComputedStyle(w).opacity) > 0.6).length
      const track = q('#answerTrack')
      const m = track ? new DOMMatrix(getComputedStyle(track).transform) : null
      return {
        y: Math.round(window.WZ && WZ.smoother ? WZ.smoother.scrollTop() : window.scrollY),
        nav: (q('#navCh')?.textContent ?? '') + ' ' + (q('#navName')?.textContent ?? ''),
        realityLit: lit,
        realityWords: words.length,
        answerX: m ? Math.round(m.m41) : null,
        precisionClip: q('#precisionFilm') ? getComputedStyle(q('#precisionFilm')).clipPath : null,
        prWords: [...document.querySelectorAll('.pr-word')].map((w) => +parseFloat(getComputedStyle(w).opacity).toFixed(2)),
        stories: [...document.querySelectorAll('.tr-story')].map((s) => +parseFloat(getComputedStyle(s).opacity).toFixed(2)),
        shots: [...document.querySelectorAll('.tr-shot')].map((s) => getComputedStyle(s).clipPath),
      }
    })

  const series = { reality: [], precision: [], transformation: [] }
  let n = 0
  for (const p of info.pins) {
    for (const f of [0.02, 0.35, 0.65, 0.98]) {
      await go(p.start + (p.end - p.start) * f)
      const s = await sample()
      if (p.id === 'reality') series.reality.push(s.realityLit)
      if (p.id === 'precisionPin') series.precision.push(s.precisionClip)
      if (p.id === 'transPin') series.transformation.push(s.stories)
      console.log(`    ${String(p.id).padEnd(13)} ${f}  y=${String(s.y).padEnd(6)} nav="${s.nav.trim()}" lit=${s.realityLit}/${s.realityWords} answerX=${s.answerX} clip=${String(s.precisionClip).slice(0, 28)} stories=[${s.stories.join(',')}]`)
      await page.screenshot({ path: path.join(SHOTS, `${width}-${String(n++).padStart(2, '0')}-${p.id}-${f}.png`) })
    }
  }

  // reality: the words must light up PROGRESSIVELY, not all at once and not never
  if (series.reality.length) {
    const first = series.reality[0]
    const last = series.reality[series.reality.length - 1]
    const rising = series.reality.every((v, i, a) => i === 0 || v >= a[i - 1])
    if (!(last > first)) fails.push(`[${width}] the reality words never light up (${series.reality.join(' -> ')})`)
    else if (!rising) fails.push(`[${width}] the reality words do not light progressively (${series.reality.join(' -> ')})`)
    else notes.push(`[${width}] reality words ${series.reality.join(' -> ')}`)
  }

  // precision: the clip-path iris must OPEN — a circle that never grows is a
  // black screen with three lines of type on it.
  if (series.precision.length) {
    // The radius is reported in the unit it was AUTHORED in — `circle(6% …)`
    // here, not px — so parse the number and keep the unit out of it. The first
    // version of this looked for `px`, got NaN on every sample, and reported a
    // working iris as broken.
    const r = (v) => {
      const m = /circle\(([\d.]+)/.exec(String(v))
      return m ? parseFloat(m[1]) : String(v) === 'none' ? Infinity : NaN
    }
    const radii = series.precision.map(r)
    if (!(radii[radii.length - 1] > radii[0])) {
      fails.push(`[${width}] the precision iris does not open (${series.precision.map((v) => String(v).slice(0, 20)).join(' -> ')})`)
    } else notes.push(`[${width}] precision iris ${radii.map((x) => Math.round(x)).join(' -> ')} (circle radius, as authored)`)
  }

  // transformation: a different story must be the visible one at the end than
  // at the start.
  if (series.transformation.length) {
    const top = (a) => a.indexOf(Math.max(...a))
    const firstTop = top(series.transformation[0])
    const lastTop = top(series.transformation[series.transformation.length - 1])
    if (firstTop === lastTop) {
      fails.push(`[${width}] the transformation stories do not swap (story ${firstTop} is on top throughout)`)
    } else notes.push(`[${width}] transformation story ${firstTop} -> ${lastTop}`)
  }

  // a viewport shot at the top and at a few fixed depths, for the record
  for (const [name, y] of [['hero', 0], ['answer', 2200], ['surgeon', 4400], ['footer', 99999]]) {
    await go(y)
    await page.screenshot({ path: path.join(SHOTS, `${width}-view-${name}.png`) })
  }

  if (errors.length) fails.push(`[${width}] ${errors.length} console/page error(s):\n      ` + errors.slice(0, 10).join('\n      '))
  else console.log(`    console: clean`)
  await page.close()
}

await browser.close()

console.log(`\nscreenshots -> ${SHOTS}`)
if (notes.length) console.log('\n' + notes.join('\n'))
if (fails.length) {
  console.log('\nFAIL\n  ' + fails.join('\n  '))
  process.exit(1)
}
console.log('\nFAIL  none — the published page moves')
