#!/usr/bin/env node
/**
 * migrate-plugin-ids.mjs — move the four in-house plugins from `webzite.*` to
 * `brandklout.*` on one instance, without losing settings, stored records or
 * the embed blocks already placed on pages.
 *
 *   node migrate-plugin-ids.mjs export
 *   node migrate-plugin-ids.mjs swap --zips <dir> --apply
 *   node migrate-plugin-ids.mjs publish --apply
 *   node migrate-plugin-ids.mjs verify
 *   node migrate-plugin-ids.mjs uninstall --apply
 *
 * The instance is whichever `INSTATIC_BASE_URL` `insta-api.mjs` resolves — the
 * worktree's `.env`, or an override in the environment for a staging host.
 * Everything is written under `.tmp/plugin-id-migration/<host>/`.
 *
 * ## Why this is a migration and not a rename
 *
 * Four things key on the plugin id, and only the last is self-healing:
 *
 *  1. `installed_plugins.id` carries `settings_json`. A new id starts empty.
 *  2. `plugin_records.plugin_id` REFERENCES `installed_plugins(id) ON DELETE
 *     CASCADE` (`server/db/migrations-pg.ts:380`). Uninstalling the old plugin
 *     deletes every record it owns — 80 schema blocks and 80 Open Graph
 *     overrides on Dr. Nahlah, 216 overrides on Kids. Export BEFORE uninstall,
 *     and uninstall only once the new plugin holds the same rows.
 *  3. A module id must be `<pluginId>.<name>` — the host enforces it
 *     (`moduleAdapter.ts:46`). So every page node carrying
 *     `webzite.embed-origins.embed` has to be rewritten to
 *     `brandklout.embed-origins.embed`, or the publisher emits
 *     `<!-- instatic: unknown module -->` in its place (`renderNode.ts:309`)
 *     and the embed silently disappears from the page.
 *  4. `assetBasePath`, the module-JS URL and the `data-aeo` marker are rebuilt
 *     at publish; nothing to migrate. The new `aeo-schema` matches BOTH markers
 *     so a stale block is replaced rather than doubled.
 *
 * ## The order, and why
 *
 * install new -> import data -> rewrite modules -> DISABLE old -> publish ->
 * verify -> uninstall old. A disabled plugin is skipped at load
 * (`server/plugins/runtime.ts:420`) so its hooks stop firing, but its rows stay
 * in the database: that is the rollback, and it is why `uninstall` is a
 * separate command you run after `verify` passes.
 *
 * Never publish while both are enabled — two `publish.html` filters would write
 * two sets of tags. `swap` disables the old ones before it returns, so the
 * window is closed by the time `publish` runs.
 *
 * ## The trap inside the page rewrite
 *
 * `PUT /site-document` replaces a row's cells with what `pageToCells()` builds
 * — `{ title, slug, body }` plus the template keys. `seoTitle` and
 * `seoDescription` are NOT in it, so any page write drops them. This script
 * snapshots them per page and PATCHes them back afterwards (`PATCH` does not
 * merge either, so the fresh cells are read and spread underneath), then
 * asserts every template survived.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  api, requestForm, getSite, getPages, publish, publishStatus,
  toChangedPage, assertTemplatesIntact, BASE,
} from './insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = join(HERE, '.tmp', 'plugin-id-migration', HOST.replace(/[^a-z0-9.-]/gi, '_'))
const cmd = process.argv[2]
const APPLY = process.argv.includes('--apply')
const arg = (name) => {
  const i = process.argv.indexOf(name)
  return i > 0 ? process.argv[i + 1] : undefined
}

/* old id -> new id. The module id follows the plugin id by host rule. */
const MAP = {
  'webzite.aeo-schema': 'brandklout.aeo-schema',
  'webzite.open-graph': 'brandklout.open-graph',
  'webzite.link-editor': 'brandklout.link-editor',
  'webzite.embed-origins': 'brandklout.embed-origins',
}
const OLD_MODULE = 'webzite.embed-origins.embed'
const NEW_MODULE = 'brandklout.embed-origins.embed'

/* Granted explicitly, per NEW id, exactly as install-plugin.mjs does: a package
   that quietly widens what it asks for is refused rather than echoed. */
const GRANTS = {
  'brandklout.embed-origins': ['cms.hooks', 'modules.register', 'frontend.assets'],
  'brandklout.link-editor': ['editor.code', 'editor.panels', 'editor.store.read', 'editor.store.write'],
  'brandklout.open-graph': ['cms.hooks', 'cms.storage', 'cms.routes', 'cms.content.read', 'admin.navigation', 'editor.code'],
  'brandklout.aeo-schema': ['cms.hooks', 'cms.storage', 'cms.routes', 'cms.content.read', 'admin.navigation', 'editor.code'],
}

