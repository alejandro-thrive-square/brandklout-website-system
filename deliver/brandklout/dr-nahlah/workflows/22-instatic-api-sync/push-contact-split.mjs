#!/usr/bin/env node
/**
 * push-contact-split.mjs — put the one-contact-page-per-office split onto the
 * Instatic DRAFT.
 *
 *   node push-contact-split.mjs            # report the plan, write nothing
 *   node push-contact-split.mjs --apply    # write the draft (does NOT publish)
 *
 * ## What this ships, and why
 *
 * The Webflow build split /contact in two on 2026-08-24, one page per office,
 * because the practice runs a SEPARATE LeadConnector form for each and a form
 * cannot be chosen at submit time. This brings Instatic to the same shape:
 *
 *   /contact              chooser  — the two offices, each linking to its page
 *   /contact-maclean      Tysons Corner form, axgcdqEPUFoHF8Dt5Nji
 *   /contact-alexandria   Alexandria form,    g7FeioS7e7quSCxIQHRw
 *
 * /contact is KEPT rather than deleted for the reason the legal pages were:
 * the sitewide nav, footer, drawer and the Book a Consult CTA all point at it,
 * 26 page bodies link to /contact#book, and Instatic has no redirect tool.
 * `#book` now lands on the office picker, so every one of those CTAs still
 * means "choose your office" without a single one of them being rewritten.
 *
 * ## The embed cannot travel as HTML, and that is the whole trick here
 *
 * `to-instatic.mjs` strips every <script> from a page body — correctly, because
 * the local package's scripts are code assets on Instatic. That also strips the
 * vendor's `form_embed.js`, so pushing the built markup verbatim would ship an
 * iframe that never resizes and, worse, a page the CSP filter does not
 * recognise as carrying an embed at all.
 *
 * So the body is pushed with an EMPTY marker div where the form goes, and the
 * form is then written over the REST API as a real
 * `webzite.embed-origins.embed` module node — the same shape the home page's
 * review widget already has. That is what makes both halves work:
 *
 *   - the module renders `<div class="wz-embed" data-wz-embed="auto">` around
 *     the snippet, and the plugin's publish filter switches that page to
 *     `compatible` CSP mode on seeing `data-wz-embed`. Without it the vendor
 *     iframe and script are refused and the form renders as nothing;
 *   - the module's own frontend runtime does the auto-height from the
 *     `lc.setHeight` message the frame posts.
 *
 * ## Order of operations
 *
 * MCP (`site_add_page`, `site_replace_node_html`) builds the node trees, because
 * it carries Instatic's own HTML parser and gets classIds right. REST
 * (`PUT /site-document`) then does the module-node surgery, because MCP has no
 * tool that can create a module node. Both are draft-only.
 *
 * Sections are inserted ONE AT A TIME. A single 13 KB payload is the shape this
 * bridge drops silently, and a silent drop on a replace leaves a half-built
 * page — the reasoning is push-page.mjs's and it has not changed.
 *
 * NOTHING HERE PUBLISHES. `POST /publish` bakes all 35 pages, so it stays a
 * separate, announced step with an audit either side of it.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { api, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const XPORT = join(HERE, '../13-content-export-import/.tmp')
const LOCAL = join(HERE, '../04-design/.tmp/final-site')
const APPLY = process.argv.includes('--apply')

/* The marker the body carries where the form belongs. It is deliberately not
   `.wz-embed`: that class is what the MODULE renders, and having the marker
   answer to the same name would make a half-finished push look finished. */
const SLOT = 'data-wz-embed-slot'

const PAGES = [
  {
    slug: 'contact',
    title: 'Contact & Locations | Dr. Nahlah Prosthodontics, Virginia',
    embed: null,
  },
  {
    slug: 'contact-maclean',
    title: 'Contact the Tysons Corner Office | Dr. Nahlah, McLean VA',
    embed: 'axgcdqEPUFoHF8Dt5Nji',
  },
  {
    slug: 'contact-alexandria',
    title: 'Contact the Alexandria Office | Dr. Nahlah Prosthodontics',
    embed: 'g7FeioS7e7quSCxIQHRw',
  },
]

// ── the MCP bridge ─────────────────────────────────────────────────────────

