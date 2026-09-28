/**
 * Find every mention of the closed Phoenix office on an IFA Instatic instance: page nodes (text,
 * hrefs, every prop), page SEO cells, and the shell's code/style/settings files.
 *
 *   node scan-phoenix.mjs            production (the worktree .env)
 *
 * Read-only. Prints one line per hit: where it is and the text around it.
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
const TOOL = 'deliver/process/tools/instatic-api-sync/insta-api.mjs'
let toolkit = path.resolve(HERE, '../../../../../../..', TOOL)
if (!fs.existsSync(toolkit)) {
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: HERE })
  toolkit = path.join(path.dirname(String(common).trim()), TOOL)
}
const { getSite, getPages, BASE } = await import(pathToFileURL(toolkit).href)

export const PHOENIX = /phoenix|central\s+ave|85012|3443\s+n/i

const around = (s, i) => s.slice(Math.max(0, i - 70), i + 90).replace(/\s+/g, ' ')
function hits(s) {
  const out = []
  const re = new RegExp(PHOENIX.source, 'gi')
  for (let m; (m = re.exec(s)); ) out.push(around(s, m.index))
  return out
}

console.log(`host ${BASE}\n`)
const { rows } = await getPages()
let n = 0
for (const row of rows) {
  const slug = row.cells?.slug ?? row.slug
  for (const [k, v] of Object.entries(row.cells ?? {})) {
    if (k === 'body' || typeof v !== 'string') continue
    for (const h of hits(v)) { n++; console.log(`page ${slug}  cell ${k}: ${h}`) }
  }
  for (const node of Object.values(row.cells?.body?.nodes ?? {})) {
    const s = JSON.stringify(node.props ?? {}) + JSON.stringify(node.breakpointOverrides ?? {})
    for (const h of hits(s)) { n++; console.log(`page ${slug}  node ${node.id} ${node.moduleId}: ${h}`) }
  }
}
const { site } = await getSite()
for (const f of site.files ?? []) {
  const s = typeof f.content === 'string' ? f.content : JSON.stringify(f)
  for (const h of hits(s)) { n++; console.log(`file ${f.path}: ${h}`) }
}
const rest = JSON.stringify({ ...site, files: undefined })
for (const h of hits(rest)) { n++; console.log(`shell: ${h}`) }
console.log(`\n${n} hit(s) on ${rows.length} pages`)
