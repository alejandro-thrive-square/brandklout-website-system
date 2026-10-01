// sha256 of key published pages, to prove an injection left every other page byte-identical.
//   node .tmp/hipaa/hash-pages.mjs <base> <out.json>            # record
//   node .tmp/hipaa/hash-pages.mjs <base> <out.json> <before.json>   # record and compare
import fs from "node:fs";
import crypto from "node:crypto";

const [base, out, before] = process.argv.slice(2);
const PATHS = ["/", "/privacy-policy", "/terms-of-service", "/contacts", "/about-us", "/patient-reviews",
  "/services/invisalign", "/our-services", "/blog", "/sitemap", "/cookie-policy", "/ads-landing-pages/invisalign"];
const res = {};
for (const p of PATHS) {
  const r = await fetch(base.replace(/\/$/, "") + p, { headers: { "cache-control": "no-cache", "user-agent": "Mozilla/5.0 hash-pages" }, redirect: "manual" });
  // Cloudflare's email obfuscation re-keys the hex on every response, and every Instatic publish
  // mints a new asset build id (/_instatic/assets/<id>/) and bumps the plugin module-js ?v= counter
  // (pages with an Embed); nothing else varies. Hashes recorded before a normaliser change are not
  // comparable: re-record the baseline.
  const body = Buffer.from((await r.text())
    .replace(/\/_instatic\/assets\/[A-Za-z0-9_-]+\//g, "/_instatic/assets/BUILD/")
    .replace(/(\/_instatic\/module-js\/[^"?]+)\?v=\d+/g, "$1?v=N")
    .replace(/email-protection#[0-9a-f]+/g, "email-protection#X")
    .replace(/data-cfemail="[0-9a-f]+"/g, 'data-cfemail="X"'));
  res[p] = { status: r.status, bytes: body.length, sha256: crypto.createHash("sha256").update(body).digest("hex") };
}
fs.writeFileSync(out, JSON.stringify({ base, at: new Date().toISOString(), pages: res }, null, 1));
const prev = before ? JSON.parse(fs.readFileSync(before, "utf8")).pages : null;
let diff = 0;
for (const [p, v] of Object.entries(res)) {
  const same = prev ? (prev[p]?.sha256 === v.sha256 ? "identical" : (diff++, `CHANGED (was ${prev[p]?.bytes} bytes)`)) : "";
  console.log(`${String(v.status).padEnd(4)} ${String(v.bytes).padStart(7)}  ${v.sha256.slice(0, 16)}  ${p}  ${same}`);
}
if (prev) console.log(diff ? `${diff} page(s) differ` : "all identical");
process.exitCode = diff ? 1 : 0;
