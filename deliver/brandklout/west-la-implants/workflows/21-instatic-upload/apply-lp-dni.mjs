#!/usr/bin/env node
/**
 * apply-lp-dni.mjs — call tracking on the six ad pages (Brandklout review 2026-10-06: "Install DNI
 * and confirm the displayed number and phone link swap correctly").
 *
 *   node apply-lp-dni.mjs                      # dry run
 *   node apply-lp-dni.mjs --apply              # write the draft + plugin settings
 *   node apply-lp-dni.mjs --apply --publish    # ...and publish (guarded)
 *
 * The sub-account's one pool, "West LA Implants Tracking Pool" (AOlbqr2yJc0FxkJ9yUFR, 4 numbers),
 * swaps the MAIN line (310) 481-0111. The ad pages showed the new-patient line (310) 692-9316,
 * which no pool swaps; the user chose (2026-10-07) to show the main line on the ads and use the
 * existing pool. So:
 *   1. the six /ads-landing-pages/ rows: "(310) 692-9316" -> "(310) 481-0111",
 *      tel:+13106929316 -> tel:+13104810111, and the JSON-LD telephone in data-seo. Surgical, per
 *      node, each row written against its own seq. No other page is touched.
 *   2. embed-origins (1.8.0+, page scoping) siteScripts: the pool and GHL's user_session.js, both
 *      `#pages=ads-landing-pages/*`; connectOrigins: services.leadconnectorhq.com and
 *      services.msgsndr.com (the pool asks and reports there; pages without an Embed block, the
 *      thank-you pages, would refuse it). Read, merge, write; every other key must come back as it was.
 * Publish refuses if the draft did not match the published site at the start, or if any other row
 * moved during the run. Re-runnable.
 */
