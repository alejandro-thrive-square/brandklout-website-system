/**
 * Standalone check of the patched isValidUrl.
 *
 * The platform's suite runs on `bun:test`, which is not installed here, and
 * these two functions are pure — so they are transliterated from the patched
 * TypeScript (character for character, minus the type annotations) and driven
 * against the platform's OWN existing assertions plus the cases the patch is
 * meant to unblock.
 *
 * The transliteration is checked, not assumed: `assertMatchesSource()` below
 * re-reads the real .ts files and fails if either function body has drifted
 * from what is exercised here.
 */
import { readFileSync } from 'node:fs'

// ── transliterated from src/core/html-sanitize/index.ts ────────────────────

const SAFE_URL_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:', 'sms:'])

function urlScheme(value) {
  const normalized = String(value)
    .replace(/^[\u0000-\u0020]+/, '')
    .replace(/[\u0000-\u0020]+$/, '')
    .replace(/[\t\n\r]/g, '')
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(normalized)
  return match ? `${match[1].toLowerCase()}:` : null
}

// ── transliterated from src/core/utils/urlValidation.ts (PATCHED) ──────────

function parses(v) {
  try { new URL(v); return true } catch { return false }
}

const MALFORMED_RELATIVE_RE = /[\s\u0000-\u001F\u007F]/

function isValidUrl(v) {
  if (!v) return true
  const scheme = urlScheme(v)
  if (scheme === null) return !MALFORMED_RELATIVE_RE.test(v)
  if (!SAFE_URL_SCHEMES.has(scheme)) return false
  return parses(v)
}

/** The enforcement gate, for the subset assertion at the end. */
function isSafeUrl(url) {
  const scheme = urlScheme(String(url ?? ''))
  return scheme === null || SAFE_URL_SCHEMES.has(scheme)
}

// ── guard: the transliteration still matches the real source ───────────────

function assertMatchesSource() {
  const norm = (s) => s.replace(/\s+/g, ' ').trim()
  const uv = readFileSync('C:/ifork/Instatic-main/src/core/utils/urlValidation.ts', 'utf8')
  const hs = readFileSync('C:/ifork/Instatic-main/src/core/html-sanitize/index.ts', 'utf8')

  const body = norm(uv.slice(uv.indexOf('export function isValidUrl'),
                             uv.indexOf('}', uv.indexOf('return parses(v)')) + 1))
  const want = norm(`export function isValidUrl(v: string): boolean {
    if (!v) return true
    const scheme = urlScheme(v)
    if (scheme === null) return !MALFORMED_RELATIVE_RE.test(v)
    if (!SAFE_URL_SCHEMES.has(scheme)) return false
    return parses(v) }`)
  if (body !== want) throw new Error(`isValidUrl has drifted:\n  got:  ${body}\n  want: ${want}`)

  const re = /const MALFORMED_RELATIVE_RE = (\/\[[^\n]*\/)/.exec(uv)
  if (!re || re[1] !== String(MALFORMED_RELATIVE_RE)) {
    throw new Error(`regex drifted: source ${re && re[1]} vs harness ${MALFORMED_RELATIVE_RE}`)
  }
  if (!/export const SAFE_URL_SCHEMES = new Set\(\['http:', 'https:', 'mailto:', 'tel:', 'sms:'\]\)/.test(hs)) {
    throw new Error('SAFE_URL_SCHEMES is not exported with the expected members')
  }
  if (!/import \{ urlScheme, SAFE_URL_SCHEMES \} from '@core\/html-sanitize'/.test(uv)) {
    throw new Error('urlValidation does not import the shared scheme set')
  }
}

// ── cases ──────────────────────────────────────────────────────────────────

/** Every assertion from src/__tests__/utils/urlValidation.test.ts, verbatim. */
const EXISTING = [
  ['', true, 'empty string (optional field)'],
  ['https://example.com', true, 'https'],
  ['https://example.com/path?q=1#hash', true, 'https with path/query/hash'],
  ['http://example.com', true, 'http'],
  ['mailto:user@example.com', true, 'mailto'],
  ['javascript:alert(1)', false, 'javascript:'],
  ['data:text/html,<script>alert(1)</script>', false, 'data:text/html'],
  ['data:image/png;base64,abc', false, 'data:image (rejected by isValidUrl)'],
  ['ftp://files.example.com', false, 'ftp:'],
  ['blob:https://example.com/abc-123', false, 'blob:'],
  ['file:///etc/passwd', false, 'file:'],
  ['myapp://action', false, 'custom scheme'],
  ['not a url', false, 'prose'],
]

/** Assertions the patch DELIBERATELY changes. */
const CHANGED = [
  ['/relative/path', true, 'root-relative path'],
  ['//example.com', true, 'protocol-relative'],
]

/** What the patch exists to unblock, plus the site's real hrefs. */
const NEW = [
  ['#book', true, 'same-page anchor — the CTA case'],
  ['#invitation', true, 'the anchor from the reported screenshot'],
  ['/contact', true, 'internal link'],
  ['/contact#book', true, 'internal link + anchor'],
  ['./a', true, 'relative'],
  ['../a', true, 'parent-relative'],
  ['contact.html', true, 'document-relative'],
  ['?q=1', true, 'query-only'],
  ['tel:+15717029900', true, 'telephone — 345 nodes on this site'],
  ['sms:+15551234567', true, 'sms'],
  ['https://www.flexbook.me/DrNahlahTy/1', true, 'external booking link'],
  ['vbscript:msgbox(1)', false, 'vbscript: still rejected'],
  ['JavaScript:alert(1)', false, 'javascript: mixed case still rejected'],
  ['\u0001javascript:alert(1)', false, 'javascript: behind a C0 control still rejected'],
  ['java\tscript:alert(1)', false, 'javascript: split by a tab still rejected'],
  ['http://', false, 'malformed absolute'],
  ['https://exa mple.com', false, 'absolute with a space'],
  ['/path with space', false, 'relative with a space'],
  ['/path\u00a0nbsp', false, 'relative with a non-breaking space'],
  ['/path\nnewline', false, 'relative with a newline'],
]

assertMatchesSource()

let pass = 0, fail = 0
for (const [group, cases] of [['existing', EXISTING], ['changed', CHANGED], ['new', NEW]]) {
  console.log(`\n${group}:`)
  for (const [input, want, why] of cases) {
    const got = isValidUrl(input)
    const ok = got === want
    ok ? pass++ : fail++
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${JSON.stringify(input).padEnd(42)} -> ${String(got).padEnd(5)} ${why}`)
  }
}

/* The property the patch is built on: whatever the editor now accepts, the
   publisher must also accept — otherwise the editor could save an href that
   silently becomes `#` on the live page. */
console.log('\nsubset property (input gate ⊆ enforcement gate):')
const all = [...EXISTING, ...CHANGED, ...NEW].map(([v]) => v)
const leaks = all.filter((v) => isValidUrl(v) && !isSafeUrl(v))
if (leaks.length) { fail++; console.log('  FAIL  accepted but unsafe:', leaks) }
else { pass++; console.log(`  PASS  no value accepted by isValidUrl is rejected by isSafeUrl (${all.length} checked)`) }

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
