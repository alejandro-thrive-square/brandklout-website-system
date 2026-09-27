#!/usr/bin/env node
/**
 * push-fig-fill.mjs — BugHerd #15 and #16: "the images seem to be having some
 * sort of margin. Should be covered so they don't show those borders."
 * DRAFT ONLY, NEVER PUBLISHES.
 *
 *   node push-fig-fill.mjs            # dry run, prints the whole inventory
 *   node push-fig-fill.mjs --apply
 *   node push-fig-fill.mjs --pinned   # the two pinned sections only
 *
 * ## What the "border" is
 *
 * Two modifiers put a picture INSIDE its tile instead of filling it:
 *
 *   .mz .mz-fig.mz-plain img            { object-fit: contain; padding: … }
 *   .pk-card .pk-card-fig.pk-card-fig-pad img  { same }
 *
 * plus `background: var(--bg-3)` on the tile behind. They exist for cut-out
 * art — a tooth model on transparency, which would be beheaded by `cover` and
 * needs air around it.
 *
 * A JPEG cannot be a cut-out. JPEG has no alpha channel, so the source is
 * always a full opaque rectangle, and `contain` + padding always paints that
 * rectangle inset inside a differently-coloured tile. That inset rectangle IS
 * the border the client is pointing at: on `/dental-implants` the abutment
 * render sits on black and the restoration render on white, both floating in a
 * `--bg-3` tile with a visible seam on all four sides.
 *
 * So the test needs no pixels and no judgement: **a padded figure holding a
 * JPEG is wrong; a padded figure holding a PNG is right.** The six PNGs under
 * these modifiers were checked rather than assumed — 91.7%–100% of their border
 * pixels are fully transparent (`.tmp/pin15/pngs/`), including `allon4.png`,
 * whose translucent blue backdrop reaches the four edge MIDPOINTS but not the
 * corners. Every one is a genuine cut-out and keeps its padding.
 *
 * ## The fix is a class removal, not a new rule
 *
 * Dropping the modifier returns the figure to `.mz .mz-fig img` / `.pk-card
 * .pk-card-fig img`, which are already `object-fit: cover` on a `--mist` tile.
 * Nothing is added to the registry, and both class rules stay in use elsewhere
 * (six PNG figures), so the publish tree shake keeps them and the pages that
 * still want padding are untouched.
 *
 * ## Scope
 *
 * The client pinned `#anatomy` and `#options` on `/dental-implants` — five
 * figures. The same JPEG-in-a-padded-tile appears four more times, on
 * `/implant-supported-dentures` (3) and `/dental-implant-faq` (1), pages they
 * have not looked at yet. The default run fixes all nine, because it is one
 * defect with one mechanical test; `--pinned` restricts it to the two pinned
 * sections if that is wanted instead.
 */
import { getSite, getPages, api, toChangedPage, assertTemplatesIntact } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const PINNED_ONLY = process.argv.includes('--pinned')

/** The two modifiers, and the pinned sections, for `--pinned`. */
const MODIFIERS = ['mz-plain', 'pk-card-fig-pad']
const PINNED = { 'dental-implants': ['anatomy', 'options'] }

