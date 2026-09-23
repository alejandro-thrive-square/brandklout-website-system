#!/usr/bin/env node
/**
 * grab-page-images.mjs - download every image a set of live pages uses, one folder per page,
 * with a MANIFEST.md per page (file, alt text, source URL, video embeds) and a README.md +
 * SUMMARY.json for the set. Used to hand a client's existing ad-page imagery to the build, or to
 * capture a reference set before a clone.
 *
 * Origin: arvada-dental-center/workflows/07-webflow-build/.tmp/grab-page-images.mjs (bk-arvada;
 * produced docs/Arvada-Ad-Campaign-Images/). Generalized: pages and title come from the command
 * line instead of a hardcoded BASE and PAGES list.
 *
 * Covers <img src/srcset>, <source srcset>, poster, inline and <style> url(), and Embedly
 * thumbnails. Webflow's -p-500 variants are traded for the unsuffixed original when it is larger.
 * Video files are not downloaded (YouTube/Vimeo); their URLs are listed.
 *
 *   node grab-page-images.mjs --out <dir> [--title "Client"] [--stamp 2026-09-23] <url>[=Page title] ...  > grab.log 2>&1
 *
 * Output is media: it goes in the client folder's gitignored media area, never in git.
 */
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs, UA } from './lib/combo.mjs'

