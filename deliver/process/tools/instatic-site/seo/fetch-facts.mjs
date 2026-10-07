#!/usr/bin/env node
/**
 * fetch-facts.mjs — step 2 of the content-built schema chain: the outside facts the schema cites.
 * Reads <out>/sections.json (scan-sections.mjs).
 *
 *   - every film the pages embed: name, description, duration, upload date, thumbnail.
 *     Vimeo through api.vimeo.com with the team token (VIMEO, or VIMEO_TOKEN, from the worktree
 *     .env; public reads work); YouTube from the watch page (it carries what the Data API would).
 *     A platform's description is the platform's text, not the site's: build-schema.mjs filters it
 *     sentence by sentence (rules.platformTextDrop).
 *   - the Wikipedia article and Wikidata item of every concept in seo-config.json `wiki`
 *     ({ key: "Wikipedia_title" }), so the schema can name what a procedure IS (sameAs). The REST
 *     summary API returns both; Wikidata's own search rate-limits. A disambiguation page or a missing
 *     item is reported and left out. A re-run keeps what the last run resolved (Wikipedia 429s a
 *     burst); --refresh fetches every topic again.
 *
 *   node fetch-facts.mjs [--config output/seo-config.json] [--out output/schema] [--refresh]
 *     → <out>/facts.json
 *
 * Read-only. Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v3/fetch-facts.mjs
 * (the topic list moved to seo-config.json `wiki`; the .env is found by walking up).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadConfig, outDir, flag, loadDotEnv } from './lib/seo-config.mjs'

const C = loadConfig()
const OUT = outDir()
loadDotEnv()
const SECTIONS = join(OUT, 'sections.json')
if (!existsSync(SECTIONS)) { console.error(`no ${SECTIONS}: run scan-sections.mjs first`); process.exit(2) }
const pages = JSON.parse(readFileSync(SECTIONS, 'utf8'))
const FACTS = join(OUT, 'facts.json')
let prev = {}
try { prev = JSON.parse(readFileSync(FACTS, 'utf8')) } catch {}

const ids = new Set()
for (const p of Object.values(pages)) for (const s of p.sections) for (const v of s.videos) ids.add(v)
const videos = {}
let missing = 0
for (const id of [...ids].filter((x) => x.startsWith('yt:'))) {
  const y = id.slice(3)
  const h = await (await fetch(`https://www.youtube.com/watch?v=${y}`, { headers: { 'Accept-Language': 'en-US', 'User-Agent': 'Mozilla/5.0' } })).text()
  const pick = (re) => { const m = h.match(re); return m ? JSON.parse('"' + m[1] + '"') : '' }
  videos[id] = {
    name: pick(/"videoDetails":\{[^}]*?"title":"((?:[^"\\]|\\.)*)"/), description: pick(/"shortDescription":"((?:[^"\\]|\\.)*)"/),
    duration: Number(pick(/"lengthSeconds":"(\d+)"/)), uploadDate: pick(/"uploadDate":"([^"]+)"/) || pick(/"publishDate":"([^"]+)"/),
    thumbnail: `https://i.ytimg.com/vi/${y}/maxresdefault.jpg`, youtube: y,
  }
  if (!videos[id].name) { console.log('youtube', y, 'NO DETAILS (consent page or removed film)'); delete videos[id]; missing++; continue }
  console.log('youtube', y, videos[id].name, videos[id].duration + 's', videos[id].uploadDate)
}
const vimeoIds = [...ids].filter((x) => !x.startsWith('yt:'))
const token = process.env.VIMEO || process.env.VIMEO_TOKEN
if (vimeoIds.length && !token) { console.log(`vimeo    ${vimeoIds.length} film(s) and no VIMEO token in the environment or .env — not described`); missing += vimeoIds.length }
for (const id of token ? vimeoIds : []) {
  const r = await fetch(`https://api.vimeo.com/videos/${id}?fields=name,description,duration,created_time,release_time,pictures.sizes,link,width,height`, { headers: { Authorization: `bearer ${token}` } })
  if (!r.ok) { console.log('vimeo', id, r.status); missing++; continue }
  const v = await r.json()
  const pic = (v.pictures?.sizes || []).sort((a, b) => b.width - a.width)[0]
  videos[id] = { name: v.name, description: v.description || '', duration: v.duration, uploadDate: v.release_time || v.created_time, thumbnail: pic?.link?.replace(/\?.*$/, ''), width: v.width, height: v.height }
  console.log('vimeo', id, v.name, v.duration + 's')
}

const keep = flag('--refresh') ? {} : (prev.wiki || {})
const wiki = {}
for (const [k, t] of Object.entries(C.wiki)) {
  if (keep[k] && keep[k].title !== undefined && keep[k].source === t) { wiki[k] = keep[k]; continue }
  let r
  for (let i = 0; i < 6; i++) {
    r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`, { headers: { 'User-Agent': 'brandklout-seo-facts/1.0 (schema sameAs lookup)' } })
    if (r.status !== 429) break
    await new Promise((z) => setTimeout(z, 4000 * (i + 1)))
  }
  const j = r.ok ? await r.json() : null
  if (!j || j.type === 'disambiguation' || !j.wikibase_item) { console.log('wiki', k.padEnd(18), 'NONE', r.status, j?.type || ''); continue }
  wiki[k] = { title: j.title, url: j.content_urls.desktop.page, wikidata: `https://www.wikidata.org/wiki/${j.wikibase_item}`, description: j.description || '', source: t }
  console.log('wiki', k.padEnd(18), j.wikibase_item, j.title, '—', j.description || '')
  await new Promise((z) => setTimeout(z, 1200))
}
writeFileSync(FACTS, JSON.stringify({ videos, wiki }, null, 1))
console.log(`videos ${Object.keys(videos).length} of ${ids.size}, wiki ${Object.keys(wiki).length} of ${Object.keys(C.wiki).length} → ${FACTS}`)
process.exit(missing || Object.keys(wiki).length < Object.keys(C.wiki).length ? 1 : 0)
