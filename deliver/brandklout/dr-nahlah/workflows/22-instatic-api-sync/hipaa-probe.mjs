/**
 * hipaa-probe.mjs — read-only: publish status + the page rows the HIPAA
 * injection needs (privacy-policy, terms, any existing hipaa page).
 *
 *   node hipaa-probe.mjs                                   # production
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node hipaa-probe.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { api, getPages, BASE } from './sedation-api.mjs'

const host = BASE.replace(/^https?:\/\//, '')
const status = await api('GET', '/admin/api/cms/publish/status')
console.log(host, 'publish/status', JSON.stringify(status))
const rows = (await getPages()).rows
console.log('pages', rows.length)
for (const r of rows) {
  const slug = r.cells?.slug ?? r.slug
  if (/privacy|terms|hipaa|legal|accessib/i.test(slug)) console.log(' ', r.id, slug, r.status, JSON.stringify(r.cells?.title))
}
mkdirSync('.tmp/hipaa', { recursive: true })
const pp = rows.find((r) => (r.cells?.slug ?? r.slug) === 'privacy-policy')
if (pp) {
  const full = await api('GET', `/admin/api/cms/data/rows/${pp.id}`)
  writeFileSync(`.tmp/hipaa/privacy-row-${host}.json`, JSON.stringify(full, null, 1))
  console.log('privacy row saved', Object.keys(full.row.cells))
}
writeFileSync(`.tmp/hipaa/pages-${host}.json`, JSON.stringify(rows.map((r) => ({ id: r.id, slug: r.cells?.slug ?? r.slug, status: r.status, updatedAt: r.updatedAt, publishedAt: r.publishedAt })), null, 1))
