#!/usr/bin/env node
/**
 * gen-reviews-topic.mjs — a review wall filtered to ONE treatment, rendered as
 * native cards into a page between `<!-- REVIEWS:BEGIN -->` and `:END`.
 *
 *   node gen-reviews-topic.mjs --page ads-veneers-consultation --match veneer
 *   node gen-reviews-topic.mjs --page … --match veneer --limit 4 --offline
 *
 * ## Why this is not `gen-reviews.mjs` with a grep
 *
 * `gen-reviews.mjs` scrapes the ReputationHub SSR widget page, and **that page
 * serves eight reviews**. The practice has 319. Filtering eight reviews for
 * "veneer" returns nothing, which is what makes a topic wall look impossible.
 *
 * The widget's own client fetches the rest from a JSON API, and so does this:
 *
 *     GET https://services.leadconnectorhq.com/reputation/widgets/data
 *         ?locationId=…&widgetId=…&projection=reviews&page=1&size=400
 *         header: channel: APP
 *
 * `page` is 1-based and `page=2` returns an empty array however small `size`
 * is — paging does not work, `size` does. Ask for more than the total in one
 * call; 400 covers 319 with room, and the script fails loudly if the response
 * ever comes back at exactly `size`, because that means it truncated.
 *
 * ## Why native cards and not the vendor widget
 *
 * The same two reasons as `gen-reviews.mjs`, and they have not changed:
 * Instatic's CSP lists `frame-src` for YouTube only, so a third-party iframe
 * can never render on the published site; and inside a frame the reviews count
 * for `reputationhub.site` rather than for this domain. The vendor widget also
 * has no topic filter of its own — the filtering is this script's.
 *
 * ## What it will not do
 *
 * It never edits a review. A Google review is somebody's published words: the
 * text is escaped and printed whole, or it is not used. Reviews are matched on
 * the treatment word appearing in the review itself, so a card on a veneers
 * page is a veneer patient, not a review chosen to look like one.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.dirname(fileURLToPath(import.meta.url))

const LOCATION = 'xJDu1mFoW5jFYTNqmuk7'
const WIDGET = '6a7340db2bbe7819cc3536f4'
const SIZE = 400
const API = 'https://services.leadconnectorhq.com/reputation/widgets/data'
  + `?locationId=${LOCATION}&widgetId=${WIDGET}&projection=reviews&page=1&size=${SIZE}`
const CACHE = path.resolve(SRC, '..', 'reviews-all.json')

const argv = process.argv.slice(2)
const arg = (name, fallback) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : fallback)
const PAGE_NAME = arg('--page')
const MATCH = arg('--match')
const LIMIT = Number(arg('--limit', 6))
const OFFLINE = argv.includes('--offline')
if (!PAGE_NAME || !MATCH) {
  console.error('usage: gen-reviews-topic.mjs --page <name> --match <word> [--limit n] [--offline]')
  process.exit(1)
}
const PAGE = path.join(SRC, 'pages', `${PAGE_NAME}.body.html`)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Curly quotes, and never an em dash (SYSTEM_RULES §3). Whitespace only —
 *  the wording of a review is never touched. */
const typographic = (s) => s
  .replace(/—/g, ', ')
  .replace(/(\w)'(\w)/g, '$1’$2')
  .replace(/\s+/g, ' ')
  .trim()

async function fetchAll () {
  const r = await fetch(API, { headers: { channel: 'APP', 'user-agent': 'Mozilla/5.0' } })
  if (!r.ok) throw new Error(`reviews API ${r.status}`)
  const j = await r.json()
  const all = j.reviews ?? []
  if (!all.length) throw new Error('the reviews API returned nothing; the endpoint or its params changed')
  if (all.length >= SIZE) throw new Error(`got exactly ${SIZE} reviews — the response is truncated, raise SIZE`)
  return all
}

const all = OFFLINE ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : await fetchAll()
if (!OFFLINE) fs.writeFileSync(CACHE, JSON.stringify(all, null, 1))
console.log(`${all.length} reviews ${OFFLINE ? 'cached' : 'fetched'}`)

const re = new RegExp(MATCH, 'i')
const hits = all
  .filter((r) => re.test(r.comment || '') && Number(r.starRating) === 5)
  .sort((a, b) => String(b.dateAdded).localeCompare(String(a.dateAdded)))
console.log(`${hits.length} five-star reviews mention "${MATCH}"`)
if (!hits.length) throw new Error(`no review mentions "${MATCH}" — do not ship a topic wall with borrowed reviews`)

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const when = (iso) => {
  const d = new Date(iso)
  return `${MONTH[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

const card = (r) => `        <article class="reviews_card">
          <div class="reviews_meta">
            <span class="reviews_stars" aria-hidden="true">${'★'.repeat(r.starRating)}</span>
            <span class="reviews_date">${when(r.dateAdded)}</span>
          </div>
          <p>&ldquo;${esc(typographic(r.comment))}&rdquo;</p>
          <footer><span class="reviews_avatar" aria-hidden="true">${esc(r.reviewerName.trim()[0])}</span>${esc(r.reviewerName)}<i>Google</i></footer>
        </article>`

const shown = hits.slice(0, LIMIT)
const block = `      <!-- Generated by gen-reviews-topic.mjs --match ${MATCH}. Every card is a
           five-star Google review of this practice whose own text mentions
           ${MATCH}. Native markup, not the vendor iframe: Instatic's CSP allows a
           frame only for YouTube, and inside a frame these reviews count for
           reputationhub.site rather than for this domain. Re-run the generator
           to refresh; do not hand-edit the cards. -->
      <div class="reviews_wall is-two-column-wall" data-rv="stagger">
${shown.map(card).join('\n')}
      </div>`

let page = fs.readFileSync(PAGE, 'utf8')
const BEGIN = '<!-- REVIEWS:BEGIN -->'
const END = '<!-- REVIEWS:END -->'
if (!page.includes(BEGIN) || !page.includes(END)) {
  throw new Error(`no ${BEGIN} / ${END} markers in pages/${PAGE_NAME}.body.html`)
}
page = page.slice(0, page.indexOf(BEGIN) + BEGIN.length)
  + `\n${block}\n      `
  + page.slice(page.indexOf(END))
fs.writeFileSync(PAGE, page)

console.log(`wrote ${shown.length} cards into pages/${PAGE_NAME}.body.html`)
for (const r of shown) console.log(`  ${r.starRating}★ ${r.reviewerName} — ${when(r.dateAdded)}`)
