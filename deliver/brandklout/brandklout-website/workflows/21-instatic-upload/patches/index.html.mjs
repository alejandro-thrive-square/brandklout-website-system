/* Agency edits to Sang's v11 home page (2026-09-14, Alejandro's design feedback), plus the edits made
   in the Instatic admin after the v11 push, ported so the next push does not overwrite them.

   1. The hero's client-results card is a SLIDER: Sang's Legacy card is slide 1, and AVA, Oceanic,
      Omnia and OCPAO follow with the numbers from his own story data (assets/customer-stories-v10.json).
      Each slide is plain markup, so it is edited, duplicated or removed in the Instatic editor like any
      other block; agency/slider.js counts the slides at load and builds the dots.
   2. #results takes preview 1's "Proof before promises" layout: three case cards, now each with a
      photo and the practice's logo (the logos are the ones Sang uploaded to the media library).
   3. Preview 1's client stories panel ("Five stories. Told by the owners who lived the results.") sits
      between #results and "Why us". Each video opens in Sang's own pop-up player (visual.js).
   Styles: agency/site.css, "home v12". */

const WEBFLOW_SEAN = 'https://cdn.prod.website-files.com/68e12d861f12c7f04a762a8e/68e3d2351a752c82af35bf5a_Headshot%20Dr%20Sean.webp'
const WEBFLOW_DIB = 'https://cdn.prod.website-files.com/692cdb7f938ed8796599a516/69fc35d04732f82ce7517788_Screenshot%202026-05-06%20at%2011.48.18%E2%80%AFPM.png'
const WEBFLOW_OCEANIC = 'https://cdn.prod.website-files.com/66cd6c49cbb85d43d9e41a7c/66fdd957a53881201f770a58_oceanic-dental-cantrell-bonin.jpg'
const LOGO = {
  legacy: 'https://brandklout-production.up.railway.app/uploads/MLysNP-8O2_2S4HXn1rF5-Legacy_Dental.jpg',
  ava: 'https://brandklout-production.up.railway.app/uploads/FQ4eLLg_WoGp3mcVakxxS-AVA_Dental_Implants_Periodontics.jpg',
  oceanic: 'https://brandklout-production.up.railway.app/uploads/0fB-xd9m533hQsiAJK7Ph-Oceanic_Dental.jpg',
}

const link = (href) => `<a class="ref-story-link" href="${href}">See the practice behind the numbers <span aria-hidden="true">→</span></a>`
const slide = ({ avatar, name, sub, href, story, label, tag, big, caption, highlight, note, pair }) =>
  `<div class="bk-slide">\n` +
  `<div class="ref-practice-row"><div class="ref-practice-avatar">${avatar}</div><div><strong>${name}</strong><span>${sub}</span></div><a aria-label="Read the ${story} customer story" href="${href}">↗</a></div>\n` +
  `<div class="ref-chart-panel"><div class="ref-chart-label"><span>${label}</span><span class="ref-chart-tag">${tag}</span></div><div class="ref-big-number">${big}<span>${caption}</span></div>\n` +
  `<div class="bk-proof-highlight">${highlight}</div><p>${note}</p></div>\n` +
  `<div class="ref-result-pair">${pair.map(([n, t]) => `<div><strong>${n}</strong><span>${t}</span></div>`).join('')}</div>\n` +
  `${link(href)}\n</div>`

