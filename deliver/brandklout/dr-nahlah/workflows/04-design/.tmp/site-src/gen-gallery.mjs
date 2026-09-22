// Generates pages/smile-gallery.body.html from whatever case pairs actually
// landed in final-site/assets. Run after copy-assets.mjs. Writing this by hand
// would mean 26 near-identical blocks and a guaranteed typo.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(SRC, "..", "final-site", "assets");
const OUT = path.join(SRC, "pages", "smile-gallery.body.html");

/* ---------------------------------------------------------------------------
   CASES COME FROM THE SOURCE PAGE'S ALT TEXT, NOT FROM FILENAMES.

   The first version of this script paired files by name (`case-<set>-<n>-before`),
   which only ever found the 2025/05 drop — 28 of the 52 pairs the client
   publishes. The rest of the gallery is named inconsistently enough that no
   filename rule can read it:

       1.1-.jpg = patient 001 BEFORE      4.2.jpg = patient 004 BEFORE
       1.2.jpg  = patient 001 AFTER       4.1.jpg = patient 004 AFTER

   Patients 004 and 006 have their numbering INVERTED. A filename rule gets
   those two backwards and publishes the after photograph labelled "Before" on
   a dental before/after slider, which is about the worst single error this
   site could ship.

   The client's own alt text is unambiguous and complete — 106 of the 110
   images on /smile-gallery/ carry a "... before" / "... after" marker, and the
   4 that do not are the logo and a hero. Normalising the label (case-folded,
   punctuation collapsed) resolves all 52 pairs with none left half-matched, so
   that is what drives the grid.
--------------------------------------------------------------------------- */
const SCRAPE = path.resolve(
  process.env.SCRAPE || path.join(SRC, "../../../01-content-intake/.tmp/current-site-scrape")
);
const files = new Set(fs.readdirSync(ASSETS));
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const strip = (f) => f.replace(/-\d+x\d+(?=\.\w+$)/, "").replace(/-scaled(?=\.\w+$)/, "");

// family (digits blanked to #) -> how the grid should present it
const FAMILY = {
  "# double ao#":                       ["full-arch", "Double arch",     "Double arch &middot; upper and lower rebuilt on implants"],
  "# single ao#":                       ["full-arch", "Single arch",     "Single arch &middot; one jaw restored on four implants"],
  "all on # patient #":                 ["full-arch", "All-on-4",        "All-on-4 &middot; a full arch on four implants"],
  "full mouth reconstruction patient #":["full-arch", "Full mouth reconstruction", "Full-mouth reconstruction"],
  "smile makeover patient #":           ["makeover",  "Smile makeover",  "Complete smile makeover"],
  "porcelain veneers patient #":        ["veneers",   "Porcelain veneers", "Porcelain veneers across the smile zone"],
  "# veneers":                          ["veneers",   "Porcelain veneers", "Porcelain veneers across the smile zone"],
  "# veneers and implants":             ["combined",  "Veneers + implants", "Veneers combined with implant restoration"],
};

// Resolve a source URL to the file copy-assets actually wrote.
function localName(src) {
  const rel = decodeURIComponent(src).split("/wp-content/uploads/")[1];
  if (!rel) return null;
  for (const cand of [path.basename(strip(rel)), path.basename(rel)]) {
    if (files.has(cand)) return cand;
  }
  return null;
}

const cases = [];
const unresolved = [];
const galleryRecord = path.join(SCRAPE, "data", "smile-gallery.json");
if (fs.existsSync(galleryRecord)) {
  const rec = JSON.parse(fs.readFileSync(galleryRecord, "utf8"));
  const pairs = new Map();
  for (const img of rec.images || []) {
    if (!img.alt) continue;
    const m = norm(img.alt).match(/^(.*?)\s+(before|after|b4)$/);
    if (!m) continue;
    const key = m[1];
    if (!pairs.has(key)) pairs.set(key, {});
    pairs.get(key)[m[2] === "after" ? "after" : "before"] = img.src;
  }
  let n = 0;
  for (const [key, sides] of pairs) {
    if (!sides.before || !sides.after) { unresolved.push(`${key} (only one side)`); continue; }
    const fam = FAMILY[key.replace(/\d+/g, "#").trim()];
    if (!fam) { unresolved.push(`${key} (unknown family)`); continue; }
    const b = localName(sides.before), a = localName(sides.after);
    if (!b || !a) { unresolved.push(`${key} (file not copied)`); continue; }
    const [filter, label, caption] = fam;
    cases.push({ filter, label, i: ++n, b, a, cap: () => caption });
  }
}

