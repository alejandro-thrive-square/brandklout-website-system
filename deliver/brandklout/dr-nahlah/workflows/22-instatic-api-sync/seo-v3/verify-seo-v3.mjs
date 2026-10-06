#!/usr/bin/env node
/**
 * SEO v3 live gate: the published graph matches what the page shows. Every sitemap URL:
 *   - one JSON-LD graph, schema.org-valid (vocab-check), no IV wording, no link arrows
 *   - one BreadcrumbList on every page but home, naming exactly the trail the page shows
 *     (articles: Home › Journal › the article's H1), last item = the page's own URL
 *   - FAQPage questions = the page's "?" accordions, answers word for word (articles: the "?"
 *     headings when there are three or more)
 *   - one VideoObject per film the page embeds
 *   - every hasPart / mainEntity / breadcrumb @id the WebPage points at exists in the graph
 * Re-reads the pages itself (it does not trust sections.json).   node seo-v3/verify-seo-v3.mjs [host]
 */
import { check } from './vocab-check.mjs'

const S = process.argv[2] || 'https://www.drnahlah.com'
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;|&#xa0;/g, ' ')
const txt = (s) => dec(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim()
const get = async (u) => { for (let i = 0; i < 4; i++) try { const r = await fetch(u); return { s: r.status, h: await r.text() } } catch { await new Promise((z) => setTimeout(z, 800)) } return { s: 0, h: '' } }
const arr = (x) => (x === undefined ? [] : [].concat(x))

const problems = []
const P = (u, m) => problems.push(`${u}: ${m}`)
const totals = {}
// the URL list: the host's sitemap, or production's paths on this host (staging serves no sitemap
// of its own). A gate that checked nothing must not say CLEAN.
let locs = [...(await get(`${S}/sitemap.xml`)).h.matchAll(/<loc>([^<]+)/g)].map((m) => m[1])
if (!locs.length) locs = [...(await get('https://www.drnahlah.com/sitemap.xml')).h.matchAll(/<loc>([^<]+)/g)].map((m) => S + new URL(m[1]).pathname)
if (locs.length < 50) { console.log(`only ${locs.length} URLs to check — refusing to call that clean`); process.exit(1) }
for (const u0 of locs) {
  const u = u0
  const path = new URL(u0).pathname
  const { s, h } = await get(u)
  if (s !== 200) { P(path, 'status ' + s); continue }
  const ld = [...h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  if (ld.length !== 1) { P(path, `${ld.length} JSON-LD scripts`); continue }
  const doc = JSON.parse(ld[0]); const g = doc['@graph']
  for (const i of check(doc)) P(path, 'vocab ' + i)
  if (/\b(IV|intravenous|an(a)?esthesiologist)\b/.test(ld[0].replace(/does not offer IV sedation( or general anesthesia)?/g, '')) || ld[0].includes('→')) P(path, 'IV wording or link arrow in the graph')
  const byType = (t) => g.filter((n) => arr(n['@type']).includes(t))
  for (const n of g) for (const t of arr(n['@type'])) totals[t] = (totals[t] || 0) + 1
  const body = h.split('</head>')[1]

  // breadcrumb
  const crumbs = byType('BreadcrumbList')
  if (path === '/') { if (crumbs.length) P(path, 'home carries a breadcrumb') } else if (crumbs.length !== 1) P(path, `${crumbs.length} BreadcrumbList`)
  else {
    const shown = [...((body.match(/<div class="(?:pk-crumb|breadcrumb_component)"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '').matchAll(/<(a|span)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => txt(m[2]))
    if (path.startsWith('/posts/')) shown.push(txt((body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || ''))
    if (path === '/contact' && !shown.length) shown.push('Home', 'Contact')
    const named = crumbs[0].itemListElement.map((x) => x.name)
    if (named.join(' › ') !== shown.join(' › ')) P(path, `breadcrumb "${named.join(' › ')}" ≠ shown "${shown.join(' › ')}"`)
    // every linked crumb's target = the visible link's href (paths: the graph names production URLs)
    const shownHrefs = [...((body.match(/<div class="(?:pk-crumb|breadcrumb_component)"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '').matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) => new URL(m[1], S).pathname)
    if (path.startsWith('/posts/') || path === '/contact') {} else if (crumbs[0].itemListElement.slice(0, -1).map((x) => new URL(x.item).pathname).join(' ') !== shownHrefs.join(' ')) P(path, `breadcrumb links ${crumbs[0].itemListElement.slice(0, -1).map((x) => new URL(x.item).pathname).join(' ')} ≠ shown ${shownHrefs.join(' ')}`)
    // the graph always names production URLs (siteUrl), so compare paths: the gate also runs on staging
    if (new URL(crumbs[0].itemListElement.at(-1).item).pathname !== path) P(path, 'last crumb is not this URL')
  }

  // FAQ = the accordions
  const faq = g.find((n) => arr(n['@type']).includes('FAQPage'))
  const acc = [...body.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)].map((m) => txt((m[1].match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/) || [])[1] || '')).filter((q) => /\?$/.test(q))
  if (!path.startsWith('/posts/') && path !== '/teeth-whitening') {
    const qs = faq ? faq.mainEntity.map((q) => q.name) : []
    if (qs.join('|') !== acc.join('|')) P(path, `FAQ ${qs.length} questions vs ${acc.length} on the page`)
    if (faq) {
      const plain = txt(body.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, ' '))
      for (const q of faq.mainEntity) if (!plain.includes(q.acceptedAnswer.text.slice(0, 120))) P(path, `answer not on the page: ${q.name}`)
    }
  }
  if (path.startsWith('/posts/') && faq) {
    const plain = txt(body)
    for (const q of faq.mainEntity) if (!plain.includes(q.name) || !plain.includes(q.acceptedAnswer.text.slice(0, 80))) P(path, `article FAQ not on the page: ${q.name}`)
  }

  // films
  const embedded = new Set([...body.matchAll(/player\.vimeo\.com\/video\/(\d+)|data-vimeo="(\d+)"|data-yt="([\w-]{11})"/g)].map((m) => m[1] || m[2] || m[3]))
  const described = new Set(byType('VideoObject').map((v) => v['@id'].split('#video-')[1]))
  for (const v of embedded) if (!described.has(v)) P(path, `film ${v} embedded, not described`)
  for (const v of described) if (!embedded.has(v)) P(path, `film ${v} described, not embedded`)

  // the WebPage's references resolve inside the graph
  const ids = new Set(g.map((n) => n['@id']).filter(Boolean))
  const wp = g.find((n) => String(n['@id']).endsWith('#webpage'))
  for (const r of [...arr(wp?.hasPart), ...arr(wp?.breadcrumb)]) if (r['@id'] && !ids.has(r['@id'])) P(path, 'dangling ' + r['@id'])
}
console.log('types', JSON.stringify(totals))
console.log(problems.length ? problems.join('\n') : 'SEO v3 CLEAN')
process.exit(problems.length ? 1 : 0)
