/**
 * AEO Schema — server entrypoint.
 *
 * Instatic emits no structured data. There is no `application/ld+json` anywhere
 * in `src/core/publisher/` — grep it — so an answer engine reading this site has
 * nothing to attach to: no organisation entity, no article metadata, no
 * breadcrumb, nothing to resolve "who is this" against a knowledge graph it
 * already holds.
 *
 * This plugin writes ONE `<script type="application/ld+json">` into every
 * published page, holding a `@graph` of linked nodes:
 *
 *   Organization / Dentist   the practice, one stable @id, on every page
 *   WebSite                  the site, on the home page
 *   WebPage                  this page, tied to both
 *   BreadcrumbList           built from this page's own address
 *   Article                  journal entries, with dates and a publisher
 *   …plus any hand-written block for this page
 *
 * One `@graph` rather than five script tags on purpose: nodes reference each
 * other by `@id`, and a consumer that reads only the first script tag then sees
 * the whole picture instead of an arbitrary fifth of it.
 *
 * ## Everything the Open Graph plugin learned applies here
 *
 * These two are siblings and share their two hard-won facts. They are
 * duplicated rather than shared because a plugin package is a unit of install —
 * a shared file would have to be a third package, and neither could be
 * installed without it.
 *
 * **1. `slug` does not identify an article.** For an entry page the pipeline
 * passes the MERGED TEMPLATE's slug (`publicRenderer.ts` →
 * `renderPublishedDataRowTemplate` returns `slug: merged.slug`), so all 43
 * articles arrive as `slug: "post"`. The document title is the row's, so the
 * resolver matches on slug first and falls back to title.
 *
 * **2. The filter must be synchronous.** It runs inside the QuickJS worker via
 * an RPC round-trip; calling back out to `api.cms.content.*` from inside it
 * would be a second round-trip while the host awaits the first. Everything is
 * loaded into `MIRROR` beforehand, on the `publish.before` event the pipeline
 * awaits, behind a 10-second floor so a 37-page publish reloads once.
 *
 * ## Serialising JSON-LD safely
 *
 * `<script>` is a raw-text element: the parser ends it at the first `</script`,
 * inside a string literal or not. `JSON.stringify` will happily emit one from a
 * page description that quotes markup. Every `<` is replaced with its JSON
 * unicode escape, which is valid JSON, decodes to the same string, and cannot
 * close the element or open a comment.
 *
 * Requires: cms.hooks, cms.storage, cms.routes, cms.content.read
 */

/* ── settings ─────────────────────────────────────────────────────────── */

function setting (api, key, fallback) {
  var v = api.cms.settings.get(key)
  return v === undefined || v === null || v === '' ? fallback : v
}
function flag (api, key, fallback) {
  var v = api.cms.settings.get(key)
  return v === undefined || v === null ? fallback : v !== false
}

/* ── text ─────────────────────────────────────────────────────────────── */

function decodeEntities (s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;/gi, "'").replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
}
function oneLine (s, max) {
  var t = String(s === null || s === undefined ? '' : s).replace(/\s+/g, ' ').replace(/^ | $/g, '')
  if (!max || t.length <= max) return t
  return t.slice(0, max).replace(/\s+\S*$/, '') + '…'
}
function titleKey (s) {
  return decodeEntities(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/^ | $/g, '')
}
function lines (s) {
  return String(s || '').split(/[\r\n]+/).map(function (x) { return x.trim() }).filter(Boolean)
}

/* ── urls ─────────────────────────────────────────────────────────────── */

function trimBase (base) { return String(base || '').replace(/\/+$/, '') }

function absolute (base, url) {
  var u = String(url || '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  if (/^\/\//.test(u)) return 'https:' + u
  var b = trimBase(base)
  if (!b) return ''
  return b + '/' + u.replace(/^\/+/, '')
}

function pageUrl (base, routeBase, slug) {
  var b = trimBase(base)
  if (!b) return ''
  var s = String(slug || '').replace(/^\/+|\/+$/g, '')
  var r = String(routeBase || '/').replace(/^\/+|\/+$/g, '')
  if (r === '' && (s === '' || s === 'index')) return b + '/'
  return b + '/' + (r ? r + '/' : '') + s
}

/* ── reading the rendered document ────────────────────────────────────── */

var TITLE_RE = /<title[^>]*>([\s\S]*?)<\/title\s*>/i
var DESC_RE = /<meta\s+name=["']description["']\s+content="([^"]*)"\s*\/?>/i
var HEAD_END_RE = /<\/head\s*>/i
var OURS_RE = /<script type="application\/ld\+json" data-aeo="webzite\.aeo-schema">/i

var IMG_RE = /<img\b[^>]*>/gi
var SRC_RE = /\bsrc\s*=\s*"([^"]*)"/i
var ALT_RE = /\balt\s*=\s*"([^"]*)"/i
var SKIP_IMG_RE = /logo|icon|favicon|sprite|placeholder|\.svg(\?|$)/i

