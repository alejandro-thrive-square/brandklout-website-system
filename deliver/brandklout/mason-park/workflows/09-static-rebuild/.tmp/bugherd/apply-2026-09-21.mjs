// The 2026-09-21 BugHerd round's page edits (notes #78-#109, plus #3 and #66
// which are answers, not edits). Idempotent: a replacement whose old text is
// gone and whose new text is present counts as done.
//
//   cd .tmp/bugherd && node apply-2026-09-21.mjs
//
// The photographs the agency attached come in first, through
// import-2026-09-21.sh; this script only places them. The CSS and JS halves
// (#87 #90 #93 and the phone feedback) are hand edits in home/assets, at the
// end of site.css and site.js -- see the runbook.
//
// WHAT THIS ROUND IS. Thirty-four open notes, and they fall into six groups:
//
//   HOURS (#78 #83).   The practice is open Mon-Wed 9-6 and Thu 9-5, not
//     Mon/Wed 9-6 and Tue/Thu 8-5. That string is in five different shapes on
//     229 pages -- the topbar note, the invitation's fact list, the footer's
//     day rows, the ad pages' own list, and the openingHoursSpecification in
//     every page's JSON-LD. All five move together here.
//
//   THE PHONE (#79 #80 #81 #82 #84 #97 #100).  "The button is enabled, but it
//     doesn't redirect to any page", filed seven times from Windows 10 /
//     Chrome. probe-tel.mjs proves every one of them is a real, uncancelled
//     tel: link: nothing on the page calls preventDefault. A desktop with no
//     handler registered for the tel: scheme does nothing at all, which is
//     what the reviewer saw. The links are left alone -- a phone number must
//     stay a tel: link -- and site.js now copies the number and says so, so a
//     click always does something visible. Not in this file.
//
//   THE FINDER (#94 #95 #96 #98 #99).  Eight of the ten rows on the services
//     finder pointed at #invitation. The agency named five treatment pages;
//     rows 06 and 07 get the same treatment for the same reason. Row 10 (a
//     second opinion) has no page of its own and keeps the anchor.
//
//   FRAMING (#85 #86 #88 #91 #92 #106).  Dr. Sung's portrait was cropped off
//     centre in the file itself, so no object-position could save it: it is
//     re-cut from the Grand Mission source (see album-manifest.json). The two
//     landscape team frames are object-position, in site.css.
//
//   PHOTOGRAPHS (#89 #101 #102 #103 #104 #105 #107 #108 #109).  Eight attached
//     by the agency, placed here. #103 ("match it to the format of #1, do the
//     same for #4 and #6") asks for a photograph on every card of the
//     preventative "Is this you" grid; cards 03 and 06 had none attached, so
//     they take two of the practice's own frames.
//
//   TYPE (#87 #93).  In site.css.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(import.meta.dirname, "..", "..");
const HOME = path.join(ROOT, "home");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, ".tmp", "album-manifest.json"), "utf8"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
function imgTag(key, prefix, { sizes, loading = "lazy", alt } = {}) {
  const m = manifest[key];
  if (!m) throw new Error(`no manifest entry: ${key}`);
  const big = m.sizes[m.sizes.length - 1];
  const p = `${prefix}assets/uploads/2026/09/`;
  return `<img src="${p}${big.file}" srcset="${m.sizes.map((s) => `${p}${s.file} ${s.w}w`).join(", ")}" sizes="${sizes}" alt="${esc(alt ?? m.alt)}" width="${big.w}" height="${big.h}" loading="${loading}" decoding="async">`;
}
const media = (key, prefix, alt) =>
  `<div class="svc-card_media" data-el="mask">${imgTag(key, prefix, { sizes: "(max-width: 899px) 100vw, 33vw", alt })}</div>\n        `;

let changed = 0;
function edit(file, fn) {
  const abs = path.join(HOME, file);
  const before = fs.readFileSync(abs, "utf8");
  const ctx = { html: before, file };
  fn(ctx);
  if (ctx.html !== before) { fs.writeFileSync(abs, ctx.html); console.log(`wrote ${file}`); }
}
function rep(ctx, a, b, note = "", { done = b, optional = false, all = false } = {}) {
  const has = typeof a === "string" ? ctx.html.includes(a) : a.test(ctx.html);
  if (!has) {
    if (done && ctx.html.includes(done)) return;
    if (optional) return;
    throw new Error(`${ctx.file}: not found ${note}: ${String(a).slice(0, 110)}`);
  }
  if (typeof a === "string") ctx.html = all ? ctx.html.split(a).join(b) : ctx.html.replace(a, b);
  else ctx.html = ctx.html.replace(a, b);
  changed++;
  console.log(`  ${ctx.file}: ${note || String(a).slice(0, 60)}`);
}

