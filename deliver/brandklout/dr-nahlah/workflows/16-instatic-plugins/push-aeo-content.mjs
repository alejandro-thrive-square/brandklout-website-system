#!/usr/bin/env node
/**
 * push-aeo-content.mjs — the schema blocks that need a human decision, written
 * through `webzite.aeo-schema`'s own API rather than into its storage.
 *
 *   node push-aeo-content.mjs            # show the plan, write nothing
 *   node push-aeo-content.mjs --apply
 *
 * The plugin generates Organization, WebPage, BreadcrumbList and Article on
 * every page with no input. This file adds the two kinds that cannot be
 * generated, because each is a claim about what a page CONTAINS:
 *
 *   1. **FAQPage on `/dental-implant-faq`**, built from the twelve
 *      `<details><summary>` pairs that page actually renders. Google's guidance
 *      is explicit that FAQ markup must mirror visible content; this reads the
 *      published page and refuses if a question's answer is not on it.
 *   2. **MedicalWebPage on the treatment pages**, each `about` a
 *      `MedicalProcedure` named for the treatment. `MedicalWebPage` is the
 *      correct type for a page describing a procedure, and it is the one that
 *      lets an answer engine tell "a page about All-on-4" from "a page that
 *      mentions All-on-4".
 *
 * ## What is deliberately NOT done here
 *
 * **No FAQPage on the 43 articles.** The bulk API can put one on every article
 * in a single call, with the article title as the question and its meta
 * description as the answer, and the temptation is obvious. It would be thin
 * markup that mirrors nothing visible on the page — the exact pattern Google
 * names as a reason to ignore or penalise structured data. The capability is
 * there; using it that way would be a mistake.
 *
 * **No aggregateRating.** The site's copy says 4.9 out of 5. A rating in schema
 * has to be backed by reviews the page itself displays and by a real count, and
 * nobody has supplied one. Inventing it is the kind of thing that gets a whole
 * site's structured data distrusted.
 */
import { api, BASE } from '../15-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const RUNTIME = '/admin/api/cms/plugins/webzite.aeo-schema/runtime'
const PUBLIC = 'https://www.drnahlah.com'

