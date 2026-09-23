#!/usr/bin/env node
/**
 * Does the PUBLISHED Instatic page still look like the LOCAL build?
 *
 * `verify-live.mjs` proves the routes are healthy and the assets resolve. That
 * is a different question from whether the page looks right, and this build has
 * now lost eleven custom properties, two background textures and seven
 * @font-face rules to the import at various times, every one of which passed
 * `verify-live.mjs` and looked deliberate rather than broken. So: measure both
 * pages and diff them.
 *
 * There is a `compare-local.mjs` in the Nahlah workflow. It walks the two DOMs
 * in LOCKSTEP by position, which is the right call for a site whose importer
 * preserves structure and the wrong one here: Instatic drops empty inline
 * elements (the burger's three spans), collapses a <button>'s children into a
 * label string, and rewrites <img> into a module that emits its own width,
 * height and blurhash. A positional walk reports the first of those as a
 * structural break and then gives up on the rest of the page.
 *
 * So this keys on the thing the importer DOES preserve: an element's tag and
 * its class list. Every element on each side becomes
 * `tag.class-a.class-b#<n>` where n is the nth occurrence of that exact
 * combination in document order, and the two maps are diffed on their
 * intersection. A node the importer moved is still matched; a node it dropped
 * is reported as missing, once, by name.
 *
 * THREE PASSES, because they fail differently:
 *
 *   1. STYLE, scripts off. The CSS cascade with no runtime writing inline
 *      transforms over it. This is where a missing token or a dropped rule
 *      shows up.
 *   2. GEOMETRY, scripts off. Bounding boxes, which catch a layout that
 *      computes the same and lays out differently — a grid whose track list is
 *      identical but whose content is not.
 *   3. RUNTIME, scripts on. Only the states the site sets itself: does the
 *      published page reach the same `.is-*` classes, the same `hidden`
 *      attributes and the same custom properties as the local one? A control
 *      that never boots is invisible to passes 1 and 2.
 *
 * KNOWN-BENIGN differences are declared in `BENIGN` below with a reason each.
 * Anything not on that list is reported. Resist adding to it to make the run
 * quiet: three of this build's published defects would have been caught a day
 * earlier by a check exactly like this one.
 *
 *   node compare-live.mjs                     # both pages, 1440 and 390
 *   node compare-live.mjs neck-lift           # one page
 *   node compare-live.mjs neck-lift 1440      # one page, one width
 *   node compare-live.mjs --shots             # also write viewport PNG pairs
 */
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { PAGES as TREATMENT_PAGES } from '../04-design/.tmp/med-spa/site-src/treatment-pages.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const LOCAL_ROOT = path.resolve(HERE, '../04-design/.tmp/med-spa/final-site')
const SHOTS = path.join(HERE, '.tmp', 'compare')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const PORT = 8821

function loadEnv() {
  let dir = HERE
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, '.env')
    if (fs.existsSync(c)) {
      for (const line of fs.readFileSync(c, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^([A-Z_]+)=(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
      }
      return
    }
    const up = path.dirname(dir)
    if (up === dir) break
    dir = up
  }
}
loadEnv()
const REMOTE = (process.env.INSTATIC_BASE_URL || '').replace(/\/$/, '')
if (!REMOTE) throw new Error('INSTATIC_BASE_URL is not set')

const args = process.argv.slice(2).filter((a) => a !== '--shots')
const wantShots = process.argv.includes('--shots')
const PAGES = args.find((a) => /^[a-z-]+$/.test(a)) ? [args.find((a) => /^[a-z-]+$/.test(a))] : ['index', 'treatments', 'botox', 'results', 'membership', 'financing', 'meet-the-doctor', 'team', 'about', 'book', 'thank-you', 'privacy-policy', 'terms-of-service', ...Object.keys(TREATMENT_PAGES)]
const WIDTHS = args.find((a) => /^\d+$/.test(a)) ? [Number(args.find((a) => /^\d+$/.test(a)))] : [1440, 390]

/* The properties worth comparing. Deliberately wide: the failures this exists
   to catch have been a font-size, a background-image and a padding, and a
   narrow list would have missed two of the three. */
