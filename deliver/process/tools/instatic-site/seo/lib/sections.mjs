/**
 * sections.mjs — read a published page's visible content as sections, from the served HTML.
 * Shared by scan-sections.mjs (which feeds the schema build) and verify-schema.mjs (which checks
 * the published graph against the page), so both read the page the same way.
 *
 * Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v3/scan-sections.mjs and
 * verify-seo-v3.mjs. The class names that were hard-coded there come from `markup` in
 * seo-config.json. What it assumes about the markup (README "Limitations"):
 *   - content sections are <section> elements inside the page, outside <header>/<nav>/<footer>;
 *   - a section's heading is its first <h2> (or <h1> in the hero); its items are <h3> each followed by
 *     <p>/<li>/<figcaption>/<blockquote> blocks;
 *   - accordions are <details><summary> (or a <button> whose text ends in "?" followed by its panel);
 *   - the visible breadcrumb is a <div> carrying one of markup.breadcrumbClass, holding <a>/<span>
 *     crumbs and no nested <div>;
 *   - an article's body sits in <div {markup.articleRegionAttr}> up to </article>, cut at the first
 *     <div class="…"> starting with one of markup.articleEndClass (related posts, rail cards).
 */
import { escRx } from './seo-config.mjs'

export const dec = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
export const txt = (s) => dec(s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, ' '))
  .replace(/\s+/g, ' ').replace(/\s+([.,;:!?])/g, '$1').trim()
export const join_ = (a) => a.join(' ').replace(/\s+/g, ' ').trim()

export async function get(u, tries = 4) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(u, { redirect: 'follow' }); return { s: r.status, h: await r.text() } } catch { await new Promise((z) => setTimeout(z, 800)) }
  }
  return { s: 0, h: '' }
}

/** <loc>s of <host>/sitemap.xml (a sitemap index is followed). A host that serves none (staging)
 *  is read at the paths of `fallbackOrigin`'s sitemap. Never invents URLs from links. */
export async function sitemapLocs(host, fallbackOrigin, log = console.log) {
  const walk = async (u, seen = new Set()) => {
    if (seen.has(u)) return []
    seen.add(u)
    const { s, h } = await get(u)
    if (s !== 200) return []
    const locs = [...h.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'))
    if (/<sitemapindex/i.test(h)) { const out = []; for (const l of locs) out.push(...await walk(l, seen)); return out }
    return locs
  }
  let locs = await walk(`${host}/sitemap.xml`)
  if (!locs.length && fallbackOrigin && fallbackOrigin !== host) {
    locs = (await walk(`${fallbackOrigin}/sitemap.xml`)).map((u) => host + new URL(u).pathname)
    if (locs.length) log(`note     ${host} serves no sitemap: reading it at the ${locs.length} paths of ${fallbackOrigin}/sitemap.xml`)
  }
  return locs
}

export const slugOfPath = (path) => (path === '/' ? 'index' : path.replace(/^\/+|\/+$/g, ''))

const classRe = (names) => `class="(?:[^"]*\\s)?(?:${names.map(escRx).join('|')})(?:\\s[^"]*)?"`

/** Vimeo and YouTube films a chunk of HTML embeds: Vimeo ids as-is, YouTube ids as "yt:<id>". */
export function videosIn(html) {
  return [...new Set([...html.matchAll(/vimeo\.com\/video\/(\d+)|data-vimeo[-\w]*="(\d+)"|vimeo\.com\/(\d{6,})|data-yt="([\w-]{11})"|youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/g)]
    .map((m) => m[1] || m[2] || m[3] || ((m[4] || m[5]) && 'yt:' + (m[4] || m[5]))))]
}

export const stripChrome = (body) => body.replace(/<header\b[\s\S]*?<\/header>/, '').replace(/<footer\b[\s\S]*?<\/footer>/g, '').replace(/<nav\b[\s\S]*?<\/nav>/g, '')

/** block-level text: paragraphs and list items, in order. A block that is only a link, or a
 *  sentence followed by a link ("… The specialist behind the plan"), is navigation: the link is dropped. */
export const blocksOf = (html) => [...html.matchAll(/<(p|li|figcaption|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/g)]
  .map((m) => ({ tag: m[1], t: txt(m[2].replace(/([.!?:])\s*<a\b[^>]*>[\s\S]*?<\/a>\s*$/, '$1')), bare: !txt(m[2].replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '')) }))
  .filter((x) => x.t && x.t.length > 1 && !x.bare)

/** Accordion questions and answers. A closing link in an answer ("Read more →") is navigation. */
export function qaOf(html) {
  const out = []
  for (const m of html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)) {
    const q = txt((m[1].match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/) || [])[1] || '')
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

const imgsOf = (html) => [...html.matchAll(/<img\b[^>]*>/g)]
  .map((m) => ({ src: (m[0].match(/\bsrc="([^"]*)"/) || [])[1], alt: dec((m[0].match(/\balt="([^"]*)"/) || [])[1] || '') }))

