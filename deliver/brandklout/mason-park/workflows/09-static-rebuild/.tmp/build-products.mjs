// ===========================================================================
// BUILD /product-recommendations/ FROM THE SCRAPE.
//
//   node build-products.mjs
//   node build-products.mjs --check
//
// 35 products across six categories, each with a link. Parsed out of the old
// page's `.main_pro` blocks, never retyped.
//
// SECTIONS COME FROM THE ANCHORS, NOT THE HEADINGS. The old page has six tabs
// (#hygiene #anti #dry #implant #white #invali) but only three visible section
// headings, so grouping on headings put Dry Mouth and Implant products under
// "Anti-Cavity" and the Invisalign products under "Whitening". The anchor
// offsets are the real section boundaries.
//
// THE AFFILIATE TAG IS PRESERVED, DELIBERATELY. All 29 Amazon links carry
// `tag=grandmissiond-20`. That is somebody's Amazon Associates account and
// dropping it would silently end whatever it earns, so the URLs are rebuilt
// as `https://www.amazon.com/dp/<ASIN>?tag=<tag>` -- the canonical, stable
// form, with the tag intact and the search-result cruft gone.
//
// It is NOT this practice's obvious tag name, which is worth someone checking:
// see the runbook.
//
// A DISCLOSURE IS ADDED. The old page had none. The Amazon Associates
// operating agreement requires one on any page carrying tagged links, and so
// do the FTC's endorsement guidelines. It is one sentence and it is not
// optional.
//
// NO PRODUCT PHOTOS. The old page hotlinks 35 PNGs from the WordPress host
// this build replaces; those URLs die with it, and the repo does not carry
// binary assets. The list works as a list.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "..", "..", "01-content-intake", ".tmp", "site-scrape",
  "pages", "product-recommendations", "rendered.html");
const CHECK = process.argv.includes("--check");

const html = fs.readFileSync(SRC, "utf8");
const body = html.slice(html.indexOf("<body"));

const strip = (s) => s
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|​/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&#8217;|&rsquo;/g, "’")
  .replace(/\s+/g, " ")
  .trim();

// The tab order is the page's own. `note` is this build's; the old page had
// no prose at all, only a grid of product tiles.
const SECTIONS = [
  { anchor: "hygiene", name: "Hygiene",
    note: "What the hygienists reach for first. Between the teeth is where the brush cannot go, and that is where most gum disease starts." },
  { anchor: "anti", name: "Anti-cavity",
    note: "For someone who keeps getting decay despite brushing. These raise the pH and the fluoride, which is the part willpower cannot fix." },
  { anchor: "dry", name: "Dry mouth",
    note: "Medication, radiotherapy and age all reduce saliva, and saliva is what protects teeth between meals. A dry mouth decays fast." },
  { anchor: "implant", name: "Implants",
    note: "An implant does not decay, but the gum around it can still fail. Cleaning under and around the crown is the whole job." },
  { anchor: "white", name: "Whitening",
    note: "Tray whitening, done at home over a couple of weeks. Ask us first — whitening does nothing to a crown or a filling." },
  { anchor: "invali", name: "Aligners and dentures",
    note: "Keeping an appliance clean. A cloudy aligner is a stained aligner, and the smell is bacteria." },
];

// Locate each section by its anchor; the products between two anchors belong
// to the earlier one.
for (const s of SECTIONS) {
  s.at = body.indexOf(`id="${s.anchor}"`);
  if (s.at < 0) { console.error(`REFUSING: no anchor #${s.anchor} in the source`); process.exit(1); }
  s.items = [];
}
SECTIONS.sort((a, b) => a.at - b.at);
const sectionAt = (i) => [...SECTIONS].reverse().find((s) => s.at < i) ?? SECTIONS[0];

/** `https://www.amazon.com/Long-Slug/dp/B0831HZCTK?crid=…&tag=x-20` -> canonical. */
const cleanUrl = (raw) => {
  const url = raw.replace(/&amp;/g, "&");
  const asin = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/.exec(url);
  if (!asin) return url;                       // not an Amazon product page
  const tag = /[?&]tag=([^&]+)/.exec(url);
  return `https://www.amazon.com/dp/${asin[1]}${tag ? `?tag=${tag[1]}` : ""}`;
};

const BLOCK = /<div class="main_pro">([\s\S]*?)<div class="pro_button">\s*<a href="([^"]+)"/g;
const tags = new Set();
let m;
while ((m = BLOCK.exec(body))) {
  const name = strip((m[1].match(/<div class="pro_title">([\s\S]*?)<\/div>/) ?? [, ""])[1]);
  if (!name) continue;
  const href = cleanUrl(m[2]);
  const tag = /[?&]tag=([^&]+)/.exec(href);
  if (tag) tags.add(tag[1]);
  sectionAt(m.index).items.push({ name, href });
}

