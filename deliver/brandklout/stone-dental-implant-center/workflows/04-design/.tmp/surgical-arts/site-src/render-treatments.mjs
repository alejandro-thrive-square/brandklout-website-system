/**
 * Renders one service page per flagship treatment into pages/<slug>.body.html.
 *
 * WHY THIS IS GENERATED AND THE OTHER PAGES ARE NOT. Every treatment page is
 * the same seven sections in the same order; only the content differs. That is
 * a collection, not seven hand-written pages, and treatment-detail.body.html
 * said so from the start: "In Instatic this becomes one page template bound to
 * a treatments collection; the fact panel's five rows are the collection's
 * fields." treatments-data.mjs IS that collection. When these pages move into
 * Instatic, the data file maps to collection items and this renderer is thrown
 * away; hand-writing twelve copies would leave twelve things to migrate.
 *
 * The generated *.body.html files ARE committed. build-site.mjs reads the pages
 * directory and must not depend on this having been run, and a diff on the
 * rendered output is how you see what a data change actually did.
 *
 * > [!IMPORTANT]
 * > Copy standards apply to everything in treatments-data.mjs: no em dashes
 * > (SYSTEM_RULES.md "Copy Standards", gated by check-copy.mjs). Ranges use
 * > `&ndash;`. Run `node check-copy.mjs` after any content edit here.
 *
 * Usage:
 *   node render-treatments.mjs            write every page
 *   node render-treatments.mjs --check    fail if any page is stale, write none
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TREATMENTS, CATEGORIES } from './treatments-data.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PAGES = path.join(HERE, 'pages')
const check = process.argv.includes('--check')

const esc = (s) => String(s).replace(/&(?!(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;')

/* Copy is authored as HTML fragments (it carries <strong>, <a>, &reg;), so it
   is emitted verbatim. Only the plain-text fields above go through esc(). */
const para = (t) => `            <p>${t}</p>`
const bullets = (items) =>
  ['            <ul>', ...items.map((i) => `              <li>${i}</li>`), '            </ul>'].join('\n')

/* The page head.
   REBUILT 2026-09-01. It was a small centred stack of breadcrumb, category,
   name and one line, with no image at all, and the treatment's own photograph
   sat two sections lower as a full-width strip that interrupted the reading.
   Now the photograph IS the head, on the same asymmetric split as the home
   page's arrival, and `t.bandImage` is consumed here instead of by a band of
   its own further down.

   The fact panel moved up here too. It is the five things a person came to
   find out (fee, anaesthetic, time off work, when it settles, how long it
   lasts), and it used to sit in a sidebar halfway down beside a wall of prose.
   Above the fold, next to the price, is where it belongs. */
function headSection(t, cat) {
  const rows = t.facts
    .map(
      (f) => `        <div class="svc-facts_row">
          <dt class="svc-facts_label">${esc(f.label)}</dt>
          <dd class="svc-facts_value">${f.value}</dd>
        </div>`
    )
    .join('\n')

  return `<section class="svc-head_component stone-panel">
  <div class="svc-head_copy">
    <nav class="breadcrumb_component" aria-label="Breadcrumb">
      <a href="index.html">Home</a><span class="breadcrumb_sep">/</span>
      <a href="treatments.html">Treatments</a><span class="breadcrumb_sep">/</span>
      <a href="treatments.html#${cat.anchor}">${cat.label}</a><span class="breadcrumb_sep">/</span>
      <span aria-current="page">${t.name}</span>
    </nav>
    <p class="chapter_mark">${cat.label}</p>
    <h1 class="display-lg svc-head_title">${t.name}</h1>
    <p class="svc-head_sub">${t.heroSub}</p>

    <dl class="svc-facts" data-j="stagger">
${rows}
    </dl>

    <div class="svc-head_actions">
      <a class="button" href="book.html#request">Book a consultation</a>
      <a class="button is-secondary" href="treatments.html#${cat.anchor}">All ${cat.short} fees</a>
    </div>
    <p class="svc-head_note">Recovery figures are typical, not a promise. Yours is set out in your written plan.</p>
  </div>

  <div class="svc-head_media">
    <div class="svc-head_photo">
      <img src="assets/${t.bandImage.file}" alt="${esc(t.bandImage.alt)}" width="1600" height="900" fetchpriority="high">
    </div>
  </div>
</section>`
}

/* The body.
   REBUILT 2026-09-01, and this was the worst thing on the site measured against
   the brief: "big chunks of text are not good for conversions." Every treatment
   page ran its two intro paragraphs and then three headed sections as one
   unbroken column of prose, five hundred words deep, with the headings inside
   the column doing nothing to break it up.

   Two changes. The intro becomes a LEDE, set larger and measured, because it is
   the answer to "what is this" and people read one paragraph before they decide
   whether to read six. And each section becomes a ROW: its heading on the left
   spine, its body in a measured column on the right, with a hairline between
   rows. That turns the page into something you can scan down the left edge and
   drop into, which is how anyone actually reads a spec.

   Not one word of copy changed. treatments-data.mjs is untouched. */
function ledeSection(t) {
  return `<section class="svc-lede_component">
  <div class="svc-lede_inner">
    <div class="svc-lede_text text-rich-text" data-j="rise">
${t.intro.map(para).join('\n')}
    </div>
  </div>
</section>`
}

