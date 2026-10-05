#!/usr/bin/env node
/**
 * GATE: are a site's classes inside the Client-First + Relume boundaries?
 *
 *   node class-audit.mjs --site <client>[:staging]          # the published registry + page trees
 *   node class-audit.mjs --local <site-src>                 # a build on disk (html, css/, js)
 *   options: --json <file>  --strict (exit 1 on any out-of-bounds class or reimplemented utility)
 *
 * Standard: ../client-first-style-guide/CLASS-STANDARD.md. In short:
 *   utility  dashes only, from the Relume library or a property-family system (`text-color-accent`)
 *   custom   folder_element, one underscore          combo  is-variant
 *   out of bounds: abbreviations (btn, rv-, ch), dash-only custom names (eyebrow, wrap), BEM,
 *   camelCase, two underscores, builder leftovers (brxe-, w-full)
 * Also reported: classes that reimplement a library utility, identical custom classes, font size
 * outside a type role (a warning: Client-First allows it for unique text), contextual rules, and
 * every script that selects by a styling class (what a rename can break).
 */
import { readFileSync, readdirSync, writeFileSync, statSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { argOf } from './target.mjs'
import { parseCss, toBag } from './css-source.mjs'
import { classify, OUT_OF_BOUNDS, COMBO_RE, TYPE_ROLE, signature, librarySig, scriptClassRefs } from './class-audit-lib.mjs'

/* ── gather: classes in use, their declarations, scripts ────────────────── */
async function fromSite() {
  const { connect } = await import('./target.mjs')
  const { api, target } = await connect()
  const { site } = await api.getSite()
  const { rows } = await api.getPages()
  const used = new Map()
  const pages = new Map()
  const tally = (id, slug) => {
    used.set(id, (used.get(id) ?? 0) + 1)
    if (slug) (pages.get(id) ?? pages.set(id, new Set()).get(id)).add(slug)
  }
  for (const row of rows ?? []) {
    const body = typeof row.cells?.body === 'string' ? JSON.parse(row.cells.body) : row.cells?.body
    for (const node of Object.values(body?.nodes ?? {})) for (const id of node.classIds ?? []) tally(id, row.cells?.slug ?? row.id)
  }
  for (const vc of site.visualComponents ?? []) {
    for (const id of vc.classIds ?? []) tally(id, `component:${vc.name ?? vc.id}`)
    for (const node of Object.values(vc.tree?.nodes ?? {})) for (const id of node.classIds ?? []) tally(id, `component:${vc.name ?? vc.id}`)
  }
  const classes = new Map() // name -> { uses, pages:Set, styles, contextStyles }
  for (const r of Object.values(site.styleRules ?? {})) {
    if (r.kind !== 'class' || r.generated) continue
    const c = classes.get(r.name) ?? { uses: 0, pages: new Set(), styles: null, contextStyles: {} }
    c.uses += used.get(r.id) ?? 0
    for (const p of pages.get(r.id) ?? []) c.pages.add(p)
    if (r.selector === `.${r.name}` || !c.styles) { c.styles = r.styles ?? {}; c.contextStyles = r.contextStyles ?? {} }
    classes.set(r.name, c)
  }
  const ambient = Object.values(site.styleRules ?? {}).filter((r) => r.kind === 'ambient' && !r.rawCss).map((r) => r.selector ?? '')
  const enabled = site.runtime?.scripts ?? {}
  const scripts = (site.files ?? []).filter((f) => f.type === 'script' && enabled[f.id]?.enabled !== false).map((f) => ({ path: f.path, js: f.content ?? '' }))
  return { label: target.url, classes, ambient, scripts }
}

function walk(dir, exts, out = []) {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n.startsWith('.')) continue
    const p = join(dir, n)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, exts, out)
    else if (exts.includes(extname(n).toLowerCase())) out.push(p)
  }
  return out
}
function fromLocal(root) {
  const htmlRoot = existsSync(join(root, 'dist')) ? join(root, 'dist') : root
  const classes = new Map()
  for (const f of walk(htmlRoot, ['.html'])) {
    const html = readFileSync(f, 'utf8')
    for (const m of html.matchAll(/\sclass\s*=\s*["']([^"']+)["']/gi)) {
      for (const tok of m[1].split(/\s+/).filter(Boolean)) {
        if (tok.includes('{') || tok.includes('$')) continue
        const c = classes.get(tok) ?? { uses: 0, pages: new Set(), styles: null, contextStyles: {} }
        c.uses++
        c.pages.add(f.slice(htmlRoot.length + 1))
        classes.set(tok, c)
      }
    }
  }
  const cssFiles = existsSync(join(root, 'css')) ? walk(join(root, 'css'), ['.css']) : walk(root, ['.css']).filter((f) => !f.includes(`${'dist'}`))
  const ambient = []
  for (const f of cssFiles.sort()) {
    for (const r of parseCss(readFileSync(f, 'utf8')).rules) {
      const solo = r.selector.match(/^\.([a-zA-Z][\w-]*)$/)
      if (solo && classes.has(solo[1])) {
        const c = classes.get(solo[1])
        const { styles } = toBag(r.decls)
        if (r.contexts.length) c.contextStyles[r.contexts[0]] = { ...(c.contextStyles[r.contexts[0]] ?? {}), ...styles }
        else c.styles = { ...(c.styles ?? {}), ...styles }
      } else if (!solo) ambient.push(r.selector)
    }
  }
  const jsRoot = existsSync(join(root, 'js')) ? join(root, 'js') : root
  const scripts = walk(jsRoot, ['.js', '.mjs']).filter((f) => !/vendor|gsap|\.min\./i.test(f)).map((f) => ({ path: f.slice(root.length + 1), js: readFileSync(f, 'utf8') }))
  return { label: root, classes, ambient, scripts }
}

