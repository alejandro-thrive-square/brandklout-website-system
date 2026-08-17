// Livewell Dental — public-site crawler for 15-improvement-intake-audit
// Usage: node crawl.mjs <outDir>
// Fetches every sitemap URL, caches raw HTML in outDir/html/, and writes a
// distilled site-inventory.json next to this script.
//
// Note: this machine needs NODE_OPTIONS=--use-system-ca (proxy/AV cert not in
// Node's bundle) — see memory reference_vercel_cli_tls.

import fs from 'node:fs/promises'
import path from 'node:path'

const OUT = process.argv[2] || './crawl-out'
const HTML_DIR = path.join(OUT, 'html')
const SITEMAP = 'https://www.livewelldentalva.com/sitemap.xml'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'

const slug = (u) => (new URL(u).pathname.replace(/^\/|\/$/g, '') || 'home').replace(/\//g, '__')

async function get(url) {
  const t0 = Date.now()
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  const body = await res.text()
  return { status: res.status, ms: Date.now() - t0, bytes: Buffer.byteLength(body), body,
           headers: Object.fromEntries(res.headers) }
}

const m1 = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null }

// Webflow emits attributes in either order (content="…" name="description" AND
// name="description" content="…"), so every meta/link lookup must try both.
const meta = (html, key, attr = 'name') => {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return dec(
    m1(html, new RegExp(`<meta[^>]+${attr}=["']${k}["'][^>]+content=["']([^"']*)["']`, 'i')) ??
    m1(html, new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${k}["']`, 'i'))
  )
}
const linkRel = (html, rel) => (
  m1(html, new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']*)["']`, 'i')) ??
  m1(html, new RegExp(`<link[^>]+href=["']([^"']*)["'][^>]+rel=["']${rel}["']`, 'i'))
)
const all = (html, re) => [...html.matchAll(re)]
const strip = (s) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const dec = (s) => s ? s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
                       .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : s

function analyze(url, r) {
  const h = r.body
  const headings = all(h, /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)
    .map(m => ({ tag: m[1].toLowerCase(), text: dec(strip(m[2])).slice(0, 160) }))
    .filter(x => x.text)

  const imgs = all(h, /<img\b[^>]*>/gi).map(m => m[0])
  const noAlt = imgs.filter(t => !/\balt\s*=\s*["'][^"']+["']/i.test(t))
  const lazy = imgs.filter(t => /loading\s*=\s*["']lazy/i.test(t))

  const links = all(h, /<a\b[^>]*href\s*=\s*["']([^"']+)["']/gi).map(m => m[1])
  const tel = links.filter(l => l.startsWith('tel:'))
  const mailto = links.filter(l => l.startsWith('mailto:'))
  const external = links.filter(l => /^https?:\/\//i.test(l) && !l.includes('livewelldentalva.com'))
  const booking = links.filter(l => /book|appointment|schedule|nexhealth|flexbook|patientpop|zocdoc|calendly/i.test(l))

  // text volume from <body> minus script/style
  const bodyOnly = (h.split(/<body[^>]*>/i)[1] || h).replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
  const words = strip(bodyOnly).split(/\s+/).filter(Boolean).length

  const title = dec(m1(h, /<title[^>]*>([\s\S]*?)<\/title>/i))
  const desc = meta(h, 'description')

  return {
    url,
    status: r.status,
    ttfb_ms: r.ms,
    html_kb: +(r.bytes / 1024).toFixed(1),
    title,
    title_len: (title || '').length,
    meta_description: desc,
    meta_description_len: (desc || '').length,
    canonical: linkRel(h, 'canonical'),
    robots: meta(h, 'robots'),
    og_image: meta(h, 'og:image', 'property'),
    og_title: meta(h, 'og:title', 'property'),
    og_description: meta(h, 'og:description', 'property'),
    twitter_card: meta(h, 'twitter:card'),
    lang: m1(h, /<html[^>]+lang=["']([^"']*)["']/i),
    h1: headings.filter(x => x.tag === 'h1').map(x => x.text),
    h1_count: headings.filter(x => x.tag === 'h1').length,
    heading_outline: headings.map(x => `${x.tag}: ${x.text}`),
    heading_order_jumps: headings.reduce((acc, x, i) => {
      if (i === 0) return acc
      const prev = +headings[i - 1].tag[1], cur = +x.tag[1]
      return cur - prev > 1 ? acc.concat(`${headings[i - 1].tag}->${x.tag} @ "${x.text.slice(0, 50)}"`) : acc
    }, []),
    words,
    images: imgs.length,
    images_missing_alt: noAlt.length,
    images_lazy: lazy.length,
    links_total: links.length,
    tel_links: [...new Set(tel)],
    mailto_links: [...new Set(mailto)],
    booking_links: [...new Set(booking)],
    external_domains: [...new Set(external.map(l => { try { return new URL(l).hostname } catch { return l } }))],
    forms: all(h, /<form\b[^>]*>/gi).length,
    form_actions: all(h, /<form\b[^>]*action\s*=\s*["']([^"']*)["']/gi).map(m => m[1]),
    iframe_hosts: [...new Set(all(h, /<iframe\b[^>]*src\s*=\s*["']([^"']+)["']/gi)
      .map(m => { try { return new URL(m[1], url).hostname } catch { return m[1] } }))],
    // Webflow build signals
    wf_collection_lists: all(h, /w-dyn-list/g).length,
    wf_embeds: all(h, /w-embed/g).length,
    wf_ix2: /data-w-id=/.test(h),
    wf_tabs: all(h, /w-tabs/g).length,
    wf_sliders: all(h, /w-slider/g).length,
    wf_lightbox: all(h, /w-lightbox/g).length,
    inline_style_blocks: all(h, /<style[^>]*>/gi).length,
    inline_script_blocks: all(h, /<script(?![^>]*\bsrc=)[^>]*>/gi).length,
    external_scripts: [...new Set(all(h, /<script[^>]+src=["']([^"']+)["']/gi).map(m => m[1]))],
    schema_types: [...new Set(all(h, /"@type"\s*:\s*"([^"]+)"/g).map(m => m[1]))],
    has_gtm: /googletagmanager\.com|gtag\(/.test(h),
    has_ga: /google-analytics\.com|G-[A-Z0-9]{8,}/.test(h),
    has_fb_pixel: /connect\.facebook\.net/.test(h),
    stylesheets: [...new Set(all(h, /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi).map(m => m[1]))],
    fonts: [...new Set(all(h, /(fonts\.googleapis\.com[^"']*|@font-face[^{]*)/g).map(m => m[1].slice(0, 120)))],
  }
}

const urls = await (async () => {
  const sm = await get(SITEMAP)
  return [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim())
})()

await fs.mkdir(HTML_DIR, { recursive: true })
console.log(`sitemap: ${urls.length} urls`)

const pages = []
const failed = []
for (let i = 0; i < urls.length; i++) {
  const u = urls[i]
  const cache = path.join(HTML_DIR, `${slug(u)}.html`)
  try {
    // reuse cached HTML when present so re-analysis costs no network
    let r
    try {
      const body = await fs.readFile(cache, 'utf8')
      r = { status: 200, ms: 0, bytes: Buffer.byteLength(body), body }
    } catch {
      r = await get(u)
      await fs.writeFile(cache, r.body)
    }
    pages.push(analyze(u, r))
    console.log(`[${i + 1}/${urls.length}] ${r.status} ${r.ms}ms ${(r.bytes / 1024).toFixed(0)}kb ${u}`)
  } catch (e) {
    failed.push({ url: u, error: String(e) })
    console.log(`[${i + 1}/${urls.length}] FAIL ${u} — ${e}`)
  }
}

const out = {
  crawled_at: process.env.CRAWL_STAMP || 'see git commit',
  source_sitemap: SITEMAP,
  page_count: pages.length,
  failed,
  pages,
}
// cwd, not import.meta.url — the repo path contains a space and would arrive percent-encoded
await fs.writeFile(path.resolve('site-inventory.json'), JSON.stringify(out, null, 2))
console.log(`\ndone: ${pages.length} pages, ${failed.length} failed`)