function specSection(t) {
  const rows = t.sections
    .map((block) => {
      const body = block.body
        .map((item) => (Array.isArray(item) ? bullets(item) : para(item)))
        .join('\n')
      return `    <div class="spec_row" data-j="rise">
      <h2 class="spec_heading">${esc(block.heading)}</h2>
      <div class="spec_body text-rich-text">
${body}
      </div>
    </div>`
    })
    .join('\n')

  return `<section class="spec_component">
  <div class="spec_inner">
${rows}
  </div>
</section>`
}

function journeySection(t) {
  const steps = t.steps
    .map(
      (s, i) => `    <div class="step_component">
      <p class="step_number">${String(i + 1).padStart(2, '0')}</p>
      <h3 class="step_title">${esc(s.title)}</h3>
      <p class="step_text">${s.text}</p>
    </div>`
    )
    .join('\n')

  return `<section class="section_journey background-color-secondary">
  <div class="padding-global">
    <div class="container-large">
      <div class="section_header is-center padding-section-medium" data-reveal>
        <p class="eyebrow is-center">The procedure</p>
        <h2 class="heading-style-h2 section_header-title">${esc(t.journeyTitle)}</h2>
      </div>
    </div>
  </div>
  <div class="padding-global">
    <div class="container-large">
      <div class="padding-bottom padding-large">
        <div class="band-media_component" data-reveal>
          <img src="assets/${t.journeyImage.file}" alt="${esc(t.journeyImage.alt)}" width="1600" height="900" loading="lazy">
        </div>
      </div>
    </div>
  </div>
  <div class="step-list_component" data-reveal="stagger">
${steps}
  </div>
</section>`
}

function faqSection(t) {
  const items = t.faqs
    .map(
      (f) => `          <details class="faq_item">
            <summary class="faq_question">${esc(f.q)}<span class="faq_icon" aria-hidden="true"></span></summary>
            <div class="faq_answer"><p>${f.a}</p></div>
          </details>`
    )
    .join('\n')

  return `<section class="section_faq">
  <div class="padding-global">
    <div class="container-medium">
      <div class="padding-section-large">
        <div class="section_header" data-reveal>
          <p class="eyebrow">Questions</p>
          <h2 class="heading-style-h2">What people ask before they book.</h2>
        </div>
        <div class="faq_list">
${items}
        </div>
      </div>
    </div>
  </div>
</section>`
}

function relatedSection(t, cat) {
  const cards = t.related
    .map(
      (r) => `          <a class="treatment-card_component" href="${r.href}">
            <h3 class="treatment-card_name">${r.name}</h3>
            <p class="treatment-card_text">${r.text}</p>
            <div class="treatment-card_foot"><span class="treatment-card_price">${r.price}</span><span class="button is-link">Details</span></div>
          </a>`
    )
    .join('\n')

  return `<section class="section_related background-color-secondary">
  <div class="padding-global">
    <div class="container-large">
      <div class="padding-section-large">
        <div class="section_header is-split" data-reveal>
          <div>
            <p class="eyebrow">Also in ${cat.label}</p>
            <h2 class="heading-style-h3">If this is not quite the one.</h2>
          </div>
          <a class="button is-link hide-mobile-landscape" href="treatments.html#${cat.anchor}">All ${cat.short} treatments <span class="button_arrow" aria-hidden="true">&rarr;</span></a>
        </div>
        <div class="treatment-grid_component" data-reveal="stagger">
${cards}
        </div>
      </div>
    </div>
  </div>
</section>`
}

function render(t) {
  const cat = CATEGORIES[t.category]
  if (!cat) throw new Error(`${t.slug}: unknown category "${t.category}"`)
  const header = `<!-- ==========================================================================
     ${t.name.toUpperCase()}
     GENERATED by render-treatments.mjs from treatments-data.mjs. Do not edit
     this file by hand: edit the data and re-render, or your change is lost on
     the next run. Structure is the shared treatment template documented in
     treatments-data.mjs.
     ${t.reviewNote ? `\n     CLINICAL REVIEW: ${t.reviewNote}` : ''}
     ========================================================================== -->`

  /* `.journey_page` is the whole opt-in to the design system: it re-frames the
     section heads, the spine and the materials from the rollout layer at the
     foot of css/50-journey.css. See treatments.body.html for the same move.

     `band(t.bandImage)` is gone from this list: that photograph is the head
     now, and a second full-width copy of it two sections later was the strip
     that used to interrupt the reading. */
  return [
    header,
    '<div class="journey_page">',
    headSection(t, cat),
    ledeSection(t),
    specSection(t),
    journeySection(t),
    faqSection(t),
    relatedSection(t, cat),
    '</div>',
  ].join('\n\n') + '\n'
}

let stale = 0
for (const t of TREATMENTS) {
  const file = path.join(PAGES, `${t.slug}.body.html`)
  const next = render(t)
  const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  if (prev === next) continue
  if (check) {
    console.error(`STALE: pages/${t.slug}.body.html`)
    stale++
    continue
  }
  fs.writeFileSync(file, next, 'utf8')
  console.log(`${prev === null ? 'new  ' : 'wrote'} pages/${t.slug}.body.html  ${(next.length / 1024).toFixed(1)}KB`)
}

if (check) {
  if (stale) {
    console.error(`\n${stale} page(s) stale. Run: node render-treatments.mjs`)
    process.exit(1)
  }
  console.log('All treatment pages current.')
} else {
  console.log(`\n${TREATMENTS.length} treatment page(s) rendered.`)
}