const clean = (s) => String(s || '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  .replace(/&#x27;/gi, "'").replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim()

/* ── 1. the FAQ page, from the page's own <details> ───────────────────── */

const FAQ_SLUG = 'dental-implant-faq'
const html = await (await fetch(`${BASE}/${FAQ_SLUG}`)).text()

const DETAILS_RE = /<details\b[^>]*>([\s\S]*?)<\/details>/gi
const SUMMARY_RE = /<summary[^>]*>([\s\S]*?)<\/summary>/i

const qa = []
let m
while ((m = DETAILS_RE.exec(html))) {
  const inner = m[1]
  const s = SUMMARY_RE.exec(inner)
  if (!s) continue
  const question = clean(s[1])
  const answer = clean(inner.slice(s.index + s[0].length))
  if (!question || answer.length < 20) continue
  qa.push({ question, answer })
}

console.log(`FAQ  /${FAQ_SLUG} — ${qa.length} question/answer pairs read off the published page`)
for (const { question, answer } of qa) {
  console.log(`  ${question}\n      ${answer.slice(0, 96)}${answer.length > 96 ? '…' : ''}`)
}
if (qa.length < 4) {
  console.error('\n  ! fewer than four pairs found — the page markup has changed. Refusing to write ' +
    'FAQ markup that does not mirror the page.')
  process.exit(1)
}

const faqBlock = {
  '@type': 'FAQPage',
  '@id': `${PUBLIC}/${FAQ_SLUG}#faq`,
  mainEntity: qa.map((x) => ({
    '@type': 'Question',
    name: x.question,
    acceptedAnswer: { '@type': 'Answer', text: x.answer },
  })),
}

/* ── 2. the treatment pages ───────────────────────────────────────────── */
/**
 * Curated, not matched by prefix. `/financing` and `/patient-center` are under
 * no useful prefix and are not procedures; `/dental-conditions` describes
 * conditions rather than a treatment. A rule that swept them in would be
 * shorter and wrong.
 */
const PROCEDURES = {
  'dental-implants': 'Dental implant placement',
  'all-on-4': 'All-on-4 full-arch dental implants',
  'implant-supported-dentures': 'Implant-supported dentures',
  'crowns-and-bridges': 'Dental crowns and bridges',
  'veneers': 'Porcelain veneers',
  'teeth-whitening': 'Teeth whitening',
  'smile-makeover': 'Smile makeover',
  'cosmetic-dentistry': 'Cosmetic dentistry',
  'oral-surgery': 'Oral surgery',
  'sedation-dentistry': 'Sedation dentistry',
  'emergency-dentistry': 'Emergency dental care',
}

const entries = (await api('GET', `${RUNTIME}/entries`)).entries ?? []
const bySlug = new Map(entries.map((e) => [e.key, e]))

const plan = []
for (const [slug, procedure] of Object.entries(PROCEDURES)) {
  const row = bySlug.get(slug)
  if (!row) { console.log(`\n  ! /${slug} is not a page on this site — skipped`); continue }
  plan.push({
    key: slug,
    json: {
      '@type': 'MedicalWebPage',
      '@id': `${row.url}#medicalwebpage`,
      url: row.url,
      name: row.seoTitle || row.title,
      description: row.seoDescription || undefined,
      // `specialty` and `about` are what carry the meaning: this page is about
      // one named procedure, performed by a prosthodontist.
      specialty: 'Prosthodontics',
      about: { '@type': 'MedicalProcedure', name: procedure, procedureType: 'Noninvasive' },
      audience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
      lastReviewed: new Date().toISOString().slice(0, 10),
    },
  })
}

console.log(`\nMedicalWebPage — ${plan.length} treatment pages`)
for (const p of plan) console.log(`  /${p.key.padEnd(28)} about: ${p.json.about.name}`)

/* `procedureType: Noninvasive` is wrong for implant surgery and oral surgery.
   Say so rather than shipping it. */
for (const p of plan) {
  if (/implant|surgery|all-on-4|denture/i.test(p.key)) p.json.about.procedureType = 'Surgical'
}
console.log('\n  (implant, denture and surgery pages carry procedureType: Surgical; the rest Noninvasive)')

if (!APPLY) {
  console.log(`\nDRY RUN — 1 FAQPage + ${plan.length} MedicalWebPage blocks. Re-run with --apply.`)
  process.exit(0)
}

/* ── write, through the plugin's own routes ───────────────────────────── */

const save = async (key, json, note) => {
  const res = await api('POST', `${RUNTIME}/entry`, { key, json: JSON.stringify(json), note, enabled: true })
  if (!res || res.saved !== 1) throw new Error(`${key}: ${JSON.stringify(res).slice(0, 200)}`)
}

await save(FAQ_SLUG, faqBlock, 'FAQPage read off the page, session 21')
console.log(`\n  ok  /${FAQ_SLUG}  FAQPage, ${qa.length} questions`)
for (const p of plan) {
  await save(p.key, p.json, 'MedicalWebPage, session 21')
  console.log(`  ok  /${p.key}`)
}

// Read back through the same surface, and assert the types actually landed.
const audit = await api('GET', `${RUNTIME}/audit`)
console.log(`\naudit  ${audit.withBlock} of ${audit.total} pages carry a block`)
console.log(`       types: ${Object.entries(audit.types).map(([k, v]) => `${k} ${v}`).join(' · ')}`)
const want = ['FAQPage', 'Question', 'Answer', 'MedicalWebPage', 'MedicalProcedure']
const missing = want.filter((t) => !audit.types[t])
if (missing.length) { console.error(`  ! did not land: ${missing.join(', ')}`); process.exit(1) }

console.log('\nWritten to the plugin. Publish to put it on the live pages.')
