/**
 * Step 2 — assemble the single payload the container-side converter consumes.
 *
 * Produces `.tmp/import-input.json.gz`:
 *   { css, pages: [{ slug, title, seoTitle, seoDescription, html }] }
 *
 * Three transformations happen here, all of them because the static build and
 * an Instatic document disagree about what a page IS:
 *
 * 1. **Image srcs are rewritten to media-library paths.** `assets/x.webp`
 *    becomes `/uploads/<id>-x.webp` from `.tmp/media-map.json`. Two of them
 *    also change extension, because AVIF cannot be uploaded here at all — see
 *    upload-media.mjs. An unrewritten src is a hard error: importing a page
 *    with a dangling image is worse than not importing it.
 *
 * 2. **The stylesheet and script links are dropped.** `site.css` becomes
 *    registry rules and `site.js` becomes a code asset; leaving the tags in
 *    would either 404 or load a second copy. `importHtml` strips <script>
 *    itself, but the <link> would survive.
 *
 * 3. **The whole document is passed, not just <body>.** `importHtml` reads
 *    `doc.body`, so head content is dropped for free — which is what we want,
 *    since title/description travel as page cells instead.
 *
 * Usage: node build-import-input.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
// Written by prepare-source.mjs from Sang's single HTML file.
const SITE = path.resolve(HERE, '.tmp/site')
const FINAL = path.join(SITE, 'final-site')
const TMP = path.join(HERE, '.tmp')

// Brandklout's page has no images, so upload-media.mjs has nothing to do and there may be no
// map. Any `assets/` reference that does appear is still refused below.
const mediaMapFile = path.join(TMP, 'media-map.json')
const mediaMap = fs.existsSync(mediaMapFile) ? JSON.parse(fs.readFileSync(mediaMapFile, 'utf8')).map : {}
const seo = JSON.parse(fs.readFileSync(path.join(SITE, 'site-src', 'seo.json'), 'utf8'))

/* ELEVEN PAGES — the second build, one per subtask on Asana task
   1218112701145002. Written out by hand rather than derived from the
   filesystem, and that is deliberate: see the warning.

   > [!WARNING]
   > This list IS the site, and trap 8 is the reason that matters. In replace
   > mode any stored page absent from `changedPages` is DELETED server-side.
   > Removing a line here deletes a live page. On the sibling instance a cut
   > from eighteen pages to two happened exactly that way and was not
   > reversible from this side.
   >
   > **Adding a line is safe.** Every line below is an addition on this
   > instance: it was provisioned on 2026-09-04 and had never been published
   > to, so the first apply creates all eleven.

   Slug order still matters: `index` must exist first, because setup already
   created a page at that slug and it is the one we overwrite rather than
   duplicate.

   `title` is the CMS page label the editor shows in its page list, not the
   browser title — the <title> comes from seo.json via `seoTitle` below.

   The six remaining treatment dossiers get a line each the day they are built.
   `botox` is the only one so far and it is the template for the rest. */
// Brandklout phase 1: Sang's one page. (The comment above is the sibling's; the warning in it
// still holds — in replace mode a slug missing from this list is deleted.)
const PAGES = [
  { file: 'index.html', slug: 'index', title: 'Home' },
]

const problems = []

