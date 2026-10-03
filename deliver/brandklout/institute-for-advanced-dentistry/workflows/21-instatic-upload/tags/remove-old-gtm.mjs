/**
 * Remove the outgoing agency's Google Tag Manager container `GTM-K8N3JK3Q` from production.
 *
 *   node remove-old-gtm.mjs                     dry run
 *   node remove-old-gtm.mjs --apply             writes the draft and publishes
 *
 * The container reached Instatic with the WordPress clone: its inline bootstrap is one registry item
 * in the `src/scripts/site.js` shell asset, referenced from every page's head list. Blanked the way
 * UserWay was on 2026-09-12 — the code becomes a comment and the id stays in the dictionary, so no
 * page write is needed and every `data-wz-head` list still resolves. `GTM-5XR78DN7`
 * (`000-brandklout-tags.js`) is the practice's only container afterwards. `prepare-wp.mjs` skips the
 * same bootstrap, so a rebuild of the clone cannot bring it back.
 *
 * Refuses to run unless the draft matches what is live, so nothing unrelated ships with it.
 *
 * Loads the WORKTREE .env before the toolkit: `insta-api.mjs` walks up from its own folder, which in
 * a client worktree is the main checkout — a different client's INSTATIC_BASE_URL.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
for (let dir = HERE; ; dir = path.dirname(dir)) {
  const env = path.join(dir, '.env')
  if (fs.existsSync(env)) {
    // Parsed by hand: `node --env-file` ends a value at `#`, which truncated the password once.
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
let toolkit = path.resolve(HERE, '../../../../../..', TOOL)
if (!fs.existsSync(toolkit)) {
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: HERE })
  toolkit = path.join(path.dirname(String(common).trim()), TOOL)
}
const { getSite, saveShell, publish, publishStatus, BASE } = await import(pathToFileURL(toolkit).href)

const ASSET = 'src/scripts/site.js'
const OLD = 'GTM-K8N3JK3Q'
const NOTE = `/* ${OLD} removed 2026-09-28: the outgoing agency's container; GTM-5XR78DN7 (000-brandklout-tags.js) is the practice's only one */`
const apply = process.argv.includes('--apply')

if (!/ifadentistry|institute-for-advanced-dentistry/.test(BASE)) throw new Error(`refusing: ${BASE} is not an IFA instance`)
const status = await publishStatus()
console.log(`host       ${BASE}`)
console.log(`status     draftMatchesPublished=${status.draftMatchesPublished}`)

const { site, seq } = await getSite()
const file = (site.files ?? []).find((f) => f.path === ASSET)
if (!file) throw new Error(`no ${ASSET} on this site`)

const lines = file.content.split('\n')
const at = lines.findIndex((l) => l.startsWith('var D = '))
if (at < 0) throw new Error('registry line `var D = ` not found')
const tail = lines[at].match(/;?\s*$/)[0]
const D = JSON.parse(lines[at].slice('var D = '.length, lines[at].length - tail.length))

const hits = Object.entries(D).filter(([, v]) => v.t === 'js' && v.c.includes(OLD))
if (!hits.length) {
  console.log(`\n${OLD} is not in ${ASSET} — nothing to do.`)
  process.exit(0)
}
for (const [id, v] of hits) console.log(`blank      ${id}  (${v.c.length} bytes)`)
if (!apply) {
  console.log('\ndry run — re-run with --apply to write the draft and publish')
  process.exit(0)
}
if (status.draftMatchesPublished === false) throw new Error('draft differs from live — publish or discard it first')

for (const [id] of hits) D[id] = { ...D[id], c: NOTE }
lines[at] = 'var D = ' + JSON.stringify(D) + tail
const content = lines.join('\n')
if (content.includes(OLD + "');")) throw new Error('bootstrap still present after the edit')

const files = site.files.map((f) => (f.path === ASSET ? { ...f, content } : f))
await saveShell({ ...site, files }, seq)
console.log(`saved      ${ASSET}  ${file.content.length} → ${content.length} bytes`)
const pub = await publish()
console.log(`published  ${JSON.stringify(pub).slice(0, 200)}`)
