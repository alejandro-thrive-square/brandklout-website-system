#!/usr/bin/env node
/**
 * add-elfsight-reviews.mjs — the live Google reviews (Elfsight) where the static cards were.
 *
 *   node add-elfsight-reviews.mjs                      # dry run
 *   node add-elfsight-reviews.mjs --apply              # write the draft
 *   node add-elfsight-reviews.mjs --apply --publish    # ...and publish
 *
 * Widget: Elfsight Google Reviews "West LA Implants", app 670ca31c-8602-42c1-a126-f46f653fe07f,
 * source the practice's listing (12301 Wilshire Blvd #205, 4.9 / 209). Registry of every widget:
 * deliver/process/tools/elfsight-reviews/review-widgets.json on main. Never create, edit or
 * delete a widget from here.
 *
 *   /  #proof  .wrap.pf-grid  (three .pf-quote cards, or the .pf-embed slot the build
 *              emits since 2026-09-30)  ->  ONE Embed block (.pf-embed) inside .pf-grid
 *
 * The heading, the marquee and the "Read our Google reviews" links stay. The `.pf-grid`
 * container stays too: `sections/chapters.js` uses it as a ScrollTrigger anchor. The Embed
 * block is the brandklout.embed-origins module in snippet mode; a page that contains one gets
 * the plugin's compatible CSP, which is what lets platform.js reach Elfsight's API hosts.
 *
 * Also carried on the same write, when they differ from the build:
 *   - the `.pf-embed` class rule on the shell (from css/30-chapters.css)
 *   - `src/scripts/site.js` (GSAP head kept as-is, the site bundle replaced by dist/assets/site.js:
 *     the proof chapter's runtime must not tween an empty `.pf-quote` list, or GSAP warns and
 *     the console gate fails)
 *
 * GOTCHA: push-site.mjs rebuilds every page from dist/, and dist/index.html carries only a plain
 * `.pf-embed` div (importHtml has no Embed module). After ANY push, run this again with
 * --apply --publish; it finds the slot and swaps it for the block. Re-runnable: an existing
 * block gets its snippet refreshed instead.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getPages, getSite, publish, publishStatus, toChangedPage, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(HERE, '../04-design/.tmp/site-src/dist')

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const MODULE = 'brandklout.embed-origins.embed'
const CLASS = 'proof_embed'
const APP = '670ca31c-8602-42c1-a126-f46f653fe07f'
const SNIPPET = [
  '<!-- Elfsight Google Reviews | West LA Implants -->',
  '<script src="https://elfsightcdn.com/platform.js" async></script>',
  // No data-elfsight-app-lazy: with it, platform.js loads and never boots the widget on an
  // Instatic site (0px, no boot request). Verified on Mason Park Kids 2026-09-29.
  `<div class="elfsight-app-${APP}"></div>`,
].join('\n')
// Same declaration as css/30-chapters.css `.pf-embed`, in the registry's camelCase.
const EMBED_STYLES = { gridColumn: '1/-1', display: 'block', width: '100%', minHeight: '420px' }

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')

const site = await getSite()
const shell = site.site
const rules = shell.styleRules ?? (shell.styleRules = {})
const ruleByName = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)
const nameOf = (id) => rules[id]?.name
const hasClass = (n, c) => (n?.classIds ?? []).some((x) => nameOf(x) === c)
let shellChanged = false

// ── the .pf-embed class rule ─────────────────────────────────────────
let embedRule = ruleByName(CLASS)
if (!embedRule) {
  const order = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1
  embedRule = {
    id: nanoid(), name: CLASS, kind: 'class', selector: `.${CLASS}`, order,
    styles: { ...EMBED_STYLES }, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now(),
  }
  rules[embedRule.id] = embedRule
  shellChanged = true
  console.log(`rule    + .${CLASS} (order ${order})`)
} else if (JSON.stringify(embedRule.styles) !== JSON.stringify(EMBED_STYLES)) {
  embedRule.styles = { ...EMBED_STYLES }
  embedRule.updatedAt = Date.now()
  shellChanged = true
  console.log(`rule    ~ .${CLASS} styles refreshed`)
} else console.log(`rule    .${CLASS} already on the shell`)

// ── site.js: the site bundle after the GSAP head must equal the build ────
{
  const file = (shell.files ?? []).find((f) => f.path === 'src/scripts/site.js')
  if (!file) throw new Error('shell has no src/scripts/site.js')
  const marker = '/* ---- site.js ---- */\n'
  const at = file.content.indexOf(marker)
  if (at < 0) throw new Error('site.js on the shell has no "/* ---- site.js ---- */" marker (push-site.mjs writes it)')
  const built = fs.readFileSync(path.join(DIST, 'assets', 'site.js'), 'utf8')
  const live = file.content.slice(at + marker.length)
  if (live === built) console.log('site.js bundle already equals dist/assets/site.js')
  else {
    file.content = file.content.slice(0, at + marker.length) + built
    file.updatedAt = Date.now()
    shellChanged = true
    console.log(`site.js bundle ${live.length} -> ${built.length} bytes (dist/assets/site.js)`)
  }
}

