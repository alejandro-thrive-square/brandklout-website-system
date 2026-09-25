// The GHL number pool on EVERY production page (client, 2026-09-25: the swap worked "only on
// the landing pages"). The pool is "All Visitors" with 4 numbers forwarding to (281) 769-8878.
// Added through brandklout.embed-origins `siteScripts` (after Termly), plus the hosts the two
// scripts call in `connectOrigins`: pages with no Embed block run a strict CSP, and a missing
// connect-src silently turns the swap off. Read-merge-write: every other setting is sent back
// exactly as read. Production only: staging visits would take real numbers from the pool.
// Not consent-gated (client, 2026-09-22). Idempotent. --apply also publishes.
//   INSTATIC_BASE_URL=https://www.masonparkdental.com node bugherd/set-site-pool.mjs [--apply]
import * as I from "../insta.mjs";
if (I.IS_STAGING) throw new Error("production only: staging would burn real pool numbers");
const APPLY = process.argv.includes("--apply");
const SCRIPTS = [
  "https://backend.leadconnectorhq.com/appengine/loc/9tm8C3iReDUyrhdV01Kd/pool/haD8dfHnprszNglZQtBV/number_pool.js",
  "https://backend.leadconnectorhq.com/appengine/js/user_session.js",
];
const CONNECT = ["https://services.leadconnectorhq.com", "https://services.msgsndr.com"];
const URL_ = "/admin/api/cms/plugins/brandklout.embed-origins/settings";
const read = async () => { const r = await I.api("GET", URL_); return r.settings ?? r; };
const s = await read();
const lines = String(s.siteScripts || "").split(/\n/).map((x) => x.trim()).filter(Boolean);
const conn = String(s.connectOrigins || "").split(/\s+/).filter(Boolean);
const next = {
  ...s,
  siteScripts: [...lines, ...SCRIPTS.filter((u) => !lines.includes(u))].join("\n"),
  connectOrigins: [...conn, ...CONNECT.filter((o) => !conn.includes(o))].join(" "),
};
console.log(`siteScripts:\n  ${next.siteScripts.split("\n").join("\n  ")}\nconnectOrigins: ${next.connectOrigins}`);
if (next.siteScripts === s.siteScripts && next.connectOrigins === s.connectOrigins) { console.log("already set"); process.exit(0); }
if (!APPLY) process.exit(0);
await I.api("PUT", URL_, { settings: next });
const after = await read();
for (const k of Object.keys(s)) if (!["siteScripts", "connectOrigins"].includes(k) && JSON.stringify(after[k]) !== JSON.stringify(s[k])) throw new Error(`${k} changed on write`);
if (after.siteScripts !== next.siteScripts || after.connectOrigins !== next.connectOrigins) throw new Error("write did not stick");
console.log(`publish: ${JSON.stringify(await I.publish()).slice(0, 120)}`);
