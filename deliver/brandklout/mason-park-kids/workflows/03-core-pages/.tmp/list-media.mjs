// Every media row on the Instatic instance, newest first, to a JSON file.
//   node list-media.mjs > media.log   (never pipe)
import fs from "node:fs";
import { listMedia, BASE } from "./insta.mjs";

const r = await listMedia();
fs.writeFileSync("media-raw.json", JSON.stringify(r, null, 1).slice(0, 4000));
const rows = Array.isArray(r) ? r : (Object.values(r).find(Array.isArray) || []);
const key = (m) => m.createdAt || m.created_at || m.uploadedAt || m.updatedAt || "";
rows.sort((a, b) => String(key(b)).localeCompare(String(key(a))));
fs.writeFileSync("media-list.json", JSON.stringify(rows, null, 2));
console.log(BASE, rows.length, "rows; keys:", Object.keys(rows[0] || {}).join(" "));
for (const m of rows.slice(0, 25)) console.log(key(m), m.id, m.filename || m.name || m.originalName, m.url || m.path || "");