function leadImage (html) {
  var body = html.slice(html.search(/<body\b/i) + 1)
  IMG_RE.lastIndex = 0
  var m
  while ((m = IMG_RE.exec(body))) {
    var src = SRC_RE.exec(m[0])
    if (!src) continue
    var value = decodeEntities(src[1]).trim()
    if (!value || SKIP_IMG_RE.test(value)) continue
    var alt = ALT_RE.exec(m[0])
    if (alt && SKIP_IMG_RE.test(alt[1])) continue
    return value
  }
  return ''
}

/* ── the mirror ───────────────────────────────────────────────────────── */

var MIRROR = { bySlug: {}, byTitle: {}, blocks: {}, at: 0, loading: null }
var REFRESH_FLOOR_MS = 10000

function keyFor (record) {
  return record.kind === 'entry' ? record.tableSlug + ':' + record.slug : record.slug
}

async function loadMirror (api) {
  var bySlug = {}
  var byTitle = {}
  var blocks = {}

  try {
    var offset = 0
    for (;;) {
      var res = await api.cms.storage.collection('schema-blocks').list({ limit: 200, offset: offset })
      var records = (res && res.records) || []
      for (var i = 0; i < records.length; i++) {
        var d = records[i].data || {}
        if (!d.key) continue
        blocks[String(d.key)] = { id: records[i].id, data: d }
      }
      if (records.length < 200) break
      offset += 200
      if (offset > 4000) break
    }
  } catch (e) {
    api.plugin.log('aeo-schema: could not read blocks — ' + (e && e.message))
  }

  try {
    var tables = await api.cms.content.tables.list()
    for (var t = 0; t < tables.length; t++) {
      var table = tables[t]
      var isPages = table.slug === 'pages'
      var entries
      try {
        entries = await api.cms.content.table(table.slug).list({ limit: 500, status: 'any' })
      } catch (err) {
        continue   // not in contentAccess[] — a configuration fact, not an error
      }
      var list = (entries && entries.entries) || []
      for (var j = 0; j < list.length; j++) {
        var row = list[j]
        var cells = row.cells || {}
        var record = {
          kind: isPages ? 'page' : 'entry',
          tableSlug: table.slug,
          routeBase: isPages ? '' : table.routeBase,
          slug: row.slug,
          title: typeof cells.title === 'string' ? cells.title : '',
          seoTitle: typeof cells.seoTitle === 'string' ? cells.seoTitle : '',
          seoDescription: typeof cells.seoDescription === 'string' ? cells.seoDescription : '',
          publishedAt: row.publishedAt || null,
          updatedAt: row.updatedAt || null,
        }
        if (isPages) bySlug[row.slug] = record
        var key = titleKey(record.title)
        if (key && (!byTitle[key] || byTitle[key].kind === 'page')) byTitle[key] = record
      }
    }
  } catch (e) {
    api.plugin.log('aeo-schema: could not read content — ' + (e && e.message))
  }

  MIRROR = { bySlug: bySlug, byTitle: byTitle, blocks: blocks, at: Date.now(), loading: null }
  return MIRROR
}

function refreshMirror (api, force) {
  if (!force && Date.now() - MIRROR.at < REFRESH_FLOOR_MS) return MIRROR.loading || Promise.resolve(MIRROR)
  if (MIRROR.loading) return MIRROR.loading
  var p = loadMirror(api)
  MIRROR.loading = p
  return p
}

function resolveDocument (slug, docTitle) {
  var key = titleKey(docTitle)
  var byTitle = MIRROR.byTitle[key] || null
  var bySlug = MIRROR.bySlug[String(slug || '')] || null
  if (bySlug && titleKey(bySlug.title) === key) return bySlug
  if (byTitle) return byTitle
  return bySlug
}