function rewrite(html, file) {
  let out = html

  // 0. Drop HTML comments before anything else looks at the text.
  //
  //    They are authoring notes for the repo, not content for a CMS, and
  //    `importHtml` discards them anyway. Stripping first also stops the
  //    integrity check below from firing on them: a page body can carry a
  //    commented-out worked example that references an asset which
  //    deliberately does not exist, and the check would read the comment as a
  //    broken reference.
  out = out.replace(/<!--[\s\S]*?-->/g, '')

  // 0b. Drop the two <head> references that have no Instatic equivalent, before
  //     step 1 goes looking for them in the media map.
  //
  //     vendor.js. The static build emits GSAP as a SEPARATE bundle that only
  //     pages with `motion: true` request, so the neck lift page never
  //     downloads 122KB it does not use. Instatic has ONE script asset for the
  //     whole site, so that split cannot survive the import: push-site.mjs
  //     concatenates the vendor bundle ahead of site.js into the single asset
  //     and both published pages carry it. The split still earns its keep in
  //     the static build and on any host that serves the files as they are.
  out = out.replace(/[ \t]*<script[^>]+src="assets\/vendor\.js"[^>]*><\/script>\s*\n?/g, '')

  //     The font preloads. The static build self-hosts both typefaces out of
  //     `assets/fonts/` and preloads the two cuts that set the headline and the
  //     body copy. There is no `assets/` on Instatic to preload FROM: the fonts
  //     are installed into Instatic's own library by install-fonts.mjs, served
  //     from `/uploads/fonts/`, and the publisher emits the @font-face rules
  //     itself. A preload pointing at a path that does not exist is a console
  //     error and a wasted round trip.
  out = out.replace(/[ \t]*<link[^>]+rel="preload"[^>]+href="assets\/fonts\/[^"]+"[^>]*>\s*\n?/g, '')

  // 1. Image sources -> media library paths.
  out = out.replace(/(src|href)="assets\/([^"]+)"/g, (whole, attr, name) => {
    if (name === 'site.css' || name === 'site.js') return whole // handled below
    const hit = mediaMap[name]
    if (!hit) {
      problems.push(`${file}: no media-map entry for assets/${name}`)
      return whole
    }
    return `${attr}="${hit.url}"`
  })

  // 1b. Internal links: `treatments.html#face` -> `/treatments#face`.
  //
  //     The static build links page-to-page by filename because it is opened
  //     from disk. Instatic routes by slug and serves nothing at `.html`:
  //     `/treatments.html` is a hard 404 while `/treatments` is the page. Left
  //     unrewritten, EVERY internal link on the site is broken — nav, drawer,
  //     footer ribbon, category cards, every CTA — while each page in
  //     isolation looks perfect, which is exactly how it got missed the first
  //     time. `index.html` maps to `/`, not `/index`.
  out = out.replace(/href="([a-z0-9-]+)\.html(#[^"]*)?"/g, (_whole, page, frag) => {
    const target = page === 'index' ? '/' : `/${page}`
    return `href="${target}${frag ?? ''}"`
  })

  // 2. Drop the bundle links; both become site-level assets instead.
  out = out.replace(/[ \t]*<link[^>]+href="assets\/site\.css"[^>]*>\s*\n?/g, '')
  out = out.replace(/[ \t]*<script[^>]+src="assets\/site\.js"[^>]*><\/script>\s*\n?/g, '')

  // Anything still pointing into assets/ would 404 once published.
  for (const m of out.matchAll(/"assets\/([^"]+)"/g)) {
    problems.push(`${file}: unrewritten reference to assets/${m[1]}`)
  }
  return out
}

const pages = PAGES.map((p) => {
  const raw = fs.readFileSync(path.join(FINAL, p.file), 'utf8')
  const d = seo.pages[p.slug] ?? {}
  return {
    slug: p.slug,
    title: p.title,
    seoTitle: d.title ?? '',
    seoDescription: d.description ?? '',
    html: rewrite(raw, p.file),
  }
})

/* The stylesheet, MINUS the self-hosted @font-face block.

   `css/03-fonts.css` declares seven cuts with `url("fonts/<file>.woff2")`,
   relative to `assets/` where site.css is served from in the static build.
   There is no `assets/` on Instatic and nowhere to make one. The fonts live in
   Instatic's own library instead (see install-fonts.mjs) and the publisher
   emits its own @font-face rules from there.

   Shipping this block as well would put seven dead `url()`s into the style
   registry, and A DEAD @font-face IS NOT A VISIBLE ERROR: the family name still
   resolves, the browser falls back to Georgia, and the page looks plausible and
   wrong. That is the same trap install-fonts.mjs warns about.

   The bundle carries one banner per source file, so the block is delimited by
   its own banner and the next one. Both edges are asserted rather than assumed:
   a bundler that stops emitting banners would otherwise make this excision
   silently do nothing, or take the whole rest of the file. */
