#!/usr/bin/env node
/**
 * swap-sedation-card-photo.mjs — the third option card on /sedation-dentistry
 * stopped being "IV sedation" and became "Local anaesthetic" on 2026-09-28
 * (push-sedation-copy.mjs). Its photo, a man under a full face mask, reads as
 * gas sedation beside that heading. This puts a licensed Freepik photo of a
 * calm patient in the chair while the clinician readies the anaesthetic
 * (Freepik 28265937) in its place: relevant, and gentler than a needle close-up
 * on a page written for anxious patients.
 *
 *   node swap-sedation-card-photo.mjs            # plan
 *   node swap-sedation-card-photo.mjs --apply    # licence, upload, swap (draft)
 *
 * The upload uses a NEW filename: Instatic's media upload skips by basename.
 * Nothing here publishes.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, toChangedPage, requestForm, BASE } from './sedation-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const FREEPIK_ID = 28265937
const NAME = 'sedation-local-anaesthetic.jpg'
const ALT = 'A patient resting in the dental chair while the clinician prepares a local anaesthetic'
const SLUG = 'sedation-dentistry'
const NODE = 'm73-r6VxldENiDfFI1qzE'
const OLD_SRC = '/uploads/_qM4gjCQWf4N75HrvCSWD-38930.jpg'

const { rows } = await getPages()
const row = rows.find((r) => (r.cells?.slug ?? r.slug) === SLUG)
const n = row?.cells?.body?.nodes?.[NODE]
const card = n && row.cells.body.nodes[row.cells.body.nodes[n.parentId]?.parentId]
const h3 = card?.children?.map((c) => row.cells.body.nodes[c]).find((k) => k?.props?.tag === 'h3')
console.log(`host ${BASE}\n${SLUG} ${NODE}: ${n?.props?.src}  (card: ${h3?.props?.text})`)
if (h3?.props?.text !== 'Local anaesthetic') throw new Error('the card is not the Local anaesthetic card — run push-sedation-copy.mjs first')
if (n.props.src !== OLD_SRC) { console.log(n.props.src.includes('sedation-local-anaesthetic') ? 'already swapped' : 'unexpected src — refusing'); process.exit(0) }
if (!APPLY) { console.log(`would licence Freepik ${FREEPIK_ID}, upload as ${NAME}, point the card at it.\nDRY RUN.`); process.exit(0) }

// 1. licence + download (kept locally; binaries are not committed, see assets.mjs for R2)
const dir = join(HERE, '..', '03-graphic-resources', '.tmp', 'stock')
mkdirSync(dir, { recursive: true })
const file = join(dir, NAME)
if (!existsSync(file)) {
  const env = readFileSync(join(HERE, '..', '..', '..', '..', '..', '.env'), 'utf8')
  const KEY = env.match(/^MAGNIFIC=(.*)$/m)[1].trim()
  const dl = await (await fetch(`https://api.freepik.com/v1/resources/${FREEPIK_ID}/download`, { headers: { 'x-freepik-api-key': KEY } })).json()
  const url = dl.data?.url
  if (!url) throw new Error('freepik download: ' + JSON.stringify(dl).slice(0, 300))
  writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()))
  /* the licence ledger other steps read */
  const ledger = join(dir, 'ledger.tsv')
  writeFileSync(ledger, `${existsSync(ledger) ? readFileSync(ledger, 'utf8') : 'freepik_id\tfile\tused_on\tdate\n'}${FREEPIK_ID}\t${NAME}\t/${SLUG} (Local anaesthetic card)\t2026-09-28\n`)
}

// 2. upload
const form = new FormData()
form.append('file', new File([readFileSync(file)], NAME, { type: 'image/jpeg' }))
form.append('altText', ALT)
const up = await requestForm('/admin/api/cms/media', form)
const asset = up.asset ?? up
const src = asset.publicPath ?? asset.url
if (!src) throw new Error('upload returned no path: ' + JSON.stringify(up).slice(0, 300))
console.log(`uploaded ${asset.id} ${src}`)

// 3. swap (site-document write keeps nothing else changed)
const N = structuredClone(row.cells.body.nodes)
N[NODE] = { ...N[NODE], props: { ...N[NODE].props, src } }
const { site, seq } = await getSite()
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site, changedPages: [toChangedPage(row, { nodes: N })], deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [row.id]: row.seq }, shellBaseSeq: seq,
})
const back = (await getPages()).rows.find((r) => r.id === row.id).cells.body.nodes[NODE].props.src
if (back !== src) throw new Error(`read-back ${back}`)
console.log(`saved — seq ${res.seq}; card now ${back}. Draft only: publish next.`)
