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

const ROUTES = new Set([
  "/", "/about-us/", "/our-doctors/", "/our-team/", "/patient-reviews/",
  "/our-services/", "/services/invisalign/",
  "/new-patients/", "/financing/", "/dental-savings-plan/", "/thank-you/",
]);

const NAV = `<nav class="navbar_menu" id="navbar-menu" aria-label="Main"><ul class="navbar_menu-list"><li class="navbar_item"><a class="navbar_link" href="/">Home</a></li><li class="navbar_item has-dropdown"><a class="navbar_link" href="/about-us/">About</a><ul class="navbar_dropdown-list"><li class="navbar_item"><a class="navbar_link" href="/about-us/">About the Practice</a></li><li class="navbar_item"><a class="navbar_link" href="/our-doctors/">Meet Our Doctors</a></li><li class="navbar_item"><a class="navbar_link" href="/our-team/">Meet Our Team</a></li><li class="navbar_item"><a class="navbar_link" href="/patient-reviews/">Patient Reviews</a></li></ul></li><li class="navbar_item has-dropdown"><a class="navbar_link" href="/our-services/">Services</a><ul class="navbar_dropdown-list"><li class="navbar_item"><a class="navbar_link" href="/our-services/">All Services</a></li><li class="navbar_item"><a class="navbar_link" href="/services/invisalign/">Invisalign</a></li></ul></li><li class="navbar_item has-dropdown"><a class="navbar_link" href="/new-patients/">Patients</a><ul class="navbar_dropdown-list"><li class="navbar_item"><a class="navbar_link" href="/new-patients/">New Patients</a></li><li class="navbar_item"><a class="navbar_link" href="/financing/">Financing</a></li><li class="navbar_item"><a class="navbar_link" href="/dental-savings-plan/">Dental Savings Plan</a></li></ul></li><li class="navbar_item"><a class="navbar_link" href="/patient-reviews/">Reviews</a></li></ul></nav>`;

const CARE = `<ul class="footer_list"><li><a href="/our-services/">All services</a></li><li><a href="/services/invisalign/">Invisalign</a></li><li><a href="/our-doctors/#specialist">Children's dentistry</a></li><li><a href="/our-doctors/">Meet the doctors</a></li><li><a href="/our-team/">Meet the team</a></li><li><a href="/about-us/">About the practice</a></li></ul>`;
const PATIENTS = `<ul class="footer_list"><li><a href="/new-patients/">New patients</a></li><li><a href="/financing/">Financing</a></li><li><a href="/dental-savings-plan/">Dental savings plan</a></li><li><a href="/patient-reviews/">Patient reviews</a></li><li><a href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book online</a></li></ul>`;
const LEGAL = `<div class="footer_legal">\n      &copy; 2026 Mason Park Dental of Katy\n    </div>`;

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
