#!/usr/bin/env node
/**
 * apply-ghl-site-forms.mjs — the GoHighLevel forms, embedded directly, in every Invitation chapter of
 * the main site (BugHerd #35 and #21, 2026-10-07). The chapter still carried the site's prototype
 * form, which answered "Thank you…" without sending anything (#35: "it changes to Thank you even
 * though I haven't filled out the form").
 *
 *   node apply-ghl-site-forms.mjs                      # dry run
 *   node apply-ghl-site-forms.mjs --apply              # backup, write the draft
 *   node apply-ghl-site-forms.mjs --apply --publish    # ...and publish (guarded)
 *
 * Forms (location 0iwrVBEYONV6VlSHSGH6, both redirect to /thank-you, email notification on):
 *   West LA Implants - Contact (new site)    DCNQTSgl14CNZ93H7Fi3   every page with .in-form
 *   West LA Implants - Referral (new site)   dnR28L5agKj0fQiuZcuH   /referring-doctors (#21: the
 *        referring provider is the contact; the patient's name and phone are their own fields)
 *
 * The card, its heading and its note stay; the prototype fields and button are replaced by one Embed
 * block with GHL's snippet as GHL gives it (the user's rule: embed directly, style inside GHL).
 * Built on the other session's add-ghl-contact.mjs (same node surgery), with the per-page form and a
 * guarded publish. Re-runnable: an existing block gets its snippet refreshed.
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { api, getPages, getSite, publish, publishStatus, toChangedPage, templateMap, assertTemplatesIntact, BASE } from '../../tools/instatic-api-sync/insta-api.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const MODULE = 'brandklout.embed-origins.embed'
const CLASS = 'invitation_form-embed'
const STYLES = { display: 'block', width: '100%', minHeight: '62rem' }
const FORMS = {
  contact: { id: 'DCNQTSgl14CNZ93H7Fi3', name: 'West LA Implants - Contact (new site)', height: 1545, title: 'Request a consultation' },
  referral: { id: 'dnR28L5agKj0fQiuZcuH', name: 'West LA Implants - Referral (new site)', height: 1900, title: 'Refer a patient' },
}
const formFor = (slug) => (slug === 'referring-doctors' ? FORMS.referral : FORMS.contact)
const snippet = (f) => [
  `<iframe src="https://api.leadconnectorhq.com/widget/form/${f.id}" style="width:100%;height:100%;border:none;border-radius:8px" id="inline-${f.id}" data-layout="{'id':'INLINE'}" data-trigger-type="alwaysShow" data-trigger-value="" data-activation-type="alwaysActivated" data-activation-value="" data-deactivation-type="neverDeactivate" data-deactivation-value="" data-form-name="${f.name}" data-height="${f.height}" data-layout-iframe-id="inline-${f.id}" data-form-id="${f.id}" data-cookie-consent="true" data-cookie-consent-provider="auto" title="${f.name}"></iframe>`,
  '<script src="https://link.msgsndr.com/js/form_embed.js"></script>',
].join('\n')

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = (n = 21) => [...randomBytes(n)].map((b) => ALPHABET[b & 63]).join('')

const start = await publishStatus()
if (!start.draftMatchesPublished) { console.error('REFUSING: the draft already differs from the published site.'); process.exit(1) }
const site = await getSite()
const shell = site.site
const rules = shell.styleRules
const ruleByName = (name) => Object.values(rules).find((r) => r.kind === 'class' && r.name === name)
const nameOf = (id) => rules[id]?.name
const hasClass = (n, c) => (n?.classIds ?? []).some((x) => nameOf(x) === c)
let shellChanged = false
let rule = ruleByName(CLASS)
if (!rule) {
  const order = Math.max(0, ...Object.values(rules).map((r) => r.order ?? 0)) + 1
  rule = { id: nanoid(), name: CLASS, kind: 'class', selector: `.${CLASS}`, order, styles: { ...STYLES }, contextStyles: {}, createdAt: Date.now(), updatedAt: Date.now() }
  rules[rule.id] = rule; shellChanged = true
  console.log(`rule    + .${CLASS}`)
}
const dropSubtree = (nodes, id) => { for (const c of nodes[id]?.children ?? []) dropSubtree(nodes, c); delete nodes[id] }

const { rows } = await getPages()
const startRows = new Map(rows.map((r) => [r.id, { seq: r.seq, updatedAt: r.updatedAt }]))
const changed = []
let placed = 0, refreshed = 0, exact = 0
for (const row of rows) {
  const nodes = row.cells?.body?.nodes
  if (!nodes) continue
  const cards = Object.values(nodes).filter((n) => hasClass(n, 'invitation_form'))
  if (!cards.length) continue
  const f = formFor(row.slug), snip = snippet(f)
  let touched = false
  for (const card of cards) {
    const kids = card.children.map((c) => nodes[c])
    const existing = kids.find((k) => k?.moduleId === MODULE)
    if (existing) {
      if (existing.props?.snippet !== snip) { existing.props = { ...existing.props, snippet: snip, title: f.title }; touched = true; refreshed++ } else exact++
      continue
    }
    const fields = kids.find((k) => hasClass(k, 'invitation_fields'))
    const submit = kids.find((k) => k?.moduleId === 'base.submit')
    if (card.moduleId !== 'base.form' || !fields || !submit) throw new Error(`/${row.slug}: .invitation_form has an unexpected shape (${card.moduleId}: ${kids.map((k) => k?.moduleId).join(', ')})`)
    const made = {
      id: nanoid(), moduleId: MODULE, parentId: card.id, classIds: [rule.id], children: [], breakpointOverrides: {},
      props: { source: 'snippet', snippet: snip, url: '', title: f.title, fit: 'auto', height: 1000, ratio: '16 / 9', lazy: false, allowFullscreen: false, allow: '' },
    }
    nodes[made.id] = made
    card.children = card.children.flatMap((c) => (c === fields.id ? [made.id] : c === submit.id ? [] : [c]))
    dropSubtree(nodes, fields.id)
    dropSubtree(nodes, submit.id)
    card.moduleId = 'base.container'
    card.props = { tag: 'div', customTag: '', htmlAttributes: { ...(card.props?.htmlAttributes ?? {}), id: 'consultForm' } }
    delete card.props.htmlAttributes.novalidate
    touched = true; placed++
  }
  if (touched) { changed.push(row); if (row.slug === 'referring-doctors' || changed.length <= 3) console.log(`/${row.slug || 'index'}  -> ${f.name}`) }
}
console.log(`forms: ${placed} placed, ${refreshed} refreshed, ${exact} exact, on ${changed.length} page(s); shell ${shellChanged ? 'changed' : 'unchanged'}  target ${BASE}`)
if (!APPLY) { console.log('DRY RUN: nothing written. Re-run with --apply.'); process.exit(0) }
if (!changed.length && !shellChanged) process.exit(0)

const dir = path.join(HERE, '.tmp', `backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}-pre-ghl-site-forms`)
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, 'shell.json'), JSON.stringify(await getSite(), null, 1))
const fresh = (await getPages()).rows
for (const r of changed) fs.writeFileSync(path.join(dir, `${r.slug.replace(/\//g, '__') || 'index'}.json`), JSON.stringify(fresh.find((x) => x.id === r.id), null, 1))
console.log(`backup  ${path.relative(HERE, dir)}`)
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
  const ns = Object.values(back.find((x) => x.id === r.id).cells.body.nodes)
  const embeds = ns.filter((x) => x.moduleId === MODULE && hasClass(x, CLASS))
  if (embeds.length && embeds.every((x) => x.props?.snippet === snippet(formFor(r.slug))) && !ns.some((x) => hasClass(x, 'invitation_fields'))) ok++
  else console.log(`check   /${r.slug}: MISMATCH (${embeds.length} embed(s))`)
}
console.log(`check   ${ok}/${changed.length} pages: form embedded, prototype gone`)
await assertTemplatesIntact(templates)
if (ok !== changed.length) process.exit(1)

if (PUBLISH) {
  const mine = new Set(changed.map((r) => r.id))
  const now = (await getPages()).rows
  const moved = now.filter((r) => !mine.has(r.id) && (startRows.get(r.id)?.seq !== r.seq || startRows.get(r.id)?.updatedAt !== r.updatedAt))
  if (moved.length || now.length !== rows.length) { console.error(`REFUSING to publish: rows changed during this run: ${moved.map((r) => r.slug).join(', ')}`); process.exit(1) }
  console.log('publish', JSON.stringify(await publish()).slice(0, 160))
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const s = JSON.stringify(await publishStatus())
    if (!/running|pending|in_progress|building/i.test(s)) { console.log('status ', s.slice(0, 200)); break }
  }
}
