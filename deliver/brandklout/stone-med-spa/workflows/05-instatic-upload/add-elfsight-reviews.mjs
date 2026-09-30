#!/usr/bin/env node
/**
 * add-elfsight-reviews.mjs — the practice's live Google reviews (Elfsight) where the static
 * quote rails were, written straight into ONE instance's draft over the admin API.
 *
 *   node add-elfsight-reviews.mjs                       dry run against INSTATIC_BASE_URL
 *   node add-elfsight-reviews.mjs --apply               back up, write the draft, re-apply SEO cells
 *   node add-elfsight-reviews.mjs --apply --publish     ... and publish
 *
 *   INSTATIC_BASE_URL=https://staging.westlaketxmedspa.com node add-elfsight-reviews.mjs --apply --publish
 *   node add-elfsight-reviews.mjs --apply --publish     (production: the worktree .env's host)
 *
 * WHY NOT push-site.mjs. That is a whole-site replace through the Railway container (rebuild,
 * ship.sh, media map per instance) for two pages' worth of change, and it would carry every
 * local edit since the last push with it. This writes the two pages and two class rules in
 * one incremental save, with baseSeqs, so an edit made in the browser meanwhile is a 409, not
 * a loss. The SOURCE is still site-src: home.body.html and results.body.html carry the same
 * slot, so the next full re-push through push-site.mjs produces this same tree (its EMBEDS map
 * has the `google-reviews` key) and does not drop the widget.
 *
 * What it does, per page:
 *
 *   /          .words_section: `data-drag-scope` dropped; `.words_arrows` -> an `a.button.is-link`
 *              to /results; the full-bleed `.padding-global > .words_rail` block removed; a
 *              `.words_reviews[data-embed="google-reviews"]` slot carrying ONE Embed block appended
 *              after `.words_rail-head` inside the same `.padding-section-large`.
 *   /results   .wall_component, same shape: `.wall_arrows` -> link to the Google listing,
 *              `.wall_rail` block removed, `.wall_reviews[data-embed]` slot after `.wall_head`.
 *   shell      class rules `.words_reviews` and `.wall_reviews` added if missing — the registry
 *              form of what 55-words.css / 65-proof.css say. The old `.words_rail`, `.quote_card`
 *              etc. rules are left in the draft; publish-time tree shaking drops what no node uses.
 *
 * Re-runnable: a page that already carries its slot is left alone, except that an Embed whose
 * snippet differs from elfsight-reviews.mjs is brought up to date.
 *
 * SEO cells: PUT /site-document replaces a row's cells with pageToCells(), which drops seoTitle
 * and seoDescription (/results has both). They are captured before the write and PATCHed back
 * after it — the WHOLE cells object, never a partial; see the warning in push-site.mjs.
 *
 * The Embed block is `brandklout.embed-origins.embed` in snippet mode. A page that contains one
 * gets the plugin's compatible CSP, which is what lets platform.js reach Elfsight's API hosts;
 * they appear nowhere in the snippet. The snippet has NO `data-elfsight-app-lazy` — with it the
 * widget never boots on an Instatic page (elfsight-reviews.mjs says why).
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, publish, toChangedPage, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'
import { SNIPPET, TITLE, MIN_HEIGHT, WIDGET_ID } from '../04-design/.tmp/med-spa/site-src/elfsight-reviews.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const MODULE = 'brandklout.embed-origins.embed'
const SLOT_KEY = 'google-reviews'
const MOBILE = 'media:(max-width: 767px)'
const GOOGLE_LISTING = 'https://www.google.com/maps?cid=5029391273850887414'

const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

/* --- the plugin must be there, or the block publishes as "unknown module" --- */
{
  const installed = await api('GET', '/admin/api/cms/plugins')
  const row = (installed?.plugins ?? []).find((x) => x.id === 'brandklout.embed-origins')
  if (!row || !row.enabled || row.lifecycleStatus !== 'active') {
    throw new Error('brandklout.embed-origins is not installed/enabled on this instance — install it first (deliver/process/18-instatic-embeds)')
  }
  const policy = await api('GET', '/admin/api/cms/plugins/brandklout.embed-origins/settings').catch(() => null)
  const mode = policy?.values?.embedPolicy ?? policy?.settings?.embedPolicy ?? 'compatible (default)'
  console.log(`${BASE}\nplugin   brandklout.embed-origins ${row.version} active, embedPolicy=${mode}`)
}

