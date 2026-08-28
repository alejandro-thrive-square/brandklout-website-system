#!/usr/bin/env node
/**
 * Exercise the AEO Schema plugin off-platform, with a stub `api` standing in
 * for the QuickJS host.
 *
 *   node test-aeo-schema.mjs            # assertions against fixtures
 *   node test-aeo-schema.mjs --live     # also run the filter over the REAL
 *                                       # published /, /about and one article
 *
 * The server entrypoint has no imports, so it loads straight into Node and the
 * thing under test is the REAL file.
 *
 * Every emitted graph is round-tripped through `JSON.parse` after being pulled
 * back out of the `<script>` tag — a structured-data plugin whose output does
 * not parse is worse than one that emits nothing, and "it looked right in the
 * page source" is not a check.
 */
import { activate } from './aeo-schema/server/index.js'

/* ── the stub host ────────────────────────────────────────────────────── */

function makeApi (opts) {
  const settings = opts.settings || {}
  const records = new Map()
  let nextId = 1
  for (const b of opts.blocks || []) records.set(String(nextId), { id: String(nextId++), data: b })

  const listeners = {}
  const filters = {}
  const routes = {}
  const logs = []

  const register = (method) => (path, _cap, handler) => { routes[method + ' ' + path] = handler }
  const registerNoCap = (method) => (path, handler) => { routes[method + ' ' + path] = handler }

  const api = {
    plugin: { log: (m) => logs.push(m), assetUrl: (p) => '/uploads/plugins/x/' + p },
    cms: {
      settings: { get: (k) => settings[k], getAll: () => ({ ...settings }), replace: async () => {} },
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
          create: async (data) => { const r = { id: String(nextId++), data }; records.set(r.id, r); return r },
          update: async (id, data) => { const r = { id, data }; records.set(id, r); return r },
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
    { id: 'p1', tableSlug: 'pages', slug: 'index', status: 'published', publishedAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-27T00:00:00.000Z', cells: {
      title: 'Dental Implants & Prosthodontics | McLean & Alexandria VA',
      seoTitle: 'Dental Implants & Prosthodontics | McLean & Alexandria VA',
      seoDescription: 'Board-certified prosthodontist Dr. Esam Nahlah rebuilds complex and failed cases.',
    } },
    { id: 'p2', tableSlug: 'pages', slug: 'about', status: 'published', publishedAt: '2026-08-02T00:00:00.000Z', updatedAt: '2026-08-20T00:00:00.000Z', cells: {
      title: 'Why Choose Us | Dr. Nahlah Implants & Prosthodontics | McLean, VA',
      seoTitle: 'Why Choose Us | Dr. Nahlah Implants & Prosthodontics | McLean, VA',
      seoDescription: 'Why patients with failed or complex cases are referred here.',
    } },
    { id: 'p3', tableSlug: 'pages', slug: 'post', status: 'published', publishedAt: null, updatedAt: null, cells: {
      title: 'Article', seoTitle: '', seoDescription: 'The article template.',
    } },
  ],
  posts: [
    { id: 'r1', tableSlug: 'posts', slug: 'all-on-four-your-questions', status: 'published', publishedAt: '2026-06-11T10:00:00.000Z', updatedAt: '2026-08-27T09:00:00.000Z', cells: {
      title: 'All-On-Four, Your Questions Answered',
      seoTitle: 'All-On-Four, Your Questions Answered | Dr. Nahlah DDS. MS.',
      seoDescription: 'What All-on-4 replaces, how long it takes, and who it suits.',
    } },
    { id: 'r2', tableSlug: 'posts', slug: 'are-dental-implants-worth-the-cost', status: 'published', publishedAt: '2026-07-02T10:00:00.000Z', updatedAt: '2026-08-27T09:00:00.000Z', cells: {
      title: 'Are Dental Implants Worth The Cost?',
      seoTitle: 'Are Dental Implants Worth The Cost? | Dr. Nahlah DDS. MS.',
      seoDescription: 'What an implant costs against what it replaces, over twenty years.',
    } },
  ],
}

const SITE_DESC = 'Board-certified prosthodontist Dr. Esam Nahlah rebuilds complex and failed cases.'

function page ({ title, body = '', description = SITE_DESC, extraHead = '' }) {
  return '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="UTF-8">\n' +
    `  <title>${title}</title>\n` +
    `  <meta name="description" content="${description}">\n` +
    extraHead +
    '</head>\n<body>\n' +
    '<header><img src="/uploads/aaa-logo.png" alt="Dr. Nahlah logo"></header>\n' +
    body +
    '\n</body>\n</html>'
}

