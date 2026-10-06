#!/usr/bin/env node
// SEO v2 live gate (2026-10-05). Every sitemap URL + every page row's URL on production:
// status, one title / description / canonical, title + description = meta.json, og:description =
// description, exactly one JSON-LD graph that parses, the node types each page kind must carry,
// no retired URL or IV wording in the graph, no empty alt on indexed pages, and the trimmed
// seo-head.js still carrying noindex for the ads pages.   node seo-v2/verify-seo-v2.mjs
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
const HERE = dirname(fileURLToPath(import.meta.url))
const S = 'https://www.drnahlah.com'
const meta = JSON.parse(readFileSync(join(HERE, 'meta.json'), 'utf8'))
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const get = async (u) => { for (let i = 0; i < 4; i++) try { const r = await fetch(u); return { s: r.status, h: await r.text() } } catch { await new Promise((z) => setTimeout(z, 800)) } return { s: 0, h: '' } }

const sm = (await get(`${S}/sitemap.xml`)).h
const urls = new Set([...sm.matchAll(/<loc>([^<]+)/g)].map((m) => m[1].replace(S, '') || '/'))
for (const k of Object.keys(meta)) urls.add(k === 'index' ? '/' : '/' + k)
for (const a of ['alexandria-all-on-4', 'tysons-veneers', 'alexandria-all-on-4-chatgpt']) urls.add('/ads-landing-pages/' + a)

const problems = []
const P = (u, m) => problems.push(`${u}: ${m}`)
const typeCount = {}
for (const u of urls) {
  const { s, h } = await get(S + u)
  if (s !== 200) { P(u, 'status ' + s); continue }
  const head = h.split('</head>')[0]
  const n = (re) => (head.match(re) || []).length
  if (n(/<title[\s>]/g) !== 1) P(u, 'title tags ' + n(/<title[\s>]/g))
  if (n(/name="description"/g) !== 1) P(u, 'description tags ' + n(/name="description"/g))
  if (n(/rel="canonical"/g) !== 1) P(u, 'canonical tags ' + n(/rel="canonical"/g))
  const title = dec((head.match(/<title>([^<]*)/) || [])[1] || '')
  const desc = dec((head.match(/name="description" content="([^"]*)"/) || [])[1] || '')
  const ogd = dec((head.match(/property="og:description" content="([^"]*)"/) || [])[1] || '')
  if (ogd !== desc) P(u, 'og:description differs from description')
  const slug = u === '/' ? 'index' : u.slice(1)
  if (meta[slug] && (title !== meta[slug][0] || desc !== meta[slug][1])) P(u, `meta mismatch: ${title} | ${desc.slice(0, 60)}`)
  const ld = [...h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  if (ld.length !== 1) { P(u, 'ld+json scripts ' + ld.length); continue }
  let g; try { g = JSON.parse(ld[0])['@graph'] } catch (e) { P(u, 'JSON-LD does not parse'); continue }
  const types = g.flatMap((x) => [].concat(x['@type']))
  for (const t of new Set(types)) typeCount[t] = (typeCount[t] || 0) + 1
  const has = (t) => types.includes(t)
  // the pages' own FAQ answers say "does not offer IV sedation": that negation is the client's rule, not a breach
  const ivFree = ld[0].replace(/does not offer IV sedation( or general anesthesia)?/g, '')
  if (/contact-maclean|→/.test(ld[0]) || /\b(IV|intravenous|an(a)?esthesiologist)\b/.test(ivFree)) P(u, 'retired URL, link arrow or IV wording in JSON-LD')
  if (!has('Dentist') || !has('Person')) P(u, 'missing Dentist or Person')
  if (u.startsWith('/posts/')) {
    const a = g.find((x) => [].concat(x['@type']).includes('BlogPosting'))
    if (!a) P(u, 'no BlogPosting')
    else {
      if (!a.datePublished || a.datePublished.startsWith('2026')) P(u, 'datePublished ' + a.datePublished)
      if (a.author?.['@id'] !== `${S}/meet-dr-nahlah#person`) P(u, 'author not Dr. Nahlah')
      if (!(a['@id'] || '').startsWith(S + u)) P(u, 'article @id ' + a['@id'])
    }
  }
  if (['/dental-implants', '/all-on-4', '/veneers', '/sedation-dentistry'].includes(u) && !(has('Service') && has('FAQPage'))) P(u, 'missing Service or FAQPage')
  if (!u.startsWith('/ads-landing-pages/') && !u.startsWith('/posts/') && u !== '/thank-you') {
    // the FIRST alt is what a browser uses; Vimeo thumbnails carry alt="<title>" then a doubled alt=""
    const empty = [...h.split('</head>')[1].matchAll(/<img\b[^>]*>/g)].filter((m) => (m[0].match(/\balt="([^"]*)"/) || [, 'x'])[1] === '').length
    if (empty) P(u, `${empty} img with empty alt`)
  }
}
// noindex survives in the trimmed seo-head.js
const page = (await get(`${S}/ads-landing-pages/tysons-veneers`)).h
const src = (page.match(/src="([^"]*seo-head[^"]*)"/) || [])[1]
const js = src ? (await get(S + src)).h : ''
if (!/"\/ads-landing-pages\/tysons-veneers":"noindex, follow"/.test(js)) P('/ads-landing-pages/tysons-veneers', 'noindex missing from seo-head.js')
if (/document\.title/.test(js)) P('seo-head.js', 'still sets document.title')

console.log('urls', urls.size, '| types', JSON.stringify(typeCount))
console.log(problems.length ? problems.join('\n') : 'ALL CLEAN')
process.exit(problems.length ? 1 : 0)
