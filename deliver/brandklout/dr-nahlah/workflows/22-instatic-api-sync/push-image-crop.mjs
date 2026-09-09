#!/usr/bin/env node
/**
 * push-image-crop.mjs — BugHerd #13 (and the pins that follow it): a subject's
 * face is cropped out of an `object-fit:cover` frame. DRAFT ONLY, NEVER PUBLISHES.
 *
 *   node push-image-crop.mjs            # dry run
 *   node push-image-crop.mjs --apply
 *   node push-image-crop.mjs --pin 13   # one job only
 *
 * ## The fix is `object-position`, not a new photograph
 *
 * > "Her face is cut off. shift picture down"   /patient-stories, `#band`
 *
 * `.mband` is a full-bleed strip — 1425x544 at a 1440 viewport, ratio 2.62 —
 * and the photograph behind it is 800x535, ratio 1.50. `cover` therefore throws
 * away 43% of the source height, and the `[data-drift]` parallax (`scale:1.12`,
 * `yPercent:-6 -> 6`) eats a further 11% and slides the window up and down
 * inside it. At the default `50% 50%` the visible window is source y 131..404
 * of 535: it starts below her eyes.
 *
 * Anchoring the crop to the TOP of the source (`50% 0%`) moves that window to
 * y 16..289 at rest, and y 0..273 / 33..306 at the two ends of the drift. The
 * whole head is inside it at every point of the scroll and at every width.
 * Measured in headless Chrome against the published page at 1440, 1857 and
 * 390 — the before/after frames are in `.tmp/pin13/`.
 *
 * The framed "before" photograph she is holding falls out of the wide crop as a
 * result. That is the trade the client asked for: the section is headed "NAMED,
 * ON CAMERA" and the person is its subject. At 390 the band crops horizontally
 * instead and both still fit.
 *
 * ## Why a modifier class and not a change to `.mband .mband-fig img`
 *
 * Five pages carry an `.mband`, each with its own photograph, and only this one
 * is wrong. The base ambient keeps its default; the modifier is opt-in per
 * figure. `.mband .mband-fig.mband-top img` (0,3,1) beats the base ambient
 * (0,2,1), so rule ORDER cannot decide this and a later CSS edit cannot
 * silently reorder it away.
 *
 * The empty class-kind rule beside the ambient is not decoration: the publish
 * tree shake keeps an ambient only while every class token in its selector is
 * either unknown to the registry or a class rule that some node actually uses.
 * `mband-top` is registered AND assigned, so both halves survive. Registering
 * without assigning, or assigning without registering, drops the rule at
 * publish.
 */
import { randomBytes } from 'node:crypto'
import { getSite, getPages, api, toChangedPage, assertTemplatesIntact } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => {
  const b = randomBytes(n)
  let s = ''
  for (let i = 0; i < n; i++) s += ALPHABET[b[i] & 63]
  return s
}

/**
 * One row per pin. `find` runs against the page's node map and must return
 * exactly the nodes the modifier belongs on; `expect` is the filename the run
 * asserts is still there, so a crop tuned to one photograph cannot land on
 * another that somebody swapped in underneath it.
 */
