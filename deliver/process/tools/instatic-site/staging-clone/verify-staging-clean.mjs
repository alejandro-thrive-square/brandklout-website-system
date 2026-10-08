#!/usr/bin/env node
/**
 * Does the staging clone leak into production's world?
 *
 *   node verify-staging-clean.mjs --staging https://staging.client.com \
 *                                 --production https://www.client.com \
 *                                 [--paths /,/contact-us/] [--no-analytics]
 *   STAGING_RESOLVE=staging.client.com:104.21.0.1 node verify-staging-clean.mjs ...   # stale resolver
 *
 * WHY THIS EXISTS, AND WHY `check-noindex.mjs` IS NOT ENOUGH
 * ---------------------------------------------------------
 * `check-noindex.mjs` reads the raw HTML. On an Instatic clone of a WordPress site the head is
 * replayed by `site.js` AFTER the document parses, so a canonical injected at runtime is invisible
 * to it. On the Institute for Advanced Dentistry it reported `canonical (none)` while every staging
 * page was in fact emitting `<link rel="canonical" href="https://www.ifadentistry.com/">` — the one
 * combination that can take PRODUCTION out of Google, sitting behind a gate that said OK.
 *
 * So this gate renders the page and asks the DOM, not the bytes. It checks three things that all
 * fail silently and all cost production something real:
 *
 *   1. `X-Robots-Tag: noindex` is served on staging and NOT on production.
 *   2. Staging emits no canonical and no `og:url` pointing anywhere but staging itself. Google
 *      treats `noindex` + a foreign canonical as contradictory and can apply the noindex to the
 *      canonical's TARGET, which is the live site.
 *   3. Staging requests no analytics or call-tracking endpoint. A staging clone carries the live
 *      site's tags, so without this every page a reviewer opens reports into the practice's
 *      analytics and burns a call-tracking number. Host gates written as `*.<production-domain>`
 *      do not catch it: the staging subdomain passes them.
 *
 * Production is checked in the same pass, because each of these can be "fixed" on staging by
 * breaking it on production, and a gate that only looks at staging would call that a pass.
 *
 * `--no-analytics` — for a site that has NEVER had analytics or call tracking. Without it, a
 * production page loading no tags is a FAIL, and it must stay that way: "both sides are clean" is
 * indistinguishable from "someone deleted the tags out of a shared asset", which is the exact
 * accident the host-conditional rule exists to prevent. The flag is how an operator states which
 * of the two it is, in a command that ends up in the runbook where it can be challenged. Do not
 * reach for it because the gate is red — look at the live site first. Brandklout, 2026-09-22, is
 * the case it was added for: the agency's own site carries no GTM, no GA and no call tracking, so
 * the check had nothing to assert.
 *
 * Exit 0 clean, 1 dirty. Run it after the seed, after any Cloudflare change, and before anyone is
 * given the staging link.
 */
// Through the shared loader (PUPPETEER_DIR / the worktree / this repo): a bare import failed from the main
// checkout, which has no node_modules (West LA, 2026-10-08).
const { default: puppeteer } = await import('../lib/browser.mjs')

const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1] }
const STAGING = (flag('staging') || '').replace(/\/$/, '')
const PRODUCTION = (flag('production') || '').replace(/\/$/, '')
const NO_ANALYTICS = argv.includes('--no-analytics')
const PATHS = (flag('paths') || '/').split(',').map((s) => s.trim()).filter(Boolean)
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'

if (!STAGING || !PRODUCTION) {
  console.error('usage: node verify-staging-clean.mjs --staging <url> --production <url> [--paths /,/a/]')
  process.exit(2)
}

/**
 * Anything that reports a visit somewhere the practice pays for or reads.
 *
 * The distinction that matters, and that a host-level list gets wrong: a booking or contact form
 * embedded from the same vendor as the call tracking is **page content**. Reviewers have to be
 * able to submit it, so its own bundle, styles and session call are expected on staging. What must
 * not fire is the analytics tag and the call-tracking POOL — the pool assigns a real tracked
 * number per visitor, so a month of review traffic is a month of numbers billed against visits
 * that were never patients.
 */
const TRACKERS =
  /googletagmanager\.com|google-analytics\.com|analytics\.google\.com|connect\.facebook\.net|clarity\.ms|hotjar|doubleclick\.net|number_pool|number-pools|appengine\/loc\/|appengine\/js\/user_session/i

