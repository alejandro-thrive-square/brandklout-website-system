/**
 * One-shot: seeds seo.json with an entry per flagship treatment page.
 *
 * seo.json stays the single hand-editable SEO source for the whole site (that
 * is what build-site.mjs reads, and it throws on a missing entry). This only
 * fills in entries that do not exist yet, so re-running it never overwrites a
 * title someone has since tuned by hand. Delete this file once the twelve
 * entries have been reviewed if you would rather it not be re-runnable.
 *
 * Usage: node seed-treatment-seo.mjs [--force]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TREATMENTS, CATEGORIES } from './treatments-data.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SEO = path.join(HERE, 'seo.json')
const force = process.argv.includes('--force')

/* The data carries HTML entities because it is written straight into markup.
   Titles and meta descriptions are plain text. */
const plain = (s) =>
  String(s)
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&reg;/g, '®')
    .replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

/* Google truncates around 155 characters; cut on a sentence or a clause rather
   than mid-word so the tail still reads as English. */
function clamp(s, max) {
  if (s.length <= max) return s
  const cut = s.slice(0, max)
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(', '), cut.lastIndexOf(' '))
  return cut.slice(0, stop > max * 0.6 ? stop : max).replace(/[,.\s]+$/, '') + '.'
}

const seo = JSON.parse(fs.readFileSync(SEO, 'utf8'))
let added = 0

for (const t of TREATMENTS) {
  if (seo.pages[t.slug] && !force) continue
  const name = plain(t.name)
  const cat = plain(CATEGORIES[t.category].label)
  const sub = plain(t.heroSub)

  seo.pages[t.slug] = {
    title: `${name} Westlake TX | Stone Surgical Arts`,
    description: clamp(sub, 155),
    ogTitle: `${name} | Stone Surgical Arts`,
    ogDescription: clamp(sub, 200),
    schema: {
      '@type': 'MedicalProcedure',
      name,
      // Deliberately NOT claiming outcomes, recovery times or suitability in
      // structured data. Those are on the page, they are still awaiting Dr.
      // Stone's review, and a rich result is the last place to publish a
      // clinical figure nobody has signed off.
      description: sub,
      category: cat,
      provider: { '@id': seo.organization['@id'] || undefined },
      url: seo.site.origin + '/' + t.slug,
    },
  }
  added++
  console.log(`+ ${t.slug}`)
}

/* The single shared detail page is gone; leaving its entry behind would keep a
   canonical for a URL that no longer builds. */
if (seo.pages['treatment-detail']) {
  delete seo.pages['treatment-detail']
  console.log('- treatment-detail (superseded by myellevate-neck-lift)')
}

fs.writeFileSync(SEO, JSON.stringify(seo, null, 2) + '\n', 'utf8')
console.log(`\n${added} entr${added === 1 ? 'y' : 'ies'} added. Review the titles in seo.json.`)
