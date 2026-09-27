#!/usr/bin/env node
/**
 * push-contact-embeds.mjs — finish the contact split over the REST API, with no
 * browser anywhere in the loop.
 *
 *   node push-contact-embeds.mjs            # report the plan, write nothing
 *   node push-contact-embeds.mjs --apply    # write the draft (does NOT publish)
 *
 * Two jobs, both of which push-contact-split.mjs cannot do:
 *
 * 1. FIT THE FORM MODULES. `to-instatic.mjs` strips every <script> from a page
 *    body, so the vendor's `form_embed.js` cannot travel as markup, and the MCP
 *    surface has no tool that creates a module node at all. So the body is
 *    pushed carrying an empty `[data-wz-embed-slot]` marker and the real
 *    `webzite.embed-origins.embed` node is written here, in the same shape the
 *    home page's review widget already has. That node is what makes the form
 *    work at all: the module renders `<div class="wz-embed" data-wz-embed="auto">`
 *    around the snippet, and the plugin's publish filter switches the page to
 *    `compatible` CSP mode on seeing that attribute. Without it the iframe and
 *    the vendor script are both refused and the form renders as nothing.
 *
 * 2. BUILD /contact-alexandria BY CLONING /contact-maclean. The editor bridge
 *    dropped halfway through the first push and left the Alexandria page
 *    created but empty. Rather than wait for a browser, this deep-clones the
 *    McLean tree with fresh ids — which is not a shortcut but the accurate
 *    thing to do: the Webflow build's two contact pages are byte-identical
 *    apart from the embedded form, and so are these. Exactly two things then
 *    differ, and both are asserted below: the breadcrumb leaf and the form.
 *
 * Ids are nanoid-21 from the platform's own alphabet. Cloning rewrites every
 * id, every `parentId` and every entry of every `children` array through one
 * map, and refuses to write if any reference is left dangling.
 *
 * NOTHING HERE PUBLISHES.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const LOCAL = join(HERE, '../04-design/.tmp/final-site')
const APPLY = process.argv.includes('--apply')

const SLOT_ATTR = 'data-wz-embed-slot'
const EMBED_MODULE = 'webzite.embed-origins.embed'

/* Mirrors the home page's review-widget node exactly. `fit: 'auto'` is what
   arms the module's height runtime for the `lc.setHeight` message the
   LeadConnector frame posts; `height` is only the pre-measure fallback. */
const embedNode = (id, parentId, snippet) => ({
  props: {
    source: 'snippet',
    url: '',
    snippet,
    title: '',
    fit: 'auto',
    height: 600,
    ratio: '16 / 9',
    lazy: true,
    allowFullscreen: false,
    allow: '',
  },
  breakpointOverrides: {},
  children: [],
  id,
  moduleId: EMBED_MODULE,
  classIds: [],
  parentId,
})

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
function nanoid() {
  const b = randomBytes(21)
  let s = ''
  for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]
  return s
}

/** The vendor snippet, read from the local build (the transformed copy has had
    its <script> stripped, which is the whole reason this file exists). */
