#!/usr/bin/env node
/**
 * Exercise the Open Graph plugin off-platform, with a stub `api` standing in
 * for the QuickJS host.
 *
 *   node test-open-graph.mjs            # 40 assertions against fixtures
 *   node test-open-graph.mjs --live     # also run the filter over the REAL
 *                                       # published /, /about and one article
 *
 * The server entrypoint has no imports at all, so it loads straight into Node
 * and the thing under test is the REAL file rather than a restatement of it —
 * the same arrangement `test-embed-origins.mjs` uses.
 *
 * What this cannot prove is that the host calls the filter; that is what
 * `verify-open-graph.mjs` checks against the served page after install.
 *
 * The head fixture below is a copy of what encorercm.com actually serves —
 * pretty-printed, `&amp;` in the title, the site-wide description, the CSP meta
 * that `embed-origins` rewrites. Testing against a tidied-up imaginary head is
 * how a filter passes here and fails live.
 */
import { activate } from './open-graph/server/index.js'

/* ── the stub host ────────────────────────────────────────────────────── */

function makeApi (opts) {
  const settings = opts.settings || {}
  const records = new Map()
  let nextId = 1
  for (const o of opts.overrides || []) records.set(String(nextId), { id: String(nextId++), data: o })

  const listeners = {}
  const filters = {}
  const routes = {}
  const logs = []

  const register = (method) => (path, _cap, handler) => { routes[method + ' ' + path] = handler }
  const registerNoCap = (method) => (path, handler) => { routes[method + ' ' + path] = handler }

  const api = {
    plugin: { log: (m) => logs.push(m), assetUrl: (p) => '/uploads/plugins/x/' + p },
    cms: {
      settings: {
        get: (k) => settings[k],
        getAll: () => ({ ...settings }),
        replace: async () => {},
      },
      hooks: {
        on: (event, fn) => { listeners[event] = fn },
        filter: (name, fn) => { filters[name] = fn },
        emit: async () => 'x',
      },
      routes: {
        get: register('GET'), post: register('POST'),
        patch: register('PATCH'), delete: register('DELETE'),
        authenticated: {
          get: registerNoCap('GET'), post: registerNoCap('POST'),
          patch: registerNoCap('PATCH'), delete: registerNoCap('DELETE'),
        },
        public: {
          get: registerNoCap('GET'), post: registerNoCap('POST'),
          patch: registerNoCap('PATCH'), delete: registerNoCap('DELETE'),
        },
      },
      storage: {
        collection: () => ({
          list: async ({ limit = 200, offset = 0 } = {}) => {
            const all = [...records.values()]
            return { records: all.slice(offset, offset + limit), totalCount: all.length }
          },
          create: async (data) => {
            const rec = { id: String(nextId++), data }
            records.set(rec.id, rec)
            return rec
          },
          update: async (id, data) => {
            const rec = { id, data }
            records.set(id, rec)
            return rec
          },
          delete: async (id) => records.delete(id),
        }),
      },
      content: {
        tables: { list: async () => opts.tables || [] },
        table: (slug) => ({
          list: async () => {
            const rows = (opts.rows || {})[slug]
            if (!rows) throw new Error(`table "${slug}" is not in contentAccess`)
            return { entries: rows, totalCount: rows.length }
          },
        }),
      },
    },
  }
  return { api, listeners, filters, routes, records, logs }
}

/* ── the site under test ──────────────────────────────────────────────── */

const TABLES = [
  { slug: 'pages', name: 'Pages', kind: 'page', routeBase: '/', system: true, primaryFieldId: 'title', fieldCount: 6, rowCount: 3 },
  { slug: 'posts', name: 'Posts', kind: 'post', routeBase: '/posts', system: true, primaryFieldId: 'title', fieldCount: 7, rowCount: 2 },
]