/* ── audit ──────────────────────────────────────────────────────────────── */
const localRoot = argOf('--local')
const data = localRoot ? fromLocal(localRoot) : await fromSite()
const report = { site: data.label, classesUsed: 0, classesUnused: 0, byKind: {}, outOfBounds: [], reimplements: [], duplicates: [], fontSizeOutsideRoles: [], contextual: [], scriptRefs: [], unused: [] }
const sigOwners = new Map()
for (const [name, c] of data.classes) {
  if (!c.uses) {
    report.classesUnused++
    report.unused.push(name)
    continue
  }
  report.classesUsed++
  const kind = classify(name)
  report.byKind[kind] = (report.byKind[kind] ?? 0) + 1
  const styles = c.styles ?? {}
  const sig = signature(styles)
  const entry = { name, kind, uses: c.uses, pages: c.pages.size, decls: Object.keys(styles).length, sample: Object.entries(styles).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join('; ') }
  if (OUT_OF_BOUNDS.has(kind)) report.outOfBounds.push(entry)
  if (kind !== 'library' && !/_component$|^section_/.test(name) && sig && librarySig.has(sig) && !Object.keys(c.contextStyles).length) report.reimplements.push({ ...entry, use: librarySig.get(sig).join(' / ') })
  if (kind !== 'library' && sig && !Object.keys(c.contextStyles).length) (sigOwners.get(sig) ?? sigOwners.set(sig, []).get(sig)).push(name)
  const setsSize = 'fontSize' in styles || Object.values(c.contextStyles).some((b) => 'fontSize' in b)
  if (setsSize && !TYPE_ROLE.test(name)) report.fontSizeOutsideRoles.push(entry)
}
for (const [, names] of sigOwners) if (names.length > 1) report.duplicates.push(names)
for (const sel of data.ambient) {
  if (/\.[\w-]+[^,]*\s+[a-z*][\w-]*\b/i.test(sel) && !/^[:\[@]/.test(sel) && !/text-rich-text|w-richtext/.test(sel)) report.contextual.push(sel)
}
const styling = new Set([...data.classes.keys()].filter((n) => !COMBO_RE.test(n)))
for (const s of data.scripts) {
  const refs = scriptClassRefs(s.js, styling)
  if (refs.size) report.scriptRefs.push({ path: s.path, classes: Object.fromEntries([...refs].sort((a, b) => b[1] - a[1])) })
}

/* ── print ──────────────────────────────────────────────────────────────── */
const pct = (n) => `${Math.round((100 * n) / Math.max(1, report.classesUsed))}%`
const oob = report.outOfBounds.length
const refCount = report.scriptRefs.reduce((n, s) => n + Object.keys(s.classes).length, 0)
console.log(`${data.label}: ${report.classesUsed} classes in use${localRoot ? '' : `, ${report.classesUnused} unused in the registry`}`)
console.log(`  by kind: ${Object.entries(report.byKind).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n} (${pct(n)})`).join(', ')}`)
console.log(`  OUT OF BOUNDS ${oob} (${pct(oob)}) · reimplements a utility ${report.reimplements.length} · identical groups ${report.duplicates.length} · font size outside a role ${report.fontSizeOutsideRoles.length} (warning) · contextual rules ${report.contextual.length} · styling classes used by scripts ${refCount}`)
const top = (list, n) => [...list].sort((a, b) => b.uses - a.uses).slice(0, n)
if (oob) {
  console.log('\n  out of bounds, most used first:')
  for (const e of top(report.outOfBounds, Number(argOf('--top') ?? 30))) console.log(`    ${e.kind.padEnd(16)} .${e.name.padEnd(30)} ${String(e.uses).padStart(5)} uses / ${String(e.pages).padStart(3)} pages   ${e.sample.slice(0, 80)}`)
}
if (report.reimplements.length) {
  console.log('\n  reimplements a library utility:')
  for (const e of top(report.reimplements, 15)) console.log(`    .${e.name.padEnd(30)} -> ${e.use}`)
}
if (report.duplicates.length) {
  console.log('\n  identical custom classes (keep one):')
  for (const g of report.duplicates.sort((a, b) => b.length - a.length).slice(0, 12)) console.log(`    ${g.map((n) => `.${n}`).join('  ')}`)
}
if (report.scriptRefs.length) {
  console.log('\n  scripts selecting by styling class (rename them with class-rename.mjs, or move to data- attributes):')
  for (const s of report.scriptRefs) console.log(`    ${s.path}: ${Object.keys(s.classes).slice(0, 14).join(' ')}${Object.keys(s.classes).length > 14 ? ' …' : ''}`)
}
const jsonOut = argOf('--json')
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(report, null, 1))
console.log(oob || report.reimplements.length ? `\n${oob + report.reimplements.length} problem(s): not inside Client-First + Relume` : '\nIN BOUNDS — every class follows Client-First + Relume')
if (process.argv.includes('--strict') && (oob || report.reimplements.length)) process.exit(1)
