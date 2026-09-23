#!/usr/bin/env node
/**
 * Move the SITE DOCUMENT between two Instatic instances — the whole site minus
 * media bytes. Used both directions:
 *
 *   seed     production -> staging   (strategy: replace)
 *   promote  staging    -> production (strategy: merge-overwrite, with --rows)
 *
 *   node clone-site.mjs --from https://www.drnahlah.com \
 *                       --to   https://staging.drnahlah.com \
 *                       --strategy replace
 *
 *   node clone-site.mjs --from https://staging.drnahlah.com \
 *                       --to   https://www.drnahlah.com \
 *                       --strategy merge-overwrite --rows about,contact
 *
 *   --dry     export only, write the bundle, import nothing
 *   --out     where to keep the bundle (default ./.tmp/bundle-<ts>.zip)
 *   --media   include media rows AND bytes (seeding only; --strategy replace only)
 *
 * WHY THIS AND NOT A VOLUME COPY
 * ------------------------------
 * Measured on Dr. Nahlah, 2026-08-31: the site document is 4.88 MB and moves
 * in ~3 s. The volume holding it is 5.2 GB — a 1.48 GB SQLite file that is
 * ~97% version history — and `railway volume files download` runs at 170 KB/s,
 * so the same clone by volume is ~2.5 h down plus ~2.5 h up, plus 3,478
 * individual file transfers. Never clone by volume.
 *
 * WHAT THIS DOES NOT CARRY — see staging-clone.md
 *   plugins, srcset variants, users/authorship, and the per-row publish state
 *   of collection rows. Media rows and bytes travel only with --media.
 *
 * PROMOTING TO PRODUCTION: always leave media out. Because media is untouched,
 * production keeps its media rows and its srcset variants — which a
 * media-bearing import would NOT preserve. --media refuses any strategy but
 * `replace` for exactly this reason.
 */
import { writeFileSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { session, login, mb } from './lib.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = argv.indexOf('--' + name)
  return i === -1 ? fallback : argv[i + 1]
}
const has = (name) => argv.includes('--' + name)

const FROM = flag('from')
const TO = flag('to')
const STRATEGY = flag('strategy', 'replace')
const ROWS = (flag('rows') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const DRY = has('dry')

// --media: put media ROWS AND BYTES in the same archive. Off by default.
//
// Dr. Nahlah could not use this — 535 MB against a ~95 MB edge limit — which is
// why pull-media.js and chunk-media.py exist. Mason Park's uploads are 41 MB and
// the whole archive is 31 MB, so one import does what three steps did there.
// Check `--dry` (or /export/estimate) against MAX before reaching for it.
//
// SEEDING ONLY. Never promote media back to production: an import that carries
// media rewrites production's media rows and DESTROYS its srcset variants, which
// are generated at upload and are not in any archive. The guard below enforces it.
const MEDIA = has('media')

if (!FROM || (!TO && !DRY)) {
  console.error('usage: node clone-site.mjs --from <url> --to <url> [--strategy replace|merge-add|merge-overwrite] [--rows a,b] [--media] [--dry] [--out file.zip]')
  process.exit(2)
}
if (!['replace', 'merge-add', 'merge-overwrite'].includes(STRATEGY)) {
  console.error(`invalid --strategy ${STRATEGY}`)
  process.exit(2)
}
if (TO && FROM.replace(/\/+$/, '') === TO.replace(/\/+$/, '')) {
  console.error('--from and --to are the same instance; refusing')
  process.exit(2)
}

const OUT = flag('out', join(HERE, '.tmp', `bundle-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`))
mkdirSync(dirname(OUT), { recursive: true })

// ── export ────────────────────────────────────────────────────────────────
// Export needs no step-up (only `data.export`); import does.
// A media-bearing import overwrites the target's media rows and loses its
// variants. That is fine for a throwaway staging seed and never fine for the
// live site, so --media and a merge strategy (how a promotion is spelled)
// cannot be combined.
if (MEDIA && STRATEGY !== 'replace') {
  console.error(`--media is a SEEDING option and only valid with --strategy replace (got ${STRATEGY}).`)
  console.error('Promoting to production must never carry media: it would destroy production\'s srcset variants.')
  process.exit(2)
}

const fromCookie = await login(FROM)
const body = { includeMedia: MEDIA, includeSite: true }
if (ROWS.length) body.rowIds = ROWS

const est = await fetch(FROM + '/admin/api/cms/export/estimate', {
  method: 'POST', headers: { 'content-type': 'application/json', cookie: fromCookie, origin: FROM },
  body: JSON.stringify(body),
}).then((r) => r.json()).catch(() => ({}))
console.log(`source   ${FROM}`)
console.log(`estimate ${mb(est.bytes ?? 0)}${ROWS.length ? `  (rows: ${ROWS.join(', ')})` : '  (whole document)'}${MEDIA ? '  +MEDIA (rows and bytes)' : ''}`)

const t0 = Date.now()
const ex = await fetch(FROM + '/admin/api/cms/export', {
  method: 'POST', headers: { 'content-type': 'application/json', cookie: fromCookie, origin: FROM },
  body: JSON.stringify(body),
})
if (!ex.ok) { console.error('export failed', ex.status, (await ex.text()).slice(0, 300)); process.exit(1) }
const bytes = Buffer.from(await ex.arrayBuffer())
if (bytes.subarray(0, 4).toString('hex') !== '504b0304') { console.error('export did not return a zip'); process.exit(1) }
writeFileSync(OUT, bytes)
console.log(`exported ${mb(bytes.length)} in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${OUT}`)

if (DRY) { console.log('\n--dry: nothing imported'); process.exit(0) }

// Railway's edge rejects a body this big with 413, on Content-Length, in ~1 s.
// The document alone is a few MB, so this only trips under --media on a
// media-heavy site (Dr. Nahlah: 535 MB). Then use chunk-media.py + pull-media.js.
const MAX = 95 * 1024 * 1024
if (statSync(OUT).size > MAX) {
  console.error(`bundle is ${mb(statSync(OUT).size)} — over the ~95 MB the Railway edge accepts (413). Use chunk-media.py.`)
  process.exit(1)
}

// ── import ────────────────────────────────────────────────────────────────
console.log(`\ntarget   ${TO}`)
console.log(`strategy ${STRATEGY}`)
const toCookie = await session(TO)          // login + step-up; import is gated
const t1 = Date.now()
const r = await fetch(`${TO}/admin/api/cms/import/archive?strategy=${STRATEGY}`, {
  method: 'POST', headers: { 'content-type': 'application/zip', cookie: toCookie, origin: TO },
  body: readFileSync(OUT),
})
const txt = await r.text()
console.log(`import ${r.status} in ${((Date.now() - t1) / 1000).toFixed(1)}s`)
console.log(txt.slice(0, 500))
if (!r.ok) process.exit(1)

console.log(`
NEXT — none of these are optional, and all three fail SILENTLY:
  1. collection rows imported here are NOT publicly live yet:
       node publish-rows.mjs --site ${TO} --table posts
  2. plugins do not travel; the target's SEO layer is absent until:
       node clone-plugins.mjs --from ${FROM} --to ${TO}
  3. publish the site, then prove it:
       node diff-sites.mjs --a ${FROM} --b ${TO}`)
