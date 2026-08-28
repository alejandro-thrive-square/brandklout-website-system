#!/usr/bin/env node
/**
 * publish-post-rows.mjs — promote the 43 draft `posts` rows to new published
 * versions, so their cells reach the /posts loop and the article pages.
 *
 *   node publish-post-rows.mjs            # report what is stale, write nothing
 *   node publish-post-rows.mjs --apply    # publish them
 *
 * ## THIS IS A PUBLISH. Read this before running it.
 *
 * `POST /admin/api/cms/data/rows/:id/publish` does three things
 * (`server/publish/publishRow.ts` -> `persistDataRowPublish`):
 *
 *   1. copies the row's CURRENT DRAFT cells into a new `data_row_versions` row;
 *   2. moves `data_rows.active_version_id` onto it;
 *   3. bakes the row's public artefact (`/posts/<slug>`) and bumps the render
 *      cache, so that article page goes LIVE from the current draft.
 *
 * Step 3 is the one to think about. It ships whatever is in the draft for that
 * row and for the `post` template it renders through — which, as of
 * 2026-08-27, includes at least the seq-98 article-layout rework. Running this
 * is therefore a decision about somebody else's unpublished work, not a
 * data-migration chore.
 *
 * ## Why it is needed at all — the trap this exists to document
 *
 * `PATCH /data/rows/:id` writes DRAFT cells only. And a SITE publish does NOT
 * promote post rows: `persistSitePublish` (`server/repositories/publish.ts`)
 * iterates `input.pages`, and its status query reads
 * `where data_rows.table_id = 'pages'`. Post-type rows are invisible to it.
 *
 * That is the opposite of the rule everyone has internalised for this platform
 * ("publishing ships the whole draft, including other people's work"). It is
 * true of PAGES and false of POST ROWS, and the two are indistinguishable from
 * the outside — a cell you wrote is right there in `GET /data/rows/:id`, the
 * site publishes cleanly, and the loop keeps rendering the old value with no
 * error anywhere.
 *
 * Anything written to a post row's cells is affected, not just pin #10's
 * `topic`: pin #11's `featuredMedia` re-pointing has exactly the same problem.
 *
 * ## What it does NOT do
 *
 * It does not publish the SITE. `/posts` itself is an ordinary page and its new
 * filter markup still ships only with `node insta-api.mjs publish`.
 */
import { api } from './insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const { rows } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
const preview = await api('GET', '/admin/api/cms/data/tables/posts/loop-preview?limit=60')
const live = new Map((preview.items ?? []).map((it) => [it.fields.rowId, it.fields]))

/* Compare the DRAFT cells against what the publisher's own projection returns.
   `loop-preview` runs `fetchPublishedDataRowItems`, the same function the
   publisher calls, so this is the published state and not a guess at it.
   Media cells are excluded from the comparison: the projection resolves an
   asset id to its public path, so the two are never string-equal even when the
   row is perfectly in sync. */
const MEDIA = new Set(['featuredMedia'])
const stale = []
for (const r of rows) {
  const l = live.get(r.id)
  if (!l) { stale.push({ r, why: 'not in the published projection at all' }); continue }
  const diff = Object.keys(r.cells)
    .filter((k) => !MEDIA.has(k))
    .filter((k) => JSON.stringify(r.cells[k]) !== JSON.stringify(l[k]))
  const mediaDiff = (r.cells.featuredMedia ?? null) !== (l.featuredMediaId ?? null)
  if (diff.length || mediaDiff) {
    stale.push({ r, why: [...diff, ...(mediaDiff ? ['featuredMedia'] : [])].join(', ') })
  }
}

console.log(`${rows.length} post rows, ${stale.length} whose draft differs from the published version\n`)
for (const s of stale.slice(0, 50)) {
  console.log(`  ${s.r.slug.slice(0, 62).padEnd(64)} ${s.why}`)
}
if (stale.length > 50) console.log(`  … and ${stale.length - 50} more`)

if (!stale.length) { console.log('\nnothing to do — every row is published as drafted'); process.exit(0) }

if (!APPLY) {
  console.log(`
DRY RUN — nothing published.

Publishing these re-bakes ${stale.length} article pages from the CURRENT draft,
including any unpublished work on the \`post\` template. Confirm that is
intended, then re-run with --apply.`)
  process.exit(0)
}

let done = 0
const failed = []
for (const { r } of stale) {
  try {
    await api('POST', `/admin/api/cms/data/rows/${r.id}/publish`, {})
    done++
  } catch (e) { failed.push(`${r.slug}: ${e.message.slice(0, 140)}`) }
}
console.log(`\npublished  ${done}/${stale.length} rows`)

// Verify against a fresh projection, never against the requests we sent.
const after = await api('GET', '/admin/api/cms/data/tables/posts/loop-preview?limit=60')
const now = new Map((after.items ?? []).map((it) => [it.fields.rowId, it.fields]))
const bad = rows.filter((r) => (r.cells.topic ?? '') !== (now.get(r.id)?.topic ?? ''))
console.log(`verified   ${rows.length - bad.length}/${rows.length} rows carry their topic in the published projection`)
for (const f of failed) console.error(`  ! ${f}`)
if (failed.length || bad.length) process.exit(1)
