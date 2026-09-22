"""One-off, 2026-09-22: retarget the upload toolkit from one page to the
multi-page dist. Kept for the record; each edit is described in
21-instatic-upload.md. Idempotent (asserts on the old text)."""
import io, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

def patch(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for old, new in pairs:
        assert old in s, (path, old[:60])
        s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', path)

# ---- build-import-input.mjs -------------------------------------------------
s = io.open('build-import-input.mjs', encoding='utf-8').read()
a = s.index('/* ONE PAGE. West LA Implants is a single scrolling document')
b = s.index('const problems = []')
head_new = r'''/* EVERY PAGE IN dist/, derived rather than listed. The site was one page
   from 2026-09-10 to 2026-09-22 and is eighty from then on (34 designed pages
   plus the 46-entry journal under blog/). A hand-kept list here goes blind
   the day a page is added, so the list IS the build: every .html under dist,
   recursively, with the slug taken from its path (`blog/x.html` -> `blog/x`).

   > [!WARNING]
   > This list IS the site, and trap 8 is the reason that matters. In replace
   > mode any stored page absent from `changedPages` is DELETED server-side.
   > A page missing from dist/ is deleted live on the next --force push.
   >
   > `index` must be first: setup created a page at that slug and this
   > overwrites it rather than duplicating it.

   `title` is the CMS page label in the admin list; the browser <title> comes
   from seo.json via `seoTitle` below (trap 6). */
const walk = (dir, pre = '') =>
  fs
    .readdirSync(dir)
    .flatMap((e) =>
      fs.statSync(path.join(dir, e)).isDirectory()
        ? walk(path.join(dir, e), pre + e + '/')
        : e.endsWith('.html')
          ? [{ file: pre + e, slug: pre + e.replace(/\.html$/, '') }]
          : [],
    )
const PAGES = walk(FINAL)
  .sort((a, b) => (a.slug === 'index' ? -1 : b.slug === 'index' ? 1 : a.slug.localeCompare(b.slug)))
  .map((p) => ({ ...p, title: p.slug === 'index' ? 'Home' : p.slug.replace(/^blog\//, 'Journal: ').replace(/-/g, ' ') }))
if (PAGES[0]?.slug !== 'index') throw new Error('dist/index.html is missing — build first')

'''
s = s[:a] + head_new + s[b:]
io.open('build-import-input.mjs', 'w', encoding='utf-8', newline='\n').write(s)
patch('build-import-input.mjs', [
    (r'''  out = out.replace(/(src|href|poster|data-src|data-src-mobile)="(media\/[^"]+)"/g, (whole, attr, name) => {
    const hit = mediaMap[name]''',
     r'''  // Paths are ROOT-RELATIVE since the multi-page build (`/media/img/x.jpg`),
  // so a journal entry two levels down resolves them locally; the media map
  // is keyed without the leading slash.
  out = out.replace(/(src|href|poster|data-src|data-src-mobile|data-src-hover)="\/?(media\/[^"]+)"/g, (whole, attr, name) => {
    const hit = mediaMap[name]'''),
    (r'''  out = out.replace(/href="([a-z0-9-]+)\.html(#[^"]*)?"/g, (_whole, page, frag) => {''',
     r'''  //     Root-relative and nested since the multi-page build: `/blog/x.html`
  //     -> `/blog/x`, `/index.html` -> `/`.
  out = out.replace(/href="\/?((?:[a-z0-9-]+\/)?[a-z0-9-]+)\.html(#[^"]*)?"/g, (_whole, page, frag) => {'''),
    (r'''  out = out.replace(/[ \t]*<link[^>]+href="assets\/site\.css"[^>]*>\s*\n?/g, '')
  out = out.replace(/[ \t]*<script[^>]+src="assets\/site\.js"[^>]*><\/script>\s*\n?/g, '')''',
     r'''  out = out.replace(/[ \t]*<link[^>]+href="\/?assets\/site\.css"[^>]*>\s*\n?/g, '')
  out = out.replace(/[ \t]*<script[^>]+src="\/?assets\/site\.js"[^>]*><\/script>\s*\n?/g, '')
  // the favicon and canonical are <head> content the importer drops anyway
  out = out.replace(/[ \t]*<link[^>]+rel="(?:icon|canonical)"[^>]*>\s*\n?/g, '')'''),
    (r'''  out = out.replace(/[ \t]*<script[^>]+src="assets\/gsap\/[^"]+"[^>]*><\/script>\s*\n?/g, '')''',
     r'''  out = out.replace(/[ \t]*<script[^>]+src="\/?assets\/gsap\/[^"]+"[^>]*><\/script>\s*\n?/g, '')'''),
    (r'''  for (const m of out.matchAll(/"(assets|media|fonts)\/([^"]+)"/g)) {''',
     r'''  for (const m of out.matchAll(/"\/?(assets|media|fonts)\/([^"]+)"/g)) {'''),
])

# ---- set-alt.mjs ---------------------------------------------------------------
patch('set-alt.mjs', [
    (r'''for (const file of fs.readdirSync(FINAL).filter((f) => f.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(FINAL, file), 'utf8')''',
     r'''const walk = (dir) => fs.readdirSync(dir).flatMap((e) => (fs.statSync(path.join(dir, e)).isDirectory() ? walk(path.join(dir, e)) : e.endsWith('.html') ? [path.join(dir, e)] : []))
for (const file of walk(FINAL)) {
  const html = fs.readFileSync(file, 'utf8')'''),
    (r'''    const src = (tag.match(/\bsrc="(media\/[^"]+)"/) ?? [])[1]''',
     r'''    // root-relative since the multi-page build; the map is keyed without the slash
    const src = (tag.match(/\bsrc="\/?(media\/[^"]+)"/) ?? [])[1]'''),
])

# ---- verify-live.mjs -------------------------------------------------------------
s = io.open('verify-live.mjs', encoding='utf-8').read()
a = s.index('/* ONE ROUTE. West LA Implants is a single scrolling document')
b = s.index('/* Nothing has ever been retired here.')
routes_new = r'''/* EVERY ROUTE THE BUILD WROTE, derived from dist/ rather than listed. The
   site was one route from 2026-09-10 to 2026-09-22 and is eighty from then
   on; a list kept by hand here goes blind the day a page is added (three
   gates on a sibling watched 11 of 57 pages and reported clean). A route
   absent from dist is not checked — GONE exists for that half. */
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../04-design/.tmp/site-src/dist')
const walk = (dir, pre = '') =>
  fs.readdirSync(dir).flatMap((e) =>
    fs.statSync(path.join(dir, e)).isDirectory() ? walk(path.join(dir, e), pre + e + '/') : e.endsWith('.html') ? [pre + e.replace(/\.html$/, '')] : [],
  )
const ROUTES = walk(DIST).map((s) => (s === 'index' ? '/' : '/' + s)).sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b)))

'''
s = s[:a] + routes_new + s[b:]
s = s.replace("for (const cls of ['is-solid', 'is-open', 'is-locked', 'is-link', 'wz-smooth', 'wz-line', 'reveal-mask'])",
              "for (const cls of ['is-solid', 'is-open', 'is-locked', 'is-link', 'wz-smooth', 'wz-line', 'reveal-mask', 'is-lit', 'is-on', 'is-drawn'])")
io.open('verify-live.mjs', 'w', encoding='utf-8', newline='\n').write(s)
print('patched verify-live.mjs')

# ---- compare-live.mjs / visual-diff.mjs ---------------------------------------
derive = r'''/* Every designed page in dist/ plus one journal entry (the 46 entries share
   one template). Derived, not listed: a hand-kept list goes blind. */
const ALL = (() => {
  const DIST_ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../04-design/.tmp/site-src/dist')
  const pages = fs.readdirSync(DIST_).filter((f) => f.endsWith('.html')).map((f) => f.replace(/\.html$/, ''))
  const posts = fs.existsSync(path.join(DIST_, 'blog')) ? fs.readdirSync(path.join(DIST_, 'blog')).filter((f) => f.endsWith('.html')).map((f) => 'blog/' + f.replace(/\.html$/, '')).slice(0, 1) : []
  return ['index', ...pages.filter((p) => p !== 'index').sort(), ...posts]
})()
'''
patch('compare-live.mjs', [
    ("const PAGES = args.find((a) => /^[a-z-]+$/.test(a)) ? [args.find((a) => /^[a-z-]+$/.test(a))] : ['index']",
     derive + "const PAGES = args.find((a) => /^[a-z\\/-]+$/.test(a)) ? [args.find((a) => /^[a-z\\/-]+$/.test(a))] : ALL"),
])
patch('visual-diff.mjs', [
    ("const ALL = ['index']", derive),
    ("const PAGES = args.find((a) => /^[a-z-]+$/.test(a)) ? [args.find((a) => /^[a-z-]+$/.test(a))] : ALL",
     "const PAGES = args.find((a) => /^[a-z\\/-]+$/.test(a)) ? [args.find((a) => /^[a-z\\/-]+$/.test(a))] : ALL"),
])
