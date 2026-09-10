// ===========================================================================
// BUILD THE BLOG: one overview page and 161 article pages, from posts.json.
//
// Every other page in this workflow is hand-authored and `home/<slug>/
// index.html` is the source. The blog is the one place that rule does not
// scale: 161 posts is not an editing job, it is a data job, and the source of
// truth is `.tmp/blog/posts.json` plus `.tmp/blog/bodies/<slug>.html` from
// extract-posts.mjs. Editing a generated article page by hand will be
// overwritten the next time this runs.
//
//   node extract-posts.mjs --bodies   # first, always
//   node build-blog.mjs               # then this
//   node build-blog.mjs --limit 3     # a sample, for iterating on the design
//
// The chrome comes from stamp-page.mjs, the same stamper every other page
// uses, so the header, footer and script tags stay identical to the rest of
// the site and cannot drift.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BLOG = path.join(HERE, "blog");
const TMP = path.join(BLOG, "build");
const posts = JSON.parse(fs.readFileSync(path.join(BLOG, "posts.json"), "utf8"));

const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const chosen = posts.slice(0, LIMIT);

fs.mkdirSync(TMP, { recursive: true });

const esc = (s) => String(s || "").replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

// UTC, deliberately. Yoast dates a post "2026-04-29", which Date parses as
// UTC midnight; toLocaleDateString then renders it in the BUILD MACHINE's
// timezone and prints "April 28, 2026" anywhere west of Greenwich. Every card
// on the blog was a day early.
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const niceDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
};

// The WordPress taxonomy is close to useless for filtering -- 79 of the 161
// posts sit in dental-care AND dental-hygiene AND family-dentistry AND
// oral-health at once, which is four labels meaning "a dental post". Only the
// treatment-specific ones actually separate anything, so those are the only
// ones surfaced, and everything else reads as General.
const TOPIC = [
  ["invisalign", "Invisalign&reg;"],
  ["dental-implant-restorations", "Dental implants"],
  ["dental-implant", "Dental implants"],
];
const topicOf = (p) => {
  for (const [cat, label] of TOPIC) if (p.categories.includes(cat)) return label;
  return "General";
};

// The hero images are still on the old WordPress host. Referencing them
// hotlinks a site we are replacing, so they are NOT used: each card and each
// article opens on the practice's own photography instead, chosen by topic.
// See the runbook -- migrating the 161 originals into uploads/ is its own job.
const TOPIC_IMG = {
  "Invisalign&reg;": "scanner-screen",
  "Dental implants": "scanner-screen-3",
  General: "hygienist-working-2",
};

const relatedFor = (p) => {
  const topic = topicOf(p);
  return posts.filter((q) => q.slug !== p.slug && topicOf(q) === topic).slice(0, 3);
};

// ---------------------------------------------------------------- overview
// Pagination, because 161 cards in one column is 51 screens on a phone and the
// client's standing note is that users do not scroll a page that long. Seven
// pages of 24. Page 1 lives at /blog/ so the canonical blog URL never moves.
const pageHref = (n) => (n === 1 ? "/blog/" : `/blog/page/${n}/`);
const pager = (pageNo, pageCount) => {
  if (pageCount < 2) return "";
  const nums = [];
  for (let n = 1; n <= pageCount; n++) {
    nums.push(
      n === pageNo
        ? `<li><span class="bl-page is-current" aria-current="page">${n}</span></li>`
        : `<li><a class="bl-page" href="${pageHref(n)}">${n}</a></li>`,
    );
  }
  return `    <nav class="bl-pager" aria-label="Blog pages">
      ${pageNo > 1 ? `<a class="bl-page is-step" href="${pageHref(pageNo - 1)}" rel="prev">&larr; Newer</a>` : `<span class="bl-page is-step is-off">&larr; Newer</span>`}
      <ul class="bl-pager_nums">${nums.join("")}</ul>
      ${pageNo < pageCount ? `<a class="bl-page is-step" href="${pageHref(pageNo + 1)}" rel="next">Older &rarr;</a>` : `<span class="bl-page is-step is-off">Older &rarr;</span>`}
    </nav>`;
};

const PER_PAGE = 24;
const cardsFor = (list) => list
  .map((p) => {
    const topic = topicOf(p);
    return `      <li class="bl-card">
        <a class="bl-card_link" href="/blog/${p.slug}/">
          <span class="bl-card_meta"><b>${esc(topic)}</b>${p.published ? `<time datetime="${escAttr(p.published)}">${esc(niceDate(p.published))}</time>` : ""}</span>
          <h3 class="bl-card_title">${esc(p.title)}</h3>
          <p class="bl-card_text">${esc(p.excerpt || p.description)}</p>
          <span class="bl-card_more" aria-hidden="true">Read &rarr;</span>
        </a>
      </li>`;
  })
  .join("\n");

