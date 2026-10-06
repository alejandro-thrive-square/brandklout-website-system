#!/usr/bin/env node
// SEO v2 (2026-10-05): fill media-library altText for images that render with alt from ELSEWHERE
// (og cards: the open-graph override's imageAlt; before/after + headshots: their custom-HTML
// <img alt>), so the library is right wherever the asset is reused. Never overwrites an alt.
// Images no live page or stylesheet references are left alone.   node seo-v2/fill-library-alts.mjs [--apply]
import { api, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const APPLY = process.argv.includes('--apply')
const S = 'https://www.drnahlah.com'
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"')
const media = (await api('GET', '/admin/api/cms/media')).assets.filter((a) => /^image\//.test(a.mimeType || '') && !(a.altText || '').trim())
const want = {}
for (const p of (await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages')).pages) {
  const o = p.override; if (o?.image && o.imageAlt) want[new URL(o.image, S).pathname] = o.imageAlt
}
const sm = await (await fetch(S + '/sitemap.xml')).text()
const pages = new Set([...sm.matchAll(/<loc>([^<]+)/g)].map((m) => m[1].replace(S, '') || '/'))
for (const r of (await api('GET', '/admin/api/cms/pages')).rows) if (!['404', 'post'].includes(r.slug)) pages.add(r.slug === 'index' ? '/' : '/' + r.slug)
for (const u of pages) {
  let h = ''; for (let i = 0; i < 4 && !h; i++) try { h = await (await fetch(S + u)).text() } catch { await new Promise((z) => setTimeout(z, 800)) }
  for (const m of h.matchAll(/<img\b[^>]*>/g)) {
    const alt = (m[0].match(/\balt="([^"]+)"/) || [])[1]; const src = (m[0].match(/\bsrc="([^"]+)"/) || [])[1]
    if (alt && src && src.startsWith('/uploads/') && !want[src]) want[src] = dec(alt)
  }
}
want['/uploads/PhKVdS1R0_xk-mtalvGAw-cropped-nahlah-favicon.png'] ||= 'Dr. Nahlah Implants and Prosthodontics Specialists logo'
const todo = media.filter((a) => want[a.publicPath])
console.log(`${BASE}: ${media.length} images without alt; ${todo.length} render with an alt elsewhere`)
for (const a of todo.slice(0, 6)) console.log(`  ${a.publicPath.slice(9, 70)} -> ${want[a.publicPath]}`)
if (!APPLY) { console.log('dry run'); process.exit(0) }
for (const a of todo) await api('PATCH', `/admin/api/cms/media/${a.id}`, { altText: want[a.publicPath] })
const left = (await api('GET', '/admin/api/cms/media')).assets.filter((a) => want[a.publicPath] && !(a.altText || '').trim()).length
console.log(`written ${todo.length}; still empty ${left}`)
