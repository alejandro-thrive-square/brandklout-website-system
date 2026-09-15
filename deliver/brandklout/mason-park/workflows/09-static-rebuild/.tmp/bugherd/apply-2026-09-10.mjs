// The structural half of the 2026-09-10 BugHerd round (tasks-2026-09-10.json):
// the edits that touch many pages or lines carrying a long srcset, which a
// hand edit gets wrong. The copy changes were made by hand in home/. Run once;
// every step is idempotent so a re-run is harmless.
//
//   node apply-2026-09-10.mjs
//
//   #37/#41  the credential strip leaves every inner page (it stays on the home)
//   #16      Dr. Sung's crossed-arms portrait -> dr-sung-standing, everywhere
//   #21      the people band on the home: team-front-desk -> team-huddle
//   #40      About's invitation shot: the cropped-head tablet frame -> desk-checkin-pair (landscape)
//   #45      the team page's pane: team-pair-window -> team-window-smile (portrait column)
//   #44      the team page's "The Named" chapter is removed outright
//   #36/#48  the two seals carry the tree, not "MP" / a star
import fs from "node:fs";
import path from "node:path";

const HOME = path.join(import.meta.dirname, "..", "..", "home");
const manifest = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "..", "album-manifest.json"), "utf8"));

const pages = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === "index.html") pages.push(p);
  }
})(HOME);

const rel = (p) => path.relative(HOME, p).replace(/\\/g, "/");
const prefix = (p) => "../".repeat(rel(p).split("/").length - 1);
const read = (p) => fs.readFileSync(p, "utf8");
const write = (p, s, before) => { if (s !== before) { fs.writeFileSync(p, s); return true; } return false; };

/** An <img> for a manifest key, srcset at every width, largest as src. */
function img(p, key, alt, sizes, extra = "") {
  const e = manifest[key];
  if (!e) throw new Error(`no manifest entry ${key}`);
  const up = `${prefix(p)}assets/uploads/2026/09/`;
  const big = e.sizes[e.sizes.length - 1];
  const set = e.sizes.map((s) => `${up}${s.file} ${s.w}w`).join(", ");
  return `<img src="${up}${big.file}" srcset="${set}" sizes="${sizes}" alt="${alt}" width="${big.w}" height="${big.h}" loading="lazy" decoding="async"${extra}>`;
}

const log = [];
for (const p of pages) {
  const before = read(p);
  let s = before;
  const r = rel(p);

  // #37/#41 - the strip goes from every page but the homepage.
  if (r !== "index.html") {
    // Global, and tolerant of \r: a few pages carry a second strip inside a
    // chapter, and several files mix CRLF and LF line endings.
    s = s.replace(/\r?\n?<div class="pr-badges">[\s\S]*?<\/ul>\s*<\/div>\s*<\/div>[ \t]*\r?\n/g, "\n");
  }

  // #16 - the standing portrait replaces both the crossed-arms Grand Mission
  // portrait (29 provider bands, same four widths so the srcset shape holds)
  // and the old 230x300 thumbnail (home, About, Doctors, Team).
  s = s.replace(/mp-dr-sung-(\d+x\d+)\.jpg/g, "mp-dr-sung-standing-$1.jpg");
  s = s.replace(/<img src="([^"]*)uploads\/2020\/04\/DrWilliamSung-230x300-1\.webp" alt="Dr\. William Sung"[^>]*>/g, (m, pre) =>
    img(p, "dr-sung-standing", "Dr. William Sung", "(max-width: 699px) 100vw, (max-width: 1023px) 14rem, 30vw"));

  // #21 - the band on the home.
  if (r === "index.html") {
    s = s.replace(/<img src="[^"]*mp-team-front-desk-1536x1153\.jpg"[^>]*alt="The Mason Park Dental team gathered at the front desk"[^>]*>(?=\s*<div class="pe-band-in">)/,
      img(p, "team-huddle", manifest["team-huddle"].alt, "100vw"));
  }

  // #40 - About's invitation shot, a 16:9 frame, gets a landscape photograph.
  if (r === "about-us/index.html") {
    s = s.replace(/<img src="[^"]*mp-desk-tablet-1536x2046\.jpg"[^>]*>(?=\s*<figcaption>Suite 104A)/,
      img(p, "desk-checkin-pair", manifest["desk-checkin-pair"].alt, "(max-width: 899px) 100vw, 40vw"));
    s = s.replace(/<figcaption>Suite 104A, on the ground floor\. Free parking at the door\.<\/figcaption>(?=\s*<\/figure>\s*<div class="iv-map">)/,
      "<figcaption>Checking in at the front desk, suite 104A. Free parking at the door.</figcaption>");
    // #36 - the seal's mark is the tree.
    s = s.replace(/<div class="el-seal is-low" data-text="Mason Park Dental · Katy, Texas · Since the first tooth · " data-mark="MP"><\/div>/,
      `<div class="el-seal is-low" data-text="Mason Park Dental · Katy, Texas · Since the first tooth · "><img src="../assets/uploads/2026/09/mp-tree-mark.png" alt="" width="304" height="464" loading="lazy" decoding="async"></div>`);
  }

  if (r === "our-team/index.html") {
    // #45 - the pane's narrow column wants a portrait frame.
    s = s.replace(/<img src="[^"]*mp-team-pair-window-1536x1153\.jpg"[^>]*>(?=\s*<figcaption>Two of the clinical team, between appointments<\/figcaption>)/,
      img(p, "team-window-smile", manifest["team-window-smile"].alt, "(max-width: 899px) 100vw, 30vw"));
    s = s.replace(/<figcaption>Two of the clinical team, between appointments<\/figcaption>/, "<figcaption>One of the clinical team, between appointments</figcaption>");
    // #44 - The Named, whole, ticker included.
    s = s.replace(/\r?\n<!-- THE NAMED\.[\s\S]*?<section class="ch ch-named"[\s\S]*?<\/section>[ \t]*\r?\n/, "\n");
  }

  if (r === "patient-reviews/index.html") {
    // #48 - the tree, not the star.
    s = s.replace(/<div class="el-seal is-low" data-text="4\.9 stars · 1,037 Google reviews · Katy, Texas · " data-mark="&#9733;"><\/div>/,
      `<div class="el-seal is-low" data-text="4.9 stars · 1,037 Google reviews · Katy, Texas · "><img src="../assets/uploads/2026/09/mp-tree-mark.png" alt="" width="304" height="464" loading="lazy" decoding="async"></div>`);
  }

  if (write(p, s, before)) log.push(r);
}
console.log(`${log.length} pages changed:\n  ${log.join("\n  ")}`);

// Sanity: nothing still points at the files this round retired.
let stale = 0;
for (const p of pages) {
  const s = read(p);
  for (const m of s.matchAll(/DrWilliamSung-230x300|mp-dr-sung-\d|team-front-desk-1536x1153\.jpg"[^>]*alt="The Mason Park Dental team gathered at the front desk"[^>]*>\s*<div class="pe-band-in"|class="ch ch-named"|data-mark="(?:MP|&#9733;)"/g)) {
    stale++; console.log(`  STALE ${rel(p)}: ${m[0].slice(0, 60)}`);
  }
  if (rel(p) !== "index.html" && s.includes('class="pr-badges"')) { stale++; console.log(`  STALE ${rel(p)}: pr-badges still present`); }
}
console.log(stale ? `${stale} stale references` : "no stale references");
