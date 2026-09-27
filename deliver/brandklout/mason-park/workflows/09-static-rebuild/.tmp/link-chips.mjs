// ===========================================================================
// A treatment chip in the services catalogue becomes a link the day its
// page exists, and not before.
//
// The chips on /our-services/ were shipped as dashed `<span class=
// "el-tabs_chip">` because none of the treatment pages existed yet and the
// client's instruction was "remove the links that don't exist in the nav
// bar". The stylesheet already carries both states -- `span.el-tabs_chip`
// is the dashed placeholder, `a.el-tabs_chip` has the solid border and the
// accent hover -- so this only has to swap the element.
//
// Run it after every stamp-service.mjs batch. It is idempotent: a chip
// whose page is gone reverts to a span, so this is the one place the
// catalogue's link state is decided.
//
//   node link-chips.mjs           # rewrite
//   node link-chips.mjs --check   # report only
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "home");
const CHECK = process.argv.includes("--check");

// Chip label (exactly as it appears in the HTML, entities and all) -> slug.
// The labels are the client's own wording from the approved catalogue; do
// not tidy them here, or the match silently stops firing.
const CHIPS = new Map([
  ["Cleanings and exams", "preventative-dentistry"],
  ["Oral cancer screening", "oral-cancer-screening"],
  ["Hygiene education", "dental-hygiene-education"],
  ["Mouth guards", "mouth-guards"],
  ["Night guards", "night-guards"],
  ["Fluoride", "fluoride-treatment"],
  ["Sealants", "sealants"],
  ["Smile makeovers", "cosmetic-dentistry"],
  ["Bonding", "bonding"],
  ["Porcelain veneers", "porcelain-veneers"],
  ["Whitening", "whitening"],
  ["Invisalign&reg; treatment", "invisalign"],
  ["Invisalign&reg; questions", "invisalign-questions"],
  ["Implant restorations", "dental-implant-restorations"],
  ["Dentures", "dentures"],
  ["Crowns", "dental-crowns"],
  ["Tooth coloured fillings", "composite-fillings"],
  ["Bridges", "bridges"],
  ["Root canal therapy", "root-canal-therapy"],
  ["Deep cleaning", "comprehensive-care"],
  ["Laser dentistry", "laser-dentistry"],
  ["AIRFLOW&reg; ONE", "airflow-one"],
  ["Frenectomy", "frenectomy"],
  ["Extractions", "extractions"],
  ["Wisdom teeth", "wisdom-teeth"],
  ["Implant placement", "dental-implant-placement"],
  ["Crown lengthening", "crown-lengthening"],
  ["Bone grafting", "bone-grafting"],
  ["Sedation dentistry", "sedation-dentistry"],
  ["Emergency dentist", "emergency-dentist"],
  ["TMJ and TMD", "tmj-tmd"],
]);

const exists = (slug) => fs.existsSync(path.join(SITE, "services", slug, "index.html"));

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

let linked = 0, pending = [], unknown = [];
for (const file of walk(SITE).filter((f) => f.endsWith("index.html"))) {
  const before = fs.readFileSync(file, "utf8");
  if (!before.includes("el-tabs_chip")) continue;
  const after = before.replace(
    /<(span|a)\b[^>]*class="el-tabs_chip"[^>]*>([\s\S]*?)<\/\1>/g,
    (whole, _tag, label) => {
      const slug = CHIPS.get(label.trim());
      if (!slug) { unknown.push(label.trim()); return whole; }
      if (!exists(slug)) { pending.push(label.trim()); return `<span class="el-tabs_chip">${label}</span>`; }
      linked++;
      return `<a class="el-tabs_chip" href="/services/${slug}/">${label}</a>`;
    },
  );
  if (after !== before && !CHECK) fs.writeFileSync(file, after);
  if (after !== before && CHECK) console.log("would rewrite " + path.relative(SITE, file));
}

console.log(`${linked} chip(s) link to a page that exists`);
if (pending.length) console.log(`${pending.length} still dashed: ${[...new Set(pending)].join(", ")}`);
if (unknown.length) console.log(`! ${unknown.length} chip label(s) not in CHIPS -- add them: ${[...new Set(unknown)].join(", ")}`);
