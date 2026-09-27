/**
 * cms-collections.mjs — the site's CMS collections (Instatic "post types"), declared once and read
 * by prepare-source.mjs (which pages are entries, which page is the template), build-import-input.mjs
 * (links to an entry), push-site.mjs (the template flag and the field bindings on its nodes) and
 * cms-sync.mjs (the table, its fields, the rows, their publish).
 *
 * FIRST USE (v18, 2026-09-15): Sang's "Legal Pages" collection. His package carries the three legal
 * pages as static snapshots plus `cms/legal-pages/` (schema, CSV, JSON) and
 * `cms-templates/legal-page-template.html`, with the instruction "do not import them as three
 * independently managed pages". This is how that maps onto Instatic:
 *
 *   - An Instatic collection is a data TABLE of kind `postType` with a `routeBase`. Its rows are
 *     served at `<routeBase>/<slug>` by the public router, which needs at least TWO path segments
 *     for a row (`contentRouteFromPath` returns null for `/privacy`), so a root-level `/privacy` is
 *     impossible for a row; Sang's recommended `/legal/{slug}` is the only shape. The old
 *     `/privacy`, `/terms` and `/hipaa` pages are retired (replace mode deletes them) and every
 *     link to them rewrites to `/legal/<slug>` (build-import-input.mjs).
 *   - The template is an ordinary page row with `template: { enabled, target: { kind: 'postTypes',
 *     tableSlugs }, priority }`. A template page is NEVER served at its own slug (the router skips
 *     template pages), so `/legal-template` 404s by design and the live gates skip it.
 *   - Fields flow into the template through `dynamicBindings` on a node
 *     (`{ text: { source: 'currentEntry', field, fallback } }`) and the entry's rich-text `body`
 *     through a `base.outlet` node, which the publisher fills with the body rendered from markdown.
 *     Sang marked every bindable element with `data-cms-field="…"`; the importer keeps `data-*` on
 *     text and container nodes, so push-site.mjs finds them by that attribute.
 *   - Rows are drafts until `POST /data/rows/:id/publish`; a site publish does not publish rows.
 *
 * What of Sang's schema is NOT carried, and why: `canonical_path` (the published <head> has no
 * canonical tag, trap 31); `show_market_prequalification` (no per-row conditional visibility in
 * Instatic; the form shows on every legal page, as it does today); `published` (that is the row's
 * status, not a field). Field ids are camelCase like Instatic's own built-ins; his snake_case keys
 * are mapped below.
 *
 * The BODY is brandklout.com's own text, not Sang's "draft for counsel review" template — the
 * decision of 2026-09-14 (Alejandro), unchanged: patches/assets/brandklout-com-legal.json is the
 * source, converted to markdown here because a post-type body is markdown.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const HANDOFF = path.resolve(HERE, '../00-client-delivery-initialization/.tmp/client-handoff')

/* --- brandklout.com's legal text, HTML -> markdown --------------------------------------------- */
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
/** Only the tags the captured text uses; anything else refuses so a re-capture cannot silently lose markup. */
export function legalHtmlToMarkdown(html, what = 'legal html') {
  const unknown = [...new Set((html.match(/<\/?([a-z0-9]+)/gi) ?? []).map((t) => t.replace(/<\/?/, '').toLowerCase()))].filter((t) => !['p', 'strong', 'b', 'em', 'i', 'h2', 'h3', 'ul', 'ol', 'li', 'br', 'a'].includes(t))
  if (unknown.length) throw new Error(`${what}: tags this converter does not handle: ${unknown.join(', ')}`)
  let md = html.replace(/\r?\n/g, ' ')
  md = md.replace(/<br\s*\/?>/gi, '  \n')
  md = md.replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, (_, __, t) => `**${t.trim()}**`)
  md = md.replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, (_, __, t) => `*${t.trim()}*`)
  md = md.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, t) => `[${t.trim()}](${href})`)
  md = md.replace(/<h2>([\s\S]*?)<\/h2>/gi, (_, t) => `\n\n## ${t.trim()}\n\n`)
  md = md.replace(/<h3>([\s\S]*?)<\/h3>/gi, (_, t) => `\n\n### ${t.trim()}\n\n`)
  md = md.replace(/<ul>([\s\S]*?)<\/ul>/gi, (_, inner) => '\n\n' + [...inner.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m) => `- ${m[1].trim()}`).join('\n') + '\n\n')
  md = md.replace(/<ol>([\s\S]*?)<\/ol>/gi, (_, inner) => '\n\n' + [...inner.matchAll(/<li>([\s\S]*?)<\/li>/gi)].map((m, i) => `${i + 1}. ${m[1].trim()}`).join('\n') + '\n\n')
  md = md.replace(/<p>([\s\S]*?)<\/p>/gi, (_, t) => `\n\n${t.trim()}\n\n`)
  if (/<[a-z]/i.test(md)) throw new Error(`${what}: markup left after conversion: ${md.match(/<[a-z][^>]*>/i)[0]}`)
  return decode(md).replace(/[ \t]+\n/g, (m) => (m.startsWith('  \n') ? '  \n' : '\n')).replace(/\n{3,}/g, '\n\n').trim() + '\n'
}
/** The plain text a rendered body should show, for the live check (tags out, whitespace folded). */
export const textOfHtml = (html) => decode(html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

/* --- the Legal Pages collection --------------------------------------------------------------- */
const LEGAL_SITE_TEXT = JSON.parse(fs.readFileSync(path.join(HERE, 'patches', 'assets', 'brandklout-com-legal.json'), 'utf8'))
const bodyOf = (snapshot) => {
  // Sang's row slug can differ from his file name (`hipaa-data-handling` <- `hipaa.html`); the
  // captured text is keyed by the file's stem.
  const id = snapshot.replace(/\.html?$/i, '')
  const tab = LEGAL_SITE_TEXT.tabs.find((t) => t.id === id)
  if (!tab) throw new Error(`brandklout-com-legal.json has no "${id}" tab (for ${snapshot})`)
  return tab.body
}

/** Sang's rows, from the package's own CMS export (metadata), with the agency's body. */
function legalEntries(pkgName) {
  const file = path.join(HANDOFF, pkgName, 'cms', 'legal-pages', 'legal-pages.json')
  if (!fs.existsSync(file)) throw new Error(`${pkgName} has no cms/legal-pages/legal-pages.json`)
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'))
  return rows.map((r) => ({
    file: r.source_snapshot, // the static page in the package this row replaces (privacy.html)
    slug: r.slug,
    publish: r.published !== false,
    cells: {
      title: r.title,
      slug: r.slug,
      footerLabel: r.footer_label,
      eyebrow: r.eyebrow,
      intro: r.intro,
      notice: '', // Sang's "draft for counsel review" note; the site carries brandklout.com's real policies
      body: legalHtmlToMarkdown(bodyOf(r.source_snapshot), `${r.slug} body`),
      seoTitle: r.seo_title,
      seoDescription: r.seo_description,
      sortOrder: r.sort_order,
    },
    /** what the rendered body must read as, for verify-live */
    bodyText: textOfHtml(bodyOf(r.source_snapshot)),
  }))
}

export const COLLECTIONS = [
  {
    slug: 'legal',
    name: 'Legal Pages',
    singularLabel: 'Legal page',
    pluralLabel: 'Legal pages',
    routeBase: '/legal',
    primaryFieldId: 'title',
    /* Post-type built-ins title/slug are held by Instatic whatever this says; body's `format` must
       be markdown (the outlet renders markdown). featuredMedia is left out on purpose. */
    fields: [
      { type: 'text', id: 'title', label: 'Page title', required: true, builtIn: true },
      { type: 'text', id: 'slug', label: 'Slug', required: true, builtIn: true },
      { type: 'text', id: 'footerLabel', label: 'Footer label', required: true },
      { type: 'text', id: 'eyebrow', label: 'Eyebrow' },
      { type: 'longText', id: 'intro', label: 'Intro' },
      { type: 'longText', id: 'notice', label: 'Notice (optional callout above the body)' },
      { type: 'richText', id: 'body', label: 'Body', format: 'markdown', builtIn: true },
      { type: 'text', id: 'seoTitle', label: 'SEO title', builtIn: true },
      { type: 'longText', id: 'seoDescription', label: 'SEO description', builtIn: true },
      { type: 'number', id: 'sortOrder', label: 'Sort order' },
    ],
    template: {
      file: 'cms-templates/legal-page-template.html', // in the package, as Sang shipped it
      slug: 'legal-template', // the page row; never served (template pages are not routable)
      title: 'Legal page (CMS template)',
      /* `data-cms-field` value on the template -> what the node gets. `text` binds the node's text
         prop to the entry's field; `outlet` turns the node into the base.outlet the body flows into. */
      bindings: {
        footer_label: { text: 'footerLabel' },
        eyebrow: { text: 'eyebrow' },
        title: { text: 'title' },
        intro: { text: 'intro' },
        notice: { text: 'notice', fallback: 'empty' },
        body_richtext: 'outlet',
      },
    },
    entries: (pkgName) => legalEntries(pkgName),
  },
]

/** `privacy.html` -> `/legal/privacy`, for every collection: the routes that replace package pages. */
export function entryRoutes(pkgName) {
  const out = {}
  for (const c of COLLECTIONS) for (const e of c.entries(pkgName)) if (e.file) out[e.file] = `${c.routeBase}/${e.slug}`
  return out
}
