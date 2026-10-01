/**
 * Site push, step 4 — write every converted page into STAGING in one atomic PUT /site-document, `replace`
 * mode: the payload holds the whole rebuilt site, so any stored page not in it is deleted (on 2026-10-01
 * staging held only the home). Generalised from workflows/21-instatic-upload/home/push-home.mjs.
 *
 * The shell: site.css and site.js are REPLACED by the build's. The tag asset (000-brandklout-tags.js) and
 * the consent bridge are kept: both are host-conditional and inert on staging. Plugins (embed-origins with
 * BugHerd, open-graph) live outside the site document and are untouched. The class registry becomes the
 * importer's bare classes for these pages.
 *
 * Nested slugs (dental-services/x, about-our-practice/x, category/x, contact-us/thank-you) serve nested
 * only when site-document is the LAST write a row gets: nothing here patches /data/rows afterwards.
 * Page `title` carries the SEO title: the publisher renders <title> from it and reads no per-page SEO cell.
 *
 * Back up first: node push/snapshot.mjs <label>, and the DB copy (runbook). `replace` overwrites admin edits,
 * so it is refused without --force once pages hold content.
 *
 * Usage:
 *   INSTATIC_BASE_URL=https://staging.ifadentistry.com node push/push.mjs                    dry run
 *   INSTATIC_BASE_URL=https://staging.ifadentistry.com node push/push.mjs --apply --force
 */
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, api, BASE } from '../../../../../tools/instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(HERE, '.tmp')
const apply = process.argv.includes('--apply')
const force = process.argv.includes('--force')
const EMBED_ID = 'brandklout.embed-origins.embed'
const CSS_PATH = 'src/styles/site.css'
const JS_PATH = 'src/scripts/site.js'
const NBSP = String.fromCharCode(0xa0)
const PARKED = String.fromCharCode(0xe000)
const EMBED_TITLE = { 'ghl-form': 'Request a consultation', 'elfsight-reviews': 'Google reviews', 'google-map': 'Map to the practice' }

const converted = JSON.parse(fs.readFileSync(path.join(TMP, 'import-out.json'), 'utf8'))
const input = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(TMP, 'import-input.json.gz'))).toString('utf8'))
const embeds = JSON.parse(fs.readFileSync(path.join(TMP, 'embeds.json'), 'utf8'))
const siteCss = fs.readFileSync(path.join(TMP, 'site.css'), 'utf8')
const siteJs = fs.readFileSync(path.join(TMP, 'site.js'), 'utf8')
const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)
const want = input.pages.map((p) => p.slug)
const got = converted.pages.map((p) => p.slug)
if (want.join() !== got.join()) throw new Error(`converted pages differ from the payload:\n want ${want.join(', ')}\n got  ${got.join(', ')}`)

