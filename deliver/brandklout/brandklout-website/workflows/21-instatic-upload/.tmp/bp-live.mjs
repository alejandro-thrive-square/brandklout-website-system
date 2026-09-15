import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
for (const line of fs.readFileSync(path.resolve(HERE, '../../../../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { getSite } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const s = (await getSite()).site
const old = JSON.parse(fs.readFileSync(path.join(HERE, 'backup-2026-09-14-seq21', 'site.json'), 'utf8')).site
const show = (x) => ({ breakpoints: (x.breakpoints ?? []).map((b) => `${b.id}:${b.width}${b.label ? ' ' + b.label : ''}`), conditions: (x.conditions ?? []).map((c) => `${c.id}: @${c.condition?.kind} ${c.condition?.query}`) })
console.log('SEQ21', JSON.stringify(show(old), null, 1))
console.log('NOW  ', JSON.stringify(show(s), null, 1))
