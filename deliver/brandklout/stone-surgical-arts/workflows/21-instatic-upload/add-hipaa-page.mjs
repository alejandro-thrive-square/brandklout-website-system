/**
 * Add ONE page, /hipaa-disclosure, to a live Instatic instance without a re-import.
 *
 *   node add-hipaa-page.mjs                       dry run: convert, self-test, print the plan
 *   node add-hipaa-page.mjs --apply               write the draft page (+ SEO cells)
 *   node add-hipaa-page.mjs --apply --publish     ...and publish
 *   INSTATIC_BASE_URL=https://staging.dfwsurgicalarts.com node add-hipaa-page.mjs …
 *
 * WHY NOT push-site.mjs. push-site writes in `replace` mode: every page, the
 * shell, and any admin edit with them. This is a one-page injection.
 *
 * HOW. The page is the instance's own /privacy-policy row with fresh node
 * ids (so the navbar, drawer and footer are exactly what that instance serves
 * today, staging and production differ), and its <article> swapped for the
 * one in site-src/pages/hipaa-disclosure.body.html, converted to nodes the way
 * the importer does it (block text -> base.text, mixed inline content ->
 * custom container + `none` text runs + base.link, <br> -> custom br).
 *
 * SELF-TEST. Before anything is written, the same converter runs on
 * privacy-policy.body.html and must reproduce the live privacy article
 * node-for-node (ids aside). If it does not, the script refuses.
 *
 * SAFETY. A publish republishes every page, so --publish refuses unless the
 * draft matched the published site before the write, and no other page row
 * changed between that check and the publish.
 *
 * <title> comes from the row's `title` (this publisher ignores seoTitle);
 * <meta name="description"> is the SITE-level one on every page of this
 * instance, so the seoDescription cell is stored but not rendered.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getSite, getPages, publish, publishStatus, BASE } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PAGES_SRC = path.resolve(HERE, '../04-design/.tmp/surgical-arts/site-src/pages')
const TMP = path.join(HERE, '.tmp')

const apply = process.argv.includes('--apply')
const alsoPublish = process.argv.includes('--publish')

const SLUG = 'hipaa-disclosure'
const TITLE = 'HIPAA Disclosure | Stone Surgical Arts'
const SEO_DESCRIPTION = 'The Notice of Privacy Practices of Stone Surgical Arts PLLC: how your health information may be used and shared, and your rights under HIPAA.'
const ENTITY = 'Stone Surgical Arts PLLC'

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')

// ── a parser for the authored legal pages (well-formed, small tag set) ────
const VOID = new Set(['br'])
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', ndash: '–', mdash: '—', reg: '®', copy: '©' }
const decode = (s) => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10))
  if (!(e in ENT)) throw new Error(`unknown entity ${m}`)
  return ENT[e]
})

function parse(html) {
  html = html.replace(/<!--[\s\S]*?-->/g, '')
  const root = { tag: '#root', attrs: {}, children: [] }
  const stack = [root]
  const re = /<\/?([a-z0-9]+)((?:\s+[a-z-]+(?:="[^"]*")?)*)\s*\/?>|[^<]+/gi
  for (const m of html.matchAll(re)) {
    const top = stack[stack.length - 1]
    if (!m[1]) { top.children.push({ text: decode(m[0]) }); continue }
    const tag = m[1].toLowerCase()
    if (m[0].startsWith('</')) {
      if (top.tag !== tag) throw new Error(`mismatched </${tag}>, open <${top.tag}>`)
      stack.pop()
      continue
    }
    const attrs = {}
    for (const a of (m[2] ?? '').matchAll(/([a-z-]+)(?:="([^"]*)")?/gi)) attrs[a[1]] = decode(a[2] ?? '')
    const el = { tag, attrs, children: [] }
    top.children.push(el)
    if (!VOID.has(tag)) stack.push(el)
  }
  if (stack.length !== 1) throw new Error(`unclosed <${stack[stack.length - 1].tag}>`)
  return root
}

// ── to Instatic nodes ─────────────────────────────────────────────────────
const CONTAINER_TAGS = new Set(['div', 'section', 'ul', 'ol', 'article', 'header', 'aside', 'nav', 'main', 'footer'])
// <li> is always a custom container holding a `none` text run, even when it is text-only.
const isWs = (c) => c.text !== undefined && !c.text.trim()
const isTextOnly = (el) => el.children.every((c) => c.text !== undefined)
const hrefOf = (h) => (h === 'index.html' ? '/' : /^[a-z0-9-]+\.html(#.*)?$/i.test(h) ? '/' + h.replace(/\.html/, '') : h)

function makeConverter(shell) {
  const byName = new Map()
  for (const r of Object.values(shell.styleRules ?? {})) {
    if (r.kind === 'class') byName.set(String(r.name ?? '').replace(/^\./, ''), r.id)
  }
  const classIds = (el) => (el.attrs.class ?? '').split(/\s+/).filter(Boolean).map((c) => {
    const id = byName.get(c)
    if (!id) throw new Error(`no class rule .${c} on this instance`)
    return id
  })
  const htmlAttributes = (el) => Object.fromEntries(Object.entries(el.attrs).filter(([k]) => k !== 'class' && k !== 'href'))

  return function convert(el, parentId, nodes) {
    const id = nanoid()
    const node = { id, moduleId: '', props: {}, breakpointOverrides: {}, children: [], classIds: classIds(el), parentId }
    nodes[id] = node
    const text = () => el.children.map((c) => c.text).join('').replace(/\s+/g, ' ').trim()
    if (el.tag === 'br') {
      node.moduleId = 'base.container'
      node.props = { tag: 'custom', customTag: 'br', htmlAttributes: {} }
      return id
    }
    if (el.tag === 'a') {
      node.moduleId = 'base.link'
      if (isTextOnly(el)) node.props = { href: hrefOf(el.attrs.href), text: text(), target: '_self', htmlAttributes: htmlAttributes(el) }
      else node.props = { href: hrefOf(el.attrs.href), target: '_self', htmlAttributes: htmlAttributes(el) }
    } else if (isTextOnly(el) && !CONTAINER_TAGS.has(el.tag) && el.tag !== 'li') {
      node.moduleId = 'base.text'
      node.props = { text: text(), tag: el.tag, htmlAttributes: htmlAttributes(el) }
      return id
    } else {
      node.moduleId = 'base.container'
      node.props = CONTAINER_TAGS.has(el.tag)
        ? { tag: el.tag, customTag: '', htmlAttributes: htmlAttributes(el) }
        : { tag: 'custom', customTag: el.tag, htmlAttributes: htmlAttributes(el) }
    }
    if (el.tag === 'a' && isTextOnly(el)) return id
    for (const c of el.children) {
      if (isWs(c)) continue
      if (c.text !== undefined) {
        const tid = nanoid()
        nodes[tid] = { id: tid, moduleId: 'base.text', props: { text: c.text.replace(/\s+/g, ' '), tag: 'none', htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: [], parentId: id }
        node.children.push(tid)
      } else {
        node.children.push(convert(c, id, nodes))
      }
    }
    return id
  }
}

function articleOf(file) {
  const root = parse(fs.readFileSync(path.join(PAGES_SRC, file), 'utf8'))
  const art = root.children.find((c) => c.tag === 'article')
  if (!art) throw new Error(`${file}: no <article>`)
  return art
}

/* Structural signature of a subtree, ids ignored. */
function signature(nodes, id) {
  const n = nodes[id]
  return { m: n.moduleId, p: n.props, c: n.classIds, k: (n.children ?? []).map((c) => signature(nodes, c)) }
}

