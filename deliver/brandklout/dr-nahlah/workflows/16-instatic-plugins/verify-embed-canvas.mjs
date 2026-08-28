#!/usr/bin/env node
/**
 * Does the EDITOR CANVAS show the card instead of the embed?
 *
 *   node verify-embed-canvas.mjs --place     write the temp DRAFT page (no publish)
 *   node verify-embed-canvas.mjs --check     drive the admin editor under CDP
 *   node verify-embed-canvas.mjs --cleanup   delete the temp page (no publish)
 *
 * This is the live counterpart to the `preview()` half of `test-embed-module.mjs`,
 * and it exists because the other two gates each miss it:
 *
 *   - `test-embed-module.mjs` proves the STRING the module returns, with no host.
 *     It cannot prove the host calls `preview()` rather than `render()`, or that
 *     what lands in the canvas DOM is what the module returned;
 *   - `verify-embed-editor.mjs` proves a person is OFFERED the block, by driving
 *     the inserter. It places an UNCONFIGURED block on purpose, so it never
 *     renders a card at all — and its synthetic click on the picker is the
 *     flakiest step in the whole toolkit (see §Gotchas: the first click after a
 *     navigation frequently does not reach React's handler).
 *
 * So this gate skips the inserter entirely and writes CONFIGURED nodes straight
 * into the draft, the way `verify-embed-module.mjs` does for the publish path —
 * except it never publishes, because the editor reads the draft. A publish on
 * Instatic bakes EVERY page, and nothing about canvas rendering needs one.
 *
 * What it asserts, per breakpoint canvas: every embed rendered a card; NO
 * `<iframe>` was created anywhere inside a module; NO `<script>` or `<style>`
 * from a pasted snippet reached the editor document; and the card names the
 * host, which is the one thing a person needs off it.
 *
 * Requires the plugin installed and enabled, and a live session cached by
 * `lib/insta-api.mjs` (run any script that logs in first).
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { api, getSite, getPages, BASE } from './lib/insta-api.mjs'

const SLUG = 'plugin-embed-canvas-test'
const MODULE_ID = 'webzite.embed-origins.embed'
const PLUGIN_ID = 'webzite.embed-origins'
const EDITOR_URL = `${BASE}/admin/site?page=${SLUG}`

const FRAME_HOST = 'reputationhub.site'
const SCRIPT_HOST = 'link.msgsndr.com'

const arg = (f) => process.argv.includes(f)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

/* Three blocks, chosen so that each way the OLD preview() misbehaved would show
   up as a distinct failure here rather than as one lump. */
const BLOCKS = [
  {
    id: 'wzcanvasurlauto',
    props: {
      source: 'url', url: `https://${FRAME_HOST}/reputation/widgets/review_widget/xJDu`,
      title: 'Patient reviews', fit: 'auto', height: 600, lazy: true,
      allowFullscreen: false, allow: '', snippet: '', ratio: '16 / 9',
    },
  },
  {
    id: 'wzcanvasurlratio',
    props: {
      source: 'url', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      title: 'A video', fit: 'ratio', ratio: '16 / 9', height: 600, lazy: true,
      allowFullscreen: true, allow: '', snippet: '',
    },
  },
  {
    /* The nasty one: a script AND a stylesheet in the same paste. Under the old
       preview() the <style> escaped the module and restyled the admin. */
    id: 'wzcanvassnippet',
    props: {
      source: 'snippet', url: '', title: '', fit: 'fixed', height: 400,
      ratio: '16 / 9', lazy: true, allowFullscreen: false, allow: '',
      snippet: `<div class="wz-canvas-probe"></div>` +
        `<style>.wz-canvas-probe{outline:9px solid magenta}</style>` +
        `<script src="https://${SCRIPT_HOST}/js/form_embed.js"></script>`,
    },
  },
]

// ── the temp page ──────────────────────────────────────────────────────────

async function saveDocument({ changedPages = [], deletedPageIds = [], baseSeqs = {} }) {
  const { site, seq } = await getSite()
  return api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental',
    site,
    changedPages,
    deletedPageIds,
    changedComponents: [],
    deletedComponentIds: [],
    changedLayouts: [],
    deletedLayoutIds: [],
    baseSeqs,
    shellBaseSeq: seq,
  })
}

const findRow = async () => (await getPages()).rows.find((r) => r.cells.slug === SLUG)