const ROWS = {
  pages: [
    { id: 'p1', tableSlug: 'pages', slug: 'index', status: 'published', cells: {
      title: 'Dental Implants & Prosthodontics | McLean & Alexandria VA',
      seoTitle: 'Dental Implants & Prosthodontics | McLean & Alexandria VA',
      seoDescription: 'Board-certified prosthodontist Dr. Esam Nahlah rebuilds complex and failed cases.',
    } },
    { id: 'p2', tableSlug: 'pages', slug: 'about', status: 'published', cells: {
      title: 'Why Choose Us | Dr. Nahlah Implants & Prosthodontics | McLean, VA',
      seoTitle: 'Why Choose Us | Dr. Nahlah Implants & Prosthodontics | McLean, VA',
      seoDescription: 'Why patients with failed or complex cases are referred here.',
    } },
    // The entry TEMPLATE is an ordinary page row with its own slug. Every
    // article renders through it, and the filter context carries THIS slug.
    { id: 'p3', tableSlug: 'pages', slug: 'post', status: 'published', cells: {
      title: 'Article', seoTitle: '', seoDescription: 'The article template.',
    } },
  ],
  posts: [
    { id: 'r1', tableSlug: 'posts', slug: 'all-on-four-your-questions', status: 'published', cells: {
      title: 'All-On-Four, Your Questions Answered',
      seoTitle: 'All-On-Four, Your Questions Answered | Dr. Nahlah DDS. MS.',
      seoDescription: 'What All-on-4 replaces, how long it takes, and who it suits.',
    } },
    { id: 'r2', tableSlug: 'posts', slug: 'are-dental-implants-worth-the-cost', status: 'published', cells: {
      title: 'Are Dental Implants Worth The Cost?',
      seoTitle: 'Are Dental Implants Worth The Cost? | Dr. Nahlah DDS. MS.',
      seoDescription: 'What an implant costs against what it replaces, over twenty years.',
    } },
  ],
}

const SITE_DESC = 'Board-certified prosthodontist Dr. Esam Nahlah rebuilds complex and failed cases. ' +
  'Implants, All-on-4 and full-mouth work in McLean and Alexandria, Virginia.'

/** The real shape of an encorercm.com document, down to the whitespace. */
function page ({ title, body = '', description = SITE_DESC, extraHead = '' }) {
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <meta http-equiv="Content-Security-Policy" content="default-src \'self\'; frame-src \'self\' https:;">\n' +
    `  <title>${title}</title>\n` +
    `  <meta name="description" content="${description}">\n` +
    '  <link rel="icon" href="/uploads/x-favicon.png">\n' +
    '  <link rel="stylesheet" href="/_instatic/css/style-abc.css">\n' +
    extraHead +
    '</head>\n<body>\n' +
    '<header><img src="/uploads/aaa-logo.png" alt="Dr. Nahlah logo"></header>\n' +
    body +
    '\n</body>\n</html>'
}

const HOME_BODY =
  '<main><img src="/uploads/bbb-dr-headshot.png" alt="Dr. Esam Nahlah, board-certified prosthodontist">' +
  '<img src="/uploads/ccc-second.jpg" alt="A treatment room"></main>'

const DEFAULTS = {
  enabled: true,
  siteUrl: 'https://www.drnahlah.com',
  siteName: 'Dr. Nahlah Implants & Prosthodontics',
  defaultImage: '/uploads/zzz-share-default.jpg',
  defaultImageAlt: 'The practice in McLean, Virginia',
  defaultType: 'website',
  articleType: true,
  locale: 'en_US',
  twitterCard: 'summary_large_image',
  twitterSite: 'drnahlah',
  deriveFromPage: true,
  syncMetaDescription: true,
  emitCanonical: true,
}

/** Boot the plugin, warm the mirror, hand back the filter. */
async function boot (over = {}) {
  const h = makeApi({
    settings: { ...DEFAULTS, ...(over.settings || {}) },
    tables: TABLES,
    rows: ROWS,
    overrides: over.overrides || [],
  })
  activate(h.api)
  // `publish.before` is awaited by the host pipeline before any page renders.
  await h.listeners['publish.before']()
  return h
}

/* ── assertions ───────────────────────────────────────────────────────── */