const PROPS = [
  'display', 'position', 'z-index', 'box-sizing',
  'width', 'height', 'min-height', 'max-width', 'aspect-ratio',
  'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'flex-direction', 'flex-wrap', 'align-items', 'align-self', 'justify-content', 'justify-self',
  'gap', 'grid-template-columns', 'grid-template-rows', 'grid-template-areas', 'order',
  'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing',
  'text-transform', 'text-align', 'text-decoration-line', 'white-space', 'font-variant-numeric',
  'color', 'background-color', 'background-image', 'background-size', 'background-position',
  'background-attachment', 'opacity', 'visibility',
  'border-top-width', 'border-bottom-width', 'border-left-width', 'border-right-width',
  'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
  'border-radius', 'box-shadow', 'transform', 'overflow-x', 'overflow-y', 'object-fit',
  'object-position', 'list-style-type', 'vertical-align', 'accent-color',
]

/* --- known-benign, with a reason each -------------------------------------
   `test` gets { key, prop, local, live } and returns true to suppress. */
const BENIGN = [
  {
    why: 'Instatic\u2019s image module emits width/height and a blurhash LQIP; the local build has neither. Both are anti-layout-shift platform features.',
    test: ({ key, prop }) => /^img/.test(key) && ['aspect-ratio', 'background-image', 'background-size', 'background-position', 'background-color'].includes(prop),
  },
  {
    why: 'The published <img> is served from /uploads with responsive variants, so the URL and the intrinsic size differ by design.',
    test: ({ key, prop }) => /^img/.test(key) && ['width', 'height', 'max-width'].includes(prop),
  },
  {
    why: 'Fonts load from /uploads/fonts on Instatic and assets/fonts locally, so metrics settle a fraction differently and line-height in px can differ by under a pixel.',
    test: ({ prop, local, live }) => {
      if (prop !== 'line-height') return false
      const a = parseFloat(local), b = parseFloat(live)
      return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1.01
    },
  },
  {
    why: 'Instatic rewrites every url() to a responsive image-set of its own variants. Same picture, six sizes. Compared on the FILENAME instead.',
    test: ({ prop, local, live }) => {
      if (!/background-image|content/.test(prop)) return false
      const stem = (s) => [...String(s).matchAll(/([\w-]+?)(?:-w\d+)?\.(webp|jpg|jpeg|png|avif)/g)].map((m) => m[1]).join(',')
      const a = stem(local), b = stem(live)
      return !!a && a === b
    },
  },
  {
    why: 'The `.navbar_burger:empty` repair, working as designed. base.button drops the three spans that draw the bars, so the imported button paints them itself from pseudo-elements and takes `position: relative` and an explicit `color` to do it. See trap 15.',
    test: ({ key, prop }) => /^button\.navbar_burger/.test(key) && ['position', 'color'].includes(prop),
  },
  {
    why: 'A grid track list of computed pixel values, agreeing to within a pixel per track.',
    test: ({ prop, local, live }) => {
      if (!/^grid-template-(columns|rows)$/.test(prop)) return false
      const nums = (s) => String(s).trim().split(/\s+/).map(parseFloat)
      const a = nums(local), b = nums(live)
      return a.length === b.length && a.every((v, i) => Number.isFinite(v) && Number.isFinite(b[i]) && Math.abs(v - b[i]) < 1.01)
    },
  },
  {
    why: 'Instatic rewrites every url() into a responsive image-set of its own variants: same picture, six sizes, plus a media-library id in front of the filename. Compared on the stem instead.',
    test: ({ prop, local, live }) => {
      if (!/background-image/.test(prop)) return false
      const stems = (s) =>
        [...String(s).matchAll(/([A-Za-z0-9_-]+?)(?:-w\d+)?\.(?:webp|jpg|jpeg|png|avif)/g)].map((m) => m[1])
      const a = stems(local)
      const b = stems(live)
      if (!a.length || !b.length) return false
      // Every local file has to appear on the live side, allowing for the id
      // prefix the media library adds.
      return a.every((x) => b.some((y) => y === x || y.endsWith('-' + x)))
    },
  },
  {
    why: 'The `.navbar_burger:empty` repair, working as designed: base.button drops the three spans that draw the bars, so the imported button paints them from pseudo-elements and needs `position: relative` and an explicit `color` to do it. See trap 15.',
    test: ({ key, prop }) => /^button\.navbar_burger/.test(key) && ['position', 'color'].includes(prop),
  },
  {
    why: 'A grid track list of computed pixel values agreeing to within a pixel per track.',
    test: ({ prop, local, live }) => {
      if (!/^grid-template-(columns|rows)$/.test(prop)) return false
      const nums = (s) => String(s).trim().split(/\s+/).map(parseFloat)
      const a = nums(local)
      const b = nums(live)
      return a.length === b.length && a.every((v, i) => Number.isFinite(v) && Number.isFinite(b[i]) && Math.abs(v - b[i]) < 1.01)
    },
  },
  {
    why: 'Sub-pixel layout: a computed length within 1px of the other side is the same value rounded differently.',
    test: ({ prop, local, live }) => {
      if (!/^(width|height|min-height|margin|padding|gap|border-.*-width)/.test(prop)) return false
      const a = parseFloat(local), b = parseFloat(live)
      return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 1.01
    },
  },
]

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.json': 'application/json',
}
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0])
  if (p === '/') p = '/index.html'
  const f = path.join(LOCAL_ROOT, p)
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf') }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' })
  fs.createReadStream(f).pipe(res)
})
await new Promise((r) => server.listen(PORT, r))

