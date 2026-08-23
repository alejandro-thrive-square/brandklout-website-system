#!/usr/bin/env node
/**
 * Restore multi-layer `background` values that the CSS conversion flattened.
 *
 * happy-dom's `background` SHORTHAND parser understands one layer only. Given
 * three comma-separated gradients it returns the LAST one and reports success,
 * so the widened substitution encoder — which falls back to verbatim text only
 * when the parser yields `length === 0` — never fires. The declaration is
 * partially parsed, not unparsed, and partial parses sail straight through.
 *
 * The `background-image` LONGHAND is parsed correctly, which is why
 * `.ct-form select`'s two-layer arrow survived while the hero scrim did not.
 *
 * Two rules on this site were hit, both `::after` overlays:
 *   .pg-hero .ph-bg::after     3 layers -> 1   (interior-page hero scrim)
 *   .ch-proof .pf-film::after  2 layers -> 1   (home proof-film vignette)
 *
 * The hero one is the readability defect: the lost `linear-gradient(100deg,…)`
 * is the horizontal scrim that puts a cream floor under the copy column, so
 * without it the H1 sits on bare photograph.
 *
 * This reads the local build as the source of truth, finds every multi-layer
 * background in it, and repairs any registry rule carrying fewer layers.
 *
 *   node repair-multilayer-backgrounds.mjs           # report
 *   node repair-multilayer-backgrounds.mjs --apply   # write the draft shell
 *
 * Writing the draft is not publishing. Publish separately, then gate with
 * `node css-parity.mjs` and `node compare-local.mjs <page> .pg-hero`.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, saveShell } from './insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const LOCAL = join(HERE, '..', '04-design', '.tmp', 'final-site', 'assets', 'site.css')
const apply = process.argv.includes('--apply')

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')

/** Split a CSS list on top-level (paren-depth-0) commas. */
function splitLayers(value) {
  const out = []
  let depth = 0, buf = ''
  for (const ch of value) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) { out.push(buf.trim()); buf = '' } else buf += ch
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}

const isImageLayer = (l) => /^(?:-webkit-)?(?:repeating-)?(?:linear|radial|conic)-gradient\(|^url\(|^image-set\(/i.test(l)

/** Rules from a flat stylesheet. At-rule preludes are skipped; nested bodies still match. */
function parseRules(css) {
  const out = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m
  while ((m = re.exec(css))) {
    const sel = m[1].replace(/^[\s\S]*[{}]/, '').trim().replace(/\s+/g, ' ')
    if (!sel || sel.startsWith('@')) continue
    out.push({ sel, body: m[2] })
  }
  return out
}

function backgroundOf(body) {
  const bi = body.match(/(?:^|;)\s*background-image\s*:\s*([^;]+)/i)
  if (bi) return { layers: splitLayers(bi[1]), via: 'background-image' }
  const b = body.match(/(?:^|;)\s*background\s*:\s*([^;]+)/i)
  if (b) return { layers: splitLayers(b[1]), via: 'background' }
  return null
}

const norm = (s) => (s ?? '').replace(/\s*([>+~,])\s*/g, '$1').replace(/\s+/g, ' ').trim()
const oneLine = (s) => s.replace(/\s+/g, ' ').trim()

// ── the local build: what the design actually specifies ────────────────────
const wanted = new Map() // normalised selector -> { images:[], color:string|null }
for (const r of parseRules(stripComments(readFileSync(LOCAL, 'utf8')))) {
  const bg = backgroundOf(r.body)
  if (!bg) continue
  const images = bg.layers.filter(isImageLayer).map(oneLine)
  if (images.length < 2) continue // single-layer values are never flattened
  const tail = bg.layers[bg.layers.length - 1]
  const color = !isImageLayer(tail) && bg.via === 'background' ? oneLine(tail) : null
  wanted.set(norm(r.sel), { images, color, sel: r.sel })
}

// ── the registry: what Instatic is holding ─────────────────────────────────
const { site: shell, seq } = await getSite()
const bySelector = new Map()
for (const rule of Object.values(shell.styleRules ?? {})) {
  const k = norm(rule.selector)
  const prev = bySelector.get(k)
  if (!prev || (rule.order ?? 0) > (prev.order ?? 0)) bySelector.set(k, rule)
}

let repaired = 0, ok = 0, missing = 0
for (const [key, want] of wanted) {
  const rule = bySelector.get(key)
  if (!rule) { console.log(`  ?  not in registry            ${want.sel}`); missing++; continue }
  const styles = rule.styles ?? (rule.styles = {})
  const have = styles.backgroundImage ?? styles.background ?? ''
  const haveCount = have ? splitLayers(have).filter(isImageLayer).length : 0
  if (haveCount >= want.images.length) { ok++; continue }

  const value = want.images.join(', ')
  console.log(`  >  ${want.sel}`)
  console.log(`       was ${haveCount} layer(s): ${have.slice(0, 90)}${have.length > 90 ? '…' : ''}`)
  console.log(`       now ${want.images.length} layer(s)`)
  for (const l of want.images) console.log(`         - ${l.slice(0, 110)}${l.length > 110 ? '…' : ''}`)
  if ('background' in styles) delete styles.background
  styles.backgroundImage = value
  if (want.color) styles.backgroundColor = want.color
  rule.updatedAt = Date.now()
  repaired++
}

console.log(`\nmulti-layer backgrounds in the build: ${wanted.size}`)
console.log(`  already correct: ${ok}   repaired: ${repaired}   not in registry: ${missing}`)
if (!repaired) { console.log('nothing to do'); process.exit(0) }
if (!apply) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }
const res = await saveShell(shell, seq)
console.log(`\nsaved draft — seq ${seq} -> ${res.seq}`)
console.log('NOT published. Publish, then gate with css-parity.mjs and compare-local.mjs.')
