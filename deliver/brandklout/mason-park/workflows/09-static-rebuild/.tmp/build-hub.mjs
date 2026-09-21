// ===========================================================================
// BUILD /patient-resources/ -- the hub the old site had.
//
//   node build-hub.mjs
//
// EVERY LINK IS CHECKED AGAINST DISK. A hub is a page whose only job is to
// point at other pages, so a hub that points at a 404 has no job left. Each
// entry below is verified to exist under home/ before it is rendered, and the
// build FAILS if one is missing rather than shipping a dead link -- the same
// rule prune-nav.mjs learned the hard way when its hardcoded route list went
// blind on 46 of 57 pages.
//
// The label is READ from each page's own <title>, so renaming a page renames
// its card here.
//
// TWO DELIBERATE DEPARTURES FROM THE OLD PAGE:
//
//   The old hub's whole premise is "take advantage of our online patient
//   forms". THERE IS NO FORM BACKEND ON THIS SITE, on any page. So the forms
//   card says what actually happens today -- the tablet at reception, or a
//   phone call -- rather than linking to a form that does not exist. Wiring a
//   real form is its own job and is open with the client.
//
//   The old "Dental Library" was a categorised index of treatments. That IS
//   /our-services/ in this build, so it links there instead of being rebuilt
//   as a second, competing catalogue.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "home");

// group -> entries. `note` is why a patient would open it.
const GROUPS = [
  ["Before you come in", [
    ["/new-patients/", "What the first visit is, and what to bring."],
    ["/financing/", "Insurance, payment plans, and what things cost."],
    ["/dental-savings-plan/", "The in-house plan, for people with no insurance."],
    ["/special-offers/", "What is running now, including the free second opinion."],
    ["/virtual-consultation/", "A first opinion without taking time off work."],
  ]],
  ["Look something up", [
    ["/faq/", "The questions the front desk answers most days."],
    ["/dental-dictionary/", "Every word you might hear in the chair, defined plainly."],
    ["/our-services/", "The full treatment catalogue, grouped."],
    ["/sitemap/", "Every page on this site, in one list."],
  ]],
  ["Take care of it at home", [
    ["/product-recommendations/", "What we tell patients to actually buy."],
    ["/toothpaste-rda-table/", "How abrasive your toothpaste is."],
    ["/ph-and-acidity-of-food-beverages/", "How acidic your drink is, and what that does to enamel."],
  ]],
  ["About the practice", [
    ["/our-doctors/", "Who will be treating you."],
    ["/our-team/", "The people at the desk and the chair."],
    ["/technology/", "The equipment, and why any of it matters to you."],
    ["/patient-reviews/", "What patients say, unedited."],
    ["/town-resource/", "New to Katy? Who runs the city and where the official pages are."],
  ]],
];

const missing = [];
const labelFor = (route) => {
  const file = path.join(SITE, ...route.split("/").filter(Boolean), "index.html");
  if (!fs.existsSync(file)) { missing.push(route); return null; }
  const head = fs.readFileSync(file, "utf8").slice(0, 8000);
  const m = head.match(/<title>([\s\S]*?)<\/title>/);
  if (!m) { missing.push(`${route} (no <title>)`); return null; }
  // The first segment only. Titles here are "Name | Qualifier | Practice", and
  // a card that reads "New to Katy, TX | Town Resources" is a title, not a
  // label. Taking everything before the first pipe gives the name on every
  // page the hub links to.
  return m[1]
    .split("|")[0]
    .replace(/\s+in Katy,? TX\s*$/i, "")
    .trim();
};

for (const [, entries] of GROUPS) for (const e of entries) e[2] = labelFor(e[0]);

