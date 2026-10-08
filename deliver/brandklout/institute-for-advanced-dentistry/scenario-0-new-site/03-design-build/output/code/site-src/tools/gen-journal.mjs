/**
 * gen-journal.mjs — the journal and legal pages, generated from the client's own sources (re-runnable).
 *
 *   in:  the WordPress scrape   workflows/01-content-intake/.tmp/current-site-scrape/raw-html/<post>/index.html
 *        the client's A2P texts workflows/21-instatic-upload/legal/{privacy-policy,terms-of-service}.md (verbatim)
 *        the accessibility statement as live on production on 2026-10-01 (A11Y below, verbatim)
 *   out: pages/<post-slug>.html                    the 20 articles, each at its WordPress root URL
 *        pages/about-our-practice/articles.html    the journal index
 *        pages/category/<slug>.html                the five WordPress categories (pagination URLs dropped)
 *        pages/privacy-policy.html, terms-of-service.html, accessibility-statement.html, 404.html
 *
 * Article bodies keep the author's words, headings and lists. The generator removes the WordPress chrome,
 * the closing calls to action (the invitation does that job), and every em dash: the specific rewrites per
 * post are in POSTS[slug].edits, the generic ones in DASH_RULES; every change is printed to stdout so the
 * report can list it. Refuses (exit 1) when an edit does not match exactly once, when an em dash survives,
 * or when a title or description is outside the house lengths (title 50-60, description 140-160).
 *
 * Usage (from site-src):  node tools/gen-journal.mjs > C:/Users/ACER/AppData/Local/Temp/ifa-journal-gen.log 2>&1
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CLIENT = path.resolve(SRC, '../../../../..')
const RAW = path.join(CLIENT, 'workflows/01-content-intake/.tmp/current-site-scrape/raw-html')
const LEGAL = path.join(CLIENT, 'workflows/21-instatic-upload/legal')
const PAGES = path.join(SRC, 'pages')
const SUFFIX = ' | Institute for Advanced Dentistry'
const problems = []
const log = (...a) => console.log(...a)

/* ------------------------------------------------------------------ categories */
const CATS = {
  'implants-and-full-arch-solutions': { name: 'Implants & Full-Arch Solutions', short: 'Implants & Full-Arch', h1: 'Implants &amp; full-arch <em>solutions</em>.', title: 'Implants & Full-Arch', description: 'Articles by Dr. Jonathan Bensoussan on dental implants and full-arch teeth: single tooth implants, success rates, age, taxes and choosing an implant specialist.' },
  'general-and-preventive-care': { name: 'General & Preventive Care', short: 'General & Preventive', h1: 'General &amp; preventive <em>care</em>.', title: 'General & Preventive Care', description: 'Articles on general and preventive care from Institute for Advanced Dentistry in Peoria, AZ, including how dental implants support breathing during sleep.' },
  'uncategorized': { name: 'From the Practice', short: 'From the Practice', h1: 'More from <em>the practice</em>.', title: 'More Dental Articles', description: 'Guides from Dr. Jonathan Bensoussan on prosthodontics, implant crowns, cosmetic dentistry, new teeth in one day and tooth replacement in Peoria, AZ.' },
  'advanced-treatment': { name: 'Advanced Treatment', short: 'Advanced Treatment', h1: 'Advanced <em>treatment</em>.', title: 'Advanced Treatment', description: 'Articles on advanced dental treatment from Institute for Advanced Dentistry in Peoria, AZ: restorations, implant specialists and replacing missing teeth.', empty: ['advanced-dental-restorations-in-peoria-az', 'what-to-look-for-in-an-implant-specialist', 'tooth-replacement-peoria-az'] },
  'cosmetic-dentistry': { name: 'Cosmetic Dentistry', short: 'Cosmetic Dentistry', h1: 'Cosmetic <em>dentistry</em>.', title: 'Cosmetic Dentistry', description: 'Articles on cosmetic dentistry from Institute for Advanced Dentistry in Peoria, AZ: what a cosmetic dentist does, popular treatments and a new smile in a day.', empty: ['cosmetic-dentist-in-peoria-az', 'cosmetic-dental-treatments', 'new-smile-in-one-day-in-peoria-az'] }
}
const CAT_ORDER = ['implants-and-full-arch-solutions', 'general-and-preventive-care', 'uncategorized', 'advanced-treatment', 'cosmetic-dentistry']

/* ------------------------------------------------------------------- the posts
   title: the <title> before the suffix. label: crumbs and tiles. img/alt: the lead photograph.
   cutFrom: the first block of the closing call to action (that block and everything after it go).
   drop: blocks removed wherever they are. edits: exact rewrites, each must match once.
   quote: paragraphs (by their opening words) that are the author's own pull quotes.            */
