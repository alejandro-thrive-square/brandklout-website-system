#!/usr/bin/env node
/**
 * push-script-asset.mjs — replace one code asset's content, headlessly.
 *
 *   node push-script-asset.mjs src/scripts/site.js workflows/03-design-build/.tmp/site-src/dist/assets/site.js [--apply]
 *
 * ## Why this exists next to the old Dr. Nahlah push-site-js.mjs (client branch, 13-content-export-import)
 *
 * That one drives the MCP bridge, which needs the editor open in a browser, and it
 * writes in ~10 KB chunks because the bridge could not carry the whole file. Both
 * of those cost real time and both have bitten: the chunked path silently truncated
 * the draft `site.css` once, losing its opening 13.7 KB.
 *
 * Code assets are just entries in the site shell (`files[]`, with `content` inline),
 * and `PUT /site-document` is atomic with an optimistic seq check. So the whole file
 * goes in one write, and a concurrent edit is rejected rather than interleaved.
 *
 * The banner and the `__wz_end__` sentinel are preserved exactly as the original
 * push wrote them: the sentinel is how a truncated write is detected later, so a
 * push that dropped it would disarm that check.
 *
 * Nothing here publishes. Run `node insta-api.mjs publish` when the draft is right.
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, saveShell } from './insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const [assetPath, localPath] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const apply = process.argv.includes('--apply')

if (!assetPath || !localPath) {
  console.error('usage: push-script-asset.mjs <asset path> <local file> [--apply]')
  process.exit(2)
}

const BANNER = '/* Dr. Nahlah runtime: WZ, every section module, the boot sequence. One file. */\n'
const SENTINEL = '/*__wz_end__*/'

const local = readFileSync(resolve(HERE, localPath), 'utf8')
const { site: shell, seq } = await getSite()
const file = (shell.files ?? []).find((f) => f.path === assetPath)
if (!file) {
  console.error(`no code asset at ${assetPath}`)
  process.exit(1)
}

// Reuse whatever wrapper is already on the asset rather than assuming one, so this
// stays correct for assets the banner was never applied to.
const hadBanner = file.content.startsWith(BANNER)
const hadSentinel = file.content.trimEnd().endsWith(SENTINEL)
const next = (hadBanner ? BANNER : '') + local + (hadSentinel ? SENTINEL : '')

console.log(`asset      ${assetPath}  (id ${file.id})`)
console.log(`live       ${file.content.length} chars`)
console.log(`local      ${local.length} chars  -> ${next.length} with wrapper`)
console.log(`wrapper    banner=${hadBanner} sentinel=${hadSentinel}`)

if (next === file.content) {
  console.log('\nidentical — nothing to do')
  process.exit(0)
}
if (!apply) {
  console.log('\nDRY RUN — re-run with --apply')
  process.exit(0)
}

file.content = next
file.updatedAt = Date.now()
const res = await saveShell(shell, seq)

// Read back rather than trusting the write: this platform reports some failures as
// a 200 with a prose body (see instatic-api-sync.md).
const { site: after } = await getSite()
const written = (after.files ?? []).find((f) => f.path === assetPath)?.content ?? ''
const ok = written === next
console.log(`\nseq ${seq} -> ${res.seq}`)
console.log(`verified   ${written.length} chars, byte-exact: ${ok}`)
if (!ok) {
  console.error('WRITE DID NOT LAND — do not publish')
  process.exit(1)
}
console.log('\nDraft updated. Publish with: node insta-api.mjs publish')
