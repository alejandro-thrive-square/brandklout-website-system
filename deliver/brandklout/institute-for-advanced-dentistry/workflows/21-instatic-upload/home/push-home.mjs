/**
 * Home redesign, step 4 — write the converted home page into STAGING in one atomic PUT
 * /site-document, in `replace` mode: the payload holds ONE page, so every other stored page is
 * deleted. That is what was asked for on 2026-09-21 ("just the homepage, remove all of the others").
 * staging-only.mjs makes it impossible to aim this at production.
 *
 * Back up first (the run file lists the three backups). `replace` overwrites admin edits, so it is
 * refused without --force once pages hold content — and on staging they always do.
 *
 * The shell: site.css and site.js are REPLACED by the redesign's (the WordPress clone's 730 KB
 * cascade and its 1.6 MB script replay belong to pages that no longer exist). The tag asset and the
 * consent bridge are kept: both are host-conditional and inert on staging. The class registry is
 * replaced by the importer's bare classes for this page.
 *
 * Usage:
 *   INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/push-home.mjs                    dry run
 *   INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/push-home.mjs --apply --force
 */
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, api, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.resolve(HERE, '../.tmp/home')
const apply = process.argv.includes('--apply')
const force = process.argv.includes('--force')
const EMBED_ID = 'brandklout.embed-origins.embed'
const CSS_PATH = 'src/styles/site.css'
const JS_PATH = 'src/scripts/site.js'
const NBSP = String.fromCharCode(0xa0)
const PARKED = String.fromCharCode(0xe000)

const converted = JSON.parse(fs.readFileSync(path.join(TMP, 'import-out.json'), 'utf8'))
const input = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(TMP, 'import-input.json.gz'))).toString('utf8'))
const embeds = JSON.parse(fs.readFileSync(path.join(TMP, 'embeds.json'), 'utf8'))
const siteCss = fs.readFileSync(path.join(TMP, 'site.css'), 'utf8')
const siteJs = fs.readFileSync(path.join(TMP, 'site.js'), 'utf8')
const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)
if (converted.pages.length !== 1 || converted.pages[0].slug !== 'index') throw new Error('expected exactly one page, slug "index"')

/* --- finish the node tree -------------------------------------------------------------------- */
const stats = { renamed: {}, embeds: 0, nbsp: 0, modules: {} }
const page = converted.pages[0]
for (const node of Object.values(page.nodes)) {
  const props = node.props ?? {}
  const tag = props.customTag
  if (node.moduleId === 'base.container' && props.tag === 'custom' && typeof tag === 'string' && tag.startsWith('x-wz-')) {
    if (tag === 'x-wz-embed') {
      const snippet = embeds[props.htmlAttributes?.['data-wz-e']]
      if (!snippet) throw new Error('no embed snippet for ' + props.htmlAttributes?.['data-wz-e'])
      node.moduleId = EMBED_ID
      node.props = { source: 'snippet', url: '', snippet, title: 'Request a consultation', fit: 'auto', height: 600, ratio: '16 / 9', lazy: false, allowFullscreen: false, allow: '' }
      node.children = []
      stats.embeds++
    } else {
      props.customTag = tag.slice('x-wz-'.length)
      stats.renamed[props.customTag] = (stats.renamed[props.customTag] || 0) + 1
    }
  }
  for (const k of ['text', 'label']) {
    if (typeof node.props?.[k] === 'string' && node.props[k].includes(PARKED)) { node.props[k] = node.props[k].split(PARKED).join(NBSP); stats.nbsp++ }
  }
  stats.modules[node.moduleId] = (stats.modules[node.moduleId] || 0) + 1
}
const left = JSON.stringify(page.nodes)
if (left.includes(PARKED)) throw new Error('a parked &nbsp; outside text/label')
if (/"customTag":"x-wz-/.test(left)) throw new Error('an x-wz- tag was not finished')
// base.button flattens children into a label string (trap 15); none may exist, they were all renamed.
if (stats.modules['base.button']) throw new Error('a <button> reached base.button and lost its children')

/* --- current state --------------------------------------------------------------------------- */
const { site, seq } = await getSite()
const existing = (await getPages()).rows ?? []
const authored = existing.filter((r) => Object.keys(r.cells?.body?.nodes ?? {}).length > 1)
if (authored.length && !force) {
  console.error(`REFUSING without --force: ${authored.length} stored page(s) carry content and replace mode deletes ${existing.filter((r) => r.slug !== 'index').length} of them.`)
  if (apply) process.exit(1)
}
const plugins = await api('GET', '/admin/api/cms/plugins')
const pluginList = plugins?.plugins ?? plugins?.rows ?? (Array.isArray(plugins) ? plugins : [])
if (!pluginList.some((x) => x.id === 'brandklout.embed-origins' && x.enabled !== false)) throw new Error('brandklout.embed-origins is not installed and enabled: the form Embed would be an unknown module')

/* --- the shell ------------------------------------------------------------------------------- */
const now = Date.now()
const meta = input.pages[0]
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
    metaDescription: meta.seoDescription,
    language: 'en-US',
  },
}
const home = existing.find((p) => p.slug === 'index')
const body = {
  mode: 'replace',
  site: shell,
  changedPages: [{ id: home?.id ?? nid(), title: meta.seoTitle, slug: 'index', nodes: page.nodes, rootNodeId: page.rootNodeId }],
  deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: {},
  shellBaseSeq: seq,
}
console.log(`target     ${BASE}  (shell seq ${seq})`)
console.log(`nodes      ${Object.keys(page.nodes).length}: ${JSON.stringify(stats.modules)}`)
console.log(`finished   renamed ${JSON.stringify(stats.renamed)}, ${stats.embeds} embed, ${stats.nbsp} nbsp restored`)
console.log(`shell      ${Object.keys(shell.styleRules).length} bare classes; files ${shell.files.map((f) => f.path.split('/').pop()).join(', ')}; site.css ${(siteCss.length / 1024).toFixed(0)} KB, site.js ${(siteJs.length / 1024).toFixed(0)} KB`)
console.log(`pages      writing 1 (index${home ? ', same row id' : ', new row'}); replace mode deletes the other ${existing.filter((r) => r.slug !== 'index').length} of ${existing.length} stored`)
console.log(`payload    ${(Buffer.byteLength(JSON.stringify(body)) / 1048576).toFixed(2)} MB`)
if (!apply) { console.log('\ndry run — re-run with --apply --force to write'); process.exit(0) }

const res = await api('PUT', '/admin/api/cms/site-document', body)
console.log('\nsaved:', JSON.stringify(res).slice(0, 200))
const after = (await getPages()).rows ?? []
console.log(`stored now ${after.length} page(s): ${after.map((p) => p.slug).join(', ')}`)
if (after.length !== 1 || after[0].slug !== 'index') { console.error('UNEXPECTED: staging does not hold exactly the home page'); process.exitCode = 1 }
