#!/usr/bin/env node
/**
 * Copy the SEO plugin stores between hosts (2026-10-05, staging parity after SEO v2).
 * clone-site.mjs does not carry plugin data, so open-graph overrides, aeo-schema blocks and the
 * aeo organizationJson must be copied on their own. The host comes from INSTATIC_BASE_URL.
 *
 *   INSTATIC_BASE_URL=https://www.drnahlah.com     node seo-v2/plugin-stores.mjs export
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node seo-v2/plugin-stores.mjs import [--apply]
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node seo-v2/plugin-stores.mjs diff
 *
 * import writes only what differs, never deletes, and backs up the target's stores first.
 * Draft-side only: the plugins render at the next publish.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const FILE = join(HERE, 'out', 'plugin-stores.prod.json')
const MODE = process.argv[2]
const APPLY = process.argv.includes('--apply')
const OG = '/admin/api/cms/plugins/brandklout.open-graph'
const AEO = '/admin/api/cms/plugins/brandklout.aeo-schema'

const read = async () => ({
  host: BASE,
  og: (await api('GET', `${OG}/runtime/pages`)).pages.filter((p) => p.override).map((p) => p.override),
  aeo: (await api('GET', `${AEO}/runtime/entries`)).entries.filter((e) => e.block).map((e) => ({ key: e.block.key, json: e.block.json, note: e.block.note, enabled: e.block.enabled !== false })),
  site: (await api('GET', `${AEO}/runtime/entries`)).entries.find((e) => e.key === '*')?.block ?? null,
  organizationJson: (await api('GET', `${AEO}/settings`)).settings.organizationJson,
  // the emit* switches travel too (SEO v3: emitBreadcrumbs off, the pages carry their own trail)
  emit: Object.fromEntries(Object.entries((await api('GET', `${AEO}/settings`)).settings).filter(([k]) => k.startsWith('emit'))),
})

if (MODE === 'export') {
  const s = await read()
  // the entries route does not list the site-wide '*' block; take it from the SEO v2 build
  if (!s.site) {
    const sw = JSON.parse(readFileSync(join(HERE, 'out', 'blocks.json'), 'utf8')).sitewide
    s.site = { key: '*', json: JSON.stringify(sw.length === 1 ? sw[0] : sw), note: 'seo-v2 2026-10-05', enabled: true }
  }
  writeFileSync(FILE, JSON.stringify(s, null, 1))
  console.log(`exported ${BASE}: ${s.og.length} og overrides, ${s.aeo.length} aeo blocks, site-wide ${!!s.site}, org ${s.organizationJson.length}c`)
  process.exit(0)
}

const src = JSON.parse(readFileSync(FILE, 'utf8'))
if (src.host === BASE) { console.error('source and target are the same host'); process.exit(2) }
const cur = await read()
const ogBy = Object.fromEntries(cur.og.map((o) => [o.key, JSON.stringify(o)]))
const aeoBy = Object.fromEntries(cur.aeo.map((b) => [b.key, b.json]))
const site = src.site ? [{ key: '*', json: src.site.json, note: src.site.note, enabled: src.site.enabled !== false }] : []
const ogTodo = src.og.filter((o) => ogBy[o.key] !== JSON.stringify(o))
const aeoTodo = [...src.aeo, ...site].filter((b, i, a) => a.findIndex((x) => x.key === b.key) === i).filter((b) => aeoBy[b.key] !== b.json)
const orgTodo = cur.organizationJson !== src.organizationJson || JSON.stringify(cur.emit) !== JSON.stringify(src.emit || cur.emit)
console.log(`${BASE} vs ${src.host}: og ${ogTodo.length} differ, aeo ${aeoTodo.length} differ, organizationJson ${orgTodo ? 'differs' : 'same'}`)
if (MODE === 'diff') process.exit(ogTodo.length || aeoTodo.length || orgTodo ? 1 : 0)
if (MODE !== 'import') { console.error('mode: export | import | diff'); process.exit(2) }
if (!APPLY) { console.log('dry run'); process.exit(0) }

const BK = join(HERE, '..', '.tmp', 'backups', 'plugin-stores-' + BASE.replace(/^https?:\/\//, '') + '-' + new Date().toISOString().replace(/[:.]/g, '-'))
mkdirSync(BK, { recursive: true })
writeFileSync(join(BK, 'stores.json'), JSON.stringify(cur))
let fail = 0
for (const o of ogTodo) { const r = await api('POST', `${OG}/runtime/override`, o); if (!r.saved) { fail++; console.log('  !! og', o.key) } }
for (const b of aeoTodo) { const r = await api('POST', `${AEO}/runtime/entry`, b); if (r.error || r.ok === false) { fail++; console.log('  !! aeo', b.key) } }
if (orgTodo) {
  const s = (await api('GET', `${AEO}/settings`)).settings
  await api('PUT', `${AEO}/settings`, { settings: { ...s, organizationJson: src.organizationJson, ...(src.emit || {}) } })
}
console.log(`written: og ${ogTodo.length}, aeo ${aeoTodo.length}, org ${orgTodo}; failures ${fail}; backup ${BK}`)
process.exit(fail ? 1 : 0)