/* =======================================================================
   #78 and #83 — the opening hours, on every page.
   "9am - 6pm M-W, Th 9am - 5pm", with the screenshot of the practice's own
   Monday-to-Thursday list attached to #83.
   ==================================================================== */
const HOURS = [
  // The topbar strip.
  [`topbar_note">Mon &amp; Wed 9-6 &middot; Tue &amp; Thu 8-5 &middot; Fri&ndash;Sun closed`,
   `topbar_note">Mon&ndash;Wed 9-6 &middot; Thu 9-5 &middot; Fri&ndash;Sun closed`],
  // The invitation chapter's fact list.
  [`Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b>`,
   `Mon to Wed <b>9am to 6pm</b><br>Thu <b>9am to 5pm</b><br>Fri to Sun <b>Closed</b>`],
  // The footer's day rows.
  [`<li class="hours_row"><span>Tuesday</span><strong>8am - 5pm</strong></li>`,
   `<li class="hours_row"><span>Tuesday</span><strong>9am - 6pm</strong></li>`],
  [`<li class="hours_row"><span>Thursday</span><strong>8am - 5pm</strong></li>`,
   `<li class="hours_row"><span>Thursday</span><strong>9am - 5pm</strong></li>`],
  // The contact page's ledger, which is its own shape and exists nowhere else.
  // verify-2026-09-21.mjs is what found it: it reads the rendered text of the
  // page for "8am" rather than trusting a list of known shapes.
  [`<li><b>Tuesday</b><span>8am to 5pm</span></li>`, `<li><b>Tuesday</b><span>9am to 6pm</span></li>`],
  [`<li><b>Thursday</b><span>8am to 5pm</span></li>`, `<li><b>Thursday</b><span>9am to 5pm</span></li>`],
  // The ad pages' own list.
  [`<li><span>Tuesday</span><b>8am to 5pm</b></li>`, `<li><span>Tuesday</span><b>9am to 6pm</b></li>`],
  [`<li><span>Thursday</span><b>8am to 5pm</b></li>`, `<li><span>Thursday</span><b>9am to 5pm</b></li>`],
  // Every page's JSON-LD. Google reads this one, and a wrong day here is a
  // wrong day in the knowledge panel.
  [`"dayOfWeek":["Monday","Wednesday"],"opens":"09:00","closes":"18:00"},{"@type":"OpeningHoursSpecification","dayOfWeek":["Tuesday","Thursday"],"opens":"08:00","closes":"17:00"}`,
   `"dayOfWeek":["Monday","Tuesday","Wednesday"],"opens":"09:00","closes":"18:00"},{"@type":"OpeningHoursSpecification","dayOfWeek":["Thursday"],"opens":"09:00","closes":"17:00"}`],
];

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "assets") out.push(...walk(p)); }
    else if (e.name.endsWith(".html")) out.push(path.relative(HOME, p));
  }
  return out;
}
const pages = walk(HOME);
let hoursTouched = 0;
for (const file of pages) {
  const abs = path.join(HOME, file);
  let html = fs.readFileSync(abs, "utf8");
  const before = html;
  for (const [a, b] of HOURS) html = html.split(a).join(b);
  if (html !== before) { fs.writeFileSync(abs, html); hoursTouched++; }
}
console.log(`#78/#83 hours: rewrote ${hoursTouched} of ${pages.length} pages`);
for (const [a] of HOURS) {
  const left = pages.filter((f) => fs.readFileSync(path.join(HOME, f), "utf8").includes(a));
  if (left.length) throw new Error(`hours not fully replaced (${left.length} pages): ${a.slice(0, 60)}`);
}