const statePath = (n) => join(STATE, n)
const readState = (n) => JSON.parse(readFileSync(statePath(n), 'utf8'))
const writeState = (n, v) => {
  mkdirSync(STATE, { recursive: true })
  writeFileSync(statePath(n), JSON.stringify(v, null, 1))
  return statePath(n)
}
const listPlugins = async () => (await api('GET', '/admin/api/cms/plugins')).plugins ?? []

/* A plugin that declares no `settings[]` 400s on the settings route rather than
   returning `{}` — link-editor is one. Ask the manifest first. */
const declaresSettings = (manifest) => Array.isArray(manifest?.settings) && manifest.settings.length > 0
async function readSettings(id, manifest) {
  if (!declaresSettings(manifest)) return {}
  return (await api('GET', `/admin/api/cms/plugins/${id}/settings`)).settings ?? {}
}

/* ── export ──────────────────────────────────────────────────────────────── */

async function readAllRecords(id, resourceId) {
  const out = []
  for (let offset = 0; ; offset += 100) {
    const b = await api('GET', `/admin/api/cms/plugins/${id}/resources/${resourceId}/records?limit=100&offset=${offset}`)
    const rows = b.records ?? []
    out.push(...rows)
    if (rows.length === 0 || out.length >= (b.totalCount ?? out.length)) break
  }
  return out
}

async function doExport() {
  const installed = await listPlugins()
  const olds = installed.filter((p) => MAP[p.id])
  const dump = { base: BASE, takenAt: new Date().toISOString(), plugins: {} }
  for (const p of olds) {
    const settings = await readSettings(p.id, p.manifest)
    const records = {}
    for (const r of p.manifest?.resources ?? []) records[r.id] = await readAllRecords(p.id, r.id)
    dump.plugins[p.id] = {
      version: p.version, enabled: p.enabled, status: p.lifecycleStatus,
      grantedPermissions: p.grantedPermissions, settings, records,
    }
    console.log(`  ${p.id} v${p.version}  settings:${Object.keys(settings).length}  ` +
      Object.entries(records).map(([k, v]) => `${k}:${v.length}`).join(' '))
  }
  const { site, seq } = await getSite()
  const { rows } = await getPages()
  writeState('export.json', dump)
  writeState('backup-site.json', { seq, site })
  writeState('backup-pages.json', rows)
  const affected = rows.filter((r) => JSON.stringify(r.cells?.body ?? {}).includes(`"${OLD_MODULE}"`))
  writeState('affected-pages.json', affected.map((r) => ({
    id: r.id, slug: r.cells?.slug ?? r.slug,
    seoTitle: r.cells?.seoTitle ?? '', seoDescription: r.cells?.seoDescription ?? '',
  })))
  console.log(`  shell seq ${seq}, ${rows.length} pages, ${affected.length} carrying ${OLD_MODULE}`)
  console.log(`  written to ${STATE}`)
}

/* ── swap ────────────────────────────────────────────────────────────────── */

async function installZip(file) {
  const bytes = readFileSync(file)
  const form = (grant) => {
    const f = new FormData()
    f.append('file', new Blob([bytes], { type: 'application/zip' }), basename(file))
    f.append('grantedPermissions', JSON.stringify(grant))
    return f
  }
  const inspected = await requestForm('/admin/api/cms/plugins/inspect-package', form([]))
  const m = inspected.manifest ?? inspected.plugin ?? inspected
  const grant = GRANTS[m.id]
  if (!grant) throw new Error(`no grant list for "${m.id}" — add one deliberately`)
  const extra = (m.permissions ?? []).filter((p) => !grant.includes(p))
  if (extra.length) throw new Error(`${m.id} asks for ungranted permissions: ${extra.join(', ')}`)
  if (!APPLY) { console.log(`  would install ${m.id} v${m.version}`); return m }
  const res = await requestForm('/admin/api/cms/plugins/package', form(grant))
  const p = res.plugin ?? res
  console.log(`  installed ${m.id} v${m.version} -> ${p.lifecycleStatus ?? '?'}`)
  return m
}

