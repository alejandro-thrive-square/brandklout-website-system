/**
 * Step 6 — prove the published site is actually whole.
 *
 * Publishing reports success in terms of rows written, which says nothing
 * about whether the result renders. Every failure on this upload got through
 * a green "ok" of some kind: pages saved and then silently emptied by a
 * full-replace PATCH, style rules purged by the tree shake, and every
 * internal link 404ing while each page looked perfect on its own.
 *
 * So this fetches every page and checks the things that broke:
 *   - each route serves 200 with a plausible amount of HTML
 *   - each has its own <title> (not the site name on all eighteen)
 *   - every internal href resolves (this is what caught the .html links)
 *   - every image src resolves
 *   - the stylesheet and script assets resolve, and the token layer is present
 *   - the navbar state rules survived the tree shake
 *
 * Usage: node verify-live.mjs
 */
/* This file used to carry the target host as a literal default and read no
   `.env` at all, which is fine right up until the toolkit is copied — the
   sibling's copy would then have crawled the sibling's domain and reported it
   green. Resolve it the way every other script here does, and refuse without
   it: a gate pointed at the wrong site is worse than no gate. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
{
  let dir = path.dirname(fileURLToPath(import.meta.url))
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, '.env')
    if (fs.existsSync(c)) {
      for (const line of fs.readFileSync(c, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
      break
    }
    const up = path.dirname(dir)
    if (up === dir) break
    dir = up
  }
}
const BASE = (process.env.INSTATIC_BASE_URL || '').replace(/\/$/, '')
if (!BASE) throw new Error('INSTATIC_BASE_URL is not set')

/* EVERY ROUTE THE BUILD WROTE, derived from dist/ rather than listed. The
   site was one route from 2026-09-10 to 2026-09-22 and is eighty from then
   on; a list kept by hand here goes blind the day a page is added (three
   gates on a sibling watched 11 of 57 pages and reported clean). A route
   absent from dist is not checked — GONE exists for that half. */
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../04-design/.tmp/site-src/dist')
const walk = (dir, pre = '') =>
  fs.readdirSync(dir).flatMap((e) =>
    fs.statSync(path.join(dir, e)).isDirectory() ? walk(path.join(dir, e), pre + e + '/') : e.endsWith('.html') ? [pre + e.replace(/\.html$/, '')] : [],
  )
const ROUTES = walk(DIST).map((s) => (s === 'index' ? '/' : '/' + s)).sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))

/* Nothing has ever been retired here. This instance was provisioned on
   2026-09-10 and its first publish was this site, so there is no earlier slug
   to have gone stale. Fill this in the first time a page is deleted rather than
   overwritten — an empty list is a true statement, not an unfinished one. */
const GONE = []

const fails = []
const warns = []
const seen = new Map()

async function head(url) {
  if (seen.has(url)) return seen.get(url)
  const r = await fetch(url, { redirect: 'manual' })
  seen.set(url, r.status)
  return r.status
}

const titles = new Set()
let assetsChecked = 0

