#!/usr/bin/env node
/**
 * Computed-style parity gate for the CSS migration.
 *
 * Moving rules from the code-asset stylesheet into the style registry changes
 * WHICH FILE a declaration is served from and therefore its position in the
 * cascade. Nothing about that is visible in a text diff of the two bundles, and
 * a screenshot will not catch a lost `transition` or a `gap` that regressed by
 * 2px. The only honest check is: for every element on every published page, is
 * the computed value still the same?
 *
 *   node css-parity.mjs snapshot before      # against the live site, pre-change
 *   node css-parity.mjs snapshot after       # after the cutover is published
 *   node css-parity.mjs diff before after    # must be 0 differences
 *
 * JavaScript is disabled during capture. The site is GSAP-driven and writes
 * inline transforms and opacities as it scrolls, which would swamp the diff
 * with animation noise that has nothing to do with the stylesheet. With scripts
 * off, what is measured is exactly the CSS cascade.
 *
 * Every element is addressed by a structural path (`body>div:nth-child(2)>p`)
 * rather than an index, so a diff points at a node rather than at an offset.
 */

import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import http from 'node:http'
import { connect } from './target.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, 'output')
// --site <client>[:staging] resolves the host (and the admin login --all-pages needs) through target.mjs.
const { api, target } = process.argv.includes('--site') || process.argv.includes('--all-pages')
  ? await connect()
  : { api: null, target: null }
const BASE = (target?.url || process.env.INSTATIC_BASE_URL || 'https://encorercm.com').replace(/\/$/, '')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

/**
 * The viewport every capture is taken at. Set with `WIDTH=390 HEIGHT=844` to
 * gate the mobile layout — the two are separate snapshots and must be compared
 * separately, because a media query that changes at one width says nothing
 * about the other.
 */
const VIEWPORT = {
  width: Number(process.env.WIDTH || 1440),
  height: Number(process.env.HEIGHT || 900),
}

/**
 * The properties worth watching. Deliberately not `getComputedStyle`'s full
 * ~340 longhands: most are inherited defaults that never move, and capturing
 * them makes each page snapshot ~8 MB and the diff unreadable. These are the
 * ones this migration could plausibly break.
 */
const PROPS = [
  'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
  'width', 'height', 'min-height', 'max-width',
  'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'flex-direction', 'flex-wrap', 'align-items', 'justify-content', 'gap',
  'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'text-transform', 'text-align', 'text-decoration-line', 'white-space',
  'color', 'background-color', 'background-image', 'opacity',
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-color', 'border-radius', 'box-shadow',
  'transform', 'transition-property', 'transition-duration', 'overflow-x', 'overflow-y',
  'visibility', 'pointer-events', 'clip-path', 'backdrop-filter', 'mix-blend-mode',
]

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const getJson = (path, port) =>
  new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port, path }, (r) => {
      let d = ''
      r.on('data', (c) => (d += c))
      r.on('end', () => res(JSON.parse(d)))
    }).on('error', rej)
  })

