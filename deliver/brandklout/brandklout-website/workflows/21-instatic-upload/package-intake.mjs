/**
 * package-intake.mjs — step 0 of every iteration: unpack Sang's zip beside the previous package and
 * write a FACTUAL change report before anyone touches a patch.
 *
 *   node package-intake.mjs "<zip or unpacked folder>" v18          # unpack (if a zip) + report
 *   node package-intake.mjs package-v18 v18 --against package-v16    # report only, chosen baseline
 *
 * WHY (2026-09-15). Sang sends a new zip every day or two, each time with a different packaging
 * idea (v11: six shared stylesheets; v16: the same plus a carousel sheet; v17/v18: one 208KB
 * "standalone" stylesheet per page, a `cms/` folder and a template page). Opened cold, every zip
 * looks like a redesign; opened against the previous one it is usually a handful of lines. The v18
 * run went wrong because the agent read the guides Sang wrote FOR A NAIVE IMPORTER ("import or paste
 * the matching CSS file", "create a collection with these 14 fields") as instructions for this
 * pipeline. They are not. The pipeline reads the package; this report says what changed in it.
 *
 * WHAT IT REPORTS, per package against the previous one:
 *   - files added / removed / changed, and Sang's own notes (README, CHANGELOG-*, *_GUIDE.md)
 *   - per page: new / gone / same / changed, and for a changed page WHERE: head only (title, meta,
 *     JSON-LD, stylesheet links) or body, with the body's sections listed (added, removed, moved,
 *     text changed) so a shared block added to every page reads as one change, not 33
 *   - CSS: which local stylesheets each page links; if the package bundles per page with
 *     `SOURCE:` banners (v17+), the bundles are split and each source is compared rule for rule to
 *     the previous package's file — "byte-identical modulo comment banners" is the usual answer
 *   - JS / JSON / media: byte compare
 * Output: `client-handoff/intake-<label>.md` (+ `.json`), committed with the package.
 *
 * It never edits the package (the zip is unpacked as received; see client-handoff/README.md).
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const HANDOFF = path.resolve(HERE, '../00-client-delivery-initialization/.tmp/client-handoff')

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const positional = args.filter((a) => !a.startsWith('--'))
const [source, label] = positional
const againstArg = args.includes('--against') ? args[args.indexOf('--against') + 1] : null
if (!source || !label || !/^v\d+[a-z]?$/.test(label)) {
  console.error('usage: node package-intake.mjs "<zip or folder>" v<NN> [--against package-vMM]')
  process.exit(2)
}
const refuse = (m) => {
  console.error('REFUSING: ' + m)
  process.exit(1)
}

/* --- 1. unpack ------------------------------------------------------------------------------ */
const pkgDir = path.join(HANDOFF, `package-${label}`)
const src = path.isAbsolute(source) ? source : path.resolve(HANDOFF, source)
if (!fs.existsSync(src)) refuse(`no such file or folder: ${src}`)
if (fs.statSync(src).isDirectory()) {
  if (path.resolve(src) !== path.resolve(pkgDir)) refuse(`a folder must already be client-handoff/package-${label}; got ${src}`)
} else {
  if (fs.existsSync(pkgDir)) refuse(`${pkgDir} exists; a zip is never unpacked over a package (delete it yourself if it was a bad unpack)`)
  fs.mkdirSync(pkgDir, { recursive: true })
  execFileSync('unzip', ['-q', src, '-d', pkgDir], { stdio: 'inherit' })
  // Some zips carry one top-level folder; hoist it so package-vNN/ holds the pages directly.
  const top = fs.readdirSync(pkgDir)
  if (top.length === 1 && fs.statSync(path.join(pkgDir, top[0])).isDirectory() && !fs.existsSync(path.join(pkgDir, 'index.html'))) {
    const inner = path.join(pkgDir, top[0])
    for (const f of fs.readdirSync(inner)) fs.renameSync(path.join(inner, f), path.join(pkgDir, f))
    fs.rmdirSync(inner)
  }
  console.log(`unpacked ${path.basename(src)} -> package-${label}/`)
}
if (!fs.existsSync(path.join(pkgDir, 'index.html'))) refuse(`package-${label} has no top-level index.html`)

