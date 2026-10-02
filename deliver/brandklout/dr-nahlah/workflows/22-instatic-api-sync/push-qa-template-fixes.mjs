#!/usr/bin/env node
/**
 * push-qa-template-fixes.mjs — the template-level items of QA's 2026-09-28 check
 * (website-qa, handoff in 01-content-intake/.tmp/website-qa-drnahlah.com-2026-09-28-export).
 *
 *   node push-qa-template-fixes.mjs              # plan only
 *   node push-qa-template-fixes.mjs --apply      # write the draft (pages, component, shell)
 *   node push-qa-template-fixes.mjs --publish    # publish, only if those edits are the draft's only difference
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-qa-template-fixes.mjs ...
 *
 * What changes, and why (QA check id in brackets):
 *
 *  1. Footer column titles h4 -> h2 [D03]. They follow the page's content, so an
 *     h4 there skipped a level on every page that ends on an h2 (and on the legal
 *     pages, which end on the h1). `footer.foot h4` gains `footer.foot h2`.
 *  2. Drawer column titles h4 -> p [D03, axe heading-order]. They are labels inside
 *     navigation that sits before the h1, not document headings. New ambient rule
 *     `.dr-col > p` carries the `.dr-col h4` declarations (+ the line-height the
 *     h1-h4 base rule used to give it).
 *  3. #drawer gets `inert` while closed [A01 aria-hidden-focus, 56 pages]. It was
 *     aria-hidden="true" with 30 focusable links inside. site.js toggles `inert`
 *     with aria-hidden (shell edit of src/scripts/site.js).
 *  4. Footer addresses become directions links, and every "Directions" button
 *     goes to maps/dir instead of maps/search [C03, 78 pages]. The search URL drops
 *     a pin; the dir URL starts navigation. Pages and the `cta-offices` component.
 *  5. /contact: "Where to go." h2 -> h1 [D03: no h1]. New rule `.pk h1` copies
 *     `.pk h2` (no page has an h1 inside a `.pk` section, so it touches only this).
 *  6. Home: "Credentials & Certifications" h4 -> h3 [D03 h2->h4 skip].
 *     `.doc-creds h4` gains `.doc-creds h3`.
 *
 * Every other node must read back deep-equal; the shell may differ only in the
 * named rules and site.js.
 */
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, toChangedPage, BASE } from './sedation-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HOST = BASE.replace(/^https?:\/\//, '')
mkdirSync('.tmp/qa-fixes', { recursive: true })
const STATE = `.tmp/qa-fixes/template-state-${HOST}.json`
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => { const b = randomBytes(n); let s = ''; for (let i = 0; i < n; i++) s += ALPHABET[b[i] & 63]; return s }
const slugOf = (r) => r.cells?.slug ?? r.slug
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')

const DIR = {
  mclean: 'https://www.google.com/maps/dir/?api=1&destination=7901+Jones+Branch+Drive+Suite+220+McLean+VA+22102',
  alexandria: 'https://www.google.com/maps/dir/?api=1&destination=2855+Duke+Street+Alexandria+VA+22314',
}
const toDir = (href) => {
  const m = /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=(.+)$/.exec(href ?? '')
  return m ? `https://www.google.com/maps/dir/?api=1&destination=${m[1]}` : null
}

console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)')
const status = await api('GET', '/admin/api/cms/publish/status')
console.log(`  status   ${JSON.stringify(status)}`)
const list = (await getPages()).rows
const { site: shell0 } = await getSite()

// ── publish ─────────────────────────────────────────────────────────────────
if (PUBLISH) {
  if (!existsSync(STATE)) { console.error('no --apply state for this host'); process.exit(1) }
  const st = JSON.parse(readFileSync(STATE, 'utf8'))
  const now = Object.fromEntries(list.map((r) => [r.id, r.seq]))
  const moved = Object.keys(st.seqs).filter((id) => now[id] !== st.seqs[id])
  const added = Object.keys(now).filter((id) => !(id in st.seqs))
  const shellOk = sha(shell0) === st.shell
  console.log(`  rows     moved since apply: ${moved.length}, new rows: ${added.length}; shell ${shellOk ? 'unchanged' : 'CHANGED'}`)
  if (moved.length || added.length || !shellOk) { console.error('REFUSING TO PUBLISH: the draft moved since --apply'); process.exit(1) }
  const r = await api('POST', '/admin/api/cms/publish', {})
  console.log('published', JSON.stringify(r).slice(0, 200))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  process.exit(0)
}

