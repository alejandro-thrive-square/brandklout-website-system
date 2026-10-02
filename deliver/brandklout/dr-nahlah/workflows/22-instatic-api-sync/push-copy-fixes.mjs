#!/usr/bin/env node
/**
 * push-copy-fixes.mjs — apply a copy map to every store a visitor or a crawler
 * reads, as one guarded draft. Generalised from push-sedation-copy.mjs for the
 * QA 2026-09-28 copy items (spellings, names, phone formats, titles, post grammar).
 *
 *   node push-copy-fixes.mjs <map.mjs>               # plan: every change, in context
 *   node push-copy-fixes.mjs <map.mjs> --apply       # back up, write drafts, read back
 *   node push-copy-fixes.mjs <map.mjs> --publish     # publish the site, only if the draft is ours
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-copy-fixes.mjs ...
 *
 * ## The map
 *
 *   export const RULES = [
 *     { from: 'exact text' | /regex/g, to: 'text' | fn, word?: true, only?: (store, where, key) => bool, note? },
 *   key = the field: text/label/alt… for nodes, title/seoTitle/seoDescription/body for rows, title/description for OG
 *   raw: true = a rule on a post body's raw HTML (markup included), applied after the text-node pass
 *   ]
 *   export const OG_ADD = { slug: { title, description, image?, imageAlt? } }   // optional new overrides
 *
 * `word: true` wraps a string `from` in `(?<![\w/-])…(?![\w-])`, so a rule for
 * "All-On-Four" never touches the slug `all-on-four-your-questions`.
 *
 * ## Text only — never a URL, slug, id or class
 *
 *   page/component nodes  props.text, label, alt, title, placeholder, caption and
 *                         htmlAttributes aria-label / title / alt
 *   page rows             title, seoTitle, seoDescription cells
 *   posts rows            title, seoTitle, seoDescription; body = HTML, text nodes only
 *   code assets           src/scripts/seo-head.js, src/scripts/jsonld/*.js (JSON in JS)
 *   OG overrides          title, description, imageAlt
 *   aeo-schema blocks     the JSON string
 *   media                 altText
 *
 * Inside the asset, schema and HTML stores every match is ALSO checked against
 * the whitespace/quote-delimited token around it: a token that is a URL, a path
 * or a file name is skipped. That is what keeps an image called
 * `anaesthesia-room.jpg` from being "corrected" along with the prose.
 *
 * Post rows publish one by one (a site publish does not promote them), and only
 * if their draft held nothing unpublished before this run.
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, toChangedPage, saveShell, BASE } from './sedation-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const MAP = process.argv.slice(2).find((a) => !a.startsWith('--'))
if (!MAP) { console.error('usage: push-copy-fixes.mjs <map.mjs> [--apply|--publish]'); process.exit(2) }
const map = await import(pathToFileURL(resolve(MAP)).href)
const HOST = BASE.replace(/^https?:\/\//, '')
const NAME = MAP.replace(/^.*[\\/]/, '').replace(/\.mjs$/, '')
mkdirSync(join(HERE, '.tmp', 'qa-fixes'), { recursive: true })
mkdirSync(join(HERE, '.tmp', 'backups'), { recursive: true })
const STATE = join(HERE, '.tmp', 'qa-fixes', `${NAME}-state-${HOST}.json`)
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const OG = '/admin/api/cms/plugins/brandklout.open-graph/runtime'
const AEO = '/admin/api/cms/plugins/brandklout.aeo-schema/runtime'

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const RULES = map.RULES.map((r, i) => {
  let re = r.from instanceof RegExp ? r.from : new RegExp(r.word ? `(?<![\\w/-])${esc(r.from)}(?![\\w-])` : esc(r.from), 'g')
  if (!re.flags.includes('g')) re = new RegExp(re.source, re.flags + 'g')
  return { ...r, i, re, n: 0 }
})
const URLISH = /https?:|\/|\.(jpe?g|png|webp|avif|svg|gif|js|css|mp4|webm|pdf)\b|^[\w-]+$/i
const changes = []

/** Apply the rules to one string. `guard` = check the surrounding token. */
function fix(s, store, where, guard, key = '') {
  let out = s
  for (const r of RULES) {
    if (!!r.raw !== (key === 'rawbody')) continue
    if (r.only && !r.only(store, where, key)) continue
    out = out.replace(r.re, (...args) => {
      const m = args[0], at = args[args.length - 2], str = args[args.length - 1]
      if (guard) {
        let a = at, b = at + m.length
        while (a > 0 && !/[\s"'<>`(),]/.test(str[a - 1])) a--
        while (b < str.length && !/[\s"'<>`(),]/.test(str[b])) b++
        const tok = str.slice(a, b).replace(/[.:;!?]+$/, '')
        if (tok !== m && URLISH.test(tok)) return m
      }
      const to = typeof r.to === 'function' ? r.to(...args) : m.replace(new RegExp(r.re.source, r.re.flags.replace('g', '')), r.to)
      if (to !== m) { r.n++; changes.push({ store, where, rule: r.i, from: m, to, ctx: str.slice(Math.max(0, at - 50), at + m.length + 50) }) }
      return to
    })
  }
  return out
}
/** HTML: rewrite text between tags only. */
const fixHtml = (html, store, where, key = 'html') => html.replace(/(^|>)([^<]+)(?=<|$)/g, (_, a, t) => a + fix(t, store, where, true, key))

const TEXT_KEYS = new Set(['text', 'label', 'alt', 'title', 'placeholder', 'caption'])
const ATTR_KEYS = new Set(['aria-label', 'title', 'alt'])
function fixProps(props, store, where) {
  const p = structuredClone(props)
  for (const k of Object.keys(p)) if (TEXT_KEYS.has(k) && typeof p[k] === 'string') p[k] = fix(p[k], store, where, false, k)
  if (p.htmlAttributes) for (const k of Object.keys(p.htmlAttributes)) if (ATTR_KEYS.has(k) && typeof p.htmlAttributes[k] === 'string') p.htmlAttributes[k] = fix(p.htmlAttributes[k], store, where, false)
  if (typeof p.html === 'string') p.html = fixHtml(p.html, store, where)
  return p
}

console.log(`${HOST} ${NAME}`, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)')
const status = await api('GET', '/admin/api/cms/publish/status')
console.log(`  status   ${JSON.stringify(status)}`)

// ── publish ─────────────────────────────────────────────────────────────────
if (PUBLISH) {
  if (!existsSync(STATE)) { console.error('no --apply state for this host'); process.exit(1) }
  const st = JSON.parse(readFileSync(STATE, 'utf8'))
  const now = Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq]))
  const moved = Object.keys(st.seqs).filter((id) => now[id] !== st.seqs[id])
  const { site } = await getSite()
  if (moved.length || sha(site.files) !== st.files || sha(site.styleRules) !== st.rules) { console.error(`REFUSING: the draft moved since --apply (${moved.length} rows)`); process.exit(1) }
  console.log('published', JSON.stringify(await api('POST', '/admin/api/cms/publish', {})))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  process.exit(0)
}
if (APPLY && !status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

// ── plan every store ────────────────────────────────────────────────────────
const { site, seq: shellSeq } = await getSite()
const rows = (await getPages()).rows
const pagePlans = []
for (const r of rows) {
  const slug = r.cells?.slug ?? r.slug
  const before = changes.length
  const nodes = {}
  for (const [id, n] of Object.entries(r.cells?.body?.nodes ?? {})) nodes[id] = n.props ? { ...n, props: fixProps(n.props, 'page', slug) } : n
  const cells = {}
  for (const k of ['title', 'seoTitle', 'seoDescription']) if (typeof r.cells?.[k] === 'string') cells[k] = fix(r.cells[k], k === 'title' ? 'title' : 'cell', slug, false, k)
  if (changes.length > before) pagePlans.push({ r, slug, nodes, cells })
}
const comps = (await api('GET', '/admin/api/cms/components')).rows ?? []
const compPlans = []
for (const c of comps) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${c.id}`)).row
  const before = changes.length
  const nodes = {}
  for (const [id, n] of Object.entries(row.cells.body.nodes)) nodes[id] = n.props ? { ...n, props: fixProps(n.props, 'component', row.cells.name) } : n
  if (changes.length > before) compPlans.push({ row, nodes })
}
const fileEdits = []
for (const f of site.files ?? []) {
  if (!/^src\/scripts\/(jsonld\/.*|seo-head)\.js$/.test(f.path)) continue
  const next = fix(f.content, 'asset', f.path, true)
  if (next !== f.content) fileEdits.push({ path: f.path, before: f.content, next })
}
const og = await api('GET', `${OG}/pages`)
const ogEdits = []
for (const p of og.pages ?? []) {
  if (!p.override) continue
  const next = { ...p.override }
  for (const k of ['title', 'description', 'imageAlt']) if (typeof next[k] === 'string') next[k] = fix(next[k], 'og', p.slug, false, k)
  if (!isDeepStrictEqual(next, p.override)) ogEdits.push({ slug: p.slug, next })
}
for (const [slug, o] of Object.entries(map.OG_ADD ?? {})) {
  const p = (og.pages ?? []).find((x) => x.slug === slug)
  if (!p) { console.error(`OG_ADD: no page ${slug}`); process.exit(1) }
  if (p.override) {
    // an existing override keeps every field it has; OG_ADD only fills the empty ones
    const fill = Object.fromEntries(Object.entries(o).filter(([k]) => !p.override[k]))
    if (!Object.keys(fill).length) { console.log(`  og       ${slug} already has an override — OG_ADD skipped`); continue }
    const prev = ogEdits.find((e) => e.slug === slug)
    const next = { ...(prev?.next ?? p.override), ...fill }
    if (prev) prev.next = next; else ogEdits.push({ slug, next })
    changes.push({ store: 'og', where: slug, rule: 'OG_ADD', from: '(empty)', to: JSON.stringify(fill), ctx: '' })
    continue
  }
  ogEdits.push({ slug, next: { key: p.key, type: 'website', enabled: true, ...o } })
  changes.push({ store: 'og', where: slug, rule: 'OG_ADD', from: '(none)', to: `${o.title} | ${o.description}`, ctx: '' })
}
const aeo = await api('GET', `${AEO}/entries`)
const blockEdits = []
for (const b of [...(aeo.entries ?? []).map((e) => e.block), aeo.global].filter(Boolean)) {
  const json = fix(b.json, 'schema', b.key, true)
  if (json !== b.json) blockEdits.push({ ...b, json })
}
const media = (await api('GET', '/admin/api/cms/media')).assets ?? []
const altEdits = []
for (const a of media) {
  if (typeof a.altText !== 'string') continue
  const next = fix(a.altText, 'alt', a.filename ?? a.id, false)
  if (next !== a.altText) altEdits.push({ id: a.id, next })
}
const posts = (await api('GET', '/admin/api/cms/data/tables/posts/rows')).rows ?? []
const postEdits = []
for (const p of posts) {
  const next = { ...p.cells }
  for (const k of ['title', 'seoTitle', 'seoDescription']) if (typeof next[k] === 'string') next[k] = fix(next[k], 'post', p.cells.slug, false, k)
  if (typeof next.body === 'string') next.body = fix(fixHtml(next.body, 'post', p.cells.slug, 'body'), 'post', p.cells.slug, false, 'rawbody')
  if (!isDeepStrictEqual(next, p.cells)) postEdits.push({ p, next })
}

// ── report ──────────────────────────────────────────────────────────────────
const byRule = new Map()
for (const c of changes) { const k = c.rule; if (!byRule.has(k)) byRule.set(k, []); byRule.get(k).push(c) }
for (const [k, cs] of byRule) {
  const r = typeof k === 'number' ? RULES[k] : null
  console.log(`\n## ${r ? (r.note ?? String(r.from)).slice(0, 110) : k}  — ${cs.length} change(s)`)
  const seen = new Set()
  for (const c of cs) {
    const key = `${c.store}|${c.from}|${c.to}`
    const where = cs.filter((x) => `${x.store}|${x.from}|${x.to}` === key).map((x) => x.where)
    if (seen.has(key)) continue
    seen.add(key)
    console.log(`   ${c.store.padEnd(9)} "${c.from.slice(0, 90)}" -> "${String(c.to).slice(0, 90)}"  [${[...new Set(where)].slice(0, 4).join(', ')}${new Set(where).size > 4 ? ` +${new Set(where).size - 4}` : ''}]`)
  }
}
const unused = RULES.filter((r) => r.n === 0 && !r.optional)
console.log(`\n${changes.length} change(s): ${pagePlans.length} pages, ${compPlans.length} components, ${fileEdits.length} assets, ${ogEdits.length} OG, ${blockEdits.length} schema, ${altEdits.length} alts, ${postEdits.length} posts`)
if (unused.length) { console.log(`\nRULES THAT MATCHED NOTHING (${unused.length}):`); for (const r of unused) console.log(`  #${r.i} ${(r.note ?? String(r.from)).slice(0, 120)}`) }
if (!APPLY) { console.log('\nplan only — pass --apply'); process.exit(0) }
if (unused.length && !process.argv.includes('--allow-unused')) { console.error('\nREFUSING: a rule matched nothing (stale FROM text?). Fix the map or pass --allow-unused.'); process.exit(1) }

// ── guard post drafts, back up, write ───────────────────────────────────────
const preview = await api('GET', '/admin/api/cms/data/tables/posts/loop-preview?limit=100')
const livePosts = new Map((preview.items ?? []).map((it) => [it.fields.rowId, it.fields]))
for (const { p } of postEdits) {
  const l = livePosts.get(p.id)
  const stale = Object.keys(p.cells).filter((k) => k !== 'featuredMedia' && JSON.stringify(p.cells[k]) !== JSON.stringify(l?.[k]))
  if (stale.length) throw new Error(`post ${p.cells.slug} has unpublished draft changes (${stale.join(', ')}) — refusing`)
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const backup = join(HERE, '.tmp', 'backups', `pre-${NAME}-${HOST}-${stamp}.json`)
writeFileSync(backup, JSON.stringify({ rows, files: site.files, og: og.pages, aeo, media, posts, comps: compPlans.map((c) => c.row) }, null, 1))
console.log(`\nbacked up to ${backup}`)

for (let k = 0; k < pagePlans.length; k += 10) {
  const chunk = pagePlans.slice(k, k + 10)
  const { site: sh, seq } = await getSite()
  await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: sh,
    changedPages: chunk.map((p) => toChangedPage(p.r, { nodes: p.nodes, title: p.cells.title ?? p.r.cells.title })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(chunk.map((p) => [p.r.id, p.r.seq])), shellBaseSeq: seq,
  })
}
// re-apply SEO cells (the site-document write drops them) — with any planned change
for (const p of pagePlans) {
  const want = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => p.r.cells[k] !== undefined).map((k) => [k, p.cells[k] ?? p.r.cells[k]]))
  if (!Object.keys(want).length) continue
  const back = (await api('GET', `/admin/api/cms/data/rows/${p.r.id}`)).row
  if (Object.entries(want).some(([k, v]) => back.cells[k] !== v)) {
    if (p.slug.includes('/')) throw new Error(`${p.slug}: nested slug would flatten on a row PATCH — handle by hand`)
    await api('PATCH', `/admin/api/cms/data/rows/${p.r.id}`, { cells: { ...back.cells, ...want } })
  }
}
console.log(`pages     ${pagePlans.length} written`)
for (const c of compPlans) await api('PATCH', `/admin/api/cms/data/rows/${c.row.id}`, { cells: { ...c.row.cells, body: { ...c.row.cells.body, nodes: c.nodes } } })
if (compPlans.length) console.log(`components ${compPlans.length} written`)
if (fileEdits.length) {
  const fresh = await getSite()
  for (const e of fileEdits) {
    const f = fresh.site.files.find((x) => x.path === e.path)
    if (f.content !== e.before) throw new Error(`${e.path} changed since it was read — re-run`)
    f.content = e.next
  }
  await saveShell(fresh.site, fresh.seq)
  console.log(`assets    ${fileEdits.length} written`)
}
for (const e of ogEdits) await api('POST', `${OG}/override`, e.next)
for (const b of blockEdits) await api('POST', `${AEO}/entry`, { key: b.key, json: b.json, note: b.note, enabled: b.enabled })
for (const e of altEdits) await api('PATCH', `/admin/api/cms/media/${e.id}`, { altText: e.next })
for (const { p, next } of postEdits) {
  const cur = (await api('GET', `/admin/api/cms/data/rows/${p.id}`)).row
  await api('PATCH', `/admin/api/cms/data/rows/${p.id}`, { cells: { ...cur.cells, ...next } })
  await api('POST', `/admin/api/cms/data/rows/${p.id}/publish`, {})
}
console.log(`og ${ogEdits.length}, schema ${blockEdits.length}, alts ${altEdits.length}, posts ${postEdits.length} (row-published) written`)

