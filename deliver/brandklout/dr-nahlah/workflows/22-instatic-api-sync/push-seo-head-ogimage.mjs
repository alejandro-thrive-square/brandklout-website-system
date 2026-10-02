#!/usr/bin/env node
/**
 * push-seo-head-ogimage.mjs — stop seo-head.js overwriting the per-page share image.
 *
 *   node push-seo-head-ogimage.mjs [--apply] [--publish]
 *
 * seo-head.js predates the open-graph plugin: on load it picked "the largest
 * image on the page" and wrote it into og:image / twitter:image, select-or-create,
 * so it replaced whatever was there. Since 2026-10-02 every page's override carries
 * a dedicated 1200x630 (push-og-images.mjs) that the plugin emits statically; the
 * runtime then swapped it back to a 6000-px stock photo for anything that runs
 * scripts (Google, QA's checker). ogImage() now returns when the head already
 * names an image, and still fills one in where nothing does.
 * Mirrored in 13-content-export-import/.tmp/gen-seo-head.mjs.
 */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { api, getSite, BASE } from './sedation-api.mjs'

const APPLY = process.argv.includes('--apply'), PUBLISH = process.argv.includes('--publish')
const HOST = BASE.replace(/^https?:\/\//, ''); mkdirSync('.tmp/qa-fixes', { recursive: true })
const STATE = `.tmp/qa-fixes/seo-head-ogimage-${HOST}.json`
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const A = '  function ogImage() {\n    var best = null;'
const B = '  function ogImage() {\n    /* The open-graph plugin emits a per-page 1200x630 since 2026-10-02: keep it. */\n    if (document.head.querySelector(\'meta[property="og:image"][content]\')) return;\n    var best = null;'
const status = await api('GET', '/admin/api/cms/publish/status')
if (PUBLISH) {
  const { site } = await getSite()
  if (sha(site.files) !== JSON.parse(readFileSync(STATE, 'utf8')).files) { console.error('REFUSING: draft moved'); process.exit(1) }
  console.log(JSON.stringify(await api('POST', '/admin/api/cms/publish', {}))); process.exit(0)
}
if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }
const { site, seq } = await getSite()
const f = site.files.find((x) => x.path === 'src/scripts/seo-head.js')
if (f.content.includes(B)) { console.log('already patched'); process.exit(0) }
if (f.content.split(A).length !== 2) { console.error('ogImage() not found exactly once'); process.exit(1) }
console.log(`${HOST}: ogImage() keeps an existing og:image`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }
f.content = f.content.replace(A, B)
await api('PUT', '/admin/api/cms/site-document', { mode: 'incremental', site, changedPages: [], deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [], baseSeqs: {}, shellBaseSeq: seq })
const { site: s1 } = await getSite()
if (s1.files.find((x) => x.path === 'src/scripts/seo-head.js').content !== f.content) { console.error('READ-BACK differs'); process.exit(1) }
writeFileSync(STATE, JSON.stringify({ files: sha(s1.files) }))
console.log('draft written — re-run with --publish')
