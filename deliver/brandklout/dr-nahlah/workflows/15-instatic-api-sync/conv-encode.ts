/**
 * Widen Instatic's substitution encoding to the CSS MATH functions.
 *
 * `@core/css-substitution` protects declarations containing `var()` / `env()`
 * by rewriting them to `--instatic-sub-<prop>` custom properties before the CSS
 * engine sees them, because every engine mangles substitution values at parse
 * time. Its trigger is `/\b(?:var|env)\(/` — it does NOT cover `clamp()`,
 * `min()`, `max()` or `calc()`.
 *
 * happy-dom validates length-typed properties against a strict grammar and
 * DROPS the declaration when the value is a function it cannot evaluate. So
 * `padding: clamp(1.35rem,2.2vw,1.9rem)` and even the longhand
 * `margin-top: clamp(...)` vanish silently, while `gap: clamp(...)` survives
 * (gap is not validated the same way). On this site that silently removed the
 * padding and margin from ~60 rules.
 *
 * `decodeSubstitutionProperty` decodes ANY property carrying the marker, so
 * encoding with the same prefix means their pipeline restores ours for free.
 */
const MATH_FN_RE = /\b(?:clamp|min|max|calc)\(/
const PLAIN_PROPERTY_RE = /^-?[a-zA-Z][a-zA-Z-]*$/
const MARKER = '--instatic-sub-'
const SKIPPED_AT_RULES = /^@(?:-[a-z]+-)?(?:keyframes|font-face)\b/i

/** Split on top-level `;` — never inside (), [] or a string. */
function splitDeclarations(body: string): string[] {
  const out: string[] = []
  let depth = 0, quote = '', cur = ''
  for (const ch of body) {
    if (quote) { cur += ch; if (ch === quote) quote = ''; continue }
    if (ch === '"' || ch === "'") { quote = ch; cur += ch; continue }
    if (ch === '(' || ch === '[') depth++
    else if (ch === ')' || ch === ']') depth--
    if (ch === ';' && depth === 0) { out.push(cur); cur = ''; continue }
    cur += ch
  }
  out.push(cur)
  return out
}

/**
 * Does happy-dom keep this declaration at all?
 *
 * Guessing which values the parser rejects does not scale — the first pass
 * caught `clamp()`/`min()`/`calc()` and still lost `height: 100svh`, because
 * the parser also rejects the modern viewport units. So ask it directly:
 * set the declaration on a real sheet and see whether anything survives.
 * `length === 0` means the declaration was dropped and must be encoded.
 *
 * This deliberately leaves declarations the parser DOES understand alone, so
 * `padding: 1rem` still expands to four longhands and stays editable in the
 * Properties panel's spacing control. Only the casualties get encoded.
 */
const surviveCache = new Map<string, boolean>()
function survivesParse(prop: string, value: string): boolean {
  const key = `${prop}:${value}`
  const hit = surviveCache.get(key)
  if (hit !== undefined) return hit
  let ok = false
  try {
    const Sheet = (globalThis as any).CSSStyleSheet
    const sheet = new Sheet()
    sheet.replaceSync(`x{${prop}:${value}}`)
    const rule = sheet.cssRules[0]
    ok = Boolean(rule && rule.style && rule.style.length > 0)
  } catch {
    ok = false
  }
  surviveCache.set(key, ok)
  return ok
}

function encodeChunk(chunk: string): string {
  const colon = chunk.indexOf(':')
  if (colon === -1) return chunk
  const prop = chunk.slice(0, colon).trim()
  const value = chunk.slice(colon + 1)
  if (!PLAIN_PROPERTY_RE.test(prop) || !value.trim()) return chunk
  if (survivesParse(prop, value.trim().replace(/!important$/i, '').trim())) return chunk
  const leading = chunk.slice(0, chunk.length - chunk.trimStart().length)
  return `${leading}${MARKER}${prop}:${value}`
}

/**
 * Encode every declaration the CSS engine would drop, leaving the rest alone, leaving selectors,
 * at-rule preludes, comments and whitespace byte-identical. Declaration blocks
 * are the innermost blocks — a block that contains `{` is a nesting context
 * (`@media`), not declarations.
 */
export function encodeLossyDeclarations(css: string): { css: string; encoded: number } {
  let encoded = 0
  let out = ''
  let i = 0
  const preludeStack: string[] = []
  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open === -1) { out += css.slice(i); break }
    const prelude = css.slice(i, open)
    out += prelude + '{'
    const close = css.indexOf('}', open)
    const nextOpen = css.indexOf('{', open + 1)
    const isDeclarationBlock = close !== -1 && (nextOpen === -1 || close < nextOpen)
    if (!isDeclarationBlock) {
      preludeStack.push(prelude.trim())
      i = open + 1
      continue
    }
    const body = css.slice(open + 1, close)
    const skip = SKIPPED_AT_RULES.test(prelude.trim()) || preludeStack.some((p) => SKIPPED_AT_RULES.test(p))
    if (skip) {
      out += body
    } else {
      out += splitDeclarations(body).map((c) => {
        const e = encodeChunk(c)
        if (e !== c) encoded++
        return e
      }).join(';')
    }
    out += '}'
    i = close + 1
  }
  return { css: out, encoded }
}