/* --- read, and keep the untouched originals for the backup --- */
const siteRes = await getSite()
const pagesRes = await getPages()
const rawSite = JSON.stringify(siteRes)
const rawPages = JSON.stringify(pagesRes)
const { site: shell, seq } = siteRes
const rows = pagesRes.rows ?? []
const rules = shell.styleRules ?? (shell.styleRules = {})

const ruleByName = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)
const ruleId = (name) => {
  const r = ruleByName(name)
  if (!r) throw new Error(`the shell has no class rule .${name}`)
  return r.id
}
const nameOf = (id) => rules[id]?.name
const hasClass = (n, c) => (n?.classIds ?? []).some((x) => nameOf(x) === c)
const findByClass = (nodes, c) => Object.values(nodes).find((n) => hasClass(n, c))
const dropSubtree = (nodes, id) => {
  for (const c of nodes[id]?.children ?? []) dropSubtree(nodes, c)
  delete nodes[id]
}

/* --- the two slot rules, registry form of 55-words.css / 65-proof.css --- */
let shellChanged = false
const ensureRule = (name, styles, contextStyles) => {
  if (ruleByName(name)) { console.log(`rule     .${name} keep`); return }
  const order = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1
  const now = Date.now()
  const r = { id: nid(), name, kind: 'class', selector: `.${name}`, order, styles, contextStyles, createdAt: now, updatedAt: now }
  rules[r.id] = r
  shellChanged = true
  console.log(`rule     .${name} + ${JSON.stringify(styles)}`)
}
ensureRule('words_reviews',
  { marginTop: '2rem', minHeight: `${MIN_HEIGHT}px`, borderRadius: 'var(--radius-card)', background: 'var(--white)', color: 'var(--charcoal)', overflow: 'hidden' },
  { [MOBILE]: { marginTop: '1.5rem' } })
ensureRule('wall_reviews',
  { marginTop: '3rem', minHeight: `${MIN_HEIGHT}px`, border: '1px solid var(--line)', borderRadius: 'var(--radius-card)', background: 'var(--white)', overflow: 'hidden' },
  { [MOBILE]: { marginTop: '2rem' } })
/* The head that held the arrows now holds a text link; at 390 the two wrapped side by
   side, so on phones it stacks like .wall_head does (55-words.css, same media block). */
{
  const head = ruleByName('words_rail-head')
  if (!head) throw new Error('the shell has no class rule .words_rail-head')
  const want = { flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }
  const cur = (head.contextStyles ??= {})[MOBILE] ?? {}
  if (Object.entries(want).some(([k, v]) => cur[k] !== v)) {
    head.contextStyles[MOBILE] = { ...cur, ...want }
    head.updatedAt = Date.now()
    shellChanged = true
    console.log(`rule     .words_rail-head ${MOBILE} <- ${JSON.stringify(want)}`)
  } else console.log('rule     .words_rail-head keep')
}

/* --- node factories, shaped like what the importer makes of the same markup --- */
const embedNode = (parentId) => ({
  id: `googlereviewsembed${Math.random().toString(36).slice(2, 10)}`,
  moduleId: MODULE,
  props: { source: 'snippet', snippet: SNIPPET, url: '', title: TITLE, fit: 'auto', height: MIN_HEIGHT, ratio: '16 / 9', lazy: true, allowFullscreen: false, allow: '' },
  breakpointOverrides: {}, children: [], classIds: [], parentId,
})
const slotNode = (parentId, cls) => ({
  id: nid(), moduleId: 'base.container',
  props: { tag: 'div', customTag: '', htmlAttributes: { 'data-embed': SLOT_KEY } },
  breakpointOverrides: {}, classIds: [ruleId(cls)], parentId, children: [],
})
const linkNodes = (parentId, href, label) => {
  const a = { id: nid(), moduleId: 'base.link', props: { href, target: '_self', htmlAttributes: {} }, breakpointOverrides: {}, classIds: [ruleId('button'), ruleId('is-link')], parentId, children: [] }
  // `children: []` even on a text node: production's validator 400s a node without the
  // array ("children: Expected array"), staging's did not — first run, 2026-09-30.
  const t = { id: nid(), moduleId: 'base.text', props: { text: `${label} `, tag: 'none', htmlAttributes: {} }, breakpointOverrides: {}, classIds: [], parentId: a.id, children: [] }
  const arrow = { id: nid(), moduleId: 'base.text', props: { text: '→', tag: 'span', htmlAttributes: {} }, breakpointOverrides: {}, classIds: [ruleId('button_arrow')], parentId: a.id, children: [] }
  a.children = [t.id, arrow.id]
  return [a, t, arrow]
}

