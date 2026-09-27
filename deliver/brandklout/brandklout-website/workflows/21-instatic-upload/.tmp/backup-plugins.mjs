import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
for (const line of fs.readFileSync(path.resolve(HERE, '../../../../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { api } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const out = {}
out.list = await api('GET', '/admin/api/cms/plugins').catch((e) => String(e))
out.embedOrigins = await api('GET', '/admin/api/cms/plugins/brandklout.embed-origins/settings').catch((e) => String(e))
fs.writeFileSync(path.join(HERE, 'backup-2026-09-14-seq21', 'plugins.json'), JSON.stringify(out, null, 1))
console.log(JSON.stringify(out.embedOrigins).slice(0, 600))
