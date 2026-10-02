#!/usr/bin/env node
// PROMOTED 2026-09-23 to tools/instatic-site/push/place-embeds.mjs. Origin: bk-stone,
// deliver/brandklout/stone-surgical-arts/workflows/21-instatic-upload/place-embeds.mjs (also run for the med
// spa). Embeds now come from embeds.json; built pages from ../lib/paths.mjs (SITE_SRC/dist).
/**
 * Step 6 — turn the embed MARKERS the import carried into real Embed blocks.
 *
 * WHY THIS EXISTS. Instatic publishes `script-src 'self'; frame-src 'none'` and
 * `importHtml` turns a non-YouTube `<iframe>` into an empty div, so a
 * third-party widget cannot reach a published page through the import at all.
 * The one thing that can is the `brandklout.embed-origins` Embed block
 * (`deliver/process/tools/instatic-embeds`): a plugin module whose `publish.html`
 * filter widens that page's CSP at publish time. This instance has it, version
 * 1.6.0, `embedPolicy: compatible`.
 *
 * So the authored page carries a marker —
 *   <div class="wz-embed form_embed" data-wz-embed="auto" data-embed="<key>">
 * — holding the vendor's snippet verbatim. `build-import-input.mjs` empties
 * that marker on the way to the container, and this script swaps the emptied
 * NODE for the plugin's module node carrying the same snippet, keeping the
 * node's id, its parent and its author class so the page around it does not
 * move. The snippet is read back out of the BUILT page, so the authored
 * `pages/*.body.html` is the only copy of it.
 *
 * It is idempotent: a node already carrying the module id is left alone, and a
 * re-push restores the marker, which this then swaps again. **Run it after
 * every `push-site.mjs --apply`**, before the publish — `ship.sh`'s report and
 * `verify-live.mjs` will not tell you the block is missing, only that the page
 * is there.
 *
 * WHY THE ROWS API AND NOT `site-document`. A `changedPages` write maps the
 * page through `pageToCells`, which knows nothing about `seoTitle` /
 * `seoDescription`, so it would silently drop the SEO pass push-site.mjs makes
 * straight afterwards. `PATCH /data/rows/:id` is a full replacement of `cells`,
 * so the read-merge-write here sends the WHOLE cells object back, exactly as
 * that pass does, and reads it back to prove nothing was emptied.
 *
 * Usage:
 *   node place-embeds.mjs                 dry run — prints what would change
 *   node place-embeds.mjs --apply
 *   node place-embeds.mjs --apply --publish
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, publish } from '../lib/site.mjs'
import * as P from '../lib/paths.mjs'

const SITE_SRC = P.DIST // the BUILT pages; the marker's snippet is read from here

const apply = process.argv.includes('--apply')
const alsoPublish = process.argv.includes('--publish')

const MODULE_ID = 'brandklout.embed-origins.embed'

/* The embeds this site has, keyed by the marker's `data-embed`.
 *
 * SNIPPET MODE, vendor script included, and that is not a preference. In URL
 * mode the block publishes a bare frame, and a bare Go High Level frame posts
 * `["iframeLoaded"]` and then waits: it only reports its height, as
 * `["lc.setHeight", …]`, once `link.msgsndr.com/js/form_embed.js` has answered
 * that first message from the parent page. With no script the frame sits at
 * its starting height and cuts its own Submit button off. Measured both ways
 * on 2026-09-17 — trap 32.
 *
 * The snippet itself is NOT written here. It is read out of the built page, so
 * `site-src/pages/<page>.body.html` is the only copy and the published block
 * cannot drift from the local build. `height` is the editor card's height in
 * the admin; the live height is the vendor script's business. */
/* Per-site config, no longer a constant: --config <file> (default <cwd>/embeds.json), shaped
   { "<data-embed key>": { "where": "<page slug>", "props": { source, url, title, fit, height, ratio,
   lazy, allowFullscreen, allow } } }. Stone's GHL contact form was:
   {"ghl-contact-form":{"where":"book","props":{"source":"snippet","url":"","title":"Contact Form",
   "fit":"auto","height":565,"ratio":"16 / 9","lazy":true,"allowFullscreen":false,"allow":""}}} */
const cfgIx = process.argv.indexOf('--config')
const CONFIG = path.resolve(cfgIx >= 0 ? process.argv[cfgIx + 1] : path.join(P.WORK, 'embeds.json'))
if (!fs.existsSync(CONFIG)) { console.error(`no embed config at ${CONFIG} — see the comment above EMBEDS`); process.exit(2) }
const EMBEDS = JSON.parse(fs.readFileSync(CONFIG, 'utf8'))

/* The marker's contents in the BUILT page, which is what the block publishes. */
function snippetFor(slug, key) {
  let file = path.join(SITE_SRC, `${slug}.html`)
  if (!fs.existsSync(file)) file = path.join(SITE_SRC, slug, 'index.html')
  const html = fs.readFileSync(file, 'utf8')
  // Built by hand rather than with `new RegExp` and a template literal: `\s`
  // in a template literal is just "s", and the pattern silently matches
  // nothing. It cost a run here on 2026-09-17.
  const re = new RegExp('<div[^>]*\\sdata-embed="' + key + '"[^>]*>([\\s\\S]*?)<\\/div>')
  const m = html.match(re)
  if (!m || !m[1].trim()) {
    throw new Error(`no marker "${key}" with contents in ${slug}.html — build the site first`)
  }
  return m[1].trim()
}

