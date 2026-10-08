#!/usr/bin/env node
/**
 * add-ghl-contact.mjs — the site's general GoHighLevel contact form in every Invitation chapter.
 *
 *   node add-ghl-contact.mjs                      # dry run
 *   node add-ghl-contact.mjs --apply              # write the draft
 *   node add-ghl-contact.mjs --apply --publish    # ...and publish
 *
 * Form: "West LA Implants - Contact (new site)" (FORM_ID below), built 2026-10-05 to
 * deliver/process/tools/ghl-forms in location 0iwrVBEYONV6VlSHSGH6, styled for this dark site,
 * redirecting to /thank-you. It is NOT BAZZebJdjQAdGkda1fEE: that one stays on the WordPress
 * /contact page, styled for white, until the domain moves here (client's decision 2026-10-05).
 *
 *   .ch-invitation  form.in-form#consultForm  [h3, .in-fields, submit, .in-note]
 *     ->  div.in-form#consultForm  [h3, Embed block (.in-ghl), .in-note]
 *
 * The card, its heading and the "We reply within one business day / Zocdoc" note stay. The
 * prototype fields and button go. The container keeps id="consultForm": sections/chapters.js
 * looks it up (a null there stops the whole Invitation section) and only fades it in.
 *
 * GOTCHA: push-site.mjs rebuilds every page from dist/, which still carries the prototype form
 * (lib/blocks.mjs invite()). After ANY push, run this again with --apply --publish, after
 * add-ghl-forms.mjs. Re-runnable: an existing block gets its snippet refreshed instead.
 */
import { randomBytes } from 'node:crypto'
import { api, getPages, getSite, publish, publishStatus, toChangedPage, templateMap, assertTemplatesIntact, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const FORM_ID = process.env.WLA_CONTACT_FORM || 'PENDING'
const FORM_NAME = 'West LA Implants - Contact (new site)'
const MODULE = 'brandklout.embed-origins.embed'
const CLASS = 'invitation_form-embed'
const STYLES = { display: 'block', width: '100%', minHeight: '62rem' }
if (!/^[A-Za-z0-9]{20}$/.test(FORM_ID)) throw new Error(`set WLA_CONTACT_FORM to the new form id (got ${FORM_ID})`)

// GHL's inline embed, as the builder gives it (cookie-consent attributes included, as on the
// snippet the client pasted for BAZZebJdjQAdGkda1fEE).
const SNIPPET = [
  `<iframe src="https://api.leadconnectorhq.com/widget/form/${FORM_ID}" style="width:100%;height:100%;border:none;border-radius:8px" id="inline-${FORM_ID}" data-layout="{'id':'INLINE'}" data-trigger-type="alwaysShow" data-trigger-value="" data-activation-type="alwaysActivated" data-activation-value="" data-deactivation-type="neverDeactivate" data-deactivation-value="" data-form-name="${FORM_NAME}" data-height="1545" data-layout-iframe-id="inline-${FORM_ID}" data-form-id="${FORM_ID}" data-cookie-consent="true" data-cookie-consent-provider="auto" title="${FORM_NAME}"></iframe>`,
  '<script src="https://link.msgsndr.com/js/form_embed.js"></script>',
].join('\n')

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')

const site = await getSite()
const shell = site.site
const rules = shell.styleRules ?? (shell.styleRules = {})
const ruleByName = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)
const nameOf = (id) => rules[id]?.name
const hasClass = (n, c) => (n?.classIds ?? []).some((x) => nameOf(x) === c)
let shellChanged = false

let rule = ruleByName(CLASS)
if (!rule) {
  const order = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1
  rule = { id: nanoid(), name: CLASS, kind: 'class', selector: `.${CLASS}`, order, styles: { ...STYLES }, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now() }
  rules[rule.id] = rule
  shellChanged = true
  console.log(`rule    + .${CLASS} (order ${order})`)
} else if (JSON.stringify(rule.styles) !== JSON.stringify(STYLES)) {
  rule.styles = { ...STYLES }; rule.updatedAt = Date.now(); shellChanged = true
  console.log(`rule    ~ .${CLASS} styles refreshed`)
} else console.log(`rule    .${CLASS} already on the shell`)