let pass = 0, fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n          ' + String(detail).slice(0, 400) : ''}`) }
}
const tag = (html, prop) => {
  const m = new RegExp(`<meta property="${prop}" content="([^"]*)">`).exec(html)
  return m ? m[1] : null
}
const nameTag = (html, n) => {
  const m = new RegExp(`<meta name="${n}" content="([^"]*)">`).exec(html)
  return m ? m[1] : null
}

console.log('\nOpen Graph — filter behaviour\n')

// 1 ── the switch ───────────────────────────────────────────────────────
{
  const src = page({ title: 'x', body: HOME_BODY })
  const off = await boot({ settings: { enabled: false } })
  check('disabled leaves the page byte-identical', off.filters['publish.html'](src, { slug: 'index' }) === src)

  const on = await boot()
  check('enabled changes the page', on.filters['publish.html'](src, { slug: 'index' }) !== src)
}

// 2 ── an ordinary page ─────────────────────────────────────────────────
{
  const h = await boot()
  const src = page({ title: 'Dental Implants &amp; Prosthodontics | McLean &amp; Alexandria VA', body: HOME_BODY })
  const out = h.filters['publish.html'](src, { slug: 'index' })

  check('og:title is the document title',
    tag(out, 'og:title') === 'Dental Implants &amp; Prosthodontics | McLean &amp; Alexandria VA', tag(out, 'og:title'))
  check('the ampersand is escaped ONCE, not twice',
    !/&amp;amp;/.test(out), (out.match(/.{0,40}&amp;amp;.{0,40}/) || [''])[0])
  check('og:description is the PAGE description, not the site-wide one',
    tag(out, 'og:description') === 'Board-certified prosthodontist Dr. Esam Nahlah rebuilds complex and failed cases.',
    tag(out, 'og:description'))
  check('og:url is absolute and ends at the root for index',
    tag(out, 'og:url') === 'https://www.drnahlah.com/', tag(out, 'og:url'))
  check('og:type is website for a page', tag(out, 'og:type') === 'website')
  check('og:site_name is emitted', tag(out, 'og:site_name') === 'Dr. Nahlah Implants &amp; Prosthodontics')
  check('og:locale is emitted', tag(out, 'og:locale') === 'en_US')
  check('twitter:card is the large-image card when there is an image',
    nameTag(out, 'twitter:card') === 'summary_large_image')
  check('twitter:site gains the @', nameTag(out, 'twitter:site') === '@drnahlah')
  check('a canonical link is added', /<link rel="canonical" href="https:\/\/www\.drnahlah\.com\/">/.test(out))
  check('the tags land INSIDE head', out.indexOf('og:title') < out.indexOf('</head>'))
}

// 3 ── the lead image ───────────────────────────────────────────────────
{
  const h = await boot()
  const out = h.filters['publish.html'](
    page({ title: 'Dental Implants &amp; Prosthodontics | McLean &amp; Alexandria VA', body: HOME_BODY }),
    { slug: 'index' })
  check('the header LOGO is not taken as the share image',
    tag(out, 'og:image') === 'https://www.drnahlah.com/uploads/bbb-dr-headshot.png', tag(out, 'og:image'))
  check('og:image:alt comes from the picture that was chosen',
    tag(out, 'og:image:alt') === 'Dr. Esam Nahlah, board-certified prosthodontist', tag(out, 'og:image:alt'))

  const noImg = h.filters['publish.html'](
    page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA', body: '<main><p>no pictures</p></main>' }),
    { slug: 'about' })
  check('a page with no picture of its own falls back to the default image',
    tag(noImg, 'og:image') === 'https://www.drnahlah.com/uploads/zzz-share-default.jpg', tag(noImg, 'og:image'))
  check('the fallback image carries the fallback alt',
    tag(noImg, 'og:image:alt') === 'The practice in McLean, Virginia', tag(noImg, 'og:image:alt'))
}