const JOBS = [
  {
    pin: 13,
    slug: 'patient-stories',
    note: 'the #band strip cropped below her eyes',
    className: 'mband-top',
    ambient: ['.mband .mband-fig.mband-top img', { objectPosition: '50% 0%' }],
    expect: ['pt-yolanda-transformation.jpg'],
    /* The figure, not the image: the modifier reads as "this band is cropped
       from the top" and sits beside `.mband-fig`, where a band modifier goes. */
    find: (nodes, classId) => {
      const figClass = classId('mband-fig')
      return Object.values(nodes).filter((n) => (n.classIds ?? []).includes(figClass))
    },
    imagesOf: (nodes, fig) => (fig.children ?? []).map((id) => nodes[id]).filter((n) => n?.moduleId === 'base.image'),
  },
  {
    pin: 19,
    slug: 'about',
    note: "#specialist cropped the doctor's head off above the mouth",
    className: 'sp-fig-top',
    ambient: ['.pk-split .sp-fig.sp-fig-top img', { objectPosition: '50% 0%' }],
    expect: ['dr-headshot.png'],
    /* Same arithmetic as pin 13, different frame. `.sp-fig` is `aspect-ratio:
       4/3` and `dr-headshot.png` is a 4:5 PORTRAIT cut-out, so `cover` drops
       40% of the source height and the drift takes another 11% — centred, the
       window opened at source y 348 of 1500, below his mouth. `50% 0%` opens it
       at y 45, above the hairline at 55.
       `contain` would fit the whole figure and was rejected: pins #15 and #16
       are the client objecting to exactly that letterbox on other pages.
       Scoped to `#specialist` — /about carries a SECOND `.sp-fig` (the doctor
       with a patient, correctly centred) and a bare `.sp-fig` lookup would
       re-crop that one too. */
    find: (nodes, classId) => {
      const figClass = classId('sp-fig')
      const sec = Object.values(nodes).find((n) => n?.props?.htmlAttributes?.id === 'specialist')
      if (!sec) return []
      const out = []
      ;(function walk (id) {
        const n = nodes[id]; if (!n) return
        if ((n.classIds ?? []).includes(figClass)) out.push(n)
        for (const c of n.children ?? []) walk(c)
      })(sec.id)
      return out
    },
    imagesOf: (nodes, fig) => (fig.children ?? []).map((id) => nodes[id]).filter((n) => n?.moduleId === 'base.image'),
  },
  {
    pin: 20,
    slug: 'our-facility',
    note: '#welcome left a 163px hole under the top-right photograph',
    className: 'mz-fill',
    /* Not a crop this time — a grid-row height. `.mz.mz-3` is three columns and
       the first figure is `.mz-wide`: 16/9 across TWO of them, so its height is
       (2col + gap) * 9/16 ≈ 463px at 1440, while the single-column figure beside
       it is 4/3 ≈ 300px. The 163px difference is the gap the client circled.
       Dropping the aspect-ratio lets the grid's default `align-self: stretch`
       size that figure from the row instead, and the image is already
       `position:absolute; inset:0; object-fit:cover`, so it simply covers more.
       ONLY above 720px. Below it `.mz-3` collapses to two columns and the figure
       can end up alone in its row — an auto row measured from a subtree whose
       only child is absolutely positioned is 0px tall, and the figure would
       vanish. The base rule keeps 4/3 for exactly that case. */
    ambient: ['.mz .mz-fig.mz-fill', {}, { 'media:(min-width: 720px)': { aspectRatio: 'auto', height: '100%' } }],
    expect: ['practice-space-2.jpg'],
    find: (nodes, classId) => {
      const figClass = classId('mz-fig')
      const wideClass = classId('mz-wide')
      const sec = Object.values(nodes).find((n) => n?.props?.htmlAttributes?.id === 'welcome')
      if (!sec) return []
      const figs = []
      ;(function walk (id) {
        const n = nodes[id]; if (!n) return
        if ((n.classIds ?? []).includes(figClass)) figs.push(n)
        for (const c of n.children ?? []) walk(c)
      })(sec.id)
      /* The one that shares row 1 with the wide figure — i.e. the next sibling
         after it, found positionally rather than by index, so inserting a figure
         earlier in the mosaic cannot silently re-point this at another picture
         (the `expect` assertion would catch it, but this is why it holds). */
      const i = figs.findIndex((f) => (f.classIds ?? []).includes(wideClass))
      return i > -1 && figs[i + 1] ? [figs[i + 1]] : []
    },
    imagesOf: (nodes, fig) => (fig.children ?? []).map((id) => nodes[id]).filter((n) => n?.moduleId === 'base.image'),
  },
]