/* --- the probe, run in both pages ---------------------------------------- */
const PROBE = (props) => {
  const seen = new Map()
  const out = {}
  const geo = {}
  // svg and path are skipped since 2026-09-02: they carry no class, Instatic
  // strips the SVG out of any <button> (trap 15, repaired by CSS), and the
  // two missing arrows then shifted every later icon's index so the diff
  // reported thirty colour and alignment findings that were the same icons
  // one place apart. The icons' own boxes are covered by their parents.
  const skip = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD', 'svg', 'path', 'circle', 'rect'])
  for (const el of document.querySelectorAll('body *')) {
    if (skip.has(el.tagName)) continue
    const cls = (el.className && el.className.toString ? el.className.toString() : '')
      .split(/\s+/).filter(Boolean)
      // Runtime state classes are compared separately in the runtime pass; a
      // page mid-reveal would otherwise report every element as different.
      .filter((c) => !/^(is-|js$)/.test(c))
      .sort()
      .join('.')
    if (!cls) continue
    const base = el.tagName.toLowerCase() + '.' + cls
    const n = (seen.get(base) ?? 0)
    seen.set(base, n + 1)
    const key = base + '#' + n
    const cs = getComputedStyle(el)
    const rec = {}
    for (const p of props) rec[p] = cs.getPropertyValue(p)
    out[key] = rec
    const r = el.getBoundingClientRect()
    geo[key] = [Math.round(r.width), Math.round(r.height), Math.round(r.x), Math.round(r.y + window.scrollY)]
  }
  return { styles: out, geo, text: document.body.innerText.replace(/\s+/g, ' ').trim() }
}

const RUNTIME_PROBE = () => {
  const state = {}
  const add = (sel, fn) => {
    document.querySelectorAll(sel).forEach((el, i) => { state[sel + '#' + i] = fn(el) })
  }
  add('[class]', (el) => {
    const runtime = (el.className.toString().match(/\bis-[\w-]+/g) || []).sort().join(' ')
    return runtime || null
  })
  const clean = {}
  for (const [k, v] of Object.entries(state)) if (v) clean[k.replace('[class]', '')] = v
  const rs = getComputedStyle(document.documentElement)
  return {
    runtimeClasses: clean,
    jsScope: document.documentElement.classList.contains('js'),
    hiddenPanels: [...document.querySelectorAll('.layers_panel')].map((p) => p.hidden),
    tokens: Object.fromEntries(
      ['--gutter', '--section', '--size-display', '--size-h3-j', '--spec-w', '--ivory', '--fg', '--accent']
        .map((t) => [t, rs.getPropertyValue(t).trim()]),
    ),
    tallies: {
      tabs: document.querySelectorAll('.layers_tab').length,
      checks: document.querySelectorAll('.check_input').length,
      tlStops: document.querySelectorAll('.tl_stop').length,
      tocLinks: document.querySelectorAll('.toc_link').length,
      navLinks: document.querySelectorAll('.navbar_link').length,
      drawerLinks: document.querySelectorAll('.drawer_link').length,
      burgerKids: (document.querySelector('.navbar_burger') || { children: [] }).children.length,
    },
  }
}