const SLIDES = [
  slide({
    avatar: `<span aria-hidden="true">AVA</span><img alt="Dr. Rafik Dib of AVA Dental Implants and Periodontics" height="52" loading="lazy" src="${WEBFLOW_DIB}" width="52"/>`,
    name: 'AVA Dental Implants &amp; Periodontics',
    sub: 'Practice launch · Davenport, Florida',
    href: 'customer-story-ava-dental-launch.html',
    story: 'AVA Dental',
    label: 'MONTHLY COLLECTIONS',
    tag: 'CLIENT-REPORTED',
    big: '<strong class="count" data-count="109" data-prefix="$" data-suffix="K">$109K</strong>',
    caption: 'Within the first 90 days <br/>after grand opening.',
    highlight: 'Doctor authority was built before the doors opened, not after.',
    note: 'Client-reported monthly collections, not a cumulative total. Individual results vary.',
    pair: [['200+', 'Doctor reviews before opening'], ['Top 3', 'Reported local implant visibility']],
  }),
  slide({
    avatar: `<span aria-hidden="true">OD</span><img alt="Two Oceanic Dental doctors at the practice's front desk" height="52" loading="lazy" src="${WEBFLOW_OCEANIC}" width="52"/>`,
    name: 'Oceanic Dental',
    sub: 'Reputation + AI search · 2 locations',
    href: 'customer-story-oceanic-ai-search-growth.html',
    story: 'Oceanic Dental',
    label: 'REPUTATION MOMENTUM',
    tag: 'CLIENT-REPORTED',
    big: '<strong class="count" data-count="35">35</strong>',
    caption: 'Positive reviews generated <br/>in two weeks.',
    highlight: 'Reputation, local presence and AI search aligned across both locations.',
    note: 'Client-reported. Individual results vary.',
    pair: [['4.8★', 'Average reputation reached'], ['2', 'Locations aligned']],
  }),
  slide({
    avatar: '<span aria-hidden="true">OM</span>',
    name: 'Omnia Dental',
    sub: 'AI search authority · Chino Hills, California',
    href: 'customer-story-omnia-ai-search-growth.html',
    story: 'Omnia Dental',
    label: 'AI SEARCH VISIBILITY',
    tag: 'OBSERVED',
    big: '<strong>#1</strong>',
    caption: 'Observed AI-search choice <br/>for implants + Invisalign.',
    highlight: 'Clearer doctor, treatment and reputation signals around two priority services.',
    note: 'Observed during selected client-period prompts. AI answers vary by query and over time.',
    pair: [['2', 'Priority treatment categories'], ['1', 'Doctor story across channels']],
  }),
  slide({
    avatar: '<span aria-hidden="true">OC</span>',
    name: 'OCPAO Implant Courses',
    sub: 'Education authority · Dr. Lara',
    href: 'customer-story-ocpao-ai-authority.html',
    story: 'OCPAO Implant Courses',
    label: 'CATEGORY VISIBILITY',
    tag: 'OBSERVED',
    big: '<strong>#1</strong>',
    caption: 'Across Gemini, Grok <br/>and ChatGPT.',
    highlight: 'Specialized clinical expertise turned into an authority system AI can retrieve.',
    note: 'Observed during selected client-period prompts. AI answers vary by query and over time.',
    pair: [['3', 'AI answer engines monitored'], ['1', 'Education authority system']],
  }),
]

const CONTROLS =
  '<div class="bk-slider-controls" data-slider-controls="">' +
  '<button aria-label="Previous result" class="bk-slider-arrow" data-slider-prev="" type="button">←</button>' +
  '<div class="bk-slider-dots" data-slider-dots=""></div>' +
  '<button aria-label="Next result" class="bk-slider-arrow" data-slider-next="" type="button">→</button>' +
  '</div>'

const caseCard = ({ href, photo, photoAlt, photoPos, photoW, photoH, logo, logoAlt, tag, title, body, metrics }) =>
  `<a class="bk-case" data-reveal="" href="${href}">\n` +
  `<figure class="bk-case-media"><img alt="${photoAlt}" class="bk-case-photo" height="${photoH}" loading="lazy" src="${photo}"${photoPos ? ` style="object-position:${photoPos}"` : ''} width="${photoW}"/>` +
  `<div class="bk-case-logo"><img alt="${logoAlt}" height="400" loading="lazy" src="${logo}" width="600"/></div></figure>\n` +
  `<div class="bk-case-body"><span class="bk-case-tag">${tag}</span><h3>${title}</h3><p>${body}</p>\n` +
  `<div class="bk-case-metrics">${metrics.map(([n, t]) => `<div><strong>${n}</strong><span>${t}</span></div>`).join('')}</div>\n` +
  `<span class="bk-case-link">Read the story <span aria-hidden="true">↗</span></span></div></a>`