/* ── the graph ────────────────────────────────────────────────────────── */

var ORG_ID = '#organization'
var SITE_ID = '#website'

/**
 * The organisation node.
 *
 * `organizationJson` wins outright when it is set: a practice with two offices
 * cannot be expressed by the flat fields, and pretending otherwise would put a
 * single wrong address on eighty pages. The pasted object is only given an
 * `@id` if it has none, so the rest of the graph can still point at it.
 */
function organizationNode (api, siteUrl) {
  var raw = setting(api, 'organizationJson', '')
  if (raw) {
    var parsed = null
    try { parsed = JSON.parse(raw) } catch (e) { parsed = null }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      if (!parsed['@id'] && siteUrl) parsed['@id'] = siteUrl + '/' + ORG_ID
      if (!parsed['@type']) parsed['@type'] = setting(api, 'organizationType', 'Organization')
      delete parsed['@context']
      return parsed
    }
    api.plugin.log('aeo-schema: organizationJson is not a JSON object — falling back to the fields')
  }

  var node = { '@type': setting(api, 'organizationType', 'Organization') }
  if (siteUrl) node['@id'] = siteUrl + '/' + ORG_ID
  var name = setting(api, 'organizationName', '') || setting(api, 'siteName', '')
  if (name) node.name = name
  if (siteUrl) node.url = siteUrl + '/'
  var logo = absolute(siteUrl, setting(api, 'logo', ''))
  if (logo) node.logo = { '@type': 'ImageObject', url: logo }
  var tel = setting(api, 'telephone', '')
  if (tel) node.telephone = tel
  var price = setting(api, 'priceRange', '')
  if (price) node.priceRange = price
  var same = lines(setting(api, 'sameAs', ''))
  if (same.length) node.sameAs = same
  return node
}

function websiteNode (api, siteUrl, org) {
  var node = { '@type': 'WebSite' }
  if (siteUrl) {
    node['@id'] = siteUrl + '/' + SITE_ID
    node.url = siteUrl + '/'
  }
  var name = setting(api, 'siteName', '') || setting(api, 'organizationName', '')
  if (name) node.name = name
  if (org && org['@id']) node.publisher = { '@id': org['@id'] }
  return node
}

/**
 * Breadcrumbs from the page's own address.
 *
 * `/posts/all-on-four-your-questions` becomes Home › Posts › the article's own
 * title. The last crumb is named from the page, the middle ones from the path
 * segment title-cased — there is no page behind `/posts/` on this site other
 * than the index, so inventing a prettier name for it would be a guess.
 */
function breadcrumbNode (siteUrl, url, name) {
  if (!siteUrl || !url) return null
  var rest = url.slice(siteUrl.length).replace(/^\/+|\/+$/g, '')
  var items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl + '/' }]
  if (rest) {
    var parts = rest.split('/')
    var acc = siteUrl
    for (var i = 0; i < parts.length; i++) {
      acc += '/' + parts[i]
      var last = i === parts.length - 1
      items.push({
        '@type': 'ListItem',
        position: i + 2,
        name: last && name ? name : parts[i].replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase() }),
        item: acc,
      })
    }
  }
  if (items.length < 2) return null
  return { '@type': 'BreadcrumbList', itemListElement: items }
}

/** Parse a stored block into graph members. Never throws. */
function blockNodes (raw, log) {
  if (!raw) return []
  var parsed
  try { parsed = JSON.parse(raw) } catch (e) {
    if (log) log('aeo-schema: a stored block is not valid JSON — skipped')
    return []
  }
  var list = Array.isArray(parsed) ? parsed : [parsed]
  var out = []
  for (var i = 0; i < list.length; i++) {
    var node = list[i]
    if (!node || typeof node !== 'object' || Array.isArray(node)) continue
    // The graph carries one @context; a member that brings its own is not
    // wrong, it is just redundant, and some validators complain about it.
    if (node['@graph'] && Array.isArray(node['@graph'])) {
      for (var g = 0; g < node['@graph'].length; g++) {
        var member = node['@graph'][g]
        if (member && typeof member === 'object') { delete member['@context']; out.push(member) }
      }
      continue
    }
    delete node['@context']
    out.push(node)
  }
  return out
}

