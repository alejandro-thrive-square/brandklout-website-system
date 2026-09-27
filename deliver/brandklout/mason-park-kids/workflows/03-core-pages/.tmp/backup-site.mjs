// Dump the whole instance to one local JSON file: shell, every page's node
// graph, media records, publish status. Run it before anything destructive;
// import-pages.mjs overwrites eight live pages.
//
//   node backup-site.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSite, getPages, listMedia, publishStatus, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const host = BASE.replace(/^https?:\/\//, "");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const out = path.join(HERE, `backup-${host}-${stamp}.json`);

const site = await getSite();
const pages = (await getPages()).rows ?? [];
const media = await listMedia();
const status = await publishStatus();
fs.writeFileSync(out, JSON.stringify({ takenAt: new Date().toISOString(), base: BASE, site, pages, media, status }, null, 1));
console.log(`${BASE}: shell seq ${site.seq}, ${pages.length} pages, ${(media.assets ?? media.rows ?? []).length} media`);
console.log(`-> ${path.basename(out)} (${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
