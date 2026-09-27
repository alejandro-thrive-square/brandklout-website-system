#!/usr/bin/env node
/**
 * retarget-seo-numbers.mjs — the same new-patient number retarget as
 * 22-instatic-api-sync/push-office-numbers.mjs, but for everything the SEO
 * plugins STORE rather than derive.
 *
 *   node retarget-seo-numbers.mjs            # report, write nothing
 *   node retarget-seo-numbers.mjs --apply
 *
 * ## Why the page rewrite was not enough
 *
 * Rewriting the `base.link` nodes fixed every number a visitor can see and
 * click. It did not touch the head, because none of that comes from the page
 * tree:
 *
 *   - `brandklout.aeo-schema` holds `telephone` and a 3KB `organizationJson`
 *     string. That is the `<script type="application/ld+json">` Google reads,
 *     and it was still publishing `+1-571-702-9900` and `+1-571-253-7790` on
 *     every page after the pages themselves were clean.
 *   - the per-page `<meta name="description">`, `og:description` and
 *     `twitter:description` are MATERIALISED per page — populate-seo.mjs
 *     stores them so they are visible and editable in the admin instead of
 *     being implied. Two of them name a telephone number in prose.
 *
 * So the head can be correct while the body is wrong, and the other way
 * round, and a raw-HTML check of the page body proves nothing about either.
 * Always look at the published `<head>` after a content change of this kind.
 *
 * Everything is read-merge-write: only the number substrings change.
 */
import { api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const MAP = [
  ['+1-571-702-9900', '+1-703-448-3312'],
  ['+1-571-619-9442', '+1-703-448-3312'],
  ['+1-571-253-7790', '+1-571-617-7245'],
  ['+1-571-410-3430', '+1-571-617-7245'],
  ['+15717029900', '+17034483312'],
  ['+15716199442', '+17034483312'],
  ['+15712537790', '+15716177245'],
  ['+15714103430', '+15716177245'],
  ['(571) 702-9900', '(703) 448-3312'],
  ['(571) 619-9442', '(703) 448-3312'],
  ['(571) 253-7790', '(571) 617-7245'],
  ['(571) 410-3430', '(571) 617-7245'],
  ['571-702-9900', '703-448-3312'],
  ['571-619-9442', '703-448-3312'],
  ['571-253-7790', '571-617-7245'],
  ['571-410-3430', '571-617-7245'],
].sort((a, b) => b[0].length - a[0].length)

/* Tysons' two lines are now the same number, so a description that named both
   would read "New patients X, current patients X". Collapse that phrasing. */
const PROSE = [
  ['New patients (703) 448-3312, current patients (703) 448-3312.', 'Call (703) 448-3312.'],
]

const DEAD = ['5717029900', '5712537790', '5716199442', '5714103430',
  '571-702-9900', '571-253-7790', '571-619-9442', '571-410-3430',
  '571) 702-9900', '571) 253-7790', '571) 619-9442', '571) 410-3430']

let hits = 0
const subStr = (s) => {
  let out = s
  for (const [from, to] of MAP) {
    if (!out.includes(from)) continue
    hits += out.split(from).length - 1
    out = out.split(from).join(to)
  }
  for (const [from, to] of PROSE) out = out.split(from).join(to)
  return out
}
const sub = (v) => {
  if (typeof v === 'string') return subStr(v)
  if (Array.isArray(v)) return v.map(sub)
  if (v && typeof v === 'object') {
    const o = {}
    for (const [k, x] of Object.entries(v)) o[k] = sub(x)
    return o
  }
  return v
}

// ── 1. the site-level schema plugin ────────────────────────────────────────
const ID = 'brandklout.aeo-schema'
const cur = await api('GET', `/admin/api/cms/plugins/${ID}/settings`)
const before = hits
const next = sub(cur.settings ?? {})
console.log(`${ID}: ${hits - before} strings`)
console.log(`  telephone        ${JSON.stringify(cur.settings?.telephone)} -> ${JSON.stringify(next.telephone)}`)
const tels = (s) => [...String(s ?? '').matchAll(/"telephone"\s*:\s*"([^"]+)"/g)].map((m) => m[1])
console.log(`  organizationJson ${JSON.stringify(tels(cur.settings?.organizationJson))} -> ${JSON.stringify(tels(next.organizationJson))}`)

// ── 2. per-page Open Graph overrides ───────────────────────────────────────
/* The per-page `<meta name="description">`, `og:description` and
   `twitter:description` are MATERIALISED overrides held by the Open Graph
   plugin's runtime store, not derived from the page and not in the pages
   table's SEO cells (which are empty on 56 of 57 rows and inert anyway). Two
   of them name a telephone number in prose. Note the endpoint id: the runtime
   routes moved to `brandklout.*` with migrate-plugin-ids.mjs, and
   populate-seo.mjs still points at the old `webzite.*` ones, so it would 404
   if anyone reached for it instead of this. */
const OG = '/admin/api/cms/plugins/brandklout.open-graph/runtime'
const og = await api('GET', `${OG}/pages`)
const ogFixes = []
for (const p of og.pages ?? []) {
  if (!p.override) continue
  const b = hits
  const fixed = sub(p.override)
  if (hits === b && JSON.stringify(fixed) === JSON.stringify(p.override)) continue
  ogFixes.push({ slug: p.slug, from: p.override.description, to: fixed.description, override: fixed })
}
console.log(`\nOpen Graph overrides to fix: ${ogFixes.length}`)
for (const f of ogFixes) {
  console.log(`  ${f.slug}`)
  console.log(`      - ${f.from}`)
  console.log(`      + ${f.to}`)
}

console.log(`\n${hits} strings total`)
if (!APPLY) { console.log('DRY RUN — re-run with --apply'); process.exit(0) }

await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, { settings: next })
for (const f of ogFixes) await api('POST', `${OG}/override`, f.override)

// ── read back ──────────────────────────────────────────────────────────────
const back = await api('GET', `/admin/api/cms/plugins/${ID}/settings`)
const s = JSON.stringify(back.settings)
const left = DEAD.filter((d) => s.includes(d))
console.log(`\n${ID} read back: ${left.length ? 'STILL HAS ' + left.join(', ') : 'clean'}`)
console.log(`  telephone ${JSON.stringify(back.settings.telephone)}`)
console.log(`  organizationJson ${JSON.stringify(tels(back.settings.organizationJson))}`)

const ogBack = await api('GET', `${OG}/pages`)
const ogLeft = (ogBack.pages ?? []).filter((p) => DEAD.some((d) => JSON.stringify(p.override ?? {}).includes(d)))
console.log(`open-graph overrides read back: ${ogLeft.length ? 'STILL HAS ' + ogLeft.map((p) => p.slug).join(', ') : 'clean'}`)
if (left.length || ogLeft.length) process.exit(1)
console.log('\nNot published. Publish, then check the published <head>, not just the body.')
