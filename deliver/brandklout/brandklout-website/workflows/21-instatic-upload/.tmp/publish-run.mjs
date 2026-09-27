import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
for (const line of fs.readFileSync(path.resolve(HERE, '../../../../../../.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { publish, getSite } = await import("../../../../../process/22-instatic-api-sync/insta-api.mjs")
const r = await publish(); console.log(JSON.stringify(r).slice(0,300)); const s = await getSite()
console.log('seq', s.seq)
process.exit(s.seq === Number(process.argv[2]) ? 0 : 3)
