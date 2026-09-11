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
const SITE = path.resolve(HERE, '../04-design/.tmp/site-src')
const FINAL = path.join(SITE, 'dist')
const TMP = path.join(HERE, '.tmp')

const mediaMap = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map.json'), 'utf8')).map
const seo = JSON.parse(fs.readFileSync(path.join(SITE, 'seo.json'), 'utf8'))

/* ONE PAGE. West LA Implants is a single scrolling document — eight chapters
   in one `index.html`, with every link on it an in-page `#anchor`, a `tel:` or
   an off-site URL. There is nothing to rewrite from a filename to a slug and
   nothing else to import.

   > [!WARNING]
   > This list IS the site, and trap 8 is the reason that matters. In replace
   > mode any stored page absent from `changedPages` is DELETED server-side.
   > Removing a line here deletes a live page.
   >
   > `index` must be the first slug because setup already created a page at
   > that slug and this overwrites it rather than duplicating it.

   `title` is the CMS page label in the admin list; the browser <title> comes
   from seo.json via `seoTitle` below (trap 6). */
const PAGES = [{ file: 'index.html', slug: 'index', title: 'Home' }]

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

  // 0b. The six vendored GSAP tags. This build loads gsap, ScrollTrigger,
  //     ScrollToPlugin, ScrollSmoother, SplitText and Observer out of
  //     `assets/gsap/` in <head>, deliberately — Instatic publishes with
  //     `script-src 'self'`, so a CDN is not an option and there is no
  //     custom-head field to put one in. An Instatic site has exactly ONE
  //     script asset, so push-site.mjs concatenates all six ahead of
  //     `assets/site.js` into it, IN THAT ORDER. `importHtml` would strip these
  //     tags anyway; removing them here stops step 1 looking for them in the
  //     media map.
  out = out.replace(/[ \t]*<script[^>]+src="assets\/gsap\/[^"]+"[^>]*><\/script>\s*\n?/g, '')

  // 1. Media sources -> media library paths.
  //
  //    NOT just `src`. This build's two <video> elements carry `poster`,
  //    `data-src` and `data-src-mobile` — the boot script copies data-src into
  //    src at runtime, because an importer keeps ATTRIBUTES but not <source>
  //    children — and any of the three left pointing at `media/…` 404s on the
  //    published page exactly as an unrewritten <img> would, except that a
  //    video that never loads looks like a poster frame by design.
  out = out.replace(/(src|href|poster|data-src|data-src-mobile)="(media\/[^"]+)"/g, (whole, attr, name) => {
    const hit = mediaMap[name]
    if (!hit) {
      problems.push(`${file}: no media-map entry for ${name}`)
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

  // Anything still pointing into assets/ or media/ would 404 once published.
  for (const m of out.matchAll(/"(assets|media|fonts)\/([^"]+)"/g)) {
    problems.push(`${file}: unrewritten reference to ${m[1]}/${m[2]}`)
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

/* The stylesheet, MINUS the three @font-face rules — WHICH ARE NOT DISCARDED.
   THIS IS WHERE WEST LA IMPLANTS DIVERGES FROM THE MED SPA.

   The sibling excised its @font-face block and asserted none survived, because
   its typefaces went into Instatic's OWN font library (`install-fonts.mjs`) and
   the publisher emitted the rules itself. That is not available here: Instatic's
   installer downloads Google's STATIC instances and silently ignores
   `font-variation-settings`, and all three faces on this build are VARIABLE
   woff2 — `font-weight: 400 900` on Bodoni Moda, `200 800` on Manrope, and an
   `opsz` axis that `.display` and `.h2` set by hand. Installed statically the
   headline loses its optical size and every weight between the named cuts.

   So the woff2 files are uploaded as ORDINARY MEDIA (`font/woff2` is an
   accepted mime — see upload-media.mjs) and the three @font-face blocks travel
   in the TOKEN CODE ASSET instead, with `url('../fonts/x.woff2')` rewritten to
   the uploaded `/uploads/…` path. push-site.mjs does that; this file only has to
   keep them OUT of the registry payload, because happy-dom's `cssToStyleRules`
   has no representation for an at-rule that is not a class and would drop them
   without a word — and A DEAD @font-face IS NOT A VISIBLE ERROR: the family
   name still resolves and the browser falls back to Georgia.

   Cut by the rules themselves rather than by a source-file banner: this
   bundler's banner is `/* ==== 01-tokens.css ==== *​/` and the faces share that
   file with the tokens, so there is no block to slice. The count is asserted
   both ways — three found, none left — so a change in either direction is a
   refusal rather than a silent no-op. */
const cssBundle = fs.readFileSync(path.join(FINAL, 'assets', 'site.css'), 'utf8')
const EXPECT_FONT_FACES = 3
let css = cssBundle.replace(/@font-face\s*\{[^}]*\}/g, '')
const fontFaces = (cssBundle.match(/@font-face/g) ?? []).length
const fontFacesLeft = (css.match(/@font-face/g) ?? []).length
if (fontFaces !== EXPECT_FONT_FACES) {
  problems.push(
    `site.css: ${fontFaces} @font-face rule(s), expected ${EXPECT_FONT_FACES}. ` +
      `push-site.mjs carries exactly the ones it finds in 01-tokens.css into the token asset — check they match.`,
  )
}
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
    `${fontFaces} @font-face rule(s), which push-site.mjs carries into the token code asset instead)`,
)
console.log(`payload ${(payload.length / 1024).toFixed(1)}KB -> gz ${(gz.length / 1024).toFixed(1)}KB -> b64 ${(gz.toString('base64').length / 1024).toFixed(1)}KB`)
