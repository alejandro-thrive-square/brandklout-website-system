/**
 * Shared by class-audit.mjs and class-rename.mjs: the Client-First + Relume vocabulary and the
 * name classifier. Standard: ../client-first-style-guide/CLASS-STANDARD.md
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCss, toBag } from './css-source.mjs'
import { jsStringSpans } from './js-lexer.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const GUIDE = join(HERE, '..', 'client-first-style-guide', 'assets')

/* ── the library ────────────────────────────────────────────────────────── */
const guideCss = readFileSync(join(GUIDE, readdirSync(GUIDE).find((f) => f.endsWith('.css'))), 'utf8')
const NOT_CLASSES = new Set(['cloudfront', 'com', 'net', 'prod', 'website-files', 'gm-style-iw', 'delete-this', 'svg', 'wf-layout-layout'])
export const library = new Map()
for (const r of parseCss(guideCss).rules) {
  for (const m of r.selector.matchAll(/\.([a-zA-Z][\w-]*)/g)) {
    const n = m[1]
    if (n.startsWith('w-') || n.startsWith('rl-styleguide') || NOT_CLASSES.has(n)) continue
    if (!library.has(n)) library.set(n, null)
  }
  const solo = r.selector.match(/^\.([a-zA-Z][\w-]*)$/)
  if (solo && !r.contexts.length && library.has(solo[1])) library.set(solo[1], signature(toBag(r.decls).styles))
}
for (const n of ['page-wrapper', 'main-wrapper', 'hide-visually', 'text-style-2lines', 'text-style-3lines',
  'text-color-primary', 'text-color-secondary', 'text-color-alternate', 'background-color-primary',
  'background-color-secondary', 'background-color-tertiary', 'background-color-alternate']) if (!library.has(n)) library.set(n, null)

/** Property families a site may extend with its own utility system (Client-First, Typography strategy). */
const FAMILIES = ['heading-style-', 'text-size-', 'text-weight-', 'text-style-', 'text-align-', 'text-color-', 'text-opacity-',
  'background-color-', 'border-color-', 'margin-', 'padding-', 'spacer-', 'max-width-', 'min-height-', 'container-',
  'icon-1x1-', 'icon-height-', 'icon-embed-', 'z-index-', 'overflow-', 'pointer-events-', 'hide-', 'aspect-ratio-',
  'shadow-', 'radius-', 'opacity-', 'gap-', 'object-position-', 'object-fit-', 'section-style-', 'height-', 'width-']

export function signature(styles) {
  const norm = Object.entries(styles ?? {})
    .map(([k, v]) => [k, String(v).replace(/\s+/g, ' ').trim().toLowerCase()])
    .sort(([a], [b]) => a.localeCompare(b))
  return norm.length ? JSON.stringify(norm) : null
}
export const librarySig = new Map()
for (const [n, sig] of library) {
  if (!sig || n.includes('_') || n.startsWith('is-') || ['button', 'button-group', 'tag', 'layer', 'svg', 'color-scheme-1'].includes(n)) continue
  librarySig.set(sig, [...(librarySig.get(sig) ?? []), n])
}

