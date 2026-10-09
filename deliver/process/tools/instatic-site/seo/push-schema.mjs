#!/usr/bin/env node
/**
 * push-schema.mjs — step 4 of the content-built schema chain: ship <out>/{organization,blocks}.json
 * (build-schema.mjs) to the brandklout.aeo-schema store of INSTATIC_BASE_URL.
 *
 *   node push-schema.mjs                       # PLAN (default): what differs from the stored graph; writes nothing
 *   node push-schema.mjs --apply               # write the draft-side store, then read it all back
 *   node push-schema.mjs --publish             # publish, only when the store already equals the build
 *                                              #   and no page edit is waiting in the draft
 *   INSTATIC_BASE_URL=https://staging.<domain> STAGING_HOST=staging.<domain> node push-schema.mjs --apply
 *
 * What --apply writes: the organizationJson setting, `emitBreadcrumbs: false` (every scanned page
 * carries its own BreadcrumbList, the trail it shows; the plugin's generated one names the last
 * crumb with the full SEO title), the site-wide block "*", and every page and article block whose
 * graph differs. Graphs are compared by content (keys and top-level node order ignored), so a
 * rebuild that only reorders writes nothing. A key the host does not list as an aeo entry is a
 * failure, never created.
 *
 * Safety: --apply and --publish need STAGING_HOST=<that host> or --allow-production
 * (../lib/staging-guard.mjs; staging first, always). --apply backs up the store to
 * <out>/backups/schema-<host>-<stamp>/ first and reads every written block and the settings back.
 * The plugin store renders at the next publish; the publish status only shows page edits, so a
 * waiting page edit by someone else is named and refused rather than shipped with the graph.
 *
 * Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v3/push-seo-v3.mjs
 * (+ the --publish guard of seo-v3/push-keyword-h1.mjs, + block read-back).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { api, publishStatus, publish, BASE } from '../lib/site.mjs'
import { assertStaging } from '../lib/staging-guard.mjs'
import { outDir, flag, arg } from './lib/seo-config.mjs'
import { sameGraph } from './lib/schema-build.mjs'

const OUT = outDir()
const APPLY = flag('--apply')
const PUBLISH = flag('--publish')
const AEO = '/admin/api/cms/plugins/brandklout.aeo-schema'
const NOTE = arg('--note', `schema ${new Date().toISOString().slice(0, 10)}: built from page content`)
if (!existsSync(join(OUT, 'blocks.json'))) { console.error(`no ${join(OUT, 'blocks.json')}: run build-schema.mjs first`); process.exit(2) }
const organization = existsSync(join(OUT, 'organization.json')) ? JSON.parse(readFileSync(join(OUT, 'organization.json'), 'utf8')) : null
const { sitewide, pages, posts } = JSON.parse(readFileSync(join(OUT, 'blocks.json'), 'utf8'))
const HOST = BASE.replace(/^https?:\/\//, '')
if (APPLY || PUBLISH) assertStaging()

console.log(`${HOST} ${APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)'}`)
const status = await publishStatus()
console.log(`  status   ${JSON.stringify(status).slice(0, 300)}`)

const entries = (await api('GET', `${AEO}/runtime/entries`)).entries
const settings = (await api('GET', `${AEO}/settings`)).settings
const stored = Object.fromEntries(entries.map((e) => [e.key, e.block?.json ?? null]))
const orgJson = organization ? JSON.stringify(organization, null, 2) : null
const parse = (s) => { try { return JSON.parse(s) } catch { return null } }

// ── what differs ────────────────────────────────────────────────────────────
const todo = [], unknown = []
let sameButOrdered = 0
const want = [...Object.entries(pages), ...Object.entries(posts || {})].filter(([, n]) => n && n.length)
for (const [key, nodes] of want) {
  if (!(key in stored)) { unknown.push(key); continue }
  const json = JSON.stringify(nodes.length === 1 ? nodes[0] : nodes)
  if (stored[key] === json) continue
  if (stored[key] && sameGraph(parse(stored[key]), nodes)) { sameButOrdered++; continue }
  todo.push({ key, json, was: stored[key] ? stored[key].length : 0 })
}
const orgDiffers = organization && !(settings.organizationJson && sameGraph(parse(settings.organizationJson), organization))
const flagDiffers = settings.emitBreadcrumbs !== false
const siteJson = sitewide?.length ? JSON.stringify(sitewide.length === 1 ? sitewide[0] : sitewide) : null
console.log(`  settings organizationJson ${orgDiffers ? `differs (${(settings.organizationJson || '').length} -> ${orgJson.length}c)` : organization ? 'same' : 'not in the build'}, emitBreadcrumbs ${settings.emitBreadcrumbs}${flagDiffers ? ' -> false' : ''}`)
console.log(`  blocks   ${want.length} built, ${todo.length} differ${sameButOrdered ? `, ${sameButOrdered} same graph in another key order (not rewritten)` : ''}${unknown.length ? `, ${unknown.length} NOT AEO ENTRIES ON THIS HOST` : ''}`)
for (const t of todo.slice(0, 60)) console.log(`           ~ ${t.key} (${t.was} -> ${t.json.length}c)`)
if (todo.length > 60) console.log(`           … ${todo.length - 60} more`)
for (const k of unknown) console.log(`           !! ${k}: not an aeo entry on ${HOST} (a page or article this host does not have)`)
if (siteJson) console.log('  sitewide "*" is not listed by the entries route, so it cannot be compared: --apply always writes it')

if (PUBLISH) {
  if (todo.length || orgDiffers || flagDiffers || unknown.length) { console.error('REFUSING TO PUBLISH: the store does not equal the build — plan, --apply, then --publish'); process.exit(1) }
  if (status.draftMatchesPublished !== true) { console.error('REFUSING TO PUBLISH: page edits are waiting in the draft (or the status says nothing) and would ship with the graph — find out whose first'); process.exit(1) }
  const r = await publish()
  console.log('published', JSON.stringify(r).slice(0, 200))
  process.exit(0)
}
if (!APPLY) { console.log(`\nplan only${unknown.length ? ' — FIX THE UNKNOWN KEYS FIRST' : ''} — pass --apply to write the draft-side store`); process.exit(unknown.length ? 1 : 0) }
if (unknown.length) { console.error('REFUSING: keys that are not aeo entries on this host (wrong host, or the page does not exist here)'); process.exit(1) }

// ── apply ───────────────────────────────────────────────────────────────────
const BK = join(OUT, 'backups', `schema-${HOST}-${new Date().toISOString().replace(/[:.]/g, '-')}`)
mkdirSync(BK, { recursive: true })
writeFileSync(join(BK, 'aeo-entries.json'), JSON.stringify(entries))
writeFileSync(join(BK, 'aeo-settings.json'), JSON.stringify(settings))
console.log(`  backup   ${BK}`)
let failures = 0
const fail = (m) => { failures++; console.log('  !! ' + m) }
if (orgDiffers || flagDiffers) {
  const next = { ...settings, ...(organization ? { organizationJson: orgJson } : {}), emitBreadcrumbs: false }
  const res = (await api('PUT', `${AEO}/settings`, { settings: next })).settings ?? {}
  if ((organization && res.organizationJson !== orgJson) || res.emitBreadcrumbs !== false) fail('settings did not read back')
}
const write = async (key, json) => {
  const res = await api('POST', `${AEO}/runtime/entry`, { key, json, note: NOTE, enabled: true })
  if (res.error || res.ok === false) fail(`${key}: ${JSON.stringify(res).slice(0, 200)}`)
}
if (siteJson) await write('*', siteJson)
for (const t of todo) await write(t.key, t.json)
// read back: every written block and the settings, from the server
const back = Object.fromEntries((await api('GET', `${AEO}/runtime/entries`)).entries.map((e) => [e.key, e.block?.json ?? null]))
for (const t of todo) if (!back[t.key] || !sameGraph(parse(back[t.key]), parse(t.json))) fail(`${t.key}: did not read back`)
const s2 = (await api('GET', `${AEO}/settings`)).settings
if (organization && !sameGraph(parse(s2.organizationJson), organization)) fail('organizationJson did not read back')
if (s2.emitBreadcrumbs !== false) fail('emitBreadcrumbs did not read back')
console.log(`  wrote    ${todo.length} block(s)${siteJson ? ' + site-wide' : ''}${orgDiffers || flagDiffers ? ' + settings' : ''}; read back ${failures ? 'WITH FAILURES' : 'clean'}`)
console.log(`\n${failures ? failures + ' FAILURE(S) — restore from ' + BK : 'clean — draft-side only: check, then --publish, then verify-schema.mjs'}`)
process.exit(failures ? 1 : 0)
