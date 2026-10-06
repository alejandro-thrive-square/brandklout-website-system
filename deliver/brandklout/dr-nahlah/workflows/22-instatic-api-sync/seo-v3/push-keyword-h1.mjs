#!/usr/bin/env node
/**
 * Keyword H1s on the 11 treatment pages (user, 2026-10-06: "Keyword H1, headline kept").
 *
 *   before  <h1 data-split>A tooth that is <em>attached to you</em> again.</h1>
 *   after   <h1 class="label" data-rv>Dental Implants in McLean & Alexandria, VA</h1>
 *           <p data-split>A tooth that is <em>attached to you</em> again.</p>
 *
 * The H1 text is the page's SEO title without the brand (seo-v2/meta.json), styled with the site's
 * own eyebrow class (`label`; `text-style-tagline` on staging). The headline keeps its look through
 * three registry rules, no inline font sizes (the Sienna widget pins those):
 *   <hero> p[data-split]      = what `h1, h2, h3, h4` + `<hero> h1` gave it
 *   <hero> p[data-split] em   = what `<hero> h1 em` gave it
 *   <hero> h1.<label>         = keeps the new H1 at label size (`<hero> h1` would make it 74px)
 * Proof that nothing visible moved except the new line: seo-v3/hero-look.mjs (snapshot → compare).
 *
 *   node seo-v3/push-keyword-h1.mjs              # plan
 *   node seo-v3/push-keyword-h1.mjs --apply      # write the draft (shell rules + 11 pages)
 *   node seo-v3/push-keyword-h1.mjs --publish    # publish, only if these edits are the draft's only change
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node seo-v3/push-keyword-h1.mjs ...
 */
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, toChangedPage, BASE } from '../sedation-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const SLUGS = ['dental-implants', 'all-on-4', 'implant-supported-dentures', 'crowns-and-bridges', 'veneers', 'teeth-whitening', 'smile-makeover', 'cosmetic-dentistry', 'oral-surgery', 'sedation-dentistry', 'emergency-dentistry']
const META = JSON.parse(readFileSync(new URL('../seo-v2/meta.json', import.meta.url), 'utf8'))
// a no-break space keeps "Alexandria, VA" together: at 390px "VA" otherwise wraps alone
const NBSP = String.fromCharCode(160)
const keyword = (slug) => META[slug][0].replace(/\s*\|\s*Dr\. Nahlah$/, '').replace(/, VA$/, ',' + NBSP + 'VA')
const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = `.tmp/keyword-h1-state-${HOST}.json`
mkdirSync('.tmp', { recursive: true })
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => { const b = randomBytes(21); let s = ''; for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]; return s }
const slugOf = (r) => r.cells?.slug ?? r.slug
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')

console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)')
const status = await api('GET', '/admin/api/cms/publish/status')
console.log(`  status   ${JSON.stringify(status)}`)
const list = (await getPages()).rows
const { site: shell0 } = await getSite()

if (PUBLISH) {
  if (!existsSync(STATE)) { console.error('no --apply state for this host'); process.exit(1) }
  const st = JSON.parse(readFileSync(STATE, 'utf8'))
  const now = Object.fromEntries(list.map((r) => [r.id, r.seq]))
  const moved = Object.keys(st.seqs).filter((id) => now[id] !== st.seqs[id])
  const added = Object.keys(now).filter((id) => !(id in st.seqs))
  const shellOk = sha(shell0) === st.shell
  console.log(`  rows     moved since apply: ${moved.length}, new rows: ${added.length}; shell ${shellOk ? 'unchanged' : 'CHANGED'}`)
  if (moved.length || added.length || !shellOk || status.draftPages !== status.publishedPages) { console.error('REFUSING TO PUBLISH: the draft holds something other than these edits'); process.exit(1) }
  const r = await api('POST', '/admin/api/cms/publish', {})
  console.log('published', JSON.stringify(r).slice(0, 200))
  process.exit(0)
}
/* --adopt: the write landed but its read-back failed on something harmless (2026-10-06 staging: the
   server dropped an empty inlineStyles key). Prove the draft holds ONLY these edits — every other row
   last saved when it was published, each target page in the planned shape, the rules present — and
   record the state so --publish can run. */
