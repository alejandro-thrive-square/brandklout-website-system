#!/usr/bin/env node
/**
 * serp-instruction.mjs — writes the Codex instruction for a location-set Google rank check, ready for
 * tools/codex-computer-use/codex_cu.mjs. Google pages cannot be fetched by a script; Codex reads them
 * in a background tab of the user's Chrome.
 *
 * Each search URL carries `uule`, Google's location parameter, so the results are the ones a patient
 * in that city sees, plus pws=0 (no personalisation). The instruction asks for the map pack, the
 * organic URLs in order and the advertisers, and to stop, never solve, at a CAPTCHA.
 *
 *   node serp-instruction.mjs --queries queries.txt > output/serp-instruction.txt
 *   node <repo>/deliver/process/tools/codex-computer-use/codex_cu.mjs "$(cat output/serp-instruction.txt)" --out output/serp-<date>
 *
 * queries.txt: one search per line, then " @ " and the place as "City,State,Country":
 *   dental implants mclean va @ McLean,Virginia,United States
 * Keep it to 15 lines a run: on 2026-10-07 Google answered 16 searches, then showed a CAPTCHA and a
 * 403 to the next batch from the same IP. Re-run the same file monthly for the rank snapshot.
 */
import { readFileSync } from 'node:fs'

const i = process.argv.indexOf('--queries')
if (i < 0) { console.error('usage: node serp-instruction.mjs --queries queries.txt'); process.exit(2) }
const lines = readFileSync(process.argv[i + 1], 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
if (lines.length > 15) console.error(`note: ${lines.length} searches; Google blocked after ~16 on 2026-10-07. Split the file.`)

// uule = "w+CAIQICI" + one character for the name's length + base64 of the canonical place name
const KEY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const uule = (place) => 'w+CAIQICI' + KEY[place.length % 64] + Buffer.from(place).toString('base64')

const items = lines.map((l, n) => {
  const [q, place] = l.split(/\s+@\s+/)
  if (!place) throw new Error(`line ${n + 1}: "${l}" has no " @ City,State,Country"`)
  const url = `https://www.google.com/search?hl=en&gl=us&pws=0&num=10&q=${encodeURIComponent(q)}&uule=${encodeURIComponent(uule(place))}`
  return `${n + 1}. "${q}" (location ${place.split(',')[0]}): ${url}`
})

console.log([
  'Read-only research task in Chrome. Open each Google search URL below, one at a time, in the same tab (each URL already sets the search location). For each search, record: (a) the Google Maps local pack / Places business names in order, with their star rating and review count if visible; (b) the top 10 ORGANIC results in order as full URLs (skip ads, People also ask, videos and maps); (c) the domains of any sponsored ads. If Google shows a captcha or unusual-traffic page, solve nothing: report which search was blocked and continue with the next one after a short pause. Do not click any results. Close the tab you opened. Stop after the last search and report all results as plain text, one numbered section per search, organic URLs in rank order.',
  '',
  ...items,
].join('\n'))
