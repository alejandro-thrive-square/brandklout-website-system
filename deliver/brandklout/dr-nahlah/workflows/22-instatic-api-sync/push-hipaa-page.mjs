#!/usr/bin/env node
/**
 * push-hipaa-page.mjs — /hipaa-disclosure, the HHS model Notice of Privacy
 * Practices our Webflow sites carry (2026-10-01).
 *
 *   node push-hipaa-page.mjs                 # plan only, against INSTATIC_BASE_URL (production)
 *   node push-hipaa-page.mjs --apply         # write the DRAFT page (+ OG / schema records where siblings have them)
 *   node push-hipaa-page.mjs --publish       # publish, only if the new page is the draft's ONLY difference
 *   INSTATIC_BASE_URL=https://staging.drnahlah.com node push-hipaa-page.mjs ...
 *
 * An INJECTION, not a sweep: one new page row, nothing else in the site
 * document changes. The page is a copy of THIS host's live
 * /privacy-policy-maclean (nav, drawer, hero, footer and every class id are the
 * host's own) with the hero words and the `.lg-body` children replaced. The
 * body follows the site's legal convention (css/57-legal.css + gen-legal.mjs):
 * `<section><h2>` per heading, `<p>` per paragraph, list items as "• "
 * paragraphs. An <h3> would pick up `.pk h3{font-size:var(--h3)}` and render
 * LARGER than the h2s, so the model notice's sub-headings are h2s here too.
 *
 * Wording is the canonical Webflow notice, verbatim, except the practice
 * parts: the two legal entities (one per office, as the site's own privacy
 * and terms pages name them), the display name, both addresses and phones,
 * the Privacy Policy link (the /privacy-policy chooser) and the date.
 * No practice email is published anywhere on the site, so the email line is
 * left out rather than invented.
 *
 * Publishing ships the whole draft, and per-row publish cannot serve a page
 * (a page row needs a site snapshot only a full publish creates). So
 * --publish refuses unless every other row's seq and the shell are exactly
 * as --apply recorded them.
 */
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { api, getSite, getPages, BASE } from './sedation-api.mjs'

