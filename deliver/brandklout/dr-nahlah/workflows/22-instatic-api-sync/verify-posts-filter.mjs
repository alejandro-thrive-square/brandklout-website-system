#!/usr/bin/env node
/**
 * verify-posts-filter.mjs — read-only gate for BugHerd pin #10.
 *
 *   node verify-posts-filter.mjs
 *
 * `push-posts-filter.mjs` verifies its own write, but it short-circuits on a
 * re-run ("already present — nothing to do") and then verifies nothing. This is
 * the check you can run at any time, including after somebody else has written
 * to the same page, and it is what the runbook points at.
 *
 * Every count is SUBTREE-SCOPED. The drawer and the footer live in the same
 * node tree as the page body, so a whole-page grep inflates everything — that
 * is how a previous session read 30 links and cried failure on a write that was
 * perfectly fine.
 *
 * Read-only. Writes nothing, publishes nothing.
 */
import { getSite, getPages, api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
import { TOPICS, topicFor } from './post-image-pool.mjs'

const labelFor = (id) => id.charAt(0).toUpperCase() + id.slice(1)
let fails = 0
const ok = (name, good, got) => {
  console.log(`  ${good ? 'ok  ' : 'FAIL'} ${name}${good ? '' : '   got: ' + JSON.stringify(got)}`)
  if (!good) fails++
}

const { site: shell } = await getSite()
const rules = shell.styleRules ?? {}
const nameOf = (id) => rules[id]?.name
const { rows: pages } = await getPages()
const page = pages.find((r) => r.slug === 'posts')
const nodes = page.cells.body.nodes

console.log('\n=== registry ===')
const CLASS_KIND = ['bl-filter', 'bl-f-field', 'bl-f-label', 'bl-f-input', 'bl-f-select',
  'bl-f-count', 'bl-topic', 'bl-empty', 'bl-clear']
for (const n of CLASS_KIND) {
  ok(`.${n} exists as a class-kind rule (a node can reference it)`,
    Object.values(rules).some((r) => r.kind === 'class' && r.name === n), n)
}
/* Every one of these is a runtime state. They are ATTRIBUTE selectors on
   purpose: an attribute carries no class token, so `styleRuleTreeShake.ts` has
   nothing to purge. A `.is-hidden` class rule that no node references would be
   a known-but-unused class name and would take these down with it — which is
   how `.drawer.open` disappeared. */
for (const sel of ['.bl-card[hidden]', '.bl-grid[hidden]', '.bl-grid[data-bl-active]',
  '.bl-empty[hidden]', '.bl-topic:empty', '#articles .wrap.section']) {
  const r = Object.values(rules).find((x) => x.selector === sel)
  ok(`${sel} present and ambient`, !!r && r.kind === 'ambient', r && r.kind)
}
/* The tree-shake reads class TOKENS out of ambient selectors. Any token that is
   a registered-but-unassigned class-kind rule name purges the whole rule. */
const known = new Set(Object.values(rules).filter((r) => r.kind === 'class').map((r) => r.name))
const assigned = new Set()
for (const p of pages) for (const n of Object.values(p.cells?.body?.nodes ?? {})) {
  for (const c of n.classIds ?? []) if (rules[c]) assigned.add(rules[c].name)
}
const mine = Object.values(rules).filter((r) => r.kind === 'ambient' &&
  /\.(bl-topic|bl-filter|bl-f-|bl-empty|bl-clear|bl-card\[|bl-grid\[)|#articles/.test(r.selector ?? ''))
const atRisk = []
for (const r of mine) {
  for (const tok of (r.selector.match(/\.([A-Za-z][A-Za-z0-9_-]*)/g) ?? []).map((t) => t.slice(1))) {
    if (known.has(tok) && !assigned.has(tok)) atRisk.push(`${r.selector} (via .${tok})`)
  }
}
ok(`${mine.length} ambient rules survive the publish tree-shake`, atRisk.length === 0, atRisk)

console.log('\n=== page nodes ===')
const loop = Object.values(nodes).find((n) => n.moduleId === 'base.loop')
const card = nodes[loop?.children?.[0]]
const wrap = nodes[loop?.parentId]
const filter = Object.values(nodes).find((n) => n.props?.htmlAttributes?.id === 'blFilter')
const empty = Object.values(nodes).find((n) => n.props?.htmlAttributes?.id === 'blEmpty')
const sub = (id) => { const out = []; (function w (i) { const n = nodes[i]; if (!n) return; out.push(n); for (const c of n.children ?? []) w(c) })(id); return out }
const tagOf = (n) => (n?.props?.tag === 'custom' ? n?.props?.customTag : n?.props?.tag)

ok('the grid is still a base.loop over posts', loop?.props?.filters?.tableId === 'posts', loop?.props?.filters)
ok('all rows are still in one page (pagination none, limit >= rows)',
  loop?.props?.pagination === 'none' && (loop?.props?.limit ?? 0) >= 43, loop?.props)
ok('#blFilter is inside the grid wrap, before the loop',
  !!filter && wrap.children.indexOf(filter.id) < wrap.children.indexOf(loop.id),
  wrap?.children?.map((c) => nodes[c]?.props?.htmlAttributes?.id ?? nodes[c]?.moduleId))
ok('#blEmpty is after the loop',
  !!empty && wrap.children.indexOf(empty.id) > wrap.children.indexOf(loop.id), empty?.id)

const chipIdx = (card?.children ?? []).findIndex((c) => (nodes[c]?.classIds ?? []).some((x) => nameOf(x) === 'bl-topic'))
const h2Idx = (card?.children ?? []).findIndex((c) => tagOf(nodes[c]) === 'h2')
const chip = nodes[card?.children?.[chipIdx]]
ok('exactly one .bl-topic chip on the card',
  (card?.children ?? []).filter((c) => (nodes[c]?.classIds ?? []).some((x) => nameOf(x) === 'bl-topic')).length === 1, chipIdx)
ok('the chip is a token, not literal text', chip?.props?.text === '{currentEntry.topic}', chip?.props?.text)
ok('the chip precedes the title', chipIdx >= 0 && h2Idx >= 0 && chipIdx < h2Idx, [chipIdx, h2Idx])
console.log(`       card children: ${(card?.children ?? []).map((c) => {
  const n = nodes[c]
  return (n.classIds ?? []).map(nameOf).join('.') || tagOf(n) || n.moduleId
}).join(' | ')}`)

const inFilter = filter ? sub(filter.id) : []
ok('one <input type=search>', inFilter.filter((n) => n.moduleId === 'base.input' && n.props.inputType === 'search').length === 1)
ok('one <select>', inFilter.filter((n) => n.moduleId === 'base.select').length === 1)
ok('two labels with a real `for` target',
  inFilter.filter((n) => n.moduleId === 'base.label' && n.props.targetMode === 'explicit').length === 2)
const count = inFilter.find((n) => (n.classIds ?? []).some((x) => nameOf(x) === 'bl-f-count'))
ok('the result count is announced (role=status, aria-live=polite)',
  count?.props?.htmlAttributes?.role === 'status' && count?.props?.htmlAttributes?.['aria-live'] === 'polite',
  count?.props?.htmlAttributes)
ok('the clear control is a real <button>, not a link',
  sub(empty?.id).some((n) => n.moduleId === 'base.button' && !n.props.href), 1)

console.log('\n=== the topic data ===')
const { tables } = await api('GET', '/admin/api/cms/data/tables')
const field = tables.find((t) => t.id === 'posts')?.fields?.find((f) => f.id === 'topic')
ok('posts.topic exists as a custom select field', field?.type === 'select' && field?.builtIn !== true, field?.type)
ok(`it offers all ${TOPICS.length} topics`, (field?.options ?? []).length === TOPICS.length, field?.options?.length)

const { rows } = await api('GET', '/admin/api/cms/data/tables/posts/rows')
const wrong = rows.filter((r) => r.cells.topic !== labelFor(topicFor(r.cells.title ?? r.slug).id))
ok(`all ${rows.length} DRAFT rows carry the topic the taxonomy assigns`, wrong.length === 0,
  wrong.slice(0, 3).map((r) => `${r.slug}: ${JSON.stringify(r.cells.topic)}`))

const opts = inFilter.filter((n) => n.moduleId === 'base.option')
const used = new Set(rows.map((r) => topicFor(r.cells.title ?? r.slug).id))
ok(`${opts.length - 1} topic options + "All topics", matching the ${used.size} topics in use`,
  opts.length === used.size + 1, opts.map((o) => o.props.value))
ok('option values are the URL slugs, in taxonomy order',
  JSON.stringify(opts.map((o) => o.props.value)) ===
  JSON.stringify(['', ...TOPICS.filter((t) => used.has(t.id)).map((t) => t.id)]),
  opts.map((o) => o.props.value))

const preview = await api('GET', '/admin/api/cms/data/tables/posts/loop-preview?limit=60')
const items = preview.items ?? []
const withTopic = items.filter((it) => it.fields.topic)
console.log(`\n  published projection: ${withTopic.length}/${items.length} rows carry a topic`)
if (withTopic.length !== items.length) {
  console.log([
    '  NOT a failure. `PATCH /data/rows/:id` writes the DRAFT row; only',
    '  `POST /rows/:id/publish` cuts a version and moves active_version_id, and',
    '  a SITE publish never touches post rows (persistSitePublish reads',
    "  `where table_id = 'pages'`). Until the rows are published every chip",
    '  resolves to "" — .bl-topic:empty hides it, blog-filter.js drops the',
    '  empty topics, and the control degrades to search-only.',
    '',
    '      node publish-post-rows.mjs            # report',
    '      node publish-post-rows.mjs --apply    # 43 row publishes',
  ].join('\n'))
}

console.log(`\n${fails === 0 ? 'ALL CHECKS PASSED' : fails + ' CHECK(S) FAILED'}`)
process.exit(fails === 0 ? 0 : 1)
