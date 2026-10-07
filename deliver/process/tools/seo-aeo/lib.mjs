/**
 * lib.mjs — shared helpers for the seo-aeo toolkit: fetch, sitemap walk, page parse, keyword match,
 * CSV. No dependencies; Node 20+.
 *
 * Every script here reads served HTML, not the rendered DOM. That is right for Instatic and Webflow
 * (head and H1 are in the HTML). A WordPress clone that replays its <head> after parse needs
 * tools/instatic-site/gates/seo-head-check.mjs --render for the head fields.
 */
export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36'

export async function get(url) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' })
    return { status: r.status, url: r.url, text: r.ok ? await r.text() : '' }
  } catch (e) {
    return { status: String(e.cause?.code || e.message), url, text: '' }
  }
}

/** Every page URL in <origin>/sitemap.xml (indexes followed), else /sitemap_index.xml, else the home
 *  page and the same-origin pages it links to. Never zero pages silently: the caller decides. */
export async function sitemapUrls(origin, log = console.log) {
  origin = origin.replace(/\/+$/, '')
  const seen = new Set(), out = new Set()
  const walk = async (url) => {
    if (seen.has(url)) return
    seen.add(url)
    const { status, text } = await get(url)
    if (status !== 200) { log(`note     ${url} answered ${status}`); return }
    const locs = [...text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'))
    if (/<sitemapindex/i.test(text)) for (const l of locs) await walk(l)
    else for (const l of locs) out.add(l)
  }
  await walk(`${origin}/sitemap.xml`)
  if (!out.size) await walk(`${origin}/sitemap_index.xml`)
  if (out.size) return [...out]
  const { status, text } = await get(origin + '/')
  if (status !== 200) return []
  out.add(origin + '/')
  for (const m of text.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)/gi)) {
    try {
      const u = new URL(m[1], origin + '/')
      if (u.origin === new URL(origin).origin && !/\.(pdf|jpe?g|png|webp|svg|xml|zip)$/i.test(u.pathname)) out.add(u.origin + u.pathname)
    } catch {}
  }
  log(`note     ${origin}: no sitemap, read the home page and the ${out.size - 1} page(s) it links to`)
  return [...out]
}

export const pathOf = (url) => { const p = new URL(url).pathname.replace(/\/+$/, ''); return p || '/' }

const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
export const plain = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  return m ? decode(m[1] ?? m[2]) : null
}

/** Everything the gates read from one page's served HTML. */
export function parsePage(html) {
  const cut = html.search(/<\/head>/i)
  const head = cut > -1 ? html.slice(0, cut) : html
  const metas = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0])
  const meta = (key) => metas.filter((t) => (attr(t, 'name') || attr(t, 'property') || '').toLowerCase() === key).map((t) => attr(t, 'content') ?? '')
  const canonTag = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).find((t) => (attr(t, 'rel') || '').toLowerCase() === 'canonical')

  const ld = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1])
  const types = new Set(), questions = []
  let nodes = 0, ldErrors = 0
  const walk = (o) => {
    if (Array.isArray(o)) return o.forEach(walk)
    if (!o || typeof o !== 'object') return
    if (o['@type']) {
      nodes++
      const t = [].concat(o['@type'])
      t.forEach((x) => types.add(x))
      if (t.includes('Question') && typeof o.name === 'string') questions.push(o.name)
    }
    Object.values(o).forEach(walk)
  }
  for (const s of ld) { try { walk(JSON.parse(s)) } catch { ldErrors++ } }

  const body = html.slice(cut > -1 ? cut : 0)
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1>/gi, ' ')
  const visible = plain(body)
  const main = plain(body.replace(/<(header|nav|footer)\b[\s\S]*?<\/\1>/gi, ' '))
  const imgs = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ src: attr(m[0], 'src') || attr(m[0], 'data-src') || '', alt: attr(m[0], 'alt') }))

  return {
    title: plain((head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || ''),
    descriptions: meta('description'),
    robots: (meta('robots')[0] || '').toLowerCase(),
    canonical: canonTag ? attr(canonTag, 'href') : null,
    h1s: [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => plain(m[1])),
    h2s: (html.match(/<h2\b/gi) || []).length,
    ld: { blocks: ld.length, bytes: ld.reduce((n, s) => n + s.length, 0), nodes, types: [...types].sort(), errors: ldErrors, questions },
    imgs,
    visible, // all body text: what a FAQ question must appear in
    main, // body text outside header/nav/footer: what the page itself says
    words: main ? main.split(' ').length : 0,
  }
}

// ---- keywords -------------------------------------------------------------------------------
// A keyword is "in" a text when every meaningful word of it is: case, punctuation, word order,
// plurals and "VA"/"Virginia" are ignored; filler words ("in", "near", "best"…) are not required.
export const STOP = new Set(['in', 'the', 'a', 'an', 'of', 'for', 'and', 'near', 'me', 'my', 'at', 'to', 'with', 'by', 'on', 'best', 'top'])
const SYN = { va: 'virginia', dr: 'doctor' }
const stem = (t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t)
export const tokens = (s) => String(s).toLowerCase().replace(/&/g, ' and ').replace(/[’']/g, '')
  .replace(/[^a-z0-9+]+/g, ' ').trim().split(' ').filter(Boolean).map((t) => stem(SYN[t] || t))
export function keywordIn(keyword, text) {
  const have = new Set(tokens(text))
  const missing = tokens(keyword).filter((t) => !STOP.has(t) && !have.has(t))
  return { ok: missing.length === 0, missing }
}
export const normKeyword = (k) => tokens(k).filter((t) => !STOP.has(t)).join(' ')
/** The phrase appears in the text in order (case, punctuation and plurals ignored): used for FAQ
 *  questions, which Google only honours when the page shows them. */
export const phraseIn = (phrase, text) => ` ${tokens(text).join(' ')} `.includes(` ${tokens(phrase).join(' ')} `)

// ---- CSV ------------------------------------------------------------------------------------
export function readCsv(text) {
  const rows = []
  let row = [], cell = '', q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
    } else cell += c
  }
  row.push(cell)
  if (row.some((v) => v !== '')) rows.push(row)
  const [hdr, ...data] = rows
  return data.map((r) => Object.fromEntries(hdr.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}