// 4 ── THE trap: 43 articles arrive with the same slug ──────────────────
{
  const h = await boot()
  // Both of these are rendered through the `post` template, so the pipeline
  // hands the filter `slug: 'post'` for both. Only the title separates them.
  const a = h.filters['publish.html'](
    page({ title: 'All-On-Four, Your Questions Answered', body: HOME_BODY }), { slug: 'post' })
  const b = h.filters['publish.html'](
    page({ title: 'Are Dental Implants Worth The Cost?', body: HOME_BODY }), { slug: 'post' })

  check('two articles rendered through ONE template get different og:url',
    tag(a, 'og:url') === 'https://www.drnahlah.com/posts/all-on-four-your-questions' &&
    tag(b, 'og:url') === 'https://www.drnahlah.com/posts/are-dental-implants-worth-the-cost',
    `${tag(a, 'og:url')} | ${tag(b, 'og:url')}`)
  check('each article gets its OWN description',
    tag(a, 'og:description') === 'What All-on-4 replaces, how long it takes, and who it suits.' &&
    tag(b, 'og:description') === 'What an implant costs against what it replaces, over twenty years.',
    `${tag(a, 'og:description')} | ${tag(b, 'og:description')}`)
  check('an article is og:type article', tag(a, 'og:type') === 'article')

  const noArticle = await boot({ settings: { articleType: false } })
  check('articleType off returns entries to the default type',
    tag(noArticle.filters['publish.html'](
      page({ title: 'All-On-Four, Your Questions Answered' }), { slug: 'post' }), 'og:type') === 'website')

  // The template page itself, rendered on its own, is still a page.
  const tpl = h.filters['publish.html'](page({ title: 'Article' }), { slug: 'post' })
  check('the template page rendered as itself stays a page',
    tag(tpl, 'og:url') === 'https://www.drnahlah.com/post', tag(tpl, 'og:url'))
}

