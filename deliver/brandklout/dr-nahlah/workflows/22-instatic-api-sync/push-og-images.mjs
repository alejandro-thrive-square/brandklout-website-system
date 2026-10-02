#!/usr/bin/env node
/**
 * push-og-images.mjs — upload the 1200x630 share images from make-og-images.py
 * and point each page's brandklout.open-graph override at its own (QA C06).
 *
 *   node push-og-images.mjs .tmp/og              # plan
 *   node push-og-images.mjs .tmp/og --apply      # upload + set overrides
 *   node push-og-images.mjs .tmp/og --publish    # publish (overrides go live with a site publish)
 *
 * <slug>.jpg -> the page whose slug it is ("home" = index, "posts--x" = post x).
 * Uploaded as og-<slug>.jpg (a new basename: the library skips names it has).
 * The override keeps every other field; a page with no override gets one with
 * the plugin's default type and, for alt text, the page's own OG title.
 * Image URLs are stored absolute, as every existing override is.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { api, requestForm, BASE } from './sedation-api.mjs'

const DIR = process.argv.slice(2).find((a) => !a.startsWith('--'))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const OG = '/admin/api/cms/plugins/brandklout.open-graph/runtime'
const SITE = 'https://www.drnahlah.com'
if (!BASE.includes('www.drnahlah.com')) { console.error('production only: staging carries no OG overrides'); process.exit(1) }
if (PUBLISH) { console.log(JSON.stringify(await api('POST', '/admin/api/cms/publish', {}))); process.exit(0) }

const { pages } = await api('GET', `${OG}/pages`)
const files = readdirSync(DIR).filter((f) => f.endsWith('.jpg') && f !== 'contact-sheet.jpg')
const plan = []
for (const f of files) {
  const s = f.replace(/\.jpg$/, '')
  const slug = s === 'home' ? 'index' : s.replace(/^posts--/, '')
  const kind = s.startsWith('posts--') ? 'post' : 'page'
  const p = pages.find((x) => x.slug === slug && (kind === 'post' ? x.kind !== 'page' : x.kind === 'page'))
  if (!p) { console.error(`no OG page for ${f}`); process.exit(1) }
  plan.push({ f, p })
}
console.log(`${plan.length} images -> ${plan.filter((x) => x.p.override).length} existing overrides, ${plan.filter((x) => !x.p.override).length} new`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

let n = 0
for (const { f, p } of plan) {
  const form = new FormData()
  form.append('file', new File([readFileSync(join(DIR, f))], `og-${f}`, { type: 'image/jpeg' }))
  const asset = (await requestForm('/admin/api/cms/media', form))?.asset
  if (!asset?.publicPath || asset.width !== 1200 || asset.height !== 630) { console.error(`${f}: upload gave ${JSON.stringify(asset).slice(0, 160)}`); process.exit(1) }
  const cur = p.override ?? { key: p.key, type: p.kind === 'page' ? 'website' : 'article', enabled: true, title: p.title }
  const next = { ...cur, image: SITE + asset.publicPath, imageAlt: cur.imageAlt || cur.title || p.title }
  await api('POST', `${OG}/override`, next)
  n++
}
const after = (await api('GET', `${OG}/pages`)).pages
const bad = plan.filter(({ p }) => !/\/uploads\/[\w-]+-og-/.test(after.find((x) => x.key === p.key)?.override?.image ?? ''))
console.log(`${n} uploaded and set; ${bad.length} not attached${bad.length ? ': ' + bad.map((b) => b.p.slug).join(', ') : ''}`)
console.log('now --publish')