/**
 * THE NODE TOOLS NEED A LIVE EDITOR, AND THE BRIDGE DROPS WITHOUT WARNING.
 *
 * `site_add_page` runs headlessly, but `site_insert_html` and
 * `site_replace_node_html` answer "This tool runs in the Instatic Site editor"
 * unless encorercm.com/_instatic is open in a browser signed in as the
 * connector owner. That is the bridge limitation this whole workflow was
 * written around; it is not an auth problem and re-authorising does not help.
 *
 * Worse, it comes and goes: `get_context` reported siteConnected TRUE, a page
 * was created, and the very next call reported the editor closed. So every call
 * retries once, and a drop is reported as exactly what it is rather than as a
 * generic failure. The script is re-runnable: a page that already exists is
 * replaced rather than added, so picking up after a drop is just running it
 * again.
 */
function mcp(tool, args, attempt = 0) {
  try {
    const out = execFileSync(process.execPath, [
      join(XPORT, 'instatic-mcp.mjs'), 'call', tool, JSON.stringify(args),
    ], { cwd: XPORT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    const line = out.split('\n').filter((l) => l.trim() && !l.startsWith('[instatic-mcp]')).pop()
    try { return JSON.parse(line) } catch { return line }
  } catch (e) {
    const said = String(e.stdout ?? '')
    if (/runs in the Instatic Site editor/.test(said)) {
      if (attempt === 0) return mcp(tool, args, 1)
      console.error(
        `\nThe Instatic Site editor is not connected, so ${tool} cannot run.\n` +
        `Open https://encorercm.com/_instatic in a browser, signed in as the\n` +
        `connector owner, leave the Site editor open, and run this again.\n` +
        `Nothing was published; re-running is safe.`)
      process.exit(2)
    }
    throw e
  }
}

/** Refuse to start a multi-call write if the bridge is already down. */
function preflight() {
  const ctx = mcp('get_context', {})
  if (!ctx?.editor?.siteConnected) {
    console.error(
      'The Instatic Site editor is not connected.\n' +
      'Open https://encorercm.com/_instatic in a browser, signed in as the\n' +
      'connector owner, leave the Site editor open, and run this again.')
    process.exit(2)
  }
}

// ── the body, as Instatic should hold it ───────────────────────────────────

const { transform } = await import(pathToFileURL(join(XPORT, 'to-instatic.mjs')).href)

/**
 * Pull the vendor snippet out of the LOCAL build — not out of the transformed
 * HTML, which has already had the <script> stripped — and leave a marker div in
 * the transformed body where it stood.
 */
function bodyFor(slug) {
  const { html, unmapped } = transform(`${slug}.html`)
  if (unmapped.length) throw new Error(`${slug}: unmapped media ${unmapped.join(', ')}`)

  /* Comments FIRST, for the reason to-instatic.mjs strips them first: the page
     header explains this very wrapper and quotes `<div class="wz-embed"
     data-wz-embed="auto">` in prose, so an un-stripped match lands inside the
     comment and captures nothing. The guard below is what caught it. */
  const local = readFileSync(join(LOCAL, `${slug}.html`), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
  const m = local.match(/<div class="wz-embed" data-wz-embed="auto">([\s\S]*?)<\/div>/)
  const snippet = m ? m[1].trim() : null

  // The transformed copy still holds the wrapper with a script-less iframe.
  // Replace the whole wrapper with the marker; the module supplies both.
  const body = html.replace(
    /<div class="wz-embed" data-wz-embed="auto">[\s\S]*?<\/div>/,
    `<div ${SLOT}="leadconnector"></div>`)

  if (snippet && body.includes('leadconnectorhq')) {
    throw new Error(`${slug}: the vendor iframe survived into the pushed body`)
  }
  return { body, snippet }
}

/** Top-level sibling blocks, so each <section> is one insert. */
const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'col', 'embed', 'track', 'wbr'])
function topLevelBlocks(html) {
  const blocks = []
  let depth = 0, start = -1
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g
  let m
  while ((m = tag.exec(html))) {
    const [whole, close, name, attrs] = m
    if (VOID.has(name.toLowerCase()) || attrs.trimEnd().endsWith('/')) continue
    if (!close) { if (depth === 0) start = m.index; depth++ }
    else {
      depth--
      if (depth === 0 && start > -1) { blocks.push(html.slice(start, m.index + whole.length)); start = -1 }
    }
  }
  return blocks.filter((b) => b.trim())
}

// ── plan ───────────────────────────────────────────────────────────────────

const rows = (await getPages()).rows
const bySlug = new Map(rows.map((r) => [r.slug, r]))

const plan = []
for (const p of PAGES) {
  const { body, snippet } = bodyFor(p.slug)
  if (p.embed && !snippet) throw new Error(`${p.slug}: no vendor snippet found in the local build`)
  if (p.embed && !snippet.includes(p.embed)) {
    throw new Error(`${p.slug}: local snippet does not carry form id ${p.embed}`)
  }
  plan.push({ ...p, body, snippet, blocks: topLevelBlocks(body), row: bySlug.get(p.slug) })
}

for (const p of plan) {
  console.log(`${p.slug.padEnd(20)} ${p.row ? 'REPLACE ' + p.row.id : 'CREATE'} · ` +
    `${p.blocks.length} sections · ${p.body.length} chars` +
    (p.embed ? ` · embed ${p.embed} (${p.snippet.length} chars)` : ' · no embed'))
}

if (!APPLY) { console.log('\ndry run — nothing written. re-run with --apply'); process.exit(0) }

// ── write ──────────────────────────────────────────────────────────────────

preflight()

for (const p of plan) {
  let rootNodeId
  if (p.row) {
    const doc = mcp('site_list_documents', {})
    const hit = (doc.documents ?? doc).find?.((d) => d.slug === p.slug || d.id === p.row.id)
    rootNodeId = hit?.rootNodeId
    if (!rootNodeId) throw new Error(`${p.slug}: no rootNodeId from site_list_documents`)
    // One call clears the old children; the sections then land in source order.
    mcp('site_replace_node_html', { nodeId: rootNodeId, html: p.blocks[0] })
  } else {
    const made = mcp('site_add_page', { title: p.title, slug: p.slug })
    rootNodeId = made.rootNodeId
    if (!rootNodeId) throw new Error(`${p.slug}: site_add_page returned ${JSON.stringify(made)}`)
    mcp('site_insert_html', { parentId: rootNodeId, html: p.blocks[0], index: 0 })
  }
  for (let i = 1; i < p.blocks.length; i++) {
    mcp('site_insert_html', { parentId: rootNodeId, html: p.blocks[i], index: i })
    process.stdout.write('.')
  }
  console.log(` ${p.slug}: ${p.blocks.length} sections under ${rootNodeId}`)
  p.rootNodeId = rootNodeId
}

// ── verify ─────────────────────────────────────────────────────────────────

/* The failure mode on this bridge is not an error, it is a silent partial
   write: a payload is dropped and the page is left short, in a log full of
   successes. So every page is read BACK from the API and three counts are
   compared against the source — elements carrying a class, <img>, <section>.
   push-all.mjs's reasoning, and it has caught a drop before. */
function counts(html) {
  return {
    classed: (html.match(/\sclass="/g) || []).length,
    img: (html.match(/<img\b/g) || []).length,
    section: (html.match(/<section\b/g) || []).length,
  }
}

const after = (await getPages()).rows
let bad = 0
for (const p of plan) {
  const row = after.find((r) => r.slug === p.slug)
  if (!row) { console.log(`MISSING  ${p.slug}`); bad++; continue }
  const nodes = row.cells.body.nodes
  const got = {
    classed: Object.values(nodes).filter((n) => (n.classIds ?? []).length).length,
    img: Object.values(nodes).filter((n) => n.moduleId === 'base.image').length,
    section: Object.values(nodes).filter((n) => (n.props ?? {}).tag === 'section').length,
  }
  const want = counts(p.body)
  const ok = got.classed >= want.classed - 2 && got.img === want.img && got.section === want.section
  if (!ok) bad++
  console.log(`${ok ? 'OK  ' : 'BAD '} ${p.slug.padEnd(20)} ` +
    `classed ${got.classed}/${want.classed} · img ${got.img}/${want.img} · section ${got.section}/${want.section}`)
}

writeFileSync(join(HERE, '.tmp/contact-split-plan.json'),
  JSON.stringify(plan.map(({ slug, rootNodeId, embed }) => ({ slug, rootNodeId, embed })), null, 1))

if (bad) {
  console.error(`\n${bad} page(s) did not land whole — do NOT publish. Re-run, or restore from .tmp/backups/.`)
  process.exit(1)
}
console.log('\nbodies pushed and verified. run push-contact-embeds.mjs --apply to fit the form modules.')
