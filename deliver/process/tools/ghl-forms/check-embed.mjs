#!/usr/bin/env node
/**
 * check-embed.mjs — is every GoHighLevel embed on a site placed so a visitor can actually see it?
 * Reads the served HTML of every page in the sitemap (plus any page you name); clicks nothing,
 * submits nothing, no browser.
 *
 * FAILS ON `loading="lazy"` ON A GHL IFRAME (form, survey, booking, quiz…). GHL's form_embed.js
 * hides every such frame at DOMContentLoaded (opacity 0, visibility hidden, position absolute,
 * left -9999px) and reveals it only when the form inside reports its height. A lazy frame below the
 * fold is deferred; parked at -9999px it never nears the viewport, so it never loads and never
 * reveals: a blank slot, forever. Chrome and Safari usually start the load before the hide and mask
 * it; Firefox does not. Found 2026-10-06 on Stone Med Spa /book: the client saw no form, we saw it
 * fine; Firefox at 390, 768 and 1366 wide never even requested the frame (tools/ghl-forms/README.md,
 * "Embedding the form").
 *
 * Also lists, per page, the GHL frames found and whether form_embed.js is loaded, so a page whose
 * form vanished from the markup shows up as "0 frames" next to its neighbours.
 *
 *   node check-embed.mjs https://www.client.com [https://staging.client.com ...] [--page /book ...] > output/ghl-embed.log 2>&1
 *
 * An origin reads <origin>/sitemap.xml, then /sitemap_index.xml (indexes followed); with neither, the
 * home page and every same-origin page it links to; an origin with no page at all is a PROBLEM, never
 * a silent ok. `--page` adds a path or URL the sitemap leaves out (ad landing pages usually are).
 * Exit 1 on any PROBLEM.
 */
const args = process.argv.slice(2)
const origins = [], extra = []
for (let i = 0; i < args.length; i++) {
  // Git Bash rewrites a bare `/book` into `C:/Program Files/Git/book`; undo it
  if (args[i] === '--page') extra.push(args[++i].replace(/^[A-Za-z]:[\\/].*?[\\/]Git[\\/]/, '/'))
  else if (/^https?:\/\//.test(args[i])) origins.push(args[i].replace(/\/+$/, ''))
  else throw new Error(`unknown argument ${args[i]}`)
}
if (!origins.length) { console.error('usage: node check-embed.mjs <origin> [...] [--page /path ...]'); process.exit(2) }

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36'
const get = async (url) => {
  const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' })
  return { status: r.status, text: r.ok ? await r.text() : '' }
}
// form_embed.js's own matcher: /form, /quiz, /survey, /booking, /group, /rentals, /service-menu, event details
const GHL_FRAME = /(leadconnectorhq\.com|msgsndr\.com|\/widget\/)[^"']*\/(form|quiz|survey|booking|group|rentals|service-menu|events\/event-details)\b/i

async function sitemapUrls(origin) {
  const seen = new Set(), out = new Set()
  const walk = async (url) => {
    if (seen.has(url)) return
    seen.add(url)
    const { status, text } = await get(url).catch((e) => ({ status: String(e.cause?.code || e.message), text: '' }))
    if (status !== 200) { console.log(`note     ${url} answered ${status}`); return }
    const locs = [...text.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'))
    if (/<sitemapindex/i.test(text)) for (const l of locs) await walk(l)
    else for (const l of locs) out.add(l)
  }
  await walk(`${origin}/sitemap.xml`)
  if (!out.size) await walk(`${origin}/sitemap_index.xml`)
  if (out.size) return [...out]
  // No sitemap: the home page and every same-origin page it links to. Never zero pages silently.
  const { status, text } = await get(origin + '/').catch((e) => ({ status: String(e.cause?.code || e.message), text: '' }))
  if (status !== 200) return []
  out.add(origin + '/')
  for (const m of text.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)/gi)) {
    try {
      const u = new URL(m[1], origin + '/')
      if (u.origin === new URL(origin).origin && !/\.(pdf|jpe?g|png|webp|svg|xml|zip)$/i.test(u.pathname)) out.add(u.origin + u.pathname)
    } catch {}
  }
  console.log(`note     ${origin}: no sitemap, read the home page and the ${out.size - 1} page(s) it links to`)
  return [...out]
}

const problems = []
let pages = 0, frames = 0
for (const origin of origins) {
  const urls = new Set(await sitemapUrls(origin))
  for (const p of extra) urls.add(/^https?:/.test(p) ? p : origin + (p.startsWith('/') ? p : '/' + p))
  console.log(`\n${origin}  ${urls.size} page(s)`)
  if (!urls.size) { problems.push(`${origin}: no page to read (no sitemap, home page unreachable)`); continue }
  const list = [...urls]
  for (let i = 0; i < list.length; i += 6) {
    await Promise.all(list.slice(i, i + 6).map(async (url) => {
      const { status, text } = await get(url).catch((e) => ({ status: String(e.cause?.code || e.message), text: '' }))
      pages++
      if (status !== 200) { problems.push(`${url}: answered ${status}`); return }
      const tags = [...text.matchAll(/<iframe\b[^>]*>/gis)].map((m) => m[0])
      const ghl = tags.filter((t) => GHL_FRAME.test((t.match(/\b(?:data-)?src\s*=\s*["']([^"']+)/i) || [])[1] || ''))
      if (!ghl.length) return
      frames += ghl.length
      const loader = /link\.msgsndr\.com\/js\/form_embed\.js|\/js\/form_embed\.js/.test(text)
      const lazy = ghl.filter((t) => /\bloading\s*=\s*["']?lazy/i.test(t))
      const ids = ghl.map((t) => (t.match(/\/(?:form|survey|booking|quiz)\/([A-Za-z0-9]+)/) || [])[1] || '?')
      console.log(`${lazy.length ? 'PROBLEM' : 'ok     '}  ${url.replace(origin, '') || '/'}  ${ghl.length} GHL frame(s) ${ids.join(',')}  form_embed.js ${loader ? 'yes' : 'NO'}${lazy.length ? `  ${lazy.length} lazy` : ''}`)
      if (lazy.length) problems.push(`${url}: ${lazy.length} GHL iframe(s) with loading="lazy" (${ids.join(',')}) — the form never appears in Firefox; remove the attribute (Embed block in URL mode: turn "Lazy load" off)`)
    }))
  }
}
console.log(`\n${pages} page(s), ${frames} GHL frame(s)`)
console.log(problems.length ? `\nPROBLEMS\n  ${problems.join('\n  ')}` : '\nok — no lazy GHL frames')
process.exitCode = problems.length ? 1 : 0
