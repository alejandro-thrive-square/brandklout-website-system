// Pulls the images the site needs out of the 911-file extraction into
// final-site/assets under readable names. Every source path below is a real
// file from drnahlah.com — nothing here is stock bought for this rebuild.
//
// Usage: node copy-assets.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
// 03-graphic-resources is 708MB and was left in the `main` checkout when 04-design
// was split into the bk-dr-nahlah worktree, so the sibling path below resolves to
// nothing there and every copy silently "goes missing". Point DOWNLOADS at the
// uploads root in whichever checkout actually holds the extraction:
//   DOWNLOADS=".../03-graphic-resources/.tmp/downloads/wp-content/uploads" node copy-assets.mjs
const DL = process.env.DOWNLOADS
  ? path.resolve(process.env.DOWNLOADS)
  : path.resolve(SRC, "../../../03-graphic-resources/.tmp/downloads/wp-content/uploads");
if (!fs.existsSync(DL)) {
  console.error(`no extraction at ${DL}\nset DOWNLOADS to the uploads root that holds it.`);
  process.exit(1);
}
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
  "office-room.jpg": "2021/02/dental-office.jpg",
  "tech-advanced.jpg": "2022/03/advanced_tech.jpg",
  "tech-hero.jpg": "2022/03/advanced_tech_hero.jpg",
  "dr-headshot.png": "2025/04/DGT_Dr_Nahlah_Headshot_White-Coat_V2.png",
  // team portraits — each published on /our-team/ under that person's own name,
  // which is what makes them safe to caption (see the photo-provenance rule).
  "team-group.jpg": "2022/03/Untitled-9.jpg",
  "team-venita.jpg": "2022/01/thumb-venita.jpg",
  "team-junko.jpg": "2022/01/thumb-junko.jpg",
  "team-helia.jpg": "2022/01/thumb-helia.jpg",
  "team-hana.png": "2022/05/Hana.png",
  "team-basma.jpg": "2022/05/basma-profile3.jpg",
  // batch 2 — cosmetic hub, whitening, crowns & bridges, oral surgery
  "cosmetic-transformation.jpg": "2022/03/patient_heroo.jpg",
  "whitening-graphic.png": "2019/11/teeth-whitening-graphic.png",
  "crown-model.jpg": "2021/02/dental-crowns-model-2.jpg",
  "bridge-model.jpg": "2021/02/dental-bridge-model-1.jpg",
  "bridge-model-alt.png": "2019/11/dental-bridge-model.png",
  "cost-calculating.png": "2021/02/calculating-cost-of-dental-implants.png",
  "case-porcelain-1-before.jpg": "2025/02/porcelain-001-b4.jpg",
  "case-porcelain-1-after.jpg": "2025/02/porcelain-001-after.jpg",
  "case-makeover-1-before.jpg": "2025/02/makeover-001-b4.jpg",
  "case-makeover-1-after.jpg": "2025/02/makeover-001-after.jpg",
  // batch 3 — emergency, conditions, fixed vs removable, implant FAQ
  "emergency-patient.jpg": "2021/03/patient_interaction.jpg",
  "emergency-sign.png": "2021/02/emergency-sign.png",
  // A REAL radiograph photograph. The practice's own `2021/02/dental-xray.png`
  // (copied by the bulk step as `xray.png`) is a 2000x1000 palette PNG whose
  // opaque fraction is 0.00 - entirely transparent. It loads, so every
  // "no broken images" check passes; it draws nothing, so it shipped as an empty
  // box in eight cards until 2026-08-19. Curated under a short name here because
  // the source path is 265 chars and blows Windows MAX_PATH from some tools.
  // See `image-substance.py`, which now gates this class of defect.
  "xray-consult.jpg": "2024/06/Doctor-showing-patient-X-ray-picture-and-educational-model-of-dental-implant-in-clinic-closeup-.jpg",
  "conditions-patient.jpg": "2025/02/patient_hero5.jpg",
  "dentures-model.png": "2021/02/dentures-model.png",
  "dentures-implant-graphic.png": "2021/02/implant-supported-dentures-graphic.png",
  "full-arch-graphic.png": "2021/02/full-arch-dental-implants.png",
  "multi-implant-model.png": "2021/07/multiple-dental-implant-model.png",
  "case-fullarch-3-before.jpg": "2025/02/case-3-all-on-4-implants-before.jpg",
  "case-fullarch-3-after.jpg": "2025/02/case-3-all-on-4-implants-after.jpg",
  "case-fullarch-4-before.jpg": "2025/02/case-4-all-on-4-implants-before.jpg",
  "case-fullarch-4-after.jpg": "2025/02/case-4-all-on-4-implants-after.jpg",
  // batch 4 — first visit, financing, referrals, legal
  "tooth-model.png": "2019/11/tooth-model.png",
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

