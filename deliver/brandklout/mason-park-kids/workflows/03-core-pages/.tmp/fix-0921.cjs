// ===========================================================================
// BugHerd round two (#29-#40), applied to home/ AND to the generators that
// would otherwise write the old text back.
//
//   node fix-0921.cjs --dry
//   node fix-0921.cjs
//
// WHAT IT CHANGES
//   #29 / #40  The Google Maps embed pointed at "Mason Park Dental - Katy
//              Dentist" (the ADULT practice, suite 104A). Repointed at the
//              pediatric listing, ftid 0x8641277706112ec1:0x98941d027afdec7b,
//              suite 104B, category "Pediatric dentist". Both share.google
//              links in the notes resolve to that same listing (kgmid
//              /g/11sff9c67k); confirmed in Maps, see verify-place.log.
//   #30 / #39  Hours are Mon-Thu 9am-6pm, closed Fri-Sun. They were wrong in
//              five shapes: the invitation <dl>, the footer list, the /contacts
//              table, the /contacts "Call" card and the home page's JSON-LD.
//   #36        The address on the /contacts "Come in" card now links to
//              turn-by-turn directions.
//   #37        The "Note" column comes off the /contacts hours table.
//   #31        The first comfort card says what the practice asked for.
//   #35        The /contacts lede, rephrased.
//   (no note)  "(281) 578 to 7100" on 18 pages: an "-" to " to " sweep caught
//              the phone number. Restored.
//
// The CSS fixes (#33 sticker ink, #38 the line on the button) are in site.css.
// ===========================================================================
const fs = require('fs');
const path = require('path');

const HERE = __dirname;
const SITE = path.join(HERE, '..', 'home');
const DRY = process.argv.includes('--dry');

const PLACE =
  'https://www.google.com/maps/place/Mason+Park+Dental+for+Kids+-+Pediatric+Dentist+Katy+TX/' +
  '@29.7759444,-95.7490312,17z/data=!4m6!3m5!1s0x8641277706112ec1:0x98941d027afdec7b' +
  '!8m2!3d29.7759444!4d-95.7490312!16s%2Fg%2F11sff9c67k';
const DIR =
  'https://www.google.com/maps/dir/?api=1&amp;destination=' +
  encodeURIComponent('Mason Park Dental for Kids - Pediatric Dentist Katy TX, 21830 Kingsland Blvd #104B, Katy, TX 77450');
const EMBED =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.7490312!3d29.7759444' +
  '!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8641277706112ec1%3A0x98941d027afdec7b' +
  '!2sMason%20Park%20Dental%20for%20Kids%20-%20Pediatric%20Dentist%20Katy%20TX!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus';

