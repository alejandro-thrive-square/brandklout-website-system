#!/usr/bin/env node
/**
 * Media alt text parity between hosts (2026-10-05). alt is stored once per media asset
 * (`altText`; base.image renders nothing else), and clone-site.mjs never carries media, so a
 * staging clone keeps whatever alt it had on the day it was seeded. This copies every NON-EMPTY
 * production altText onto the staging asset with the same publicPath, and reports staging assets
 * production has no counterpart for. The host comes from INSTATIC_BASE_URL.
 *
 *   INSTATIC_BASE_URL=https://www.drnahlah.com     node seo-v2/media-alt-parity.mjs export
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node seo-v2/media-alt-parity.mjs import [--apply]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { api, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const FILE = join(HERE, 'out', 'media-alt.prod.json')
const APPLY = process.argv.includes('--apply')
const assets = (await api('GET', '/admin/api/cms/media')).assets

if (process.argv[2] === 'export') {
  const map = Object.fromEntries(assets.filter((a) => (a.altText || '').trim()).map((a) => [a.publicPath, a.altText]))
  writeFileSync(FILE, JSON.stringify({ host: BASE, alts: map }, null, 1))
  console.log(`exported ${BASE}: ${assets.length} assets, ${Object.keys(map).length} with alt`)
  process.exit(0)
}

const src = JSON.parse(readFileSync(FILE, 'utf8'))
if (src.host === BASE) { console.error('source and target are the same host'); process.exit(2) }
const todo = assets.filter((a) => src.alts[a.publicPath] && a.altText !== src.alts[a.publicPath])
const noSource = assets.filter((a) => !src.alts[a.publicPath] && /^image\//.test(a.mimeType || '') && !(a.altText || '').trim())
console.log(`${BASE}: ${assets.length} assets; ${todo.length} alt(s) differ from ${src.host}; ${noSource.length} image(s) without alt on both hosts`)
if (!APPLY) { for (const a of todo.slice(0, 8)) console.log(`  ${a.publicPath.slice(9, 60)}  ${JSON.stringify(a.altText || '')} -> ${JSON.stringify(src.alts[a.publicPath])}`); console.log('dry run'); process.exit(0) }
const BK = join(HERE, '..', '.tmp', 'backups', 'media-alt-' + BASE.replace(/^https?:\/\//, '') + '-' + new Date().toISOString().replace(/[:.]/g, '-'))
mkdirSync(BK, { recursive: true })
writeFileSync(join(BK, 'media.json'), JSON.stringify(assets.map((a) => ({ id: a.id, publicPath: a.publicPath, altText: a.altText }))))
for (const a of todo) await api('PATCH', `/admin/api/cms/media/${a.id}`, { altText: src.alts[a.publicPath] })
const after = (await api('GET', '/admin/api/cms/media')).assets
const left = after.filter((a) => src.alts[a.publicPath] && a.altText !== src.alts[a.publicPath]).length
console.log(`written ${todo.length}; still different ${left}; backup ${BK}`)
process.exit(left ? 1 : 0)
