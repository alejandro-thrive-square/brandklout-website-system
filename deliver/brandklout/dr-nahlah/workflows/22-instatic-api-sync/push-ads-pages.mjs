#!/usr/bin/env node
/**
 * push-ads-pages.mjs — put the eighteen ads landing pages into the Instatic
 * DRAFT over REST: the class rules their markup needs, the landing stylesheet
 * as a page-scoped code asset, the page documents themselves, and their SEO
 * cells. No browser, no MCP bridge, nothing published.
 *
 *   python ads-to-nodes.py --map <media map> --out .tmp/ads-nodes      # first
 *   node push-ads-pages.mjs --nodes .tmp/ads-nodes                      # plan only
 *   node push-ads-pages.mjs --nodes .tmp/ads-nodes --apply              # write the draft
 *   node push-ads-pages.mjs --nodes .tmp/ads-nodes --apply --only ads-alexandria-veneers
 *
 * Point it at staging with INSTATIC_BASE_URL=https://staging.drnahlah.com and
 * the staging media map's node output; run there first, always.
 *
 * ## The four writes, in order
 *
 * 1. CLASS RULES. A node carries classes as `classIds` into `site.styleRules`,
 *    and a class name with no class-kind rule cannot be put on a node at all.
 *    Every class the pages use that has no class-kind rule yet (all the `lp-*`
 *    names, plus the state names like `is-four`) gets an EMPTY class rule.
 *    Empty on purpose: the styling arrives in step 2, and the rule exists only
 *    to carry the name. These survive publish because nodes reference them
 *    (`styleRuleTreeShake.ts` keeps a class rule iff some node.classIds has it).
 *
 * 2. THE LANDING STYLESHEET as a code asset, `src/styles/landing.css`, the
 *    design package's `css/70-landing.css` verbatim, scoped to the eighteen
 *    pages. A code asset rather than registry rules because (a) code assets
 *    are served after the registry, which is exactly the cascade position the
 *    file has locally (70, after the kit), so `.lp-hero` beats `.pg-hero` with
 *    no ordering work; (b) every value ships as written — `clamp()`, `svh`,
 *    the multi-stop gradients — where the registry converter drops or flattens
 *    them; and (c) these pages are Brandklout's paid-traffic set, not something
 *    the client edits in the Styles panel. The scope keeps the file off the
 *    thirty-seven editorial pages.
 *
 * 3. THE PAGES. One `PUT /site-document` per page with a flat Page entry
 *    (`id, slug, title, nodes, rootNodeId`). An existing slug is REPLACED in
 *    its own id (the route and any SEO cells survive); a new one gets a fresh
 *    nanoid. Each write is read back and the node count, image count, section
 *    count and embed count are compared against what was sent, because the
 *    failure mode on this platform is a silent partial write, not an error.
 *
 * 4. SEO CELLS. `seoTitle` / `seoDescription` through `PATCH /data/rows/:id`
 *    with the whole `cells` object spread underneath (the endpoint replaces
 *    cells wholesale; see push-page-seo-cells.mjs), FOLLOWED BY a second
 *    site-document save of the same page, because the PATCH re-derives the
 *    routable slug and flattens the slash (see the note at that step). The
 *    published <title> and the robots tag come from `seo-head.js`, which
 *    gen-seo-head.mjs regenerates from seo.json and push-script-asset.mjs
 *    ships; that is a separate step.
 *
 * Templates are asserted intact after every page write, because the save shape
 * that un-templated `post` and 404'd 43 articles on 2026-08-25 is this one.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomBytes } from 'node:crypto'
import { api, getSite, getPages, saveShell, templateMap, toChangedPage, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CSS_LOCAL = join(HERE, '..', '04-design', '.tmp', 'site-src', 'css', '70-landing.css')
const CSS_ASSET = 'src/styles/landing.css'
const argOf = (f) => { const i = process.argv.indexOf(f); return i === -1 ? null : process.argv[i + 1] }
const NODES = argOf('--nodes')
const ONLY = argOf('--only')?.split(',').filter(Boolean)
const APPLY = process.argv.includes('--apply')
if (!NODES) { console.error('usage: push-ads-pages.mjs --nodes <dir> [--only a,b] [--apply]'); process.exit(2) }

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => { const b = randomBytes(21); let s = ''; for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]; return s }

// ── the pages, as the converter wrote them ────────────────────────────────
const files = readdirSync(NODES).filter((f) => f.endsWith('.json')).sort()
const pages = files.map((f) => JSON.parse(readFileSync(join(NODES, f), 'utf8')))
  .filter((p) => !ONLY || ONLY.includes(p.localSlug))
if (!pages.length) { console.error('no pages selected'); process.exit(1) }

const classNames = new Set()
for (const p of pages) for (const n of Object.values(p.nodes)) for (const c of n.classNames ?? []) classNames.add(c)

// ── the shell: class rules and the stylesheet ─────────────────────────────
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

const css = readFileSync(CSS_LOCAL, 'utf8')
let cssFile = (shell.files ?? []).find((f) => f.path === CSS_ASSET)
const cssIsNew = !cssFile
const scopeIds = pages.map((p) => p.id)

console.log(BASE)
console.log(`  pages        ${pages.length} (${pages.filter((p) => p.row).length} replace, ${pages.filter((p) => !p.row).length} create)`)
console.log(`  classes      ${classNames.size} used, ${byName.size - newRules.length} already registered, ${newRules.length} new empty class rules`)
if (newRules.length) console.log(`               ${missing.join(' ')}`)
console.log(`  stylesheet   ${CSS_ASSET} ${cssIsNew ? 'CREATE' : 'UPDATE'} (${css.length} chars); scope gains ${scopeIds.length} page ids (merged with the existing scope)`)
for (const p of pages) {
  const s = p.stats
  console.log(`  ${p.row ? 'REPLACE' : 'CREATE '} /${p.slug.padEnd(52)} nodes ${String(s.nodes).padStart(3)} img ${String(s.images).padStart(2)} vid ${s.videos} embed ${s.embeds} sec ${String(s.sections).padStart(2)}`)
}
if (!APPLY) { console.log('\nplan only — pass --apply to write the draft. Nothing publishes.'); process.exit(0) }

// ── write 1 + 2: the shell ────────────────────────────────────────────────
const templatesBefore = await templateMap()
for (const r of newRules) rules[r.id] = r
shell.styleRules = rules
if (cssIsNew) {
  cssFile = { id: nanoid(), path: CSS_ASSET, type: 'style', content: css, createdAt: now, updatedAt: now }
  shell.files = [...(shell.files ?? []), cssFile]
} else {
  cssFile.content = css
  cssFile.updatedAt = now
}
shell.runtime = shell.runtime ?? {}
shell.runtime.styles = shell.runtime.styles ?? {}
/* MERGE the scope with what is already there: a `--only` run must not narrow the
   stylesheet to the pages it happened to push (it did, once, on 2026-09-18). */
