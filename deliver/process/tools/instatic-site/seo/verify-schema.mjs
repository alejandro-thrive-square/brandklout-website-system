#!/usr/bin/env node
/**
 * verify-schema.mjs — step 5, the live gate: the published graph matches what each page shows.
 * Every sitemap URL of the host (a host with no sitemap, like staging, is read at production's paths):
 *   - exactly one JSON-LD graph, schema.org-vocabulary clean (vocab-check.mjs), no link arrows (→)
 *     and nothing matching the client's rules.graphForbidden (e.g. a treatment the practice does
 *     not offer), apart from rules.graphForbiddenExcept
 *   - one BreadcrumbList on every page but those in breadcrumbs.skip, naming exactly the trail the
 *     page shows (articles: articles.crumb › the article's H1; breadcrumbs.fallback where the page
 *     shows none), each linked crumb pointing where the visible link does, the last = the page
 *   - FAQPage questions = the page's "?" accordions, in order, each answer found on the page
 *     (articles: the "?" headings when the build gave them a FAQPage)
 *   - one VideoObject per film the page embeds, and none it does not
 *   - every hasPart / breadcrumb @id the WebPage points at exists in the graph
 * It re-reads the pages itself and never trusts sections.json. The graph names production URLs, so
 * paths are compared: the gate runs on staging too. A gate that checked fewer than verify.minUrls
 * URLs (or --min-urls) fails rather than saying CLEAN.
 *
 *   node verify-schema.mjs [host] [--config output/seo-config.json] [--out output/schema] [--min-urls 50]
 *
 * Read-only, no login. Exit 1 on any problem.
 * Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v3/verify-seo-v3.mjs
 * (class names, exempt pages, forbidden wording and the URL floor moved to seo-config.json).
 */
import { join } from 'node:path'
import { loadConfig, arg, outDir, rx } from './lib/seo-config.mjs'
import { get, sitemapLocs, slugOfPath, makeReader, txt, stripChrome, videosIn, qaOf } from './lib/sections.mjs'
import { vocabChecker } from './vocab-check.mjs'

