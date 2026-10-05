/**
 * Put back every declaration Instatic's converter lost, INTO THE REGISTRY.
 *
 * `cssToStyleRules` (happy-dom) builds one registry rule per source selector
 * and silently drops some declarations from it: bare `clamp()`/`min()`/`max()`
 * values, all but the last background layer, `!important`, new viewport units,
 * and on older runs every custom property. `push-site.mjs` used to collect
 * those into the `tokens.css` code asset, which loads last and which the Styles
 * panel cannot see, so a third of a design could not be edited by hand and
 * beat every panel edit it touched.
 *
 * The registry stores all of them verbatim (`styles` is a free map; the
 * publisher emits `--custom` and kebab keys as written, `stylePriorities`
 * carries `!important`, `rawCss` carries `@keyframes`). So the dropped
 * declaration goes back into the rule it was written in: same selector, same
 * @media context. That is also where the cascade wants it, which the code-asset
 * road could only approximate by re-emitting whole property cascades last.
 *
 * Declarations the Framework owns (`:root`/`html` only) are NOT restored: the
 * Framework emits them, and a registry copy would load after it and win.
 *
 * Returns what it changed; the caller decides whether to write.
 */
import { parseCss, normaliseMedia, normaliseSelector, toBag, family } from './css-source.mjs'
import { isRootSelector } from './framework-lib.mjs'

/**
 * @param {{ styleRules: Record<string, any>, conditions: any[] }} registry  mutated
 * @param {{ file: string, css: string }[]} sources  stylesheets in load order
 * @param {{ owned?: Set<string>, newId: () => string }} opts
 */
