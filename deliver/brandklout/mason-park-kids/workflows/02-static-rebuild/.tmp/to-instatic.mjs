// Turn the built site into what Instatic should hold.
//
//   node to-instatic.mjs [--media instatic-media-map.json] [--lean]
//
// Output: instatic/
//   pages/<slug>.json     { slug, title, description, jsonLd, html }  - body-only
//   site.css              the site-wide stylesheet code asset
//   site.js               the site-wide script code asset
//   media-manifest.json   every local file to upload, with its size
//   IMPORT.md             the run order, written for whoever does the import
//
// Ported from the PARENT practice's rebuild
// (mason-park/workflows/09-static-rebuild/.tmp/to-instatic.mjs), which in turn
// followed Dr. Nahlah's. The contract is unchanged, because both sites are the
// same ThemeREX build rendered through the same Client-First stylesheet. The
// local build and the Instatic site are the same markup with three differences,
// and only three:
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
// TWO THINGS THIS PORT DOES THAT THE PARENT'S DID NOT, both because taking a
// body-only slice silently discards part of the <head> and nobody notices until
// the site is live:
//
//   a. JSON-LD.  Every page carries a Dentist/LocalBusiness block in its head.
//      Body-only export drops it. It is preserved here as `jsonLd` on the page
//      JSON so it can be re-added through Instatic's per-page head/custom code
//      instead of being lost. Dropping it on a rebuild whose whole purpose is
//      keeping the practice's rankings would be a self-inflicted SEO wound.
//   b. HEAD-ONLY MEDIA.  The favicon is a <link rel="icon"> in the head, so it
//      is never seen by the body transform and never reaches the manifest. It
//      is collected explicitly, or the site goes live with no icon and the file
//      it wants was never uploaded.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const OUT = path.join(HERE, "instatic");

const argv = process.argv.slice(2);
const mediaArg = argv.includes("--media") ? argv[argv.indexOf("--media") + 1] : null;
const MEDIA = mediaArg && fs.existsSync(mediaArg) ? JSON.parse(fs.readFileSync(mediaArg, "utf8")) : {};

// --lean drops the srcset candidates and ships one file per image. On this site
// 111 of the ~130 referenced files exist only to fill a srcset, so this is the
// difference between a long upload and a short one. The cost is that phones
// fetch the full-size image. Re-run without it later to restore responsive
// images. Whatever you choose, use the SAME flag on both passes.
const LEAN = argv.includes("--lean");

if (!fs.existsSync(DIST)) {
  console.error("dist/ does not exist - run `node build.mjs` first.");
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

/** Every local asset some page actually points at, which under --lean is a
 *  smaller set than what is on disk. Recorded before the map is consulted so it
 *  holds local paths either way. */
const referenced = new Set();
const unmapped = new Set();
const unwrappedAssetLinks = [];

// Two files in different month folders can share a basename. This site has 9
// such names and 8 of them are genuinely DIFFERENT images - the office photo was
// re-uploaded in 2024/09 at a different compression, so 2023/11 and 2024/09 hold
// same-named files of different bytes. The lookup below therefore prefers the
// full relative path, and a map keyed by basename alone would hand 8 pages the
// wrong file. That failure is near-invisible: the page still shows an office
// photo, just not the right one. So detect it rather than trust the map.
const UPLOADS = path.join(DIST, "assets", "uploads");
const basenameCounts = new Map();
if (fs.existsSync(UPLOADS)) {
  for (const f of walk(UPLOADS)) {
    const b = path.basename(f);
    basenameCounts.set(b, (basenameCounts.get(b) || 0) + 1);
  }
}
const ambiguousBasenames = new Set(
  [...basenameCounts].filter(([, n]) => n > 1).map(([b]) => b));
const ambiguousResolutions = new Set();

/** `/assets/uploads/x/y.jpg` -> `/uploads/<id>-y.jpg`, or the input if not uploaded. */
export const upload = (src) => {
  if (!src.startsWith("/assets/")) return src;
  referenced.add(src);
  const name = src.replace(/^\/assets\//, "");
  const base = path.basename(name);
  // Instatic normalises names on the way in: .jpeg -> .jpg, dots -> underscores
  const byPath = MEDIA[name] || MEDIA[name.replace(/\.jpeg$/i, ".jpg")];
  const byBase = MEDIA[base] || MEDIA[base.replace(/\.jpeg$/i, ".jpg")];
  // Falling back to the basename is fine for a name only one file uses. For a
  // name several files share it is a coin flip, so refuse to guess quietly.
  if (!byPath && byBase && ambiguousBasenames.has(base)) ambiguousResolutions.add(src);
  const hit = byPath || byBase;
  if (!hit) { unmapped.add(src); return src; }
  return hit;
};

/** Instatic pages are a body, not a document. */
const transform = (html) => {
  let out = html;

  // 3. drop the local asset plumbing - these are site-wide code assets there
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<link\b[^>]*>/gi, "");

  // body only
  const open = out.indexOf("<body>");
  const close = out.lastIndexOf("</body>");
  if (open === -1 || close === -1) throw new Error("no <body>");
  out = out.slice(open + "<body>".length, close);

  // 1. routes - except an href into /assets/, which is a file to download, not a
  //    page. On the parent site the brochure went out as
  //    href="/assets/.../broucher.pdf" and 404ed, because only /uploads/<id>-...
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
  // Instatic would not take - on the parent that was the brochure, because the
  // upload pipeline rejects application/pdf on purpose. Shipping the link anyway
  // gives a visitor a 404, so unwrap it and keep the words.
  if (mediaArg) {
    out = out.replace(/<a\b[^>]*\bhref="\/assets\/[^"]*"[^>]*>([\s\S]*?)<\/a>/gi, (whole, inner) => {
      unwrappedAssetLinks.push(whole.match(/href="([^"]*)"/)?.[1] ?? "?");
      return inner;
    });
  }

  return out.replace(/\n{3,}/g, "\n\n").trim();
};

