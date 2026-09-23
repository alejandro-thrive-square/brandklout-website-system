#!/usr/bin/env node
/**
 * Does a pasted SCRIPT actually run on the published page? (v1.2.0)
 *
 *   node verify-embed-scripts.mjs --place            # temp page + publish
 *   node verify-embed-scripts.mjs --check            # drive the published page
 *   node verify-embed-scripts.mjs --check --viewport=390,844
 *   node verify-embed-scripts.mjs --cleanup          # delete it + publish
 *
 * `verify-embed-module.mjs` proves an embedded FRAME loads. Scripts are the
 * harder half and the one the capability was asked for: on Webflow you paste a
 * vendor snippet and it works, and until v1.2.0 the honest answer here was that
 * an inline script was refused by CSP and an external one needed somebody to
 * type its origin into plugin settings first.
 *
 * Both are now derived from the page at publish time — inline scripts by hash,
 * external ones by origin — so this gate asserts EXECUTION, not presence. A
 * script tag that CSP refused is still in the DOM and still looks fine.
 *
 * ## Why this vendor script
 *
 * `reputationhub.site/reputation/assets/review-widget.js` is the real parent
 * script for the client's review widget, and its behaviour is observable from
 * outside: on `lc.setHeight` it sets the iframe's `height` ATTRIBUTE and an
 * inline `transition` style. Nothing else on the page does that, so the
 * attribute appearing IS proof that a cross-origin script loaded and ran.
 *
 * (The live home page deliberately does NOT load this script — `site.js` applies
 * the height itself so the site never needs a `script-src` grant. Using it here
 * is a test of the mechanism, on a temporary page, not a change of that policy.)
 *
 * The inline half is proven the same way: a `<script>` in the same snippet
 * writes into a div and sets a global. Neither can happen under
 * `script-src 'self'` without the hash the filter now emits.
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { api, getSite, getPages, publish, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const SLUG = 'plugin-embed-scripts-test'
const PAGE_URL = `${BASE}/${SLUG}`
const MODULE_ID = 'webzite.embed-origins.embed'
const VENDOR_JS = 'https://reputationhub.site/reputation/assets/review-widget.js'
const WIDGET =
  'https://reputationhub.site/reputation/widgets/review_widget/xJDu1mFoW5jFYTNqmuk7' +
  '?widgetId=6a7340db2bbe7819cc3536f4'

const arg = (flag) => process.argv.includes(flag)

/**
 * Exactly what a marketer would paste: the vendor's iframe, the vendor's
 * script, and (standing in for the snippets that carry their own init call) an
 * inline script. The probe div comes FIRST because an inline script runs at
 * parse time and can only see what precedes it.
 */
const SNIPPET = [
  '<div id="wz-inline-probe">inline script did not run</div>',
  `<iframe class="lc_reviews_widget" src="${WIDGET}" frameborder="0" scrolling="no"`,
  ' style="width:100%;height:240px"></iframe>',
  `<script src="${VENDOR_JS}"></script>`,
  '<script>window.__wzInlineRan = true;',
  "document.getElementById('wz-inline-probe').textContent = 'inline script ran';</script>",
].join('')

const node = (id, moduleId, props, children = [], parentId = null) => ({
  id, moduleId, props, children, parentId, classIds: [], breakpointOverrides: {},
})

