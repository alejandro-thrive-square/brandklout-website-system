#!/usr/bin/env node
/**
 * apply-films-vimeo.mjs — every film link on the site goes to Vimeo and plays on the page.
 * Brandklout's rule (Jessica, 2026-10-06): every video on every site is on the agency's Vimeo, its
 * description linking back to the website. The films live in the team account, folder "West LA
 * Implants" (vimeo.com/user/248712727/folder/30817251).
 *
 *   node apply-films-vimeo.mjs                      # dry run
 *   node apply-films-vimeo.mjs --apply              # write draft + plugin setting
 *   node apply-films-vimeo.mjs --apply --publish    # ...and publish (guarded)
 *
 * Surgical, like apply-lp-review.mjs: read the live rows, change only `base.link` nodes whose href
 * is a YouTube watch URL of a film in js/75-films.js, write each row against its own seq.
 *   shell   src/scripts/wla-films.js  <- js/75-films.js (the lightbox player + the id map)
 *   plugin  embed-origins frameOrigins += https://player.vimeo.com. The player's iframe is built at
 *           click time, so pages WITHOUT an Embed block (strict CSP, frame-src limited to the
 *           allowlist) need Vimeo allowed explicitly; autoTrust only sees static embeds.
 * A film that is not the practice's own (Invisalign's "Straight Talk About Crooked Teeth") is not in
 * the map and keeps its YouTube link.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getPages, getSite, publish, publishStatus, toChangedPage, templateMap, assertTemplatesIntact, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(HERE, '../04-design/.tmp/site-src')
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const PLUGIN = 'brandklout.embed-origins'
const FRAME = 'https://player.vimeo.com'
const ASSET = { type: 'script', path: 'src/scripts/wla-films.js', content: fs.readFileSync(path.join(SRC, 'js/75-films.js'), 'utf8') }
const VIMEO = Object.fromEntries([...ASSET.content.matchAll(/'([\w-]{11})':\s*\{\s*v:\s*'([^']*)',\s*h:\s*'([0-9a-f]*)'/g)].map((m) => [m[1], { v: m[2], h: m[3] }]))
const bad = Object.entries(VIMEO).filter(([, f]) => !/^\d+$/.test(f.v))
if (bad.length) { console.error(`REFUSING: js/75-films.js has placeholder ids: ${bad.map(([k]) => k).join(', ')}`); process.exit(1) }
const vimeoPage = (f) => `https://vimeo.com/${f.v}${f.h ? '/' + f.h : ''}`
console.log(`films   ${Object.keys(VIMEO).length} in js/75-films.js`)

// ── read ──────────────────────────────────────────────────────────────
const start = await publishStatus()
if (!start.draftMatchesPublished) { console.error('REFUSING: the draft already differs from the published site.'); process.exit(1) }
const site = await getSite()
const shell = site.site
const { rows } = await getPages()
const startRows = new Map(rows.map((r) => [r.id, { seq: r.seq, updatedAt: r.updatedAt }]))
const settings = (await api('GET', `/admin/api/cms/plugins/${PLUGIN}/settings`)).settings ?? {}

// ── shell asset ───────────────────────────────────────────────────────
let shellChanged = false
const have = (shell.files ?? []).find((f) => f.path === ASSET.path)
if (!have) {
  const now = new Date().toISOString()
  // the server stores node keys in its own order: compare canonically, never by raw JSON
const canon = (v) => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b))) : x))
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
  shell.files.push({ id: [...randomBytes(21)].map((b) => ALPHABET[b & 63]).join(''), ...ASSET, createdAt: now, updatedAt: now })
  shellChanged = true
  console.log(`shell   + ${ASSET.path}`)
} else if (have.content !== ASSET.content) {
  have.content = ASSET.content
  have.updatedAt = new Date().toISOString()
  shellChanged = true
  console.log(`shell   ~ ${ASSET.path} refreshed`)
} else console.log(`shell   ${ASSET.path} exact`)

// ── pages ─────────────────────────────────────────────────────────────
const changed = []
const kept = {}
for (const row of rows) {
  let n = 0
  for (const x of Object.values(row.cells?.body?.nodes ?? {})) {
    if (x.moduleId !== 'base.link' || typeof x.props?.href !== 'string') continue
    const id = (x.props.href.match(/youtube\.com\/watch\?v=([\w-]{11})/) ?? [])[1]
    if (!id) continue
    const f = VIMEO[id]
    if (!f) { kept[id] = (kept[id] ?? 0) + 1; continue }
    const attrs = { ...(x.props.htmlAttributes ?? {}) }
    if (attrs['aria-label']) attrs['aria-label'] = attrs['aria-label'].replace(/ on YouTube$/, '')
    x.props = { ...x.props, href: vimeoPage(f), htmlAttributes: attrs }
    n++
  }
  if (n) { changed.push(row); console.log(`/${row.slug}  ${n} film link(s) -> Vimeo`) }
}
for (const [id, c] of Object.entries(kept)) console.log(`kept    ${c} YouTube link(s) to ${id} (not in the Vimeo map)`)

// ── plugin frameOrigins ───────────────────────────────────────────────
const frames = String(settings.frameOrigins ?? '').split(/\s+/).filter(Boolean)
const wantSettings = { ...settings, frameOrigins: frames.includes(FRAME) ? settings.frameOrigins : [...frames, FRAME].join('\n') }
const settingsChanged = wantSettings.frameOrigins !== settings.frameOrigins
console.log(`plugin  frameOrigins ${settingsChanged ? `+ ${FRAME}` : 'already allows Vimeo'}`)

console.log(`\ntarget ${BASE}  shell ${shellChanged ? 'changed' : 'unchanged'}  pages ${changed.length}  settings ${settingsChanged ? 'changed' : 'unchanged'}`)
if (!APPLY) { console.log('DRY RUN: nothing written. Re-run with --apply.'); process.exit(0) }

// ── write ─────────────────────────────────────────────────────────────
if (settingsChanged) {
  await api('PUT', `/admin/api/cms/plugins/${PLUGIN}/settings`, { settings: wantSettings })
  const back = (await api('GET', `/admin/api/cms/plugins/${PLUGIN}/settings`)).settings ?? {}
  for (const k of new Set([...Object.keys(settings), ...Object.keys(wantSettings)])) {
    const ok = JSON.stringify(back[k] ?? '') === JSON.stringify(wantSettings[k] ?? '')
    console.log(`check   setting ${k}: ${ok ? 'as intended' : 'DIFFERS'}`)
    if (!ok) process.exit(1)
  }
}
if (changed.length || shellChanged) {
  const dir = path.join(HERE, '.tmp', `backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}-pre-films-vimeo`)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'shell.json'), JSON.stringify(await getSite(), null, 1))
  const fresh = (await getPages()).rows
  for (const r of changed) fs.writeFileSync(path.join(dir, `${r.slug.replace(/\//g, '__') || 'index'}.json`), JSON.stringify(fresh.find((x) => x.id === r.id), null, 1))
  console.log(`backup  ${path.relative(HERE, dir)}`)
  const templates = await templateMap()
  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: shell,
    changedPages: changed.map((r) => ({ ...toChangedPage(r), status: 'published', cells: { ...r.cells } })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])), shellBaseSeq: site.seq,
  })
  console.log(`saved   ${JSON.stringify(res).slice(0, 160)}`)
  const back = (await getPages()).rows
  let diff = 0
  for (const r of changed) if (canon(back.find((x) => x.id === r.id).cells.body.nodes) !== canon(r.cells.body.nodes)) { diff++; console.log(`check   /${r.slug}: NODES DIFFER`) }
  console.log(`check   ${changed.length - diff}/${changed.length} pages as written`)
  const after = await getSite()
  console.log(`check   ${ASSET.path}: ${after.site.files.find((f) => f.path === ASSET.path)?.content === ASSET.content ? 'exact' : 'DIFFERS'}`)
  await assertTemplatesIntact(templates)
  if (diff) process.exit(1)
}

// ── publish, guarded ──────────────────────────────────────────────────
if (PUBLISH) {
  const mine = new Set(changed.map((r) => r.id))
  const now = (await getPages()).rows
  const moved = now.filter((r) => !mine.has(r.id) && (startRows.get(r.id)?.seq !== r.seq || startRows.get(r.id)?.updatedAt !== r.updatedAt))
  if (moved.length || now.length !== rows.length) { console.error(`REFUSING to publish: rows changed during this run: ${moved.map((r) => r.slug).join(', ')}`); process.exit(1) }
  console.log('publish', JSON.stringify(await publish()).slice(0, 160))
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const s = JSON.stringify(await publishStatus())
    if (!/running|pending|in_progress|building/i.test(s)) { console.log('status ', s.slice(0, 200)); break }
  }
}
