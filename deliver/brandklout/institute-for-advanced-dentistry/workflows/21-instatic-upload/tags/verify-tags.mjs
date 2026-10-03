/**
 * GATE for the site-wide tags. Proves, in a real browser on the LIVE domain, that:
 *   1. every published route serves the `000-brandklout-tags` asset;
 *   2. GTM booted — `dataLayer` carries the `gtm.js` event, `google_tag_manager` holds the
 *      container, and gtm.js came back 200;
 *   3. both GoHighLevel scripts loaded 200, in order, and the number pool ran;
 *   4. the GTM <noscript> iframe is the first thing in <body>;
 *   5. nothing was refused by the page CSP.
 *
 * It must run against `https://www.ifadentistry.com` (or the apex): the asset gates itself to the
 * production hostname, exactly like the WordPress Google tag, so on the Railway host every one of
 * these assertions is SUPPOSED to be false. A run against Railway reports that and stops.
 *
 * The number-pool check reads a tel: link before and after: GoHighLevel swaps the practice number
 * for a tracking number only when the visit carries the campaign parameters it pools on, so a
 * swap is reported, not required.
 *
 * Usage: node verify-tags.mjs [base] > .tmp/verify-tags.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const BASE = (process.argv[2] || 'https://www.ifadentistry.com').replace(/\/$/, '')
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const ASSET = '000-brandklout-tags'
const GTM_ID = 'GTM-5XR78DN7'
// The guard version the source sets — a hardcoded one went stale at 1.1.0 and failed every run after.
const WANT_VERSION = fs.readFileSync(path.join(HERE, 'site-tags.js'), 'utf8').match(/BrandkloutSiteTags = '([^']+)'/)[1]
const POOL = 'backend.leadconnectorhq.com/appengine/loc/'
const SESSION = 'backend.leadconnectorhq.com/appengine/js/user_session.js'

let fail = 0
const say = (ok, msg) => { if (!ok) fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`) }

const HOST = new URL(BASE).hostname
if (!/ifadentistry\.com$/i.test(HOST) || /^staging\./i.test(HOST)) {
  // `staging.ifadentistry.com` ends in the production domain, so without the second test this
  // gate ran against staging and reported 18 FAILED — correctly, since the tags are switched off
  // there on purpose, and uselessly, since that is the desired state. What staging needs is the
  // opposite assertion, and that is `21-instatic-staging-clone/verify-staging-clean.mjs`.
  console.log(`SKIP  ${BASE} is not the production host — the tag asset returns early there by design.`)
  if (/^staging\./i.test(HOST)) console.log('      for a staging host run verify-staging-clean.mjs instead.')
  process.exit(0)
}

/* 1. the asset is on every route */
const pages = JSON.parse(fs.readFileSync(path.join(HERE, '..', '.tmp', 'wp', 'pages.json'), 'utf8'))
const urlOf = (slug) => BASE + (slug === 'index' ? '/' : '/' + slug)
let missing = 0
for (const p of pages) {
  const html = await (await fetch(urlOf(p.slug))).text()
  if (!html.includes(ASSET)) { missing++; console.log(`     ${p.slug}: no ${ASSET}`) }
}
say(missing === 0, `${ASSET} asset on ${pages.length - missing}/${pages.length} routes`)

/* 2-5. it runs */
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true })
for (const slug of ['index', 'contact-us', 'privacy-policy']) {
  const tab = await browser.newPage()
  await tab.setViewport({ width: 1440, height: 900 })
  const csp = []
  tab.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text().slice(0, 160)) })
  const net = []
  tab.on('response', async (r) => {
    const u = r.url()
    if (!/googletagmanager\.com|leadconnectorhq\.com\/appengine/.test(u)) return
    let len = -1
    try { len = (await r.buffer()).length } catch { /* body already gone */ }
    net.push([u, r.status(), len])
  })

  await tab.goto(urlOf(slug), { waitUntil: 'networkidle2', timeout: 90000 })
  await new Promise((r) => setTimeout(r, 3000)) // gtm.js loads its container, GHL rewrites numbers

  const state = await tab.evaluate(() => ({
    layer: (window.dataLayer || []).length,
    started: (window.dataLayer || []).some((e) => e && e['gtm.start']),
    containers: Object.keys(window.google_tag_manager || {}),
    noscriptFirst: document.body.firstElementChild?.id === 'brandklout-gtm-noscript',
    tels: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')),
    version: window.BrandkloutSiteTags || null,
  }))

  const hit = (re) => net.find(([u]) => re.test(u))
  const gtmJs = hit(new RegExp(`gtm\\.js\\?id=${GTM_ID}`))
  const pool = hit(new RegExp(POOL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  const session = hit(new RegExp(SESSION.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

  const ok2xx = (r) => !!r && (r[1] === 200 || r[1] === 304)
  // A local content filter (NordVPN Threat Protection is one) answers googletagmanager.com inside
  // Chrome with a ~9 KB stub while Node gets the real ~350 KB container. That shows up as a 200
  // whose body is a fraction of the real one and an empty `google_tag_manager`, and it is a
  // workstation problem, not a site problem — so it is reported, and the container is proved
  // through Node instead.
  const filtered = !!gtmJs && gtmJs[2] > 0 && gtmJs[2] < 50000

  console.log(`\n--- ${slug} ---`)
  say(state.version === WANT_VERSION, `tag asset ran (BrandkloutSiteTags ${state.version})`)
  say(state.started, `dataLayer has the gtm.start event (${state.layer} entries)`)
  say(ok2xx(gtmJs), `gtm.js?id=${GTM_ID} -> ${gtmJs ? `${gtmJs[1]}, ${gtmJs[2]} bytes` : 'not requested'}`)
  if (filtered) {
    const direct = await fetch(`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`)
    const body = await direct.text()
    console.log(`     gtm.js was filtered in this browser (${gtmJs[2]} bytes); from Node it is ${body.length} bytes`)
    say(body.length > 50000 && body.includes('"resource"'), `${GTM_ID} container served from Node (${body.length} bytes)`)
  } else {
    say(state.containers.includes(GTM_ID), `google_tag_manager holds ${GTM_ID} (${state.containers.join(', ') || 'none'})`)
  }
  say(ok2xx(pool), `number_pool.js -> ${pool ? pool[1] : 'not requested'}`)
  say(ok2xx(session), `user_session.js -> ${session ? session[1] : 'not requested'}`)
  say(state.noscriptFirst, 'the GTM <noscript> iframe is first in <body>')
  say(csp.length === 0, `no CSP refusals${csp.length ? ': ' + csp[0] : ''}`)
  const tels = [...new Set(state.tels)]
  console.log(`     tel: links after the pool ran  ${tels.join(' ')}`)
  say(tels.length > 0, `the page still offers a phone number (${tels.length} distinct)`)
  if (state.containers.length) console.log(`     containers on the page: ${state.containers.join(', ')}`)
  await tab.close()
}
await browser.close()

console.log(`\n${fail ? `${fail} FAILED` : 'all checks passed'}`)
process.exit(fail ? 1 : 0)
