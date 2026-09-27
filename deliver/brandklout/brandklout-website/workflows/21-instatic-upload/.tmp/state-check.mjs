import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '') }
const { api, getSite, getPages } = await import('../../../../../process/22-instatic-api-sync/insta-api.mjs')
const s = await getSite()
const out = { seq: s.seq, pages: (await getPages()).rows.length, styleRules: Object.keys(s.site.styleRules).length, files: s.site.files.map((f) => f.path), conditions: s.site.conditions.length, breakpoints: s.site.breakpoints.map((b) => b.width), fonts: (s.site.settings.fonts?.items ?? []).map((f) => `${f.family} x${f.files.length}`), metaDescription: s.site.settings.metaDescription?.slice(0, 40) }
out.media = ((await api('GET', '/admin/api/cms/media?limit=500')).assets ?? []).length
out.tables = (await api('GET', '/admin/api/cms/data/tables')).tables.map((t) => t.slug)
out.legalRows = (await api('GET', '/admin/api/cms/data/tables/legal/rows').catch(() => ({ rows: [] }))).rows?.map((r) => `${r.slug}:${r.status}`)
const legalId = (await api('GET', '/admin/api/cms/data/tables')).tables.find((t) => t.slug === 'legal')?.id
if (legalId) out.legalRows = (await api('GET', `/admin/api/cms/data/tables/${legalId}/rows`)).rows.map((r) => `${r.slug}:${r.status}`)
out.plugins = ((await api('GET', '/admin/api/cms/plugins')).plugins ?? []).map((p) => `${p.id}@${p.version} ${p.enabled ? 'enabled' : 'disabled'} ${p.lifecycleStatus}`)
for (const p of ['/admin/api/cms/users', '/admin/api/cms/users?limit=50']) { try { const u = await api('GET', p); out.users = (u.users ?? u.rows ?? u.items ?? u).map((x) => `${x.email} (${x.role ?? x.roleSlug ?? x.roleId ?? '?'})`); break } catch (e) { out.usersError = String(e.message).slice(0, 80) } }
out.templatePage = (await getPages()).rows.find((r) => r.slug === 'legal-template') ? 'present' : 'MISSING'
console.log(JSON.stringify(out, null, 1))
