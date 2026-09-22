// Caches the practice's own ReputationHub feed to reviews.json, and writes the
// home page's live-feed slot between the REVIEWS markers.
//
// IT NO LONGER WRITES A CARD WALL. As of 2026-09-22 the home page shows the
// ReputationHub embed and nothing else, by the client's decision; the long note
// beside `block` below records what that gives up and why the two were on the
// page together in the first place. Do not re-add a wall here without going
// back to the client: the cards and the embed are the same reviews, and having
// both is the exact fault this removed.
//
// WHAT THE REST OF THIS FILE IS FOR
// ---------------------------------
// The widget PAGE is server-rendered with schema.org microdata, so the real
// reviews are readable without the frame. gen-blog.mjs reads the reviews.json
// this writes, and gen-reviews-topic.mjs uses the same feed to build the
// topic-filtered walls on the veneers landing pages — an embed cannot filter to
// veneer treatment, so those walls stay.
//
// STALE PREMISE, KEPT AS A WARNING. This generator was written because "an
// iframe cannot work on Instatic and never will": that platform builds its CSP
// from module contributions and only base.video lifted `frame-src`. That was
// true when it was written and is not true now — the Embed Origins plugin
// carries a `frameOrigins` list, and the live home page has been serving a
// working ReputationHub frame. Check the platform before repeating the claim.
//
// DELIBERATELY NOT EMITTING Review/AggregateRating JSON-LD. Self-serving review
// markup on a business's own page is not eligible for rich results under
// Google's structured-data policy, and marking it up anyway risks a manual
// action. The reviews are content here, not a rich-result play.
//
//   node gen-reviews.mjs [--offline]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(SRC, "pages", "home.body.html");
const CACHE = path.resolve(SRC, "..", "reviews.json");
const WIDGET =
  "https://reputationhub.site/reputation/widgets/review_widget/" +
  "xJDu1mFoW5jFYTNqmuk7?widgetId=6a7340db2bbe7819cc3536f4";
const VENDOR = "https://reputationhub.site/reputation/assets/review-widget.js";

const argv = process.argv.slice(2);
const LIMIT = Number(argv.includes("--limit") ? argv[argv.indexOf("--limit") + 1] : 6);
const OFFLINE = argv.includes("--offline");

const strip = (s) => s.replace(/<[^>]+>/g, "");
const unent = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Curly quotes and apostrophes, and never an em dash (SYSTEM_RULES §3). */
function typographic(s) {
  return s
    .replace(/—/g, ", ")
    .replace(/(\w)'(\w)/g, "$1’$2")
    .replace(/"([^"]*)"/g, "“$1”")
    .replace(/\s+/g, " ")
    .trim();
}

const grab = (html, prop) =>
  [...html.matchAll(new RegExp(`itemprop="${prop}"[^>]*>(.*?)</div>`, "gs"))]
    .map((m) => unent(strip(m[1])).trim());

async function fetchReviews() {
  const r = await fetch(WIDGET, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!r.ok) throw new Error(`widget ${r.status}`);
  const html = await r.text();
  const bodies = grab(html, "reviewBody");
  const rating = grab(html, "ratingValue");
  const dates = grab(html, "datePublished");
  const authors = [...html.matchAll(/itemprop="author".*?itemprop="name"[^>]*>(.*?)<\/div>/gs)]
    .map((m) => unent(strip(m[1])).trim());
  if (!bodies.length) throw new Error("no reviewBody microdata; the widget markup changed");
  if (new Set([bodies.length, rating.length, dates.length, authors.length]).size !== 1) {
    throw new Error(
      `field counts disagree: body=${bodies.length} rating=${rating.length} ` +
      `date=${dates.length} author=${authors.length} — refusing to pair them`);
  }
  return bodies.map((body, i) => ({
    author: authors[i], rating: Number(rating[i]), date: dates[i].slice(0, 10),
    body: typographic(body),
  }));
}