// Titles and meta descriptions come out of the markup still escaped. Instatic
// stores them as text, so they have to be decoded on the way out or the page
// title reads "Technology &amp; AI" in the browser tab.
const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
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
// Assets referenced only from the <head> - the favicon, any og:image. The body
// transform never sees these, so without this they are silently absent from the
// manifest and the uploaded site has no icon.
const headMedia = new Set();

for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(DIST, path.dirname(file)).split(path.sep).join("/");
  // path.relative(dir, dir) is "" on Windows and "." elsewhere - on the parent
  // the homepage fell through a bare "." check and shipped an empty slug and a
  // ".json" file.
  const isHome = rel === "." || rel === "";
  const localRoute = isHome ? "/" : "/" + rel + "/";
  const slug = isHome ? "home" : rel;
  // These two are plain-text fields in Instatic, not markup, so the entities that
  // are correct inside <title> would render literally as "&amp;" in the tab.
  const title = decodeEntities((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1].trim());
  const description = decodeEntities((html.match(/<meta name="description" content="([^"]*)"/i) || [, ""])[1].trim());

  const head = html.slice(0, html.indexOf("<body>"));
  // Only /assets/uploads/ - the head also links /assets/site.css, which ships as
  // a code asset and is not a media upload.
  for (const m of head.matchAll(/(?:href|content)="(\/assets\/uploads\/[^"]+)"/g)) headMedia.add(m[1]);
  // Preserved rather than exported as markup: Instatic takes this through the
  // page's own head/custom-code field, not through the body.
  const jsonLd = (head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i) || [, ""])[1].trim();

  const body = transform(html);
  const outName = slug.replace(/\//g, "__") + ".json";
  fs.writeFileSync(path.join(OUT, "pages", outName),
    JSON.stringify({ slug: route(localRoute), title, description, jsonLd, html: body }, null, 1));
  manifestPages.push({ slug: route(localRoute), file: `pages/${outName}`, title, bytes: body.length });
}

// site-wide code assets
fs.copyFileSync(path.join(DIST, "assets", "site.css"), path.join(OUT, "site.css"));
fs.copyFileSync(path.join(DIST, "assets", "site.js"), path.join(OUT, "site.js"));

// every local file that has to be uploaded before the pages will render
for (const h of headMedia) referenced.add(h);
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

const totalBytes = media.reduce((a, m) => a + m.bytes, 0);
const totalMB = (totalBytes / 1048576).toFixed(1);

fs.writeFileSync(path.join(OUT, "media-manifest.json"), JSON.stringify({
  count: media.length,
  totalBytes,
  lean: LEAN,
  headOnly: [...headMedia].sort(),
  files: media,
}, null, 1));