/* --- 2. the baseline: the highest package-vNN below this one ---------------------------------- */
const num = (name) => Number((name.match(/^package-v(\d+)/) ?? [])[1] ?? -1)
const packages = fs.readdirSync(HANDOFF).filter((n) => /^package-v\d+/.test(n) && fs.statSync(path.join(HANDOFF, n)).isDirectory())
const prevName = againstArg ?? packages.filter((n) => num(n) < num(`package-${label}`)).sort((a, b) => num(b) - num(a))[0]
if (!prevName) refuse('no previous package to compare against')
const prevDir = path.join(HANDOFF, prevName)
if (!fs.existsSync(prevDir)) refuse(`no such baseline: ${prevDir}`)

/* --- helpers ---------------------------------------------------------------------------------- */
const walk = (root, rel = '') =>
  fs.readdirSync(path.join(root, rel), { withFileTypes: true }).flatMap((d) => {
    const r = rel ? `${rel}/${d.name}` : d.name
    return d.isDirectory() ? walk(root, r) : [r]
  })
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12)
const readText = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8')
const isPage = (rel) => /\.html?$/i.test(rel) && !/^(OPEN-ME|START-HERE)\.html$/i.test(rel)
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
const textOf = (html) => decode(html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

/* CSS: strip comments, one rule per line, so two files compare as rules, not bytes. */
const cssRules = (css) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};])\s*/g, '$1')
    .split(/(?<=[{}])/)
    .map((s) => s.trim())
    .filter(Boolean)
const linesDiff = (a, b) => {
  const A = new Map()
  const B = new Map()
  for (const l of a) A.set(l, (A.get(l) ?? 0) + 1)
  for (const l of b) B.set(l, (B.get(l) ?? 0) + 1)
  const removed = []
  const added = []
  for (const [l, n] of A) if ((B.get(l) ?? 0) < n) removed.push(l)
  for (const [l, n] of B) if ((A.get(l) ?? 0) < n) added.push(l)
  return { removed, added }
}

// Per-page bundled stylesheets (v17+): a comment banner "===== SOURCE: assets/site.css =====" opens each source.
const SOURCE_BANNER = /\/\*\s*=+\s*SOURCE:\s*([^\s*]+)[\s\S]*?\*\//g
function splitBundle(css) {
  const marks = [...css.matchAll(SOURCE_BANNER)]
  if (!marks.length) return null
  const parts = []
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index + marks[i][0].length
    const end = i + 1 < marks.length ? marks[i + 1].index : css.length
    parts.push({ source: marks[i][1], css: css.slice(start, end) })
  }
  return parts
}