// ── read back ───────────────────────────────────────────────────────────────
const problems = []
const rows2 = new Map((await getPages()).rows.map((r) => [r.id, r]))
for (const p of pagePlans) {
  const b = rows2.get(p.r.id)
  if ((b.cells.slug ?? b.slug) !== p.slug) problems.push(`${p.slug}: slug now ${b.cells.slug}`)
  if (!isDeepStrictEqual(b.cells.body.nodes, p.nodes)) problems.push(`${p.slug}: nodes differ from plan`)
  for (const k of Object.keys(p.cells)) if (b.cells[k] !== p.cells[k]) problems.push(`${p.slug}: ${k} is "${b.cells[k]}"`)
  if (b.cells.templateEnabled !== p.r.cells.templateEnabled) problems.push(`${p.slug}: template flag changed`)
}
const { site: s2 } = await getSite()
for (const e of fileEdits) if (s2.files.find((f) => f.path === e.path).content !== e.next) problems.push(`${e.path} differs from plan`)
const og2 = new Map(((await api('GET', `${OG}/pages`)).pages ?? []).map((p) => [p.slug, p.override]))
for (const e of ogEdits) for (const k of ['title', 'description']) if (og2.get(e.slug)?.[k] !== e.next[k]) problems.push(`og ${e.slug}: ${k} not saved`)
const posts2 = new Map(((await api('GET', '/admin/api/cms/data/tables/posts/rows')).rows ?? []).map((p) => [p.id, p]))
for (const { p, next } of postEdits) for (const k of Object.keys(next)) if (!isDeepStrictEqual(posts2.get(p.id).cells[k], next[k])) problems.push(`post ${p.cells.slug}: ${k} differs`)
if (problems.length) { console.error(`READ-BACK PROBLEMS (${problems.length}):\n  ${problems.slice(0, 30).join('\n  ')}`); process.exit(1) }
const seqs = Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq]))
writeFileSync(STATE, JSON.stringify({ seqs, files: sha(s2.files), rules: sha(s2.styleRules), at: new Date().toISOString() }))
console.log(`readback  every store matches the plan`)
console.log(`status    ${JSON.stringify(await api('GET', '/admin/api/cms/publish/status'))}`)
console.log('drafts written — re-run with --publish (posts are already live)')
