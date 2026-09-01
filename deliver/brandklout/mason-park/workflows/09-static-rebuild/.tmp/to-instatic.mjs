// Turn the built site into what Instatic should hold.
//
//   node to-instatic.mjs [--media instatic-media-map.json]
//
// Output: instatic/
//   pages/<slug>.json     { slug, title, description, html }  - body-only
//   site.css              the site-wide stylesheet code asset
//   site.js               the site-wide script code asset
//   media-manifest.json   every local file to upload, with its size
//   IMPORT.md             the run order, written for whoever does the import
//
// The local build and the Instatic site are the same markup with three
// differences, and only three. This mirrors the contract already proven on
// Dr. Nahlah (dr-nahlah/workflows/13-content-export-import/.tmp/to-instatic.mjs):
//
//   1. ROUTES.  Local is a folder of index.html files; Instatic is routed.
//      `/services/invisalign/` -> `/services/invisalign`, `/` stays `/`.
//   2. MEDIA.   Local is `/assets/...`; Instatic is `/uploads/<id>-<name>`, and
//      the id is assigned AT UPLOAD, so it cannot be predicted. Upload first,
//      harvest the map, then run this with --media. Without a map the local
//      paths are left in place and every one is reported as unmapped, which is
//      a visible failure rather than a silent broken image.
//   3. SCRIPTS AND STYLES.  Instatic holds these as site-wide code assets, so
//      every <script> and <link rel=stylesheet> is dropped from the page body
//      and shipped separately.
//
// Everything else - the Client-First class vocabulary included - is identical,
// which is the whole point of having centralised the CSS first.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// The design deliverable is `../home/` — a plain, double-clickable folder of
// HTML/CSS/JS, not a generated `dist/`. The generator was retired on 2026-09-01:
// the homepage IS index.html now, hand-edited, and this exporter reads it.
const DIST = path.join(HERE, "..", "home");
const OUT = path.join(HERE, "instatic");

const argv = process.argv.slice(2);
const mediaArg = argv.includes("--media") ? argv[argv.indexOf("--media") + 1] : null;
const MEDIA = mediaArg && fs.existsSync(mediaArg) ? JSON.parse(fs.readFileSync(mediaArg, "utf8")) : {};

// --lean drops the srcset candidates and ships one file per image. 370 of the
// 497 uploads exist only to fill a srcset, so this is 497 files/27.3 MB down to
// 127/13.3 MB - the difference between a long upload and a short one when the
// site has to be back today. The cost is that phones fetch the full-size image.
const LEAN = argv.includes("--lean");

if (!fs.existsSync(DIST)) {
  console.error("../home/ does not exist - that folder IS the site source.");
  process.exit(1);
}

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

