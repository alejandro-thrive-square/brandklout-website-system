// Assembles the three pages of the Invisalign funnel, plus the two bundles
// every page loads.
//
//   partials/           the shell: head, nav, drawer, call bar, footer
//   pages/*.body.html   MARKUP ONLY. No <style>, no <script>
//   css/*.css           one file per component, concatenated in filename order
//                       into assets/site.css. Filename order IS cascade order
//   js/*.js             the runtime (00), the shared kit (20), boot (90)
//   sections/*.js       one file per chapter, each registering itself with
//                       WZ.section and running only if that chapter is on the
//                       page
//
// The point of the two bundles: a chapter is just markup. Move a <section>
// from one page to another and its styling and behaviour follow it, because
// every page carries the whole vocabulary and each module guards on its own
// selector.
//
// Usage: node build-site.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(SRC, "..", "final-design");
const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");

const seo = JSON.parse(read("seo.json"));
const head = read("partials/head.html");
const nav = read("partials/nav.html");
const drawer = read("partials/drawer.html");
const callbar = read("partials/callbar.html");
const footer = read("partials/footer.html");

function bundle(dir, ext) {
  const abs = path.join(SRC, dir);
  if (!fs.existsSync(abs)) return "";
  return fs.readdirSync(abs).filter((n) => n.endsWith(ext)).sort()
    .map((f) => `/* ===== ${dir}/${f} ===== */\n` + fs.readFileSync(path.join(abs, f), "utf8").replace(/\s*$/, "") + "\n")
    .join("\n");
}

const ASSETS = path.join(OUT, "assets");
fs.mkdirSync(ASSETS, { recursive: true });

// The media, mirrored rather than referenced up a directory, so final-design/
// is a self-contained package that can be zipped, served or handed over as it
// stands. copy-assets.mjs is what puts them in site-src/assets in the first
// place, straight out of the 01-content-intake catalogue.
(function mirror(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const s = path.join(from, f), d = path.join(to, f);
    if (fs.statSync(s).isDirectory()) mirror(s, d);
    else fs.copyFileSync(s, d);
  }
})(path.join(SRC, "assets"), ASSETS);

fs.writeFileSync(path.join(ASSETS, "site.css"), bundle("css", ".css"));

// sections/ sits between the runtime and boot: 00-runtime defines WZ.section,
// the chapter modules call it, and 90-boot creates the smoother and flushes
// what they queued.
const runtimeJs = bundle("js", ".js");
const boot = runtimeJs.indexOf("/* ===== js/90-boot.js ===== */");
if (boot === -1) throw new Error("js/90-boot.js missing, nothing would flush the section queue");
fs.writeFileSync(
  path.join(ASSETS, "site.js"),
  runtimeJs.slice(0, boot) + bundle("sections", ".js") + "\n" + runtimeJs.slice(boot)
);

const CHAPTER_READOUT = `<div class="nav__chapter" aria-hidden="true">
    <span>Chapter</span><b id="navCh">00</b><i id="navBar"></i><span id="navName">Arrival</span>
  </div>`;

// The landing page is the funnel's front door, so every page's brand link and
// drawer point back at it rather than at the practice's home page: sending a
// paid visitor to the site root is the most expensive link on the page.
const HOME = "invisalign.html";

const PAGES = [
  {
    slug: "invisalign", journey: 1,
    cta: { href: "invisalign-consultation.html", label: "Book free consultation" },
  },
  {
    slug: "invisalign-consultation", journey: 1,
    // On the consultation page the nav CTA jumps to the form rather than
    // leaving: the form IS the destination.
    cta: { href: "#consultForm", label: "Jump to the form" },
  },
  {
    slug: "invisalign-thank-you", journey: 1,
    cta: { href: "tel:+16265841800", label: "Call the practice" },
  },
];

const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function seoBlock(slug) {
  const m = seo[slug];
  if (!m) throw new Error(`seo.json has no entry for "${slug}"`);
  const lines = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.desc)}">`,
  ];
  // Only emitted when a page asks for it. Two of these three pages have
  // nothing to rank for, and one of them would tell a searcher their form was
  // submitted when it was not.
  if (m.robots) lines.push(`<meta name="robots" content="${esc(m.robots)}">`);
  lines.push(
    `<meta property="og:title" content="${esc(m.ogTitle)}">`,
    `<meta property="og:description" content="${esc(m.ogDesc)}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(m.ogTitle)}">`,
    `<meta name="twitter:description" content="${esc(m.ogDesc)}">`
  );
  if (m.jsonLd) {
    lines.push(`<script type="application/ld+json">\n${JSON.stringify(m.jsonLd, null, 2)}\n</script>`);
  }
  return lines.join("\n");
}

const fill = (tpl, p) => tpl
  .replace(/{{HOME}}/g, HOME)
  .replace(/{{CTA_HREF}}/g, p.cta.href)
  .replace(/{{CTA_LABEL}}/g, p.cta.label);

let built = 0;
for (const p of PAGES) {
  const bodyFile = `pages/${p.slug}.body.html`;
  if (!fs.existsSync(path.join(SRC, bodyFile))) { console.warn(`SKIP ${p.slug}`); continue; }

  const navHtml = fill(nav, p)
    .replace("{{JOURNEY}}", String(p.journey))
    .replace("{{CHAPTER_READOUT}}", p.journey ? CHAPTER_READOUT : "");

  const out = `${head.replace("{{HEAD_SEO}}", seoBlock(p.slug))}
<body>

<!-- ==========================================================================
     FIXED UI — outside #smooth-wrapper so ScrollSmoother never transforms it
     ========================================================================== -->
${navHtml}
${fill(drawer, p)}
${fill(callbar, p)}

<div id="smooth-wrapper">
<div id="smooth-content">
<main id="top">
${read(bodyFile)}
</main>

${footer}
</div><!-- /#smooth-content -->
</div><!-- /#smooth-wrapper -->

<!-- The runtime, every chapter module and the boot sequence, in one file. At
     the end of <body> because ScrollTrigger has to be registered after
     document.body exists, and because each module guards on a selector: it has
     to see the markup to decide whether to run. -->
<script src="assets/site.js"></script>
</body>
</html>
`;
  // One directory per page, each holding an index.html, sharing ../assets.
  // Two reasons, and neither is taste: journey-audit.mjs resolves a page as
  // <dir>/index.html, and a directory layout serves at a clean URL locally,
  // which is what the funnel's own links look like once it is on Webflow.
  //
  // The source markup stays written as if it were flat, and the two path
  // families are rewritten here: asset references gain a level, and the
  // sibling page links become sibling directories. Both patterns are narrow
  // and both are asserted below rather than assumed.
  const dir = path.join(OUT, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  const rewritten = out
    .replace(/(["'(])assets\//g, "$1../assets/")
    .replace(/(["'])(invisalign(?:-consultation|-thank-you)?)\.html(["'])/g, "$1../$2/$3");

  if (/["'(]assets\//.test(rewritten.replace(/\.\.\/assets\//g, ""))) {
    throw new Error(`${p.slug}: an asset path was left un-rewritten`);
  }
  if (/["']invisalign[a-z-]*\.html["']/.test(rewritten)) {
    throw new Error(`${p.slug}: a page link was left un-rewritten`);
  }

  fs.writeFileSync(path.join(dir, "index.html"), rewritten);
  built++;
}
console.log(`built ${built}/${PAGES.length} pages -> ${path.relative(process.cwd(), OUT)}/<slug>/index.html`);