/* --- one page --- */
const place = (row, { section, head, arrows, rail, slot, link }) => {
  const nodes = row.cells.body.nodes
  const tag = `/${row.slug === 'index' ? '' : row.slug}`.padEnd(9)
  const sec = findByClass(nodes, section)
  if (!sec) throw new Error(`${tag} has no .${section}`)

  // Already placed by an earlier run: only bring a stale snippet up to date, and give any
  // node the first run left without a `children` array one (see linkNodes).
  if (findByClass(nodes, slot)) {
    const stale = Object.values(nodes).filter((n) => n.moduleId === MODULE && (n.props?.snippet ?? '').includes(WIDGET_ID) && n.props.snippet !== SNIPPET)
    for (const n of stale) n.props.snippet = SNIPPET
    const orphans = Object.values(nodes).filter((n) => !Array.isArray(n.children))
    for (const n of orphans) n.children = []
    console.log(`${tag} already has .${slot}${stale.length ? ` — snippet refreshed on ${stale.length} embed(s)` : ''}${orphans.length ? ` — children:[] added on ${orphans.length} node(s)` : ''}`)
    return stale.length + orphans.length > 0
  }

  const headN = findByClass(nodes, head)
  const railN = findByClass(nodes, rail)
  if (!headN || !railN) throw new Error(`${tag} is missing .${head} or .${rail}`)
  const arrowsId = (headN.children ?? []).find((c) => hasClass(nodes[c], arrows))
  if (!arrowsId) throw new Error(`${tag} .${head} has no .${arrows}`)

  // 1. the section no longer scopes a drag rail
  if (sec.props?.htmlAttributes && 'data-drag-scope' in sec.props.htmlAttributes) delete sec.props.htmlAttributes['data-drag-scope']

  // 2. arrows -> link, same position in the head
  const at = headN.children.indexOf(arrowsId)
  dropSubtree(nodes, arrowsId)
  const made = linkNodes(headN.id, link.href, link.label)
  for (const n of made) nodes[n.id] = n
  headN.children[at] = made[0].id

  // 3. the rail and its full-bleed wrapper go
  const wrap = nodes[railN.parentId]
  if (!wrap || wrap.parentId !== sec.id || !hasClass(wrap, 'padding-global') || wrap.children.length !== 1) {
    throw new Error(`${tag} .${rail} is not the only child of a .padding-global under .${section} — refusing to guess`)
  }
  sec.children = sec.children.filter((c) => c !== wrap.id)
  dropSubtree(nodes, wrap.id)

  // 4. the slot with its Embed, right after the head
  const parent = nodes[headN.parentId]
  const s = slotNode(parent.id, slot)
  const e = embedNode(s.id)
  s.children = [e.id]
  nodes[s.id] = s
  nodes[e.id] = e
  parent.children.splice(parent.children.indexOf(headN.id) + 1, 0, s.id)

  console.log(`${tag} .${arrows} -> link "${link.label}"; .${rail} block dropped; .${slot} ${s.id} + embed ${e.id} after .${head}`)
  return true
}

const changed = []
const seoBefore = {}
for (const [slug, spec] of [
  ['index', { section: 'words_section', head: 'words_rail-head', arrows: 'words_arrows', rail: 'words_rail', slot: 'words_reviews', link: { href: '/results', label: 'Results & reviews' } }],
  ['results', { section: 'wall_component', head: 'wall_head', arrows: 'wall_arrows', rail: 'wall_rail', slot: 'wall_reviews', link: { href: GOOGLE_LISTING, label: 'Google reviews' } }],
]) {
  const row = rows.find((r) => r.slug === slug)
  if (!row) throw new Error(`no page with slug "${slug}"`)
  if (place(row, spec)) {
    changed.push(row)
    seoBefore[row.id] = { seoTitle: row.cells.seoTitle, seoDescription: row.cells.seoDescription }
  }
}