function snippetFor(slug) {
  const html = readFileSync(join(LOCAL, `${slug}.html`), 'utf8').replace(/<!--[\s\S]*?-->/g, '')
  const m = html.match(/<div class="wz-embed" data-wz-embed="auto">([\s\S]*?)<\/div>/)
  if (!m) throw new Error(`${slug}: no embed block in the local build`)
  const s = m[1].trim()
  if (!/leadconnectorhq\.com\/widget\/form\//.test(s)) throw new Error(`${slug}: snippet has no form iframe`)
  if (!/form_embed\.js/.test(s)) throw new Error(`${slug}: snippet lost the vendor script`)
  return s
}

const PAGES = [
  { slug: 'contact-maclean', form: 'axgcdqEPUFoHF8Dt5Nji', crumb: 'Tysons Corner · McLean' },
  { slug: 'contact-alexandria', form: 'g7FeioS7e7quSCxIQHRw', crumb: 'Alexandria' },
]

const site = await getSite()
const rows = (await getPages()).rows
const row = (slug) => {
  const r = rows.find((x) => x.slug === slug)
  if (!r) throw new Error(`${slug}: not on the site`)
  return r
}

// ── clone ──────────────────────────────────────────────────────────────────

/** Deep-clone a node map under fresh ids. Returns { nodes, rootNodeId }. */
function cloneTree(nodes, rootNodeId) {
  const map = new Map(Object.keys(nodes).map((id) => [id, nanoid()]))
  const out = {}
  for (const [oldId, n] of Object.entries(nodes)) {
    const id = map.get(oldId)
    out[id] = {
      ...structuredClone(n),
      id,
      parentId: n.parentId ? map.get(n.parentId) ?? null : null,
      children: (n.children ?? []).map((c) => {
        const to = map.get(c)
        if (!to) throw new Error(`dangling child ${c} under ${oldId}`)
        return to
      }),
    }
  }
  for (const n of Object.values(out)) {
    if (n.parentId && !out[n.parentId]) throw new Error(`dangling parent on ${n.id}`)
  }
  return { nodes: out, rootNodeId: map.get(rootNodeId) }
}

/** The single base.text span that closes the breadcrumb. */
function crumbLeaf(nodes) {
  const crumb = Object.values(nodes).find((n) =>
    (n.classIds ?? []).includes(classId('pk-crumb')))
  if (!crumb) throw new Error('no .pk-crumb on the page')
  const leaf = crumb.children
    .map((c) => nodes[c])
    .filter((n) => n.moduleId === 'base.text' && (n.props ?? {}).tag === 'span')
    .pop()
  if (!leaf) throw new Error('.pk-crumb has no closing span')
  return leaf
}

/** Class ids are per-site and live on the shell, never in a page. */
const CLASSES = site.site.styleRules
function classId(name) {
  const hit = Object.values(CLASSES).find((r) => r.name === name && r.kind === 'class')
  if (!hit) throw new Error(`no class rule named ${name}`)
  return hit.id
}

function slotNode(nodes) {
  const hit = Object.values(nodes).find((n) => ((n.props ?? {}).htmlAttributes ?? {})[SLOT_ATTR])
  return hit ?? null
}

// ── plan ───────────────────────────────────────────────────────────────────

const src = row('contact-maclean')
const srcNodes = src.cells.body.nodes
if (Object.keys(srcNodes).length < 100) {
  throw new Error('contact-maclean is not built; run push-contact-split.mjs first')
}

const writes = []
for (const p of PAGES) {
  const r = row(p.slug)
  let nodes = r.cells.body.nodes
  let rootNodeId = r.cells.body.rootNodeId
  let note = 'in place'

  if (Object.keys(nodes).length < 100) {
    const cloned = cloneTree(srcNodes, src.cells.body.rootNodeId)
    nodes = cloned.nodes
    rootNodeId = cloned.rootNodeId
    note = `cloned from contact-maclean (${Object.keys(nodes).length} nodes)`
  }

  // the breadcrumb leaf names the office
  const leaf = crumbLeaf(nodes)
  const crumbWas = leaf.props.text
  leaf.props = { ...leaf.props, text: p.crumb }

  // the form
  const snippet = snippetFor(p.slug)
  if (!snippet.includes(p.form)) throw new Error(`${p.slug}: snippet is not form ${p.form}`)

  let embed = Object.values(nodes).find((n) => n.moduleId === EMBED_MODULE)
  if (embed) {
    embed.props = { ...embed.props, source: 'snippet', snippet }
  } else {
    const slot = slotNode(nodes)
    if (!slot) throw new Error(`${p.slug}: no [${SLOT_ATTR}] to fit the form into`)
    if (slot.children.length) throw new Error(`${p.slug}: the slot is not empty`)
    const node = embedNode(nanoid(), slot.id, snippet)
    nodes[node.id] = node
    slot.children = [node.id]
    embed = node
  }

  writes.push({ slug: p.slug, id: r.id, title: r.cells.title, seq: r.seq, nodes, rootNodeId })
  console.log(`${p.slug.padEnd(20)} ${note} · crumb "${crumbWas}" -> "${p.crumb}" · ` +
    `form ${p.form} (${snippet.length} chars) · ${Object.keys(nodes).length} nodes`)
}

if (!APPLY) { console.log('\ndry run — nothing written. re-run with --apply'); process.exit(0) }

// ── write ──────────────────────────────────────────────────────────────────

/* `changedPages` takes FLAT Page objects — id, slug, title, nodes, rootNodeId
   at the top level — never the `cells`-shaped rows GET /pages returns. The
   validator rejects the wrong shape one field per round trip. */
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: site.site,
  changedPages: writes.map((w) => ({
    id: w.id, slug: w.slug, title: w.title, nodes: w.nodes, rootNodeId: w.rootNodeId,
  })),
  deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(writes.map((w) => [w.id, w.seq])),
  shellBaseSeq: site.seq,
})
console.log('written:', JSON.stringify(res).slice(0, 200))

// ── verify, against a fresh read ───────────────────────────────────────────

const after = (await getPages()).rows
let bad = 0
for (const p of PAGES) {
  const r = after.find((x) => x.slug === p.slug)
  const nodes = r.cells.body.nodes
  const embed = Object.values(nodes).find((n) => n.moduleId === EMBED_MODULE)
  const leaf = crumbLeaf(nodes)
  const ok = !!embed &&
    embed.props.source === 'snippet' &&
    embed.props.snippet.includes(p.form) &&
    embed.props.snippet.includes('form_embed.js') &&
    embed.props.fit === 'auto' &&
    leaf.props.text === p.crumb &&
    Object.keys(nodes).length > 100
  if (!ok) bad++
  console.log(`${ok ? 'OK  ' : 'BAD '} ${p.slug.padEnd(20)} nodes=${Object.keys(nodes).length} ` +
    `crumb="${leaf.props.text}" form=${embed ? p.form : 'MISSING'}`)
}
if (bad) { console.error(`\n${bad} page(s) wrong — do NOT publish.`); process.exit(1) }
console.log('\nboth location pages carry their own form. Nothing published.')
