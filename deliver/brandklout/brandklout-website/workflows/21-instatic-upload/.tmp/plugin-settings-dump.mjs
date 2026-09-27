import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const { api } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const list = await api('GET', '/admin/api/cms/plugins')
const out = { list }
for (const p of list.plugins ?? list.items ?? list ?? []) { const id = p.id ?? p.pluginId; if (!id) continue; out[id] = await api('GET', `/admin/api/cms/plugins/${id}/settings`) }
fs.writeFileSync(path.join(HERE, process.argv[2]), JSON.stringify(out, null, 1))
console.log(Object.keys(out), JSON.stringify(out.list).slice(0, 300))
