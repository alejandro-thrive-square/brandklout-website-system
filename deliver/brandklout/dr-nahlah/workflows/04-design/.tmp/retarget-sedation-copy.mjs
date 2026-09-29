#!/usr/bin/env node
/**
 * retarget-sedation-copy.mjs — apply the 2026-09-28 sedation correction to the
 * LOCAL package (site-src), so no rebuild or re-import can put IV sedation or
 * an anaesthesiologist back on the site. The live site was corrected by
 * 22-instatic-api-sync/push-sedation-copy.mjs from the same table.
 *
 *   node retarget-sedation-copy.mjs            # plan
 *   node retarget-sedation-copy.mjs --apply
 *
 * Source HTML wraps sentences across lines and writes `&amp;`, so each phrase
 * is matched with flexible whitespace and either form of ampersand/apostrophe.
 * Exits 1 while any claim survives ANYWHERE in site-src — comments included,
 * because build-site.mjs does not strip them and a comment ships to the page.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SUB, WHOLE } from '../../22-instatic-api-sync/sedation-copy-map.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = join(HERE, 'site-src')
const APPLY = process.argv.includes('--apply')

const files = []
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (f === 'vendor' || f === 'assets') continue; if (statSync(p).isDirectory()) walk(p); else if (/\.(html|json|js|mjs)$/.test(f)) files.push(p) } }
walk(SRC)

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const flex = (s) => esc(s)
  .replace(/ /g, '\\s+')
  .replace(/&/g, '(?:&amp;|&)')
  .replace(/[’']/g, "(?:’|'|&#39;|&rsquo;)")
const html = (s, isHtml) => (isHtml ? s.replace(/&/g, '&amp;') : s)

let total = 0
const BAD = /\bIV\b|an(a)?esthesiolog|no memory of the|put them to sleep|induce deep sleep|do not remember/i
const left = []
for (const p of files) {
  const isHtml = p.endsWith('.html')
  const before = readFileSync(p, 'utf8')
  let s = before
  let n = 0
  for (const [from, to] of SUB) {
    const rx = new RegExp(flex(from), 'g')
    s = s.replace(rx, () => { n++; return html(to, isHtml) })
  }
  for (const [from, to] of WHOLE) {
    const rx = isHtml ? new RegExp(`(>\\s*)${flex(from)}(\\s*<)`, 'g') : new RegExp(`(")${flex(from)}(")`, 'g')
    s = s.replace(rx, (_, a, b) => { n++; return a + html(to, isHtml) + b })
  }
  if (n) { total += n; console.log(`  ${relative(SRC, p).padEnd(48)} ${n}`) }
  if (APPLY && s !== before) writeFileSync(p, s)
  s.split(/\r?\n/).forEach((line, i) => {
    if (!BAD.test(line)) return
    if (/does not offer IV sedation/.test(line) && !/an(a)?esthesiolog/i.test(line)) return
    if (/IV Sedation Certificate/.test(line) && /meet-dr-nahlah/.test(p)) return
    if (/\.iv-|iv-[a-z]|"iv"|\biv\b/.test(line) && !/\bIV\b/.test(line) && !/an(a)?esthesiolog/i.test(line)) return
    left.push(`${relative(SRC, p)}:${i + 1}: ${line.trim().slice(0, 150)}`)
  })
}
console.log(`\n${total} replacements${APPLY ? ' written' : ' (dry run)'}; ${left.length} line(s) still carry a claim:`)
for (const l of left) console.log('  ! ' + l)
process.exit(left.length ? 1 : 0)
