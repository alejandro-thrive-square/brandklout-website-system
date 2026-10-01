/**
 * Add ONE page, /hipaa-disclosure (the HHS model Notice of Privacy Practices, as on the Brandklout
 * Webflow sites), to the PRODUCTION Instatic site, built from the stored /privacy-policy page so it is
 * native: same header, footer, script placeholders, body classes and copy-region shape. Only the h1,
 * the copy and the page's own <head> items change. Copy: `hipaa-disclosure.md` (same dialect as
 * push-legal.mjs, plus a whole line in `_..._` = an italic paragraph).
 *
 *   node push-hipaa.mjs                      dry run, writes .tmp/hipaa-disclosure.preview.html
 *   node push-hipaa.mjs --apply              writes the draft (one incremental PUT, this page only)
 *   node push-hipaa.mjs --apply --publish    ...and publishes, if nothing else changed in between
 *
 * Production only. Staging holds the redesigned site (no /privacy-policy, different stylesheet); its
 * HIPAA page is `scenario-0-new-site/03-design-build/output/code/site-src/pages/hipaa-disclosure.html`.
 *
 * Why the head items are filtered: the clone's body carries `data-wz-head`, the list of WordPress
 * <head> items `site.js` replays. For privacy-policy that includes `<link rel=canonical
 * href=/privacy-policy/>` and the privacy og/twitter tags; kept, the new page would canonicalise to
 * the privacy page and drop out of the index. Anything naming the privacy page is removed; the
 * site-wide ones (robots index/follow, locale, site name, image, favicon, tags) stay.
 *
 * The body keeps the privacy page's classIds (incl. `wz-p-privacy-policy`): that is what gives it the
 * dark header bar of `light-page-header.css` without a site.css change. A per-slug class would need a
 * shell registry write.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
for (let dir = HERE; ; dir = path.dirname(dir)) {
  const env = path.join(dir, '.env')
  if (fs.existsSync(env)) {
    for (const l of fs.readFileSync(env, 'utf8').split(/\r?\n/)) {
      const m = l.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
    break
  }
  if (path.dirname(dir) === dir) throw new Error('no .env above this script')
}
const TOOL = 'deliver/process/tools/instatic-api-sync/insta-api.mjs'
let toolkit = path.resolve(HERE, '../../../../../..', TOOL)
if (!fs.existsSync(toolkit)) {
  const common = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: HERE })
  toolkit = path.join(path.dirname(String(common).trim()), TOOL)
}
const { getPages, getSite, api, publish, publishStatus, BASE } = await import(pathToFileURL(toolkit).href)
const host = new URL(BASE).hostname
if (!['www.ifadentistry.com', 'institute-for-advanced-dentistry-production.up.railway.app'].includes(host)) {
  throw new Error(`refusing: ${host} is not IFA production (staging gets the page from site-src)`)
}
console.log(`host       ${BASE}`)
const apply = process.argv.includes('--apply')
const doPublish = process.argv.includes('--publish')

const SLUG = 'hipaa-disclosure'
const TITLE = 'HIPAA Disclosure | Institute for Advanced Dentistry'
const DESCRIPTION = 'Notice of Privacy Practices for Institute for Advanced Dentistry PLLC: how your health information may be used and shared, and your rights under HIPAA.'
const HEADING = 'HIPAA Disclosure'

const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)
const RSQUO = String.fromCharCode(8217)
const LDQUO = String.fromCharCode(8220)
const RDQUO = String.fromCharCode(8221)
function typo(s) {
  let open = true
  return s.replace(/'/g, RSQUO).replace(/"/g, () => (open = !open) ? RDQUO : LDQUO)
}

/* --- Markdown -> nodes (push-legal.mjs, plus italic paragraphs) ----------------------------- */
const INLINE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
const node = (id, moduleId, props, parentId, children = []) => ({ id, moduleId, props: { ...props, htmlAttributes: {} }, breakpointOverrides: {}, children, classIds: [], parentId })
function text(nodes, parentId, s) {
  const id = nid()
  nodes[id] = node(id, 'base.text', { text: typo(s), tag: 'none' }, parentId)
  return id
}
function inline(nodes, parentId, tag, line) {
  INLINE.lastIndex = 0
  if (!INLINE.test(line)) {
    const id = nid()
    nodes[id] = node(id, 'base.text', { text: typo(line), tag }, parentId)
    return id
  }
  const wrapId = nid()
  const children = []
  let last = 0
  INLINE.lastIndex = 0
  for (let m; (m = INLINE.exec(line)); ) {
    const before = line.slice(last, m.index)
    if (before) children.push(text(nodes, wrapId, before))
    if (m[3] !== undefined) {
      const strongId = nid()
      nodes[strongId] = node(strongId, 'base.container', { tag: 'custom', customTag: 'strong' }, wrapId, [text(nodes, strongId, m[3])])
      children.push(strongId)
    } else {
      const id = nid()
      nodes[id] = node(id, 'base.link', { href: m[2], text: typo(m[1]), target: '_self' }, wrapId)
      children.push(id)
    }
    last = m.index + m[0].length
  }
  const rest = line.slice(last)
  if (rest) children.push(text(nodes, wrapId, rest))
  nodes[wrapId] = node(wrapId, 'base.container', { tag: 'custom', customTag: tag === 'none' ? 'span' : tag }, parentId, children)
  return wrapId
}
function build(md, parentId) {
  const nodes = {}
  const children = []
  let ul = null
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) { ul = null; continue }
    if (line.startsWith('- ')) {
      if (!ul) {
        const id = nid()
        ul = node(id, 'base.container', { tag: 'ul', customTag: '' }, parentId)
        nodes[id] = ul
        children.push(id)
      }
      const liId = nid()
      nodes[liId] = node(liId, 'base.container', { tag: 'custom', customTag: 'li' }, ul.id)
      nodes[liId].children.push(inline(nodes, liId, 'none', line.slice(2).trim()))
      ul.children.push(liId)
      continue
    }
    ul = null
    if (line.startsWith('### ')) children.push(inline(nodes, parentId, 'h3', line.slice(4).trim()))
    else if (line.startsWith('## ')) children.push(inline(nodes, parentId, 'h2', line.slice(3).trim()))
    else if (/^_.+_$/.test(line)) {
      const pId = nid()
      const emId = nid()
      nodes[pId] = node(pId, 'base.container', { tag: 'custom', customTag: 'p' }, parentId, [emId])
      nodes[emId] = node(emId, 'base.container', { tag: 'custom', customTag: 'em' }, pId, [text(nodes, emId, line.slice(1, -1))])
      children.push(pId)
    } else children.push(inline(nodes, parentId, 'p', line))
  }
  return { nodes, children }
}