const BODY = '<main><img src="/uploads/bbb-hero.jpg" alt="A treatment room"></main>'

const DEFAULTS = {
  enabled: true,
  siteUrl: 'https://www.drnahlah.com',
  siteName: 'Dr. Nahlah Implants & Prosthodontics',
  organizationType: 'Dentist',
  organizationName: 'Dr. Nahlah Implants and Prosthodontics Specialists',
  logo: '/uploads/logo.png',
  telephone: '+1-703-000-0000',
  priceRange: '$$$',
  sameAs: 'https://www.google.com/maps/place/x\nhttps://www.facebook.com/x',
  organizationJson: '',
  emitOrganization: true,
  emitWebSite: true,
  emitWebPage: true,
  emitBreadcrumbs: true,
  emitArticle: true,
}

async function boot (over = {}) {
  const h = makeApi({
    settings: { ...DEFAULTS, ...(over.settings || {}) },
    tables: TABLES,
    rows: ROWS,
    blocks: over.blocks || [],
  })
  activate(h.api)
  await h.listeners['publish.before']()
  return h
}

/* ── assertions ───────────────────────────────────────────────────────── */

let pass = 0, fail = 0
const check = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`  ok    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? '\n          ' + String(detail).slice(0, 500) : ''}`) }
}

/** Pull our script tag back out and PARSE it. Nothing is asserted on the raw string. */
const SCRIPT_RE = /<script type="application\/ld\+json" data-aeo="webzite\.aeo-schema">\n([\s\S]*?)\n  <\/script>/
function graphOf (html) {
  const m = SCRIPT_RE.exec(html)
  if (!m) return null
  return JSON.parse(m[1])
}
const nodesOfType = (doc, type) => (doc ? doc['@graph'].filter((n) => n['@type'] === type) : [])
const oneOfType = (doc, type) => nodesOfType(doc, type)[0] || null

console.log('\nAEO Schema — graph construction\n')

// 1 ── the switch ───────────────────────────────────────────────────────
{
  const src = page({ title: 'x', body: BODY })
  const off = await boot({ settings: { enabled: false } })
  check('disabled leaves the page byte-identical', off.filters['publish.html'](src, { slug: 'index' }) === src)
}

// 2 ── the home page ────────────────────────────────────────────────────
{
  const h = await boot()
  const out = h.filters['publish.html'](
    page({ title: 'Dental Implants &amp; Prosthodontics | McLean &amp; Alexandria VA', body: BODY }),
    { slug: 'index' })
  const doc = graphOf(out)

  check('the emitted script parses as JSON', !!doc)
  check('there is exactly ONE @context, on the graph', doc['@context'] === 'https://schema.org')
  check('the script is inside head', out.indexOf('application/ld+json') < out.indexOf('</head>'))

  const org = oneOfType(doc, 'Dentist')
  check('the organisation uses the configured specific type', !!org)
  check('the organisation has a stable @id', org['@id'] === 'https://www.drnahlah.com/#organization')
  check('the logo is absolute', org.logo && org.logo.url === 'https://www.drnahlah.com/uploads/logo.png')
  check('sameAs is one entry per line', Array.isArray(org.sameAs) && org.sameAs.length === 2, JSON.stringify(org.sameAs))
  check('the telephone and price range are carried', org.telephone === '+1-703-000-0000' && org.priceRange === '$$$')

  const site = oneOfType(doc, 'WebSite')
  check('the WebSite entity is on the home page', !!site && site.url === 'https://www.drnahlah.com/')
  check('the WebSite points at the organisation', site.publisher['@id'] === org['@id'])

  const wp = oneOfType(doc, 'WebPage')
  check('the WebPage carries the page URL', wp.url === 'https://www.drnahlah.com/')
  check('the WebPage description is the PAGE description',
    wp.description === 'Board-certified prosthodontist Dr. Esam Nahlah rebuilds complex and failed cases.')
  check('the WebPage primary image skips the logo and is absolute',
    wp.primaryImageOfPage.url === 'https://www.drnahlah.com/uploads/bbb-hero.jpg', JSON.stringify(wp.primaryImageOfPage))
  check('the ampersand in the title is decoded, not double-escaped',
    wp.name.indexOf('&amp;') === -1 && wp.name.indexOf(' & ') > -1, wp.name)
  check('the home page has no breadcrumb', nodesOfType(doc, 'BreadcrumbList').length === 0)
  check('the home page has no Article', nodesOfType(doc, 'Article').length === 0)
}

