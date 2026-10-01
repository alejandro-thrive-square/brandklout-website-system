// Write each image's alt text onto its media asset, where base.image reads it.
//
//   node set-media-alt.mjs              # dry run: what would change
//   node set-media-alt.mjs --apply      # PATCH /admin/api/cms/media/:id { altText }
//
// base.image emits `alt="<asset altText>"` and nothing else (the module source:
// "Alt text comes exclusively from the library asset"). apply-image-alt.mjs
// records, per image file, the alt every <img> in the source gives it
// (media-alt.json); this sets the asset's altText to the most used non-empty one.
// A decorative use (alt="", aria-hidden) of a described file then carries the
// description, which aria-hidden keeps away from screen readers.
//
// Media is per instance: run it against staging and production separately.
// It changes no page; the next publish re-renders every page with the new alts.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { api, listMedia, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");
const recorded = JSON.parse(fs.readFileSync(path.join(HERE, "media-alt.json"), "utf8"));

const counts = {};
for (const set of Object.values(recorded))
  for (const [src, alts] of Object.entries(set))
    for (const [alt, n] of Object.entries(alts)) {
      const per = (counts[src] ??= {});
      per[alt] = (per[alt] ?? 0) + n;
    }

const want = {};
const conflicts = [];
for (const [src, alts] of Object.entries(counts)) {
  const described = Object.entries(alts).filter(([a]) => a.trim()).sort((a, b) => b[1] - a[1]);
  if (!described.length) continue;
  want[src] = described[0][0];
  if (described.length > 1) conflicts.push(`${src}\n    uses ${JSON.stringify(described[0][0])}; also ${described.slice(1).map(([a, n]) => `${JSON.stringify(a)} x${n}`).join(", ")}`);
}

const listAll = async () => { const m = await listMedia(); return m.assets ?? m; };
const assets = await listAll();
const byPath = new Map(assets.filter((a) => !a.deletedAt).map((a) => [a.publicPath, a]));
console.log(`${BASE}: ${assets.length} media records, ${Object.keys(want).length} image files with an alt`);

const todo = [];
const missing = [];
for (const [src, alt] of Object.entries(want)) {
  const a = byPath.get(src);
  if (!a) { missing.push(src); continue; }
  if ((a.altText ?? "") !== alt) todo.push({ id: a.id, src, from: a.altText ?? "", to: alt });
}
for (const c of conflicts) console.log(`conflict ${c}`);
if (missing.length) {
  console.error(`${missing.length} image file(s) not in the media library:\n  ${missing.slice(0, 20).join("\n  ")}`);
  process.exit(1);
}
console.log(`${todo.length} asset(s) to update, ${Object.keys(want).length - todo.length} already right`);
for (const t of todo.slice(0, 5)) console.log(`  ${t.src}  ${JSON.stringify(t.from)} -> ${JSON.stringify(t.to)}`);
if (!APPLY) { console.log("DRY RUN - re-run with --apply"); process.exit(0); }

let done = 0;
for (const t of todo) {
  await api("PATCH", `/admin/api/cms/media/${t.id}`, { altText: t.to });
  if (++done % 50 === 0) console.log(`  ${done}/${todo.length}`);
}
const back = new Map((await listAll()).map((a) => [a.publicPath, a.altText ?? ""]));
const wrong = Object.entries(want).filter(([src, alt]) => back.get(src) !== alt);
console.log(`patched ${done}; read back: ${Object.keys(want).length - wrong.length}/${Object.keys(want).length} right`);
if (wrong.length) { console.error(`not set: ${wrong.slice(0, 10).map(([s]) => s).join(", ")}`); process.exit(1); }
