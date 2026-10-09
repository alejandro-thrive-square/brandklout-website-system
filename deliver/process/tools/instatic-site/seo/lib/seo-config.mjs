/**
 * seo-config.mjs — the per-client configuration every tools/instatic-site/seo script reads.
 *
 * One JSON file in the client's step output (default `output/seo-config.json`, relative to the
 * folder you run from; `--config <file>` to override). Paths inside it (`files.*`) resolve against
 * the config file's own folder. Keys starting with `//` are comments and are ignored.
 * The schema and every default are documented in ../README.md (section "seo-config.json") and
 * shown filled in by ../seo-config.template.json.
 *
 * Nothing here talks to an Instatic instance or needs a credential.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'

/** `--name value` from argv, else the default. A value that starts with `--` is not a value. */
export function arg(name, def) {
  const i = process.argv.indexOf(name)
  return i > 0 && process.argv[i + 1] !== undefined && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def
}
export const flag = (name) => process.argv.includes(name)

/** A comma list of page paths from argv ("/a,/b" or "a,b"). Git Bash rewrites a leading "/a" into
 *  "C:/Program Files/Git/a"; that is undone here, as in seo-aeo/site-audit.mjs --page. */
export const pagePaths = (s) => String(s).split(',').map((p) => p.trim()).filter(Boolean)
  .map((p) => '/' + p.replace(/^[A-Za-z]:[\\/].*?[\\/]Git[\\/]/, '/').replace(/\\/g, '/').replace(/^\/+/, ''))

/** A regex from config: "/pattern/flags" or a bare pattern (no flags). */
export function rx(s) {
  if (s instanceof RegExp) return s
  const m = /^\/([\s\S]+)\/([a-z]*)$/.exec(String(s))
  return m ? new RegExp(m[1], m[2]) : new RegExp(String(s))
}
export const escRx = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Client-First names are the defaults (the house class standard); a site still on older names
// lists both, e.g. "breadcrumbClass": ["pk-crumb", "breadcrumb_component"].
export const DEFAULTS = {
  site: { origin: null, name: null, language: 'en-US' },
  ids: { org: '/#organization' },
  files: { base: null, keywordMap: '../../01-baseline-research/output/keyword-map.csv' },
  markup: {
    breadcrumbClass: ['breadcrumb_component'],
    headlineAttr: 'data-split',
    quoteByClass: ['pull-quote_author'],
    articleRegionAttr: 'data-instatic-content-region',
    articleEndClass: [],
  },
  wiki: {},
  rules: {
    platformTextDrop: 'https?://',
    platformTextStrip: null,
    graphForbidden: null,
    graphForbiddenExcept: null,
  },
  videos: { about: {}, publisher: { vimeo: true, youtube: false } },
  treatmentDefaults: {},
  faq: { skip: [] },
  breadcrumbs: { skip: ['index'], fallback: {} },
  articles: null,
  define: {},
  organization: [],
  pages: {},
  keywordH1: {
    heroClass: ['section_page-hero'],
    heroSelector: null,
    taglineClass: ['text-style-tagline'],
    headlineAttr: null,
    baseHeadingSelector: 'h1, h2, h3, h4',
    copyFromBase: ['fontFamily', 'fontWeight', 'lineHeight', 'letterSpacing', 'color'],
    taglineStyles: { fontSize: 'var(--label)', maxWidth: 'none', lineHeight: '1.5', marginBottom: '1rem' },
    nbsp: [],
    widths: [1440, 390],
  },
  verify: { minUrls: 1 },
}

const stripComments = (o) => {
  if (Array.isArray(o)) return o.map(stripComments)
  if (!o || typeof o !== 'object') return o
  return Object.fromEntries(Object.entries(o).filter(([k]) => !k.startsWith('//')).map(([k, v]) => [k, stripComments(v)]))
}
// objects merge one level deep (site, markup, rules …); arrays and scalars replace
const merge = (d, o) => {
  const out = { ...d }
  for (const [k, v] of Object.entries(o || {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) ? { ...d[k], ...v } : v
  }
  return out
}

export function loadConfig(file = arg('--config', 'output/seo-config.json')) {
  const path = resolve(process.cwd(), file)
  if (!existsSync(path)) {
    console.error(`no SEO config at ${path}\nCopy tools/instatic-site/seo/seo-config.template.json there and fill it in (README "seo-config.json"), or pass --config <file>.`)
    process.exit(2)
  }
  let raw
  try { raw = JSON.parse(readFileSync(path, 'utf8')) } catch (e) { console.error(`${path}: not valid JSON (${e.message})`); process.exit(2) }
  const c = merge(DEFAULTS, stripComments(raw))
  c.file = path
  c.dir = dirname(path)
  const bad = []
  if (!/^https?:\/\/[^/]+$/.test(String(c.site.origin || '').replace(/\/+$/, ''))) bad.push('site.origin must be the production origin, e.g. "https://www.example.com"')
  if (!c.site.name) bad.push('site.name (the practice name: creditText of case photos) is required')
  for (const k of ['breadcrumbClass', 'quoteByClass', 'articleEndClass']) if (!Array.isArray(c.markup[k])) bad.push(`markup.${k} must be an array of class names`)
  for (const k of ['heroClass', 'taglineClass']) if (!Array.isArray(c.keywordH1[k])) bad.push(`keywordH1.${k} must be an array of class names`)
  if (bad.length) { console.error(`${path}:\n  ${bad.join('\n  ')}`); process.exit(2) }
  c.site.origin = c.site.origin.replace(/\/+$/, '')
  if (!c.keywordH1.headlineAttr) c.keywordH1.headlineAttr = c.markup.headlineAttr
  return c
}

/** A path from the config's `files` section, resolved against the config file's folder. */
export const configPath = (c, p) => (p ? resolve(c.dir, p) : null)

/** The output folder: --out <dir>, default output/schema under the folder you run from. */
export const outDir = () => resolve(process.cwd(), arg('--out', 'output/schema'))

/** KEY=value pairs from the nearest .env walking up from the current folder, never overwriting the
 *  environment. Parsed the way insta-api.mjs parses it: NOT process.loadEnvFile, which treats `#` as
 *  a comment and has truncated a password that contains one. Never print what it loads. */
export function loadDotEnv(start = process.cwd()) {
  let dir = start
  for (let i = 0; i < 12; i++) {
    const f = join(dir, '.env')
    if (existsSync(f)) {
      for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
      }
      return f
    }
    const up = dirname(dir)
    if (up === dir) return null
    dir = up
  }
  return null
}
