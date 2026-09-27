import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
process.env.INSTATIC_BASE_URL ||= 'https://brandklout-production.up.railway.app'
const { api } = await import('../../../../../../process/22-instatic-api-sync/insta-api.mjs')
const r = await api('GET', '/admin/api/cms/audit?limit=200')
fs.writeFileSync(path.join(HERE, 'audit.json'), JSON.stringify(r, null, 1))
const rows = r.events ?? r.rows ?? r.items ?? []
for (const e of rows.slice(0, 80)) console.log((e.createdAt ?? '').slice(0, 19), e.actor?.email ?? e.actorUserId, e.action, JSON.stringify(e.metadata ?? '').slice(0, 220))
