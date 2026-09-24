// Add one origin to brandklout.embed-origins frameOrigins on INSTATIC_BASE_URL,
// read-merge-write: every other setting (Termly, Sienna, connect origins) is sent back
// exactly as read. Idempotent.
//   INSTATIC_BASE_URL=... node add-frame-origin.mjs https://www.google.com
import * as I from "../insta.mjs";
const origin = process.argv[2];
if (!/^https:\/\/[a-z0-9.-]+$/.test(origin || "")) throw new Error("usage: add-frame-origin.mjs https://host");
const URL_ = "/admin/api/cms/plugins/brandklout.embed-origins/settings";
const read = async () => { const r = await I.api("GET", URL_); return r.settings ?? r; };
const s = await read();
const list = String(s.frameOrigins || "").split(/\s+/).filter(Boolean);
if (list.includes(origin)) { console.log(`already there: ${list.join(" ")}`); process.exit(0); }
const next = { ...s, frameOrigins: [...list, origin].join(" ") };
await I.api("PUT", URL_, { settings: next });
const after = await read();
for (const k of Object.keys(s)) if (k !== "frameOrigins" && JSON.stringify(after[k]) !== JSON.stringify(s[k])) throw new Error(`${k} changed on write`);
console.log(`frameOrigins: ${after.frameOrigins}`);