function buildGraph (api, html, ctx) {
  var siteUrl = trimBase(setting(api, 'siteUrl', ''))
  var docTitleRaw = TITLE_RE.exec(html)
  var docTitle = docTitleRaw ? decodeEntities(docTitleRaw[1]) : ''
  var record = resolveDocument(ctx && ctx.slug, docTitle)

  var url = record ? pageUrl(siteUrl, record.routeBase, record.slug) : ''
  var name = oneLine((record && record.seoTitle) || docTitle, 160)
  var description = oneLine(
    (record && record.seoDescription) || decodeEntities((DESC_RE.exec(html) || [])[1] || ''), 300)
  var image = absolute(siteUrl, leadImage(html))

  var graph = []
  var org = flag(api, 'emitOrganization', true) ? organizationNode(api, siteUrl) : null
  if (org) graph.push(org)

  var isHome = !!record && record.kind === 'page' && (record.slug === 'index' || record.slug === '')
  var site = null
  if (flag(api, 'emitWebSite', true) && isHome) {
    site = websiteNode(api, siteUrl, org)
    graph.push(site)
  }

  if (flag(api, 'emitWebPage', true) && (url || name)) {
    var webpage = { '@type': 'WebPage' }
    if (url) webpage['@id'] = url + '#webpage'
    if (url) webpage.url = url
    if (name) webpage.name = name
    if (description) webpage.description = description
    if (image) webpage.primaryImageOfPage = { '@type': 'ImageObject', url: image }
    if (siteUrl) webpage.isPartOf = { '@id': siteUrl + '/' + SITE_ID }
    if (org && org['@id']) webpage.about = { '@id': org['@id'] }
    graph.push(webpage)
  }

  if (flag(api, 'emitBreadcrumbs', true) && !isHome) {
    var crumbs = breadcrumbNode(siteUrl, url, name)
    if (crumbs) graph.push(crumbs)
  }

  if (flag(api, 'emitArticle', true) && record && record.kind === 'entry') {
    var article = { '@type': 'Article' }
    if (url) article['@id'] = url + '#article'
    if (name) article.headline = oneLine(name, 110)   // Google truncates past 110
    if (description) article.description = description
    if (image) article.image = [image]
    if (url) article.mainEntityOfPage = { '@id': url + '#webpage' }
    if (record.publishedAt) article.datePublished = record.publishedAt
    if (record.updatedAt) article.dateModified = record.updatedAt
    if (org && org['@id']) {
      article.publisher = { '@id': org['@id'] }
      article.author = { '@id': org['@id'] }
    }
    graph.push(article)
  }

  if (record) {
    var stored = MIRROR.blocks[keyFor(record)]
    if (stored && stored.data.enabled !== false) {
      var custom = blockNodes(stored.data.json, api.plugin.log)
      for (var c = 0; c < custom.length; c++) graph.push(custom[c])
    }
  }
  var global = MIRROR.blocks['*']
  if (global && global.data.enabled !== false) {
    var gn = blockNodes(global.data.json, api.plugin.log)
    for (var g2 = 0; g2 < gn.length; g2++) graph.push(gn[g2])
  }

  if (graph.length === 0) return null
  return { '@context': 'https://schema.org', '@graph': collapseById(graph) }
}

/**
 * Two nodes sharing an `@id` ARE one entity. Say so in the output rather than
 * leaving every consumer to work it out.
 *
 * This is what lets a hand-written block EXTEND a generated node instead of
 * sitting beside it: a page block keyed `<url>#webpage` folds into the
 * generated WebPage, and an article's `BlogPosting` folds into the generated
 * `Article`. Before this, `/privacy-policy` published two `WebPage` nodes with
 * the same id and `/posts/…` published the same article twice.
 *
 * The block wins on any property both carry — a value someone typed should
 * beat a derived one — and `@type` becomes the union, generated type first, so
 * the merged node reads `["WebPage", "AboutPage"]`: a subtype added to the
 * type it specialises, which is exactly what schema.org expects.
 */