const dropSubtree = (nodes, id) => {
  for (const c of nodes[id]?.children ?? []) dropSubtree(nodes, c)
  delete nodes[id]
}

const { rows } = await getPages()
const changed = []
let fresh = 0, refreshed = 0, exact = 0
for (const row of rows) {
  const nodes = row.cells?.body?.nodes
  if (!nodes) continue
  const cards = Object.values(nodes).filter((n) => hasClass(n, 'invitation_form'))
  if (!cards.length) continue
  let touched = false
  for (const card of cards) {
    const kids = card.children.map((c) => nodes[c])
    const existing = kids.find((k) => k?.moduleId === MODULE)
    if (existing) {
      if (existing.props?.snippet !== SNIPPET) { existing.props = { ...existing.props, snippet: SNIPPET }; touched = true; refreshed++ } else exact++
      continue
    }
    const fields = kids.find((k) => hasClass(k, 'invitation_fields'))
    const submit = kids.find((k) => k?.moduleId === 'base.submit')
    if (card.moduleId !== 'base.form' || !fields || !submit) throw new Error(`/${row.slug}: .invitation_form has an unexpected shape (${card.moduleId}: ${kids.map((k) => k?.moduleId).join(', ')})`)
    const made = {
      id: nanoid(), moduleId: MODULE, parentId: card.id, classIds: [rule.id], children: [], breakpointOverrides: {},
      props: { source: 'snippet', snippet: SNIPPET, url: '', title: 'Request a consultation', fit: 'auto', height: 1000, ratio: '16 / 9', lazy: false, allowFullscreen: false, allow: '' },
    }
    nodes[made.id] = made
    card.children = card.children.flatMap((c) => (c === fields.id ? [made.id] : c === submit.id ? [] : [c]))
    dropSubtree(nodes, fields.id)
    dropSubtree(nodes, submit.id)
    card.moduleId = 'base.container'
    card.props = { tag: 'div', customTag: '', htmlAttributes: { ...(card.props?.htmlAttributes ?? {}), id: 'consultForm' } }
    touched = true; fresh++
  }
  if (touched) changed.push(row)
}

console.log(`invitation forms: ${fresh} placed, ${refreshed} refreshed, ${exact} already exact, on ${changed.length} page(s) to write`)
console.log(`target ${BASE}  shell seq ${site.seq}  shell ${shellChanged ? 'changed' : 'unchanged'}`)
if (!APPLY) { console.log('DRY RUN — nothing written. Re-run with --apply.'); process.exit(0) }
if (!changed.length && !shellChanged) { console.log('nothing to write'); if (!PUBLISH) process.exit(0) }
else {
  const templates = await templateMap()
  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental', site: shell,
    changedPages: changed.map((r) => ({ ...toChangedPage(r), status: 'published', cells: { ...r.cells } })),
    deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: Object.fromEntries(changed.map((r) => [r.id, r.seq ?? 0])), shellBaseSeq: site.seq,
  })
  console.log(`saved   ${JSON.stringify(res).slice(0, 160)}`)
  const back = (await getPages()).rows
  let ok = 0
  for (const r of changed) {
    const b = back.find((x) => x.id === r.id)
    const ns = Object.values(b.cells.body.nodes)
    const embeds = ns.filter((x) => x.moduleId === MODULE && hasClass(x, CLASS))
    const left = ns.filter((x) => hasClass(x, 'invitation_fields')).length
    if (embeds.length && embeds.every((x) => x.props?.snippet === SNIPPET) && !left) ok++
    else console.log(`check   /${b.slug}: ${embeds.length} embed(s), ${left} prototype field grid(s) left  MISMATCH`)
  }
  console.log(`check   ${ok}/${changed.length} pages exact`)
  await assertTemplatesIntact(templates)
  console.log(`check   templates intact (${Object.keys(templates).length})`)
}

if (PUBLISH) {
  console.log('publish', JSON.stringify(await publish()).slice(0, 160))
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const s = JSON.stringify(await publishStatus())
    if (!/running|pending|in_progress|building/i.test(s)) { console.log('status ', s.slice(0, 200)); break }
  }
}
