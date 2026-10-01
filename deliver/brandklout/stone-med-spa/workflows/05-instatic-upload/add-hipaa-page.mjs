#!/usr/bin/env node
/**
 * add-hipaa-page.mjs — ONE new page, /hipaa-disclosure (the HHS model Notice of Privacy
 * Practices), written into ONE instance's draft over the admin API. An injection, not a push.
 *
 *   node add-hipaa-page.mjs                       dry run against INSTATIC_BASE_URL
 *   node add-hipaa-page.mjs --apply               back up, write the draft page + SEO cells
 *   node add-hipaa-page.mjs --apply --publish     ... and publish, after the guard below
 *
 *   INSTATIC_BASE_URL=https://staging.westlaketxmedspa.com node add-hipaa-page.mjs --apply --publish
 *   node add-hipaa-page.mjs --apply --publish     (production: the worktree .env's host)
 *
 * THE PAGE. A clone of this instance's own /privacy-policy row — same navbar, drawer, hero,
 * aside (effective date, questions, "On this page"), contact CTA and footer, same class rules —
 * with the legal column swapped for the notice. The text is hipaa/hhs-model-notice.reference.html
 * (the Webflow sites' /hipaa-disclosure, fetched 2026-10-01) VERBATIM, except the practice parts:
 * entity/display name, address, phone, website, effective date. The reference's own "Effective
 * Date" line moves to the aside, where the privacy page carries it. Every node gets a fresh id;
 * class ids are read off this instance's privacy page, never hardcoded, so staging and
 * production each get their own.
 *
 * ENTITY. Neither the Privacy Policy nor the Terms here names a legal entity (both say
 * "Westlake Medical Aesthetics"), and the site gives no email — so the practice name stands in
 * and the Email line is left out. Change ENTITY / EMAIL below the day the client supplies them.
 *
 * PUBLISH GUARD. Publishing is whole-site. It goes ahead only if the draft matched live BEFORE
 * this write (`draftMatchesPublished`) and, just before publishing, no other page row and no
 * shell seq moved since the read — so it can only ever publish this page. Otherwise it stops.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, publish, publishStatus, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')

const SLUG = 'hipaa-disclosure'
const DISPLAY = 'Westlake Medical Aesthetics'
const ENTITY = DISPLAY // no legal entity stated on the site — flagged in the runbook
const EMAIL = '' // none published on the site
const PHONE = { href: 'tel:+18176742061', text: '(817) 674-2061' }
const ADDRESS = ['72 Andorra Dr, Suite 110B', 'Westlake, TX 76262']
const WEBSITE = { href: 'https://westlaketxmedspa.com', text: 'westlaketxmedspa.com' }
const EFFECTIVE = 'October 1, 2026'
const TITLE = `HIPAA Disclosure | ${DISPLAY}`
const DESCRIPTION = `Notice of Privacy Practices for ${DISPLAY} in Westlake, TX: how your medical information may be used and disclosed, and how you can get access to it.`
const LEDE = 'How medical information about you may be used and disclosed, and how you can get access to this information.'

const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

/* ---------- 1. the reference, parsed into blocks ---------- */
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
// inline -> [{t:'text'|'strong'|'em'|'br'|'a', text, href}]
const inline = (html) => {
  const out = []
  const re = /<(strong|em)>([\s\S]*?)<\/\1>|<a href="([^"]+)">([\s\S]*?)<\/a>|<br\s*\/?>|([^<]+)/g
  let m
  while ((m = re.exec(html))) {
    if (m[1]) out.push({ t: m[1], text: decode(m[2]) })
    else if (m[3]) out.push({ t: 'a', href: m[3], text: decode(m[4]) })
    else if (m[5] !== undefined) out.push({ t: 'text', text: decode(m[5]) })
    else out.push({ t: 'br' })
  }
  return out
}
const ref = fs.readFileSync(path.join(HERE, 'hipaa', 'hhs-model-notice.reference.html'), 'utf8')
const article = ref.match(/<article>([\s\S]*)<\/article>/)[1]
const blocks = []
{
  const re = /<(p|h2|h3|ul)[^>]*>([\s\S]*?)<\/\1>/g
  let m
  while ((m = re.exec(article))) {
    if (m[1] === 'ul') blocks.push({ k: 'ul', items: [...m[2].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => inline(x[1])) })
    else blocks.push({ k: m[1], parts: inline(m[2]) })
  }
}
const plain = (b) => (b.parts ?? b.items.flat()).map((p) => p.text ?? '').join('')