function buildBody() {
  const root = 'wzscripts-root'
  const block = 'wzscripts-block'
  return {
    rootNodeId: root,
    nodes: {
      [root]: node(root, 'base.body', {}, [block]),
      [block]: node(block, MODULE_ID, {
        source: 'snippet',
        snippet: SNIPPET,
        url: '',
        title: '',
        fit: 'fixed',
        height: 900,
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
  // FLAT Page objects, not the `cells`-shaped rows GET /pages returns.
  const page = {
    id: existing?.id ?? `wzscripts${Date.now().toString(36)}`,
    slug: SLUG,
    title: 'Embed script verification (temporary)',
    ...buildBody(),
  }
  const res = await saveDocument({
    changedPages: [page],
    baseSeqs: existing ? { [existing.id]: existing.seq } : {},
  })
  console.log(existing ? `updated ${SLUG}` : `created ${SLUG}`, JSON.stringify(res).slice(0, 160))
  console.log('publishing…')
  console.log(JSON.stringify(await publish()).slice(0, 200))
  console.log(`\n  ${PAGE_URL}`)
  console.log('\n  A publish bakes EVERY page. Check the home page did not move:')
  console.log('  node ../08-qa/.tmp/audit-site.mjs --base https://encorercm.com --only index && git diff ../08-qa/.tmp/audit-out/')
}

async function cleanup() {
  const existing = await findRow()
  if (!existing) { console.log(`${SLUG} is already gone`); return }
  const res = await saveDocument({
    deletedPageIds: [existing.id],
    baseSeqs: { [existing.id]: existing.seq },
  })
  console.log(`deleted ${SLUG}`, JSON.stringify(res).slice(0, 160))
  console.log('publishing…')
  console.log(JSON.stringify(await publish()).slice(0, 200))
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

async function check() {
  const VP = (process.argv.find((a) => /^--viewport=/.test(a)) || '--viewport=1440,900').split('=')[1]
  const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  const PORT = 9900 + Math.floor(Math.random() * 90)
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-embedjs-'))
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
  // A refused script is silent in the DOM; the violation event is where it shows.
  await S('Page.addScriptToEvaluateOnNewDocument', {
    source: 'window.__csp=[];addEventListener("securitypolicyviolation",' +
      'e=>window.__csp.push(e.violatedDirective+" "+e.blockedURI))',
  })
  const ev = async (e) =>
    (await S('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value

  await S('Page.navigate', { url: PAGE_URL })
  await wait(9000)

  const s = await ev(`(() => {
    const frame = document.querySelector('iframe.lc_reviews_widget');
    const probe = document.getElementById('wz-inline-probe');
    const vendor = performance.getEntriesByType('resource')
      .find(r => r.name.indexOf('review-widget.js') !== -1);
    return {
      inlineRan: window.__wzInlineRan === true,
      probeText: probe ? probe.textContent.trim() : null,
      vendorTagPresent: !!document.querySelector('script[src*="review-widget.js"]'),
      vendorFetched: !!vendor,
      vendorBytes: vendor ? Math.round(vendor.transferSize || vendor.encodedBodySize || 0) : 0,
      frameExists: !!frame,
      frameRendered: frame ? Math.round(frame.getBoundingClientRect().height) : 0,
      /* Set by the VENDOR script and by nothing else on this page. */
      heightAttr: frame ? frame.getAttribute('height') : null,
      transition: frame ? frame.style.transition : null,
      csp: window.__csp || [],
    };
  })()`)

  const html = await (await fetch(PAGE_URL)).text()
  const csp = (html.match(/Content-Security-Policy"\s+content="([^"]*)"/) || [])[1] || ''
  const scriptSrc = (csp.match(/script-src[^;]*/) || [''])[0]
  const frameSrc = (csp.match(/frame-src[^;]*/) || [''])[0]
  const hashes = (scriptSrc.match(/'sha256-[^']+'/g) || [])

  console.log(`\n--- ${PAGE_URL} @ ${VP} ---`)
  console.log(JSON.stringify(s))
  console.log(`script-src: ${scriptSrc}`)
  console.log(`frame-src : ${frameSrc}`)

  const checks = [
    ['the pasted script tag survived to the published page', s.vendorTagPresent === true],
    ['the vendor origin was derived into script-src', /reputationhub\.site/.test(scriptSrc)],
    ['the frame origin was derived into frame-src', /reputationhub\.site/.test(frameSrc)],
    ['the inline script was hashed (importmap + ours)', hashes.length >= 2],
    ['INLINE SCRIPT RAN', s.inlineRan === true && s.probeText === 'inline script ran'],
    ['the vendor script was fetched, not refused', s.vendorFetched === true],
    ['EXTERNAL SCRIPT RAN — it set the height attribute itself',
      s.heightAttr !== null && Number(s.heightAttr) > 0],
    ['…and the transition it applies is there too', /height/.test(s.transition || '')],
    ['the embedded frame rendered', s.frameExists === true && s.frameRendered > 100],
    /* Scoped, and each clause earns its place. The site's own fonts are here
       because creating `font-src` for the vendor once revoked the `default-src
       'self'` that had been allowing them — a regression this gate found and
       must keep finding. Cloudflare's beacon is excluded: the CDN injects it
       into every response AFTER the publish filter has run, so it is refused on
       every page of this site and always was. */
    ['nothing the page itself loads was refused',
      (s.csp || []).every((v) => /cloudflareinsights/.test(v))],
    ["the site's own fonts still load — no font-src refusals",
      (s.csp || []).every((v) => !/^font-src/.test(v))],
    ['nothing from the vendor origin was refused',
      (s.csp || []).every((v) => !/reputationhub/.test(v))],
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
  console.error('usage: verify-embed-scripts.mjs --place | --check [--viewport=W,H] | --cleanup')
  process.exit(2)
}
