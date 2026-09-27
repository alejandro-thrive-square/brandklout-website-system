#!/usr/bin/env node
/**
 * push-technology-images.mjs — BugHerd #21, #22, #23: three cards in
 * `/our-facility #technology` show something other than what they name.
 * DRAFT ONLY, NEVER PUBLISHES.
 *
 *   node push-technology-images.mjs            # dry run — no quota spent
 *   node push-technology-images.mjs --apply    # LICENSES 3 FREEPIK IMAGES
 *
 * ## Which card each pin is
 *
 * All three pins carry the SAME `selector_info.path`
 * (`…#technology…>article.pk-card>div.pk-card-fig>img`) — BugHerd's path does
 * not identify which of the six cards was clicked. What does identify it is
 * `selector_info.html`, which carries the actual `<img src>`. That is how these
 * node ids were derived, and they are asserted below rather than trusted.
 *
 *   #21  card 02  Intraoral scanner        had `tech-advanced.jpg`  — a stereo microscope
 *   #22  card 03  Guided implant surgery   had `Closeup-of-…-explaining-…jpg` — a consultation
 *   #23  card 06  Zirconia & porcelain oven had `crown-model.jpg`   — a crown on a model
 *
 * Pin #21 is also a same-page repeat that pin #11 could not have seen: card 04
 * "In-house digital lab" holds `lab.jpg`, which is the SAME photograph as
 * `tech-advanced.jpg` at a different crop (800x535 against 2000x1000, identical
 * alt text). Byte-identity de-duplication compares bytes; two crops of one shot
 * are not byte-identical. Replacing card 02 clears the repeat as well.
 *
 * ## Why these are licensed and not taken from the library
 *
 * The 476-asset library has no intraoral scanner in use, no guided surgery and
 * no furnace. The single honest candidate — `8L6A7479.jpg`, the practice's own
 * scanner beside a digital arch — is ALREADY on `/our-facility` in `#why`, so
 * using it here would create exactly the same-page repeat pin #11 exists to
 * remove. Of the 39 numeric Freepik assets only six are unused and all six are
 * chair-side patient shots.
 *
 * Every pick was looked at as a picture, from the free 626px preview, before any
 * download was spent — `.tmp/fp/pick*.html` and the shots beside them. The
 * literal guided-surgery result (`329554803`, an implant driven through a
 * surgical template) was rejected on sight: accurate, and it reads as raw
 * anatomy on a page a nervous patient is browsing. `32574522` carries the same
 * meaning — two gowned clinicians placing an implant with the CBCT scan on the
 * monitor behind them, which is the card's sentence ("planned on the scan and
 * placed through a printed guide") in one frame.
 *
 * ## Resumability is not optional here
 *
 * A Freepik download SPENDS QUOTA. The ledger is written after EVERY upload and
 * a key already in it is skipped, so a run that dies after one upload does not
 * pay for it twice. This is the lesson pin #11 paid for.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getSite, getPages, api, requestForm, toChangedPage, assertTemplatesIntact } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '.tmp', 'pin21')
const LEDGER = join(OUT, 'uploaded.json')
const APPLY = process.argv.includes('--apply')

const KEY = process.env.MAGNIFIC
if (!KEY) { console.error('MAGNIFIC is not set in the repo-root .env'); process.exit(1) }

/** node id -> what the card says, what is wrong with it, and the replacement. */
const CARDS = [
  {
    pin: 21,
    node: 'FOH_jYlAcJMkatKBp8jtP',
    card: '02 Intraoral scanner',
    was: 'tech-advanced.jpg',
    freepik: '426850078',
    alt: 'An intraoral scanner recording a digital impression of a patient’s teeth',
  },
  {
    pin: 22,
    node: 'p7Ud8yIUDwG99bz8P-HqL',
    card: '03 Guided implant surgery',
    was: 'Closeup-of-unrecognizable-dentist-pointing-at-tooth-model-while-explaining-dental-implant-surgery-to-patient-in-clinic.jpg',
    freepik: '32574522',
    alt: 'Two clinicians placing an implant, the planning scan on the monitor beside them',
  },
  {
    pin: 23,
    node: 'qBc1VApNmuDzYGTUEUCeu',
    card: '06 Zirconia & porcelain oven',
    was: 'crown-model.jpg',
    freepik: '93782430',
    alt: 'A technician loading a ceramic restoration into the laboratory furnace',
  },
]

const base = (src) => (src ?? '').replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, '')

// ── the draft must still look the way the pins described it ────────────────
const { rows: pre } = await getPages()
const page0 = pre.find((r) => r.slug === 'our-facility')
if (!page0) throw new Error('no /our-facility page')
for (const c of CARDS) {
  const n = page0.cells.body.nodes[c.node]
  if (!n) throw new Error(`pin ${c.pin}: node ${c.node} is not on the page`)
  if (n.moduleId !== 'base.image') throw new Error(`pin ${c.pin}: ${c.node} is a ${n.moduleId}`)
  const now = base(n.props?.src)
  if (now !== c.was) {
    console.log(`pin ${c.pin} (${c.card}) now holds "${now}", not "${c.was}" — someone changed it. Refusing.`)
    process.exit(0)
  }
  console.log(`pin ${c.pin}  ${c.card.padEnd(28)} ${c.was.slice(0, 46)}  ->  freepik ${c.freepik}`)
}

