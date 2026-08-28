#!/usr/bin/env node
/**
 * push-post-images-dedupe.mjs — BugHerd #27, `/posts` → `article.bl-card`.
 * DRAFT ROWS ONLY. It does not publish the site and does not publish the rows.
 *
 *   node push-post-images-dedupe.mjs              # plan + contact sheet, no download
 *   node push-post-images-dedupe.mjs --apply      # download, upload, set featuredMedia
 *   node push-post-images-dedupe.mjs --limit 3    # work on the first N replacements only
 *
 * > "If you see we have a lot of repeated images here, let's use stock photos
 * > from Magnific API. Make sure to analyze the image so it matches the topic
 * > of the article."
 *
 * ## The count, settled by bytes and not by asset id
 *
 * 43 articles carry 29 distinct `featuredMedia` ids — but only **22 distinct
 * pictures**. The library holds byte-identical uploads of one photograph under
 * several filenames (pin #11's finding), so two rows can hold different ids and
 * render the same image side by side on `/posts`, where all 43 are on ONE page.
 * Identity here is therefore the SHA-256 of the fetched bytes, never the id and
 * never the filename.
 *
 * That leaves **21 redundant instances** to re-shoot. Four articles share
 * `pt-hero-4.jpg`; four more share `patient_hero.jpg`.
 *
 * ## Which article keeps the picture it has
 *
 * Within a duplicate group the keeper is the article whose topic OWNS that
 * asset in `post-image-pool.mjs` — i.e. the assignment the picker made on
 * purpose. Ties, and groups where no article owns it, fall back to row order
 * (`publishedAt desc`, the order the cards render), so the first card on the
 * page keeps what a reader has already seen and the later ones change.
 *
 * ## "Analyze the image so it matches the topic"
 *
 * Freepik is queried on the TOPIC's curated phrase from `post-image-pool.mjs`
 * — never on the article title. That rule is inherited from `pick-post-images.mjs`
 * and it is load-bearing: "uncover lifespan long dental" returned a man in
 * glasses, and "zirconia crown" returned ceramic cups.
 *
 * On top of the query, every candidate is scored against its own title before
 * it can be chosen:
 *
 *   - it must read as dentistry at all (`DENTAL_RE`), which is what rejects the
 *     cups and the man in glasses;
 *   - it gains points for the topic's own keywords, so the all-on-4 articles
 *     get arch prostheses rather than generic clinic interiors;
 *   - it is rejected outright on `VETO_RE` — children, surgical fields, blood,
 *     braces/orthodontics, illustration and 3D-render language. This is an
 *     implant prosthodontics practice and a cartoon tooth or an open surgical
 *     site is the wrong picture whatever it scores.
 *
 * The candidate list per topic is drawn from up to 3 pages of 50, so articles
 * sharing a topic get genuinely different photographs rather than the same top
 * hit re-offered.
 *
 * ## Two phases, because a download spends quota
 *
 * Without `--apply` nothing is downloaded and nothing changes: the plan is
 * printed and `.tmp/post-dedupe/contact-sheet.html` shows every proposed pair
 * from Freepik's free 626px preview. Approve it, then `--apply`.
 *
 * ## After this, the rows still have to be published
 *
 *   node publish-post-rows.mjs --apply
 *
 * `PATCH /data/rows/:id` writes DRAFT cells, and a SITE publish does not promote
 * post rows — `persistSitePublish` only walks `data_tables.id = 'pages'`. Skip
 * that step and the loop keeps rendering the old pictures with no error
 * anywhere. See `publish-post-rows.mjs`.
 */
import { createHash } from 'node:crypto'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, requestForm, BASE } from './insta-api.mjs'
import { TOPICS, topicFor } from './post-image-pool.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '.tmp', 'post-dedupe')
const APPLY = process.argv.includes('--apply')
const li = process.argv.indexOf('--limit')
const LIMIT = li > -1 ? Number(process.argv[li + 1]) : Infinity

const KEY = process.env.MAGNIFIC
if (!KEY) { console.error('MAGNIFIC is not set in the repo-root .env'); process.exit(1) }

/* A picture only qualifies if its own title says "dentistry". Freepik's
   relevance ranking is generous — "dental crown ceramic" returns crockery. */
const DENTAL_RE = /dent(al|ist|istry|ure)|tooth|teeth|implant|oral|smile|jaw|molar|prosthes|orthodont|hygien|mouth/i

/* Never, whatever it scores. An implant prosthodontics practice's journal is
   not the place for a child patient, an open surgical field, blood, braces, or
   a cartoon. `3d render` / `illustration` are vetoed because the pool is
   photography and a render reads as a diagram beside real clinic photographs. */
