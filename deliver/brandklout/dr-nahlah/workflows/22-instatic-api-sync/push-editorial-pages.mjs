#!/usr/bin/env node
/**
 * push-editorial-pages.mjs — put a built EDITORIAL page into the Instatic draft
 * over REST. `push-ads-pages.mjs` for the thirty-seven-page site, minus the one
 * thing that is specific to the paid set.
 *
 *   python ads-to-nodes.py --map <map> --out .tmp/nodes-x --pages <slug>   # first
 *   node push-editorial-pages.mjs --nodes .tmp/nodes-x                     # plan
 *   node push-editorial-pages.mjs --nodes .tmp/nodes-x --apply             # write
 *
 * ## The one difference from push-ads-pages.mjs, and it matters
 *
 * That script also ships `css/70-landing.css` as a page-scoped code asset and
 * adds every page it pushes to that asset's scope. An editorial page must NOT
 * be in that scope: `70-landing.css` is the paid set's own stylesheet, it sits
 * after the kit in the cascade, and `.lp-hero` beating `.pg-hero` is exactly
 * what you do not want on a page that uses `.pg-hero`. Everything an editorial
 * page needs is already in the site's registry, which is why there is no
 * stylesheet step here at all.
 *
 * Everything else is deliberately identical, including the traps:
 *
 *  - CLASS RULES FIRST. A class name with no class-kind rule cannot go on a
 *    node. Any name the page uses that is not registered gets an empty class
 *    rule, which survives publish because a node references it. An editorial
 *    page normally needs none; a brand-new kit part is the exception.
 *  - READ BACK AND COUNT. The failure mode on this platform is a silent partial
 *    write, not an error. Node, image, section, embed and video counts are
 *    compared against what was sent, and the slug is re-checked.
 *  - SEO CELLS LAST, THEN SITE-DOCUMENT AGAIN. `PUT /site-document` cannot
 *    carry seoTitle/seoDescription (`pageToCells` drops them), and
 *    `PATCH /data/rows/:id` re-derives the routable slug. A flat editorial slug
 *    has no slash to flatten, but the re-save is kept anyway: it costs one call
 *    and it is the difference between "this is safe here" and "this is safe".
 *  - TEMPLATES ASSERTED. This is the save shape that un-templated `post` and
 *    404'd all 43 articles on 2026-08-25.
 *
 * NOTHING HERE PUBLISHES.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import {
  api, getSite, getPages, saveShell, templateMap, toChangedPage, BASE,
} from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const argOf = (f) => { const i = process.argv.indexOf(f); return i === -1 ? null : process.argv[i + 1] }
const NODES = argOf('--nodes')
const ONLY = argOf('--only')?.split(',').filter(Boolean)
const APPLY = process.argv.includes('--apply')
if (!NODES) { console.error('usage: push-editorial-pages.mjs --nodes <dir> [--only a,b] [--apply]'); process.exit(2) }

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => { const b = randomBytes(21); let s = ''; for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]; return s }

const pages = readdirSync(NODES).filter((f) => f.endsWith('.json')).sort()
  .map((f) => JSON.parse(readFileSync(join(NODES, f), 'utf8')))
  .filter((p) => !ONLY || ONLY.includes(p.localSlug))
if (!pages.length) { console.error('no pages selected'); process.exit(1) }

/* An ads slug carries a slash. If one turns up here it is the wrong script:
   it would be pushed without the stylesheet it needs and render unstyled. */
const strays = pages.filter((p) => p.slug.startsWith('ads-landing-pages/'))
if (strays.length) {
  console.error(`these are ads pages, use push-ads-pages.mjs: ${strays.map((p) => p.slug).join(', ')}`)
  process.exit(1)
}

const classNames = new Set()
for (const p of pages) for (const n of Object.values(p.nodes)) for (const c of n.classNames ?? []) classNames.add(c)

// ── the shell: class rules only ───────────────────────────────────────────
const { site: shell, seq } = await getSite()
const rules = shell.styleRules ?? {}
const byName = new Map()
for (const r of Object.values(rules)) {
  if (r.kind !== 'class') continue
  const cur = byName.get(r.name)
  if (!cur || (r.order ?? 0) > (cur.order ?? 0)) byName.set(r.name, r)
}
let maxOrder = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0))
const missing = [...classNames].filter((n) => !byName.has(n)).sort()
const now = Date.now()
const newRules = missing.map((name) => ({
  id: nanoid(), name, kind: 'class', selector: '.' + name, order: ++maxOrder,
  styles: {}, contextStyles: {}, createdAt: now, updatedAt: now,
}))
for (const r of newRules) byName.set(r.name, r)

