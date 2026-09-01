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
const BASE = 'https://stone-surgical-arts-production.up.railway.app'

/* ONE ROUTE, since 2026-09-01. This was six core routes plus twelve derived
   from `treatments-data.mjs`; the client kept the home page and the collection
   was deleted with the pages.

   Note what this gate can and cannot tell you now. It verifies the routes below
   are healthy. It CANNOT tell you the retired ones are gone, because a route
   absent from this list is simply not checked — which was the exact failure the
   derived list was written to prevent, arriving from the other direction. GONE
   exists for that half, and it is filled in.

   `/neck-lift` is on BOTH lists' worth of history and on neither by accident:
   the slug existed on the live instance carrying the v1 design, and it is being
   overwritten rather than retired, so it belongs in ROUTES. */
const ROUTES = ['/', '/neck-lift']

/* Routes that must NOT resolve. These are the sixteen slugs the 2026-09-01 cut
   deleted, and this list is what turns the cut from "we did not upload them"
   into a checked outcome. Empty until the cut is published; run this gate after
   the first --apply that follows it. */
const GONE = [
  '/about',
  '/blepharoplasty',
  '/book',
  '/brow-lift',
  '/buccal-fat-reduction',
  '/cheek-and-chin-implants',
  '/face-and-neck-lift',
  '/injectables',
  '/jawline-implant',
  '/laser-resurfacing',
  '/lip-lift',
  '/memberships',
  '/morpheus8',
  '/myellevate-neck-lift',
  '/results',
  '/treatments',
]

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
    if (styleHref) {
      const css = await (await fetch(BASE + styleHref)).text()
      const navRules = (css.match(/navbar_component:not/g) ?? []).length
      if (navRules < 6) {
        fails.push(`only ${navRules}/6 navbar state rules survived the tree shake`)
      }
    }
    if (userHref) {
      const css = await (await fetch(BASE + userHref)).text()
      for (const token of ['--ivory', '--space-large', '--font-display', '--green-ink']) {
        if (!css.includes(token)) fails.push(`token ${token} missing from userStyles`)
      }
    }
    const script = (html.match(/src="(\/_instatic\/assets\/[^"]+\.js)"/) ?? [])[1]
    if (!script) fails.push('no runtime script on the homepage')
    else {
      const js = await (await fetch(BASE + script)).text()
      if (!/classList\.add\(["']js["']\)/.test(js)) {
        fails.push('site.js is missing the `js` class bootstrap — scroll reveals will not arm')
      }
      if (!js.includes('is-open')) fails.push('site.js does not contain the drawer logic')
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
