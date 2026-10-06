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
/* `prefixes` ("rv-": "review_") renames every class that STARTS with a dash prefix, the shape most
   pre-standard sites used (`rv-card-head` -> `review_card-head`). Longest prefix wins; explicit
   `rename` / `merge` entries win over both. */
const prefixes = spec.prefixes ?? {}
const prefixKeys = Object.keys(prefixes).sort((x, y) => y.length - x.length)
function expandName(name) {
  const i = name.indexOf('_')
  if (i > 0 && Object.hasOwn(folders, name.slice(0, i))) return folders[name.slice(0, i)] + name.slice(i)
  const p = prefixKeys.find((k) => name.startsWith(k) && name.length > k.length)
  return p ? prefixes[p] + name.slice(p.length) : null
}
const expands = Object.keys(folders).length || prefixKeys.length
if (expands && (process.argv.includes('--verify') || argOf('--files'))) {
  const { existsSync } = await import('node:fs')
  if (existsSync(expandedPath)) Object.assign(rename, JSON.parse(readFileSync(expandedPath, 'utf8')).rename)
  else if (process.argv.includes('--verify')) throw new Error(`folders need ${expandedPath}: run the site-mode dry run first`)
  else {
    // A local source with no live site yet (a build before launch): the files are the name list.
    const { readdirSync: rd, statSync: st } = await import('node:fs')
    const names = new Set()
    const scan = (d) => {
      for (const n of rd(d)) {
        if (['node_modules', '.git'].includes(n) || n.startsWith('.')) continue
        const p = join(d, n)
        if (st(p).isDirectory()) { scan(p); continue }
        if (!/\.(html|css|js|mjs)$/i.test(n)) continue
        const t = readFileSync(p, 'utf8')
        for (const m of t.matchAll(/\sclass\s*=\s*["']([^"'$]*)["']/gi)) for (const tok of m[1].split(/\s+/)) if (tok) names.add(tok)
        for (const m of t.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) names.add(m[1])
      }
    }
    scan(argOf('--files'))
    for (const name of names) {
      if (Object.hasOwn(rename, name) || Object.hasOwn(merge, name)) continue
      const next = expandName(name)
      if (next && next !== name) rename[name] = next
    }
    writeFileSync(expandedPath, JSON.stringify({ site: spec.site, rename, merge, expandedFrom: mapPath, from: 'files' }, null, 2))
  }
}
// old -> new, one pass, so chains (a->b, b->c) cannot cascade. A null-prototype map with own-key
// lookups: a plain object answers `'constructor' in all` with true.
const all = Object.assign(Object.create(null), rename, merge)
const has = (k) => Object.hasOwn(all, k)
// A merge may target a class the same map renames ("merge": {"a": "x"}, "rename": {"x": "y"}):
// a's elements end up on y. `mergeTarget` keeps the target's CURRENT name, to find its rule.
const mergeTarget = Object.create(null)
for (const [o, n] of Object.entries(merge)) {
  mergeTarget[o] = n
  if (Object.hasOwn(rename, n)) all[o] = rename[n]
}
// Old names may be odd (an importer once registered a class literally called `.p1`); new names
// must be plain class names (and pass the classifier, checked in site mode).
const OLD_RE = /^[.\w-]+$/
const NAME_RE = /^-?[_a-zA-Z][\w-]*$/
for (const [o, n] of Object.entries(all)) {
  if (!OLD_RE.test(o) || !NAME_RE.test(n)) throw new Error(`bad class name in map: ${o} -> ${n}`)
  if (o === n) throw new Error(`no-op entry: ${o}`)
}
if (Object.keys(rename).some((k) => Object.hasOwn(merge, k))) throw new Error('a class is both renamed and merged')
/** A class name as it is written in a selector: `.p1` is written `\.p1`. */
const cssEscape = (name) => name.replace(/[^\w-]/g, (c) => `\\${c}`)

/* ── text rewriters ─────────────────────────────────────────────────────── */
const log = { selectors: 0, classAttrs: 0, scriptSelectors: 0, scriptTokens: 0, review: [] }

