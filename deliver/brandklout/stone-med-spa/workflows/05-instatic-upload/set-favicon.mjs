#!/usr/bin/env node
/**
 * The site favicon, home-screen icon and the Open Graph basics, through brandklout.open-graph.
 *
 * Instatic writes no <link rel="icon"> and serves nothing at /favicon.ico (404 on this site until
 * 2026-10-01), so the tab icon was blank. The plugin's `publish.html` filter writes it from a
 * media-library path. Install the plugin first with the shared rollout:
 *   cd deliver/process/tools/instatic-plugins
 *   node plugins.mjs rollout --plugin open-graph --sites stone-med-spa --env staging --apply
 *
 * This script, per instance:
 *   - uploads the three PNGs cut by site-src/make-logo.py (assets/_favicon/) unless the media
 *     library already has them by name (re-cut icons need a new filename — Instatic skips by
 *     basename);
 *   - sets favicon, appleTouchIcon, siteUrl (= the instance's own host, so staging's og:url and
 *     canonical point at staging, which is noindex) and siteName, read-merge-write: every other
 *     setting goes back exactly as read, and the read-back must agree;
 *   - with --publish, publishes and checks the live <head>.
 *
 *   node set-favicon.mjs                                                     dry run (production)
 *   INSTATIC_BASE_URL=https://staging.westlaketxmedspa.com node set-favicon.mjs --apply --publish
 *   node set-favicon.mjs --apply --publish
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, requestForm, publish, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const DIR = path.resolve(HERE, '../04-design/.tmp/med-spa/site-src/assets/_favicon')
const FILES = { favicon: 'wma-favicon-48.png', appleTouchIcon: 'wma-favicon-180.png', large: 'wma-favicon-192.png' }
const SITE_NAME = 'Westlake Medical Aesthetics'
const SETTINGS = '/admin/api/cms/plugins/brandklout.open-graph/settings'

const { plugins } = await api('GET', '/admin/api/cms/plugins')
const og = plugins.find((p) => p.id === 'brandklout.open-graph')
if (!og || !og.enabled) throw new Error(`${BASE}: brandklout.open-graph is not installed/enabled — run the rollout first`)
if (!(og.manifest?.settings ?? []).some((s) => s.id === 'favicon')) throw new Error(`${BASE}: open-graph ${og.version} has no favicon setting (needs 1.2.0+)`)

const read = async () => { const r = await api('GET', SETTINGS); return r.settings ?? r.values ?? r }
const before = await read()
console.log(`${BASE}\nopen-graph ${og.version}; now ${JSON.stringify({ favicon: before.favicon, appleTouchIcon: before.appleTouchIcon, siteUrl: before.siteUrl, siteName: before.siteName })}`)

const listed = await api('GET', '/admin/api/cms/media?limit=200')
const byName = new Map((listed.assets ?? listed.rows ?? listed.items ?? []).map((a) => [a.filename, a]))
const urlFor = async (name) => {
  const hit = byName.get(name)
  if (hit) { console.log(`media    ${name} reuse ${hit.publicPath}`); return hit.publicPath }
  if (!APPLY) { console.log(`media    ${name} would upload`); return `/uploads/<new>-${name}` }
  const form = new FormData()
  form.append('file', new Blob([fs.readFileSync(path.join(DIR, name))], { type: 'image/png' }), name)
  const res = await requestForm('/admin/api/cms/media', form)
  const asset = res.asset ?? res
  if (!/^\/uploads\//.test(asset.publicPath ?? '') || !/^image\//.test(asset.mimeType ?? '')) throw new Error(`${name}: upload returned ${JSON.stringify(asset).slice(0, 200)}`)
  console.log(`media    ${name} uploaded ${asset.publicPath} (${asset.width}x${asset.height})`)
  return asset.publicPath
}
const want = {
  favicon: await urlFor(FILES.favicon),
  appleTouchIcon: await urlFor(FILES.appleTouchIcon),
  siteUrl: BASE,
  siteName: SITE_NAME,
}
await urlFor(FILES.large) // in the library for anything that wants a larger mark; not referenced by the plugin

const diff = Object.entries(want).filter(([k, v]) => before[k] !== v)
for (const [k, v] of diff) console.log(`setting  ${k}: ${JSON.stringify(before[k] ?? null)} -> ${JSON.stringify(v)}`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }

if (diff.length) {
  await api('PUT', SETTINGS, { settings: { ...before, ...want } })
  const after = await read()
  for (const k of new Set([...Object.keys(before), ...Object.keys(want)])) {
    const expect = k in want ? want[k] : before[k]
    if (JSON.stringify(after[k]) !== JSON.stringify(expect)) throw new Error(`${k} is ${JSON.stringify(after[k])} after the write, expected ${JSON.stringify(expect)}`)
  }
  console.log('settings written, read-back agrees')
} else console.log('settings already as wanted')

if (PUBLISH) {
  console.log(`publish  ${JSON.stringify(await publish()).slice(0, 120)}`)
  const html = await (await fetch(BASE + '/', { headers: { 'cache-control': 'no-cache' } })).text()
  const icon = html.match(/<link[^>]*rel="icon"[^>]*>/)?.[0]
  const apple = html.match(/<link[^>]*rel="apple-touch-icon"[^>]*>/)?.[0]
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*>/)?.[0]
  console.log(`live     ${icon ?? 'NO <link rel="icon">'}\n         ${apple ?? 'NO apple-touch-icon'}\n         ${ogTitle ?? 'NO og:title'}`)
  if (!icon || !apple || !ogTitle) process.exitCode = 1
  const iconUrl = icon?.match(/href="([^"]+)"/)?.[1]
  if (iconUrl) {
    const r = await fetch(new URL(iconUrl.replace(/&amp;/g, '&'), BASE))
    console.log(`icon     ${r.status} ${r.headers.get('content-type')} ${(await r.arrayBuffer()).byteLength} bytes`)
    if (!r.ok) process.exitCode = 1
  }
}
