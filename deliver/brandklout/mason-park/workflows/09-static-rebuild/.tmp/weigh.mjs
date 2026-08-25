// What a visitor actually downloads, per page.
//
//   node weigh.mjs [--top 12]
//
// A phone does not fetch the `src` - it picks from `srcset`. So this reports two
// numbers per page: what a wide desktop pulls, and what a 390px phone at DPR 2
// pulls (~780px of image). The second is the one that matters in a waiting room,
// and neither is visible in `du -sh dist`: a 28MB folder can serve a 150KB page.
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

// Which file each <img> resolves to at desktop and at phone width.
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
  const desktopSet = new Set(), phoneSet = new Set();
  for (const t of tags) {
    const { desktop, phone } = pick(t);
    if (desktop?.startsWith("/")) desktopSet.add(desktop);
    if (phone?.startsWith("/")) phoneSet.add(phone);
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
  const d = weigh(desktopSet), ph = weigh(phoneSet);
  const route = "/" + path.relative(DIST, path.dirname(p)).split(path.sep).join("/");
  rows.push({
    route: route === "/." ? "/" : route + "/",
    bytes: d.bytes, phoneBytes: ph.bytes, images: desktopSet.size, heaviest: d.worst,
  });
}

rows.sort((a, b) => b.bytes - a.bytes);
console.log("Heaviest pages - desktop / phone (HTML + the images it actually fetches):");
for (const r of rows.slice(0, TOP)) {
  const saved = r.bytes > 0 ? Math.round((1 - r.phoneBytes / r.bytes) * 100) : 0;
  console.log(`  ${mb(r.bytes).padStart(8)} / ${mb(r.phoneBytes).padStart(8)}  ${String(saved).padStart(3)}% lighter  ${String(r.images).padStart(3)} img  ${r.route}`);
  if (r.heaviest && r.heaviest[1] > 300 * 1024) {
    console.log(`             heaviest single file on desktop: ${kb(r.heaviest[1])}  ${r.heaviest[0]}`);
  }
}

const total = rows.reduce((a, r) => a + r.bytes, 0);
const totalPhone = rows.reduce((a, r) => a + r.phoneBytes, 0);
const median = rows[Math.floor(rows.length / 2)];
console.log(`\n  median page ${kb(median.bytes)} desktop / ${kb(median.phoneBytes)} phone`);
console.log(`  mean ${kb(total / rows.length)} desktop / ${kb(totalPhone / rows.length)} phone`);
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
