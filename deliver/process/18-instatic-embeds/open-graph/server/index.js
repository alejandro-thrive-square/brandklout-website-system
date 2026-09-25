/**
 * Open Graph — server entrypoint.
 *
 * Instatic's publisher writes exactly three things into `<head>`: the page
 * title, ONE site-wide description, and the favicon
 * (`src/core/publisher/render.ts` → `buildDocumentMetaTags`). There is no
 * `og:*`, no `twitter:*`, no `<link rel="canonical">` anywhere in the source —
 * grep it. A link to any page of this site pasted into Facebook, LinkedIn,
 * WhatsApp, Slack or iMessage therefore unfurls as a bare URL.
 *
 * This plugin closes that gap through the public plugin API, with no fork and
 * no patched image, and it does so for every page at once rather than asking
 * an operator to fill in eighty forms.
 *
 * ## Three things it writes
 *
 *   1. Open Graph + Twitter Card tags, per page.
 *   2. `<link rel="canonical">`, which the platform never emits.
 *   3. The page's OWN `<meta name="description">`, replacing the site-wide one.
 *
 * (3) needs saying plainly, because it is a correction and not a feature.
 * `posts.seoDescription` and `pages.seoDescription` are real cells; the admin
 * has a field for them; 30 of 37 pages and 43 of 43 articles have one written.
 * `buildDocumentMetaTags` reads `settings.metaDescription` and nothing else, so
 * every one of those 73 descriptions is stored and never published, and all 80
 * pages ship the identical sentence. The `syncMetaDescription` setting is on by
 * default because a share card and a search result that disagree about what a
 * page is about would be a worse outcome than either alone.
 *
 * ## The two hard parts
 *
 * ### 1. `slug` does not identify an article
 *
 * `applyPublishedHtmlPipeline` hands the filter `{ siteId, pageId, slug }`, and
 * for an entry page those come from the MERGED TEMPLATE, not from the row:
 *
 *     // publicRenderer.ts → renderPublishedDataRowTemplate
 *     return { ...rendered, pageId: merged.id, slug: merged.slug, … }
 *
 * So all 43 articles arrive as `slug: "post"` with one shared `pageId`. Keying
 * anything off `slug` alone gives every article the same share card — which
 * looks like it is working right up until someone shares two of them.
 *
 * What DOES distinguish them is the document title: the same function sets
 * `merged.title = row.cells.title` immediately before rendering, so `<title>` is
 * the article's own. The resolver below therefore matches on slug FIRST and
 * falls back to a title lookup, and prefers the title match whenever the slug's
 * page disagrees with the document title.
 *
 * ### 2. The filter has to be synchronous
 *
 * The filter runs inside the QuickJS worker via an RPC round-trip
 * (`runHookFilterInWorker`). Calling `api.cms.content.*` or
 * `api.cms.storage.*` from inside it would mean a second round-trip in the
 * other direction while the host is awaiting the first. `embed-origins` avoids
 * this by reading only `api.cms.settings.get`, which is a synchronous read of a
 * mirror the host pushes into the VM.
 *
 * Same discipline here: everything the filter needs is loaded into `MIRROR`
 * ahead of time and the filter itself does nothing but string work.
 * `publish.before` is `await`ed by the pipeline and fires once per rendered
 * page, so it is the right place to refresh — behind a 10-second floor, or a
 * 37-page publish would reload the whole content table 37 times.
 *
 * ## Idempotence
 *
 * A page that already carries `og:title` is returned untouched. Nothing here
 * appends a second copy of anything, so a re-publish, a republish and a
 * `publish.html` chain that runs this after another plugin are all safe.
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

/** Escape for an HTML ATTRIBUTE value. */
function esc (s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

/**
 * Undo the publisher's escaping before re-escaping our own.
 *
 * `<title>Dental Implants &amp; Prosthodontics</title>` must become
 * `og:title content="Dental Implants &amp; Prosthodontics"` and NOT
 * `content="Dental Implants &amp;amp; Prosthodontics"`. Decode-then-escape is
 * idempotent; skipping the decode is double-escaping, which is visible in every
 * share card as a literal `&amp;`.
 */
function decodeEntities (s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#x27;/gi, "'").replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')          // LAST — or `&amp;lt;` decodes twice
}

/** One line, collapsed whitespace, trimmed to `max` on a word boundary. */
function oneLine (s, max) {
  var t = String(s === null || s === undefined ? '' : s).replace(/\s+/g, ' ').replace(/^ | $/g, '')
  if (!max || t.length <= max) return t
  return t.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

/** Comparison key for a document title. */
function titleKey (s) {
  return decodeEntities(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/^ | $/g, '')
}

/* ── urls ─────────────────────────────────────────────────────────────── */

function trimBase (base) {
  return String(base || '').replace(/\/+$/, '')
}

/** Absolute form of a media path. '' when it cannot be made absolute. */
function absolute (base, url) {
  var u = String(url || '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  if (/^\/\//.test(u)) return 'https:' + u
  var b = trimBase(base)
  if (!b) return ''
  return b + '/' + u.replace(/^\/+/, '')
}

/** The public address of a page, from its route base and slug. */
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
var CANONICAL_RE = /<link\b[^>]*\brel\s*=\s*["']?canonical["']?[^>]*>/i
var HEAD_END_RE = /<\/head\s*>/i
var HAS_OG_RE = /<meta\s+property=["']og:title["']/i

/**
 * The first picture in the BODY that is plausibly the page's subject.
 *
 * Deliberately not the first `<img>` in the document: the header logo is the
 * first image on every page of this site, and a share card of the logo is the
 * same non-answer as no card at all. Skips anything whose src or alt says logo
 * or icon, and anything served as SVG (networks will not render one).
 */
var IMG_RE = /<img\b[^>]*>/gi
var SRC_RE = /\bsrc\s*=\s*"([^"]*)"/i
var ALT_RE = /\balt\s*=\s*"([^"]*)"/i
var SKIP_IMG_RE = /logo|icon|favicon|sprite|placeholder|\.svg(\?|$)/i

function leadImage (html) {
  var body = html.slice(html.search(/<body\b/i) + 1)
  IMG_RE.lastIndex = 0
  var m
  while ((m = IMG_RE.exec(body))) {
    var tag = m[0]
    var src = SRC_RE.exec(tag)
    if (!src) continue
    var value = decodeEntities(src[1]).trim()
    if (!value) continue
    var alt = ALT_RE.exec(tag)
    if (SKIP_IMG_RE.test(value)) continue
    if (alt && SKIP_IMG_RE.test(alt[1])) continue
    return { src: value, alt: alt ? decodeEntities(alt[1]) : '' }
  }
  return null
}

/* ── the mirror ───────────────────────────────────────────────────────── */
/**
 * Everything the synchronous filter is allowed to know, loaded ahead of it.
 *
 *   bySlug   — page slug            -> record   (ordinary pages)
 *   byTitle  — titleKey(row.title)  -> record   (entry pages: the ONLY key
 *                                                that separates the articles)
 *   overrides — key                 -> operator-typed values
 *
 * `key` is the same string the admin app and the API use: the page slug for a
 * page, and `<tableSlug>:<rowSlug>` for an entry.
 */
var MIRROR = { bySlug: {}, byTitle: {}, overrides: {}, at: 0, loading: null }
var REFRESH_FLOOR_MS = 10000

function overrideKeyFor (record) {
  return record.kind === 'entry' ? record.tableSlug + ':' + record.slug : record.slug
}

async function loadMirror (api) {
  var bySlug = {}
  var byTitle = {}
  var overrides = {}

  /* Overrides first: they are ours, they are small, and a failure here should
     not cost us the derived values. */
  try {
    var page = 0
    for (;;) {
      var res = await api.cms.storage.collection('og-overrides').list({ limit: 200, offset: page * 200 })
      var records = (res && res.records) || []
      for (var i = 0; i < records.length; i++) {
        var d = records[i].data || {}
        if (!d.key) continue
        overrides[String(d.key)] = { id: records[i].id, data: d }
      }
      if (records.length < 200) break
      page++
      if (page > 20) break
    }
  } catch (e) {
    api.plugin.log('open-graph: could not read overrides — ' + (e && e.message))
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
        // Not in `contentAccess[]` — the host fails closed and says so. That is
        // a configuration fact, not an error worth a stack trace every publish.
        continue
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
        }
        if (isPages) bySlug[row.slug] = record
        /* Pages must not shadow entries in the title index: the entry index is
           the only way an article can be identified at all, whereas a page can
           always be found by its slug. 1.2.2: an entry is indexed by its SEO
           title too, because a template that renders {currentEntry.seoTitle} as
           the <title> otherwise matched nothing and every article was tagged as
           the template page (og:url /blog-article, og:type website). */
        var keys = [titleKey(record.title)]
        if (!isPages && record.seoTitle) keys.push(titleKey(record.seoTitle))
        for (var kk = 0; kk < keys.length; kk++) {
          var key = keys[kk]
          if (key && (!byTitle[key] || byTitle[key].kind === 'page')) byTitle[key] = record
        }
      }
    }
  } catch (e) {
    api.plugin.log('open-graph: could not read content — ' + (e && e.message))
  }

  MIRROR = { bySlug: bySlug, byTitle: byTitle, overrides: overrides, at: Date.now(), loading: null }
  return MIRROR
}