const total = SECTIONS.reduce((a, s) => a + s.items.length, 0);
console.log(`${total} product(s) across ${SECTIONS.length} sections`);
for (const s of SECTIONS) console.log(`  ${String(s.items.length).padStart(3)}  ${s.name}`);
const empty = SECTIONS.filter((s) => !s.items.length);
if (empty.length) { console.error(`REFUSING: empty section(s): ${empty.map((s) => s.anchor).join(" ")}`); process.exit(1); }
console.log(`affiliate tag(s) carried through: ${[...tags].join(", ") || "none"}`);
const offsite = SECTIONS.flatMap((s) => s.items).filter((i) => !/^https:\/\/www\.amazon\.com\/dp\//.test(i.href));
if (offsite.length) console.log(`${offsite.length} non-Amazon link(s): ${offsite.map((i) => i.name).join(", ")}`);
if (CHECK) { console.log("\n--check: nothing written."); process.exit(0); }

const esc = (s) => String(s).replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

const jump = SECTIONS
  .map((s) => `<li><a class="bl-page" href="#s-${s.anchor}">${esc(s.name)}</a></li>`)
  .join("");

const sections = SECTIONS.map((s) => `  <div class="wrap" id="s-${s.anchor}">
    <p class="svc-ledger-label">${esc(s.name)} &mdash; ${s.items.length} product${s.items.length === 1 ? "" : "s"}</p>
    <p class="pe-lede">${esc(s.note)}</p>
    <ul class="svc-ledger">
${s.items.map((i) => `      <li><b>Buy</b><span><a href="${escAttr(i.href)}" target="_blank" rel="nofollow sponsored noopener">${esc(i.name)}</a></span></li>`).join("\n")}
    </ul>
  </div>`).join("\n");

const main = `<main class="main-wrapper" id="main">
<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">

  <div class="ar-bg" data-drift>
    {{img slug="kid-shelf-teen" sizes="100vw" eager}}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    <p class="chapter-tag"><i></i><b>Product Recommendations</b></p>
    <h1 class="ar-title" data-split>What we actually <em>recommend</em></h1>
    <p class="ar-lede" data-anim="hide">${total} things, grouped by what they are for. Nothing here replaces a cleaning &mdash; it is what we tell patients to use between them.</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-lg" href="#list">See the list</a>
      <a class="button is-ghost-light is-lg" href="/toothpaste-rda-table/">The toothpaste table</a></div>
    <p class="el-cue" aria-hidden="true"><span>Scroll</span><i></i></p>
  </div>
</section>

<div class="padding-global"><div class="container-large">
  <nav class="breadcrumb_component" aria-label="Breadcrumb">
    <span class="breadcrumb_item"><a href="/">Home</a></span><span class="breadcrumb_item">Product recommendations</span>
  </nav>
</div></div>

<section class="ch ch-qualify" id="how" data-chapter="1" data-chapter-name="How To Use This">
  <div class="wrap svc-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>How To Use This</b></p>
      <h2 data-split>Ask which of these is yours.</h2>
    </div>
    <p class="pe-lede">Six lists, because six different mouths need six different things. A dry mouth needs the opposite of what a whitening patient needs, and buying the whole page helps nobody.</p>
  </div>
  <div class="wrap">
    <ul class="svc-ledger">
      <li><b>Start with one</b><span>The floss you will actually use beats the water flosser sitting in a cupboard. Pick the thing that fits your evening.</span></li>
      <li><b>Bring it to your cleaning</b><span>We will tell you whether it is doing anything. Some of these matter enormously for one person and not at all for another.</span></li>
      <li><b>These are not prescriptions</b><span>High-fluoride gels and prescription rinses are a separate conversation, and one we have in the chair.</span></li>
      <li><b>Disclosure</b><span>The links below go to Amazon and carry an affiliate tag, which means a purchase may earn a commission at no extra cost to you. It does not change what we recommend.</span></li>
    </ul>
  </div>
</section>

<section class="ch ch-treatment" id="list" data-chapter="2" data-chapter-name="The List">
  <div class="wrap svc-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>The List</b></p>
      <h2 data-split>${total} products, six lists.</h2>
    </div>
    <p class="pe-lede">Every link opens on Amazon in a new tab. Prices and availability there are nothing to do with us, and a product going out of stock is not a reason to panic &mdash; ask and we will name an alternative.</p>
  </div>
  <div class="wrap">
    <nav class="bl-pager" aria-label="Jump to a list">
      <ul class="bl-pager_nums">${jump}</ul>
    </nav>
  </div>
${sections}
</section>

<section class="ch ch-invitation" id="invitation" data-chapter="3" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      <p class="chapter-tag"><i></i><b>The Invitation</b></p>
      <h2 data-split>Or just ask at the desk.</h2>
      <p class="iv-lede">We keep some of this on the shelf at reception, and the rest we can point you at. Either way the useful version of this page is a two minute conversation at the end of your cleaning.</p>
      <div class="iv-actions">
        <a class="button is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book a cleaning</a>
        <a class="button is-ghost-light is-lg" href="tel:+12817698878">(281) 769-8878</a>
      </div>
      <dl class="iv-facts">
        <div><dt>Address</dt><dd><a href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></dd></div><div><dt>Hours</dt><dd>Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b></dd></div><div><dt>Emergencies</dt><dd>Call the practice. We keep same day slots for pain, breaks and knocked out teeth.</dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot" data-el="mask">
        {{img slug="kid-shelf-small" sizes="(max-width: 899px) 100vw, 34vw"}}
        <figcaption>The take-home shelf beside the front desk.</figcaption>
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
const specPath = path.join(TMP, "product-recommendations.spec.json");
const bodyPath = path.join(TMP, "product-recommendations.main.html");
fs.writeFileSync(specPath, JSON.stringify({
  slug: "product-recommendations",
  path: "product-recommendations",     // the old WordPress URL, kept
  title: "Product Recommendations | Mason Park Dental of Katy, TX",
  description: `${total} oral care products Mason Park Dental of Katy recommends, grouped for hygiene, cavities, dry mouth, implants, whitening and aligners.`,
  crumb: "Product recommendations",
}, null, 2));
fs.writeFileSync(bodyPath, main);
execFileSync(process.execPath, [path.join(HERE, "stamp-page.mjs"), specPath, bodyPath], { stdio: "inherit" });