const RESULTS =
  '<section class="section soft results-section" id="results"><div class="wrap">\n' +
  '<div class="section-head" data-reveal=""><div class="section-copy"><div class="kicker">PROOF BEFORE PROMISES</div><h2>Growth you can tie to a real practice.</h2></div>' +
  '<p class="section-aside">Most marketing sites lead with services. We lead with evidence. BrandKlout is built to improve the signals that influence discovery, trust, conversion and ultimately production.</p></div>\n' +
  '<div class="bk-cases">\n' +
  [
    caseCard({
      href: 'customer-story-legacy-dental-pasadena.html',
      photo: WEBFLOW_SEAN,
      photoAlt: 'Dr. Sean Sunyoto of Legacy Dental Pasadena',
      photoW: 900,
      photoH: 1200,
      photoPos: '50% 18%',
      logo: LOGO.legacy,
      logoAlt: 'Legacy Dental Pasadena logo',
      tag: 'Established practice',
      title: 'Legacy Dental Pasadena',
      body: 'Strengthened doctor authority, patient proof and local visibility while improving the practice’s broader acquisition engine.',
      metrics: [['+60%', 'collections growth'], ['+200%', 'new patient growth'], ['+250%', 'Yelp organic traffic'], ['7 mo.', 'to Invisalign Diamond']],
    }),
    caseCard({
      href: 'customer-story-ava-dental-launch.html',
      photo: WEBFLOW_DIB,
      photoAlt: 'Dr. Rafik Dib of AVA Dental Implants and Periodontics',
      photoW: 772,
      photoH: 978,
      photoPos: '50% 20%',
      logo: LOGO.ava,
      logoAlt: 'AVA Dental Implants and Periodontics logo',
      tag: 'Practice launch',
      title: 'AVA Dental Implants &amp; Periodontics',
      body: 'Built Dr. Rafik Dib’s authority before opening so the doctor, not just the future office, entered the market with trust already established.',
      metrics: [['$109K', 'monthly collections*'], ['90 days', 'after grand opening'], ['200+', 'doctor reviews pre-opening'], ['Top 3', 'reported local implant visibility']],
    }),
    caseCard({
      href: 'customer-story-oceanic-ai-search-growth.html',
      photo: WEBFLOW_OCEANIC,
      photoAlt: "Two Oceanic Dental doctors at the practice's front desk",
      photoW: 1800,
      photoH: 1800,
      photoPos: '50% 14%',
      logo: LOGO.oceanic,
      logoAlt: 'Oceanic Dental logo',
      tag: 'Reputation engine',
      title: 'Oceanic Dental',
      body: 'Made it easier for happy patients to share real experiences across the platforms future patients use to evaluate a practice.',
      metrics: [['35', 'new positive reviews'], ['2 wks', 'to create momentum'], ['4.8★', 'average reputation'], ['2', 'locations aligned']],
    }),
  ].join('\n') +
  '\n</div>\n' +
  '<p class="bk-proof-note">*Individual client results vary. Metrics shown reflect specific client periods and should not be interpreted as guarantees of future performance.</p>\n' +
  '</div></section>'

const story = ({ id, title, alt, outcome, heading, person, href, label }) =>
  `<article class="bk-story-card"><a aria-label="Play ${label}" class="bk-story-frame" data-video="${id}" data-video-title="${title}" href="https://www.youtube.com/watch?v=${id}" rel="noopener" target="_blank">` +
  `<img alt="${alt}" class="bk-story-thumb" height="360" loading="lazy" src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" width="480"/><span aria-hidden="true" class="bk-story-play">▶</span></a>` +
  `<div class="bk-story-copy"><span class="bk-story-outcome">${outcome}</span><h3>${heading}</h3>` +
  `<div class="bk-story-bottom"><span class="bk-story-person">${person}</span><a class="bk-story-watch" href="${href}">Read story ↗</a></div></div></article>`

