#!/usr/bin/env node
/**
 * Rename (or merge) classes across a whole Instatic site, or a local build, from one reviewed map.
 *
 *   node class-rename.mjs --site <client>:staging --map class-map.json            # dry run, full report
 *   node class-rename.mjs --site <client>:staging --map class-map.json --apply    # one atomic save
 *   node class-rename.mjs --site <client>:staging --map class-map.json --verify   # published pages + scripts: any old name left?
 *   node class-rename.mjs --files <site-src dir> --map class-map.json [--apply]   # html, css, js on disk
 *
 * Standard and map format: ../client-first-style-guide/CLASS-STANDARD.md §8–9.
 *
 * WHAT IT CHANGES (site mode), all in ONE `PUT /site-document` with every page's seq as its base,
 * so a browser edit made meanwhile is a 409, never a loss:
 *   - registry: a renamed class keeps its rule and id (so every element and component that points
 *     at it by id follows); its name changes, and `.old` becomes `.new` in EVERY selector
 *     (combos, descendants, :hover, @media contexts included);
 *   - merges: elements carrying the old class carry the target instead; the old rule is deleted.
 *     Refused unless the two rules have identical declarations everywhere, so nothing can restyle;
 *   - page nodes: raw class strings (`htmlAttributes.class`, HTML inside embeds) and class
 *     selectors inside embedded <style>/<script>;
 *   - script assets (site.js, inline page scripts): `.old` inside string literals, and bare tokens
 *     inside `classList.*()`, `className`, `getElementsByClassName()` and `class="…"`.
 * WHAT IT REFUSES (reports, changes nothing):
 *   - a rename whose new name already exists as a class or appears in any selector (the elements
 *     would pick up styles they do not have today);
 *   - a new name that is itself out of bounds (class-audit), unless --allow-out-of-bounds;
 *   - a merge or raw class string inside a visual component (component rows are not rewritten
 *     here; rename in place is fine there, ids do not change).
 * Bare-word occurrences in scripts that are not in a recognised class context are LISTED for a
 * human ("review"): they may be a class built by string concatenation.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs'
import { join, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { argOf } from './target.mjs'
import { mapJsStrings } from './js-lexer.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, 'output')
const apply = process.argv.includes('--apply')
const mapPath = argOf('--map')
if (!mapPath) {
  console.error('usage: class-rename.mjs (--site <client>:staging | --files <dir>) --map <class-map.json> [--apply | --verify]')
  process.exit(2)
}
const spec = JSON.parse(readFileSync(mapPath, 'utf8'))
const rename = spec.rename ?? {}
const merge = spec.merge ?? {}
/* `folders` ("tl": "timeline") renames every class of a folder. The site's registry is the list of
   names, so site mode expands it and writes `<map>.expanded.json`; --verify and --files read that
   file (after the rename the old names are gone from the registry). */
const expandedPath = mapPath.replace(/\.json$/i, '') + '.expanded.json'
const folders = spec.folders ?? {}
if (Object.keys(folders).length && (process.argv.includes('--verify') || argOf('--files'))) {
  const { existsSync } = await import('node:fs')
  if (!existsSync(expandedPath)) throw new Error(`folders need ${expandedPath}: run the site-mode dry run first`)
  Object.assign(rename, JSON.parse(readFileSync(expandedPath, 'utf8')).rename)
}
// old -> new, one pass, so chains (a->b, b->c) cannot cascade. A null-prototype map with own-key
// lookups: a plain object answers `'constructor' in all` with true.
const all = Object.assign(Object.create(null), rename, merge)
const has = (k) => Object.hasOwn(all, k)
const NAME_RE = /^-?[_a-zA-Z][\w-]*$/
for (const [o, n] of Object.entries(all)) {
  if (!NAME_RE.test(o) || !NAME_RE.test(n)) throw new Error(`bad class name in map: ${o} -> ${n}`)
  if (o === n) throw new Error(`no-op entry: ${o}`)
}
if (Object.keys(rename).some((k) => Object.hasOwn(merge, k))) throw new Error('a class is both renamed and merged')