const prior = shell.runtime.styles[cssFile.id]?.scope?.pageIds ?? []
shell.runtime.styles[cssFile.id] = { enabled: true, scope: { type: 'pages', pageIds: [...new Set([...prior, ...scopeIds])] }, priority: 100 }
const shellRes = await saveShell(shell, seq)
console.log(`\nshell saved: ${JSON.stringify(shellRes)}  (+${newRules.length} class rules, ${CSS_ASSET} ${cssIsNew ? 'created' : 'updated'})`)

// ── write 3: the pages ────────────────────────────────────────────────────
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
  const baseSeqs = p.row ? { [p.row.id]: p.row.seq } : {}
  let res
  try {
    res = await api('PUT', '/admin/api/cms/site-document', {
      mode: 'incremental', site: sh, changedPages: [entry], deletedPageIds: [],
      changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
      baseSeqs, shellBaseSeq: sq,
    })
  } catch (e) {
    console.log(`FAIL    /${p.slug}: ${e.message.slice(0, 300)}`); bad++; continue
  }
  const back = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
  const want = counts(nodes), got = counts(back.cells.body.nodes)
  const ok = JSON.stringify(want) === JSON.stringify(got) && (back.cells.slug ?? back.slug) === p.slug
  if (!ok) bad++
  console.log(`${ok ? 'OK  ' : 'BAD '}    /${p.slug.padEnd(52)} seq ${res.seq}  sent ${JSON.stringify(want)}  got ${JSON.stringify(got)}`)

  // write 4: SEO cells, read-merge-write
  if (ok && p.seo?.title) {
    const before = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
    await api('PATCH', `/admin/api/cms/data/rows/${p.id}`, {
      cells: { ...before.cells, seoTitle: p.seo.title, seoDescription: p.seo.desc },
    })
    const after = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
    const intact = (after.cells.slug ?? after.slug) === p.slug && Object.keys(after.cells.body.nodes).length === want.nodes
    if (!intact) { console.log(`BAD     /${p.slug}: SEO patch changed the page`); bad++; continue }

    /* RE-ASSERT THE ROUTE. `PATCH /data/rows/:id` re-derives the page's
       routable slug from the cells through slugFromTitle, which turns the
       slash in `ads-landing-pages/<name>` into a hyphen: the row still reads
       `ads-landing-pages/<name>` but publishes at `/ads-landing-pages-<name>`.
       `PUT /site-document` sets the route from the slug as given. Proved on
       staging 2026-09-18: pages written and then patched served flattened;
       one re-saved through site-document served nested again. So the
       site-document write is always the LAST write a page gets here. */
    const rowNow = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
    const { site: sh2, seq: sq2 } = await getSite()
    await api('PUT', '/admin/api/cms/site-document', {
      mode: 'incremental', site: sh2, changedPages: [toChangedPage(rowNow)], deletedPageIds: [],
      changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
      baseSeqs: { [p.id]: rowNow.seq }, shellBaseSeq: sq2,
    })
  }
}

const templatesAfter = await templateMap()
const lost = Object.keys(templatesBefore).filter((s) => !templatesAfter[s])
if (lost.length) { console.error(`\nTEMPLATES LOST: ${lost.join(', ')} — do NOT publish`); process.exit(1) }
console.log(`\ntemplates intact: ${Object.keys(templatesAfter).sort().join(', ')}`)
if (bad) { console.error(`\n${bad} page(s) did not land whole — do NOT publish.`); process.exit(1) }
console.log('\nall pages in the draft. Nothing is published.')