/* --- the cloned page ----------------------------------------------------------------------- */
function findAll(nodes, id, test, out = []) {
  const n = nodes[id]
  if (!n) return out
  if (test(n)) out.push(n)
  for (const c of n.children ?? []) findAll(nodes, c, test, out)
  return out
}
function descendants(nodes, id, out = []) {
  for (const c of nodes[id]?.children ?? []) { out.push(c); descendants(nodes, c, out) }
  return out
}
function copyRegion(nodes, rootNodeId) {
  const main = findAll(nodes, rootNodeId, (n) => n.props?.customTag === 'main' || n.props?.tag === 'main')[0]
  if (!main) throw new Error('no <main>')
  const h1 = findAll(nodes, main.id, (n) => n.moduleId === 'base.text' && n.props?.tag === 'h1')[0]
  if (!h1) throw new Error('no <h1> in <main>')
  const wrap = nodes[nodes[h1.parentId].parentId]
  const body = (wrap.children ?? []).map((c) => nodes[c]).filter((n) => n && n.id !== h1.parentId)
    .sort((a, b) => (b.children?.length ?? 0) - (a.children?.length ?? 0))[0]
  if (!body || (body.children?.length ?? 0) < 20) throw new Error('no copy container under the h1 wrapper')
  return { main, h1, body }
}
/** Fresh ids for every node, so the new page shares none with the privacy page. */
function remap(nodes, rootNodeId) {
  const map = Object.fromEntries(Object.keys(nodes).map((id) => [id, nid()]))
  const out = {}
  for (const n of Object.values(nodes)) {
    const id = map[n.id]
    out[id] = { ...structuredClone(n), id, parentId: n.parentId ? map[n.parentId] : n.parentId, children: (n.children ?? []).map((c) => map[c]) }
  }
  return { nodes: out, rootNodeId: map[rootNodeId] }
}
function html(nodes, id) {
  const n = nodes[id]
  if (!n) return ''
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const kids = (n.children ?? []).map((c) => html(nodes, c)).join('')
  if (n.moduleId === 'base.link') return `<a href="${esc(n.props.href)}">${esc(n.props.text)}</a>`
  if (n.moduleId === 'base.text') return n.props.tag === 'none' ? esc(n.props.text) : `<${n.props.tag}>${esc(n.props.text)}</${n.props.tag}>`
  const tag = n.props.tag === 'custom' ? n.props.customTag : n.props.tag
  return `<${tag}>${kids}</${tag}>`
}