/** `/services/invisalign/` -> `/services/invisalign`; `/` stays `/`. */
export const route = (href) => {
  if (!href.startsWith("/")) return href;
  const [pathPart, hash = ""] = href.split(/(?=#)/);
  if (pathPart === "/") return "/" + hash;
  return pathPart.replace(/\/+$/, "") + hash;
};

/** `/assets/uploads/x/y.jpg` -> `/uploads/<id>-y.jpg`, or null if not uploaded. */
const unmapped = new Set();
/** Every local asset some page actually points at, which under --lean is a
 *  smaller set than what is on disk. Recorded before the map is consulted so it
 *  holds local paths either way. */
const referenced = new Set();
export const upload = (src) => {
  if (!src.startsWith("/assets/")) return src;
  referenced.add(src);
  const name = src.replace(/^\/assets\//, "");
  const hit = MEDIA[name]
    || MEDIA[path.basename(name)]
    // Instatic normalises names on the way in: .jpeg -> .jpg, dots -> underscores
    || MEDIA[name.replace(/\.jpeg$/i, ".jpg")]
    || MEDIA[path.basename(name).replace(/\.jpeg$/i, ".jpg")];
  if (!hit) { unmapped.add(src); return src; }
  return hit;
};

/** Instatic pages are a body, not a document. */
const transform = (html) => {
  // `home/index.html` addresses its assets RELATIVELY (`assets/site.css`) so it
  // opens from file:// with no server. Every rule below was written against the
  // absolute form, so restore it here rather than teaching each one both shapes.
  //
  // A page at home/services/invisalign/ writes `../../assets/x` and one at the
  // root writes `assets/x`; the depth is whatever the folder is. Collapse any
  // run of `../` first, then the root form, and both land on the absolute shape.
  // The delimiter is captured and put back rather than matched and discarded:
  // srcset candidates are separated by SPACES, so there is not always a quote
  // to anchor on and eating the separator would glue two candidates together.
  let out = html.replace(/(["\s])(?:\.\.\/)+assets\//g, "$1/assets/");
  out = out.split(String.fromCharCode(34) + "assets/").join(String.fromCharCode(34) + "/assets/")
           .split(" assets/").join(" /assets/");

  // 3. drop the local asset plumbing - these are site-wide code assets there
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<link\b[^>]*>/gi, "");

  // body only
  // The opening tag carries attributes (`<body class="has-journey">`), so match
  // the tag rather than the literal string - an exact "<body>" search found
  // nothing and threw on every page that had a body class.
  // The opening tag carries attributes (<body class="has-journey">), so find
  // the end of the TAG rather than searching for a literal "<body>": that exact
  // search returned -1 and threw on every page that had a body class.
  const bodyAt = out.indexOf("<body");
  const bodyEnd = bodyAt === -1 ? -1 : out.indexOf(">", bodyAt);
  const close = out.lastIndexOf("</body>");
  if (bodyEnd === -1 || close === -1) throw new Error("no <body>");
  out = out.slice(bodyEnd + 1, close);

  // 1. routes - except an href into /assets/, which is a file to download, not a
  //    page. The brochure on /dental-savings-plan was going out as
  //    href="/assets/.../broucher.pdf" and 404ing, because only /uploads/<id>-…
  //    exists once Instatic has the file.
  out = out.replace(/\bhref="(\/[^"]*)"/g, (_, href) =>
    `href="${href.startsWith("/assets/") ? upload(href) : route(href)}"`);

  // 2. media - src, and every candidate inside srcset.
  // Under --lean the srcset and its sizes hint go first, so the candidates are
  // never handed to upload() and drop out of the manifest on their own.
  if (LEAN) {
    out = out.replace(/\s(?:srcset|data-srcset|sizes)="[^"]*"/g, "");
  }
  out = out.replace(/\bsrc="(\/assets\/[^"]+)"/g, (_, s) => `src="${upload(s)}"`);
  out = out.replace(/\bdata-src="(\/assets\/[^"]+)"/g, (_, s) => `data-src="${upload(s)}"`);
  out = out.replace(/\bsrcset="([^"]+)"/g, (_, set) => {
    const rebuilt = set.split(",").map((c) => {
      const [u, w] = c.trim().split(/\s+/);
      return `${upload(u)}${w ? " " + w : ""}`;
    }).join(", ");
    return `srcset="${rebuilt}"`;
  });

  // Anything still pointing into /assets/ after the map was applied is a file
  // Instatic would not take - today that is the brochure, because the upload
  // pipeline rejects application/pdf on purpose. Shipping the link anyway gives
  // a visitor a 404, so unwrap it and keep the words.
  if (mediaArg) {
    out = out.replace(/<a\b[^>]*\bhref="\/assets\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, (whole, inner) => {
      unwrappedAssetLinks.push(whole.match(/href="([^"]*)"/)?.[1] ?? "?");
      return inner;
    });
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
};

const unwrappedAssetLinks = [];

// Titles and meta descriptions come out of the markup still escaped. Instatic
// stores them as text, so they have to be decoded on the way out or the page
// title reads "Technology &amp; AI" in the browser tab.
const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
};
const decodeEntities = (s) =>
  s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : whole;
    }
    // &amp; has to resolve last so "&amp;lt;" stays literal rather than becoming "<".
    const hit = NAMED[body.toLowerCase()];
    return hit === undefined ? whole : hit;
  });

