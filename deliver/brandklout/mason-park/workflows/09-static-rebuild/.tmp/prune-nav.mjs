// ===========================================================================
// The header and footer link only to pages that exist.
//
// Client, 2026-09-02: "Remove the links that don't exist in the nav bar."
// The chrome was stamped from the WordPress site's menu and carried ~60
// links to pages this deliverable does not have (34 treatment pages, the
// resources, the legal pages). Every one of them 404s on staging. This
// rewrites the <nav class="navbar_menu"> block, the two footer link
// columns and the legal row on every page under home/ to the eleven routes
// that exist, and reports any other href on the page that still points at
// a route that is not one of them.
//
//   node prune-nav.mjs           # rewrite, then report leftovers
//   node prune-nav.mjs --check   # report only
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "home");
const CHECK = process.argv.includes("--check");

// ROUTES is DERIVED FROM DISK, never listed by hand.
//
// It used to be a literal list of the eleven routes that existed on
// 2026-09-02. The moment treatment pages started landing under
// home/services/, that list made this gate lie in both directions: it
// reported live pages (/services/dental-crowns/) as DEAD, and it would
// have gone on pruning the nav down to eleven routes while thirty more
// sat on disk. A gate with a hardcoded page list reports clean on the
// pages it has never heard of. Walk the folder instead.
const routesOnDisk = () => {
  const out = new Set();
  const walkDirs = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const abs = path.join(dir, e.name);
      if (fs.existsSync(path.join(abs, "index.html"))) {
        out.add("/" + path.relative(SITE, abs).split(path.sep).join("/") + "/");
      }
      walkDirs(abs);
    }
  };
  if (fs.existsSync(path.join(SITE, "index.html"))) out.add("/");
  walkDirs(SITE);
  return out;
};
const ROUTES = routesOnDisk();

// The Services menu is GROUPED, in the catalogue's own seven groups and
// its own order, and every entry is read off disk: a treatment appears in
// the nav the day its page is stamped and never before. `label` is the
// chip wording from /our-services/, which is what the client approved.
//
// It was a flat list until 2026-09-09, which was fine at two entries and
// unusable at sixteen. The nesting needs no new CSS -- site.css already
// styles `.navbar_dropdown-list .navbar_dropdown-list` and opens it on
// hover and focus-within -- and no new JS, because site.js binds the
// mobile toggle with `.has-dropdown > .navbar_link`, which matches a
// nested group as well as a top-level one.
//
// "Night guards" is in two catalogue groups (Preventative and Comfort and
// pain). A menu is not a catalogue, so it is listed once, under the group
// where its chip first appears.
const GROUPS = [
  ["Preventative", [
    ["preventative-dentistry", "Cleanings and Exams"],
    ["oral-cancer-screening", "Oral Cancer Screening"],
    ["dental-hygiene-education", "Hygiene Education"],
    ["mouth-guards", "Mouth Guards"],
    ["night-guards", "Night Guards"],
    ["fluoride-treatment", "Fluoride"],
    ["sealants", "Sealants"],
  ]],
  ["Cosmetic", [
    ["cosmetic-dentistry", "Smile Makeovers"],
    ["bonding", "Bonding"],
    ["porcelain-veneers", "Porcelain Veneers"],
    ["whitening", "Whitening"],
  ]],
  ["Invisalign&reg;", [
    ["invisalign", "Invisalign&reg; Treatment"],
    ["invisalign-questions", "Invisalign&reg; Questions"],
  ]],
  ["Restorative", [
    ["dental-implant-restorations", "Implant Restorations"],
    ["dentures", "Dentures"],
    ["dental-crowns", "Crowns"],
    ["composite-fillings", "Tooth Coloured Fillings"],
    ["bridges", "Bridges"],
    ["root-canal-therapy", "Root Canal Therapy"],
  ]],
  ["Hygiene and gums", [
    ["comprehensive-care", "Deep Cleaning"],
    ["laser-dentistry", "Laser Dentistry"],
    ["airflow-one", "AIRFLOW&reg; ONE"],
    ["frenectomy", "Frenectomy"],
  ]],
  ["Oral surgery", [
    ["extractions", "Extractions"],
    ["wisdom-teeth", "Wisdom Teeth"],
    ["dental-implant-placement", "Implant Placement"],
    ["crown-lengthening", "Crown Lengthening"],
    ["bone-grafting", "Bone Grafting"],
  ]],
  ["Comfort and pain", [
    ["sedation-dentistry", "Sedation Dentistry"],
    ["emergency-dentist", "Emergency Dentist"],
    ["tmj-tmd", "TMJ and TMD"],
  ]],
];

// Flatten for the footer picks and for the count reported at the end.
const TREATMENTS = GROUPS.flatMap(([, items]) => items)
  .filter(([slug]) => ROUTES.has(`/services/${slug}/`));

