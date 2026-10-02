#!/usr/bin/env node
/**
 * push-qa-a11y-fixes.mjs — the axe items from QA's 2026-09-28 check that were
 * still failing on 2026-10-02 (axe-live.cjs, after the animations finish).
 *
 *   node push-qa-a11y-fixes.mjs              # plan
 *   node push-qa-a11y-fixes.mjs --apply      # draft + read-back
 *   node push-qa-a11y-fixes.mjs --publish
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-qa-a11y-fixes.mjs ...
 *
 *  1. Home "reality" chapter (#realityBig), scroll-written words:
 *     - aria-prohibited-attr: GSAP SplitText's default `aria:'auto'` puts an
 *       aria-label on the <p> (not allowed on a paragraph) and hides the words.
 *       splitWords() now passes `aria:'none'`: the words stay ordinary text.
 *     - color-contrast 1.54:1: unwritten words were rgba(20,20,22,.2). Brandklout
 *       rule (BugHerd 2026-09-16, all sites): unwritten text >= 4.5:1. Now .66
 *       (~5.7:1 on --bg), the Mason Park value; the scroll still writes it to ink.
 *  2. frame-title: the ReputationHub review iframe (an embed snippet on / and
 *     /patient-stories) gets title="Patient reviews".
 *  3. /smile-gallery filter counts: opacity .78 -> .9 (4.08:1 -> ~5.4:1).
 *  4. /teeth-whitening: the empty top-left <th> becomes a <td> (empty-table-header);
 *     `.wt-table thead th` also styles `thead td` so it keeps its border. The
 *     scrolling .wt-wrap gets tabindex=0, role=region and a label
 *     (scrollable-region-focusable).
 *  5. Post template: the inner <main id="top"> (a second main, duplicate id,
 *     inside the page's main) becomes a <div>; the two <aside> rails inside the
 *     article become <div>s (the contents list builds its own labelled <nav>).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { isDeepStrictEqual } from 'node:util'
import { api, getSite, getPages, toChangedPage, BASE } from './sedation-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const HOST = BASE.replace(/^https?:\/\//, '')
mkdirSync('.tmp/qa-fixes', { recursive: true })
const STATE = `.tmp/qa-fixes/a11y-state-${HOST}.json`
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')
const slugOf = (r) => r.cells?.slug ?? r.slug

console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)')
const status = await api('GET', '/admin/api/cms/publish/status')
const list = (await getPages()).rows
const { site: shell0 } = await getSite()
if (PUBLISH) {
  const st = JSON.parse(readFileSync(STATE, 'utf8'))
  const now = Object.fromEntries(list.map((r) => [r.id, r.seq]))
  if (Object.keys(st.seqs).some((id) => now[id] !== st.seqs[id]) || sha(shell0) !== st.shell) { console.error('REFUSING: the draft moved since --apply'); process.exit(1) }
  console.log('published', JSON.stringify(await api('POST', '/admin/api/cms/publish', {})))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  process.exit(0)
}
if (!status.draftMatchesPublished) { console.error('REFUSING: the draft already differs from live'); process.exit(1) }

// ── shell ───────────────────────────────────────────────────────────────────
const shell = structuredClone(shell0)
const notes = []
const editFile = (path, a, b) => {
  const f = shell.files.find((x) => x.path === path)
  if (f.content.includes(b)) return
  if (f.content.split(a).length !== 2) { console.error(`${path}: expected one "${a.slice(0, 60)}"`); process.exit(1) }
  f.content = f.content.replace(a, b); notes.push(`${path}: ${a.slice(0, 50)}…`)
}
editFile('src/scripts/site.js', "var opts = {type:'words', wordsClass:'wz-word'};", "var opts = {type:'words', wordsClass:'wz-word', aria:'none'};")
editFile('src/styles/site.css', '.ch-reality .re-big .wz-word{color:rgba(20,20,22,.2)}', '.ch-reality .re-big .wz-word{color:rgba(20,20,22,.66)}')
editFile('src/styles/site.css', '.ga-filters button b{font-weight:600;opacity:.78;margin-left:.45rem}', '.ga-filters button b{font-weight:600;opacity:.9;margin-left:.45rem}')
/* The registry rule is what renders (the compiled style-*.css); site.css and
   runtime-states.css are kept in step so a later rebuild cannot bring .2 back. */
editFile('src/styles/runtime-states.css', '.ch-reality .big .wz-word { color:rgba(20,20,22,.2) }', '.ch-reality .big .wz-word { color:rgba(20,20,22,.66) }')
{ const r = Object.values(shell.styleRules).find((x) => x.selector === '.ch-reality .re-big .wz-word'); if (r && r.styles.color !== 'rgba(20, 20, 22, .66)') { r.styles.color = 'rgba(20, 20, 22, .66)'; notes.push('rule .ch-reality .re-big .wz-word .66') } }
/* Home service numerals (.sv-no) used --accent-lg, the display-size gold, but on
   phones they render below the large-text size: 3.82:1 where 4.5 is required.
   --accent is the text-size gold the token sheet says clears AA (--gold-ink). */
{ const r = Object.values(shell.styleRules).find((x) => x.selector === '.ch-services .sv-no'); if (r && r.styles.color !== 'var(--accent)') { r.styles.color = 'var(--accent)'; notes.push('rule .ch-services .sv-no color var(--accent)') } }
/* /contact-alexandria and /contact-maclean: the phone links inside the intro
   paragraph ("Prefer to speak to …") differed from the text by colour alone,
   1.69:1 (axe link-in-text-block). Underline links inside .lc-head paragraphs. */
