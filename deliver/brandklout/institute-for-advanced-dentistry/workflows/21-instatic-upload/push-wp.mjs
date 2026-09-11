/**
 * Step 4 — write the converted WordPress clone into Instatic in ONE atomic PUT /site-document:
 * the shell (bare class registry, site.css and site.js as code assets, settings) and all pages.
 *
 * Before writing, the node trees from the container import are finished here:
 *   - x-wz-<tag> containers become <tag> containers. prepare-wp.mjs renamed form controls,
 *     buttons, <video> and <source> so importHtml would treat them as containers and keep every
 *     attribute and child (the typed modules keep a fixed prop list; traps 15, 22, 38, 41).
 *   - x-wz-embed containers become Embed blocks (brandklout.embed-origins.embed, snippet mode)
 *     carrying the original iframe verbatim: Instatic refuses `iframe` as a custom tag.
 *   - U+E000 goes back to U+00A0 (prepare-wp.mjs parked every &nbsp; there, because
 *     normalizeImportedText collapses \s and \s matches U+00A0).
 *   - x-wz-script placeholders stay: runtime.js replaces them in the browser.
 *
 * `mode: 'replace'` deletes any stored page not in the payload, so a re-run after someone has
 * edited a page in the admin overwrites their work. Refused without --force once any page holds
 * content (trap 11).
 *
 * Usage:
 *   node push-wp.mjs                   dry run
 *   node push-wp.mjs --apply [--force]
 */
import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const TMP = path.join(HERE, '.tmp')
const apply = process.argv.includes('--apply')
const force = process.argv.includes('--force')
const EMBED_ID = 'brandklout.embed-origins.embed'
const CSS_PATH = 'src/styles/site.css'
const JS_PATH = 'src/scripts/site.js'

const converted = JSON.parse(fs.readFileSync(path.join(TMP, 'import-out.json'), 'utf8'))
const input = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(TMP, 'import-input.json.gz'))).toString('utf8'))
const embeds = JSON.parse(fs.readFileSync(path.join(TMP, 'wp', 'embeds.json'), 'utf8'))
const siteCss = fs.readFileSync(path.join(TMP, 'site.css'), 'utf8')
const siteJs = fs.readFileSync(path.join(TMP, 'site.js'), 'utf8')
const { map } = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map-wp.json'), 'utf8'))
const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

/* --- finish the node trees ------------------------------------------------------------------ */
const stats = { renamed: {}, embeds: 0, nbsp: 0, placeholders: 0 }
for (const p of converted.pages) {
  for (const node of Object.values(p.nodes)) {
    const props = node.props ?? {}
    const tag = props.customTag
    if (node.moduleId === 'base.container' && props.tag === 'custom' && typeof tag === 'string' && tag.startsWith('x-wz-')) {
      if (tag === 'x-wz-script') {
        stats.placeholders++
      } else if (tag === 'x-wz-embed') {
        const key = props.htmlAttributes?.['data-wz-e']
        const snippet = embeds[key]
        if (!snippet) throw new Error(`${p.slug}: no embed snippet for ${key}`)
        node.moduleId = EMBED_ID
        node.props = { source: 'snippet', url: '', snippet, title: '', fit: 'auto', height: 600, ratio: '16 / 9', lazy: true, allowFullscreen: false, allow: '' }
        node.children = []
        stats.embeds++
      } else {
        props.customTag = tag.slice('x-wz-'.length)
        stats.renamed[props.customTag] = (stats.renamed[props.customTag] || 0) + 1
      }
    }
    for (const k of ['text', 'label']) {
      if (typeof node.props?.[k] === 'string' && node.props[k].includes('\ue000')) {
        node.props[k] = node.props[k].replace(/\ue000/g, '\u00a0')
        stats.nbsp++
      }
    }
  }
  const left = JSON.stringify(p.nodes)
  if (left.includes('\ue000')) throw new Error(`${p.slug}: a parked &nbsp; outside text/label`)
  if (/"customTag":"x-wz-(?!script")/.test(left)) throw new Error(`${p.slug}: an x-wz- tag was not finished`)
}