/* --- finish every node tree -------------------------------------------------------------------- */
const stats = { renamed: {}, embeds: {}, nbsp: 0, modules: {} }
for (const page of converted.pages) {
  for (const node of Object.values(page.nodes)) {
    const props = node.props ?? {}
    const tag = props.customTag
    if (node.moduleId === 'base.container' && props.tag === 'custom' && typeof tag === 'string' && tag.startsWith('x-wz-')) {
      if (tag === 'x-wz-embed') {
        const key = props.htmlAttributes?.['data-wz-e']
        const snippet = embeds[key]
        if (!snippet) throw new Error(`${page.slug}: no embed snippet for ${key}`)
        node.moduleId = EMBED_ID
        node.props = { source: 'snippet', url: '', snippet, title: EMBED_TITLE[key] || key, fit: 'auto', height: 600, ratio: '16 / 9', lazy: false, allowFullscreen: false, allow: '' }
        node.children = []
        stats.embeds[key] = (stats.embeds[key] || 0) + 1
      } else {
        props.customTag = tag.slice('x-wz-'.length)
        stats.renamed[props.customTag] = (stats.renamed[props.customTag] || 0) + 1
      }
    }
    for (const k of ['text', 'label']) {
      if (typeof node.props?.[k] === 'string' && node.props[k].includes(PARKED)) { node.props[k] = node.props[k].split(PARKED).join(NBSP); stats.nbsp++ }
    }
    if (!Array.isArray(node.children)) node.children = []   // the production validator 400s a node without it
    stats.modules[node.moduleId] = (stats.modules[node.moduleId] || 0) + 1
  }
  const left = JSON.stringify(page.nodes)
  if (left.includes(PARKED)) throw new Error(`${page.slug}: a parked &nbsp; outside text/label`)
  if (/"customTag":"x-wz-/.test(left)) throw new Error(`${page.slug}: an x-wz- tag was not finished`)
}
// base.button flattens children into a label string (trap 15); none may exist, they were all renamed.
if (stats.modules['base.button']) throw new Error('a <button> reached base.button and lost its children')

/* --- current state ----------------------------------------------------------------------------- */
const { site, seq } = await getSite()
const existing = (await getPages()).rows ?? []
const authored = existing.filter((r) => Object.keys(r.cells?.body?.nodes ?? {}).length > 1)
const deleting = existing.filter((r) => !want.includes(r.slug))
if (authored.length && !force) {
  console.error(`REFUSING without --force: ${authored.length} stored page(s) carry content; replace mode rewrites them and deletes ${deleting.length}.`)
  if (apply) process.exit(1)
}
const plugins = await api('GET', '/admin/api/cms/plugins')
const pluginList = plugins?.plugins ?? plugins?.rows ?? (Array.isArray(plugins) ? plugins : [])
if (!pluginList.some((x) => x.id === 'brandklout.embed-origins' && x.enabled !== false)) throw new Error('brandklout.embed-origins is not installed and enabled: the Embeds would be unknown modules')

/* --- the shell --------------------------------------------------------------------------------- */
const now = Date.now()
const home = input.pages.find((p) => p.slug === 'index')
const shell = {
  ...site,
  styleRules: converted.styleRules,
  ...(converted.conditions?.length ? { conditions: converted.conditions } : {}),
  files: [
    ...(site.files ?? []).filter((f) => f.path !== CSS_PATH && f.path !== JS_PATH),
    { id: nid(), path: CSS_PATH, type: 'style', content: siteCss, createdAt: now, updatedAt: now },
    { id: nid(), path: JS_PATH, type: 'script', content: siteJs, createdAt: now, updatedAt: now },
  ],
  settings: {
    ...Object.fromEntries(Object.entries(site.settings ?? {}).filter(([k]) => k !== 'metaTitle')),   // trap 6
    metaDescription: home.seoDescription,
    language: 'en-US',
  },
}
const idBySlug = new Map(existing.map((r) => [r.slug, r.id]))
const changedPages = converted.pages.map((p) => {
  const src = input.pages.find((x) => x.slug === p.slug)
  return { id: idBySlug.get(p.slug) ?? nid(), title: src.seoTitle, slug: p.slug, nodes: p.nodes, rootNodeId: p.rootNodeId }
})
const body = {
  mode: 'replace',
  site: shell,
  changedPages,
  deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: {},
  shellBaseSeq: seq,
}
const nodeCount = converted.pages.reduce((n, p) => n + Object.keys(p.nodes).length, 0)
console.log(`target     ${BASE}  (shell seq ${seq})`)
console.log(`pages      writing ${changedPages.length} (${changedPages.filter((p) => idBySlug.has(p.slug)).length} same row id); replace mode deletes ${deleting.length} stored: ${deleting.map((r) => r.slug).join(', ') || 'none'}`)
console.log(`nodes      ${nodeCount}: ${JSON.stringify(stats.modules)}`)
console.log(`finished   renamed ${JSON.stringify(stats.renamed)}; embeds ${JSON.stringify(stats.embeds)}; ${stats.nbsp} nbsp restored`)
console.log(`shell      ${Object.keys(shell.styleRules).length} bare classes; files ${shell.files.map((f) => f.path.split('/').pop()).join(', ')}; site.css ${(siteCss.length / 1024).toFixed(0)} KB, site.js ${(siteJs.length / 1024).toFixed(0)} KB`)
console.log(`payload    ${(Buffer.byteLength(JSON.stringify(body)) / 1048576).toFixed(2)} MB`)
if (!apply) { console.log('\ndry run: re-run with --apply --force to write'); process.exit(0) }

const res = await api('PUT', '/admin/api/cms/site-document', body)
console.log('\nsaved:', JSON.stringify(res).slice(0, 200))
const after = (await getPages()).rows ?? []
const missing = want.filter((s) => !after.some((r) => r.slug === s))
console.log(`stored now ${after.length} page(s)`)
if (missing.length || after.length !== want.length) { console.error(`UNEXPECTED: missing ${missing.join(', ') || '-'}; stored ${after.length}, built ${want.length}`); process.exitCode = 1 }
console.log('\nNEXT: the 404 template flag (README), then node push/publish.mjs, then the live gates')
