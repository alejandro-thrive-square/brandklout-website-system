/**
 * Staging API snapshot before a forced push: the site shell (with seq) and every page row, gzipped into
 * .tmp/. Read-only. The DB copy (VACUUM INTO on the container) is the other half; see the runbook.
 *
 * Usage: INSTATIC_BASE_URL=https://staging.ifadentistry.com node push/snapshot.mjs <label> > push/.tmp/snapshot.log 2>&1
 */
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, BASE } from '../../../../../tools/instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
const label = process.argv[2] || new Date().toISOString().slice(0, 10)
const { site, seq } = await getSite()
const pages = (await getPages()).rows ?? []
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '.tmp')
fs.mkdirSync(dir, { recursive: true })
const out = path.join(dir, `staging-snapshot-${label}-seq${seq}.json.gz`)
fs.writeFileSync(out, zlib.gzipSync(JSON.stringify({ base: BASE, seq, takenAt: new Date().toISOString(), site, pages })))
console.log(`seq ${seq}, ${pages.length} page(s) -> ${out}`)