// Whitening lives on /teeth-whitening/, not on the gallery page, so it still
// comes from the curated names copy-assets.mjs writes.
for (let i = 1; i <= 30; i++) {
  const b = `case-whitening-${i}-before.jpg`, a = `case-whitening-${i}-after.jpg`;
  if (files.has(b) && files.has(a))
    cases.push({ filter: "whitening", label: "Whitening", i, b, a,
      cap: () => "Professional whitening &middot; in-office" });
}

const dupes = cases.filter((c, i) => cases.findIndex((d) => d.b === c.b) !== i);
if (dupes.length) throw new Error("duplicate case pairs: " + dupes.map((d) => d.b).join(", "));
if (unresolved.length) {
  // Loud, not silent: a dropped case is a case the client paid to photograph.
  console.warn(`WARNING: ${unresolved.length} case(s) not placed:\n  ` + unresolved.join("\n  "));
}

const counts = {};
for (const c of cases) counts[c.filter] = (counts[c.filter] || 0) + 1;

const card = (c) => `      <figure class="ga-item" data-cat="${c.filter}" style="margin:0">
        <div class="pk-ba">
          <img src="assets/${c.b}" alt="Before: ${c.label.toLowerCase()} case ${c.i}" loading="lazy">
          <img class="after" src="assets/${c.a}" alt="After: ${c.label.toLowerCase()} case ${c.i}" loading="lazy">
          <span class="ba-tag b">Before</span><span class="ba-tag a">After</span>
          <div class="ba-line"></div>
          <input type="range" min="0" max="100" value="50" aria-label="Reveal the after photograph for ${c.label.toLowerCase()} case ${c.i}">
        </div>
        <figcaption class="pk-ba-cap">${c.cap(c.i)}</figcaption>
      </figure>`;

const FILTERS = [
  ["all", "All cases", cases.length],
  ["full-arch", "Full arch", counts["full-arch"] || 0],
  ["veneers", "Veneers", counts["veneers"] || 0],
  ["makeover", "Smile makeover", counts["makeover"] || 0],
  ["combined", "Veneers + implants", counts["combined"] || 0],
  ["whitening", "Whitening", counts["whitening"] || 0],
].filter(([, , n]) => n > 0);