const APPLY = process.argv.includes('--apply')
const PUBLISH = process.argv.includes('--publish')
const SRC = 'privacy-policy-maclean'
const DST = 'hipaa-disclosure'
const TITLE = 'HIPAA Disclosure | Dr. Nahlah Implants & Prosthodontics'
const DESCRIPTION = 'Notice of Privacy Practices for the McLean and Alexandria offices: how your health information may be used and shared, and your rights under HIPAA.'
const OG = '/admin/api/cms/plugins/brandklout.open-graph/runtime'
const AEO = '/admin/api/cms/plugins/brandklout.aeo-schema/runtime'
const HOST = BASE.replace(/^https?:\/\//, '')
const STATE = `.tmp/hipaa/state-${HOST}.json`
mkdirSync('.tmp/hipaa', { recursive: true })

const ALPHABET = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const nanoid = () => { const b = randomBytes(21); let s = ''; for (let i = 0; i < 21; i++) s += ALPHABET[b[i] & 63]; return s }
const slugOf = (r) => r.cells?.slug ?? r.slug
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex')

// ── the notice ──────────────────────────────────────────────────────────────
// Blocks: ['h', text] opens a section · ['p', text] · ['li', text] → "• text"
// · ['pl', [text | {href, text}, ...]] a paragraph carrying links.
const HHS_COMPLAINTS = { href: 'https://www.hhs.gov/ocr/privacy/hipaa/complaints/', text: 'www.hhs.gov/ocr/privacy/hipaa/complaints/' }
const HHS_CONSUMERS = { href: 'https://www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/index.html', text: 'www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/index.html' }
const HHS_NPP = { href: 'https://www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/noticepp.html', text: 'www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/noticepp.html' }

const INTRO = ['This Notice of Privacy Practices applies to Esam Abou Nahlah, DDS, MS, PLLC (McLean office) and Implants And Prosthodontics Specialists, PLLC (Alexandria office) (“Dr. Nahlah Implants & Prosthodontics Specialists,” “we,” “us,” or “our”). For information about how we handle information collected through our website and other communications, please see our ', { href: '/privacy-policy', text: 'Privacy Policy' }, '.']

const BLOCKS = [
  ['pl', INTRO],
  ['h', 'Esam Abou Nahlah, DDS, MS, PLLC'],
  ['p', 'Tysons Corner · McLean office'],
  ['p', '7901 Jones Branch Dr., Suite 220'],
  ['p', 'McLean, VA 22102'],
  ['p', 'Phone: (703) 448-3312'],
  ['p', 'Website: https://www.drnahlah.com'],
  ['h', 'Implants And Prosthodontics Specialists, PLLC'],
  ['p', 'Alexandria office'],
  ['p', '2855 Duke St'],
  ['p', 'Alexandria, VA 22314'],
  ['p', 'Phone: (571) 617-7245 (new patients), (703) 940-5410 (current patients)'],
  ['p', 'Website: https://www.drnahlah.com'],
  ['h', 'Your Rights'],
  ['p', 'You have the right to:'],
  ['li', 'Get a copy of your paper or electronic medical record'],
  ['li', 'Correct your paper or electronic medical record'],
  ['li', 'Request confidential communication'],
  ['li', 'Ask us to limit the information we share'],
  ['li', 'Get a list of those with whom we’ve shared your information'],
  ['li', 'Get a copy of this privacy notice'],
  ['li', 'Choose someone to act for you'],
  ['li', 'File a complaint if you believe your privacy rights have been violated'],
  ['h', 'Your Choices'],
  ['p', 'You have some choices in the way that we use and share information as we:'],
  ['li', 'Tell family and friends about your condition'],
  ['li', 'Provide disaster relief'],
  ['li', 'Include you in a hospital directory'],
  ['li', 'Provide mental health care'],
  ['li', 'Market our services and sell your information'],
  ['li', 'Raise funds'],
  ['h', 'Our Uses and Disclosures'],
  ['p', 'We may use and share your information as we:'],
  ['li', 'Treat you'],
  ['li', 'Run our organization'],
  ['li', 'Bill for your services'],
  ['li', 'Help with public health and safety issues'],
  ['li', 'Do research'],
  ['li', 'Comply with the law'],
  ['li', 'Respond to organ and tissue donation requests'],
  ['li', 'Work with a medical examiner or funeral director'],
  ['li', 'Address workers’ compensation, law enforcement, and other government requests'],
  ['li', 'Respond to lawsuits and legal actions'],
  ['h', 'Your Rights'],
  ['p', 'When it comes to your health information, you have certain rights. This section explains your rights and some of our responsibilities to help you.'],
  ['h', 'Get an electronic or paper copy of your medical record'],
  ['li', 'You can ask to see or get an electronic or paper copy of your medical record and other health information we have about you. Ask us how to do this.'],
  ['li', 'We will provide a copy or a summary of your health information, usually within 30 days of your request. We may charge a reasonable, cost-based fee.'],
  ['h', 'Ask us to correct your medical record'],
  ['li', 'You can ask us to correct health information about you that you think is incorrect or incomplete. Ask us how to do this.'],
  ['li', 'We may say “no” to your request, but we’ll tell you why in writing within 60 days.'],
  ['h', 'Request confidential communications'],
  ['li', 'You can ask us to contact you in a specific way (for example, home or office phone) or to send mail to a different address.'],
  ['li', 'We will say “yes” to all reasonable requests.'],
  ['h', 'Ask us to limit what we use or share'],
  ['li', 'You can ask us not to use or share certain health information for treatment, payment, or our operations. We are not required to agree to your request, and we may say “no” if it would affect your care.'],
  ['li', 'If you pay for a service or health care item out-of-pocket in full, you can ask us not to share that information for the purpose of payment or our operations with your health insurer. We will say “yes” unless a law requires us to share that information.'],
  ['h', 'Get a list of those with whom we’ve shared information'],
  ['li', 'You can ask for a list (accounting) of the times we’ve shared your health information for six years prior to the date you ask, who we shared it with, and why.'],
  ['li', 'We will include all the disclosures except for those about treatment, payment, and health care operations, and certain other disclosures (such as any you asked us to make). We’ll provide one accounting a year for free but will charge a reasonable, cost-based fee if you ask for another one within 12 months.'],
  ['h', 'Get a copy of this privacy notice'],
  ['p', 'You can ask for a paper copy of this notice at any time, even if you have agreed to receive the notice electronically. We will provide you with a paper copy promptly.'],
  ['h', 'Choose someone to act for you'],
  ['li', 'If you have given someone medical power of attorney or if someone is your legal guardian, that person can exercise your rights and make choices about your health information.'],
  ['li', 'We will make sure the person has this authority and can act for you before we take any action.'],
  ['h', 'File a complaint if you feel your rights are violated'],
  ['li', 'You can complain if you feel we have violated your rights by contacting us using the contact information at the top of this notice.'],
  ['pl', ['• You can file a complaint with the U.S. Department of Health and Human Services Office for Civil Rights by sending a letter to 200 Independence Avenue, S.W., Washington, D.C. 20201, calling 1-877-696-6775, or visiting ', HHS_COMPLAINTS]],
  ['li', 'We will not retaliate against you for filing a complaint.'],
  ['h', 'Your Choices'],
  ['p', 'For certain health information, you can tell us your choices about what we share. If you have a clear preference for how we share your information in the situations described below, talk to us. Tell us what you want us to do, and we will follow your instructions.'],
  ['p', 'In these cases, you have both the right and choice to tell us to:'],
  ['li', 'Share information with your family, close friends, or others involved in your care'],
  ['li', 'Share information in a disaster relief situation'],
  ['li', 'Include your information in a hospital directory'],
  ['p', 'If you are not able to tell us your preference, for example if you are unconscious, we may go ahead and share your information if we believe it is in your best interest. We may also share your information when needed to lessen a serious and imminent threat to health or safety.'],
  ['p', 'In these cases we never share your information unless you give us written permission:'],
  ['li', 'Marketing purposes'],
  ['li', 'Sale of your information'],
  ['li', 'Most sharing of psychotherapy notes'],
  ['p', 'In the case of fundraising:'],
  ['li', 'We may contact you for fundraising efforts, but you can tell us not to contact you again.'],
  ['h', 'Our Uses and Disclosures'],
  ['p', 'How do we typically use or share your health information?'],
  ['p', 'We typically use or share your health information in the following ways.'],
  ['h', 'Treat you'],
  ['p', 'We can use your health information and share it with other professionals who are treating you.'],
  ['p', 'Example: A doctor treating you for an injury asks another doctor about your overall health condition.'],
  ['h', 'Run our organization'],
  ['p', 'We can use and share your health information to run our practice, improve your care, and contact you when necessary.'],
  ['p', 'Example: We use health information about you to manage your treatment and services.'],
  ['h', 'Bill for your services'],
  ['p', 'We can use and share your health information to bill and get payment from health plans or other entities.'],
  ['p', 'Example: We give information about you to your health insurance plan so it will pay for your services.'],
  ['h', 'How else can we use or share your health information?'],
  ['pl', ['We are allowed or required to share your information in other ways – usually in ways that contribute to the public good, such as public health and research. We have to meet many conditions in the law before we can share your information for these purposes. For more information see: ', HHS_CONSUMERS, '.']],
  ['h', 'Help with public health and safety issues'],
  ['p', 'We can share health information about you for certain situations such as:'],
  ['li', 'Preventing disease'],
  ['li', 'Helping with product recalls'],
  ['li', 'Reporting adverse reactions to medications'],
  ['li', 'Reporting suspected abuse, neglect, or domestic violence'],
  ['li', 'Preventing or reducing a serious threat to anyone’s health or safety'],
  ['h', 'Do research'],
  ['p', 'We can use or share your information for health research.'],
  ['h', 'Comply with the law'],
  ['p', 'We will share information about you if state or federal laws require it, including with the Department of Health and Human Services if it wants to see that we’re complying with federal privacy law.'],
  ['h', 'Respond to organ and tissue donation requests'],
  ['p', 'We can share health information about you with organ procurement organizations.'],
  ['h', 'Work with a medical examiner or funeral director'],
  ['p', 'We can share health information with a coroner, medical examiner, or funeral director when an individual dies.'],
  ['h', 'Address workers’ compensation, law enforcement, and other government requests'],
  ['p', 'We can use or share health information about you:'],
  ['li', 'For workers’ compensation claims'],
  ['li', 'For law enforcement purposes or with a law enforcement official'],
  ['li', 'With health oversight agencies for activities authorized by law'],
  ['li', 'For special government functions such as military, national security, and presidential protective services'],
  ['h', 'Respond to lawsuits and legal actions'],
  ['p', 'We can share health information about you in response to a court or administrative order, or in response to a subpoena.'],
  ['h', 'Redisclosure According to HIPAA'],
  ['p', 'When you consent to uses and disclosures for all future treatment and payment purposes and to run our business, we may share your information with other substance use disorder treatment programs, doctors’ offices, and health care businesses for those activities. If the person who receives it is subject to HIPAA, then they are allowed to use and share your information again without your consent for the purposes that HIPAA allows. Your information still cannot be used in legal proceedings against you unless (1) you consent or (2) based on a Part 2 court order and a subpoena (or similar legal requirement).'],
  ['h', 'Our Responsibilities'],
  ['li', 'We are required by law to maintain the privacy and security of your protected health information.'],
  ['li', 'We will let you know promptly if a breach occurs that may have compromised the privacy or security of your information.'],
  ['li', 'We must follow the duties and privacy practices described in this notice and give you a copy of it.'],
  ['li', 'We will not use or share your information other than as described here unless you tell us we can in writing. If you tell us we can, you may change your mind at any time. Let us know in writing if you change your mind.'],
  ['pl', ['For more information see: ', HHS_NPP, '.']],
  ['h', 'Changes to the Terms of this Notice'],
  ['p', 'We can change the terms of this notice, and the changes will apply to all information we have about you. The new notice will be available upon request, in our office, and on our web site.'],
]
// The model notice's opening statement and its required header line go in the
// hero, where the sibling legal pages put their opening paragraph.
const HERO_LEAD = 'Your Information. Your Rights. Our Responsibilities. This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.'
const EFFECTIVE = 'Effective Date: October 1, 2026'

// ── read ────────────────────────────────────────────────────────────────────
console.log(HOST, APPLY ? '(apply)' : PUBLISH ? '(publish)' : '(plan)')
const status = await api('GET', '/admin/api/cms/publish/status')
const rows = (await getPages()).rows
const existing = rows.find((r) => slugOf(r) === DST) ?? null
const others = Object.fromEntries(rows.filter((r) => slugOf(r) !== DST).map((r) => [r.id, r.seq]))
const { site: shell0, seq: shellSeq0 } = await getSite()
console.log(`  status   ${JSON.stringify(status)}`)

if (PUBLISH) {
  if (!existsSync(STATE)) { console.error('no --apply state for this host'); process.exit(1) }
  const st = JSON.parse(readFileSync(STATE, 'utf8'))
  const moved = Object.entries(others).filter(([id, s]) => st.others[id] !== s).map(([id]) => slugOf(rows.find((r) => r.id === id)))
  const gone = Object.keys(st.others).filter((id) => !(id in others))
  const shellNow = sha(shell0)
  console.log(`  rows     ${Object.keys(others).length} others, moved since apply: ${moved.length ? moved.join(', ') : 'none'}, gone: ${gone.length}`)
  console.log(`  shell    ${shellNow === st.shellAfter ? 'unchanged since apply' : 'CHANGED since apply'}`)
  console.log(`  new page ${existing ? existing.id + ' seq ' + existing.seq : 'MISSING'} (apply wrote seq ${st.pageSeq})`)
  if (moved.length || gone.length || shellNow !== st.shellAfter || !existing || existing.seq !== st.pageSeq
    || status.draftPages !== status.publishedPages + 1) {
    console.error('REFUSING TO PUBLISH: the draft holds something other than the new page')
    process.exit(1)
  }
  const r = await api('POST', '/admin/api/cms/publish', {})
  console.log('published', JSON.stringify(r).slice(0, 300))
  console.log('after', JSON.stringify(await api('GET', '/admin/api/cms/publish/status')))
  process.exit(0)
}

if (!status.draftMatchesPublished && !existing) {
  console.error('REFUSING: the draft already differs from live — someone else has unpublished work here')
  process.exit(1)
}
const src = rows.find((r) => slugOf(r) === SRC)
if (!src) { console.error(`no /${SRC}`); process.exit(1) }

// class name → id on THIS host
const cls = {}
for (const [id, rule] of Object.entries(shell0.styleRules ?? {})) if (rule.name) (cls[rule.name] ??= []).push(id)
const nodesSrc = src.cells.body.nodes
const hasCls = (n, name) => (n.classIds ?? []).some((c) => cls[name]?.includes(c))
const findOne = (pred, what) => {
  const hit = Object.values(nodesSrc).filter(pred)
  if (hit.length !== 1) { console.error(`expected one ${what}, found ${hit.length}`); process.exit(1) }
  return hit[0]
}

// ── copy with fresh ids ─────────────────────────────────────────────────────
const map = new Map(Object.keys(nodesSrc).map((id) => [id, nanoid()]))
const nodes = {}
for (const [id, n0] of Object.entries(nodesSrc)) {
  const n = structuredClone(n0)
  n.id = map.get(id)
  n.parentId = n.parentId == null ? null : map.get(n.parentId)
  n.children = Array.isArray(n.children) ? n.children.map((c) => map.get(c)) : []
  nodes[n.id] = n
}
const rootNodeId = map.get(src.cells.body.rootNodeId)
const N = (srcNode) => nodes[map.get(srcNode.id)]

// hero
const crumb = findOne((n) => hasCls(n, 'pk-crumb'), '.pk-crumb')
const crumbSpan = N(crumb).children.map((c) => nodes[c]).find((c) => c.moduleId === 'base.text' && c.props.tag === 'span')
crumbSpan.props.text = 'HIPAA Disclosure'
const h1 = findOne((n) => n.props?.customTag === 'h1', 'h1')
const [w1, w2, w3] = N(h1).children.map((c) => nodes[c])
w1.props.text = 'HIPAA '; w2.props.text = 'disclosure'; w3.props.text = '.'
const lead = findOne((n) => hasCls(n, 'ph-lead'), '.ph-lead')
N(lead).props.text = HERO_LEAD
const btn = findOne((n) => n.moduleId === 'base.button' && n.props?.href === '#document', 'hero button')
N(btn).props.label = 'Read the notice'

// body: keep the .lg-intro shape, replace everything in .lg-body
const body = N(findOne((n) => hasCls(n, 'lg-body'), '.lg-body'))
const introSrc = findOne((n) => hasCls(n, 'lg-intro'), '.lg-intro')
const drop = (id) => { for (const c of nodes[id].children) drop(c); delete nodes[id] }
const introId = map.get(introSrc.id)
for (const c of body.children) if (c !== introId) drop(c)
for (const c of nodes[introId].children) drop(c)
const mk = (parentId, moduleId, props) => {
  const n = { id: nanoid(), moduleId, props: { ...props, htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds: [], parentId }
  nodes[n.id] = n
  nodes[parentId].children.push(n.id)
  return n
}
const text = (parentId, t, tag) => mk(parentId, 'base.text', { text: t, tag })
const runs = (parentId, parts) => {
  for (const part of parts) {
    if (typeof part === 'string') text(parentId, part, 'none')
    else mk(parentId, 'base.link', { href: part.href, text: part.text, target: '_self' })
  }
}
nodes[introId].children = []
text(introId, EFFECTIVE, 'none')
body.children = [introId]
let section = null
for (const [kind, v] of BLOCKS) {
  if (kind === 'h') {
    section = mk(body.id, 'base.container', { tag: 'section', customTag: '' })
    text(section.id, v, 'h2')
    continue
  }
  const parent = section?.id ?? body.id
  if (kind === 'p') text(parent, v, 'p')
  else if (kind === 'li') text(parent, `• ${v}`, 'p')
  else if (kind === 'pl') runs(mk(parent, 'base.container', { tag: 'custom', customTag: 'p' }).id, v)
}

// ── checks on the planned page ──────────────────────────────────────────────
const all = Object.values(nodes)
const flat = JSON.stringify(all.map((n) => n.props))
const bad = ['Stone', 'Westlake', '817', 'stonesurgicalarts', 'grandmission', '281) 789'].filter((s) => flat.includes(s))
const orphans = all.filter((n) => n.parentId && !nodes[n.parentId]).length
const dangling = all.flatMap((n) => n.children).filter((c) => !nodes[c]).length
const sections = all.filter((n) => n.props?.tag === 'section' && n.parentId === body.id).length
console.log(`  source   /${SRC} ${src.id} ${Object.keys(nodesSrc).length} nodes`)
console.log(`  target   /${DST} ${existing ? 'REPLACE ' + existing.id : 'CREATE'}  ${all.length} nodes, ${sections} sections, title "${TITLE}"`)
console.log(`  checks   foreign practice strings: ${bad.length ? bad.join(',') : 'none'}; orphans ${orphans}; dangling children ${dangling}; nodes without children[] ${all.filter((n) => !Array.isArray(n.children)).length}`)
if (bad.length || orphans || dangling) process.exit(1)
writeFileSync(`.tmp/hipaa/planned-${HOST}.json`, JSON.stringify({ title: TITLE, slug: DST, rootNodeId, nodes }, null, 1))

// sibling SEO records on this host: write ours only where the siblings have theirs
const og = await api('GET', `${OG}/pages`)
const ogSib = (og.pages ?? []).find((p) => p.slug === SRC)?.override ?? null
const aeo = await api('GET', `${AEO}/entries`)
const aeoSib = (aeo.entries ?? []).find((e) => e.slug === SRC)?.block ?? null
console.log(`  og       sibling override ${ogSib ? 'yes -> write one' : 'none -> none'}; aeo sibling block ${aeoSib ? 'yes -> write one' : 'none -> none'}`)

if (!APPLY) { console.log('\nplan only — pass --apply'); process.exit(0) }

// ── write: the page (one changedPages entry; the shell goes back untouched) ──
const pageId = existing?.id ?? nanoid()
const shellBefore = sha(shell0)
const res = await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: shell0,
  changedPages: [{ id: pageId, slug: DST, title: TITLE, nodes, rootNodeId }],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: existing ? { [pageId]: existing.seq } : {}, shellBaseSeq: shellSeq0,
})
console.log(`  saved    seq ${res?.seq}`)
const back = (await api('GET', `/admin/api/cms/data/rows/${pageId}`)).row
const nBack = Object.keys(back.cells.body.nodes).length
if (nBack !== all.length || slugOf(back) !== DST || back.cells.title !== TITLE) {
  console.error(`READ-BACK MISMATCH: ${nBack} nodes, /${slugOf(back)}, "${back.cells.title}"`); process.exit(1)
}
console.log(`  page     read back: /${DST} ${pageId} ${nBack} nodes`)