const years = [...new Set(posts.map((p) => p.year).filter(Boolean))].sort().reverse();
const topicCounts = {};
for (const p of posts) topicCounts[topicOf(p)] = (topicCounts[topicOf(p)] || 0) + 1;

const overviewFor = (list, pageNo, pageCount) => `<main class="main-wrapper" id="main">
<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">

  <div class="ar-bg" data-drift>
    {{img slug="desk-tablet" sizes="100vw" eager}}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    <p class="chapter-tag"><i></i><b>Blog</b></p>
    <h1 class="ar-title" data-split>The <em>Blog</em></h1>
    <p class="ar-lede" data-anim="hide">${posts.length} articles the practice has written since ${posts[posts.length - 1]?.year || "2021"}, on everything from wisdom teeth to whether exercise can damage them.</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-lg" href="#articles">Read the articles</a>
      <a class="button is-ghost-light is-lg" href="/our-services/">All services</a></div>
    <p class="el-cue" aria-hidden="true"><span>Scroll</span><i></i></p>
  </div>
</section>

<div class="padding-global"><div class="container-large">
  <nav class="breadcrumb_component" aria-label="Breadcrumb">
    <span class="breadcrumb_item"><a href="/">Home</a></span>${pageNo === 1 ? `<span class="breadcrumb_item">Blog</span>` : `<span class="breadcrumb_item"><a href="/blog/">Blog</a></span><span class="breadcrumb_item">Page ${pageNo}</span>`}
  </nav>
</div></div>

<section class="ch ch-questions" id="articles" data-chapter="1" data-chapter-name="Articles">
  <div class="wrap rg-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>Articles</b></p>
      <h2 data-split>Everything the practice has written.</h2>
    </div>
    <p class="pe-lede">${Object.entries(topicCounts).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${n} on ${t === "General" ? "general dental health" : t}`).join(", ")}. Newest first.</p>
  </div>
  <div class="wrap">
    <ul class="bl-grid">
${cardsFor(list)}
    </ul>
${pager(pageNo, pageCount)}
  </div>
</section>

<section class="ch ch-invitation" id="invitation" data-chapter="2" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      <p class="chapter-tag"><i></i><b>The Invitation</b></p>
      <h2 data-split>Reading is not the same as being seen.</h2>
      <p class="iv-lede">Everything here is general information. What is actually going on in your mouth takes an examination &mdash; and most of what these articles describe is cheapest to fix early.</p>
      <div class="iv-actions">
        <a class="button is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book an appointment</a>
        <a class="button is-ghost-light is-lg" href="tel:+12817698878">(281) 769-8878</a>
      </div>
      <dl class="iv-facts">
        <div><dt>Address</dt><dd><a href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></dd></div><div><dt>Hours</dt><dd>Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b></dd></div><div><dt>Emergencies</dt><dd>Call the practice. We keep same day slots for pain, breaks and knocked out teeth.</dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot" data-el="mask">
        {{img slug="team-reception" sizes="(max-width: 899px) 100vw, 34vw"}}
        <figcaption>Reception, where the reading stops and the appointment starts.</figcaption>
      </figure>
      <div class="iv-map">
        <div class="embed_component">
    <iframe data-src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.75121988455305!3d29.775949038160515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86412740e7dd5def%3A0xfa1ab8c6e696e133!2sMason%20Park%20Dental%20-%20Katy%20Dentist!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus" title="Map to Mason Park Dental of Katy" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </div>
      </div>
      <a class="link-arrow is-light" href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">Get directions <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
</section>
</main>
`;

const stamp = (spec, body, label) => {
  const specPath = path.join(TMP, spec.slug + ".spec.json");
  const bodyPath = path.join(TMP, spec.slug + ".main.html");
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  fs.writeFileSync(bodyPath, body);
  execFileSync(process.execPath, [path.join(HERE, "stamp-page.mjs"), specPath, bodyPath], {
    stdio: ["ignore", "ignore", "inherit"],
  });
  if (label) process.stdout.write(".");
};

const pageCount = Math.ceil(posts.length / PER_PAGE);
for (let n = 1; n <= pageCount; n++) {
  const list = posts.slice((n - 1) * PER_PAGE, n * PER_PAGE);
  stamp(
    {
      slug: n === 1 ? "blog" : `blog-page-${n}`,
      path: n === 1 ? "blog" : `blog/page/${n}`,
      title: n === 1
        ? "Dental Blog | Mason Park Dental of Katy, TX"
        : `Dental Blog, page ${n} | Mason Park Dental of Katy, TX`,
      description: `${posts.length} articles from Mason Park Dental of Katy on dental health, treatments and what to expect, written by the practice.`,
      crumb: n === 1 ? "Blog" : `Page ${n}`,
      ...(n === 1 ? {} : { parent: { name: "Blog", href: "/blog/" } }),
    },
    overviewFor(list, n, pageCount),
  );
}
console.log(`built ${pageCount} blog page(s) for ${posts.length} posts`);

// ---------------------------------------------------------------- articles
process.stdout.write("articles ");
for (const p of chosen) {
  const bodyPath = path.join(BLOG, "bodies", p.slug + ".html");
  if (!fs.existsSync(bodyPath)) continue;
  const article = fs.readFileSync(bodyPath, "utf8");
  const topic = topicOf(p);
  const related = relatedFor(p);

  const relatedHtml = related.length
    ? `  <div class="wrap">
    <p class="svc-ledger-label">More on ${esc(topic === "General" ? "dental health" : topic)}</p>
    <ul class="svc-ledger">
