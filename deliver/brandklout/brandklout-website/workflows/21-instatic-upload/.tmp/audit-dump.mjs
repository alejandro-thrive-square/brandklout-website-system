import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const { api } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
for (const p of ['/admin/api/cms/audit?limit=200', '/admin/api/cms/audit', '/admin/api/cms/dashboard/activity']) {
  try { const r = await api('GET', p); fs.writeFileSync(path.join(HERE, 'audit.json'), JSON.stringify(r, null, 1)); const rows = r.events ?? r.rows ?? r.items ?? []; console.log(p, 'rows', rows.length, Object.keys(rows[0] ?? {})); for (const e of rows.slice(0, 200)) { const who = e.actor?.email ?? e.actorEmail ?? e.actorUserId ?? e.actor; if (!/sang/i.test(String(who)) && !/sang/i.test(JSON.stringify(e).slice(0, 300))) continue; console.log((e.createdAt ?? e.at ?? '').slice(0, 19), who, e.action ?? e.type, JSON.stringify(e.metadata ?? e.target ?? '').slice(0, 160)) } break } catch (e) { console.log(p, '!!', String(e.message).slice(0, 100)) }
}