async function capture(browser, url, width, height, withJs) {
  const pg = await browser.newPage()
  await pg.setJavaScriptEnabled(withJs)
  await pg.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await pg.setViewport({ width, height })
  await pg.goto(url, { waitUntil: 'networkidle0', timeout: 90000 })
  if (withJs) {
    await pg.evaluate(async () => {
      await new Promise((r) => { let y = 0; const t = setInterval(() => { window.scrollBy(0, 700); y += 700; if (y > document.body.scrollHeight) { clearInterval(t); r() } }, 25) })
      window.scrollTo({ top: 0, behavior: 'instant' })
    })
    await wait(1400)

    /* WAIT FOR THE PAGE TO STOP MOVING, rather than trusting a fixed 1400ms.

       Added 2026-09-04 while chasing an intermittent finding, and it did NOT
       fix that one — read the note below before spending time on it again. It
       stays because waiting for the document to hold still is right anyway and
       costs nothing on a settled page.

       > [!NOTE]
       > **THE `container-large` 8px AUTO-MARGIN FINDING IS COMPARISON NOISE,
       > and the proof is that its DIRECTION FLIPS.** The same publish reported
       > 2, then 6, then 4 findings on consecutive runs, on different pages each
       > time, always the same shape: a `container-large` whose `margin: 0 auto`
       > reads 8px on one side and 0px on the other. Probing the two pages
       > directly showed all ten containers identical — and on the run after
       > that, the SAME two containers read 0px LOCALLY and 8px live, the
       > opposite of what the gate had just reported. A real publish difference
       > does not change sides.
       >
       > The mechanism is the scroll pass this function performs: the pinned
       > sections' spacers exist or do not exist depending on where GSAP is in
       > its own setup, and `.padding-global`'s `5%` resolves against whatever
       > the containing block is at that instant (72px against 1440, 80px
       > against 1600), which moves an auto margin by exactly 8px.
       >
       > So do not chase it as a styling bug, and do NOT add it to the IGNORE
       > list either: an 8px margin on this class could one day be real, and a
       > suppressed finding is worse than a noisy one. */
    await pg.evaluate(async () => {
      const dims = () => [
        document.documentElement.scrollWidth,
        document.documentElement.scrollHeight,
        Math.round(document.body.getBoundingClientRect().width),
      ].join('x')
      let last = dims()
      let stable = 0
      for (let i = 0; i < 60 && stable < 3; i++) {
        await new Promise((r) => setTimeout(r, 100))
        const now = dims()
        stable = now === last ? stable + 1 : 0
        last = now
      }
    })
  } else {
    await wait(500)
  }
  const data = await pg.evaluate(withJs ? RUNTIME_PROBE : PROBE, withJs ? undefined : PROPS)
  return { pg, data }
}

const findings = []
const note = (page, width, kind, detail) => findings.push({ page, width, kind, detail })

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--hide-scrollbars'],
})

