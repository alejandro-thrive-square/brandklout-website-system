/**
 * Write `site-tags.js` into the site shell as the code asset `src/scripts/000-brandklout-tags.js`.
 *
 *   node push-tags.mjs            dry run
 *   node push-tags.mjs --apply    writes the draft (does NOT publish)
 *
 * Shell-only, `mode: 'incremental'` with no `changedPages`, so nothing a person has edited in the
 * admin is disturbed. `push-wp.mjs` rebuilds `files` from the live list minus site.css/site.js, so
 * this asset survives a full re-push of the WordPress clone.
 *
 * The path matters: classic script assets are served in path order, so `000-` runs before
 * `brandklout-consent-bridge.js` and before the `site.js` module. Renaming it re-orders the head.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { getSite, saveShell } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ASSET = 'src/scripts/000-brandklout-tags.js'
const apply = process.argv.includes('--apply')

const content = fs.readFileSync(path.join(HERE, 'site-tags.js'), 'utf8')
const { site, seq } = await getSite()
const existing = (site.files ?? []).find((f) => f.path === ASSET)

console.log(`site       seq ${seq}, ${site.files.length} code asset(s)`)
for (const f of site.files ?? []) console.log(`  ${f.path.padEnd(42)} ${f.type}  ${f.content.length} bytes`)

if (existing && existing.content === content) {
  console.log(`\n${ASSET} is already identical — nothing to do.`)
  process.exit(0)
}
console.log(`\n${existing ? 'replacing' : 'adding'}   ${ASSET}  ${content.length} bytes`)
if (!apply) {
  console.log('\ndry run — re-run with --apply to write the draft')
  process.exit(0)
}

const now = Date.now()
const files = [
  ...(site.files ?? []).filter((f) => f.path !== ASSET),
  {
    id: existing?.id ?? crypto.randomBytes(16).toString('base64url').slice(0, 21),
    path: ASSET,
    type: 'script',
    content,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  },
]
const res = await saveShell({ ...site, files }, seq)
console.log('saved:', JSON.stringify(res).slice(0, 200))
console.log('\ndraft written. Publish separately — a publish bakes EVERY page.')
