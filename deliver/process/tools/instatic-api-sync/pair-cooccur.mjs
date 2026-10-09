// 2026-10-06: the second opinion on an order-pairs.mjs flag (classes never on one published element = harmless). Write order-pairs output to a .txt first.
// Read-only: for each flagged pair in pairs.txt, does any published element carry both classes?
//   node pair-cooccur.mjs --site <c>:staging <pairs.txt>
import { readFileSync } from 'node:fs'
import { connect } from './target.mjs'
const { api, target } = await connect()
const file = process.argv.filter((a) => a.endsWith('.txt')).at(-1)
const pairs = []
for (const line of readFileSync(file, 'utf8').split('\n')) {
  const m = line.match(/originally "\.([\w-]+)"[^"]*"\.([\w-]+)"/)
  if (m && /^[A-Z]+ /.test(line)) pairs.push([m[1], m[2]])
}
const base = target.url.replace(/\/$/, '')
const both = new Map(pairs.map((p) => [p.join(' + '), 0]))
const seen = new Map()
for (const slug of await api.pageSlugs()) {
  const html = await fetch(`${base}/${slug}`).then((r) => (r.ok ? r.text() : ''))
  for (const m of html.matchAll(/\sclass\s*=\s*"([^"]*)"/g)) {
    const set = new Set(m[1].split(/\s+/))
    for (const [a, b] of pairs) {
      if (set.has(a)) seen.set(a, (seen.get(a) ?? 0) + 1)
      if (set.has(b)) seen.set(b, (seen.get(b) ?? 0) + 1)
      if (set.has(a) && set.has(b)) both.set(`${a} + ${b}`, both.get(`${a} + ${b}`) + 1)
    }
  }
}
for (const [k, n] of both) {
  const [a, b] = k.split(' + ')
  console.log(`${n ? 'TOGETHER' : 'never   '}  ${k}   (${a} on ${seen.get(a) ?? 0} elements, ${b} on ${seen.get(b) ?? 0})`)
}
console.log(`${pairs.length} pair(s); ${[...both.values()].filter(Boolean).length} ever on one element`)
