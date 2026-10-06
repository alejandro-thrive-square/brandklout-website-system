/**
 * A small, dependency-free CSS reader that turns a stylesheet into the shape
 * Instatic's style registry stores, WITHOUT going through Instatic's own
 * `cssToStyleRules`.
 *
 * Why not the platform converter: it runs on happy-dom, and happy-dom drops
 * custom properties, `clamp()`/`min()`/`max()` values, all but the last layer
 * of a `background`, `!important` and the new viewport units (`push-site.mjs`
 * documents each). Those are exactly the declarations that used to be parked in
 * a code asset, where the Styles panel cannot reach them. The registry itself
 * stores any of them: `styles` is a free string map, the publisher emits
 * `--custom` and kebab keys as written, `stylePriorities` carries `!important`,
 * and `rawCss` carries `@keyframes` (src/core/publisher/classCss.ts). So this
 * reader writes them there directly.
 *
 * Scope: plain CSS as our builds write it. One level of `@media` / `@supports`
 * / `@container` is a context; anything nested deeper, `@font-face`,
 * `@import`, `@layer`, `@property`, `@page` and CSS nesting come back in
 * `unsupported` so the caller can refuse or keep them in a residual asset.
 */

/** `@media(min-width:700px)` and `@media (min-width: 700px)` are one prelude. */
export const normaliseMedia = (text) =>
  (text ?? '')
    .replace(/^@[a-z-]+\s*/i, '')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim()