const localSheets = (html) =>
  [...html.matchAll(/<link\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => /rel=["']?stylesheet/i.test(t))
    .map((t) => (t.match(/href=["']([^"']+)["']/i) ?? [])[1])
    .filter((h) => h && !/^(https?:)?\/\//i.test(h))
const localScripts = (html) => [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((m) => m[1]).filter((s) => !/^(https?:)?\/\//i.test(s))

/* Head vs body, and the body as a list of sections (tag + id/class + first heading + text hash). */
function pageShape(html) {
  const headM = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)
  const head = headM ? headM[1] : ''
  const body = html.slice(headM ? headM.index + headM[0].length : 0)
  const title = (head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i) ?? [])[1]?.trim() ?? ''
  const desc = (head.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ?? head.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i) ?? [])[1] ?? ''
  const jsonLd = [...head.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    try {
      const j = JSON.parse(m[1])
      return j['@type'] ?? '?'
    } catch {
      return 'invalid'
    }
  })
  const bodyClass = (body.match(/<body\b[^>]*class=["']([^"']*)["']/i) ?? [])[1] ?? ''
  const sections = []
  const re = /<(section|header|footer|nav|main)\b([^>]*)>/gi
  let m
  while ((m = re.exec(body))) {
    const attrs = m[2]
    const id = (attrs.match(/\bid=["']([^"']*)["']/) ?? [])[1]
    const cls = (attrs.match(/\bclass=["']([^"']*)["']/) ?? [])[1]
    // the section's own text: up to the next section-level open tag
    const next = body.slice(m.index + m[0].length).search(/<(section|footer)\b/i)
    const chunk = body.slice(m.index + m[0].length, next < 0 ? undefined : m.index + m[0].length + next)
    const heading = (chunk.match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i) ?? [])[1]
    const key = `${m[1]}${id ? '#' + id : ''}${cls ? '.' + cls.trim().split(/\s+/).join('.') : ''}`
    sections.push({ key, heading: heading ? textOf(heading) : '', text: sha(textOf(chunk)) })
  }
  return { title, desc, jsonLd, bodyClass, sections, headText: sha(head.replace(/<link\b[^>]*stylesheet[^>]*>/gi, '')), bodyText: sha(textOf(body)), sheets: localSheets(html), scripts: localScripts(html) }
}

/* --- 3. compare ------------------------------------------------------------------------------- */
const prevFiles = new Set(walk(prevDir))
const nextFiles = new Set(walk(pkgDir))
const report = { package: `package-${label}`, against: prevName, date: new Date().toISOString().slice(0, 10), files: {}, notes: [], pages: {}, css: {}, assets: {} }

report.files.added = [...nextFiles].filter((f) => !prevFiles.has(f)).sort()
report.files.removed = [...prevFiles].filter((f) => !nextFiles.has(f)).sort()
report.files.changed = [...nextFiles].filter((f) => prevFiles.has(f) && sha(fs.readFileSync(path.join(pkgDir, f))) !== sha(fs.readFileSync(path.join(prevDir, f)))).sort()
report.notes = [...nextFiles].filter((f) => /^(README|CHANGELOG[^/]*|[^/]*GUIDE[^/]*|[^/]*NOTES[^/]*)\.md$/i.test(f) || /^[^/]*\.(csv|txt)$/i.test(f)).sort()

// pages
const pagesPrev = [...prevFiles].filter(isPage)
const pagesNext = [...nextFiles].filter(isPage)
for (const f of new Set([...pagesPrev, ...pagesNext])) {
  if (!prevFiles.has(f)) {
    report.pages[f] = { status: 'NEW', ...pageShape(readText(pkgDir, f)) }
    continue
  }
  if (!nextFiles.has(f)) {
    report.pages[f] = { status: 'GONE' }
    continue
  }
  const a = readText(prevDir, f)
  const b = readText(pkgDir, f)
  if (a === b) {
    report.pages[f] = { status: 'same' }
    continue
  }
  const A = pageShape(a)
  const B = pageShape(b)
  const changes = []
  if (A.title !== B.title) changes.push(`title: "${A.title}" -> "${B.title}"`)
  if (A.desc !== B.desc) changes.push(`meta description: "${A.desc}" -> "${B.desc}"`)
  if (A.jsonLd.join() !== B.jsonLd.join()) changes.push(`JSON-LD: [${A.jsonLd}] -> [${B.jsonLd}]`)
  if (A.sheets.join() !== B.sheets.join()) changes.push(`stylesheet links: ${A.sheets.length} (${A.sheets.join(', ')}) -> ${B.sheets.length} (${B.sheets.join(', ')})`)
  if (A.scripts.join() !== B.scripts.join()) changes.push(`scripts: ${A.scripts.join(', ')} -> ${B.scripts.join(', ')}`)
  if (A.bodyClass !== B.bodyClass) changes.push(`body class: "${A.bodyClass}" -> "${B.bodyClass}"`)
  const bodySame = A.bodyText === B.bodyText && A.sections.map((s) => s.key).join('|') === B.sections.map((s) => s.key).join('|')
  const sectionNotes = []
  if (!bodySame) {
    const keysA = A.sections.map((s) => s.key)
    const keysB = B.sections.map((s) => s.key)
    for (const s of B.sections) if (!keysA.includes(s.key)) sectionNotes.push(`+ ${s.key}${s.heading ? ` "${s.heading}"` : ''}`)
    for (const s of A.sections) if (!keysB.includes(s.key)) sectionNotes.push(`- ${s.key}${s.heading ? ` "${s.heading}"` : ''}`)
    const commonA = keysA.filter((k) => keysB.includes(k))
    const commonB = keysB.filter((k) => keysA.includes(k))
    if (commonA.join('|') !== commonB.join('|')) sectionNotes.push(`~ section order changed: ${commonB.join(' > ')}`)
    for (const s of B.sections) {
      const o = A.sections.find((x) => x.key === s.key)
      if (o && o.text !== s.text) sectionNotes.push(`~ ${s.key}${s.heading ? ` "${s.heading}"` : ''}: text changed`)
    }
    if (!sectionNotes.length) sectionNotes.push('~ body markup changed outside any section (whitespace or attributes)')
  }
  report.pages[f] = { status: changes.length || sectionNotes.length ? 'changed' : 'changed (whitespace only)', head: changes, body: sectionNotes }
}

// css: what each page links, unbundled if bundled, compared to the baseline's files
{
  const bundles = new Map() // source path -> { css, pages[] }
  const disagree = []
  const perPage = {}
  for (const f of pagesNext) {
    const html = readText(pkgDir, f)
    const sheets = localSheets(html).map((h) => path.posix.normalize(path.posix.join(path.posix.dirname(f), h)))
    perPage[f] = sheets
    for (const s of sheets) {
      if (!nextFiles.has(s)) {
        report.css[s] = { status: 'MISSING (linked, not in the package)' }
        continue
      }
      const parts = splitBundle(readText(pkgDir, s))
      if (!parts) continue
      for (const p of parts) {
        const prior = bundles.get(p.source)
        if (prior && prior.rules !== cssRules(p.css).join('\n')) disagree.push(`${p.source}: ${f} differs from ${prior.pages[0]}`)
        if (!prior) bundles.set(p.source, { rules: cssRules(p.css).join('\n'), pages: [f], bundle: s })
        else prior.pages.push(f)
      }
    }
  }
  const linkSets = new Map()
  for (const [f, sheets] of Object.entries(perPage)) linkSets.set(sheets.join(', '), [...(linkSets.get(sheets.join(', ')) ?? []), f])
  report.css.linkSets = [...linkSets].map(([k, v]) => ({ sheets: k, pages: v.length, example: v[0] }))
  report.css.bundled = bundles.size ? { sources: [...bundles.keys()], disagreements: disagree } : null
  // each source (bundled or plain) against the baseline's file of the same path
  const compareTo = (source, rulesNext) => {
    if (!prevFiles.has(source)) return { status: 'NEW (no such file in the baseline)', rules: rulesNext.length }
    const rulesPrev = cssRules(readText(prevDir, source))
    const d = linesDiff(rulesPrev, rulesNext)
    if (!d.added.length && !d.removed.length) return { status: 'identical rules (comments/whitespace may differ)', rules: rulesNext.length }
    return { status: 'CHANGED', rules: rulesNext.length, added: d.added.slice(0, 40), removed: d.removed.slice(0, 40), more: Math.max(0, d.added.length + d.removed.length - 80) }
  }
  report.css.sources = {}
  if (bundles.size) for (const [source, b] of bundles) report.css.sources[source] = compareTo(source, b.rules.split('\n'))
  else for (const s of new Set(Object.values(perPage).flat())) if (nextFiles.has(s)) report.css.sources[s] = compareTo(s, cssRules(readText(pkgDir, s)))
  // baseline sheets no page links any more
  const prevSheets = new Set(pagesPrev.flatMap((f) => localSheets(readText(prevDir, f)).map((h) => path.posix.normalize(path.posix.join(path.posix.dirname(f), h)))))
  report.css.droppedSheets = [...prevSheets].filter((s) => !report.css.sources[s])
}

// js / json / media
for (const f of new Set([...prevFiles, ...nextFiles])) {
  if (isPage(f) || /\.(css|md|html?)$/i.test(f)) continue
  if (!/\.(js|mjs|json|csv|xml|txt|webp|png|jpe?g|svg|gif|avif|mp4|woff2?)$/i.test(f)) continue
  if (!prevFiles.has(f)) report.assets[f] = 'NEW'
  else if (!nextFiles.has(f)) report.assets[f] = 'GONE'
  else if (sha(fs.readFileSync(path.join(pkgDir, f))) !== sha(fs.readFileSync(path.join(prevDir, f)))) report.assets[f] = 'CHANGED'
}

/* --- 4. write --------------------------------------------------------------------------------- */
const md = []
md.push(`# Intake: package-${label} against ${prevName} (${report.date})`, '')
md.push(`Generated by \`21-instatic-upload/package-intake.mjs\`. Facts only; the decisions go in the run file.`, '')
md.push(`## Files`, '', `- added ${report.files.added.length}, removed ${report.files.removed.length}, changed ${report.files.changed.length}`)
if (report.notes.length) md.push(`- Sang's notes in this package: ${report.notes.map((n) => `\`${n}\``).join(', ')}`)
if (report.files.removed.length) md.push(`- removed: ${report.files.removed.slice(0, 30).map((n) => `\`${n}\``).join(', ')}${report.files.removed.length > 30 ? ` +${report.files.removed.length - 30}` : ''}`)
const addedNonCss = report.files.added.filter((f) => !/\.css$/i.test(f))
if (addedNonCss.length) md.push(`- added (non-CSS): ${addedNonCss.slice(0, 40).map((n) => `\`${n}\``).join(', ')}${addedNonCss.length > 40 ? ` +${addedNonCss.length - 40}` : ''}`)
md.push('', `## Pages`, '')
const byStatus = {}
for (const [f, p] of Object.entries(report.pages)) (byStatus[p.status] ??= []).push(f)
for (const [s, list] of Object.entries(byStatus)) md.push(`- **${s}**: ${list.length}${s === 'same' ? '' : ` — ${list.map((n) => `\`${n}\``).join(', ')}`}`)
md.push('')
for (const [f, p] of Object.entries(report.pages)) {
  if (p.status === 'same' || p.status === 'GONE') continue
  if (p.status === 'NEW') {
    md.push(`### \`${f}\` — NEW`, '', `- title "${p.title}"; sheets ${p.sheets.join(', ') || '-'}; scripts ${p.scripts.join(', ') || '-'}; sections ${p.sections.map((s) => s.key).join(' > ')}`, '')
    continue
  }
  md.push(`### \`${f}\` — ${p.status}`, '')
  for (const c of p.head) md.push(`- head: ${c}`)
  for (const c of p.body) md.push(`- body: ${c}`)
  if (!p.head.length && !p.body.length) md.push('- whitespace only')
  md.push('')
}
md.push(`## CSS`, '')
for (const ls of report.css.linkSets) md.push(`- ${ls.pages} page(s) link: ${ls.sheets} (e.g. \`${ls.example}\`)`)
if (report.css.bundled) {
  md.push(`- **bundled per page** with \`SOURCE:\` banners: ${report.css.bundled.sources.join(', ')}`)
  md.push(report.css.bundled.disagreements.length ? `- **DISAGREEMENTS between pages**: ${report.css.bundled.disagreements.join('; ')}` : `- every page's copy of each source is rule-identical (the bundles are one shared set)`)
}
for (const [s, r] of Object.entries(report.css.sources)) {
  md.push(`- \`${s}\`: ${r.status} (${r.rules} rules)`)
  if (r.status === 'CHANGED') {
    for (const l of r.removed) md.push(`    - \`${l.slice(0, 160)}\``)
    for (const l of r.added) md.push(`    + \`${l.slice(0, 160)}\``)
    if (r.more) md.push(`    … ${r.more} more`)
  }
}
if (report.css.droppedSheets.length) md.push(`- baseline sheets no longer linked by any page: ${report.css.droppedSheets.join(', ')}`)
md.push('', `## Scripts, data and media`, '')
const assetChanges = Object.entries(report.assets)
md.push(assetChanges.length ? assetChanges.map(([f, s]) => `- \`${f}\`: ${s}`).join('\n') : '- byte-identical to the baseline')
md.push('', `## Version Control`, '', `Follows [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md). Generated file; regenerate rather than edit.`, '')

fs.writeFileSync(path.join(HANDOFF, `intake-${label}.md`), md.join('\n'))
fs.writeFileSync(path.join(HANDOFF, `intake-${label}.json`), JSON.stringify(report, null, 1) + '\n')
console.log(md.join('\n'))
console.log(`\nwritten: client-handoff/intake-${label}.md (+ .json)`)
