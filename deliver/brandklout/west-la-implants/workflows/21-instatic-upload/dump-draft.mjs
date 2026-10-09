#!/usr/bin/env node
/**
 * dump-draft.mjs: read-only snapshot of the live draft (shell + every row) into <out>/,
 * for reading node trees, style rules and code assets before writing a patch.
 *
 *   node dump-draft.mjs <out-dir>
 *   INSTATIC_BASE_URL=https://west-la-implants-staging.up.railway.app node dump-draft.mjs <out-dir>
 */
import fs from 'node:fs'
import path from 'node:path'
import { getPages, getSite, publishStatus, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const OUT = process.argv[2]
if (!OUT) { console.error('usage: node dump-draft.mjs <out-dir>'); process.exit(1) }
fs.mkdirSync(path.join(OUT, 'rows'), { recursive: true })
fs.mkdirSync(path.join(OUT, 'files'), { recursive: true })
const status = await publishStatus()
const site = await getSite()
fs.writeFileSync(path.join(OUT, 'shell.json'), JSON.stringify(site, null, 1))
for (const f of site.site.files ?? []) {
  const p = path.join(OUT, 'files', f.path.replace(/[\\/]/g, '__'))
  fs.writeFileSync(p, f.content ?? '')
}
const rules = site.site.styleRules
fs.writeFileSync(path.join(OUT, 'rules.txt'), Object.values(rules).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((r) => `${r.order}\t${r.kind}\t${r.name ?? ''}\t${r.selector ?? ''}\t${r.id}`).join('\n') + '\n')
const { rows } = await getPages()
for (const r of rows) fs.writeFileSync(path.join(OUT, 'rows', `${(r.slug || 'index').replace(/\//g, '__')}.json`), JSON.stringify(r, null, 1))
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ base: BASE, at: new Date().toISOString(), shellSeq: site.seq, status, rows: rows.map((r) => ({ slug: r.slug, id: r.id, seq: r.seq, updatedAt: r.updatedAt })) }, null, 1))
console.log(`${BASE}: shell seq ${site.seq}, ${rows.length} rows, ${site.site.files?.length ?? 0} files, ${Object.keys(rules).length} rules; draftMatchesPublished=${status.draftMatchesPublished}`)
