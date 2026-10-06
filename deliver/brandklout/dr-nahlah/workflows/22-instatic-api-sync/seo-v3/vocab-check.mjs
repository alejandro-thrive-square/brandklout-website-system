#!/usr/bin/env node
/**
 * SEO v3: check JSON-LD against the schema.org vocabulary itself — every @type exists, every
 * property is defined for that type (or a supertype), every enumeration value is a member.
 * Catches what validator.schema.org would, without its rate limit.
 *
 *   node seo-v3/vocab-check.mjs                 # the built blocks (seo-v3/out)
 *   node seo-v3/vocab-check.mjs --live [host]   # every sitemap URL's published graph
 *
 * The vocabulary is cached in seo-v3/out/schemaorg.jsonld (fetched once from schema.org).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
const VOCAB = join(HERE, 'out', 'schemaorg.jsonld')
if (!existsSync(VOCAB)) writeFileSync(VOCAB, await (await fetch('https://schema.org/version/latest/schemaorg-current-https.jsonld')).text())
const g = JSON.parse(readFileSync(VOCAB, 'utf8'))['@graph']
const short = (id) => String(id).replace(/^schema:|^https?:\/\/schema\.org\//, '')
const arr = (x) => (x === undefined ? [] : [].concat(x))
const classes = {}; const props = {}; const enumMembers = {}
for (const n of g) {
  const t = arr(n['@type']).map(short)
  if (t.includes('rdfs:Class')) classes[short(n['@id'])] = arr(n['rdfs:subClassOf']).map((x) => short(x['@id']))
  if (t.includes('rdf:Property')) props[short(n['@id'])] = { domain: arr(n['schema:domainIncludes']).map((x) => short(x['@id'])), range: arr(n['schema:rangeIncludes']).map((x) => short(x['@id'])) }
  for (const c of t) if (!c.startsWith('rdf')) (enumMembers[c] ||= new Set()).add(short(n['@id']))
}
const supers = (c, seen = new Set()) => { if (seen.has(c)) return seen; seen.add(c); for (const s of classes[c] || []) supers(s, seen); return seen }
const isA = (c, target) => supers(c).has(target)

export function check (doc, where = '') {
  const issues = []
  const visit = (node, path) => {
    if (Array.isArray(node)) return node.forEach((x, i) => visit(x, `${path}[${i}]`))
    if (!node || typeof node !== 'object') return
    const types = arr(node['@type'])
    for (const t of types) if (!classes[t]) issues.push(`${where}${path}: unknown type ${t}`)
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('@')) { if (k === '@graph') visit(v, path + '.@graph'); continue }
      const p = props[k]
      if (!p) { issues.push(`${where}${path}: unknown property ${k}`); continue }
      if (types.length && !types.some((t) => p.domain.some((d) => isA(t, d)))) issues.push(`${where}${path}: ${k} is not a property of ${types.join('/')}`)
      // enumeration values written as https://schema.org/X must be members of an enum in the range
      for (const val of arr(v)) {
        if (typeof val === 'string' && /^https?:\/\/schema\.org\/[A-Z]/.test(val)) {
          const name = short(val)
          const enums = p.range.filter((r) => isA(r, 'Enumeration'))
          if (enums.length && !enums.some((e) => enumMembers[e]?.has(name) || [...(enumMembers[e] ? [] : [])].length)) {
            const anySub = enums.some((e) => Object.keys(enumMembers).some((c) => isA(c, e) && enumMembers[c].has(name)))
            if (!anySub) issues.push(`${where}${path}.${k}: ${name} is not a value of ${enums.join('/')}`)
          }
        }
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          const vt = arr(val['@type'])
          if (vt.length && p.range.length && !vt.some((t) => p.range.some((r) => isA(t, r))) && !p.range.includes('Text') && !p.range.includes('URL')) issues.push(`${where}${path}.${k}: ${vt.join('/')} is not in the range of ${k} (${p.range.join(', ')})`)
          visit(val, `${path}.${k}`)
        }
      }
    }
  }
  visit(doc, '')
  return issues
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('vocab-check.mjs')) {
  const li = process.argv.indexOf('--live')
  let issues = []
  if (li > 0) {
    const S = process.argv[li + 1] && !process.argv[li + 1].startsWith('--') ? process.argv[li + 1] : 'https://www.drnahlah.com'
    const sm = await (await fetch(`${S}/sitemap.xml`)).text()
    for (const u of [...sm.matchAll(/<loc>([^<]+)/g)].map((m) => m[1])) {
      const h = await (await fetch(u)).text()
      for (const m of h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) issues.push(...check(JSON.parse(m[1]), u.replace(S, '') + ' '))
    }
  } else {
    const OUT = join(HERE, 'out')
    issues.push(...check(JSON.parse(readFileSync(join(OUT, 'organization.json'), 'utf8')), 'organization '))
    const b = JSON.parse(readFileSync(join(OUT, 'blocks.json'), 'utf8'))
    issues.push(...check(b.sitewide, 'sitewide '))
    for (const [k, v] of Object.entries(b.pages)) if (v) issues.push(...check(v, k + ' '))
    for (const [k, v] of Object.entries(b.posts)) issues.push(...check(v, 'post ' + k + ' '))
  }
  console.log(issues.length ? issues.join('\n') : 'VOCAB CLEAN')
  process.exit(issues.length ? 1 : 0)
}