async function attempt () {
  const { site: shell, seq } = await getSite()
  const rules = shell.styleRules ?? {}
  const classId = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)?.id
  const modIds = new Map(MODIFIERS.map((n) => [n, classId(n)]))
  for (const [n, id] of modIds) if (!id) throw new Error(`no class rule .${n} — this is not the design this script knows`)

  const { assets } = await api('GET', '/admin/api/cms/media')
  const byPath = new Map(assets.map((a) => [a.publicPath, a]))
  const { rows } = await getPages()

  const found = []
  for (const page of rows) {
    const nodes = page.cells.body.nodes
    /* Which section each node sits in, so `--pinned` can be honest about it. */
    const sectionOf = new Map()
    for (const n of Object.values(nodes)) {
      const id = n?.props?.htmlAttributes?.id
      if (!id) continue
      ;(function walk (nid) {
        const x = nodes[nid]; if (!x) return
        if (!sectionOf.has(nid)) sectionOf.set(nid, id)
        for (const c of x.children ?? []) walk(c)
      })(n.id)
    }
    for (const n of Object.values(nodes)) {
      const mod = MODIFIERS.find((m) => (n.classIds ?? []).includes(modIds.get(m)))
      if (!mod) continue
      const img = (n.children ?? []).map((c) => nodes[c]).find((c) => c?.moduleId === 'base.image')
      const asset = img ? byPath.get(img.props?.src) : null
      found.push({ page, node: n, mod, asset, section: sectionOf.get(n.id) ?? '(no section)' })
    }
  }

  const rowsOut = []
  for (const f of found) {
    let verdict
    if (!f.asset) verdict = 'SKIP  no image under the figure'
    else if (f.asset.mimeType === 'image/png') verdict = 'keep  PNG cut-out'
    else if (f.asset.mimeType === 'image/jpeg') verdict = 'FILL  JPEG cannot be a cut-out'
    else verdict = `SKIP  ${f.asset.mimeType} — not decided`
    if (verdict.startsWith('FILL') && PINNED_ONLY && !(PINNED[f.page.slug] ?? []).includes(f.section)) {
      verdict = 'skip  outside the pinned sections'
    }
    f.verdict = verdict
    rowsOut.push([f.page.slug.padEnd(28), f.mod.padEnd(16), (f.asset?.filename ?? '—').padEnd(38),
      `#${f.section}`.padEnd(12), verdict].join(' '))
  }
  console.log(rowsOut.join('\n'))

  const fix = found.filter((f) => f.verdict.startsWith('FILL'))
  console.log(`\n${found.length} padded figures; ${fix.length} to fill, ${found.filter((f) => f.verdict.startsWith('keep')).length} correct as they are`)
  if (!fix.length) return { done: true }
  if (!APPLY) return { dry: true }

  /* A modifier that ends up on NO node anywhere is dropped by the publish tree
     shake along with every ambient that names it. Both survive here — six PNG
     figures keep them — but check rather than trust, because the day it stops
     being true the pages that still want padding silently lose it. */
  for (const m of MODIFIERS) {
    const left = found.filter((f) => f.mod === m && !f.verdict.startsWith('FILL')).length
    if (!left) throw new Error(`.${m} would be left on no node at all — the tree shake would drop its rules. Refusing.`)
    console.log(`  .${m} still on ${left} figure(s) after this`)
  }

  const changedPages = []
  const baseSeqs = {}
  const seoRestore = []
  const touched = new Map()
  for (const f of fix) {
    f.node.classIds = (f.node.classIds ?? []).filter((c) => c !== modIds.get(f.mod))
    touched.set(f.page.id, f.page)
  }
  for (const page of touched.values()) {
    changedPages.push(toChangedPage(page, { nodes: page.cells.body.nodes, rootNodeId: page.cells.body.rootNodeId }))
    baseSeqs[page.id] = page.seq
    seoRestore.push({ id: page.id, slug: page.slug, seoTitle: page.cells.seoTitle, seoDescription: page.cells.seoDescription })
  }

  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental',
    site: shell,
    changedPages,
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [],
    changedLayouts: [], deletedLayoutIds: [],
    baseSeqs,
    shellBaseSeq: seq,
  })
  for (const s of seoRestore) {
    if (!s.seoTitle && !s.seoDescription) continue
    const before = (await api('GET', `/admin/api/cms/data/rows/${s.id}`)).row
    await api('PATCH', `/admin/api/cms/data/rows/${s.id}`, { cells: { ...before.cells, seoTitle: s.seoTitle, seoDescription: s.seoDescription } })
    console.log(`  seo  restored on /${s.slug}`)
  }
  return { res, fix: fix.map((f) => ({ slug: f.page.slug, node: f.node.id, mod: f.mod, file: f.asset.filename })) }
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
if (out.dry) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }
if (out.done) { console.log('\nnothing to fill'); process.exit(0) }
console.log('\nwrite:', JSON.stringify(out.res).slice(0, 160))

// ── read back ──────────────────────────────────────────────────────────────
const { site: shellBack } = await getSite()
const { rows: after } = await getPages()
const idOf = (name) => Object.values(shellBack.styleRules ?? {}).find((r) => r.kind === 'class' && r.name === name)?.id
let ok = true
for (const f of out.fix) {
  const page = after.find((r) => r.slug === f.slug)
  const n = page?.cells.body.nodes[f.node]
  if (!n) { console.error(`  ! ${f.slug} ${f.node} is gone`); ok = false; continue }
  if ((n.classIds ?? []).includes(idOf(f.mod))) { console.error(`  ! ${f.slug} ${f.node} still carries .${f.mod}`); ok = false }
  const img = (n.children ?? []).map((c) => page.cells.body.nodes[c]).find((c) => c?.moduleId === 'base.image')
  if (!img) { console.error(`  ! ${f.slug} ${f.node} lost its image`); ok = false }
}
/* The modifiers must still exist and still be used, or the pages that keep
   their padding lose it at the next publish. */
for (const m of MODIFIERS) {
  if (!idOf(m)) { console.error(`  ! class rule .${m} vanished`); ok = false; continue }
  const uses = after.reduce((t, p) => t + Object.values(p.cells.body.nodes).filter((n) => (n.classIds ?? []).includes(idOf(m))).length, 0)
  console.log(`  .${m} in use on ${uses} node(s)`)
  if (!uses) { console.error(`  ! .${m} is now unused — the tree shake will drop it`); ok = false }
}
await assertTemplatesIntact({ post: true })
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDRAFT ONLY. Nothing published.')
