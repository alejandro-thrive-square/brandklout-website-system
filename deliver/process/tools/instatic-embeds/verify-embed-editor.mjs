#!/usr/bin/env node
/**
 * Editor-side gate for the Embed block: can a HUMAN find it and place it?
 *
 *   node verify-embed-editor.mjs --place      # temp DRAFT page, no publish
 *   node verify-embed-editor.mjs --check      # drive the admin editor under CDP
 *   node verify-embed-editor.mjs --cleanup    # delete the temp page, no publish
 *
 * WHY THIS EXISTS, GIVEN verify-embed-module.mjs ALREADY PASSES
 * -------------------------------------------------------------
 * That gate builds the page by writing nodes straight into the site document
 * over the API, publishes, and drives the PUBLISHED page. It proves the render
 * and the CSP. It cannot prove the one thing the handoff actually promises —
 * that a developer or a marketer, in the admin UI, is OFFERED the block at all.
 *
 * Those are two different code paths and only one of them had a gate:
 *
 *   - PUBLISH  — `moduleAdapter` + the QuickJS sandbox, server side;
 *   - EDITOR   — `editorPluginLoader.ts`, in the BROWSER, which dynamically
 *     imports `/uploads/plugins/<id>/<version>/modules/index.js` and registers
 *     what it default-exports into the inserter.
 *
 * The editor path fails silently by design. `editorPluginLoader` pushes a
 * `failed` entry and moves on, so a module pack that 404s, that is not valid
 * ESM in a browser, or whose `modules.register` grant was dropped, leaves a
 * plugin card reading `active` and an inserter with no Embed in it. Nobody
 * would learn that from the published page, which keeps working.
 *
 * NO PUBLISH ANYWHERE IN THIS GATE. The editor reads the DRAFT, so the temp
 * page never needs to be baked -- which also keeps this off the publish path
 * that rebuilt all 35 pages and cost the home page its review wall.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { api, getSite, getPages, BASE, SESSION_FILE } from './lib/insta-api.mjs'

const SLUG = 'plugin-embed-editor-test'
const MODULE_ID = 'webzite.embed-origins.embed'
const PLUGIN_ID = 'webzite.embed-origins'
const EDITOR_URL = `${BASE}/admin/site?page=${SLUG}`

const arg = (f) => process.argv.includes(f)
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

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

/** Deliberately EMPTY. The gate is that the inserter can put the block here. */
async function place() {
  const existing = await findRow()
  const root = 'wzembedui-root'
  const page = {
    id: existing?.id ?? `wzembedui${Date.now().toString(36)}`,
    slug: SLUG,
    title: 'Embed block editor check (temporary)',
    rootNodeId: root,
    nodes: {
      [root]: {
        id: root, moduleId: 'base.body', props: {}, children: [],
        parentId: null, classIds: [], breakpointOverrides: {},
      },
    },
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
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-embed-ui-'))
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

  /* The admin is behind the session cookie. `insta-api.mjs` keeps a live one on
     disk; reuse it rather than driving the login form (which is step-up
     protected and rotates the cookie out from under a second client). */
  const sessionFile = SESSION_FILE // per host since 2026-09-25
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

  /* The admin is a SPA behind a code-split route; wait for the canvas rather
     than for a fixed number of seconds.
     NOTE the source tree's `toolbar-add-module-btn` does not exist in the
     deployed build -- the inserter is opened from the canvas notch "+", or from
     "Insert module" in the Layers panel. Read the running DOM, not the zip. */
  let ready = false
  for (let i = 0; i < 60; i++) {
    ready = await ev('!!document.querySelector(\'[data-testid="canvas-notch-add-btn"]\')' +
      ' || !!document.querySelector(\'[data-testid="dom-tree-insert-module"]\')')
    if (ready) break
    await wait(1000)
  }

  /* The notch button mounts before the editor has finished hydrating, and an
     insert fired into that window lands on the canvas but never selects, so the
     Properties Panel never opens and the gate reads a working block as a broken
     one. Wait for the Layers panel to declare itself ready, then settle. */
  for (let i = 0; i < 45; i++) {
    if (await ev('!!document.querySelector(\'[data-testid="dom-panel-ready"]\')')) break
    await wait(1000)
  }
  await wait(4000)

  /* Was the module pack even fetched, and with what status? A 404 here is the
     silent failure this gate exists for. */
  const packUrl = `/uploads/plugins/${PLUGIN_ID}/`
  const packResponses = events
    .filter((m) => m.method === 'Network.responseReceived' &&
      String(m.params?.response?.url || '').includes(packUrl))
    .map((m) => ({ url: m.params.response.url, status: m.params.response.status }))

  const loggedIn = await ev('!location.pathname.startsWith("/admin/login")')

  /* Open the inserter exactly the way a person does. Two doors lead to it and
     a marketer will meet the canvas one first, so that is the one gated; the
     Layers-panel button is the fallback so a notch that failed to mount cannot
     be reported as "the block is missing". */
  let openedVia = null
  for (const testid of ['canvas-notch-add-btn', 'dom-tree-insert-module']) {
    if (!ready) break
    const clicked = await ev(`(() => {
      const b = document.querySelector('[data-testid=${JSON.stringify(testid)}]');
      if (!b) return false; b.click(); return true;
    })()`)
    if (!clicked) continue
    await wait(2500)
    if (await ev('!!document.querySelector("[data-module-id]")')) { openedVia = testid; break }
  }

  const picker = await ev(`(() => {
    const el = document.querySelector('[data-module-id=${JSON.stringify(MODULE_ID)}]');
    const all = [...document.querySelectorAll('[data-module-id]')].map(n => n.getAttribute('data-module-id'));
    return {
      offered: !!el,
      label: el ? (el.textContent || '').trim().slice(0, 60) : null,
      totalOffered: all.length,
      /* Named so a failure says WHICH neighbours were there -- "0 of 40" and
         "0 of 0" are different bugs (ours missing vs the picker never opened). */
      mediaNeighbours: all.filter(x => /^base\\.(video|image|audio|embed)/.test(x)),
    };
  })()`)

  // Place it, the way a person does: click the item.
  if (picker.offered) {
    await ev(`document.querySelector('[data-module-id=${JSON.stringify(MODULE_ID)}]').click()`)
    /* Poll rather than sleep. The dialog closes, the store commits, three
       breakpoint canvases re-render and only then does the Properties Panel
       mount. A fixed 3.5s wait caught the canvases on one run and neither on
       the next, reporting a working product as a missing block. */
    for (let i = 0; i < 30; i++) {
      if (await ev('!!document.querySelector(\'[data-testid="property-control-source"]\')')) break
      /* Insert usually selects the new node. When it does not, select it the
         way a person would -- from the Layers tree -- rather than reporting a
         Properties Panel that simply is not open as a missing block. */
      if (i === 8) {
        await ev('(() => {' +
          'const items = [...document.querySelectorAll(\'[data-testid^="dom-tree-item-"]\')];' +
          'const fresh = items[items.length - 1];' +
          'if (fresh) fresh.click();' +
          '})()')
      }
      await wait(1000)
    }
  }

  const placed = await ev(`(() => {
    /* Each breakpoint renders in its own same-origin canvas iframe, so the
       placed node is never in the top document. */
    const frames = [...document.querySelectorAll('iframe')];
    let inCanvas = 0, canvasesSeen = 0;
    for (const f of frames) {
      let d = null;
      try { d = f.contentDocument } catch { d = null }
      if (!d || !d.querySelector('[data-node-id]')) continue;
      canvasesSeen++;
      /* A block inserted from the picker has NO url and NO snippet yet, so
         preview() returns the .wz-embed-note placeholder rather than the
         data-wz-embed frame wrapper. Asserting only the latter failed this
         gate against a product that was working: the placeholder IS the
         correct render, and its instruction copy is what the person reads. */
      if (d.querySelector('[data-wz-embed], .wz-embed-note')) inCanvas++;
    }
    const control = (k) => !!document.querySelector('[data-testid="property-control-' + k + '"]');
    const note = (() => {
      for (const f of frames) {
        let d = null;
        try { d = f.contentDocument } catch { d = null }
        const n = d && d.querySelector('.wz-embed-note');
        if (n) return (n.textContent || '').trim().slice(0, 80);
      }
      return null;
    })();
    return {
      canvasesSeen,
      inCanvas,
      note,
      /* Reported so a control-name change in the host shows up as a diff here
         rather than as a blank FAIL. */
      sidebarTestids: [...document.querySelectorAll('[data-testid^="property-control-"]')]
        .map(n => n.getAttribute('data-testid')),
      /* The Properties Panel is the whole point for a marketer: the block is
         useless if it lands on the canvas with no way to paste a URL into it. */
      controls: {
        source: control('source'),
        url: control('url'),
        snippet: control('snippet'),
        fit: control('fit'),
        title: control('title'),
      },
    };
  })()`)

  console.log(`\n--- ${EDITOR_URL} @ ${VP} ---`)
  console.log('module pack requests:', JSON.stringify(packResponses))
  console.log('inserter opened via:', openedVia)
  console.log('picker:', JSON.stringify(picker))
  console.log('placed:', JSON.stringify(placed))

  const controlsPresent = Object.values(placed.controls || {}).filter(Boolean).length
  const checks = [
    ['the admin session was accepted', loggedIn === true],
    ['the editor loaded', ready === true],
    ['the browser fetched the plugin module pack', packResponses.length > 0],
    ['every module-pack request returned 200', packResponses.length > 0 &&
      packResponses.every((r) => r.status === 200)],
    ['the inserter opened at all', picker.totalOffered > 0 && !!openedVia],
    ['Embed is offered in the inserter', picker.offered === true],
    ['it is labelled "Embed"', /Embed/i.test(picker.label || '')],
    ['clicking it put a block on every breakpoint canvas',
      placed.inCanvas > 0 && placed.inCanvas === placed.canvasesSeen],
    ['the unconfigured block tells the person what to do next',
      /paste a URL/i.test(placed.note || '')],
    ['the Properties Panel exposes every control the block declares',
      (placed.sidebarTestids || []).length >= 9 && controlsPresent === 5],
    ['Source is one of them', placed.controls?.source === true],
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
  node verify-embed-editor.mjs --place      create the temp DRAFT page (no publish)
  node verify-embed-editor.mjs --check      drive the admin editor under CDP
  node verify-embed-editor.mjs --cleanup    delete the temp page (no publish)`)
}
