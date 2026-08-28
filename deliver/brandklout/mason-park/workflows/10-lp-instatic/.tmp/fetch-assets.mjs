/**
 * Pull every image the six landing pages reference onto disk.
 *
 * Webflow serves each image as a base file plus `-p-<width>` srcset
 * derivatives. We keep only the base file, for the same reason the main-site
 * export runs `--lean`: Instatic generates its own responsive variants at
 * upload, so the derivatives are redundant, and a srcset candidate pointing at
 * a file we never uploaded is a broken image. 114 URLs collapse to ~50 files.
 *
 * The Patient Privacy Policy PDF is deliberately NOT downloaded. Instatic
 * refuses `application/pdf` by design (proven on the main-site import), so the
 * link to it is unwrapped in build.mjs instead of shipping a 404.
 *
 *   node fetch-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { baseUrl, localName } from "./urls.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPTURE = path.join(HERE, "capture");
const OUT = path.join(CAPTURE, "assets");
fs.mkdirSync(OUT, { recursive: true });


const urls = new Set(
  fs.readFileSync(path.join(CAPTURE, "media-urls.txt"), "utf8")
    .split(/\s+/).filter(Boolean).map(baseUrl)
    .filter((u) => !/\.pdf$/i.test(u)),
);

// The two chevrons are referenced from the Webflow stylesheet, not the markup,
// so the HTML scrape never sees them and the selects would lose their arrow.
for (const svg of [
  "https://cdn.prod.website-files.com/6a60bdc0340e5f1784b4d553/6a7f58127dbb838f99750585_chevron-down.svg",
  "https://cdn.prod.website-files.com/6a60bdc0340e5f1784b4d553/6a7f58127dbb838f99750586_chevron-down-white.svg",
]) urls.add(svg);

console.log(`${urls.size} files to fetch`);

let ok = 0, skipped = 0;
const failed = [];
for (const u of [...urls].sort()) {
  const dest = path.join(OUT, localName(u));
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) { skipped++; continue; }
  try {
    const res = await fetch(u);
    if (!res.ok) { failed.push([u, res.status]); continue; }
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    ok++;
    process.stdout.write(`\r  fetched ${ok}`);
  } catch (e) {
    failed.push([u, String(e.message).slice(0, 60)]);
  }
}
console.log(`\n${ok} fetched, ${skipped} already on disk, ${failed.length} failed`);
for (const [u, why] of failed) console.log(`  FAIL ${why}  ${u}`);

const total = fs.readdirSync(OUT).reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`assets/: ${fs.readdirSync(OUT).length} files, ${(total / 1e6).toFixed(1)} MB`);
if (failed.length) process.exitCode = 1;
