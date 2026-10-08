/* The journal: the practice's 46 question-format posts (2022–2023), carried
   over from the WordPress scrape in 01-content-intake. Each becomes a page at
   /blog/<slug> with its original title, date and body; the index at /blog
   lists them newest first. Bodies are the practice's own words, lightly
   cleaned (share widgets, prev/next and footer boilerplate removed). Hero
   images are the posts' own, copied from the asset mirror where present. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const DATA = path.resolve(here, '../../../../01-content-intake/.tmp/current-site-scrape/data')
const DL = path.resolve(here, '../../../../03-graphic-resources/.tmp/downloads')
const IMG = path.resolve(here, '../media/img')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const fmt = (iso) => new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

/* 08-qa image review (2026-09-24): posts without a hero of their own all fell back to one laptop stock
   photo (8x on the index), and four heroes contradicted their titles. Slug -> [image, focal point]. */
const HERO = {
  // kept from the first pass (strict review: relevant and sharp)
  'after-getting-dental-implants-how-can-i-take-care-of-them': ['hygienist-procedure.jpg', '70% 50%'],
  'how-can-i-find-affordable-dental-implants': ['patient-calculator.jpg', '70% 40%'],
  'how-painful-is-it-to-get-dental-implants': ['sedation-patient-smiling.jpg', '70% 40%'],
  'what-is-the-recovery-time-for-dental-implants': ['woman-tea.jpg', '70% 50%'],
  'after-getting-a-full-arch-of-teeth-extracted-should-4ec2dcc': ['hybrid-denture-model.jpg', '80% 50%'],
  'do-robots-really-do-dental-implant-procedures': ['yomi-robot-surgical.jpg', '70% 50%'],
  'what-are-full-mouth-dental-implants': ['full-arch-model.jpg'],
  // strict review (2026-09-24): the practice's own library where it shows the subject at ≥1000px tall;
  // named patients only on their own treatment (Leslie = All-on-4, Michael = full mouth)
  'after-my-smile-has-healed-how-is-the-final-prosthesis-placed': ['zirconia-model.jpg', '85% 50%'],
  'are-there-factors-that-determine-which-type-of-denta-a953c64': ['still-doctor-xray-screen.jpg', '20% 40%'],
  'can-you-get-all-on-4-dental-implants-in-one-day-in-l-78bf28a': ['leslie-allon4-2.jpg', '70% 40%'],
  'does-anything-happen-to-my-jawbone-if-i-dont-immedia-3453d94': ['jaw-bone-loss.jpg', '70% 50%'],
  'how-can-full-mouth-dental-implants-benefit-me': ['michael-full-mouth.jpg', '22% 40%'],
  'how-do-dental-implants-help-me': ['dentures-patient-eating.jpg', '85% 50%'],
  'is-there-a-difference-between-implant-supported-dent-f7be47a': ['overdenture-bar.jpg', '50% 50%'],
  'should-i-get-dental-implants-after-a-bone-grafting-procedure': ['ridge-augmentation-model.jpg', '60% 50%'],
  'smile-confidently-with-your-brand-new-dental-implants': ['still-emily-smile.jpg', '50% 40%'],
  'the-best-ways-to-find-affordable-dental-implants': ['patient-paying.jpg', '60% 50%'],
  'what-do-you-need-to-get-dental-implants': ['still-cbct-suite.jpg', '60% 50%'],
  'what-happens-if-i-dont-have-a-bone-grafting-procedur-f49cf14': ['periimplantitis-model.jpg', '50% 50%'],
  'what-is-the-all-on-x-treatment': ['blog-fullmouthdentalimplants.jpeg', '50% 50%'],
  'what-makes-me-a-candidate-for-a-dental-implant-procedure': ['still-emily-consult.jpg', '50% 50%'],
  // licensed stock (03-graphic-resources/.tmp/stock/stock-ledger.json), picked against each question
  'are-full-mouth-dental-implants-able-to-restore-the-l-168a3e3': ['stock-j-restore.jpg', '47% 30%'],
  'are-there-aesthetic-and-functional-benefits-to-getti-b3b6309': ['stock-j-aesthetic.jpg', '40% 35%'],
  'are-there-specific-parts-that-make-up-a-dental-implant': ['stock-j-parts.jpg', '42% 50%'],
  'can-anyone-have-a-temporary-prosthesis-placed-after-b2907d6': ['stock-j-temp-prosthesis.jpg', '50% 55%'],
  'dental-implant-posts-can-improve-your-oral-health': ['stock-j-post.jpg', '66% 45%'],
  'do-i-have-to-extract-all-my-teeth-to-get-dental-implants': ['stock-j-extract-all.jpg', '62% 50%'],
  'do-you-need-sedation-for-dental-implants': ['stock-j-sedation.jpg', '45% 45%'],
  'following-a-tooth-extraction-what-should-i-do': ['stock-j-extraction-care.jpg', '62% 40%'],
  'for-national-false-teeth-day-get-yourself-dental-imp-d4b254b': ['stock-j-false-teeth.jpg', '80% 50%'],
  'for-oral-health-month-consider-improving-your-health-b197164': ['stock-j-oral-health.jpg', '62% 30%'],
  'how-many-teeth-can-dental-implants-replace': ['stock-j-how-many.jpg', '55% 45%'],
  'how-many-types-of-dental-implants-and-techniques-are-there': ['stock-j-types.jpg', '55% 50%'],
  'is-it-possible-for-me-to-get-customized-dental-impla-739e461': ['stock-j-custom.jpg', '58% 45%'],
  'is-there-a-difference-between-a-temporary-prosthesis-0eb13fe': ['stock-j-temp-vs-final.jpg', '45% 62%'],
  'making-the-most-of-your-dental-implants': ['stock-j-care.jpg', '72% 45%'],
  'methods-of-replacing-missing-teeth-in-los-angeles-ca': ['stock-j-methods.jpg', '55% 40%'],
  'reasons-to-get-a-temporary-dental-prosthetic': ['stock-j-temp-reasons.jpg', '40% 50%'],
  'the-four-types-of-dental-implant-restorations': ['stock-j-four-types.jpg', '50% 55%'],
  'what-foods-can-i-have-after-dental-implant-surgery': ['stock-j-soft-foods.jpg', '38% 45%'],
  'what-is-osseointegration-when-it-comes-to-dental-implants': ['stock-j-osseo.jpg', '48% 62%'],
  'when-is-dental-implant-surgery-needed': ['stock-j-when-needed.jpg', '58% 55%'],
  'who-qualifies-for-dental-implants': ['stock-j-who-qualifies.jpg', '40% 40%'],
  'why-choose-dental-implants-to-replace-teeth': ['stock-j-why-choose.jpg', '42% 55%'],
  'why-should-i-consider-a-dental-implant-to-replace-my-c996c1d': ['stock-j-vs-bridge.jpg', '90% 50%'],
  'why-would-i-get-dental-implants-after-a-tooth-extraction': ['stock-j-after-extraction.jpg', '50% 50%'],
}
const POS = {}