/* ---------- 2. the practice swaps, each asserted to have matched exactly once ---------- */
{
  const i = blocks.findIndex((b) => b.k === 'p' && /^Effective Date:/.test(plain(b)))
  if (i !== 0) throw new Error('reference: the Effective Date line is not the first block')
  blocks.splice(i, 1) // carried by the aside instead
}
{
  const b = blocks[0]
  const want = 'This Notice of Privacy Practices applies to Stone Surgical Arts PLLC (“Stone Dental Implant Center,” “we,” “us,” or “our”).'
  if (!b.parts[0].text.startsWith(want)) throw new Error(`reference: unexpected opening sentence: ${b.parts[0].text.slice(0, 120)}`)
  const who = ENTITY === DISPLAY ? `${ENTITY} (“we,” “us,” or “our”).` : `${ENTITY} (“${DISPLAY},” “we,” “us,” or “our”).`
  b.parts[0].text = b.parts[0].text.replace(want, `This Notice of Privacy Practices applies to ${who}`)
  b.lead = true
}
{
  const i = blocks.findIndex((b) => b.k === 'p' && b.parts[0]?.t === 'strong' && /PLLC$/.test(b.parts[0].text) && b.parts.some((p) => p.t === 'br'))
  if (i < 0) throw new Error('reference: no contact block')
  blocks[i] = { k: 'address' }
}
{
  const leftover = blocks.map((b) => (b.k === 'address' ? '' : plain(b))).join(' ')
  const bad = ['Stone', 'PLLC', '110A', '383-8361', 'stonesurgicalarts', 'September 28'].filter((w) => leftover.includes(w))
  if (bad.length) throw new Error(`reference: practice text left after the swaps: ${bad.join(', ')}`)
}

/* ---------- 3. read the instance ---------- */
const status0 = await publishStatus()
const siteRes = await getSite()
const pagesRes = await getPages()
const { site: shell, seq } = siteRes
const rows = pagesRes.rows ?? []
console.log(`${BASE}\nstatus   draftMatchesPublished=${status0.draftMatchesPublished} draft=${status0.draftPages} published=${status0.publishedPages}; shell seq ${seq}`)

const ppRow = rows.find((r) => r.slug === 'privacy-policy')
if (!ppRow) throw new Error('no /privacy-policy page to clone')
const pp = (await api('GET', `/admin/api/cms/data/rows/${ppRow.id}`)).row
const existing = rows.find((r) => r.slug === SLUG)

const src = pp.cells.body.nodes
const all = Object.values(src)
const one = (pred, what) => {
  const hit = all.filter(pred)
  if (hit.length < 1) throw new Error(`privacy page: no ${what}`)
  return hit[0]
}
const at = (id) => src[id]

// class ids, read off the privacy page of THIS instance
const secProto = one((n) => n.props?.htmlAttributes?.id === 'collect', 'section #collect')
const h2Proto = at(secProto.children[0])
const numProto = at(h2Proto.children[0])
const h3Proto = one((n) => n.moduleId === 'base.text' && n.props?.tag === 'h3', 'h3')
const ulProto = one((n) => n.props?.tag === 'ul' && n.parentId === secProto.id, 'ul')
const addrProto = one((n) => n.props?.customTag === 'address', 'address')
const introDiv = one((n) => n.props?.tag === 'div' && n.children?.[0] && at(n.children[0])?.props?.text?.includes('respects your privacy'), 'intro column')
const leadProto = at(introDiv.children[0])
const column = at(introDiv.parentId)
const tocOl = one((n) => n.props?.tag === 'ol' && at(n.parentId)?.props?.htmlAttributes?.['aria-label'] === 'On this page', 'TOC list')
const tocLinkProto = at(at(tocOl.children[0]).children[0])
const tocNumProto = at(tocLinkProto.children[0])
const h1 = one((n) => n.props?.customTag === 'h1', 'h1')
const lede = one((n) => n.props?.text === 'What we collect when you use this website, why we collect it, who we share it with and the choices you have.', 'hero lede')
const dateLabel = one((n) => n.props?.text === 'Effective date', 'aside "Effective date"')
const dateNode = at(at(dateLabel.parentId).children[at(dateLabel.parentId).children.indexOf(dateLabel.id) + 1])

