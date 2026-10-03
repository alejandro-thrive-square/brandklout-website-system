// sha256 of the published HTML (Cloudflare email tokens masked) of a few key pages, to prove the injection changed nothing else.
//
//   node .tmp/terms/hash-pages.mjs <host> <label>      # writes terms/hash-<host>-<label>.json
//   node .tmp/terms/hash-pages.mjs <host> --compare before after
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [host, label, a, b] = process.argv.slice(2);
const PAGES = ["/", "/privacy-policy", "/accessibility-statement", "/contacts", "/about-us", "/our-team",
  "/our-doctors", "/patient-reviews", "/services/invisalign", "/blog", "/sitemap", "/financing"];
const file = (l) => path.join(HERE, `hash-${host}-${l}.json`);

if (label === "--compare") {
  const A = JSON.parse(fs.readFileSync(file(a), "utf8")), B = JSON.parse(fs.readFileSync(file(b), "utf8"));
  let diff = 0;
  for (const p of PAGES) {
    const same = A[p] === B[p];
    if (!same) diff++;
    console.log(`  ${same ? "same" : "DIFF"}  ${p}`);
  }
  console.log(`${host}: ${PAGES.length - diff}/${PAGES.length} byte-identical`);
  process.exit(diff ? 1 : 0);
}

const out = {};
for (const p of PAGES) {
  const res = await fetch(`https://${host}${p}`, { redirect: "follow", headers: { "cache-control": "no-cache" } });
  // Cloudflare's email obfuscation re-keys every response; those tokens are masked, nothing else.
  const body = Buffer.from((await res.text())
    .replace(/(email-protection#)[0-9a-f]+/g, "$1x")
    .replace(/(data-cfemail=")[0-9a-f]+/g, "$1x"));
  out[p] = `${res.status} ${crypto.createHash("sha256").update(body).digest("hex").slice(0, 16)} ${body.length}`;
  console.log(`  ${out[p]}  ${p}`);
}
fs.writeFileSync(file(label), JSON.stringify(out, null, 1));
