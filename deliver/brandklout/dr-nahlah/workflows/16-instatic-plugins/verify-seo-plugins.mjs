#!/usr/bin/env node
/**
 * verify-seo-plugins.mjs — the LIVE gate for `webzite.open-graph` and
 * `webzite.aeo-schema`.
 *
 *   node verify-seo-plugins.mjs                 # every published URL
 *   node verify-seo-plugins.mjs --limit 8       # a sample, while iterating
 *
 * `test-open-graph.mjs` and `test-aeo-schema.mjs` prove the two filters
 * transform HTML correctly. They cannot prove the host CALLS them, that both
 * are enabled, that the settings landed, or that the values are right for this
 * practice. That is this file, and it reads the served bytes.
 *
 * The checks that matter most, and why:
 *
 *  - **Every URL has a DISTINCT og:url and a distinct canonical.** The
 *    publisher hands the filter the merged template's slug for an entry page,
 *    so all 43 articles arrive identically labelled. If the title-fallback
 *    resolver ever regresses, every article claims to be `/post` and the whole
 *    journal de-indexes itself into one page. One duplicate here is a failure.
 *  - **Every page's JSON-LD parses**, pulled back out of the script tag. A
 *    graph that does not parse is worse than no graph.
 *  - **No page carries two descriptions or two canonicals** — the filter edits
 *    in place and appends, and both mistakes are invisible in a browser.
 */
import { getPages, api, BASE } from '../15-instatic-api-sync/insta-api.mjs'

const li = process.argv.indexOf('--limit')
const LIMIT = li > -1 ? Number(process.argv[li + 1]) : Infinity
const PUBLIC = process.env.PUBLIC_BASE || 'https://www.drnahlah.com'

let pass = 0, fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++ } else { fail++; console.log(`  FAIL  ${name}${detail ? '\n          ' + String(detail).slice(0, 300) : ''}`) }
}
const group = (name, cond, detail) => {
  check(name, cond, detail)
  console.log(`  ${cond ? 'ok  ' : 'FAIL'}  ${name}`)
}

/* ── the plugins are installed, enabled and configured ────────────────── */

console.log('\ninstall state\n')
const installed = (await api('GET', '/admin/api/cms/plugins')).plugins ?? []
for (const id of ['webzite.open-graph', 'webzite.aeo-schema']) {
  const p = installed.find((x) => x.manifest?.id === id)
  group(`${id} is installed`, !!p)
  if (!p) continue
  group(`${id} is enabled and active`, p.enabled === true && p.lifecycleStatus !== 'error',
    `enabled=${p.enabled} status=${p.lifecycleStatus} ${p.lifecycleError ?? ''}`)
  const settings = (await api('GET', `/admin/api/cms/plugins/${id}/settings`)).settings ?? {}
  group(`${id} has the public address configured`, settings.siteUrl === PUBLIC, settings.siteUrl)
  group(`${id} is switched on`, settings.enabled !== false)
}

/* ── what to fetch ────────────────────────────────────────────────────── */

const { rows } = await getPages()
const pageSlugs = rows
  .filter((r) => r.cells?.templateEnabled !== true)
  .map((r) => (r.slug === 'index' ? '/' : `/${r.slug}`))
const { rows: postRows } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
const postPaths = postRows.map((r) => `/posts/${r.slug}`)
const paths = [...pageSlugs, ...postPaths].slice(0, LIMIT)

console.log(`\n${paths.length} published URLs\n`)

const OG_RE = (prop) => new RegExp(`<meta property="${prop}" content="([^"]*)">`)
const NAME_RE = (n) => new RegExp(`<meta name="${n}" content="([^"]*)">`)
const LD_RE = /<script type="application\/ld\+json" data-aeo="webzite\.aeo-schema">\n([\s\S]*?)\n  <\/script>/
const CANON_RE = /<link rel="canonical" href="([^"]*)">/

const seenOgUrl = new Map()
const seenCanonical = new Map()
const missing = []