function collapseById (graph) {
  var out = []
  var byId = {}
  for (var i = 0; i < graph.length; i++) {
    var node = graph[i]
    var id = node && node['@id']
    if (!id) { out.push(node); continue }
    if (!byId[id]) { byId[id] = node; out.push(node); continue }

    var target = byId[id]
    var types = [].concat(target['@type'] || []).concat(node['@type'] || [])
    var seen = {}
    var merged = []
    for (var t = 0; t < types.length; t++) {
      if (!types[t] || seen[types[t]]) continue
      seen[types[t]] = true
      merged.push(types[t])
    }
    for (var k in node) {
      if (k === '@type' || k === '@id') continue
      target[k] = node[k]
    }
    target['@type'] = merged.length === 1 ? merged[0] : merged
  }
  return out
}

/**
 * `<script>` is a raw-text element — the parser closes it at the first
 * `</script`, string literal or not — and `<!--` opens a comment. Replacing
 * every `<` with its JSON unicode escape is valid JSON, decodes to the
 * identical string, and makes both impossible.
 */
function serialize (doc) {
  return JSON.stringify(doc, null, 2).replace(/</g, '\\u003c')
}

/* ── routes ───────────────────────────────────────────────────────────── */

var CAP = 'content.manage'

function bad (status, message) {
  return { __response: true, status: status, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }) }
}

/** JSON-LD a caller wants stored: must parse, and must be an object or array. */
function validateJson (raw) {
  var text = String(raw === undefined || raw === null ? '' : raw).trim()
  if (!text) return { ok: true, text: '' }
  var parsed
  try { parsed = JSON.parse(text) } catch (e) {
    return { ok: false, error: 'not valid JSON: ' + (e && e.message) }
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'JSON-LD must be an object or an array of objects' }
  }
  var list = Array.isArray(parsed) ? parsed : [parsed]
  for (var i = 0; i < list.length; i++) {
    if (!list[i] || typeof list[i] !== 'object' || Array.isArray(list[i])) {
      return { ok: false, error: 'every member of the array must be an object' }
    }
    if (!list[i]['@type'] && !list[i]['@graph']) {
      return { ok: false, error: 'every node needs an @type (or an @graph of nodes that do)' }
    }
  }
  // Re-serialise so what is stored is canonical, and so a block written with
  // smart quotes or a trailing comma cannot be stored in a shape that parses
  // here and not in the filter.
  return { ok: true, text: JSON.stringify(parsed) }
}

