// ===========================================================================
// BUILD /toothpaste-rda-table/ FROM THE SCRAPE.
//
//   node build-rda.mjs
//
// 89 toothpastes and their RDA values is data, so it is PARSED out of the old
// page's <table>, not retyped. A person transcribing 89 name/number pairs
// introduces errors, and a wrong number on this particular page reads as
// clinical advice about a product someone has in their bathroom.
//
// The old page rendered the whole list as one four-column table -- two
// name/value pairs per row, sorted by value, running off the side of a phone.
// This groups the same numbers into the four bands the old page's own H3s
// named, and renders each band as a `svc-ledger`, which is the component the
// dental dictionary already uses for exactly this shape.
//
// THREE THINGS THIS PAGE MUST NOT DO, and does not:
//   - It does not tell anyone to stop using a product. RDA is a laboratory
//     abrasion measure, not a safety verdict, and the ADA's own limit is 250.
//   - It does not present the numbers as current. Manufacturers reformulate;
//     these are the values the practice published, and the page says so.
//   - It does not invent a value. The FDA and ADA limit rows in the source are
//     pulled OUT of the product list and used as the band markers they are.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "..", "..", "01-content-intake", ".tmp", "site-scrape",
  "pages", "toothpaste-rda-table", "rendered.html");

const html = fs.readFileSync(SRC, "utf8");

