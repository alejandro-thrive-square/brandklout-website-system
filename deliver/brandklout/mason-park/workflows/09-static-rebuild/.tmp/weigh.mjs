// What a visitor actually downloads, per page.
//
//   node weigh.mjs [--top 12]
//
// Two things make a naive byte count wrong here, and both flatter or damn the
// wrong pages:
//   1. A phone does not fetch the `src` - it picks from `srcset`. So every page
//      is measured twice: what a wide desktop pulls, and what a 390px phone at
//      DPR 2 pulls (~780px of image).
//   2. Images below the fold are loading="lazy" and are NOT fetched on load. A
//      44-image product grid costs almost nothing until you scroll.
// So the headline number is ON LOAD (eager images only) and the second is the
// full scroll. Neither is `du -sh dist`: a 28MB folder can serve a 60KB page.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const argv = process.argv.slice(2);
const TOP = argv.includes("--top") ? Number(argv[argv.indexOf("--top") + 1]) : 12;
const PHONE_TARGET = 780;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const size = (f) => fs.statSync(f).size;
const kb = (b) => (b / 1024).toFixed(0) + " KB";
const mb = (b) => (b / 1048576).toFixed(2) + " MB";

// Which file each <img> resolves to at desktop and at phone width, and whether
// the browser fetches it before the visitor scrolls.
const isEager = (tag) => !/loading="lazy"/.test(tag);
const pick = (tag) => {
  const src = (tag.match(/src="(\/[^"]+)"/) || [])[1];
  const srcset = (tag.match(/srcset="([^"]+)"/) || [])[1];
  if (!srcset) return { desktop: src, phone: src };
  const cands = srcset.split(",")
    .map((c) => { const [u, w] = c.trim().split(/\s+/); return { u, w: parseInt(w, 10) || 0 }; })
    .filter((c) => c.u)
    .sort((a, b) => a.w - b.w);
  if (!cands.length) return { desktop: src, phone: src };
  return {
    desktop: cands[cands.length - 1].u,
    phone: (cands.find((c) => c.w >= PHONE_TARGET) || cands[cands.length - 1]).u,
  };
};

const all = walk(DIST);
const pages = all.filter((f) => f.endsWith("index.html"));
const rows = [];

for (const p of pages) {
  const html = fs.readFileSync(p, "utf8");
  const tags = html.match(/<img[^>]*>/g) || [];
  const desktopSet = new Set(), phoneSet = new Set(), eagerSet = new Set();
  for (const t of tags) {
    const { desktop, phone } = pick(t);
    if (desktop?.startsWith("/")) desktopSet.add(desktop);
    if (phone?.startsWith("/")) phoneSet.add(phone);
    if (phone?.startsWith("/") && isEager(t)) eagerSet.add(phone);
  }
  const weigh = (set) => {
    let bytes = size(p), worst = null;
    for (const s of set) {
      const f = path.join(DIST, s.replace(/^\//, ""));
      if (!fs.existsSync(f)) continue;
      const n = size(f);
      bytes += n;
      if (!worst || n > worst[1]) worst = [s, n];
    }
    return { bytes, worst };
  };
  const d = weigh(desktopSet), ph = weigh(phoneSet), eg = weigh(eagerSet);
  const route = "/" + path.relative(DIST, path.dirname(p)).split(path.sep).join("/");
  rows.push({
    route: route === "/." ? "/" : route + "/",
    bytes: d.bytes, phoneBytes: ph.bytes, onLoadBytes: eg.bytes,
    images: desktopSet.size, eagerImages: eagerSet.size, heaviest: d.worst,
  });
}

rows.sort((a, b) => b.onLoadBytes - a.onLoadBytes);
console.log("Heaviest pages, by what a PHONE fetches ON LOAD (lazy images excluded):");
console.log("  on load  / full scroll /  desktop   imgs (eager)  route");
for (const r of rows.slice(0, TOP)) {
  console.log(`  ${mb(r.onLoadBytes).padStart(8)} / ${mb(r.phoneBytes).padStart(8)} / ${mb(r.bytes).padStart(8)}   ${String(r.images).padStart(3)} (${r.eagerImages})  ${r.route}`);
  if (r.heaviest && r.heaviest[1] > 300 * 1024) {
    console.log(`             heaviest single file on desktop: ${kb(r.heaviest[1])}  ${r.heaviest[0]}`);
  }
}

// Each median is taken over its own column. Reading one row's other value as
// "the median full scroll" is how you end up reporting 842 KB against a 162 KB
// mean and believing it.
const medianOf = (k) => {
  const v = rows.map((r) => r[k]).sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
};
const mean = (k) => rows.reduce((a, r) => a + r[k], 0) / rows.length;
console.log(`\n  median page ${kb(medianOf("onLoadBytes"))} on load / ${kb(medianOf("phoneBytes"))} full scroll`);
console.log(`  mean ${kb(mean("onLoadBytes"))} on load / ${kb(mean("phoneBytes"))} full scroll / ${kb(mean("bytes"))} desktop`);
console.log(`  dist ${mb(all.reduce((a, f) => a + size(f), 0))} on disk (every derivative, not per visit)`);

// Files worth attention wherever they are used.
const heavy = all
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && size(f) > 400 * 1024)
  .map((f) => ({ f: "/" + path.relative(DIST, f).split(path.sep).join("/"), n: size(f) }))
  .sort((a, b) => b.n - a.n);
if (heavy.length) {
  console.log(`\n${heavy.length} image(s) over 400KB:`);
  for (const h of heavy.slice(0, 10)) console.log(`  ${kb(h.n).padStart(8)}  ${h.f}`);
}

fs.writeFileSync(path.join(HERE, "weight-report.json"), JSON.stringify({ pages: rows, heavyImages: heavy }, null, 1));