/* ---------- 4. node factories (shapes as the importer makes them; children:[] always) ---------- */
const nodes = structuredClone(src)
const put = (n) => { nodes[n.id] = n; return n.id }
const text = (parentId, t, tag = 'none', classIds = []) => put({ id: nid(), moduleId: 'base.text', props: { text: t, tag, htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds, parentId })
const box = (parentId, props, classIds = []) => ({ id: nid(), moduleId: 'base.container', props: { tag: 'div', customTag: '', htmlAttributes: {}, ...props }, breakpointOverrides: {}, children: [], classIds, parentId })
const link = (parentId, href, t) => {
  const ext = /^https?:/.test(href) && !href.startsWith(WEBSITE.href)
  return put({ id: nid(), moduleId: 'base.link', props: { href, text: t, target: ext ? '_blank' : '_self', htmlAttributes: ext ? { rel: 'noopener' } : {} }, breakpointOverrides: {}, children: [], classIds: [], parentId })
}
const inlineInto = (el, parts) => {
  for (const p of parts) {
    if (p.t === 'text') el.children.push(text(el.id, p.text))
    else if (p.t === 'strong' || p.t === 'em') el.children.push(text(el.id, p.text, p.t))
    else if (p.t === 'a') el.children.push(link(el.id, p.href, p.text))
    else el.children.push(put(box(el.id, { tag: 'custom', customTag: 'br' })))
  }
}
const para = (parentId, parts, classIds = []) => {
  if (parts.length === 1 && parts[0].t === 'text') return text(parentId, parts[0].text, 'p', classIds)
  const p = box(parentId, { tag: 'custom', customTag: 'p' }, classIds)
  inlineInto(p, parts)
  return put(p)
}
const block = (parentId, b) => {
  if (b.k === 'p') return para(parentId, b.parts, b.lead ? leadProto.classIds : [])
  if (b.k === 'h3') return text(parentId, plain(b), 'h3', h3Proto.classIds)
  if (b.k === 'ul') {
    const ul = box(parentId, { tag: 'ul' }, ulProto.classIds)
    for (const item of b.items) {
      const li = box(ul.id, { tag: 'custom', customTag: 'li' })
      inlineInto(li, item)
      ul.children.push(put(li))
    }
    return put(ul)
  }
  if (b.k === 'address') {
    const a = box(parentId, { tag: 'custom', customTag: 'address' }, addrProto.classIds)
    const br = () => a.children.push(put(box(a.id, { tag: 'custom', customTag: 'br' })))
    a.children.push(text(a.id, ENTITY))
    for (const line of ADDRESS) { br(); a.children.push(text(a.id, ` ${line}`)) }
    br(); a.children.push(text(a.id, ' Phone: ')); a.children.push(link(a.id, PHONE.href, PHONE.text))
    if (EMAIL) { br(); a.children.push(text(a.id, ' Email: ')); a.children.push(link(a.id, `mailto:${EMAIL}`, EMAIL)) }
    br(); a.children.push(text(a.id, ' Website: ')); a.children.push(link(a.id, WEBSITE.href, WEBSITE.text))
    return put(a)
  }
  throw new Error(`unknown block ${b.k}`)
}
const dropSubtree = (id) => { for (const c of nodes[id]?.children ?? []) dropSubtree(c); delete nodes[id] }

/* ---------- 5. swap the legal column, the TOC, the hero and the aside date ---------- */
const SECTION_IDS = ['rights-summary', 'choices-summary', 'uses-summary', 'your-rights', 'your-choices', 'our-uses', 'other-uses', 'responsibilities', 'notice-changes']
for (const c of nodes[column.id].children) dropSubtree(c)
nodes[column.id].children = []
const intro = box(column.id, {}, introDiv.classIds)
let current = intro
const sections = []
for (const b of blocks) {
  if (b.k === 'h2') {
    const n = sections.length
    const sec = box(column.id, { tag: 'section', htmlAttributes: { id: SECTION_IDS[n] } }, secProto.classIds)
    const h2 = box(sec.id, { tag: 'custom', customTag: 'h2' }, h2Proto.classIds)
    h2.children.push(text(h2.id, String(n + 1).padStart(2, '0'), 'span', numProto.classIds), text(h2.id, plain(b)))
    sec.children.push(put(h2))
    sections.push({ sec, title: plain(b) })
    current = sec
    continue
  }
  current.children.push(block(current.id, b))
}
if (sections.length !== SECTION_IDS.length) throw new Error(`expected ${SECTION_IDS.length} h2 sections, got ${sections.length}`)
nodes[column.id].children = [put(intro), ...sections.map((s) => put(s.sec))]

for (const c of nodes[tocOl.id].children) dropSubtree(c)
nodes[tocOl.id].children = sections.map((s, i) => {
  const li = box(tocOl.id, { tag: 'custom', customTag: 'li' })
  const a = { id: nid(), moduleId: 'base.link', props: { href: `#${SECTION_IDS[i]}`, target: '_self', htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: tocLinkProto.classIds, parentId: li.id }
  a.children.push(text(a.id, String(i + 1).padStart(2, '0'), 'span', tocNumProto.classIds), text(a.id, s.title, 'span'))
  li.children.push(put(a))
  return put(li)
})

{
  const [a, em, dot] = nodes[h1.id].children.map((id) => nodes[id])
  if (a?.props?.text !== 'Privacy ' || em?.props?.tag !== 'em' || dot?.props?.text !== '.') throw new Error('privacy h1 is not "Privacy <em>policy</em>."')
  a.props.text = 'HIPAA '
  em.props.text = 'disclosure'
}
nodes[lede.id].props.text = LEDE
if (!/^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(nodes[dateNode.id].props?.text ?? '')) throw new Error('aside date node is not a date')
nodes[dateNode.id].props.text = EFFECTIVE

// the footer's Privacy link carries aria-current="page" on the privacy page only
for (const n of Object.values(nodes)) if (n.props?.htmlAttributes && 'aria-current' in n.props.htmlAttributes) delete n.props.htmlAttributes['aria-current']

/* ---------- 6. fresh ids for every node, so nothing is shared with /privacy-policy ---------- */
const map = new Map(Object.keys(nodes).map((id) => [id, src[id] ? nid() : id]))
const body = {}
for (const n of Object.values(nodes)) {
  const m = { ...n, id: map.get(n.id), parentId: n.parentId == null ? n.parentId : map.get(n.parentId), children: (n.children ?? []).map((c) => map.get(c)) }
  if (m.children.some((c) => !c)) throw new Error(`dangling child under ${n.id}`)
  body[m.id] = m
}
const rootNodeId = map.get(pp.cells.body.rootNodeId)
{
  const seen = new Set()
  const walk = (id) => { if (seen.has(id)) throw new Error(`cycle at ${id}`); seen.add(id); for (const c of body[id].children) walk(c) }
  walk(rootNodeId)
  if (seen.size !== Object.keys(body).length) throw new Error(`${Object.keys(body).length - seen.size} unreachable node(s)`)
}

const pageId = existing?.id ?? nid()
const words = Object.values(body).map((n) => n.props?.text ?? '').join(' ')
console.log(`page     /${SLUG} ${existing ? `exists (seq ${existing.seq}) -> rewrite` : 'NEW'} id ${pageId}; ${Object.keys(body).length} nodes (privacy ${all.length}); ${sections.length} sections; ${words.split(/\s+/).length} words`)
console.log(`title    ${TITLE}\nentity   ${ENTITY}${ENTITY === DISPLAY ? ' (practice name — no legal entity on the site)' : ''}`)
const out = path.join(HERE, '.tmp', `hipaa-${/staging/.test(BASE) ? 'staging' : 'prod'}-nodes.json`)
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify({ rootNodeId, nodes: body }))
if (!APPLY) { console.log(`DRY RUN — nodes in ${path.relative(HERE, out)}. Re-run with --apply.`); process.exit(0) }

/* ---------- 7. backup, write, SEO cells ---------- */
const label = /staging/.test(BASE) ? 'staging' : 'prod'
// The shell seq at a moment the draft matched live. Clean now: this read. Not clean (a re-run
// after this page was written but not published): the newest backup whose status.json says the
// draft matched — and then the only acceptable difference is this page itself.
const otherDirty = (list) => list.filter((r) => r.id !== pageId && (r.status !== 'published' || !r.publishedAt || r.updatedAt > r.publishedAt)).map((r) => `/${r.slug}`)
let cleanShellSeq = status0.draftMatchesPublished ? seq : null
if (cleanShellSeq == null) {
  const dirs = fs.readdirSync(path.join(HERE, '.tmp')).filter((d) => d.startsWith(`backup-${label}-`) && d.includes('-pre-hipaa')).sort().reverse()
  for (const d of dirs) {
    const f = path.join(HERE, '.tmp', d, 'status.json')
    if (fs.existsSync(f) && JSON.parse(fs.readFileSync(f, 'utf8')).draftMatchesPublished) { cleanShellSeq = JSON.parse(fs.readFileSync(path.join(HERE, '.tmp', d, 'site.json'), 'utf8')).seq; break }
  }
  const dirty = otherDirty(rows)
  console.log(`baseline draft differs from live; clean shell seq on record ${cleanShellSeq ?? 'none'}; other unpublished pages: ${dirty.join(' ') || 'none'}`)
  if (PUBLISH && (!existing || cleanShellSeq !== seq || dirty.length)) throw new Error('the draft differs from live by more than this page — publishing would carry someone else\'s edits. Stopped before writing.')
}
const bak = path.join(HERE, '.tmp', `backup-${label}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}-seq${seq}-pre-hipaa`)
if (fs.existsSync(bak)) throw new Error(`${path.relative(HERE, bak)} already exists — refusing to overwrite a snapshot`)
fs.mkdirSync(bak, { recursive: true })
fs.writeFileSync(path.join(bak, 'site.json'), JSON.stringify(siteRes))
fs.writeFileSync(path.join(bak, 'pages.json'), JSON.stringify(pagesRes))
fs.writeFileSync(path.join(bak, 'status.json'), JSON.stringify(status0))
console.log(`backup   ${path.relative(HERE, bak)}`)

const before = new Map(rows.filter((r) => r.id !== pageId).map((r) => [r.id, `${r.seq}|${r.updatedAt}`]))
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: [{ id: pageId, slug: SLUG, title: TITLE, nodes: body, rootNodeId }],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: existing ? { [pageId]: existing.seq ?? 0 } : {},
  shellBaseSeq: seq,
})
console.log(`saved    ${JSON.stringify(res).slice(0, 200)}`)