if (missing.length) {
  console.error(`REFUSING: ${missing.length} link(s) point at a page that is not on disk:`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}

const total = GROUPS.reduce((a, [, e]) => a + e.length, 0);
const esc = (s) => String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const sections = GROUPS.map(([name, entries]) => `  <div class="wrap">
    <p class="svc-ledger-label">${esc(name)}</p>
    <ul class="svc-ledger">
${entries.map(([route, note, label]) =>
  `      <li><b><a href="${route}">${esc(label)}</a></b><span>${esc(note)}</span></li>`).join("\n")}
    </ul>
  </div>`).join("\n");

const main = `<main class="main-wrapper" id="main">
<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">

  <div class="ar-bg" data-drift>
    {{img slug="sofa-forms-3" sizes="100vw" eager}}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    <p class="chapter-tag"><i></i><b>Patient Resources</b></p>
    <h1 class="ar-title" data-split>Patient <em>Resources</em></h1>
    <p class="ar-lede" data-anim="hide">${total} things worth knowing before, during and after a visit &mdash; what to bring, what a word means, what to buy, and what any of it costs.</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-lg" href="#resources">Everything, listed</a>
      <a class="button is-ghost-light is-lg" href="tel:+12817698878">(281) 769-8878</a></div>
    <p class="el-cue" aria-hidden="true"><span>Scroll</span><i></i></p>
  </div>
</section>

<div class="padding-global"><div class="container-large">
  <nav class="breadcrumb_component" aria-label="Breadcrumb">
    <span class="breadcrumb_item"><a href="/">Home</a></span><span class="breadcrumb_item">Patient resources</span>
  </nav>
</div></div>

<!-- THE FORMS. The old page's entire premise was "take advantage of our online
     patient forms", and there is no form backend on this site. So this says
     what actually happens instead of linking to something that does not
     exist. A dead form is worse than a phone number -- the same call made on
     the virtual consultation page. -->
<section class="ch ch-qualify" id="forms" data-chapter="1" data-chapter-name="Paperwork">
  <div class="wrap svc-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>Paperwork</b></p>
      <h2 data-split>The forms take ten minutes.</h2>
    </div>
    <p class="pe-lede">Medical history, medications, insurance. We would rather you did it sitting down with a coffee than standing at the desk, so there are two ways to get it out of the way.</p>
  </div>
  <div class="wrap">
    <div class="svc-grid is-3">
      <article class="svc-card is-price">
        <div class="svc-card_body">
          <p class="svc-price"><a href="tel:+12817698878">(281)&nbsp;769&#8209;8878</a><small>Ask us to send them</small></p>
          <p class="svc-card_text">Call ahead and the front desk will get the forms to you before you travel, so nothing is a surprise on the day.</p>
        </div>
      </article>
      <article class="svc-card">
        <div class="svc-card_media" data-el="mask">{{img slug="sofa-forms-2" sizes="(max-width: 899px) 100vw, 33vw"}}</div>
        <div class="svc-card_body">
          <span class="svc-card_no">02</span>
          <h3 class="svc-card_name">Or do it on the tablet</h3>
          <p class="svc-card_text">Arrive ten minutes early and fill them in on the sofa. Bring your insurance card and a list of anything you take.</p>
        </div>
      </article>
      <article class="svc-card">
        <div class="svc-card_body">
          <span class="svc-card_no">03</span>
          <h3 class="svc-card_name">What we will ask</h3>
          <p class="svc-card_text">Medical history, medications and allergies, previous dentist, and what brought you in. See <a href="/new-patients/">new patients</a> for the whole first visit.</p>
        </div>
      </article>
    </div>
  </div>
</section>

<section class="ch ch-treatment" id="resources" data-chapter="2" data-chapter-name="Resources">
  <div class="wrap svc-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>Resources</b></p>
      <h2 data-split>${total} pages worth your time.</h2>
    </div>
    <p class="pe-lede">Grouped by when you would want them. If you are looking for a specific page rather than browsing, <a href="/sitemap/">the sitemap</a> lists everything.</p>
  </div>
${sections}
</section>

<section class="ch ch-invitation" id="invitation" data-chapter="3" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      <p class="chapter-tag"><i></i><b>The Invitation</b></p>
      <h2 data-split>Still easier to ask.</h2>
      <p class="iv-lede">None of this is a substitute for a person. If you cannot find what you need on any of these pages, call and the front desk will find it for you, or tell you it does not exist.</p>
      <div class="iv-actions">
        <a class="button is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book an appointment</a>
        <a class="button is-ghost-light is-lg" href="/contacts/">Contact page</a>
      </div>
      <dl class="iv-facts">
        <div><dt>Address</dt><dd><a href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></dd></div><div><dt>Hours</dt><dd>Mon to Wed <b>9am to 6pm</b><br>Thu <b>9am to 5pm</b><br>Fri to Sun <b>Closed</b></dd></div><div><dt>Emergencies</dt><dd>Call the practice. We keep same day slots for pain, breaks and knocked out teeth.</dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot" data-el="mask">
        {{img slug="desk-tablet-2" sizes="(max-width: 899px) 100vw, 34vw"}}
        <figcaption>The tablet the forms live on.</figcaption>
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
const specPath = path.join(TMP, "patient-resources.spec.json");
const bodyPath = path.join(TMP, "patient-resources.main.html");
fs.writeFileSync(specPath, JSON.stringify({
  slug: "patient-resources",
  path: "patient-resources",     // the old WordPress URL, kept
  title: "Patient Resources | Mason Park Dental of Katy, TX",
  description: `${total} patient resources from Mason Park Dental of Katy: what to bring to a first visit, what treatments cost, what the words mean, and what to use at home.`,
  crumb: "Patient resources",
}, null, 2));
fs.writeFileSync(bodyPath, main);
execFileSync(process.execPath, [path.join(HERE, "stamp-page.mjs"), specPath, bodyPath], { stdio: "inherit" });

console.log(`${total} resource(s) across ${GROUPS.length} groups, every target verified on disk`);
for (const [name, entries] of GROUPS) console.log(`  ${String(entries.length).padStart(2)}  ${name}`);
