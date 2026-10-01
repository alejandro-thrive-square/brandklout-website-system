#!/usr/bin/env node
/**
 * The gate. Prove two published Instatic sites actually render the same thing.
 *
 *   node diff-sites.mjs --a https://www.drnahlah.com --b https://staging.drnahlah.com
 *
 *   --strict   also require byte-equality (after normalising srcset/sizes)
 *
 * Run this after every seed AND after every promotion. It is the only step
 * that catches the silent gaps, all of which look fine in the admin:
 *   - plugins missing on the target  -> canonical/og/JSON-LD absent
 *   - collection rows not row-published -> listing renders 0 items, details 404
 *   - a page that simply did not come across
 *
 * `srcset`/`sizes` are normalised away on purpose. Image VARIANTS are not in
 * the export bundle and are only ever generated at upload, so a cloned site
 * serves the same `src` at the same dimensions with no `srcset`. That is a
 * known, permanent, visually-invisible difference — flagging it every run
 * would train people to ignore this tool. It is reported as a count instead.
 *
 * The canonical comparison is skipped for the same reason when the target
 * sends `X-Robots-Tag: noindex`. A de-indexed staging site is SUPPOSED to have
 * no canonical: `noindex` plus a canonical pointing at production can carry
 * the noindex across to production, so `emitCanonical` is deliberately off
 * there. Comparing canonicals in that state would fail all 37 pages on a
 * correct setup — and a gate that always fails is a gate nobody reads.
 */
import { login, api } from './lib.mjs'

const argv = process.argv.slice(2)
const flag = (n, d) => { const i = argv.indexOf('--' + n); return i === -1 ? d : argv[i + 1] }
const A = flag('a'), B = flag('b')
const STRICT = argv.includes('--strict')
if (!A || !B) { console.error('usage: node diff-sites.mjs --a <url> --b <url> [--strict]'); process.exit(2) }

const cookie = await login(A)
const { rows } = await api(A, cookie, 'GET', '/admin/api/cms/pages')
const slugs = rows.map((r) => r.slug).sort()

const norm = (t) => t.replace(/\s+srcset="[^"]*"/g, '').replace(/\s+sizes="[^"]*"/g, '').replace(/\s+/g, ' ').trim()
const pick = (t, re) => (t.match(re) || [])[1] ?? ''
const originals = (t) => [...t.matchAll(/src="(\/uploads\/[^"]+)"/g)].map((m) => m[1])
  .filter((u) => !/-w\d+\.webp$/.test(u)).sort().join(',')

let identical = 0, equivalent = 0
const problems = []
let srcsetA = 0, srcsetB = 0

// Is the target deliberately de-indexed? If so it should have no canonical.
const probe = await fetch(B + '/')
const targetNoindex = (probe.headers.get('x-robots-tag') || '').toLowerCase().includes('noindex')

for (const slug of slugs) {
  const path = slug === 'index' ? '/' : '/' + slug
  const [ra, rb] = await Promise.all([fetch(A + path), fetch(B + path)])
  const [ta, tb] = [await ra.text(), await rb.text()]
  srcsetA += (ta.match(/srcset=/g) || []).length
  srcsetB += (tb.match(/srcset=/g) || []).length

  const canonB = pick(tb, /rel="canonical"[^>]*href="([^"]+)/)
  const same = {
    status: ra.status === rb.status,
    title: pick(ta, /<title[^>]*>([^<]*)/i) === pick(tb, /<title[^>]*>([^<]*)/i),
    // Expected to be absent on a de-indexed target — see header.
    canonical: targetNoindex && !canonB ? true
      : pick(ta, /rel="canonical"[^>]*href="([^"]+)/) === canonB,
    jsonld: (ta.match(/application\/ld\+json/g) || []).length === (tb.match(/application\/ld\+json/g) || []).length,
    images: originals(ta) === originals(tb),
  }
  if (targetNoindex && canonB) {
    problems.push({ slug, canonicalOnNoindexTarget: false, a: ra.status, b: rb.status })
    continue
  }
  if (norm(ta) === norm(tb)) identical++
  if (Object.values(same).every(Boolean)) { equivalent++; continue }
  problems.push({ slug, ...same, a: ra.status, b: rb.status })
}

console.log(`pages compared            ${slugs.length}`)
console.log(`byte-identical            ${identical}   (srcset/sizes normalised out)`)
console.log(`content-equivalent        ${equivalent}`)
console.log(`differences               ${problems.length}`)
console.log(`srcset attributes         a=${srcsetA}  b=${srcsetB}${srcsetA !== srcsetB ? '   <- known: variants are not in the bundle' : ''}`)
if (targetNoindex) console.log(`target is noindex         canonical comparison skipped (correct for staging)`)

for (const p of problems) {
  const bad = Object.entries(p).filter(([k, v]) => v === false).map(([k]) => k)
  console.log(`  ${p.slug.padEnd(34)} ${p.a}/${p.b}  differs: ${bad.join(', ')}`)
}
if (!problems.length && srcsetB === 0 && srcsetA > 0) {
  console.log('\nNote: target has no srcset at all — expected on a fresh clone.')
}
if (problems.length) {
  console.log(`
If 'canonical' or 'jsonld' differ, the target is missing plugins -> clone-plugins.mjs
If a collection page differs on 'images' with a much smaller body, its rows were
never row-published -> publish-rows.mjs`)
}
process.exit(problems.length || (STRICT && identical !== slugs.length) ? 1 : 0)