// SEO cells merge through PATCH (a flat slug, so the route is not disturbed)
await api('PATCH', `/admin/api/cms/data/rows/${pageId}`, { cells: { ...back.cells, seoTitle: TITLE, seoDescription: DESCRIPTION } })
const back2 = (await api('GET', `/admin/api/cms/data/rows/${pageId}`)).row
if (back2.cells.seoDescription !== DESCRIPTION || slugOf(back2) !== DST || Object.keys(back2.cells.body.nodes).length !== nBack) {
  console.error('SEO cells READ-BACK MISMATCH'); process.exit(1)
}
console.log('  seo      seoTitle + seoDescription cells written and read back')

if (ogSib) {
  await api('POST', `${OG}/override`, { key: DST, title: TITLE, description: DESCRIPTION, image: ogSib.image, imageAlt: ogSib.imageAlt, type: 'website', enabled: true })
  console.log('  og       override written')
}
if (aeoSib) {
  const json = aeoSib.json.replaceAll(`/${SRC}`, `/${DST}`).replace(/"name":"[^"]*"/, `"name":${JSON.stringify(TITLE)}`)
  await api('POST', `${AEO}/entry`, { key: DST, json, note: 'push-hipaa-page, 2026-10-01', enabled: true })
  console.log('  aeo      WebPage block written')
}

// ── record the draft state --publish must find ──────────────────────────────
const rowsAfter = (await getPages()).rows
const othersAfter = Object.fromEntries(rowsAfter.filter((r) => slugOf(r) !== DST).map((r) => [r.id, r.seq]))
const movedByUs = Object.keys(others).filter((id) => others[id] !== othersAfter[id])
const { site: shell1 } = await getSite()
const shellAfter = sha(shell1)
console.log(`  others   ${Object.keys(othersAfter).length} rows, seq moved during our write: ${movedByUs.length}`)
console.log(`  shell    content ${shellAfter === shellBefore ? 'identical' : 'DIFFERS'} after our write`)
const pageSeq = rowsAfter.find((r) => r.id === pageId).seq
writeFileSync(STATE, JSON.stringify({ pageId, pageSeq, others: othersAfter, shellBefore, shellAfter, at: new Date().toISOString() }, null, 1))
console.log(`  status   ${JSON.stringify(await api('GET', '/admin/api/cms/publish/status'))}`)
console.log('draft only — re-run with --publish')
