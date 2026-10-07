#!/usr/bin/env node
/**
 * autocomplete.mjs — the keyless demand signal: what Google Autocomplete suggests for each
 * service × place query. Use it to build and rank the keyword map when no volume tool is available,
 * and alongside one when it is.
 *
 * For every query (each --seeds term alone, with each --places name, and with each --suffixes word):
 *   exact   Google suggests the query itself
 *   longer  how many suggestions extend it ("dental implants cost" → +N); 8–10 means broad demand
 *   suggestions, so new phrasings can be added to the map
 *
 *   node autocomplete.mjs --seeds "dental implants,all on 4,veneers" --places "mclean va,alexandria va" \
 *        [--suffixes "cost,near me"] [--out output/autocomplete.json] > output/autocomplete.tsv
 *
 * Endpoint: suggestqueries.google.com (client=firefox, hl=en, gl=us), 200 ms apart. On 2026-10-07 it
 * answered ~220 calls without a block. Origin: bk-dr-nahlah 2026-10-07.
 */
import { writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const list = (i) => args[i + 1].split(',').map((s) => s.trim()).filter(Boolean)
let seeds = [], places = [], suffixes = [], out = null
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--seeds') seeds = list(i++)
  else if (args[i] === '--places') places = list(i++)
  else if (args[i] === '--suffixes') suffixes = list(i++)
  else if (args[i] === '--out') out = args[++i]
  else throw new Error(`unknown argument ${args[i]}`)
}
if (!seeds.length) { console.error('usage: node autocomplete.mjs --seeds "a,b" [--places "x va,y va"] [--suffixes "cost,near me"] [--out file.json]'); process.exit(2) }

const queries = [...new Set(seeds.flatMap((s) => [s, ...places.map((p) => `${s} ${p}`), ...suffixes.map((x) => `${s} ${x}`)]))]
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim()
const results = []
console.log('query\texact\tlonger\tsuggestions')
for (const q of queries) {
  let sugg = []
  try {
    const r = await fetch('https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=us&q=' + encodeURIComponent(q), { headers: { 'user-agent': 'Mozilla/5.0' } })
    sugg = JSON.parse(Buffer.from(await r.arrayBuffer()).toString('utf8'))[1] || []
  } catch (e) { sugg = [`ERROR ${e.message}`] }
  const exact = sugg.some((s) => norm(s) === norm(q))
  const longer = sugg.filter((s) => norm(s).startsWith(norm(q) + ' ')).length
  results.push({ query: q, exact, longer, suggestions: sugg })
  console.log(`${q}\t${exact ? 'AC' : ''}\t${longer ? '+' + longer : ''}\t${sugg.join(' | ')}`)
  await new Promise((r) => setTimeout(r, 200))
}
if (out) writeFileSync(out, JSON.stringify({ fetched: new Date().toISOString(), results }, null, 1))
