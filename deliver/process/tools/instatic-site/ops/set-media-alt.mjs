#!/usr/bin/env node
/**
 * set-media-alt.mjs — set image alt text where Instatic keeps it: the media asset's `altText`.
 * Scenario 7 step 02 (alt text by the SEO & AEO standard, rule 5).
 *
 * base.image renders `alt` from the asset's altText only (props.alt is ignored, htmlAttributes.alt
 * doubles it), so one asset change reaches every page that shows the image. Assets are found by their
 * public path (`/uploads/<file>`), the value a page's image node carries.
 *
 *   INSTATIC_BASE_URL=https://staging.<domain> node set-media-alt.mjs --from alts.json             # plan
 *   INSTATIC_BASE_URL=https://staging.<domain> STAGING_HOST=staging.<domain> node set-media-alt.mjs --from alts.json --apply
 * alts.json: [{ "src": "/uploads/<file>", "alt": "<new alt>" }, ...]  ("" = decorative)
 * Unlike seo-v2/push-alt-text.mjs this REPLACES an alt that is set; the old values are backed up to
 * --out (default output/backups) before the first write. Alts over 125 characters are refused.
 * Asset ids differ between hosts: run it per host. No publish needed (the media library is live),
 * but published pages show the new alt only after the next publish re-renders them.
 * Note: the media list answered with the newest 100 assets on some instances (West LA, 2026-09-30);
 * a src not found is reported, never guessed.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { isAbsolute, join } from 'node:path'
import { api, BASE } from '../lib/site.mjs'
import { assertStaging } from '../lib/staging-guard.mjs'

const argv = process.argv.slice(2)
const arg = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d }
const APPLY = argv.includes('--apply')
const from = arg('--from')
if (!from) { console.error('usage: node set-media-alt.mjs --from alts.json [--apply] [--out output/backups]'); process.exit(2) }
const abs = (p) => (isAbsolute(p) ? p : join(process.cwd(), p))
const want = JSON.parse(readFileSync(abs(from), 'utf8'))
if (APPLY) assertStaging()

let fail = 0
const bad = (m) => { fail++; console.log(`  !! ${m}`) }
for (const w of want) if ((w.alt || '').length > 125) bad(`${w.src}: alt is ${w.alt.length} characters (125 max)`)
if (fail) { console.log('\nrefusing: shorten those first'); process.exit(1) }

const assets = (await api('GET', '/admin/api/cms/media')).assets ?? []
const byPath = new Map(assets.map((a) => [a.publicPath, a]))
const todo = []
for (const w of want) {
  const a = byPath.get(w.src.split('?')[0])
  if (!a) { bad(`${w.src}: no media asset with that path (${assets.length} listed)`); continue }
  if ((a.altText || '') === w.alt) continue
  todo.push({ a, w })
  console.log(`  ${w.src.split('/').pop().slice(0, 40).padEnd(40)} ${JSON.stringify(a.altText || '')} -> ${JSON.stringify(w.alt)}`)
}
console.log(`\n${APPLY ? 'APPLY' : 'PLAN'} on ${BASE}: ${todo.length} to change, ${want.length - todo.length} already set or not found`)

if (APPLY && todo.length) {
  const dir = abs(arg('--out', 'output/backups'))
  mkdirSync(dir, { recursive: true })
  const bf = join(dir, `set-media-alt-${new URL(BASE).hostname}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  writeFileSync(bf, JSON.stringify(todo.map(({ a }) => ({ id: a.id, src: a.publicPath, alt: a.altText ?? '' })), null, 1))
  console.log(`backup   ${bf}`)
  for (const { a, w } of todo) await api('PATCH', `/admin/api/cms/media/${a.id}`, { altText: w.alt })
  const after = new Map(((await api('GET', '/admin/api/cms/media')).assets ?? []).map((x) => [x.id, x.altText ?? '']))
  for (const { a, w } of todo) if (after.get(a.id) !== w.alt) bad(`${a.publicPath}: did not read back`)
}
console.log(`\n${fail ? 'FAIL' : 'CLEAN'}  ${APPLY ? 'written and read back' : 'plan only: pass --apply'}`)
process.exit(fail ? 1 : 0)
