#!/usr/bin/env node
/**
 * READ-ONLY guard, Brandklout website migration. Compares the live DRAFT (shell, page rows,
 * components) with a dump made by ../dump-site.mjs, and says which kinds of field changed.
 *
 *   node state-diff.mjs <dump.json> --site brandklout-website:staging            # live vs dump
 *   node state-diff.mjs <dump-a.json> --against <dump-b.json>                    # two dumps
 *
 * Before a write: must print IDENTICAL (nobody edited the draft since the dump).
 * After a write: every changed path family is listed with a count and samples, so an unexpected
 * one (a page cell other than body, a template flag, a prop that is not a class) stands out.
 */
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const dumpPath = args[0]
const against = args.includes('--against') ? args[args.indexOf('--against') + 1] : null
const A = JSON.parse(readFileSync(dumpPath, 'utf8'))
let B
if (against) B = JSON.parse(readFileSync(against, 'utf8'))
else {
  const { connect } = await import(pathToFileURL(join(HERE, '..', '..', '..', 'target.mjs')).href)
  const { api, target } = await connect()
  const { site, seq } = await api.getSite()
  const { rows } = await api.getPages()
  const comps = (await api.api('GET', '/admin/api/cms/components')).rows ?? []
  B = { url: target.url, seq, site, rows, comps }
}
const parseBody = (cells) => {
  if (!cells) return cells
  const c = { ...cells }
  if (typeof c.body === 'string') { try { c.body = JSON.parse(c.body) } catch { /* markdown body */ } }
  return c
}
const VOLATILE = /(^|\.)(updatedAt|updated_at|seq|updatedByUserId|publishedAt|version)$/
const families = new Map()
const note = (path, x, y) => {
  if (VOLATILE.test(path)) return
  const fam = path
    .replace(/styleRules\.[^.]+/, 'styleRules.*')
    .replace(/nodes\.[^.]+/, 'nodes.*')
    .replace(/tokens\.\d+/, 'tokens.#')
    .replace(/\.\d+(?=\.|$)/g, '.#')
  const f = families.get(fam) ?? families.set(fam, { n: 0, samples: [] }).get(fam)
  f.n++
  if (f.samples.length < 3) f.samples.push(`${JSON.stringify(x)?.slice(0, 90)} -> ${JSON.stringify(y)?.slice(0, 90)}`)
}
const walk = (x, y, path) => {
  if (x === y) return
  if (x && y && typeof x === 'object' && typeof y === 'object') {
    for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], path ? `${path}.${k}` : k)
    return
  }
  note(path, x, y)
}
walk({ seq: A.seq }, { seq: B.seq }, 'shellSeqInfo')
console.log(`shell seq ${A.seq} -> ${B.seq}`)
walk(A.site, B.site, 'site')
const rowsA = new Map(A.rows.map((r) => [r.id, r]))
const rowsB = new Map(B.rows.map((r) => [r.id, r]))
for (const id of new Set([...rowsA.keys(), ...rowsB.keys()])) {
  const ra = rowsA.get(id), rb = rowsB.get(id)
  const slug = (ra ?? rb).cells?.slug
  if (!ra || !rb) { note(`page[${slug}] ROW`, ra ? 'present' : 'absent', rb ? 'present' : 'absent'); continue }
  if (ra.seq !== rb.seq) (families.get('page seq changed') ?? families.set('page seq changed', { n: 0, samples: [] }).get('page seq changed')).n++
  walk(parseBody(ra.cells), parseBody(rb.cells), 'page.cells')
  walk({ status: ra.status }, { status: rb.status }, 'page.row')
}
const compsA = new Map((A.comps ?? []).map((r) => [r.id, r]))
const compsB = new Map((B.comps ?? []).map((r) => [r.id, r]))
for (const id of new Set([...compsA.keys(), ...compsB.keys()])) {
  const ra = compsA.get(id), rb = compsB.get(id)
  if (!ra || !rb) { note('component ROW', ra ? 'present' : 'absent', rb ? 'present' : 'absent'); continue }
  walk(parseBody(ra.cells), parseBody(rb.cells), 'component.cells')
}
// template flags, explicitly
for (const r of B.rows) if (r.cells?.templateEnabled !== undefined || /template/.test(r.cells?.slug ?? '')) console.log(`template row ${r.cells.slug}: templateEnabled=${r.cells.templateEnabled} target=${JSON.stringify(r.cells.templateTarget)} priority=${r.cells.templatePriority}`)
if (!families.size) console.log('IDENTICAL (ignoring seq/updatedAt)')
else {
  console.log(`${families.size} path families changed:`)
  for (const [fam, f] of [...families].sort((p, q) => q[1].n - p[1].n)) {
    console.log(`  ${String(f.n).padStart(6)}  ${fam}`)
    for (const s of f.samples) console.log(`            ${s}`)
  }
}
