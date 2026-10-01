#!/usr/bin/env node
/**
 * Replace ONLY the site bundle inside the shell's `src/scripts/site.js` asset, and publish.
 *
 * `push-site.mjs` is a replace-mode import of the whole site: right for the first write, too much
 * for a JS fix on a live site whose pages, media ids and SEO cells have since been edited in
 * place. The published asset is `BOOTSTRAP + vendor.js + "/* ---- site.js ---- *\/" + site.js`
 * (push-site.mjs builds it); this keeps everything up to and including that marker exactly as the
 * instance has it and swaps what follows for the local `final-site/assets/site.js`.
 *
 * One incremental save with `shellBaseSeq`, no pages, so an edit made in the editor meanwhile is a
 * 409 rather than lost. Backs up `site.json` first (one folder per seq, never overwritten).
 *
 *   node swap-site-js.mjs                              dry run against INSTATIC_BASE_URL (diff summary)
 *   node swap-site-js.mjs --apply --publish            write, read back, publish
 *   INSTATIC_BASE_URL=https://staging.westlaketxmedspa.com node swap-site-js.mjs --apply --publish
 *
 * Run `node ../04-design/.tmp/med-spa/site-src/build-site.mjs` first.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, publish, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const ASSET = 'src/scripts/site.js'
const MARKER = '\n/* ---- site.js ---- */\n'
const LOCAL = path.resolve(HERE, '../04-design/.tmp/med-spa/final-site/assets/site.js')

const local = fs.readFileSync(LOCAL, 'utf8')
const siteRes = await getSite()
const raw = JSON.stringify(siteRes)
const { site: shell, seq } = siteRes
const file = (shell.files ?? []).find((f) => f.path === ASSET)
if (!file) throw new Error(`${BASE}: the shell has no ${ASSET}`)
const at = file.content.indexOf(MARKER)
if (at === -1) throw new Error(`${BASE}: ${ASSET} has no "${MARKER.trim()}" marker — not a push-site.mjs asset, refusing`)
const head = file.content.slice(0, at + MARKER.length)
const live = file.content.slice(at + MARKER.length)

// What would change, by top-level block: the bundle is a run of `// file` IIFEs.
const blocks = (s) => new Set(s.split(/\n(?=\(function \(\) \{)/).map((b) => b.trim()))
const a = blocks(live), b = blocks(local)
const gone = [...a].filter((x) => !b.has(x)), added = [...b].filter((x) => !a.has(x))
const first = (x) => x.split('\n').find((l) => l.trim() && !/^\(function/.test(l))?.slice(0, 90) ?? ''
console.log(`${BASE}\nshell    seq ${seq}, ${ASSET} ${(file.content.length / 1024).toFixed(1)}KB (bundle ${(live.length / 1024).toFixed(1)}KB -> ${(local.length / 1024).toFixed(1)}KB)`)
for (const x of gone) console.log(`  - ${first(x)}`)
for (const x of added) console.log(`  + ${first(x)}`)
if (live === local) { console.log('identical — nothing to write'); process.exit(0) }
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }

const label = /staging/.test(BASE) ? 'staging' : 'prod'
const bak = path.join(HERE, '.tmp', `backup-${label}-${new Date().toISOString().slice(0, 10)}-seq${seq}-pre-site-js`)
if (fs.existsSync(bak)) throw new Error(`${path.relative(HERE, bak)} already exists — refusing to overwrite a snapshot`)
fs.mkdirSync(bak, { recursive: true })
fs.writeFileSync(path.join(bak, 'site.json'), raw)
console.log(`backup   ${path.relative(HERE, bak)}`)

file.content = head + local
file.updatedAt = new Date().toISOString()
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: [], deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: {},
  shellBaseSeq: seq,
})
console.log(`saved    ${JSON.stringify(res).slice(0, 160)}`)

const back = (await getSite()).site.files.find((f) => f.path === ASSET)?.content
const ok = back === head + local
console.log(`check    ${ASSET} ${ok ? 'exact' : 'MISMATCH'}`)
if (!ok) process.exit(1)
if (PUBLISH) console.log(`publish  ${JSON.stringify(await publish()).slice(0, 200)}`)
