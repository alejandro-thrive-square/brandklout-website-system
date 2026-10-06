#!/usr/bin/env node
/**
 * SEO v2 (2026-10-05): ship seo-v2/meta.json + seo-v2/out/* to the configured Instatic host.
 *
 * Every store a page's title / description / structured data lives in, in one pass:
 *   1. page row `title` cell (the published <title>) + `seoTitle` / `seoDescription` cells
 *      (flat slugs only: a cells PATCH flattens a nested route)
 *   2. brandklout.open-graph override: title + description (og:, twitter:, meta description)
 *   3. brandklout.aeo-schema: organizationJson setting, the site-wide block ("*"),
 *      one block per page, one per article
 *   4. src/scripts/seo-head.js trimmed to what the server cannot emit: `noindex` on the
 *      ads / thank-you / template pages, and the apple-touch-icon. Its JS title, description,
 *      og:* and Article overrides used to rewrite the server head after load, so Google's
 *      rendered page disagreed with the CMS.
 *
 * Backs up every store first (.tmp/backups/seo-v2-<stamp>/). Draft only; publish separately.
 *
 *   node seo-v2/push-seo-v2.mjs            # dry run
 *   node seo-v2/push-seo-v2.mjs --apply
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, getSite, getPages, saveShell, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const meta = JSON.parse(readFileSync(join(HERE, 'meta.json'), 'utf8'))
const organization = JSON.parse(readFileSync(join(HERE, 'out', 'organization.json'), 'utf8'))
const { sitewide, pages: blocks, posts } = JSON.parse(readFileSync(join(HERE, 'out', 'blocks.json'), 'utf8'))
const AEO = '/admin/api/cms/plugins/brandklout.aeo-schema'
const OG = '/admin/api/cms/plugins/brandklout.open-graph'
const NOTE = 'seo-v2 2026-10-05'

console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} on ${BASE}`)

// ── backup ────────────────────────────────────────────────────────────────
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const BK = join(HERE, '..', '.tmp', 'backups', `seo-v2-${stamp}`)
mkdirSync(BK, { recursive: true })
const rows = (await getPages()).rows
const fullRows = []
for (const r of rows) fullRows.push((await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row)
const ogPages = (await api('GET', `${OG}/runtime/pages`)).pages
const aeoEntries = (await api('GET', `${AEO}/runtime/entries`)).entries
const aeoSettings = (await api('GET', `${AEO}/settings`)).settings
const { site, seq } = await getSite()
const headFile = (site.files ?? []).find((f) => f.path === 'src/scripts/seo-head.js')
writeFileSync(join(BK, 'rows.json'), JSON.stringify(fullRows))
writeFileSync(join(BK, 'og-pages.json'), JSON.stringify(ogPages))
writeFileSync(join(BK, 'aeo-entries.json'), JSON.stringify(aeoEntries))
writeFileSync(join(BK, 'aeo-settings.json'), JSON.stringify(aeoSettings))
writeFileSync(join(BK, 'seo-head.js'), headFile?.content ?? '')
console.log('backup', BK)

let failures = 0
const fail = (m) => { failures++; console.log('  !! ' + m) }

// ── 1. rows ───────────────────────────────────────────────────────────────
console.log('\n1. page rows')
for (const [slug, [title, desc]] of Object.entries(meta)) {
  const r = fullRows.find((x) => x.slug === slug)
  if (!r) { fail(`${slug}: no row`); continue }
  if (slug.includes('/')) { fail(`${slug}: nested slug, skipped`); continue }
  const want = { title, seoTitle: title, seoDescription: desc }
  if (Object.entries(want).every(([k, v]) => r.cells[k] === v)) continue
  console.log(`  ${slug.padEnd(28)} ${JSON.stringify(r.cells.title)} -> ${JSON.stringify(title)}`)
  if (!APPLY) continue
  const before = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  const body = JSON.stringify(before.cells.body)
  await api('PATCH', `/admin/api/cms/data/rows/${r.id}`, { cells: { ...before.cells, ...want } })
  const after = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  if (after.slug !== before.slug || after.cells.slug !== before.cells.slug || JSON.stringify(after.cells.body) !== body) {
    fail(`${slug}: SLUG OR BODY CHANGED — restore from ${BK}/rows.json`); break
  }
  if (Object.entries(want).some(([k, v]) => after.cells[k] !== v)) fail(`${slug}: cells did not read back`)
}

// ── 2. open-graph overrides ───────────────────────────────────────────────
console.log('\n2. open-graph overrides')
for (const [slug, [title, desc]] of Object.entries(meta)) {
  const p = ogPages.find((x) => x.key === slug)
  if (!p) { fail(`${slug}: not in open-graph pages`); continue }
  const cur = p.override ?? { key: slug, type: 'website', enabled: true }
  if (cur.title === title && cur.description === desc) continue
  console.log(`  ${slug}`)
  if (!APPLY) continue
  const res = await api('POST', `${OG}/runtime/override`, { ...cur, key: slug, title, description: desc })
  if (!res.saved) fail(`${slug}: override not saved ${JSON.stringify(res)}`)
}

// ── 3. aeo-schema ─────────────────────────────────────────────────────────
console.log('\n3. aeo-schema')
const orgJson = JSON.stringify(organization, null, 2)
if (aeoSettings.organizationJson !== orgJson) {
  console.log('  organizationJson', aeoSettings.organizationJson.length, '->', orgJson.length)
  if (APPLY) {
    const res = await api('PUT', `${AEO}/settings`, { settings: { ...aeoSettings, organizationJson: orgJson } })
    if ((res.settings ?? {}).organizationJson !== orgJson) fail('organizationJson did not read back')
  }
}
const upsert = async (key, nodes) => {
  const json = JSON.stringify(nodes.length === 1 ? nodes[0] : nodes)
  const cur = aeoEntries.find((x) => x.key === key)?.block
  if (cur && cur.json === json) return
  if (!APPLY) { console.log(`  ~ ${key}`); return }
  const res = await api('POST', `${AEO}/runtime/entry`, { key, json, note: NOTE, enabled: true })
  if (res.error || res.ok === false) fail(`${key}: ${JSON.stringify(res).slice(0, 200)}`)
}
await upsert('*', sitewide)
for (const [slug, nodes] of Object.entries(blocks)) if (nodes) await upsert(slug, nodes)
for (const [key, nodes] of Object.entries(posts)) await upsert(key, nodes)
// the dental FAQ page keeps its own FAQPage block; it gains a reviewer and the new name
{
  const e = aeoEntries.find((x) => x.key === 'dental-implant-faq')
  const old = JSON.parse(e.block.json)
  const nodes = Array.isArray(old) ? old : [old]
  const wp = nodes.find((n) => String(n['@id'] || '').endsWith('#webpage')) || nodes[0]
  Object.assign(wp, { name: meta['dental-implant-faq'][0], description: meta['dental-implant-faq'][1],
    reviewedBy: { '@id': 'https://www.drnahlah.com/meet-dr-nahlah#person' }, lastReviewed: '2026-10-05' })
  await upsert('dental-implant-faq', nodes)
}

// ── 4. seo-head.js ────────────────────────────────────────────────────────
console.log('\n4. seo-head.js')
if (!headFile) fail('no src/scripts/seo-head.js')
else if (headFile.content.startsWith('/* seo-head.js, trimmed')) console.log('  already trimmed')
else {
  const src = headFile.content
  const M = JSON.parse(src.slice(src.indexOf('var M =') + 7, src.indexOf('};', src.indexOf('var M =')) + 1))
  const noindex = Object.fromEntries(Object.entries(M).filter(([, v]) => v.r).map(([k, v]) => [k, v.r]))
  const touch = src.slice(src.indexOf('/* apple-touch-icon'))
  const next = `/* seo-head.js, trimmed 2026-10-05 (SEO v2). Titles, descriptions, canonical, og:* and
   JSON-LD are emitted server-side by the brandklout.open-graph and brandklout.aeo-schema
   plugins from the CMS. This keeps only what the server cannot emit yet: noindex on the
   ads, thank-you and template pages. The previous version is in the SEO v2 backup. */
(function () {
  var N = ${JSON.stringify(noindex)};
  var p = location.pathname.replace(/\\/+$/, '') || '/';
  if (!N[p]) return;
  var m = document.head.querySelector('meta[name="robots"]');
  if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'robots'); document.head.appendChild(m); }
  m.setAttribute('content', N[p]);
})();
${touch}`
  console.log(`  ${src.length} -> ${next.length} bytes, noindex paths ${Object.keys(noindex).length}, touch icon kept: ${touch.includes('apple-touch-icon')}`)
  if (Object.keys(noindex).length !== 21 || !touch.includes('apple-touch-icon')) fail('unexpected seo-head.js shape — not written')
  else if (APPLY && src !== next) {
    const fresh = await getSite()
    const f = fresh.site.files.find((x) => x.path === 'src/scripts/seo-head.js')
    f.content = next
    await saveShell(fresh.site, fresh.seq)
    const back = (await getSite()).site.files.find((x) => x.path === 'src/scripts/seo-head.js').content
    if (back !== next) fail('seo-head.js did not read back')
  }
}

console.log(`\n${failures ? failures + ' FAILURE(S)' : 'clean'}${APPLY ? '' : ' (dry run)'}`)
process.exit(failures ? 1 : 0)
