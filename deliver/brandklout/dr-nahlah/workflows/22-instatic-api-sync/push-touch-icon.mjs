#!/usr/bin/env node
/**
 * push-touch-icon.mjs — the iOS home-screen icon (QA 2026-09-28, D02).
 *
 *   node push-touch-icon.mjs <apple-touch-icon.png>             # plan
 *   node push-touch-icon.mjs <apple-touch-icon.png> --apply     # upload + draft the head-script edit
 *   node push-touch-icon.mjs --publish                          # publish if that is the draft's only change
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-touch-icon.mjs ...
 *
 * Instatic emits exactly one <link rel="icon"> (settings.faviconUrl) and no
 * apple-touch-icon, and /apple-touch-icon.png cannot be served from the
 * Cloudflare Worker because the token cannot bind routes (403, 2026-10-02). So
 * the 180×180 icon (14-migration-seo-redirects/make-touch-icon.mjs: the favicon
 * "N" on --black) is uploaded to the media library and declared from
 * seo-head.js, which already runs first in every page's head. Safari reads the
 * live DOM when a visitor taps "Add to Home Screen", so a runtime link works.
 *
 * The snippet goes in its own IIFE just before the asset's end sentinel, so the
 * per-URL block above it (which returns early on unknown paths) cannot skip it.
 * Mirror in 13-content-export-import/.tmp/gen-seo-head.mjs (TOUCH_ICON).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { basename } from 'node:path'
import { createHash } from 'node:crypto'
import { api, getSite, requestForm, BASE } from './sedation-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const SRC = process.argv.slice(2).find((a) => !a.startsWith('--'))
const HOST = BASE.replace(/^https?:\/\//, '')
mkdirSync('.tmp/qa-fixes', { recursive: true })
const STATE = `.tmp/qa-fixes/touch-icon-state-${HOST}.json`
const ASSET = 'src/scripts/seo-head.js'
const SENTINEL = '/*__wz_seo_end__*/'
const MARK = '/* apple-touch-icon (push-touch-icon.mjs) */'
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')

const status = await api('GET', '/admin/api/cms/publish/status')
console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)', JSON.stringify(status))

if (PUBLISH) {
  const st = JSON.parse(readFileSync(STATE, 'utf8'))
  const { site } = await getSite()
  if (sha(site) !== st.shell || status.draftPages !== status.publishedPages) { console.error('REFUSING: the draft moved since --apply'); process.exit(1) }
  console.log('published', JSON.stringify(await api('POST', '/admin/api/cms/publish', {})))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  process.exit(0)
}
if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }
if (!SRC || !existsSync(SRC)) { console.error('usage: push-touch-icon.mjs <png> [--apply]'); process.exit(2) }
const bytes = readFileSync(SRC)
if (bytes.readUInt32BE(0) !== 0x89504e47 || bytes.readUInt32BE(16) !== 180 || bytes.readUInt32BE(20) !== 180) { console.error('need a 180×180 PNG'); process.exit(1) }

const { site: s0 } = await getSite()
const js0 = s0.files.find((f) => f.path === ASSET)?.content
if (!js0 || !js0.trimEnd().endsWith(SENTINEL)) { console.error(`${ASSET}: missing or without its end sentinel`); process.exit(1) }
if (js0.includes(MARK)) { console.log('already declared — nothing to do'); process.exit(0) }
console.log(`  icon     ${basename(SRC)} ${bytes.length} bytes`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

const form = new FormData()
form.append('file', new File([bytes], 'apple-touch-icon.png', { type: 'image/png' }))
const asset = (await requestForm('/admin/api/cms/media', form))?.asset
if (!asset?.publicPath) { console.error('upload returned no publicPath'); process.exit(1) }
console.log(`  uploaded ${asset.publicPath} ${asset.width}x${asset.height}`)

const snippet = `${MARK}
(function () {
  if (document.querySelector('link[rel="apple-touch-icon"]')) return;
  var l = document.createElement('link');
  l.rel = 'apple-touch-icon'; l.sizes = '180x180'; l.href = ${JSON.stringify(asset.publicPath)};
  document.head.appendChild(l);
})();
`
const { site, seq } = await getSite()
const file = site.files.find((f) => f.path === ASSET)
const at = file.content.lastIndexOf(SENTINEL)
file.content = file.content.slice(0, at) + snippet + file.content.slice(at)
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site, changedPages: [], deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [], baseSeqs: {}, shellBaseSeq: seq,
})
const { site: back } = await getSite()
const got = back.files.find((f) => f.path === ASSET).content
if (got !== file.content) { console.error('READ-BACK: seo-head.js differs from what was written'); process.exit(1) }
const others = (x) => x.files.filter((f) => f.path !== ASSET)
if (sha(others(back)) !== sha(others(s0)) || sha(back.styleRules) !== sha(s0.styleRules)) { console.error('READ-BACK: something else in the shell changed'); process.exit(1) }
writeFileSync(STATE, JSON.stringify({ shell: sha(back), href: asset.publicPath, at: new Date().toISOString() }))
console.log('  readback seo-head.js has the snippet before its sentinel; nothing else changed')
console.log('draft only — re-run with --publish')