export const normaliseSelector = (selector) =>
  (selector ?? '')
    .replace(/\s*([>+~,])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

/** Index of the `}` closing the block whose `{` is at `open`, honouring strings and comments. */
function matchBrace(css, open) {
  let depth = 0
  for (let i = open; i < css.length; i++) {
    const c = css[i]
    if (c === '"' || c === "'") {
      const end = css.indexOf(c, i + 1)
      i = end === -1 ? css.length : end
    } else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** Split on `sep` at paren depth 0, outside strings. */
export function splitTop(text, sep) {
  const out = []
  let depth = 0
  let cur = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"' || c === "'") {
      const end = text.indexOf(c, i + 1)
      const j = end === -1 ? text.length - 1 : end
      cur += text.slice(i, j + 1)
      i = j
      continue
    }
    if (c === '(') depth++
    else if (c === ')') depth--
    if (depth === 0 && (sep === ' ' ? /\s/.test(c) : c === sep)) {
      if (cur.trim() || sep !== ' ') out.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  if (cur.trim()) out.push(cur)
  return out.map((s) => s.trim()).filter((s) => s !== '')
}

function parseDeclarations(body) {
  const decls = []
  for (const part of splitTop(body, ';')) {
    const colon = part.indexOf(':')
    if (colon <= 0) continue
    const prop = part.slice(0, colon).trim()
    let value = part.slice(colon + 1).trim()
    const important = /!\s*important\s*$/i.test(value)
    if (important) value = value.replace(/\s*!\s*important\s*$/i, '').trim()
    if (!prop || value === '') continue
    decls.push({ prop: prop.startsWith('--') ? prop : prop.toLowerCase(), value, important })
  }
  return decls
}

const CONTEXT_AT = /^@(media|supports|container)\b/i

/**
 * @returns {{
 *   rules: { selector: string, contexts: string[], decls: {prop,value,important}[], pos: number }[],
 *   keyframes: { name: string, text: string, contexts: string[], pos: number }[],
 *   unsupported: { text: string, why: string, pos: number }[],
 * }}
 * `contexts` holds the raw at-rule preludes wrapping the rule, outermost first.
 * `pos` is the source order across all three lists.
 */
export function parseCss(source) {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, ' ')
  const rules = []
  const keyframes = []
  const unsupported = []
  let pos = 0

  function walk(text, contexts) {
    let i = 0
    while (i < text.length) {
      while (i < text.length && /[\s;]/.test(text[i])) i++
      if (i >= text.length) break
      const open = text.indexOf('{', i)
      const semi = text.indexOf(';', i)
      if (text[i] === '@' && semi !== -1 && (open === -1 || semi < open)) {
        unsupported.push({ text: text.slice(i, semi + 1).trim(), why: 'statement at-rule', pos: pos++ })
        i = semi + 1
        continue
      }
      if (open === -1) {
        const rest = text.slice(i).trim()
        if (rest) unsupported.push({ text: rest, why: 'unterminated', pos: pos++ })
        break
      }
      const close = matchBrace(text, open)
      if (close === -1) {
        unsupported.push({ text: text.slice(i).trim(), why: 'unbalanced braces', pos: pos++ })
        break
      }
      const prelude = text.slice(i, open).trim()
      const body = text.slice(open + 1, close)
      const whole = text.slice(i, close + 1).trim()
      i = close + 1

      if (prelude.startsWith('@')) {
        if (/^@(-webkit-)?keyframes\b/i.test(prelude)) {
          const name = prelude.replace(/^@(-webkit-)?keyframes\s+/i, '').trim()
          keyframes.push({ name, text: whole, contexts, pos: pos++ })
        } else if (CONTEXT_AT.test(prelude) && contexts.length === 0) {
          walk(body, [...contexts, prelude])
        } else {
          const why = CONTEXT_AT.test(prelude) ? 'nested condition' : prelude.split(/[\s(]/)[0]
          unsupported.push({ text: contexts.length ? `${contexts.join(' { ')} { ${whole} }` : whole, why, pos: pos++ })
        }
        continue
      }
      if (body.includes('{')) {
        unsupported.push({ text: whole, why: 'nested rule', pos: pos++ })
        continue
      }
      rules.push({ selector: normaliseSelector(prelude), contexts, decls: parseDeclarations(body), pos: pos++ })
    }
  }

  walk(css, [])
  return { rules, keyframes, unsupported }
}

const SIDES = ['Top', 'Right', 'Bottom', 'Left']

/**
 * A CSS property name as the registry stores it: camelCase for standard and
 * `-webkit-` properties (what Instatic's importer writes, and what the panel
 * reads), verbatim for custom properties and other vendor prefixes (the
 * publisher's `toKebab` would mangle `msFoo` into `ms-foo`).
 */
export function registryKey(prop) {
  if (prop.startsWith('--')) return prop
  if (prop.startsWith('-') && !prop.startsWith('-webkit-')) return prop
  return prop.replace(/^-webkit-/, 'Webkit-').replace(/-([a-z])/g, (_, c) => c.toUpperCase())
}

/**
 * Declarations into a registry style bag. `padding` / `margin` expand to their
 * four sides: the registry has no shorthand key for them, the panel edits the
 * sides, and the publisher collapses them back. Later declarations win, as in
 * the cascade; a fallback pair (`height:100vh; height:100svh`) keeps the last.
 */
export function toBag(decls) {
  const styles = {}
  const priorities = {}
  const dropped = []
  const set = (key, value, important) => {
    if (key in styles) dropped.push(`${key}: ${styles[key]}`)
    delete styles[key] // re-insert so key order follows the source
    styles[key] = value
    if (important) priorities[key] = 'important'
    else delete priorities[key]
  }
  for (const { prop, value, important } of decls) {
    if (prop === 'padding' || prop === 'margin') {
      const v = splitTop(value, ' ')
      if (v.length >= 1 && v.length <= 4) {
        const [t, r = t, b = t, l = r] = v
        ;[t, r, b, l].forEach((x, i) => set(prop + SIDES[i], x, important))
        continue
      }
    }
    set(registryKey(prop), value, important)
  }
  return { styles, priorities, dropped }
}

/** The CSS property family a key belongs to, so `padding` conflicts with `paddingTop`. */
export function family(key) {
  if (key.startsWith('--')) return key
  const k = key.replace(/^Webkit/, '')
  return k.replace(/^([a-z]+).*$/, '$1')
}

/**
 * Could two selectors style the same element? Conservative: compare the
 * subject compound (after the last combinator). Shared class token -> yes;
 * same tag or a missing tag on either side with no classes -> yes.
 * Two DIFFERENT classes sit on one element all the time (a base class and its
 * `is-*` combo): `canJoin(classA, classB)` says whether they can (the page
 * trees know). Without it, any two classes are assumed able to: answering "no"
 * wrongly let css-to-registry fold `.is-closing` @767 into its class rule while
 * `.path_step` @767 kept a later seat, so on `<li class="path_step is-closing">`
 * the order flipped and the phone width went 84vw -> 76vw (IFA, 2026-10-06).
 */
export function mightOverlap(a, b, canJoin = () => true) {
  const subject = (sel) =>
    splitTop(sel, ',').map((s) => {
      const last = s.split(/\s*[>+~]\s*|\s+/).filter(Boolean).pop() ?? ''
      const bare = last.replace(/::?[a-z-]+(\([^)]*\))?/gi, '')
      return {
        classes: [...bare.matchAll(/\.([\w-]+)/g)].map((m) => m[1]),
        tag: (bare.match(/^[a-z][\w-]*/i) ?? [''])[0].toLowerCase(),
        pseudo: (last.match(/::?(before|after|placeholder|marker|selection)/i) ?? [''])[0].toLowerCase(),
      }
    })
  for (const x of subject(a)) {
    for (const y of subject(b)) {
      if (x.pseudo !== y.pseudo) continue
      if (x.classes.some((c) => y.classes.includes(c))) return true
      if (x.tag && y.tag && x.tag !== y.tag) continue
      if (x.classes.length === 0 || y.classes.length === 0) return true
      if (x.classes.some((c) => y.classes.some((d) => canJoin(c, d)))) return true
    }
  }
  return false
}
