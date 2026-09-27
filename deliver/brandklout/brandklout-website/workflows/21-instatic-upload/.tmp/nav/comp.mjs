import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
process.env.INSTATIC_BASE_URL ||= 'https://brandklout-production.up.railway.app'
const { api } = await import('../../../../../../process/22-instatic-api-sync/insta-api.mjs')
for (const p of ['/admin/api/cms/components', '/admin/api/cms/visual-components', '/admin/api/cms/site-document', '/admin/api/cms/data/tables', '/admin/api/cms/data/tables/components/rows']) {
  try { const r = await api('GET', p); fs.writeFileSync(path.join(HERE, 'get' + p.replace(/\W+/g, '_') + '.json'), JSON.stringify(r)); console.log(p, 'OK', JSON.stringify(r).length, JSON.stringify(r).slice(0, 300)) } catch (e) { console.log(p, '!!', e.message.slice(0, 120)) }
}
