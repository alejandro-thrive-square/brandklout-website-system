/**
 * wipe-instance.mjs — empty the Instatic instance's CONTENT so the site can be rebuilt from the
 * package on a blank base: every page, the style registry, the code assets, the site conditions,
 * every media asset (trashed, then purged), every custom data table and its rows, the installed
 * fonts, and every plugin. Users, roles, the site name and the other settings stay.
 *
 *   node wipe-instance.mjs            # dry run: what would go
 *   node wipe-instance.mjs --apply    # do it (step-up auth on the way)
 *
 * It does NOT publish the blank state: the live site keeps serving the last publish until the
 * rebuild publishes over it (a full publish swaps the whole slot, so nothing stale survives).
 *
 * First use 2026-09-15 (Alejandro, after a call with Sang): "wipe out everything on Instatic, leave
 * it blank, and re-upload everything based on the v18 version". Take the backups first, every time:
 * git tag, .tmp/backup-live.mjs, .tmp/plugin-settings-dump.mjs, .tmp/media-backup.mjs, and on the
 * container `VACUUM INTO` + a tar of /app/storage/uploads. This script refuses without a snapshot
 * folder for today.
 *
 * Endpoints (container source, 2026-09-15): PUT /site-document mode replace with changedPages []
 * deletes every page (replace derives deletions; zero pages validates); DELETE /media/:id then
 * DELETE /media/:id?purge=1 removes the file; DELETE /data/rows/:id then DELETE /data/tables/:id
 * (refuses while rows exist; system tables cannot be deleted); DELETE /fonts/family/:family
 * removes the files and `settings.fonts.items` is cleared on the shell; DELETE /plugins/:id?force=true.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const { api, getSite, getPages, BASE } = await import('../../../../process/22-instatic-api-sync/insta-api.mjs')
const apply = process.argv.includes('--apply')
const today = new Date().toISOString().slice(0, 10)
const snapshots = fs.readdirSync(path.join(HERE, '.tmp')).filter((n) => n.startsWith(`backup-${today}-`))
if (!snapshots.length) {
  console.error(`REFUSING: no .tmp/backup-${today}-* snapshot; run .tmp/backup-live.mjs first`)
  process.exit(1)
}
console.log(`instance   ${BASE}${apply ? '' : '   (dry run)'}   snapshots today: ${snapshots.join(', ')}`)

const site = await getSite()
const shell = site.site
const seq = site.seq
const pages = (await getPages()).rows ?? []
console.log(`seq        ${seq}`)
console.log(`pages      ${pages.length} -> 0   (${pages.map((p) => p.slug).join(', ')})`)
console.log(`shell      styleRules ${Object.keys(shell.styleRules ?? {}).length} -> 0, files ${(shell.files ?? []).length} -> 0, conditions ${(shell.conditions ?? []).length} -> 0, fonts ${(shell.settings?.fonts?.items ?? []).length} -> 0`)

const media = await api('GET', '/admin/api/cms/media?limit=500')
const assets = media.items ?? media.assets ?? media.media ?? (Array.isArray(media) ? media : [])
const trashedRes = await api('GET', '/admin/api/cms/media?limit=500&trash=1')
const trashed = trashedRes.items ?? trashedRes.assets ?? trashedRes.media ?? (Array.isArray(trashedRes) ? trashedRes : [])
console.log(`media      ${assets.length} live + ${trashed.length} trashed -> 0`)
const folders = (await api('GET', '/admin/api/cms/media/folders')).folders ?? (await api('GET', '/admin/api/cms/media/folders')).items ?? []
console.log(`folders    ${folders.length} -> 0`)

const { tables } = await api('GET', '/admin/api/cms/data/tables')
const custom = tables.filter((t) => !t.system && !['pages', 'posts', 'components', 'layouts'].includes(t.id))
const rowsByTable = {}
for (const t of tables.filter((t) => !['pages', 'components', 'layouts'].includes(t.id))) rowsByTable[t.id] = (await api('GET', `/admin/api/cms/data/tables/${t.id}/rows`)).rows ?? []
console.log(`tables     custom: ${custom.map((t) => `${t.slug} (${rowsByTable[t.id].length} rows)`).join(', ') || 'none'} -> 0; system posts rows: ${(rowsByTable.posts ?? []).length} -> 0`)

const plugins = (await api('GET', '/admin/api/cms/plugins')).plugins ?? []
console.log(`plugins    ${plugins.map((p) => `${p.id}@${p.version}`).join(', ') || 'none'} -> 0`)

if (!apply) {
  console.log('\ndry run — re-run with --apply to wipe')
  process.exit(0)
}

/* --- 1. plugins ------------------------------------------------------------------------------- */
for (const p of plugins) {
  await api('DELETE', `/admin/api/cms/plugins/${p.id}?force=true`)
  console.log(`deleted    plugin ${p.id}`)
}

