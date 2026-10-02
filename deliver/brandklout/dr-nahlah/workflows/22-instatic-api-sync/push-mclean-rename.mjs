#!/usr/bin/env node
/**
 * push-mclean-rename.mjs — three page addresses spelled McLean "maclean"
 * (QA 2026-09-28, C12). Renamed, with every internal reference moved:
 *
 *   /contact-maclean           -> /contact-mclean
 *   /privacy-policy-maclean    -> /privacy-policy-mclean
 *   /terms-of-service-maclean  -> /terms-of-service-mclean
 *
 *   node push-mclean-rename.mjs              # plan
 *   node push-mclean-rename.mjs --apply      # draft: slugs, links, seo-head; OG + schema re-keyed
 *   node push-mclean-rename.mjs --publish
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-mclean-rename.mjs ...
 *
 * Instatic makes NO redirect for a renamed page (tested on staging 2026-10-02:
 * the old address 404s), so the 301s live in Cloudflare's drnahlah_301 Bulk
 * Redirect list — 14-migration-seo-redirects/add-mclean-redirects.mjs, run
 * straight after the publish. The sitemap worker is patched there too.
 *
 * Moves: the page rows' slugs; every node href/htmlAttributes.href that IS one of
 * the old paths (± #anchor / ?query); the seo-head.js map keys; the
 * brandklout.open-graph override and the brandklout.aeo-schema block of each page,
 * copied to the new key with their URLs rewritten (the old-key entries are left:
 * nothing reads a key whose page no longer exists).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, toChangedPage, saveShell, BASE } from './sedation-api.mjs'

export const RENAME = {
  'contact-maclean': 'contact-mclean',
  'privacy-policy-maclean': 'privacy-policy-mclean',
  'terms-of-service-maclean': 'terms-of-service-mclean',
}
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HOST = BASE.replace(/^https?:\/\//, '')
mkdirSync('.tmp/qa-fixes', { recursive: true })
const STATE = `.tmp/qa-fixes/mclean-state-${HOST}.json`
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const slugOf = (r) => r.cells?.slug ?? r.slug
const OG = '/admin/api/cms/plugins/brandklout.open-graph/runtime'
const AEO = '/admin/api/cms/plugins/brandklout.aeo-schema/runtime'
const movePath = (s) => {
  const m = /^\/([\w-]+)([#?].*)?$/.exec(s ?? '')
  return m && RENAME[m[1]] ? `/${RENAME[m[1]]}${m[2] ?? ''}` : null
}
const moveUrls = (s) => Object.entries(RENAME).reduce((a, [o, n]) => a.split(`/${o}`).join(`/${n}`), s)

const status = await api('GET', '/admin/api/cms/publish/status')
console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)', JSON.stringify(status))
const list = (await getPages()).rows
if (PUBLISH) {
  const st = JSON.parse(readFileSync(STATE, 'utf8'))
  const now = Object.fromEntries(list.map((r) => [r.id, r.seq]))
  const { site } = await getSite()
  if (Object.keys(st.seqs).some((id) => now[id] !== st.seqs[id]) || sha(site.files) !== st.files) { console.error('REFUSING: the draft moved since --apply'); process.exit(1) }
  console.log('published', JSON.stringify(await api('POST', '/admin/api/cms/publish', {})))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  console.log('NOW: node ../14-migration-seo-redirects/add-mclean-redirects.mjs --apply')
  process.exit(0)
}
if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

const plans = []
for (const r0 of list) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
  const slug = slugOf(row)
  const N = structuredClone(row.cells.body.nodes)
  let links = 0
  for (const n of Object.values(N)) {
    const p = n.props ?? {}
    const a = movePath(p.href); if (a) { p.href = a; links++ }
    const b = movePath(p.htmlAttributes?.href); if (b) { p.htmlAttributes.href = b; links++ }
  }
  const newSlug = RENAME[slug]
  if (links || newSlug) { plans.push({ row, slug, newSlug, N, links }); console.log(`  page     ${slug}${newSlug ? ` -> ${newSlug}` : ''}${links ? `  (${links} link(s))` : ''}`) }
}
const comps = (await api('GET', '/admin/api/cms/components')).rows ?? []
const compPlans = []
for (const c of comps) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${c.id}`)).row
  const N = structuredClone(row.cells.body.nodes); let links = 0
  for (const n of Object.values(N)) { const a = movePath(n.props?.href); if (a) { n.props.href = a; links++ } const b = movePath(n.props?.htmlAttributes?.href); if (b) { n.props.htmlAttributes.href = b; links++ } }
  if (links) { compPlans.push({ row, N }); console.log(`  comp     ${row.cells.name} (${links} link(s))`) }
}
const { site: s0 } = await getSite()
const seoHead = s0.files.find((f) => f.path === 'src/scripts/seo-head.js')
const seoNext = Object.entries(RENAME).reduce((a, [o, n]) => a.split(`"/${o}"`).join(`"/${n}"`), seoHead.content)
console.log(`  asset    seo-head.js: ${seoNext === seoHead.content ? 'nothing' : 'map keys moved'}`)
const og = (await api('GET', `${OG}/pages`)).pages ?? []
const aeo = (await api('GET', `${AEO}/entries`)).entries ?? []
const ogAdds = [], aeoAdds = []
for (const [o, n] of Object.entries(RENAME)) {
  const ov = og.find((p) => p.slug === o)?.override ?? og.find((p) => p.slug === n)?.override
  if (ov && ov.key !== n) ogAdds.push({ ...ov, key: n, ...(ov.url ? { url: moveUrls(ov.url) } : {}) })
  const b = aeo.find((e) => e.key === o)?.block
  if (b && !aeo.some((e) => e.key === n && e.block)) aeoAdds.push({ key: n, json: moveUrls(b.json), note: b.note, enabled: b.enabled })
}
console.log(`  og       ${ogAdds.map((x) => x.key).join(', ') || 'nothing'}\n  schema   ${aeoAdds.map((x) => x.key).join(', ') || 'nothing'}`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

for (let k = 0; k < plans.length; k += 10) {
  const chunk = plans.slice(k, k + 10)
  const { site: sh, seq } = await getSite()
  await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: sh,
    changedPages: chunk.map((p) => toChangedPage(p.row, { nodes: p.N, ...(p.newSlug ? { slug: p.newSlug } : {}) })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(chunk.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
  })
}
for (const p of plans) { // the site-document write drops the SEO cells
  const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => p.row.cells[k] !== undefined).map((k) => [k, p.row.cells[k]]))
  const back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  if (Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) await api('PATCH', `/admin/api/cms/data/rows/${p.row.id}`, { cells: { ...back.cells, ...keep } })
}
for (const c of compPlans) await api('PATCH', `/admin/api/cms/data/rows/${c.row.id}`, { cells: { ...c.row.cells, body: { ...c.row.cells.body, nodes: c.N } } })
if (seoNext !== seoHead.content) {
  const fresh = await getSite()
  const f = fresh.site.files.find((x) => x.path === 'src/scripts/seo-head.js')
  if (f.content !== seoHead.content) throw new Error('seo-head.js changed since it was read')
  f.content = seoNext
  await saveShell(fresh.site, fresh.seq)
}
for (const o of ogAdds) await api('POST', `${OG}/override`, o)
for (const b of aeoAdds) await api('POST', `${AEO}/entry`, b)

const problems = []
const rows2 = new Map((await getPages()).rows.map((r) => [r.id, r]))
for (const p of plans) {
  const b = rows2.get(p.row.id)
  if (slugOf(b) !== (p.newSlug ?? p.slug)) problems.push(`${p.slug}: slug is ${slugOf(b)}`)
  if (!isDeepStrictEqual(b.cells.body.nodes, p.N)) problems.push(`${p.slug}: nodes differ from plan`)
}
const { site: s1 } = await getSite()
if (s1.files.find((f) => f.path === 'src/scripts/seo-head.js').content !== seoNext) problems.push('seo-head.js differs')
const og2 = (await api('GET', `${OG}/pages`)).pages ?? []
for (const o of ogAdds) if (og2.find((p) => p.slug === o.key)?.override?.description !== o.description) problems.push(`og ${o.key} not attached`)
if (problems.length) { console.error(`READ-BACK PROBLEMS:\n  ${problems.join('\n  ')}`); process.exit(1) }
writeFileSync(STATE, JSON.stringify({ seqs: Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq])), files: sha(s1.files) }))
console.log('  readback slugs, links, seo-head, OG and schema as planned — re-run with --publish')
