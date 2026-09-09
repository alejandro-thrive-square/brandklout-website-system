#!/usr/bin/env node
/**
 * Install the design's web fonts into the site library.
 *
 * The coded build pulls Playfair Display and Raleway from Google Fonts with a
 * `<link>` in `<head>`. Instatic's importer drops external `<link>` tags, and
 * even if it did not, the published CSP (`default-src 'self'`, no `font-src`)
 * blocks fonts.googleapis.com and fonts.gstatic.com outright. So every heading
 * on the published site has been falling back to Times New Roman while the
 * local build renders Playfair Display — a difference no structural diff shows,
 * because the `font-family` VALUE matches; only the rendered metrics differ.
 *
 * `POST /admin/api/cms/fonts/install` downloads the woff2 files and serves them
 * from `/uploads/fonts/`, which is same-origin and therefore CSP-clean. The
 * returned FontEntry goes into `site.settings.fonts.items`, and the publisher
 * emits the `@font-face` rules from there.
 *
 *   node install-fonts.mjs           # show what would be installed
 *   node install-fonts.mjs --apply
 */
import { api, getSite, saveShell } from './insta-api.mjs'

// Exactly the weights the build's Google Fonts URL requests.
const WANTED = [
  { family: 'Playfair Display', variants: ['400', '500', '600', '700', '400italic', '500italic'] },
  { family: 'Raleway', variants: ['300', '400', '500', '600', '700'] },
]
const SUBSETS = ['latin', 'latin-ext']

const apply = process.argv.includes('--apply')

const { families } = await api('GET', '/admin/api/cms/fonts/google')
const byName = new Map(families.map((f) => [f.family, f]))
for (const want of WANTED) {
  const found = byName.get(want.family)
  if (!found) throw new Error(`${want.family} is not in the bundled Google Fonts directory`)
  const missing = want.variants.filter((v) => !found.variants.includes(v))
  if (missing.length) console.warn(`  ! ${want.family}: directory has no ${missing.join(', ')}`)
  want.variants = want.variants.filter((v) => found.variants.includes(v))
  console.log(`${want.family}: ${want.variants.length} variants`)
}

if (!apply) {
  for (const w of WANTED) {
    const est = await api('POST', '/admin/api/cms/fonts/estimate', { ...w, subsets: SUBSETS })
    console.log(`  ${w.family}: ~${Math.round((est.bytes ?? est.totalBytes ?? 0) / 1024)} KB`)
  }
  console.log('\nDRY RUN — re-run with --apply')
  process.exit(0)
}

const installed = []
for (const w of WANTED) {
  const entry = await api('POST', '/admin/api/cms/fonts/install', { ...w, subsets: SUBSETS })
  const fe = entry.font ?? entry.entry ?? entry
  console.log(`installed ${fe.family}: ${fe.files?.length ?? 0} files`)
  installed.push(fe)
}

// The install endpoint writes files to disk; the library lives on the shell, so
// the entries still have to be saved onto it.
const { site: shell, seq } = await getSite()
const settings = shell.settings ?? (shell.settings = {})
const fonts = settings.fonts ?? (settings.fonts = { items: [] })
fonts.items = fonts.items ?? []
for (const fe of installed) {
  const at = fonts.items.findIndex((f) => f.family === fe.family)
  if (at >= 0) fonts.items[at] = fe
  else fonts.items.push(fe)
}
const res = await saveShell(shell, seq)
const { site: after } = await getSite()
console.log(`saved — seq ${seq} -> ${res.seq}`)
console.log('library now:', (after.settings?.fonts?.items ?? []).map((f) => `${f.family} (${f.files.length} files)`).join(', '))