async function doSwap() {
  const dump = readState('export.json')
  const zipDir = arg('--zips')
  if (!zipDir) throw new Error('--zips <dir> is required')
  const oldIds = Object.keys(dump.plugins)
  if (!oldIds.length) throw new Error('export.json holds no plugins — run `export` first')

  // 1. install the new packages, only for the plugins this instance actually has
  console.log('\n1. install')
  for (const oldId of oldIds) {
    const newId = MAP[oldId]
    const zip = join(zipDir, `${newId.slice('brandklout.'.length)}.zip`)
    if (!existsSync(zip)) throw new Error(`missing package ${zip}`)
    await installZip(zip)
  }
  if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); return }

  // 2. settings, then records, into the new ids
  console.log('\n2. import settings + records')
  for (const oldId of oldIds) {
    const newId = MAP[oldId]
    const src = dump.plugins[oldId]
    if (Object.keys(src.settings).length) {
      await api('PUT', `/admin/api/cms/plugins/${newId}/settings`, { settings: src.settings })
    }
    if (Object.keys(src.settings).length) {
      const after = (await api('GET', `/admin/api/cms/plugins/${newId}/settings`)).settings ?? {}
      const wrong = Object.keys(src.settings).filter((k) => JSON.stringify(after[k]) !== JSON.stringify(src.settings[k]))
      if (wrong.length) throw new Error(`${newId}: settings did not round-trip: ${wrong.join(', ')}`)
    }
    for (const [rid, rows] of Object.entries(src.records ?? {})) {
      const existing = await readAllRecords(newId, rid)
      if (existing.length) { console.log(`  ${newId}/${rid}: ${existing.length} already there, skipping`); continue }
      for (const rec of rows) await api('POST', `/admin/api/cms/plugins/${newId}/resources/${rid}/records`, { data: rec.data })
      const check = await readAllRecords(newId, rid)
      if (check.length !== rows.length) throw new Error(`${newId}/${rid}: imported ${check.length} of ${rows.length}`)
      console.log(`  ${newId}/${rid}: ${check.length} records`)
    }
    console.log(`  ${newId}: settings ${Object.keys(src.settings).length} verified`)
  }

  // 3. rewrite every embed node's moduleId, shell and pages, in one save
  console.log('\n3. rewrite module ids')
  const { site, seq } = await getSite()
  const { rows } = await getPages()
  const hit = (o) => JSON.stringify(o ?? {}).includes(`"${OLD_MODULE}"`)
  const swapIds = (o) => JSON.parse(JSON.stringify(o).split(`"${OLD_MODULE}"`).join(`"${NEW_MODULE}"`))
  const pages = rows.filter((r) => hit(r.cells?.body))
  const shellHit = hit(site)
  if (!pages.length && !shellHit) console.log('  nothing to rewrite')
  else {
    const changedPages = pages.map((r) => toChangedPage(r, {
      nodes: swapIds(r.cells.body.nodes), rootNodeId: r.cells.body.rootNodeId,
    }))
    const res = await api('PUT', '/admin/api/cms/site-document', {
      mode: 'incremental',
      site: shellHit ? swapIds(site) : site,
      changedPages,
      deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
      changedLayouts: [], deletedLayoutIds: [],
      baseSeqs: Object.fromEntries(pages.map((r) => [r.id, r.seq])),
      shellBaseSeq: seq,
    })
    console.log(`  saved ${changedPages.length} pages${shellHit ? ' + shell' : ''} (seq -> ${res.seq ?? '?'})`)

    // seoTitle / seoDescription do not survive a page write — put them back.
    const wanted = readState('affected-pages.json')
    const fresh = (await getPages()).rows
    for (const w of wanted) {
      if (!w.seoTitle && !w.seoDescription) continue
      const row = fresh.find((r) => r.id === w.id)
      if (!row) continue
      const cells = { ...row.cells }
      let touched = false
      for (const k of ['seoTitle', 'seoDescription']) {
        if (w[k] && cells[k] !== w[k]) { cells[k] = w[k]; touched = true }
      }
      if (!touched) continue
      await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells })
      console.log(`  restored seo cells on ${w.slug}`)
    }
    /* `assertTemplatesIntact` takes a { slug: hasTemplate } map, not ids, and
       re-reads each row in full. Assert on the pages this actually wrote —
       nothing else was sent, so nothing else can have lost a template. */
    const expectTemplates = Object.fromEntries(pages.map((r) =>
      [r.cells?.slug ?? r.slug, r.cells?.templateEnabled === true]))
    await assertTemplatesIntact(expectTemplates)
    const still = (await getPages()).rows.filter((r) => hit(r.cells?.body))
    if (still.length) throw new Error(`${still.length} pages still carry ${OLD_MODULE}`)
    console.log('  templates intact, no old module ids left')
  }

  // 4. disable the old plugins — still installed, so still rollback-able
  console.log('\n4. disable the old plugins')
  for (const oldId of oldIds) {
    await api('PATCH', `/admin/api/cms/plugins/${oldId}`, { enabled: false })
    console.log(`  ${oldId} disabled`)
  }
  console.log('\nswap complete — publish, then verify, then uninstall')
}