const pinArg = process.argv.indexOf('--pin')
const only = pinArg > -1 ? Number(process.argv[pinArg + 1]) : null
const jobs = only ? JOBS.filter((j) => j.pin === only) : JOBS
if (!jobs.length) { console.error(`no job for pin ${only}`); process.exit(2) }

const base = (src) => (src ?? '').replace(/^\/uploads\/[A-Za-z0-9_-]{21}-/, '')

async function attempt () {
  const { site: shell, seq } = await getSite()
  const rules = shell.styleRules ?? {}
  shell.styleRules = rules
  const { rows } = await getPages()

  let order = Math.max(...Object.values(rules).map((r) => r.order ?? 0))
  const classByName = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)?.id
  const hasAmbient = (sel) => Object.values(rules).some((r) => r.kind === 'ambient' && r.selector === sel)

  const added = []
  const changedPages = []
  const baseSeqs = {}
  const seoRestore = []
  let touched = 0

  for (const job of jobs) {
    const page = rows.find((r) => r.slug === job.slug)
    if (!page) throw new Error(`pin ${job.pin}: no page with slug "${job.slug}"`)
    const nodes = page.cells.body.nodes

    // -- registry: the empty class rule, then the ambient that paints it --
    let classId = classByName(job.className)
    if (!classId) {
      classId = nanoid()
      rules[classId] = {
        id: classId, name: job.className, kind: 'class', selector: `.${job.className}`,
        order: ++order, styles: {}, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now(),
      }
      added.push(`.${job.className} (class)`)
    }
    const [selector, styles, contextStyles = {}] = job.ambient
    /* A rule can carry BOTH: `styles` is the unconditional half, `contextStyles`
       is keyed by a condition id that must already exist in `site.conditions` —
       the publisher renders an unknown id as nothing at all, silently. */
    for (const cid of Object.keys(contextStyles)) {
      if (!(shell.conditions ?? []).some((c) => c.id === cid)) {
        throw new Error(`pin ${job.pin}: no condition "${cid}" on this site — the rule would publish as nothing`)
      }
    }
    if (!hasAmbient(selector)) {
      const id = nanoid()
      rules[id] = {
        id, name: selector, kind: 'ambient', selector, order: ++order,
        styles, contextStyles, createdAt: Date.now(), updatedAt: Date.now(),
      }
      added.push(`${selector} (ambient)`)
    }

    // -- the nodes the modifier goes on --
    const targets = job.find(nodes, classByName)
    if (!targets.length) throw new Error(`pin ${job.pin}: found no node to carry .${job.className}`)

    const seen = []
    for (const t of targets) for (const img of job.imagesOf(nodes, t)) seen.push(base(img.props?.src))
    const missing = job.expect.filter((f) => !seen.includes(f))
    if (missing.length) throw new Error(`pin ${job.pin}: expected ${missing.join(', ')}, found ${seen.join(', ') || '(no image)'}`)
    if (seen.length !== job.expect.length) throw new Error(`pin ${job.pin}: ${seen.length} images under the target, expected ${job.expect.length}`)

    const pending = targets.filter((t) => !(t.classIds ?? []).includes(classId))
    console.log(`\npin ${job.pin}  /${job.slug}  — ${job.note}`)
    const decl = (o) => Object.entries(o).map(([k, v]) => `${k}: ${v}`).join('; ')
    console.log(`  ${selector} { ${decl(styles)} }`)
    for (const [cid, o] of Object.entries(contextStyles)) console.log(`    @${cid.replace(/^media:/, 'media ')} { ${decl(o)} }`)
    console.log(`  ${targets.length} node(s) hold ${seen.join(', ')}; ${pending.length} still need .${job.className}`)
    if (!pending.length) { console.log('  nodes already carry it'); continue }

    if (APPLY) {
      for (const t of pending) t.classIds = [...(t.classIds ?? []), classId]
      changedPages.push(toChangedPage(page, { nodes, rootNodeId: page.cells.body.rootNodeId }))
      baseSeqs[page.id] = page.seq
      /* pageToCells() drops these and the row write REPLACES cells; capture now,
         re-apply through PATCH (which merges) inside this same run. */
      seoRestore.push({ id: page.id, slug: page.slug, seoTitle: page.cells.seoTitle, seoDescription: page.cells.seoDescription })
    }
    touched += pending.length
  }

  console.log(`\n  + ${added.length} style rule(s)${added.length ? `: ${added.join(', ')}` : ' (all present)'}`)
  if (!APPLY) return { dry: true }
  if (!touched && !added.length) return { done: true }

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
  return { res }
}

