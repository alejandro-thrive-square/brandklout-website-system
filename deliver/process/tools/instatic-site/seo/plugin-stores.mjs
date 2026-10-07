#!/usr/bin/env node
/**
 * plugin-stores.mjs — copy the SEO plugin stores between two instances of the same site (staging
 * parity after a schema or meta push). A site clone (staging-clone/clone-site.mjs) does not carry
 * plugin runtime data, and clone-plugins.mjs copies plugin settings only, so the open-graph
 * overrides, the aeo-schema blocks, organizationJson and the emit* switches travel here.
 * The host is INSTATIC_BASE_URL.
 *
 *   INSTATIC_BASE_URL=https://www.<domain>     node plugin-stores.mjs export            → <out>/plugin-stores.json
 *   INSTATIC_BASE_URL=https://staging.<domain> node plugin-stores.mjs diff              exit 1 when they differ
 *   INSTATIC_BASE_URL=https://staging.<domain> STAGING_HOST=staging.<domain> node plugin-stores.mjs import --apply
 *
 * import writes only what differs and never deletes; it backs up the target's stores first
 * (<out>/backups/) and refuses when source and target are the same host. Without --apply it is a
 * dry run. Draft-side only: the plugins render at the next publish of the target.
 * The entries route does not list the site-wide "*" block; export takes it from <out>/blocks.json
 * (build-schema.mjs) when it cannot read it.
 *
 * Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v2/plugin-stores.mjs.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { api, BASE } from '../lib/site.mjs'
import { assertStaging } from '../lib/staging-guard.mjs'
import { outDir, arg, flag } from './lib/seo-config.mjs'

const OUT = outDir()
mkdirSync(OUT, { recursive: true })
const FILE = arg('--file', join(OUT, 'plugin-stores.json'))
const MODE = process.argv[2]
const APPLY = flag('--apply')
const OG = '/admin/api/cms/plugins/brandklout.open-graph'
const AEO = '/admin/api/cms/plugins/brandklout.aeo-schema'

const read = async () => {
  const entries = (await api('GET', `${AEO}/runtime/entries`)).entries
  const settings = (await api('GET', `${AEO}/settings`)).settings
  return {
    host: BASE,
    og: (await api('GET', `${OG}/runtime/pages`)).pages.filter((p) => p.override).map((p) => p.override),
    aeo: entries.filter((e) => e.block).map((e) => ({ key: e.block.key, json: e.block.json, note: e.block.note, enabled: e.block.enabled !== false })),
    site: entries.find((e) => e.key === '*')?.block ?? null,
    organizationJson: settings.organizationJson,
    emit: Object.fromEntries(Object.entries(settings).filter(([k]) => k.startsWith('emit'))),
  }
}

if (MODE === 'export') {
  const s = await read()
  if (!s.site && existsSync(join(OUT, 'blocks.json'))) {
    const sw = JSON.parse(readFileSync(join(OUT, 'blocks.json'), 'utf8')).sitewide || []
    if (sw.length) s.site = { key: '*', json: JSON.stringify(sw.length === 1 ? sw[0] : sw), note: 'from blocks.json', enabled: true }
  }
  writeFileSync(FILE, JSON.stringify(s, null, 1))
  console.log(`exported ${BASE}: ${s.og.length} og overrides, ${s.aeo.length} aeo blocks, site-wide ${s.site ? 'yes' : 'NO (not listed, no blocks.json)'}, org ${(s.organizationJson || '').length}c → ${FILE}`)
  process.exit(0)
}
if (!['diff', 'import'].includes(MODE)) { console.error('mode: export | diff | import [--apply]'); process.exit(2) }
if (!existsSync(FILE)) { console.error(`no ${FILE}: export from the source host first`); process.exit(2) }
const src = JSON.parse(readFileSync(FILE, 'utf8'))
if (src.host === BASE) { console.error('source and target are the same host'); process.exit(2) }
const cur = await read()
const ogBy = Object.fromEntries(cur.og.map((o) => [o.key, JSON.stringify(o)]))
const aeoBy = Object.fromEntries(cur.aeo.map((b) => [b.key, b.json]))
const site = src.site ? [{ key: '*', json: src.site.json, note: src.site.note, enabled: src.site.enabled !== false }] : []
const ogTodo = src.og.filter((o) => ogBy[o.key] !== JSON.stringify(o))
const aeoTodo = [...src.aeo, ...site].filter((b, i, a) => a.findIndex((x) => x.key === b.key) === i).filter((b) => aeoBy[b.key] !== b.json)
const orgTodo = cur.organizationJson !== src.organizationJson || JSON.stringify(cur.emit) !== JSON.stringify(src.emit || cur.emit)
console.log(`${BASE} vs ${src.host}: og ${ogTodo.length} differ, aeo ${aeoTodo.length} differ (site-wide "*" is never listed, so it always counts), organizationJson/emit ${orgTodo ? 'differ' : 'same'}`)
if (MODE === 'diff') process.exit(ogTodo.length || aeoTodo.filter((b) => b.key !== '*').length || orgTodo ? 1 : 0)
if (!APPLY) { console.log('dry run — pass --apply'); process.exit(0) }
assertStaging()

const BK = join(OUT, 'backups', 'plugin-stores-' + BASE.replace(/^https?:\/\//, '') + '-' + new Date().toISOString().replace(/[:.]/g, '-'))
mkdirSync(BK, { recursive: true })
writeFileSync(join(BK, 'stores.json'), JSON.stringify(cur))
let fail = 0
for (const o of ogTodo) { const r = await api('POST', `${OG}/runtime/override`, o); if (!r.saved) { fail++; console.log('  !! og', o.key) } }
for (const b of aeoTodo) { const r = await api('POST', `${AEO}/runtime/entry`, b); if (r.error || r.ok === false) { fail++; console.log('  !! aeo', b.key) } }
if (orgTodo) {
  const s = (await api('GET', `${AEO}/settings`)).settings
  const res = (await api('PUT', `${AEO}/settings`, { settings: { ...s, organizationJson: src.organizationJson, ...(src.emit || {}) } })).settings ?? {}
  if (res.organizationJson !== src.organizationJson) { fail++; console.log('  !! organizationJson did not read back') }
}
const after = await read()
const left = src.og.filter((o) => !after.og.some((x) => JSON.stringify(x) === JSON.stringify(o))).length + src.aeo.filter((b) => !after.aeo.some((x) => x.key === b.key && x.json === b.json)).length
if (left) { fail++; console.log(`  !! ${left} record(s) still differ after the write`) }
console.log(`written: og ${ogTodo.length}, aeo ${aeoTodo.length}, org ${orgTodo}; failures ${fail}; backup ${BK}`)
process.exit(fail ? 1 : 0)
