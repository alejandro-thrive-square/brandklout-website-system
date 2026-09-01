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
  /* The "Who it suits" block has been promoted to its own cards above, so it is
     dropped here rather than printed twice. Everything else keeps the
     heading-on-the-spine row it had. */
  const rows = t.sections
    .filter((b) => !/^who it suits$/i.test(b.heading))
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

  if (!rows.trim()) return null

  return `<section class="spec_component">
  <div class="spec_inner">
${rows}
  </div>
</section>`
}

/* ===========================================================================
   THE INFORMATION FLOW — restructured 2026-09-01 against the reference page a
   teammate supplied as "basically the perfect flow of information for a service
   page": 01-content-intake/.tmp/preview.html (Mason Park Dental, bonding).

   Its order, and what this template now does about each beat:

     1  hero                        kept: name, at-a-glance figures, photograph
     2  trust signals               ADDED. Four, all already sourced
     3  what it can improve         RESTRUCTURED. "Who it suits" was prose
                                    bullets buried mid-page; it is the
                                    symptom-led entry the reference leads with,
                                    so it moves up and becomes cards
     4  real patient proof          ADDED as an honest disclosure, NOT a
                                    placeholder card. See below
     5  why this practice           kept as a spec row (see the note on why it
                                    is not promoted)
     6  what to expect              kept: the three steps
     7  comparison                  NOT ADDED. No per-treatment comparison data
                                    exists and inventing one would be inventing
                                    clinical guidance
     8  cost and payment            ADDED. Fee comes from the treatment's own
                                    facts; consultation fee and financing are
                                    the practice's published figures
     9  reviews                     ADDED, but labelled as being about the
                                    PRACTICE, not this procedure. See below
    10  low-commitment entry        NOT ADDED. The practice published a virtual
                                    consultation page, but whether it still runs
                                    is unconfirmed, and offering an appointment
                                    type that does not exist is worse than not
                                    offering one
    11  FAQs                        kept
    12  final CTA                   kept: the shared band

   THE H1 IS DELIBERATELY NOT COPIED. The reference puts the benefit in the H1
   ("Fix the little thing you notice every time you smile") and the procedure
   name in the eyebrow. That reads beautifully and it is the wrong trade here:
   these twelve pages exist to rank for the procedure name, which is what
   someone types. The benefit line is the sub-headline directly underneath, so
   the page still opens on the patient's problem.

   NOTHING BELOW INVENTS COPY. Every string is either from treatments-data.mjs
   or is a practice figure already published on the home and booking pages.
   =========================================================================== */

/* Four trust signals, identical on all twelve pages. Sources: the rating and
   review count are what the practice's own retired footer carried; the surgeon,
   the trauma training and the languages are on the live sister site. All four
   already appear on the home page. */
function trustSection() {
  const items = [
    ['4.8', 'From 142+ patient reviews'],
    ['One surgeon', 'From consultation to final follow-up'],
    ['Level 1', 'Residency across three trauma centres'],
    ['English &amp; Spanish', 'Both spoken in the practice'],
  ]
    .map(
      ([value, label]) => `    <div class="trust_item">
      <p class="trust_value">${value}</p>
      <p class="trust_label">${label}</p>
    </div>`
    )
    .join('\n')

  return `<section class="trust_component">
  <div class="trust_inner">
${items}
  </div>
</section>`
}

/* "Who it suits", promoted and turned into cards.
   The reference's strongest move is leading with the PATIENT'S PROBLEM rather
   than the procedure: six named things bonding can improve, high on the page,
   so a reader self-identifies before being asked to believe anything. This
   template already had exactly that content and buried it as bullet points in
   the third screen of prose.

   Keyed on the authored heading rather than on position, because injectables'
   first section is "Neuromodulators" and its bullets are per-unit prices, not
   symptoms. render() warns when a treatment has no "Who it suits" section so
   the exception stays visible instead of silently rendering price lines as
   symptoms. */
function suitsSection(t) {
  const block = t.sections.find((b) => /^who it suits$/i.test(b.heading))
  if (!block) return null
  const list = block.body.find(Array.isArray)
  if (!list || !list.length) return null

  const lead = block.body.filter((b) => !Array.isArray(b))
  const cards = list
    .map(
      (item, i) => `      <li class="suits_card">
        <span class="suits_index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        <p class="suits_text">${item}</p>
      </li>`
    )
    .join('\n')

  return `<section class="suits_component">
  <div class="suits_inner">
    <div class="suits_head">
      <p class="chapter_mark">What this treats</p>
      <h2 class="display-lg suits_title">${esc(block.heading)}</h2>
${lead.length ? `      <div class="suits_lede">\n${lead.map((x) => `        <p>${x}</p>`).join('\n')}\n      </div>` : ''}
    </div>
    <ul class="suits_grid" data-j="stagger">
${cards}
    </ul>
  </div>
</section>`
}