const cssBundle = fs.readFileSync(path.join(FINAL, 'assets', 'site.css'), 'utf8')
const FONT_BANNER = '/* ===== css/03-fonts.css ===== */'
const BANNER_NEXT = '/* ===== css/'
const fontStart = cssBundle.indexOf(FONT_BANNER)
const fontEnd = fontStart < 0 ? -1 : cssBundle.indexOf(BANNER_NEXT, fontStart + FONT_BANNER.length)
const hasFontFace = /@font-face/.test(cssBundle)
if (fontStart < 0 && !hasFontFace) {
  // Nothing to excise: the page loads its fonts from Google, and install-fonts.mjs puts the
  // same families into Instatic's library. The survived-@font-face check below still runs.
} else if (fontStart < 0) {
  problems.push('site.css: no css/03-fonts.css banner. The bundler changed shape and the @font-face excision is doing nothing')
} else if (fontEnd < 0) {
  problems.push('site.css: css/03-fonts.css is the last block, so the excision would take the rest of the file')
}
let css =
  fontStart >= 0 && fontEnd > fontStart ? cssBundle.slice(0, fontStart) + cssBundle.slice(fontEnd) : cssBundle
const fontFaces = (cssBundle.match(/@font-face/g) ?? []).length
const fontFacesLeft = (css.match(/@font-face/g) ?? []).length
if (fontFacesLeft) {
  problems.push(`site.css: ${fontFacesLeft} @font-face rule(s) survived the excision`)
}

/* --- CSS url() -> media library ------------------------------------------
   FOUND ON THE PUBLISHED SITE, 2026-09-01, by reading the network log rather
   than by anything failing.

   `.stone-panel` and `.stone-band` reference their marble with
   `url("tex-carrara.webp")` and `url("tex-marble-dark.webp")`. In the static
   build that resolves correctly because site.css is served FROM `assets/`,
   which is where the files are. Instatic publishes the registry at
   `/_instatic/css/`, so the same relative url() asked for
   `/_instatic/css/tex-carrara.webp` and got a 404 on every published page.

   > [!IMPORTANT]
   > **A 404 BACKGROUND IMAGE IS INVISIBLE.** `.stone-panel` also sets
   > `background-color: var(--ivory)` and `.stone-band` sets `#1c1b19`, so a
   > missing texture leaves a flat panel that looks like a deliberate flat
   > panel. Nothing fails, nothing warns, and `verify-live.mjs` was happy: it
   > checks the assets the MARKUP references and these are only in CSS. This is
   > the third time this site has lost its marble to a url() resolution and the
   > second time it took a screenshot or a network log to notice — see the CSS
   > note in HANDOFF.md.

   Rewritten against the same media map the markup uses. The CHECK below runs on
   a comment-stripped copy: `38-cta.css` carries the previous incident in a
   comment, quoting the old broken path verbatim, and a check that reads its own
   notes back as failures is useless. */
css = css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, q, ref) => {
  if (/^(data:|https?:|\/)/.test(ref)) return whole
  const hit = mediaMap[ref]
  if (!hit) return whole // reported below, after comments are stripped
  return `url("${hit.url}")`
})
{
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
  for (const m of bare.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    const ref = m[2]
    if (/^(data:|https?:|\/)/.test(ref)) continue
    problems.push(`site.css: url(${ref}) has no media-map entry and would 404 once published`)
  }
}

if (problems.length) {
  console.error('REFUSING to build the payload:\n  ' + problems.join('\n  '))
  process.exit(1)
}

const payload = JSON.stringify({ css, pages })
const gz = zlib.gzipSync(Buffer.from(payload, 'utf8'), { level: 9 })
fs.writeFileSync(path.join(TMP, 'import-input.json.gz'), gz)
fs.writeFileSync(path.join(TMP, 'import-input.b64'), gz.toString('base64'))

console.log(`pages: ${pages.length}`)
for (const p of pages) console.log(`  ${p.slug.padEnd(18)} ${(p.html.length / 1024).toFixed(1)}KB  "${p.seoTitle.slice(0, 54)}"`)
console.log(
  `css:   ${(css.length / 1024).toFixed(1)}KB  (${(cssBundle.length / 1024).toFixed(1)}KB bundle, less ` +
    `${fontFaces} @font-face rule(s); Instatic emits its own, see install-fonts.mjs)`,
)
console.log(`payload ${(payload.length / 1024).toFixed(1)}KB -> gz ${(gz.length / 1024).toFixed(1)}KB -> b64 ${(gz.toString('base64').length / 1024).toFixed(1)}KB`)