export function repairRegistry(registry, sources, { owned = new Set(), newId }) {
  const rules = registry.styleRules
  const conditions = registry.conditions
  const bySelector = new Map()
  for (const r of Object.values(rules)) {
    if (r.rawCss) continue
    const k = normaliseSelector(r.selector)
    const prev = bySelector.get(k)
    if (!prev || (r.order ?? 0) > (prev.order ?? 0)) bySelector.set(k, r)
  }
  const keyframesIn = new Set(Object.values(rules).filter((r) => r.rawCss).map((r) => (r.rawCss.match(/keyframes\s+([\w-]+)/) ?? [])[1]))

  const report = { restored: [], created: [], owned: [], keyframes: [], residual: [], conditionsAdded: 0 }
  const contextId = (prelude) => {
    const kind = prelude.match(/^@(media|supports|container)/i)[1].toLowerCase()
    const query = normaliseMedia(prelude)
    const id = `${kind}:${query}`
    if (!conditions.some((c) => c.id === id)) {
      conditions.push({ id, label: query, condition: { kind, query } })
      report.conditionsAdded++
    }
    return id
  }

  // Last source value per (selector, context, property): that is what the
  // cascade inside one selector resolves to, and what the converter keeps.
  const want = new Map() // sel|ctx -> { selector, ctx, file, after, styles, priorities }
  let seat = 0
  for (const { file, css } of sources) {
    const parsed = parseCss(css)
    report.residual.push(...parsed.unsupported.map((u) => ({ file, ...u })))
    for (const k of parsed.keyframes) {
      if (keyframesIn.has(k.name) || k.contexts.length) continue
      want.set(`@keyframes|${k.name}`, { keyframes: k, file, seat: seat++ })
    }
    for (const src of parsed.rules) {
      const { styles, priorities } = toBag(src.decls)
      if (isRootSelector(src.selector)) {
        for (const k of Object.keys(styles)) {
          if (!owned.has(k)) continue
          report.owned.push(`${file}: ${src.selector} ${k}`)
          delete styles[k]
          delete priorities[k]
        }
      }
      if (!Object.keys(styles).length) continue
      const ctx = src.contexts.length ? contextId(src.contexts[0]) : null
      const key = `${src.selector}|${ctx ?? ''}`
      const w = want.get(key) ?? { selector: src.selector, ctx, file, seat: seat, styles: {}, priorities: {} }
      for (const [k, v] of Object.entries(styles)) {
        delete w.styles[k]
        w.styles[k] = v
        if (priorities[k]) w.priorities[k] = priorities[k]
        else delete w.priorities[k]
      }
      w.seat = seat++
      want.set(key, w)
    }
  }

  const squash = (v) => String(v).replace(/\s+/g, ' ').replace(/\s*([(),/])\s*/g, '$1').trim().toLowerCase()
  const LOSSY = /\b(clamp|min|max)\(|\b\d*\.?\d+(s|l|d)v(h|w|b|i|min|max)\b/i
  const multiLayer = (k, v) => /^(background|backgroundImage|mask|maskImage|WebkitMaskImage)$/.test(k) && v.split(/,(?![^(]*\))/).length > 1

  let lastOrder = 0
  const queue = [...want.values()].sort((a, b) => a.seat - b.seat)
  for (let qi = 0; qi < queue.length; qi++) {
    const w = queue[qi]
    if (w.keyframes) {
      const id = newId()
      rules[id] = { id, name: `@keyframes ${w.keyframes.name}`, kind: 'ambient', selector: `@keyframes ${w.keyframes.name}`, order: lastOrder + 0.5, styles: {}, contextStyles: {}, rawCss: w.keyframes.text, createdAt: Date.now(), updatedAt: Date.now() }
      keyframesIn.add(w.keyframes.name)
      report.keyframes.push(`${w.file}: @keyframes ${w.keyframes.name}`)
      continue
    }
    let rule = bySelector.get(w.selector)
    // The converter splits a selector list into one rule per selector. When
    // every part has its rule, the list's declarations belong to those.
    const parts = rule ? null : w.selector.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts && parts.length > 1 && parts.every((p) => bySelector.has(p))) {
      queue.splice(qi + 1, 0, ...parts.map((p) => ({ ...w, selector: p, styles: { ...w.styles }, priorities: { ...w.priorities } })))
      continue
    }
    if (rule) lastOrder = Math.max(lastOrder, rule.order ?? 0)
    else {
      // The converter dropped the whole rule. Seat it after the last rule seen.
      const id = newId()
      rule = { id, name: w.selector, kind: 'ambient', selector: w.selector, order: lastOrder + 0.5, styles: {}, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now() }
      rules[id] = rule
      bySelector.set(w.selector, rule)
      report.created.push(`${w.file}: ${w.selector}${w.ctx ? ` @ ${w.ctx}` : ''}`)
    }
    const bag = w.ctx ? ((rule.contextStyles ??= {})[w.ctx] ??= {}) : (rule.styles ??= {})
    const where = `${w.file}: ${w.selector}${w.ctx ? ` @ ${w.ctx}` : ''}`
    for (const [k, v] of Object.entries(w.styles)) {
      const have = bag[k]
      const custom = k.startsWith('--')
      const layered = multiLayer(k, v)
      const lossyShape = LOSSY.test(v) || layered || custom
      if (have !== undefined && (!lossyShape || squash(have) === squash(v))) continue
      if (have === undefined && !custom) {
        // The converter writes shorthands as longhands (`border` ->
        // `borderTopWidth`…). A family already present means it kept this one
        // in another form: adding the shorthand after the longhands would reset
        // them (`background` wipes `background-size`). Except a layered
        // background, which it cut to its last layer: then the source's own
        // declarations of that family replace the converter's.
        const fam = family(k)
        const famKeys = Object.keys(bag).filter((x) => family(x) === fam)
        if (famKeys.length && !layered) continue
        if (famKeys.length && layered) {
          for (const x of famKeys) delete bag[x]
          for (const [sk, sv] of Object.entries(w.styles)) if (family(sk) === fam) bag[sk] = sv
          report.restored.push(`${where} ${fam}*: layered background restored (${famKeys.length} longhand(s) replaced)`)
          continue
        }
      }
      bag[k] = v
      report.restored.push(`${where} ${k}: ${have === undefined ? '' : `${have} -> `}${v}`)
    }
    for (const [k, p] of Object.entries(w.priorities)) {
      const pr = w.ctx ? (((rule.contextStylePriorities ??= {})[w.ctx] ??= {})) : (rule.stylePriorities ??= {})
      if (pr[k] !== p) {
        pr[k] = p
        report.restored.push(`${w.file}: ${w.selector}${w.ctx ? ` @ ${w.ctx}` : ''} ${k} !important`)
      }
    }
  }
  return report
}