/* =======================================================================
   #85 #88 #92 #106 — Dr. Sung's portrait, on all 37 pages that carry it.
   The picture is re-cut (import-2026-09-21.sh) and the KEY CHANGED, from
   dr-sung-standing to dr-sung-standing-2. That is not tidiness: upload-media.mjs
   matches the live library BY BASENAME and skips anything already there, so a
   re-cut published under the old filename uploads as a no-op and staging keeps
   serving the old crop -- which is exactly what the first push of this round
   did. A re-cut picture needs a new name.
   ==================================================================== */
{
  let n = 0;
  for (const file of pages) {
    const abs = path.join(HOME, file);
    let html = fs.readFileSync(abs, "utf8");
    // The size suffix is what marks the OLD name: the new one is
    // mp-dr-sung-standing-2-410x546, so "-2-" never matches \d+x\d+ and a
    // second run is a no-op. Matching a bare digit does not have that
    // property, and turned every reference into -2-2- the first time.
    const next = html.replace(/mp-dr-sung-standing-(\d+x\d+)/g, "mp-dr-sung-standing-2-$1");
    if (next === html) continue;
    if (next !== html) { fs.writeFileSync(abs, next); n++; }
  }
  console.log(`#85/#88/#92/#106 portrait: renamed on ${n} page(s)`);
  const left = pages.filter((f) => /mp-dr-sung-standing-\d+x/.test(fs.readFileSync(path.join(HOME, f), "utf8")));
  if (left.length) throw new Error(`old portrait name still on ${left.length} page(s)`);
}

/* =======================================================================
   #94 #95 #96 #98 #99 — the services finder rows point at their treatment.
   The row stays an <a> with data-img/data-caption, so hovering it still
   swaps the sticky panel (elevate.js binds mouseenter and never calls
   preventDefault); only where the click lands changes.
   ==================================================================== */
edit("our-services/index.html", (c) => {
  const row = (img, href, note) =>
    rep(c, `<a class="el-finder_row" href="#invitation" data-img="${img}"`,
           `<a class="el-finder_row" href="${href}" data-img="${img}"`, note,
           { done: `<a class="el-finder_row" href="${href}" data-img="${img}"` });
  row("pain", "/services/root-canal-therapy/", "#94 row 02 -> root canal therapy");
  row("chip", "/services/bonding/", "#95 row 03 -> bonding");
  row("missing", "/services/dental-implant-restorations/", "#96 row 04 -> implant restorations");
  row("anxious", "/services/sedation-dentistry/", "#98 row 08 -> sedation dentistry");
  row("wisdom", "/services/extractions/", "#99 row 09 -> extractions");
  // Not named by the agency, same defect, same answer.
  row("cracked", "/services/composite-fillings/", "row 06 -> composite fillings");
  row("jaw", "/services/tmj-tmd/", "row 07 -> TMJ and TMD");
  // Row 10 is a free second opinion. There is no page for it; it keeps the
  // anchor to the invitation, which is where that conversation starts.
});

/* =======================================================================
   #89 — About, the pair: the agency's own photograph of two patients going
   through a plan on the sofa, in place of the team at the front desk.
   ==================================================================== */
edit("about-us/index.html", (c) => {
  rep(c, /<figure class="el-pair_frame is-left"><img src="\.\.\/assets\/uploads\/2026\/09\/mp-team-front-desk-[^>]*><\/figure>/,
    `<figure class="el-pair_frame is-left">${imgTag("sofa-tablet-pair", "../", { sizes: "50vw" })}</figure>`,
    "#89 the pair's left frame", { done: "mp-sofa-tablet-pair-" });
  // The pair is now a waiting room and the desk, so the line and the label say so.
  rep(c, `<section class="ch el-pair" aria-label="The front desk and a treatment room">`,
    `<section class="ch el-pair" aria-label="The waiting room and the front desk">`, "#89 label");
  rep(c, `<p class="el-pair_line">The desk, <em>and the rooms.</em></p>`,
    `<p class="el-pair_line">The wait, <em>and the desk.</em></p>`, "#89 line");
});

/* =======================================================================
   Preventative dentistry — #101 #102 #103 #104 #105 #107.
   ==================================================================== */
