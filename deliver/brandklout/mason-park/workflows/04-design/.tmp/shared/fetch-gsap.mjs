// Restore the vendored GSAP the three packages load.
//
// GSAP is a third-party library and is not tracked in this repo (nothing else
// here vendors it either), so a fresh checkout has no _vendor/gsap/ and every
// page falls back to plain, fully readable HTML with no motion. This fetches
// the exact version the packages were built and verified against.
//
// All plugins below are free since GSAP 3.13 — ScrollTrigger, SplitText and
// ScrollToPlugin included. The Webflow build should load the same files from
// the GSAP CDN via Page Settings rather than uploading them.
//
// Usage: node fetch-gsap.mjs
// Source Asana task GID: 1217040406855582
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "../_vendor/gsap");

const VERSION = "3.13.0";
const FILES = [
  "gsap.min.js",
  "ScrollTrigger.min.js",
  "ScrollToPlugin.min.js",
  "SplitText.min.js",
];

fs.mkdirSync(OUT, { recursive: true });

let failed = 0;
for (const file of FILES) {
  const url = `https://cdn.jsdelivr.net/npm/gsap@${VERSION}/dist/${file}`;
  process.stdout.write(`  ${file} … `);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = Buffer.from(await res.arrayBuffer());
    // A CDN error page is still a 200 with HTML in it; refuse to write one.
    if (body.length < 2000 || /^\s*</.test(body.toString("utf8", 0, 40))) {
      throw new Error(`unexpected payload (${body.length} bytes)`);
    }
    fs.writeFileSync(path.join(OUT, file), body);
    console.log(`${body.length} bytes`);
  } catch (e) {
    failed++;
    console.log(`FAILED — ${e.message}`);
  }
}

console.log(
  failed
    ? `\n${failed}/${FILES.length} failed. The pages still render, without motion.`
    : `\nGSAP ${VERSION} restored to ${OUT}`
);
process.exit(failed ? 1 : 0);