const rows = (await getPages()).rows
const bySlug = new Map(rows.map((r) => [r.cells?.slug ?? r.slug, r]))
for (const p of pages) {
  p.row = bySlug.get(p.slug) ?? null
  p.id = p.row?.id ?? nanoid()
}

console.log(BASE)
console.log(`  pages        ${pages.length} (${pages.filter((p) => p.row).length} replace, ${pages.filter((p) => !p.row).length} create)`)
console.log(`  classes      ${classNames.size} used, ${classNames.size - newRules.length} already registered, ${newRules.length} new empty class rules`)
if (newRules.length) console.log(`               ${missing.join(' ')}`)
console.log('  stylesheet   none — editorial pages use the site registry (see the header)')
for (const p of pages) {
  const s = p.stats
  console.log(`  ${p.row ? 'REPLACE' : 'CREATE '} /${p.slug.padEnd(40)} nodes ${String(s.nodes).padStart(3)} img ${String(s.images).padStart(2)} vid ${s.videos} embed ${s.embeds} sec ${String(s.sections).padStart(2)}`)
}
if (!APPLY) { console.log('\nplan only — pass --apply to write the draft. Nothing publishes.'); process.exit(0) }

const templatesBefore = await templateMap()
if (newRules.length) {
  for (const r of newRules) rules[r.id] = r
  shell.styleRules = rules
  const shellRes = await saveShell(shell, seq)
  console.log(`\nshell saved: ${JSON.stringify(shellRes)}  (+${newRules.length} class rules)`)
}

const counts = (nodes) => ({
  nodes: Object.keys(nodes).length,
  img: Object.values(nodes).filter((n) => n.moduleId === 'base.image').length,
  sec: Object.values(nodes).filter((n) => n.props?.tag === 'section').length,
  embed: Object.values(nodes).filter((n) => n.moduleId === 'brandklout.embed-origins.embed').length,
  video: Object.values(nodes).filter((n) => n.moduleId === 'base.video').length,
})

let bad = 0
for (const p of pages) {
  const nodes = {}
  for (const [id, n] of Object.entries(p.nodes)) {
    const { classNames: names, ...rest } = n
    rest.classIds = (names ?? []).map((c) => byName.get(c).id)
    nodes[id] = rest
  }
  const entry = { id: p.id, slug: p.slug, title: p.title, nodes, rootNodeId: p.rootNodeId }
  const { site: sh, seq: sq } = await getSite()
  let res
  try {
    res = await api('PUT', '/admin/api/cms/site-document', {
      mode: 'incremental', site: sh, changedPages: [entry], deletedPageIds: [],
      changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
      baseSeqs: p.row ? { [p.row.id]: p.row.seq } : {}, shellBaseSeq: sq,
    })
  } catch (e) {
    console.log(`FAIL    /${p.slug}: ${e.message.slice(0, 300)}`); bad++; continue
  }
  const back = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
  const want = counts(nodes), got = counts(back.cells.body.nodes)
  const ok = JSON.stringify(want) === JSON.stringify(got) && (back.cells.slug ?? back.slug) === p.slug
  if (!ok) bad++
  console.log(`${ok ? 'OK  ' : 'BAD '}    /${p.slug.padEnd(40)} seq ${res.seq}  sent ${JSON.stringify(want)}  got ${JSON.stringify(got)}`)

  if (ok && p.seo?.title) {
    const before = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
    await api('PATCH', `/admin/api/cms/data/rows/${p.id}`, {
      cells: { ...before.cells, seoTitle: p.seo.title, seoDescription: p.seo.desc },
    })
    const after = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
    const intact = (after.cells.slug ?? after.slug) === p.slug
      && Object.keys(after.cells.body.nodes).length === want.nodes
    if (!intact) { console.log(`BAD     /${p.slug}: the SEO patch changed the page`); bad++; continue }

    const rowNow = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
    const { site: sh2, seq: sq2 } = await getSite()
    await api('PUT', '/admin/api/cms/site-document', {
      mode: 'incremental', site: sh2, changedPages: [toChangedPage(rowNow)], deletedPageIds: [],
      changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
      baseSeqs: { [p.id]: rowNow.seq }, shellBaseSeq: sq2,
    })
    console.log(`        seo cells written and the route re-asserted`)
  }
}

const templatesAfter = await templateMap()
const lost = Object.keys(templatesBefore).filter((s) => !templatesAfter[s])
if (lost.length) { console.error(`\nTEMPLATES LOST: ${lost.join(', ')} — do NOT publish`); process.exit(1) }
console.log(`\ntemplates intact: ${Object.keys(templatesAfter).sort().join(', ')}`)
if (bad) { console.error(`\n${bad} page(s) did not land whole — do NOT publish.`); process.exit(1) }
console.log('\nall pages in the draft. Nothing is published.')
