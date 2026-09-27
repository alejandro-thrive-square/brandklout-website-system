#!/usr/bin/env node
/**
 * pick-post-images.mjs — BugHerd pin #7, the image half.
 *
 *   node pick-post-images.mjs            # choose, write the contact sheet
 *   node pick-post-images.mjs --apply    # download + upload + set featuredMedia
 *
 * The 43 articles have no imagery at all: `posts.featuredMedia` exists as a
 * `media` field on the table and is empty on every row.
 *
 * The client asked for stock photos "from the Magnific API", and added: "if you
 * find any related image to the topic of the article on the static panel asset,
 * you can choose from there". So the site's own library is tried FIRST and
 * Freepik is the fallback. That ordering matters for more than tidiness — the
 * library images are the ones already art-directed for this brand, and every
 * Freepik download spends account quota.
 *
 * ## The library pool is curated, not the whole library
 *
 * 434 assets, and most of them are `*-before.jpg` / `*-after.jpg` — real
 * patient case photography for the smile gallery. Those are not generic
 * article headers: putting a specific patient's before-and-after on top of an
 * unrelated article misrepresents the case. The pool here is the editorial and
 * model imagery only, and the exclusions are deliberate.
 *
 * ## Two phases on purpose
 *
 * Without `--apply` this only READS. It scores every article, resolves a
 * candidate, and writes `.tmp/post-images/contact-sheet.html` — 43 title→image
 * pairs on one page, Freepik candidates shown from their free 626px PREVIEW.
 * No download is spent and nothing on the site changes. Approve the sheet, then
 * `--apply` downloads the full-resolution files, uploads them and sets
 * `featuredMedia`.
 *
 * Credentials: MAGNIFIC in the repo-root .env (a Freepik key — the header is
 * `x-freepik-api-key`; Magnific is Freepik's brand and the CDN answers on
 * magnific.com).
 *
 * NOTHING HERE PUBLISHES.
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '.tmp', 'post-images')
const APPLY = process.argv.includes('--apply')

const KEY = process.env.MAGNIFIC
if (!KEY) {
  // insta-api's loadEnv already walked up for .env; if it is still missing it
  // is genuinely absent rather than a path problem.
  console.error('MAGNIFIC is not set in the repo-root .env')
  process.exit(1)
}

import { TOPICS, MAX_USES, MIN_WIDTH, topicFor } from './post-image-pool.mjs'

// ── data ───────────────────────────────────────────────────────────────────
const { assets } = await api('GET', '/admin/api/cms/media')
const { rows: posts } = await api('GET', '/admin/api/cms/data/tables/posts/rows')

// Resolve each allowlisted filename to its largest upload — the library holds
// duplicate uploads of the same picture at different sizes.
const byName = new Map()
for (const a of assets) {
  if (!a.publicPath || !/^image\//.test(a.mimeType ?? '')) continue
  if ((a.width ?? 0) < MIN_WIDTH) continue   // too small to headline a page
  const prev = byName.get(a.filename)
  if (!prev || (a.width ?? 0) * (a.height ?? 0) > (prev.width ?? 0) * (prev.height ?? 0)) byName.set(a.filename, a)
}
const missing = []
for (const t of TOPICS) for (const f of t.assets) if (!byName.has(f)) missing.push(`${t.id}/${f}`)
if (missing.length) console.warn(`  ! allowlist entries not in the library: ${missing.join(', ')}`)

console.log(`${posts.length} posts, ${byName.size} distinct library files, ${TOPICS.length} topics`)

// ── matching ───────────────────────────────────────────────────────────────
async function freepik (term) {
  const url = `https://api.freepik.com/v1/resources?term=${encodeURIComponent(term)}` +
    `&limit=8&filters[content_type][photo]=1&filters[orientation][landscape]=1&order=relevance`
  const res = await fetch(url, { headers: { 'x-freepik-api-key': KEY } })
  if (!res.ok) return null
  const body = await res.json()
  return (body.data ?? []).filter(d => d.image?.source?.url)
}

const used = new Map()          // filename -> times used
const fpUsed = new Set()        // freepik id -> already taken by another article
const picks = []

for (const p of posts) {
  const title = p.cells.title ?? p.slug
  const topic = topicFor(title)

  // Library first, respecting the per-asset cap so no photo headlines the blog.
  const free = topic.assets.filter(f => byName.has(f) && (used.get(f) ?? 0) < MAX_USES)
  if (free.length) {
    const f = free.sort((a, b) => (used.get(a) ?? 0) - (used.get(b) ?? 0))[0]
    used.set(f, (used.get(f) ?? 0) + 1)
    const a = byName.get(f)
    picks.push({ slug: p.slug, id: p.id, title, topic: topic.id, source: 'library',
      assetId: a.id, preview: a.publicPath, name: f })
    console.log(`  lib  ${topic.id.padEnd(13)} ${p.slug.slice(0, 42).padEnd(44)} ${f}`)
    continue
  }

  // Freepik fallback, on the TOPIC's curated query rather than scraped title
  // words — "uncover lifespan long dental" returned a man in glasses.
  const hits = (await freepik(topic.query)) ?? []
  const hit = hits.find(h => !fpUsed.has(h.id))
  if (!hit) {
    picks.push({ slug: p.slug, id: p.id, title, topic: topic.id, source: 'none', term: topic.query })
    console.log(`  MISS ${topic.id.padEnd(13)} ${p.slug.slice(0, 42).padEnd(44)} "${topic.query}"`)
    continue
  }
  fpUsed.add(hit.id)
  picks.push({ slug: p.slug, id: p.id, title, topic: topic.id, source: 'freepik', term: topic.query,
    fpId: hit.id, preview: hit.image.source.url, name: hit.title,
    license: (hit.licenses ?? [])[0]?.type ?? '?' })
  console.log(`  fp   ${topic.id.padEnd(13)} ${p.slug.slice(0, 42).padEnd(44)} ${String(hit.title).slice(0, 42)}`)
}

mkdirSync(OUT, { recursive: true })
const CACHE = join(OUT, 'picks.json')
writeFileSync(CACHE, JSON.stringify(picks, null, 2))

// ── contact sheet ──────────────────────────────────────────────────────────
const BASE = (process.env.INSTATIC_BASE_URL || 'https://encorercm.com').replace(/\/$/, '')
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const card = p => `
  <figure class="c ${p.source}">
    ${p.preview ? `<img src="${esc(p.source === 'library' ? BASE + p.preview : p.preview)}" loading="lazy" alt="">`
      : '<div class="miss">no candidate</div>'}
    <figcaption>
      <b>${esc(p.title)}</b>
      <span class="s">${p.source}${p.topic ? ` · ${p.topic}` : ''}${p.term ? ` · "${esc(p.term)}"` : ''}${p.license ? ` · ${p.license}` : ''}</span>
      <span class="n">${esc(p.name ?? '')}</span>
    </figcaption>
  </figure>`

const counts = picks.reduce((m, p) => ({ ...m, [p.source]: (m[p.source] ?? 0) + 1 }), {})
writeFileSync(join(OUT, 'contact-sheet.html'), `<!doctype html><meta charset="utf-8">
<title>Post images — contact sheet</title>
<style>
 body{font:14px/1.5 system-ui,sans-serif;margin:2rem;background:#faf9f6;color:#16161a}
 h1{font-size:1.4rem;margin:0 0 .25rem} .sub{color:#666;margin-bottom:1.5rem}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.25rem}
 .c{margin:0;background:#fff;border:1px solid #e3e0d8;display:flex;flex-direction:column}
 .c img{width:100%;height:180px;object-fit:cover;display:block;background:#eee}
 .miss{height:180px;display:grid;place-items:center;background:#fbeaea;color:#a33}
 figcaption{padding:.7rem .8rem;display:flex;flex-direction:column;gap:.25rem}
 b{font-size:.82rem;font-weight:600} .s{font-size:.7rem;color:#8a7e4e;text-transform:uppercase;letter-spacing:.06em}
 .n{font-size:.72rem;color:#888}
 .library{border-left:3px solid #2e7d32} .freepik{border-left:3px solid #8a7e4e} .none{border-left:3px solid #a33}
</style>
<h1>Featured images — ${picks.length} articles</h1>
<div class="sub">${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(' · ')}.
 Green = the site's own library. Gold = Freepik (shown from the free preview; full-resolution is downloaded only on --apply). Red = no candidate.</div>
<div class="grid">${picks.map(card).join('')}</div>`)

console.log(`\n${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join('  ')}`)
console.log(`wrote ${join(OUT, 'contact-sheet.html')}`)
if (!APPLY) {
  console.log('\nREAD-ONLY - nothing downloaded, nothing changed. Review the sheet, then --apply.')
  process.exit(0)
}

// -- apply -----------------------------------------------------------------
// Library picks already exist as assets, so only the Freepik ones cost a
// download. Each signed URL carries an `exp` and is fetched immediately.
const { requestForm } = await import('./insta-api.mjs')

async function uploadFreepik (pick) {
  const meta = await fetch(`https://api.freepik.com/v1/resources/${pick.fpId}/download`,
    { headers: { 'x-freepik-api-key': KEY } })
  if (!meta.ok) throw new Error(`download endpoint ${meta.status}`)
  const { data } = await meta.json()
  const bin = await fetch(data.url)
  if (!bin.ok) throw new Error(`cdn ${bin.status}`)
  const bytes = Buffer.from(await bin.arrayBuffer())

  // The File constructor is what makes FormData emit a multipart FILE part; a
  // bare Blob arrives as a text field and the handler answers 400 "Missing
  // file". The server picks the extension from magic bytes regardless of the
  // name we send, so read publicPath off the response rather than building it.
  const form = new FormData()
  form.append('file', new File([bytes], data.filename || `${pick.fpId}.jpg`, { type: 'image/jpeg' }))
  const res = await requestForm('/admin/api/cms/media', form)
  const asset = res?.asset
  if (!asset?.id) throw new Error(`upload returned no asset: ${JSON.stringify(res).slice(0, 200)}`)
  return asset
}

let set = 0
const failed = []
for (const pick of picks) {
  if (pick.source === 'none') { console.log(`  skip  ${pick.slug} (no candidate)`); continue }

  let assetId = pick.assetId
  try {
    if (pick.source === 'freepik') {
      const asset = await uploadFreepik(pick)
      assetId = asset.id
      console.log(`  up    ${asset.id}  ${asset.publicPath}  ${asset.width}x${asset.height}`)
    }

    // A single-value `media` cell stores the asset id as a plain STRING
    // (src/admin/.../CellDisplayRenderer.tsx). And PATCH replaces `cells`
    // wholesale despite the verb, so the row is re-read immediately before the
    // write and spread - anything omitted here would be erased.
    const before = (await api('GET', `/admin/api/cms/data/rows/${pick.id}`)).row
    await api('PATCH', `/admin/api/cms/data/rows/${pick.id}`,
      { cells: { ...before.cells, featuredMedia: assetId } })

    const after = (await api('GET', `/admin/api/cms/data/rows/${pick.id}`)).row
    const intact = after.cells.title === before.cells.title &&
      after.cells.slug === before.cells.slug &&
      JSON.stringify(after.cells.body) === JSON.stringify(before.cells.body)
    if (!intact) { failed.push({ slug: pick.slug, error: 'TITLE/SLUG/BODY CHANGED' }); break }
    if (after.cells.featuredMedia !== assetId) { failed.push({ slug: pick.slug, error: 'not written' }); continue }
    set++
    console.log(`  set   ${pick.slug.slice(0, 48).padEnd(50)} ${assetId}`)
  } catch (e) {
    failed.push({ slug: pick.slug, error: e.message.slice(0, 120) })
    console.log(`  FAIL  ${pick.slug}: ${e.message.slice(0, 90)}`)
  }
}

writeFileSync(join(OUT, 'applied.json'), JSON.stringify({ set, failed, picks }, null, 2))
console.log(`\nfeaturedMedia set on ${set}/${picks.length}`)
if (failed.length) {
  console.error(`${failed.length} failed:`)
  for (const f of failed) console.error(`  ${f.slug}: ${f.error}`)
  process.exit(1)
}
console.log('\nNothing published. Publish with: node insta-api.mjs publish')