const OLD_EMBED_RE =
  /https:\/\/www\.google\.com\/maps\/embed\?pb=[^"']*?0x86412740e7dd5def[^"']*/g;
const OLD_PLACE_BARE = 'https://www.google.com/maps/place/21830+Kingsland+Blvd,+Katy,+TX+77450';
const OLD_PLACE_104A_RE =
  /https:\/\/www\.google\.com\/maps\/place\/21830\+Kingsland\+Blvd\+%23104a[^"']*/gi;

// ---------------------------------------------------------------- edits ----
/** Each edit: [label, find, replace]. `find` is a string (all occurrences) or a RegExp. */
const EDITS = [
  // --- #29 / #40 the map -------------------------------------------------
  ['#29/#40 map embed', OLD_EMBED_RE, EMBED],
  // "Get directions" wants navigation; the address wants the listing.
  ['#29/#40 get-directions link',
    new RegExp(`(<a class="link-arrow is-light" href=")${OLD_PLACE_BARE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(")`, 'g'),
    `$1${DIR}$2`],
  ['#29/#40 address link', OLD_PLACE_BARE, PLACE],
  ['#29/#40 adult-suite link', OLD_PLACE_104A_RE, PLACE],

  // --- #30 / #39 the hours ------------------------------------------------
  ['#30/#39 invitation hours',
    '<dd>Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b></dd>',
    '<dd>Mon to Thu <b>9am to 6pm</b><br>Fri to Sun <b>Closed</b></dd>'],
  ['#30/#39 footer hours',
    '<li><span>Monday</span><strong>9am - 6pm</strong></li><li><span>Tuesday</span><strong>8am - 5pm</strong></li><li><span>Wednesday</span><strong>9am - 6pm</strong></li><li><span>Thursday</span><strong>8am - 5pm</strong></li>',
    '<li><span>Monday</span><strong>9am - 6pm</strong></li><li><span>Tuesday</span><strong>9am - 6pm</strong></li><li><span>Wednesday</span><strong>9am - 6pm</strong></li><li><span>Thursday</span><strong>9am - 6pm</strong></li>'],
  ['#30/#39 JSON-LD hours',
    '"openingHoursSpecification":[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Wednesday"],"opens":"09:00","closes":"18:00"},{"@type":"OpeningHoursSpecification","dayOfWeek":["Tuesday","Thursday"],"opens":"08:00","closes":"17:00"}]',
    '"openingHoursSpecification":[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday"],"opens":"09:00","closes":"18:00"}]'],

  ['#30/#39 topline hours',
    '<span class="topline_note">Mon &amp; Wed 9-6 &middot; Tue &amp; Thu 8-5 &middot; Fri to Sun closed</span>',
    '<span class="topline_note">Mon to Thu 9-6 &middot; Fri to Sun closed</span>'],

  // --- not in a note, found while sweeping ---------------------------------
  // Five blog posts carry a block of raw schema markup that the WP export left
  // in the post body: once in <head> as an ld+json script that is not valid
  // JSON (it has </p><p> inside it), once in the body as visible text. It names
  // the ADULT practice, and its phone number is the mangled one below. Both
  // copies go; the SEO plugins write the real JSON-LD at publish.
  ['stray WP schema block',
    /\s*<script type="application\/ld\+json">[\s\S]{0,2000}?"telePhone": "281 to 578 to 7100"[\s\S]*?<\/script>(<\/p>)?/g,
    ''],
  // On two posts the same markup arrived one <p> per line, so it is on the page
  // as visible text. The lines go, then any chapter left with nothing in it.
  ['stray WP schema paragraphs',
    /^[ \t]*<p>(\{|\}|\},|"(@context|@type|name|address|streetAddress|addressLocality|addressRegion|postalCode|telePhone|url|geo|latitude|longitude|priceRange)"\s*:.*?)<\/p>\r?\n/gm,
    ''],
  ['empty chapter left behind',
    /\s*<section class="lf-section"[^>]*>\s*<\/section>/g,
    ''],
  // An "-" to " to " sweep caught the phone number itself.
  ['phone "281 to 578 to 7100"', '281 to 578 to 7100', '281-578-7100'],
  ['phone "578 to 7100"', '578 to 7100', '578-7100'],
];

// /contacts only ------------------------------------------------------------
const CONTACTS_EDITS = [
  // #39 the "Call" card
  ['#39 call card hours',
    '. Monday and Wednesday 9am to 6pm, Tuesday and Thursday 8am to 5pm. If your child is in pain today, call rather than book online.',
    '. Monday to Thursday, 9am to 6pm. If your child is in pain today, call rather than book online.'],
  // #36 the address, linked to navigation
  ['#36 address navigation',
    '<div class="sq-card"><h3>Come in</h3><p>21830 Kingsland Blvd #104B, Katy, TX 77450. Free parking at the door, and the suite is on the ground floor.</p></div>',
    `<div class="sq-card"><h3>Come in</h3><p><a href="${DIR}" target="_blank" rel="noopener">21830 Kingsland Blvd #104B, Katy, TX 77450</a>. Free parking at the door, and the suite is on the ground floor.</p>` +
    `<a class="link-arrow" href="${DIR}" target="_blank" rel="noopener">Get directions <span aria-hidden="true">&rarr;</span></a></div>`],
  // #37 the Note column off the hours table, #30/#39 the hours in it
  ['#37 table head',
    '<thead><tr><th scope="col">Day</th><th scope="col">Open</th><th scope="col">Note</th></tr></thead>',
    '<thead><tr><th scope="col">Day</th><th scope="col">Open</th></tr></thead>'],
  ['#37/#39 table body',
    /<tbody>\s*<tr><td>Monday<\/td>[\s\S]*?<\/tbody>/,
    ['<tbody>',
      '        <tr><td>Monday</td><td data-label="Open">9am to 6pm</td></tr>',
      '        <tr><td>Tuesday</td><td data-label="Open">9am to 6pm</td></tr>',
      '        <tr><td>Wednesday</td><td data-label="Open">9am to 6pm</td></tr>',
      '        <tr><td>Thursday</td><td data-label="Open">9am to 6pm</td></tr>',
      '        <tr><td>Friday</td><td data-label="Open">Closed</td></tr>',
      '        <tr><td>Saturday</td><td data-label="Open">Closed</td></tr>',
      '        <tr><td>Sunday</td><td data-label="Open">Closed</td></tr>',
      '      </tbody>'].join('\n')],
  // #35 the lede
  ['#35 lede',
    'Free parking at the door, and the practice is on the ground floor. Call, email, or book a time online, whichever suits.',
    'Free parking at the door, and the suite is on the ground floor. Call us, email us, or request a time online, whichever is easiest.'],
];

// home only -----------------------------------------------------------------
const HOME_EDITS = [
  ['#31 comfort card',
    'Parents are always welcome to accompany their child if it helps them feel more comfortable. Nobody is sent to the waiting room.',
    'Parents are always welcome to accompany their child during the first visit and at checkups. Nobody is sent to the waiting room.'],
];

// the generators, so a rebuild does not undo any of this ---------------------
const GEN_EDITS = [
  ['#29/#40 map embed', OLD_EMBED_RE, EMBED],
  ['#29/#40 get-directions link',
    new RegExp(`(<a class="link-arrow is-light" href=")${OLD_PLACE_BARE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(")`, 'g'),
    `$1${DIR}$2`],
  ['#29/#40 address link', OLD_PLACE_BARE, PLACE],
  ['#30/#39 invitation hours',
    '<dd>Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b></dd>',
    '<dd>Mon to Thu <b>9am to 6pm</b><br>Fri to Sun <b>Closed</b></dd>'],
];

const RECIPE_EDITS = [
  ['#39 call card hours',
    "'<a href=\"tel:+12815787100\">(281) 578-7100</a>. Monday and Wednesday 9am to 6pm, Tuesday and Thursday 8am to 5pm. If your child is in pain today, call rather than book online.'",
    "'<a href=\"tel:+12815787100\">(281) 578-7100</a>. Monday to Thursday, 9am to 6pm. If your child is in pain today, call rather than book online.'"],
  ['#37/#39 hours table rows',
    /\['Monday', '9am to 6pm', 'The late day\. Good for after school\.'\],\s*\n\s*\['Tuesday', '8am to 5pm', 'The early day\.'\],\s*\n\s*\['Wednesday', '9am to 6pm', 'The late day\.'\],\s*\n\s*\['Thursday', '8am to 5pm', 'The early day\.'\],/,
    ["['Monday', '9am to 6pm'],",
      "        ['Tuesday', '9am to 6pm'],",
      "        ['Wednesday', '9am to 6pm'],",
      "        ['Thursday', '9am to 6pm'],"].join('\n')],
];

// ---------------------------------------------------------------- apply ----
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : e.name === 'index.html' ? [path.join(dir, e.name)] : []
  );

