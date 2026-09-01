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

function heroSection(t, cat) {
  return `<section class="section_hero hero_component is-page">
  <div class="padding-global hero_inner">
    <div class="container-large">
      <nav class="breadcrumb_component" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span class="breadcrumb_sep">/</span>
        <a href="treatments.html">Treatments</a><span class="breadcrumb_sep">/</span>
        <a href="treatments.html#${cat.anchor}">${cat.label}</a><span class="breadcrumb_sep">/</span>
        <span aria-current="page">${t.name}</span>
      </nav>
      <p class="eyebrow is-center hero_eyebrow">${cat.label}</p>
      <h1 class="heading-style-h1 hero_title">${t.name}</h1>
      <p class="text-size-large hero_sub">${t.heroSub}</p>
    </div>
  </div>
</section>`
}

function detailSection(t) {
  const body = []
  for (const p of t.intro) body.push(para(p))
  for (const block of t.sections) {
    body.push(`\n            <h2 class="heading-style-h3">${esc(block.heading)}</h2>`)
    for (const item of block.body) {
      body.push(Array.isArray(item) ? bullets(item) : para(item))
    }
  }

  const rows = t.facts
    .map(
      (f) => `            <div class="fact-panel_row">
              <p class="fact-panel_label">${esc(f.label)}</p>
              <p class="fact-panel_value">${f.value}</p>
            </div>`
    )
    .join('\n')

  return `<section class="section_detail">
  <div class="padding-global">
    <div class="container-large">
      <div class="padding-section-large">
        <div class="detail-layout_component">

          <div class="text-rich-text text-size-medium">
${body.join('\n')}
          </div>

          <aside class="fact-panel_component" aria-label="At a glance">
${rows}
            <a class="button" href="book.html#request">Book a consultation</a>
            <p class="text-size-tiny text-style-muted text-align-center">Recovery figures are typical, not a promise. Yours is set out in your written plan.</p>
          </aside>

        </div>
      </div>
    </div>
  </div>
</section>`
}

const band = (img) => `<section class="section_detail-band">
  <div class="padding-global">
    <div class="container-large">
      <div class="padding-bottom padding-large">
        <div class="band-media_component" data-reveal>
          <img src="assets/${img.file}" alt="${esc(img.alt)}" width="1600" height="900" loading="lazy">
        </div>
      </div>
    </div>
  </div>
</section>`

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

  return [
    header,
    heroSection(t, cat),
    detailSection(t),
    band(t.bandImage),
    journeySection(t),
    faqSection(t),
    relatedSection(t, cat),
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