async function place() {
  const existing = await findRow()
  const root = 'wzcanvas-root'
  const nodes = {
    [root]: {
      id: root, moduleId: 'base.body', props: {},
      children: BLOCKS.map((b) => b.id),
      parentId: null, classIds: [], breakpointOverrides: {},
    },
  }
  for (const b of BLOCKS) {
    nodes[b.id] = {
      id: b.id, moduleId: MODULE_ID, props: b.props, children: [],
      parentId: root, classIds: [], breakpointOverrides: {},
    }
  }
  /* `changedPages` takes FLAT Page objects, not the `cells`-shaped rows that
     GET /admin/api/cms/pages returns. */
  const page = {
    id: existing?.id ?? `wzcanvas${Date.now().toString(36)}`,
    slug: SLUG,
    title: 'Embed canvas check (temporary)',
    rootNodeId: root,
    nodes,
  }
  const res = await saveDocument({
    changedPages: [page],
    baseSeqs: existing ? { [existing.id]: existing.seq } : {},
  })
  console.log(existing ? `updated ${SLUG}` : `created ${SLUG}`, JSON.stringify(res).slice(0, 160))
  console.log(`\n  ${EDITOR_URL}\n`)
}

async function cleanup() {
  const existing = await findRow()
  if (!existing) { console.log(`${SLUG} is already gone`); return }
  const res = await saveDocument({
    deletedPageIds: [existing.id],
    baseSeqs: { [existing.id]: existing.seq },
  })
  console.log(`deleted ${SLUG}`, JSON.stringify(res).slice(0, 160))
}

// ── CDP ────────────────────────────────────────────────────────────────────

