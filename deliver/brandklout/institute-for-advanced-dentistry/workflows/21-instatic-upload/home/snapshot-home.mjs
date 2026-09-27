/**
 * Staging API snapshot before a forced push: the site shell (with seq) and every page row, gzipped
 * into .tmp/home/. Read-only. Usage (from 21-instatic-upload/):
 *   INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/snapshot-home.mjs <label> > .tmp/home/snapshot.log 2>&1
 */
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
const label = process.argv[2] || new Date().toISOString().slice(0, 10)
const { site, seq } = await getSite()
const pages = (await getPages()).rows ?? []
const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../.tmp/home/staging-snapshot-${label}-seq${seq}.json.gz`)
fs.writeFileSync(out, zlib.gzipSync(JSON.stringify({ base: BASE, seq, takenAt: new Date().toISOString(), site, pages })))
console.log(`seq ${seq}, ${pages.length} page(s) -> ${out}`)