/* --- run ------------------------------------------------------------------------------------ */
const before = await publishStatus()
console.log(`publish    draftMatchesPublished=${before.draftMatchesPublished} draft ${before.draftPages} / published ${before.publishedPages}`)
if (before.draftMatchesPublished !== true) throw new Error('the draft already differs from live: someone has unpublished work here. Not writing.')

const { rows } = await getPages()
const fingerprint = (rs) => rs.map((r) => `${r.id}:${r.seq}:${r.updatedAt}`).sort().join('|')
const existing = rows.find((r) => (r.cells?.slug ?? r.slug) === SLUG)
const source = rows.find((r) => (r.cells?.slug ?? r.slug) === 'privacy-policy')
if (!source) throw new Error('no privacy-policy page to build from')

const { nodes, rootNodeId } = remap(source.cells.body.nodes, source.cells.body.rootNodeId)

// 1. the page's own <head> items: drop everything that names the privacy page
const { site, seq } = await getSite()
const siteJs = site.files.find((f) => f.path === 'src/scripts/site.js')?.content ?? ''
const root = nodes[rootNodeId]
const headIds = (root.props.htmlAttributes?.['data-wz-head'] ?? '').split(/\s+/).filter(Boolean)
const kept = []
const dropped = []
for (const id of headIds) {
  const at = siteJs.indexOf(`${JSON.stringify(id)}:{`)
  if (at < 0) throw new Error(`head item ${id} is not in site.js`)
  const item = siteJs.slice(at, siteJs.indexOf('"},', at) + 2)
  const pageSpecific = /privacy|rel=\\"canonical|og:url|og:title|og:description|og:updated_time|twitter:title|twitter:description|twitter:data/i.test(item)
  ;(pageSpecific ? dropped : kept).push(id)
  if (pageSpecific) console.log(`head drop  ${item.slice(0, 140)}`)
}
root.props.htmlAttributes = { ...root.props.htmlAttributes, 'data-wz-head': kept.join(' ') }
console.log(`head       kept ${kept.length}, dropped ${dropped.length}`)

// 2. h1 and copy
const { main, h1, body } = copyRegion(nodes, rootNodeId)
const old = descendants(nodes, body.id)
for (const id of old) delete nodes[id]
const { nodes: fresh, children } = build(fs.readFileSync(path.join(HERE, 'hipaa-disclosure.md'), 'utf8'), body.id)
Object.assign(nodes, fresh)
nodes[body.id] = { ...nodes[body.id], children }
nodes[h1.id] = { ...nodes[h1.id], props: { ...nodes[h1.id].props, text: HEADING } }
console.log(`copy       ${old.length} privacy nodes -> ${Object.keys(fresh).length} HIPAA nodes, h1 "${HEADING}"`)