/* Cross-page reuse is fine; a repeat on THIS page is the defect pin #11 exists
   to remove, so the replacements must not collide with what is already here. */
const onPage = new Set(Object.values(page0.cells.body.nodes)
  .filter((n) => n.moduleId === 'base.image').map((n) => n.props?.src))

if (!APPLY) {
  console.log(`\n${CARDS.length} images to license. DRY RUN — no quota spent. Re-run with --apply.`)
  process.exit(0)
}

// ── license, upload, alt ───────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true })
const uploaded = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : {}
if (Object.keys(uploaded).length) console.log(`\nresuming: ${Object.keys(uploaded).length} already licensed`)

for (const c of CARDS) {
  if (uploaded[c.freepik]) { console.log(`  skip ${c.freepik}  ${uploaded[c.freepik].publicPath}`); continue }
  const meta = await fetch(`https://api.freepik.com/v1/resources/${c.freepik}/download`, { headers: { 'x-freepik-api-key': KEY } })
  if (!meta.ok) throw new Error(`freepik download ${meta.status} for ${c.freepik}`)
  const { data } = await meta.json()
  const bin = await fetch(data.url)
  if (!bin.ok) throw new Error(`freepik cdn ${bin.status} for ${c.freepik}`)
  const bytes = Buffer.from(await bin.arrayBuffer())
  /* `File`, not `Blob` — a bare Blob arrives as a text field and the handler
     answers 400 "Missing file". The server picks the extension from the magic
     bytes, so publicPath is READ OFF the response, never constructed. */
  const form = new FormData()
  form.append('file', new File([bytes], data.filename || `${c.freepik}.jpg`, { type: 'image/jpeg' }))
  const res = await requestForm('/admin/api/cms/media', form)
  const asset = res?.asset
  if (!asset?.id) throw new Error(`upload returned no asset for ${c.freepik}: ${JSON.stringify(res).slice(0, 200)}`)
  uploaded[c.freepik] = asset
  writeFileSync(LEDGER, JSON.stringify(uploaded, null, 2))    // after EVERY one
  console.log(`  up   ${c.freepik}  ${asset.publicPath}  ${asset.width}x${asset.height}`)
}

/* Alt lives on the ASSET, not on the node — `props.alt` is absent everywhere on
   this site and an htmlAttributes alt would shadow the library's. Media writes
   also bump the shell seq, so they go BEFORE the document read, never between
   it and the write. */
for (const c of CARDS) {
  const a = uploaded[c.freepik]
  if (a.altText?.trim()) continue
  await api('PATCH', `/admin/api/cms/media/${a.id}`, { altText: c.alt })
  const back = (await api('GET', '/admin/api/cms/media')).assets.find((x) => x.id === a.id)
  if (back?.altText !== c.alt) { console.error(`  ! alt did not land on ${c.freepik}`); process.exit(1) }
  console.log(`  alt  ${c.freepik}  ${JSON.stringify(c.alt)}`)
}

for (const c of CARDS) {
  if (onPage.has(uploaded[c.freepik].publicPath)) {
    throw new Error(`${c.freepik} is already on /our-facility — that would be a same-page repeat`)
  }
}

// ── one write ──────────────────────────────────────────────────────────────
async function attempt () {
  const { site, seq } = await getSite()
  const { rows } = await getPages()
  const page = rows.find((r) => r.slug === 'our-facility')
  const nodes = page.cells.body.nodes
  for (const c of CARDS) {
    const n = nodes[c.node]
    if (base(n?.props?.src) !== c.was && base(n?.props?.src) !== base(uploaded[c.freepik].publicPath)) {
      throw new Error(`pin ${c.pin}: ${c.node} moved to "${base(n?.props?.src)}" between the check and the write`)
    }
    n.props = { ...n.props, src: uploaded[c.freepik].publicPath }
  }
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

// ── read back ──────────────────────────────────────────────────────────────
const { rows: after } = await getPages()
const page = after.find((r) => r.slug === 'our-facility')
const nodes = page.cells.body.nodes
let ok = true
for (const c of CARDS) {
  const got = nodes[c.node]?.props?.src
  if (got !== uploaded[c.freepik].publicPath) { console.error(`  ! ${c.card}: ${got}`); ok = false }
}
/* And the whole point of pin #11: no picture may render twice on this page.
   Compared by asset id, which is as far as an id-based check can go — the
   `lab.jpg` / `tech-advanced.jpg` pair is exactly why that is not enough on its
   own, and why card 02 is being replaced rather than re-pointed. */
const srcs = Object.values(nodes).filter((n) => n.moduleId === 'base.image').map((n) => n.props?.src)
const dupes = [...new Set(srcs.filter((s, i) => srcs.indexOf(s) !== i))]
console.log(`  ${srcs.length} images on the page, ${new Set(srcs).size} distinct` +
  (dupes.length ? ` — repeats: ${dupes.map(base).join(', ')}` : ''))
await assertTemplatesIntact({ post: true })
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDRAFT ONLY. Nothing published.')
