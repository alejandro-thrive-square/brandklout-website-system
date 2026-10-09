#!/usr/bin/env node
/**
 * push-keyword-h1.mjs — the keyword H1 above the designed headline (SEO & AEO standard rule 2).
 *
 *   before  <h1 data-split>A tooth that is <em>attached to you</em> again.</h1>
 *   after   <h1 class="text-style-tagline">Dental Implants in McLean & Alexandria, VA</h1>
 *           <p data-split>A tooth that is <em>attached to you</em> again.</p>
 *
 * WHICH PAGES: every `target` row of the keyword map (tools/seo-aeo format) whose served page on
 * INSTATIC_BASE_URL does not have exactly one H1 containing its primary keyword — the same test as
 * keyword-gate.mjs. The H1 TEXT is the row's `h1` column (as it should read; it must contain the
 * primary keyword). A row without one is listed, not guessed: a search phrase is not a heading.
 * Articles (collection entries) and nested slugs are listed, not written.
 *
 * HOW: the hero is the one node carrying a class of keywordH1.heroClass; its designed headline the
 * node with the keywordH1.headlineAttr attribute. A new text node (cloned from a text node in the
 * hero) becomes the H1 in the site's tagline class (keywordH1.taglineClass), placed right above the
 * headline, and the headline's tag becomes <p>. Registry rules, no inline font sizes (the Sienna
 * widget pins those), keep everything else where it was:
 *   <hero> p[attr]       = baseHeadingSelector's copyFromBase properties + what `<hero> h1` gave it
 *   <hero> p[attr] em    = what `<hero> h1 em` gave it (when the site has that rule)
 *   <hero> h1.<tagline>  = keywordH1.taglineStyles (else `<hero> h1` would blow the tagline up)
 * A page already in that shape only gets its H1 text changed. A page whose hero is built another way
 * is listed as such, for a hand edit. Proof that nothing else moved: hero-look.mjs snapshot → compare.
 *
 *   node push-keyword-h1.mjs [--map keyword-map.csv] [--only /a,/b]   # PLAN (default): writes nothing
 *   node push-keyword-h1.mjs --apply                # write the draft: shell rules + pages, read all back
 *   node push-keyword-h1.mjs --publish              # publish, only if these edits are the draft's only change
 *   node push-keyword-h1.mjs --adopt --only /a,/b   # a write landed but its read-back tripped on something
 *                                                   #   harmless: prove the draft holds only these edits
 *   INSTATIC_BASE_URL=https://staging.<domain> STAGING_HOST=staging.<domain> node push-keyword-h1.mjs --apply
 *
 * Safety (all from the original): --apply refuses when the draft already differs from live, or
 * when any page in scope cannot be planned (narrow with --only); a write carries baseSeqs and the
 * shell seq and refuses if the shell moved since the plan; every untouched node, every cell and the
 * slug are read back; --publish refuses unless no row moved and no shell change happened since
 * --apply and the draft holds nothing else. --apply/--publish need STAGING_HOST or --allow-production.
 * --apply backs up the rows it writes and the registry to <out>/backups/ first (new here; the
 * original relied on the read-back). State: <out>/keyword-h1-state-<host>.json.
 *
 * Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v3/push-keyword-h1.mjs
 * (its 11 slugs, the SEO-title text and the class names moved to the keyword map and seo-config.json).
 */
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { isDeepStrictEqual } from 'node:util'
import { join, resolve } from 'node:path'
import { api, getSite, getPages, toChangedPage, publish, BASE } from '../lib/site.mjs'
import { assertStaging } from '../lib/staging-guard.mjs'
import { loadConfig, configPath, outDir, arg, flag, pagePaths } from './lib/seo-config.mjs'
import { get, parsePage, keywordIn, readCsv } from '../../seo-aeo/lib.mjs'

const C = loadConfig()
const K = C.keywordH1
const OUT = outDir()
const APPLY = flag('--apply'), PUBLISH = flag('--publish'), ADOPT = flag('--adopt')
const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = join(OUT, `keyword-h1-state-${HOST}.json`)
const NBSP = String.fromCharCode(160)
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => { const b = randomBytes(21); let s = ''; for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]; return s }
const slugOf = (r) => r.cells?.slug ?? r.slug
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const pathToSlug = (p) => (p === '/' ? 'index' : p.replace(/^\/+|\/+$/g, ''))
// "Alexandria, VA" kept together: at 390px "VA" otherwise wraps alone (keywordH1.nbsp)
const display = (t) => K.nbsp.reduce((s, suf) => (s.endsWith(suf) ? s.slice(0, -suf.length) + suf.replace(/ /g, NBSP) : s), t)

