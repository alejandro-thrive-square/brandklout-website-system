// Promoted 2026-10-06 from the bk-ifa-dentistry session (output/fleet/ifa-dentistry/order-pairs.mjs). See CLASS-STANDARD.md §8 step 2.
// Read-only static check: which pairs of declarations changed their relative order between the ORIGINAL
// stylesheet and the PUBLISHED registry stylesheet, in a way the cascade can see?
// A pair matters when: same property family, equal specificity, contexts that can hold together, and subject
// compounds that could sit on one element. Classes on page nodes are known (co-occurrence from the page trees);
// a class no node carries is a RUNTIME class (scripts add it: is-open, is-on, split_line ...) and is treated as
// able to join any element, which the browser sweep and the css gates cannot see.
//   node order-pairs.mjs --site <client>:staging --css <original.css> --published <style.css>
import { readFileSync } from 'node:fs'
import { connect, argOf } from './target.mjs'
import { parseCss, normaliseMedia, normaliseSelector, registryKey, family, splitTop } from './css-source.mjs'

const { api } = await connect()
const { site } = await api.getSite()
const { rows } = await api.getPages()
const idToName = new Map(Object.entries(site.styleRules).map(([id, r]) => [r.id ?? id, r.name]))
const together = new Map(), onNodes = new Set()
for (const row of rows) {
  const body = typeof row.cells?.body === 'string' ? JSON.parse(row.cells.body) : row.cells?.body
  for (const node of Object.values(body?.nodes ?? {})) {
    const names = (node.classIds ?? []).map((id) => idToName.get(id)).filter(Boolean)
    for (const a of names) { onNodes.add(a); for (const b of names) if (a !== b) (together.get(a) ?? together.set(a, new Set()).get(a)).add(b) }
  }
}
const spec = (sel) => {
  let s = sel.replace(/::[\w-]+(\([^)]*\))?/g, ' E ').replace(/:(not|is|where|has)\(([^)]*)\)/g, ' $2 ')
  const a = (s.match(/#[\w-]+/g) ?? []).length
  const b = (s.match(/\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g) ?? []).length
  s = s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]*\]|:[\w-]+(\([^)]*\))?/g, ' ')
  const c = (s.match(/(^|[\s>+~])[a-zA-Z][\w-]*/g) ?? []).length
  return `${a},${b},${c}`
}
const subject = (sel) => {
  const last = sel.split(/\s*[>+~]\s*|\s+/).filter(Boolean).pop() ?? ''
  const pseudoEl = (last.match(/::?(before|after|placeholder|marker|selection)/i) ?? [''])[0].toLowerCase()
  const bare = last.replace(/::?[a-z-]+(\([^)]*\))?/gi, '')
  return { classes: [...bare.matchAll(/\.([\w-]+)/g)].map((m) => m[1]), tag: (bare.match(/^[a-z][\w-]*/i) ?? [''])[0].toLowerCase(), pseudoEl }
}
const coexist = (x, y) => {
  if (x.pseudoEl !== y.pseudoEl) return false
  if (x.tag && y.tag && x.tag !== y.tag) return false
  for (const a of x.classes) for (const b of y.classes) {
    if (a === b) continue
    if (!onNodes.has(a) || !onNodes.has(b)) continue // a runtime class may join any element
    if (!(together.get(a)?.has(b))) return false
  }
  return true
}
const widths = (ctx) => {
  const lo = Math.max(0, ...[...ctx.matchAll(/min-width:\s*(\d+)px/g)].map((m) => +m[1]))
  const hi = Math.min(1e9, ...[...ctx.matchAll(/max-width:\s*(\d+)px/g)].map((m) => +m[1]))
  return [lo, hi]
}
const canHoldTogether = (c1, c2) => {
  const [a, b] = widths(c1), [c, d] = widths(c2)
  if (Math.max(a, c) > Math.min(b, d)) return false
  if (/reduced-motion:\s*reduce/.test(c1 + c2) && /reduced-motion:\s*no-preference/.test(c1 + c2)) return false
  return true
}
const load = (file) => {
  const out = new Map() // key -> { pos, sel, ctx, prop, value, important }
  let n = 0
  for (const r of parseCss(readFileSync(file, 'utf8')).rules) {
    const ctx = r.contexts.map((c) => normaliseMedia(c)).join(' && ')
    for (const one of splitTop(r.selector, ',')) {
      const sel = normaliseSelector(one)
      for (const d of r.decls) {
        const prop = registryKey(d.prop)
        out.set(`${sel}|${ctx}|${prop}`, { pos: n++, sel, ctx, prop, value: d.value, important: /!important/.test(d.value) || !!d.important })
      }
    }
  }
  return out
}
const A = load(argOf('--css')), B = load(argOf('--published'))
const missing = [...A.keys()].filter((k) => !B.has(k))
console.log(`original ${A.size} declarations, published ${B.size}; in the original but not published under the same selector/context/property: ${missing.length}`)
for (const k of missing.slice(0, 30)) console.log(`  missing  ${k}`)
// group by property family
const byFam = new Map()
for (const [k, a] of A) { const b = B.get(k); if (!b) continue; const f = family(a.prop); (byFam.get(f) ?? byFam.set(f, []).get(f)).push({ k, a, b, spec: spec(a.sel), subj: subject(a.sel) }) }
let inverted = 0, relevant = 0
const lines = []
for (const [, list] of byFam) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const x = list[i], y = list[j]
    if (x.a.sel === y.a.sel && x.a.ctx === y.a.ctx) continue
    if ((x.a.pos < y.a.pos) === (x.b.pos < y.b.pos)) continue
    inverted++
    if (x.spec !== y.spec || x.a.important !== y.a.important) continue
    if (!canHoldTogether(x.a.ctx, y.a.ctx)) continue
    if (!coexist(x.subj, y.subj)) continue
    // identical selector: only the context differs, the element always matches both
    relevant++
    const [first, second] = x.a.pos < y.a.pos ? [x, y] : [y, x]
    const runtime = [...first.subj.classes, ...second.subj.classes].filter((c) => !onNodes.has(c))
    lines.push(`${runtime.length ? 'RUNTIME ' : 'STATIC  '} ${second.a.prop}: originally "${second.a.sel}" @[${second.a.ctx || 'base'}] (${second.a.value}) came AFTER "${first.a.sel}" @[${first.a.ctx || 'base'}] (${first.a.value}); published BEFORE it${runtime.length ? `   runtime class: ${[...new Set(runtime)].join(', ')}` : ''}`)
  }
}
for (const l of lines.sort()) console.log(l)
console.log(`\n${inverted} pair(s) changed order; ${relevant} of them are same-specificity, can hold together and could sit on one element`)
