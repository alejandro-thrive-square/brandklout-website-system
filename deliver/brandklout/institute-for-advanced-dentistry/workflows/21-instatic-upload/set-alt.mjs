#!/usr/bin/env node
/**
 * Step 1b — put every image's WordPress alt text into the MEDIA LIBRARY, because that is the only
 * place Instatic reads it from (trap 28): `importHtml` reports alt per node and never stores it,
 * and base.image renders `alt` from the library asset. Skip this and every image on the clone
 * publishes with alt="".
 *
 * Source of truth: .tmp/wp/alts.json, written by prepare-wp.mjs from every <img> on every
 * WordPress page. It is exact per usage: where WordPress shows one file with different alts,
 * each alt has its own asset key (`<path>#aN`), so nothing has to win. "" means decorative, and
 * is set too, so an asset that once carried a caption is cleared.
 *
 * Usage:
 *   node set-alt.mjs            dry run
 *   node set-alt.mjs --apply    > .tmp/set-alt.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(HERE, '.tmp')
const apply = process.argv.includes('--apply')

const { map } = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map-wp.json'), 'utf8'))
const alts = JSON.parse(fs.readFileSync(path.join(TMP, 'wp', 'alts.json'), 'utf8'))

const live = await api('GET', '/admin/api/cms/media')
const byId = new Map((live.assets ?? live.items ?? live).map((a) => [a.id, a]))

let set = 0
let already = 0
let missing = 0
for (const [key, wanted] of Object.entries(alts).sort()) {
  const hit = map[key]
  if (!hit) {
    console.log(`MISS  ${key} is not in media-map-wp.json`)
    missing++
    continue
  }
  if ((byId.get(hit.id)?.altText ?? '') === wanted) {
    already++
    continue
  }
  if (apply) {
    await api('PATCH', `/admin/api/cms/media/${hit.id}`, { altText: wanted })
    set++
  } else console.log(`would set  ${key.slice(-60).padEnd(60)} "${wanted.slice(0, 70)}"`)
}
console.log(`\n${Object.keys(alts).length} image key(s); ${already} already correct, ${apply ? set + ' set' : 'dry run'}${missing ? `, ${missing} not in the library` : ''}.`)
process.exitCode = missing ? 1 : 0