if (APPLY || PUBLISH) assertStaging()
const mapFile = resolve(process.cwd(), arg('--map', configPath(C, C.files.keywordMap)))
if (!existsSync(mapFile)) { console.error(`no keyword map at ${mapFile} (--map, or files.keywordMap in the config)`); process.exit(2) }
const rows = readCsv(readFileSync(mapFile, 'utf8'))
if (!rows.length || !('path' in rows[0]) || !('primary_keyword' in rows[0]) || !('status' in rows[0])) { console.error(`${mapFile}: needs the columns path, primary_keyword, status (+ h1)`); process.exit(2) }
const only = arg('--only') ? new Set(pagePaths(arg('--only')).map(pathToSlug)) : null
const scope = rows.filter((r) => r.status.toLowerCase() === 'target' && r.primary_keyword && (!only || only.has(pathToSlug(r.path))))
if (only && scope.length !== only.size) console.log(`note     --only names ${only.size} page(s), ${scope.length} are target rows of the map`)

console.log(`${HOST} ${APPLY ? '(apply)' : PUBLISH ? '(publish)' : ADOPT ? '(adopt)' : '(plan)'} — map ${mapFile}, ${scope.length} target row(s)`)
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
  const r = await publish()
  console.log('published', JSON.stringify(r).slice(0, 200))
  process.exit(0)
}

// ── names on this host ──────────────────────────────────────────────────────
const rules = Object.entries(shell0.styleRules ?? {})
const cls = (names) => { for (const n of names) { const ids = rules.filter(([, r]) => r.kind === 'class' && r.name === n).map(([id]) => id); if (ids.length === 1) return { id: ids[0], name: n } } return null }
const HERO = cls(K.heroClass)
const LABEL = cls(K.taglineClass)
if (!HERO || !LABEL) { console.error(`REFUSING: no single class rule for ${!HERO ? `the hero (${K.heroClass.join(' / ')})` : `the tagline (${K.taglineClass.join(' / ')})`} on ${HOST} — check keywordH1 in the config`); process.exit(1) }
const H = `.${HERO.name}`
const A = K.headlineAttr
const isHead = (n) => n.props?.htmlAttributes && A in n.props.htmlAttributes

if (ADOPT) {
  if (!only) { console.error('--adopt needs --only with the pages the failed --apply wrote'); process.exit(2) }
  const sec = (t) => Math.floor(new Date(t).getTime() / 1000)
  const strays = list.filter((r) => !only.has(slugOf(r)) && r.updatedAt && r.publishedAt && sec(r.updatedAt) > sec(r.publishedAt) + 1).map(slugOf)
  const sel = (s) => Object.values(shell0.styleRules ?? {}).some((r) => r.selector === s)
  const bad = []
  if (!sel(`${H} p[${A}]`)) bad.push(`rule ${H} p[${A}] missing`)
  for (const r of scope) {
    const slug = pathToSlug(r.path)
    const r0 = list.find((x) => slugOf(x) === slug)
    if (!r0) { bad.push(`/${slug}: no row`); continue }
    const nodes = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row.cells.body.nodes
    const h1s = Object.values(nodes).filter((n) => n.props?.tag === 'h1' || n.props?.customTag === 'h1')
    const head = Object.values(nodes).filter((n) => n.props?.customTag === 'p' && isHead(n))
    if (h1s.length !== 1 || h1s[0].props.text !== display(r.h1 || '') || head.length !== 1 || nodes[h1s[0].parentId].children.indexOf(h1s[0].id) !== nodes[h1s[0].parentId].children.indexOf(head[0].id) - 1) bad.push(`/${slug}: not in the planned shape`)
  }
  console.log(`  adopt    other rows changed since their publish: ${strays.length ? strays.join(', ') : 'none'}; ${bad.length ? bad.join('; ') : `all ${scope.length} pages + rules as planned`}`)
  if (strays.length || bad.length) process.exit(1)
  mkdirSync(OUT, { recursive: true })
  writeFileSync(STATE, JSON.stringify({ seqs: Object.fromEntries(list.map((r) => [r.id, r.seq])), shell: sha(shell0), at: new Date().toISOString(), adopted: true }, null, 1))
  console.log('  state recorded — --publish may run')
  process.exit(0)
}

