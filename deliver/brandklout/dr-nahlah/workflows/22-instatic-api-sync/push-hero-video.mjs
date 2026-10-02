#!/usr/bin/env node
/**
 * push-hero-video.mjs — the home hero film, re-encoded (QA 2026-09-28: "the home
 * hero video is 9 MB"; P01 mobile performance 77).
 *
 *   node push-hero-video.mjs <hero-1600.mp4>            # plan
 *   node push-hero-video.mjs <hero-1600.mp4> --apply    # upload + point the node at it (draft)
 *   node push-hero-video.mjs --publish
 *
 * The film is decorative, muted, looping and sits under the cream gradient. The
 * original is 1920x1080 H.264 at 3 Mbit/s, 9.2 MB for 24 s. Re-encoded from it:
 *   ffmpeg -i hero.mp4 -an -c:v libx264 -preset slow -crf 28 -vf scale=1600:-2 \
 *          -profile:v high -pix_fmt yuv420p -movflags +faststart hero-1600.mp4
 * 2.8 MB; side-by-side at 1920 it is indistinguishable (the source is soft), SSIM
 * of the same-size CRF 28 encode 0.989. +faststart lets it begin before it has
 * fully downloaded. Uploaded under a NEW file name: the media library skips an
 * upload whose basename it already has.
 *
 * Also replaces the node's `title` prop, "YouTube video" (an importer default),
 * with what the film shows.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { basename } from 'node:path'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, toChangedPage, requestForm, BASE } from './sedation-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const SRC = process.argv.slice(2).find((a) => !a.startsWith('--'))
const HOST = BASE.replace(/^https?:\/\//, '')
mkdirSync('.tmp/qa-fixes', { recursive: true })
const STATE = `.tmp/qa-fixes/hero-video-state-${HOST}.json`
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const OLD = /\/uploads\/[\w-]+-hero\.mp4$/
const TITLE = 'Walking through the practice'

const status = await api('GET', '/admin/api/cms/publish/status')
console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)', JSON.stringify(status))
const list = (await getPages()).rows
if (PUBLISH) {
  const st = JSON.parse(readFileSync(STATE, 'utf8'))
  const now = Object.fromEntries(list.map((r) => [r.id, r.seq]))
  const { site } = await getSite()
  if (Object.keys(st.seqs).some((id) => now[id] !== st.seqs[id]) || sha(site.files) !== st.files) { console.error('REFUSING: the draft moved since --apply'); process.exit(1) }
  console.log('published', JSON.stringify(await api('POST', '/admin/api/cms/publish', {})))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  process.exit(0)
}
if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }
if (!SRC || !existsSync(SRC)) { console.error('usage: push-hero-video.mjs <mp4> [--apply]'); process.exit(2) }

const r0 = list.find((r) => (r.cells?.slug ?? r.slug) === 'index')
const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
const vids = Object.values(row.cells.body.nodes).filter((n) => n.moduleId === 'base.video' && OLD.test(n.props?.videoUrl ?? ''))
if (vids.length !== 1) { console.error(`home hero video nodes: ${vids.length}`); process.exit(1) }
const bytes = readFileSync(SRC)
console.log(`  node     ${vids[0].id} ${vids[0].props.videoUrl}\n  new file ${basename(SRC)} ${(bytes.length / 1e6).toFixed(2)} MB`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

const form = new FormData()
form.append('file', new File([bytes], basename(SRC), { type: 'video/mp4' }))
const asset = (await requestForm('/admin/api/cms/media', form))?.asset
if (!asset?.publicPath) { console.error('upload returned no publicPath'); process.exit(1) }
console.log(`  uploaded ${asset.publicPath}`)
const head = await fetch(BASE + asset.publicPath, { method: 'HEAD' })
if (!head.ok || Number(head.headers.get('content-length')) !== bytes.length) { console.error(`uploaded file does not serve whole: ${head.status} ${head.headers.get('content-length')}`); process.exit(1) }

const N = structuredClone(row.cells.body.nodes)
N[vids[0].id].props = { ...N[vids[0].id].props, videoUrl: asset.publicPath, title: TITLE }
const { site, seq } = await getSite()
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site, changedPages: [toChangedPage(row, { nodes: N })], deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
  changedLayouts: [], deletedLayoutIds: [], baseSeqs: { [row.id]: row.seq }, shellBaseSeq: seq,
})
let back = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => row.cells[k] !== undefined).map((k) => [k, row.cells[k]]))
if (Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
  await api('PATCH', `/admin/api/cms/data/rows/${row.id}`, { cells: { ...back.cells, ...keep } })
  back = (await api('GET', `/admin/api/cms/data/rows/${row.id}`)).row
}
if (!isDeepStrictEqual(back.cells.body.nodes, N)) { console.error('READ-BACK: home nodes differ from plan'); process.exit(1) }
const { site: s1 } = await getSite()
writeFileSync(STATE, JSON.stringify({ seqs: Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq])), files: sha(s1.files), src: asset.publicPath }))
console.log('  readback only the video node changed — re-run with --publish')