function heroFor(d) {
  if (HERO[d.slug]) return '/media/img/' + HERO[d.slug][0]
  const og = d.seo?.og_image || ''
  const m = og.match(/wp-content\/uploads\/(\d{4}\/\d{2})\/(.+)$/)
  if (!m) return '/media/img/blog-hero.webp'
  const base = m[2].replace(/-\d+x\d+(?=\.[a-z]+$)/i, '')
  const src = path.join(DL, 'wp-content/uploads', m[1], base)
  if (!fs.existsSync(src)) return '/media/img/blog-hero.webp'
  const name = 'blog-' + base.toLowerCase().replace(/[^a-z0-9.]+/g, '-')
  const dst = path.join(IMG, name)
  if (!fs.existsSync(dst)) fs.copyFileSync(src, dst)
  return '/media/img/' + name
}

function bodyOf(d, title) {
  const b = d.body_markdown
  let i = b.indexOf('## ' + title.slice(0, 24))
  if (i < 0) i = b.indexOf('## ')
  const ends = ['PrevPrevious', '#### More To Explore', '## You Are Welcome Here'].map((k) => b.indexOf(k, i)).filter((x) => x > 0)
  const text = b.slice(i, ends.length ? Math.min(...ends) : b.length)
  const blocks = text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
  const out = []
  let first = true
  for (const blk of blocks) {
    if (first) { first = false; continue } // the title, rendered by the cover
    if (/^#{3,4} /.test(blk)) continue // "#### Share This Post"
    if (/^Share on /.test(blk) || /^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(blk)) continue
    if (/^## /.test(blk)) { out.push(`<h2>${esc(blk.slice(3))}</h2>`); continue }
    if (/^(•|-|\*) /.test(blk)) { out.push('<ul>' + blk.split(/\n/).map((l) => `<li>${esc(l.replace(/^(•|-|\*) /, ''))}</li>`).join('') + '</ul>'); continue }
    out.push(`<p>${esc(blk).replace(/\n/g, ' ')}</p>`)
  }
  return out
}

const posts = []
for (const f of fs.readdirSync(DATA).filter((n) => n.endsWith('.json')).sort()) {
  // the practice's old blog said "Los Angeles, FL" in three entries; the scrape stays verbatim, the site says CA
  const d = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8').replace(/Los Angeles, FL\b/g, 'Los Angeles, CA'))
  if (d.kind !== 'post') continue
  const title = (d.seo?.title_tag || d.slug).replace(/\s*-\s*West LA Implants\s*$/, '').trim()
  const published = d.seo?.article_published || '2022-01-01'
  const body = bodyOf(d, title)
  const firstP = (body.find((x) => x.startsWith('<p>')) || '').replace(/<[^>]+>/g, '')
  const excerpt = firstP.length > 150 ? firstP.slice(0, 147).replace(/\s+\S*$/, '') + '…' : firstP
  posts.push({ slug: d.slug, title, published, dateLabel: fmt(published), body, excerpt, image: heroFor(d), imagePos: (HERO[d.slug] || [])[1] || POS[d.slug], description: (d.seo?.meta_description || excerpt).slice(0, 160) })
}
posts.sort((a, b) => (a.published < b.published ? 1 : -1))

const RELATED = [
  [/all-on-4|all on x|full arch|full mouth/i, { href: '/all-on-4.html', label: 'All-on-4® full arch', text: 'A fixed set of teeth on four or more implants.' }],
  [/bone|graft|jawbone/i, { href: '/bone-grafting.html', label: 'Bone grafting', text: 'Rebuilding the jaw before an implant goes in.' }],
  [/sedation|pain/i, { href: '/sedation-dentistry.html', label: 'Sedation', text: 'IV, oral and nitrous, chosen with you.' }],
  [/cost|afford|financ/i, { href: '/implant-cost.html', label: 'What implants cost', text: 'The six factors in every quote.' }],
  [/robot|yomi|technolog/i, { href: '/technology.html', label: 'The technology', text: 'Yomi®, CBCT and the in-house lab.' }],
  [/extract/i, { href: '/tooth-extractions.html', label: 'Tooth extractions', text: 'Gentle, and often the first step.' }],
  [/denture/i, { href: '/implant-supported-dentures.html', label: 'Implant-supported dentures', text: 'A denture that stays put.' }],
]
const ALWAYS = [
  { href: '/dental-implants.html', label: 'Dental implants', text: 'The treatment, step by step.' },
  { href: '/faq.html', label: 'Questions', text: 'The long list, by topic.' },
  { href: '/results.html', label: 'Results', text: 'Before and after, and three patients on film.' },
]
const nextFor = (p) => {
  const hits = RELATED.filter(([re]) => re.test(p.title)).map(([, l]) => l)
  return [...hits, ...ALWAYS.filter((a) => !hits.some((h) => h.href === a.href))].slice(0, 3)
}

const entries = posts.map((p, i) => ({
  slug: 'blog/' + p.slug,
  title: `${p.title} | West LA Implants`,
  description: p.description,
  image: p.image,
  type: 'article',
  jsonld: [{ '@type': 'BlogPosting', headline: p.title, datePublished: p.published, author: { '@type': 'Person', name: 'Tony Barriere, DDS' }, publisher: { '@id': '/#practice' }, image: p.image }],
  chapters: [
    {
      type: 'cover', name: 'Arrival', small: true, kicker: `Journal · ${p.dateLabel}`,
      title: esc(p.title),
      lead: p.excerpt,
      image: { src: p.image, alt: '', pos: p.imagePos },
      actions: [{ href: '/blog.html', label: 'All entries', kind: 'text' }],
    },
    {
      type: 'prose', name: 'The Entry', html: p.body.join('\n'),
      aside: `<div class="text-style-label">More entries</div>${[posts[(i + 1) % posts.length], posts[(i + 2) % posts.length], posts[(i + 3) % posts.length]].map((q) => `<a href="/blog/${q.slug}.html">${esc(q.title)}</a>`).join('')}`,
    },
    { type: 'invite', name: 'Invitation', title: 'Ask it in <em>person.</em>', lead: 'A consultation answers the question for your own mouth: a scan, an honest read, and a plan.', next: nextFor(p) },
  ],
}))

const index = {
  slug: 'blog',
  title: 'Journal: Dental Implant Questions Answered | West LA Implants, Los Angeles',
  description: 'Forty-six short answers from West LA Implants to the questions patients ask about dental implants: candidacy, cost, recovery, full-arch treatment, bone grafting, sedation and care.',
  image: '/media/img/doctor-explaining.jpg',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'The journal',
      title: 'Questions, <em>answered.</em>',
      lead: 'Short entries from the practice on the things patients ask most, from what a dental implant is made of to what to eat after surgery.',
      image: { src: '/media/img/doctor-explaining.jpg', pos: '90% 40%', alt: 'Dr. Barriere explaining a case' },
      actions: [{ href: '#entries', label: 'Read the Entries' }, { href: '/faq.html', label: 'The short answers', kind: 'text' }],
    },
    { type: 'postindex', name: 'The Entries', title: `${posts.length} <em>entries.</em>`, lead: 'Newest first.', posts },
    { type: 'invite', name: 'Invitation', title: 'Ask it in <em>person.</em>', lead: 'A consultation answers the question for your own mouth.', next: ALWAYS },
  ],
}

export default [index, ...entries]
