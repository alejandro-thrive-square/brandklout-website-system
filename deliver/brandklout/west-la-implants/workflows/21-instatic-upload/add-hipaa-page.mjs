#!/usr/bin/env node
/**
 * add-hipaa-page.mjs — ONE new page, /hipaa-disclosure, written page-only.
 *
 *   node add-hipaa-page.mjs                      # dry run
 *   node add-hipaa-page.mjs --apply              # write the draft (page + its SEO cells)
 *   node add-hipaa-page.mjs --apply --publish    # ...and publish
 *
 * An injection, not a push: no other page, no component, no shell rule and no
 * site.js is written. The page is the /privacy-policy row cloned (same chrome:
 * nav, drawer, footer, mobile bar, the same cover and invitation chapters) with
 * the two detail chapters replaced by the journal's prose chapter carrying the
 * notice. Text: 04-design/.tmp/site-src/lib/hipaa-notice.mjs, the same list the
 * build renders, so a later full push produces the same page.
 *
 * Guards, because other agents work on this instance:
 *   - publish is site-wide on Instatic, so the script REFUSES unless the draft
 *     matched the published site before the write (publish/status
 *     draftMatchesPublished) and no other row or the shell moved between the
 *     read and the publish. If either fails it stops before publishing.
 *   - re-runnable: an existing hipaa-disclosure row is rebuilt in place.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getPages, getSite, publish, publishStatus, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'
import { NOTICE, ASIDE } from '../04-design/.tmp/site-src/lib/hipaa-notice.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(HERE, '../04-design/.tmp/site-src/dist')
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')

const SLUG = 'hipaa-disclosure'
const TITLE = 'HIPAA Disclosure | West LA Implants'
const SEO = JSON.parse(fs.readFileSync(path.resolve(HERE, '../04-design/.tmp/site-src/seo.json'), 'utf8')).pages[SLUG]
if (!SEO || SEO.title !== TITLE) throw new Error('seo.json has no hipaa-disclosure entry — run node build.mjs --strict first')

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')
const dataSeo = (file) => fs.readFileSync(path.join(DIST, file), 'utf8').match(/data-seo="([^"]+)"/)?.[1]

// ── read ─────────────────────────────────────────────────────────────
const status0 = await publishStatus()
const site = await getSite()
const { rows } = await getPages()
const rules = site.site.styleRules ?? {}
const nameOf = (id) => rules[id]?.name
const ruleId = (name) => {
  const r = Object.values(rules).find((x) => x.kind === 'class' && x.name === name)
  if (!r) throw new Error(`no .${name} class rule on the shell`)
  return r.id
}
const privacy = rows.find((r) => r.slug === 'privacy-policy')
if (!privacy) throw new Error('no privacy-policy row')
const existing = rows.find((r) => r.slug === SLUG)
console.log(`target ${BASE}  shell seq ${site.seq}  rows ${rows.length}  draftMatchesPublished ${status0.draftMatchesPublished}  existing ${existing ? existing.id : 'none'}`)

// The build must mirror live, or a data-seo taken from dist/ is a guess.
{
  const liveSeo = Object.values(privacy.cells.body.nodes).find((n) => n.props?.htmlAttributes?.['data-seo'])?.props.htmlAttributes['data-seo']
  if (liveSeo !== dataSeo('privacy-policy.html')) throw new Error('dist/privacy-policy.html data-seo differs from the live privacy page — rebuild, or the build has drifted')
}
const SEO_ATTR = dataSeo(`${SLUG}.html`)
if (!SEO_ATTR) throw new Error(`dist/${SLUG}.html has no data-seo — run node build.mjs --strict`)

// ── clone the privacy page with fresh ids ───────────────────────────
const src = privacy.cells.body.nodes
const idMap = new Map(Object.keys(src).map((id) => [id, nanoid()]))
const nodes = {}
for (const [id, n] of Object.entries(src)) {
  const c = structuredClone(n)
  c.id = idMap.get(id)
  if (c.parentId) c.parentId = idMap.get(c.parentId)
  c.children = (c.children ?? []).map((x) => idMap.get(x))
  nodes[c.id] = c
}
const rootNodeId = idMap.get(privacy.cells.body.rootNodeId)
const hasClass = (n, c) => (n?.classIds ?? []).some((x) => nameOf(x) === c)
const find = (pred) => Object.values(nodes).filter(pred)
const dropSubtree = (id) => { for (const c of nodes[id]?.children ?? []) dropSubtree(c); delete nodes[id] }

const mk = (parentId, moduleId, props, classIds = []) => {
  const n = { id: nanoid(), moduleId, parentId, classIds, children: [], breakpointOverrides: {}, props: { htmlAttributes: {}, ...props } }
  nodes[n.id] = n
  if (parentId) nodes[parentId].children.push(n.id)
  return n
}
const text = (parentId, t, tag = 'none', classIds = []) => mk(parentId, 'base.text', { text: t, tag }, classIds)
const box = (parentId, tag, classIds = [], attrs = {}) => {
  const standard = ['div', 'section', 'article', 'aside', 'ul', 'ol', 'main', 'header', 'footer', 'nav']
  return mk(parentId, 'base.container', { tag: standard.includes(tag) ? tag : 'custom', customTag: standard.includes(tag) ? '' : tag, htmlAttributes: attrs }, classIds)
}

// <main>: the page's own SEO object (js/80-seo.js reads it)
const main = find((n) => n.props?.htmlAttributes?.['data-seo'])[0]
main.props.htmlAttributes = { ...main.props.htmlAttributes, 'data-seo': SEO_ATTR }

// cover: kicker, h1, lead
const cover = nodes[main.children[0]]
if (!hasClass(cover, 'b-cover')) throw new Error('first chapter is not the cover')
const desc = (id, out = []) => { out.push(nodes[id]); for (const c of nodes[id].children) desc(c, out); return out }
const coverNodes = desc(cover.id)
const kicker = coverNodes.find((n) => hasClass(n, 'chapter-tag'))
nodes[kicker.children.find((c) => nodes[c].moduleId === 'base.text')].props.text = 'Notice of Privacy Practices'
const h1 = coverNodes.find((n) => n.props?.customTag === 'h1')
for (const c of [...h1.children]) dropSubtree(c)
h1.children = []
text(h1.id, 'HIPAA ')
text(h1.id, 'Disclosure', 'em')
const lead = coverNodes.find((n) => hasClass(n, 'cv-lead'))
lead.props.text = 'How medical information about you may be used and disclosed, and how you can get access to it. Effective October 1, 2026.'

// the two detail chapters out, the prose chapter in
const details = main.children.filter((c) => hasClass(nodes[c], 'b-detail'))
if (details.length !== 2) throw new Error(`expected 2 detail chapters on the privacy page, found ${details.length}`)
for (const d of details) dropSubtree(d)
main.children = main.children.filter((c) => !details.includes(c))

const section = box(main.id, 'section', [ruleId('b-prose')], { 'data-chapter': '1', 'data-chapter-name': 'The Notice', id: 'notice' })
// box() appended it; move it to sit right after the cover
main.children = [main.children[0], section.id, ...main.children.slice(1).filter((c) => c !== section.id)]
const wrap = box(section.id, 'div', [ruleId('wrap'), ruleId('pr2-in')])
const article = box(wrap.id, 'article', [ruleId('pr2-body')])
const aside = box(wrap.id, 'aside', [ruleId('pr2-aside')])
text(box(aside.id, 'div', [ruleId('kicker')]).id, ASIDE.kicker)
for (const [href, label] of ASIDE.links) mk(aside.id, 'base.link', { href, text: label, target: '_self' })

const runs = (parentId, list) => {
  for (const r of [].concat(list)) {
    if (typeof r === 'string') text(parentId, r)
    else if (r.br) box(parentId, 'br')
    else if (r.b) text(box(parentId, 'b').id, r.b)
    else if (r.em) text(parentId, r.em, 'em')
    else mk(parentId, 'base.link', { href: r.href, text: r.a, target: '_self' })
  }
}
const H3 = ruleId('h3'), COL = ruleId('dt-col')
const put = (parentId, it) => {
  if (it.h2) text(parentId, it.h2, 'h2')
  else if (it.p) {
    if (it.p.length === 1 && typeof it.p[0] === 'string') text(parentId, it.p[0], 'p')
    else runs(box(parentId, 'p').id, it.p)
  } else if (it.ul) {
    const ul = box(parentId, 'ul')
    for (const li of it.ul) runs(box(ul.id, 'li').id, li)
  } else {
    const col = box(parentId, 'div', [COL])
    text(col.id, it.sub, 'h3', [H3])
    for (const x of it.items) put(col.id, x)
  }
}
for (const it of NOTICE) put(article.id, it)

// invitation: renumber the chapter
const invite = nodes[main.children[2]]
if (!hasClass(invite, 'ch-invitation')) throw new Error('third chapter is not the invitation')
invite.props.htmlAttributes = { ...invite.props.htmlAttributes, 'data-chapter': '2' }

// sanity: every child resolves, every parent agrees
for (const n of Object.values(nodes)) {
  for (const c of n.children) if (nodes[c]?.parentId !== n.id) throw new Error(`broken link ${n.id} -> ${c}`)
  if (n.parentId && !nodes[n.parentId]) throw new Error(`orphan ${n.id}`)
}
const count = Object.keys(nodes).length
console.log(`page   /${SLUG}  ${count} nodes (privacy ${Object.keys(src).length}), chapters ${main.children.map((c) => nodes[c].props.htmlAttributes?.id).join(' > ')}`)

if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!status0.draftMatchesPublished) {
  console.error('REFUSING: the draft already differs from the published site (someone else has unpublished edits). Nothing written.')
  process.exit(1)
}

// ── write the page ──────────────────────────────────────────────────
const pageId = existing?.id ?? nanoid()
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: site.site,
  changedPages: [{ id: pageId, slug: SLUG, title: TITLE, nodes, rootNodeId, status: 'published' }],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [pageId]: existing?.seq ?? 0 }, shellBaseSeq: site.seq,
})
console.log(`saved  ${JSON.stringify(res).slice(0, 160)}`)

// SEO cells: PATCH replaces cells whole, so read, merge, send all of it back (flat slug: safe)
{
  const cur = await api('GET', `/admin/api/cms/data/rows/${pageId}`)
  const cells = { ...(cur.row?.cells ?? {}) }
  if (!cells.body || cells.slug !== SLUG) throw new Error(`row ${pageId} is missing body/slug before the SEO merge — refusing`)
  cells.seoTitle = SEO.title
  cells.seoDescription = SEO.description
  await api('PATCH', `/admin/api/cms/data/rows/${pageId}`, { cells })
  const back = (await api('GET', `/admin/api/cms/data/rows/${pageId}`)).row.cells
  const n = Object.keys(back.body?.nodes ?? {}).length
  if (back.slug !== SLUG || n !== count) throw new Error(`row lost content after the SEO write (slug "${back.slug}", ${n} nodes)`)
  console.log(`seo    ok (${n} nodes intact, slug ${back.slug})`)
}

// ── nothing else moved? ─────────────────────────────────────────────
const after = await getSite()
const rowsAfter = (await getPages()).rows
const before = new Map(rows.map((r) => [r.id, `${r.seq}|${r.updatedAt}`]))
const moved = rowsAfter.filter((r) => r.id !== pageId && before.get(r.id) !== `${r.seq}|${r.updatedAt}`).map((r) => r.slug)
const gone = rows.filter((r) => r.id !== pageId && !rowsAfter.some((x) => x.id === r.id)).map((r) => r.slug)
const shellSame = JSON.stringify(after.site) === JSON.stringify(site.site)
console.log(`check  rows ${rows.length} -> ${rowsAfter.length}, other rows moved [${moved.join(', ')}], gone [${gone.join(', ')}], shell ${shellSame ? 'unchanged' : 'CHANGED'} (seq ${site.seq} -> ${after.seq})`)

if (!PUBLISH) process.exit(0)
if (moved.length || gone.length || !shellSame) {
  console.error('REFUSING to publish: something other than this page changed since the read. The draft is written; publish by hand once the other change is understood.')
  process.exit(1)
}
console.log('publish', JSON.stringify(await publish()).slice(0, 160))
for (let i = 0; i < 60; i++) {
  await new Promise((r) => setTimeout(r, 3000))
  const s = JSON.stringify(await publishStatus())
  if (!/running|pending|in_progress|building/i.test(s)) { console.log('status ', s.slice(0, 200)); break }
}
