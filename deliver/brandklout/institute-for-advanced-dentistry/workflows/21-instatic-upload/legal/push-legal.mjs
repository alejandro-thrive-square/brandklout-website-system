/**
 * Replace the body copy of /privacy-policy and /terms-of-service with the A2P 10DLC versions in
 * `privacy-policy.md` / `terms-of-service.md`, and add a "Terms of Service" link to the legal nav
 * in the footer of every page.
 *
 * The two pages are WordPress clones like every other page here: the copy lives in one <div>
 * inside `main > section > div`, as flat base.text / base.container children with no classIds —
 * `site.css` styles them by element selector inside the page's own scope. So the edit is:
 * regenerate that div's children from the Markdown, drop the orphaned nodes, keep everything else
 * (header, footer, script placeholders) untouched.
 *
 *   node push-legal.mjs            dry run — prints what would change
 *   node push-legal.mjs --apply    writes the draft (does NOT publish)
 *
 * Writes go through ONE `PUT /site-document` in `incremental` mode, so no page outside
 * `changedPages` is touched. seoTitle/seoDescription are not part of `pageToCells`, so any page
 * write drops them; they are re-applied afterwards with `PATCH /data/rows/:id` (which merges).
 *
 * Publish SEPARATELY once the draft reads right — a publish bakes every page on the site.
 *
 * The copy in `privacy-policy.md` / `terms-of-service.md` is the client's own, supplied
 * 2026-09-18 as `workflows/00-client-delivery-initialization/.tmp/IFA-Dentistry-*.md`. It is
 * transcribed here, not rewritten: the Word-style `# N Heading` became `## `, `## ` became `### `,
 * `•  ` became `- `, the two one-row tables became a paragraph and two address blocks, and phone /
 * email / website lines became links. Nothing else changed. Re-transcribe rather than edit in
 * place if the client sends a new version.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { getPages, getSite, api } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const apply = process.argv.includes('--apply')
const nid = () => crypto.randomBytes(16).toString('base64url').slice(0, 21)

const RSQUO = String.fromCharCode(8217)
const LDQUO = String.fromCharCode(8220)
const RDQUO = String.fromCharCode(8221)

/** WordPress served curly quotes; the Markdown is written with straight ones. */
function typo(s) {
  let open = true
  return s
    .replace(/'/g, RSQUO)
    .replace(/"/g, () => (open = !open) ? RDQUO : LDQUO)
}

/* --- Markdown -> nodes ---------------------------------------------------------------------- */

// `[text](href)` and `**bold**`, in one pass so their order is preserved.
const INLINE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g

/** One line of copy -> either a single base.text, or a base.container[p] carrying inline markup. */
function inline(nodes, parentId, tag, line) {
  INLINE.lastIndex = 0
  if (!INLINE.test(line)) {
    const id = nid()
    nodes[id] = { id, moduleId: 'base.text', props: { text: typo(line), tag, htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: [], parentId }
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
      nodes[strongId] = { id: strongId, moduleId: 'base.container', props: { tag: 'custom', customTag: 'strong', htmlAttributes: {} }, breakpointOverrides: {}, children: [text(nodes, strongId, m[3])], classIds: [], parentId: wrapId }
      children.push(strongId)
    } else {
      const id = nid()
      nodes[id] = { id, moduleId: 'base.link', props: { href: m[2], text: typo(m[1]), target: '_self', htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: [], parentId: wrapId }
      children.push(id)
    }
    last = m.index + m[0].length
  }
  const rest = line.slice(last)
  if (rest) children.push(text(nodes, wrapId, rest))
  // A tag of `none` means "no element of my own" — inside an <li> that has to stay inline, so the
  // wrapper is a <span>; a block wrapper there breaks the marker and the list spacing.
  nodes[wrapId] = { id: wrapId, moduleId: 'base.container', props: { tag: 'custom', customTag: tag === 'none' ? 'span' : tag, htmlAttributes: {} }, breakpointOverrides: {}, children, classIds: [], parentId }
  return wrapId
}

function text(nodes, parentId, s) {
  const id = nid()
  nodes[id] = { id, moduleId: 'base.text', props: { text: typo(s), tag: 'none', htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: [], parentId }
  return id
}

/**
 * Blocks are separated by blank lines; inside a block every LINE is its own element, which is how
 * the address blocks stay one line each. `## `/`### ` are headings, `- ` items collect into a <ul>.
 */
function build(md, parentId) {
  const nodes = {}
  const children = []
  let ul = null

  const closeList = () => { ul = null }
  const push = (id) => { children.push(id); }

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) { closeList(); continue }

    if (line.startsWith('- ')) {
      if (!ul) {
        const id = nid()
        ul = { id, moduleId: 'base.container', props: { tag: 'ul', customTag: '', htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: [], parentId }
        nodes[id] = ul
        push(id)
      }
      const liId = nid()
      const li = { id: liId, moduleId: 'base.container', props: { tag: 'custom', customTag: 'li', htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: [], parentId: ul.id }
      nodes[liId] = li
      li.children.push(inline(nodes, liId, 'none', line.slice(2).trim()))
      ul.children.push(liId)
      continue
    }

    closeList()
    if (line.startsWith('### ')) push(inline(nodes, parentId, 'h3', line.slice(4).trim()))
    else if (line.startsWith('## ')) push(inline(nodes, parentId, 'h2', line.slice(3).trim()))
    else push(inline(nodes, parentId, 'p', line))
  }
  return { nodes, children }
}

/* --- locate the pieces of a cloned page ----------------------------------------------------- */

function findByModule(nodes, id, test, out = []) {
  const n = nodes[id]
  if (!n) return out
  if (test(n)) out.push(n)
  for (const c of n.children ?? []) findByModule(nodes, c, test, out)
  return out
}

function descendants(nodes, id, out = []) {
  for (const c of nodes[id]?.children ?? []) { out.push(c); descendants(nodes, c, out) }
  return out
}

/** main > section > div > [div > h1, div(copy)] */
function copyRegion(nodes, rootNodeId) {
  const main = findByModule(nodes, rootNodeId, (n) => n.props?.customTag === 'main' || n.props?.tag === 'main')[0]
  if (!main) throw new Error('no <main>')
  const h1 = findByModule(nodes, main.id, (n) => n.moduleId === 'base.text' && n.props?.tag === 'h1')[0]
  if (!h1) throw new Error('no <h1> in <main>')
  const wrap = nodes[nodes[h1.parentId].parentId]
  const body = (wrap.children ?? [])
    .map((c) => nodes[c])
    .filter((n) => n && n.id !== nodes[h1.parentId].id)
    .sort((a, b) => (b.children?.length ?? 0) - (a.children?.length ?? 0))[0]
  if (!body || (body.children?.length ?? 0) < 20) throw new Error('no copy container under the h1 wrapper')
  return { h1, body }
}

/** the footer <ul> carrying the Privacy Policy / Accessibility Statement links */
function legalNav(nodes, rootNodeId) {
  const uls = findByModule(nodes, rootNodeId, (n) => n.props?.tag === 'ul' || n.props?.customTag === 'ul')
  for (const ul of uls) {
    const hrefs = descendants(nodes, ul.id).map((c) => nodes[c]?.props?.href).filter(Boolean)
    if (hrefs.includes('/privacy-policy') && hrefs.includes('/accessibility-statement')) return ul
  }
  return null
}

/* --- preview -------------------------------------------------------------------------------- */

/** Render a generated subtree the way the publisher would, so the copy can be proofread offline. */
function html(nodes, id) {
  const n = nodes[id]
  if (!n) return ''
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const kids = (n.children ?? []).map((c) => html(nodes, c)).join('')
  if (n.moduleId === 'base.link') return `<a href="${esc(n.props.href)}">${esc(n.props.text)}</a>`
  if (n.moduleId === 'base.text') {
    const t = n.props.tag
    return t === 'none' ? esc(n.props.text) : `<${t}>${esc(n.props.text)}</${t}>`
  }
  const tag = n.props.tag === 'custom' ? n.props.customTag : n.props.tag
  return `<${tag}>${kids}</${tag}>`
}

/* --- run ------------------------------------------------------------------------------------ */

const SEO = {
  'privacy-policy': {
    title: 'Privacy Policy | Institute for Advanced Dentistry',
    description:
      'How Institute for Advanced Dentistry collects, uses and protects your information, including the terms of our SMS text messaging program.',
    heading: 'Privacy Policy',
    file: 'privacy-policy.md',
  },
  'terms-of-service': {
    title: 'Terms of Service | Institute for Advanced Dentistry',
    description:
      'The terms governing your use of ifadentistry.com and our SMS text messaging program, including how to opt in, get help and reply STOP.',
    heading: 'Terms of Service',
    file: 'terms-of-service.md',
  },
}

const { rows } = await getPages()
const changedPages = []
// `mode: 'incremental'` checks each row against the seq you claim to have read. An empty map means
// "based on seq 0" and the whole write comes back 409 with every page listed as a conflict.
const baseSeqs = {}
const seoWrites = []
let navAdded = 0
let navPresent = 0

for (const row of rows) {
  const slug = row.cells?.slug ?? row.slug
  const nodes = structuredClone(row.cells.body.nodes)
  const rootNodeId = row.cells.body.rootNodeId
  let touched = false

  // 1. the two legal pages get new copy
  const spec = SEO[slug]
  if (spec) {
    const { h1, body } = copyRegion(nodes, rootNodeId)
    const before = descendants(nodes, body.id)
    for (const id of before) delete nodes[id]
    const { nodes: fresh, children } = build(fs.readFileSync(path.join(HERE, spec.file), 'utf8'), body.id)
    Object.assign(nodes, fresh)
    nodes[body.id] = { ...body, children }
    nodes[h1.id] = { ...h1, props: { ...h1.props, text: spec.heading } }
    console.log(`${slug.padEnd(18)} copy ${before.length} nodes -> ${Object.keys(fresh).length}, h1 "${spec.heading}"`)
    if (!apply) {
      fs.mkdirSync(path.join(HERE, '.tmp'), { recursive: true })
      fs.writeFileSync(
        path.join(HERE, '.tmp', `${slug}.preview.html`),
        `<!doctype html><meta charset="utf-8"><title>${spec.heading}</title>` +
          `<body style="max-width:46rem;margin:2rem auto;font:16px/1.6 system-ui"><h1>${spec.heading}</h1>` +
          html(nodes, body.id)
      )
    }
    seoWrites.push({ id: row.id, ...spec })
    touched = true
  }

  // 2. every page gets Terms of Service in the footer legal nav
  const ul = legalNav(nodes, rootNodeId)
  if (!ul) {
    console.log(`${slug.padEnd(18)} WARNING no footer legal nav`)
  } else if (descendants(nodes, ul.id).some((c) => nodes[c]?.props?.href === '/terms-of-service')) {
    navPresent++
  } else {
    const liId = nid()
    const aId = nid()
    nodes[aId] = { id: aId, moduleId: 'base.link', props: { href: '/terms-of-service', text: 'Terms of Service', target: '_self', htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: [], parentId: liId }
    nodes[liId] = { id: liId, moduleId: 'base.container', props: { tag: 'custom', customTag: 'li', htmlAttributes: {} }, breakpointOverrides: {}, children: [aId], classIds: [], parentId: ul.id }
    const sepId = nid()
    nodes[sepId] = { id: sepId, moduleId: 'base.text', props: { text: ' ', tag: 'none', htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: [], parentId: ul.id }
    // after the Privacy Policy item, before Accessibility Statement
    const kids = [...ul.children]
    const at = kids.findIndex((c) => descendants(nodes, c).concat([c]).some((d) => nodes[d]?.props?.href === '/privacy-policy'))
    kids.splice(at + 1, 0, sepId, liId)
    nodes[ul.id] = { ...ul, children: kids }
    navAdded++
    touched = true
  }

  if (touched) {
    changedPages.push({ id: row.id, slug, title: spec ? spec.title : row.cells.title, nodes, rootNodeId })
    baseSeqs[row.id] = row.seq
  }
}

console.log(`\nfooter     Terms of Service added on ${navAdded} page(s), already present on ${navPresent}`)
console.log(`changed    ${changedPages.length} page(s), ${changedPages.reduce((n, p) => n + Object.keys(p.nodes).length, 0)} nodes`)
if (!apply) {
  console.log('\ndry run — re-run with --apply to write the draft')
  process.exit(0)
}

// The shell goes back unchanged; `shellBaseSeq` makes the write fail rather than clobber if
// someone else saved in between.
const { site, seq } = await getSite()
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental',
  site,
  shellBaseSeq: seq,
  changedPages,
  deletedPageIds: [],
  changedComponents: [],
  deletedComponentIds: [],
  changedLayouts: [],
  deletedLayoutIds: [],
  baseSeqs,
})
console.log('saved:', JSON.stringify(res).slice(0, 200))

for (const s of seoWrites) {
  const current = await api('GET', `/admin/api/cms/data/rows/${s.id}`)
  const cells = { ...(current.row?.cells ?? current.cells ?? {}) }
  if (!cells.body || !cells.slug) throw new Error(`${s.file}: row is missing body/slug before the merge`)
  cells.seoTitle = s.title
  cells.seoDescription = s.description
  await api('PATCH', `/admin/api/cms/data/rows/${s.id}`, { cells })
  const after = await api('GET', `/admin/api/cms/data/rows/${s.id}`)
  const ac = after.row?.cells ?? after.cells ?? {}
  if (!ac.slug || !Object.keys(ac.body?.nodes ?? {}).length) throw new Error(`${s.file}: row lost content after the SEO write`)
  console.log(`seo        ${ac.slug} -> "${ac.seoTitle}"`)
}
console.log('\ndraft written. Publish separately — a publish bakes EVERY page.')