// ── which pages need a keyword H1 (served page = keyword-gate's h1 rule) ─────
const plans = [], listed = []
for (const r of scope) {
  const slug = pathToSlug(r.path)
  const label = `/${slug === 'index' ? '' : slug}`.padEnd(30)
  const { status: st, text } = await get(BASE + (r.path === '/' ? '/' : r.path))
  if (st !== 200) { listed.push(`${label} answered ${st}`); continue }
  const h1s = parsePage(text).h1s
  if (h1s.length === 1 && keywordIn(r.primary_keyword, h1s[0]).ok) { console.log(`  ${label} ok      "${h1s[0]}"`); continue }
  const why = h1s.length !== 1 ? `${h1s.length} H1s` : `"${h1s[0]}" lacks ${keywordIn(r.primary_keyword, h1s[0]).missing.join(', ')}`
  if (!r.h1) { listed.push(`${label} NEEDS H1 TEXT in the map's h1 column (${why}; keyword "${r.primary_keyword}")`); continue }
  const kwOk = keywordIn(r.primary_keyword, r.h1)
  if (!kwOk.ok) { listed.push(`${label} the h1 column "${r.h1}" lacks ${kwOk.missing.join(', ')} of "${r.primary_keyword}"`); continue }
  if (C.articles && slug.startsWith(C.articles.prefix)) { listed.push(`${label} an article: its H1 comes from the collection template`); continue }
  if (slug.includes('/')) { listed.push(`${label} nested slug: a page write drops its SEO cells (insta-api refuses) — by hand`); continue }
  const r0 = list.find((x) => slugOf(x) === slug)
  if (!r0) { listed.push(`${label} no page row "${slug}" on ${HOST}`); continue }
  const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
  const nodes = structuredClone(row.cells.body.nodes)
  const hero = Object.values(nodes).filter((n) => (n.classIds ?? []).includes(HERO.id))
  if (hero.length !== 1) { listed.push(`${label} ${hero.length} nodes with ${H}: hero built another way — by hand (${why})`); continue }
  const inHero = (n) => { for (let p = n; p; p = nodes[p.parentId]) if (p.id === hero[0].id) return true; return false }
  const heads = Object.values(nodes).filter((n) => isHead(n) && inHero(n))
  if (heads.length !== 1) { listed.push(`${label} ${heads.length} headline(s) with [${A}] in the hero — by hand (${why})`); continue }
  const head = heads[0]
  const kw = display(r.h1)
  const done = Object.values(nodes).find((n) => n.props?.tag === 'h1' && inHero(n))
  if (head.props.customTag === 'p' && done) {
    if (done.props.text === kw) { console.log(`  ${label} done in the draft (not live yet)`); continue }
    nodes[done.id] = { ...done, props: { ...done.props, text: kw } }
    plans.push({ row, slug, nodes, added: [], changed: [done.id], kw })
    console.log(`  ${label} h1 text "${done.props.text}" -> "${kw}"`)
    continue
  }
  if (head.moduleId !== 'base.container' || head.props.customTag !== 'h1') { listed.push(`${label} headline is ${head.moduleId} <${head.props.customTag || head.props.tag}>, not the designed <h1> — by hand`); continue }
  const texts = Object.values(nodes).filter((n) => n.moduleId === 'base.text' && inHero(n))
  const src0 = texts.find((n) => n.props?.tag === 'span') || texts[0]
  if (!src0) { listed.push(`${label} no text node in the hero to clone — by hand`); continue }
  // no inlineStyles key: the server drops an empty one, and the read-back must match
  const { inlineStyles: _, ...src } = structuredClone(src0)
  const h1 = { ...src, id: nanoid(), parentId: head.parentId, children: [], classIds: [LABEL.id], breakpointOverrides: {},
    props: { ...structuredClone(src0.props), tag: 'h1', text: kw, htmlAttributes: { ...(K.h1Attributes || {}) } } }
  nodes[h1.id] = h1
  nodes[head.id] = { ...head, props: { ...head.props, customTag: 'p' } }
  const parent = nodes[head.parentId]
  parent.children = parent.children.flatMap((c) => (c === head.id ? [h1.id, head.id] : [c]))
  plans.push({ row, slug, nodes, added: [h1.id], changed: [head.id, parent.id], kw })
  console.log(`  ${label} h1 "${kw}" above the headline (${why})`)
}
for (const l of listed) console.log(`  ${l}`)

