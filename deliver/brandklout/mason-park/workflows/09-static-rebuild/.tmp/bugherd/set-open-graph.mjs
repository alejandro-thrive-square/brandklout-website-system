// Open Graph, filled in (2026-09-25: "The opengraph please"). Needs brandklout.open-graph >= 1.2.1
// (articles-table read access, and a description tag inserted where the platform emits none).
//   1. Site settings, read-merge-write: siteUrl = this instance's own address (production:
//      www; staging: its own host, so staging never points canonicals or og:url at production),
//      siteName, and the 1200x630 fallback share image. emitCanonical is left as it is
//      (production on, staging off).
//   2. One override per rebuilt page: its description from the build's <meta name="description">
//      (og/page-descriptions.json). Title, image and URL stay derived: the page's <title>, its hero
//      photo, siteUrl + slug. Articles need no override: their seoDescription is read directly.
// Idempotent. --apply writes and publishes.
//   INSTATIC_BASE_URL=... node bugherd/set-open-graph.mjs [--apply]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as I from "../insta.mjs";
const APPLY = process.argv.includes("--apply");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS = path.join(HERE, "..", "..", "home", "assets", "uploads", "2026", "09");
const DESCS = JSON.parse(fs.readFileSync(path.join(HERE, "..", "og", "page-descriptions.json"), "utf8"));
// Production-only old rows have no build HTML; their descriptions are written from their own copy.
for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(HERE, "..", "og", "old-page-descriptions.json"), "utf8")))) if (!k.startsWith("_")) DESCS[k] ??= v;
const SHARE = "mp-share-default-1200x630.jpg";
// The home hero is the Nguyen and Sung family photo; shared, it would put Dr. Sung first and Dr.
// Cho nowhere ("Dr. Cho leads", 2026-09-24). The home card uses the three doctors instead.
const IMAGE_OVERRIDES = {
  index: { file: "mp-n124-three-doctors-1536x865.jpg", alt: "Dr. Dave Cho, Dr. Tam Nguyen and Dr. William Sung side by side in black scrubs" },
  // Its first picture hotlinks grandmissiondentistry.com, which 404s (known since launch).
  "dental-implant-costs-esp": { file: "mp-share-default-1200x630.jpg", alt: "The front desk at Mason Park Dental of Katy, answering a call" },
};
const PLUGIN = "/admin/api/cms/plugins/brandklout.open-graph";

const { plugins } = await I.api("GET", "/admin/api/cms/plugins");
const og = plugins.find((p) => p.id === "brandklout.open-graph");
if (!(og?.manifest?.contentAccess ?? []).some((c) => c.table === "articles")) throw new Error(`open-graph ${og?.version} cannot read articles: install 1.2.1 first`);

const got = await I.api("GET", `${PLUGIN}/settings`);
const before = got.settings ?? got;
const media = await I.listMedia();
const items = media.assets ?? media.rows ?? media ?? [];
const urlOf = (a) => a.publicPath ?? a.public_path ?? a.url ?? a.path;
const findMedia = (name) => { const a = items.find((x) => (x.filename ?? x.name ?? x.originalName) === name); return a ? urlOf(a) : null; };
const ensureMedia = async (name, mime) => findMedia(name) ?? urlOf(((o) => o.asset ?? o.media ?? o)(await I.uploadFile("/admin/api/cms/media", name, fs.readFileSync(path.join(UPLOADS, name)), mime)));
let share = findMedia(SHARE);
const next = {
  ...before,
  siteUrl: I.BASE,
  siteName: "Mason Park Dental of Katy",
  defaultImageAlt: "The front desk at Mason Park Dental of Katy, answering a call",
};

const listed = await I.api("GET", `${PLUGIN}/runtime/pages`);
const rows = listed.rows ?? listed.pages ?? listed;
const imageUrls = {};
for (const [slug, o] of Object.entries(IMAGE_OVERRIDES)) imageUrls[slug] = findMedia(o.file);
const want = (r) => ({ description: DESCS[r.slug], ...(IMAGE_OVERRIDES[r.slug] ? { image: imageUrls[r.slug] ?? "(upload)", imageAlt: IMAGE_OVERRIDES[r.slug].alt } : {}) });
const plan = rows.filter((r) => r.kind === "page" && DESCS[r.slug] && Object.entries(want(r)).some(([k, v]) => r.override?.[k] !== v));
console.log(`${I.BASE}: open-graph ${og.version}; siteUrl ${JSON.stringify(before.siteUrl)} -> ${next.siteUrl}; share image ${share ?? "(to upload)"}`);
console.log(`${rows.filter((r) => r.kind === "page").length} pages, ${rows.filter((r) => r.kind === "entry").length} articles; ${plan.length} description override(s) to write; ${rows.filter((r) => r.kind === "page" && !DESCS[r.slug]).length} pages not in the build (old rows) keep deriving`);
if (!APPLY) process.exit(0);

share = await ensureMedia(SHARE, "image/jpeg");
for (const [slug, o] of Object.entries(IMAGE_OVERRIDES)) imageUrls[slug] = await ensureMedia(o.file, "image/jpeg");
next.defaultImage = share;
await I.api("PUT", `${PLUGIN}/settings`, { settings: next });
const got2 = await I.api("GET", `${PLUGIN}/settings`);
const after = got2.settings ?? got2;
for (const k of Object.keys(before)) if (!["siteUrl", "siteName", "defaultImage", "defaultImageAlt"].includes(k) && JSON.stringify(after[k]) !== JSON.stringify(before[k])) throw new Error(`${k} changed on write`);

let written = 0;
for (const r of plan) {
  const data = { ...(r.override ?? {}), key: r.key, ...want(r), enabled: true };
  await I.api("POST", `${PLUGIN}/runtime/override`, data);
  written++;
}
console.log(`settings written; ${written} override(s) written`);
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 120)}`);