let out
for (let n = 1; n <= 6; n++) {
  try { out = await attempt(); break } catch (e) {
    if (e.status === 409 && n < 6) { console.log('  409 (someone else wrote) — re-reading and retrying'); continue }
    /* The edge in front of this app returns a Cloudflare 502 under load, and it
       can land EITHER side of the write. Re-reading is the only honest way to
       find out which — and it is safe, because every step here is a no-op once
       it has been applied: the retry reports "nodes already carry it" rather
       than writing the class a second time. */
    if ([502, 503, 504].includes(e.status) && n < 6) {
      console.log(`  ${e.status} from the edge — re-reading to see which side of the write it fell on`)
      await new Promise((r) => setTimeout(r, 3000 * n))
      continue
    }
    console.error(`  ! ${e.message}`); process.exit(1)
  }
}
if (out.dry) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }
/* `done` means a previous run (or the far side of a lost 502) already applied
   it. Fall through to the read-back anyway — "nothing to do" is a claim about
   the live draft, and it should be checked, not asserted. */
console.log(out.done ? '\nalready applied — verifying' : '\nwrite: ' + JSON.stringify(out.res).slice(0, 160))

// ── read back ──────────────────────────────────────────────────────────────
const { site: shellBack } = await getSite()
const { rows: after } = await getPages()
const ruleByName = (name) => Object.values(shellBack.styleRules ?? {}).find((r) => r.kind === 'class' && r.name === name)?.id
let ok = true
for (const job of jobs) {
  const classId = ruleByName(job.className)
  if (!classId) { console.error(`  ! class rule .${job.className} did not land`); ok = false; continue }
  const amb = Object.values(shellBack.styleRules ?? {}).find((r) => r.kind === 'ambient' && r.selector === job.ambient[0])
  if (!amb) { console.error(`  ! ambient ${job.ambient[0]} did not land`); ok = false } else {
    for (const [k, v] of Object.entries(job.ambient[1])) {
      if (amb.styles?.[k] !== v) { console.error(`  ! ${job.ambient[0]} { ${k} } is ${amb.styles?.[k]}, wanted ${v}`); ok = false }
    }
    for (const [cid, o] of Object.entries(job.ambient[2] ?? {})) {
      for (const [k, v] of Object.entries(o)) {
        if (amb.contextStyles?.[cid]?.[k] !== v) { console.error(`  ! ${job.ambient[0]} @${cid} { ${k} } is ${amb.contextStyles?.[cid]?.[k]}, wanted ${v}`); ok = false }
      }
    }
  }
  const page = after.find((r) => r.slug === job.slug)
  const nodes = page.cells.body.nodes
  const targets = job.find(nodes, ruleByName)
  if (!targets.length) { console.error(`  ! pin ${job.pin}: target node gone`); ok = false }
  for (const t of targets) {
    if (!(t.classIds ?? []).includes(classId)) { console.error(`  ! ${t.id} does not carry .${job.className}`); ok = false }
    const imgs = job.imagesOf(nodes, t).map((i) => base(i.props?.src))
    if (imgs.join(',') !== job.expect.join(',')) { console.error(`  ! ${t.id} now holds ${imgs.join(',')}`); ok = false }
  }
}
/* An incremental write should not touch the entry template; verify, don't assume. */
await assertTemplatesIntact({ post: true })
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDRAFT ONLY. Nothing published.')