// ------------------------------------------------------------------- run
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "pages"), { recursive: true });

const pages = walk(DIST).filter((f) => f.endsWith("index.html"));
const manifestPages = [];

for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(DIST, path.dirname(file)).split(path.sep).join("/");
  // path.relative(dir, dir) is "" on Windows and "." elsewhere - the homepage
  // fell through a bare "." check and shipped an empty slug and a ".json" file.
  const isHome = rel === "." || rel === "";
  const localRoute = isHome ? "/" : "/" + rel + "/";
  const slug = isHome ? "home" : rel;
  // These two are plain-text fields in Instatic, not markup, so the entities that
  // are correct inside <title> would render literally as "&amp;" in the tab.
  const title = decodeEntities((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1].trim());
  const description = decodeEntities((html.match(/<meta name="description" content="([^"]*)"/i) || [, ""])[1].trim());

  const body = transform(html);
  fs.writeFileSync(path.join(OUT, "pages", slug.replace(/\//g, "__") + ".json"),
    JSON.stringify({ slug: route(localRoute), title, description, html: body }, null, 1));
  manifestPages.push({ slug: route(localRoute), file: `pages/${slug.replace(/\//g, "__")}.json`, title, bytes: body.length });
}

// site-wide code assets
fs.copyFileSync(path.join(DIST, "assets", "site.css"), path.join(OUT, "site.css"));
fs.copyFileSync(path.join(DIST, "assets", "site.js"), path.join(OUT, "site.js"));

// every local file that has to be uploaded before the pages will render
const media = walk(DIST)
  .filter((f) => /[\\/]assets[\\/]uploads[\\/]/.test(f))
  .map((f) => {
    const web = "/" + path.relative(DIST, f).split(path.sep).join("/");
    return { local: web, name: web.replace(/^\/assets\//, ""), bytes: fs.statSync(f).size };
  })
  // Uploading a file no page points at costs time now and volume space on every
  // later publish, since a publish snapshots every runtime asset.
  .filter((m) => referenced.has(m.local))
  .sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(path.join(OUT, "media-manifest.json"), JSON.stringify({
  count: media.length,
  totalBytes: media.reduce((a, m) => a + m.bytes, 0),
  files: media,
}, null, 1));

const readme = `# Instatic import — Mason Park Dental of Katy

Generated by \`to-instatic.mjs\` from \`dist/\`. ${manifestPages.length} pages,
${media.length} media files (${(media.reduce((a, m) => a + m.bytes, 0) / 1048576).toFixed(1)} MB).

## What is here

| Path | What it is |
| :--- | :--- |
| \`pages/*.json\` | One page each: \`{ slug, title, description, html }\`. \`html\` is a **body**, not a document. |
| \`site.css\` | The whole stylesheet. Goes in as **one site-wide code asset**, not per page. |
| \`site.js\` | Mobile menu + deferred map. Also a site-wide code asset. |
| \`media-manifest.json\` | Every image to upload, with its size. |

## Run order — media first, and this order matters

Instatic assigns an id at upload time and renames files on the way in
(\`.jpeg\` → \`.jpg\`, \`.\` → \`_\`), so image paths **cannot be predicted**. Pages
built before the upload will point at \`/assets/...\` and render broken.

1. **Upload the media** in \`media-manifest.json\`.
2. **Harvest the map** — a JSON of \`{ "<local name>": "/uploads/<id>-<name>" }\`.
3. **Re-run this script with the map**: \`node to-instatic.mjs --media <map>.json\`.
   It reports anything still unmapped instead of shipping a broken path.
   Pass \`--lean\` in **both** runs if you used it in the first, or the pages
   come back out with srcset candidates that were never uploaded.
4. **Add the two code assets** (\`site.css\`, \`site.js\`) site-wide.
5. **Create each page** with \`site_add_page\` (title, slug), then insert its
   \`html\` with \`site_insert_html\`, passing the returned **\`rootNodeId\`** as
   \`parentId\` — a \`pageId\` is not a node id.

## \`--lean\` — when the upload is what stands between you and live

\`node to-instatic.mjs --lean\` drops every \`srcset\`/\`sizes\` hint and ships one
file per image: **127 files / 13.3 MB instead of 497 / 27.3 MB**. 370 of those
uploads exist only to fill a srcset.

Worth it twice over on a self-hosted instance: a publish snapshots *every*
runtime asset into the volume and nothing is ever collected, so the asset
footprint is paid again on each publish, not once. The cost is that phones
fetch the full-size image — roughly double the mean page weight, from a very
low base. Re-run without the flag later to restore responsive images.

## Two things that will bite

- **The import cannot run headlessly.** Instatic's MCP edits a live workspace:
  the Site editor has to be open in a browser, signed in as the connector owner.
- **Never call \`site_add_page\` twice for the same page.** Slugs auto-unique, so
  a repeat gives you \`about-2\`, not an overwrite. Use \`site_duplicate_page\` to
  copy an existing page.

## Routes

Every route matches the old WordPress URL with the trailing slash dropped, so
existing rankings and inbound links land correctly. \`/pricing\` is intentionally
absent — it was theme demo content.
`;
fs.writeFileSync(path.join(OUT, "IMPORT.md"), readme);

// ------------------------------------------------------------------ validate
// Instatic wants a body, a usable slug and a title for every page. Checking that
// here is what stops a malformed export reaching the import, where the failure
// would look like Instatic's fault rather than ours.
const problems = [];
for (const page of manifestPages) {
  const d = JSON.parse(fs.readFileSync(path.join(OUT, page.file), "utf8"));
  const bad = [];
  if (/<script/i.test(d.html)) bad.push("carries a <script>");
  if (/<link/i.test(d.html)) bad.push("carries a <link>");
  if (/<\/?(html|head|body)\b/i.test(d.html)) bad.push("carries a document shell");
  if (/href="\/[^"]*\/"/.test(d.html)) bad.push("has a trailing-slash internal href");
  if (!d.html.trim()) bad.push("empty body");
  if (!d.title) bad.push("no title");
  if (!d.slug || !d.slug.startsWith("/")) bad.push(`bad slug ${JSON.stringify(d.slug)}`);
  if (d.slug !== "/" && d.slug.endsWith("/")) bad.push("slug has a trailing slash");
  if (bad.length) problems.push(`${page.file}: ${bad.join(", ")}`);
}
const slugs = manifestPages.map((p2) => p2.slug);
const dupes = slugs.filter((sl, i) => slugs.indexOf(sl) !== i);
for (const sl of new Set(dupes)) problems.push(`duplicate slug ${sl} - site_add_page would auto-unique it to -2`);

console.log(`${manifestPages.length} pages -> instatic/pages/`);
console.log(`  media to upload: ${media.length} files, ${(media.reduce((a, m) => a + m.bytes, 0) / 1048576).toFixed(1)} MB`);
console.log(`  code assets: site.css, site.js`);
if (unmapped.size) {
  console.log(`  ! ${unmapped.size} media path(s) NOT mapped to /uploads - upload first, then re-run with --media`);
  if (!mediaArg) console.log(`    (no --media map given, so this is expected on the first pass)`);
}
if (problems.length) {
  console.log(`\n${problems.length} page(s) would be rejected on import:`);
  for (const pr of problems) console.log("  ! " + pr);
  process.exit(1);
}
console.log("  every page validates: body only, usable slug, title present");
if (unwrappedAssetLinks.length) {
  console.log(`  ! ${unwrappedAssetLinks.length} link(s) to a file Instatic would not accept were unwrapped to plain text:`);
  for (const u of [...new Set(unwrappedAssetLinks)]) console.log(`      ${u}`);
}
