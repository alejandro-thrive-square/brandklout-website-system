// one host's SEO stores as JSON on stdout (used by parity-check.mjs; host = INSTATIC_BASE_URL)
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { api, getSite, getPages } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const HERE = dirname(fileURLToPath(import.meta.url))
const meta = JSON.parse(readFileSync(join(HERE, 'meta.json'), 'utf8'))
const rows = {}
for (const r of (await getPages()).rows) if (meta[r.slug]) { const c = r.cells; rows[r.slug] = [c.title, c.seoTitle, c.seoDescription] }
const og = Object.fromEntries((await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages')).pages.filter((p) => p.override).map((p) => [p.key, p.override]))
const aeo = Object.fromEntries((await api('GET', '/admin/api/cms/plugins/brandklout.aeo-schema/runtime/entries')).entries.filter((e) => e.block).map((e) => [e.key, e.block.json]))
// the organisation JSON and the emit* switches (SEO v3 turned emitBreadcrumbs off: pages carry their own)
const aeoSet = (await api('GET', '/admin/api/cms/plugins/brandklout.aeo-schema/settings')).settings
const org = JSON.stringify([aeoSet.organizationJson, Object.fromEntries(Object.entries(aeoSet).filter(([k]) => k.startsWith('emit')))])
const files = (await getSite()).site.files
const scripts = Object.fromEntries(files.filter((f) => f.path === 'src/scripts/seo-head.js' || f.path === 'src/scripts/site.js' || f.path.startsWith('src/scripts/jsonld/'))
  .map((f) => [f.path, f.path === 'src/scripts/site.js' ? /document\.head\.appendChild\(ld\)/.test(f.content) : f.content.replace(/\/uploads\/[A-Za-z0-9_-]{21}-/g, '/uploads/<id>-')]))   // upload ids are per host
const media = (await api('GET', '/admin/api/cms/media')).assets
const alts = Object.fromEntries(media.map((a) => [a.publicPath, (a.altText || '').trim()]))
process.stdout.write(JSON.stringify({ rows, og, aeo, org, scripts, alts }))