// 3. the footer's Privacy Policy item is the CURRENT page on the source (aria-current="page",
// current-menu-item classes). Give it the state it has on a page where it is not: /contact-us.
const footerPrivacy = (ns, rid) => {
  const footer = findAll(ns, rid, (n) => n.props?.tag === 'footer')[0]
  return footer && findAll(ns, footer.id, (n) => n.moduleId === 'base.link' && n.props?.href === '/privacy-policy')[0]
}
const plain = rows.find((r) => (r.cells?.slug ?? r.slug) === 'contact-us')
const ref = footerPrivacy(plain.cells.body.nodes, plain.cells.body.rootNodeId)
const link = footerPrivacy(nodes, rootNodeId)
if (!ref || !link) throw new Error('footer Privacy Policy link not found on contact-us or the clone')
nodes[link.id] = { ...link, props: { ...link.props, htmlAttributes: { ...ref.props.htmlAttributes } } }
nodes[link.parentId] = { ...nodes[link.parentId], classIds: [...plain.cells.body.nodes[ref.parentId].classIds], props: { ...nodes[link.parentId].props, htmlAttributes: { ...plain.cells.body.nodes[ref.parentId].props.htmlAttributes } } }
console.log(`footer     Privacy Policy item: ${link.parentId ? 'current-page state replaced with /contact-us\'s' : ''}`)
if (Object.values(nodes).some((n) => n.props?.htmlAttributes?.['aria-current'])) throw new Error('an aria-current is left on the page')

// 4. nothing else in <main> may still speak about the privacy page
const leftovers = findAll(nodes, main.id, (n) => /privacy policy/i.test(n.props?.text ?? '') && !descendants(nodes, body.id).includes(n.id))
for (const n of leftovers) console.log(`WARNING    <main> still says "${n.props.text}" (${n.id})`)
if (leftovers.length) throw new Error('privacy text left in <main> outside the copy region')
for (const n of Object.values(nodes)) if (!Array.isArray(n.children)) throw new Error(`node ${n.id} has no children array`)

fs.mkdirSync(path.join(HERE, '.tmp'), { recursive: true })
fs.writeFileSync(path.join(HERE, '.tmp', `${SLUG}.preview.html`),
  `<!doctype html><meta charset="utf-8"><title>${TITLE}</title><body style="max-width:46rem;margin:2rem auto;font:16px/1.6 system-ui"><h1>${HEADING}</h1>` + html(nodes, body.id))
console.log(`page       ${SLUG}: ${Object.keys(nodes).length} nodes, ${existing ? `REWRITING existing row ${existing.id}` : 'new row'}`)
if (!apply) { console.log('\ndry run: --apply to write the draft'); process.exit(0) }

const id = existing?.id ?? nid()
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site,
  shellBaseSeq: seq,
  changedPages: [{ id, slug: SLUG, title: TITLE, nodes, rootNodeId }],
  deletedPageIds: [],
  changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: existing ? { [id]: existing.seq } : {},
})
console.log('saved:', JSON.stringify(res).slice(0, 200))

const current = await api('GET', `/admin/api/cms/data/rows/${id}`)
const cells = { ...(current.row?.cells ?? current.cells ?? {}) }
if (cells.slug !== SLUG || !Object.keys(cells.body?.nodes ?? {}).length) throw new Error('the new row did not come back with its slug and body')
await api('PATCH', `/admin/api/cms/data/rows/${id}`, { cells: { ...cells, seoTitle: TITLE, seoDescription: DESCRIPTION } })
const after = await api('GET', `/admin/api/cms/data/rows/${id}`)
const ac = after.row?.cells ?? after.cells ?? {}
if (ac.slug !== SLUG || !Object.keys(ac.body?.nodes ?? {}).length) throw new Error('row lost content after the SEO write')
console.log(`seo        ${ac.slug} -> "${ac.seoTitle}"`)

// Publish only if every OTHER row is exactly as it was when we started.
const rowsNow = (await getPages()).rows
const othersNow = fingerprint(rowsNow.filter((r) => r.id !== id))
const othersBefore = fingerprint(rows.filter((r) => r.id !== id))
console.log(`rows       ${rowsNow.length} stored; others unchanged: ${othersNow === othersBefore}`)
if (!doPublish) { console.log('\ndraft written; not published (--publish)'); process.exit(0) }
if (othersNow !== othersBefore || rowsNow.length !== rows.length + (existing ? 0 : 1)) {
  console.error('NOT PUBLISHING: another page changed while this ran; publishing would ship it.')
  process.exit(1)
}
const pub = await publish()
console.log('published:', JSON.stringify(pub).slice(0, 200))
console.log('status:', JSON.stringify(await publishStatus()))
