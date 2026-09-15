/**
 * cms-sync.mjs — the collections of cms-collections.mjs on the live instance: the table (create or
 * bring its fields/route in line), the rows (upsert by slug, cells replaced whole), and each row's
 * publish. Runs AFTER push-site.mjs --apply (the template page must exist and carry its template
 * flag) and BEFORE the site publish; a site publish does not publish rows, and a row publish does not
 * need one.
 *
 *   node cms-sync.mjs            # dry run: the table and row plan, nothing written
 *   node cms-sync.mjs --apply    # write + publish rows
 *
 * Endpoints (server/handlers/cms/data/{tables,rows}.ts, read on the container 2026-09-15):
 *   GET/POST  /admin/api/cms/data/tables            list / create (create is step-up gated)
 *   GET/PATCH /admin/api/cms/data/tables/:id        read / partial update (fields is a WHOLE list;
 *                                                   title+slug are held for a post type regardless)
 *   GET/POST  /admin/api/cms/data/tables/:id/rows   list / create a draft row ({ cells })
 *   PATCH     /admin/api/cms/data/rows/:id          save draft cells ({ cells }; replaces wholesale)
 *   POST      /admin/api/cms/data/rows/:id/publish  publish that row
 * Rows this script does not know about are LEFT ALONE and listed, never deleted: Sang may add a
 * legal page in the admin, which is the point of the collection.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { api, BASE } = await import('../../../../process/22-instatic-api-sync/insta-api.mjs')
const { COLLECTIONS } = await import('./cms-collections.mjs')
const manifest = JSON.parse(fs.readFileSync(path.join(HERE, '.tmp/site/site-src/pages.json'), 'utf8'))

const apply = process.argv.includes('--apply')
const fail = (m) => {
  console.error('REFUSING: ' + m)
  process.exit(1)
}
console.log(`instance   ${BASE}${apply ? '' : '   (dry run)'}`)

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const { tables } = await api('GET', '/admin/api/cms/data/tables')

for (const c of COLLECTIONS) {
  const entries = c.entries(manifest.package)
  const templatePage = manifest.pages.find((p) => p.template === c.slug)
  if (!templatePage) fail(`collection ${c.slug}: no template page in pages.json (prepare-source.mjs)`)

  /* --- the table ---------------------------------------------------------------------------- */
  let table = tables.find((t) => t.slug === c.slug)
  const want = { name: c.name, slug: c.slug, routeBase: c.routeBase, singularLabel: c.singularLabel, pluralLabel: c.pluralLabel, primaryFieldId: c.primaryFieldId, fields: c.fields }
  if (!table) {
    console.log(`table      ${c.slug}: CREATE (postType, ${c.routeBase}/<slug>, ${c.fields.length} fields)`)
    if (apply) {
      table = (await api('POST', '/admin/api/cms/data/tables', { ...want, kind: 'postType' })).table
      console.log(`           created ${table.id}`)
    }
  } else {
    if (table.kind !== 'postType') fail(`table ${c.slug} exists with kind ${table.kind}; a collection must be a postType`)
    const patch = {}
    for (const k of ['name', 'routeBase', 'singularLabel', 'pluralLabel', 'primaryFieldId']) if (table[k] !== want[k]) patch[k] = want[k]
    // fields compare by id+type+label+format+required (the API normalises and may add keys)
    const sig = (fs) => fs.map((f) => [f.id, f.type, f.label, f.format ?? '', f.required ?? false].join(':'))
    if (!same(sig(table.fields), sig(want.fields))) patch.fields = want.fields
    if (Object.keys(patch).length) {
      console.log(`table      ${c.slug}: PATCH ${Object.keys(patch).join(', ')}`)
      if (patch.fields) {
        const live = new Set(table.fields.map((f) => f.id))
        const mine = new Set(want.fields.map((f) => f.id))
        console.log(`           fields live=[${[...live].join(' ')}] -> [${[...mine].join(' ')}]${[...live].filter((f) => !mine.has(f)).length ? `   DROPPING ${[...live].filter((f) => !mine.has(f)).join(', ')}` : ''}`)
      }
      if (apply) table = (await api('PATCH', `/admin/api/cms/data/tables/${table.id}`, patch)).table
    } else console.log(`table      ${c.slug}: in line (${table.id})`)
  }

  /* --- the rows ----------------------------------------------------------------------------- */
  const rows = table ? (await api('GET', `/admin/api/cms/data/tables/${table.id}/rows`)).rows : []
  const bySlug = new Map(rows.map((r) => [r.slug ?? r.cells?.slug, r]))
  for (const e of entries) {
    const existing = bySlug.get(e.slug)
    const route = `${c.routeBase}/${e.slug}`
    if (!existing) {
      console.log(`row        ${route}: CREATE${e.publish ? ' + publish' : ''}  (${Object.keys(e.cells).join(' ')})`)
      if (!apply) continue
      const { row } = await api('POST', `/admin/api/cms/data/tables/${table.id}/rows`, { cells: e.cells })
      if (e.publish) await api('POST', `/admin/api/cms/data/rows/${row.id}/publish`, {})
      console.log(`           ${row.id} ${e.publish ? 'published' : 'draft'}`)
      continue
    }
    const liveCells = existing.cells ?? {}
    const changed = Object.keys(e.cells).filter((k) => !same(liveCells[k], e.cells[k]))
    const extra = Object.keys(liveCells).filter((k) => !(k in e.cells))
    const unpublished = existing.status !== 'published'
    if (!changed.length && !unpublished) {
      console.log(`row        ${route}: in line (${existing.id}, ${existing.status})${extra.length ? `; admin-only cells kept: ${extra.join(' ')}` : ''}`)
      continue
    }
    console.log(`row        ${route}: ${changed.length ? `UPDATE ${changed.join(', ')}` : 'unchanged'}${unpublished && e.publish ? ' + publish' : ''}  (${existing.id}, was ${existing.status})`)
    if (!apply) continue
    // PATCH replaces `cells` wholesale (trap 3): send the live cells with ours over them, so a cell
    // only the admin knows about survives.
    if (changed.length) await api('PATCH', `/admin/api/cms/data/rows/${existing.id}`, { cells: { ...liveCells, ...e.cells } })
    if (e.publish) await api('POST', `/admin/api/cms/data/rows/${existing.id}/publish`, {})
    console.log(`           ${existing.id} ${e.publish ? 'published' : 'saved'}`)
  }
  for (const r of rows) {
    const slug = r.slug ?? r.cells?.slug
    if (!entries.some((e) => e.slug === slug)) console.log(`row        ${c.routeBase}/${slug}: not in cms-collections.mjs, left alone (${r.status}) — an admin-authored entry`)
  }
}
if (!apply) console.log('\ndry run — re-run with --apply to write')
