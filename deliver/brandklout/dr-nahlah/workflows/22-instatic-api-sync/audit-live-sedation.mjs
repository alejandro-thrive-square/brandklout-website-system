#!/usr/bin/env node
/**
 * audit-live-sedation.mjs — sweep every sitemap URL of the LIVE site for the
 * sedation claims the practice withdrew on 2026-09-28 (Asana "Update Website"):
 * the practice does NOT do IV sedation and has NO anaesthesiologist on the
 * team. It offers oral sedation and nitrous oxide only.
 *
 *   node audit-live-sedation.mjs [host] > out.txt    # default www.drnahlah.com
 *
 * Reports each hit with the half of the document it is in (head = meta /
 * og / JSON-LD, body = the page), because on this platform the head is fed by
 * plugin stores that a page edit never touches (see the phone-number trap in
 * the client RUNBOOK). Exit 1 while anything is found.
 *
 * Redirect stdout to a file; never pipe it (Node 24 on Windows dies with a
 * libuv assertion when stdout is a pipe).
 */
const HOST = process.argv[2] ?? 'www.drnahlah.com'
const ORIGIN = `https://${HOST}`

/* What the practice does not offer. `\bIV\b` is case-sensitive on purpose:
   `.iv-*` class names are lower case. */
const PATTERNS = [
  /\bIV\b/,
  /intravenous/i,
  /an(a)?esthesiolog/i,
  /general an(a)?esthe/i,
  /twilight/i,
  /deep sedation/i,
  /sleep dentistry/i,
  /put (you )?to sleep/i,
]

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'
const get = async (u) => (await fetch(u, { headers: { 'user-agent': UA } })).text()

const sm = await get(`${ORIGIN}/sitemap.xml`)
let urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
/* a sitemap index points at child sitemaps */
if (urls.every((u) => u.endsWith('.xml'))) {
  urls = (await Promise.all(urls.map(get))).flatMap((x) => [...x.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
}
urls = urls.map((u) => u.replace(/^https?:\/\/[^/]+/, ORIGIN))
/* The sitemap leaves out the 19 noindex ads pages, which carried most of the
   claim. Take every page row from the API as well, so no page list is
   hardcoded here to go stale (three gates once watched 11 of 57 pages). */
const { getPages } = await import('./sedation-api.mjs')
for (const r of (await getPages()).rows) {
  const slug = r.cells?.slug ?? r.slug
  if (!slug || slug === '404' || slug === 'post') continue // 404 and the post template do not serve at their slug
  const u = `${ORIGIN}/${slug === 'index' ? '' : slug}`
  if (!urls.includes(u)) urls.push(u)
}

const text = (html) => html
  .replace(/<script(?![^>]*ld\+json)[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<meta[^>]*content="([^"]*)"[^>]*>/gi, ' $1. ')
  .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, ' $1. ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'")
  .replace(/\s+/g, ' ')

let total = 0
const pages = []
for (const u of urls) {
  const html = await get(u)
  const cut = html.search(/<body[\s>]/i)
  const halves = { head: text(html.slice(0, cut)), body: text(html.slice(cut)) }
  const hits = []
  for (const [half, t] of Object.entries(halves)) {
    const sentences = t.split(/(?<=[.!?])\s+/)
    for (const s of sentences) {
      if (!PATTERNS.some((p) => p.test(s))) continue
      /* Allowed: the explicit denial, and the doctor's own credential list on
         /meet-dr-nahlah (a qualification, not an offer — see push-sedation-copy.mjs). */
      if (/does not offer IV sedation/.test(s) && !/an(a)?esthesiolog/i.test(s)) continue
      if (/IV Sedation Certificate/.test(s) && /\/meet-dr-nahlah$/.test(u)) continue
      hits.push(`  [${half}] ${s.trim().slice(0, 240)}`)
    }
  }
  const uniq = [...new Set(hits)]
  if (uniq.length) { pages.push(u); total += uniq.length; console.log(`\n${u}  (${uniq.length})\n${uniq.join('\n')}`) }
}
console.log(`\n${urls.length} URLs swept, ${pages.length} with hits, ${total} sentences`)
process.exit(total ? 1 : 0)
