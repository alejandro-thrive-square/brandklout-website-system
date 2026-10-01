/**
 * Put `legal-footer-wrap.css` into production's `src/styles/site.css` shell asset, and publish.
 * Same mechanics as push-light-page-header.mjs: a fenced block, so a re-run replaces it.
 *
 *   node push-legal-footer-wrap.mjs            dry run
 *   node push-legal-footer-wrap.mjs --apply    save the shell and publish
 *
 * Shell-only save (`saveShell` sends no pages). Refuses if the draft differs from live, and refuses to
 * publish if any page row changed while it ran. `build-wp.mjs` appends the same file.
 */
import fs from 'node:fs'
import path from 'node:path'
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
const toolkit = path.resolve(HERE, '../../../../..', 'deliver/process/tools/instatic-api-sync/insta-api.mjs')
const { getSite, getPages, saveShell, publish, publishStatus, BASE } = await import(pathToFileURL(toolkit).href)

const ASSET = 'src/styles/site.css'
const BLOCK = fs.readFileSync(path.join(HERE, 'legal-footer-wrap.css'), 'utf8').replace(/\r\n/g, '\n').trim()
const FENCE = /\/\* legal-footer-wrap:[\s\S]*?\/\* \/legal-footer-wrap \*\//
const apply = process.argv.includes('--apply')

const host = new URL(BASE).hostname
if (!['www.ifadentistry.com', 'institute-for-advanced-dentistry-production.up.railway.app'].includes(host)) throw new Error(`refusing: ${host} is not IFA production`)
const status = await publishStatus()
console.log(`host       ${BASE}`)
console.log(`status     draftMatchesPublished=${status.draftMatchesPublished}`)

const { site, seq } = await getSite()
const file = (site.files ?? []).find((f) => f.path === ASSET)
if (!file) throw new Error(`no ${ASSET} on this site`)
const content = FENCE.test(file.content) ? file.content.replace(FENCE, BLOCK) : file.content.replace(/\s*$/, '\n\n') + BLOCK + '\n'
if (content === file.content) { console.log('already in place: nothing to do'); process.exit(0) }
console.log(`${ASSET}  ${file.content.length} -> ${content.length} bytes (${FENCE.test(file.content) ? 'replace' : 'append'})`)
if (!apply) { console.log('\ndry run: --apply to save and publish'); process.exit(0) }
if (status.draftMatchesPublished !== true) throw new Error('draft differs from live: publish or discard it first')

const fp = (rs) => rs.map((r) => `${r.id}:${r.seq}:${r.updatedAt}`).sort().join('|')
const rowsBefore = fp((await getPages()).rows)
await saveShell({ ...site, files: site.files.map((f) => (f.path === ASSET ? { ...f, content } : f)) }, seq)
console.log('saved')
if (fp((await getPages()).rows) !== rowsBefore) { console.error('NOT PUBLISHING: a page row changed while this ran'); process.exit(1) }
console.log(`published  ${JSON.stringify(await publish()).slice(0, 200)}`)
console.log(`status     ${JSON.stringify(await publishStatus())}`)