/* ── text rewriters ─────────────────────────────────────────────────────── */
const log = { selectors: 0, classAttrs: 0, scriptSelectors: 0, scriptTokens: 0, review: [] }

/** `.old` -> `.new` in a selector or a CSS text. */
function rewriteSelectors(text) {
  return text.replace(/\.(-?[_a-zA-Z][\w-]*)/g, (m, name) => {
    if (!has(name)) return m
    log.selectors++
    return `.${all[name]}`
  })
}
/** tokens of a class attribute value */
function rewriteTokens(value) {
  return value.replace(/[^\s]+/g, (tok) => {
    if (!has(tok)) return tok
    log.classAttrs++
    return all[tok]
  })
}
/** HTML: class="…" attributes, and selectors inside <style> and <script>. */
function rewriteHtml(html) {
  let out = html.replace(/(\sclass\s*=\s*)(["'])([^"']*)\2/gi, (m, pre, q, v) => `${pre}${q}${rewriteTokens(v)}${q}`)
  out = out.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (m, a, css, b) => a + rewriteSelectors(css) + b)
  out = out.replace(/(<script(?![^>]*\bsrc=)[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, js, b) => a + rewriteJs(js, 'embedded script') + b)
  return out
}
const CLASS_CONTEXT = /(classList\.(add|remove|toggle|contains|replace)\s*\([^)]*$|className\s*(\+?=|[!=]==?)\s*$|getElementsByClassName\s*\(\s*$|\bclass(Name)?\s*:\s*$|setAttribute\(\s*['"]class['"]\s*,\s*$)/
/** JS: rewrite inside string literals only. */
function rewriteJs(js, where) {
  return mapJsStrings(js, (body, before) => {
    let s = body
    s = s.replace(/\.(-?[_a-zA-Z][\w-]*)/g, (mm, name, i) => {
      if (!has(name)) return mm
      // `.old` preceded by a word char is a property access or a file name, not a selector
      if (i > 0 && /[\w$]/.test(s[i - 1])) return mm
      log.scriptSelectors++
      return `.${all[name]}`
    })
    s = s.replace(/(class\s*=\s*\\?["'])([^"'\\]*)/gi, (mm, pre, v) => pre + rewriteTokens(v))
    if (CLASS_CONTEXT.test(before)) {
      s = s.replace(/[^\s]+/g, (tok) => {
        if (!has(tok)) return tok
        log.scriptTokens++
        return all[tok]
      })
    } else {
      for (const tok of s.split(/[\s'"`]+/)) if (has(tok)) log.review.push(`${where}: '${s.slice(0, 80)}' contains bare "${tok}"`)
    }
    return s
  }, (re) => {
    // regex literals: `class="a b"` inside the pattern, and escaped selectors `\.old`
    let r = re.replace(/(class=\\?["']?)([\w\s-]*)/g, (mm, pre, v) => pre + rewriteTokens(v))
    r = r.replace(/\\\.(-?[_a-zA-Z][\w-]*)/g, (mm, name) => {
      if (!has(name)) return mm
      log.scriptSelectors++
      return `\\.${all[name]}`
    })
    for (const tok of r.match(/[_a-zA-Z][\w-]*/g) ?? []) if (has(tok)) log.review.push(`${where}: regex /${r.slice(0, 80)}/ contains "${tok}"`)
    return r
  })
}

/* ── files mode ─────────────────────────────────────────────────────────── */
function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git'].includes(n) || n.startsWith('.')) continue
    const p = join(dir, n)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (['.html', '.css', '.js', '.mjs'].includes(extname(n).toLowerCase()) && !/vendor|gsap|\.min\./i.test(p)) out.push(p)
  }
  return out
}
if (argOf('--files')) {
  const root = argOf('--files')
  let changed = 0
  for (const f of walk(root)) {
    const src = readFileSync(f, 'utf8')
    const ext = extname(f).toLowerCase()
    const next = ext === '.css' ? rewriteSelectors(src) : ext === '.html' ? rewriteHtml(src) : rewriteJs(src, f.slice(root.length + 1))
    if (next !== src) {
      changed++
      if (apply) writeFileSync(f, next)
    }
  }
  console.log(`${root}: ${changed} file(s) ${apply ? 'rewritten' : 'would change'} — selectors ${log.selectors}, class attributes ${log.classAttrs}, script selectors ${log.scriptSelectors}, script tokens ${log.scriptTokens}`)
  for (const r of [...new Set(log.review)].slice(0, 40)) console.log(`  review  ${r}`)
  if (!apply) console.log('DRY RUN — re-run with --apply.')
  process.exit(0)
}

/* ── site mode ──────────────────────────────────────────────────────────── */
const { connect } = await import('./target.mjs')
const { classify, OUT_OF_BOUNDS } = await import('./class-audit-lib.mjs')
const { api, target } = await connect()

if (process.argv.includes('--verify')) {
  // Catch-all: what the PUBLISHED site still says. Any old name here was missed by a store.
  const base = target.url.replace(/\/$/, '')
  const { rows } = await api.getPages()
  const slugs = rows.map((r) => String(r.cells?.slug ?? '')).filter((s) => s && !s.includes('[') && s !== '404').map((s) => (s === 'index' ? '' : s))
  try {
    const sm = await fetch(`${base}/sitemap.xml`).then((r) => (r.ok ? r.text() : ''))
    for (const m of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const p = new URL(m[1]).pathname.replace(/^\/|\/$/g, '')
      if (!slugs.includes(p)) slugs.push(p)
    }
  } catch {}
  const left = new Map()
  const scripts = new Set()
  for (const slug of slugs) {
    const html = await fetch(`${base}/${slug}`).then((r) => (r.ok ? r.text() : ''))
    for (const m of html.matchAll(/\sclass\s*=\s*["']([^"']*)["']/gi)) for (const t of m[1].split(/\s+/)) if (has(t)) left.set(`class="${t}"`, [...(left.get(`class="${t}"`) ?? []), slug])
    for (const m of html.matchAll(/<script[^>]+src="([^"]+)"/g)) if (m[1].startsWith('/')) scripts.add(m[1])
    for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) for (const t of m[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) if (has(t[1])) left.set(`.${t[1]} in <style>`, [...(left.get(`.${t[1]} in <style>`) ?? []), slug])
  }
  const cssLinks = new Set()
  const home = await fetch(`${base}/`).then((r) => r.text())
  for (const m of home.matchAll(/href="([^"]+\.css)"/g)) cssLinks.add(m[1])
  for (const href of [...scripts, ...cssLinks]) {
    const text = await fetch(new URL(href, base)).then((r) => (r.ok ? r.text() : ''))
    for (const t of text.matchAll(/['"`.\s]\.?(-?[_a-zA-Z][\w-]*)/g)) {
      if (!has(t[1])) continue
      if (href.endsWith('.css') && !text.includes(`.${t[1]}`)) continue
      left.set(`${t[1]} in ${href.split('/').pop()}`, ['(asset)'])
    }
  }
  console.log(`${target.url}: ${slugs.length} published page(s), ${scripts.size} script(s), ${cssLinks.size} stylesheet(s) scanned for ${Object.keys(all).length} old name(s)`)
  for (const [k, v] of left) console.log(`  LEFT  ${k}  (${[...new Set(v)].slice(0, 4).join(', ')}${v.length > 4 ? ' …' : ''})`)
  console.log(left.size ? `\n${left.size} old name(s) still published` : '\nCLEAN — no old class name is published anywhere')
  process.exit(left.size ? 1 : 0)
}

const { site: shell, seq } = await api.getSite()
const { rows } = await api.getPages()
const comps = (await api.api('GET', '/admin/api/cms/components')).rows ?? []
mkdirSync(OUT, { recursive: true })
const host = new URL(target.url).hostname
writeFileSync(join(OUT, `shell.before-class-rename.${host}.${seq}.json`), JSON.stringify(shell))
writeFileSync(join(OUT, `pages.before-class-rename.${host}.${seq}.json`), JSON.stringify(rows))
console.log(`target  ${target.url} (seq ${seq}), ${rows.length} pages, ${comps.length} component(s); map ${Object.keys(rename).length} rename + ${Object.keys(merge).length} merge`)

if (Object.keys(folders).length) {
  const names = new Set()
  for (const r of Object.values(shell.styleRules ?? {})) {
    if (r.kind === 'class') names.add(r.name)
    for (const m of (r.selector ?? '').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) names.add(m[1])
  }
  let added = 0
  for (const name of names) {
    const i = name.indexOf('_')
    if (i < 1 || has(name)) continue
    const folder = name.slice(0, i)
    if (!Object.hasOwn(folders, folder)) continue
    rename[name] = folders[folder] + name.slice(i)
    all[name] = rename[name]
    added++
  }
  writeFileSync(expandedPath, JSON.stringify({ site: spec.site, rename, merge, expandedFrom: mapPath }, null, 2))
  console.log(`folders    ${added} class(es) from ${Object.keys(folders).length} folder rename(s), written to ${expandedPath}`)
}

const rules = shell.styleRules ?? {}
const classRules = (name) => Object.values(rules).filter((r) => r.kind === 'class' && r.name === name)
const mentioned = (name) => Object.values(rules).some((r) => new RegExp(`\\.${name.replace(/[-]/g, '\\-')}(?![\\w-])`).test(r.selector ?? ''))
const problems = []
const sig = (r) => JSON.stringify([r.styles ?? {}, r.contextStyles ?? {}, r.stylePriorities ?? {}, r.contextStylePriorities ?? {}], (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v))

for (const [o, n] of Object.entries(all)) {
  if (!classRules(o).length && !mentioned(o)) problems.push(`${o}: not on this site`)
  if (OUT_OF_BOUNDS.has(classify(n)) && !process.argv.includes('--allow-out-of-bounds')) problems.push(`${o} -> ${n}: the new name is itself out of bounds (${classify(n)})`)
}
for (const [o, n] of Object.entries(rename)) {
  if (has(n)) continue // part of a swap/chain inside the map: fine, single pass
  if (classRules(n).length || mentioned(n)) problems.push(`${o} -> ${n}: "${n}" already exists in this site's CSS; use "merge" (identical rules) or another name`)
}
const mergePlan = []
for (const [o, n] of Object.entries(merge)) {
  const from = classRules(o)
  const to = classRules(n).find((r) => r.selector === `.${n}`)
  if (from.length !== 1 || from[0].selector !== `.${o}`) { problems.push(`merge ${o}: expected one class rule ".${o}", found ${from.length}`); continue }
  if (!to) { problems.push(`merge ${o} -> ${n}: no class rule ".${n}" to merge into`); continue }
  if (sig(from[0]) !== sig(to)) { problems.push(`merge ${o} -> ${n}: declarations differ, a merge would restyle elements`); continue }
  mergePlan.push({ from: from[0], to })
}
const mergeIds = new Map(mergePlan.map((m) => [m.from.id, m.to.id]))
for (const c of comps) {
  const body = JSON.stringify(c.cells ?? {})
  for (const [fromId] of mergeIds) if (body.includes(fromId)) problems.push(`merge into component "${c.cells?.name}": not supported here, rename instead`)
  for (const o of Object.keys(all)) if (new RegExp(`class[^"]{0,20}"[^"]*\\b${o}\\b`).test(body)) problems.push(`component "${c.cells?.name}" has a raw class string with "${o}": edit it in the editor`)
}
if (problems.length) {
  console.error(`\nREFUSING — ${problems.length} problem(s):`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}

/* registry */
let renamedRules = 0
for (const r of Object.values(rules)) {
  if (r.kind === 'class' && r.name in rename) { r.name = rename[r.name]; renamedRules++ }
  const sel = r.selector ?? ''
  const next = rewriteSelectors(sel)
  if (next !== sel) {
    r.selector = next
    if (r.kind === 'ambient' && r.name === sel) r.name = next
    r.updatedAt = Date.now()
  }
}
for (const { from } of mergePlan) delete rules[from.id]

/* pages */
const changedPages = []
const walkStrings = (o, key, fn) => {
  if (typeof o === 'string') return fn(o, key)
  if (Array.isArray(o)) return o.map((v) => walkStrings(v, key, fn))
  if (o && typeof o === 'object') return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, walkStrings(v, k, fn)]))
  return o
}
let nodeEdits = 0
for (const row of rows) {
  const body = typeof row.cells?.body === 'string' ? JSON.parse(row.cells.body) : row.cells?.body
  if (!body?.nodes) continue
  let touched = false
  for (const node of Object.values(body.nodes)) {
    if (node.classIds?.some((id) => mergeIds.has(id))) {
      node.classIds = [...new Set(node.classIds.map((id) => mergeIds.get(id) ?? id))]
      touched = true
      nodeEdits++
    }
    for (const field of ['props', 'htmlAttributes']) {
      if (!node[field]) continue
      const before = JSON.stringify(node[field])
      node[field] = walkStrings(node[field], field, (s, key) => {
        if (key === 'class' || key === 'className') return rewriteTokens(s)
        if (/<[a-z!]/i.test(s)) return rewriteHtml(s)
        if (/^(css|style|styles)$/i.test(key)) return rewriteSelectors(s)
        if (/^(js|script|code)$/i.test(key)) return rewriteJs(s, `page ${row.cells?.slug}`)
        return s
      })
      if (JSON.stringify(node[field]) !== before) { touched = true; nodeEdits++ }
    }
  }
  if (touched) changedPages.push(api.toChangedPage({ ...row, cells: { ...row.cells, body } }))
}

/* scripts */
let scriptFiles = 0
for (const f of shell.files ?? []) {
  if (f.type !== 'script' && f.type !== 'style') continue
  const next = f.type === 'style' ? rewriteSelectors(f.content ?? '') : rewriteJs(f.content ?? '', f.path)
  if (next !== f.content) { f.content = next; f.updatedAt = Date.now(); scriptFiles++ }
}

/* anything else in the shell that still mentions an old name (plugin settings, site scripts) */
const elsewhere = []
const rest = JSON.stringify({ settings: shell.settings, runtime: shell.runtime })
for (const o of Object.keys(all)) if (new RegExp(`[."' ]${o}(?![\\w-])`).test(rest)) elsewhere.push(o)

console.log(`\nregistry   ${renamedRules} class rule(s) renamed, ${log.selectors} selector token(s) rewritten, ${mergePlan.length} merged`)
console.log(`pages      ${changedPages.length} page(s), ${nodeEdits} node edit(s) (merges, raw class strings, embeds)`)
console.log(`scripts    ${scriptFiles} asset(s): ${log.scriptSelectors} selector(s), ${log.scriptTokens} classList/className token(s), ${log.classAttrs} class attribute token(s)`)
if (log.review.length) {
  console.log(`\nREVIEW — bare words in scripts not in a class context (${log.review.length}); left unchanged:`)
  for (const r of [...new Set(log.review)].slice(0, 60)) console.log(`  ${r}`)
}
if (elsewhere.length) console.log(`\nNOTE — site settings/runtime mention: ${elsewhere.join(', ')} (plugin settings or site scripts: check by hand)`)

if (!apply) {
  console.log('\nDRY RUN — nothing written. Re-run with --apply.')
  process.exit(0)
}
const res = await api.api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: shell, changedPages, deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: Object.fromEntries(changedPages.map((p) => [p.id, rows.find((r) => r.id === p.id).seq])),
  shellBaseSeq: seq,
})
console.log(`\nsaved — ${JSON.stringify(res).slice(0, 120)}. Not published.`)