function refreshMirror (api, force) {
  if (!force && Date.now() - MIRROR.at < REFRESH_FLOOR_MS) return MIRROR.loading || Promise.resolve(MIRROR)
  if (MIRROR.loading) return MIRROR.loading
  var p = loadMirror(api)
  MIRROR.loading = p
  return p
}

/**
 * Which document is this?
 *
 * Slug first, because for an ordinary page it is exact. Title second, because
 * for an entry page the slug is the TEMPLATE's and the title is the row's. When
 * the slug resolves to a page whose title is not the document's, the document
 * is being rendered through that page as a template — trust the title.
 */
function resolveDocument (slug, docTitle) {
  var key = titleKey(docTitle)
  var byTitle = MIRROR.byTitle[key] || null
  var bySlug = MIRROR.bySlug[String(slug || '')] || null
  if (bySlug && titleKey(bySlug.title) === key) return bySlug
  if (byTitle) return byTitle
  return bySlug
}

/* ── the tags ─────────────────────────────────────────────────────────── */

function meta (property, content) {
  return '  <meta property="' + property + '" content="' + esc(content) + '">\n'
}
function metaName (name, content) {
  return '  <meta name="' + name + '" content="' + esc(content) + '">\n'
}

function buildTags (api, html, ctx) {
  var siteUrl = trimBase(setting(api, 'siteUrl', ''))
  var derive = flag(api, 'deriveFromPage', true)

  var docTitleRaw = TITLE_RE.exec(html)
  var docTitle = docTitleRaw ? decodeEntities(docTitleRaw[1]) : ''
  var record = resolveDocument(ctx && ctx.slug, docTitle)
  var override = record ? (MIRROR.overrides[overrideKeyFor(record)] || null) : null
  var ov = override && override.data.enabled !== false ? override.data : {}

  /* An override alone is enough; without one, `deriveFromPage` decides whether
     this page gets tags at all. */
  var hasOverride = !!(ov.title || ov.description || ov.image || ov.url || ov.type)
  if (!hasOverride && !derive) return null

  var title = oneLine(ov.title || docTitle, 95)
  if (!title) return null

  var description = oneLine(
    ov.description ||
    (record && record.seoDescription) ||
    (derive ? decodeEntities((DESC_RE.exec(html) || [])[1] || '') : ''),
    200,
  )

  var lead = derive ? leadImage(html) : null
  var imageRaw = ov.image || (lead ? lead.src : '') || setting(api, 'defaultImage', '')
  var image = absolute(siteUrl, imageRaw)
  var imageAlt = ov.imageAlt ||
    (ov.image ? '' : (lead ? lead.alt : '')) ||
    (imageRaw === setting(api, 'defaultImage', '') ? setting(api, 'defaultImageAlt', '') : '')

  var url = ov.url ||
    (record ? pageUrl(siteUrl, record.routeBase, record.slug) : '')

  var type = ov.type ||
    (record && record.kind === 'entry' && flag(api, 'articleType', true)
      ? 'article'
      : setting(api, 'defaultType', 'website'))

  var out = '\n  <!-- Open Graph — brandklout.open-graph -->\n'
  out += meta('og:title', title)
  if (description) out += meta('og:description', description)
  out += meta('og:type', type)
  if (url) out += meta('og:url', url)
  if (image) out += meta('og:image', image)
  /* 1.2.3: size and type when the file name carries them (`…-1200x630.jpg`, the way the
     media library names resized uploads). Without them Facebook shows a link's first
     share with no picture while it fetches the image. */
  var dims = image ? /-(\d{2,5})x(\d{2,5})\.(jpe?g|png|webp)(?:\?|$)/i.exec(image) : null
  if (dims) {
    out += meta('og:image:width', dims[1])
    out += meta('og:image:height', dims[2])
    out += meta('og:image:type', 'image/' + (dims[3].toLowerCase() === 'jpg' ? 'jpeg' : dims[3].toLowerCase()))
  }
  if (image && imageAlt) out += meta('og:image:alt', oneLine(imageAlt, 180))
  var siteName = setting(api, 'siteName', '')
  if (siteName) out += meta('og:site_name', siteName)
  var locale = setting(api, 'locale', '')
  if (locale) out += meta('og:locale', locale)

  out += metaName('twitter:card', image ? setting(api, 'twitterCard', 'summary_large_image') : 'summary')
  var handle = String(setting(api, 'twitterSite', '')).trim()
  if (handle) out += metaName('twitter:site', handle.charAt(0) === '@' ? handle : '@' + handle)
  out += metaName('twitter:title', title)
  if (description) out += metaName('twitter:description', description)
  if (image) out += metaName('twitter:image', image)
  if (image && imageAlt) out += metaName('twitter:image:alt', oneLine(imageAlt, 180))

  if (url && flag(api, 'emitCanonical', true) && !CANONICAL_RE.test(html)) {
    out += '  <link rel="canonical" href="' + esc(url) + '">\n'
  }

  return { block: out, description: description }
}

