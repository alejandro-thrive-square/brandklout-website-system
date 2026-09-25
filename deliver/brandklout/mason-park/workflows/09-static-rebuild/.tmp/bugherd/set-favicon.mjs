// The site favicon, through brandklout.open-graph >= 1.2.0 (the platform has no
// favicon setting). Uploads the icon files if the media library does not have
// them yet, then sets `favicon` and `appleTouchIcon` read-merge-write: every
// other Open Graph setting is sent back exactly as read. --apply also publishes.
//   INSTATIC_BASE_URL=... node bugherd/set-favicon.mjs [--save-settings out.json] [--apply]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as I from "../insta.mjs";
const APPLY = process.argv.includes("--apply");
const saveAt = process.argv.indexOf("--save-settings");
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "home", "assets", "uploads", "2026", "09");
const FILES = { favicon: "mp-favicon-48.png", appleTouchIcon: "mp-favicon-180.png", large: "mp-favicon-192.png" };
const URL_ = "/admin/api/cms/plugins/brandklout.open-graph/settings";
const read = async () => { const r = await I.api("GET", URL_); return r.settings ?? r; };

const before = await read();
if (saveAt > 0) fs.writeFileSync(process.argv[saveAt + 1], JSON.stringify(before, null, 2));
const { plugins } = await I.api("GET", "/admin/api/cms/plugins");
const og = plugins.find((p) => p.id === "brandklout.open-graph");
const hasSetting = (og?.manifest?.settings ?? []).some((s) => s.id === "favicon");
console.log(`open-graph ${og?.version}, favicon setting: ${hasSetting}; now favicon=${JSON.stringify(before.favicon ?? null)}`);
if (!APPLY) process.exit(0);
if (!hasSetting) throw new Error("install brandklout.open-graph 1.2.0 first");

const media = await I.listMedia();
// The same response shapes upload-media.mjs reads.
const items = media.assets ?? media.rows ?? media ?? [];
const urlOf = (a) => a.publicPath ?? a.public_path ?? a.url ?? a.path;
const urlFor = async (name) => {
  const hit = items.find((a) => (a.filename ?? a.name ?? a.originalName) === name);
  if (hit) return urlOf(hit);
  const out = await I.uploadFile("/admin/api/cms/media", name, fs.readFileSync(path.join(DIR, name)), "image/png");
  return urlOf(out.asset ?? out.media ?? out);
};
const favicon = await urlFor(FILES.favicon);
const appleTouchIcon = await urlFor(FILES.appleTouchIcon);
await urlFor(FILES.large);
if (!/^\/uploads\//.test(favicon) || !/^\/uploads\//.test(appleTouchIcon)) throw new Error(`unexpected media urls ${favicon} ${appleTouchIcon}`);
await I.api("PUT", URL_, { settings: { ...before, favicon, appleTouchIcon } });
const after = await read();
for (const k of Object.keys(before)) if (!["favicon", "appleTouchIcon"].includes(k) && JSON.stringify(after[k]) !== JSON.stringify(before[k])) throw new Error(`${k} changed on write`);
console.log(`favicon=${after.favicon} appleTouchIcon=${after.appleTouchIcon}`);
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 120)}`);