/* --- read current state -------------------------------------------------------------------- */
const { site, seq } = await getSite()
const existingPages = (await getPages()).rows ?? []
const authored = existingPages.filter((r) => Object.keys(r.cells?.body?.nodes ?? {}).length > 1)
if (authored.length && !force) {
  console.error(`REFUSING: ${authored.length} page(s) already carry content (${authored.slice(0, 5).map((p) => p.slug).join(', ')}…). replace mode overwrites any admin edit. Re-run with --force if that is intended.`)
  process.exit(1)
}
const plugins = await api('GET', '/admin/api/cms/plugins').catch(() => null)
const pluginList = plugins?.plugins ?? plugins?.rows ?? (Array.isArray(plugins) ? plugins : [])
if (!pluginList.some((x) => x.id === 'brandklout.embed-origins' && x.enabled !== false)) {
  console.error('REFUSING: brandklout.embed-origins is not installed and enabled. Without it the Maps embeds are unknown modules and every page CSP blocks the scripts. See 18-instatic-embeds.')
  process.exit(1)
}

/* --- the shell ----------------------------------------------------------------------------- */
const now = Date.now()
const home = input.pages.find((p) => p.slug === 'index')
if (!home?.seoDescription) throw new Error('no description for the home page')
const faviconPath = Object.keys(map).find((p) => /favicon-ifadentistry-rb-150x150\.png$/.test(p)) ?? Object.keys(map).find((p) => /favicon.*\.png$/i.test(p))
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
    // metaTitle is stripped: it would override every page's <title> (trap 6).
    ...Object.fromEntries(Object.entries(site.settings ?? {}).filter(([k]) => k !== 'metaTitle')),
    metaDescription: home.seoDescription,
    language: 'en-US',
    ...(faviconPath ? { faviconUrl: map[faviconPath].url } : {}),
  },
}

const idBySlug = new Map(existingPages.filter((p) => p.slug).map((p) => [p.slug, p.id]))
const seo = Object.fromEntries(input.pages.map((p) => [p.slug, p]))
const pages = converted.pages.map((p) => ({
  id: idBySlug.get(p.slug) ?? nid(),
  title: seo[p.slug]?.seoTitle || p.title,
  slug: p.slug,
  nodes: p.nodes,
  rootNodeId: p.rootNodeId,
}))

const body = {
  mode: 'replace',
  site: shell,
  changedPages: pages,
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs: {},
  shellBaseSeq: seq,
}
const bytes = Buffer.byteLength(JSON.stringify(body))
console.log(`nodes      renamed ${JSON.stringify(stats.renamed)}, ${stats.embeds} embeds, ${stats.nbsp} nbsp restored, ${stats.placeholders} script placeholders`)
console.log(`shell      ${Object.keys(shell.styleRules).length} bare classes, files ${shell.files.length} (site.css ${(siteCss.length / 1024).toFixed(0)} KB, site.js ${(siteJs.length / 1024).toFixed(0)} KB), favicon ${faviconPath ?? 'none'}`)
console.log(`pages      ${pages.length}, ${pages.reduce((n, p) => n + Object.keys(p.nodes).length, 0)} nodes; replacing ${existingPages.length} stored`)
console.log(`payload    ${(bytes / 1048576).toFixed(1)} MB`)
if (!apply) {
  console.log('\ndry run — re-run with --apply to write')
  process.exit(0)
}

const res = await api('PUT', '/admin/api/cms/site-document', body)
console.log('\nsaved:', JSON.stringify(res).slice(0, 200))

/* --- SEO cells: read, merge, write the WHOLE cells object, read back (trap 3) -------------- */
let seoOk = 0
for (const p of pages) {
  const src = seo[p.slug]
  if (!src?.seoTitle && !src?.seoDescription) continue
  try {
    const current = await api('GET', `/admin/api/cms/data/rows/${p.id}`)
    const cells = { ...(current.row?.cells ?? current.cells ?? {}) }
    if (!cells.body || !cells.slug) throw new Error('row is missing body/slug before the merge — refusing to write')
    cells.seoTitle = src.seoTitle
    cells.seoDescription = src.seoDescription
    await api('PATCH', `/admin/api/cms/data/rows/${p.id}`, { cells })
    const after = await api('GET', `/admin/api/cms/data/rows/${p.id}`)
    const ac = after.row?.cells ?? after.cells ?? {}
    if (!ac.slug || !Object.keys(ac.body?.nodes ?? {}).length) throw new Error(`row lost content after write (slug="${ac.slug}")`)
    seoOk++
  } catch (e) {
    console.log(`seo  ${p.slug}  FAILED ${String(e.message).slice(0, 160)}`)
    process.exitCode = 1
  }
}
console.log(`seo        ${seoOk}/${pages.length} rows carry seoTitle/seoDescription`)