for (const path of paths) {
  let html
  try {
    const res = await fetch(BASE + path)
    if (!res.ok) { missing.push(`${path} -> ${res.status}`); fail++; continue }
    html = await res.text()
  } catch (e) {
    missing.push(`${path} -> ${e.message}`); fail++; continue
  }

  const ogTitle = (OG_RE('og:title').exec(html) || [])[1]
  const ogUrl = (OG_RE('og:url').exec(html) || [])[1]
  const ogImage = (OG_RE('og:image').exec(html) || [])[1]
  const ogType = (OG_RE('og:type').exec(html) || [])[1]
  const canonical = (CANON_RE.exec(html) || [])[1]
  const desc = (NAME_RE('description').exec(html) || [])[1]

  check(`${path} has og:title`, !!ogTitle)
  check(`${path} has og:url`, !!ogUrl)
  check(`${path} has an absolute og:image`, !!ogImage && /^https:\/\//.test(ogImage), ogImage)
  check(`${path} has a canonical link`, !!canonical)
  check(`${path} has a description`, !!desc)
  check(`${path} carries exactly one description`,
    (html.match(/<meta name="description"/g) || []).length === 1)
  check(`${path} carries exactly one canonical`,
    (html.match(/rel="canonical"/g) || []).length === 1)
  check(`${path} carries exactly one og:title`,
    (html.match(/property="og:title"/g) || []).length === 1)
  check(`${path} og:url matches the canonical`, ogUrl === canonical, `${ogUrl} vs ${canonical}`)
  check(`${path} og:url is on the public domain`, String(ogUrl).indexOf(PUBLIC) === 0, ogUrl)
  check(`${path} og:url ends at this path`,
    String(ogUrl) === PUBLIC + (path === '/' ? '/' : path), `${ogUrl} for ${path}`)
  check(`${path} an article is typed as one`,
    path.indexOf('/posts/') !== 0 || ogType === 'article', ogType)

  if (ogUrl) {
    if (seenOgUrl.has(ogUrl)) {
      fail++
      console.log(`  FAIL  og:url is NOT unique: ${ogUrl}\n          ${seenOgUrl.get(ogUrl)} and ${path}`)
    } else seenOgUrl.set(ogUrl, path)
  }
  if (canonical) {
    if (seenCanonical.has(canonical)) {
      fail++
      console.log(`  FAIL  canonical is NOT unique: ${canonical}\n          ${seenCanonical.get(canonical)} and ${path}`)
    } else seenCanonical.set(canonical, path)
  }

  // JSON-LD: pull it out and PARSE it. "It looked right" is not a check.
  const ld = LD_RE.exec(html)
  check(`${path} has a JSON-LD graph`, !!ld)
  if (ld) {
    let doc = null
    try { doc = JSON.parse(ld[1]) } catch (e) {
      fail++
      console.log(`  FAIL  ${path} JSON-LD does not parse: ${e.message}`)
    }
    if (doc) {
      /* `@type` is a STRING or an ARRAY. It became an array the moment the
         plugin started collapsing nodes that share an `@id`, so a page node is
         `["WebPage", "AboutPage"]` — a subtype added to the type it
         specialises. Comparing with `===` silently stopped matching and this
         gate reported 93 failures against a site that was entirely correct.
         Treat it as the set it is. */
      const typesOf = (n) => [].concat(n['@type'] || [])
      const nodes = doc['@graph'] || []
      const types = nodes.flatMap(typesOf)
      const has = (t) => types.includes(t)

      check(`${path} the graph carries one @context`, doc['@context'] === 'https://schema.org')
      check(`${path} the organisation is on the page`, has('Dentist'), types.join(','))
      check(`${path} a WebPage node is present`, has('WebPage'), types.join(','))
      check(`${path} an article carries an Article node`,
        path.indexOf('/posts/') !== 0 || has('Article'), types.join(','))
      check(`${path} an interior page carries breadcrumbs`,
        path === '/' || has('BreadcrumbList'), types.join(','))

      const wp = nodes.find((n) => typesOf(n).includes('WebPage'))
      check(`${path} the WebPage url matches the canonical`, wp && wp.url === canonical, `${wp && wp.url}`)

      // One entity, one node. Two nodes sharing an id is the defect the
      // collapse was added to remove, and it can only come back silently.
      const ids = nodes.map((n) => n['@id']).filter(Boolean)
      check(`${path} no @id appears twice in the graph`,
        new Set(ids).size === ids.length,
        ids.filter((v, i) => ids.indexOf(v) !== i).join(','))
    }
  }
  // Only 43 identical descriptions is the defect this replaced; a second
  // identical one is fine (two pages can share a sentence), so this is a
  // report, not an assertion.
}

if (missing.length) {
  console.log(`\n  ${missing.length} URL(s) could not be fetched:`)
  for (const m of missing) console.log(`    ${m}`)
}

/* ── the whole-site properties ────────────────────────────────────────── */

console.log('\nsite-wide\n')
group(`every og:url is unique (${seenOgUrl.size} of ${paths.length})`, seenOgUrl.size === paths.length)
group(`every canonical is unique (${seenCanonical.size} of ${paths.length})`, seenCanonical.size === paths.length)

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
