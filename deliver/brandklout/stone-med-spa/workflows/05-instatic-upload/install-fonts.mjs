#!/usr/bin/env node
/**
 * Install Cormorant Garamond and Inter into the Instatic site's font library.
 *
 * WHY THIS EXISTS, AND WHY IT IS NOT THE NAHLAH FILE. The Nahlah build has a
 * script of the same name for Playfair Display and Raleway; the families and
 * the weights are the whole content of these files, so sharing one would mean a
 * flag and a lookup table for two lines of data. This is the Stone list.
 *
 * WHAT PROBLEM IT SOLVES. The static build SELF-HOSTS both typefaces:
 * `site-src/get-fonts.mjs` downloads seven cuts into `assets/fonts/` and
 * `css/03-fonts.css` declares them with `url("fonts/<file>.woff2")`, relative to
 * `assets/` where site.css is served from. On Instatic there is no `assets/`
 * directory and no place to put one: the media library is `/uploads/<id>-<name>`
 * and `build-import-input.mjs` refuses a payload with any unrewritten
 * `assets/...` reference, which is how this was caught rather than shipped.
 *
 * `POST /admin/api/cms/fonts/install` is Instatic's own answer. It downloads the
 * woff2 files server-side, serves them from `/uploads/fonts/` (same-origin, so
 * the published `default-src 'self'` CSP is happy) and records a FontEntry in
 * `site.settings.fonts.items`, from which the publisher emits the `@font-face`
 * rules. So `03-fonts.css` is EXCLUDED from the CSS payload and Instatic's own
 * declarations take its place. See build-import-input.mjs, which drops it.
 *
 * > [!IMPORTANT]
 * > The `font-family` VALUE matching is not evidence of anything. Every
 * > `font-family: var(--font-display)` resolves to "Cormorant Garamond, ..."
 * > whether the face loaded or not; the fallback is Georgia and the page looks
 * > plausible. `verify-live.mjs` has to check `document.fonts`, which is the
 * > only thing that knows. Same trap as the local `all-pages.mjs` check.
 *
 * The seven cuts below are exactly what `css/03-fonts.css` declares, which is
 * exactly what the stylesheets use. Installing the full families would be
 * megabytes of woff2 for weights no rule asks for.
 *
 *   node install-fonts.mjs           # show what would be installed
 *   node install-fonts.mjs --apply
 */
import { api, getSite, saveShell, login } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const WANTED = [
  // 300 sets every display line, 400 the mid-weight headings, 400italic the
  // accented half of a two-part display line (`.display-accent`), 600 the year
  // grid's row names (BugHerd #6, 2026-09-23).
  { family: 'Cormorant Garamond', variants: ['300', '400', '600', '400italic'] },
  // 400 body, 500 eyebrows and labels, 600 the self-check's active layer, 700
  // the button labels.
  { family: 'Inter', variants: ['400', '500', '600', '700'] },
]
// latin only. The site is one practice in Texas and latin-ext doubles the bytes
// for glyphs no page contains.
const SUBSETS = ['latin']

const apply = process.argv.includes('--apply')
await login()

const { families } = await api('GET', '/admin/api/cms/fonts/google')
const byName = new Map(families.map((f) => [f.family, f]))
for (const want of WANTED) {
  const found = byName.get(want.family)
  if (!found) throw new Error(`${want.family} is not in the bundled Google Fonts directory`)
  const missing = want.variants.filter((v) => !found.variants.includes(v))
  if (missing.length) throw new Error(`${want.family}: the directory has no ${missing.join(', ')}`)
  console.log(`${want.family}: ${want.variants.join(', ')}`)
}

if (!apply) {
  console.log('\ndry run. re-run with --apply')
  process.exit(0)
}

const installed = []
for (const want of WANTED) {
  const res = await api('POST', '/admin/api/cms/fonts/install', { ...want, subsets: SUBSETS })
  const fe = res.font ?? res.entry ?? res
  console.log(`installed  ${fe.family}: ${fe.files?.length ?? 0} files`)
  installed.push(fe)
}

/* The install endpoint writes the woff2 files to disk. The LIBRARY, which is
   what the publisher reads to emit @font-face, lives on the shell, so the
   entries have to be saved onto it separately.

   `saveShell(shell, seq)` — THE SEQ IS NOT OPTIONAL. Called without it the API
   answers `400 Invalid request body`, which reads like a malformed payload and
   is actually a missing optimistic-concurrency token. Cost twenty minutes here;
   the Nahlah script has always passed it. */
const { site: shell, seq } = await getSite()
const settings = shell.settings ?? (shell.settings = {})
const fonts = settings.fonts ?? (settings.fonts = { items: [] })
fonts.items = fonts.items ?? []
for (const fe of installed) {
  const at = fonts.items.findIndex((f) => f.family === fe.family)
  if (at >= 0) fonts.items[at] = fe
  else fonts.items.push(fe)
}
const saved = await saveShell(shell, seq)
const { site: after } = await getSite()
console.log(`saved — seq ${seq} -> ${saved.seq}`)
console.log('library now:', (after.settings?.fonts?.items ?? []).map((f) => `${f.family} (${f.files?.length ?? 0} files)`).join(', ') || '(none)')
