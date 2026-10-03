/**
 * add-elfsight-reviews.mjs — the live Google reviews (Elfsight) where the static rotator was.
 *
 *   INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/add-elfsight-reviews.mjs                    dry run
 *   INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/add-elfsight-reviews.mjs --apply            write the draft
 *   INSTATIC_BASE_URL=https://staging.ifadentistry.com node home/add-elfsight-reviews.mjs --apply --publish
 *
 * Widget: Elfsight Google Reviews app 7febe92d-b5da-447f-b53f-9593eec9da53, source the listing
 * "Institute for Advanced Dentistry and Implants", 13360 N 94th Dr B, Peoria, AZ 85381 (5.0 / 96).
 * Registry: deliver/process/tools/elfsight-reviews/review-widgets.json. Never create, edit or
 * delete a widget from here.
 *
 *   /  #proof  .voices (stars, "85 five-star reviews", three rotating quotes, arrows)  ->  Embed .rv-embed
 *
 * The chapter heading, the lede and the four story cards stay. The rotator goes whole: its
 * "85 five-star reviews" is a fixed count the live feed makes stale (the listing already says 96),
 * and the widget carries its own rating and count. home.js finds no [data-voices] and skips its
 * rotator block; the only other reference, `gsap.from('.voices > *', {trigger: voices})`, tolerates
 * a missing target (GSAP warns) and a null trigger (ScrollTrigger falls back to <body>).
 *
 * The Embed is the brandklout.embed-origins module in snippet mode; a page that contains one gets
 * the plugin's compatible CSP, which is what lets platform.js reach Elfsight's API hosts. A raw
 * <script> in page HTML would be stripped by Instatic.
 *
 * GOTCHA: push-home.mjs rebuilds the page from the local prototype (home/index.html), which still
 * has the static rotator. A re-push drops the widget: re-run this (--apply --publish) after it.
 * The script is re-runnable: an embed already placed gets its snippet refreshed, nothing else moves.
 *
 * Staging only (staging-only.mjs). Back up first: node home/snapshot-home.mjs <label>.
 * Redirect output to a file, never a pipe (Node 24 on Windows).
 */
import crypto from 'node:crypto'
import { api, getSite, getPages, publish, toChangedPage, BASE } from '../../../../../process/tools/instatic-api-sync/insta-api.mjs'
import { assertStaging } from './staging-only.mjs'

assertStaging(BASE)
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const MODULE = 'brandklout.embed-origins.embed'
const CLASS = 'rv-embed'
const APP = '7febe92d-b5da-447f-b53f-9593eec9da53'
const SNIPPET = [
  '<!-- Elfsight Google Reviews | Institute for Advanced Dentistry -->',
  '<script src="https://elfsightcdn.com/platform.js" async></script>',
  // No data-elfsight-app-lazy: with it, platform.js loads and never boots the widget on an
  // Instatic page (0px, no boot request). Verified on Mason Park Kids 2026-09-29.
  `<div class="elfsight-app-${APP}"></div>`,
].join('\n')
const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? (shell.styleRules = {})
const ruleByName = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)
const nameOf = (id) => rules[id]?.name
const hasClass = (n, c) => (n?.classIds ?? []).some((x) => nameOf(x) === c)
const cls = (n) => (n?.classIds ?? []).map(nameOf).filter(Boolean).join('.')

let shellChanged = false
let embedRule = ruleByName(CLASS)
if (!embedRule) {
  const order = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1
  const now = Date.now()
  embedRule = {
    id: nid(), name: CLASS, kind: 'class', selector: `.${CLASS}`, order,
    // What .voices gave the block: the rule above it and the breathing room; plus a floor so the
    // chapter does not collapse while platform.js boots.
    styles: { display: 'block', width: '100%', minHeight: '420px', marginTop: '6rem', paddingTop: '3.5rem', borderTop: '1px solid var(--rule, rgba(55, 52, 53, .17))' },
    contextStyles: {}, createdAt: now, updatedAt: now,
  }
  rules[embedRule.id] = embedRule
  shellChanged = true
  console.log(`rule    + .${CLASS} (order ${order})`)
} else console.log(`rule    .${CLASS} exists (${embedRule.id})`)