${related.map((r) => `      <li><b>Read</b><span><a href="/blog/${r.slug}/">${esc(r.title)}</a></span></li>`).join("\n")}
    </ul>
  </div>`
    : "";

  const body = `<main class="main-wrapper" id="main">
<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">

  <div class="ar-bg" data-drift>
    {{img slug="${TOPIC_IMG[topic]}" sizes="100vw" eager}}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    <p class="chapter-tag"><i></i><b>${esc(topic)}</b></p>
    <h1 class="ar-title" data-split>${esc(p.title)}</h1>
    ${p.published ? `<p class="ar-lede" data-anim="hide">Mason Park Dental of Katy &middot; <time datetime="${escAttr(p.published)}">${esc(niceDate(p.published))}</time></p>` : `<p class="ar-lede" data-anim="hide">Mason Park Dental of Katy</p>`}
    <div class="ar-actions" data-anim="hide"><a class="button is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book an appointment</a>
      <a class="button is-ghost-light is-lg" href="/blog/">All articles</a></div>
    <p class="el-cue" aria-hidden="true"><span>Scroll</span><i></i></p>
  </div>
</section>

<div class="padding-global"><div class="container-large">
  <nav class="breadcrumb_component" aria-label="Breadcrumb">
    <span class="breadcrumb_item"><a href="/">Home</a></span><span class="breadcrumb_item"><a href="/blog/">Blog</a></span><span class="breadcrumb_item">${esc(p.title)}</span>
  </nav>
</div></div>

<section class="ch ch-treatment" id="article" data-chapter="1" data-chapter-name="Article">
  <div class="wrap">
    <div class="lf-layout is-solo">
      <div class="lf-body text-rich-text">
${article}
      </div>
    </div>
  </div>
${relatedHtml}
</section>

<section class="ch ch-invitation" id="invitation" data-chapter="2" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      <p class="chapter-tag"><i></i><b>The Invitation</b></p>
      <h2 data-split>Ask us in person.</h2>
      <p class="iv-lede">This article is general information and not a diagnosis. If any of it sounds like your own mouth, an examination is the way to find out.</p>
      <div class="iv-actions">
        <a class="button is-lg" href="https://www.flexbook.me/masonpark/1" target="_blank" rel="noopener">Book an appointment</a>
        <a class="button is-ghost-light is-lg" href="tel:+12817698878">(281) 769-8878</a>
      </div>
      <dl class="iv-facts">
        <div><dt>Address</dt><dd><a href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></dd></div><div><dt>Hours</dt><dd>Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b></dd></div><div><dt>Emergencies</dt><dd>Call the practice. We keep same day slots for pain, breaks and knocked out teeth.</dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot" data-el="mask">
        {{img slug="team-front-desk" sizes="(max-width: 899px) 100vw, 34vw"}}
        <figcaption>The front desk at Mason Park Dental of Katy.</figcaption>
      </figure>
      <div class="iv-map">
        <div class="embed_component">
    <iframe data-src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.75121988455305!3d29.775949038160515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86412740e7dd5def%3A0xfa1ab8c6e696e133!2sMason%20Park%20Dental%20-%20Katy%20Dentist!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus" title="Map to Mason Park Dental of Katy" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </div>
      </div>
      <a class="link-arrow is-light" href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">Get directions <span aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
</section>
</main>
`;

  stamp(
    {
      slug: p.slug,
      path: `blog/${p.slug}`,
      title: p.seoTitle || `${p.title} | Mason Park Dental of Katy`,
      description: p.description,
      crumb: p.title,
      parent: { name: "Blog", href: "/blog/" },
    },
    body,
    true,
  );
}
console.log("\nbuilt " + chosen.length + " article page(s)");
