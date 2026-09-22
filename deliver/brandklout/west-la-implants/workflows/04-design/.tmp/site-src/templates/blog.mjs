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

function heroFor(d) {
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
  const d = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
  if (d.kind !== 'post') continue
  const title = (d.seo?.title_tag || d.slug).replace(/\s*-\s*West LA Implants\s*$/, '').trim()
  const published = d.seo?.article_published || '2022-01-01'
  const body = bodyOf(d, title)
  const firstP = (body.find((x) => x.startsWith('<p>')) || '').replace(/<[^>]+>/g, '')
  const excerpt = firstP.length > 150 ? firstP.slice(0, 147).replace(/\s+\S*$/, '') + '…' : firstP
  posts.push({ slug: d.slug, title, published, dateLabel: fmt(published), body, excerpt, image: heroFor(d), description: (d.seo?.meta_description || excerpt).slice(0, 160) })
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
      image: { src: p.image, alt: '' },
      actions: [{ href: '/blog.html', label: 'All entries', kind: 'text' }],
    },
    {
      type: 'prose', name: 'The Entry', html: p.body.join('\n'),
      aside: `<div class="kicker">More entries</div>${[posts[(i + 1) % posts.length], posts[(i + 2) % posts.length], posts[(i + 3) % posts.length]].map((q) => `<a href="/blog/${q.slug}.html">${esc(q.title)}</a>`).join('')}`,
    },
    { type: 'invite', name: 'Invitation', title: 'Ask it in <em>person.</em>', lead: 'A consultation answers the question for your own mouth: a scan, an honest read, and a plan.', next: nextFor(p) },
  ],
}))

const index = {
  slug: 'blog',
  title: 'Journal: Dental Implant Questions Answered | West LA Implants, Los Angeles',
  description: 'Forty-six short answers from West LA Implants to the questions patients ask about dental implants: candidacy, cost, recovery, full-arch treatment, bone grafting, sedation and care.',
  image: '/media/img/blog-hero.webp',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'The journal',
      title: 'Questions, <em>answered.</em>',
      lead: 'Short entries from the practice on the things patients ask most, from what a dental implant is made of to what to eat after surgery.',
      image: { src: '/media/img/blog-hero.webp', alt: 'A dental implant model' },
      actions: [{ href: '#entries', label: 'Read the Entries' }, { href: '/faq.html', label: 'The short answers', kind: 'text' }],
    },
    { type: 'postindex', name: 'The Entries', title: `${posts.length} <em>entries.</em>`, lead: 'Newest first.', posts },
    { type: 'invite', name: 'Invitation', title: 'Ask it in <em>person.</em>', lead: 'A consultation answers the question for your own mouth.', next: ALWAYS },
  ],
}

export default [index, ...entries]