async function browser() {
  const port = 9700 + Math.floor(Math.random() * 200)
  const profile = join(tmpdir(), `cdp-parity-${Date.now()}`)
  const proc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
    '--force-device-scale-factor=1', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' })

  let wsUrl
  for (let i = 0; i < 150 && !wsUrl; i++) {
    try {
      wsUrl = (await getJson('/json/version', port)).webSocketDebuggerUrl
    } catch { await wait(200) }
  }
  if (!wsUrl) throw new Error('Chrome did not expose a debugger socket')

  const sock = new WebSocket(wsUrl)
  const pending = new Map()
  let nextId = 0
  sock.addEventListener('message', async (ev) => {
    const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
    const msg = JSON.parse(raw)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  })
  await new Promise((r) => sock.addEventListener('open', r, { once: true }))

  const send = (method, params = {}, sessionId) =>
    new Promise((res, rej) => {
      const id = ++nextId
      const timer = setTimeout(() => rej(new Error(`timeout ${method}`)), 60000)
      pending.set(id, (m) => {
        clearTimeout(timer)
        m.error ? rej(new Error(m.error.message)) : res(m.result)
      })
      sock.send(JSON.stringify({ id, method, params, sessionId }))
    })

  const target = (await getJson('/json/list', port)).find((t) => t.type === 'page')
  const { sessionId } = await send('Target.attachToTarget', { targetId: target.id, flatten: true })
  const S = (m, p = {}) => send(m, p, sessionId)
  await S('Page.enable')
  await S('Runtime.enable')
  // CSS-only capture: no GSAP writing inline transforms mid-scroll.
  await S('Emulation.setScriptExecutionDisabled', { value: true })
  // `--window-size` sizes the WINDOW, not the viewport, and headless does not
  // reliably give you the one from the other — an early version of this gate
  // ran at some unknown narrow width, so every number it produced described a
  // layout nobody looks at. Pin the viewport explicitly and assert it.
  await S('Emulation.setDeviceMetricsOverride', {
    width: VIEWPORT.width,
    height: VIEWPORT.height,
    deviceScaleFactor: 1,
    mobile: false,
  })

  return {
    S,
    evaluate: async (expression) =>
      (await S('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value,
    close: () => { try { sock.close() } catch {} proc.kill() },
  }
}

/* Animations and transitions are stopped before capture (PARITY_ANIMATIONS=1 keeps them): a looping
   CSS animation is otherwise sampled at whatever frame the capture lands on, and two captures of
   one unchanged page disagree (Stone Med Spa's hero cue, 2026-10-05). Stopped, every element reports
   its resting style, which is what a stylesheet comparison is about. */
const FREEZE = process.env.PARITY_ANIMATIONS === '1' ? '' : `
  if (!document.getElementById('parity-freeze')) {
    const st = document.createElement('style');
    st.id = 'parity-freeze';
    st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}';
    document.head.appendChild(st);
  }`
const CAPTURE = (props) => `(() => {${FREEZE}
  const props = ${JSON.stringify(props)};
  const path = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && n.tagName !== 'HTML'; n = n.parentElement) {
      const tag = n.tagName.toLowerCase();
      const i = n.parentElement ? Array.prototype.indexOf.call(n.parentElement.children, n) + 1 : 1;
      parts.unshift(tag + ':' + i);
    }
    return parts.join('>');
  };
  const out = {};
  // Pseudo-elements are sampled too. This whole design puts its scrims,
  // vignettes and rules in ::before/::after, and a bare getComputedStyle(el)
  // cannot see any of them — which is exactly how two gutted overlay
  // gradients passed a 557,670-value snapshot at 0 differences.
  const PSEUDO = [null, '::before', '::after'];
  for (const el of document.querySelectorAll('body, body *')) {
    if (el.closest('script, style, noscript')) continue;
    for (const pseudo of PSEUDO) {
      const cs = getComputedStyle(el, pseudo);
      // A pseudo-element with no content is not generated; recording it
      // would add two empty bags per element and swamp the diff.
      if (pseudo && (cs.content === 'none' || cs.content === '')) continue;
      const bag = {};
      for (const p of props) bag[p] = cs.getPropertyValue(p);
      if (pseudo) bag['content'] = cs.content;
      out[path(el) + (pseudo || '')] = bag;
    }
  }
  return out;
})()`

async function pageSlugs() {
  // --all-pages: every page row, from the admin API. The homepage's links miss
  // pages nothing links to (ads landing pages, thank-you pages).
  if (process.argv.includes('--all-pages')) {
    const { rows } = await api.getPages()
    return rows.map((r) => String(r.cells?.slug ?? '')).map((s) => (s === 'index' || s === 'home' ? '' : s)).filter((s) => !s.includes('['))
  }
  // Read the published sitemap-ish surface: every internal link from the
  // homepage, plus the homepage. Cheaper and more honest than a hard-coded
  // list, which is what went stale on this project before.
  const html = await fetch(`${BASE}/`).then((r) => r.text())
  const slugs = new Set([''])
  for (const m of html.matchAll(/href="\/([a-z0-9][a-z0-9/-]*)"/g)) {
    const slug = m[1].replace(/\/$/, '')
    if (!slug.includes('.') && !slug.startsWith('_')) slugs.add(slug)
  }
  return [...slugs]
}

const [cmd, a, b] = process.argv.slice(2).filter((x, i, all) => !x.startsWith('--') && all[i - 1] !== '--site')
mkdirSync(TMP, { recursive: true })

if (cmd === 'snapshot') {
  if (!a) throw new Error('usage: css-parity.mjs snapshot <label>')
  const slugs = await pageSlugs()
  console.log(`capturing ${slugs.length} pages from ${BASE} at ${VIEWPORT.width}x${VIEWPORT.height} (scripts disabled)`)
  const br = await browser()
  const snapshot = {}
  try {
    for (const slug of slugs) {
      await br.S('Page.navigate', { url: `${BASE}/${slug}` })
      // Wait for the document AND its stylesheets (readyState 'complete'), then settle. A fixed
      // 2.5 s used to be enough; on a busy machine it captured a page before its CSS arrived
      // (Stone Surgical Arts hipaa-disclosure, 2026-10-05: 381 phantom differences).
      await wait(800)
      for (let t = 0; t < 120; t++) {
        const ready = await br.evaluate(`document.readyState === 'complete' && [...document.styleSheets].length > 0`).catch(() => false)
        if (ready) break
        await wait(500)
      }
      // and for web fonts: a fallback face wraps text differently (Stone Surgical Arts hipaa, +2px
      // paragraphs under load). `document.fonts.ready` can resolve before the CSS declaring the faces
      // is parsed, so wait until no face is still loading.
      for (let t = 0; t < 40; t++) {
        const fontsDone = await br.evaluate(`document.fonts.status === 'loaded' && ![...document.fonts].some((f) => f.status === 'loading')`).catch(() => true)
        if (fontsDone) break
        await wait(250)
      }
      await wait(1200)
      const data = await br.evaluate(CAPTURE(PROPS))
      snapshot[slug || '/'] = data
      console.log(`  ${(slug || '/').padEnd(34)} ${Object.keys(data ?? {}).length} elements`)
    }
  } finally {
    br.close()
  }
  const file = join(TMP, `parity-${a}-${VIEWPORT.width}.json`)
  writeFileSync(file, JSON.stringify(snapshot), 'utf8')
  console.log(`\nwrote ${file}`)
} else if (cmd === 'diff') {
  const load = (label) => {
    const f = join(TMP, `parity-${label}-${VIEWPORT.width}.json`)
    if (!existsSync(f)) throw new Error(`no snapshot "${label}" — run: css-parity.mjs snapshot ${label}`)
    return JSON.parse(readFileSync(f, 'utf8'))
  }
  const before = load(a)
  const after = load(b)
  let differences = 0
  let compared = 0
  for (const page of Object.keys(before)) {
    if (!after[page]) {
      console.log(`PAGE MISSING after: ${page}`)
      differences++
      continue
    }
    for (const [path, props] of Object.entries(before[page])) {
      const now = after[page][path]
      if (!now) {
        console.log(`${page}  ${path}  ELEMENT GONE`)
        differences++
        continue
      }
      for (const [prop, was] of Object.entries(props)) {
        compared++
        if (now[prop] !== was) {
          console.log(`${page}  ${path}  ${prop}: ${was}  ->  ${now[prop]}`)
          differences++
        }
      }
    }
  }
  console.log(`\ncompared ${compared} computed values across ${Object.keys(before).length} pages`)
  console.log(differences === 0 ? 'PARITY OK — no computed style changed' : `${differences} DIFFERENCES`)
  process.exit(differences === 0 ? 0 : 1)
} else {
  console.error('usage: css-parity.mjs snapshot <label> | diff <before> <after>')
  process.exit(2)
}
