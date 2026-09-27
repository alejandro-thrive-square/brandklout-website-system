#!/usr/bin/env node
/**
 * push-milling-card.mjs — BugHerd #24. Uploads the chosen composite from
 * `gen-card-face-swap.mjs` and points `#technology` card 05 at it.
 * DRAFT ONLY, NEVER PUBLISHES.
 *
 *   node push-milling-card.mjs                       # dry run
 *   node push-milling-card.mjs --apply
 *   node push-milling-card.mjs --file .tmp/pin24/swap-2-0.png --apply
 *
 * > "We shouldn't add doctors who are not Dr. Nahlah. Let's try to edit this
 * > photo with the Magnific AI Generation API so we can swap the face for the
 * > Dr. Nahlah."
 *
 * The card showed a licensed stock model who read as a member of staff. It now
 * shows the same stock laboratory and the same stock body with **Dr. Nahlah's
 * face**, composited by `gemini-2-5-flash-image-preview` from his own headshot.
 *
 * ## Say what it is
 *
 * The alt text below is deliberately about the WORK, not about who is doing it:
 * "A milling unit cutting a restoration in the practice's laboratory". Alt text
 * is read aloud, and naming Dr. Nahlah in it would assert something the picture
 * cannot support — the room and the body are stock. The client knows and has
 * asked for the composite; the page should still not claim more than it can.
 *
 * ## The framing lesson, which cost three generations to learn
 *
 * The endpoint has NO aspect-ratio parameter, and the model takes its output
 * shape from the reference images, not from the prompt. With the portrait
 * 1024x1280 headshot in the set it returned 896x1152 every single time, however
 * firmly the prompt demanded landscape. Cropping the headshot to a landscape
 * face plate first (`.tmp/crop.mjs`) produced 1248x832 on the next attempt.
 */
import { readFileSync, existsSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, api, requestForm, toChangedPage, assertTemplatesIntact } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const fArg = process.argv.indexOf('--file')
const FILE = join(HERE, fArg > -1 ? process.argv[fArg + 1] : '.tmp/pin24/swap-2-0.png')

const NODE = '1DrY8PcmeQUVpkeGJzTXa'          // /our-facility #technology card 05
const WAS = '26192.jpg'
const ALT = "A milling unit cutting a restoration in the practice's laboratory"

if (!existsSync(FILE)) { console.error(`no candidate at ${FILE} — run gen-card-face-swap.mjs first`); process.exit(1) }
const bytes = readFileSync(FILE)
console.log(`candidate ${basename(FILE)}  ${Math.round(bytes.length / 1024)}KB`)

const base = (src) => (src ?? '').replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, '')

const { rows: pre } = await getPages()
const page0 = pre.find((r) => r.slug === 'our-facility')
const n0 = page0?.cells.body.nodes[NODE]
if (!n0) throw new Error(`node ${NODE} is not on /our-facility`)
if (n0.moduleId !== 'base.image') throw new Error(`${NODE} is a ${n0.moduleId}`)
const now = base(n0.props?.src)
if (now !== WAS) { console.log(`card 05 holds "${now}", not "${WAS}" — someone changed it. Refusing.`); process.exit(0) }
console.log(`card 05 (Milling machine)  ${WAS}  ->  ${basename(FILE)}`)

if (!APPLY) { console.log('\nDRY RUN — nothing uploaded. Re-run with --apply.'); process.exit(0) }

/* `File`, not `Blob`, and the extension comes off the magic bytes on the server
   side — publicPath is read from the response, never constructed. */
const form = new FormData()
form.append('file', new File([bytes], basename(FILE), { type: 'image/png' }))
const asset = (await requestForm('/admin/api/cms/media', form))?.asset
if (!asset?.id) throw new Error('upload returned no asset')
console.log(`  up   ${asset.publicPath}  ${asset.width}x${asset.height}`)

await api('PATCH', `/admin/api/cms/media/${asset.id}`, { altText: ALT })
const back = (await api('GET', '/admin/api/cms/media')).assets.find((a) => a.id === asset.id)
if (back?.altText !== ALT) { console.error('  ! alt did not land'); process.exit(1) }
console.log(`  alt  ${JSON.stringify(ALT)}`)

async function attempt () {
  const { site, seq } = await getSite()
  const { rows } = await getPages()
  const page = rows.find((r) => r.slug === 'our-facility')
  const nodes = page.cells.body.nodes
  const n = nodes[NODE]
  if (base(n?.props?.src) !== WAS && n?.props?.src !== asset.publicPath) {
    throw new Error(`card 05 moved to "${base(n?.props?.src)}" between the check and the write`)
  }
  /* No picture may render twice on this page — pin #11's rule. */
  const others = Object.values(nodes).filter((x) => x.moduleId === 'base.image' && x.id !== NODE).map((x) => x.props?.src)
  if (others.includes(asset.publicPath)) throw new Error('that asset is already elsewhere on /our-facility')
  n.props = { ...n.props, src: asset.publicPath }
  const seo = { seoTitle: page.cells.seoTitle, seoDescription: page.cells.seoDescription }
  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental',
    site,
    changedPages: [toChangedPage(page, { nodes, rootNodeId: page.cells.body.rootNodeId })],
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
    changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: { [page.id]: page.seq },
    shellBaseSeq: seq,
  })
  if (seo.seoTitle || seo.seoDescription) {
    const before = (await api('GET', `/admin/api/cms/data/rows/${page.id}`)).row
    await api('PATCH', `/admin/api/cms/data/rows/${page.id}`, { cells: { ...before.cells, ...seo } })
    console.log('  seo  restored on /our-facility')
  }
  return res
}

let out
for (let n = 1; n <= 6; n++) {
  try { out = await attempt(); break } catch (e) {
    if (e.status === 409 && n < 6) { console.log('  409 (someone else wrote) — re-reading and retrying'); continue }
    if ([502, 503, 504].includes(e.status) && n < 6) {
      console.log(`  ${e.status} from the edge — re-reading to see which side of the write it fell on`)
      await new Promise((r) => setTimeout(r, 3000 * n)); continue
    }
    console.error(`  ! ${e.message}`); process.exit(1)
  }
}
console.log('\nwrite:', JSON.stringify(out).slice(0, 160))

const { rows: after } = await getPages()
const page = after.find((r) => r.slug === 'our-facility')
const got = page.cells.body.nodes[NODE]?.props?.src
const ok = got === asset.publicPath
if (!ok) console.error(`  ! card 05 is ${got}`)
const srcs = Object.values(page.cells.body.nodes).filter((x) => x.moduleId === 'base.image').map((x) => x.props?.src)
const dupes = [...new Set(srcs.filter((s, i) => srcs.indexOf(s) !== i))]
console.log(`  ${srcs.length} images, ${new Set(srcs).size} distinct${dupes.length ? ` — repeats: ${dupes.map(base).join(', ')}` : ''}`)
await assertTemplatesIntact({ post: true })
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDRAFT ONLY. Nothing published.')