if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

// ── shell: style rules + site.js ────────────────────────────────────────────
const shell = structuredClone(shell0)
const rules = shell.styleRules
const ruleBySel = (sel) => {
  const hits = Object.values(rules).filter((r) => r.selector === sel)
  if (hits.length !== 1) { console.error(`rule "${sel}": ${hits.length} matches`); process.exit(1) }
  return hits[0]
}
const shellChanges = []
const widen = (sel, add) => {
  if (Object.values(rules).some((r) => r.selector === `${sel}, ${add}`)) return
  const r = ruleBySel(sel)
  r.selector = `${sel}, ${add}`
  if (r.kind === 'ambient') r.name = r.selector
  shellChanges.push(`rule "${sel}" -> "${r.selector}"`)
}
const addRule = (selector, after, styles) => {
  if (Object.values(rules).some((r) => r.selector === selector)) return
  const now = Date.now(), id = nanoid(16)
  rules[id] = { id, name: selector, kind: 'ambient', selector, order: ruleBySel(after).order + 0.5, styles, contextStyles: {}, createdAt: now, updatedAt: now }
  shellChanges.push(`rule + "${selector}"`)
}
widen('footer.foot h4', 'footer.foot h2')
widen('.doc-creds h4', '.doc-creds h3')
widen('.ct-office h3', '.ct-office h2')
const drRule = Object.values(rules).find((r) => r.selector === '.dr-col h4')
addRule('.dr-col > p', '.dr-col h4', { ...drRule.styles, lineHeight: '1.02' })
addRule('.pk h1', '.pk h2', { ...ruleBySel('.pk h2').styles })

const js = shell.files.find((f) => f.path === 'src/scripts/site.js')
const JS_EDITS = [
  ["burger.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true');",
   "burger.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true'); drawer.inert = true;"],
  ["drawer.setAttribute('aria-hidden',String(!open));",
   "drawer.setAttribute('aria-hidden',String(!open)); drawer.inert = !open;"],
]
for (const [a, b] of JS_EDITS) {
  if (js.content.includes(b)) continue
  if (js.content.split(a).length !== 2) { console.error(`site.js: expected exactly one "${a.slice(0, 50)}…"`); process.exit(1) }
  js.content = js.content.replace(a, b)
}
if (js.content !== shell0.files.find((f) => f.path === 'src/scripts/site.js').content) shellChanges.push('site.js: drawer.inert toggled with aria-hidden (2 lines)')

