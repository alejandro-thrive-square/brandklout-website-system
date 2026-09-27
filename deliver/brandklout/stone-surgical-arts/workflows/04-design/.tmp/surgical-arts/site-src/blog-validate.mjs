#!/usr/bin/env node
/**
 * Checks blog-data.mjs before anything is built from it.
 *
 * Every one of these has been a real defect on this project at least once:
 * an image name that is not in the media library renders a broken figure that
 * `verify-live` reports only as a missing asset; a slug that collides with a
 * treatment page silently shadows it; a reference URL that 404s is worse than
 * no reference at all on a medical site.
 *
 * Usage: node blog-validate.mjs [--check-refs]
 *   --check-refs also requests every cited URL. Slower, and needs a network.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { posts } from './blog-data.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const media = JSON.parse(fs.readFileSync(path.join(HERE, '../../../../21-instatic-upload/.tmp/media-map.json'), 'utf8')).map
const FINAL = path.join(HERE, '..', 'final-site')

/* The routes that existed before the journal. A post may not take one of these
   names, and every relatedTreatment link has to land on one. */
const SITE_PAGES = ['index', 'neck-lift', 'blepharoplasty', 'treatments', 'meet-the-doctor', 'about', 'team',
  'memberships', 'results', 'book', 'myellevate-neck-lift', 'face-and-neck-lift']

const problems = []
const warn = []
const bad = (m) => problems.push(m)

const seen = new Map()
const imageUse = new Map()
const refs = new Set()

for (const p of posts) {
  const at = `[${p.slug}]`

  for (const field of ['slug', 'title', 'category', 'date', 'dateLabel', 'image', 'alt', 'excerpt', 'intro', 'takeaway', 'source']) {
    if (!p[field] || typeof p[field] !== 'string') bad(`${at} missing or non-string ${field}`)
  }

  if (seen.has(p.slug)) bad(`${at} duplicate slug, also used by ${seen.get(p.slug)}`)
  seen.set(p.slug, p.title)
  if (SITE_PAGES.includes(p.slug)) bad(`${at} slug collides with an existing site page`)
  if (p.slug === 'blog') bad(`${at} slug collides with the journal overview`)
  if (!/^[a-z0-9-]+$/.test(p.slug || '')) bad(`${at} slug is not lowercase-hyphen`)

  /* audit.mjs warns over 65, and the suffix costs 22. Caught here so the
     failure shows up before a build rather than in the audit afterwards. */
  const seoLen = (p.seoTitle || p.title).length + ' | Stone Surgical Arts'.length
  if (seoLen > 65) bad(`${at} <title> would be ${seoLen} chars; give it a shorter seoTitle`)

  if (!media[p.image]) bad(`${at} image "${p.image}" is not in the media library`)
  imageUse.set(p.image, (imageUse.get(p.image) || []).concat(p.slug))

  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date || '')) bad(`${at} date "${p.date}" is not YYYY-MM-DD`)
  const parsed = new Date(p.dateLabel + ' UTC')
  if (Number.isNaN(parsed.getTime())) bad(`${at} dateLabel "${p.dateLabel}" does not parse`)
  else if (parsed.toISOString().slice(0, 10) !== p.date) bad(`${at} date ${p.date} and dateLabel "${p.dateLabel}" disagree`)

  if (!Array.isArray(p.sections) || p.sections.length < 2) bad(`${at} needs at least two sections`)
  const ids = new Set()
  for (const s of p.sections || []) {
    if (!s.id || !s.title) bad(`${at} a section is missing id or title`)
    if (ids.has(s.id)) bad(`${at} duplicate section id "${s.id}"`)
    ids.add(s.id)
    if (!Array.isArray(s.paragraphs) || !s.paragraphs.length) bad(`${at} section "${s.id}" has no paragraphs`)
    for (const par of s.paragraphs || []) if (typeof par !== 'string' || par.length < 40) bad(`${at} section "${s.id}" has a suspiciously short paragraph`)
  }

  const href = p.relatedTreatment && p.relatedTreatment.href
  if (!href || !p.relatedTreatment.label) bad(`${at} relatedTreatment incomplete`)
  else {
    const [file, frag] = href.split('#')
    const stem = file.replace(/\.html$/, '')
    if (!SITE_PAGES.includes(stem)) bad(`${at} relatedTreatment points at "${file}", which is not a site page`)
    else if (frag) {
      const html = path.join(FINAL, file)
      if (fs.existsSync(html) && !fs.readFileSync(html, 'utf8').includes(`id="${frag}"`)) bad(`${at} relatedTreatment anchor #${frag} not found in ${file}`)
    }
  }

  if (!Array.isArray(p.references) || !p.references.length) warn.push(`${at} has no references`)
  for (const r of p.references || []) {
    if (!r.label || !r.url) bad(`${at} a reference is missing label or url`)
    else if (!/^https:\/\//.test(r.url)) bad(`${at} reference "${r.label}" is not https`)
    else refs.add(r.url)
  }

  /* The editorial rules from BLOG-CONTENT.md, as far as text can check them. */
  const body = [p.intro, p.excerpt, p.takeaway, ...(p.sections || []).flatMap((s) => s.paragraphs || [])].join(' ')
  /* check-copy.mjs catches these after a build; catching them here is the
     same rule applied to the source, where the fix actually goes. */
  if (body.includes('—')) bad(`${at} contains an em dash, which SYSTEM_RULES.md forbids`)
  if (/\bguarantee[sd]?\b/i.test(body)) bad(`${at} contains a guarantee`)
  if (/\b(817|\(817\))[)\s.-]*\d{3}[\s.-]*\d{4}/.test(body)) bad(`${at} contains a telephone number`)
  if (/@[a-z0-9.-]+\.(com|org|net)/i.test(body)) bad(`${at} contains an email address`)
  /* Marketing superlatives, which the archived originals were full of. "best
     suited", "best-known" and "best results" are ordinary English and are not
     what this is looking for. */
  const superlative = body.match(/\b(best|premier|top-tier|world-class|number one|finest|leading)\b(?!-known|\s+(suited|results|starting|advice|route|answer|guide|way|part|test|option))/i)
  if (superlative) warn.push(`${at} contains a superlative: "${superlative[0]}"`)
}

for (const [img, users] of imageUse) if (users.length > 1) warn.push(`image ${img} is used by ${users.length}: ${users.join(', ')}`)

console.log(`${posts.length} posts, ${imageUse.size} distinct images, ${refs.size} distinct references`)

if (process.argv.includes('--check-refs')) {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
  await Promise.all([...refs].map(async (u) => {
    try {
      const c = new AbortController()
      const t = setTimeout(() => c.abort(), 25000)
      const r = await fetch(u, { redirect: 'follow', signal: c.signal, headers: { 'User-Agent': UA } })
      clearTimeout(t)
      if (r.status !== 200) bad(`reference ${r.status}: ${u}`)
    } catch (e) { bad(`reference unreachable (${e.name}): ${u}`) }
  }))
  console.log('checked every cited URL')
}

for (const w of warn) console.log('  warn  ' + w)
for (const p of problems) console.log('  FAIL  ' + p)
console.log(problems.length ? `\n${problems.length} problem(s)` : '\nall checks passed')
process.exit(problems.length ? 1 : 0)