/* ── routes ───────────────────────────────────────────────────────────── */

var CAP = 'content.manage'

function ok (body) { return body }
function bad (status, message) {
  return { __response: true, status: status, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }) }
}

/** The subset of an override we accept from a caller, normalised. */
var FIELDS = ['title', 'description', 'image', 'imageAlt', 'type', 'url']
function cleanOverride (input) {
  var out = { key: String(input.key || '').trim() }
  if (!out.key) return null
  for (var i = 0; i < FIELDS.length; i++) {
    var f = FIELDS[i]
    if (input[f] === undefined || input[f] === null) continue
    out[f] = oneLine(String(input[f]), 600)
  }
  out.enabled = input.enabled === false ? false : true
  return out
}

function registerRoutes (api) {
  /* GET /pages — everything the admin app draws: what each page would get
     today, and what has been overridden. This is also the honest answer to
     "what will the share card say", because it is computed from the same
     mirror the filter reads. */
  api.cms.routes.authenticated.get('/pages', async function () {
    await refreshMirror(api, true)
    var rows = []
    var seen = {}
    var push = function (record) {
      var key = overrideKeyFor(record)
      if (seen[key]) return
      seen[key] = true
      var o = MIRROR.overrides[key]
      rows.push({
        key: key,
        kind: record.kind,
        tableSlug: record.tableSlug,
        slug: record.slug,
        title: record.title,
        seoTitle: record.seoTitle,
        seoDescription: record.seoDescription,
        url: pageUrl(trimBase(setting(api, 'siteUrl', '')), record.routeBase, record.slug),
        override: o ? o.data : null,
      })
    }
    for (var s in MIRROR.bySlug) push(MIRROR.bySlug[s])
    for (var t in MIRROR.byTitle) push(MIRROR.byTitle[t])
    rows.sort(function (a, b) {
      if (a.kind !== b.kind) return a.kind === 'page' ? -1 : 1
      return a.slug < b.slug ? -1 : 1
    })
    return ok({ pages: rows, settings: api.cms.settings.getAll() })
  })

  /* POST /override — upsert ONE. */
  api.cms.routes.post('/override', CAP, async function (ctx) {
    var clean = cleanOverride(ctx.body || {})
    if (!clean) return bad(400, 'key is required')
    await refreshMirror(api, true)
    var existing = MIRROR.overrides[clean.key]
    var record = existing
      ? await api.cms.storage.collection('og-overrides').update(existing.id, clean)
      : await api.cms.storage.collection('og-overrides').create(clean)
    await refreshMirror(api, true)
    return ok({ saved: 1, record: record })
  })

  /* DELETE /override — remove ONE, so a page falls back to derived values. */
  api.cms.routes.delete('/override', CAP, async function (ctx) {
    var key = String((ctx.body && ctx.body.key) || '').trim()
    if (!key) return bad(400, 'key is required')
    await refreshMirror(api, true)
    var existing = MIRROR.overrides[key]
    if (!existing) return ok({ deleted: 0 })
    await api.cms.storage.collection('og-overrides').delete(existing.id)
    await refreshMirror(api, true)
    return ok({ deleted: 1 })
  })

  /**
   * POST /bulk — the whole site in one call.
   *
   * This is the reason the plugin has an API at all: eighty pages is too many
   * to click through, and the values that need changing at that scale are
   * always formulaic (a new share image everywhere, a suffix on every title,
   * every article to og:type article).
   *
   *   {
   *     "match":  { "kind": "entry" },            // or { "slugPrefix": "contact" }
   *     "set":    { "image": "/uploads/og.jpg",
   *                 "title": "{title} | Dr. Nahlah" },
   *     "dryRun": true
   *   }
   *
   * `{title}`, `{slug}`, `{url}` and `{description}` interpolate from the page
   * the value is being written to, so one call can give eighty pages eighty
   * different correct values. `dryRun` is the default: nothing is written
   * unless the caller says `"dryRun": false`, and the response is the same
   * shape either way so the preview and the result can be diffed.
   */
  api.cms.routes.post('/bulk', CAP, async function (ctx) {
    var body = ctx.body || {}
    var match = body.match || {}
    var set = body.set || {}
    var dryRun = body.dryRun !== false
    if (!set || typeof set !== 'object' || Object.keys(set).length === 0) {
      return bad(400, '`set` must name at least one field')
    }
    for (var k in set) {
      if (FIELDS.indexOf(k) < 0 && k !== 'enabled') return bad(400, 'unknown field "' + k + '" in `set`')
    }
    await refreshMirror(api, true)

    var targets = []
    var seen = {}
    var consider = function (record) {
      var key = overrideKeyFor(record)
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

    var siteUrl = trimBase(setting(api, 'siteUrl', ''))
    var planned = []
    for (var i = 0; i < targets.length; i++) {
      var record = targets[i]
      var key = overrideKeyFor(record)
      var tokens = {
        '{title}': record.seoTitle || record.title,
        '{slug}': record.slug,
        '{url}': pageUrl(siteUrl, record.routeBase, record.slug),
        '{description}': record.seoDescription,
      }
      var existing = MIRROR.overrides[key]
      var next = { key: key }
      if (existing) for (var f in existing.data) if (f !== 'key') next[f] = existing.data[f]
      for (var field in set) {
        var value = set[field]
        if (typeof value === 'string') {
          for (var token in tokens) value = value.split(token).join(tokens[token] || '')
        }
        next[field] = value
      }
      planned.push({ key: key, id: existing ? existing.id : null, data: cleanOverride(next) })
    }

    if (dryRun) return ok({ dryRun: true, matched: planned.length, changes: planned })

    var written = 0
    var failed = []
    for (var p = 0; p < planned.length; p++) {
      try {
        if (planned[p].id) await api.cms.storage.collection('og-overrides').update(planned[p].id, planned[p].data)
        else await api.cms.storage.collection('og-overrides').create(planned[p].data)
        written++
      } catch (e) {
        failed.push({ key: planned[p].key, error: String(e && e.message) })
      }
    }
    await refreshMirror(api, true)
    return ok({ dryRun: false, matched: planned.length, written: written, failed: failed })
  })

  /**
   * POST /preview — the exact tags a given page would receive.
   *
   * Takes the page's published HTML (the caller fetches it) so the preview is
   * computed by the same code path that runs at publish, not by a second
   * implementation that can drift from it.
   */
  api.cms.routes.post('/preview', CAP, async function (ctx) {
    var html = String((ctx.body && ctx.body.html) || '')
    var slug = String((ctx.body && ctx.body.slug) || '')
    if (!html) return bad(400, 'html is required')
    await refreshMirror(api, true)
    var built = buildTags(api, html, { slug: slug })
    return ok({ tags: built ? built.block : null, description: built ? built.description : null })
  })
}

/* ── favicon ──────────────────────────────────────────────────────────── */

var ICON_RE = /<link\b[^>]*\brel\s*=\s*["']?(?:shortcut\s+)?icon["']?[^>]*>/i
var TOUCH_RE = /<link\b[^>]*\brel\s*=\s*["']?apple-touch-icon["']?[^>]*>/i

// Instatic writes no icon link and serves nothing at /favicon.ico, so every
// tab showed a blank page icon. Relative paths stay relative (the icon is on
// the same host); a page that already names an icon is left alone.
function withIcons (api, html) {
  var icon = String(setting(api, 'favicon', '') || '').trim()
  if (!icon || !HEAD_END_RE.test(html)) return html
  var touch = String(setting(api, 'appleTouchIcon', '') || '').trim() || icon
  var type = /\.png(\?|$)/i.test(icon) ? ' type="image/png"' : /\.svg(\?|$)/i.test(icon) ? ' type="image/svg+xml"' : ''
  var block = ''
  if (!ICON_RE.test(html)) block += '  <link rel="icon" href="' + esc(icon) + '"' + type + '>\n'
  if (!TOUCH_RE.test(html)) block += '  <link rel="apple-touch-icon" href="' + esc(touch) + '">\n'
  if (!block) return html
  var at = html.search(HEAD_END_RE)
  return html.slice(0, at) + block + html.slice(at)
}

/* ── lifecycle ────────────────────────────────────────────────────────── */

export function activate (api) {
  registerRoutes(api)

  // Warm the mirror. Not awaited — activate must not block plugin boot, and
  // `publish.before` refreshes before anything is rendered anyway.
  refreshMirror(api, true).catch(function (e) {
    api.plugin.log('open-graph: initial mirror load failed — ' + (e && e.message))
  })

  api.cms.hooks.on('publish.before', function () {
    return refreshMirror(api, false)
  })

  api.cms.hooks.filter('publish.html', function (html, ctx) {
    if (typeof html !== 'string' || html.length === 0) return html
    // The favicon goes in first and on its own: the platform has no favicon
    // setting at all, and the early returns below are about social tags only.
    html = withIcons(api, html)
    if (!flag(api, 'enabled', true)) return html
    // Already tagged: another pass, another plugin, or a hand-written head.
    // Never append a second set — networks take the first and the duplicate is
    // invisible until someone views source and cannot explain it.
    if (HAS_OG_RE.test(html)) return html
    if (!HEAD_END_RE.test(html)) return html

    var built
    try {
      built = buildTags(api, html, ctx || {})
    } catch (e) {
      api.plugin.log('open-graph: ' + (e && e.message) + ' — page left untouched')
      return html
    }
    if (!built) return html

    var out = html
    var block = built.block
    if (built.description && flag(api, 'syncMetaDescription', true)) {
      var current = DESC_RE.exec(out)
      var tag = '<meta name="description" content="' + esc(built.description) + '">'
      // 1.2.1: a page with no description tag at all gets one. The platform emits
      // none unless Site settings has one, so "replace only" left every page bare.
      if (current) out = out.slice(0, current.index) + tag + out.slice(current.index + current[0].length)
      else block = '\n  ' + tag + block
    }
    var at = out.search(HEAD_END_RE)
    return out.slice(0, at) + block + out.slice(at)
  })

  api.plugin.log('open-graph active')
}

export function install (api) { api.plugin.log('open-graph installed') }
export function deactivate (api) { api.plugin.log('open-graph deactivated') }
export function uninstall (api) { api.plugin.log('open-graph uninstalled') }