function registerRoutes (api) {
  /* GET /entries — every page, its derived nodes, and any block it carries. */
  api.cms.routes.authenticated.get('/entries', async function () {
    await refreshMirror(api, true)
    var siteUrl = trimBase(setting(api, 'siteUrl', ''))
    var rows = []
    var seen = {}
    var push = function (record) {
      var key = keyFor(record)
      if (seen[key]) return
      seen[key] = true
      var b = MIRROR.blocks[key]
      rows.push({
        key: key,
        kind: record.kind,
        tableSlug: record.tableSlug,
        slug: record.slug,
        title: record.title,
        seoTitle: record.seoTitle,
        seoDescription: record.seoDescription,
        url: pageUrl(siteUrl, record.routeBase, record.slug),
        block: b ? b.data : null,
        types: b ? typesIn(b.data.json) : [],
      })
    }
    for (var s in MIRROR.bySlug) push(MIRROR.bySlug[s])
    for (var t in MIRROR.byTitle) push(MIRROR.byTitle[t])
    rows.sort(function (a, b) {
      if (a.kind !== b.kind) return a.kind === 'page' ? -1 : 1
      return a.slug < b.slug ? -1 : 1
    })
    var globalBlock = MIRROR.blocks['*']
    return { entries: rows, global: globalBlock ? globalBlock.data : null, settings: api.cms.settings.getAll() }
  })

  /* POST /entry — upsert ONE block. `key: "*"` is the site-wide block. */
  api.cms.routes.post('/entry', CAP, async function (ctx) {
    var body = ctx.body || {}
    var key = String(body.key || '').trim()
    if (!key) return bad(400, 'key is required')
    var checked = validateJson(body.json)
    if (!checked.ok) return bad(400, checked.error)
    await refreshMirror(api, true)
    var data = {
      key: key,
      json: checked.text,
      note: oneLine(String(body.note || ''), 200),
      enabled: body.enabled === false ? false : true,
    }
    var existing = MIRROR.blocks[key]
    var record = existing
      ? await api.cms.storage.collection('schema-blocks').update(existing.id, data)
      : await api.cms.storage.collection('schema-blocks').create(data)
    await refreshMirror(api, true)
    return { saved: 1, record: record }
  })

  api.cms.routes.delete('/entry', CAP, async function (ctx) {
    var key = String((ctx.body && ctx.body.key) || '').trim()
    if (!key) return bad(400, 'key is required')
    await refreshMirror(api, true)
    var existing = MIRROR.blocks[key]
    if (!existing) return { deleted: 0 }
    await api.cms.storage.collection('schema-blocks').delete(existing.id)
    await refreshMirror(api, true)
    return { deleted: 1 }
  })

  /**
   * POST /bulk — one JSON-LD template across a matched set of pages.
   *
   * This is the whole point of the API. A site of eighty pages needs the same
   * shape of node on many of them with a different value in each, and there is
   * no version of that which is reasonable to click.
   *
   *   {
   *     "match": { "kind": "entry" },
   *     "template": {
   *       "@type": "FAQPage",
   *       "mainEntity": [{
   *         "@type": "Question",
   *         "name": "{title}",
   *         "acceptedAnswer": { "@type": "Answer", "text": "{description}" }
   *       }]
   *     },
   *     "mode": "replace",
   *     "dryRun": true
   *   }
   *
   * `{title}`, `{slug}`, `{url}` and `{description}` are substituted per page
   * inside every string in the template, however deeply nested. `mode` is
   * `replace` (default) or `merge`, which appends the rendered template to
   * whatever the page already carries. `dryRun` is the default and returns the
   * exact JSON that would be stored, page by page, so it can be read before it
   * is written.
   */
  api.cms.routes.post('/bulk', CAP, async function (ctx) {
    var body = ctx.body || {}
    var match = body.match || {}
    var template = body.template
    var mode = body.mode === 'merge' ? 'merge' : 'replace'
    var dryRun = body.dryRun !== false
    if (!template || typeof template !== 'object') return bad(400, '`template` must be an object or an array')
    var shape = validateJson(JSON.stringify(template))
    if (!shape.ok) return bad(400, '`template` ' + shape.error)

    await refreshMirror(api, true)
    var siteUrl = trimBase(setting(api, 'siteUrl', ''))

    var targets = []
    var seen = {}
    var consider = function (record) {
      var key = keyFor(record)
      if (seen[key]) return
      seen[key] = true
      if (match.kind && record.kind !== match.kind) return
      if (match.tableSlug && record.tableSlug !== match.tableSlug) return
      if (match.slug && record.slug !== match.slug) return
      if (match.slugPrefix && String(record.slug).indexOf(String(match.slugPrefix)) !== 0) return
      if (match.keys && match.keys.indexOf(key) < 0) return
      targets.push(record)
    }
    for (var s in MIRROR.bySlug) consider(MIRROR.bySlug[s])
    for (var t in MIRROR.byTitle) consider(MIRROR.byTitle[t])

    var planned = []
    for (var i = 0; i < targets.length; i++) {
      var record = targets[i]
      var key = keyFor(record)
      var tokens = {
        '{title}': record.seoTitle || record.title,
        '{slug}': record.slug,
        '{url}': pageUrl(siteUrl, record.routeBase, record.slug),
        '{description}': record.seoDescription,
      }
      var rendered = interpolate(template, tokens)
      var next = Array.isArray(rendered) ? rendered.slice() : [rendered]
      var existing = MIRROR.blocks[key]
      if (mode === 'merge' && existing) {
        var prior = blockNodes(existing.data.json, null)
        next = prior.concat(next)
      }
      planned.push({
        key: key,
        id: existing ? existing.id : null,
        json: JSON.stringify(next.length === 1 ? next[0] : next),
      })
    }

    if (dryRun) return { dryRun: true, mode: mode, matched: planned.length, changes: planned }

    var written = 0
    var failed = []
    for (var p = 0; p < planned.length; p++) {
      try {
        var data = { key: planned[p].key, json: planned[p].json, note: oneLine(String(body.note || 'bulk'), 200), enabled: true }
        if (planned[p].id) await api.cms.storage.collection('schema-blocks').update(planned[p].id, data)
        else await api.cms.storage.collection('schema-blocks').create(data)
        written++
      } catch (e) {
        failed.push({ key: planned[p].key, error: String(e && e.message) })
      }
    }
    await refreshMirror(api, true)
    return { dryRun: false, mode: mode, matched: planned.length, written: written, failed: failed }
  })

  /* POST /preview — the exact graph a page would receive. */
  api.cms.routes.post('/preview', CAP, async function (ctx) {
    var html = String((ctx.body && ctx.body.html) || '')
    var slug = String((ctx.body && ctx.body.slug) || '')
    if (!html) return bad(400, 'html is required')
    await refreshMirror(api, true)
    var doc = buildGraph(api, html, { slug: slug })
    return { jsonld: doc, text: doc ? serialize(doc) : null }
  })

  /* GET /audit — which @types the site actually declares, and where it does not. */
  api.cms.routes.authenticated.get('/audit', async function () {
    await refreshMirror(api, true)
    var counts = {}
    var withBlock = 0
    var total = 0
    var missing = []
    var seen = {}
    var consider = function (record) {
      var key = keyFor(record)
      if (seen[key]) return
      seen[key] = true
      total++
      var b = MIRROR.blocks[key]
      if (b && b.data.enabled !== false && b.data.json) {
        withBlock++
        var types = typesIn(b.data.json)
        for (var i = 0; i < types.length; i++) counts[types[i]] = (counts[types[i]] || 0) + 1
      } else {
        missing.push(key)
      }
    }
    for (var s in MIRROR.bySlug) consider(MIRROR.bySlug[s])
    for (var t in MIRROR.byTitle) consider(MIRROR.byTitle[t])
    return { total: total, withBlock: withBlock, types: counts, withoutBlock: missing }
  })
}

