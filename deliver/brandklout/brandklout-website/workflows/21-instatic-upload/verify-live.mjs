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
/* Brandklout: one page, on its review host until the domain moves. */
const BASE = (process.env.INSTATIC_BASE_URL || 'https://brandklout-production.up.railway.app').replace(/\/$/, '')

/* ELEVEN ROUTES — the eleven core pages of the second build, one per subtask on
   Asana task 1218112701145002. Every slug is the static build's filename minus
   `.html`, except `index.html`, which Instatic serves at `/`.

   Note what this gate can and cannot tell you. It verifies the routes below are
   healthy. It CANNOT tell you an unlisted route is gone, because a route absent
   from this list is simply not checked — GONE exists for that half.

   Add the six remaining treatment dossiers here the day they are published;
   `botox` is the only one built so far and it is the template for the rest. */
/* Brandklout v2 (2026-09-11): seven routes. Checked against the build's page list below, so a
   page added to the package and not here fails this gate instead of going unchecked. */
const ROUTES = [
  '/',
  '/survey',
  '/customer-stories-legacy-dental-pasadena',
  '/customer-stories-oceanic-ai-search-growth',
  '/customer-stories-oceanic-future-ready',
  '/customer-stories-ocpao-ai-authority',
  '/customer-stories-omnia-ai-search-growth',
]
{
  const { readFileSync } = await import('node:fs')
  const manifest = JSON.parse(readFileSync(new URL('./.tmp/site/site-src/pages.json', import.meta.url), 'utf8'))
  const built = manifest.pages.map((p) => (p.slug === 'index' ? '/' : `/${p.slug}`)).sort().join()
  if (built !== [...ROUTES].sort().join()) throw new Error(`verify-live's routes do not match the build: ${built}`)
}

/* Nothing has ever been retired here. This instance was provisioned on
   2026-09-04 and its first publish was this site, so there is no earlier slug
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
  // The stories are ~8KB of source each, so the floor is lower than Stone's.
  if (html.length < 5000) fails.push(`${route} -> only ${html.length} bytes; page is probably empty`)

  // Every rule of Sang's is scoped to a class on <body> (prepare-source.mjs). Without it the page
  // publishes with none of its own styling, and nothing else here would say why.
  const bodyClass = (html.match(/<body[^>]*\bclass="([^"]*)"/) ?? [])[1] ?? ''
  if (!/\bpg-[a-z-]+\b/.test(bodyClass)) fails.push(`${route} -> <body> has no pg-* scope class ("${bodyClass}")`)
  if (route.startsWith('/customer-stories-') && !/<iframe[^>]+src="https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\//.test(html)) {
    fails.push(`${route} -> no YouTube player`)
  }
  if (route === '/survey' && !/<form[^>]+id="growthSurvey"/.test(html)) fails.push('/survey -> no #growthSurvey form')

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
    // Brandklout: the runtime class is `.open` on `.faq-item` — the FAQ answers are
    // `max-height: 0` until it is set. The sibling checked its navbar state rules here.
    if (styleHref) {
      const css = await (await fetch(BASE + styleHref)).text()
      if (!/\.faq-item\.open\s+\.faq-a/.test(css)) {
        fails.push('the `.faq-item.open .faq-a` rule did not survive the tree shake — no FAQ answer can open')
      }
    }
    // Sang's page's `:root` tokens, which the registry conversion drops (trap 1).
    if (userHref) {
      const css = await (await fetch(BASE + userHref)).text()
      for (const token of ['--ink', '--paper', '--muted', '--line', '--cyan', '--max', '--shadow']) {
        if (!css.includes(token + ':')) fails.push(`token ${token} missing from userStyles`)
      }
    }
    const script = (html.match(/src="(\/_instatic\/assets\/[^"]+\.js)"/) ?? [])[1]
    if (!script) fails.push('no runtime script on the homepage')
    else {
      const js = await (await fetch(BASE + script)).text()
      if (!/classList\.add\(["']js["']\)/.test(js)) {
        fails.push('site.js is missing the `js` class bootstrap — scroll reveals will not arm')
      }
      if (!js.includes('.faq-q')) fails.push('site.js does not contain the FAQ toggle')
      if (!js.includes('leadForm')) fails.push('site.js does not contain the form handler')
      if (!js.includes('growthSurvey')) fails.push('site.js does not contain the survey script')
      // Look for CODE, not the banner comment: the published bundle strips comments, and the
      // first version of this check failed a site whose repairs were working.
      if (!js.includes('data-number') || !js.includes('submitButton')) {
        fails.push('site.js does not carry the attribute repairs — the survey will throw at boot')
      }
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