// ── pages ───────────────────────────────────────────────────────────────────
// Only the site footer (`footer.foot`). The ads pages' footer is a different
// element with its own rules and is left alone.
const footIds = Object.values(rules).filter((r) => r.kind === 'class' && r.name === 'foot' && r.selector === 'footer.foot').map((r) => r.id)
if (footIds.length !== 1) { console.error(`.foot class rules: ${footIds.length}`); process.exit(1) }
const FOOT_CLASS = footIds[0]
const plans = []
const tally = {}
if (!shellChanges.length) console.log('  shell    nothing left to change')
const count = (k) => { tally[k] = (tally[k] ?? 0) + 1 }
for (const r0 of list) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
  const slug = slugOf(row)
  const nodes = structuredClone(row.cells.body.nodes)
  const touched = new Set(), added = []
  const within = (n, pred) => { for (let p = nodes[n.parentId]; p; p = nodes[p.parentId]) if (pred(p)) return true; return false }
  const isFooter = (n) => (n.props?.customTag === 'footer' || n.props?.tag === 'footer') && (n.classIds ?? []).includes(FOOT_CLASS)
  const isDrawer = (n) => n.props?.htmlAttributes?.id === 'drawer'

  for (const n of Object.values(nodes)) {
    if (n.moduleId === 'base.text' && n.props?.tag === 'h4' && within(n, isFooter)) { n.props.tag = 'h2'; touched.add(n.id); count('footer h4->h2') }
    if (n.moduleId === 'base.text' && n.props?.tag === 'h4' && within(n, isDrawer)) { n.props.tag = 'p'; touched.add(n.id); count('drawer h4->p') }
    if (isDrawer(n) && n.props.htmlAttributes.inert === undefined) { n.props.htmlAttributes.inert = ''; touched.add(n.id); count('drawer inert') }
    if (n.moduleId === 'base.link' && toDir(n.props?.href)) { n.props.href = toDir(n.props.href); touched.add(n.id); count('directions href') }
    if (slug === 'contact' && n.moduleId === 'base.text' && n.props?.tag === 'h2' && n.props.text === 'Where to go.') { n.props.tag = 'h1'; touched.add(n.id); count('contact h1') }
    // ...and its two office cards, which sat at h3 under the old h2, move up with it
    if (slug === 'contact' && n.moduleId === 'base.text' && n.props?.tag === 'h3' && within(n, (p) => p.props?.tag === 'article')) { n.props.tag = 'h2'; touched.add(n.id); count('contact office h2') }
    if (slug === 'index' && n.moduleId === 'base.text' && n.props?.tag === 'h4' && n.props.text === 'Credentials & Certifications') { n.props.tag = 'h3'; touched.add(n.id); count('home creds h3') }
  }
  // footer addresses: <li><b>McLean</b><div>street</div><div>city</div><a tel/></li>
  for (const li of Object.values(nodes)) {
    if (li.props?.customTag !== 'li' || !within(li, isFooter)) continue
    const kids = li.children.map((c) => nodes[c])
    const label = kids[0]?.props?.customTag === 'b' ? nodes[kids[0].children?.[0]]?.props?.text ?? '' : ''
    const office = /mclean/i.test(label) ? 'mclean' : /alexandria/i.test(label) ? 'alexandria' : null
    if (!office) continue
    if (kids.some((k) => k.props?.customTag === 'a' && /maps\/dir/.test(k.props?.htmlAttributes?.href ?? ''))) continue
    const divs = kids.filter((k) => k.moduleId === 'base.container' && k.props?.tag === 'div')
    if (divs.length !== 2 || kids.indexOf(divs[0]) !== 1 || kids.indexOf(divs[1]) !== 2) { console.error(`/${slug}: unexpected footer address shape for ${office}`); process.exit(1) }
    const a = {
      id: nanoid(), moduleId: 'base.container',
      props: { tag: 'custom', customTag: 'a', htmlAttributes: { href: DIR[office], target: '_blank', rel: 'noopener noreferrer', 'aria-label': `Directions to the ${office === 'mclean' ? 'McLean' : 'Alexandria'} office` } },
      breakpointOverrides: {}, children: divs.map((d) => d.id), classIds: [], parentId: li.id,
    }
    nodes[a.id] = a
    for (const d of divs) { d.parentId = a.id; touched.add(d.id) }
    li.children.splice(1, 2, a.id)
    touched.add(li.id); added.push(a.id); count('footer address link')
  }
  if (touched.size) plans.push({ row, slug, nodes, touched, added })
}
console.log(`  pages    ${list.length}: ${plans.length} to edit`)
console.log(`  edits    ${JSON.stringify(tally)}`)