// A group with nothing built yet is dropped entirely rather than rendered
// as an empty submenu. A group with exactly one page built is rendered
// flat -- a submenu holding one item is a worse click than the item.
const groupItems = GROUPS.map(([name, items]) => {
  const live = items.filter(([slug]) => ROUTES.has(`/services/${slug}/`));
  if (!live.length) return "";
  const links = live.map(([slug, label]) =>
    `<li class="navbar_item"><a class="navbar_link" href="/services/${slug}/">${label}</a></li>`).join("");
  if (live.length === 1) return links;
  return `<li class="navbar_item has-dropdown"><a class="navbar_link" href="/our-services/">${name}</a><ul class="navbar_dropdown-list">${links}</ul></li>`;
}).join("");

const NAV = `<nav class="navbar_menu" id="navbar-menu" aria-label="Main"><ul class="navbar_menu-list"><li class="navbar_item"><a class="navbar_link" href="/">Home</a></li><li class="navbar_item has-dropdown"><a class="navbar_link" href="/about-us/">About</a><ul class="navbar_dropdown-list"><li class="navbar_item"><a class="navbar_link" href="/about-us/">About the Practice</a></li><li class="navbar_item"><a class="navbar_link" href="/our-doctors/">Meet Our Doctors</a></li><li class="navbar_item"><a class="navbar_link" href="/our-team/">Meet Our Team</a></li><li class="navbar_item"><a class="navbar_link" href="/patient-reviews/">Patient Reviews</a></li></ul></li><li class="navbar_item has-dropdown"><a class="navbar_link" href="/our-services/">Services</a><ul class="navbar_dropdown-list"><li class="navbar_item"><a class="navbar_link" href="/our-services/">All Services</a></li>${groupItems}</ul></li><li class="navbar_item has-dropdown"><a class="navbar_link" href="/new-patients/">Patients</a><ul class="navbar_dropdown-list"><li class="navbar_item"><a class="navbar_link" href="/new-patients/">New Patients</a></li><li class="navbar_item"><a class="navbar_link" href="/financing/">Financing</a></li><li class="navbar_item"><a class="navbar_link" href="/dental-savings-plan/">Dental Savings Plan</a></li><li class="navbar_item"><a class="navbar_link" href="/special-offers/">Special Offers</a></li><li class="navbar_item"><a class="navbar_link" href="/technology/">Technology</a></li></ul></li><li class="navbar_item"><a class="navbar_link" href="/blog/">Blog</a></li><li class="navbar_item"><a class="navbar_link" href="/contacts/">Contact</a></li></ul></nav>`;

// The footer's Care column stays six rows whatever the catalogue does --
// a footer column is not a sitemap. It carries "All services" and the
// three most-asked treatments that exist.
const footerPicks = TREATMENTS
  .filter(([slug]) => ["invisalign", "dental-implant-restorations", "dental-crowns", "extractions"].includes(slug))
  .slice(0, 3)
  .map(([slug, label]) => `<li><a href="/services/${slug}/">${label}</a></li>`).join("");

const CARE = `<ul class="footer_list"><li><a href="/our-services/">All services</a></li>${footerPicks}<li><a href="/our-doctors/">Meet the doctors</a></li><li><a href="/technology/">Technology</a></li><li><a href="/about-us/">About the practice</a></li></ul>`;
const PATIENTS = `<ul class="footer_list"><li><a href="/new-patients/">New patients</a></li><li><a href="/financing/">Financing</a></li><li><a href="/dental-savings-plan/">Dental savings plan</a></li><li><a href="/patient-reviews/">Patient reviews</a></li><li><a href="/special-offers/">Special offers</a></li><li><a href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book online</a></li></ul>`;
// A legal page nobody can reach is not published. The Terms of Service and
// the Contact page both belong in the legal row, on every page.
const LEGAL = `<div class="footer_legal">\n      &copy; 2026 Mason Park Dental of Katy &middot; <a href="/terms-of-service/">Terms of Service</a> &middot; <a href="/contacts/">Contact</a>\n    </div>`;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const pages = walk(SITE).filter((f) => f.endsWith("index.html"));

let bad = 0;
for (const file of pages) {
  const rel = path.relative(SITE, file).split(path.sep).join("/");
  let html = fs.readFileSync(file, "utf8");
  if (!CHECK) {
    const before = html;
    html = html.replace(/<nav class="navbar_menu"[\s\S]*?<\/nav>/, NAV);
    html = html.replace(/(<h3 class="footer_heading">Care<\/h3>\s*)<ul class="footer_list">[\s\S]*?<\/ul>/, `$1${CARE}`);
    html = html.replace(/(<h3 class="footer_heading">Patients<\/h3>\s*)<ul class="footer_list">[\s\S]*?<\/ul>/, `$1${PATIENTS}`);
    html = html.replace(/<div class="footer_legal">[\s\S]*?<\/div>/, LEGAL);
    if (html !== before) fs.writeFileSync(file, html);
  }
  const left = [];
  for (const m of html.matchAll(/href="(\/[^"#]*)(#[^"]*)?"/g)) {
    if (!ROUTES.has(m[1])) left.push(m[1] + (m[2] || ""));
  }
  const uniq = [...new Set(left)];
  bad += uniq.length;
  console.log(`${rel.padEnd(32)} ${uniq.length ? "DEAD: " + uniq.join(" ") : "every internal link resolves"}`);
}
process.exit(bad ? 1 : 0);
