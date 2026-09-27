import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const { api } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const ID = 'brandklout.embed-origins'
const saved = JSON.parse(fs.readFileSync(path.join(HERE, process.argv[2]), 'utf8'))[ID]
const want = saved.values ?? saved.settings ?? saved
const live = await api('GET', `/admin/api/cms/plugins/${ID}/settings`)
const cur = live.values ?? live.settings ?? live
const known = new Set((live.schema ?? []).map((f) => f.id))
const next = { ...cur }
for (const k of Object.keys(want)) if (known.has(k) && k !== 'siteScripts') next[k] = want[k]
console.log('live  ', JSON.stringify(cur))
console.log('next  ', JSON.stringify(next))
const res = await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, next)
console.log('saved ', JSON.stringify(res).slice(0, 200))
