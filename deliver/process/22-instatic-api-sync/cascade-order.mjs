/**
 * Recover the stylesheet's own cascade order from the source CSS.
 *
 * Two facts the converter does not carry, both of which decide who wins once
 * the code asset is switched off and `rule.order` / context key order become
 * the only tiebreakers:
 *
 * 1. **A rule redefined later belongs at its LAST position.** `cssToStyleRules`
 *    merges duplicate selectors and documents that it keeps the order of the
 *    FIRST occurrence. `.ta-card h3` is defined in runtime-states.css and again
 *    in site.css; taking the first position put it before `.pk h3`, which then
 *    won, and the card headings jumped 21.6px -> 27.36px.
 *
 * 2. **`@media` blocks on one rule must keep source order.** `contextStyles` is
 *    a plain object, and the publisher emits it in key order. `.ga-grid` has
 *    `min-width:700px` (2 cols) then `min-width:1100px` (3 cols); at 1440 both
 *    match and the later must win. Insertion order put 1100 first, so the
 *    gallery dropped from three columns to two and the page doubled in height.
 *
 * Both are recovered the same way: scan the source for rule blocks in order and
 * record, for every (media prelude, selector) pair, the position of its LAST
 * occurrence.
 */

const normaliseSelector = (selector) =>
  (selector ?? '')
    .replace(/\s*([>+~,])\s*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

/** `@media(min-width:700px)` and `@media (min-width: 700px)` are one prelude. */
export const normaliseMedia = (text) =>
  (text ?? '')
    .replace(/^@[a-z-]+\s*/i, '')
    .replace(/\s*:\s*/g, ': ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * -> { rule, context, media } — each a Map to the LAST source position.
 * `media` is keyed by normalised at-rule prelude; the publisher emits custom
 * conditions in `site.conditions` array order, so that array must be sorted by
 * these positions or two matching @media blocks resolve backwards.
 * `media` is '' for declarations outside any at-rule.
 */
export function readCascadeOrder(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  // `rule` must rank by the last BASE-context occurrence. A selector redefined
  // only inside an @media block does not move in the base cascade — ranking by
  // "last seen anywhere" put `.vs-row > span` (redefined at a breakpoint) after
  // `.vs-head-row > span`, so the comparison table's header row lost its
  // display type. `ruleAny` is the fallback for selectors that never appear
  // outside an at-rule.
  const rule = new Map()
  const ruleAny = new Map()
  const context = new Map()
  const media = new Map()
  let i = 0
  let n = 0
  const stack = []
  while (i < clean.length) {
    const open = clean.indexOf('{', i)
    if (open === -1) break
    const prelude = clean.slice(i, open).trim()
    const close = clean.indexOf('}', open)
    const nextOpen = clean.indexOf('{', open + 1)
    const isDeclarationBlock = close !== -1 && (nextOpen === -1 || close < nextOpen)
    if (!isDeclarationBlock) {
      stack.push(prelude.startsWith('@') ? normaliseMedia(prelude) : '')
      i = open + 1
      continue
    }
    const mediaKey = stack.filter(Boolean).join(' && ')
    if (!prelude.startsWith('@')) {
      for (const raw of prelude.split(',')) {
        const sel = normaliseSelector(raw)
        if (!sel) continue
        n++
        ruleAny.set(sel, n)
        if (!mediaKey) rule.set(sel, n)
        context.set(`${sel}|${mediaKey}`, n)
      }
      // The comma list as authored is also how the converter names a grouped
      // ambient rule (`h1, h2, h3, h4`), so record the whole prelude too.
      const whole = normaliseSelector(prelude)
      ruleAny.set(whole, n)
      if (!mediaKey) rule.set(whole, n)
      context.set(`${whole}|${mediaKey}`, n)
      if (mediaKey) media.set(mediaKey, n)
    }
    // Close any at-rule blocks that end here.
    i = close + 1
    let depth = 0
    while (i < clean.length && stack.length) {
      const nx = clean.indexOf('{', i)
      const cl = clean.indexOf('}', i)
      if (cl !== -1 && (nx === -1 || cl < nx)) { stack.pop(); i = cl + 1; depth++ }
      else break
    }
  }
  for (const [sel, pos] of ruleAny) if (!rule.has(sel)) rule.set(sel, pos)
  return { rule, context, media }
}