if (process.argv.includes('--adopt')) {
  const sec = (t) => Math.floor(new Date(t).getTime() / 1000)
  const strays = list.filter((r) => !SLUGS.includes(slugOf(r)) && r.updatedAt && r.publishedAt && sec(r.updatedAt) > sec(r.publishedAt) + 1).map(slugOf)
  const sel = (n) => Object.values(shell0.styleRules ?? {}).some((r) => r.selector === n)
  const heroName = ['pg-hero', 'section_page-hero'].find((n) => Object.values(shell0.styleRules).some((r) => r.kind === 'class' && r.name === n))
  const bad = []
  for (const s of [`.${heroName} p[data-split]`, `.${heroName} p[data-split] em`]) if (!sel(s)) bad.push(`rule ${s} missing`)
  for (const slug of SLUGS) {
    const r0 = list.find((r) => slugOf(r) === slug)
    const nodes = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row.cells.body.nodes
    const h1s = Object.values(nodes).filter((n) => n.props?.tag === 'h1' || n.props?.customTag === 'h1')
    const head = Object.values(nodes).filter((n) => n.props?.customTag === 'p' && n.props?.htmlAttributes && 'data-split' in n.props.htmlAttributes)
    if (h1s.length !== 1 || h1s[0].props.text !== keyword(slug) || head.length !== 1 || nodes[h1s[0].parentId].children.indexOf(h1s[0].id) !== nodes[h1s[0].parentId].children.indexOf(head[0].id) - 1) bad.push(`/${slug}: not in the planned shape`)
  }
  console.log(`  adopt    other rows changed since their publish: ${strays.length ? strays.join(', ') : 'none'}; ${bad.length ? bad.join('; ') : 'all 11 pages + rules as planned'}`)
  if (strays.length || bad.length) process.exit(1)
  const seqs = Object.fromEntries(list.map((r) => [r.id, r.seq]))
  writeFileSync(STATE, JSON.stringify({ seqs, shell: sha(shell0), at: new Date().toISOString(), adopted: true }, null, 1))
  console.log('  state recorded — --publish may run')
  process.exit(0)
}
if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

// ── names on this host (production: old names; staging: Client-First) ───────
const rules = Object.entries(shell0.styleRules ?? {})
const cls = (names) => { for (const n of names) { const ids = rules.filter(([, r]) => r.kind === 'class' && r.name === n).map(([id]) => id); if (ids.length === 1) return { id: ids[0], name: n } } console.error(`no single class for ${names.join(' / ')}`); process.exit(1) }
const HERO = cls(['pg-hero', 'section_page-hero'])
const LABEL = cls(['label', 'text-style-tagline'])
const H = `.${HERO.name}`
const base = rules.find(([, r]) => r.selector === 'h1, h2, h3, h4')?.[1]
const heroH1 = rules.find(([, r]) => r.selector === `${H} h1`)?.[1]
const heroEm = rules.find(([, r]) => r.selector === `${H} h1 em`)?.[1]
if (!base || !heroH1 || !heroEm) { console.error('the hero h1 rules are not where they were'); process.exit(1) }
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] !== undefined).map((k) => [k, o[k]]))
const NEW_RULES = [
  [`${H} p[data-split]`, { ...pick(base.styles, ['fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing', 'color']), ...heroH1.styles }, heroH1.order + 0.1],
  [`${H} p[data-split] em`, { ...heroEm.styles }, heroEm.order + 0.1],
  [`${H} h1.${LABEL.name}`, { fontSize: 'var(--label)', maxWidth: 'none', lineHeight: '1.5', marginBottom: '1rem' }, heroEm.order + 0.2],
]
const shellNext = structuredClone(shell0)
let rulesAdded = 0
for (const [selector, styles, order] of NEW_RULES) {
  const cur = Object.values(shellNext.styleRules).find((r) => r.selector === selector)
  if (cur) { if (!isDeepStrictEqual(cur.styles, styles)) { console.error(`rule ${selector} exists with other styles`); process.exit(1) } continue }
  const id = nanoid(); const t = Date.now()
  shellNext.styleRules[id] = { id, name: selector, kind: 'ambient', selector, order, styles, contextStyles: {}, createdAt: t, updatedAt: t }
  rulesAdded++
}
console.log(`  classes  hero = ${H}, label = .${LABEL.name}; rules to add ${rulesAdded}`)
for (const [s, st] of NEW_RULES) console.log(`           ${s} ${JSON.stringify(st)}`)

// ── plan the pages ──────────────────────────────────────────────────────────
const plans = []
for (const slug of SLUGS) {
  const r0 = list.find((r) => slugOf(r) === slug)
  if (!r0) { console.error(`/${slug}: no row`); process.exit(1) }
  const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
  const nodes = structuredClone(row.cells.body.nodes)
  const hero = Object.values(nodes).filter((n) => (n.classIds ?? []).includes(HERO.id))
  if (hero.length !== 1) { console.error(`/${slug}: ${hero.length} heroes`); process.exit(1) }
  const inHero = (n) => { for (let p = n; p; p = nodes[p.parentId]) if (p.id === hero[0].id) return true; return false }
  const heads = Object.values(nodes).filter((n) => n.props?.htmlAttributes && 'data-split' in n.props.htmlAttributes && inHero(n))
  if (heads.length !== 1) { console.error(`/${slug}: ${heads.length} hero headlines`); process.exit(1) }
  const head = heads[0]
  const done = Object.values(nodes).find((n) => n.props?.tag === 'h1' && inHero(n))
  if (head.props.customTag === 'p' && done) {
    if (done.props.text === keyword(slug)) { console.log(`  /${slug}: already done`); continue }
    nodes[done.id] = { ...done, props: { ...done.props, text: keyword(slug) } }   // the H1 is there; only its text moves
    plans.push({ row, slug, nodes, added: [], changed: [done.id], kw: keyword(slug) })
    console.log(`  /${slug.padEnd(28)} h1 text -> "${keyword(slug)}"`)
    continue
  }
  if (head.moduleId !== 'base.container' || head.props.customTag !== 'h1') { console.error(`/${slug}: headline is ${head.moduleId} ${head.props.customTag}`); process.exit(1) }
  const crumbSpan = Object.values(nodes).find((n) => n.moduleId === 'base.text' && n.props?.tag === 'span' && inHero(n))
  if (!crumbSpan) { console.error(`/${slug}: no text node to clone`); process.exit(1) }
  // no inlineStyles key: the server drops an empty one, and the read-back must match
  const { inlineStyles: _, ...src } = structuredClone(crumbSpan)
  const h1 = { ...src, id: nanoid(), parentId: head.parentId, children: [], classIds: [LABEL.id], breakpointOverrides: {},
    props: { ...structuredClone(crumbSpan.props), tag: 'h1', text: keyword(slug), htmlAttributes: { 'data-rv': '' } } }
  nodes[h1.id] = h1
  nodes[head.id] = { ...head, props: { ...head.props, customTag: 'p' } }
  const parent = nodes[head.parentId]
  parent.children = parent.children.flatMap((c) => (c === head.id ? [h1.id, head.id] : [c]))
  plans.push({ row, slug, nodes, added: [h1.id], changed: [head.id, parent.id], kw: keyword(slug) })
  console.log(`  /${slug.padEnd(28)} h1 "${keyword(slug)}"`)
}
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }
if (!plans.length && !rulesAdded) { console.log('nothing to write'); process.exit(0) }

