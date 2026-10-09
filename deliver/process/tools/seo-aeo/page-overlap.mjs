#!/usr/bin/env node
/**
 * page-overlap.mjs — how much body text two pages share. The gate for office twins (the McLean and
 * the Alexandria version of the same service page) and a check on any page suspected of duplicating
 * another, on our site or across domains.
 *
 * Text: the page body minus script, style, header, nav and footer. Measure: 5-word shingles;
 * "shared" = the share of the smaller page's shingles found in the other page.
 * FAIL (exit 1) when shared > --max (default 0.25).
 *
 * Why 25%: on 2026-10-07 the two-office competitor ranking in both of Dr. Nahlah's cities shared 5.5%
 * between its twins; a DC prosthodontist ranking #5 in McLean shared 12–26% across its town pages;
 * town-swapped pages sharing 95% were seen only on long-tail searches (tools/seo-aeo/README.md).
 *
 *   node page-overlap.mjs --pair https://a/x https://a/y [--pair …] [--pairs pairs.txt] [--max 0.25] > output/overlap.log
 * pairs.txt: "urlA urlB" per line.
 */
import { readFileSync } from 'node:fs'
import { get, plain } from './lib.mjs'

const args = process.argv.slice(2)
const pairs = []
let max = 0.25
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--pair') pairs.push([args[++i], args[++i]])
  else if (args[i] === '--pairs') readFileSync(args[++i], 'utf8').split(/\r?\n/).map((l) => l.trim().split(/\s+/)).filter((p) => p.length === 2).forEach((p) => pairs.push(p))
  else if (args[i] === '--max') max = Number(args[++i])
  else throw new Error(`unknown argument ${args[i]}`)
}
if (!pairs.length) { console.error('usage: node page-overlap.mjs --pair <urlA> <urlB> [...] [--pairs file] [--max 0.25]'); process.exit(2) }

const cache = new Map()
async function shingles(url) {
  if (cache.has(url)) return cache.get(url)
  const { status, text } = await get(url)
  const body = text.slice(Math.max(0, text.search(/<\/head>/i)))
    .replace(/<(script|style|noscript|template|svg|header|nav|footer)\b[\s\S]*?<\/\1>/gi, ' ')
  const words = plain(body).toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean)
  const set = new Set()
  for (let i = 0; i + 5 <= words.length; i++) set.add(words.slice(i, i + 5).join(' '))
  const r = { status, set, words: words.length }
  cache.set(url, r)
  return r
}

let fail = 0
for (const [a, b] of pairs) {
  const A = await shingles(a), B = await shingles(b)
  if (A.status !== 200 || B.status !== 200 || !A.set.size || !B.set.size) { fail++; console.log(`FAIL  cannot compare: ${a} (${A.status}) vs ${b} (${B.status})`); continue }
  let inter = 0
  for (const s of A.set) if (B.set.has(s)) inter++
  const shared = inter / Math.min(A.set.size, B.set.size)
  const ok = shared <= max
  if (!ok) fail++
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${(shared * 100).toFixed(1)}% shared  ${a} (${A.words} words)  vs  ${b} (${B.words} words)`)
}
console.log(`\n${fail ? 'FAIL' : 'CLEAN'}  ${pairs.length - fail} of ${pairs.length} pairs at or under ${(max * 100).toFixed(0)}% shared`)
process.exit(fail ? 1 : 0)
