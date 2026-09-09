#!/usr/bin/env node
/**
 * render-draft-page.mjs — render a DRAFT page to real HTML, without publishing.
 *
 *   node render-draft-page.mjs                     # index -> .tmp/draft-render/index.html
 *   node render-draft-page.mjs veneers
 *   node render-draft-page.mjs index .tmp/mydir
 *
 * ## Why this exists
 *
 * There is no draft preview URL on this site. `encorercm.com` and
 * `drnahlah.com` both serve the PUBLISHED bake, so for a long time the only two
 * ways to look at unpublished work were "read the node tree back and imagine
 * it" or "publish and see" — and publishing ships every other in-flight change
 * on the draft, which is precisely what we are always trying not to do.
 *
 * `POST /admin/api/cms/runtime/preview` is the editor's own preview-iframe
 * builder (`server/handlers/cms/runtime.ts`). It is gated on the READ floor —
 * "anyone who can open the site editor can preview the draft they posted" — and
 * it takes the WHOLE site document in the request body rather than loading the
 * persisted one, because the editor needs it to reflect unsaved edits. That is
 * exactly what makes it usable headlessly: hand it the draft you just read and
 * it hands back the finished document, the compiled runtime bundles and any
 * diagnostics.
 *
 * Serve the output directory with anything, proxying whatever is not on disk to
 * INSTATIC_BASE_URL so `/uploads/*` resolves — `.tmp/probe-services-hover.mjs`
 * has that server in nine lines and takes a directory as its first argument.
 *
 * ## Two things to know about the output
 *
 * - It is the real publisher's render, so it reflects the STYLE REGISTRY and
 *   its cascade order. That is a class of bug the local design package under
 *   `04-design/.tmp/final-site` cannot show you, because the package has its
 *   own hand-written stylesheet and no conditions array.
 * - `src/scripts/seo-head.js` still rewrites the <head> at runtime here, same as
 *   live. Read the head from the DOM after scripts run, never from this file.
 *
 * Read-only: this writes nothing to the site.
 */
import { getSite, getPages, api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'

const SLUG = process.argv[2] ?? 'index'
const OUT = process.argv[3] ?? '.tmp/draft-render'

const { site: shell, seq } = await getSite()
const { rows } = await getPages()

/* `GET /pages` answers `{rows}` in the DATA-ROW shape; the preview endpoint
   validates `Page` records. The two differ, and `template` has to be rebuilt
   from the row's cells or validatePages rejects a templated page. */
const pages = rows.map((r) => ({
  id: r.id,
  slug: r.cells.slug ?? r.slug,
  title: r.cells.title,
  nodes: r.cells.body?.nodes,
  rootNodeId: r.cells.body?.rootNodeId,
  ...(r.cells.templateEnabled === true
    ? { template: { enabled: true, target: r.cells.templateTarget, priority: r.cells.templatePriority ?? 0 } }
    : {}),
}))

const page = pages.find((p) => p.slug === SLUG)
if (!page) {
  console.error(`no page "${SLUG}". have: ${pages.map((p) => p.slug).join(', ')}`)
  process.exit(1)
}

const res = await api('POST', '/admin/api/cms/runtime/preview', {
  pageId: page.id,
  site: { ...shell, pages, visualComponents: shell.visualComponents ?? [] },
})

mkdirSync(OUT, { recursive: true })
writeFileSync(join(OUT, `${SLUG}.html`), res.html, 'utf8')
for (const a of res.assets ?? []) {
  const p = join(OUT, a.publicPath.replace(/^\//, ''))
  mkdirSync(dirname(p), { recursive: true })
  writeFileSync(p, a.content, 'utf8')
}

console.log(`shell seq ${seq}, "${SLUG}" seq ${rows.find((r) => (r.cells.slug ?? r.slug) === SLUG).seq}`)
console.log(`html   ${res.html.length}c -> ${join(OUT, `${SLUG}.html`)}`)
for (const a of res.assets ?? []) console.log(`asset  ${a.publicPath}  ${(a.content ?? '').length}c`)

const diags = res.diagnostics ?? []
if (diags.length) {
  console.error(`\n${diags.length} diagnostics:`)
  for (const d of diags) console.error(`  ${JSON.stringify(d).slice(0, 300)}`)
  process.exit(1)
}
console.log('\nno diagnostics. Nothing was written to the site.')
