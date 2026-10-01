// Turn home/ into what Instatic should hold.
//
//   node to-instatic.mjs [--media instatic-media-map.json] [--lean] [--only /,/our-team]
//
// Output: instatic/
//   pages/<slug>.json     { slug, title, description, bodyClass, html }  - body-only
//   site.css              the site-wide stylesheet code asset
//   site.js               the mobile menu and deferred map (bundled with GSAP by import-scripts.mjs)
//   media-manifest.json   every local file a page points at, with its size
//
// Ported from the parent practice's `09-static-rebuild/.tmp/to-instatic.mjs`.
// The local page and the Instatic page are the same markup with three
// differences, and only three:
//
//   1. ROUTES.  Local is a folder of index.html files; Instatic is routed.
//      `/about-us/` -> `/about-us`, `/` stays `/`.
//   2. MEDIA.   Local is `assets/uploads/...`; Instatic is `/uploads/<id>-<name>`,
//      and the id is assigned AT UPLOAD. Upload first, harvest the map, then run
//      this with --media. Without a map every path is reported as unmapped.
//   3. SCRIPTS AND STYLES.  Instatic holds these as site-wide code assets, so
//      every <script> and <link> is dropped from the body and shipped separately.
//
// THE BODY'S OWN CLASSES ARE CONTENT and the body-only slice throws them away.
// `has-journey` is the switch for the floating chrome and the runtime's chrome
// scene, so it is recorded as `bodyClass` and apply-body-class.mjs puts it on
// the converted root node.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.join(HERE, "..", "home");
const OUT = path.join(HERE, "instatic");

const argv = process.argv.slice(2);
const mediaArg = argv.includes("--media") ? argv[argv.indexOf("--media") + 1] : null;
const MEDIA = mediaArg && fs.existsSync(mediaArg) ? JSON.parse(fs.readFileSync(mediaArg, "utf8")) : {};
// --lean drops the srcset candidates and ships one file per image. Instatic
// derives its own width variants on upload, so the candidates are redundant
// there; use the SAME flag on both passes.
const LEAN = argv.includes("--lean");
// --only /,/our-team converts just those pages (2026-10-01). Every later step of a publish chain
// (upload-media, ship-payload, run-convert, fetch-nodes, apply-*, import-pages) works on what this
// writes, so a two-page update ships two pages instead of all 216. Safe: import-pages and
// import-styles are incremental (no deletions; style rules are only added). Use the SAME list on
// both passes and on import-pages.
const ONLY = argv.includes("--only") ? new Set(argv[argv.indexOf("--only") + 1].split(",")) : null;

if (!fs.existsSync(HOME)) { console.error("../home/ does not exist"); process.exit(1); }

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

export const route = (href) => {
  if (!href.startsWith("/")) return href;
  const [pathPart, hash = ""] = href.split(/(?=#)/);
  if (pathPart === "/") return "/" + hash;
  return pathPart.replace(/\/+$/, "") + hash;
};

const unmapped = new Set();
const referenced = new Set();
export const upload = (src) => {
  if (!src.startsWith("/assets/")) return src;
  referenced.add(src);
  const name = src.replace(/^\/assets\//, "");
  const hit = MEDIA[name] || MEDIA[path.basename(name)];
  if (!hit) { unmapped.add(src); return src; }
  return hit;
};

const transform = (html) => {
  // Pages address assets relatively (`assets/`, `../assets/`, `../../assets/`)
  // so they open from file://. Collapse every depth to the absolute form first.
  let out = html.replace(/(["\s])(?:\.\.\/)+assets\//g, "$1/assets/");
  out = out.split('"assets/').join('"/assets/').split(" assets/").join(" /assets/");

  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  out = out.replace(/<link\b[^>]*>/gi, "");

  const bodyAt = out.indexOf("<body");
  const bodyEnd = bodyAt === -1 ? -1 : out.indexOf(">", bodyAt);
  const close = out.lastIndexOf("</body>");
  if (bodyEnd === -1 || close === -1) throw new Error("no <body>");
  out = out.slice(bodyEnd + 1, close);

  out = out.replace(/\bhref="(\/[^"]*)"/g, (_, href) =>
    `href="${href.startsWith("/assets/") ? upload(href) : route(href)}"`);

  if (LEAN) out = out.replace(/\s(?:srcset|data-srcset|sizes)="[^"]*"/g, "");
  out = out.replace(/\bsrc="(\/assets\/[^"]+)"/g, (_, s) => `src="${upload(s)}"`);
  out = out.replace(/\bdata-src="(\/assets\/[^"]+)"/g, (_, s) => `data-src="${upload(s)}"`);
  out = out.replace(/\bsrcset="([^"]+)"/g, (_, set) => {
    const rebuilt = set.split(",").map((c) => {
      const [u, w] = c.trim().split(/\s+/);
      return `${upload(u)}${w ? " " + w : ""}`;
    }).join(", ");
    return `srcset="${rebuilt}"`;
  });

  return out.replace(/\n{3,}/g, "\n\n").trim();
};

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "–", mdash: "—", hellip: "…", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”" };
const decodeEntities = (s) =>
  s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (whole, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : whole;
    }
    const hit = NAMED[body.toLowerCase()];
    return hit === undefined ? whole : hit;
  });

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "pages"), { recursive: true });

