#!/usr/bin/env node
/**
 * fix-shelf-mobile.mjs — 2026-10-08 client feedback on the home "Our treatments" shelf: "on mobile only
 * one card is tall and the other ones are shrunk. We need all the cards to reveal the entire content,
 * maybe with an aspect ratio on mobile."
 *
 * Below 767px the shelf stops being an accordion (one 22rem panel + three 4.5rem strips): every card is
 * open, 4:3, one column on a phone and two once each can be 18rem wide. Shell only, no page touched:
 *
 *   1. Style registry, the `media:(max-width: 767px)` context of nine shelf rules (site-src
 *      css/53-shelf.css, same block): grid + aspect-ratio, the body always shown, the vertical name
 *      hidden, the index at the top, the photo un-zoomed, and a darker scrim — the body sits higher in a
 *      4:3 card, so the desktop gradient left the name at ~1.6–2.2:1 on the photos (now >= 4.3:1, meta
 *      >= 5.9:1, worst case at 320px; gate `site-src/shelf-test.mjs`). `.shelf_item.is-open .shelf_index` only carried the old mobile index position: removed.
 *   2. `src/scripts/site.js`: the shelf's first tap no longer opens-instead-of-following below 767px
 *      (every card is open there), so a tap goes straight to the treatment. String-level, so it works on
 *      either instance (staging carries the 2026-10-05 class renames, production does not).
 *
 *   node fix-shelf-mobile.mjs                       dry run against INSTATIC_BASE_URL
 *   node fix-shelf-mobile.mjs --apply               back up site.json, one incremental save, read back
 *   node fix-shelf-mobile.mjs --apply --publish     ... and publish, after the guard below
 *
 * Every context must hold either what it held on 2026-10-08 or what this script writes; anything else
 * (an edit made in the editor) refuses. Idempotent: a second run finds nothing.
 *
 * PUBLISH GUARD: the draft must match live before the write; after it, no page row may have moved and
 * the shell must be at the seq this save returned.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, publish, publishStatus, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const MQ = 'media:(max-width: 767px)'
const SCRIM = 'linear-gradient(180deg, rgba(39, 39, 39, 0.18) 0%, rgba(39, 39, 39, 0.1) 20%, rgba(39, 39, 39, 0.66) 50%, rgba(39, 39, 39, 0.86) 100%)'
// the first publish's scrim (05:31Z): the Restoration card's meta measured 4.35:1 at 320px under it
const SCRIM_1 = 'linear-gradient(180deg, rgba(39, 39, 39, 0.18) 0%, rgba(39, 39, 39, 0.1) 22%, rgba(39, 39, 39, 0.6) 55%, rgba(39, 39, 39, 0.82) 100%)'

// selector -> [the 767 context as it was (or a list of known earlier states), the 767 context wanted (null = no context)]
const CONTEXTS = {
  '.shelf_component': [{ flexDirection: 'column', height: 'auto', gap: '0.5rem' }, { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))', height: 'auto', gap: '0.5rem' }],
  '.shelf_item': [{ flexGrow: '0', flexShrink: '0', flexBasis: '4.5rem', transition: 'flex-basis 0.7s var(--ease)' }, { aspectRatio: '4 / 3' }],
  '.shelf_item.is-open': [{ flexGrow: '0', flexShrink: '0', flexBasis: '22rem' }, null],
  '.shelf_media img': [null, { transform: 'none', filter: 'none' }],
  '.shelf_media::after': [[null, { backgroundImage: SCRIM_1 }], { backgroundImage: SCRIM }],
  '.shelf_index': [{ top: '50%', marginTop: '-0.5em' }, null],
  '.shelf_vert': [{ writingMode: 'horizontal-tb', transform: 'none', left: '1.1rem', right: '1.1rem', top: '50%', bottom: 'auto', marginTop: '-0.6em', paddingLeft: '2.6rem', fontSize: 'var(--size-h6)' }, { display: 'none' }],
  '.shelf_body': [null, { opacity: '1', transform: 'none' }],
}
const DROP = { selector: '.shelf_item.is-open .shelf_index', ctx: { top: '1.1rem', marginTop: '0px' } }

const JS_ASSET = 'src/scripts/site.js'
const JS_EDITS = [
  ['    var items = $$(".shelf_item", root);\n    var open = function (item) {',
    '    var items = $$(".shelf_item", root);\n    var stacked = window.matchMedia("(max-width: 767px)"); // every card is open there (fix-shelf-mobile.mjs)\n    var open = function (item) {'],
  ['        if (fine) return; // a pointer user hovered first; let the click go through',
    '        if (fine || stacked.matches) return; // hovered first, or already open; let the click go through'],
]

const same = (a, b) => JSON.stringify(Object.entries(a ?? {}).sort()) === JSON.stringify(Object.entries(b ?? {}).sort())
const count = (s, x) => s.split(x).length - 1

const status0 = await publishStatus()
const siteRes = await getSite()
const raw = JSON.stringify(siteRes)
const { site, seq } = siteRes
const pages0 = (await getPages()).rows ?? []
console.log(`${BASE}\nstatus   draftMatchesPublished=${status0.draftMatchesPublished}; shell seq ${seq}; ${pages0.length} pages`)

const rules = site.styleRules ?? {}
const bySel = (sel) => {
  const hit = Object.values(rules).filter((r) => r.selector === sel)
  if (hit.length !== 1) throw new Error(`${hit.length} rules with selector ${sel} — refusing`)
  return hit[0]
}
const notes = []
for (const [sel, [was, want]] of Object.entries(CONTEXTS)) {
  const r = bySel(sel)
  const cur = r.contextStyles?.[MQ] ?? null
  if (want ? same(cur, want) : cur == null) continue
  if (!(Array.isArray(was) ? was : [was]).some((x) => (x ? same(cur, x) : cur == null))) throw new Error(`${sel} ${MQ} is ${JSON.stringify(cur)} — not what this script expects (edited in the editor?), refusing`)
  r.contextStyles ??= {}
  if (want) r.contextStyles[MQ] = { ...want } // replacing in place keeps the context order (991 before 767)
  else delete r.contextStyles[MQ]
  r.updatedAt = Date.now()
  notes.push(`rule     ${sel} ${MQ} ${want ? '<- ' + JSON.stringify(want) : 'removed'}`)
}
{
  const hit = Object.values(rules).filter((r) => r.selector === DROP.selector)
  if (hit.length > 1) throw new Error(`${hit.length} rules with selector ${DROP.selector} — refusing`)
  if (hit.length) {
    const r = hit[0], ctx = r.contextStyles ?? {}
    if (Object.keys(r.styles ?? {}).length || Object.keys(ctx).length !== 1 || !same(ctx[MQ], DROP.ctx)) throw new Error(`${DROP.selector} carries more than the old mobile index position — refusing`)
    delete rules[r.id]
    notes.push(`rule     ${DROP.selector} deleted (${r.id})`)
  }
}

const file = (site.files ?? []).find((f) => f.path === JS_ASSET)
if (!file) throw new Error(`the shell has no ${JS_ASSET}`)
let js = file.content
const NL = js.includes('\r\n') ? '\r\n' : '\n' // the bundle is CRLF on both instances (built on Windows)
for (const [from, to] of JS_EDITS.map((e) => e.map((s) => s.replace(/\n/g, NL)))) {
  // REPAIR: the first run (2026-10-08 05:31Z) used String.replace with a string, which reads "$$" as an
  // escaped "$" and published `var items = $(".shelf_item", root)` — one element, so items.forEach threw
  // inside boot() and every motion function after shelf() stopped. Always split/join, never replace().
  const broken = to.split('$$').join('$')
  if (broken !== to && count(js, broken) === 1 && count(js, to) === 0) {
    js = js.split(broken).join(to)
    notes.push(`js       REPAIR ${to.split(NL)[0].trim()}`)
    continue
  }
  if (count(js, to) === 1 && count(js, from) === 0) continue
  if (count(js, from) !== 1) throw new Error(`${JS_ASSET}: ${count(js, from)} matches for ${JSON.stringify(from.trim().slice(0, 60))} — refusing`)
  js = js.split(from).join(to)
  notes.push(`js       ${to.split(NL).find((l) => !from.includes(l)).trim().slice(0, 100)}`)
}
const jsChanged = js !== file.content
if (jsChanged) { file.content = js; file.updatedAt = new Date().toISOString() }

console.log(notes.join('\n') || 'nothing to change')
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!notes.length) process.exit(0)
if (PUBLISH && !status0.draftMatchesPublished) throw new Error('the draft already differs from live — publishing would carry someone else\'s edits. Stopped before writing.')

const label = /staging/.test(BASE) ? 'staging' : 'prod'
const bak = path.join(HERE, '.tmp', `backup-${label}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}-seq${seq}-pre-shelf-mobile`)
fs.mkdirSync(bak, { recursive: true })
fs.writeFileSync(path.join(bak, 'site.json'), raw)
fs.writeFileSync(path.join(bak, 'status.json'), JSON.stringify(status0))
console.log(`backup   ${path.relative(HERE, bak)}`)

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site,
  changedPages: [], deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: {},
  shellBaseSeq: seq,
})
console.log(`saved    ${JSON.stringify(res).slice(0, 160)}`)

/* read back: every context as written, the dropped rule gone, the bundle exact */
const back = await getSite()
const brules = back.site.styleRules ?? {}
for (const [sel, [, want]] of Object.entries(CONTEXTS)) {
  const r = Object.values(brules).find((x) => x.selector === sel)
  const cur = r?.contextStyles?.[MQ] ?? null
  if (!(want ? same(cur, want) : cur == null)) throw new Error(`read-back: ${sel} ${MQ} is ${JSON.stringify(cur)}`)
}
if (Object.values(brules).some((x) => x.selector === DROP.selector)) throw new Error(`read-back: ${DROP.selector} still there`)
if (jsChanged && back.site.files.find((f) => f.path === JS_ASSET)?.content !== js) throw new Error(`read-back: ${JS_ASSET} differs`)
console.log('check    rules and bundle read back as written')

const pages1 = (await getPages()).rows ?? []
const moved = pages1.filter((r) => r.seq !== pages0.find((x) => x.id === r.id)?.seq).map((r) => `/${r.slug}`)
console.log(`guard    pages ${pages1.length} (was ${pages0.length}); rows moved ${moved.join(' ') || 'none'}; shell seq ${back.seq} (save said ${res.seq})`)
if (!PUBLISH) { console.log('draft written; not publishing (no --publish)'); process.exit(0) }
if (moved.length || pages1.length !== pages0.length || back.seq !== res.seq) { console.log('NOT PUBLISHING: something other than this change moved in the draft.'); process.exit(1) }
console.log(`publish  ${JSON.stringify(await publish()).slice(0, 200)}`)
console.log(`status   ${JSON.stringify(await publishStatus())}`)