const POSTS = {
  'what-to-look-for-in-an-implant-specialist': {
    title: 'Implant Specialist Guide', label: 'What to look for in an implant specialist', img: 'jr-implant-specialist.jpg',
    alt: 'Dr. Bensoussan shaking hands with a patient in the practice reception',
    description: 'One plan for the bone and the bite: why implant surgery and the new teeth belong with one clinician, and what to ask before implant treatment begins in Peoria.',
    tagline: 'Free implant consultation', quote: ['“A complex case is planned in reverse.', '“Many patients assume a failed implant']
  },
  'peoria-prosthodontics-institute-for-advanced-dentistry': {
    title: 'Peoria Prosthodontics', label: 'Peoria prosthodontics', img: 'jr-peoria-prosthodontics.jpg',
    alt: 'Dr. Bensoussan showing a patient a dental model and pointing to a detail',
    h1: 'Peoria Prosthodontics: Institute For Advanced Dentistry',
    description: 'What prosthodontics is, why specialized care matters, and the implants, smile makeovers and restorations a surgical prosthodontist offers in Peoria, AZ.',
    tagline: 'Meet your prosthodontist'
  },
  'expert-implants-dentist-peoria': {
    title: 'Expert Implant Dentist', label: 'Expert implants dentist in Peoria', img: 'jr-expert-implants.jpg',
    alt: 'Dr. Bensoussan at the X-Guide navigation screen, explaining an implant plan to a patient',
    h1: 'Expert Implants Dentist in Peoria: Advanced Dentistry',
    description: 'What dental implants are, their benefits, and how to find the right implants dentist in Peoria: qualifications, reviews, the consultation and the warranty.',
    tagline: 'Free dental implant consultation',
    cutFrom: '<h3>Encouragement to Schedule a Consultation</h3>',
    edits: [['over time—a process known as osseointegration—making them', 'over time, a process known as osseointegration, making them']]
  },
  'implant-crown-peoria-az': {
    title: 'What Is an Implant Crown?', label: 'What is an implant crown?', img: 'jr-implant-crown.jpg',
    alt: 'Illustration of an implant crown on its abutment and implant, between natural teeth',
    description: 'An implant crown is the visible tooth on top of a dental implant. A prosthodontist explains its three parts, the materials, the process and how long it lasts.',
    tagline: 'Free dental implant consultation',
    cutFrom: '<h2>Ready to Learn More?</h2>',
    edits: [
      ['“implant crown” — but what', '“implant crown,” but what'],
      ['isn’t a single piece — it’s a system', 'isn’t a single piece: it’s a system'],
      ['an artificial root — there’s no natural', 'an artificial root: there’s no natural'],
      ['prosthodontists — specialists in tooth replacement and restoration — are', 'prosthodontists, specialists in tooth replacement and restoration, are'],
      ['eMax ceramic — no metal', 'eMax ceramic: no metal'],
      ['biting forces — particularly', 'biting forces, particularly'],
      ['alternative to titanium — a meaningful', 'alternative to titanium, a meaningful'],
      ['with the jawbone — a process called', 'with the jawbone, a process called'],
      ['cases like yours — missing teeth', 'cases like yours: missing teeth'],
      ['requires no anesthesia — you may feel', 'requires no anesthesia. You may feel'],
      ['underlying structure — and the precision required to place them — is quite', 'underlying structure, and the precision required to place them, is quite']
    ]
  },
  'advanced-dental-restorations-in-peoria-az': {
    title: 'Dental Restorations Guide', label: 'Advanced dental restorations', img: 'jr-restorations.jpg',
    alt: 'Dr. Bensoussan checking a dental model at the laboratory bench',
    description: 'Advanced dental restorations restore the function, integrity and look of your teeth. How they work, the issues they solve and the care Dr. Bensoussan plans.',
    tagline: 'Free comprehensive exam'
  },
  'cosmetic-dental-treatments': {
    title: 'Cosmetic Treatments', label: 'Cosmetic dental treatments', img: 'jr-cosmetic-treatments.jpg',
    alt: 'A woman laughing with her hands on her cheeks, the Arizona desert behind her',
    description: 'A smile shapes how others see us and how we feel. The cosmetic dental treatments a prosthodontist in Peoria offers for chips, stains, gaps and worn teeth.',
    tagline: 'Free smile design preview',
    drop: ['<h3>Contact Information for Dr. Bensoussan</h3>', 'If you’re ready to explore cosmetic dentistry options and reclaim your confidence']
  },
  'dental-implant-success-rates-in-2026': {
    title: 'Implant Success in 2026', label: 'Dental implant success rates in 2026', img: 'jr-success-2026.jpg',
    alt: 'Dr. Bensoussan planning implant positions on two screens',
    description: 'Do dental implants work long term? What success rates really mean, what modern studies show and what patients in Peoria, AZ should realistically expect.',
    tagline: 'Free dental implant consultation',
    cutFrom: '<h2>Thinking About Dental Implants?</h2>',
    edits: [
      ['The short answer is yes — and in 2026', 'The short answer is yes, and in 2026'],
      ['Yes — and this is where implants really stand out.', 'Yes, and this is where implants really stand out.'],
      ['aren’t possible — it just means', 'aren’t possible. It just means'],
      ['long-term care — not just placing', 'long-term care, not just placing'],
      ['can last for decades — often a lifetime.', 'can last for decades, often a lifetime.'],
      ['especially in complex cases .', 'especially in complex cases.'],
      ['consistency across cases .', 'consistency across cases.']
    ]
  },
  'what-is-a-prosthodontist': {
    title: 'What Is a Prosthodontist?', label: 'What is a prosthodontist?', img: 'jr-prosthodontist-model.jpg',
    alt: 'Dr. Bensoussan inspecting a dental model at the laboratory bench',
    description: 'What a prosthodontist is, how the training differs from a general dentist’s, what they treat and when to see one in Peoria, AZ for complex restorative care.',
    tagline: 'Meet your prosthodontist',
    drop: ['<strong>Ready to find out if prosthodontic care is right for you?</strong>'],
    edits: [
      ['your oral health—especially if', 'your oral health, especially if'],
      ['advanced restorative dentistry—particularly when', 'advanced restorative dentistry, particularly when'],
      ['stability, and function—often secured', 'stability, and function, often secured'],
      ['fix individual teeth—they restore balance.', 'fix individual teeth: they restore balance.'],
      ['The answer is both—but function', 'The answer is both, but function']
    ]
  },
  'new-smile-in-one-day-in-peoria-az': {
    title: 'New Smile in One Day', label: 'A new smile in one day', img: 'jr-smile-one-day.jpg',
    alt: 'A woman with long dark hair smiling broadly',
    description: 'Walk in with failing, damaged or missing teeth and walk out the same day with a full smile. How a new smile in one day works in Peoria AZ, and who it suits.',
    tagline: 'Teeth in a day, planned first',
    cutFrom: '<h2>Ready to Transform Your Smile in One Day? Contact Us Today.</h2>',
    edits: [
      ['missing teeth—and walk out', 'missing teeth, and walk out'],
      ['dental implants—typically using', 'dental implants, typically using'],
      ['the look you want—bright, natural', 'the look you want: bright, natural'],
      ['in one day—secured, stable', 'in one day: secured, stable'],
      ['a full smile—not months later.', 'a full smile, not months later.'],
      ['start to finish—no fear', 'start to finish: no fear']
    ]
  },
  'cosmetic-dentist-in-peoria-az': {
    title: 'Cosmetic Dentist Guide', label: 'What to expect from a cosmetic dentist', img: 'jr-cosmetic-dentist.jpg',
    alt: 'A man in a pink shirt with a wide, confident smile',
    description: 'What to expect from a cosmetic dentist in Peoria AZ: popular treatments, how long results last, what to look for in a dentist and what the consultation covers.',
    tagline: 'Free smile design preview',
    cutFrom: '<h2>Take the First Step Toward Your New Smile</h2>',
    edits: [
      ['one cohesive plan — giving you', 'one cohesive plan, giving you'],
      ['don’t just look good — they fit', 'don’t just look good: they fit'],
      ['Yes — cosmetic dentistry', 'Yes. Cosmetic dentistry'],
      ['transparency is a priority—you’ll always', 'transparency is a priority: you’ll always'],
      ['Every detail—from color and shape to proportion—is customized', 'Every detail, from color and shape to proportion, is customized']
    ]
  },
  'tooth-replacement-peoria-az': {
    title: 'Tooth Replacement Guide', label: 'Tooth replacement in Peoria AZ', img: 'jr-tooth-replacement.jpg',
    alt: 'A full, even smile after missing front teeth were replaced',
    description: 'Missing teeth affect confidence, chewing and oral health. A full guide to tooth replacement in Peoria AZ: implant types, treatment steps and how to choose.',
    tagline: 'Free tooth replacement consultation',
    edits: [
      ['handled in-house— from surgical', 'handled in-house, from surgical'],
      ['<br>Yes — but many practices', '<br>Yes, but many practices']
    ]
  },
  'why-prosthodontist-dental-implants-in-peoria': {
    title: 'Why a Prosthodontist', label: '9 reasons to choose a prosthodontist', img: 'jr-why-prosthodontist.jpg',
    alt: 'A woman with shoulder-length blonde hair smiling',
    description: 'Nine reasons to choose a prosthodontist for dental implants in Peoria AZ, from specialist training and 2,500 implants placed to digital planning of each case.',
    tagline: 'Free dental implant consultation',
    edits: [
      ['a smart option—it’s the best one.', 'a smart option: it’s the best one.'],
      ['replace missing teeth—they restore', 'replace missing teeth: they restore']
    ]
  },
  'dental-implants-for-single-tooth-replacement': {
    title: 'Single Tooth Implants', label: 'Implants for single tooth replacement', img: 'jr-single-tooth.jpg',
    alt: 'Illustration of single implant crowns standing in the gum between natural teeth',
    description: 'Losing one tooth affects your smile and your oral health. The benefits of a dental implant for single tooth replacement, and what to weigh before choosing one.',
    tagline: 'Free dental implant consultation',
    drop: ['For single tooth replacement with dental implants, <a']
  },
  '6-reasons-dental-implants-are-ideal-for-young-adults': {
    title: 'Implants for Young Adults', label: '6 reasons implants suit young adults', img: 'jr-young-adults.jpg',
    alt: 'A young woman in the treatment chair checking her smile in a hand mirror',
    description: 'Six reasons implants suit young adults: better oral health, long-term durability, chewing function, a natural look, untouched neighbors and less bone loss.',
    tagline: 'Free dental implant consultation',
    drop: ['Call the Institute for Advanced Dentistry Implants to book']
  },
  'are-dental-implants-tax-deductible': {
    title: 'Dental Implant Tax Guide', label: 'Are dental implants tax deductible?', img: 'jr-tax.jpg',
    alt: 'A patient coordinator going over paperwork with a patient at her desk',
    description: 'Can dental implants be tax deductible? Under specific circumstances, yes. When implants count as a medical expense, how insurance affects it and how to claim.',
    tagline: 'Payment options explained',
    cutFrom: '<h2>How Age Affects Dental Implant Surgery</h2>'
  },
  'how-age-affects-dental-implant-surgery': {
    title: 'Age and Implant Surgery', label: 'How age affects implant surgery', img: 'jr-age.jpg',
    alt: 'Dr. Bensoussan examining an older patient in the treatment chair',
    description: 'Age shapes the outcome of dental implant surgery. What changes for children, young and middle-aged adults and older patients, and the factors behind success.',
    tagline: 'Free dental implant consultation',
    drop: ['the Institute for Advanced Dentistry Implants to schedule an appointment with']
  },
  'how-dental-implants-improve-airway-stability-and-breathing-during-sleep': {
    title: 'Implants and Sleep Apnea', label: 'Implants, airway and breathing in sleep', img: 'jr-sleep.jpg',
    alt: 'A woman pressing a pillow over her ears beside her partner, who is snoring',
    description: 'How dental implants can support airway stability and breathing during sleep: the types of sleep apnea, implant-supported appliances and what to consider first.',
    tagline: 'Free sleep and implant consultation',
    drop: ['Please get in touch with us if you need assistance', 'the Institute for Advanced Dentistry Implants to schedule an appointment with']
  },
  'how-dental-implants-can-transform-your-lifestyle': {
    title: 'Life With Dental Implants', label: 'How implants transform your lifestyle', img: 'jr-lifestyle.jpg',
    alt: 'An older couple laughing together over breakfast outdoors',
    description: 'Tired of missing teeth or dentures that move? How dental implants change daily life: eating what you like, speaking clearly, smiling freely, lasting for years.',
    tagline: 'Free dental implant consultation',
    drop: ['Discover more <a'],
    edits: [
      ['dentures that don’t fit properly – welcome', 'dentures that don’t fit properly. Welcome'],
      ['on special events – you will', 'on special events, you will'],
      ['unclear mumbling – welcome', 'unclear mumbling. Welcome'],
      ['removable dentures – say hi', 'removable dentures. Say hi']
    ]
  },
  'understanding-dental-implant-success-rates-and-longevity': {
    title: 'How Long Implants Last', label: 'Implant success rates and longevity', img: 'jr-longevity.jpg',
    alt: 'Illustration of implants supporting a single crown and a bridge in the jaw',
    description: 'Why dental implants have strong success rates and a long life span: what makes an implant succeed, what the research says and how to help yours last for years.',
    tagline: 'Free dental implant consultation',
    drop: ['Learn more <a'],
    edits: [['and real bone)—offering predictable', 'and real bone), offering predictable'], ['with the jawbone—is very important', 'with the jawbone is very important']],
    rules: [[/<strong>([A-Z][A-Za-z -]{2,40})—([^<]*)<\/strong>/g, '<strong>$1</strong>: $2', 'bold sentence split: the term stays bold, a colon replaces the dash']]
  },
  'the-role-of-dental-implants-in-addressing-speech-disorders-and-cleft-palate-conditions': {
    title: 'Implants and Speech Care', label: 'Implants, speech and cleft palate', img: 'jr-speech.jpg',
    alt: 'A team member talking with a patient across her desk',
    description: 'How dental implants support speech rehabilitation for speech disorders and cleft palate conditions, from palatal lifts and obturators to stable dentures.',
    tagline: 'Free consultation with Dr. Bensoussan',
    drop: ['the Institute for Advanced Dentistry Implants to schedule an appointment with']
  }
}

