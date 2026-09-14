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
/* Every route the build has, from its own list (prepare-source.mjs -> site-src/pages.json). v2's
   seven were written out; v11 has 33, and a hand list that drifts is how a gate goes blind. */
const { readFileSync } = await import('node:fs')
const MANIFEST = JSON.parse(readFileSync(new URL('./.tmp/site/site-src/pages.json', import.meta.url), 'utf8'))
const SHARED = MANIFEST.layout === 'shared'
const ROUTES = MANIFEST.pages.map((p) => (p.slug === 'index' ? '/' : `/${p.slug}`))
// Local copy of the verbatim stylesheet, to prove the published one carries it (shared layout).
// The class system (2026-09-14): the code asset is site-src/code.css, and the quoted font families
// are read from the local rendering of the whole registry (class-site/assets/site.css).
const CLASSES = MANIFEST.css === 'classes'
const LOCAL_CSS = CLASSES
  ? readFileSync(new URL('./.tmp/site/site-src/code.css', import.meta.url), 'utf8')
  : SHARED
    ? readFileSync(new URL('./.tmp/site/final-site/assets/site.css', import.meta.url), 'utf8')
    : ''
const FAMILY_CSS = CLASSES ? readFileSync(new URL('./.tmp/site/class-site/assets/site.css', import.meta.url), 'utf8') : LOCAL_CSS

/* Retired routes, which must 404 after the apply. v11 (2026-09-14) replaced v2's seven pages;
   these six v2 slugs have no v11 page (the home page is overwritten, not retired). */
const GONE = SHARED
  ? [
      '/survey',
      '/customer-stories-legacy-dental-pasadena',
      '/customer-stories-oceanic-ai-search-growth',
      '/customer-stories-oceanic-future-ready',
      '/customer-stories-ocpao-ai-authority',
      '/customer-stories-omnia-ai-search-growth',
    ]
  : []
// v11: the three pages with a `form[data-lead-form]`, which POST to FormSubmit (patches/assets/site.js.mjs).
const FORM_ROUTES = ['/', '/market-opportunity', '/authority-score']
const LEGAL_ROUTES = ['/privacy', '/terms', '/hipaa']

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

  const csp = (html.match(/Content-Security-Policy" content="([^"]*)"/) ?? [])[1] ?? ''
  const bodyClass = (html.match(/<body[^>]*\bclass="([^"]*)"/) ?? [])[1] ?? ''
  if (!SHARED) {
    // v2: every rule of Sang's is scoped to a class on <body> (prepare-source.mjs). Without it the
    // page publishes with none of its own styling, and nothing else here would say why.
    if (!/\bpg-[a-z-]+\b/.test(bodyClass)) fails.push(`${route} -> <body> has no pg-* scope class ("${bodyClass}")`)
  } else {
    // v11: Sang's CSS keys its themes off his own body classes; the body node must carry them.
    if (!/\bvisual-site\b/.test(bodyClass)) fails.push(`${route} -> <body> lost Sang's classes ("${bodyClass}")`)
    // Story players and the video pop-up create youtube-nocookie iframes at runtime (stories-v10.js,
    // visual.js): the page's CSP has to allow that host, or Play shows an empty box.
    if (!/frame-src[^;]*https:\/\/www\.youtube-nocookie\.com/.test(csp)) fails.push(`${route} -> CSP frame-src does not allow https://www.youtube-nocookie.com; the in-place players would be blocked`)
  }
  if (FORM_ROUTES.includes(route)) {
    if (!/<form[^>]+data-lead-form/.test(html)) fails.push(`${route} -> no form[data-lead-form]`)
    if (!/connect-src[^;]*https:\/\/formsubmit\.co/.test(csp)) fails.push(`${route} -> CSP connect-src does not allow https://formsubmit.co; the form would be blocked`)
  }
  if (route === '/authority-score') {
    const radios = (html.match(/<input[^>]+type="radio"/g) ?? []).length
    if (radios !== 42) fails.push(`/authority-score -> ${radios} yes/no radios, expected 42`)
  }
  // The legal pages carry brandklout.com's text (patches/<page>.html.mjs), not Sang's draft template.
  if (LEGAL_ROUTES.includes(route)) {
    if (!html.includes('Effective Date')) fails.push(`${route} -> no "Effective Date": the brandklout.com legal text is missing`)
    if (/Draft (website|explanatory)/.test(html)) fails.push(`${route} -> still shows Sang's draft legal note`)
  }

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
    if (!styleHref && (!SHARED || CLASSES)) fails.push('no style registry stylesheet on the homepage')
    if (!userHref) fails.push(SHARED ? 'no userStyles stylesheet — the whole verbatim site CSS is missing' : 'no userStyles stylesheet — the token layer is missing')
    // v11: the CSS is the code asset, verbatim. Prove the published copy carries all of it.
    if (SHARED && userHref) {
      const css = (await (await fetch(BASE + userHref)).text()).replace(/\r\n/g, '\n')
      if (!css.includes(LOCAL_CSS.replace(/\r\n/g, '\n'))) fails.push(`userStyles does not contain the local ${CLASSES ? 'code.css' : 'site.css'} verbatim (${css.length} vs ${LOCAL_CSS.length} bytes); run css-parity.mjs for the declarations`)
      // Every quoted family the CSS asks for needs an @font-face somewhere on the page, or the text
      // silently falls back to a system font wherever the family is not installed. Instatic writes
      // them into framework-*.css (install-fonts.mjs); read every stylesheet the page links.
      let allCss = ''
      for (const m of html.matchAll(/href="(\/_instatic\/css\/[^"]+\.css)"/g)) allCss += '\n' + (await (await fetch(BASE + m[1])).text())
      const families = new Set([...FAMILY_CSS.matchAll(/font-family:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]))
      if (!families.size) warns.push('no quoted font-family in the local CSS; the @font-face check did nothing')
      for (const fam of families) {
        if (!new RegExp(`@font-face\\s*\\{[^}]*font-family:\\s*['"]?${fam}['"]?\\s*;`).test(allCss)) fails.push(`no @font-face for "${fam}" in the page's stylesheets: visitors get a fallback font (run install-fonts.mjs --apply)`)
      }
    }
    const script = (html.match(/src="(\/_instatic\/assets\/[^"]+\.js)"/) ?? [])[1]
    if (SHARED) {
      if (!script) fails.push('no runtime script on the homepage')
      else {
        const js = await (await fetch(BASE + script)).text()
        if (!/classList\.add\(["']js["']\)/.test(js)) fails.push('site.js is missing the `js` class bootstrap')
        if (!js.includes('https://formsubmit.co/ajax/sales@brandklout.com')) fails.push('site.js does not point the forms at FormSubmit -> sales@brandklout.com')
        if (!js.includes('data-authority-quiz')) fails.push('site.js does not contain the assessment script')
        if (!js.includes('BKVisual') || !js.includes('BKStories')) fails.push('site.js is missing visual.js or stories-v10.js')
      }
    }
  }
  if (route === '/' && !SHARED) {
    const styleHref = (html.match(/\/_instatic\/css\/style-[a-f0-9]+\.css/) ?? [])[0]
    const userHref = (html.match(/\/_instatic\/css\/userStyles-[a-f0-9]+\.css/) ?? [])[0]
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
      // Look for CODE, not comments: the published bundle strips comments.
      if (!js.includes('sheetdb.io/api/v1/w8136dpdrs4st') || !js.includes('getResults')) {
        fails.push('site.js does not contain the 21-point assessment script')
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
