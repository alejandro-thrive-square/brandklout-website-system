/* 2026-09-30. upload-media.mjs asked the library what it already held, got the newest 100 of ~390
   assets (the list endpoint ignores limit/offset/page/cursor), and re-uploaded 144 files it could
   not see. This removes exactly those 144 new duplicates and nothing else:
     - the ids come from the map that run wrote (entries without `reused`)
     - none of them may appear in the map committed before the run (argv[2]), or it refuses
   Dry by default; --apply deletes (soft delete, then purge). */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api } from '../../../tools/instatic-api-sync/insta-api.mjs'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const now = JSON.parse(fs.readFileSync(path.join(HERE, 'media-map.json'), 'utf8')).map
const before = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')).map
const keep = new Set(Object.values(before).map((e) => e.id))
const kill = new Map()
for (const [k, e] of Object.entries(now)) if (!e.reused) kill.set(e.id, e.uploadedAs || k)
const clash = [...kill.keys()].filter((id) => keep.has(id))
if (clash.length) { console.error('REFUSING: ids in both maps: ' + clash.join(', ')); process.exit(1) }
const lines = [`${kill.size} duplicate assets to remove; ${keep.size} ids in the prior map stay`]
if (process.argv.includes('--apply')) {
  let ok = 0
  for (const [id, name] of kill) {
    try {
      await api('DELETE', `/admin/api/cms/media/${id}`)
      await api('DELETE', `/admin/api/cms/media/${id}?purge=1`).catch(() => {})
      ok++
    } catch (e) { lines.push(`FAILED ${id} ${name}: ${String(e.message).slice(0, 120)}`) }
  }
  lines.push(`removed ${ok}/${kill.size}`)
}
fs.writeFileSync(path.join(HERE, 'undo-duplicate-uploads.log'), lines.join('\n') + '\n')