const STORIES =
  '<section class="section bk-stories-section" id="client-stories"><div class="wrap"><div class="bk-stories" data-reveal="">\n' +
  '<div class="bk-stories-head"><div><div class="kicker">CLIENT STORIES · ON VIDEO</div><h2>Five stories. Told by the owners who lived the results.</h2></div>' +
  '<p>Metrics show what changed. These conversations reveal the decisions, partnership and operating context behind the outcomes.</p></div>\n' +
  '<div class="bk-story-grid">\n' +
  [
    story({ id: '-AoUNSpxeAo', title: 'How Dr. Sean at Legacy Dental Pasadena went from Enrolled to Invisalign Diamond in 7 months', label: "Dr. Sean's Legacy Dental Pasadena story", alt: 'Dr. Sean sharing the Legacy Dental Pasadena customer story', outcome: 'Invisalign growth', heading: 'From enrolled to Diamond in seven months', person: 'Dr. Sean · Legacy Dental Pasadena', href: 'customer-story-legacy-dental-pasadena.html' }),
    story({ id: 'MeqveWUBHO4', title: "How Victor, CFO at Oceanic Dental, boosted revenue with AI search on Google and ChatGPT", label: "Victor's Oceanic Dental story", alt: "Victor sharing Oceanic Dental's Google and AI search growth story", outcome: 'Revenue + visibility', heading: 'Connecting Google and AI visibility to practice growth', person: 'Victor · CFO, Oceanic Dental', href: 'customer-story-oceanic-ai-search-growth.html' }),
    story({ id: 'xS-FwYPS0DY', title: 'How Dr. Priyawat at Omnia Dental became the #1 choice on AI search for implants and Invisalign', label: "Dr. Priyawat's Omnia Dental story", alt: "Dr. Rupporn Priyawat sharing Omnia Dental's AI search story", outcome: 'AI search authority', heading: 'The #1 AI-search choice for implants and Invisalign', person: 'Dr. Rupporn Priyawat · Omnia Dental', href: 'customer-story-omnia-ai-search-growth.html' }),
    story({ id: 'pChw6256klY', title: "How Dr. Lara's OCPAO Implant Courses went from invisible to #1 on Gemini, Grok and ChatGPT", label: "Dr. Lara's OCPAO Implant Courses story", alt: 'Dr. Lara sharing the OCPAO Implant Courses AI authority story', outcome: 'Education authority', heading: 'From invisible to #1 across Gemini, Grok and ChatGPT', person: 'Dr. Lara · OCPAO Implant Courses', href: 'customer-story-ocpao-ai-authority.html' }),
    story({ id: 'r92o3HAhRec', title: 'How Dr. Krystal Pham at Oceanic Dental is future-proofing her practice with AI and online visibility', label: "Dr. Krystal Pham's Oceanic Dental story", alt: "Dr. Krystal Pham sharing Oceanic Dental's future-ready growth story", outcome: 'Future-ready growth', heading: 'Future-proofing a practice with AI and online visibility', person: 'Dr. Krystal Pham · Oceanic Dental', href: 'customer-story-oceanic-future-ready.html' }),
  ].join('\n') +
  '\n</div>\n' +
  '<p class="bk-proof-note">Client experiences and outcomes are individual. Results vary and are not guaranteed.</p>\n' +
  '</div></div></section>'

/* v16 (2026-09-14, Alejandro: "keep the same structure and sections that we have currently"). Sang's
   v12 carousel and v13 results cards rebuilt the same two areas as the agency slider and case cards
   below, and his home page dropped the closing section and moved the prequalification form under
   the FAQ. The live structure is kept: his hero panel goes back to the v11 Legacy card (the anchor
   the slider patches expect), and the section order is the live one. Everything else in v16 stands. */
import fs from 'node:fs'