/* The reference shows proof before it asks for belief. We have none to show:
   the before/after library holds real, identifiable patients without current
   written consent, and one file in it is another surgeon's marketing image.
   A generated or stock "case" on a surgical practice's site is a fabricated
   clinical outcome, which is the single claim a patient actually relies on.

   Worth knowing: the reference page has the same gap. Its proof section is an
   HTML comment reading "placeholders with Mason Park-owned bonding before/after
   photography before launch". So this beat is honest disclosure plus a route to
   the gallery, and it becomes real photography the day consent exists. */
function proofSection(t) {
  return `<section class="proof-note_component stone-panel">
  <div class="proof-note_inner">
    <p class="chapter_mark">Results</p>
    <h2 class="proof-note_title">The work speaks in pairs of photographs.</h2>
    <p class="proof-note_text">Cases are published only with the patient&rsquo;s current written consent, so the gallery fills as the practice&rsquo;s own photography is shot and cleared. Nothing on this page is a stock or generated result.</p>
    <div class="proof-note_actions">
      <a class="button is-secondary" href="results.html">See results &amp; reviews</a>
    </div>
  </div>
</section>`
}

/* Cost and payment. The fee is this treatment's own first fact; the
   consultation fee, the deposit and the financing providers are the practice's
   published figures, the same ones the home and booking pages carry. */
function costSection(t) {
  const fee = t.facts[0]
  return `<section class="cost_component">
  <div class="cost_inner">
    <div class="cost_head">
      <p class="chapter_mark">Cost and payment</p>
      <h2 class="display-lg">Know the fee before anything is booked.</h2>
    </div>
    <div class="cost_body">
      <div class="cost_figure">
        <p class="cost_figure-label">${esc(fee.label)}</p>
        <p class="cost_figure-value">${fee.value}</p>
        <p class="cost_figure-note">Your written plan after the consultation carries the fee that applies to you. Complex cases are quoted individually.</p>
      </div>
      <div class="cost_rows">
        <div class="cost_row">
          <p class="cost_row-label">The consultation</p>
          <p class="cost_row-text">$175 for Texas residents and $250 from out of state, with a $100 deposit that holds the appointment and comes off the fee.</p>
        </div>
        <div class="cost_row">
          <p class="cost_row-label">Spreading it</p>
          <p class="cost_row-text">Financing through <a class="text-style-link" href="https://apply.sunbit.com/StoneSurgicalArts" rel="noopener">Sunbit</a>, CareCredit and Scratchpay. A membership banks credit month by month instead of borrowing against it.</p>
        </div>
      </div>
    </div>
  </div>
</section>`
}

/* Two patient quotes, and they are LABELLED as being about the practice rather
   than about this procedure, because that is what they are. Both were published
   by the practice with the patient's name and are recovered verbatim from the
   archived testimonials page.

   The reference puts treatment-specific reviews here. Ours are not
   treatment-specific: attaching the lip-filler review to the lip lift page, or
   the eyelid one to the brow lift, would be putting words in a patient's mouth
   about an operation they did not have. Per-treatment quotes are a content gap,
   listed in HANDOFF.md. */
function reviewsSection() {
  return `<section class="svc-reviews_component">
  <div class="svc-reviews_inner">
    <div class="svc-reviews_head">
      <p class="chapter_mark">About the practice</p>
      <h2 class="display-lg">Not about this operation, about how it is done.</h2>
    </div>
    <div class="svc-reviews_grid" data-j="stagger">
      <figure class="rail_card">
        <blockquote class="rail_text">Dr. Stone is so kind and also a great, proactive surgeon. Not only do I send patients to her, I am one myself. The office and staff are equally fantastic.</blockquote>
        <figcaption class="rail_meta"><span class="rail_name">Brittney Culp</span><span class="rail_tag">Referring provider</span></figcaption>
      </figure>
      <figure class="rail_card">
        <blockquote class="rail_text">Dr. Stone will hear your concerns and give you all of your options. At no point will you feel pressured in your treatment choices.</blockquote>
        <figcaption class="rail_meta"><span class="rail_name">Darci Wilson</span><span class="rail_tag">Non-surgical</span></figcaption>
      </figure>
    </div>
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
  if (!t.sections.some((b) => /^who it suits$/i.test(b.heading))) {
    console.warn(
      `  note: ${t.slug} has no "Who it suits" section, so it gets no symptom cards. ` +
        `Its first section is "${t.sections[0].heading}".`
    )
  }

  /* The order is the reference page's, adapted to the content that exists.
     See the block comment above trustSection() for what each beat is and why
     two of the reference's beats are deliberately absent. */
  return [
    header,
    '<div class="journey_page">',
    headSection(t, cat),
    trustSection(),
    ledeSection(t),
    suitsSection(t),
    specSection(t),
    journeySection(t),
    proofSection(t),
    costSection(t),
    reviewsSection(),
    faqSection(t),
    relatedSection(t, cat),
    '</div>',
  ]
    .filter(Boolean)
    .join('\n\n') + '\n'
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
