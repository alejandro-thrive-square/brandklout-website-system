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
 *   - strips the doctype/html/head/body shell, because the Artifact host
 *     supplies its own and only wants the page content
 *   - neuters links to the other seventeen pages, which are not in the file,
 *     and says so when one is clicked rather than throwing a 404 at the client
 *
 * The GSAP files are INLINED rather than loaded from a CDN on purpose. The
 * pinned chapter is the single thing this preview exists to demonstrate, and a
 * CDN version that does not resolve would silently degrade it to a static rail:
 * the reviewer would see a working page and conclude the work was not done.
 * SplitText is a Club plugin and is on no public CDN at all.
 *
 * Usage:  node make-preview.mjs [out.html]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, "..", "final-site");
const ASSETS = path.join(SITE, "assets");
const OUT = process.argv[2] || path.resolve(HERE, "..", "preview-home.html");

const MIME = {
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

let html = fs.readFileSync(path.join(SITE, "index.html"), "utf8");
let css = fs.readFileSync(path.join(ASSETS, "site.css"), "utf8");
const js = fs.readFileSync(path.join(ASSETS, "site.js"), "utf8");
const vendor = fs.readFileSync(path.join(ASSETS, "vendor.js"), "utf8");

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
const title = "Stone Surgical Arts";
const description = (html.match(/<meta name="description" content="([^"]*)"/) || [, ""])[1];

/* Drop the two external <script src> tags; their contents are inlined below. */
const content = body.replace(/<script src="assets\/(?:vendor|site)\.js" defer><\/script>\s*/g, "");

const out = `<!-- Live <title> on the built page: ${seoTitle} -->
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap">
<style>
/* The site commits to one light visual world. Declaring it stops the host
   painting a dark ground behind a page that has no dark palette. */
:root { color-scheme: light; }
${css}
/* --- preview only: the note shown when a link leaves this one page -------- */
.preview-note {
  position: fixed;
  left: 50%;
  bottom: 1.5rem;
  transform: translate(-50%, 1rem);
  z-index: 999;
  background: var(--charcoal);
  color: #fff;
  padding: 0.75rem 1.25rem;
  border-radius: 2px;
  font-family: var(--font-body);
  font-size: 0.875rem;
  letter-spacing: 0.01em;
  box-shadow: 0 8px 30px rgba(39, 39, 39, 0.25);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s var(--ease), transform 0.25s var(--ease);
  max-width: min(30rem, 90vw);
  text-align: center;
}
.preview-note.is-on { opacity: 1; transform: translate(-50%, 0); }
@media (prefers-reduced-motion: reduce) { .preview-note { transition: none; } }
</style>

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

<div class="preview-note" role="status" aria-live="polite"></div>

<script>${vendor}</script>
<script>${js}</script>
<script>
/* Preview only. The other seventeen pages are not in this file, so an internal
   link would hand the reviewer a 404. Say what this is instead. */
(function () {
  var note = document.querySelector('.preview-note');
  var timer;
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || /^(https?:|tel:|mailto:)/.test(href)) return;
    e.preventDefault();
    note.textContent = 'This preview is the home page only. "' + a.textContent.trim().slice(0, 40) + '" goes to a page that is not in this file.';
    note.classList.add('is-on');
    clearTimeout(timer);
    timer = setTimeout(function () { note.classList.remove('is-on'); }, 3600);
  });
})();
</script>
`;

fs.writeFileSync(OUT, out, "utf8");
console.log(`${path.basename(OUT)}  ${(out.length / 1024 / 1024).toFixed(2)}MB`);
console.log(`${embedded.size} assets embedded: ${[...embedded].sort().join(", ")}`);
