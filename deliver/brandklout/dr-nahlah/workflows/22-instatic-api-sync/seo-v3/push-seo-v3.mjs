#!/usr/bin/env node
/**
 * SEO v3: ship seo-v3/out (build-schema-v3.mjs) to the aeo-schema store of INSTATIC_BASE_URL.
 *   - organizationJson setting, the site-wide block, every page and article block that differs
 *   - emitBreadcrumbs off: every indexed page now carries its own BreadcrumbList (the trail the
 *     page shows); the generated one named the last crumb with the full SEO title
 * Backs up the store first (.tmp/backups/seo-v3-<host>-<stamp>/). Draft only: the graph renders
 * at the next publish (do-publish.mjs). Prints the publish status so pending page edits by
 * someone else are seen before they ship with it.
 *
 *   node seo-v3/push-seo-v3.mjs            # dry run
 *   node seo-v3/push-seo-v3.mjs --apply
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, publishStatus, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const AEO = '/admin/api/cms/plugins/brandklout.aeo-schema'
const NOTE = 'seo-v3 2026-10-05: built from page content'
const organization = JSON.parse(readFileSync(join(HERE, 'out', 'organization.json'), 'utf8'))
const { sitewide, pages, posts } = JSON.parse(readFileSync(join(HERE, 'out', 'blocks.json'), 'utf8'))

console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} on ${BASE}`)
const status = await publishStatus()
console.log('publish status before:', JSON.stringify(status).slice(0, 300))

const entries = (await api('GET', `${AEO}/runtime/entries`)).entries
const settings = (await api('GET', `${AEO}/settings`)).settings
const BK = join(HERE, '..', '.tmp', 'backups', `seo-v3-${BASE.replace(/^https?:\/\//, '')}-${new Date().toISOString().replace(/[:.]/g, '-')}`)
mkdirSync(BK, { recursive: true })
writeFileSync(join(BK, 'aeo-entries.json'), JSON.stringify(entries))
writeFileSync(join(BK, 'aeo-settings.json'), JSON.stringify(settings))
console.log('backup', BK)

let failures = 0, written = 0
const fail = (m) => { failures++; console.log('  !! ' + m) }
const keys = new Set(entries.map((e) => e.key))

const orgJson = JSON.stringify(organization, null, 2)
const nextSettings = { ...settings, organizationJson: orgJson, emitBreadcrumbs: false }
if (settings.organizationJson !== orgJson || settings.emitBreadcrumbs !== false) {
  console.log(`  settings: organizationJson ${settings.organizationJson.length} -> ${orgJson.length}c, emitBreadcrumbs ${settings.emitBreadcrumbs} -> false`)
  if (APPLY) {
    const res = (await api('PUT', `${AEO}/settings`, { settings: nextSettings })).settings ?? {}
    if (res.organizationJson !== orgJson || res.emitBreadcrumbs !== false) fail('settings did not read back')
  }
}
const upsert = async (key, nodes) => {
  if (key !== '*' && !keys.has(key)) { fail(`${key}: not an aeo entry on this host`); return }
  const json = JSON.stringify(nodes.length === 1 ? nodes[0] : nodes)
  if (entries.find((x) => x.key === key)?.block?.json === json) return
  written++
  if (!APPLY) return
  const res = await api('POST', `${AEO}/runtime/entry`, { key, json, note: NOTE, enabled: true })
  if (res.error || res.ok === false) fail(`${key}: ${JSON.stringify(res).slice(0, 200)}`)
}
await upsert('*', sitewide)
for (const [slug, nodes] of Object.entries(pages)) if (nodes) await upsert(slug, nodes)
for (const [key, nodes] of Object.entries(posts)) await upsert(key, nodes)
console.log(`  blocks ${APPLY ? 'written' : 'to write'}: ${written}`)
console.log(`\n${failures ? failures + ' FAILURE(S)' : 'clean'}${APPLY ? ' — publish with do-publish.mjs' : ' (dry run)'}`)
process.exit(failures ? 1 : 0)
