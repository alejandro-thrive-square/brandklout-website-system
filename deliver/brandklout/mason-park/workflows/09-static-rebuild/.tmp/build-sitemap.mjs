// ===========================================================================
// BUILD /sitemap/ AND sitemap.xml FROM WHAT IS ON DISK.
//
// Generated, never authored. A hand-written sitemap on a 215-page site is a
// list that is wrong within a week -- and this workflow has already been bitten
// three times today by hand-maintained page lists going stale (see
// prune-nav.mjs, probe-dropdown.mjs and probe-heights.mjs in the runbooks).
// So this walks home/ the same way prune-nav.mjs derives its routes.
//
// The 161 blog articles are deliberately NOT listed individually on the human
// page -- that is what /blog/ is for, and 161 links in a sitemap section is
// not navigation. They ARE all in sitemap.xml, which is the file that wants
// completeness.
//
//   node build-sitemap.mjs
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "home");
const ORIGIN = "https://bestdentistinkatytx.com";

const routes = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const abs = path.join(dir, e.name);
    if (fs.existsSync(path.join(abs, "index.html"))) {
      routes.push("/" + path.relative(SITE, abs).split(path.sep).join("/") + "/");
    }
    walk(abs);
  }
};
if (fs.existsSync(path.join(SITE, "index.html"))) routes.push("/");
walk(SITE);
routes.sort();

// The 404 is a page on disk but not a destination: it is served at every
// address that is NOT a page, it carries `noindex`, and it belongs neither in
// the XML nor in a human list of where to go.
const isNotFound = (r) => r === "/404/";
const isBlogPost = (r) => r.startsWith("/blog/") && r !== "/blog/" && !r.startsWith("/blog/page/");
const isBlogPage = (r) => r.startsWith("/blog/page/");
const isService = (r) => r.startsWith("/services/");