const reviews = OFFLINE
  ? JSON.parse(fs.readFileSync(CACHE, "utf8"))
  : await fetchReviews();
fs.writeFileSync(CACHE, JSON.stringify(reviews, null, 1));
console.log(`${reviews.length} reviews (${OFFLINE ? "cached" : "fetched"}) cached to reviews.json`);

/* The card renderer that used to live here went with the wall on 2026-09-22.
   gen-reviews-topic.mjs still has its own, for the veneers landing pages; if a
   wall is ever wanted back on the home page, take it from there rather than
   writing a third one. `LIMIT` now only bounds what is logged. */
void LIMIT;

// NOT computing the headline score from this feed. The widget serves only the
// most recent handful of reviews, carries no aggregateRating, and those happen
// to be all 5s — averaging them printed 5.0 over the 4.9 the client corrected
// this to on 2026-08-10. A sample is not an average. The score in .rv-score is
// the client's figure and this generator does not touch it, nor claim a count.

/* 2026-09-22 — THE HOME PAGE IS EMBED ONLY, BY CLIENT DECISION.
 *
 * The card wall above used to be the content and `.rv-live` the upgrade, because
 * Instatic could not render a third-party frame at all. That is no longer true:
 * the Embed Origins plugin carries a `frameOrigins` list (Vimeo went in on
 * 2026-09-21), and the live home page has been serving a working ReputationHub
 * iframe since the widget was pinned in. What it was ALSO serving was the six
 * generated cards, immediately above it — the same reviews twice.
 *
 * The duplication was not a restore going wrong. `ch-proof.js` hides the wall
 * when the widget settles, but it hides `.rv-wall` only if it finds the
 * `.rv-live` slot it built the frame into, and on the published page that slot
 * is gone: the frame there is a separate brandklout Embed block. So the hide
 * never ran, and both were on the page.
 *
 * Two things are knowingly given up, and the client was asked before this
 * changed: ~356 words of review text that counted for this domain rather than
 * for reputationhub.site, and the copy a visitor sees with JavaScript off or
 * with the widget failing. The section can now be empty; it could not before.
 *
 * `reviews.json` is still fetched and cached here — gen-blog.mjs reads it — and
 * the veneers landing pages keep their own topic-filtered wall, which an embed
 * cannot reproduce because it cannot filter to veneer treatment
 * (gen-reviews-topic.mjs). The `.rv-wall` / `.rv-card` rules in
 * css/37-ch-proof.css therefore stay: those pages still use them.
 */
const block = `      <!-- The practice's LIVE review feed, and on this page the only reviews.
           A brandklout Embed block on the platform; this local slot is what
           ch-proof.js builds the same frame into so the page matches what is
           published. Nothing renders here without JavaScript, which is the
           accepted cost of the client's 2026-09-22 call for embed-only.
           Cards are still generated for the veneers landing pages by
           gen-reviews-topic.mjs; do not re-add a wall here. -->
      <div class="rv-live" data-widget="${WIDGET}" data-probing></div>
      <a class="rv-more" href="patient-stories.html">Read the patient stories <i></i></a>`;

let page = fs.readFileSync(PAGE, "utf8");
const BEGIN = "<!-- REVIEWS:BEGIN -->", END = "<!-- REVIEWS:END -->";
if (!page.includes(BEGIN)) throw new Error(`no ${BEGIN} marker in home.body.html`);
const before = page.slice(0, page.indexOf(BEGIN) + BEGIN.length);
const after = page.slice(page.indexOf(END));
page = `${before}\n${block}\n      ${after}`;

// The standfirst described the six FILMED stories these cards replaced, so it
// would now be describing something that is not on the page. No count: see above.
page = page.replace(
  /(<p class="rv-sub">)[^<]*(<\/p>)/,
  `$1Recent Google reviews from both practices. Their words, not ours.$2`);

fs.writeFileSync(PAGE, page);
console.log("wrote the live-feed slot into pages/home.body.html (no card wall: embed only)");
