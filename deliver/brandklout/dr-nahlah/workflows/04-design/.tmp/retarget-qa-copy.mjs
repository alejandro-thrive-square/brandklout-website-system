#!/usr/bin/env node
/**
 * retarget-qa-copy.mjs — bring the LOCAL source in line with the QA 2026-09-28
 * copy fixes that went live through 22-instatic-api-sync/push-copy-fixes.mjs, so a
 * rebuild cannot put the old copy back. Same idea as retarget-sedation-copy.mjs.
 *
 *   node retarget-qa-copy.mjs            # report
 *   node retarget-qa-copy.mjs --apply
 *
 *  - site-src/pages/*.html and partials/*.html: copy-fixes-qa-1 RULES applied to
 *    text between tags only (entities decoded for the match, the changed run
 *    re-encoded), never to attributes, so no href or src moves.
 *  - site-src/seo.json: title / desc / ogTitle / ogDesc taken from production
 *    (page title cell; OG override title + description), the post-fix values.
 *    CRLF + 2-space indent, as the file is.
 *  - 13-content-export-import/.tmp/posts.json: title, seoTitle, seoDescription and
 *    body of each post taken from the live posts rows (copy-fixes-qa-1/-2/-3).
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { isDeepStrictEqual } from 'node:util'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const SYNC = join(HERE, '..', '..', '22-instatic-api-sync')
const { api, getPages } = await import(pathToFileURL(join(SYNC, 'sedation-api.mjs')).href)
const { RULES } = await import(pathToFileURL(join(SYNC, 'copy-fixes-qa-1.mjs')).href)

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const rules = RULES.map((r) => ({ ...r, re: r.from instanceof RegExp ? r.from : new RegExp(r.word ? `(?<![\\w/-])${esc(r.from)}(?![\\w-])` : esc(r.from), 'g') }))
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', middot: '·', ndash: '–', mdash: '—', nbsp: ' ', reg: '®', hellip: '…', times: '×', rarr: '→' }
const decode = (s) => s.replace(/&(#\d+|#x[0-9a-f]+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : ENT[e] ?? m)
const encode = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
let total = 0
const report = []
const fixText = (t, where) => {
  let out = decode(t)
  const before = out
  for (const r of rules) {
    if (r.only && !r.only('page', where, 'text')) continue
    out = out.replace(r.re, (m, ...a) => { total++; report.push(`${where}: ${m} -> ${typeof r.to === 'function' ? r.to(m, ...a) : r.to}`); return typeof r.to === 'function' ? r.to(m, ...a) : m.replace(new RegExp(r.re.source, r.re.flags.replace('g', '')), r.to) })
  }
  return out === before ? t : encode(out)
}
const SRC = join(HERE, 'site-src')
const htmlFiles = [...readdirSync(join(SRC, 'pages')).map((f) => join(SRC, 'pages', f)), ...readdirSync(join(SRC, 'partials')).map((f) => join(SRC, 'partials', f))].filter((f) => f.endsWith('.html'))
const writes = []
for (const f of htmlFiles) {
  const s = readFileSync(f, 'utf8')
  const where = f.replace(/^.*[\\/]/, '').replace(/\.body\.html$|\.html$/, '')
  const t = s.replace(/(^|>)([^<]+)(?=<|$)/g, (_, a, txt) => a + fixText(txt, where === 'home' ? 'index' : where))
  if (t !== s) writes.push([f, t])
}

// seo.json from production
const seoPath = join(SRC, 'seo.json')
const seoRaw = readFileSync(seoPath, 'utf8')
const seo = JSON.parse(seoRaw)
const og = new Map(((await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages')).pages ?? []).filter((p) => p.kind === 'page').map((p) => [p.slug, p]))
const rows = new Map((await getPages()).rows.map((r) => [r.cells.slug, r]))
let seoChanged = 0
for (const [slug, e] of Object.entries(seo)) {
  const r = rows.get(slug), o = og.get(slug)?.override
  if (!r) continue
  const next = { ...e, title: r.cells.title, ...(o?.description ? { desc: o.description } : {}) }
  for (const k of ['title', 'desc']) if (next[k] !== e[k]) { seoChanged++; report.push(`seo.json ${slug}.${k}: ${e[k]} -> ${next[k]}`) }
  seo[slug] = next
}
/* In place, value by value: the file's indentation is mixed from earlier hand edits,
   so re-serialising it rewrites all 3,500 lines (the runbook's seo.json trap). */
if (seoChanged) {
  let raw = seoRaw
  const orig = JSON.parse(seoRaw)
  for (const [slug, e] of Object.entries(seo)) for (const k of ['title', 'desc']) {
    if (e[k] === orig[slug][k]) continue
    const from = `"${k}": ${JSON.stringify(orig[slug][k])}`
    const at = raw.indexOf(`"${slug}": {`)
    const i = raw.indexOf(from, at)
    if (at < 0 || i < 0) throw new Error(`seo.json: cannot find ${slug}.${k}`)
    raw = raw.slice(0, i) + `"${k}": ${JSON.stringify(e[k])}` + raw.slice(i + from.length)
  }
  if (!isDeepStrictEqual(JSON.parse(raw), seo)) throw new Error('seo.json in-place edit does not equal the plan')
  writes.push([seoPath, raw])
}

// posts.json from the live rows
const postsPath = join(HERE, '..', '..', '13-content-export-import', '.tmp', 'posts.json')
const postsRaw = readFileSync(postsPath, 'utf8')
const posts = JSON.parse(postsRaw)
const live = new Map(((await api('GET', '/admin/api/cms/data/tables/posts/rows')).rows ?? []).map((p) => [p.cells.slug, p.cells]))
let postsChanged = 0
for (const p of posts) {
  const l = live.get(p.slug)
  if (!l) { report.push(`posts.json ${p.slug}: not live — left`); continue }
  for (const k of ['title', 'seoTitle', 'seoDescription', 'body']) if (typeof l[k] === 'string' && l[k] !== p[k]) { p[k] = l[k]; postsChanged++ }
}
/* Written the way the Python exporter wrote it: 1-space indent, non-ASCII as \uXXXX
   (json.dumps ensure_ascii), so only the changed fields show in a diff. */
const indent = /^\[\r?\n( +)\{/.exec(postsRaw)?.[1]?.length ?? 1
const eol = postsRaw.includes('\r\n') ? '\r\n' : '\n'
const asciiJson = (v) => JSON.stringify(v, null, indent).replace(/[\u007f-￿]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
if (postsChanged) writes.push([postsPath, asciiJson(posts).replace(/\n/g, eol) + (/\r?\n$/.test(postsRaw) ? eol : '')])

console.log(report.slice(0, 40).join('\n'))
console.log(`\n${total} text fix(es) in ${writes.filter(([f]) => f.endsWith('.html')).length} html file(s); seo.json ${seoChanged} field(s); posts.json ${postsChanged} field(s)`)
if (!APPLY) { console.log('report only — pass --apply'); process.exit(0) }
for (const [f, t] of writes) writeFileSync(f, t)
console.log(`wrote ${writes.length} file(s)`)