// ── / #proof .pf-grid ───────────────────────────────────────────────
const embedNode = (parentId, classIds) => ({
  id: nanoid(), moduleId: MODULE, parentId, classIds, children: [], breakpointOverrides: {},
  props: { source: 'snippet', snippet: SNIPPET, url: '', title: 'Google reviews', fit: 'auto',
    height: 420, ratio: '16 / 9', lazy: true, allowFullscreen: false, allow: '' },
})
const dropSubtree = (nodes, id) => {
  for (const c of nodes[id]?.children ?? []) dropSubtree(nodes, c)
  delete nodes[id]
}

const { rows } = await getPages()
const changed = []
{
  const row = rows.find((r) => r.slug === 'index')
  if (!row) throw new Error('no index row')
  const nodes = row.cells.body.nodes
  const proof = Object.values(nodes).find((n) => n.props?.htmlAttributes?.id === 'proof')
  if (!proof) throw new Error('/ has no #proof')
  const gridId = (proof.children ?? []).find((c) => hasClass(nodes[c], 'proof_grid'))
  if (!gridId) throw new Error('/ #proof has no .proof_grid')
  const grid = nodes[gridId]
  const existing = (grid.children ?? []).map((c) => nodes[c]).find((n) => n?.moduleId === MODULE)
  if (existing) {
    if (existing.props?.snippet === SNIPPET && hasClass(existing, CLASS)) console.log('/       already has the widget, snippet exact')
    else {
      existing.props = { ...existing.props, snippet: SNIPPET }
      if (!hasClass(existing, CLASS)) existing.classIds = [...(existing.classIds ?? []), embedRule.id]
      console.log('/       widget snippet refreshed')
      changed.push(row)
    }
  } else {
    const old = [...(grid.children ?? [])]
    const kinds = old.map((c) => (nodes[c]?.classIds ?? []).map(nameOf).join('.') || nodes[c]?.moduleId)
    const made = embedNode(grid.id, [embedRule.id])
    for (const c of old) dropSubtree(nodes, c)
    nodes[made.id] = made
    grid.children = [made.id]
    console.log(`/       .proof_grid [${kinds.join(', ')}] -> embed ${made.id}`)
    changed.push(row)
  }
}

console.log(`\ntarget ${BASE}  shell seq ${site.seq}  shell ${shellChanged ? 'changed' : 'unchanged'}  pages ${changed.map((r) => r.slug).join(', ') || 'none'}`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!changed.length && !shellChanged) { console.log('nothing to write'); if (!PUBLISH) process.exit(0) }
else {
  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: shell,
    changedPages: changed.map((r) => ({ ...toChangedPage(r), status: 'published', cells: { ...r.cells } })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])), shellBaseSeq: site.seq,
  })
  console.log(`saved   ${JSON.stringify(res).slice(0, 160)}`)

  // read back
  const back = (await getPages()).rows
  for (const r of changed) {
    const n = Object.values(back.find((x) => x.id === r.id).cells.body.nodes).filter((x) => x.moduleId === MODULE)
    console.log(`check   /${r.slug}: ${n.length} embed(s), snippet ${n[0]?.props?.snippet === SNIPPET ? 'exact' : 'MISMATCH'}`)
  }
  const after = await getSite()
  const f = after.site.files.find((x) => x.path === 'src/scripts/site.js')
  const backRule = Object.values(after.site.styleRules ?? {}).find((r) => r.kind === 'class' && r.name === CLASS)
  console.log(`check   shell seq ${after.seq}, .${CLASS} ${backRule ? 'present' : 'MISSING'}, site.js ${f?.content.length} bytes`)
}

if (PUBLISH) {
  console.log('publish', JSON.stringify(await publish()).slice(0, 160))
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const st = await publishStatus()
    const s = JSON.stringify(st)
    if (!/running|pending|in_progress|building/i.test(s)) { console.log('status ', s.slice(0, 200)); break }
    if (i % 5 === 4) console.log('status ', s.slice(0, 120))
  }
}
