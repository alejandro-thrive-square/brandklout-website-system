#!/usr/bin/env node
/**
 * backup-video-pages.mjs — snapshot every page that carries a film, plus
 * site.js and the Embed Origins settings, before the YouTube -> Vimeo swap.
 *
 *   node backup-video-pages.mjs .tmp/vimeo-swap-backup/prod
 *
 * Whole rows, so a restore can go straight back through toChangedPage.
 */
import { api, getSite, getPages, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
import { mkdirSync, writeFileSync } from 'node:fs'

const OUT = process.argv[2]
if (!OUT) { console.error('usage: backup-video-pages.mjs <dir>'); process.exit(2) }
mkdirSync(OUT, { recursive: true })

const SLUGS = new Set(['index', 'patient-stories', 'video-library'])
const rows = (await getPages()).rows
const picked = rows.filter(r => {
  const s = r.cells?.slug ?? r.slug ?? ''
  return SLUGS.has(s) || s.startsWith('ads-landing-pages/')
})

writeFileSync(`${OUT}/pages.json`, JSON.stringify({ base: BASE, captured: new Date().toISOString(), rows: picked }, null, 2), 'utf8')

const site = await getSite()
writeFileSync(`${OUT}/shell.json`, JSON.stringify({ seq: site.seq, site: site.site }, null, 2), 'utf8')

const origins = await api('GET', '/admin/api/cms/plugins/brandklout.embed-origins/settings')
writeFileSync(`${OUT}/embed-origins.json`, JSON.stringify(origins, null, 2), 'utf8')

console.log('BASE', BASE)
console.log('pages backed up:', picked.length)
for (const r of picked) console.log('  /' + (r.cells?.slug ?? r.slug), 'seq', r.seq, Object.keys(r.cells?.body?.nodes || {}).length, 'nodes')
console.log('shell seq', site.seq, '| files', site.site.files.length)
console.log('wrote', OUT)
