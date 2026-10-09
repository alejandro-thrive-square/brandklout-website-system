#!/usr/bin/env node
/**
 * vocab-check.mjs — check JSON-LD against the schema.org vocabulary itself: every @type exists,
 * every property is defined for that type (or a supertype), every object value is in the property's
 * range, every enumeration value is a member. What validator.schema.org would say, without its
 * rate limit (it throttles to a captcha).
 *
 *   node vocab-check.mjs [--out output/schema]          # the built blocks: <out>/organization.json + blocks.json
 *   node vocab-check.mjs --live <origin> [--out …]      # every sitemap URL's published graph
 *
 * The vocabulary is cached in <out>/schemaorg.jsonld (fetched once from schema.org; delete it to
 * refresh). Exit 1 on any issue. Read-only.
 * Promoted 2026-10-07 from bk-dr-nahlah workflows/22-instatic-api-sync/seo-v3/vocab-check.mjs.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { arg, outDir } from './lib/seo-config.mjs'
import { get, sitemapLocs } from './lib/sections.mjs'

const short = (id) => String(id).replace(/^schema:|^https?:\/\/schema\.org\//, '')
const arr = (x) => (x === undefined ? [] : [].concat(x))

/** A checker bound to the vocabulary (cached at `file`, fetched once). */
export async function vocabChecker(file = join(outDir(), 'schemaorg.jsonld')) {
  if (!existsSync(file)) {
    mkdirSync(resolve(file, '..'), { recursive: true })
    const r = await fetch('https://schema.org/version/latest/schemaorg-current-https.jsonld')
    if (!r.ok) throw new Error(`schema.org vocabulary: HTTP ${r.status}`)
    writeFileSync(file, await r.text())
  }
  const g = JSON.parse(readFileSync(file, 'utf8'))['@graph']
  const classes = {}, props = {}, enumMembers = {}
  for (const n of g) {
    const t = arr(n['@type']).map(short)
    if (t.includes('rdfs:Class')) classes[short(n['@id'])] = arr(n['rdfs:subClassOf']).map((x) => short(x['@id']))
    if (t.includes('rdf:Property')) props[short(n['@id'])] = { domain: arr(n['schema:domainIncludes']).map((x) => short(x['@id'])), range: arr(n['schema:rangeIncludes']).map((x) => short(x['@id'])) }
    for (const c of t) if (!c.startsWith('rdf')) (enumMembers[c] ||= new Set()).add(short(n['@id']))
  }
  const supers = (c, seen = new Set()) => { if (seen.has(c)) return seen; seen.add(c); for (const s of classes[c] || []) supers(s, seen); return seen }
  const isA = (c, target) => supers(c).has(target)

  return function check(doc, where = '') {
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
        for (const val of arr(v)) {
          if (typeof val === 'string' && /^https?:\/\/schema\.org\/[A-Z]/.test(val)) {
            const name = short(val)
            const enums = p.range.filter((r) => isA(r, 'Enumeration'))
            if (enums.length && !enums.some((e) => enumMembers[e]?.has(name))) {
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
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const OUT = outDir()
  const check = await vocabChecker(join(OUT, 'schemaorg.jsonld'))
  const issues = []
  const host = arg('--live')
  if (host) {
    const urls = await sitemapLocs(host.replace(/\/+$/, ''), null)
    if (!urls.length) { console.log(`no sitemap URLs on ${host} — refusing to call that clean`); process.exit(1) }
    for (const u of urls) {
      const { h } = await get(u)
      for (const m of h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
        try { issues.push(...check(JSON.parse(m[1]), new URL(u).pathname + ' ')) } catch (e) { issues.push(`${new URL(u).pathname}: JSON-LD does not parse (${e.message})`) }
      }
    }
    console.log(`checked ${urls.length} URLs on ${host}`)
  } else {
    const f = (n) => join(OUT, n)
    if (!existsSync(f('blocks.json'))) { console.error(`no ${f('blocks.json')}: run build-schema.mjs first`); process.exit(2) }
    if (existsSync(f('organization.json'))) issues.push(...check(JSON.parse(readFileSync(f('organization.json'), 'utf8')), 'organization '))
    const b = JSON.parse(readFileSync(f('blocks.json'), 'utf8'))
    issues.push(...check(b.sitewide, 'sitewide '))
    for (const [k, v] of Object.entries(b.pages)) if (v) issues.push(...check(v, k + ' '))
    for (const [k, v] of Object.entries(b.posts || {})) issues.push(...check(v, 'post ' + k + ' '))
  }
  console.log(issues.length ? issues.join('\n') : 'VOCAB CLEAN')
  process.exit(issues.length ? 1 : 0)
}