/** Every `@type` inside a stored block, flattened. */
function typesIn (raw) {
  var nodes = blockNodes(raw, null)
  var out = []
  var walk = function (node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) { for (var a = 0; a < node.length; a++) walk(node[a]); return }
    if (typeof node['@type'] === 'string' && out.indexOf(node['@type']) < 0) out.push(node['@type'])
    for (var k in node) if (k !== '@type') walk(node[k])
  }
  for (var i = 0; i < nodes.length; i++) walk(nodes[i])
  return out
}

/** Replace `{token}`s inside every string of a structure, however deep. */
function interpolate (value, tokens) {
  if (typeof value === 'string') {
    var out = value
    for (var token in tokens) out = out.split(token).join(tokens[token] || '')
    return out
  }
  if (Array.isArray(value)) {
    var arr = []
    for (var i = 0; i < value.length; i++) arr.push(interpolate(value[i], tokens))
    return arr
  }
  if (value && typeof value === 'object') {
    var obj = {}
    for (var k in value) obj[k] = interpolate(value[k], tokens)
    return obj
  }
  return value
}

/* ── lifecycle ────────────────────────────────────────────────────────── */

export function activate (api) {
  registerRoutes(api)

  refreshMirror(api, true).catch(function (e) {
    api.plugin.log('aeo-schema: initial mirror load failed — ' + (e && e.message))
  })

  api.cms.hooks.on('publish.before', function () {
    return refreshMirror(api, false)
  })

  api.cms.hooks.filter('publish.html', function (html, ctx) {
    if (typeof html !== 'string' || html.length === 0) return html
    if (!flag(api, 'enabled', true)) return html
    if (OURS_RE.test(html)) return html          // idempotent: never a second graph
    if (!HEAD_END_RE.test(html)) return html

    var doc
    try {
      doc = buildGraph(api, html, ctx || {})
    } catch (e) {
      api.plugin.log('aeo-schema: ' + (e && e.message) + ' — page left untouched')
      return html
    }
    if (!doc) return html

    var block = '\n  <!-- Structured data — webzite.aeo-schema -->\n' +
      '  <script type="application/ld+json" data-aeo="webzite.aeo-schema">\n' +
      serialize(doc) + '\n  </script>\n'
    var at = html.search(HEAD_END_RE)
    return html.slice(0, at) + block + html.slice(at)
  })

  api.plugin.log('aeo-schema active')
}

export function install (api) { api.plugin.log('aeo-schema installed') }
export function deactivate (api) { api.plugin.log('aeo-schema deactivated') }
export function uninstall (api) { api.plugin.log('aeo-schema uninstalled') }
