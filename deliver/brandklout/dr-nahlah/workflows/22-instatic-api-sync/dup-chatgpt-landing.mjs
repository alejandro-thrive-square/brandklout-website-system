#!/usr/bin/env node
/**
 * dup-chatgpt-landing.mjs — the ChatGPT Ads All-on-4 landing page (2026-09-23).
 *
 *   node dup-chatgpt-landing.mjs            # plan only
 *   node dup-chatgpt-landing.mjs --apply    # write the draft; publish separately
 *
 * Gauge (Brandklout) asked for ONE dedicated All-on-4 page for ChatGPT Ads:
 * the page only, no consultation or thank-you page of its own. Alejandro picked
 * the Alexandria office and said to keep that office's existing GHL form.
 *
 * So this is a straight copy of the LIVE `ads-landing-pages/alexandria-all-on-4`
 * (not a rebuild from site-src: the live page carries BugHerd and warranty edits
 * the local nodes may not), with two changes:
 *
 *  - every node gets a fresh id (parent/children/rootNodeId remapped), so the
 *    two pages share nothing but class rules;
 *  - every link to the Google consultation page becomes `#book`, the hero form
 *    on this page. A ChatGPT visitor must never step into the Google funnel.
 *
 * Then, in the shell: the page id joins `src/styles/landing.css`'s scope, and
 * `src/scripts/seo-head.js` gains a map entry (copied from the Alexandria
 * page's, so it is `noindex, follow` like every ads page). seo-head.js is
 * patched in place, NOT regenerated: the live file carries fix-seo-head-*
 * edits gen-seo-head.mjs does not know about.
 *
 * The pixel is set-openai-pixel.mjs's job. Runs against INSTATIC_BASE_URL, so
 * the staging mirror is the same command with that pointed at staging.
 * Re-runnable: an existing target is replaced in its own id.
 */
import { randomBytes } from 'node:crypto'
import { api, getSite, getPages, saveShell, templateMap, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const SRC = 'ads-landing-pages/alexandria-all-on-4'
const DST = 'ads-landing-pages/alexandria-all-on-4-chatgpt'
const FUNNEL = '/ads-landing-pages/alexandria-all-on-4-consultation'
const CSS_ASSET = 'src/styles/landing.css'
const SEO_ASSET = 'src/scripts/seo-head.js'

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => { const b = randomBytes(21); let s = ''; for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]; return s }
const slugOf = (r) => r.cells?.slug ?? r.slug

console.log(BASE)
const rows = (await getPages()).rows
const src = rows.find((r) => slugOf(r) === SRC)
if (!src) { console.error(`no ${SRC}`); process.exit(1) }
const existing = rows.find((r) => slugOf(r) === DST) ?? null
const pageId = existing?.id ?? nanoid()

// ── the copy ────────────────────────────────────────────────────────────────
const map = new Map(Object.keys(src.cells.body.nodes).map((id) => [id, nanoid()]))
const nodes = {}
let relinked = 0
for (const [id, n0] of Object.entries(src.cells.body.nodes)) {
  const n = structuredClone(n0)
  n.id = map.get(id)
  n.parentId = n.parentId == null ? null : map.get(n.parentId)
  if (Array.isArray(n.children)) n.children = n.children.map((c) => map.get(c))
  if (n.props?.href === FUNNEL) { n.props.href = '#book'; relinked++ }
  nodes[n.id] = n
}
const rootNodeId = map.get(src.cells.body.rootNodeId)
const leftover = JSON.stringify(nodes).includes('-consultation')
const hasBook = Object.values(nodes).some((n) => n.props?.htmlAttributes?.id === 'book')
console.log(`  source   /${SRC} ${src.id}  ${map.size} nodes`)
console.log(`  target   /${DST} ${existing ? 'REPLACE ' + pageId : 'CREATE'}`)
console.log(`  links    ${relinked} -> #book; consultation refs left: ${leftover}; #book anchor present: ${hasBook}`)
if (leftover || !hasBook || !relinked) { console.error('copy check failed'); process.exit(1) }

// ── the shell edits ─────────────────────────────────────────────────────────
const { site: shell0 } = await getSite()
const cssFile = shell0.files.find((f) => f.path === CSS_ASSET)
const seoFile = shell0.files.find((f) => f.path === SEO_ASSET)
const cssScope = shell0.runtime.styles[cssFile.id].scope.pageIds
console.log(`  css      ${CSS_ASSET} scope ${cssScope.includes(pageId) ? 'keep' : 'ADD'} (${cssScope.length})`)
const seoHas = seoFile.content.includes(`"/${DST}":`)
console.log(`  seo      ${SEO_ASSET} entry ${seoHas ? 'keep' : 'ADD'}`)

if (!APPLY) { console.log('\nplan only — pass --apply'); process.exit(0) }

const templatesBefore = await templateMap()

// write 1: the page (the last write the page gets — a PATCH on the row would flatten the slash)
{
  const { site: sh, seq } = await getSite()
  const entry = { id: pageId, slug: DST, title: src.cells.title, nodes, rootNodeId }
  await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: sh, changedPages: [entry], deletedPageIds: [],
    changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: existing ? { [pageId]: existing.seq } : {}, shellBaseSeq: seq,
  })
  const back = (await api('GET', `/admin/api/cms/data/rows/${pageId}`)).row
  const n = Object.keys(back.cells.body.nodes).length
  if (n !== map.size || slugOf(back) !== DST) { console.error(`page READ-BACK MISMATCH: ${n} nodes, /${slugOf(back)}`); process.exit(1) }
  console.log(`page written and read back: /${DST} ${pageId} ${n} nodes`)
}

// write 2: stylesheet scope + seo-head entry
{
  const { site: shell, seq } = await getSite()
  const css = shell.files.find((f) => f.path === CSS_ASSET)
  const cfg = shell.runtime.styles[css.id]
  cfg.scope.pageIds = [...new Set([...cfg.scope.pageIds, pageId])]
  const seo = shell.files.find((f) => f.path === SEO_ASSET)
  if (!seo.content.includes(`"/${DST}":`)) {
    const key = `"/${SRC}":`
    const i = seo.content.indexOf(key)
    if (i === -1) { console.error('seo-head has no source entry'); process.exit(1) }
    const j = seo.content.indexOf('}', i) + 1
    const entry = seo.content.slice(i + key.length, j)
    seo.content = seo.content.slice(0, j) + `,"/${DST}":${entry}` + seo.content.slice(j)
    seo.updatedAt = Date.now()
  }
  await saveShell(shell, seq)
  const { site: after } = await getSite()
  const okCss = after.runtime.styles[css.id].scope.pageIds.includes(pageId)
  const okSeo = after.files.find((f) => f.path === SEO_ASSET).content.includes(`"/${DST}":`)
  if (!okCss || !okSeo) { console.error(`shell READ-BACK MISMATCH css ${okCss} seo ${okSeo}`); process.exit(1) }
  console.log('landing.css scope and seo-head entry written and read back')
}

const templatesAfter = await templateMap()
const lost = Object.keys(templatesBefore).filter((s) => !templatesAfter[s])
if (lost.length) { console.error(`TEMPLATES LOST: ${lost.join(', ')} — do NOT publish`); process.exit(1) }
console.log('templates intact. draft only — publish with do-publish.mjs')