/* --- 2. rows, then custom tables ------------------------------------------------------------- */
for (const t of tables.filter((t) => !['pages', 'components', 'layouts'].includes(t.id))) {
  for (const r of rowsByTable[t.id]) {
    await api('DELETE', `/admin/api/cms/data/rows/${r.id}`)
    console.log(`deleted    row ${t.slug}/${r.slug ?? r.id}`)
  }
}
for (const t of custom) {
  await api('DELETE', `/admin/api/cms/data/tables/${t.id}`)
  console.log(`deleted    table ${t.slug}`)
}

/* --- 3. pages + shell: replace mode with nothing in it ------------------------------------- */
const fresh = await getSite() // seq may have moved
const blankShell = {
  ...fresh.site,
  styleRules: {},
  files: [],
  conditions: [],
  settings: { ...(fresh.site.settings ?? {}), fonts: { ...(fresh.site.settings?.fonts ?? {}), items: [] } },
  explorer: { pages: { expandedFolders: [], emptyFolders: [], rowOrder: [] }, styles: { expandedFolders: [], emptyFolders: [], rowOrder: [] }, scripts: { expandedFolders: [], emptyFolders: [], rowOrder: [] }, templates: { folders: [], items: [] }, components: { folders: [], items: [] } },
}
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'replace',
  site: blankShell,
  changedPages: [],
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs: {},
  shellBaseSeq: fresh.seq,
})
console.log(`saved      blank site document: ${JSON.stringify(res).slice(0, 120)}`)

/* --- 4. fonts (files on disk; the shell entries went with the save above) ------------------ */
for (const f of shell.settings?.fonts?.items ?? []) {
  try {
    await api('DELETE', `/admin/api/cms/fonts/family/${encodeURIComponent(f.family)}`)
    console.log(`deleted    font files ${f.family}`)
  } catch (e) {
    console.log(`WARN       font files ${f.family}: ${String(e.message).slice(0, 120)}`)
  }
}

/* --- 5. media: trash, then purge; folders ---------------------------------------------------- */
for (const a of assets) await api('DELETE', `/admin/api/cms/media/${a.id}`)
for (const a of [...assets, ...trashed]) {
  await api('DELETE', `/admin/api/cms/media/${a.id}?purge=1`)
  console.log(`purged     ${a.filename}`)
}
for (const f of folders) {
  try {
    await api('DELETE', `/admin/api/cms/media/folders/${f.id}`)
  } catch (e) {
    /* cascade may have taken it */
  }
}

/* --- 6. what is left ------------------------------------------------------------------------- */
const after = await getSite()
const left = {
  seq: after.seq,
  pages: ((await getPages()).rows ?? []).length,
  styleRules: Object.keys(after.site.styleRules ?? {}).length,
  files: (after.site.files ?? []).length,
  conditions: (after.site.conditions ?? []).length,
  fonts: (after.site.settings?.fonts?.items ?? []).length,
  media: ((await api('GET', '/admin/api/cms/media?limit=500')).assets ?? []).length,
  mediaTrash: ((await api('GET', '/admin/api/cms/media?limit=500&trash=1')).assets ?? []).length,
  tables: (await api('GET', '/admin/api/cms/data/tables')).tables.map((t) => t.slug),
  plugins: ((await api('GET', '/admin/api/cms/plugins')).plugins ?? []).length,
}
console.log('\nleft       ' + JSON.stringify(left))