/* The module publishes its own `class="wz-embed"`, and the publisher injects
   the author class beside it. The marker carries both so the LOCAL build looks
   like the published page; carrying `wz-embed` through as an author class too
   would publish it twice. */
const DROP_CLASSES = new Set(['wz-embed'])

const { site } = await getSite()
const classNameById = new Map(
  Object.values(site.styleRules ?? {}).map((r) => [r.id, String(r.name ?? '').replace(/^\./, '')]),
)

const plugins = await api('GET', '/admin/api/cms/plugins').catch(() => ({}))
const plugin = (plugins.plugins ?? plugins.rows ?? []).find((p) => p.id === 'brandklout.embed-origins')
if (!plugin || plugin.enabled === false) {
  console.error(
    'REFUSING: the brandklout.embed-origins plugin is not installed or not enabled on this site.\n' +
      'A module node whose plugin is missing publishes as nothing at all. Install it first:\n' +
      '  deliver/process/tools/instatic-plugins  ->  node install-plugin.mjs embed-origins --apply',
  )
  process.exit(1)
}
console.log(`plugin     ${plugin.id} ${plugin.version}  policy=${plugin.settings?.embedPolicy ?? '?'}`)

const rows = (await getPages()).rows ?? []
let found = 0
let changed = 0

for (const row of rows) {
  const cells = row.cells ?? {}
  const nodes = cells.body?.nodes
  if (!nodes) continue

  const markers = Object.values(nodes).filter((n) => n.props?.htmlAttributes?.['data-embed'])
  const placed = Object.values(nodes).filter((n) => n.moduleId === MODULE_ID)
  if (!markers.length && !placed.length) continue
  found += markers.length + placed.length

  if (!markers.length) {
    console.log(`${String(cells.slug).padEnd(18)} ${placed.length} block(s) already placed, nothing to do`)
    continue
  }

  const next = { ...nodes }
  const report = []
  for (const marker of markers) {
    const key = marker.props.htmlAttributes['data-embed']
    const embed = EMBEDS[key]
    if (!embed) {
      console.error(`REFUSING: ${cells.slug} carries data-embed="${key}", which is not in EMBEDS here.`)
      process.exit(1)
    }
    if (embed.where !== cells.slug) {
      console.error(`REFUSING: "${key}" is declared for "${embed.where}" and was found on "${cells.slug}".`)
      process.exit(1)
    }
    if (marker.children?.length) {
      console.error(
        `REFUSING: the marker for "${key}" on ${cells.slug} has ${marker.children.length} child node(s).\n` +
          `It must be empty — build-import-input.mjs drops the local <iframe> out of it.`,
      )
      process.exit(1)
    }
    const classIds = (marker.classIds ?? []).filter((id) => !DROP_CLASSES.has(classNameById.get(id) ?? ''))
    const snippet = snippetFor(cells.slug, key)
    next[marker.id] = {
      id: marker.id,
      moduleId: MODULE_ID,
      props: { ...embed.props, snippet },
      breakpointOverrides: marker.breakpointOverrides ?? {},
      children: [],
      classIds,
      parentId: marker.parentId ?? null,
    }
    const hosts = [...new Set([...snippet.matchAll(/https:\/\/([a-z0-9.-]+)/gi)].map((h) => h[1]))]
    report.push(
      `   ${key}  ${embed.props.source}  ${snippet.length}B  reaches ${hosts.join(', ')}  ` +
        `classes=[${classIds.map((id) => classNameById.get(id)).join(', ')}]`,
    )
  }

  console.log(`${String(cells.slug).padEnd(18)} ${markers.length} marker(s) -> Embed block`)
  for (const line of report) console.log(line)

  if (!apply) continue

  if (String(cells.slug).includes('/')) {
    console.error(`SKIPPED ${cells.slug}: nested slug. PATCH /data/rows flattens it to a-b; place this embed through site-document instead.`)
    process.exitCode = 1
    continue
  }
  const body = { ...cells.body, nodes: next }
  await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells: { ...cells, body } })

  // Read back: this platform reports some write failures as a 200.
  const after = await api('GET', `/admin/api/cms/data/rows/${row.id}`)
  const ac = after.row?.cells ?? after.cells ?? {}
  const back = Object.values(ac.body?.nodes ?? {})
  const blocks = back.filter((n) => n.moduleId === MODULE_ID)
  if (!ac.slug || back.length !== Object.keys(next).length || blocks.length !== markers.length) {
    console.error(
      `FAILED ${cells.slug}: slug="${ac.slug}" nodes=${back.length}/${Object.keys(next).length} ` +
        `blocks=${blocks.length}/${markers.length}`,
    )
    process.exitCode = 1
    continue
  }
  changed += markers.length
  console.log(`   written and read back: ${back.length} nodes, ${blocks.length} block(s)`)
}

console.log(`\n${found} marker(s)/block(s) across ${rows.length} page(s); ${changed} written`)

if (!apply) {
  console.log('dry run — re-run with --apply to write')
  process.exit(0)
}
if (alsoPublish) {
  console.log('publish:', JSON.stringify(await publish()))
} else if (changed) {
  console.log('NOT published. The block only exists on the published page after a publish.')
}
