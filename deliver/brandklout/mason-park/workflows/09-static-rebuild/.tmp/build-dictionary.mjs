// ===========================================================================
// BUILD /dental-dictionary/ FROM THE SCRAPE.
//
// The old page is a clean A-Z glossary: a single-letter line opens each
// section, then one `term – definition` line per entry. That is data, so it is
// parsed rather than retyped -- ~330 lines of dental terminology is exactly
// the kind of content a person transcribing it introduces errors into.
//
// The separator is an EN DASH (U+2013), not a hyphen. Several definitions
// contain hyphens ("porcelain-fused-to-metal"), so splitting on "-" would cut
// half of them in the wrong place.
//
//   node build-dictionary.mjs
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "..", "..", "01-content-intake", ".tmp", "site-scrape",
  "pages", "dental-dictionary", "rendered.txt");

const raw = fs.readFileSync(SRC, "utf8");
const lines = raw.split("\n").map((s) => s.trim()).filter(Boolean);

// Everything before the intro sentence is site chrome; everything from the
// footer marker on is the theme's boilerplate.
const startAt = lines.findIndex((l) => l.startsWith("This is designed to provide"));
const endAt = lines.findIndex((l) => /^We are located at the corner/.test(l));
const body = lines.slice(startAt + 1, endAt > 0 ? endAt : undefined);

const letters = [];
let current = null;
for (const line of body) {
  if (/^[A-Z]$/.test(line)) {
    current = { letter: line, terms: [] };
    letters.push(current);
    continue;
  }
  const i = line.indexOf("–");            // en dash
  if (i < 0 || !current) continue;
  const term = line.slice(0, i).trim();
  const def = line.slice(i + 1).trim();
  if (term && def) current.terms.push({ term, def });
}

const total = letters.reduce((a, l) => a + l.terms.length, 0);
const esc = (s) => s.replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const jump = letters
  .map((l) => `<li><a class="bl-page" href="#letter-${l.letter}">${l.letter}</a></li>`)
  .join("");

const sections = letters.map((l) => `  <div class="wrap" id="letter-${l.letter}">
    <p class="svc-ledger-label">${l.letter}</p>
    <ul class="svc-ledger">
${l.terms.map((t) => `      <li><b>${esc(t.term)}</b><span>${esc(t.def)}</span></li>`).join("\n")}
    </ul>
  </div>`).join("\n");

const main = `<main class="main-wrapper" id="main">
<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">

  <div class="ar-bg" data-drift>
    {{img slug="team-reading-chart" sizes="100vw" eager}}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    <p class="chapter-tag"><i></i><b>Dental Dictionary</b></p>
    <h1 class="ar-title" data-split>Dental <em>Dictionary</em></h1>
    <p class="ar-lede" data-anim="hide">${total} terms you may hear during a dental visit, defined plainly. If a word came up in your appointment and you nodded, it is probably here.</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-lg" href="#terms">Jump to the terms</a>
      <a class="button is-ghost-light is-lg" href="tel:+12817698878">(281) 769-8878</a></div>
    <p class="el-cue" aria-hidden="true"><span>Scroll</span><i></i></p>
  </div>
</section>

<div class="padding-global"><div class="container-large">
  <nav class="breadcrumb_component" aria-label="Breadcrumb">
    <span class="breadcrumb_item"><a href="/">Home</a></span><span class="breadcrumb_item">Dental dictionary</span>
  </nav>
</div></div>

<section class="ch ch-treatment" id="terms" data-chapter="1" data-chapter-name="Terms">
  <div class="wrap svc-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>Terms</b></p>
      <h2 data-split>${total} words, ${letters.length} letters.</h2>
    </div>
    <p class="pe-lede">This is designed to provide some basic information regarding terms you may hear during your dental visit. For additional information on any of these topics, talk with your dental team.</p>
  </div>
  <div class="wrap">
    <nav class="bl-pager" aria-label="Jump to letter">
      <ul class="bl-pager_nums">${jump}</ul>
    </nav>
  </div>
${sections}
</section>

<section class="ch ch-invitation" id="invitation" data-chapter="2" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      <p class="chapter-tag"><i></i><b>The Invitation</b></p>
      <h2 data-split>Ask, rather than nod.</h2>
      <p class="iv-lede">Nobody minds the question. If a word comes up in your appointment that you do not know, saying so is the fastest way to understand your own treatment plan.</p>
      <div class="iv-actions">
        <a class="button is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book an appointment</a>
        <a class="button is-ghost-light is-lg" href="/faq/">Read the FAQs</a>
      </div>
      <dl class="iv-facts">
        <div><dt>Address</dt><dd><a href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></dd></div><div><dt>Hours</dt><dd>Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b></dd></div><div><dt>Emergencies</dt><dd>Call the practice. We keep same day slots for pain, breaks and knocked out teeth.</dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot" data-el="mask">
        {{img slug="desk-tablet" sizes="(max-width: 899px) 100vw, 34vw"}}
        <figcaption>The desk where the treatment plan gets explained.</figcaption>
      </figure>
      <div class="iv-map">
        <div class="embed_component">
    <iframe data-src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.75121988455305!3d29.775949038160515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86412740e7dd5def%3A0xfa1ab8c6e696e133!2sMason%20Park%20Dental%20-%20Katy%20Dentist!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus" title="Map to Mason Park Dental of Katy" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </div>
      </div>
      <a class="link-arrow is-light" href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">Get directions <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
</section>
</main>
`;

const TMP = path.join(HERE, "blog", "build");
fs.mkdirSync(TMP, { recursive: true });
const specPath = path.join(TMP, "dental-dictionary.spec.json");
const bodyPath = path.join(TMP, "dental-dictionary.main.html");
fs.writeFileSync(specPath, JSON.stringify({
  slug: "dental-dictionary",
  path: "dental-dictionary",
  title: "Dental Dictionary | Mason Park Dental of Katy, TX",
  // The range is READ from the parsed terms, not asserted. The first draft of
  // this said "from abscess to xerostomia" -- the glossary has no X section at
  // all and ends at "wisdom teeth". A meta description is a claim like any
  // other; do not write one the page cannot support.
  description: `${total} dental terms defined plainly, from ${letters[0].terms[0].term} to ${letters[letters.length - 1].terms.slice(-1)[0].term}, by Mason Park Dental of Katy.`,
  crumb: "Dental dictionary",
}, null, 2));
fs.writeFileSync(bodyPath, main);
execFileSync(process.execPath, [path.join(HERE, "stamp-page.mjs"), specPath, bodyPath], { stdio: "inherit" });

console.log(`${total} terms across ${letters.length} letters`);
const thin = letters.filter((l) => !l.terms.length).map((l) => l.letter);
if (thin.length) console.log("! letters with no terms parsed: " + thin.join(" "));
