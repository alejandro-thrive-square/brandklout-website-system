// ===========================================================================
// THE SECOND ELEVATION OF THE TREATMENT PAGES, 2026-09-10: the photographs.
//
// Two swaps on every page under home/services/, then expand-img.mjs:
//
//   1. The Treatment chapter's overlap frame gets a photograph OF THE
//      TREATMENT -- a crown on a model, an aligner, an extracted tooth --
//      instead of a generic frame of the practice. The client's note: "if you
//      need to add images use stock photos related to the content". The
//      frames are Unsplash (Unsplash License), registered in
//      album-manifest.json under `stock-*` with their photo ids, cut by
//      stock-search.mjs + the one-off in the runbook.
//   2. The provider band's portrait becomes `dr-sung`: Dr. Sung's own
//      practice site (grandmissiondentistry.com) publishes a 3703x4000
//      portrait, so the 230x300 WordPress thumbnail retires.
//
// Idempotent: a page already carrying the stock frame or the new portrait is
// left alone. Pages are matched by directory name; a page with no entry in
// STOCK keeps its practice photograph and says so.
//
//   node apply-stock.mjs            # every page
//   node apply-stock.mjs --check    # report only
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVICES = path.join(HERE, "..", "home", "services");
const CHECK = process.argv.includes("--check");

const STOCK = {
  "airflow-one": "stock-hose",
  bonding: "stock-exam-smile",
  "bone-grafting": "stock-xray",
  bridges: "stock-bridge",
  "composite-fillings": "stock-instruments",
  "comprehensive-care": "stock-two-dentists",
  "cosmetic-dentistry": "stock-red-smile",
  "crown-lengthening": "stock-crown",
  "dental-crowns": "stock-crown",
  "dental-hygiene-education": "stock-brush-wood",
  "dental-implant-placement": "stock-implant",
  "dental-implant-restorations": "stock-implant-scan",
  dentures: "stock-denture",
  "emergency-dentist": "stock-compress",
  extractions: "stock-tooth",
  "fluoride-treatment": "stock-brush-paste",
  frenectomy: "stock-exam-room",
  invisalign: "stock-aligner-fit",
  "invisalign-questions": "stock-aligner",
  "laser-dentistry": "stock-laser",
  "mouth-guards": "stock-mouthguard",
  "night-guards": "stock-nightguard",
  "oral-cancer-screening": "stock-exam-mirror",
  "porcelain-veneers": "stock-veneers",
  "preventative-dentistry": "stock-brush-black",
  "root-canal-therapy": "stock-tooth-model",
  sealants: "stock-molar",
  "sedation-dentistry": "stock-calm-chair",
  "tmj-tmd": "stock-jaw",
  whitening: "stock-white-smile",
  "wisdom-teeth": "stock-tray",
};

const IMG = /<img\b[^>]*>/;
let touched = [];
for (const slug of fs.readdirSync(SERVICES)) {
  const file = path.join(SERVICES, slug, "index.html");
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  const before = html;
  const notes = [];

  // 1. the treatment overlap
  const stock = STOCK[slug];
  if (!stock) notes.push("no stock frame mapped");
  else if (html.includes(`mp-${stock}-`)) notes.push("stock frame already in");
  else {
    const sec = html.indexOf('class="ch ch-treatment"');
    const media = sec < 0 ? -1 : html.indexOf('class="svc-overlap_media"', sec);
    const end = media < 0 ? -1 : html.indexOf("</div>", media);
    if (media < 0) notes.push("NO overlap in the treatment chapter");
    else {
      const chunk = html.slice(media, end);
      if (!IMG.test(chunk)) notes.push("overlap has no <img>");
      else {
        const next = chunk.replace(IMG, `{{img slug="${stock}" sizes="(max-width: 899px) 100vw, 62vw"}}`);
        html = html.slice(0, media) + next + html.slice(end);
        notes.push("overlap -> " + stock);
      }
    }
  }

  // 2. the portrait
  if (html.includes("DrWilliamSung-230x300-1.webp")) {
    html = html.replace(/<img src="[^"]*DrWilliamSung-230x300-1\.webp"[^>]*>/, '{{img slug="dr-sung" sizes="(max-width: 767px) 100vw, 24rem"}}');
    notes.push("portrait -> dr-sung");
  }

  if (html !== before) {
    touched.push(file);
    if (!CHECK) fs.writeFileSync(file, html);
  }
  console.log(slug.padEnd(30), notes.join("; "));
}

if (!CHECK && touched.length) {
  execFileSync(process.execPath, [path.join(HERE, "expand-img.mjs"), ...touched], { stdio: "inherit" });
  console.log(`\n${touched.length} page(s) rewritten and expanded`);
} else console.log(`\n${touched.length} page(s) would change`);