// ── write: the shell (new rules) with the first chunk, then the rest ───────
const shellHashPlanned = sha(shellNext)
for (let k = 0; k < Math.max(plans.length, 1); k += 10) {
  const chunk = plans.slice(k, k + 10)
  const { site: sh, seq } = await getSite()
  const site = k === 0 ? { ...sh, styleRules: shellNext.styleRules } : sh
  await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site,
    changedPages: chunk.map((p) => toChangedPage(p.row, { nodes: p.nodes })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(chunk.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
  })
  console.log(`  wrote    ${k === 0 ? 'shell rules + ' : ''}${chunk.map((p) => p.slug).join(', ')}`)
}

// ── SEO cells a page write drops, then read everything back ─────────────────
const problems = []
for (const p of plans) {
  const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => p.row.cells[k] !== undefined).map((k) => [k, p.row.cells[k]]))
  let back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  if (Object.keys(keep).length && Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
    await api('PATCH', `/admin/api/cms/data/rows/${p.row.id}`, { cells: { ...back.cells, ...keep } })
    back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
    console.log(`  seo      /${p.slug}: ${Object.keys(keep).join(' + ')} re-applied`)
  }
  for (const k of new Set([...Object.keys(p.row.cells), ...Object.keys(back.cells)])) if (k !== 'body' && !isDeepStrictEqual(p.row.cells[k], back.cells[k])) problems.push(`/${p.slug}: cell ${k} changed`)
  if (slugOf(back) !== p.slug) problems.push(`/${p.slug}: slug now ${slugOf(back)}`)
  const bn = p.row.cells.body.nodes, an = back.cells.body.nodes
  if (Object.keys(an).length !== Object.keys(bn).length + p.added.length) problems.push(`/${p.slug}: node count ${Object.keys(bn).length} -> ${Object.keys(an).length}`)
  for (const [id, n] of Object.entries(bn)) {
    if (p.changed.includes(id)) { if (!isDeepStrictEqual(an[id], p.nodes[id])) problems.push(`/${p.slug}: node ${id} differs from plan`); continue }
    if (!isDeepStrictEqual(an[id], n)) problems.push(`/${p.slug}: untouched node ${id} changed`)
  }
  for (const id of p.added) if (!isDeepStrictEqual(an[id], p.nodes[id])) problems.push(`/${p.slug}: new node ${id} not as written`)
}
const { site: shell1 } = await getSite()
for (const [selector, styles] of NEW_RULES) {
  const r = Object.values(shell1.styleRules).find((x) => x.selector === selector)
  if (!r || !isDeepStrictEqual(r.styles, styles)) problems.push(`rule ${selector} did not read back`)
}
const others = (s) => Object.fromEntries(Object.entries(s).filter(([k]) => k !== 'styleRules'))
if (sha(others(shell1)) !== sha(others(shell0))) problems.push('shell: something besides styleRules changed')
if (Object.keys(shell1.styleRules).length !== Object.keys(shell0.styleRules).length + rulesAdded) problems.push('shell: rule count unexpected')
if (problems.length) { console.error(`READ-BACK PROBLEMS (${problems.length}):\n  ${problems.slice(0, 30).join('\n  ')}`); process.exit(1) }
console.log(`  readback ${plans.length} pages + ${rulesAdded} rules: only the planned nodes and rules differ`)
const seqs = Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq]))
writeFileSync(STATE, JSON.stringify({ seqs, shell: sha(shell1), at: new Date().toISOString() }, null, 1))
console.log(`  status   ${JSON.stringify(await api('GET', '/admin/api/cms/publish/status'))}`)
console.log('draft only — check, then re-run with --publish')