const strip = (s) => s
  .replace(/<[^>]+>/g, "")
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&#8217;|&rsquo;/g, "’")
  .replace(/&#8211;|&ndash;/g, "–")
  .replace(/\s+/g, " ")
  .trim();

// The page ships the same table three times (desktop, tablet, mobile), so the
// pairs are collected into a Map and the duplicates collapse.
const found = new Map();
for (const table of html.match(/<table[\s\S]*?<\/table>/g) ?? []) {
  for (const row of table.match(/<tr[\s\S]*?<\/tr>/g) ?? []) {
    const cells = (row.match(/<t[dh][\s\S]*?<\/t[dh]>/g) ?? []).map(strip);
    // Four columns: two independent name/value pairs.
    for (const [name, value] of [[cells[0], cells[1]], [cells[2], cells[3]]]) {
      if (!name || !value) continue;
      if (/^toothpaste$/i.test(name)) continue;   // the header row
      if (!found.has(name)) found.set(name, value);
    }
  }
}

// The two limit rows are not products.
const LIMIT = /recommended limit/i;
const limits = [...found].filter(([n]) => LIMIT.test(n));
const items = [...found]
  .filter(([n]) => !LIMIT.test(n))
  .map(([name, value]) => ({
    name,
    value,
    // A range ("54 – 68") sorts and bands on its LOW end, which is where the
    // product starts. Stated in full in the ledger either way.
    n: parseFloat(String(value).replace(/[^\d.].*$/, "")),
  }))
  .sort((a, b) => a.n - b.n || a.name.localeCompare(b.name));

const broken = items.filter((i) => !Number.isFinite(i.n));
if (broken.length) {
  console.error(`! ${broken.length} row(s) with an unparseable value: ${broken.map((b) => b.name).join(", ")}`);
  process.exit(1);
}

// The bands, and their labels, are the old page's own H3s.
const BANDS = [
  { id: "low", label: "0 to 70", name: "Low abrasive", max: 70,
    note: "The gentlest end of the scale. Where a dentist tends to point someone with sensitivity, gum recession or worn enamel." },
  { id: "medium", label: "70 to 100", name: "Medium abrasive", max: 100,
    note: "Most everyday toothpaste sits here. For most mouths, with a soft brush and no scrubbing, this is unremarkable." },
  { id: "high", label: "100 to 150", name: "Highly abrasive", max: 150,
    note: "Usually a whitening or tartar-control paste. Still well inside the ADA limit; worth knowing about if your enamel is already thin." },
  { id: "limit", label: "150 and above", name: "At the harmful limit", max: Infinity,
    note: "The old chart marks 150 to 250 as the range regarded as the harmful limit. The FDA's stated limit is 200 and the ADA's is 250." },
];

const esc = (s) => String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const bandOf = (n) => BANDS.find((b) => n < b.max) ?? BANDS[BANDS.length - 1];
for (const b of BANDS) b.items = items.filter((i) => bandOf(i.n).id === b.id);

const sections = BANDS.map((b) => `  <div class="wrap" id="band-${b.id}">
    <p class="svc-ledger-label">${esc(b.name)} &mdash; RDA ${esc(b.label)} &mdash; ${b.items.length} listed</p>
    <p class="pe-lede">${esc(b.note)}</p>
    <ul class="svc-ledger">
${b.items.map((i) => `      <li><b>${esc(i.value)}</b><span>${esc(i.name)}</span></li>`).join("\n")}
    </ul>
  </div>`).join("\n");

const jump = BANDS
  .map((b) => `<li><a class="bl-page" href="#band-${b.id}">${esc(b.label)}</a></li>`)
  .join("");

const main = `<main class="main-wrapper" id="main">
<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">

  <div class="ar-bg" data-drift>
    {{img slug="hygienist-working-4" sizes="100vw" eager}}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    <p class="chapter-tag"><i></i><b>Toothpaste Abrasiveness</b></p>
    <h1 class="ar-title" data-split>The <em>RDA</em> table</h1>
    <p class="ar-lede" data-anim="hide">${items.length} toothpastes and how abrasive each one is, from a toothbrush with plain water at 4 to the ADA&rsquo;s limit at 250. Find yours, then ask us whether it suits your mouth.</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-lg" href="#table">Find your toothpaste</a>
      <a class="button is-ghost-light is-lg" href="#what">What RDA measures</a></div>
    <p class="el-cue" aria-hidden="true"><span>Scroll</span><i></i></p>
  </div>
</section>

<div class="padding-global"><div class="container-large">
  <nav class="breadcrumb_component" aria-label="Breadcrumb">
    <span class="breadcrumb_item"><a href="/">Home</a></span><span class="breadcrumb_item">Toothpaste RDA table</span>
  </nav>
</div></div>

<section class="ch ch-qualify" id="what" data-chapter="1" data-chapter-name="What It Measures">
  <div class="wrap svc-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>What It Measures</b></p>
      <h2 data-split>A number for how hard a paste scrubs.</h2>
    </div>
    <p class="pe-lede">RDA stands for Relative Dentin Abrasivity. It is a laboratory measure: a paste is scrubbed against dentin and the wear is compared against a reference. It says nothing about whether a paste cleans well, tastes good or contains fluoride.</p>
  </div>
  <div class="wrap">
    <ul class="svc-ledger">
      <li><b>It is a scale, not a verdict</b><span>A higher number is not automatically bad. The ADA regards anything up to 250 as safe for daily use, and the FDA&rsquo;s stated limit is 200.</span></li>
      <li><b>It matters most if enamel is already thin</b><span>Recession, grinding, reflux and years of hard brushing all expose softer surfaces. That is when the number starts to count.</span></li>
      <li><b>Technique outweighs the paste</b><span>A hard brush and pressure will do more than the difference between two pastes twenty points apart. Soft bristles, light hand, two minutes.</span></li>
      <li><b>These values are not live</b><span>They are the figures this practice published, and manufacturers reformulate. Treat the table as a guide and check the tube you actually own.</span></li>
    </ul>
  </div>
</section>

<section class="ch ch-treatment" id="table" data-chapter="2" data-chapter-name="The Table">
  <div class="wrap svc-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>The Table</b></p>
      <h2 data-split>${items.length} pastes, lowest first.</h2>
    </div>
    <p class="pe-lede">Grouped into the four bands the original chart names. ${limits.map((l) => `${esc(l[0])} ${esc(l[1])}`).join(". ")}.</p>
  </div>
  <div class="wrap">
    <nav class="bl-pager" aria-label="Jump to band">
      <ul class="bl-pager_nums">${jump}</ul>
    </nav>
  </div>
${sections}
</section>

<section class="ch ch-invitation" id="invitation" data-chapter="3" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      <p class="chapter-tag"><i></i><b>The Invitation</b></p>
      <h2 data-split>Bring the tube in.</h2>
      <p class="iv-lede">A number on a chart cannot see your gums. If you have sensitivity, recession or wear, bring what you use to your next cleaning and we will tell you whether to change anything &mdash; often the answer is the brush, not the paste.</p>
      <div class="iv-actions">
        <a class="button is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book a cleaning</a>
        <a class="button is-ghost-light is-lg" href="/product-recommendations/">What we recommend</a>
      </div>
      <dl class="iv-facts">
        <div><dt>Address</dt><dd><a href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></dd></div><div><dt>Hours</dt><dd>Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b></dd></div><div><dt>Emergencies</dt><dd>Call the practice. We keep same day slots for pain, breaks and knocked out teeth.</dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot" data-el="mask">
        {{img slug="kid-shelf" sizes="(max-width: 899px) 100vw, 34vw"}}
        <figcaption>The take-home shelf at the front desk.</figcaption>
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
const specPath = path.join(TMP, "toothpaste-rda-table.spec.json");
const bodyPath = path.join(TMP, "toothpaste-rda-table.main.html");
fs.writeFileSync(specPath, JSON.stringify({
  slug: "toothpaste-rda-table",
  path: "toothpaste-rda-table",     // the old WordPress URL, kept
  title: "Toothpaste RDA Table | Mason Park Dental of Katy, TX",
  // Counts and endpoints are READ from the parsed data, never asserted.
  description: `The abrasiveness of ${items.length} toothpastes, from ${items[0].name} at ${items[0].value} to ${items[items.length - 1].name} at ${items[items.length - 1].value}, grouped into the four RDA bands, by Mason Park Dental of Katy.`,
  crumb: "Toothpaste RDA table",
}, null, 2));
fs.writeFileSync(bodyPath, main);
execFileSync(process.execPath, [path.join(HERE, "stamp-page.mjs"), specPath, bodyPath], { stdio: "inherit" });

console.log(`${items.length} toothpastes parsed, ${limits.length} limit row(s) held out`);
for (const b of BANDS) console.log(`  ${b.name.padEnd(22)} RDA ${b.label.padEnd(14)} ${String(b.items.length).padStart(3)}`);
const empty = BANDS.filter((b) => !b.items.length);
if (empty.length) console.log("! empty band(s): " + empty.map((b) => b.id).join(" "));