const V11_HOME = fs.readFileSync(new URL('../../00-client-delivery-initialization/.tmp/client-handoff/package-v11/index.html', import.meta.url), 'utf8')
const fromV11 = (re, what) => {
  const m = V11_HOME.match(re)
  if (!m) throw new Error(`patches/index.html.mjs: the v11 ${what} is not in package-v11/index.html`)
  return m[0]
}
const V11_PROOF = fromV11(/<div class="reference-proof-wrap" data-reveal="">[\s\S]*?(?=\n<\/div><\/section>\n<section class="client-strip">)/, 'hero proof card')
const V11_CLOSING = fromV11(/<section class="closing-section">[\s\S]*?<\/section>/, 'closing section')

export default [
  /* --- 0. v16 -> the live structure ---------------------------------------------------------- */
  {
    why: 'v16: the hero carousel stylesheet is not used (the agency slider replaces it)',
    find: /<link href="assets\/hero-carousel-v12\.css"[^>]*>/,
    replace: '',
  },
  {
    why: 'v16: the hero carousel script is not used either; every page now links the same assets',
    find: /<script[^>]*src="assets\/hero-carousel-v12\.js"[^>]*><\/script>/,
    replace: '',
  },
  {
    why: 'v16: Sang’s three-story carousel -> the v11 Legacy card, which the slider patches build on',
    find: /<div aria-label="Featured customer success stories"[\s\S]*?(?=\n<\/div><\/section>\n<section class="client-strip">)/,
    replace: V11_PROOF,
  },
  {
    why: 'v16: the prequalification form back above the FAQ, and the closing section back after it',
    find: /(<section class="section tight" id="faq">[\s\S]*?<\/section>)(<section class="section opportunity-section bottom-market-prequal" id="market-prequalification">[\s\S]*?<\/section>)(?=<\/main>)/,
    replace: (_, faq, prequal) => prequal + faq + V11_CLOSING,
  },

  /* --- 1. the hero slider ------------------------------------------------------------------- */
  {
    why: 'hero slider: open the slider and slide 1 (Sang’s Legacy card) after the card header',
    find: '<span class="ref-client-pill">Real practice. Real progress.</span></div>\n<div class="ref-practice-row">',
    replace:
      '<span class="ref-client-pill">Real practice. Real progress.</span></div>\n' +
      '<div aria-label="Client results" aria-roledescription="carousel" class="bk-slider" data-slider=""><div class="bk-slider-track" data-slider-track="" tabindex="0"><div class="bk-slide">\n' +
      '<div class="ref-practice-row">',
  },
  {
    why: 'hero slider: close slide 1, add slides 2-5 and the controls',
    find: 'See the practice behind the numbers <span aria-hidden="true">→</span></a>\n</div></div><div class="ref-proof-badge">',
    replace:
      'See the practice behind the numbers <span aria-hidden="true">→</span></a>\n</div>\n' +
      SLIDES.join('\n') +
      '\n</div>' +
      CONTROLS +
      '</div>\n</div></div><div class="ref-proof-badge">',
  },
  {
    why: 'hero slider: the floating badge speaks for every slide, not only Legacy',
    find: "<strong>Invisalign Diamond</strong><small>Legacy's seven-month milestone</small>",
    replace: '<strong>5 practices. 6 stories.</strong><small>Every result links to its story</small>',
  },
  {
    why: 'hero slider: the source note covers every slide',
    find: 'Source: supplied Legacy Dental customer story. Selected client-period outcomes. Individual results vary.',
    replace: 'Source: supplied customer stories. Selected client-period outcomes. Individual results vary.',
  },

  /* --- 2 + 3. #results as preview 1's three cards, then the client stories panel ------------- */
  {
    why: '#results takes preview 1’s "Proof before promises" layout, followed by its client stories panel',
    find: /<section class="section soft results-section" id="results">[\s\S]*?(?=<section class="section v5-founder" id="why-brandklout">)/,
    replace: RESULTS + '\n' + STORIES + '\n',
  },
  /* The edits made in the Instatic admin on 2026-09-14 (wordmark, "Why us" headline, founder quote,
     featured-stories headline) were ported here once and then dropped the same evening, on
     Alejandro's instruction: "Forget the changes that we made on Instatic". Sang's wording stands. */
]