for (const route of ROUTES) {
  const res = await fetch(BASE + route)
  const html = await res.text()
  if (res.status !== 200) {
    fails.push(`${route} -> HTTP ${res.status}`)
    continue
  }
  if (html.length < 8000) fails.push(`${route} -> only ${html.length} bytes; page is probably empty`)

  const title = (html.match(/<title>([^<]*)<\/title>/) ?? [])[1] ?? ''
  if (!title) fails.push(`${route} -> no <title>`)
  if (titles.has(title)) fails.push(`${route} -> duplicate <title> "${title}"`)
  titles.add(title)

  if (!/<h1[^>]*>/.test(html)) fails.push(`${route} -> no <h1>`)

  // Internal links.
  for (const m of html.matchAll(/href="(\/[^"#][^"]*|\/)"/g)) {
    const href = m[1].split('#')[0]
    if (!href || href.startsWith('/_instatic') || href.startsWith('/uploads')) continue
    const status = await head(BASE + href)
    if (status >= 400) fails.push(`${route} -> link ${href} is ${status}`)
  }
  // Anything still pointing at a .html file is a static-build leftover.
  for (const m of html.matchAll(/href="([^"]*\.html[^"]*)"/g)) {
    fails.push(`${route} -> link to a .html file: ${m[1]}`)
  }

  // Images and assets.
  for (const m of html.matchAll(/(?:src|href)="(\/(?:uploads|_instatic)\/[^"]+)"/g)) {
    const status = await head(BASE + m[1])
    assetsChecked++
    if (status >= 400) fails.push(`${route} -> asset ${m[1]} is ${status}`)
  }

  if (route === '/') {
    const styleHref = (html.match(/\/_instatic\/css\/style-[a-f0-9]+\.css/) ?? [])[0]
    const userHref = (html.match(/\/_instatic\/css\/userStyles-[a-f0-9]+\.css/) ?? [])[0]
    if (!styleHref) fails.push('no style registry stylesheet on the homepage')
    if (!userHref) fails.push('no userStyles stylesheet — the token layer is missing')
    /* THE TREE SHAKE, asked about THIS site's runtime classes rather than the
       sibling's navbar. `styleRuleTreeShake.ts` drops any class-kind rule whose
       id no node carries, and every ambient rule that so much as mentions it —
       which is why `push-site.mjs` demotes the unassigned ones to ambient. The
       classes this page's own script adds at runtime are the ones at risk, and
       each is here because a rule in `site-src/css/` styles it. */
    if (styleHref) {
      const css = await (await fetch(BASE + styleHref)).text()
      for (const cls of ['is-solid', 'is-open', 'is-locked', 'is-link', 'wz-smooth', 'wz-line', 'reveal-mask', 'is-lit', 'is-on', 'is-drawn']) {
        if (!css.includes(cls)) fails.push(`runtime class .${cls} was tree-shaken out of the published registry`)
      }
    }
    /* THE TOKEN LAYER, derived from the build rather than typed here. The
       sibling listed four token names by hand and every one of them belongs to
       a different site; copied unchanged, this gate failed a perfectly good
       publish four times over. Every custom property the build declares must
       be in the asset — that is the actual invariant push-site.mjs enforces
       before it writes, and this is the same question asked of the live CSS. */
    if (userHref) {
      const css = await (await fetch(BASE + userHref)).text()
      const cssDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../04-design/.tmp/site-src/css')
      const declared = [
        ...new Set(
          fs
            .readdirSync(cssDir)
            .filter((n) => n.endsWith('.css'))
            .flatMap((n) => [
              ...fs.readFileSync(path.join(cssDir, n), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ').matchAll(/(^|[;{])\s*(--[a-zA-Z0-9-]+)\s*:/g),
            ].map((m) => m[2]),
          ),
        ),
      ]
      const missing = declared.filter((t) => !css.includes(t + ':'))
      if (missing.length) fails.push(`${missing.length} token(s) missing from userStyles: ${missing.join(', ')}`)

      /* The three VARIABLE faces. They are media uploads here, not Instatic
         font-library entries (see push-site.mjs), so nothing but this asset
         declares them — and a dead @font-face is invisible: the family name
         still resolves and the browser falls back to Georgia. */
      const faces = (css.match(/@font-face/g) ?? []).length
      if (faces < 3) fails.push(`only ${faces}/3 @font-face rules in userStyles — the variable fonts are not declared`)
      for (const m of css.matchAll(/@font-face[\s\S]*?src:\s*url\(["']?([^"')]+)/g)) {
        const status = await head(m[1].startsWith('http') ? m[1] : BASE + m[1])
        assetsChecked++
        if (status >= 400) fails.push(`@font-face src ${m[1]} is ${status}`)
      }
    }
    /* FOUR script assets since 2026-09-22 (the agency added two consent
       scripts to the shell); the site bundle is whichever one carries
       `window.WZ`, not the first tag on the page. The first version of this
       read the first tag, hit the consent bridge, and failed a good publish. */
    const scripts = [...html.matchAll(/src="(\/_instatic\/assets\/[^"]+\.js)"/g)].map((m) => m[1])
    let js = null
    for (const s of scripts) {
      const t = await (await fetch(BASE + s)).text()
      if (t.includes('window.WZ')) { js = t; break }
    }
    if (!scripts.length) fails.push('no runtime script on the homepage')
    else if (!js) fails.push(`none of ${scripts.length} script asset(s) carries the site bundle (window.WZ)`)
    else {
      /* ONE script asset carries GSAP AND the site bundle, in that order
         (trap 17 / push-site.mjs `VENDOR`). Order is load-bearing and fails
         SILENTLY when reversed — `00-runtime.js` guards on `window.gsap`, so a
         reversed bundle produces a page with no smoother and no pins that looks
         like a design decision. Assert the positions, not just the presence.

         Keyed on CODE, not on the banner comments push-site.mjs writes: the
         publisher runs the code asset through its own bundler and every comment
         is gone by the time it is served — the first version of this check
         looked for `/* ---- site.js ---- *​/` and failed a perfectly good
         bundle. `window.WZ` is the first thing `js/00-runtime.js` does and is
         the earliest identifier that belongs to the site bundle, not to GSAP. */
      const iGsap = js.indexOf('ScrollSmoother')
      const iSite = js.indexOf('window.WZ')
      if (iGsap < 0) fails.push('the script asset does not carry GSAP — no smoother, no pins, no splits')
      if (iSite < 0) fails.push('the script asset does not carry site.js')
      if (iGsap >= 0 && iSite >= 0 && iGsap > iSite) {
        fails.push('GSAP is concatenated AFTER site.js — the motion layer will silently not arm')
      }
      if (!js.includes('wz-ready')) fails.push('site.js is missing the wz-ready bootstrap — reveal masks will not open')
      if (!js.includes('is-open')) fails.push('site.js does not contain the drawer logic')
      if (!js.includes('data-src')) fails.push('site.js is missing the video data-src hydration — both films will be posters')
    }
  }
}

/* The retired routes, if anyone has filled the list in. A page deleted from the
   site document should 404; anything else means the apply did not take. */
for (const route of GONE) {
  const status = await head(BASE + route)
  if (status !== 404) fails.push(`${route} -> HTTP ${status}, expected 404 (retired route still live)`)
}

console.log(`checked ${ROUTES.length} routes, ${seen.size} unique URLs, ${assetsChecked} asset references`)
if (GONE.length) console.log(`checked ${GONE.length} retired routes are gone`)
console.log(`distinct titles: ${titles.size}/${ROUTES.length}`)
if (warns.length) console.log('\nWARN\n  ' + warns.join('\n  '))
if (fails.length) {
  console.log('\nFAIL\n  ' + fails.join('\n  '))
  process.exit(1)
}
console.log('\nFAIL  none')