const readme = `# Instatic import — Mason Park Dental for Kids

Generated by \`to-instatic.mjs\` from \`dist/\`. ${manifestPages.length} pages,
${media.length} media files (${totalMB} MB)${LEAN ? ", built with `--lean`" : ""}.

Site: \`pediatricdentistkatytx.com\`. This is the PEDIATRIC brand — not
\`bestdentistinkatytx.com\`, which is the parent practice and is already live on
its own Instatic instance. Confirm which instance you are signed into before you
create a single page.

## What is here

| Path | What it is |
| :--- | :--- |
| \`pages/*.json\` | One page each: \`{ slug, title, description, jsonLd, html }\`. \`html\` is a **body**, not a document. |
| \`site.css\` | The whole stylesheet. Goes in as **one site-wide code asset**, not per page. |
| \`site.js\` | Mobile menu + deferred map. Also a site-wide code asset. |
| \`media-manifest.json\` | Every image to upload, with its size. \`headOnly\` lists the ones no page body references. |

## Run order — media first, and this order matters

Instatic assigns an id at upload time and renames files on the way in
(\`.jpeg\` → \`.jpg\`, \`.\` → \`_\`), so image paths **cannot be predicted**. Pages
built before the upload will point at \`/assets/...\` and render broken.

1. **Upload the media** in \`media-manifest.json\`.
2. **Harvest the map** — a JSON of \`{ "<local name>": "/uploads/<id>-<name>" }\`.
   **Key it by the full relative path** (\`"uploads/2023/11/x.webp"\`), never by
   the basename alone. ${ambiguousBasenames.size} basenames in this site's media are used by more
   than one file, so a basename-keyed map is a coin flip; this script refuses to
   finish when a match could only be made by an ambiguous basename.

   Measured 2026-08-31, the one such basename in the \`--lean\` set —
   \`Dentist-in-Katy-Office.webp\`, in both \`2023/11\` and \`2024/09\` — is the
   SAME IMAGE: both are 95606 bytes and hash to \`8ca3aedb…\`. (An earlier note
   here claimed they differed in size because the photo was re-uploaded. They do
   not.) So on this site today the ambiguity is harmless in its effect and the
   refusal is insurance, not a fix for a live bug. \`push-media.mjs\` groups by
   SHA-256 and uploads identical bytes once, mapping every path in the group to
   that single asset — which also stops the duplicate being re-snapshotted into
   the volume on every publish.
3. **Re-run this script with the map**: \`node to-instatic.mjs --media <map>.json\`.
   It reports anything still unmapped instead of shipping a broken path.
   Pass \`--lean\` in **both** runs if you used it in the first, or the pages
   come back out with srcset candidates that were never uploaded.

   Write the map **outside \`instatic/\`** — this script does
   \`rmSync(instatic/)\` before regenerating, so a map kept in there is read into
   memory by the \`--media\` pass and deleted by that same run.
4. **Convert the HTML to node trees**, in the container:
   \`node ship-payload.mjs && node run-convert.mjs && node fetch-nodes.mjs\`.
   Pages are stored as \`cells.body.nodes\`, not HTML, so this step is not
   optional.
5. **Create the pages**: \`node import-pages.mjs --only core\`, check, then
   \`node import-pages.mjs\`.
6. **Add the code assets and the typography**: \`node import-styles.mjs\` (also
   registers each class name as an empty rule, without which Instatic emits no
   class attributes at all and the site renders unstyled), then
   \`node install-fonts.mjs\` — the published-page CSP blocks
   \`fonts.googleapis.com\`, so the faces must be self-hosted.
7. **Set the favicon**: \`node set-favicon.mjs\` — it is
   \`settings.faviconUrl\`, and it is in \`headOnly\` because a \`<link rel="icon">\`
   never travels in a body export.
8. **Check it**: \`node verify-live.mjs\` — every route 200, every image
   resolving, class attributes present. \`{"publishedPages":54}\` proves none of
   that on its own.

Still open after all of the above: \`jsonLd\` and the meta \`description\` have
nowhere to go. A page row carries only \`title\`, \`slug\` and \`body\`; the parent
practice's site emits its \`og:\` tags and JSON-LD from the \`webzite.open-graph\`
and \`webzite.aeo-schema\` **plugins**, which are not installed here.

## \`--lean\`

\`node to-instatic.mjs --lean\` drops every \`srcset\`/\`sizes\` hint and ships one
file per image. On this site 111 of the ~130 referenced files exist only to fill
a srcset, so the saving is most of the upload.

Worth it twice over on a self-hosted instance: a publish snapshots *every*
runtime asset into the volume and nothing is ever collected, so the asset
footprint is paid again on each publish, not once.

**It also turns out to cost nothing.** The stated cost — phones fetching the
full-size image — does not apply: Instatic derives its OWN responsive variants
on upload (\`-w64\`, \`-w320\`, \`-w350\`, …) and serves those, so the live pages
came out with 144 distinct \`/uploads/\` references from 29 uploaded files.
Shipping the build's srcset candidates only uploads a second, redundant set.
Prefer \`--lean\` permanently on this platform.

## Three things that will bite

- **The MCP cannot run headlessly — but the import can.** 29 of the connector's
  \`site_*\` tools proxy through the in-editor AI chat stream and need the Site
  editor open in a browser. The admin REST API underneath does not: the whole
  import runs through
  \`deliver/process/18-instatic-embeds/lib/insta-api.mjs\` with no browser at all.
  Pages are stored as node trees rather than HTML, so the HTML→nodes step runs
  Instatic's own \`@core/htmlImport\` **inside the container** over
  \`railway ssh\` (\`run-convert.mjs\`), which is what makes the headless route
  possible. The admin must still WORK before the import — that is what
  \`deliver/process/20-instatic-domain-origins\` checks — but nobody has to sit
  in front of it.
- **Never create the same page twice.** Slugs auto-unique, so a repeat gives you
  \`about-2\`, not an overwrite. \`import-pages.mjs\` skips any row that already
  carries more than the empty \`base.body\` node unless you pass \`--overwrite\`,
  and reuses the default install's \`index\` row for the home page.
- **\`.env\` in this worktree shipped pointing at the PARENT practice's live
  site**, inherited from the 2026-08-28 worktree split. Corrected 2026-08-31 to
  the pediatric instance, \`https://mason-park-kids.up.railway.app\`. Check it
  before running anything that writes — every script here prints the host it is
  about to touch as its first line, for exactly this reason.

## Routes

Every route matches the old WordPress URL with the trailing slash dropped, so
existing rankings and inbound links land correctly. The 24 \`/services/*\` routes
were 404s on the live WordPress site — they are new here, recovered from the
abandoned \`hni_\` install, and are the main SEO gain of the rebuild.

\`404.html\` is deliberately not exported: Instatic serves its own not-found page.
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

// Every internal href must land on a slug this bundle actually creates. A link
// to a page that was never exported is a 404 the audit cannot see, because
// locally it resolved to a folder that does exist in dist/.
const known = new Set(slugs);
const danglingBySlug = new Map();
for (const page of manifestPages) {
  const d = JSON.parse(fs.readFileSync(path.join(OUT, page.file), "utf8"));
  for (const m of d.html.matchAll(/\bhref="(\/[^"#]*)(?:#[^"]*)?"/g)) {
    const target = m[1];
    if (target.startsWith("/uploads/") || target.startsWith("/assets/")) continue;
    if (known.has(target)) continue;
    if (!danglingBySlug.has(target)) danglingBySlug.set(target, new Set());
    danglingBySlug.get(target).add(d.slug);
  }
}

console.log(`${manifestPages.length} pages -> instatic/pages/`);
console.log(`  media to upload: ${media.length} files, ${totalMB} MB${LEAN ? "  (--lean)" : ""}`);
console.log(`  code assets: site.css, site.js`);
console.log(`  json-ld preserved on ${manifestPages.filter((p2) => {
  const d = JSON.parse(fs.readFileSync(path.join(OUT, p2.file), "utf8"));
  return Boolean(d.jsonLd);
}).length} page(s)`);
if (headMedia.size) console.log(`  head-only media (favicon etc): ${headMedia.size} file(s)`);
if (unmapped.size) {
  console.log(`  ! ${unmapped.size} media path(s) NOT mapped to /uploads - upload first, then re-run with --media`);
  if (!mediaArg) console.log(`    (no --media map given, so this is expected on the first pass)`);
}
if (danglingBySlug.size) {
  console.log(`\n${danglingBySlug.size} internal link target(s) have no exported page:`);
  for (const [target, from] of [...danglingBySlug].sort()) {
    console.log(`  ! ${target}  <- ${[...from].slice(0, 3).join(", ")}${from.size > 3 ? ` +${from.size - 3} more` : ""}`);
  }
}
if (ambiguousResolutions.size) {
  console.log(`\n${ambiguousResolutions.size} media path(s) could only be matched by BASENAME, and that`);
  console.log(`basename is used by more than one file in dist/assets/uploads:`);
  for (const s of [...ambiguousResolutions].sort()) console.log("  ! " + s);
  console.log(`  Key the harvest map by the full relative path ("uploads/2023/11/x.webp"),`);
  console.log(`  not the basename. Shipping the wrong photo silently is worse than stopping.`);
  problems.push(`${ambiguousResolutions.size} ambiguous basename match(es)`);
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s) would reach the import:`);
  for (const pr of problems) console.log("  ! " + pr);
  process.exit(1);
}
console.log("  every page validates: body only, usable slug, title present");
if (unwrappedAssetLinks.length) {
  console.log(`  ! ${unwrappedAssetLinks.length} link(s) to a file Instatic would not accept were unwrapped to plain text:`);
  for (const u of [...new Set(unwrappedAssetLinks)]) console.log(`      ${u}`);
}