// 3 ── an interior page ─────────────────────────────────────────────────
{
  const h = await boot()
  const doc = graphOf(h.filters['publish.html'](
    page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA', body: BODY }),
    { slug: 'about' }))
  const crumbs = oneOfType(doc, 'BreadcrumbList')
  check('an interior page gets a breadcrumb', !!crumbs)
  check('the breadcrumb starts at Home',
    crumbs.itemListElement[0].name === 'Home' && crumbs.itemListElement[0].item === 'https://www.drnahlah.com/')
  check('the last crumb is named from the page, not the slug',
    crumbs.itemListElement[1].name === 'Why Choose Us | Dr. Nahlah Implants & Prosthodontics | McLean, VA',
    crumbs.itemListElement[1].name)
  check('positions are 1-based and contiguous',
    crumbs.itemListElement.every((it, i) => it.position === i + 1))
  check('an interior page has no WebSite node', nodesOfType(doc, 'WebSite').length === 0)
}

// 4 ── THE trap: 43 articles share one template slug ────────────────────
{
  const h = await boot()
  const a = graphOf(h.filters['publish.html'](
    page({ title: 'All-On-Four, Your Questions Answered', body: BODY }), { slug: 'post' }))
  const b = graphOf(h.filters['publish.html'](
    page({ title: 'Are Dental Implants Worth The Cost?', body: BODY }), { slug: 'post' }))

  const artA = oneOfType(a, 'Article')
  const artB = oneOfType(b, 'Article')
  check('two articles rendered through ONE template get different @id',
    artA['@id'] === 'https://www.drnahlah.com/posts/all-on-four-your-questions#article' &&
    artB['@id'] === 'https://www.drnahlah.com/posts/are-dental-implants-worth-the-cost#article',
    `${artA['@id']} | ${artB['@id']}`)
  check('each article carries its own headline',
    artA.headline !== artB.headline && artA.headline.indexOf('All-On-Four') === 0)
  check('the headline is trimmed to 110 characters', artA.headline.length <= 111, String(artA.headline.length))
  check('datePublished and dateModified come from the row',
    artA.datePublished === '2026-06-11T10:00:00.000Z' && artA.dateModified === '2026-08-27T09:00:00.000Z')
  check('the publisher points at the organisation @id',
    artA.publisher['@id'] === 'https://www.drnahlah.com/#organization')
  check('the article points at its own WebPage',
    artA.mainEntityOfPage['@id'] === 'https://www.drnahlah.com/posts/all-on-four-your-questions#webpage')

  const crumbs = oneOfType(a, 'BreadcrumbList')
  check('an article breadcrumb is Home > Posts > the article',
    crumbs.itemListElement.length === 3 &&
    crumbs.itemListElement[1].name === 'Posts' &&
    crumbs.itemListElement[2].item === 'https://www.drnahlah.com/posts/all-on-four-your-questions',
    JSON.stringify(crumbs.itemListElement.map((i) => i.name)))

  const off = await boot({ settings: { emitArticle: false } })
  check('emitArticle off removes the Article node',
    nodesOfType(graphOf(off.filters['publish.html'](
      page({ title: 'All-On-Four, Your Questions Answered' }), { slug: 'post' })), 'Article').length === 0)
}

// 5 ── the toggles ──────────────────────────────────────────────────────
{
  const h = await boot({ settings: {
    emitOrganization: false, emitWebSite: false, emitWebPage: false, emitBreadcrumbs: false, emitArticle: false,
  } })
  const src = page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' })
  check('with every generator off and no block, nothing is injected',
    h.filters['publish.html'](src, { slug: 'about' }) === src)

  const withBlock = await boot({
    settings: { emitOrganization: false, emitWebSite: false, emitWebPage: false, emitBreadcrumbs: false, emitArticle: false },
    blocks: [{ key: 'about', json: JSON.stringify({ '@type': 'FAQPage', mainEntity: [] }), enabled: true }],
  })
  const doc = graphOf(withBlock.filters['publish.html'](src, { slug: 'about' }))
  check('a hand-written block alone is enough to emit a graph',
    !!doc && doc['@graph'].length === 1 && doc['@graph'][0]['@type'] === 'FAQPage')
}