/* ---------------------------------------------------------------------------
   THE FULL CONTENT SET.

   The curated MAP above is the set of images the redesign chose. The brief is
   now that the rebuild carries the same assets as drnahlah.com, so this pass
   copies EVERY content image the 33 real pages reference — 225 of them — under
   its own filename, and the curated names above continue to work on top.

   What it deliberately skips:
     - the 43 blog posts and 2 category archives (kind !== "page"), which belong
       to the migration modules, not to the design package
     - site chrome: anything appearing on more than half of the 78 scraped pages
       is the logo or a footer mark, not page content
     - WordPress size variants (`name-800x600.jpg`, `name-scaled.jpg`), which
       `pick()` already folds back into their master

   Set SCRAPE if the content extract is not in the sibling 01-content-intake.
--------------------------------------------------------------------------- */
const SCRAPE = path.resolve(
  process.env.SCRAPE || path.join(SRC, "../../../01-content-intake/.tmp/current-site-scrape")
);
const strip = (f) => f.replace(/-\d+x\d+(?=\.\w+$)/, "").replace(/-scaled(?=\.\w+$)/, "");
let bulk = 0, bulkSkipped = 0;
if (fs.existsSync(path.join(SCRAPE, "data"))) {
  const recs = fs.readdirSync(path.join(SCRAPE, "data"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(SCRAPE, "data", f), "utf8")));
  const pageCount = recs.length;
  const seenOn = new Map();
  for (const r of recs)
    for (const s of new Set((r.images || []).map((i) => i.src)))
      seenOn.set(s, (seenOn.get(s) || 0) + 1);

  // Two different upload months can hold the same basename, so a flat copy would
  // silently overwrite one with the other. Disambiguate by prefixing the month.
  const claimed = new Map();
  for (const r of recs.filter((x) => x.kind === "page")) {
    for (const img of r.images || []) {
      if ((seenOn.get(img.src) || 0) > pageCount / 2) continue;      // chrome
      const rel = decodeURIComponent(img.src).split("/wp-content/uploads/")[1];
      if (!rel) continue;
      const master = strip(rel);
      let dest = path.basename(master);
      const prior = claimed.get(dest);
      if (prior && prior !== master) {
        const m = master.split("/");
        dest = `${m[0]}-${m[1]}-${path.basename(master)}`;           // 2021-02-name.jpg
      }
      claimed.set(dest, master);
      if (MAP[dest]) continue;                                       // curated name wins
      MAP[dest] = master;
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

// GSAP is vendored rather than pulled from the CDN so the package runs offline
// and headless verification is deterministic. It lives in site-src/vendor/ and is
// COMMITTED — final-site/assets/ is gitignored, so a vendor copy that only ever
// existed there leaves a fresh clone unable to run its own gates. That is exactly
// what happened to this worktree: every page reported "no console errors" as a
// 404 storm because the libraries were never in the tree.
const VENDOR = path.join(SRC, "vendor");
let vend = 0;
if (fs.existsSync(VENDOR)) {
  for (const lib of fs.readdirSync(VENDOR)) {
    const from = path.join(VENDOR, lib);
    if (!fs.statSync(from).isDirectory()) continue;
    const to = path.join(OUT, lib);
    fs.mkdirSync(to, { recursive: true });
    for (const f of fs.readdirSync(from)) { fs.copyFileSync(path.join(from, f), path.join(to, f)); vend++; }
  }
}

let ok = 0; const missing = [];
for (const [dest, rel] of Object.entries(MAP)) {
  const src = pick(rel) || path.join(DL, rel);
  if (!fs.existsSync(src)) { missing.push(dest + " <- " + rel); continue; }
  fs.copyFileSync(src, path.join(OUT, dest));
  ok++;
}
console.log(`copied ${ok} assets (+${own} from site-src/assets, +${vend} vendored) -> ${path.relative(process.cwd(), OUT)}`);
if (missing.length) console.log("MISSING:\n  " + missing.join("\n  "));