async function check() {
  const VP = (process.argv.find((a) => /^--viewport=/.test(a)) || '--viewport=1600,1000').split('=')[1]
  const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  const PORT = 9700 + Math.floor(Math.random() * 200)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-embed-canvas-'))
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
    `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', '--force-device-scale-factor=1',
    `--window-size=${VP}`, '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, 'about:blank'])

  const gj = (p) => new Promise((res, rej) => {
    http.get({ host: '127.0.0.1', port: PORT, path: p }, (r) => {
      let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)))
    }).on('error', rej)
  })
  let wsu
  for (let i = 0; i < 150; i++) {
    try { const v = await gj('/json/version'); if (v.webSocketDebuggerUrl) { wsu = v.webSocketDebuggerUrl; break } } catch {}
    await wait(300)
  }
  const sock = new WebSocket(wsu)
  let id = 0
  const pend = new Map()
  const events = []
  sock.addEventListener('message', async (ev) => {
    const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
    const m = JSON.parse(raw)
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); return }
    if (m.method) events.push(m)
  })
  await new Promise((r) => sock.addEventListener('open', r, { once: true }))
  const send = (m, p = {}, sid) => new Promise((res, rej) => {
    const mid = ++id
    const t = setTimeout(() => rej(new Error('timeout ' + m)), 90000)
    pend.set(mid, (x) => { clearTimeout(t); x.error ? rej(new Error(x.error.message)) : res(x.result) })
    sock.send(JSON.stringify({ id: mid, method: m, params: p, sessionId: sid }))
  })
  const tg = (await gj('/json/list')).find((t) => t.type === 'page')
  const { sessionId } = await send('Target.attachToTarget', { targetId: tg.id, flatten: true })
  const S = (m, p = {}) => send(m, p, sessionId)
  await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable')

  const sessionFile = path.resolve(import.meta.dirname, './lib/.tmp/.session')
  const cookie = fs.readFileSync(sessionFile, 'utf8').trim()
  const [name, ...rest] = cookie.split('=')
  await S('Network.setCookie', {
    name: name.trim(),
    value: rest.join('=').trim(),
    domain: new URL(BASE).hostname,
    path: '/',
    secure: true,
    httpOnly: true,
  })

  await S('Page.navigate', { url: EDITOR_URL })
  const ev = async (e) =>
    (await S('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value

  /* 120s, not 60: a cold Railway dyno can take well over a minute to answer the
     first admin request, and a short ceiling here reports a working site as a
     dead editor. */
  let ready = false
  for (let i = 0; i < 120; i++) {
    ready = await ev('!!document.querySelector(\'[data-testid="canvas-notch-add-btn"]\')' +
      ' || !!document.querySelector(\'[data-testid="dom-tree-insert-module"]\')')
    if (ready) break
    await wait(1000)
  }
  if (!ready) {
    console.log('editor never became ready. where the browser actually is:',
      await ev('JSON.stringify({url:location.href,title:document.title,body:(document.body&&document.body.innerText||"").slice(0,300)})'))
  }
  for (let i = 0; i < 45; i++) {
    if (await ev('!!document.querySelector(\'[data-testid="dom-panel-ready"]\')')) break
    await wait(1000)
  }

  /* The blocks are already in the draft, so nothing has to be clicked -- just
     wait for the canvases to have rendered them. */
  for (let i = 0; i < 45; i++) {
    const n = await ev(`(() => {
      let n = 0;
      for (const f of document.querySelectorAll('iframe')) {
        let d = null; try { d = f.contentDocument } catch { d = null }
        if (d && d.querySelector('.wz-embed, .wz-embed-note')) n++;
      }
      return n;
    })()`)
    if (n > 0) break
    await wait(1000)
  }
  await wait(2500)

  const packResponses = events
    .filter((m) => m.method === 'Network.responseReceived' &&
      String(m.params?.response?.url || '').includes(`/uploads/plugins/${PLUGIN_ID}/`))
    .map((m) => ({ url: m.params.response.url, status: m.params.response.status }))

  /* Did the editor document ask for anything from a vendor? Under the old
     preview() the URL-mode iframe made the browser fetch the widget itself. */
  const vendorRequests = events
    .filter((m) => m.method === 'Network.requestWillBeSent')
    .map((m) => String(m.params?.request?.url || ''))
    .filter((u) => u.includes(FRAME_HOST) || u.includes(SCRIPT_HOST) || u.includes('youtube.com'))

  const loggedIn = await ev('!location.pathname.startsWith("/admin/login")')

  const seen = await ev(`(() => {
    const out = { canvases: 0, cards: 0, iframes: 0, injected: 0, notes: 0, hosts: [], sample: null, probeOutlined: 0 };
    for (const f of document.querySelectorAll('iframe')) {
      let d = null; try { d = f.contentDocument } catch { d = null }
      if (!d || !d.querySelector('[data-node-id]')) continue;
      out.canvases++;
      const mods = [...d.querySelectorAll('.wz-embed, .wz-embed-note')];
      out.cards   += d.querySelectorAll('[data-wz-embed-card]').length;
      out.notes   += d.querySelectorAll('.wz-embed-note:not([data-wz-embed-card])').length;
      for (const m of mods) {
        out.iframes  += m.querySelectorAll('iframe').length;
        out.injected += m.querySelectorAll('script, style, link').length;
      }
      /* If the snippet's <style> ever reached this document it would paint the
         probe div; the probe is not rendered at all now, so this must be 0. */
      out.probeOutlined += d.querySelectorAll('.wz-canvas-probe').length;
      for (const c of d.querySelectorAll('[data-wz-embed-card]')) {
        const t = (c.textContent || '').trim();
        if (t) out.hosts.push(t.replace(/\\s+/g, ' '));
        if (!out.sample) out.sample = c.outerHTML.slice(0, 400);
      }
    }
    return out;
  })()`)

  console.log(`\n--- ${EDITOR_URL} @ ${VP} ---`)
  console.log('module pack requests:', JSON.stringify(packResponses))
  console.log('vendor requests from the editor:', JSON.stringify(vendorRequests))
  console.log('seen:', JSON.stringify(seen, null, 2))

  const text = (seen.hosts || []).join(' | ')

  /* Every "NO iframe / NO injected script" assertion below is satisfied by an
     EMPTY page, so on a run where the editor never loaded they would all report
     green over nothing rendered at all. Gate them on the page having actually
     rendered, so a dead editor fails loudly instead of passing vacuously. */
  const rendered = seen.canvases === 3 && seen.cards === BLOCKS.length * seen.canvases
  const proven = (cond) => rendered && cond

  const checks = [
    ['the admin session was accepted', loggedIn === true],
    ['the editor loaded', ready === true],
    ['the browser fetched the plugin module pack', packResponses.length > 0],
    ['every module-pack request returned 200',
      packResponses.length > 0 && packResponses.every((r) => r.status === 200)],
    ['it fetched the version this toolkit just packed',
      packResponses.some((r) => r.url.includes(`/${PLUGIN_ID}/1.4.0/`))],
    ['every breakpoint canvas rendered', seen.canvases === 3],
    ['every configured block rendered a card', rendered],
    ['NO iframe was created anywhere in the canvas', proven(seen.iframes === 0)],
    ['NO script/style/link from a snippet reached the editor', proven(seen.injected === 0)],
    ['the snippet markup itself never rendered', proven(seen.probeOutlined === 0)],
    ['the editor made no request to any vendor', proven(vendorRequests.length === 0)],
    ['the card names the frame host', text.includes(FRAME_HOST)],
    ['the card names the host a snippet reaches', text.includes(SCRIPT_HOST)],
    ['the card says when the embed appears', /Appears when the page is published/.test(text)],
    ['no configured block fell back to the unconfigured note', proven(seen.notes === 0)],
  ]
  let fail = 0
  for (const [name, ok] of checks) {
    console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${name}`)
    if (!ok) fail++
  }
  console.log(fail === 0 ? '\nPASS\n' : `\nFAIL (${fail})\n`)
  try { chrome.kill() } catch {}
  process.exit(fail === 0 ? 0 : 1)
}

if (arg('--place')) await place()
else if (arg('--cleanup')) await cleanup()
else if (arg('--check')) await check()
else {
  console.log(`usage:
  node verify-embed-canvas.mjs --place      write the temp DRAFT page (no publish)
  node verify-embed-canvas.mjs --check      drive the admin editor under CDP
  node verify-embed-canvas.mjs --cleanup    delete the temp page (no publish)`)
}