const { flags, rest } = parseArgs()
if (!flags.out || !rest.length) { console.error('usage: grab-page-images.mjs --out <dir> [--title T] [--stamp D] <url>[=Title] ...'); process.exit(2) }
const STAMP = flags.stamp || new Date().toISOString().slice(0, 10)
const PAGES = rest.map((a, i) => {
  const [url, title] = a.split('=')
  const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || 'home'
  return { url, title: title || slug, dir: `${String(i + 1).padStart(2, '0')}-${slug}` }
})
const IMG_EXT = /\.(jpe?g|png|webp|gif|svg|avif)(\?|$)/i
const original = (u) => u.replace(/-p-\d+(\.\w+)(\.webp)?$/i, '$1')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function get(url, init = {}, tries = 4) {
  let last
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { ...init, headers: { 'user-agent': UA } })
      if (r.ok || init.method === 'HEAD') return r
      last = new Error(`${r.status} ${url}`)
    } catch (e) { last = e }
    await sleep(500 * 2 ** i) // CDNs drop connections under a burst
  }
  throw last
}
async function best(urls) {
  let win = null
  for (const u of [...new Set(urls.flatMap((x) => [original(x), x]))]) {
    try {
      const r = await get(u, { method: 'HEAD' }, 2)
      if (!r.ok) continue
      const len = Number(r.headers.get('content-length') || 0)
      if (!win || len > win.len) win = { url: u, len }
    } catch { /* next candidate */ }
  }
  return win
}
const unescapeHtml = (s) => (s || '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const slugify = (s, fb) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || fb
const dehash = (s) => s.replace(/^[0-9a-f]{24}_/i, '').replace(/^imgi[_-]\d+[_-]/i, '')
function bucket(name, alt, bytes, ext) {
  if (/video thumbnail|video poster/i.test(alt)) return 'video-thumbnails'
  if (ext === 'svg' || bytes < 15000) return 'icons-and-logos'
  if (/\blogos?\b|\bicons?\b|\bbadge/i.test(`${alt} ${name}`)) return 'icons-and-logos'
  return ''
}
function extract(html, base) {
  const abs = (u) => { try { return new URL(u.replace(/&amp;/g, '&'), base).href } catch { return '' } }
  const found = [], embeds = new Set()
  const push = (urls, alt) => { const c = urls.map(abs).filter((u) => /^https?:/.test(u) && IMG_EXT.test(u)); if (c.length) found.push({ urls: c, alt: (alt || '').trim() }) }
  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1]
    const set = (tag.match(/\bsrcset="([^"]+)"/i)?.[1] || '').split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean)
    push([src, ...set].filter(Boolean), unescapeHtml(tag.match(/\balt="([^"]*)"/i)?.[1]))
  }
  for (const tag of html.match(/<source\b[^>]*>/gi) || []) push((tag.match(/\bsrcset="([^"]+)"/i)?.[1] || '').split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean), 'picture source')
  for (const m of html.matchAll(/\bposter="([^"]+)"/gi)) push([m[1]], 'video poster')
  for (const m of html.matchAll(/url\((['"]?)([^'")]+)\1\)/gi)) push([m[2]], 'css background')
  for (const m of html.matchAll(/<iframe\b[^>]*\bsrc="([^"]+)"/gi)) {
    try {
      const u = new URL(abs(m[1]))
      embeds.add(u.searchParams.get('url') || u.searchParams.get('src') || u.href)
      const thumb = u.searchParams.get('image'); if (thumb) push([thumb], 'video thumbnail')
    } catch { /* skip */ }
  }
  return { found, embeds: [...embeds] }
}

const master = path.resolve(flags.out)
fs.mkdirSync(master, { recursive: true })
const summary = []
for (const page of PAGES) {
  const html = await (await get(page.url)).text()
  const { found, embeds } = extract(html, page.url)
  const dir = path.join(master, page.dir)
  fs.mkdirSync(dir, { recursive: true })
  const seen = new Set(), rows = []
  let i = 0
  for (const item of found) {
    const pick = await best(item.urls)
    if (!pick) { rows.push({ file: '(unreachable)', alt: item.alt, url: item.urls[0], bytes: 0 }); continue }
    if (seen.has(pick.url)) continue
    seen.add(pick.url)
    const src = dehash(decodeURIComponent(pick.url.split('/').pop().split('?')[0]))
    const ext = (src.match(/\.(jpe?g|png|webp|gif|svg|avif)$/i)?.[1] || 'jpg').toLowerCase()
    const stem = slugify(item.alt.replace(/'s/g, 's'), slugify(src.replace(/\.\w+$/, ''), 'image'))
    let buf
    try { buf = Buffer.from(await (await get(pick.url)).arrayBuffer()) } catch (e) { rows.push({ file: '(download failed)', alt: item.alt, url: pick.url, bytes: 0 }); continue }
    const sub = bucket(src, item.alt, buf.length, ext)
    const name = `${String(++i).padStart(2, '0')}-${stem}.${ext}`
    if (sub) fs.mkdirSync(path.join(dir, sub), { recursive: true })
    fs.writeFileSync(path.join(dir, sub, name), buf)
    rows.push({ file: sub ? `${sub}/${name}` : name, alt: item.alt, url: pick.url, bytes: buf.length })
  }
  const ok = rows.filter((r) => r.bytes), bytes = rows.reduce((a, r) => a + r.bytes, 0)
  fs.writeFileSync(path.join(dir, 'MANIFEST.md'), [`# ${page.title} - page images`, '', `Source page: ${page.url}`,
    `Downloaded ${STAMP}: ${ok.length} files, ${(bytes / 1048576).toFixed(1)} MB`, '', '| File | Alt text / role | Source URL |', '|---|---|---|',
    ...rows.map((r) => `| ${r.file} | ${r.alt || '-'} | ${r.url} |`), '', '## Video embeds (not downloaded)', '',
    ...(embeds.length ? embeds.map((e) => `- ${e}`) : ['- none']), ''].join('\n'))
  summary.push({ ...page, count: ok.length, bytes, embeds: embeds.length })
  console.log(`${page.dir}: ${ok.length} images, ${(bytes / 1048576).toFixed(1)} MB, ${embeds.length} embeds`)
}
fs.writeFileSync(path.join(master, 'README.md'), [`# ${flags.title || 'Page'} images`, '',
  `Every image used by these pages, pulled from the live site on ${STAMP}. One folder per page; photography at the top level in page order, logos and badges in icons-and-logos/, video posters in video-thumbnails/. Each MANIFEST.md maps file to alt text and source URL.`, '',
  '| Folder | Page | Files | Size | Video embeds |', '|---|---|---|---|---|',
  ...summary.map((s) => `| \`${s.dir}/\` | ${s.title} | ${s.count} | ${(s.bytes / 1048576).toFixed(1)} MB | ${s.embeds} |`), '',
  'Several images may be licensed stock the practice already runs: confirm with Brandklout before using them in paid placements beyond this site.', ''].join('\n'))
fs.writeFileSync(path.join(master, 'SUMMARY.json'), JSON.stringify(summary, null, 1))
console.log(`\n${summary.reduce((a, s) => a + s.count, 0)} files -> ${master}`)
