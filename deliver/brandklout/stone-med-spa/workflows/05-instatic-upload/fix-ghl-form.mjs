#!/usr/bin/env node
/**
 * fix-ghl-form.mjs — two surgical edits for the GHL form on /book, nothing else (2026-10-06).
 *
 *   1. The /book Embed node: drop `loading="lazy"` from the iframe snippet. form_embed.js parks
 *      the frame at left:-9999px until the form reports its height; a lazy frame parked there
 *      never loads, so Firefox (390/768/1366 wide) showed a blank slot forever.
 *   2. `src/scripts/site.js`: replace the old 12s height check in the form fallback with the
 *      visibility check from `site-src/js/11-form.js` (a hidden frame still measures 565px, so
 *      the "please call" message never appeared).
 *
 * String-level edits on what the instance holds, NOT a push from local source: staging carries
 * the 2026-10-05 class renames and production does not, so a rebuild would break production.
 *
 *   node fix-ghl-form.mjs                       dry run against INSTATIC_BASE_URL
 *   node fix-ghl-form.mjs --apply               back up, write the drafts, re-apply SEO cells
 *   node fix-ghl-form.mjs --apply --publish     ... and publish, after the guard below
 *
 * PUBLISH GUARD: the draft must match live before the write, and before publishing the shell and
 * every row other than /book must be unchanged.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, publish, publishStatus, toChangedPage, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const ASSET = 'src/scripts/site.js'

const OLD_CHECK = `    // A frame that has not started loading after 12s is not going to.
    window.setTimeout(function () {
      if (!frame.isConnected || frame.clientHeight < 40) fallback();
    }, 12000);`
const localJs = fs.readFileSync(path.resolve(HERE, '../04-design/.tmp/med-spa/site-src/js/11-form.js'), 'utf8').replace(/\r\n/g, '\n')
const from = localJs.indexOf('    // Judge the frame by whether the visitor can SEE it.')
const to = localJs.indexOf('\n  }\n\n  if (document.readyState', from)
if (from === -1 || to === -1) throw new Error('site-src/js/11-form.js does not carry the new visibility check')
const NEW_CHECK = localJs.slice(from, to)
const LAZY = /\n[ \t]*loading="lazy"(?=\s*>\s*<\/iframe>)/

const status0 = await publishStatus()
const siteRes = await getSite()
const pagesRes = await getPages()
const { site: shell, seq } = siteRes
const rows = pagesRes.rows ?? []
console.log(`${BASE}\nstatus   draftMatchesPublished=${status0.draftMatchesPublished}; shell seq ${seq}; ${rows.length} pages`)

const book = rows.find((r) => r.slug === 'book')
if (!book) throw new Error('no /book page')
const row = (await api('GET', `/admin/api/cms/data/rows/${book.id}`)).row
const embeds = Object.values(row.cells.body.nodes).filter((n) => n.moduleId === 'brandklout.embed-origins.embed' && /widget\/form\//.test(n.props?.snippet ?? ''))
if (embeds.length !== 1) throw new Error(`/book: ${embeds.length} GHL embed nodes, expected 1`)
const embed = embeds[0]
const pageChange = LAZY.test(embed.props.snippet)
if (pageChange) embed.props.snippet = embed.props.snippet.replace(LAZY, '')
console.log(`/book    embed ${embed.id}: ${pageChange ? 'loading="lazy" removed' : 'already without lazy'}`)

const file = (shell.files ?? []).find((f) => f.path === ASSET)
if (!file) throw new Error(`no ${ASSET}`)
const hits = file.content.split(OLD_CHECK).length - 1
const jsChange = hits === 1
if (hits > 1) throw new Error(`${ASSET}: old check found ${hits} times`)
if (!jsChange && !file.content.includes(NEW_CHECK)) throw new Error(`${ASSET}: neither the old nor the new fallback check is there — refusing`)
if (jsChange) { file.content = file.content.replace(OLD_CHECK, NEW_CHECK); file.updatedAt = new Date().toISOString() }
console.log(`site.js  fallback: ${jsChange ? 'old height check -> visibility check' : 'already the visibility check'}`)

if (!pageChange && !jsChange) { console.log('nothing to write'); process.exit(0) }
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (PUBLISH && !status0.draftMatchesPublished) throw new Error('the draft already differs from live — publishing would carry someone else\'s edits. Stopped before writing.')

const label = /staging/.test(BASE) ? 'staging' : 'prod'
const bak = path.join(HERE, '.tmp', `backup-${label}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}-seq${seq}-pre-ghl-lazy`)
fs.mkdirSync(bak, { recursive: true })
fs.writeFileSync(path.join(bak, 'site.json'), JSON.stringify(siteRes))
fs.writeFileSync(path.join(bak, 'pages.json'), JSON.stringify(pagesRes))
fs.writeFileSync(path.join(bak, 'book-row.json'), JSON.stringify((await api('GET', `/admin/api/cms/data/rows/${book.id}`)).row))
fs.writeFileSync(path.join(bak, 'status.json'), JSON.stringify(status0))
console.log(`backup   ${path.relative(HERE, bak)}`)

const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: pageChange ? [toChangedPage(row)] : [],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: pageChange ? { [book.id]: book.seq ?? 0 } : {},
  shellBaseSeq: seq,
})
console.log(`saved    ${JSON.stringify(res).slice(0, 200)}`)

/* read back; SEO cells back on (PUT /site-document drops them) */
const cur = (await api('GET', `/admin/api/cms/data/rows/${book.id}`)).row.cells
const curEmbed = cur.body?.nodes?.[embed.id]
if (!curEmbed || LAZY.test(curEmbed.props.snippet) || Object.keys(cur.body.nodes).length !== Object.keys(row.cells.body.nodes).length) throw new Error('/book read-back failed')
if (pageChange && (cur.seoTitle !== row.cells.seoTitle || cur.seoDescription !== row.cells.seoDescription)) {
  await api('PATCH', `/admin/api/cms/data/rows/${book.id}`, { cells: { ...cur, seoTitle: row.cells.seoTitle, seoDescription: row.cells.seoDescription } })
  const back = (await api('GET', `/admin/api/cms/data/rows/${book.id}`)).row.cells
  if (back.seoTitle !== row.cells.seoTitle || back.seoDescription !== row.cells.seoDescription) throw new Error('/book SEO re-apply failed')
  console.log('seo      re-applied on /book')
}
const siteBack = await getSite()
const jsBack = siteBack.site.files.find((f) => f.path === ASSET).content
if (jsBack !== file.content) throw new Error(`${ASSET} read-back MISMATCH`)
console.log(`check    /book embed without lazy; ${ASSET} exact`)

/* guard: only our writes moved */
const after = (await getPages()).rows
const stray = after.filter((r) => r.id !== book.id && r.seq !== rows.find((x) => x.id === r.id)?.seq).map((r) => `/${r.slug}`)
console.log(`guard    pages ${after.length} (was ${rows.length}); other rows moved ${stray.join(' ') || 'none'}`)
if (!PUBLISH) { console.log('drafts written; not publishing (no --publish)'); process.exit(0) }
if (stray.length || after.length !== rows.length) { console.log('NOT PUBLISHING: something other than this change moved in the draft.'); process.exit(1) }
console.log(`publish  ${JSON.stringify(await publish()).slice(0, 200)}`)
console.log(`status   ${JSON.stringify(await publishStatus())}`)