console.log(`\ntarget   ${BASE}  shell seq ${seq}${shellChanged ? ' (+2 rules)' : ''}  pages ${changed.map((r) => `/${r.slug} (seq ${r.seq})`).join(', ') || 'none'}`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!changed.length && !shellChanged) { console.log('nothing to write'); process.exit(0) }

/* --- backup, then write --- */
// One folder PER SEQ, never reused: the first two runs on 2026-09-30 shared a name and the
// second (a rule tweak) overwrote the snapshot taken before the widget went in.
const label = /staging/.test(BASE) ? 'staging' : 'prod'
const stamp = new Date().toISOString().slice(0, 10)
const bak = path.join(HERE, '.tmp', `backup-${label}-${stamp}-seq${seq}-pre-reviews`)
if (fs.existsSync(bak)) throw new Error(`${path.relative(HERE, bak)} already exists — refusing to overwrite a snapshot`)
fs.mkdirSync(bak, { recursive: true })
fs.writeFileSync(path.join(bak, 'site.json'), rawSite)
fs.writeFileSync(path.join(bak, 'pages.json'), rawPages)
console.log(`backup   ${path.relative(HERE, bak)} (seq ${seq}, ${rows.length} pages)`)

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: changed.map((r) => toChangedPage(r)),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])),
  shellBaseSeq: seq,
})
console.log(`saved    ${JSON.stringify(res).slice(0, 160)}`)

/* --- SEO cells back on, whole row each time --- */
for (const r of changed) {
  const want = seoBefore[r.id]
  if (!want?.seoTitle && !want?.seoDescription) continue
  const current = await api('GET', `/admin/api/cms/data/rows/${r.id}`)
  const cells = { ...(current.row?.cells ?? current.cells ?? {}) }
  if (!cells.body || !cells.slug) throw new Error(`/${r.slug}: row is missing body/slug before the SEO merge — refusing to write`)
  if (cells.seoTitle === want.seoTitle && cells.seoDescription === want.seoDescription) { console.log(`seo      /${r.slug} intact`); continue }
  cells.seoTitle = want.seoTitle
  cells.seoDescription = want.seoDescription
  await api('PATCH', `/admin/api/cms/data/rows/${r.id}`, { cells })
  const after = await api('GET', `/admin/api/cms/data/rows/${r.id}`)
  const ac = after.row?.cells ?? after.cells ?? {}
  const n = Object.keys(ac.body?.nodes ?? {}).length
  if (!ac.slug || n === 0 || ac.seoTitle !== want.seoTitle) throw new Error(`/${r.slug}: row wrong after the SEO write (slug="${ac.slug}", nodes=${n}, seoTitle="${ac.seoTitle}")`)
  console.log(`seo      /${r.slug} re-applied (${n} nodes intact)`)
}

/* --- read back --- */
const back = (await getPages()).rows
for (const r of changed) {
  const nodes = back.find((x) => x.id === r.id).cells.body.nodes
  const embeds = Object.values(nodes).filter((n) => n.moduleId === MODULE && (n.props?.snippet ?? '').includes(WIDGET_ID))
  const slot = Object.values(nodes).find((n) => n.props?.htmlAttributes?.['data-embed'] === SLOT_KEY)
  const rails = Object.values(nodes).filter((n) => hasClass(n, 'words_rail') || hasClass(n, 'wall_rail') || hasClass(n, 'words_arrows') || hasClass(n, 'wall_arrows')).length
  const ok = embeds.length === 1 && embeds[0].props.snippet === SNIPPET && slot && slot.children?.[0] === embeds[0].id && rails === 0
  console.log(`check    /${r.slug}: ${embeds.length} embed, snippet ${embeds[0]?.props?.snippet === SNIPPET ? 'exact' : 'MISMATCH'}, slot ${slot ? 'present' : 'MISSING'}, old rail/arrows nodes ${rails} -> ${ok ? 'OK' : 'NOT OK'}`)
  if (!ok) process.exitCode = 1
}

if (PUBLISH) {
  if (process.exitCode) { console.log('not publishing: the read-back failed'); process.exit(1) }
  console.log(`publish  ${JSON.stringify(await publish()).slice(0, 200)}`)
}
