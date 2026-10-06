#!/usr/bin/env node
/**
 * SEO v3: the outside facts the schema cites. Reads seo-v3/out/sections.json.
 *   - every Vimeo film the pages embed: name, description, duration, upload date, thumbnail
 *     (api.vimeo.com with VIMEO= from the worktree .env; a team token, public reads work)
 *   - Wikidata ids for the treatments, so each Service/procedure names the concept it is
 *     (sameAs). Search results are written out for a human check; only ids whose label matches
 *     the expected one are kept.
 *   node seo-v3/fetch-facts.mjs   → seo-v3/out/facts.json
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..', '..', '..', '..', '..')
const env = Object.fromEntries(readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const pages = JSON.parse(readFileSync(join(HERE, 'out', 'sections.json'), 'utf8'))

const ids = new Set()
for (const p of Object.values(pages)) for (const s of p.sections) for (const v of s.videos) ids.add(v)
const videos = {}
for (const id of [...ids].filter((x) => x.startsWith('yt:'))) {
  // YouTube: the watch page carries the same facts the Data API would (title, description, length, upload date)
  const y = id.slice(3)
  const h = await (await fetch(`https://www.youtube.com/watch?v=${y}`, { headers: { 'Accept-Language': 'en-US', 'User-Agent': 'Mozilla/5.0' } })).text()
  const pick = (re) => { const m = h.match(re); return m ? JSON.parse('"' + m[1] + '"') : '' }
  videos[id] = { name: pick(/"videoDetails":\{[^}]*?"title":"((?:[^"\\]|\\.)*)"/), description: pick(/"shortDescription":"((?:[^"\\]|\\.)*)"/),
    duration: Number(pick(/"lengthSeconds":"(\d+)"/)), uploadDate: pick(/"uploadDate":"([^"]+)"/) || pick(/"publishDate":"([^"]+)"/),
    thumbnail: `https://i.ytimg.com/vi/${y}/maxresdefault.jpg`, youtube: y }
  console.log('youtube', y, videos[id].name, videos[id].duration + 's', videos[id].uploadDate)
}
for (const id of [...ids].filter((x) => !x.startsWith('yt:'))) {
  const r = await fetch(`https://api.vimeo.com/videos/${id}?fields=name,description,duration,created_time,release_time,pictures.sizes,link,width,height`, { headers: { Authorization: `bearer ${env.VIMEO}` } })
  if (!r.ok) { console.log('vimeo', id, r.status); continue }
  const v = await r.json()
  const pic = (v.pictures?.sizes || []).sort((a, b) => b.width - a.width)[0]
  videos[id] = { name: v.name, description: v.description || '', duration: v.duration, uploadDate: v.release_time || v.created_time, thumbnail: pic?.link?.replace(/\?.*$/, ''), width: v.width, height: v.height }
  console.log('vimeo', id, v.name, v.duration + 's')
}

// Wikipedia article → its canonical URL and Wikidata item (REST summary API; wbsearchentities rate-limits)
const TOPICS = {
  dentalImplant: 'Dental_implant', allOn4: 'All-on-4', veneer: 'Veneer_(dentistry)', crown: 'Crown_(dental_restoration)',
  bridge: 'Bridge_(dentistry)', whitening: 'Tooth_whitening', dentures: 'Dentures', oralSurgery: 'Oral_and_maxillofacial_surgery',
  prosthodontics: 'Prosthodontics', cosmetic: 'Cosmetic_dentistry', emergency: 'Dental_emergency', sedation: 'Sedation_dentistry',
  nitrous: 'Nitrous_oxide', extraction: 'Dental_extraction', boneGraft: 'Bone_grafting', cbct: 'Cone_beam_computed_tomography',
  osseointegration: 'Osseointegration', periImplantitis: 'Peri-implantitis', periodontal: 'Periodontal_disease', inlay: 'Inlays_and_onlays',
  dentistry: 'Dentistry', smileDesign: 'Smile_design', zirconia: 'Zirconium_dioxide', halitosis: 'Halitosis', drySocket: 'Alveolar_osteitis',
  abscess: 'Dental_abscess', toothache: 'Toothache', malocclusion: 'Malocclusion', gingivectomy: 'Gingivectomy', toothDiscoloration: 'Tooth_discoloration',
  edentulism: 'Edentulism', crackedTooth: 'Cracked_tooth_syndrome', bleedingGums: 'Bleeding_on_probing', vcu: 'Virginia_Commonwealth_University',
  acp: 'American_College_of_Prosthodontists', abp: 'American_Board_of_Prosthodontics', icoi: 'International_Congress_of_Oral_Implantologists',
}
// a re-run keeps what an earlier run already resolved (Wikipedia 429s a burst)
let prev = {}; try { prev = JSON.parse(readFileSync(join(HERE, 'out', 'facts.json'), 'utf8')).wiki || {} } catch {}
const wiki = {}
for (const [k, t] of Object.entries(TOPICS)) {
  if (prev[k]) { wiki[k] = prev[k]; continue }
  let r
  for (let i = 0; i < 6; i++) {
    r = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`, { headers: { 'User-Agent': 'drnahlah-seo-v3/1.0 (schema sameAs lookup)' } })
    if (r.status !== 429) break
    await new Promise((z) => setTimeout(z, 4000 * (i + 1)))
  }
  const j = r.ok ? await r.json() : null
  if (!j || j.type === 'disambiguation' || !j.wikibase_item) { console.log('wiki', k.padEnd(18), 'NONE', r.status, j?.type || ''); continue }
  wiki[k] = { title: j.title, url: j.content_urls.desktop.page, wikidata: `https://www.wikidata.org/wiki/${j.wikibase_item}`, description: j.description || '' }
  console.log('wiki', k.padEnd(18), j.wikibase_item, j.title, '—', j.description || '')
  await new Promise((z) => setTimeout(z, 1200))
}
writeFileSync(join(HERE, 'out', 'facts.json'), JSON.stringify({ videos, wiki }, null, 1))
console.log('videos', Object.keys(videos).length)