// ── the cta-offices component (home page office panels) ─────────────────────
const comps = (await api('GET', '/admin/api/cms/components')).rows ?? []
const compPlans = []
for (const c of comps) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${c.id}`)).row
  const nodes = structuredClone(row.cells.body.nodes)
  let n = 0
  for (const x of Object.values(nodes)) if (x.moduleId === 'base.link' && toDir(x.props?.href)) { x.props.href = toDir(x.props.href); n++ }
  if (n) { compPlans.push({ row, nodes, n }); console.log(`  comp     ${row.cells.name}: ${n} directions links`) }
}
console.log(`  shell    ${shellChanges.join('\n           ')}`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

// ── write: shell with the first chunk, then pages, then components ──────────
for (let k = 0; k < plans.length; k += 10) {
  const chunk = plans.slice(k, k + 10)
  const { site: sh, seq } = await getSite()
  await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: k === 0 ? shell : sh,
    changedPages: chunk.map((p) => toChangedPage(p.row, { nodes: p.nodes })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(chunk.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
  })
  console.log(`  wrote    ${chunk.map((p) => p.slug).join(', ')}`)
}
for (const c of compPlans) {
  await api('PATCH', `/admin/api/cms/data/rows/${c.row.id}`, { cells: { ...c.row.cells, body: { ...c.row.cells.body, nodes: c.nodes } } })
  console.log(`  wrote    component ${c.row.cells.name}`)
}

// ── read back ───────────────────────────────────────────────────────────────
const problems = []
for (const p of plans) {
  const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => p.row.cells[k] !== undefined).map((k) => [k, p.row.cells[k]]))
  let back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  if (Object.keys(keep).length && Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
    await api('PATCH', `/admin/api/cms/data/rows/${p.row.id}`, { cells: { ...back.cells, ...keep } })
    back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
    console.log(`  seo      /${p.slug}: ${Object.keys(keep).join(' + ')} re-applied`)
  }
  for (const k of new Set([...Object.keys(p.row.cells), ...Object.keys(back.cells)])) {
    if (k !== 'body' && !isDeepStrictEqual(p.row.cells[k], back.cells[k])) problems.push(`/${p.slug}: cell ${k} changed`)
  }
  if (slugOf(back) !== p.slug) problems.push(`/${p.slug}: slug now ${slugOf(back)}`)
  const an = back.cells.body.nodes, bn = p.row.cells.body.nodes
  if (Object.keys(an).length !== Object.keys(bn).length + p.added.length) problems.push(`/${p.slug}: node count ${Object.keys(bn).length} -> ${Object.keys(an).length}`)
  for (const [id, n] of Object.entries(bn)) {
    if (p.touched.has(id)) { if (!isDeepStrictEqual(an[id], p.nodes[id])) problems.push(`/${p.slug}: ${id} differs from plan`) }
    else if (!isDeepStrictEqual(an[id], n)) problems.push(`/${p.slug}: untouched node ${id} changed`)
  }
  for (const id of p.added) if (!isDeepStrictEqual(an[id], p.nodes[id])) problems.push(`/${p.slug}: new node ${id} missing`)
}
for (const c of compPlans) {
  const back = (await api('GET', `/admin/api/cms/data/rows/${c.row.id}`)).row
  if (!isDeepStrictEqual(back.cells.body.nodes, c.nodes)) problems.push(`component ${c.row.cells.name}: nodes differ from plan`)
  for (const k of Object.keys(c.row.cells)) if (k !== 'body' && !isDeepStrictEqual(back.cells[k], c.row.cells[k])) problems.push(`component ${c.row.cells.name}: cell ${k} changed`)
}
const { site: shell1 } = await getSite()
const strip = (s) => ({ ...s, updatedAt: 0 })
if (!isDeepStrictEqual(strip(shell1).styleRules, shell.styleRules)) problems.push('shell: style rules differ from plan')
if (shell1.files.find((f) => f.path === 'src/scripts/site.js').content !== js.content) problems.push('shell: site.js differs from plan')
if (problems.length) { console.error(`READ-BACK PROBLEMS (${problems.length}):\n  ${problems.slice(0, 40).join('\n  ')}`); process.exit(1) }
console.log(`  readback ${plans.length} pages + ${compPlans.length} component(s) + shell: only the planned changes`)

const seqs = Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq]))
writeFileSync(STATE, JSON.stringify({ seqs, shell: sha(shell1), at: new Date().toISOString() }, null, 1))
console.log(`  status   ${JSON.stringify(await api('GET', '/admin/api/cms/publish/status'))}`)
console.log('draft only — re-run with --publish')
