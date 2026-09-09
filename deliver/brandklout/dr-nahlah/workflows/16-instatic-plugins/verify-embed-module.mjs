#!/usr/bin/env node
/**
 * End-to-end gate for the Embed module: place it, publish it, drive the
 * PUBLISHED page under CDP, then remove it.
 *
 *   node verify-embed-module.mjs --place            # create the page + publish
 *   node verify-embed-module.mjs --check            # drive it at 1440x900
 *   node verify-embed-module.mjs --check --viewport=390,844
 *   node verify-embed-module.mjs --cleanup          # delete the page + publish
 *
 * `test-embed-module.mjs` proves the render functions in isolation. It cannot
 * prove the things that only exist on the platform, which are the ones that
 * have bitten before:
 *
 *   - the host actually REGISTERS the module (a manifest the loader rejects
 *     parks the plugin in `error` and the block silently never appears);
 *   - `escapeProps()` does to the props what we predicted, so a pasted snippet
 *     survives the publish boundary as markup rather than as visible text;
 *   - the per-module runtime is served and runs, so `fit: auto` is a real
 *     measured height rather than the starting number;
 *   - the CSP the `publish.html` filter writes actually lets the frame load.
 *
 * A screenshot answers none of these: a CSP-refused frame is still an <iframe>
 * element in the DOM, still fires `load` (about:blank), and still occupies its
 * starting height. So the assertions read the RENDERED box and the page's own
 * `securitypolicyviolation` events.
 *
 * The page is temporary by design — `--cleanup` deletes it and republishes.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { api, getSite, getPages, publish, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const SLUG = 'plugin-embed-test'
const PAGE_URL = `${BASE}/${SLUG}`
const MODULE_ID = 'webzite.embed-origins.embed'

/** The client's real review widget — already an allowed frame origin. */
const WIDGET =
  'https://reputationhub.site/reputation/widgets/review_widget/xJDu1mFoW5jFYTNqmuk7' +
  '?widgetId=6a7340db2bbe7819cc3536f4'

/** Starting height for the auto block. Deliberately small: the gate is that the
 *  widget's own postMessage grew it, and a 600px default could hide that. */
const START = 240
const FIXED = 420

const arg = (flag) => process.argv.includes(flag)

// ── page construction ──────────────────────────────────────────────────────

/** Node ids only have to be unique within the page. */
const nid = (name) => `wzembed-${name}`

const node = (id, moduleId, props, children = [], parentId = null) => ({
  id, moduleId, props, children, parentId, classIds: [], breakpointOverrides: {},
})

function buildBody() {
  const root = nid('root')
  const auto = nid('auto')
  const snippet = nid('snippet')
  return {
    rootNodeId: root,
    nodes: {
      [root]: node(root, 'base.body', {}, [auto, snippet]),
      [auto]: node(auto, MODULE_ID, {
        source: 'url',
        url: WIDGET,
        title: 'Patient reviews (URL mode)',
        fit: 'auto',
        height: START,
        ratio: '16 / 9',
        lazy: false,
        allowFullscreen: false,
        allow: '',
      }, [], root),
      [snippet]: node(snippet, MODULE_ID, {
        source: 'snippet',
        /* Typed the way a developer would paste it, quotes and all. On the
           publish path this arrives at render() HTML-escaped. */
        snippet: `<iframe src="${WIDGET}" title="Patient reviews (snippet mode)" ` +
          `style="width:100%;height:${FIXED}px;border:0" loading="eager"></iframe>`,
        url: '',
        title: '',
        fit: 'fixed',
        height: FIXED,
        ratio: '16 / 9',
        lazy: true,
        allowFullscreen: false,
        allow: '',
      }, [], root),
    },
  }
}

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
  /* `changedPages` takes FLAT Page objects (`PageSchema` in
     `src/core/page-tree/page.ts`): id, slug, title and the node tree at the top
     level. It does NOT take the CMS row shape that `GET /pages` hands back,
     where those live under `cells` — send that and the validator rejects
     `site.pages[0].slug: Expected string` against a path the payload appears to
     contain, one field per round trip. */
  const page = {
    id: existing?.id ?? `wzembedtest${Date.now().toString(36)}`,
    slug: SLUG,
    title: 'Embed module verification (temporary)',
    ...buildBody(),
  }
  // A row the server has never seen passes the conflict check by construction;
  // an existing one must carry the seq we read it at.
  const baseSeqs = existing ? { [existing.id]: existing.seq } : {}
  const res = await saveDocument({ changedPages: [page], baseSeqs })
  console.log(existing ? `updated ${SLUG}` : `created ${SLUG}`, JSON.stringify(res).slice(0, 200))
  console.log('publishing…')
  console.log(JSON.stringify(await publish()).slice(0, 300))
  console.log(`
  ${PAGE_URL}`)
}

async function cleanup() {
  const existing = await findRow()
  if (!existing) { console.log(`${SLUG} is already gone`); return }
  const res = await saveDocument({
    deletedPageIds: [existing.id],
    baseSeqs: { [existing.id]: existing.seq },
  })
  console.log(`deleted ${SLUG}`, JSON.stringify(res).slice(0, 200))
  console.log('publishing…')
  console.log(JSON.stringify(await publish()).slice(0, 300))
}