export function makeReader(markup) {
  const crumbRe = new RegExp(`<div ${classRe(markup.breadcrumbClass)}[^>]*>([\\s\\S]*?)<\\/div>`)
  const headAttr = escRx(markup.headlineAttr)
  const headlineRe = new RegExp(`<p\\b[^>]*${headAttr}[^>]*>([\\s\\S]*?)<\\/p>`)
  const quoteByRe = markup.quoteByClass.length ? new RegExp(`class="[^"]*(?:${markup.quoteByClass.map(escRx).join('|')})[^"]*"[^>]*>([\\s\\S]*?)<\\/div>`) : null
  const regionRe = new RegExp(`<div ${escRx(markup.articleRegionAttr)}>([\\s\\S]*?)<\\/article>`)
  const endRe = markup.articleEndClass.length ? new RegExp(`<div class="(?:${markup.articleEndClass.map(escRx).join('|')})\\b`) : null

  function sectionsOf(body) {
    const chunks = stripChrome(body).split(/<section\b/).slice(1).map((c) => '<section' + c)
    return chunks.map((c0) => {
      // a keyword <h1> above the designed headline (push-keyword-h1.mjs) turns the headline into
      // <p {headlineAttr}>: keep it apart so it is not read as the hero's lead line
      const headline = txt((c0.match(headlineRe) || [])[1] || '')
      const c = c0.replace(headlineRe, '')
      const h1 = txt((c.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '')
      const h2 = txt((c.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || '')
      const qa = qaOf(c)
      const noQa = c.replace(/<details\b[\s\S]*?<\/details>/g, '')
      const pieces = noQa.split(/(<h3\b[^>]*>[\s\S]*?<\/h3>)/)
      const items = []
      for (let i = 1; i < pieces.length; i += 2) items.push({ h3: txt(pieces[i]), text: blocksOf(pieces[i + 1] || '').map((x) => x.t) })
      const lead = blocksOf(pieces[0].replace(/<h[12]\b[\s\S]*?<\/h[12]>/g, '')).map((x) => x.t)
      const images = imgsOf(c).filter((x) => x.src && !x.src.startsWith('data:'))
      const videos = videosIn(c)
      const table = [...c.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)].map((r) => [...r[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/g)].map((x) => txt(x[1])))
      const quotes = [...c.matchAll(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>([\s\S]{0,400})/g)]
        .map((m) => ({ text: txt(m[1]), by: quoteByRe ? txt((m[2].match(quoteByRe) || [])[1] || '') : '' }))
      return { ...(h1 ? { h1 } : {}), ...(headline ? { headline } : {}), h2, lead, items, qa, images, videos, ...(quotes.length ? { quotes } : {}), ...(table.length ? { table } : {}) }
    }).filter((s) => s.h1 || s.h2 || s.lead.length || s.items.length || s.qa.length)
  }

  /** The breadcrumb the page shows, as [{ name, href }] (href null on the current page's crumb). */
  const crumbOf = (body) => [...((body.match(crumbRe) || [])[1] || '').matchAll(/<(a|span)\b([^>]*)>([\s\S]*?)<\/\1>/g)]
    .map((m) => ({ name: txt(m[3]), href: (m[2].match(/href="([^"]*)"/) || [])[1] || null }))

  /** A collection entry's body, split at its h2s. The article's title is the page H1 (the hero). */
  function articleOf(body) {
    let region = (body.match(regionRe) || [])[1]
    if (!region) return null
    if (endRe) region = region.split(endRe)[0]
    const parts = region.split(/(<h2\b[^>]*>[\s\S]*?<\/h2>)/)
    const intro = blocksOf(parts[0].replace(/<h1\b[\s\S]*?<\/h1>/g, '')).map((x) => x.t).filter((t) => !/^\d{1,2} \w+ \d{4}$/.test(t))
    const sects = []
    for (let i = 1; i < parts.length; i += 2) sects.push({ h2: txt(parts[i]), text: blocksOf(parts[i + 1] || '').map((x) => x.t) })
    return {
      h1: txt((body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || ''), intro, parts: sects, words: txt(region).split(' ').length,
      images: imgsOf(region).filter((x) => x.src),
    }
  }

  /** <title> and the meta description, as served. */
  function headOf(html) {
    const head = html.split('</head>')[0]
    const title = txt((head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '')
    const meta = [...head.matchAll(/<meta\b[^>]*>/g)].map((m) => m[0]).find((t) => /\bname="description"/.test(t))
    const description = meta ? dec((meta.match(/\bcontent="([^"]*)"/) || [])[1] || '') : ''
    return { title, description }
  }

  return { sectionsOf, crumbOf, articleOf, headOf }
}
