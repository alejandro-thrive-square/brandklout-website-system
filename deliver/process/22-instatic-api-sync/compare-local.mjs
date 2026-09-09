#!/usr/bin/env node
/**
 * Compare the LOCAL build against the published Instatic page.
 *
 * The parity gate in `css-parity.mjs` compares Instatic to Instatic — it proves
 * a change did not move anything, which is the right question during a
 * migration and the wrong one afterwards. The local coded build is the design's
 * source of truth and the thing that is easy to poke at, so this answers the
 * other question: **does Instatic still look like the build?**
 *
 *   node compare-local.mjs index                     # whole page
 *   node compare-local.mjs index .ch-transformation  # one section
 *   WIDTH=390 node compare-local.mjs index
 *
 * It serves `04-design/.tmp/final-site` on a throwaway port, opens both pages at
 * the same pinned viewport with scripts disabled, walks the two subtrees in
 * lockstep, and reports the first computed difference per element.
 *
 * Elements are paired positionally after the structural check, so a structural
 * difference is reported as such rather than as a thousand style differences.
 *
 * Two things it will report that are NOT defects:
 *
 * - **Structural gaps with scripts disabled.** Instatic's importer deletes empty
 *   inline elements, so `<button class="burger"><span></span><span></span>`
 *   arrives empty and the site's own runtime rebuilds the bars. Scripts are off
 *   here (otherwise GSAP's inline transforms swamp the style diff), so those
 *   nodes are missing from the Instatic side. Scope to a section that does not
 *   depend on runtime repair, or read a whole-page structural gap as "check
 *   whether JS rebuilds it" rather than "it is broken".
 * - **`aspect-ratio` and a `background-image` on `<img>`.** Instatic's image
 *   module emits width/height (giving an intrinsic ratio) and a blurhash LQIP
 *   placeholder. Both are platform features that prevent layout shift; the
 *   local build has neither.
 */

import { spawn } from 'node:child_process'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, dirname, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import http from 'node:http'

const HERE = dirname(fileURLToPath(import.meta.url))
const LOCAL_ROOT = join(HERE, '..', '04-design', '.tmp', 'final-site')
const REMOTE = (process.env.INSTATIC_BASE_URL || 'https://encorercm.com').replace(/\/$/, '')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const VIEWPORT = { width: Number(process.env.WIDTH || 1440), height: Number(process.env.HEIGHT || 900) }

const PROPS = [
  'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
  'width', 'height', 'min-height', 'max-width', 'aspect-ratio',
  'margin-top', 'margin-bottom', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'flex-direction', 'align-items', 'justify-content', 'gap',
  'grid-template-columns', 'grid-template-rows',
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform',
  'color', 'background-color', 'background-image', 'opacity', 'visibility',
  'border-radius', 'box-shadow', 'transform', 'clip-path', 'overflow-x', 'overflow-y',
  'transition-property', 'transition-duration', 'pointer-events', 'object-fit',
]

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon',
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

function serveLocal() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0])
    let file = join(LOCAL_ROOT, normalize(rel).replace(/^(\.\.[/\\])+/, ''))
    if (rel === '/' ) file = join(LOCAL_ROOT, 'index.html')
    if (!existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return
    }
    res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })))
}

const getJson = (path, port) => new Promise((res, rej) => {
  http.get({ host: '127.0.0.1', port, path }, (r) => {
    let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)))
  }).on('error', rej)
})

