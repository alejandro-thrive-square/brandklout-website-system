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
const SITE = path.resolve(HERE, '../04-design/.tmp/surgical-arts')
const FINAL = path.join(SITE, 'final-site')
const TMP = path.join(HERE, '.tmp')

const mediaMap = JSON.parse(fs.readFileSync(path.join(TMP, 'media-map.json'), 'utf8')).map
const seo = JSON.parse(fs.readFileSync(path.join(SITE, 'site-src', 'seo.json'), 'utf8'))

/* ONE PAGE, since 2026-09-01. The client kept the home page; the other
   seventeen were deleted from the static build, and `treatments-data.mjs` --
   the collection the twelve treatment rows were derived from -- went with them.
   This file used to import it.

   > [!WARNING]
   > This list IS the site, and trap 8 is the reason that matters. In replace
   > mode any stored page absent from `changedPages` is DELETED server-side.
   > The live instance still holds eighteen pages; the next apply leaves TWO.
   > Sixteen are removed, and the neck lift is rewritten from the v1 design to
   > the journey one at the same slug. That is the intended outcome, and it is
   > irreversible from here, so confirm it is wanted before running --apply.

   Slug order still matters: `index` must exist first, because setup already
   created a page at that slug and it is the one we overwrite rather than
   duplicate. */
const PAGES = [
  { file: 'index.html', slug: 'index', title: 'Home' },
  { file: 'neck-lift.html', slug: 'neck-lift', title: 'Neck Lift' },
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

const css = fs.readFileSync(path.join(FINAL, 'assets', 'site.css'), 'utf8')

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
console.log(`css:   ${(css.length / 1024).toFixed(1)}KB`)
console.log(`payload ${(payload.length / 1024).toFixed(1)}KB -> gz ${(gz.length / 1024).toFixed(1)}KB -> b64 ${(gz.toString('base64').length / 1024).toFixed(1)}KB`)
