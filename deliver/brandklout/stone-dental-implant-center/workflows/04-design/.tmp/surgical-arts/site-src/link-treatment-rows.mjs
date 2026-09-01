/**
 * One-shot: links each flagship fee row on treatments.html to its own page.
 *
 * Before this, the hub's four tab panes were the only treatment surface on the
 * site and exactly ONE row (MyEllevate) linked anywhere, to the single shared
 * `treatment-detail.html`. Every other treatment was a line of text with a
 * price. This appends "see the detail page" to the note of each row that now
 * has a page, matching the link MyEllevate already carried.
 *
 * Rows NOT in the map keep no link on purpose: they are the minor line items
 * that deliberately have no page (see the header of treatments-data.mjs).
 *
 * Usage: node link-treatment-rows.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.join(HERE, 'pages', 'treatments.body.html')

/* Exact price-row_name text, as it appears in the markup, to page slug. Two
   rows can share a page: cheek and chin implants are one page, and the two
   resurfacing depths are one page, because that is how the copy treats them. */
const MAP = {
  'Face &amp; neck lift': 'face-and-neck-lift',
  'Brow &amp; forehead lift': 'brow-lift',
  Blepharoplasty: 'blepharoplasty',
  'Cheek implants': 'cheek-and-chin-implants',
  'Chin implants': 'cheek-and-chin-implants',
  'Buccal fat pad reduction': 'buccal-fat-reduction',
  'Surgical lip lift': 'lip-lift',
  'Neck lift': 'neck-lift',
  'MyEllevate® neck lift': 'myellevate-neck-lift',
  'Jawline implant': 'jawline-implant',
  'Laser resurfacing, full face': 'laser-resurfacing',
  'CO<sub>2</sub> laser': 'laser-resurfacing',
  Morpheus8: 'morpheus8',
  'Botox®': 'injectables',
  'Dermal filler': 'injectables',
}

let html = fs.readFileSync(FILE, 'utf8')
const hits = []
const missed = new Set(Object.keys(MAP))

/* One row is `<span class="price-row_name">NAME</span><span class="price-row_note">NOTE</span>`.
   The link goes at the end of the note, which is where the MyEllevate row
   already put it. */
html = html.replace(
  /(<span class="price-row_name">)(.*?)(<\/span><span class="price-row_note">)(.*?)(<\/span>)/g,
  (all, o1, name, o2, note, o3) => {
    const slug = MAP[name]
    if (!slug) return all
    missed.delete(name)
    // Strip any link the note already carries so re-running cannot stack them,
    // and so the old treatment-detail.html href is replaced rather than kept.
    const clean = note.replace(/\s*<a class="text-style-link"[^>]*>see the detail page<\/a>/g, '').trimEnd()
    const sep = /[.!?]$/.test(clean) ? ' ' : '. '
    hits.push(`${name}  ->  ${slug}.html`)
    return `${o1}${name}${o2}${clean}${sep}<a class="text-style-link" href="${slug}.html">see the detail page</a>${o3}`
  }
)

fs.writeFileSync(FILE, html, 'utf8')
console.log(hits.join('\n'))
console.log(`\n${hits.length} row(s) linked.`)
if (missed.size) {
  console.error(`\nNOT FOUND in the markup, check the exact text:\n  ${[...missed].join('\n  ')}`)
  process.exitCode = 1
}
