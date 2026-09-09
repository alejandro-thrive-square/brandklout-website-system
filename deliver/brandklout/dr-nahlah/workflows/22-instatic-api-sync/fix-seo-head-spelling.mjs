#!/usr/bin/env node
/**
 * The last "recognised" on the site, which is not in any page.
 *
 * `/meet-dr-nahlah`'s og:description carries it, and per-page descriptions on
 * this platform come from `src/scripts/seo-head.js` — a generated runtime script
 * — because Instatic's publisher has exactly ONE site-wide description slot and
 * no per-page equivalent (see 15-instatic-api-sync.md, "SEO metadata: where it
 * actually lives"). So the string lives in a code asset, invisible to any page
 * edit and to a grep of the published HTML.
 *
 * A surgical single-string replacement rather than a regenerate-and-push: the
 * generator would rewrite all 48 KB and this needs to change 1 character, so
 * a targeted edit is the change that can be read and verified. Refuses to run
 * unless it finds exactly one occurrence.
 *
 *   node fix-seo-head-spelling.mjs [--apply]
 *
 * Draft only. Publishing is a separate step.
 */
import { getSite, saveShell } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const ASSET = 'src/scripts/seo-head.js'
const FROM = 'recognised'
const TO = 'recognized'

const { site, seq } = await getSite()
const file = (site.files ?? []).find((f) => f.path === ASSET)
if (!file) throw new Error(`no code asset at ${ASSET}`)

const before = file.content ?? ''
const hits = (before.match(new RegExp(FROM, 'g')) ?? []).length
console.log(`${ASSET}: ${before.length} bytes, ${hits} occurrence(s) of "${FROM}"`)

if (hits === 0) { console.log('nothing to do.'); process.exit(0) }
if (hits !== 1) {
  console.error(`refusing: expected exactly 1 occurrence, found ${hits}. `
    + 'Check each one by hand — this script cannot tell them apart.')
  process.exit(1)
}

const i = before.indexOf(FROM)
console.log(`context: ...${JSON.stringify(before.slice(i - 90, i + 70))}...`)

const after = before.replace(FROM, TO)
/* Same length, one letter different. Anything else means the replace hit
   something it should not have. */
if (after.length !== before.length) throw new Error('length changed — aborting')

if (!APPLY) {
  console.log('\ndry run — nothing written. Re-run with --apply.')
  process.exit(0)
}

file.content = after
const saved = await saveShell(site, seq)
console.log(`saved — seq ${seq} -> ${saved.seq}`)

/* Read back: this platform reports some write failures as prose with a 200,
   and a code-asset write is exactly where that has bitten before. */
const fresh = await getSite()
const got = (fresh.site.files ?? []).find((f) => f.path === ASSET)?.content ?? ''
if (got.length !== after.length) throw new Error(`read-back length ${got.length}, expected ${after.length}`)
if (got.includes(FROM)) throw new Error(`read-back still contains "${FROM}"`)
if (!got.includes(TO)) throw new Error(`read-back does not contain "${TO}"`)
console.log(`verified — ${got.length} bytes, "${FROM}" gone, "${TO}" present`)
console.log('\nDRAFT only. `node insta-api.mjs publish` is a separate step.')