/* ── publish / verify / uninstall ────────────────────────────────────────── */

async function doPublish() {
  if (!APPLY) { console.log('DRY RUN — re-run with --apply to publish'); return }
  const res = await publish()
  console.log('  publish:', JSON.stringify(res).slice(0, 200))
  const st = await publishStatus()
  console.log('  status:', JSON.stringify(st).slice(0, 200))
}

async function doVerify() {
  const dump = readState('export.json')
  const affected = readState('affected-pages.json')
  const { rows } = await getPages()
  const slugs = new Set(affected.map((a) => a.slug))
  for (const r of rows.slice(0, 3)) slugs.add(r.cells?.slug ?? r.slug)
  let bad = 0
  for (const slug of slugs) {
    const url = `${BASE}/${slug === 'index' ? '' : slug}`
    const html = await (await fetch(url, { headers: { 'user-agent': 'webzite-migration-check' } })).text()
    const checks = {
      og: (html.match(/property="og:title"/g) ?? []).length,
      canonical: (html.match(/rel="canonical"/g) ?? []).length,
      ldjson: (html.match(/data-aeo="brandklout\.aeo-schema"/g) ?? []).length,
      stale: (html.match(/data-aeo="webzite\.aeo-schema"/g) ?? []).length,
      unknownModule: (html.match(/unknown module/g) ?? []).length,
    }
    const ogSettings = dump.plugins['webzite.open-graph']?.settings
    const aeoSettings = dump.plugins['webzite.aeo-schema']?.settings
    /* Canonical is expected only where the site asks for one. Staging turns
       `emitCanonical` off deliberately, so it never points at production. */
    const wantCanonical = Boolean(ogSettings) && ogSettings.emitCanonical !== false && Boolean(ogSettings.siteUrl)
    const ok = (!ogSettings || checks.og === 1) &&
      (!wantCanonical || checks.canonical >= 1) &&
      (!aeoSettings || checks.ldjson === 1) && checks.stale === 0 && checks.unknownModule === 0
    if (!ok) bad++
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${url}  ${JSON.stringify(checks)}${affected.some((a) => a.slug === slug) ? '  [carries an embed]' : ''}`)
  }
  if (dump.plugins['webzite.embed-origins'] && affected.length) {
    const js = await fetch(`${BASE}/_instatic/module-js/${NEW_MODULE}.js`)
    console.log(`  module-js ${js.status} ${BASE}/_instatic/module-js/${NEW_MODULE}.js`)
    if (!js.ok) bad++
  }
  console.log(bad ? `\n${bad} FAILED` : '\nall checks passed')
  if (bad) process.exitCode = 1
}

async function doUninstall() {
  const dump = readState('export.json')
  const installed = await listPlugins()
  for (const oldId of Object.keys(dump.plugins)) {
    const newId = MAP[oldId]
    const now = installed.find((p) => p.id === newId)
    if (!now || now.lifecycleStatus !== 'active' || !now.enabled) {
      throw new Error(`${newId} is not active — refusing to uninstall ${oldId}`)
    }
    for (const [rid, rows] of Object.entries(dump.plugins[oldId].records ?? {})) {
      const have = await readAllRecords(newId, rid)
      if (have.length !== rows.length) throw new Error(`${newId}/${rid}: ${have.length} records, expected ${rows.length}`)
    }
    if (!APPLY) { console.log(`  would uninstall ${oldId} (${newId} holds its data)`); continue }
    await api('DELETE', `/admin/api/cms/plugins/${oldId}`)
    console.log(`  uninstalled ${oldId}`)
  }
  if (!APPLY) console.log('\nDRY RUN — re-run with --apply')
}

const RUN = { export: doExport, swap: doSwap, publish: doPublish, verify: doVerify, uninstall: doUninstall }
if (!RUN[cmd]) {
  console.error('usage: migrate-plugin-ids.mjs <export|swap|publish|verify|uninstall> [--zips <dir>] [--apply]')
  process.exit(2)
}
console.log(`${cmd} — ${BASE}`)
await RUN[cmd]()
