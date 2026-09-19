import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const { api } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const users = await api('GET', '/admin/api/cms/users')
const list = users.users ?? users.rows ?? users
const sang = list.find((u) => /sang/i.test(u.email))
console.log('sang', sang?.id, sang?.email)
const all = []
for (let offset = 0; offset < 3000; offset += 100) {
  let r
  try { r = await api('GET', `/admin/api/cms/audit?limit=100&offset=${offset}`) } catch (e) { console.log('stop', e.message.slice(0, 80)); break }
  const rows = r.events ?? r.rows ?? r.items ?? []
  if (!rows.length) break
  all.push(...rows)
  if (rows.length < 100) break
}
console.log('events', all.length, 'oldest', all[all.length - 1]?.createdAt)
const mine = all.filter((e) => e.actorUserId === sang?.id)
console.log('by sang', mine.length)
for (const e of mine.slice(0, 60)) console.log(e.createdAt.slice(0, 19), e.action, e.targetType, JSON.stringify(e.metadata).slice(0, 200))
const actions = {}
for (const e of all) actions[e.action] = (actions[e.action] ?? 0) + 1
console.log(JSON.stringify(actions))
