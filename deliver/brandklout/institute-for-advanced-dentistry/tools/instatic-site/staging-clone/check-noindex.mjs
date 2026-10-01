#!/usr/bin/env node
/**
 * Assert that STAGING is de-indexed and PRODUCTION is not.
 *
 *   node check-noindex.mjs --staging https://staging.drnahlah.com \
 *                          --production https://www.drnahlah.com
 *
 * Run after ANY Cloudflare change touching robots.txt, Transform Rules or
 * Snippets — and before trusting that staging is safe to link from BugHerd.
 * No credentials, changes nothing, so anyone can run it.
 *
 * WHY THIS EXISTS
 * ---------------
 * Cloudflare's managed `robots.txt` is served ACCOUNT-WIDE. Measured
 * 2026-08-31: www.drnahlah.com, staging.drnahlah.com and encorercm.com all
 * returned the byte-identical file (sha256 8fa3036c68bfcbd3, 1248 bytes) —
 * three hostnames across two different domains. So "just edit robots.txt to
 * block staging" silently blocks PRODUCTION too, and the only symptom is a
 * dental practice quietly falling out of Google over the following weeks.
 *
 * The safe shape, and what this checks:
 *
 *   staging     X-Robots-Tag: noindex   (Cloudflare Response Header Transform
 *                                        Rule, scoped to the staging hostname)
 *   staging     NO canonical            (noindex + canonical -> production can
 *                                        propagate the noindex to production;
 *                                        turn off `emitCanonical` on staging's
 *                                        Open Graph plugin)
 *   staging     robots.txt ALLOWS crawl (a Disallow would stop Google ever
 *                                        FETCHING the page, so it would never
 *                                        see the noindex and the URL could sit
 *                                        indexed forever)
 *   production  NO noindex anywhere, robots.txt has no site-wide Disallow
 *
 * The production assertions are the important half. Staging being crawlable
 * for another day is an SEO annoyance; production going noindex is an outage
 * nobody gets paged for.
 */
const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1] }
const STAGING = flag('staging')
const PROD = flag('production')
if (!STAGING || !PROD) {
  console.error('usage: node check-noindex.mjs --staging <url> --production <url>')
  process.exit(2)
}

const problems = []
const notes = []

async function look(base, path = '/') {
  const r = await fetch(base + path, { redirect: 'follow' })
  const body = await r.text()
  return {
    status: r.status,
    header: (r.headers.get('x-robots-tag') || '').toLowerCase(),
    meta: ((body.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)/i) || [])[1] || '').toLowerCase(),
    canonical: (body.match(/rel=["']canonical["'][^>]*href=["']([^"']+)/i) || [])[1] || '',
    body,
  }
}

const rules = (txt) => txt.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
const blocksEverything = (txt) => rules(txt).some((l) => /^disallow:\s*\/\s*$/i.test(l))

// ── staging ───────────────────────────────────────────────────────────────
const s = await look(STAGING)
const sIndexBlocked = s.header.includes('noindex') || s.meta.includes('noindex')
console.log(`staging     ${STAGING}`)
console.log(`  X-Robots-Tag        ${s.header || '(none)'}`)
console.log(`  meta robots         ${s.meta || '(none)'}`)
console.log(`  canonical           ${s.canonical || '(none)'}`)
if (!sIndexBlocked) problems.push('STAGING is indexable — no noindex in header or meta')
if (sIndexBlocked && s.canonical) {
  problems.push(`STAGING sets BOTH noindex and canonical -> ${s.canonical} — Google may apply the noindex to that URL. Disable emitCanonical on staging's Open Graph plugin.`)
}

const sRobots = await fetch(STAGING + '/robots.txt')
const sRobotsTxt = sRobots.ok ? await sRobots.text() : ''
if (sIndexBlocked && blocksEverything(sRobotsTxt)) {
  problems.push('STAGING has noindex AND robots.txt Disallow: / — the crawler is blocked from ever seeing the noindex. Pick one; for de-indexing, allow the crawl.')
}
if (!sIndexBlocked && blocksEverything(sRobotsTxt)) {
  notes.push('staging blocks crawling via robots.txt only — URLs can still be indexed without content if linked')
}

// ── production ────────────────────────────────────────────────────────────
const p = await look(PROD)
console.log(`\nproduction  ${PROD}`)
console.log(`  X-Robots-Tag        ${p.header || '(none)'}`)
console.log(`  meta robots         ${p.meta || '(none)'}`)
console.log(`  canonical           ${p.canonical || '(none)'}`)
if (p.header.includes('noindex') || p.meta.includes('noindex')) {
  problems.push('*** PRODUCTION IS SET TO NOINDEX *** — a hostname-scoped rule has leaked. Fix before anything else.')
}
const pRobots = await fetch(PROD + '/robots.txt')
const pRobotsTxt = pRobots.ok ? await pRobots.text() : ''
if (blocksEverything(pRobotsTxt)) {
  problems.push('*** PRODUCTION robots.txt CONTAINS Disallow: / *** — the site is blocked from Google.')
}
if (!p.canonical) {
  // Do not read this as proof. Everything here is parsed out of the RAW HTML, and on an Instatic
  // clone of a WordPress site the head is replayed by `site.js` after the document parses — so a
  // runtime-injected canonical is invisible to this check. On the Institute for Advanced Dentistry
  // (2026-09-18) this line printed while every page emitted a canonical pointing at production,
  // which is the exact pairing the gate exists to catch. `verify-staging-clean.mjs` renders the
  // page and asks the DOM; run it before trusting a clean result here.
  notes.push('production emits no canonical IN THE RAW HTML — a runtime-injected one would not show here; confirm with verify-staging-clean.mjs')
}

// Same-file detection: the account-wide managed robots.txt trap.
if (sRobotsTxt && pRobotsTxt && sRobotsTxt === pRobotsTxt) {
  notes.push('staging and production serve a BYTE-IDENTICAL robots.txt — it is shared (Cloudflare-managed). Never edit it to block staging.')
}

console.log('')
for (const n of notes) console.log(`note:    ${n}`)
for (const pr of problems) console.log(`PROBLEM: ${pr}`)
console.log(problems.length ? `\n${problems.length} problem(s).` : '\nOK — staging de-indexed, production untouched.')
process.exit(problems.length ? 1 : 0)
