// Point every page's and article's og:image at its 1200x630 share version (2026-09-25). The
// shared heroes were 1536x2046 portraits of up to 613 KB, too heavy for WhatsApp and cut in half
// by the 1.91:1 crop. Needs open-graph >= 1.2.3 (which reads width/height from the file name).
//   1. node og/collect-share-sources.mjs <base> > og/share-sources-<host>.json   (what each page shares now)
//   2. node og/render-share-cards.mjs og/share-sources-<host>.json              (og/share/*-share-1200x630.jpg)
//   3. INSTATIC_BASE_URL=<base> node bugherd/set-share-images.mjs [--apply]      (upload, override, publish)
// The source list is read from the live pages, so the home page's three-doctors photo and the
// Spanish page's fallback (set by set-open-graph.mjs) carry through. Existing override fields
// (the descriptions) are kept. Idempotent.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as I from "../insta.mjs";
const APPLY = process.argv.includes("--apply");
const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = new URL(I.BASE).host;
const sources = JSON.parse(fs.readFileSync(path.join(HERE, "og", `share-sources-${host.split(".")[0]}.json`), "utf8"));
const nameOf = (url) => url.replace(/^.*\/uploads\/[A-Za-z0-9_-]{21}-/, "").replace(/-\d+x\d+(\.\w+)$/, "").replace(/\.\w+$/, "") + "-share-1200x630.jpg";
const PLUGIN = "/admin/api/cms/plugins/brandklout.open-graph";

const { plugins } = await I.api("GET", "/admin/api/cms/plugins");
const og = plugins.find((p) => p.id === "brandklout.open-graph");
if (!/^1\.(2\.[3-9]|[3-9])/.test(og?.version ?? "")) throw new Error(`open-graph ${og?.version}: install 1.2.3 first`);

const media = await I.listMedia();
const items = media.assets ?? media.rows ?? media ?? [];
const urlOf = (a) => a.publicPath ?? a.public_path ?? a.url ?? a.path;
const have = new Map(items.map((a) => [a.filename ?? a.name ?? a.originalName, urlOf(a)]));
const listed = await I.api("GET", `${PLUGIN}/runtime/pages`);
const rows = listed.rows ?? listed.pages ?? listed;
const byKey = new Map(rows.map((r) => [r.key, r]));

const plan = [];
for (const [key, s] of Object.entries(sources)) {
  const r = byKey.get(key);
  if (!r || !s.image) continue;
  const file = nameOf(s.image);
  if (!fs.existsSync(path.join(HERE, "og", "share", file))) throw new Error(`${file} not rendered; run og/render-share-cards.mjs`);
  if (r.override?.image && r.override.image.endsWith("-" + file)) continue;
  plan.push({ r, file, alt: s.alt });
}
const toUpload = [...new Set(plan.map((p) => p.file))].filter((f) => !have.has(f));
console.log(`${I.BASE}: open-graph ${og.version}; ${plan.length} override(s) to point at share images; ${toUpload.length} file(s) to upload`);
if (!APPLY || !plan.length) process.exit(0);

for (const f of toUpload) {
  const out = await I.uploadFile("/admin/api/cms/media", f, fs.readFileSync(path.join(HERE, "og", "share", f)), "image/jpeg");
  have.set(f, urlOf(out.asset ?? out.media ?? out));
}
let n = 0;
for (const { r, file, alt } of plan) {
  const data = { ...(r.override ?? {}), key: r.key, image: have.get(file), enabled: true };
  if (alt && !data.imageAlt) data.imageAlt = alt;
  await I.api("POST", `${PLUGIN}/runtime/override`, data);
  if (++n % 25 === 0) console.log(`  ${n}/${plan.length}`);
}
console.log(`${n} override(s) written`);
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 120)}`);
