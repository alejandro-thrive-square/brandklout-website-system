#!/usr/bin/env node
/**
 * SEO v3 (2026-10-05): read what every indexed page actually says, section by section, so the
 * structured data is built from the visible copy and not from the meta description.
 *
 * For each sitemap URL on the host (default production): every <section> of <main> (header,
 * nav and footer dropped) as { h2, text[], items[{ h3, text }], qa[{ q, a }], images[{ src, alt }],
 * videos[] }, plus the page's h1 and its intro. Accordion Q/A are read from <details>/<summary>
 * and button-driven panels; a trailing link label inside an answer is cut.
 *
 *   node seo-v3/scan-sections.mjs [--host https://www.drnahlah.com]   → seo-v3/out/sections.json
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'out')
mkdirSync(OUT, { recursive: true })
const hi = process.argv.indexOf('--host')
const S = hi > 0 ? process.argv[hi + 1] : 'https://www.drnahlah.com'

const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;|&#xa0;/g, ' ')
const txt = (s) => dec(s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim()
const get = async (u) => { for (let i = 0; i < 4; i++) try { const r = await fetch(u); return { s: r.status, h: await r.text() } } catch { await new Promise((z) => setTimeout(z, 800)) } return { s: 0, h: '' } }

// block-level text: paragraphs and list items, in order
// a block that is only a link, or a sentence followed by a link ("… The specialist behind the plan"),
// is navigation: the link text is dropped
const blocksOf = (html) => [...html.matchAll(/<(p|li|figcaption|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/g)]
  .map((m) => ({ tag: m[1], t: txt(m[2].replace(/([.!?:])\s*<a\b[^>]*>[\s\S]*?<\/a>\s*$/, '$1')), bare: !txt(m[2].replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '')) }))
  .filter((x) => x.t && x.t.length > 1 && !x.bare)

function qaOf (html) {
  const out = []
  for (const m of html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)) {
    const q = txt((m[1].match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/) || [])[1] || '')
    // the answer is the panel's text; a closing link ("What drives the cost", "Read more →") is
    // navigation, not part of the answer, so it is dropped
    let panel = m[1].replace(/<summary\b[\s\S]*?<\/summary>/, '')
    for (;;) {
      const next = panel.replace(/<a\b[^>]*>[^<]*<\/a>(\s*<\/(div|p|span)>)*\s*$/, (x) => x.replace(/^<a\b[^>]*>[^<]*<\/a>/, ''))
      if (next === panel) break
      panel = next
    }
    const a = txt(panel)
    if (q) out.push({ q, a })
  }
  if (out.length) return out
  // button + panel accordions: the question is the button, the answer the next sibling block
  const parts = html.split(/(<button\b[^>]*>[\s\S]*?<\/button>)/)
  for (let i = 1; i < parts.length; i += 2) {
    const q = txt(parts[i])
    if (!/\?$/.test(q)) continue
    const a = blocksOf(parts[i + 1] || '').map((x) => x.t).join(' ')
    if (a) out.push({ q, a })
  }
  return out
}

function sectionsOf (body) {
  const main = body.replace(/<header\b[\s\S]*?<\/header>/, '').replace(/<footer\b[\s\S]*?<\/footer>/g, '').replace(/<nav\b[\s\S]*?<\/nav>/g, '')
  const chunks = main.split(/<section\b/).slice(1).map((c) => '<section' + c)
  return chunks.map((c) => {
    const h1 = txt((c.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '')
    const h2 = txt((c.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '')
    const qa = qaOf(c)
    const noQa = c.replace(/<details\b[\s\S]*?<\/details>/g, '')
    // items: each h3 with the blocks up to the next h3
    const pieces = noQa.split(/(<h3\b[^>]*>[\s\S]*?<\/h3>)/)
    const items = []
    for (let i = 1; i < pieces.length; i += 2) items.push({ h3: txt(pieces[i]), text: blocksOf(pieces[i + 1] || '').map((x) => x.t) })
    const lead = blocksOf(pieces[0].replace(/<h[12]\b[\s\S]*?<\/h[12]>/g, '')).map((x) => x.t)
    const images = [...c.matchAll(/<img\b[^>]*>/g)].map((m) => ({ src: (m[0].match(/\bsrc="([^"]*)"/) || [])[1], alt: dec((m[0].match(/\balt="([^"]*)"/) || [])[1] || '') })).filter((x) => x.src && !x.src.startsWith('data:'))
    const videos = [...new Set([...c.matchAll(/vimeo\.com\/video\/(\d+)|data-vimeo[-\w]*="(\d+)"|vimeo\.com\/(\d{6,})|data-yt="([\w-]{11})"|youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/g)].map((m) => m[1] || m[2] || m[3] || (m[4] || m[5]) && 'yt:' + (m[4] || m[5])))]
    const table = [...c.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((x) => txt(x[1])))
    const quotes = [...c.matchAll(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>([\s\S]{0,400})/g)].map((m) => ({ text: txt(m[1]), by: txt((m[2].match(/class="[^"]*quote-by[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '') }))
    return { ...(h1 ? { h1 } : {}), h2, lead, items, qa, images, videos, ...(quotes.length ? { quotes } : {}), ...(table.length ? { table } : {}) }
  }).filter((s) => s.h1 || s.h2 || s.lead.length || s.items.length || s.qa.length)
}

const sm = (await get(`${S}/sitemap.xml`)).h
const urls = [...sm.matchAll(/<loc>([^<]+)/g)].map((m) => m[1])
const pages = {}
for (const u of urls) {
  const { s, h } = await get(u)
  if (s !== 200) { console.log('status', s, u); continue }
  const path = new URL(u).pathname
  const slug = path === '/' ? 'index' : path.slice(1)
  const body = h.split('</head>')[1] || ''
  const sections = sectionsOf(body)
  const words = txt(body.replace(/<header\b[\s\S]*?<\/header>/, '').replace(/<footer\b[\s\S]*?<\/footer>/g, '').replace(/<nav\b[\s\S]*?<\/nav>/g, '')).split(' ').length
  // the breadcrumb the page shows (Home › … › this page): the BreadcrumbList repeats exactly this
  const crumbHtml = (body.match(/<div class="pk-crumb"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || ''
  const crumb = [...crumbHtml.matchAll(/<(a|span)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map((m) => ({ name: txt(m[3]), href: (m[2].match(/href="([^"]*)"/) || [])[1] || null }))
  pages[slug] = { url: S + path, words, crumb, sections }
  // articles: the collection body, split at its h2s (the question-led posts become FAQPage)
  const region = ((body.match(/<div data-instatic-content-region>([\s\S]*?)<\/article>/) || [])[1] || '').split(/<div class="bl-rc\b|<div class="bl-related\b/)[0] || null
  if (slug.startsWith('posts/') && region) {
    const parts = region.split(/(<h2\b[^>]*>[\s\S]*?<\/h2>)/)
    const intro = blocksOf(parts[0].replace(/<h1\b[\s\S]*?<\/h1>/g, '')).map((x) => x.t).filter((t) => !/^\d{1,2} \w+ \d{4}$/.test(t))
    const sects = []
    for (let i = 1; i < parts.length; i += 2) sects.push({ h2: txt(parts[i]), text: blocksOf(parts[i + 1] || '').map((x) => x.t) })
    pages[slug].post = { h1: txt((region.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || ''), intro, parts: sects, words: txt(region).split(' ').length,
      images: [...region.matchAll(/<img\b[^>]*>/g)].map((m) => ({ src: (m[0].match(/\bsrc="([^"]*)"/) || [])[1], alt: dec((m[0].match(/\balt="([^"]*)"/) || [])[1] || '') })).filter((x) => x.src) }
  }
}
writeFileSync(join(OUT, 'sections.json'), JSON.stringify(pages, null, 1))
console.log('pages', Object.keys(pages).length, '→', join(OUT, 'sections.json'))
