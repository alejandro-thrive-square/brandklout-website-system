// Concept pages are style options, not a site: strip every link that leaves the deck
// (old site, tel:, maps, socials) so a click never lands the client on the old site.
// Keeps the "All 5 concepts" back link, in-page #anchors and font preconnects.
// Usage: node code/strip-links.mjs   (from output/)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'concepts'
const outbound = /\s(?:href)="(?:https?:\/\/(?!fonts\.)[^"]*|tel:[^"]*|mailto:[^"]*)"|\s(?:target|rel)="[^"]*"/g

for (const f of readdirSync(dir).filter(f => /^concept-0\d.*\.html$/.test(f))) {
  const p = join(dir, f)
  const src = readFileSync(p, 'utf8')
  let n = 0
  // Only touch <a ...> tags, so <link href> to Google Fonts is untouched.
  const out = src.replace(/<a\b[^>]*>/g, tag => tag.replace(outbound, m => (m.trimStart().startsWith('href') && n++, '')))
  writeFileSync(p, out)
  console.log(`${f}: ${n} links removed`)
}
