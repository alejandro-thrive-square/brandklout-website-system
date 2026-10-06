#!/usr/bin/env node
// SEO v2 (2026-10-05): write seo-v2/alt-proposals.json (43 images that published alt="",
// each viewed and described) onto the media assets. base.image renders alt from the asset's
// altText only. Never overwrites an alt that is already set.   node seo-v2/push-alt-text.mjs [--apply]
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const props = JSON.parse(readFileSync(join(HERE, 'alt-proposals.json'), 'utf8'))
const assets = (await api('GET', '/admin/api/cms/media')).assets
let n = 0, skip = 0, miss = 0, bad = 0
for (const p of props) {
  if (p.decorative || !p.alt) { skip++; continue }
  const a = assets.find((x) => x.publicPath === '/uploads/' + p.file)
  if (!a) { miss++; console.log('  no asset', p.file); continue }
  if ((a.altText || '').trim()) { skip++; continue }
  n++
  if (!APPLY) { console.log(`  ${p.file.slice(0, 44).padEnd(44)} ${p.alt}`); continue }
  await api('PATCH', `/admin/api/cms/media/${a.id}`, { altText: p.alt })
}
if (APPLY) {
  const after = new Map((await api('GET', '/admin/api/cms/media')).assets.map((x) => [x.publicPath, x.altText]))
  for (const p of props) if (!p.decorative && after.get('/uploads/' + p.file) !== p.alt) { bad++; console.log('  !! not read back', p.file) }
}
console.log(`${APPLY ? 'written' : 'would write'} ${n}, skipped ${skip}, no asset ${miss}, failed ${bad}`)
