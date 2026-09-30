// How does GET /admin/api/cms/media paginate? (2026-09-30: upload-media.mjs saw 100 of ~390 assets and re-uploaded 144.)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api } from '../../../tools/instatic-api-sync/insta-api.mjs'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const out = {}
const first = await api('GET', '/admin/api/cms/media?limit=500')
out.keys = Object.keys(first)
const list = first.assets ?? first.rows ?? first.items ?? []
out.count = list.length
out.meta = Object.fromEntries(Object.entries(first).filter(([k, v]) => !Array.isArray(v)))
out.sampleKeys = list[0] ? Object.keys(list[0]) : []
for (const q of ['offset=100', 'page=2', 'cursor=' + encodeURIComponent(first.nextCursor ?? first.cursor ?? ''), 'after=' + (list.at(-1)?.id ?? '')]) {
  try {
    const r = await api('GET', '/admin/api/cms/media?limit=100&' + q)
    const l = r.assets ?? r.rows ?? r.items ?? []
    out[q] = { count: l.length, firstSame: l[0]?.id === list[0]?.id, first: l[0]?.filename }
  } catch (e) { out[q] = String(e.message).slice(0, 200) }
}
fs.writeFileSync(path.join(HERE, 'probe-media-list.json'), JSON.stringify(out, null, 1))
