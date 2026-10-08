#!/usr/bin/env node
/**
 * nav-add.mjs — Scenario 7 step 04 for Dr. Nahlah: new pages into the site-wide menu drawer (#drawer),
 * which every page row carries as its own nodes. Each entry is a fresh-id clone of the list item
 * holding the link it follows, so it takes that column's look. Idempotent: a drawer that already
 * links to the new href is left alone.
 *
 * spec: [{ "after": "<href of the drawer link it follows>", "text": "<label>", "href": "<new href>" }, …]
 *   node output/code/nav-add.mjs <spec>                       # plan: pages that change
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com STAGING_HOST=staging.drnahlah.com node output/code/nav-add.mjs <spec> --apply [--publish]
 * Run from scenario-7-seo-aeo/04-content-depth. Writes in batches of 8 rows (baseSeqs each), backs every
 * row up first, reads every row back, publishes once at the end.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
const lib = (p) => import(pathToFileURL(resolve('../../tools/instatic-site', p)).href)
const { api, getSite, getPages, toChangedPage, publish, publishStatus, BASE } = await lib('lib/site.mjs')
const { assertStaging } = await lib('lib/staging-guard.mjs')
const specFile = process.argv.slice(2).find((a) => !a.startsWith('--'))
const APPLY = process.argv.includes('--apply'), PUBLISH = process.argv.includes('--publish')
if (APPLY) assertStaging()
const SPEC = JSON.parse(readFileSync(specFile, 'utf8'))
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
const nanoid = () => [...randomBytes(21)].map((b) => ABC[b & 63]).join('')

const status = await publishStatus()
const rows = (await getPages()).rows
const plans = [], skipped = [], problems = []
for (const r of rows) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r.id}`)).row
  const N0 = row.cells?.body?.nodes
  const slug = row.cells?.slug ?? r.slug
  const drawer = N0 && Object.values(N0).find((n) => n.props?.htmlAttributes?.id === 'drawer')
  if (!drawer) { skipped.push(slug); continue }
  const N = structuredClone(N0), added = [], changed = new Set()
  const sub = (root) => { const out = []; const w = (id) => { out.push(N[id]); (N[id].children || []).forEach(w) }; w(root); return out }
  for (const e of SPEC) {
    const links = sub(drawer.id).filter((n) => n.moduleId === 'base.link')
    if (links.some((n) => n.props?.href === e.href)) continue
    const prev = links.find((n) => n.props?.href === e.after)
    const li = prev && N[prev.parentId]
    if (!li || li.props?.customTag !== 'li') { problems.push(`${slug}: no drawer item for ${e.after}`); continue }
    const ul = N[li.parentId]
    const clone = (id, parentId) => { const nid = nanoid(); const n = structuredClone(N[id]); n.id = nid; n.parentId = parentId; n.children = []; N[nid] = n; added.push(nid); for (const c of N[id].children || []) n.children.push(clone(c, nid)); return nid }
    const nli = clone(li.id, ul.id)
    const nlink = sub(nli).find((n) => n.moduleId === 'base.link')
    nlink.props = { ...nlink.props, text: e.text, href: e.href }
    for (const k of Object.keys(nlink.props.htmlAttributes || {})) if (k === 'aria-current') delete nlink.props.htmlAttributes[k]
    ul.children = [...ul.children]; ul.children.splice(ul.children.indexOf(li.id) + 1, 0, nli); changed.add(ul.id)
  }
  if (added.length) plans.push({ slug, row, N0, N, added, changed: [...changed] })
}
console.log(`${APPLY ? 'APPLY' : 'PLAN'} on ${BASE}`)
console.log(`  status   ${JSON.stringify(status)}`)
console.log(`  rows     ${rows.length}: ${plans.length} to change, ${rows.length - plans.length - skipped.length} already done, ${skipped.length} without a drawer (${skipped.slice(0, 6).join(', ')}${skipped.length > 6 ? '…' : ''})`)
for (const p of problems.slice(0, 10)) console.log(`  !! ${p}`)
if (!APPLY) process.exit(problems.length ? 1 : 0)
if (problems.length) { console.error('REFUSING: problems above'); process.exit(1) }
if (status.draftMatchesPublished !== true) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }
const BK = resolve('output/backups'); mkdirSync(BK, { recursive: true })
const bf = join(BK, `nav-add-${new URL(BASE).hostname}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(bf, JSON.stringify(plans.map((p) => p.row)))
console.log(`  backup   ${bf}`)
const bad = []
for (let i = 0; i < plans.length; i += 8) {
  const batch = plans.slice(i, i + 8)
  const { site: sh, seq } = await getSite()
  await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: sh, changedPages: batch.map((p) => toChangedPage(p.row, { nodes: p.N })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(batch.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
  })
  for (const p of batch) {
    const back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row, an = back.cells.body.nodes
    for (const [id, n] of Object.entries(p.N)) if (!isDeepStrictEqual(an[id], n)) bad.push(`${p.slug}: node ${id} not as planned`)
    if (Object.keys(an).length !== Object.keys(p.N).length) bad.push(`${p.slug}: node count ${Object.keys(an).length}, planned ${Object.keys(p.N).length}`)
    for (const k of ['title', 'seoTitle', 'seoDescription', 'slug']) if (back.cells[k] !== p.row.cells[k]) bad.push(`${p.slug}: cell ${k} changed`)
  }
  console.log(`  wrote    ${batch.map((p) => p.slug).join(', ')}`)
  if (bad.length) break
}
for (const b of bad.slice(0, 20)) console.log(`  !! ${b}`)
if (bad.length) { console.log(`READ-BACK FAILED (${bad.length}) — restore from ${bf}`); process.exit(1) }
console.log('  readback clean')
if (PUBLISH) { const r = await publish(); console.log(`published ${JSON.stringify(r)}`) } else console.log('draft only — pass --publish after checking')
