#!/usr/bin/env node
/**
 * publish-deck.mjs: put the concept deck (../concepts/*.html) on the client's Instatic STAGING site,
 * one page per file, each page = one brandklout.embed-origins Embed block in snippet mode holding the
 * whole concept (its head fonts/styles/scripts, then its body). The Hackensack deck did the same thing
 * on Webflow with one embed per page.
 *
 *   node with-setup-env.mjs INSTATIC_BASE_URL=https://<client>-staging.up.railway.app -- node publish-deck.mjs [--dry]
 *
 * Pages: index.html -> /concepts, concept-0N-<slug>.html -> /concept-0N-<slug>. Links between deck
 * files are rewritten to those slugs. Every page carries noindex (injected into <head> at runtime,
 * because staging has no domain to put an X-Robots-Tag on yet). Refuses to run against a host that
 * is not a staging host. Publishing bakes every page of the staging site.
 *
 * Why an Embed and not the push pipeline: the deck is a presentation the client throws away once a
 * direction is picked. Converting five GSAP-heavy pages into native editable nodes buys nothing.
 * The chosen concept is rebuilt natively in scenario 0 step 03.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, publish, BASE } from '../../../../tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DECK = path.resolve(HERE, '../concepts')
const DRY = process.argv.includes('--dry')
const MODULE_ID = 'brandklout.embed-origins.embed'

if (!/staging/.test(BASE)) { console.error(`refusing: ${BASE} is not a staging host`); process.exit(2) }

const slugOf = (file) => (file === 'index.html' ? 'concepts' : file.replace(/\.html$/, ''))
const files = fs.readdirSync(DECK).filter((f) => f.endsWith('.html')).sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)))

const NOINDEX = '<script>(function(){var m=document.createElement("meta");m.name="robots";m.content="noindex, nofollow";document.head.appendChild(m)})()</script>'

function toSnippet(html) {
  const htmlClass = (html.match(/<html[^>]*\bclass="([^"]*)"/) || [])[1] || ''
  const head = html.slice(html.indexOf('<head'), html.indexOf('</head>'))
  const keep = [...head.matchAll(/<link\b[^>]*>|<style\b[\s\S]*?<\/style>|<script\b[\s\S]*?<\/script>/g)].map((m) => m[0])
  const bodyOpen = html.indexOf('>', html.indexOf('<body')) + 1
  const body = html.slice(bodyOpen, html.lastIndexOf('</body>'))
  const classes = htmlClass.split(/\s+/).filter(Boolean)
  const replay = classes.length ? `<script>document.documentElement.classList.add(${classes.map((c) => JSON.stringify(c)).join(',')})</script>` : ''
  let out = [NOINDEX, replay, ...keep, body].join('\n')
  // deck links -> page slugs
  out = out.replace(/href="(index|concept-0\d-[a-z0-9-]+)\.html(#[^"]*)?"/g, (_, f, hash) => `href="/${slugOf(`${f}.html`)}${hash || ''}"`)
  return out
}

const titleOf = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1]?.trim() || 'Livewell concept'

const node = (id, moduleId, props, children = [], parentId = null) => ({ id, moduleId, props, children, parentId, classIds: [], breakpointOverrides: {} })

const existing = await getPages()
const changedPages = []
const baseSeqs = {}
for (const file of files) {
  const html = fs.readFileSync(path.join(DECK, file), 'utf8')
  const slug = slugOf(file)
  const row = existing.rows.find((r) => r.cells.slug === slug)
  const id = row?.id ?? `deck${slug.replace(/[^a-z0-9]/g, '').slice(0, 24)}${Date.now().toString(36)}`
  const root = `${id}-root`, block = `${id}-embed`
  const snippet = toSnippet(html)
  changedPages.push({
    id, slug, title: titleOf(html),
    rootNodeId: root,
    nodes: {
      [root]: node(root, 'base.body', {}, [block]),
      [block]: node(block, MODULE_ID, { source: 'snippet', snippet, url: '', title: '', fit: 'auto', height: 600, ratio: '16 / 9', lazy: false, allowFullscreen: false, allow: '' }, [], root),
    },
  })
  if (row) baseSeqs[row.id] = row.seq
  console.log(`${row ? 'update' : 'create'} /${slug}  (${file}, snippet ${Math.round(snippet.length / 1024)} KB)`)
}

if (DRY) { console.log('\n--dry: nothing written'); process.exit(0) }

const { site, seq } = await getSite()
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site, changedPages, deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs, shellBaseSeq: seq,
})
console.log('saved', JSON.stringify(res).slice(0, 160))
console.log('publish', JSON.stringify(await publish()).slice(0, 200))
for (const f of files) console.log(`  ${BASE}/${slugOf(f)}`)