const C = loadConfig()
const pos = process.argv.slice(2).find((a, i, all) => /^https?:\/\//.test(a) && !(all[i - 1] || '').startsWith('--'))
const S = (pos || arg('--host', C.site.origin)).replace(/\/+$/, '')
const MIN = +arg('--min-urls', C.verify.minUrls ?? 1)
const R = makeReader(C.markup)
const check = await vocabChecker(join(outDir(), 'schemaorg.jsonld'))
const arr = (x) => (x === undefined ? [] : [].concat(x))
const art = C.articles
const isArticle = (slug) => !!art && slug.startsWith(art.prefix)
const FORBID = C.rules.graphForbidden ? rx(C.rules.graphForbidden) : null
const EXCEPT = C.rules.graphForbiddenExcept ? new RegExp(rx(C.rules.graphForbiddenExcept).source, 'g' + rx(C.rules.graphForbiddenExcept).flags.replace('g', '')) : null
const faqSkip = new Set([...C.faq.skip, ...Object.entries(C.pages).filter(([, p]) => p.faq === false).map(([s]) => s)])

const problems = []
const P = (u, m) => problems.push(`${u}: ${m}`)
const totals = {}
const locs = await sitemapLocs(S, C.site.origin)
if (locs.length < MIN) { console.log(`only ${locs.length} URLs to check (floor ${MIN}) — refusing to call that clean`); process.exit(1) }
for (const u of locs) {
  const path = new URL(u).pathname
  const slug = slugOfPath(path)
  const { s, h } = await get(u)
  if (s !== 200) { P(path, 'status ' + s); continue }
  const ld = [...h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  if (ld.length !== 1) { P(path, `${ld.length} JSON-LD scripts`); continue }
  let doc
  try { doc = JSON.parse(ld[0]) } catch (e) { P(path, 'JSON-LD does not parse: ' + e.message); continue }
  const g = doc['@graph'] || [doc]
  for (const i of check(doc)) P(path, 'vocab ' + i)
  if (FORBID && FORBID.test(EXCEPT ? ld[0].replace(EXCEPT, '') : ld[0])) P(path, `the graph says what rules.graphForbidden forbids (${C.rules.graphForbidden})`)
  if (ld[0].includes('→') || ld[0].includes('\\u2192')) P(path, 'a link arrow (→) in the graph: navigation text leaked into a value')
  const byType = (t) => g.filter((n) => arr(n['@type']).includes(t))
  for (const n of g) for (const t of arr(n['@type'])) totals[t] = (totals[t] || 0) + 1
  const body = h.split('</head>')[1] || ''

  // breadcrumb
  const crumbs = byType('BreadcrumbList')
  if (C.breadcrumbs.skip.includes(slug)) { if (crumbs.length) P(path, 'carries a breadcrumb (breadcrumbs.skip says it shows none)') } else if (crumbs.length !== 1) P(path, `${crumbs.length} BreadcrumbList`)
  else {
    const visible = R.crumbOf(body)
    let shown = visible.map((c) => c.name)
    const fallback = !shown.length && C.breadcrumbs.fallback[slug]
    if (isArticle(slug)) shown = [...(shown.length ? shown : arr(art.crumb).map((c) => c.name)), txt((body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '')]
    else if (fallback) shown = fallback.map((c) => c.name)
    const named = crumbs[0].itemListElement.map((x) => x.name)
    if (named.join(' › ') !== shown.join(' › ')) P(path, `breadcrumb "${named.join(' › ')}" ≠ shown "${shown.join(' › ')}"`)
    if (!isArticle(slug) && !fallback) {
      const shownHrefs = visible.filter((c) => c.href).map((c) => new URL(c.href, S).pathname)
      const graphHrefs = crumbs[0].itemListElement.slice(0, -1).map((x) => new URL(x.item).pathname)
      if (graphHrefs.join(' ') !== shownHrefs.join(' ')) P(path, `breadcrumb links ${graphHrefs.join(' ')} ≠ shown ${shownHrefs.join(' ')}`)
    }
    if (new URL(crumbs[0].itemListElement.at(-1).item).pathname.replace(/\/+$/, '') !== path.replace(/\/+$/, '')) P(path, 'last crumb is not this URL')
  }

  // FAQ = the accordions
  const faq = g.find((n) => arr(n['@type']).includes('FAQPage'))
  if (!isArticle(slug) && !faqSkip.has(slug)) {
    // the page's own "?" accordions: <details><summary>, else button + panel (as the scan reads them)
    const acc = qaOf(stripChrome(body)).map((x) => x.q).filter((q) => /\?$/.test(q))
    const qs = faq ? arr(faq.mainEntity).map((q) => q.name) : []
    if (qs.join('|') !== acc.join('|')) P(path, `FAQ ${qs.length} questions vs ${acc.length} on the page`)
    if (faq) {
      const plain = txt(body.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, ' '))
      for (const q of arr(faq.mainEntity)) if (!plain.includes(q.acceptedAnswer.text.slice(0, 120))) P(path, `answer not on the page: ${q.name}`)
    }
  }
  if (isArticle(slug) && faq) {
    const plain = txt(body)
    for (const q of arr(faq.mainEntity)) if (!plain.includes(q.name) || !plain.includes(q.acceptedAnswer.text.slice(0, 80))) P(path, `article FAQ not on the page: ${q.name}`)
  }

  // films
  const embedded = new Set(videosIn(stripChrome(body)).map((v) => v.replace(/^yt:/, '')))
  const described = new Set(byType('VideoObject').map((v) => String(v['@id']).split('#video-')[1]))
  for (const v of embedded) if (!described.has(v)) P(path, `film ${v} embedded, not described`)
  for (const v of described) if (!embedded.has(v)) P(path, `film ${v} described, not embedded`)

  // the WebPage's references resolve inside the graph
  const ids = new Set(g.map((n) => n['@id']).filter(Boolean))
  const wp = g.find((n) => String(n['@id']).endsWith('#webpage'))
  for (const r of [...arr(wp?.hasPart), ...arr(wp?.breadcrumb)]) if (r['@id'] && !ids.has(r['@id'])) P(path, 'dangling ' + r['@id'])
}
console.log(`${S}: ${locs.length} URLs`)
console.log('types', JSON.stringify(totals))
console.log(problems.length ? problems.join('\n') : 'SCHEMA CLEAN')
process.exit(problems.length ? 1 : 0)