// ── CDP ────────────────────────────────────────────────────────────────────

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function check() {
  const VP = (process.argv.find((a) => /^--viewport=/.test(a)) || '--viewport=1440,900').split('=')[1]
  const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  const PORT = 9700 + Math.floor(Math.random() * 200)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-embed-'))
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
  sock.addEventListener('message', async (ev) => {
    const raw = typeof ev.data === 'string' ? ev.data : await ev.data.text()
    const m = JSON.parse(raw)
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id) }
  })
  await new Promise((r) => sock.addEventListener('open', r, { once: true }))
  const send = (m, p = {}, sid) => new Promise((res, rej) => {
    const mid = ++id
    const t = setTimeout(() => rej(new Error('timeout ' + m)), 60000)
    pend.set(mid, (x) => { clearTimeout(t); x.error ? rej(new Error(x.error.message)) : res(x.result) })
    sock.send(JSON.stringify({ id: mid, method: m, params: p, sessionId: sid }))
  })
  const tg = (await gj('/json/list')).find((t) => t.type === 'page')
  const { sessionId } = await send('Target.attachToTarget', { targetId: tg.id, flatten: true })
  const S = (m, p = {}) => send(m, p, sessionId)
  await S('Page.enable'); await S('Runtime.enable'); await S('Network.enable')
  /* Collect CSP refusals from the page itself. A refused frame is otherwise
     indistinguishable from a slow one. */
  await S('Page.addScriptToEvaluateOnNewDocument', {
    source: 'window.__csp=[];addEventListener("securitypolicyviolation",' +
      'e=>window.__csp.push(e.violatedDirective+" "+e.blockedURI))',
  })
  const ev = async (e) =>
    (await S('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value

  await S('Page.navigate', { url: PAGE_URL })
  await wait(4000)
  await ev('(async()=>{const H=document.documentElement.scrollHeight;' +
    'for(let y=0;y<H;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}' +
    'window.scrollTo(0,0)})()')
  await wait(9000)

  const s = await ev(`(()=>{
    const auto = document.querySelector('[data-wz-embed="auto"]');
    const fixed = document.querySelector('[data-wz-embed="fixed"]');
    const box = (el) => el ? Math.round(el.getBoundingClientRect().height) : 0;
    const f = (el) => el ? el.querySelector('iframe') : null;
    return {
      blocks: document.querySelectorAll('[data-wz-embed]').length,
      autoFrames: auto ? auto.querySelectorAll('iframe').length : 0,
      autoHeight: box(f(auto)),
      autoInlineHeight: f(auto) ? f(auto).style.height : null,
      snippetFrames: fixed ? fixed.querySelectorAll('iframe').length : 0,
      snippetHeight: box(f(fixed)),
      /* If the snippet had NOT survived escapeProps, this is where it would be:
         the markup rendered as visible text instead of as an element. */
      snippetLeakedAsText: fixed ? /&lt;iframe|<iframe/.test(fixed.textContent) : false,
      runtimeTag: !!document.querySelector('script[src*="module-js/${MODULE_ID}"]'),
      csp: window.__csp || [],
    };
  })()`)

  const html = await (await fetch(PAGE_URL)).text()
  const csp = (html.match(/Content-Security-Policy"\s+content="([^"]*)"/) || [])[1] || ''
  const frameSrc = (csp.match(/frame-src ([^;]*)/) || [])[1] || '(absent)'

  console.log(`\n--- ${PAGE_URL} @ ${VP} ---`)
  console.log(JSON.stringify(s))
  console.log(`frame-src: ${frameSrc}`)

  const checks = [
    ['both blocks rendered', s.blocks === 2],
    ['URL mode produced one iframe', s.autoFrames === 1],
    ['snippet survived the publish boundary as an element', s.snippetFrames === 1],
    ['snippet did not leak as visible text', s.snippetLeakedAsText === false],
    ['the auto-height runtime was served', s.runtimeTag === true],
    [`auto height grew past the ${START}px start`, s.autoHeight > START + 200],
    [`fixed height honoured (${FIXED}px)`, Math.abs(s.snippetHeight - FIXED) <= 2],
    /* Scoped to FRAME refusals on purpose. This page also reports a
       `script-src-elem` violation for Cloudflare's `beacon.min.js`, which the
       CDN injects into every response on this site and the page CSP refuses —
       pre-existing, unrelated to embeds, and the same unnamed failing script
       the 73-URL audit reports on every page. Asserting "zero violations"
       would make this gate fail for someone else's beacon. */
    ['no frame refused by CSP',
      (s.csp || []).every((v) => !/^(frame-src|child-src)/.test(v))],
    ['nothing about the vendor origin was refused',
      (s.csp || []).every((v) => !/reputationhub/.test(v))],
    ['frame-src carries the vendor origin', /reputationhub\.site/.test(frameSrc)],
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
  console.error('usage: verify-embed-module.mjs --place | --check [--viewport=W,H] | --cleanup')
  process.exit(2)
}