{
  const cur = await api('GET', `/admin/api/cms/data/rows/${pageId}`)
  const cells = { ...(cur.row?.cells ?? {}) }
  if (!cells.body || cells.slug !== SLUG) throw new Error(`/${SLUG}: row missing body/slug before the SEO merge — refusing to write`)
  cells.seoTitle = TITLE
  cells.seoDescription = DESCRIPTION
  await api('PATCH', `/admin/api/cms/data/rows/${pageId}`, { cells })
  const ac = (await api('GET', `/admin/api/cms/data/rows/${pageId}`)).row.cells
  const n = Object.keys(ac.body?.nodes ?? {}).length
  if (ac.slug !== SLUG || n !== Object.keys(body).length || ac.seoTitle !== TITLE || ac.seoDescription !== DESCRIPTION) throw new Error(`/${SLUG}: row wrong after the SEO write (slug=${ac.slug}, nodes=${n})`)
  console.log(`seo      title + description set (${n} nodes intact)`)
}

/* ---------- 8. publish guard: nothing but this page moved ---------- */
const after = (await getPages()).rows
const moved = after.filter((r) => r.id !== pageId && before.get(r.id) !== `${r.seq}|${r.updatedAt}`).map((r) => `/${r.slug}`)
const added = after.filter((r) => r.id !== pageId && !before.has(r.id)).map((r) => `/${r.slug}`)
const gone = [...before.keys()].filter((id) => !after.some((r) => r.id === id))
// An unchanged shell keeps its seq through an incremental save; `res.seq` is the document's.
const shellNow = (await getSite()).seq
const dirtyNow = otherDirty(after)
console.log(`guard    other pages moved: ${moved.length ? moved.join(' ') : 'none'}; unpublished: ${dirtyNow.join(' ') || 'none'}; added: ${added.join(' ') || 'none'}; removed: ${gone.length}; shell seq ${shellNow} (clean ${cleanShellSeq})`)
if (!PUBLISH) { console.log('draft written; not publishing (no --publish)'); process.exit(0) }
if (moved.length || dirtyNow.length || added.length || gone.length || shellNow !== cleanShellSeq) {
  console.log('NOT PUBLISHING: something other than this page changed in the draft since it was read.')
  process.exit(1)
}
console.log(`publish  ${JSON.stringify(await publish()).slice(0, 200)}`)
console.log(`status   ${JSON.stringify(await publishStatus())}`)