for (const slug of PAGES) {
  const localUrl = `http://127.0.0.1:${PORT}/${slug}.html`
  const liveUrl = REMOTE + (slug === 'index' ? '/' : `/${slug}`)

  for (const width of WIDTHS) {
    const height = width < 700 ? 844 : 900
    const a = await capture(browser, localUrl, width, height, false)
    const b = await capture(browser, liveUrl, width, height, false)

    // --- structure
    const keysA = Object.keys(a.data.styles)
    const keysB = new Set(Object.keys(b.data.styles))
    const missing = keysA.filter((k) => !keysB.has(k))
    const extra = [...keysB].filter((k) => !a.data.styles[k])
    if (missing.length) note(slug, width, 'missing on live', missing.slice(0, 12).join(', ') + (missing.length > 12 ? ` (+${missing.length - 12})` : ''))
    if (extra.length) note(slug, width, 'only on live', extra.slice(0, 8).join(', ') + (extra.length > 8 ? ` (+${extra.length - 8})` : ''))

    // --- style
    const styleDiffs = []
    for (const k of keysA) {
      if (!keysB.has(k)) continue
      for (const p of PROPS) {
        const la = a.data.styles[k][p], lb = b.data.styles[k][p]
        if (la === lb) continue
        if (BENIGN.some((r) => r.test({ key: k, prop: p, local: la, live: lb }))) continue
        styleDiffs.push({ key: k, prop: p, local: la, live: lb })
      }
    }
    // Group by property so one missing token reads as one finding rather than
    // as four hundred.
    const byProp = new Map()
    for (const d of styleDiffs) {
      const g = byProp.get(d.prop) ?? []
      g.push(d)
      byProp.set(d.prop, g)
    }
    for (const [prop, g] of [...byProp.entries()].sort((x, y) => y[1].length - x[1].length)) {
      // Every affected element, not just the first: a property that differs on
      // eighteen elements is either one bug or eighteen, and only the list says
      // which. This tool exists to find things, not to summarise them.
      const lines = g.slice(0, 16).map(
        (d) => `${d.key}\n            local "${String(d.local).slice(0, 80)}"\n            live  "${String(d.live).slice(0, 80)}"`,
      )
      note(
        slug,
        width,
        `style: ${prop}`,
        `${g.length} element(s)\n        ` + lines.join('\n        ') + (g.length > 16 ? `\n        (+${g.length - 16} more)` : ''),
      )
    }

    // --- geometry
    const geoDiffs = []
    for (const k of keysA) {
      if (!b.data.geo[k]) continue
      const [aw, ah, ax] = a.data.geo[k], [bw, bh, bx] = b.data.geo[k]
      if (Math.abs(aw - bw) > 2 || Math.abs(ah - bh) > 3 || Math.abs(ax - bx) > 2) {
        geoDiffs.push(`${k} local ${aw}x${ah}@${ax} live ${bw}x${bh}@${bx}`)
      }
    }
    if (geoDiffs.length) note(slug, width, 'geometry', `${geoDiffs.length} element(s)\n        ` + geoDiffs.slice(0, 20).join('\n        '))

    // --- text
    if (a.data.text !== b.data.text) {
      const A = a.data.text, B = b.data.text
      let i = 0
      while (i < A.length && i < B.length && A[i] === B[i]) i++
      note(slug, width, 'text', `diverges at char ${i} of ${A.length}/${B.length}\n        local "${A.slice(i, i + 90)}"\n        live  "${B.slice(i, i + 90)}"`)
    }

    if (wantShots) {
      fs.mkdirSync(SHOTS, { recursive: true })
      await a.pg.screenshot({ path: path.join(SHOTS, `${slug}-${width}-local.png`), fullPage: false })
      await b.pg.screenshot({ path: path.join(SHOTS, `${slug}-${width}-live.png`), fullPage: false })
    }
    await a.pg.close(); await b.pg.close()
  }

  // --- runtime, once per page at the desktop width
  const ra = await capture(browser, localUrl, 1440, 900, true)
  const rb = await capture(browser, liveUrl, 1440, 900, true)
  const j = JSON.stringify
  /* `burgerKids` is expected to be 3 locally and 0 live, permanently: Instatic's
     `base.button` carries a label string and no children, so the three spans
     that draw the bars never survive the import. `.navbar_burger:empty` in
     51-dossier.css redraws them from pseudo-elements, which is why the two
     pages LOOK the same while this count does not match. See trap 15.
     It is asserted rather than skipped, so the day the importer starts keeping
     children this says so and the `:empty` repair can be retired. */
  for (const [k, v] of Object.entries(ra.data.tallies)) {
    const live = rb.data.tallies[k]
    if (v === live) continue
    if (k === 'burgerKids' && v === 3 && live === 0) continue
    note(slug, 'runtime', `count: ${k}`, `local ${v}, live ${live}`)
  }
  for (const [k, v] of Object.entries(ra.data.tokens)) {
    if (v !== rb.data.tokens[k]) note(slug, 'runtime', `token: ${k}`, `local "${v}", live "${rb.data.tokens[k]}"`)
  }
  if (ra.data.jsScope !== rb.data.jsScope) note(slug, 'runtime', 'the .js scope', `local ${ra.data.jsScope}, live ${rb.data.jsScope}`)
  if (j(ra.data.hiddenPanels) !== j(rb.data.hiddenPanels)) note(slug, 'runtime', 'tab panels hidden', `local ${j(ra.data.hiddenPanels)}, live ${j(rb.data.hiddenPanels)}`)
  const rcA = ra.data.runtimeClasses, rcB = rb.data.runtimeClasses
  const rcKeys = new Set([...Object.keys(rcA), ...Object.keys(rcB)])
  const rcDiff = [...rcKeys].filter((k) => rcA[k] !== rcB[k]).map((k) => `${k}: local "${rcA[k] ?? '-'}" live "${rcB[k] ?? '-'}"`)
  if (rcDiff.length) note(slug, 'runtime', 'is-* classes', `${rcDiff.length}\n        ` + rcDiff.slice(0, 8).join('\n        '))
  await ra.pg.close(); await rb.pg.close()
}

await browser.close()
server.close()

console.log(`\nlocal  ${LOCAL_ROOT}\nlive   ${REMOTE}\n`)
if (!findings.length) {
  console.log('no differences')
} else {
  let page = null
  for (const f of findings) {
    if (f.page !== page) { console.log(`\n=== ${f.page}`); page = f.page }
    console.log(`  [${f.width}] ${f.kind}\n        ${f.detail}`)
  }
  console.log(`\n${findings.length} finding(s)`)
  process.exitCode = 1
}
