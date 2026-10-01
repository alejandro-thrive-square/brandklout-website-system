// Let Cloudflare Web Analytics through the page CSP (BugHerd #264, 2026-10-01).
//
//   INSTATIC_BASE_URL=<base> node bugherd/r7/set-csp-insights.mjs [--apply]
//
// Cloudflare injects https://static.cloudflareinsights.com/beacon.min.js at its edge into every
// HTML response on the zone. On pages with no Embed block, brandklout.embed-origins runs the
// strict policy, so the beacon was refused ("violates ... script-src") and those visits were
// never counted. The beacon reports to https://cloudflareinsights.com/cdn-cgi/rum.
// Read-merge-write: every other setting goes back exactly as read. No publish here.
import * as I from "../../insta.mjs";

const APPLY = process.argv.includes("--apply");
const ADD = { scriptOrigins: ["https://static.cloudflareinsights.com"], connectOrigins: ["https://cloudflareinsights.com"] };
const URL_ = "/admin/api/cms/plugins/brandklout.embed-origins/settings";
const read = async () => { const r = await I.api("GET", URL_); return r.settings ?? r; };
const s = await read();
const next = { ...s };
for (const [k, add] of Object.entries(ADD)) {
  const have = String(s[k] || "").split(/\s+/).filter(Boolean);
  next[k] = [...have, ...add.filter((o) => !have.includes(o))].join(" ");
}
console.log(`${I.BASE}\n  scriptOrigins:  ${next.scriptOrigins}\n  connectOrigins: ${next.connectOrigins}`);
if (Object.keys(ADD).every((k) => next[k] === s[k])) { console.log("already set"); process.exit(0); }
if (!APPLY) process.exit(0);
await I.api("PUT", URL_, { settings: next });
const after = await read();
for (const k of Object.keys(s)) if (!(k in ADD) && JSON.stringify(after[k]) !== JSON.stringify(s[k])) throw new Error(`${k} changed on write`);
for (const k of Object.keys(ADD)) if (after[k] !== next[k]) throw new Error(`${k} did not stick`);
console.log("written");
