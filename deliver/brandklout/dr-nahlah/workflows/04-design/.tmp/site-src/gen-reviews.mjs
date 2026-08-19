// Generates the home page's Google review wall from the practice's OWN live
// widget feed, into native markup this package controls.
//
// WHY THIS EXISTS
// ---------------
// The reviews used to be a ReputationHub <iframe>. That cannot work on Instatic
// and never will: Instatic builds a per-page CSP `<meta>` from module
// contributions, and `frame-src` is lifted ONLY by its base.video module when it
// renders a YouTube embed (src/modules/base/video/index.ts). A page with no
// YouTube node keeps `frame-src 'none'`. There is no env var and no allowlist.
// `default-src 'self'` also rules out a cross-origin fetch from our own JS, so
// on that platform the reviews have to be real content, not a live embed.
//
// Self-hosting the vendor script does not help. review-widget.js is 1,974 bytes
// and is only a postMessage height-resizer; every review lives inside the frame.
//
// The widget PAGE, though, is server-rendered with schema.org microdata, so the
// real reviews are readable without the frame. This fetches them and writes the
// cards straight into pages/home.body.html between the REVIEWS markers.
//
// A side benefit worth stating: inside the iframe those reviews belong to
// reputationhub.site and do nothing for this domain. As native markup they are
// finally on the page Google is reading.
//
// DELIBERATELY NOT EMITTING Review/AggregateRating JSON-LD. Self-serving review
// markup on a business's own page is not eligible for rich results under
// Google's structured-data policy, and marking it up anyway risks a manual
// action. The reviews are content here, not a rich-result play.
//
//   node gen-reviews.mjs [--limit 6] [--offline]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(SRC, "pages", "home.body.html");
const CACHE = path.resolve(SRC, "..", "reviews.json");
const WIDGET =
  "https://reputationhub.site/reputation/widgets/review_widget/" +
  "xJDu1mFoW5jFYTNqmuk7?widgetId=6a7340db2bbe7819cc3536f4";

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
console.log(`${reviews.length} reviews (${OFFLINE ? "cached" : "fetched"}), rendering ${Math.min(LIMIT, reviews.length)}`);

const MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const when = (iso) => {
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTH[Number(m) - 1]} ${y}`;
};

const card = (r) => `        <article class="rv-card">
          <div class="rv-meta">
            <span class="rv-stars" aria-hidden="true">${"★".repeat(r.rating)}</span>
            <span class="rv-when">${when(r.date)}</span>
          </div>
          <p>&ldquo;${esc(r.body)}&rdquo;</p>
          <footer><span class="rv-av" aria-hidden="true">${esc(r.author.trim()[0])}</span>${esc(r.author)}<i>Google</i></footer>
        </article>`;

const shown = reviews.slice(0, LIMIT);

// NOT computing the headline score from this feed. The widget serves only the
// most recent handful of reviews, carries no aggregateRating, and those happen
// to be all 5s — averaging them printed 5.0 over the 4.9 the client corrected
// this to on 2026-08-10. A sample is not an average. The score in .rv-score is
// the client's figure and this generator does not touch it, nor claim a count.

const block = `      <!-- Generated by gen-reviews.mjs from the practice's own ReputationHub feed.
           Native markup, not the vendor iframe: Instatic's CSP allows a frame
           only for YouTube, so an embed can never render there, and inside a
           frame these reviews count for reputationhub.site rather than for this
           domain. Re-run the generator to refresh; do not hand-edit the cards. -->
      <div class="rv-wall" data-rv="stagger">
${shown.map(card).join("\n")}
      </div>
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
console.log(`wrote ${shown.length} cards into pages/home.body.html`);