const VETO_RE = /\bchild|kid|baby|infant|toddler|cartoon|illustration|vector|clipart|3d render|rendering|blood|bleed|surgery room|surgical field|extraction|forceps|scary|horror|braces|bracket|invisalign|aligner\b/i

/* Points for reading like the topic, on top of merely reading like dentistry. */
const TOPIC_WORDS = {
  'all-on-4': /full[- ]arch|all[- ]on|arch|prosthes|denture|hybrid|bridge/i,
  dentures: /denture|removable|prosthes|snap|overdenture/i,
  veneers: /veneer|porcelain|cosmetic|smile design|makeover|shade/i,
  whitening: /whiten|bleach|shade|bright/i,
  sedation: /sedat|calm|relax|anxiet|comfort|nitrous/i,
  crowns: /crown|bridge|ceramic|zirconia|lab|milling/i,
  emergency: /emergenc|pain|ache|urgent|broken|fracture/i,
  consultation: /consult|x[- ]?ray|radiograph|scan|exam|appointment|plan|explain|talk|discuss/i,
  technology: /scanner|digital|cad|cam|technolog|intraoral|3d scan|guided/i,
  aftercare: /clean|hygien|check|floss|brush|care|maintenance|follow[- ]up/i,
  cost: /reception|desk|office|consult|insurance|payment|finance|plan/i,
  implants: /implant|screw|abutment|fixture|model|tooth|teeth/i,
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/** Freepik titles are keyword soup. Keep the words, fix the shape. */
function altFrom (title) {
  let t = String(title ?? '').replace(/\s+/g, ' ').trim().replace(/[.\s]+$/, '')
  if (t.length > 125) t = `${t.slice(0, 122).replace(/\s+\S*$/, '')}…`
  return t ? t[0].toUpperCase() + t.slice(1) : ''
}

function score (candidate, topicId) {
  const title = String(candidate.title ?? '')
  if (VETO_RE.test(title)) return -1
  if (!DENTAL_RE.test(title)) return -1
  const words = TOPIC_WORDS[topicId]
  let s = 1
  if (words && words.test(title)) s += 3
  // Prefer a real photograph of people or of clinical work over a white-background
  // product shot — the cards sit in a warm editorial grid.
  if (/patient|dentist|doctor|clinic|woman|man|smiling|consultation/i.test(title)) s += 1
  if (/white background|isolated/i.test(title)) s -= 1
  return s
}

// ── read the site ──────────────────────────────────────────────────────────
const { rows } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
const { assets } = await api('GET', '/admin/api/cms/media')
const byId = new Map(assets.map((a) => [a.id, a]))

mkdirSync(OUT, { recursive: true })
const SHA_CACHE = join(OUT, 'sha.json')
const shaCache = existsSync(SHA_CACHE) ? JSON.parse(readFileSync(SHA_CACHE, 'utf8')) : {}

async function shaOf (assetId) {
  if (shaCache[assetId]) return shaCache[assetId]
  const a = byId.get(assetId)
  if (!a) return `missing:${assetId}`
  const res = await fetch(BASE + a.publicPath)
  if (!res.ok) throw new Error(`GET ${a.publicPath} -> ${res.status}`)
  const hex = createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex').slice(0, 16)
  shaCache[assetId] = hex
  return hex
}

const plan = []
for (const r of rows) {
  const title = r.cells.title ?? r.slug
  plan.push({
    rowId: r.id, slug: r.slug, title,
    topic: topicFor(title).id,
    assetId: r.cells.featuredMedia ?? null,
    file: byId.get(r.cells.featuredMedia)?.filename ?? null,
    sha: r.cells.featuredMedia ? await shaOf(r.cells.featuredMedia) : 'none',
  })
}
writeFileSync(SHA_CACHE, JSON.stringify(shaCache, null, 1))

const groups = new Map()
for (const p of plan) {
  if (!groups.has(p.sha)) groups.set(p.sha, [])
  groups.get(p.sha).push(p)
}
const dupGroups = [...groups.values()].filter((g) => g.length > 1)
const redundant = dupGroups.reduce((s, g) => s + g.length - 1, 0)
console.log(`${plan.length} articles · ${groups.size} distinct pictures · ${dupGroups.length} duplicate groups · ${redundant} redundant`)
if (redundant === 0) { console.log('\nnothing repeats — nothing to do'); process.exit(0) }

/* The keeper is the article whose topic OWNS the asset in the pool — the
   assignment the picker made deliberately. Everything else in the group is
   re-shot, in row order (`publishedAt desc`), so the earliest card is stable. */
const ownerOf = (file) => TOPICS.find((t) => t.assets.includes(file))?.id ?? null
const needs = []
for (const g of dupGroups) {
  const owner = ownerOf(g[0].file)
  const keepIdx = Math.max(0, g.findIndex((p) => p.topic === owner))
  g.forEach((p, i) => { if (i !== keepIdx) needs.push(p) })
  console.log(`  ${String(g[0].file ?? '?').padEnd(36)} keep ${g[keepIdx].slug.slice(0, 38)}`)
}
console.log(`\n${needs.length} articles need a new picture`)

// ── candidates, per topic, search only ─────────────────────────────────────
const byTopic = new Map()
for (const n of needs) byTopic.set(n.topic, (byTopic.get(n.topic) ?? 0) + 1)

async function searchPage (term, page) {
  const url = `https://api.freepik.com/v1/resources?term=${encodeURIComponent(term)}` +
    `&limit=50&page=${page}&filters[content_type][photo]=1&filters[orientation][landscape]=1&order=relevance`
  const res = await fetch(url, { headers: { 'x-freepik-api-key': KEY } })
  if (!res.ok) { console.warn(`  ! freepik ${res.status} for "${term}" p${page}`); return [] }
  return (await res.json()).data ?? []
}

const pool = new Map()   // topicId -> scored, sorted candidates
for (const [topicId, want] of byTopic) {
  const topic = TOPICS.find((t) => t.id === topicId)
  const seen = new Map()
  for (let page = 1; page <= 3 && seen.size < want * 6 + 10; page++) {
    for (const d of await searchPage(topic.query, page)) {
      if (!d.image?.source?.url || seen.has(d.id)) continue
      const s = score(d, topicId)
      if (s < 0) continue
      seen.set(d.id, { id: d.id, title: d.title, preview: d.image.source.url, score: s,
        license: (d.licenses ?? [])[0]?.type ?? '?' })
    }
  }
  const sorted = [...seen.values()].sort((a, b) => b.score - a.score || a.id - b.id)
  pool.set(topicId, sorted)
  console.log(`  pool  ${topicId.padEnd(13)} need ${String(want).padEnd(2)}  qualified ${sorted.length}   "${topic.query}"`)
}

/**
 * Two Freepik ids can be two frames of the SAME shoot — "Teeth ceramics
 * dentures on printed acrylic model in dental lab. Top view." came back twice
 * under different ids, and picking both would put two near-identical white
 * acrylic models on `/posts`: the exact defect this script exists to remove.
 * Contributors title a series identically, so the first few significant words
 * are a good proxy for "same shoot".
 */
const STOP = /^(a|an|the|of|on|in|at|with|and|for|to|by|is|are)$/i
const seriesKey = (title) => String(title ?? '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ')
  .split(/\s+/).filter((w) => w && !STOP.test(w)).slice(0, 5).join(' ')

const takenFp = new Set()
const takenSeries = new Set()
const short = []
for (const n of needs) {
  const cand = (pool.get(n.topic) ?? []).find((c) =>
    !takenFp.has(c.id) && !takenSeries.has(seriesKey(c.title)))
  if (!cand) { short.push(n); n.pick = null; continue }
  takenFp.add(cand.id)
  takenSeries.add(seriesKey(cand.title))
  n.pick = cand
}
if (short.length) {
  console.error(`\n! ${short.length} articles have no qualified candidate: ${short.map((s) => s.slug).join(', ')}`)
}

// ── contact sheet ──────────────────────────────────────────────────────────
const card = (n) => `
  <figure class="c ${n.pick ? 'ok' : 'miss'}">
    <div class="pair">
      <div><img src="${esc(BASE + (byId.get(n.assetId)?.publicPath ?? ''))}" loading="lazy" alt=""><span>now · ${esc(n.file)}</span></div>
      <div>${n.pick ? `<img src="${esc(n.pick.preview)}" loading="lazy" alt=""><span>new · ${esc(n.pick.license)} · score ${n.pick.score}</span>` : '<div class="none">no candidate</div>'}</div>
    </div>
    <figcaption><b>${esc(n.title)}</b>
      <span class="s">${esc(n.topic)}</span>
      <span class="n">${esc(n.pick?.title ?? '')}</span></figcaption>
  </figure>`

writeFileSync(join(OUT, 'contact-sheet.html'), `<!doctype html><meta charset="utf-8">
<title>/posts — de-duplicated featured images</title>
<style>
 body{font:14px/1.5 system-ui,sans-serif;margin:2rem;background:#faf9f6;color:#16161a}
 h1{font-size:1.4rem;margin:0 0 .25rem}.sub{color:#666;margin-bottom:1.5rem}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:1.25rem}
 .c{margin:0;background:#fff;border:1px solid #e3e0d8}
 .pair{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#e3e0d8}
 .pair img{width:100%;height:150px;object-fit:cover;display:block;background:#eee}
 .pair span{display:block;font-size:.66rem;color:#888;padding:.25rem .4rem;background:#fff}
 .none{height:150px;display:grid;place-items:center;background:#fbeaea;color:#a33}
 figcaption{padding:.7rem .8rem;display:flex;flex-direction:column;gap:.25rem}
 b{font-size:.82rem}.s{font-size:.7rem;color:#8a7e4e;text-transform:uppercase;letter-spacing:.06em}
 .n{font-size:.72rem;color:#888}.miss{border-left:3px solid #a33}.ok{border-left:3px solid #2e7d32}
</style>
<h1>/posts — ${needs.length} repeated cards, re-shot</h1>
<div class="sub">${plan.length} articles held ${groups.size} distinct pictures. Left: what the card shows today. Right: the Freepik candidate (free 626px preview; full resolution is downloaded only on --apply).</div>
<div class="grid">${needs.map(card).join('')}</div>`)
writeFileSync(join(OUT, 'plan.json'), JSON.stringify({ plan, needs }, null, 1))
console.log(`\nwrote ${join(OUT, 'contact-sheet.html')}`)

if (!APPLY) {
  console.log('\nREAD-ONLY — nothing downloaded, nothing changed. Review the sheet, then --apply.')
  process.exit(0)
}

// ── apply ──────────────────────────────────────────────────────────────────
async function download (pick) {
  const meta = await fetch(`https://api.freepik.com/v1/resources/${pick.id}/download`,
    { headers: { 'x-freepik-api-key': KEY } })
  if (!meta.ok) throw new Error(`download endpoint ${meta.status}`)
  const { data } = await meta.json()
  const bin = await fetch(data.url)
  if (!bin.ok) throw new Error(`cdn ${bin.status}`)
  const bytes = Buffer.from(await bin.arrayBuffer())
  // `File`, not `Blob` — a bare Blob arrives as a text field and the handler
  // answers 400 "Missing file". The extension is sniffed server-side from the
  // magic bytes, so publicPath is read back, never constructed.
  const form = new FormData()
  form.append('file', new File([bytes], data.filename || `${pick.id}.jpg`, { type: 'image/jpeg' }))
  const asset = (await requestForm('/admin/api/cms/media', form))?.asset
  if (!asset?.id) throw new Error('upload returned no asset')
  return asset
}

let done = 0
const failed = []
for (const n of needs.filter((x) => x.pick).slice(0, LIMIT)) {
  try {
    const asset = await download(n.pick)
    const alt = altFrom(n.pick.title)
    await api('PATCH', `/admin/api/cms/media/${asset.id}`, { altText: alt })

    // PATCH replaces `cells` wholesale despite the verb — re-read and spread, or
    // everything not named here is erased.
    const before = (await api('GET', `/admin/api/cms/data/rows/${n.rowId}`)).row
    await api('PATCH', `/admin/api/cms/data/rows/${n.rowId}`,
      { cells: { ...before.cells, featuredMedia: asset.id } })
    const after = (await api('GET', `/admin/api/cms/data/rows/${n.rowId}`)).row
    if (after.cells.title !== before.cells.title || after.cells.slug !== before.cells.slug ||
        JSON.stringify(after.cells.body) !== JSON.stringify(before.cells.body)) {
      failed.push({ slug: n.slug, error: 'TITLE/SLUG/BODY CHANGED' }); break
    }
    if (after.cells.featuredMedia !== asset.id) { failed.push({ slug: n.slug, error: 'not written' }); continue }
    done++
    console.log(`  set   ${n.slug.slice(0, 44).padEnd(46)} ${asset.width}x${asset.height}  ${asset.publicPath}`)
  } catch (e) {
    failed.push({ slug: n.slug, error: e.message.slice(0, 140) })
    console.log(`  FAIL  ${n.slug}: ${e.message.slice(0, 100)}`)
  }
}

writeFileSync(join(OUT, 'applied.json'), JSON.stringify({ done, failed, needs }, null, 1))
console.log(`\nre-shot ${done}/${needs.length}`)
if (failed.length) {
  for (const f of failed) console.error(`  ${f.slug}: ${f.error}`)
  process.exit(1)
}
console.log('\nDRAFT ROWS ONLY. Publish them with: node publish-post-rows.mjs --apply')