/* ── classify a name ────────────────────────────────────────────────────── */
const OK_SHORT = new Set(['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'is', '1x1', 'up', 'to', 'of', 'on', 'in', 'at', 'no', 'or', 'by', 'my', 'we', 'us', 'go', 'do', 'ai', 'qa', 'tv', 'id', 'x', 'ad', 'faq', 'cta', 'seo', 'nav', 'map', 'tab', 'tag', 'pin', 'row', 'top', 'end', 'new', 'old', 'big', 'all', 'one', 'two', 'six', 'ten', 'key', 'box', 'bar', 'dot', 'eye', 'arm', 'fit', 'gap', 'set', 'pro', 'hub', 'log', 'tip', 'way', 'law', 'fee', 'day', 'ask', 'dr', 'en', 'es', 'and', 'the', 'for', 'off', 'out', 'pay', 'kid', 'kids', 'age', 'dark', 'icon'])
const ABBREVIATIONS = new Set(['val', 'recov', 'mech', 'calc', 'dsec', 'proc', 'tmpl', 'cfg', 'misc', 'btn', 'img', 'txt', 'bg', 'hdr', 'ftr', 'lbl', 'sec', 'svc', 'pic', 'desc', 'cnt', 'wrap', 'u', 'el', 'lh', 'fw', 'fs', 'mt', 'mb', 'pt', 'pb', 'col', 'cols', 'nav-', 'num', 'bd', 'tx', 'ttl', 'sm', 'md', 'lg', 'xl', 'xs'])
// A segment is an abbreviation if it is a known one, at most two letters, or one letter plus a
// number (`m10` for month 10, `s2`): `is-m10` passed an earlier version of this check.
const abbreviated = (name) => name.split(/[-_]/).some((seg) =>
  ABBREVIATIONS.has(seg) || (seg.length <= 2 && !/^\d+$/.test(seg) && !OK_SHORT.has(seg)) || (/^[a-z]\d+$/.test(seg) && !/^h[1-6]$/.test(seg)))
const CUSTOM_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*_[a-z0-9]+(?:-[a-z0-9]+)*$/
export const COMBO_RE = /^is-[a-z0-9]+(?:-[a-z0-9]+)*$/
const DASH_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/* Classes we do not own: third-party widgets and runtimes put them on the page and select by them
   (Elfsight `elfsight-app-<id>`, Sienna `asw-*`, Termly, GHL/LeadConnector, GSAP's `pin-spacer`,
   Swiper/Splide, the house kit's runtime `wz-*`). Renaming them breaks the widget; they are
   reported as `vendor`, never out of bounds. */
export const VENDOR_RE = /^(elfsight-app-|eapps-|asw-|termly|t-consent|ghl-|hl_|hl-|lc-|calendly|swiper|splide|glide|pin-spacer|gsap-|wz-|instatic-|w-embed|cf-|__cf|grecaptcha|g-recaptcha|cf-turnstile|mapboxgl|leaflet-|vimeo|ytp-|plyr)/
export function classify(name) {
  if (VENDOR_RE.test(name)) return 'vendor'
  if (library.has(name)) return 'library'
  if (/__|--/.test(name)) return 'bem'
  if (/[A-Z]/.test(name)) return 'case'
  if (/_.*_/.test(name)) return 'multi-underscore'
  if (abbreviated(name)) return 'abbreviation'
  if (COMBO_RE.test(name)) return 'combo'
  if (CUSTOM_RE.test(name)) return 'custom'
  if (DASH_RE.test(name) && FAMILIES.some((f) => name.startsWith(f))) return 'utility-system'
  if (DASH_RE.test(name)) return 'dash-name'
  return 'other'
}
export const OUT_OF_BOUNDS = new Set(['bem', 'case', 'multi-underscore', 'abbreviation', 'dash-name', 'other'])
export const TYPE_ROLE = /^(heading-style-[a-z0-9-]+|text-size-[a-z0-9-]+|text-style-[a-z0-9-]+)$/

/* ── scripts that select by class (what a rename can break) ─────────────── */
export function scriptClassRefs(js, names) {
  const refs = new Map()
  for (const span of jsStringSpans(js)) {
    const s = js.slice(span.start + 1, span.end - 1)
    const before = js.slice(Math.max(0, span.start - 40), span.start)
    for (const t of s.matchAll(/(^|[^\w$])\.([a-zA-Z][\w-]*)/g)) if (names.has(t[2])) refs.set(t[2], (refs.get(t[2]) ?? 0) + 1)
    if (/classList\.(add|remove|toggle|contains|replace)\s*\(\s*$|className\s*[=!]=?=?\s*$|getElementsByClassName\s*\(\s*$|class\s*=\s*$/.test(before) || /class=["']?$/.test(before)) {
      for (const tok of s.split(/\s+/)) if (names.has(tok)) refs.set(tok, (refs.get(tok) ?? 0) + 1)
    }
    for (const c of s.matchAll(/class=\\?["']([^"'\\]*)/g)) for (const tok of c[1].split(/\s+/)) if (names.has(tok)) refs.set(tok, (refs.get(tok) ?? 0) + 1)
  }
  return refs
}


