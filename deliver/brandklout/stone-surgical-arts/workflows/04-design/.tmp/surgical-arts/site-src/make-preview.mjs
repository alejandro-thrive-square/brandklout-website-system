/**
 * Packs the built home page into ONE self-contained file for client review.
 *
 * WHY. Alejandro has to be able to scroll the real thing, on a phone, without a
 * server and without us pushing an unapproved design over the client's live
 * Instatic site. Screenshots cannot show a pinned horizontal chapter, a
 * scrubbed reveal or a hover state, which is most of what changed.
 *
 * WHAT IT DOES
 *   - inlines site.css, and every url() inside it, as data URIs
 *   - inlines site.js and the three vendored GSAP files
 *   - inlines every <img> as a data URI
 *   - emits a COMPLETE HTML document: doctype, html, head, body
 *
 * It used to strip the document shell, because it was written to feed a host
 * that supplied its own. That made the output unopenable on its own: a browser
 * given a file that starts with <title> renders it in quirks mode with the
 * content in an implied body, which is a plausible-looking, subtly wrong page.
 * Now it is a real file you can double-click, mail, or drop on a USB stick.
 *
 * The GSAP files are INLINED rather than loaded from a CDN on purpose. The
 * pinned chapter is the single thing this preview exists to demonstrate, and a
 * CDN version that does not resolve would silently degrade it to a static rail:
 * the reviewer would see a working page and conclude the work was not done.
 * SplitText is a Club plugin and is on no public CDN at all.
 *
 * Usage:  node make-preview.mjs [page.html] [out.html]
 *
 * Defaults to index.html -> ../preview-home.html, which since 2026-09-01 is the
 * only page there is. The arguments stay because packing one page out of many
 * is what this is for, and the site is one page only for now.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, "..", "final-site");
const ASSETS = path.join(SITE, "assets");
const SRC_PAGE = process.argv[2] || "index.html";
const OUT =
  process.argv[3] ||
  path.resolve(HERE, "..", SRC_PAGE === "index.html" ? "preview-home.html" : `preview-${SRC_PAGE.replace(/\.html$/, "")}.html`);

const MIME = {
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

const dataUri = (file) => {
  const abs = path.join(ASSETS, file);
  const ext = path.extname(file).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error(`no mime for ${file}`);
  return `data:${mime};base64,${fs.readFileSync(abs).toString("base64")}`;
};

let html = fs.readFileSync(path.join(SITE, SRC_PAGE), "utf8");
let css = fs.readFileSync(path.join(ASSETS, "site.css"), "utf8");
const js = fs.readFileSync(path.join(ASSETS, "site.js"), "utf8");
/* Only pages with `motion: true` request the GSAP bundle, so only those need it
   inlined. Detected from the built page rather than assumed, so a still page
   never carries 122KB it will not call. */
const usesVendor = /assets\/vendor\.js/.test(html);
const vendor = usesVendor ? fs.readFileSync(path.join(ASSETS, "vendor.js"), "utf8") : "";

/* --- CSS url() -> data: ---------------------------------------------------
   Comments are stripped FIRST. site.css documents its own history, and one of
   those notes quotes the broken `url("assets/texture-stone.jpg")` it replaced;
   scanning the raw text tries to embed a file that was deliberately deleted and
   the pack dies. This is the third gate in this build to learn the same lesson,
   after check-copy.mjs and audit.mjs: read code, not prose. It also drops about
   40KB of authoring notes the client does not need in a preview. */
css = css.replace(/\/\*[\s\S]*?\*\//g, "");
const embedded = new Set();
css = css.replace(/url\(["']?(?!data:|https?:)([^"')]+)["']?\)/g, (m, ref) => {
  const file = ref.split(/[?#]/)[0];
  embedded.add(file);
  return `url("${dataUri(file)}")`;
});

/* --- <img src="assets/x"> -> data: ----------------------------------------
   Guarded on the extension being an image one. The page's two <script src>
   tags also point into assets/, and an unguarded replace tried to base64 a
   122KB JavaScript bundle into an <img>. */
html = html.replace(/src="assets\/([^"]+)"/g, (m, file) => {
  if (!MIME[path.extname(file).toLowerCase()]) return m;
  embedded.add(file);
  return `src="${dataUri(file)}"`;
});

/* --- keep only what goes inside <body> ------------------------------------ */
const body = html.slice(html.indexOf("<body>") + 6, html.lastIndexOf("</body>"));
/* The page's own <title> is its SEO title, "Facial & Cosmetic Surgery Westlake
   TX | Stone Surgical Arts", which is correct on the live site and wrong here:
   this file is published as an artifact and the <title> becomes its NAME in a
   gallery beside dozens of others. A name, not a search-result headline. The
   real title is kept in a comment so the client can still see what the browser
   tab will say. */
const seoTitle = (html.match(/<title>([^<]*)<\/title>/) || [, ""])[1];
/* The gallery name has to be DISTINCT per page: publishing two artifacts both
   called "Stone Surgical Arts" makes them indistinguishable in a list. The SEO
   title is "<page> | Stone Surgical Arts" on inner pages, so its leading
   segment is already the page's own name; home has no leading segment worth
   using and takes the practice name. */
const lead = seoTitle.split("|")[0].trim();
const title =
  SRC_PAGE === "index.html" || !lead || /stone surgical arts/i.test(lead)
    ? "Stone Surgical Arts"
    : `Stone ${lead}`;
const description = (html.match(/<meta name="description" content="([^"]*)"/) || [, ""])[1];

/* Drop the two external <script src> tags; their contents are inlined below. */
const content = body.replace(/<script src="assets\/(?:vendor|site)\.js" defer><\/script>\s*/g, "");

const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#F6F4EF">
<!-- Live <title> on the built page: ${seoTitle} -->
<title>${title}</title>
<meta name="description" content="${description}">
<!-- No font link. The faces are self-hosted and the url() rewrite above has
     already turned each one into a data: URI inside the stylesheet, so this
     file carries its own typography. That was the point of "everything should
     be local": open this on a plane and it is still the design. -->
<style>
/* The site commits to one light visual world. Declaring it stops the host
   painting a dark ground behind a page that has no dark palette. */
:root { color-scheme: light; }
${css}
/* The preview-note toast lived here until 2026-09-01. It caught a click on a
   link to a page that was not packed into this file and explained itself
   instead of 404ing the reviewer. The site is one page now, and every link on
   it is an in-page anchor, a tel: or an off-site URL — all three of which the
   toast already let through. */
/* The host used to supply these; a standalone file has to bring its own. */
body { margin: 0; }
img { max-width: 100%; }
[hidden] { display: none !important; }
</style>
</head>
<body>

<!-- The head partial's inline bootstrap, verbatim: it adds the .js scope every
     hidden state in the stylesheet is scoped to, and removes it again after
     2.5s if nothing signals ready, so a broken bundle leaves a still page with
     all its content rather than a page of blank chapters. -->
<script>
  document.documentElement.classList.add('js');
  setTimeout(function () {
    if (!window.__ssaBooted) document.documentElement.classList.remove('js');
  }, 2500);
</script>

${content}

${usesVendor ? `<script>${vendor}</script>` : "<!-- no motion bundle: this page neither pins nor scrubs -->"}
<script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(OUT, out, "utf8");
console.log(`${path.basename(OUT)}  ${(out.length / 1024 / 1024).toFixed(2)}MB`);
console.log(`${embedded.size} assets embedded: ${[...embedded].sort().join(", ")}`);