// ── the registry rules that keep the look ───────────────────────────────────
const base = rules.find(([, r]) => r.selector === K.baseHeadingSelector)?.[1]
const heroH1 = rules.find(([, r]) => r.selector === `${H} h1`)?.[1]
const heroEm = rules.find(([, r]) => r.selector === `${H} h1 em`)?.[1]
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o?.[k] !== undefined).map((k) => [k, o[k]]))
const NEW_RULES = heroH1 ? [
  [`${H} p[${A}]`, { ...pick(base?.styles, K.copyFromBase), ...heroH1.styles }, heroH1.order + 0.1],
  ...(heroEm ? [[`${H} p[${A}] em`, { ...heroEm.styles }, heroEm.order + 0.1]] : []),
  [`${H} h1.${LABEL.name}`, { ...K.taglineStyles }, (heroEm || heroH1).order + 0.2],
] : []
const shellNext = structuredClone(shell0)
let rulesAdded = 0
const ruleProblems = []
if (plans.some((p) => p.added.length) && !heroH1) ruleProblems.push(`no "${H} h1" rule on ${HOST}: the headline's look cannot be carried to a <p> — by hand`)
for (const [selector, styles, order] of plans.length ? NEW_RULES : []) {
  const cur = Object.values(shellNext.styleRules).find((r) => r.selector === selector)
  if (cur) { if (!isDeepStrictEqual(cur.styles, styles)) ruleProblems.push(`rule ${selector} exists with other styles`); continue }
  const id = nanoid(); const t = Date.now()
  shellNext.styleRules[id] = { id, name: selector, kind: 'ambient', selector, order, styles, contextStyles: {}, createdAt: t, updatedAt: t }
  rulesAdded++
}
console.log(`  classes  hero ${H}, tagline .${LABEL.name}, headline [${A}]; rules to add ${rulesAdded}`)
for (const [s, st] of plans.length ? NEW_RULES : []) console.log(`           ${s} ${JSON.stringify(st)}`)
for (const p of ruleProblems) console.log(`  !! ${p}`)
console.log(`  plan     ${plans.length} page(s) to write, ${listed.length} listed for a decision or a hand edit`)
if (!APPLY) {
  if (status.draftMatchesPublished !== true) console.log('  note     the draft already differs from live: --apply would refuse')
  console.log('plan only — pass --apply'); process.exit(ruleProblems.length ? 1 : 0)
}
if (status.draftMatchesPublished !== true) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }
if (ruleProblems.length) { console.error('REFUSING: rule problems above'); process.exit(1) }
if (listed.length) { console.error('REFUSING: pages in scope that cannot be written — settle them or narrow with --only'); process.exit(1) }
if (!plans.length && !rulesAdded) { console.log('nothing to write'); process.exit(0) }

// ── backup, then write: the shell (new rules) with the first chunk, then the rest ──
const BK = join(OUT, 'backups')
mkdirSync(BK, { recursive: true })
const bkFile = join(BK, `keyword-h1-${HOST}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
writeFileSync(bkFile, JSON.stringify({ rows: plans.map((p) => p.row), styleRules: shell0.styleRules }))
console.log(`  backup   ${bkFile} (the rows as read, the registry before)`)
for (let k = 0; k < Math.max(plans.length, 1); k += 10) {
  const chunk = plans.slice(k, k + 10)
  const { site: sh, seq } = await getSite()
  if (k === 0 && sha(sh) !== sha(shell0)) { console.error('REFUSING: the shell changed since the plan (someone is editing) — re-run'); process.exit(1) }
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
if (problems.length) { console.error(`READ-BACK PROBLEMS (${problems.length}):\n  ${problems.slice(0, 30).join('\n  ')}\nIf they are harmless (e.g. a dropped empty key), prove it with --adopt --only <the pages>.`); process.exit(1) }
console.log(`  readback ${plans.length} pages + ${rulesAdded} rules: only the planned nodes and rules differ`)
mkdirSync(OUT, { recursive: true })
writeFileSync(STATE, JSON.stringify({ seqs: Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq])), shell: sha(shell1), at: new Date().toISOString() }, null, 1))
console.log(`  status   ${JSON.stringify(await api('GET', '/admin/api/cms/publish/status'))}`)
console.log('draft only — check (hero-look.mjs compare on a render of the draft, or after publish), then --publish')
