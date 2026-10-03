/**
 * Put `light-page-header.css` into production's `src/styles/site.css` shell asset, and publish.
 *
 *   node push-light-page-header.mjs            dry run
 *   node push-light-page-header.mjs --apply    save the shell and publish
 *
 * The block is fenced by `/* light-page-header` ... `/* /light-page-header *\/`; a re-run replaces
 * it rather than appending a second copy. `build-wp.mjs` appends the same file, so a rebuild of the
 * clone keeps it. Refuses to run unless the draft matches what is live.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
for (let dir = HERE; ; dir = path.dirname(dir)) {
  const env = path.join(dir, '.env')
  if (fs.existsSync(env)) {
    for (const l of fs.readFileSync(env, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
    break
  }
  if (path.dirname(dir) === dir) throw new Error('no .env above this script')
}
// Client worktrees carry no deliver/process; fall back to the main checkout's copy.
const TOOL = 'deliver/process/tools/instatic-api-sync/insta-api.mjs'
let toolkit = path.resolve(HERE, '../../../../..', TOOL)
if (!fs.existsSync(toolkit)) {
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: HERE })
  toolkit = path.join(path.dirname(String(common).trim()), TOOL)
}
const { getSite, saveShell, publish, publishStatus, BASE } = await import(pathToFileURL(toolkit).href)

const ASSET = 'src/styles/site.css'
const BLOCK = fs.readFileSync(path.join(HERE, 'light-page-header.css'), 'utf8').replace(/\r\n/g, '\n').trim()
const FENCE = /\/\* light-page-header:[\s\S]*?\/\* \/light-page-header \*\//
const apply = process.argv.includes('--apply')

if (!/ifadentistry|institute-for-advanced-dentistry/.test(BASE)) throw new Error(`refusing: ${BASE} is not an IFA instance`)
const status = await publishStatus()
console.log(`host       ${BASE}`)
console.log(`status     draftMatchesPublished=${status.draftMatchesPublished}`)

const { site, seq } = await getSite()
const file = (site.files ?? []).find((f) => f.path === ASSET)
if (!file) throw new Error(`no ${ASSET} on this site`)
const content = FENCE.test(file.content) ? file.content.replace(FENCE, BLOCK) : file.content.replace(/\s*$/, '\n\n') + BLOCK + '\n'
if (content === file.content) {
  console.log('already in place — nothing to do')
  process.exit(0)
}
console.log(`${ASSET}  ${file.content.length} → ${content.length} bytes (${FENCE.test(file.content) ? 'replace' : 'append'})`)
if (!apply) {
  console.log('\ndry run — re-run with --apply to save and publish')
  process.exit(0)
}
if (status.draftMatchesPublished === false) throw new Error('draft differs from live — publish or discard it first')

const files = site.files.map((f) => (f.path === ASSET ? { ...f, content } : f))
await saveShell({ ...site, files }, seq)
console.log('saved')
console.log(`published  ${JSON.stringify(await publish()).slice(0, 200)}`)
