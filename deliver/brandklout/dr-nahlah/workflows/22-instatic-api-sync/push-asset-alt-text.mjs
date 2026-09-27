#!/usr/bin/env node
/**
 * Write alt text onto the media-library assets the site actually renders.
 *
 * Why the library and not the page tree: `base.image`'s render() reads
 * `alt` EXCLUSIVELY from the resolved library asset —
 *
 *     const alt = escapeHtml(media?.altText?.trim() ?? '')
 *
 * — never from a per-instance module prop. One row here changes every
 * `<img>` on every page that renders that asset.
 *
 * That is also the constraint that makes this job awkward. The design
 * package (`04-design/.tmp/final-site`) authored alt PER INSTANCE, so the
 * same photo carries different alt on different pages. Instatic has one
 * slot per asset, so each collision has to collapse to a single value.
 * `.tmp/alt-overrides.json` records every one of those calls by hand,
 * alongside the cases where the package's alt was checked against the
 * actual image and found wrong (office-hero is a lounge, not a reception;
 * office-wide is an overhead light, not a treatment floor; tech-hero is
 * the lab bench, not a cone-beam scan).
 *
 * Scope: assets REFERENCED by a page tree or the shell. The library also
 * holds ~200 orphaned migration uploads that no page renders; writing alt
 * onto those changes no published byte, so they are left alone and
 * reported.
 *
 * Never overwrites alt text that is already present.
 *
 *   node push-asset-alt-text.mjs            # dry run, prints the table
 *   node push-asset-alt-text.mjs --apply
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, getSite, getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '.tmp')
const PACKAGE_SITE = join(HERE, '..', '04-design', '.tmp', 'final-site')
const APPLY = process.argv.includes('--apply')

// ── 1. the library ─────────────────────────────────────────────────────────
const assets = (await api('GET', '/admin/api/cms/media')).assets ?? []
const byId = new Map(assets.map((a) => [a.id, a]))

// ── 2. what the site actually references ───────────────────────────────────
// An asset can be reached by id (module media prop) or by publicPath (a CSS
// background in styleRules, a poster on the shell). Both count as "used".
const pages = (await getPages()).rows
const { site } = await getSite()
const usage = new Map()
const scan = (text, where) => {
  for (const a of assets) {
    if (text.includes(a.id) || (a.publicPath && text.includes(a.publicPath))) {
      if (!usage.has(a.id)) usage.set(a.id, new Set())
      usage.get(a.id).add(where)
    }
  }
}
for (const p of pages) scan(JSON.stringify(p.cells?.body ?? {}), p.slug)
scan(JSON.stringify({ styleRules: site.styleRules, settings: site.settings, files: site.files }), '(shell)')

// ── 3. alt text authored in the design package, per filename ───────────────
const authored = new Map()   // filename -> Map(alt -> count)
for (const f of readdirSync(PACKAGE_SITE).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(join(PACKAGE_SITE, f), 'utf8')
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const src = m[0].match(/\bsrc="([^"]*)"/)?.[1]
    let alt = m[0].match(/\balt="([^"]*)"/)?.[1]
    if (!src || !alt?.trim()) continue
    // The package's HTML is escaped output; the library stores plain text and
    // the publisher escapes on the way out. Decode, or every `&` ships as `&amp;`.
    alt = alt.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    const base = decodeURIComponent(src.split('/').pop())
    if (!authored.has(base)) authored.set(base, new Map())
    const c = authored.get(base)
    c.set(alt, (c.get(alt) ?? 0) + 1)
  }
}

const overrides = JSON.parse(readFileSync(join(TMP, 'alt-overrides.json'), 'utf8'))

/** One alt value for one asset, or null when nothing can be resolved. */
function altFor(asset) {
  if (overrides[asset.filename]) return { alt: overrides[asset.filename], src: 'override' }
  const c = authored.get(asset.filename)
  if (!c) return null
  const ranked = [...c.entries()].sort((a, b) => b[1] - a[1])
  // A tie means the package disagreed with itself and no override was written
  // for it — refuse rather than pick arbitrarily.
  if (ranked.length > 1 && ranked[0][1] === ranked[1][1]) return null
  return { alt: ranked[0][0], src: 'package' }
}

// ── 4. plan ────────────────────────────────────────────────────────────────
const writes = [], skipped = [], unresolved = []
for (const [id, pagesUsing] of usage) {
  const a = byId.get(id)
  if (a.altText?.trim()) { skipped.push(a); continue }
  const got = altFor(a)
  if (!got) { unresolved.push({ a, pages: [...pagesUsing] }); continue }
  writes.push({ id, filename: a.filename, alt: got.alt, src: got.src, pages: [...pagesUsing] })
}

console.log(`library assets      : ${assets.length}`)
console.log(`referenced by site  : ${usage.size}`)
console.log(`  already have alt  : ${skipped.length}`)
console.log(`  to write          : ${writes.length}  (${writes.filter(w => w.src === 'override').length} hand-authored, ${writes.filter(w => w.src === 'package').length} from the design package)`)
console.log(`  unresolved        : ${unresolved.length}`)
console.log(`unreferenced (left alone): ${assets.length - usage.size}`)

if (unresolved.length) {
  console.log('\n--- UNRESOLVED (no alt written) ---')
  for (const u of unresolved) console.log(`  ${u.a.filename}  [${u.pages.join(',')}]`)
}
console.log('\n--- PLANNED WRITES ---')
for (const w of writes.sort((a, b) => a.filename.localeCompare(b.filename))) {
  console.log(`  ${w.src === 'override' ? '*' : ' '} ${w.filename.padEnd(38)} ${JSON.stringify(w.alt)}`)
}

mkdirSync(TMP, { recursive: true })
writeFileSync(join(TMP, 'alt-plan.json'), JSON.stringify(writes, null, 2))

if (!APPLY) { console.log('\ndry run — re-run with --apply'); process.exit(0) }

// ── 5. apply ───────────────────────────────────────────────────────────────
let ok = 0, failed = []
for (const w of writes) {
  try {
    await api('PATCH', `/admin/api/cms/media/${w.id}`, { altText: w.alt })
    ok++
    if (ok % 25 === 0) console.log(`  … ${ok}/${writes.length}`)
  } catch (e) {
    failed.push({ ...w, error: e.message })
  }
}
console.log(`\nwritten: ${ok}/${writes.length}`)
if (failed.length) {
  console.log('FAILED:')
  for (const f of failed) console.log(`  ${f.filename}: ${f.error}`)
}

// ── 6. verify from a fresh read ────────────────────────────────────────────
const after = new Map(((await api('GET', '/admin/api/cms/media')).assets ?? []).map((a) => [a.id, a]))
const bad = writes.filter((w) => after.get(w.id)?.altText !== w.alt)
console.log(bad.length ? `VERIFY FAILED on ${bad.length}` : `verified: all ${writes.length} read back exactly`)
for (const b of bad) console.log(`  ${b.filename}: want ${JSON.stringify(b.alt)} got ${JSON.stringify(after.get(b.id)?.altText)}`)
process.exit(failed.length || bad.length ? 1 : 0)