const rows = (await getPages()).rows ?? []
const row = rows.find((r) => r.slug === 'index')
if (!row) throw new Error('staging has no index page')
const nodes = row.cells.body.nodes
console.log(`page    index#${row.id} seq ${row.seq ?? 0}; cells: ${Object.keys(row.cells).filter((k) => k !== 'body').join(', ')}`)

const dropSubtree = (id) => { for (const c of nodes[id]?.children ?? []) dropSubtree(c); delete nodes[id] }
let changed = false

const placed = Object.values(nodes).filter((n) => n.moduleId === MODULE && new RegExp(`elfsight-app-${APP}`).test(n.props?.snippet ?? ''))
if (placed.length) {
  const stale = placed.filter((n) => n.props.snippet !== SNIPPET)
  for (const n of stale) n.props.snippet = SNIPPET
  console.log(`index   already has the widget (${placed.length} embed${placed.length > 1 ? 's' : ''}); snippet ${stale.length ? `refreshed on ${stale.length}` : 'exact'}`)
  changed = stale.length > 0
} else {
  const voices = Object.values(nodes).find((n) => hasClass(n, 'voices'))
  if (!voices) throw new Error('index has neither the widget nor a .voices block: nothing to replace')
  const parent = nodes[voices.parentId]
  const at = parent.children.indexOf(voices.id)
  if (at < 0) throw new Error('.voices is not among its parent\'s children')
  const before = parent.children.map((c) => `${nodes[c].moduleId}.${cls(nodes[c]) || '_'}`).join(' | ')
  const made = {
    id: nid(), moduleId: MODULE, parentId: parent.id, classIds: [embedRule.id], children: [], breakpointOverrides: {},
    props: { source: 'snippet', snippet: SNIPPET, url: '', title: 'Google reviews', fit: 'auto', height: 420, ratio: '16 / 9', lazy: true, allowFullscreen: false, allow: '' },
  }
  const dropped = (function count (id) { return 1 + (nodes[id]?.children ?? []).reduce((a, c) => a + count(c), 0) })(voices.id)
  dropSubtree(voices.id)
  nodes[made.id] = made
  parent.children[at] = made.id
  console.log(`index   .voices ${voices.id} (${dropped} nodes) -> embed ${made.id} at index ${at} of .${cls(parent)}`)
  console.log(`        before: ${before}`)
  console.log(`        after:  ${parent.children.map((c) => `${nodes[c].moduleId}.${cls(nodes[c]) || '_'}`).join(' | ')}`)
  changed = true
}

console.log(`\ntarget  ${BASE}  shell seq ${seq}  ${changed ? 'page changes: index' : 'no page change'}${shellChanged ? ', shell: new rule' : ''}`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!changed && !shellChanged) { if (PUBLISH) console.log('publish', JSON.stringify(await publish()).slice(0, 160)); process.exit(0) }

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: changed ? [toChangedPage(row, { nodes, rootNodeId: row.cells.body.rootNodeId })] : [],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: changed ? { [row.id]: row.seq ?? 0 } : {},
  shellBaseSeq: seq,
})
console.log(`saved   ${JSON.stringify(res).slice(0, 160)}`)

const back = (await getPages()).rows.find((r) => r.id === row.id)
const embeds = Object.values(back.cells.body.nodes).filter((n) => n.moduleId === MODULE && (n.props?.snippet ?? '').includes(APP))
const leftover = Object.values(back.cells.body.nodes).filter((n) => hasClass(n, 'voices'))
console.log(`check   index: ${embeds.length} review embed(s), snippet ${embeds[0]?.props?.snippet === SNIPPET ? 'exact' : 'MISMATCH'}, .voices left: ${leftover.length}`)
if (embeds.length !== 1 || leftover.length) process.exitCode = 1
if (PUBLISH) console.log('publish', JSON.stringify(await publish()).slice(0, 160))
