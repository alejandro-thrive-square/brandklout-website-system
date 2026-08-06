// Pulls the images the site needs out of the 911-file extraction into
// final-site/assets under readable names. Every source path below is a real
// file from drnahlah.com — nothing here is stock bought for this rebuild.
//
// Usage: node copy-assets.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const DL = path.resolve(SRC, "../../../03-graphic-resources/.tmp/downloads/wp-content/uploads");
const OUT = path.resolve(SRC, "..", "final-site", "assets");
fs.mkdirSync(OUT, { recursive: true });

// Prefer the -scaled variant when it exists: it is the largest master WordPress kept.
function pick(rel) {
  const full = path.join(DL, rel);
  const scaled = full.replace(/(\.\w+)$/, "-scaled$1");
  if (fs.existsSync(scaled)) return scaled;
  if (fs.existsSync(full)) return full;
  return null;
}

const MAP = {
  // films
  "hero.mp4": "2022/04/DR-Broll.mp4",
  "broll.mp4": "2025/02/nahlah-broll.mp4",
  // people & practice
  "dr-award.jpg": "2022/01/img-inline-award.jpg",
  "dr-team.jpg": "2022/03/Dr_Nahlah_and_team.jpg",
  "dr-with-patient.jpg": "2022/03/Dr_Nahlah_with_patient.jpg",
  "dr-and-yolanda.jpg": "2022/03/Dr_Nahlah_and_Yolanda.jpg",
  "dr-portrait-alt.jpg": "2022/03/Dr_Esam_Nahlah.jpg",
  "office-outside.jpg": "2022/03/office_outside.jpg",
  "office-hero.jpg": "2022/03/office_hero.jpg",
  "office-wide.jpeg": "2022/01/img-full-width-dental-office-1.jpeg",
  // treatment context
  "sedation-nitrous.png": "2021/02/dental-patient-under-nitrous-oxide-sedation.png",
  "sedation-oral.png": "2021/02/dental-patient-taking-oral-sedation.png",
  "sedation-patient.jpg": "2025/02/sedation-dentistry-patient.jpg",
  "veneers-procedure.png": "2021/02/dental-patient-undergoing-veneers-procedure.png",
  "whitening-procedure.jpg": "2021/02/dental-patient-undergoing-teeth-whitening-procedure.jpg",
  "smile-makeover-patient.png": "2019/11/smile-makeover-patient.png",
  "consult-discussion.jpg": "2021/02/patient-discussing-dental-procedure.jpg",
  "financing-card.jpg": "2019/11/dental-patient-using-credit-card.jpg",
  // patients (all named patients published on the source site)
  "pt-yolanda.jpg": "2022/03/yolanda_dental_patient.jpg",
  "pt-yolanda-transformation.jpg": "2022/03/Yolanda_transformation.jpg",
  "pt-barbara.jpg": "2022/01/pt-barb.jpg",
  "pt-interaction.jpg": "2022/03/patient_interaction_hero.jpg",
  "pt-hero-1.jpg": "2022/03/patient_hero.jpg",
  "pt-hero-2.jpg": "2022/03/patient_hero2.jpg",
  "pt-hero-3.jpg": "2022/03/patient_hero3.jpg",
  "pt-hero-4.jpg": "2022/03/patient_hero4.jpg",
  "pt-interaction-3.jpg": "2022/03/patient_interaction3.jpg",
  "pt-interaction-5.jpg": "2022/03/patient_interaction5.jpg",
  // partner / award marks
  "logo-carecredit.png": "2019/07/carecredit-logo.png",
  "logo-proceed.png": "2019/07/proceed-finance-logo.png",
  "logo-lendingclub.png": "2019/07/logo-lending-club.png",
  "logo-wusa.png": "2019/11/WUSA_LOGO_V2.png",
  // whitening cases
  "case-whitening-1-before.jpg": "2025/02/teeth-whitening-before.jpg",
  "case-whitening-1-after.jpg": "2025/02/teeth-whitening-after.jpg",
  "case-whitening-2-before.jpg": "2025/02/2-teeth-whitening-before-1.jpg",
  "case-whitening-2-after.jpg": "2025/02/2-teeth-whitening-after-1.jpg",
};

// The 2025/05 gallery drop, named inconsistently on the source server.
const CASES = [
  ["ao4-double", "Double-AO4", 14],
  ["ao4-single", "Single-AO4", 2],
  ["veneers", "Veneers", 7],
  ["veneers-implants", "Veneers-and-Implants", 3],
];
for (const [slug, token, n] of CASES) {
  for (let i = 1; i <= n; i++) {
    for (const side of ["before", "after"]) {
      // The server mixes case: "1-Single-AO4-After.jpg", "2-double-AO4-before.jpg".
      const variants = [
        `2025/05/${i}-${token}-${side}.jpg`,
        `2025/05/${i}-${token}-${side[0].toUpperCase() + side.slice(1)}.jpg`,
        `2025/05/${i}-${token.toLowerCase()}-${side}.jpg`,
        `2025/05/${i}-${token.replace("Double", "double")}-${side}.jpg`,
        `2025/05/${i}-${token}-${side.toUpperCase()}.jpg`,
      ];
      const found = variants.map(pick).find(Boolean);
      if (found) MAP[`case-${slug}-${i}-${side}.jpg`] = path.relative(DL, found).replace(/\\/g, "/");
    }
  }
}

// Marks that are not client photography and so are not in the extraction:
// the practice logo and the Google mark that labels the review score. Kept in
// site-src/assets/ so a clean rebuild does not silently drop them.
const OWN = path.join(SRC, "assets");
let own = 0;
if (fs.existsSync(OWN)) {
  for (const f of fs.readdirSync(OWN)) { fs.copyFileSync(path.join(OWN, f), path.join(OUT, f)); own++; }
}

let ok = 0; const missing = [];
for (const [dest, rel] of Object.entries(MAP)) {
  const src = pick(rel) || path.join(DL, rel);
  if (!fs.existsSync(src)) { missing.push(dest + " <- " + rel); continue; }
  fs.copyFileSync(src, path.join(OUT, dest));
  ok++;
}
console.log(`copied ${ok} assets (+${own} from site-src/assets) -> ${path.relative(process.cwd(), OUT)}`);
if (missing.length) console.log("MISSING:\n  " + missing.join("\n  "));