/** `.old` -> `.new` in a selector or a CSS text. */
function rewriteSelectors(text) {
  // a class token is `.` followed by name characters or escapes (`.\.p1`, `.md\:flex`)
  return text.replace(/\.((?:\\.|[\w-])+)/g, (m, raw) => {
    const name = raw.replace(/\\(.)/g, '$1')
    if (!has(name)) return m
    log.selectors++
    return `.${cssEscape(all[name])}`
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
/* Calls whose first string argument IS a class name. The house scroll kit's `WZ.section(name, fn)`
   and `WZ.dom(name, fn)` build `'.' + name` themselves (Dr. Nahlah, West LA: 101 calls), which no
   string scan sees; a map can name more with "scriptClassCalls": ["Kit.mount"]. */
const CLASS_CALLS = ['WZ.section', 'WZ.dom', ...(spec.scriptClassCalls ?? [])]
  .map((c) => c.replace(/[.$]/g, (m) => `\\${m}`)).join('|')
// `...Class:` / `...ClassName:` option keys name classes too (SplitText `linesClass: 'ln'`,
// `wordsClass`, `charsClass`; Swiper `slideClass`; IFA rebuild, 2026-10-05).
const CLASS_CONTEXT = new RegExp(`(classList\\.(add|remove|toggle|contains|replace)\\s*\\([^)]*$|className\\s*(\\+?=|[!=]==?)\\s*$|getElementsByClassName\\s*\\(\\s*$|\\bclass(Name)?\\s*:\\s*$|\\b[a-z]\\w*Class(Name)?\\s*[:=]\\s*$|setAttribute\\(\\s*['"]class['"]\\s*,\\s*$|\\b(${CLASS_CALLS})\\(\\s*$)`)
const TAGS = 'a|abbr|article|aside|b|blockquote|body|button|canvas|caption|code|dd|details|dialog|div|dl|dt|em|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|html|i|iframe|img|input|label|legend|li|main|mark|nav|ol|option|p|picture|pre|q|s|section|select|small|source|span|strong|sub|summary|sup|svg|path|table|tbody|td|textarea|tfoot|th|thead|time|tr|u|ul|video'
const SELECTOR_CHAIN = new RegExp(`(^|[\\s>+~,(:\\]\\[*])(${TAGS})?((?:\\.-?[_a-zA-Z][\\w-]*)+)(?![\\w(])`, 'g')
/** JS: rewrite inside string literals only. */
function rewriteJs(js, where) {
  return mapJsStrings(js, (body, before) => {
    let s = body
    // A selector chain: optional tag, then one or more `.class` (`.grow-bar.result`, `img.hero_image`),
    // starting at the string start or after a selector boundary. Every class in the chain is mapped.
    // `file.min.js` or `obj.prop` never match: the chain must not follow an ordinary word.
    s = s.replace(SELECTOR_CHAIN, (mm, pre, tag, chain) => {
      const next = chain.replace(/\.(-?[_a-zA-Z][\w-]*)/g, (m2, name) => {
        if (!has(name)) return m2
        log.scriptSelectors++
        return `.${all[name]}`
      })
      return pre + (tag ?? '') + next
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
  // The same safety checks site mode runs: no new name out of bounds, no rename into a name the
  // source already uses (its elements would pick up styles they do not have today).
  {
    const { classify, OUT_OF_BOUNDS } = await import('./class-audit-lib.mjs')
    const present = new Set()
    for (const f of walk(root)) {
      const t = readFileSync(f, 'utf8')
      for (const m of t.matchAll(/\sclass\s*=\s*["']([^"'$]*)["']/gi)) for (const tok of m[1].split(/\s+/)) if (tok) present.add(tok)
      // Comments out: a comment that MENTIONS `.button` is not a class (Dr. Nahlah, 2026-10-06).
      if (/\.css$/i.test(f)) for (const m of t.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) present.add(m[1])
    }
    const problems = []
    for (const [o, n] of Object.entries(all)) {
      if (OUT_OF_BOUNDS.has(classify(n)) && !process.argv.includes('--allow-out-of-bounds')) problems.push(`${o} -> ${n}: the new name is itself out of bounds (${classify(n)})`)
    }
    for (const [o, n] of Object.entries(rename)) if (present.has(n) && !has(n)) problems.push(`${o} -> ${n}: "${n}" is already used in this source; use "merge" or another name`)
    const targets = new Map()
    for (const [o, n] of Object.entries(rename)) targets.set(n, [...(targets.get(n) ?? []), o])
    for (const [n, olds] of targets) if (olds.length > 1) problems.push(`${olds.join(', ')} all -> ${n}: two classes renamed to one name is a merge; declare it in "merge"`)
    if (problems.length) {
      console.error(`REFUSING — ${problems.length} problem(s):`)
      for (const p of problems.slice(0, 40)) console.error(`  ${p}`)
      process.exit(1)
    }
  }
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
  const slugs = await api.pageSlugs() // page rows + every collection entry
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
  // Assets are read the way the rewriter reads them: stylesheets by selector token, scripts by
  // their string and regex literals (a property `x.wrap` or a variable is not a class). In a
  // script, `.old` in a selector or a class context is LEFT (fails); a bare word equal to an old
  // name elsewhere in a string is listed as "mention" for a human (it does not fail).
  const { jsStringSpans } = await import('./js-lexer.mjs')
  const mentions = new Map()
  for (const href of [...scripts, ...cssLinks]) {
    const text = await fetch(new URL(href, base)).then((r) => (r.ok ? r.text() : ''))
    const file = href.split('/').pop()
    if (href.endsWith('.css')) {
      for (const t of text.matchAll(/\.((?:\\.|[\w-])+)/g)) {
        const name = t[1].replace(/\\(.)/g, '$1')
        if (has(name)) left.set(`.${name} in ${file}`, ['(asset)'])
      }
      continue
    }
    for (const s of jsStringSpans(text)) {
      const body = text.slice(s.start + 1, s.end - 1)
      const before = text.slice(Math.max(0, s.start - 60), s.start)
      for (const m of body.matchAll(SELECTOR_CHAIN)) for (const c of m[3].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) if (has(c[1])) left.set(`.${c[1]} in ${file}`, ['(asset)'])
      const tokens = body.split(/[\s"'`=]+/).filter(has)
      if (!tokens.length) continue
      if (s.kind !== 'regex' && CLASS_CONTEXT.test(before)) for (const t of tokens) left.set(`"${t}" (class context) in ${file}`, ['(asset)'])
      else for (const t of tokens) mentions.set(`"${t}" in ${file}`, (mentions.get(`"${t}" in ${file}`) ?? 0) + 1)
    }
  }
  for (const [k, n] of mentions) console.log(`  mention  ${k} ×${n} (a string equal to an old name, outside a class context: check by hand)`)
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

if (expands) {
  const names = new Set()
  for (const r of Object.values(shell.styleRules ?? {})) {
    if (r.kind === 'class') names.add(r.name)
    for (const m of (r.selector ?? '').matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) names.add(m[1])
  }
  let added = 0
  for (const name of names) {
    if (has(name)) continue
    const next = expandName(name)
    if (!next || next === name) continue
    rename[name] = next
    all[name] = next
    added++
  }
  writeFileSync(expandedPath, JSON.stringify({ site: spec.site, rename, merge, expandedFrom: mapPath }, null, 2))
  console.log(`expanded   ${added} class(es) from ${Object.keys(folders).length} folder and ${prefixKeys.length} prefix rename(s), written to ${expandedPath}`)
}

const rules = shell.styleRules ?? {}
const classRules = (name) => Object.values(rules).filter((r) => r.kind === 'class' && r.name === name)
const selectorTokens = (sel) => new Set([...(sel ?? '').matchAll(/\.((?:\\.|[\w-])+)/g)].map((m) => m[1].replace(/\\(.)/g, '$1')))
const mentioned = (name) => Object.values(rules).some((r) => selectorTokens(r.selector).has(name))
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