function firstDiff(a, b, at = 'article') {
  const sa = JSON.stringify({ ...a, k: undefined }), sb = JSON.stringify({ ...b, k: undefined })
  if (sa !== sb) return `${at}: ${sa.slice(0, 300)}\n   vs live ${sb.slice(0, 300)}`
  if (a.k.length !== b.k.length) return `${at}: ${a.k.length} children vs live ${b.k.length}`
  for (let i = 0; i < a.k.length; i++) {
    const d = firstDiff(a.k[i], b.k[i], `${at} > ${i}`)
    if (d) return d
  }
  return null
}

function assertTree(nodes, rootId) {
  const seen = new Set()
  const walk = (id) => {
    const n = nodes[id]
    if (!n) throw new Error(`child ${id} does not exist`)
    if (seen.has(id)) throw new Error(`${id} reached twice`)
    if (!Array.isArray(n.children)) throw new Error(`${id} has no children array`)
    seen.add(id)
    for (const c of n.children) {
      if (nodes[c]?.parentId !== id) throw new Error(`${c} claims parent ${nodes[c]?.parentId}, sits under ${id}`)
      walk(c)
    }
  }
  walk(rootId)
  const orphans = Object.keys(nodes).filter((id) => !seen.has(id))
  if (orphans.length) throw new Error(`${orphans.length} unreachable node(s)`)
}

// ── the instance ──────────────────────────────────────────────────────────
console.log(`target     ${BASE}`)
const status0 = await publishStatus()
console.log(`status     ${JSON.stringify(status0)}`)
const { site: shell, seq: shellSeq } = await getSite()
const rows0 = (await getPages()).rows
const stamp0 = new Map(rows0.map((r) => [r.id, `${r.seq}|${r.updatedAt}`]))
const existing = rows0.find((r) => (r.cells?.slug ?? r.slug) === SLUG)
const privacyRow = rows0.find((r) => (r.cells?.slug ?? r.slug) === 'privacy-policy')
if (!privacyRow) throw new Error('no privacy-policy page to model on')
const privacy = (await api('GET', `/admin/api/cms/data/rows/${privacyRow.id}`)).row.cells
const pNodes = privacy.body.nodes
const liveArticle = Object.values(pNodes).find((n) => n.moduleId === 'base.container' && n.props?.tag === 'article')
if (!liveArticle) throw new Error('privacy-policy has no <article> container')
console.log(`shell seq  ${shellSeq}; pages ${rows0.length}; privacy ${privacyRow.id} (${Object.keys(pNodes).length} nodes); ${SLUG} ${existing ? `EXISTS ${existing.id}` : 'absent'}`)

