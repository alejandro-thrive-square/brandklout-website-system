// ===========================================================================
// BUILD THE 404 PAGE.
//
//   node build-404.mjs
//
// Instatic ships a stock not-found page: an <h1> on a bare <body>, no header,
// no footer, no stylesheet of ours. Someone who mistypes a URL, or follows one
// of the old WordPress links this rebuild did not keep, lands on a page that
// does not look like the practice at all -- and with no way back except the
// browser's back button.
//
// This is a normal page in every respect. It goes through the same export,
// convert and import path as the other 54, and apply-404-template.mjs then
// marks the imported row `templateEnabled` with `target: {kind:"notFound"}`,
// which is what `resolveNotFoundTemplate()` looks for.
//
// It is deliberately SHORT. A 404 exists to get someone somewhere else, and a
// six thousand pixel apology is the opposite of that.
//
// The destinations are checked against disk, like the hub's -- a 404 page that
// links to a 404 is a special kind of embarrassing.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "home");

// Where someone who got here most likely meant to go.
const WAYS_BACK = [
  ["/our-services/", "Every treatment the practice offers, grouped."],
  ["/new-patients/", "What a first visit is, and what to bring."],
  ["/blog/", "Everything the practice has written."],
  ["/patient-resources/", "Forms, costs, definitions and what to use at home."],
  ["/sitemap/", "Every page on this site, in one list."],
  ["/contacts/", "Address, hours, and the phone number."],
];

const missing = [];
const labelFor = (route) => {
  const file = path.join(SITE, ...route.split("/").filter(Boolean), "index.html");
  if (!fs.existsSync(file)) { missing.push(route); return null; }
  const m = fs.readFileSync(file, "utf8").slice(0, 8000).match(/<title>([\s\S]*?)<\/title>/);
  if (!m) { missing.push(`${route} (no <title>)`); return null; }
  return m[1].split("|")[0].replace(/\s+in Katy,? TX\s*$/i, "").trim();
};

for (const w of WAYS_BACK) w[2] = labelFor(w[0]);
if (missing.length) {
  console.error(`REFUSING: the 404 page cannot link to a page that is not on disk:`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}

const esc = (s) => String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const main = `<main class="main-wrapper" id="main">
<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">

  <div class="ar-bg" data-drift>
    {{img slug="team-corridor" sizes="100vw" eager}}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    <p class="chapter-tag"><i></i><b>404</b></p>
    <h1 class="ar-title" data-split>That page is <em>not here</em></h1>
    <p class="ar-lede" data-anim="hide">Either the address has a typo in it, or the page moved when we rebuilt the site. Both are easy to get past.</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-lg" href="/">Back to the home page</a>
      <a class="button is-ghost-light is-lg" href="tel:+12817698878">(281) 769-8878</a></div>
  </div>
</section>

<div class="padding-global"><div class="container-large">
  <nav class="breadcrumb_component" aria-label="Breadcrumb">
    <span class="breadcrumb_item"><a href="/">Home</a></span><span class="breadcrumb_item">Page not found</span>
  </nav>
</div></div>

<section class="ch ch-treatment" id="ways-back" data-chapter="1" data-chapter-name="Ways Back">
  <div class="wrap svc-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>Ways Back</b></p>
      <h2 data-split>Try one of these.</h2>
    </div>
    <p class="pe-lede">If you came here from a link on another site, it was probably pointing at an old address. The <a href="/sitemap/">sitemap</a> lists every page we have.</p>
  </div>
  <div class="wrap">
    <ul class="svc-ledger">
${WAYS_BACK.map(([route, note, label]) =>
  `      <li><b><a href="${route}">${esc(label)}</a></b><span>${esc(note)}</span></li>`).join("\n")}
    </ul>
  </div>
</section>

<section class="ch ch-invitation" id="invitation" data-chapter="2" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      <p class="chapter-tag"><i></i><b>The Invitation</b></p>
      <h2 data-split>Or tell us what you were after.</h2>
      <p class="iv-lede">The front desk will find it faster than any menu, and if it genuinely does not exist they will say so rather than send you round in a circle.</p>
      <div class="iv-actions">
        <a class="button is-lg" href="tel:+12817698878">(281) 769-8878</a>
        <a class="button is-ghost-light is-lg" href="/contacts/">Contact page</a>
      </div>
      <dl class="iv-facts">
        <div><dt>Address</dt><dd><a href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></dd></div><div><dt>Hours</dt><dd>Mon to Wed <b>9am to 6pm</b><br>Thu <b>9am to 5pm</b><br>Fri to Sun <b>Closed</b></dd></div><div><dt>Emergencies</dt><dd>Call the practice. We keep same day slots for pain, breaks and knocked out teeth.</dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot" data-el="mask">
        {{img slug="desk-call-3" sizes="(max-width: 899px) 100vw, 34vw"}}
        <figcaption>The front desk, which is a better search box than this page.</figcaption>
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
const specPath = path.join(TMP, "404.spec.json");
const bodyPath = path.join(TMP, "404.main.html");
fs.writeFileSync(specPath, JSON.stringify({
  slug: "404",
  path: "404",
  title: "Page Not Found | Mason Park Dental of Katy, TX",
  description: "That page is not here. Every treatment, the blog, the patient resources and the practice's phone number, from Mason Park Dental of Katy.",
  crumb: "Page not found",
  // A 404 must never be indexed, and must never be the canonical of anything.
  noindex: true,
}, null, 2));
fs.writeFileSync(bodyPath, main);
execFileSync(process.execPath, [path.join(HERE, "stamp-page.mjs"), specPath, bodyPath], { stdio: "inherit" });

console.log(`${WAYS_BACK.length} way(s) back, every target verified on disk`);