const tally = new Map();
const bump = (label, n) => tally.set(label, (tally.get(label) || 0) + n);

function apply(file, edits) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  for (const [label, find, repl] of edits) {
    let n = 0;
    if (find instanceof RegExp) {
      const g = find.flags.includes('g') ? find : new RegExp(find.source, find.flags + 'g');
      n = (src.match(g) || []).length;
      if (n) src = src.replace(g, repl);
    } else {
      n = src.split(find).length - 1;
      if (n) src = src.split(find).join(repl);
    }
    if (n) bump(label, n);
  }
  if (src !== before && !DRY) fs.writeFileSync(file, src);
  return src !== before;
}

const pages = walk(SITE);
let touched = 0;
for (const f of pages) {
  const rel = path.relative(SITE, f).replace(/\\/g, '/');
  const edits = [...EDITS];
  if (rel === 'contacts/index.html') edits.push(...CONTACTS_EDITS);
  if (rel === 'index.html') edits.push(...HOME_EDITS);
  if (apply(f, edits)) touched++;
}

for (const g of ['build-pages.mjs', 'build-blog.mjs']) apply(path.join(HERE, g), GEN_EDITS);
apply(path.join(HERE, 'recipes', '30-practice.mjs'), RECIPE_EDITS);

console.log(DRY ? '--- DRY RUN ---' : '--- APPLIED ---');
for (const [label, n] of [...tally.entries()].sort()) console.log(String(n).padStart(6), label);
console.log(`\n${touched} of ${pages.length} pages ${DRY ? 'would change' : 'changed'}`);
