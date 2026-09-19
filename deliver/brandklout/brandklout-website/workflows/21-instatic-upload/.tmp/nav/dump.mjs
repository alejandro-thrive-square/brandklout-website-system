import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
process.env.INSTATIC_BASE_URL ||= 'https://brandklout-production.up.railway.app'
const { api, getSite, getPages, publishStatus } = await import('../../../../../../process/22-instatic-api-sync/insta-api.mjs')
const site = await getSite()
fs.writeFileSync(path.join(HERE, 'site.json'), JSON.stringify(site))
const rows = (await getPages()).rows
const full = []
for (const r of rows) full.push((await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row)
fs.writeFileSync(path.join(HERE, 'rows.json'), JSON.stringify(full))
console.log('seq', site.seq, 'rows', full.length, JSON.stringify(await publishStatus()))
const sh = site.site
console.log('shell keys', Object.keys(sh))
console.log('visualComponents', JSON.stringify(sh.visualComponents)?.slice(0, 500))
