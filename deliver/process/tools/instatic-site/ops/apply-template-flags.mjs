#!/usr/bin/env node
/**
 * apply-template-flags.mjs — put the template flags back on a page after an import wiped them.
 *
 * Origin: bk-mason-park, workflows/09-static-rebuild/output/apply-blog-template.mjs and
 * apply-404-template.mjs (run on every Mason Park deploy, 2026-09-09 to 09-18). Merged and
 * generalized 2026-09-23.
 *
 * WHY. `PUT /admin/api/cms/site-document` rebuilds each row through `pageToCells()` and only carries
 * `template` when the payload has one. A plain import therefore drops the flags: lose the collection
 * template and every /blog/<slug> 404s; lose the notFound template and Instatic's bare stock 404 is
 * back. So after EVERY import-pages / push-site run, re-apply them here.
 *
 * The flags go on through `PATCH /admin/api/cms/data/rows/:id`, which replaces `cells` wholesale, so
 * the whole row (body included) is read and re-sent, then read back. PATCH re-derives the routable
 * slug, which flattens `a/b` to `a-b`: this script refuses a slug with a slash in it.
 *
 * Usage:
 *   node apply-template-flags.mjs --page 404 --not-found [--check]
 *   node apply-template-flags.mjs --page blog-article --table articles [--priority 0] [--check]
 * Env: INSTATIC_BASE_URL (+ login), STAGING_HOST (see ../lib/staging-guard.mjs; --allow-production
 * to write elsewhere). Does NOT publish.
 */
import { api } from '../lib/site.mjs'
import { assertStaging } from '../lib/staging-guard.mjs'

const argv = process.argv.slice(2)
const arg = (n) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : undefined }
const SLUG = arg('page')
const TABLE = arg('table')
const NOT_FOUND = argv.includes('--not-found')
const PRIORITY = Number(arg('priority') ?? 0)
const CHECK = argv.includes('--check')

if (!SLUG || (!TABLE && !NOT_FOUND) || (TABLE && NOT_FOUND)) {
  console.error('usage: --page <slug> (--not-found | --table <tableSlug>) [--priority N] [--check]')
  process.exit(2)
}
if (SLUG.includes('/')) {
  console.error(`REFUSING: "${SLUG}" is a nested slug; PATCH /data/rows flattens it. Set template through site-document instead.`)
  process.exit(2)
}
assertStaging()

let target
if (NOT_FOUND) {
  target = { kind: 'notFound' }
} else {
  const table = ((await api('GET', '/admin/api/cms/data/tables')).tables || []).find((t) => t.slug === TABLE)
  if (!table) { console.error(`REFUSING: no data table with slug "${TABLE}"`); process.exit(1) }
  console.log(`table  ${table.id}  slug=${table.slug}  routeBase=${table.routeBase}  rows=${table.rowCount}`)
  target = { kind: 'postTypes', tableSlugs: [TABLE] } // tableSLUG, not tableId: matchesLevel compares slugs
}

const readRows = async () => (await api('GET', '/admin/api/cms/data/tables/pages/rows')).rows || []
const row = (await readRows()).find((r) => (r.cells?.slug ?? r.slug) === SLUG)
if (!row) { console.error(`REFUSING: no page row with slug "${SLUG}" — import it first`); process.exit(1) }
const nodes = Object.keys(row.cells?.body?.nodes ?? {}).length
console.log(`page   ${row.id}  slug=${SLUG}  nodes=${nodes}`)
console.log(`now    templateEnabled=${row.cells?.templateEnabled} target=${JSON.stringify(row.cells?.templateTarget)}`)
console.log(`want   ${JSON.stringify(target)} priority=${PRIORITY}`)
if (nodes <= 1) { console.error('REFUSING: that row has no body — import the page first'); process.exit(1) }
if (CHECK) { console.log('\n--check: nothing written.'); process.exit(0) }

await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, {
  cells: { ...row.cells, templateEnabled: true, templateTarget: target, templatePriority: PRIORITY },
})

// Read back rather than trusting the write: this platform reports some failures as 200.
const after = (await readRows()).find((r) => r.id === row.id)
const ok = after?.cells?.templateEnabled === true && JSON.stringify(after?.cells?.templateTarget) === JSON.stringify(target)
const kept = Object.keys(after?.cells?.body?.nodes ?? {}).length
console.log(`\ntemplateEnabled=${after?.cells?.templateEnabled} target=${JSON.stringify(after?.cells?.templateTarget)} nodes=${kept}`)
if (!ok) { console.error('! the template flags did not persist'); process.exit(1) }
if (kept !== nodes) { console.error(`! node count changed ${nodes} -> ${kept}`); process.exit(1) }
console.log('NOT published. Publish is a separate step (node ../../instatic-api-sync/insta-api.mjs publish).')
