#!/usr/bin/env node
/**
 * Repair the truncated draft copy of `src/styles/site.css`.
 *
 * What happened: a chunked push lost its opening ~13.7 KB. The draft file
 * begins with the banner comment and then a dangling declaration tail —
 *
 *     /* Dr. Nahlah design system, one file. Filled in chunks. *\/
 *      cubic-bezier(.22,1,.36,1)}
 *
 * — so the fluid-root token block, the reset, and the whole nav/button base
 * layer are simply absent. The live site is unaffected only because nobody has
 * published since. The next publish ships it.
 *
 * The restore source is the LIVE PUBLISHED BUNDLE, not a local file. Instatic
 * concatenates every enabled stylesheet into `/_instatic/css/userStyles-<hash>.css`,
 * wrapping each with a `/* <path> *\/` banner (`src/core/publisher/userStylesheets.ts`),
 * so the published bundle contains a verbatim copy of what the draft should hold.
 * Deriving it at run time means this cannot restore a stale local snapshot.
 *
 *   node repair-site-css.mjs          # dry run: report the diff, write nothing
 *   node repair-site-css.mjs --apply  # save the shell, then verify by re-reading
 *
 * It deliberately does NOT publish. Publishing ships the whole draft including
 * anyone else's in-progress work, so that stays a separate, announced step.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BASE, getSite, saveShell, styleFile } from './insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '.tmp')
const TARGET = 'src/styles/site.css'

/** Pull the published bundle and cut out one source file's segment. */
async function publishedCopy(path) {
  const homepage = await fetch(`${BASE}/`).then((r) => r.text())
  const href = homepage.match(/href="(\/_instatic\/css\/userStyles-[a-f0-9]+\.css)"/)?.[1]
  if (!href) throw new Error('no userStyles bundle linked from the homepage')

  const bundle = await fetch(`${BASE}${href}`).then((r) => r.text())
  const banner = `/* ${path} */`
  const start = bundle.indexOf(banner)
  if (start < 0) throw new Error(`${path} is not in the published bundle`)

  // The segment runs from just after this banner to the next banner, or EOF.
  const bodyStart = start + banner.length + 1
  const next = bundle.slice(bodyStart).search(/^\/\* src\/[^*]+ \*\/$/m)
  const body = next < 0 ? bundle.slice(bodyStart) : bundle.slice(bodyStart, bodyStart + next)
  return { href, content: body.replace(/\s+$/, '') }
}

/**
 * A file whose first non-comment line cannot start a rule is truncated. This
 * is the specific corruption we are repairing, and asserting it keeps the
 * script from "restoring" over a legitimately edited draft.
 */
function looksTruncated(css) {
  const firstCode = css
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('/*') && !l.startsWith('*'))
  if (!firstCode) return false
  return firstCode.endsWith('}') && !firstCode.includes('{')
}

const apply = process.argv.includes('--apply')

const { site: shell, seq } = await getSite()
const file = styleFile(shell, TARGET)
if (!file) throw new Error(`${TARGET} is not a stylesheet on this shell`)

const { href, content: restored } = await publishedCopy(TARGET)
const current = file.content ?? ''

mkdirSync(TMP, { recursive: true })
writeFileSync(join(TMP, 'site.css.draft-before'), current, 'utf8')
writeFileSync(join(TMP, 'site.css.published'), restored, 'utf8')

console.log(`shell seq            ${seq}`)
console.log(`published bundle     ${href}`)
console.log(`draft ${TARGET}      ${current.length} chars${looksTruncated(current) ? '  << TRUNCATED' : ''}`)
console.log(`published copy       ${restored.length} chars`)

if (current === restored) {
  console.log('\nalready in sync — nothing to do')
  process.exit(0)
}
if (!looksTruncated(current)) {
  console.error('\nrefusing to overwrite: the draft does not show the truncation signature.')
  console.error('Someone may have edited it legitimately. Inspect .tmp/site.css.draft-before first.')
  process.exit(1)
}
if (!apply) {
  console.log(`\nwould restore ${restored.length - current.length} chars. Re-run with --apply.`)
  process.exit(0)
}

file.content = restored
const saved = await saveShell(shell, seq)
console.log(`\nsaved — new seq ${saved.seq}`)

// Verify against a fresh read, never against the object we just sent.
const { site: after } = await getSite()
const verified = styleFile(after, TARGET)?.content ?? ''
if (verified !== restored) {
  console.error(`VERIFY FAILED: read back ${verified.length} chars, expected ${restored.length}`)
  process.exit(1)
}
console.log(`verified — draft ${TARGET} is now ${verified.length} chars and matches the live site`)
console.log('\nThe draft is now safe to publish. Publishing is a separate step (it ships the whole draft).')