/** Vendor requests that are the embedded form doing its job, not tracking. */
const FORM_OK = /leadconnectorhq\.com\/(widget\/form|forms\/|funnels\/)|stcdn\.leadconnectorhq\.com|attribution_service/i

let fail = 0
const say = (ok, msg) => { if (!ok) fail++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`) }

/** Header check is its own fetch: headers do not need a browser, and a 4xx here is worth seeing. */
async function headers(base) {
  const r = await fetch(base + '/', { redirect: 'follow' })
  return { status: r.status, robots: r.headers.get('x-robots-tag') }
}

/** Render, and report what the page ACTUALLY ended up with. */
async function render(browser, url) {
  const tab = await browser.newPage()
  const requested = []
  tab.on('request', (req) => {
    const u = req.url()
    if (TRACKERS.test(u) && !FORM_OK.test(u)) requested.push(u)
  })
  await tab.setViewport({ width: 1440, height: 900 })
  await tab.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
  // The head is replayed by a module script, so it is in place well before networkidle2 — but the
  // tags it gates are inserted by that same pass, so give the queue one more turn before reading.
  await new Promise((r) => setTimeout(r, 1500))
  const dom = await tab.evaluate(() => ({
    canonical: [...document.querySelectorAll('link[rel="canonical"]')].map((n) => n.href),
    ogUrl: [...document.querySelectorAll('meta[property="og:url"]')].map((n) => n.content),
    metaRobots: [...document.querySelectorAll('meta[name="robots"]')].map((n) => n.content),
  }))
  await tab.close()
  return { ...dom, requested }
}

const sh = await headers(STAGING)
const ph = await headers(PRODUCTION)
console.log(`staging     ${STAGING}  (${sh.status})`)
console.log(`production  ${PRODUCTION}  (${ph.status})\n`)

say(/noindex/i.test(sh.robots || ''), `staging serves X-Robots-Tag noindex  (${sh.robots || 'none'})`)
say(!/noindex/i.test(ph.robots || ''), `production does NOT serve noindex  (${ph.robots || 'none'})`)

// STAGING_RESOLVE=host:ip pins a brand-new host past a stale local resolver (Mason Park Kids, 2026-09-27).
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: process.env.STAGING_RESOLVE ? [`--host-resolver-rules=MAP ${process.env.STAGING_RESOLVE.replace(':', ' ')}`] : [] })
try {
  for (const p of PATHS) {
    const s = await render(browser, STAGING + p)
    const foreign = [...s.canonical, ...s.ogUrl].filter((u) => {
      try { return new URL(u).host !== new URL(STAGING).host } catch { return true }
    })
    say(foreign.length === 0, `${p}  staging points at no other host  ${foreign.length ? '-> ' + foreign.join(', ') : ''}`)
    say(!s.metaRobots.some((c) => /index/i.test(c) && !/noindex/i.test(c)), `${p}  no meta robots contradicting the header`)
    say(s.requested.length === 0, `${p}  no analytics or call tracking  ${s.requested.length ? '-> ' + [...new Set(s.requested.map((u) => new URL(u).host))].join(', ') : ''}`)
  }

  // Production must still have what staging must not: a gate that is satisfied by a dead site is
  // not a gate. Only the first path is checked — this is a smoke test, not a production audit.
  const prod = await render(browser, PRODUCTION + PATHS[0])
  const hosts = [...new Set(prod.requested.map((u) => new URL(u).host))].join(', ')
  if (NO_ANALYTICS && prod.requested.length === 0) {
    console.log('n/a  production loads no analytics or call tracking, and --no-analytics says so')
    console.log('     nothing at all is measuring this site — a finding in its own right, not a pass')
  } else if (NO_ANALYTICS) {
    say(false, `--no-analytics was passed but production DOES load tags  (${hosts}) — drop the flag`)
  } else {
    say(prod.requested.length > 0, `production still loads its tags  (${hosts || 'NONE'})`)
  }
} finally {
  await browser.close()
}

console.log(fail === 0 ? '\nOK — staging leaks nothing into production.' : `\n${fail} FAILED`)
process.exit(fail === 0 ? 0 : 1)