if (!Object.values(shell.styleRules).some((r) => r.selector === '.lc-head p a')) {
  const after = Object.values(shell.styleRules).filter((r) => /^\.lc-head/.test(r.selector)).sort((a, b) => b.order - a.order)[0]
  const now = Date.now(), id = 'qaLcHeadLink' + now.toString(36)
  shell.styleRules[id] = { id, name: '.lc-head p a', kind: 'ambient', selector: '.lc-head p a', order: (after?.order ?? 7000) + 0.5,
    styles: { textDecorationLine: 'underline', textUnderlineOffset: '0.18em', textDecorationThickness: '1px' }, contextStyles: {}, createdAt: now, updatedAt: now }
  notes.push('rule + .lc-head p a (underline)')
}
const rule = (sel) => { const h = Object.values(shell.styleRules).filter((r) => r.selector === sel); if (h.length !== 1) { console.error(`rule ${sel}: ${h.length}`); process.exit(1) } return h[0] }
{ const r = Object.values(shell.styleRules).find((x) => x.selector === '.ga-filters button b'); if (r && r.styles.opacity !== '.9') { r.styles.opacity = '.9'; notes.push('rule .ga-filters button b opacity .9') } }
if (!Object.values(shell.styleRules).some((r) => r.selector === '.wt-table thead th, .wt-table thead td')) {
  const r = rule('.wt-table thead th'); r.selector = r.name = '.wt-table thead th, .wt-table thead td'; notes.push('rule .wt-table thead th + td')
}

// ── pages ───────────────────────────────────────────────────────────────────
const wtWrapClass = Object.values(shell.styleRules).find((r) => r.kind === 'class' && r.selector === '.wt-wrap')?.id
const plans = []
for (const r0 of list) {
  const row = (await api('GET', `/admin/api/cms/data/rows/${r0.id}`)).row
  const slug = slugOf(row)
  const N = structuredClone(row.cells.body.nodes)
  const touched = new Set()
  const tagOf = (n) => (n?.props?.tag === 'custom' ? n.props.customTag : n?.props?.tag)
  for (const n of Object.values(N)) {
    if (n.moduleId === 'brandklout.embed-origins.embed' && typeof n.props.snippet === 'string' && n.props.snippet.includes("<iframe class='lc_reviews_widget' src=")) {
      n.props.snippet = n.props.snippet.replace("<iframe class='lc_reviews_widget' src=", "<iframe class='lc_reviews_widget' title='Patient reviews' src="); touched.add(n.id)
    }
    if (slug === 'teeth-whitening' && tagOf(n) === 'th' && n.props.htmlAttributes?.scope === 'col' && n.children.length === 0) {
      n.props.customTag = 'td'; n.props.htmlAttributes = {}; touched.add(n.id)
    }
    if (slug === 'teeth-whitening' && wtWrapClass && (n.classIds ?? []).includes(wtWrapClass) && !n.props.htmlAttributes?.role) {
      n.props.htmlAttributes = { ...(n.props.htmlAttributes ?? {}), tabindex: '0', role: 'region', 'aria-label': 'Whitening options compared' }; touched.add(n.id)
    }
    if (row.cells.templateEnabled && tagOf(n) === 'main' && tagOf(N[n.parentId]) === 'main') {
      n.props.tag = 'div'; n.props.customTag = ''; const { id, ...rest } = n.props.htmlAttributes ?? {}; n.props.htmlAttributes = rest; touched.add(n.id)
    }
    if (row.cells.templateEnabled && tagOf(n) === 'aside' && tagOf(N[n.parentId]) === 'article') {
      n.props.tag = 'div'; n.props.customTag = ''; touched.add(n.id)
    }
  }
  if (touched.size) { plans.push({ row, slug, N, touched }); console.log(`  page     ${slug}: ${touched.size} node(s)`) }
}
console.log(`  shell    ${notes.join('\n           ') || 'nothing'}`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

for (let k = 0; k < Math.max(plans.length, 1); k += 10) {
  const chunk = plans.slice(k, k + 10)
  const { site: sh, seq } = await getSite()
  await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: k === 0 ? shell : sh,
    changedPages: chunk.map((p) => toChangedPage(p.row, { nodes: p.N })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(chunk.map((p) => [p.row.id, p.row.seq])), shellBaseSeq: seq,
  })
}
const problems = []
for (const p of plans) {
  const keep = Object.fromEntries(['seoTitle', 'seoDescription'].filter((k) => p.row.cells[k] !== undefined).map((k) => [k, p.row.cells[k]]))
  let back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  if (Object.keys(keep).length && Object.entries(keep).some(([k, v]) => back.cells[k] !== v)) {
    await api('PATCH', `/admin/api/cms/data/rows/${p.row.id}`, { cells: { ...back.cells, ...keep } })
    back = (await api('GET', `/admin/api/cms/data/rows/${p.row.id}`)).row
  }
  if (!isDeepStrictEqual(back.cells.body.nodes, p.N)) problems.push(`${p.slug}: nodes differ from plan`)
  if (back.cells.templateEnabled !== p.row.cells.templateEnabled) problems.push(`${p.slug}: template flag lost`)
}
const { site: shell1 } = await getSite()
if (!isDeepStrictEqual(shell1.styleRules, shell.styleRules)) problems.push('style rules differ from plan')
for (const f of shell.files) if (shell1.files.find((x) => x.path === f.path)?.content !== f.content) problems.push(`${f.path} differs`)
if (problems.length) { console.error(`READ-BACK PROBLEMS:\n  ${problems.join('\n  ')}`); process.exit(1) }
writeFileSync(STATE, JSON.stringify({ seqs: Object.fromEntries((await getPages()).rows.map((r) => [r.id, r.seq])), shell: sha(shell1) }))
console.log('  readback only the planned changes — re-run with --publish')
