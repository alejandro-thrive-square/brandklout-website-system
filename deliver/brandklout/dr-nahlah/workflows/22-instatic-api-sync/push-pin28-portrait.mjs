#!/usr/bin/env node
/**
 * push-pin28-portrait.mjs — BugHerd #28, `/` → `#specialist` → `#specPortrait`.
 * DRAFT ONLY, NEVER PUBLISHES.
 *
 *   node push-pin28-portrait.mjs            # dry run
 *   node push-pin28-portrait.mjs --apply
 *
 * > "picture is still cut off"
 *
 * ## What is actually wrong
 *
 * `.ch-specialist .doc-plate` is `aspect-ratio: 4/5` with `overflow: hidden`,
 * and the image inside it is `object-fit: cover`. That plate was drawn for the
 * 1200x1500 cut-out portrait of Dr. Nahlah — same 4:5 — which drops in with
 * ZERO crop.
 *
 * Pin #11's de-duplication pass replaced it with `dr-and-yolanda.jpg`, which is
 * **800x535, landscape, 1.495:1**. `cover` into a 4:5 box scales it to the box
 * height and throws away 46% of its width: measured on the live page at 1440,
 * the image box is 507.5x634.4 and the picture is drawn 948 wide. Dr. Nahlah's
 * arm goes off the left edge and Yolanda's shoulder off the right. There is no
 * `object-position` that fixes that — half the frame simply has nowhere to go.
 *
 * ## The fix, and why it is a swap and not a CSS change
 *
 * Capping or re-shaping the plate (the answer to #13) would work on the
 * geometry and be wrong on the substance: this is the section headed "The
 * credentials behind the work", signed "Dr. Esam Nahlah, D.D.S., M.S.". A
 * portrait of the doctor is what the slot is for, and one exists that fits it
 * exactly. So the picture goes back.
 *
 * `2LB_FQE0Yk3mHR8rlDnxS-dr-headshot.png` — 1200x1500, transparent background,
 * already in service on `/about` and `/meet-dr-nahlah`, alt text already
 * written. Byte-identical copies of it also sit in the library as
 * `3TStFVfzcPUbzOZ_nJqk1-dr-nahlah.png` and
 * `9aVOKa2LEeMicLMcT7ANg-DGT_Dr_Nahlah_Headshot_White-Coat_V2.png`; pointing at
 * the one already referenced keeps the count of live duplicate ids from growing
 * (pin #11's finding).
 *
 * ## This does not break pin #11
 *
 * The rule the client wrote is per page — "not to repeat images **on the same
 * page**". `/` does not contain this portrait anywhere else, and the check below
 * asserts that against the page as saved. `dr-and-yolanda.jpg` stays where it
 * still reads correctly, on `/about` and `/implant-supported-dentures`.
 */
import { getSite, getPages, api, toChangedPage, assertTemplatesIntact } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const SLUG = 'index'
const NODE = 'CrLxx7sgnUVoZTsocbuJM'                                   // #specPortrait
const WAS = '/uploads/EP2LNlq7dpfnXJ8HUzyFL-dr-and-yolanda.jpg'        // 800x535, landscape
const NOW = '/uploads/2LB_FQE0Yk3mHR8rlDnxS-dr-headshot.png'           // 1200x1500, 4:5

const base = (src) => (src ?? '').replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, '')

const { rows: pre } = await getPages()
const page0 = pre.find((r) => r.slug === SLUG)
if (!page0) throw new Error(`/${SLUG} not found`)
const n0 = page0.cells.body.nodes[NODE]
if (!n0) throw new Error(`node ${NODE} is not on /${SLUG}`)
if (n0.moduleId !== 'base.image') throw new Error(`${NODE} is a ${n0.moduleId}, not an image`)
if (n0.props?.htmlAttributes?.id !== 'specPortrait') {
  throw new Error(`${NODE} no longer carries id="specPortrait" — the page was restructured`)
}
if (n0.props?.src === NOW) { console.log('already the portrait — nothing to do'); process.exit(0) }
if (n0.props?.src !== WAS) {
  console.log(`#specPortrait holds "${base(n0.props?.src)}", not "${base(WAS)}" — someone changed it. Refusing.`)
  process.exit(0)
}

// The asset has to exist and be the shape the plate expects, or this trades one
// crop for another.
const asset = (await api('GET', '/admin/api/cms/media')).assets.find((a) => a.publicPath === NOW)
if (!asset) throw new Error(`${NOW} is not in the media library`)
if (asset.width / asset.height !== 0.8) {
  throw new Error(`${base(NOW)} is ${asset.width}x${asset.height}, not 4:5 — it would crop in the plate`)
}
console.log(`#specPortrait  ${base(WAS)} (800x535, 1.50:1)  ->  ${base(NOW)} (${asset.width}x${asset.height}, 0.80:1)`)
console.log(`  alt  ${JSON.stringify(asset.altText)}`)
if (!asset.altText) throw new Error('that asset has no alt text — write one before pointing a page at it')

if (!APPLY) { console.log('\nDRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }

async function attempt () {
  const { site, seq } = await getSite()
  const { rows } = await getPages()
  const page = rows.find((r) => r.slug === SLUG)
  const nodes = page.cells.body.nodes
  const n = nodes[NODE]
  if (n?.props?.src !== WAS && n?.props?.src !== NOW) {
    throw new Error(`#specPortrait moved to "${base(n?.props?.src)}" between the check and the write`)
  }
  /* Pin #11's rule, enforced rather than assumed. */
  const others = Object.values(nodes)
    .filter((x) => x.moduleId === 'base.image' && x.id !== NODE)
    .map((x) => x.props?.src)
  if (others.includes(NOW)) throw new Error(`${base(NOW)} is already elsewhere on /${SLUG}`)
  n.props = { ...n.props, src: NOW }
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
  // `pageToCells()` cannot carry seoTitle/seoDescription — re-apply through the
  // row PATCH, which merges. See insta-api.mjs → toChangedPage.
  if (seo.seoTitle || seo.seoDescription) {
    const before = (await api('GET', `/admin/api/cms/data/rows/${page.id}`)).row
    await api('PATCH', `/admin/api/cms/data/rows/${page.id}`, { cells: { ...before.cells, ...seo } })
    console.log(`  seo  restored on /${SLUG}`)
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
const page = after.find((r) => r.slug === SLUG)
const got = page.cells.body.nodes[NODE]?.props?.src
const ok = got === NOW
if (!ok) console.error(`  ! #specPortrait is ${got}`)
const srcs = Object.values(page.cells.body.nodes).filter((x) => x.moduleId === 'base.image').map((x) => x.props?.src)
const dupes = [...new Set(srcs.filter((s, i) => srcs.indexOf(s) !== i))]
console.log(`  ${srcs.length} images, ${new Set(srcs).size} distinct${dupes.length ? ` — repeats: ${dupes.map(base).join(', ')}` : ''}`)
await assertTemplatesIntact({ post: true })
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDRAFT ONLY. Nothing published.')
