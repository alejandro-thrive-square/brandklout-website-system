// ===========================================================================
// Expand `{{img ...}}` macros in home/**/index.html into full <img> tags.
//
// The pages are hand-edited HTML, and an <img> with a four-candidate srcset
// is 600 bytes of paths nobody should type by hand. So a page is authored
// with
//
//   {{img slug="kid-xray-smile" sizes="(max-width: 899px) 100vw, 40vw"}}
//   {{img slug="team-front-desk" sizes="100vw" class="el-x" eager}}
//
// and this turns each into `<img src srcset sizes alt width height loading
// decoding>` from .tmp/album-manifest.json, with the asset prefix worked out
// from the page's own depth (a page one folder down reaches assets with
// `../../`). `alt="..."` overrides the manifest's alt; `eager` sets
// fetchpriority=high and drops loading=lazy; `class`, `id` and `data-*` pass
// through. Idempotent: a page with no macros is left alone byte for byte.
//
//   node expand-img.mjs                    # every page under home/
//   node expand-img.mjs ../home/index.html
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, "..", "home");
const MANIFEST = JSON.parse(fs.readFileSync(path.join(HERE, "album-manifest.json"), "utf8"));

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const pages = process.argv.length > 2
  ? process.argv.slice(2).map((p) => path.resolve(p))
  : walk(SITE).filter((f) => f.endsWith("index.html"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  if (!html.includes("{{img")) continue;
  const depth = path.relative(SITE, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const prefix = "../".repeat(depth) + "assets/uploads/2026/09/";
  let n = 0;
  const out = html.replace(/\{\{img\s+([^}]*)\}\}/g, (_, args) => {
    const attrs = {};
    for (const m of args.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[m[1]] = m[2] === undefined ? true : m[2];
    const entry = MANIFEST[attrs.slug];
    if (!entry) throw new Error(`${path.relative(SITE, file)}: unknown slug "${attrs.slug}"`);
    const sizes = entry.sizes;
    const largest = sizes[sizes.length - 1];
    const srcset = sizes.map((s) => `${prefix}${s.file} ${s.w}w`).join(", ");
    const alt = attrs.alt !== undefined ? attrs.alt : entry.alt;
    const parts = [
      `src="${prefix}${largest.file}"`,
      `srcset="${srcset}"`,
      `sizes="${esc(attrs.sizes || "100vw")}"`,
      `alt="${esc(alt)}"`,
      `width="${largest.w}"`,
      `height="${largest.h}"`,
    ];
    if (attrs.class) parts.push(`class="${esc(attrs.class)}"`);
    if (attrs.id) parts.push(`id="${esc(attrs.id)}"`);
    for (const k of Object.keys(attrs)) if (k.startsWith("data-")) parts.push(`${k}="${esc(String(attrs[k]))}"`);
    if (attrs["aria-hidden"]) parts.push(`aria-hidden="true"`);
    if (attrs.eager) parts.push(`fetchpriority="high"`);
    else parts.push(`loading="lazy"`);
    parts.push(`decoding="async"`);
    n++;
    return `<img ${parts.join(" ")}>`;
  });
  fs.writeFileSync(file, out);
  console.log(`${path.relative(SITE, file)}: ${n} images expanded`);
}