// 6 ── hand-written blocks ──────────────────────────────────────────────
{
  const h = await boot({ blocks: [
    { key: 'about', json: JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [{ '@type': 'Question', name: 'Q?' }] }), enabled: true },
    { key: '*', json: JSON.stringify([{ '@type': 'Place', name: 'McLean' }, { '@type': 'Place', name: 'Alexandria' }]), enabled: true },
    { key: 'posts:all-on-four-your-questions', json: JSON.stringify({ '@type': 'HowTo', name: 'Steps' }), enabled: true },
  ] })
  const doc = graphOf(h.filters['publish.html'](
    page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' }), { slug: 'about' }))
  check('a page block is merged into the graph', nodesOfType(doc, 'FAQPage').length === 1)
  check('a nested @context on a block member is stripped',
    !doc['@graph'].some((n, i) => i > 0 && n['@context']),
    JSON.stringify(doc['@graph'].map((n) => n['@context'])))
  check('the site-wide block is on this page too', nodesOfType(doc, 'Place').length === 2)

  const art = graphOf(h.filters['publish.html'](
    page({ title: 'All-On-Four, Your Questions Answered' }), { slug: 'post' }))
  check('an entry block is keyed <table>:<slug> and reaches the article',
    nodesOfType(art, 'HowTo').length === 1)
  check('the site-wide block reaches an article as well', nodesOfType(art, 'Place').length === 2)
  check('a page does NOT get another page\'s block', nodesOfType(doc, 'HowTo').length === 0)

  const disabled = await boot({ blocks: [{ key: 'about', json: JSON.stringify({ '@type': 'FAQPage' }), enabled: false }] })
  check('a block with enabled:false is ignored',
    nodesOfType(graphOf(disabled.filters['publish.html'](
      page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' }), { slug: 'about' })),
    'FAQPage').length === 0)

  const broken = await boot({ blocks: [{ key: 'about', json: '{ not json', enabled: true }] })
  const stillFine = graphOf(broken.filters['publish.html'](
    page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' }), { slug: 'about' }))
  check('a block that stopped being valid JSON is skipped, not fatal',
    !!stillFine && nodesOfType(stillFine, 'WebPage').length === 1)
  check('and it is logged', broken.logs.some((l) => l.indexOf('not valid JSON') > -1), JSON.stringify(broken.logs))
}

// 7 ── organizationJson wins ────────────────────────────────────────────
{
  const custom = { '@type': 'Dentist', name: 'Two offices', department: [{ '@type': 'Dentist', name: 'McLean' }] }
  const h = await boot({ settings: { organizationJson: JSON.stringify(custom) } })
  const doc = graphOf(h.filters['publish.html'](page({ title: 'x' }), { slug: 'index' }))
  const org = oneOfType(doc, 'Dentist')
  check('a hand-written organisation replaces the generated one', org.name === 'Two offices')
  check('it is still given an @id so the graph can point at it',
    org['@id'] === 'https://www.drnahlah.com/#organization')
  check('the WebPage still points at it', oneOfType(doc, 'WebPage').about['@id'] === org['@id'])

  const bad = await boot({ settings: { organizationJson: 'not json at all' } })
  const doc2 = graphOf(bad.filters['publish.html'](page({ title: 'x' }), { slug: 'index' }))
  check('unparseable organizationJson falls back to the fields rather than emitting nothing',
    oneOfType(doc2, 'Dentist').name === 'Dr. Nahlah Implants and Prosthodontics Specialists')
  check('and it says so in the log', bad.logs.some((l) => l.indexOf('organizationJson') > -1))
}

// 8 ── serialisation safety ─────────────────────────────────────────────
{
  const h = await boot({ blocks: [{
    key: 'about',
    json: JSON.stringify({ '@type': 'FAQPage', name: 'end</script><script>alert(1)</script> and <!-- a comment' }),
    enabled: true,
  }] })
  const out = h.filters['publish.html'](
    page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' }), { slug: 'about' })
  check('no literal </script> escapes into the document',
    (out.match(/<\/script>/g) || []).length === 1, String((out.match(/<\/script>/g) || []).length))
  check('no literal <!-- from the data', out.indexOf('<!-- a comment') === -1)
  const doc = graphOf(out)
  check('and the payload still parses AND round-trips to the original string',
    oneOfType(doc, 'FAQPage').name === 'end</script><script>alert(1)</script> and <!-- a comment',
    oneOfType(doc, 'FAQPage').name)
}

// 9 ── idempotence and edges ────────────────────────────────────────────
{
  const h = await boot()
  const src = page({ title: 'Dental Implants &amp; Prosthodontics | McLean &amp; Alexandria VA', body: BODY })
  const once = h.filters['publish.html'](src, { slug: 'index' })
  const twice = h.filters['publish.html'](once, { slug: 'index' })
  check('running the filter twice changes nothing the second time', once === twice)
  check('a document with no </head> is returned untouched',
    h.filters['publish.html']('<p>fragment</p>', { slug: 'index' }) === '<p>fragment</p>')
  check('an empty string is returned untouched', h.filters['publish.html']('', { slug: 'index' }) === '')

  const noUrl = await boot({ settings: { siteUrl: '' } })
  const doc = graphOf(noUrl.filters['publish.html'](src, { slug: 'index' }))
  check('with no site URL a graph is still emitted', !!doc)
  check('with no site URL no node claims a relative @id',
    doc['@graph'].every((n) => !n['@id'] || /^https?:/.test(n['@id'])),
    JSON.stringify(doc['@graph'].map((n) => n['@id'])))
  check('with no site URL there is no breadcrumb to build',
    nodesOfType(graphOf(noUrl.filters['publish.html'](
      page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' }), { slug: 'about' })),
    'BreadcrumbList').length === 0)

  const unknown = h.filters['publish.html'](page({ title: 'A page nobody knows about' }), { slug: 'nope' })
  const uDoc = graphOf(unknown)
  check('a page the mirror does not know still gets the organisation',
    !!uDoc && nodesOfType(uDoc, 'Dentist').length === 1)
  check('…and no WebPage claiming a URL it cannot know',
    nodesOfType(uDoc, 'WebPage').every((n) => !n.url), JSON.stringify(nodesOfType(uDoc, 'WebPage')))
}

// 10 ── the routes ──────────────────────────────────────────────────────
{
  const h = await boot()
  const list = await h.routes['GET /entries']({})
  check('GET /entries returns every page and every entry', list.entries.length === 5, String(list.entries.length))
  check('GET /entries carries the derived URL',
    list.entries.some((p) => p.url === 'https://www.drnahlah.com/posts/all-on-four-your-questions'))

  const saved = await h.routes['POST /entry']({ body: { key: 'about', json: '{"@type":"FAQPage"}' } })
  check('POST /entry stores a valid block', saved.saved === 1 && h.records.size === 1)
  check('the stored block reaches the filter',
    nodesOfType(graphOf(h.filters['publish.html'](
      page({ title: 'Why Choose Us | Dr. Nahlah Implants &amp; Prosthodontics | McLean, VA' }), { slug: 'about' })),
    'FAQPage').length === 1)

  const rejected = await h.routes['POST /entry']({ body: { key: 'about', json: '{ nope' } })
  check('POST /entry refuses invalid JSON', rejected.__response === true && rejected.status === 400)
  const noType = await h.routes['POST /entry']({ body: { key: 'about', json: '{"name":"x"}' } })
  check('POST /entry refuses a node with no @type', noType.__response === true && noType.status === 400)
  const noKey = await h.routes['POST /entry']({ body: { json: '{"@type":"Thing"}' } })
  check('POST /entry refuses a missing key', noKey.__response === true && noKey.status === 400)

  await h.routes['POST /entry']({ body: { key: 'about', json: '{"@type":"HowTo"}' } })
  check('a second POST updates rather than duplicating', h.records.size === 1)
  const del = await h.routes['DELETE /entry']({ body: { key: 'about' } })
  check('DELETE /entry removes it', del.deleted === 1 && h.records.size === 0)

  const preview = await h.routes['POST /preview']({ body: {
    html: page({ title: 'All-On-Four, Your Questions Answered', body: BODY }), slug: 'post',
  } })
  check('POST /preview returns a parseable graph for that page',
    preview.jsonld['@graph'].some((n) => n['@id'] === 'https://www.drnahlah.com/posts/all-on-four-your-questions#article'))

  const audit = await h.routes['GET /audit']({})
  check('GET /audit counts the pages with and without a block',
    audit.total === 5 && audit.withBlock === 0 && audit.withoutBlock.length === 5,
    JSON.stringify({ total: audit.total, withBlock: audit.withBlock }))
}

// 11 ── the bulk API ────────────────────────────────────────────────────
{
  const h = await boot()
  const bulk = h.routes['POST /bulk']

  const template = {
    '@type': 'FAQPage',
    mainEntity: [{ '@type': 'Question', name: '{title}', acceptedAnswer: { '@type': 'Answer', text: '{description}' } }],
    url: '{url}',
  }

  const dry = await bulk({ body: { match: { kind: 'entry' }, template } })
  check('a dry run is the default', dry.dryRun === true)
  check('the dry run matched only the entries', dry.matched === 2, String(dry.matched))
  check('the dry run wrote nothing', h.records.size === 0)
  const first = JSON.parse(dry.changes[0].json)
  check('{title} interpolates from the SEO title, deep inside the template',
    first.mainEntity[0].name.indexOf('| Dr. Nahlah DDS. MS.') > -1, first.mainEntity[0].name)
  check('{description} interpolates too', first.mainEntity[0].acceptedAnswer.text.length > 10)
  check('{url} interpolates', /^https:\/\/www\.drnahlah\.com\/posts\//.test(first.url), first.url)

  const applied = await bulk({ body: { match: { kind: 'entry' }, template, dryRun: false } })
  check('applying writes one block per match', applied.written === 2 && h.records.size === 2)
  check('the applied block reaches the filter',
    nodesOfType(graphOf(h.filters['publish.html'](
      page({ title: 'All-On-Four, Your Questions Answered' }), { slug: 'post' })), 'FAQPage').length === 1)

  const merged = await bulk({ body: {
    match: { kind: 'entry' }, template: { '@type': 'HowTo', name: '{title}' }, mode: 'merge', dryRun: false,
  } })
  check('merge appends rather than replacing', merged.written === 2 && h.records.size === 2)
  const after = graphOf(h.filters['publish.html'](
    page({ title: 'All-On-Four, Your Questions Answered' }), { slug: 'post' }))
  check('both the original and the appended node survive a merge',
    nodesOfType(after, 'FAQPage').length === 1 && nodesOfType(after, 'HowTo').length === 1)

  const replaced = await bulk({ body: {
    match: { kind: 'entry' }, template: { '@type': 'Thing', name: 'only me' }, mode: 'replace', dryRun: false,
  } })
  const afterReplace = graphOf(h.filters['publish.html'](
    page({ title: 'All-On-Four, Your Questions Answered' }), { slug: 'post' }))
  check('replace drops what was there', replaced.written === 2 &&
    nodesOfType(afterReplace, 'FAQPage').length === 0 && nodesOfType(afterReplace, 'Thing').length === 1)

  const prefixed = await bulk({ body: { match: { slugPrefix: 'about' }, template: { '@type': 'Thing' } } })
  check('slugPrefix narrows the match', prefixed.matched === 1 && prefixed.changes[0].key === 'about')
  const badTemplate = await bulk({ body: { template: { name: 'no type' } } })
  check('a template with no @type is refused',
    badTemplate.__response === true && badTemplate.status === 400, JSON.stringify(badTemplate).slice(0, 160))
  const noTemplate = await bulk({ body: {} })
  check('a missing template is refused', noTemplate.__response === true && noTemplate.status === 400)

  const audit = await h.routes['GET /audit']({})
  check('the audit now reports the types actually declared',
    audit.withBlock === 2 && audit.types.Thing === 2, JSON.stringify(audit.types))
}

/* ── optional: the real published pages ───────────────────────────────── */

if (process.argv.includes('--live')) {
  const BASE = process.env.INSTATIC_BASE_URL || 'https://encorercm.com'
  console.log(`\nthe filter over LIVE pages (${BASE})\n`)
  const h = await boot()
  for (const [path, slug] of [['/', 'index'], ['/about', 'about'], ['/posts/all-on-four-your-questions', 'post']]) {
    let html
    try { html = await (await fetch(BASE + path)).text() } catch (e) { console.log(`  SKIP  ${path} (${e.message})`); continue }
    const out = h.filters['publish.html'](html, { slug })
    let doc = null
    try { doc = graphOf(out) } catch (e) { doc = null }
    check(`${path} gains a graph that parses`, !!doc)
    check(`${path} still parses as one document`,
      (out.match(/<\/head>/g) || []).length === 1 && out.startsWith('<!DOCTYPE html>'))
    if (doc) console.log('        @types  ' + doc['@graph'].map((n) => n['@type']).join(', '))
  }
}

console.log(`\n${pass} passed, ${fail} failed\n`)
process.exit(fail ? 1 : 0)