// 5 ── the meta description correction ──────────────────────────────────
{
  const h = await boot()
  const out = h.filters['publish.html'](
    page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' }), { slug: 'about' })
  check('the site-wide description is REPLACED by the page\'s own',
    nameTag(out, 'description') === 'Why patients with failed or complex cases are referred here.',
    nameTag(out, 'description'))
  check('there is still exactly ONE description tag',
    (out.match(/<meta name="description"/g) || []).length === 1)

  const keep = await boot({ settings: { syncMetaDescription: false } })
  const kept = keep.filters['publish.html'](
    page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' }), { slug: 'about' })
  check('syncMetaDescription off leaves the site-wide description alone',
    nameTag(kept, 'description') === SITE_DESC)
}

// 6 ── overrides ────────────────────────────────────────────────────────
{
  const h = await boot({ overrides: [{
    key: 'about', title: 'Referred here when it has gone wrong', description: 'Hand-written.',
    image: 'https://cdn.example.com/custom.jpg', imageAlt: 'A custom card', type: 'profile', enabled: true,
  }] })
  const out = h.filters['publish.html'](
    page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA', body: HOME_BODY }),
    { slug: 'about' })
  check('an override wins over the derived title', tag(out, 'og:title') === 'Referred here when it has gone wrong')
  check('an override wins over the derived description', tag(out, 'og:description') === 'Hand-written.')
  check('an absolute override image is passed through unchanged',
    tag(out, 'og:image') === 'https://cdn.example.com/custom.jpg')
  check('an override image does not inherit the page picture\'s alt',
    tag(out, 'og:image:alt') === 'A custom card', tag(out, 'og:image:alt'))
  check('an override type wins', tag(out, 'og:type') === 'profile')
  check('the override also drives the meta description',
    nameTag(out, 'description') === 'Hand-written.')

  const off = await boot({ overrides: [{ key: 'about', title: 'Ignored', enabled: false }] })
  check('an override with enabled:false is ignored',
    tag(off.filters['publish.html'](
      page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' }), { slug: 'about' }),
    'og:title') === 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA')

  // An override keyed to an ENTRY uses `<tableSlug>:<rowSlug>`.
  const entry = await boot({ overrides: [{ key: 'posts:all-on-four-your-questions', title: 'Pinned card', enabled: true }] })
  check('an entry override is keyed <table>:<slug> and reaches the article',
    tag(entry.filters['publish.html'](
      page({ title: 'All-On-Four, Your Questions Answered' }), { slug: 'post' }), 'og:title') === 'Pinned card')
}

// 7 ── no public address ────────────────────────────────────────────────
{
  const h = await boot({ settings: { siteUrl: '' } })
  const out = h.filters['publish.html'](page({ title: 'x', body: HOME_BODY }), { slug: 'index' })
  check('with no site URL the title tag is still written', !!tag(out, 'og:title'))
  check('with no site URL no relative og:image is emitted', tag(out, 'og:image') === null, tag(out, 'og:image'))
  check('with no site URL no og:url is emitted', tag(out, 'og:url') === null)
  check('with no site URL no canonical link is emitted', !/rel="canonical"/.test(out))
  check('twitter:card degrades to summary when there is no image',
    nameTag(out, 'twitter:card') === 'summary')
}

// 8 ── idempotence and safety ───────────────────────────────────────────
{
  const h = await boot()
  const src = page({ title: 'Dental Implants &amp; Prosthodontics | McLean &amp; Alexandria VA', body: HOME_BODY })
  const once = h.filters['publish.html'](src, { slug: 'index' })
  const twice = h.filters['publish.html'](once, { slug: 'index' })
  check('running the filter twice changes nothing the second time', once === twice)
  check('a page that already has og:title is left alone',
    h.filters['publish.html'](page({ title: 'x', extraHead: '  <meta property="og:title" content="mine">\n' }), { slug: 'index' })
      .indexOf('brandklout.open-graph') === -1) // was 'webzite.open-graph' before the 2026-09-10 id migration, which made this pass vacuously
  check('a document with no </head> is returned untouched',
    h.filters['publish.html']('<p>fragment</p>', { slug: 'index' }) === '<p>fragment</p>')
  check('an empty string is returned untouched', h.filters['publish.html']('', { slug: 'index' }) === '')

  // A title that tries to break out of the attribute.
  const evil = h.filters['publish.html'](
    page({ title: 'Bad" /><script>alert(1)</script><meta x="' }), { slug: 'nope' })
  const line = (evil.match(/<meta property="og:title"[^\n]*/) || [''])[0]
  check('a hostile title cannot break out of the attribute',
    line.indexOf('<script>') === -1 && (line.match(/"/g) || []).length === 4, line)
}

// 9 ── deriveFromPage off ───────────────────────────────────────────────
{
  const h = await boot({ settings: { deriveFromPage: false } })
  const src = page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' })
  check('with derivation off an un-overridden page gets nothing',
    h.filters['publish.html'](src, { slug: 'about' }) === src)

  const h2 = await boot({ settings: { deriveFromPage: false }, overrides: [{ key: 'about', title: 'Only this', enabled: true }] })
  check('with derivation off an OVERRIDDEN page still gets tags',
    tag(h2.filters['publish.html'](src, { slug: 'about' }), 'og:title') === 'Only this')
}

// 10 ── the bulk API ────────────────────────────────────────────────────
{
  const h = await boot()
  const bulk = h.routes['POST /bulk']

  const dry = await bulk({ body: {
    match: { kind: 'entry' },
    set: { title: '{title} | Dr. Nahlah' },
  } })
  check('a dry run is the default', dry.dryRun === true)
  check('the dry run matched only the entries', dry.matched === 2, JSON.stringify(dry.matched))
  check('{title} interpolates per page, from the SEO title',
    dry.changes.some((c) => c.data.title === 'All-On-Four, Your Questions Answered | Dr. Nahlah DDS. MS. | Dr. Nahlah'),
    JSON.stringify(dry.changes.map((c) => c.data.title)))
  check('the dry run wrote nothing', h.records.size === 0)

  const applied = await bulk({ body: {
    match: { kind: 'entry' }, set: { image: '/uploads/journal-card.jpg' }, dryRun: false,
  } })
  check('applying writes one record per match', applied.written === 2 && h.records.size === 2)
  check('the applied value reaches the filter',
    tag(h.filters['publish.html'](page({ title: 'All-On-Four, Your Questions Answered' }), { slug: 'post' }), 'og:image')
      === 'https://www.drnahlah.com/uploads/journal-card.jpg')

  const second = await bulk({ body: {
    match: { kind: 'entry' }, set: { imageAlt: 'From the practice journal' }, dryRun: false,
  } })
  check('a second bulk run UPDATES rather than duplicating',
    second.written === 2 && h.records.size === 2, `records=${h.records.size}`)
  check('the second run kept the first run\'s field',
    [...h.records.values()].every((r) => r.data.image === '/uploads/journal-card.jpg'))

  const prefixed = await bulk({ body: { match: { slugPrefix: 'about' }, set: { type: 'profile' } } })
  check('slugPrefix narrows the match', prefixed.matched === 1 && prefixed.changes[0].key === 'about')

  const rejected = await bulk({ body: { set: { nope: 'x' } } })
  check('an unknown field is refused, not silently dropped',
    rejected.__response === true && rejected.status === 400, JSON.stringify(rejected).slice(0, 120))
  const empty = await bulk({ body: { set: {} } })
  check('an empty `set` is refused', empty.__response === true && empty.status === 400)
}

// 11 ── the single-page routes ──────────────────────────────────────────
{
  const h = await boot()
  const list = await h.routes['GET /pages']({})
  check('GET /pages returns every page and every entry', list.pages.length === 5, String(list.pages.length))
  check('GET /pages carries the derived URL',
    list.pages.some((p) => p.url === 'https://www.drnahlah.com/posts/all-on-four-your-questions'))

  await h.routes['POST /override']({ body: { key: 'about', title: 'Typed by hand' } })
  check('POST /override upserts', h.records.size === 1)
  check('the upserted value reaches the filter',
    tag(h.filters['publish.html'](
      page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' }), { slug: 'about' }),
    'og:title') === 'Typed by hand')
  await h.routes['POST /override']({ body: { key: 'about', title: 'Typed again' } })
  check('a second POST updates rather than duplicating', h.records.size === 1)
  const del = await h.routes['DELETE /override']({ body: { key: 'about' } })
  check('DELETE /override removes it', del.deleted === 1 && h.records.size === 0)
  const noKey = await h.routes['POST /override']({ body: {} })
  check('POST /override without a key is refused', noKey.__response === true && noKey.status === 400)

  const preview = await h.routes['POST /preview']({ body: {
    html: page({ title: 'All-On-Four, Your Questions Answered', body: HOME_BODY }), slug: 'post',
  } })
  check('POST /preview returns the same block the filter would inject',
    preview.tags.includes('og:url" content="https://www.drnahlah.com/posts/all-on-four-your-questions'),
    String(preview.tags).slice(0, 200))
}

/* ── optional: the real published pages ───────────────────────────────── */

if (process.argv.includes('--live')) {
  const BASE = (process.env.INSTATIC_BASE_URL || '').trim().replace(/\/+$/, '')
  if (!BASE) { console.error('--live needs INSTATIC_BASE_URL (the site to read); there is no default host'); process.exit(2) }
  console.log(`\nthe filter over LIVE pages (${BASE})\n`)
  const h = await boot()
  for (const [path, slug] of [['/', 'index'], ['/about', 'about'], ['/posts/all-on-four-your-questions', 'post']]) {
    let html
    try { html = await (await fetch(BASE + path)).text() } catch (e) { console.log(`  SKIP  ${path} (${e.message})`); continue }
    const out = h.filters['publish.html'](html, { slug })
    const t = tag(out, 'og:title')
    check(`${path} gains an og:title`, !!t, t)
    check(`${path} keeps exactly one description tag`,
      (out.match(/<meta name="description"/g) || []).length === 1)
    check(`${path} still parses as one document`,
      (out.match(/<\/head>/g) || []).length === 1 && out.startsWith('<!DOCTYPE html>'))
    console.log(`        og:title    ${t}`)
    console.log(`        og:url      ${tag(out, 'og:url')}`)
    console.log(`        og:image    ${tag(out, 'og:image')}`)
    console.log(`        description ${nameTag(out, 'description')}`)
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