const convert = makeConverter(shell)

// self-test against the live privacy article
{
  const scratch = {}
  const id = convert(articleOf('privacy-policy.body.html'), liveArticle.parentId, scratch)
  const d = firstDiff(signature(scratch, id), signature(pNodes, liveArticle.id))
  if (d) {
    console.error(`SELF-TEST FAILED: the converter does not reproduce the live privacy article.\n   ${d}`)
    process.exit(1)
  }
  console.log(`self-test  privacy-policy.body.html -> ${Object.keys(scratch).length} nodes, identical to the live article`)
}

// the new page: privacy's tree, fresh ids, article swapped
const remap = new Map(Object.keys(pNodes).map((id) => [id, nanoid()]))
const nodes = {}
const dropSubtree = (id) => { for (const c of pNodes[id].children ?? []) dropSubtree(c); remap.delete(id) }
for (const c of liveArticle.children ?? []) dropSubtree(c)
for (const [oldId, newId] of remap) {
  const n = structuredClone(pNodes[oldId])
  n.id = newId
  n.parentId = n.parentId ? remap.get(n.parentId) : n.parentId
  n.children = oldId === liveArticle.id ? [] : (n.children ?? []).map((c) => remap.get(c))
  nodes[newId] = n
}
const artId = remap.get(liveArticle.id)
const fresh = {}
const tmpArt = convert(articleOf('hipaa-disclosure.body.html'), nodes[artId].parentId, fresh)
nodes[artId].classIds = fresh[tmpArt].classIds
nodes[artId].props = fresh[tmpArt].props
for (const c of fresh[tmpArt].children) { fresh[c].parentId = artId; nodes[artId].children.push(c) }
delete fresh[tmpArt]
for (const [id, n] of Object.entries(fresh)) { if (n.parentId === tmpArt) n.parentId = artId; nodes[id] = n }
const rootNodeId = remap.get(privacy.body.rootNodeId)
assertTree(nodes, rootNodeId)

const allText = Object.values(nodes).map((n) => n.props?.text ?? '').join(' ')
if (!allText.includes(ENTITY)) throw new Error('entity name missing from the page')
for (const bad of ['Stone Dental Implant Center', '383-8361', '110A', 'September 28']) if (allText.includes(bad)) throw new Error(`source leftover on the page: ${bad}`)
console.log(`page       ${SLUG}: ${Object.keys(nodes).length} nodes (article ${Object.keys(fresh).length}), tree sound`)

const pageId = existing?.id ?? nanoid()
const entry = { id: pageId, slug: SLUG, title: TITLE, nodes, rootNodeId }
fs.mkdirSync(TMP, { recursive: true })
const host = BASE.replace(/^https?:\/\//, '')
fs.writeFileSync(path.join(TMP, `hipaa-page-${host}.json`), JSON.stringify(entry, null, 1))

if (!apply) {
  console.log('dry run — re-run with --apply to write')
  process.exit(0)
}
if (!status0.draftMatchesPublished || status0.draftPages !== status0.publishedPages) {
  console.error('REFUSING: the draft differs from the published site, so a publish would ship someone else\'s drafts.')
  process.exit(1)
}

// ── write ─────────────────────────────────────────────────────────────────
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site: shell,
  changedPages: [entry],
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs: existing ? { [existing.id]: existing.seq } : {},
  shellBaseSeq: shellSeq,
})
console.log(`write      ${JSON.stringify(res).slice(0, 120)}`)

const row = (await api('GET', `/admin/api/cms/data/rows/${pageId}`)).row
const cells = { ...row.cells, seoTitle: TITLE, seoDescription: SEO_DESCRIPTION }
await api('PATCH', `/admin/api/cms/data/rows/${pageId}`, { cells })
const back = (await api('GET', `/admin/api/cms/data/rows/${pageId}`)).row.cells
const ok = back.slug === SLUG && back.title === TITLE && back.seoDescription === SEO_DESCRIPTION && Object.keys(back.body?.nodes ?? {}).length === Object.keys(nodes).length
console.log(`read back  slug=${back.slug} title="${back.title}" nodes=${Object.keys(back.body?.nodes ?? {}).length}/${Object.keys(nodes).length} seo=${back.seoDescription ? 'set' : 'MISSING'}`)
if (!ok) { console.error('NOT published: read-back mismatch'); process.exit(1) }

// nothing else moved?
const rows1 = (await getPages()).rows
const moved = rows1.filter((r) => r.id !== pageId && stamp0.get(r.id) !== `${r.seq}|${r.updatedAt}`).map((r) => r.cells?.slug ?? r.slug)
const status1 = await publishStatus()
console.log(`status     ${JSON.stringify(status1)}; other rows changed since the check: ${moved.join(', ') || 'none'}`)
if (moved.length || status1.draftPages !== status0.publishedPages + (existing ? 0 : 1)) {
  console.error('NOT published: other pages changed or the page count is off; someone else is working here.')
  process.exit(1)
}
if (alsoPublish) console.log('publish    ' + JSON.stringify(await publish()).slice(0, 200))
else console.log('NOT published.')