// The human page's sections, in the order a patient would want them.
const SECTIONS = [
  ["The practice", ["/", "/about-us/", "/our-doctors/", "/our-team/", "/patient-reviews/", "/technology/", "/contacts/"]],
  ["Patients", ["/new-patients/", "/financing/", "/dental-savings-plan/", "/special-offers/", "/virtual-consultation/", "/faq/", "/thank-you/"]],
  ["Treatments", null],   // /our-services/ + everything under /services/
  ["Blog", ["/blog/"]],
  ["Resources", ["/patient-resources/", "/dental-dictionary/", "/product-recommendations/",
    "/toothpaste-rda-table/", "/ph-and-acidity-of-food-beverages/", "/town-resource/"]],
  ["Legal", ["/terms-of-service/", "/sitemap/"]],
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Turn a route into a readable label. Titles live in the pages, so read them
// rather than guessing from the slug.
const labelFor = (r) => {
  const f = path.join(SITE, ...r.split("/").filter(Boolean), "index.html");
  if (fs.existsSync(f)) {
    const head = fs.readFileSync(f, "utf8").slice(0, 8000);
    const m = head.match(/<title>([\s\S]*?)<\/title>/);
    if (m) {
      return m[1]
        .replace(/\s*\|\s*Mason Park Dental.*$/i, "")
        .replace(/\s*\|\s*Dentist Katy.*$/i, "")
        .replace(/\s+in Katy,? TX\s*$/i, "")
        .trim();
    }
  }
  return r;
};

// Everything a person could actually visit -- the 404 is on disk but is not a
// destination, so it is out of both the count and the lists.
const xmlRoutes = routes.filter((r) => !isBlogPage(r) && !isNotFound(r));

const listed = new Set();
const sectionHtml = SECTIONS.map(([name, explicit]) => {
  const list = explicit
    ? explicit.filter((r) => routes.includes(r))
    : ["/our-services/", ...routes.filter(isService)].filter((r) => routes.includes(r));
  if (!list.length) return "";
  for (const r of list) listed.add(r);
  return `  <div class="wrap">
    <p class="svc-ledger-label">${esc(name)}</p>
    <ul class="svc-ledger">
${list.map((r) => `      <li><b>&rarr;</b><span><a href="${r}">${esc(labelFor(r))}</a></span></li>`).join("\n")}
    </ul>
  </div>`;
}).filter(Boolean).join("\n");

// Anything on disk that no section claimed, so a new page cannot go missing
// from this page silently. Blog articles and blog pagination are expected.
const unlisted = routes.filter((r) => !listed.has(r) && !isBlogPost(r) && !isBlogPage(r) && !isNotFound(r));
if (unlisted.length) {
  console.log("! not in any section, add them to SECTIONS: " + unlisted.join(" "));
}

const body = `<main class="main-wrapper" id="main">
<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">

  <div class="ar-bg" data-drift>
    {{img slug="team-corridor" sizes="100vw" eager}}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    <p class="chapter-tag"><i></i><b>Sitemap</b></p>
    <h1 class="ar-title" data-split><em>Sitemap</em></h1>
    <p class="ar-lede" data-anim="hide">Every page on this site. ${routes.filter(isService).length} treatments, ${routes.filter(isBlogPost).length} articles, and everything else.</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-lg" href="/our-services/">All services</a>
      <a class="button is-ghost-light is-lg" href="/blog/">The blog</a></div>
    <p class="el-cue" aria-hidden="true"><span>Scroll</span><i></i></p>
  </div>
</section>

<div class="padding-global"><div class="container-large">
  <nav class="breadcrumb_component" aria-label="Breadcrumb">
    <span class="breadcrumb_item"><a href="/">Home</a></span><span class="breadcrumb_item">Sitemap</span>
  </nav>
</div></div>

<section class="ch ch-treatment" id="pages" data-chapter="1" data-chapter-name="Pages">
  <div class="wrap svc-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>Pages</b></p>
      <h2 data-split>All ${xmlRoutes.length} of them.</h2>
    </div>
    <p class="pe-lede">The ${routes.filter(isBlogPost).length} blog articles are not listed one by one here &mdash; that is what <a href="/blog/">the blog</a> is for. They are all in <a href="/sitemap.xml">sitemap.xml</a>.</p>
  </div>
${sectionHtml}
</section>

<section class="ch ch-invitation" id="invitation" data-chapter="2" data-chapter-name="The Invitation" data-theme="dark">
  <div class="wrap iv-top">
    <div class="iv-copy">
      <p class="chapter-tag"><i></i><b>The Invitation</b></p>
      <h2 data-split>Cannot find it?</h2>
      <p class="iv-lede">Call and ask. It is faster than any sitemap, and the front desk knows what you mean even when you do not know the word for it.</p>
      <div class="iv-actions">
        <a class="button is-lg" href="tel:+12817698878">(281) 769-8878</a>
        <a class="button is-ghost-light is-lg" href="/contacts/">Contact page</a>
      </div>
      <dl class="iv-facts">
        <div><dt>Address</dt><dd><a href="https://www.google.com/maps/place/21830+Kingsland+Blvd+%23104a,+Katy,+TX+77450" target="_blank" rel="noopener">21830 Kingsland Blvd #104A<br>Katy, TX 77450</a></dd></div><div><dt>Hours</dt><dd>Mon to Wed <b>9am to 6pm</b><br>Thu <b>9am to 5pm</b><br>Fri to Sun <b>Closed</b></dd></div><div><dt>Emergencies</dt><dd>Call the practice. We keep same day slots for pain, breaks and knocked out teeth.</dd></div>
      </dl>
    </div>
    <div class="iv-aside">
      <figure class="iv-shot" data-el="mask">
        {{img slug="team-front-desk" sizes="(max-width: 899px) 100vw, 34vw"}}
        <figcaption>The front desk, which is a better search engine than this page.</figcaption>
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

const TMP = path.join(HERE, "blog", "build");
fs.mkdirSync(TMP, { recursive: true });
const specPath = path.join(TMP, "sitemap.spec.json");
const bodyPath = path.join(TMP, "sitemap.main.html");
fs.writeFileSync(specPath, JSON.stringify({
  slug: "sitemap",
  path: "sitemap",
  title: "Sitemap | Mason Park Dental of Katy, TX",
  description: `Every page on the Mason Park Dental of Katy website: ${routes.filter(isService).length} treatments, ${routes.filter(isBlogPost).length} articles, and the practice pages.`,
  crumb: "Sitemap",
}, null, 2));
fs.writeFileSync(bodyPath, body);
execFileSync(process.execPath, [path.join(HERE, "stamp-page.mjs"), specPath, bodyPath], { stdio: "inherit" });

// ---- sitemap.xml --------------------------------------------------------
// Priority is a hint and search engines largely ignore it, so it is kept
// simple and honest rather than tuned: the homepage, then the pages that earn
// traffic, then everything else.
const prio = (r) =>
  r === "/" ? "1.0"
  : isService(r) ? "0.8"
  : isBlogPost(r) ? "0.5"
  : isBlogPage(r) ? "0.3"
  : "0.6";

// /blog/page/2..7 are NOT in the XML. The blog is served from the Instatic CMS
// now -- /blog is a `base.loop` in `infinite` mode with a "Load more" button,
// and Instatic has no numeric paginator module -- so those seven routes exist
// only in the static build under home/ and 404 on the live site. Advertising a
// 404 to Search Console is worse than leaving out a route that was never a
// landing page. /blog itself and all 161 articles ARE listed, and their URLs
// are identical in both builds.
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlRoutes.map((r) => `  <url><loc>${ORIGIN}${r}</loc><priority>${prio(r)}</priority></url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(SITE, "sitemap.xml"), xml);

console.log(`${routes.length} routes: ${routes.filter(isService).length} services, ${routes.filter(isBlogPost).length} articles, ${routes.filter(isBlogPage).length} blog pages`);
console.log(`wrote home/sitemap.xml with ${xmlRoutes.length} url(s); ${routes.length - xmlRoutes.length} paginated blog route(s) left out (the CMS blog has no numeric pages)`);