async function browser() {
  const port = 9300 + Math.floor(Math.random() * 300)
  const proc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${port}`, '--remote-allow-origins=*',
    '--force-device-scale-factor=1', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${join(tmpdir(), `cdp-cmp-${Date.now()}`)}`, 'about:blank',
  ], { stdio: 'ignore' })
  let wsUrl
  for (let i = 0; i < 150 && !wsUrl; i++) {
    try { wsUrl = (await getJson('/json/version', port)).webSocketDebuggerUrl } catch { await wait(200) }
  }
  if (!wsUrl) throw new Error('Chrome did not expose a debugger socket')
  const sock = new WebSocket(wsUrl)
  const pending = new Map()
  let nextId = 0
  sock.addEventListener('message', async (ev) => {
    const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
    const m = JSON.parse(raw)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  })
  await new Promise((r) => sock.addEventListener('open', r, { once: true }))
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const id = ++nextId
    const t = setTimeout(() => rej(new Error(`timeout ${method}`)), 60000)
    pending.set(id, (m) => { clearTimeout(t); m.error ? rej(new Error(m.error.message)) : res(m.result) })
    sock.send(JSON.stringify({ id, method, params, sessionId }))
  })
  const target = (await getJson('/json/list', port)).find((t) => t.type === 'page')
  const { sessionId } = await send('Target.attachToTarget', { targetId: target.id, flatten: true })
  const S = (m, p = {}) => send(m, p, sessionId)
  await S('Page.enable'); await S('Runtime.enable')
  await S('Emulation.setScriptExecutionDisabled', { value: true })
  await S('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, deviceScaleFactor: 1, mobile: false })
  return {
    S,
    ev: async (expression) => (await S('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value,
    close: () => { try { sock.close() } catch {} proc.kill() },
  }
}

/** Walk a subtree depth-first, capturing a tag/class signature plus computed styles. */
const CAPTURE = (selector, props) => `(() => {
  const root = document.querySelector(${JSON.stringify(selector)});
  if (!root) return null;
  const out = [];
  const walk = (el) => {
    const cs = getComputedStyle(el);
    const bag = {};
    for (const p of ${JSON.stringify(props)}) bag[p] = cs.getPropertyValue(p);
    out.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.getAttribute('class') || '').split(/\\s+/).filter(Boolean).sort().join(' '),
      styles: bag,
    });
    for (const kid of el.children) {
      if (['SCRIPT','STYLE','NOSCRIPT'].includes(kid.tagName)) continue;
      walk(kid);
    }
  };
  walk(root);
  return out;
})()`

const page = process.argv[2] ?? 'index'
const selector = process.argv[3] ?? 'body'
const { server, port } = await serveLocal()
const br = await browser()
let localData, remoteData
try {
  await br.S('Page.navigate', { url: `http://127.0.0.1:${port}/${page}.html` })
  await wait(2500)
  localData = await br.ev(CAPTURE(selector, PROPS))
  const slug = page === 'index' ? '' : page
  await br.S('Page.navigate', { url: `${REMOTE}/${slug}` })
  await wait(2500)
  remoteData = await br.ev(CAPTURE(selector, PROPS))
} finally {
  br.close(); server.close()
}

if (!localData) { console.error(`selector ${selector} not found in the local build`); process.exit(2) }
if (!remoteData) { console.error(`selector ${selector} not found on Instatic`); process.exit(2) }

console.log(`${page}  ${selector}  @ ${VIEWPORT.width}x${VIEWPORT.height}`)
console.log(`elements — local ${localData.length}, instatic ${remoteData.length}`)

if (localData.length !== remoteData.length) {
  console.log('\nSTRUCTURAL DIFFERENCE — element counts differ, styles not compared.')
  const n = Math.min(localData.length, remoteData.length)
  for (let i = 0; i < n; i++) {
    if (localData[i].tag !== remoteData[i].tag || localData[i].cls !== remoteData[i].cls) {
      console.log(`  first divergence at #${i}:`)
      console.log(`    local:    <${localData[i].tag} class="${localData[i].cls}">`)
      console.log(`    instatic: <${remoteData[i].tag} class="${remoteData[i].cls}">`)
      break
    }
  }
  process.exit(1)
}

let diffs = 0
for (let i = 0; i < localData.length; i++) {
  const a = localData[i], b = remoteData[i]
  if (a.tag !== b.tag || a.cls !== b.cls) {
    console.log(`#${i} STRUCTURE  local <${a.tag} class="${a.cls}">  vs  instatic <${b.tag} class="${b.cls}">`)
    diffs++
    continue
  }
  const changed = Object.entries(a.styles).filter(([p, v]) => b.styles[p] !== v)
  if (!changed.length) continue
  console.log(`#${i} <${a.tag}${a.cls ? ` class="${a.cls}"` : ''}>`)
  for (const [p, v] of changed) console.log(`      ${p}: local ${JSON.stringify(v)}  instatic ${JSON.stringify(b.styles[p])}`)
  diffs += changed.length
}
console.log(`\n${diffs === 0 ? 'MATCHES the local build' : `${diffs} differences from the local build`}`)