const pages = walk(HOME).filter((f) => f.endsWith("index.html"));
const manifestPages = [];

for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(HOME, path.dirname(file)).split(path.sep).join("/");
  const isHome = rel === "." || rel === "";
  const localRoute = isHome ? "/" : "/" + rel + "/";
  const slug = isHome ? "home" : rel;
  if (ONLY && !ONLY.has(route(localRoute))) continue;
  const title = decodeEntities((html.match(/<title>([\s\S]*?)<\/title>/i) || [, ""])[1].trim());
  const description = decodeEntities((html.match(/<meta name="description" content="([^"]*)"/i) || [, ""])[1].trim());
  const bodyClass = (html.match(/<body[^>]*\sclass="([^"]*)"/i) || [, ""])[1].trim();
  const body = transform(html);
  const fileName = slug.replace(/\//g, "__") + ".json";
  fs.writeFileSync(path.join(OUT, "pages", fileName),
    JSON.stringify({ slug: route(localRoute), title, description, bodyClass, html: body }, null, 1));
  manifestPages.push({ slug: route(localRoute), file: `pages/${fileName}`, title, bytes: body.length });
}

fs.copyFileSync(path.join(HOME, "assets", "site.css"), path.join(OUT, "site.css"));
fs.copyFileSync(path.join(HOME, "assets", "site.js"), path.join(OUT, "site.js"));

const media = walk(HOME)
  .filter((f) => /[\\/]assets[\\/]uploads[\\/]/.test(f))
  .map((f) => {
    const web = "/" + path.relative(HOME, f).split(path.sep).join("/");
    return { local: web, name: web.replace(/^\/assets\//, ""), bytes: fs.statSync(f).size };
  })
  .filter((m) => referenced.has(m.local))
  .sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(path.join(OUT, "media-manifest.json"), JSON.stringify({
  lean: LEAN, count: media.length, totalBytes: media.reduce((a, m) => a + m.bytes, 0), files: media,
}, null, 1));

// ------------------------------------------------------------------ validate
const problems = [];
if (ONLY) for (const s of ONLY) if (!manifestPages.some((p) => p.slug === s)) problems.push(`--only ${s}: no such page`);
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
const slugs = manifestPages.map((p) => p.slug);
for (const sl of new Set(slugs.filter((s, i) => slugs.indexOf(s) !== i))) problems.push(`duplicate slug ${sl}`);

console.log(`${manifestPages.length} pages -> instatic/pages/`);
for (const p of manifestPages) console.log(`  ${p.slug.padEnd(48)} ${(p.bytes / 1024).toFixed(0)} KB`);
console.log(`  media to upload: ${media.length} files, ${(media.reduce((a, m) => a + m.bytes, 0) / 1048576).toFixed(1)} MB${LEAN ? " (lean)" : ""}`);
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