/* Generic dash rewrites, applied after the edits: a bold term then a dash becomes a bold term and a colon. */
const DASH_RULES = [
  [/<\/strong>(<\/a>)? [—–] /g, '</strong>$1: ', 'bold term + dash -> colon'],
  [/([a-z])—([A-Z])/g, '$1: $2', 'Term—Sentence -> Term: Sentence']
]

/* ------------------------------------------------------------------- helpers */
const read = (p) => fs.readFileSync(p, 'utf8')
const NAMED = { nbsp: ' ', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', ndash: '–', mdash: '—', quot: '"', apos: '’', eacute: 'é', copy: '©', reg: '®', trade: '™' }
function decode(s) {
  return s.replace(/&#(\d+);/g, (m, n) => keepEsc(String.fromCodePoint(+n)))
    .replace(/&#x([0-9a-f]+);/gi, (m, n) => keepEsc(String.fromCodePoint(parseInt(n, 16))))
    .replace(/&([a-z]+);/gi, (m, n) => (NAMED[n] !== undefined ? NAMED[n] : m))
}
const keepEsc = (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c)
const esc = (s) => String(s).replace(/&(?![a-z]+;|#\d+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const textOf = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const slugify = (s) => textOf(s).toLowerCase().replace(/&amp;/g, 'and').replace(/[’'“”"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '')
const words = (h) => textOf(h).split(' ').filter(Boolean).length
const jsonc = (o) => JSON.stringify(o).replace(/-->/g, '--\u003e')
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const isoDate = (d) => { const m = d.match(/([A-Za-z]+) (\d+), (\d{4})/); return m ? `${m[3]}-${String(MONTHS.indexOf(m[1]) + 1).padStart(2, '0')}-${m[2].padStart(2, '0')}` : '' }
function imgSize(name) {
  const b = fs.readFileSync(path.join(SRC, 'media/img', name))
  for (let i = 2; i < b.length;) {
    if (b[i] !== 0xff) { i++; continue }
    const m = b[i + 1], len = b.readUInt16BE(i + 2)
    if (m >= 0xc0 && m <= 0xc3) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) }
    i += 2 + len
  }
  throw new Error('no size for ' + name)
}
const img = (name, alt, extra = '') => { const s = imgSize(name); return `<img src="/media/img/${name}" alt="${esc(alt)}" width="${s.w}" height="${s.h}"${extra}>` }

/** WordPress body -> clean blocks (p, h2, h3, ul, ol, blockquote) */
function clean(html) {
  let h = decode(html).replace(/<!--[\s\S]*?-->/g, '')
  h = h.replace(/<(\/?)([a-z0-9]+)([^>]*)>/gi, (m, close, tag, attrs) => {
    tag = tag.toLowerCase()
    if (tag === 'b') tag = 'strong'
    if (tag === 'i') tag = 'em'
    if (tag === 'h4') tag = 'h3'
    if (['div', 'span', 'article', 'section', 'nav', 'figure', 'figcaption', 'img'].includes(tag)) return ''
    if (tag === 'hr') return ''
    if (tag === 'br') return '<br>'
    if (tag === 'a') {
      if (close) return '</a>'
      const href = (attrs.match(/href="([^"]*)"/) || [])[1] || ''
      return `<a href="${href}">`
    }
    if (!['p', 'h2', 'h3', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote'].includes(tag)) { problems.push('unknown tag ' + tag); return '' }
    return `<${close}${tag}>`
  })
  // close a paragraph left open before the next block, drop stray closers
  let out = '', inP = false
  for (const part of h.split(/(<\/?(?:p|h2|h3|ul|ol|blockquote)>)/)) {
    const t = part.match(/^<(\/?)(p|h2|h3|ul|ol|blockquote)>$/)
    if (!t) { out += part; continue }
    if (t[2] === 'p' && !t[1]) { if (inP) out += '</p>'; inP = true; out += part; continue }
    if (t[2] === 'p' && t[1]) { if (inP) { out += part; inP = false } continue }
    if (inP) { out += '</p>'; inP = false }
    out += part
  }
  if (inP) out += '</p>'
  h = out
    .replace(/<li>\s*<p>/g, '<li>').replace(/<\/p>\s*<\/li>/g, '</li>')
    .replace(/<(h2|h3)>([\s\S]*?)<\/\1>/g, (m, t, inner) => {
      inner = inner.replace(/<br>/g, ' ').replace(/<\/?strong>/g, '')
      if (t === 'h2') inner = inner.replace(/<\/?a[^>]*>/g, '')
      return `<${t}>${inner.replace(/\s+/g, ' ').trim()}</${t}>`
    })
    .replace(/<strong>\s*<\/strong>/g, '')
    .replace(/<p>(\s|<br>|\u00a0)*<\/p>/g, '')
    .replace(/<p>(\s|<br>)+/g, '<p>').replace(/(\s|<br>)+<\/p>/g, '</p>')
    .replace(/<li>\s+/g, '<li>').replace(/\s+<\/li>/g, '</li>')
    .replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\u00a0/g, ' ')
  // links: the old domain becomes root-relative; known WordPress redirects resolved; outside links open apart
  h = h.replace(/<a href="([^"]*)">/g, (m, href) => {
    let u = href.replace(/^https?:\/\/(www\.)?ifadentistry\.com/, '')
    if (u === '') u = '/'
    if (u === '/contact/') u = '/contact-us/'
    if (u === '/about/') u = '/about-our-practice/'
    if (/^https?:/.test(u)) return `<a href="${u}" target="_blank" rel="noopener">`
    return `<a href="${u}">`
  })
  const blocks = h.match(/<(p|h2|h3|ul|ol|blockquote)>[\s\S]*?<\/\1>/g) || []
  const rest = h.replace(/<(p|h2|h3|ul|ol|blockquote)>[\s\S]*?<\/\1>/g, '').replace(/<\/?(strong|em|a)[^>]*>/g, '').trim()
  if (rest) problems.push('text outside blocks: ' + rest.slice(0, 80))
  return blocks.map((b) => b.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').replace(/<(ul|ol)> /g, '<$1>').replace(/ <\/(ul|ol)>/g, '</$1>').replace(/<\/li> <li>/g, '</li><li>'))
}

/* --------------------------------------------------------------- read the posts */
const posts = []
for (const slug of Object.keys(POSTS)) {
  const cfg = POSTS[slug]
  const raw = read(path.join(RAW, slug, 'index.html'))
  const h1 = decode((raw.match(/<h1[^>]*single-post-section-hero__title[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '').trim()
  const date = ((raw.match(/single-post-section-hero__date[^>]*>([^<]*)</) || [])[1] || '').trim()
  const author = ((raw.match(/single-post-section-hero__author[^>]*>by ([^<]*)</) || [])[1] || '').trim()
  const cat = (raw.match(/class="item" href="https:\/\/www\.ifadentistry\.com\/category\/([^/]+)\/"/) || [])[1]
  const body = (raw.match(/class="brxe-post-content single-post-section__content">([\s\S]*?)<\/div><div id="[^"]+" class="brxe-divider/) || [])[1]
  if (!h1 || !body || !cat) { problems.push(`${slug}: could not read h1/body/category from raw-html`); continue }
  if (!CATS[cat]) problems.push(`${slug}: unknown category ${cat}`)
  let blocks = clean(body)
  const tell = (what, before, after) => log(`EDIT ${slug}: ${what}\n   - ${textOf(before).slice(0, 220)}\n   + ${textOf(after).slice(0, 220)}`)

  if (cfg.cutFrom) {
    const i = blocks.findIndex((b) => b.includes(cfg.cutFrom))
    if (i < 0) problems.push(`${slug}: cutFrom not found: ${cfg.cutFrom}`)
    else { for (const b of blocks.slice(i)) tell('removed closing call to action', b, ''); blocks = blocks.slice(0, i) }
  }
  for (const d of cfg.drop || []) {
    const n = blocks.filter((b) => b.includes(d)).length
    if (n !== 1) problems.push(`${slug}: drop matched ${n} blocks: ${d}`)
    blocks = blocks.filter((b) => { if (b.includes(d)) { tell('removed call to action', b, ''); return false } return true })
  }
  let html = blocks.join('\n')
  for (const [from, to] of cfg.edits || []) {
    const n = html.split(from).length - 1
    if (n !== 1) { problems.push(`${slug}: edit matched ${n} times: ${from}`); continue }
    html = html.replace(from, to)
    tell('dash/typo', from, to)
  }
  for (const [re, to, what] of [...(cfg.rules || []), ...DASH_RULES]) {
    html = html.replace(re, (...m) => { const out = to.replace(/\$(\d)/g, (x, k) => m[+k] || ''); tell(what, m[0], out); return out })
  }
  if (/—/.test(html) || / – /.test(html)) problems.push(`${slug}: a dash survived: ${html.match(/.{0,60}(—| – ).{0,40}/)[0]}`)
  for (const q of cfg.quote || []) {
    const before = html
    html = html.replace(new RegExp(`<p>(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?)</p>`), '<blockquote><p>$1</p></blockquote>')
    if (before === html) problems.push(`${slug}: quote not found: ${q}`)
  }
  // ids on the headings the aside lists (h2; h3 when a post has no h2)
  const level = /<h2>/.test(html) ? 'h2' : 'h3'
  const toc = [], seen = new Set()
  html = html.replace(new RegExp(`<${level}>([\\s\\S]*?)</${level}>`, 'g'), (m, inner) => {
    let id = slugify(inner) || 'section', k = 2
    while (seen.has(id)) id = slugify(inner) + '-' + k++
    seen.add(id)
    toc.push({ id, text: textOf(inner) })
    return `<${level} id="${id}">${inner}</${level}>`
  })
  const title = cfg.h1 || h1
  if (cfg.h1) log(`EDIT ${slug}: title dash\n   - ${h1}\n   + ${cfg.h1}`)
  if (/—/.test(title)) problems.push(`${slug}: dash in h1`)
  posts.push({ slug, ...cfg, h1: title, date, iso: isoDate(date), author, cat, html, toc, minutes: Math.max(1, Math.ceil(words(html) / 200)), words: words(html) })
}
posts.sort((a, b) => b.iso.localeCompare(a.iso))
const bySlug = Object.fromEntries(posts.map((p) => [p.slug, p]))

/* ----------------------------------------------------------------- page parts */
function head(title, description, label) {
  const t = title + SUFFIX
  if (t.length < 50 || t.length > 60) problems.push(`title ${t.length} chars: ${t}`)
  if (description.length < 140 || description.length > 160) problems.push(`description ${description.length} chars: ${description}`)
  if (/—/.test(t + description)) problems.push(`dash in head: ${t}`)
  return `<!--@page ${JSON.stringify({ title: t, description, label })}-->\n`
}
const crumbs = (items) => `<ol class="breadcrumb_component" aria-label="Breadcrumb">\n${items.map(([t, href]) => href ? `        <li><a href="${href}">${t}</a></li>` : `        <li><span aria-current="page">${t}</span></li>`).join('\n')}\n      </ol>`
const dek = (p) => { const m = p.description.match(/^.*?[.?!](?=\s|$)/); return m && m[0].length >= 40 ? m[0] : p.description }
function tile(p, h = 'h3') {
  return `      <a class="tile_card" href="/${p.slug}/">
        <div class="tile_image">${img(p.img, '', ' loading="lazy"')}</div>
        <p class="text-style-label is-tile-card">${esc(CATS[p.cat].short)} · ${p.minutes} min read</p>
        <${h} class="tile_title">${esc(p.label.charAt(0).toUpperCase() + p.label.slice(1))}</${h}>
        <span class="tile_description">${esc(dek(p))}</span>
      </a>`
}
function chipbar(active) {
  const cats = CAT_ORDER.filter((c) => posts.some((p) => p.cat === c) || c === active)
  const a = (href, label, on) => `<a href="${href}"${on ? ' aria-current="page"' : ''}>${esc(label)}</a>`
  return `<nav class="filter_bar" aria-label="Article categories">
      ${a('/about-our-practice/articles/', 'All articles', !active)}
      ${cats.map((c) => a(`/category/${c}/`, CATS[c].name, c === active)).join('\n      ')}
    </nav>`
}
const invite = (chapter, tagline, extra = {}) => `<!--@invite ${jsonc({ chapter: String(chapter), tagline, ...extra })}-->\n`

function postAside(toc, label) {
  return `<aside class="post_aside" aria-label="${esc(label)}">
      <p class="text-style-label is-post-aside">${esc(label)}</p>
      <div class="post_progress" aria-hidden="true"><i></i></div>
      <ol class="post_contents">
${toc.map((t) => `        <li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('\n')}
      </ol>
      <a class="button is-primary" href="#invitation" data-magnetic><span>Book a consultation</span>${ARROW}</a>
    </aside>`
}

/* --------------------------------------------------------------------- articles */
const written = []
const write = (rel, s) => { const f = path.join(PAGES, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); written.push(rel) }

for (const p of posts) {
  const c = CATS[p.cat]
  const same = posts.filter((q) => q.cat === p.cat && q.slug !== p.slug)
  same.sort((a, b) => Math.abs(new Date(a.iso) - new Date(p.iso)) - Math.abs(new Date(b.iso) - new Date(p.iso)))
  const related = [...same, ...posts.filter((q) => q.cat !== p.cat && q.slug !== p.slug)].slice(0, 3)
  const page = head(p.title, p.description, p.label) + `
<!-- ARRIVAL -->
<section class="section_chapter section_hero is-plain" id="top" data-chapter="0" data-chapter-name="The Article" data-theme="light" data-intro>
  <div class="hero_layout">
    <div class="hero_copy">
      ${crumbs([['Home', '/'], ['Articles', '/about-our-practice/articles/'], [esc(p.label.charAt(0).toUpperCase() + p.label.slice(1))]])}
      <p class="tag"><span>${esc(c.name)}</span><em>An article by Dr.&nbsp;Bensoussan</em></p>
      <h1 class="heading-style-h1 is-hero is-plain-hero">${esc(p.h1)}</h1>
      <p class="hero_details is-article-details" data-rise><span>Filed under <a href="/category/${p.cat}/"><b>${esc(c.name)}</b></a></span><span>${p.minutes} min read</span><span><time datetime="${p.iso}">${p.date}</time></span><span>By ${esc(p.author)}</span></p>
    </div>
  </div>
</section>

<!-- THE ARTICLE -->
<section class="section_chapter background-color-white padding-section-large" data-chapter="1" data-chapter-name="The Article" data-theme="light">
  <div class="container-large post_layout is-article">
    ${postAside(p.toc, 'In this article')}
    <article>
      <div class="post_lead-image">${img(p.img, p.alt)}</div>
      <div class="text-rich-text">
${p.html.split('\n').map((b) => '        ' + b).join('\n')}
      </div>
    </article>
  </div>
</section>

<!-- KEEP READING -->
<section class="section_chapter background-color-sand padding-section-large" data-chapter="2" data-chapter-name="Keep Reading" data-theme="light">
  <div class="container-large">
    <header class="chapter_header">
      <div class="chapter_intro">
        <p class="tag" data-tag><span>Keep Reading</span><em>${esc(c.name)}</em></p>
        <h2 class="heading-style-h2" data-split="lines">More from the <em>journal</em>.</h2>
      </div>
      <a class="arrow-link_component" href="/about-our-practice/articles/">All articles${ARROW}</a>
    </header>
    <div class="tile_grid">
${related.map((q) => tile(q)).join('\n')}
    </div>
  </div>
</section>

<!-- THE INVITATION -->
${invite(3, p.tagline)}`
  write(`${p.slug}.html`, page)
}

/* ----------------------------------------------------------------- the index */
{
  const [lead] = posts
  const page = head('Dental Articles & Guides', 'Articles by Dr. Jonathan Bensoussan on dental implants, prosthodontics, cosmetic dentistry and oral health, from the practice in Peoria, Arizona.', 'Articles') + `
<!-- ARRIVAL -->
<section class="section_chapter section_hero is-index" id="top" data-chapter="0" data-chapter-name="Articles" data-theme="light" data-intro>
  <div class="hero_layout">
    <div class="hero_copy">
      ${crumbs([['Home', '/'], ['About', '/about-our-practice/'], ['Articles']])}
      <p class="tag"><span>Articles</span><em>Written by Dr.&nbsp;Jonathan Bensoussan</em></p>
      <h1 class="heading-style-h1 is-hero">Articles on implants, prosthodontics and <em>your smile</em>.</h1>
    </div>
    <div class="hero_photo-strip">
      <figure>${img('jr-index-1.jpg', 'Dr. Bensoussan and a patient in front of her new smile on the screen')}</figure>
      <figure>${img('jr-index-2.jpg', 'A patient looking at her smile in a hand mirror beside Dr. Bensoussan')}</figure>
      <figure>${img('jr-index-3.jpg', 'Dr. Bensoussan walking a patient through her 3D scans')}</figure>
    </div>
    <div class="hero_footer">
      <p class="text-style-lede hero_intro" data-rise>Explore our collection of insightful dental articles, providing expert knowledge on advanced prosthodontics, comprehensive treatments, and maintaining your oral health. Stay informed and empowered on your journey to a healthy, confident smile.</p>
      <div class="hero_buttons" data-rise>
        <a class="button is-primary" href="#invitation" data-magnetic><span>Book a consultation</span>${ARROW}</a>
        <a class="button is-secondary" href="#all-articles" data-magnetic><span>See articles</span></a>
      </div>
    </div>
  </div>
</section>

<!-- THE LATEST -->
<section class="section_chapter background-color-white padding-section-large" data-chapter="1" data-chapter-name="The Latest" data-theme="light">
  <div class="container-large">
    <header class="chapter_header">
      <div class="chapter_intro">
        <p class="tag" data-tag><span>The Latest</span><em><time datetime="${lead.iso}">${lead.date}</time></em></p>
        <h2 class="heading-style-h2" data-split="lines">New in the <em>journal</em>.</h2>
      </div>
    </header>
    <div class="row_list is-latest">
      <div class="row_item">
        <figure class="row_figure" data-wipe>${img(lead.img, lead.alt, ' loading="lazy" data-parallax="8"')}</figure>
        <div class="row_body">
          <p class="text-style-label is-row-body">${esc(CATS[lead.cat].name)} · ${lead.minutes} min read</p>
          <h3 class="heading-style-h3"><a href="/${lead.slug}/">${esc(lead.h1)}</a></h3>
          <p>${esc(lead.description)}</p>
          <a class="arrow-link_component" href="/${lead.slug}/">Read the article${ARROW}</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ALL ARTICLES -->
<section class="section_chapter background-color-sand padding-section-large" id="all-articles" data-chapter="2" data-chapter-name="All Articles" data-theme="light">
  <div class="container-large">
    <header class="chapter_header">
      <div class="chapter_intro">
        <p class="tag" data-tag><span>All Articles</span><em>${posts.length} articles</em></p>
        <h2 class="heading-style-h2" data-split="lines">Read by <em>topic</em>.</h2>
      </div>
    </header>
    ${chipbar(null)}
    <div class="tile_grid is-four-columns">
${posts.map((q) => tile(q)).join('\n')}
    </div>
  </div>
</section>

<!-- THE INVITATION -->
${invite(3, 'Questions after reading?')}`
  write('about-our-practice/articles.html', page)
}

/* ------------------------------------------------------------- the categories */
for (const c of CAT_ORDER) {
  const cat = CATS[c]
  const list = posts.filter((p) => p.cat === c)
  const body = list.length
    ? `${chipbar(c)}
    <div class="tile_grid">
${list.map((q) => tile(q, 'h2')).join('\n')}
    </div>`
    : `${chipbar(c)}
    <div class="notice_component">
      <div>
        <p class="text-style-label is-notice">${esc(cat.name)}</p>
        <p class="heading-style-h4">No articles are filed under ${esc(cat.name.toLowerCase())} yet.</p>
        <p>These articles cover the same ground.</p>
      </div>
    </div>
    <div class="tile_grid is-after-notice">
${cat.empty.map((s) => tile(bySlug[s], 'h2')).join('\n')}
    </div>`
  const page = head(cat.title, cat.description, cat.name) + `
<!-- ARRIVAL -->
<section class="section_chapter section_hero is-plain" id="top" data-chapter="0" data-chapter-name="${esc(cat.name)}" data-theme="light" data-intro>
  <div class="hero_layout">
    <div class="hero_copy">
      ${crumbs([['Home', '/'], ['Articles', '/about-our-practice/articles/'], [esc(cat.name)]])}
      <p class="tag"><span>Articles</span><em>Category</em></p>
      <h1 class="heading-style-h1 is-hero is-plain-hero">${cat.h1}</h1>
      <p class="hero_details is-article-details" data-rise><span><b>${list.length}</b> ${list.length === 1 ? 'article' : 'articles'}</span><span>By Dr. Jonathan Bensoussan</span></p>
    </div>
  </div>
</section>

<!-- THE ARTICLES -->
<section class="section_chapter background-color-white padding-section-large" data-chapter="1" data-chapter-name="The Articles" data-theme="light">
  <div class="container-large">
    ${body}
  </div>
</section>

<!-- THE INVITATION -->
${invite(2, 'Questions after reading?')}`
  write(`category/${c}.html`, page)
}

/* ---------------------------------------------------------------- legal pages */
const RSQUO = '’', LDQUO = '“', RDQUO = '”'
const typo = (s) => { let open = true; return s.replace(/'/g, RSQUO).replace(/"/g, () => ((open = !open) ? RDQUO : LDQUO)) }
function inlineMd(s) {
  s = esc(typo(s))
  return s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, href) => `<a href="${href.replace(/[’“”]/g, '')}">${t}</a>`).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}
/** The A2P Markdown, read the way push-legal.mjs reads it: blank lines split blocks, `## `/`### ` headings, `- ` items. */
function legalMd(md) {
  const out = [], toc = [], ids = new Set()
  let effective = '', para = [], list = null
  const flushP = () => { if (para.length) out.push(`<p>${para.map(inlineMd).join('<br>')}</p>`); para = [] }
  const flushL = () => { if (list) out.push(`<ul>${list.map((l) => `<li>${inlineMd(l)}</li>`).join('')}</ul>`); list = null }
  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trim().replace(/ {2,}/g, ' ')
    if (!line) { flushP(); flushL(); continue }
    if (/^Effective date:/.test(line) && !effective) { effective = line.replace(/^Effective date:\s*/, ''); continue }
    if (line.startsWith('- ')) { flushP(); (list = list || []).push(line.slice(2)); continue }
    flushL()
    const hm = line.match(/^(#{2,3}) (.*)$/)
    if (hm) {
      flushP()
      const t = hm[1].length === 2 ? 'h2' : 'h3'
      if (t === 'h2') { let id = slugify(hm[2]); while (ids.has(id)) id += '-x'; ids.add(id); toc.push({ id, text: hm[2] }); out.push(`<h2 id="${id}">${inlineMd(hm[2])}</h2>`) } else out.push(`<h3>${inlineMd(hm[2])}</h3>`)
      continue
    }
    para.push(line)
  }
  flushP(); flushL()
  if (/—/.test(out.join(''))) problems.push('em dash in legal text')
  return { html: out.join('\n'), toc, effective }
}

/* The accessibility statement as published on https://www.ifadentistry.com/accessibility-statement/ (read 2026-10-01).
   The menu it describes is the Sienna accessibility widget the live site loads; the text is verbatim. */
const A11Y = `Institute for Advanced Dentistry is committed to providing a website that is accessible to individuals with disabilities. We are actively working to increase the accessibility and usability of our website in accordance with accessibility best practices and guidelines, and with the assistance of the accessibility menu available on every page of this site.

Additionally, we’ve included some resources below to help improve your browsing experience on our site. We welcome your feedback.

## Visual Assistance

If you are having difficulty viewing pages on our site, the following tips may be helpful:

- Use your computer’s text-to-speech feature to read web pages aloud
- Use keyboard navigation to move through pages
- Adjust text size to improve readability
- Magnify your screen
- Customize background and text colors for better visibility
- Increase the size or visibility of your mouse pointer (Windows users)

## Closed Captioning for Audio Accessibility

For those who are hard of hearing or deaf, closed captioning provides a helpful solution. This feature displays spoken words on the screen, making it easier to follow along with video content, even in noisy environments.

## Volume Controls for Audio Accessibility

Adjusting volume controls can also improve your experience. Check for volume controls on your device (phone, tablet, computer) as well as within the video or audio service you are using.

## Alternative Keyboard and Mouse Options

If you’re unable to use a keyboard or mouse, consider using speech recognition software. This type of program allows you to navigate online through our website using voice commands rather than using a mouse and keyboard.

## Contact Us

If you are experiencing any accessibility barriers or otherwise are having difficulty using our website due to your disability, please [contact us](/contact-us/) and we will be happy to assist.`

const LEGAL_PAGES = [
  { rel: 'privacy-policy.html', md: () => read(path.join(LEGAL, 'privacy-policy.md')), h1: 'Privacy <em>Policy</em>', crumb: 'Privacy policy', label: 'Privacy policy', title: 'Website Privacy Policy', description: 'How Institute for Advanced Dentistry PLLC collects, uses and protects information shared through ifadentistry.com and its SMS program, and your choices.', tagline: 'Questions about your privacy?' },
  { rel: 'terms-of-service.html', md: () => read(path.join(LEGAL, 'terms-of-service.md')), h1: 'Terms of <em>Service</em>', crumb: 'Terms of service', label: 'Terms of service', title: 'Terms of Service', description: 'The terms that govern use of ifadentistry.com, the text messaging program and related online services of Institute for Advanced Dentistry PLLC in Peoria, AZ.', tagline: 'Questions about these terms?' },
  { rel: 'accessibility-statement.html', md: () => A11Y, h1: 'Accessibility <em>Statement</em>', crumb: 'Accessibility statement', label: 'Accessibility statement', title: 'Accessibility Statement', description: 'Institute for Advanced Dentistry is committed to a website that is accessible to people with disabilities. Tips for easier browsing and how to reach us.', tagline: 'Need help using the site?' }
]
for (const L of LEGAL_PAGES) {
  const { html, toc, effective } = legalMd(L.md())
  const page = head(L.title, L.description, L.label) + `
<!-- ARRIVAL -->
<section class="section_chapter section_hero is-plain" id="top" data-chapter="0" data-chapter-name="${esc(L.label)}" data-theme="light" data-intro>
  <div class="hero_layout">
    <div class="hero_copy">
      ${crumbs([['Home', '/'], [L.crumb]])}
      <p class="tag"><span>Legal</span><em>Institute for Advanced Dentistry PLLC</em></p>
      <h1 class="heading-style-h1 is-hero is-plain-hero">${L.h1}</h1>
      ${effective ? `<p class="hero_details is-article-details" data-rise><span>Effective date <b>${esc(effective)}</b></span><span>Peoria, Arizona</span></p>` : `<p class="hero_details is-article-details" data-rise><span>Institute for Advanced Dentistry</span><span>Peoria, Arizona</span></p>`}
    </div>
  </div>
</section>

<!-- THE TEXT -->
<section class="section_chapter background-color-white padding-section-large" data-chapter="1" data-chapter-name="${esc(L.label)}" data-theme="light">
  <div class="container-large post_layout is-article is-legal">
    ${postAside(toc, 'On this page')}
    <article>
      <div class="text-rich-text">
${html.split('\n').map((b) => '        ' + b).join('\n')}
      </div>
    </article>
  </div>
</section>

<!-- THE INVITATION -->
${invite(2, L.tagline)}`
  write(L.rel, page)
}

/* ----------------------------------------------------------------------- 404 */
{
  const links = [
    ['Dental services', '/dental-services/', 'Every treatment the practice offers.'],
    ['Dental implants', '/dental-services/dental-implants/', 'One tooth to a full arch, by one specialist.'],
    ['New teeth in one day', '/dental-services/new-teeth-in-one-day/', 'A full arch of fixed teeth in a single visit.'],
    ['Smile gallery', '/smile-gallery/', 'Real results from real patients.'],
    ['Meet Dr. Bensoussan', '/about-our-practice/meet-dr-bensoussan/', 'The surgically trained prosthodontist.'],
    ['Articles', '/about-our-practice/articles/', 'Guides on implants and prosthodontics.'],
    ['Contact us', '/contact-us/', '13360 N 94th Dr, Suite B, Peoria.']
  ]
  const page = head('Page Not Found (404)', 'The page you asked for is not at this address. Find dental implants, services, the smile gallery and articles from Institute for Advanced Dentistry in Peoria.', 'Page not found') + `
<!-- ARRIVAL -->
<section class="section_chapter section_hero is-plain" id="top" data-chapter="0" data-chapter-name="Page Not Found" data-theme="light" data-intro>
  <div class="hero_layout">
    <div class="hero_copy">
      ${crumbs([['Home', '/'], ['Page not found']])}
      <p class="tag"><span>Error 404</span><em>Page not found</em></p>
      <h1 class="heading-style-h1 is-hero is-plain-hero">This page is not <em>here</em>.</h1>
      <p class="text-style-lede hero_intro" data-rise>The address may have changed when the site was rebuilt. Every page below is a good place to pick up from, or call us at <a class="not-found_phone-link" href="{{site.tel}}">{{site.phone}}</a>.</p>
    </div>
  </div>
</section>

<!-- WAYS IN -->
<section class="section_chapter background-color-white padding-section-large" data-chapter="1" data-chapter-name="Ways In" data-theme="light">
  <div class="container-large">
    <header class="chapter_header">
      <div class="chapter_intro">
        <p class="tag" data-tag><span>Ways In</span><em>The main sections</em></p>
        <h2 class="heading-style-h2" data-split="lines">Where would you like <em>to go</em>?</h2>
      </div>
    </header>
    <ul class="not-found_links">
${links.map(([t, href, d]) => `      <li><a href="${href}"><span class="not-found_link-title">${t}</span><span class="not-found_link-description">${d}</span>${ARROW}</a></li>`).join('\n')}
    </ul>
  </div>
</section>

<!-- THE INVITATION -->
${invite(2, 'Now accepting new patients')}`
  write('404.html', page)
}

/* ----------------------------------------------------------------------- done */
log('\nMAPPING')
for (const c of CAT_ORDER) log(`  /category/${c}/ (${CATS[c].name}): ${posts.filter((p) => p.cat === c).map((p) => p.slug).join(', ') || '(no posts)'}`)
log('\nPOSTS')
for (const p of posts) log(`  /${p.slug}/  ${p.date}  ${p.words} words, ${p.minutes} min, ${p.toc.length} toc  ${p.img}`)
log(`\n${written.length} pages written`)
if (problems.length) { console.error(`\n${problems.length} PROBLEM(S):\n  ` + problems.join('\n  ')); process.exit(1) }
log('ok')