const body = `<!-- ==========================================================================
     SMILE GALLERY — GENERATED by site-src/gen-gallery.mjs from the case pairs
     present in final-site/assets. Re-run that script rather than editing the
     grid by hand. ${cases.length} pairs, all photographed at this practice.
     ========================================================================== -->
<section class="pg-hero" id="hero" style="min-height:clamp(440px,58svh,620px)">
  <div class="ph-bg">
    <img src="assets/pt-hero-4.jpg" alt="A patient of the practice after treatment" data-drift>
  </div>
  <div class="wrap ph-in">
    <div class="pk-crumb" data-rv><a href="index.html">Home</a><i></i><span>Smile Gallery</span></div>
    <h1 data-split>${cases.length} cases. <em>No</em> stock photography.</h1>
    <p class="ph-lead" data-rv>Every pair below was treated at this practice. Drag the line across any of them, or use the keyboard arrows once a case has focus.</p>
    <div class="ph-actions" data-rv>
      <a class="btn btn-primary magnetic" href="contact.html#book"><span>Ask about your case</span></a>
      <a class="btn btn-ghost magnetic" href="patient-stories.html"><span>Hear from patients</span></a>
    </div>
  </div>
</section>

<section class="pk" id="gallery">
  <style>
    .ga-filters{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:clamp(1.75rem,3.5vw,2.75rem)}
    /* LIGHT-THEME FILTERS. These were dark-theme whites until 2026-08-11, when
       regenerating the gallery reverted the light inversion (SITE.md bug 21)
       and dropped every inactive filter button to 1.04:1. The generator is the
       source of truth for this page, so a hand-fix to the generated body file
       survives exactly until the next run — fix it HERE.
       White on --gold-deep is 4.06:1, under AA, so the active chip takes
       --gold-ink. */
    .ga-filters button{border:1px solid var(--line-strong);padding:.6rem 1.15rem;
      font-size:var(--label);letter-spacing:.14em;text-transform:uppercase;font-weight:600;
      color:var(--fg-soft);transition:background .35s,color .35s,border-color .35s}
    .ga-filters button:hover{border-color:var(--rule);color:var(--fg)}
    .ga-filters button[aria-pressed="true"]{background:var(--gold-ink);border-color:var(--gold-ink);
      color:#fff}
    .ga-filters button b{font-weight:600;opacity:.78;margin-left:.45rem}
    .ga-grid{display:grid;grid-template-columns:1fr;gap:clamp(1rem,2vw,1.75rem)}
    @media(min-width:700px){ .ga-grid{grid-template-columns:repeat(2,1fr)} }
    @media(min-width:1100px){ .ga-grid{grid-template-columns:repeat(3,1fr)} }
    .ga-item[hidden]{display:none}
    .ga-empty{color:var(--fg-soft);font-weight:400}
  </style>
  <div class="wrap section">
    <div class="pk-head">
      <div class="chapter-tag" data-rv><i></i><span class="label">Before &amp; After</span></div>
      <h2 data-split>Sorted by what was actually done.</h2>
    </div>

    <div class="ga-filters" id="gaFilters" role="group" aria-label="Filter cases by treatment">
${FILTERS.map(([k, l, n], i) => `      <button type="button" data-cat="${k}" aria-pressed="${i === 0}">${l}<b>${n}</b></button>`).join("\n")}
    </div>

    <div class="ga-grid" id="gaGrid">
${cases.map(card).join("\n")}
    </div>
  </div>

  <script>
  /* Filtering is plain DOM work — it must keep working with GSAP absent. */
  (function () {
    var bar = document.getElementById('gaFilters'),
        grid = document.getElementById('gaGrid');
    if (!bar || !grid) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-cat]');
      if (!btn) return;
      var cat = btn.getAttribute('data-cat');
      bar.querySelectorAll('button').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      grid.querySelectorAll('.ga-item').forEach(function (item) {
        item.hidden = !(cat === 'all' || item.getAttribute('data-cat') === cat);
      });
      /* Pinned/scrubbed triggers elsewhere on the page measured the old height. */
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  })();
  </script>
</section>

<section class="pk alt" id="note">
  <div class="wrap section pk-lede">
    <div class="lc-head">
      <div class="chapter-tag" data-rv><i></i><span class="label">Reading The Photographs</span></div>
      <h2 data-split>What a before-and-after can and cannot tell you.</h2>
    </div>
    <div class="lc-body" data-rv="stagger">
      <p>Clinical photographs are taken close, lit hard and shot at the same angle each time, which
        is why they look nothing like a portrait. That consistency is the point: it is what makes two images of the same mouth comparable.</p>
      <p>What they cannot show is <strong>how the case was planned</strong>: how much bone there was
        to work with, whether teeth had to come out first, how the bite was balanced, how long it
        took. Two identical-looking afters can sit on completely different treatment plans.</p>
      <p>So use these for what they are good for: seeing that work of this kind is done here,
        routinely, on cases other practices call too complex. Then bring your own mouth in and have
        it scanned.</p>
      <a class="pk-more" href="contact.html#book">Book a consultation</a>
    </div>
  </div>
</section>

<section class="pk" id="next">
  <div class="wrap section">
    <div class="pk-head"><h2 data-split>Where to go next.</h2></div>
    <nav class="pk-next" data-rv="stagger" aria-label="Related pages">
      <a href="all-on-4.html"><span class="nx-k">Full arch</span>
        <span class="nx-t">All-on-4</span>
        <span class="nx-d">The treatment behind most of the cases above.</span></a>
      <a href="veneers.html"><span class="nx-k">Cosmetic</span>
        <span class="nx-t">Porcelain Veneers</span>
        <span class="nx-d">Two appointments, under a millimetre of enamel.</span></a>
      <a href="patient-stories.html"><span class="nx-k">In their words</span>
        <span class="nx-t">Patient Stories</span>
        <span class="nx-d">Six patients filmed at the practice.</span></a>
    </nav>
  </div>
</section>

<section class="pk pk-cta" id="book">
  <div class="wrap section cta-in">
    <h2 data-split>Is your case in here?</h2>
    <p data-rv>Bring it in. The consultation includes a 3D scan and a straight answer about what
      your case actually needs.</p>
    <a class="btn btn-dark magnetic" href="contact.html#book" data-rv><span>Book your consult</span></a>
    <div class="cta-phones" data-rv>
      <span>McLean &middot; <a href="tel:+17034483312">(703) 448-3312</a></span>
      <span>Alexandria &middot; <a href="tel:+15716177245">(571) 617-7245</a></span>
    </div>
  </div>
</section>
`;

fs.writeFileSync(OUT, body);
console.log(`gallery: ${cases.length} pairs (${FILTERS.map(([k, , n]) => k + "=" + n).join(", ")}) -> ${path.relative(process.cwd(), OUT)}`);