import { api, getPages, getSite, publish, publishStatus, toChangedPage, templateMap, assertTemplatesIntact, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const P = 'ads-landing-pages/'
const SLUGS = ['all-on-6', 'all-on-6-consultation', 'thank-you-all-on-6', '3-on-6', '3-on-6-consultation', 'thank-you-3-on-6'].map((s) => P + s)
const SWAPS = [
  ['(310) 692-9316', '(310) 481-0111'],
  ['tel:+13106929316', 'tel:+13104810111'],
  ['+1-310-692-9316', '+1-310-481-0111'],
]
const POOL = 'https://backend.leadconnectorhq.com/appengine/loc/0iwrVBEYONV6VlSHSGH6/pool/AOlbqr2yJc0FxkJ9yUFR/number_pool.js'
const SESSION = 'https://backend.leadconnectorhq.com/appengine/js/user_session.js'
const SCOPE = '#pages=ads-landing-pages/*'
const SCRIPT_LINES = [POOL + SCOPE, SESSION + SCOPE]
const CONNECT = ['https://services.leadconnectorhq.com', 'https://services.msgsndr.com']
const PLUGIN = 'brandklout.embed-origins'

const swapAll = (s) => SWAPS.reduce((t, [a, b]) => t.split(a).join(b), s)

// ── read ──────────────────────────────────────────────────────────────
const start = await publishStatus()
if (!start.draftMatchesPublished) {
  console.error('REFUSING: the draft already differs from the published site (someone has unpublished work in it).')
  process.exit(1)
}
const plugin = await api('GET', `/admin/api/cms/plugins/${PLUGIN}/settings`)
const settings = { ...(plugin.settings ?? {}) }
const version = (await api('GET', '/admin/api/cms/plugins')).plugins?.find?.((p) => p.id === PLUGIN)?.version
if (version && version.localeCompare('1.8.0', undefined, { numeric: true }) < 0) {
  console.error(`REFUSING: ${PLUGIN} is ${version}; page scoping needs 1.8.0+ (older puts the pool on every page).`)
  process.exit(1)
}
const site = await getSite()
const { rows } = await getPages()
const startRows = new Map(rows.map((r) => [r.id, { seq: r.seq, updatedAt: r.updatedAt }]))

// ── pages ─────────────────────────────────────────────────────────────
const changed = []
for (const slug of SLUGS) {
  const row = rows.find((r) => r.slug === slug)
  if (!row) throw new Error(`no row ${slug}`)
  let n = 0
  for (const node of Object.values(row.cells.body.nodes)) {
    const props = node.props ?? {}
    const next = { ...props }
    for (const k of ['text', 'href']) if (typeof props[k] === 'string' && swapAll(props[k]) !== props[k]) { next[k] = swapAll(props[k]); n++ }
    const seo = props.htmlAttributes?.['data-seo']
    if (seo) {
      const json = Buffer.from(seo, 'base64').toString('utf8')
      if (swapAll(json) !== json) { next.htmlAttributes = { ...props.htmlAttributes, 'data-seo': Buffer.from(swapAll(json), 'utf8').toString('base64') }; n++ }
    }
    if (n && next !== props) node.props = next
  }
  const left = JSON.stringify(row.cells.body.nodes).match(/692[^0-9]{0,3}9316|6929316/g)?.length ?? 0
  const seoLeft = Object.values(row.cells.body.nodes).some((x) => x.props?.htmlAttributes?.['data-seo'] && /692-9316/.test(Buffer.from(x.props.htmlAttributes['data-seo'], 'base64').toString('utf8')))
  console.log(`/${slug}  ${n} prop(s) changed, 692-9316 left: ${left}${seoLeft ? ' (in data-seo)' : ''}`)
  if (left || seoLeft) throw new Error(`/${slug} still carries 692-9316 somewhere this script does not handle`)
  if (n) changed.push(row)
}

// ── plugin settings ───────────────────────────────────────────────────
const lines = (s) => String(s ?? '').split(/\s+/).filter(Boolean)
const scripts = lines(settings.siteScripts)
const connect = lines(settings.connectOrigins)
const addScripts = SCRIPT_LINES.filter((l) => !scripts.includes(l))
const addConnect = CONNECT.filter((o) => !connect.includes(o))
const wantSettings = { ...settings, siteScripts: [...scripts, ...addScripts].join('\n'), connectOrigins: [...connect, ...addConnect].join('\n') }
const settingsChanged = addScripts.length + addConnect.length > 0
console.log(`plugin  ${PLUGIN} ${version ?? '?'}: siteScripts +${addScripts.length}, connectOrigins +${addConnect.length}`)
for (const l of addScripts) console.log(`        + script  ${l}`)
for (const o of addConnect) console.log(`        + connect ${o}`)

console.log(`\ntarget ${BASE}  pages ${changed.length}: ${changed.map((r) => r.slug.replace(P, '')).join(', ') || 'none'}  settings ${settingsChanged ? 'changed' : 'unchanged'}`)
if (!APPLY) { console.log('DRY RUN: nothing written. Re-run with --apply.'); process.exit(0) }

// ── write ─────────────────────────────────────────────────────────────
if (settingsChanged) {
  await api('PUT', `/admin/api/cms/plugins/${PLUGIN}/settings`, { settings: wantSettings })
  const back = (await api('GET', `/admin/api/cms/plugins/${PLUGIN}/settings`)).settings ?? {}
  for (const k of new Set([...Object.keys(settings), ...Object.keys(wantSettings)])) {
    const ok = JSON.stringify(back[k] ?? '') === JSON.stringify(wantSettings[k] ?? '')
    console.log(`check   setting ${k}: ${ok ? 'as intended' : 'DIFFERS ' + JSON.stringify(back[k]).slice(0, 120)}`)
    if (!ok) process.exit(1)
  }
}
if (changed.length) {
  const templates = await templateMap()
  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: site.site,
    changedPages: changed.map((r) => ({ ...toChangedPage(r), status: 'published', cells: { ...r.cells } })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])), shellBaseSeq: site.seq,
  })
  console.log(`saved   ${JSON.stringify(res).slice(0, 160)}`)
  const back = (await getPages()).rows
  for (const r of changed) {
    const b = back.find((x) => x.id === r.id)
    console.log(`check   /${b.slug}: ${JSON.stringify(b.cells.body.nodes) === JSON.stringify(r.cells.body.nodes) ? 'nodes as written' : 'NODES DIFFER'}`)
  }
  await assertTemplatesIntact(templates)
}

// ── publish, guarded ──────────────────────────────────────────────────
if (PUBLISH) {
  const mine = new Set(changed.map((r) => r.id))
  const now = (await getPages()).rows
  const moved = now.filter((r) => !mine.has(r.id) && (startRows.get(r.id)?.seq !== r.seq || startRows.get(r.id)?.updatedAt !== r.updatedAt))
  if (moved.length || now.length !== rows.length) {
    console.error(`REFUSING to publish: rows changed by someone else during this run: ${moved.map((r) => r.slug).join(', ')}`)
    process.exit(1)
  }
  console.log('publish', JSON.stringify(await publish()).slice(0, 160))
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const s = JSON.stringify(await publishStatus())
    if (!/running|pending|in_progress|building/i.test(s)) { console.log('status ', s.slice(0, 200)); break }
  }
}
