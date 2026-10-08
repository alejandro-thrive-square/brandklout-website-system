#!/usr/bin/env node
/**
 * add-ghl-forms.mjs — the campaign Go High Level forms where the prototype form was.
 *
 *   node add-ghl-forms.mjs                      # dry run
 *   node add-ghl-forms.mjs --apply              # write the draft
 *   node add-ghl-forms.mjs --apply --publish    # ...and publish
 *
 * Forms (built 2026-10-05 to deliver/process/tools/ghl-forms, location 0iwrVBEYONV6VlSHSGH6),
 * read from scenario 3's combo.json:
 *   All-on-6 (ChatGPT Ads)   XaCEV96A0QuF9ufEmkSc  -> /ads-landing-pages/all-on-6, all-on-6-consultation
 *   3-on-6 (Google Search)   P15UYHonJj8oH5G8xwKX  -> /ads-landing-pages/3-on-6, 3-on-6-consultation
 *
 *   .lp-card > .lp-slot (the .lp-proto prototype form)  ->  ONE Embed block (.lp-slot .lp-form)
 *
 * The Embed block is the brandklout.embed-origins module in snippet mode with GHL's vendor
 * snippet, unedited apart from the form id and name. `.lp-form` reserves the height (the frame
 * arrives at 150px and grows seconds later). The card, its heading and the phone note stay.
 *
 * GOTCHA: push-site.mjs rebuilds every page from dist/, which still carries the prototype until
 * `formSnippet` is filled in site-src/templates/ads-landing-pages.mjs. After ANY push, run this
 * again with --apply --publish (and add-elfsight-reviews.mjs, add-hipaa-page.mjs). Re-runnable:
 * an existing block gets its snippet refreshed instead.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getPages, getSite, publish, publishStatus, toChangedPage, templateMap, assertTemplatesIntact, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const COMBO = path.resolve(HERE, '../../scenario-3-ads-landing-pages/01-campaign-intake/output/combo.json')

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const MODULE = 'brandklout.embed-origins.embed'
const CLASS = 'landing_form-embed'
// Same as css/60-lp.css `.lp-slot.wz-embed`, in the registry's camelCase.
const FORM_STYLES = { display: 'block', width: '100%', minHeight: '50rem' }

// GHL's inline embed, as the builder gives it (with the cookie-consent attributes the client's own
// snippet carries, 2026-10-05).
const snippet = (id, name) => [
  `<iframe src="https://api.leadconnectorhq.com/widget/form/${id}" style="width:100%;height:100%;border:none;border-radius:3px" id="inline-${id}" data-layout="{'id':'INLINE'}" data-trigger-type="alwaysShow" data-trigger-value="" data-activation-type="alwaysActivated" data-activation-value="" data-deactivation-type="neverDeactivate" data-deactivation-value="" data-form-name="${name}" data-height="1100" data-layout-iframe-id="inline-${id}" data-form-id="${id}" data-cookie-consent="true" data-cookie-consent-provider="auto" title="${name}"></iframe>`,
  '<script src="https://link.msgsndr.com/js/form_embed.js"></script>',
].join('\n')

const combo = JSON.parse(fs.readFileSync(COMBO, 'utf8'))
const TARGETS = combo.campaigns.flatMap((c) => {
  if (!/^[A-Za-z0-9]{20}$/.test(c.formId)) throw new Error(`combo.json: ${c.name} has no form id (${c.formId})`)
  const name = `West LA Implants - ${c.name}`
  return [c.landing, c.consultation].map((slug) => ({ slug: `${combo.prefix}${slug}`, snippet: snippet(c.formId, name), formId: c.formId }))
})

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')

const site = await getSite()
const shell = site.site
const rules = shell.styleRules ?? (shell.styleRules = {})
const ruleByName = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)
const nameOf = (id) => rules[id]?.name
const hasClass = (n, c) => (n?.classIds ?? []).some((x) => nameOf(x) === c)
let shellChanged = false

// ── the .lp-form class rule ──────────────────────────────────────────
let formRule = ruleByName(CLASS)
if (!formRule) {
  const order = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1
  formRule = {
    id: nanoid(), name: CLASS, kind: 'class', selector: `.${CLASS}`, order,
    styles: { ...FORM_STYLES }, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now(),
  }
  rules[formRule.id] = formRule
  shellChanged = true
  console.log(`rule    + .${CLASS} (order ${order})`)
} else if (JSON.stringify(formRule.styles) !== JSON.stringify(FORM_STYLES)) {
  formRule.styles = { ...FORM_STYLES }
  formRule.updatedAt = Date.now()
  shellChanged = true
  console.log(`rule    ~ .${CLASS} styles refreshed`)
} else console.log(`rule    .${CLASS} already on the shell`)
const slotRule = ruleByName('landing_form-slot')
if (!slotRule) throw new Error('shell has no .landing_form-slot rule')

// ── each form page: .lp-slot -> embed ────────────────────────────────
const embedNode = (parentId, snip, title) => ({
  id: nanoid(), moduleId: MODULE, parentId, classIds: [slotRule.id, formRule.id], children: [], breakpointOverrides: {},
  props: { source: 'snippet', snippet: snip, url: '', title, fit: 'auto',
    height: 800, ratio: '16 / 9', lazy: false, allowFullscreen: false, allow: '' },
})
const dropSubtree = (nodes, id) => {
  for (const c of nodes[id]?.children ?? []) dropSubtree(nodes, c)
  delete nodes[id]
}

const { rows } = await getPages()
const changed = []
for (const t of TARGETS) {
  const row = rows.find((r) => r.slug === t.slug)
  if (!row) throw new Error(`no row ${t.slug}`)
  const nodes = row.cells.body.nodes
  const existing = Object.values(nodes).filter((n) => n.moduleId === MODULE && hasClass(n, CLASS))
  if (existing.length) {
    let touched = false
    for (const e of existing) if (e.props?.snippet !== t.snippet) { e.props = { ...e.props, snippet: t.snippet }; touched = true }
    console.log(`/${t.slug}  ${existing.length} form block(s), ${touched ? 'snippet refreshed' : 'snippet exact'}`)
    if (touched) changed.push(row)
    continue
  }
  const slots = Object.values(nodes).filter((n) => hasClass(n, 'landing_form-slot'))
  if (!slots.length) throw new Error(`/${t.slug} has no .landing_form-slot`)
  for (const slot of slots) {
    const parent = nodes[slot.parentId]
    if (!parent) throw new Error(`/${t.slug} .landing_form-slot ${slot.id} has no parent`)
    const made = embedNode(parent.id, t.snippet, `Request a consultation (${t.formId})`)
    const at = parent.children.indexOf(slot.id)
    dropSubtree(nodes, slot.id)
    nodes[made.id] = made
    parent.children.splice(at, 1, made.id)
    console.log(`/${t.slug}  .landing_form-slot ${slot.id} (in .${(parent.classIds ?? []).map(nameOf).join('.')}) -> embed ${made.id} form ${t.formId}`)
  }
  changed.push(row)
}

console.log(`\ntarget ${BASE}  shell seq ${site.seq}  shell ${shellChanged ? 'changed' : 'unchanged'}  pages ${changed.map((r) => r.slug).join(', ') || 'none'}`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!changed.length && !shellChanged) { console.log('nothing to write'); if (!PUBLISH) process.exit(0) }
else {
  // a site-document save has dropped template flags before (every article 404d): check after
  const templates = await templateMap()
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
    const t = TARGETS.find((x) => x.slug === r.slug)
    const b = back.find((x) => x.id === r.id)
    const n = Object.values(b.cells.body.nodes).filter((x) => x.moduleId === MODULE)
    console.log(`check   /${b.slug}: ${n.length} embed(s), snippet ${n.every((x) => x.props?.snippet === t.snippet) ? 'exact' : 'MISMATCH'}, slots left ${Object.values(b.cells.body.nodes).filter((x) => hasClass(x, 'lp-slot') && x.moduleId !== MODULE).length}`)
  }
  const after = await getSite()
  await assertTemplatesIntact(templates)
  console.log(`check   templates intact (${Object.keys(templates).length})`)
  console.log(`check   shell seq ${after.seq}, .${CLASS} ${Object.values(after.site.styleRules ?? {}).some((r) => r.kind === 'class' && r.name === CLASS) ? 'present' : 'MISSING'}`)
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