edit("services/preventative-dentistry/index.html", (c) => {
  const P = "../../";
  // #101  Card 01, persistent bad breath: the agency's frame, not a hygienist.
  rep(c, /<div class="svc-card_media" data-el="mask"><img src="\.\.\/\.\.\/assets\/uploads\/2026\/09\/mp-hygienist-working-1536x2046\.jpg"[^>]*><\/div>/,
    `<div class="svc-card_media" data-el="mask">${imgTag("stock-bad-breath", P, { sizes: "(max-width: 899px) 100vw, 33vw" })}</div>`,
    "#101 qualify card 01", { done: "mp-stock-bad-breath-" });
  // #102  Card 02, bleeding or swollen gums.
  rep(c, `<article class="svc-card">
        <div class="svc-card_body">
          <span class="svc-card_no">02</span>`,
    `<article class="svc-card">
        ${media("stock-bleeding-gums", P)}<div class="svc-card_body">
          <span class="svc-card_no">02</span>`,
    "#102 qualify card 02", { done: "mp-stock-bleeding-gums-" });
  // #103  Card 03, loose or shifting teeth. No frame was attached; this is the
  // practice's own examination photograph, which is what a shifting tooth gets.
  rep(c, `<article class="svc-card">
        <div class="svc-card_body">
          <span class="svc-card_no">03</span>`,
    `<article class="svc-card">
        ${media("hygienist-loupes", P)}<div class="svc-card_body">
          <span class="svc-card_no">03</span>`,
    "#103 qualify card 03", { done: "mp-hygienist-loupes-" });
  // #104  Card 04, pain or sensitivity.
  rep(c, `<article class="svc-card">
        <div class="svc-card_body">
          <span class="svc-card_no">04</span>`,
    `<article class="svc-card">
        ${media("stock-toothache", P)}<div class="svc-card_body">
          <span class="svc-card_no">04</span>`,
    "#104 qualify card 04", { done: "mp-stock-toothache-" });
  // #103, second half: card 06 is the recall panel. "Every 6 months" is a
  // booking, so it takes the front counter.
  rep(c, `<article class="svc-card is-price">
        <div class="svc-card_body">
          <p class="svc-price">Every 6 months`,
    `<article class="svc-card is-price">
        ${media("checkin-counter", P)}<div class="svc-card_body">
          <p class="svc-price">Every 6 months`,
    "#103 qualify card 06", { done: "mp-checkin-counter-" });
  // #105  Why, card 02: gum disease caught early.
  rep(c, `<article class="svc-card">
        <div class="svc-card_body">
          <h3 class="svc-card_name">Gum disease caught early</h3>`,
    `<article class="svc-card">
        ${media("stock-gingivitis", P)}<div class="svc-card_body">
          <h3 class="svc-card_name">Gum disease caught early</h3>`,
    "#105 why card 02", { done: "mp-stock-gingivitis-" });
  // Not a note. #107 puts the agency's photograph of the front desk on the
  // phone into the path, and card 05 of the grid above it was already a
  // photograph of the same person, on the same phone, against the same wall
  // (mp-desk-call-4). Two of those on one page reads as a mistake, so card 05
  // takes an examination instead -- which is closer to "jaw soreness" anyway.
  rep(c, /<div class="svc-card_media" data-el="mask"><img src="\.\.\/\.\.\/assets\/uploads\/2026\/09\/mp-desk-call-4-1536x2046\.jpg"[^>]*><\/div>/,
    `<div class="svc-card_media" data-el="mask">${imgTag("dentist-assistant", P, { sizes: "(max-width: 899px) 100vw, 33vw" })}</div>`,
    "qualify card 05 (away from #107's duplicate)", { done: "mp-dentist-assistant-" });
  // #107  The path, card 01: the front desk, the agency's own frame.
  rep(c, /<div class="pa-shot"><img src="\.\.\/\.\.\/assets\/uploads\/2026\/09\/mp-team-front-desk-[^>]*><\/div>/,
    `<div class="pa-shot">${imgTag("desk-call-6", P, { sizes: "(max-width: 899px) 80vw, 26rem" })}</div>`,
    "#107 path card 01", { done: "mp-desk-call-6-" });
});

/* =======================================================================
   Oral cancer screening — #108 #109.
   ==================================================================== */
edit("services/oral-cancer-screening/index.html", (c) => {
  const P = "../../";
  // #108  Why, card 01: early is the whole thing.
  rep(c, /<div class="svc-card_media" data-el="mask"><img src="\.\.\/\.\.\/assets\/uploads\/2026\/09\/mp-dentist-handheld-2-1536x2046\.jpg"[^>]*><\/div>/,
    `<div class="svc-card_media" data-el="mask">${imgTag("clinical-pair-senior", P, { sizes: "(max-width: 899px) 100vw, 33vw" })}</div>`,
    "#108 why card 01", { done: "mp-clinical-pair-senior-" });
  // #109  Why, card 04: it is documented.
  rep(c, `<article class="svc-card">
        <div class="svc-card_body">
          <h3 class="svc-card_name">It is documented</h3>`,
    `<article class="svc-card">
        ${media("schedule-screen-2", P)}<div class="svc-card_body">
          <h3 class="svc-card_name">It is documented</h3>`,
    "#109 why card 04", { done: "mp-schedule-screen-2-" });
});

console.log(`\n${changed} replacements + ${hoursTouched} pages of hours.`);
