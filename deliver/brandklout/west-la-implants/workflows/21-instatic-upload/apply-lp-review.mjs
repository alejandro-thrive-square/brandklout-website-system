#!/usr/bin/env node
/**
 * apply-lp-review.mjs — the 2026-10-06 ad-page review (Asana 1219174341490192, 1219174341490190),
 * written into the LIVE draft as surgical edits. Nothing is rebuilt from site-src: every page is
 * read from the instance, only the named nodes change, and every row is written against its own
 * seq, so an edit made in the admin or by another session is kept (or the save 409s loudly).
 *
 *   node apply-lp-review.mjs                      # dry run: prints every change
 *   node apply-lp-review.mjs --apply              # backup, then write the draft
 *   node apply-lp-review.mjs --apply --publish    # ...and publish (guarded)
 *
 * SHELL — two NEW code assets, nothing existing is edited:
 *   src/styles/wla-lp-review.css   css/03-runtime.css (Sienna button above the mobile call bar)
 *                                  + the "readability" block at the end of css/60-lp.css
 *   src/scripts/wla-sharp-crops.js js/70-sizes.js (object-fit:cover crops get the right variant)
 * PAGES — the six /ads-landing-pages/ rows only:
 *   - data-seo: /media/… paths inside the base64 SEO payload -> their /uploads/… URLs (og:image 404)
 *   - all-on-6, 3-on-6: Leslie / Michael / Emily before-after -> the WordPress _large originals
 *   - thank-you-*: kicker, h1 and lead name the campaign ("Your All-on-6 consultation request is in.")
 *   - thank-you-3-on-6: hero 800px receptionist -> 2000px front-desk photo; two why-card photos
 *
 * PUBLISH GUARD: a publish ships the whole draft. It runs only if, apart from the six rows written
 * here and the shell, no row changed since the start of this run and the draft matched the
 * published site when the run began (--adopt skips the start check after a verified partial run).
 * Re-runnable: a second run finds nothing to change.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getPages, getSite, publish, publishStatus, toChangedPage, templateMap, assertTemplatesIntact, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.resolve(HERE, '../04-design/.tmp/site-src')
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const ADOPT = process.argv.includes('--adopt')
const P = 'ads-landing-pages/'

const mediaMap = JSON.parse(fs.readFileSync(path.join(HERE, '.tmp', 'media-map.json'), 'utf8')).map
const url = (name) => {
  const hit = mediaMap[`media/img/${name}`] ?? mediaMap[name]
  if (!hit) throw new Error(`media-map has no ${name}: run upload-media.mjs`)
  return hit.url
}
const baseName = (src) => String(src ?? '').split('/').pop().replace(/^[A-Za-z0-9_-]{21}-/, '')

// ── what changes ──────────────────────────────────────────────────────
const readability = fs.readFileSync(path.join(SRC, 'css/60-lp.css'), 'utf8')
const at = readability.indexOf('/* ---------- readability')
if (at < 0) throw new Error('css/60-lp.css has no readability block')
const ASSETS = [
  { type: 'style', path: 'src/styles/wla-lp-review.css', content: fs.readFileSync(path.join(SRC, 'css/03-runtime.css'), 'utf8').trimEnd() + '\n\n' + readability.slice(at).trimEnd() + '\n' },
  { type: 'script', path: 'src/scripts/wla-sharp-crops.js', content: fs.readFileSync(path.join(SRC, 'js/70-sizes.js'), 'utf8') },
]
const LARGE = ['case10_before_westlaimplants_leslie_barriere', 'case10_after_westlaimplants_leslie_barriere', 'case11_before_westlaimplants_emily_barriere', 'case11_after_westlaimplants_emily_barriere', 'case12_before_westlaimplants_michael_barriere', 'case12_after_westlaimplants_michael_barriere']
const SWAP_LARGE = Object.fromEntries(LARGE.map((n) => [`${n}.jpg`, `${n}_large.jpg`]))
const THANKS = {
  [`${P}thank-you-all-on-6`]: { kicker: 'All-on-6 consultation · request received', h1: 'Your All-on-6 consultation request is ', em: 'in.', lead: 'Thank you. Your request for an All-on-6 consultation with Dr. Barriere is with the front desk, and we reply within one business day. If you would rather not wait, call now and we will find a time together.' },
  [`${P}thank-you-3-on-6`]: { kicker: '3-on-6 consultation · request received', h1: 'Your 3-on-6 consultation request is ', em: 'in.', lead: 'Thank you. Your request for a 3-on-6 consultation with Dr. Barriere is with the front desk, and we reply within one business day. If you would rather not wait, call now and we will find a time together.' },
}
const OLD = { kicker: 'Request received', h1: 'Thank you. Let’s talk about your new ', em: 'smile.', lead: 'Your request is with the front desk, and we reply within one business day. If you would rather not wait, call now and we will find a time together.' }
// thank-you-3-on-6 photos: [old file, new file, focal class to drop, focal class to add]
const TY3_PHOTOS = [
  ['front-desk-receptionist.jpg', 'front-desk-emily.jpg', 'fp-40-40', 'fp-30-50'],
  ['barriere_dentalpractice_dentalimplant_westla3.jpg', 'tonybarrerie_headshot_dentist_westlaimplants1.jpg', null, 'fp-60-30'],
]
// front-desk-emily.jpg in the "Clear costs" card -> patient-paying.jpg. Matched by its card, because
// the hero above now carries the same file.
const TY3_COSTS = ['front-desk-emily.jpg', 'patient-paying.jpg']
const SLUGS = ['all-on-6', 'all-on-6-consultation', 'thank-you-all-on-6', '3-on-6', '3-on-6-consultation', 'thank-you-3-on-6'].map((s) => P + s)

// ── read ──────────────────────────────────────────────────────────────
const startStatus = await publishStatus()
if (!startStatus.draftMatchesPublished && !ADOPT) {
  console.error('REFUSING: the draft already differs from the published site, so someone has unpublished work in it. Publish or discard that first (or --adopt after proving the difference is this script\'s own).')
  process.exit(1)
}
const site = await getSite()
const shell = site.site
const rules = shell.styleRules ?? {}
const ruleByName = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)
const nameOf = (id) => rules[id]?.name
const { rows } = await getPages()
const startRows = new Map(rows.map((r) => [r.id, { seq: r.seq, updatedAt: r.updatedAt }]))
const log = []
const note = (s) => { log.push(s); console.log(s) }

// ── shell: the two code assets ────────────────────────────────────────
const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')
shell.files = shell.files ?? []
let shellChanged = false
for (const a of ASSETS) {
  const have = shell.files.find((f) => f.path === a.path)
  if (!have) {
    const now = new Date().toISOString()
    shell.files.push({ id: nanoid(), path: a.path, type: a.type, content: a.content, createdAt: now, updatedAt: now })
    shellChanged = true
    note(`shell   + ${a.type} ${a.path} (${a.content.length}c)`)
  } else if (have.content !== a.content) {
    have.content = a.content
    have.updatedAt = new Date().toISOString()
    shellChanged = true
    note(`shell   ~ ${a.path} refreshed`)
  } else note(`shell   ${a.path} exact`)
}
const bodyClass = ruleByName('is-lp')
note(`shell   body class .is-lp ${bodyClass ? 'in the registry' : 'MISSING (readability rules would not apply)'}`)

// ── pages ─────────────────────────────────────────────────────────────
const changed = []
for (const slug of SLUGS) {
  const row = rows.find((r) => r.slug === slug)
  if (!row) throw new Error(`no row ${slug}`)
  const nodes = row.cells.body.nodes
  const all = Object.values(nodes)
  let n = 0
  const say = (s) => { n++; note(`/${slug}  ${s}`) }

  // the body carries .is-lp
  const body = all.find((x) => x.moduleId === 'base.body')
  if (bodyClass && !(body.classIds ?? []).includes(bodyClass.id)) note(`/${slug}  WARNING: body has no .is-lp (${(body.classIds ?? []).map(nameOf).join('.')})`)

  // data-seo: /media/… -> /uploads/…
  for (const x of all.filter((x) => x.props?.htmlAttributes?.['data-seo'])) {
    const json = Buffer.from(x.props.htmlAttributes['data-seo'], 'base64').toString('utf8')
    const fixed = json.replace(/(https?:\/\/[^"/]+)?\/(media\/[^"?#]+)/g, (ref, origin, name) => {
      const hit = mediaMap[name]
      if (!hit) throw new Error(`/${slug} data-seo: no media-map entry for ${name}`)
      return `${origin ?? ''}${hit.url}`
    })
    if (fixed !== json) {
      x.props = { ...x.props, htmlAttributes: { ...x.props.htmlAttributes, 'data-seo': Buffer.from(fixed, 'utf8').toString('base64') } }
      say(`data-seo  ${(json.match(/\/media\/[^"?#]+/g) ?? []).map((m) => m.split('/').pop()).join(', ')} -> /uploads/`)
    }
  }

  // before/after originals (landing pages)
  for (const x of all.filter((x) => x.moduleId === 'base.image')) {
    const to = SWAP_LARGE[baseName(x.props?.src)]
    if (to) { say(`image ${x.id} ${baseName(x.props.src)} -> ${to}`); x.props = { ...x.props, src: url(to) } }
  }

  // thank-you copy
  const t = THANKS[slug]
  if (t) {
    const text = (s) => all.filter((x) => x.moduleId === 'base.text' && x.props?.text === s)
    for (const [k, tag] of [['kicker', 'span'], ['h1', 'none'], ['em', 'em'], ['lead', 'p']]) {
      if (k === 'em') continue
      const hit = text(OLD[k])
      if (hit.length === 1) { hit[0].props = { ...hit[0].props, text: t[k] }; say(`text  ${k}: "${OLD[k].slice(0, 40)}…" -> "${t[k].slice(0, 50)}…"`) }
      else if (text(t[k]).length === 1) note(`/${slug}  text ${k} already new`)
      else throw new Error(`/${slug}: expected one "${OLD[k]}" text node, found ${hit.length}`)
    }
    const h1Text = all.find((x) => x.props?.text === t.h1)
    const em = h1Text && nodes[h1Text.parentId].children.map((c) => nodes[c]).find((c) => c.props?.tag === 'em')
    if (!em) throw new Error(`/${slug}: no <em> beside the h1 text`)
    if (em.props.text === OLD.em) { em.props = { ...em.props, text: t.em }; say(`text  h1 em: "${OLD.em}" -> "${t.em}"`) }
    else if (em.props.text !== t.em) throw new Error(`/${slug}: h1 <em> reads "${em.props.text}"`)
  }

  // thank-you-3-on-6 photos
  if (slug === `${P}thank-you-3-on-6`) {
    for (const [from, to, drop, add] of TY3_PHOTOS) {
      const x = all.find((y) => y.moduleId === 'base.image' && baseName(y.props?.src) === from)
      if (!x) { note(`/${slug}  ${from} not on the page (already swapped?)`); continue }
      x.props = { ...x.props, src: url(to) }
      const ids = (x.classIds ?? []).filter((id) => nameOf(id) !== drop)
      if (add) {
        const r = ruleByName(add)
        if (!r) throw new Error(`registry has no .${add}`)
        if (!ids.includes(r.id)) ids.push(r.id)
      }
      x.classIds = ids
      say(`image ${x.id} ${from} -> ${to}  [${ids.map(nameOf).join('.')}]`)
    }
    const costs = all.find((y) => y.moduleId === 'base.image' && baseName(y.props?.src) === TY3_COSTS[0] && !(y.classIds ?? []).some((id) => nameOf(id) === 'par'))
    if (costs) { costs.props = { ...costs.props, src: url(TY3_COSTS[1]) }; say(`image ${costs.id} ${TY3_COSTS[0]} -> ${TY3_COSTS[1]} (Clear costs card)`) }
  }

  if (n) changed.push(row)
}

console.log(`\ntarget ${BASE}  shell seq ${site.seq} ${shellChanged ? 'changed' : 'unchanged'}  pages ${changed.length}: ${changed.map((r) => r.slug.replace(P, '')).join(', ') || 'none'}`)
if (!APPLY) { console.log('DRY RUN: nothing written. Re-run with --apply.'); process.exit(0) }

// ── backup, write, read back ──────────────────────────────────────────
if (changed.length || shellChanged) {
  const dir = path.join(HERE, '.tmp', `backup-${new Date().toISOString().slice(0, 10)}-pre-lp-review`)
  fs.mkdirSync(dir, { recursive: true })
  const pristine = await getSite()
  fs.writeFileSync(path.join(dir, 'shell.json'), JSON.stringify(pristine, null, 1))
  const fresh = (await getPages()).rows
  for (const r of changed) fs.writeFileSync(path.join(dir, `${r.slug.replace(/\//g, '__')}.json`), JSON.stringify(fresh.find((x) => x.id === r.id), null, 1))
  fs.writeFileSync(path.join(dir, 'CHANGES.txt'), log.join('\n') + '\n')
  console.log(`backup  ${path.relative(HERE, dir)}`)

  const templates = await templateMap()
  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: shell,
    changedPages: changed.map((r) => ({ ...toChangedPage(r), status: 'published', cells: { ...r.cells } })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])), shellBaseSeq: site.seq,
  })
  console.log(`saved   ${JSON.stringify(res).slice(0, 160)}`)

  const back = (await getPages()).rows
  for (const r of changed) {
    const b = back.find((x) => x.id === r.id)
    const want = JSON.stringify(r.cells.body.nodes), got = JSON.stringify(b.cells.body.nodes)
    console.log(`check   /${b.slug}: ${want === got ? 'nodes as written' : 'NODES DIFFER from what was written'}`)
  }
  const after = await getSite()
  for (const a of ASSETS) console.log(`check   ${a.path}: ${after.site.files.find((f) => f.path === a.path)?.content === a.content ? 'exact' : 'MISSING or different'}`)
  console.log(`check   shell files ${after.site.files.map((f) => f.path).join(', ')}`)
  await assertTemplatesIntact(templates)
  console.log(`check   templates intact (${Object.keys(templates).length})`)
}

// ── publish, guarded ──────────────────────────────────────────────────
if (PUBLISH) {
  const mine = new Set(changed.map((r) => r.id))
  const now = (await getPages()).rows
  const others = now.filter((r) => !mine.has(r.id) && (startRows.get(r.id)?.seq !== r.seq || startRows.get(r.id)?.updatedAt !== r.updatedAt))
  const fresh = now.filter((r) => !startRows.has(r.id))
  if (others.length || fresh.length) {
    console.error(`REFUSING to publish: rows changed by someone else during this run: ${[...others, ...fresh].map((r) => r.slug).join(', ')}`)
    process.exit(1)
  }
  console.log('publish', JSON.stringify(await publish()).slice(0, 160))
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const st = await publishStatus()
    const s = JSON.stringify(st)
    if (!/running|pending|in_progress|building/i.test(s)) { console.log('status ', s.slice(0, 200)); break }
    if (i % 5 === 4) console.log('status ', s.slice(0, 120))
  }
}
