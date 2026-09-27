// Crop and resize one source image into the four-width JPEG set the pages'
// srcsets use, and register it in album-manifest.json — the same shape
// import-album.mjs writes, for a frame that did NOT come from the album (a
// Grand Mission Dentistry portrait, a client-sent photograph).
//
//   node frame.mjs --dims <file...>                       # print natural sizes
//   node frame.mjs --probe <file> [--grid 200]           # <file>.probe.png: the image at ~1400px wide with a labelled grid, to find a crop box
//   node frame.mjs <src> <key> --alt "..." --source "..." [--box x,y,w,h] [--widths 410,768,1024,1536] [--quality 86]
//
// The crop box is in SOURCE pixels. Output goes to ../home/assets/uploads/2026/09/
// as mp-<key>-<w>x<h>.jpg, the manifest entry is keyed <key> with
// frame:"external". Rendering goes through the installed Chrome (playwright-core)
// because sharp is not in this workflow's node_modules and Chrome decodes webp,
// crops with absolute positioning and re-encodes JPEG — good enough for
// photographs, and it is what crop-tree.mjs does for the seal mark.
//
// GOTCHA. The image is embedded as a data: URI inside page.setContent(). A
// file:// <img> inside setContent never loads (about:blank cannot read local
// files) and fails as a broken-image icon, and page.goto(file://image) opens
// Chrome's image viewer, whose own layout ignores an inline restyle of the
// <img> - the crop silently comes out as the whole frame, scaled.
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const here = import.meta.dirname;
const OUT_DIR = path.join(here, "..", "home", "assets", "uploads", "2026", "09");
const MANIFEST = path.join(here, "album-manifest.json");

const argv = process.argv.slice(2);
const flag = (n, d) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : d);

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 });

const MIME = { ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };
async function open(file) {
  const ext = path.extname(file).toLowerCase();
  const uri = `data:${MIME[ext] || "application/octet-stream"};base64,${fs.readFileSync(file).toString("base64")}`;
  await page.setContent(`<body style="margin:0;overflow:hidden;background:#fff"><img src="${uri}" style="position:absolute;left:0;top:0;display:block;max-width:none"></body>`);
  await page.waitForFunction(() => { const i = document.querySelector("img"); return i && i.complete && i.naturalWidth > 0; });
  return page.evaluate(() => { const i = document.querySelector("img"); return { w: i.naturalWidth, h: i.naturalHeight }; });
}
// Place the image so that source point (bx,by) lands at viewport 0,0 at `scale`.
async function place(nat, bx, by, scale) {
  await page.evaluate(([nat, bx, by, scale]) => {
    const i = document.querySelector("img");
    i.style.cssText = `position:absolute;left:${-bx * scale}px;top:${-by * scale}px;width:${nat.w * scale}px;height:${nat.h * scale}px;display:block;max-width:none;cursor:default`;
  }, [nat, bx, by, scale]);
}

if (argv[0] === "--dims") {
  for (const f of argv.slice(1)) console.log(f, JSON.stringify(await open(f)));
  await browser.close();
  process.exit(0);
}

if (argv[0] === "--probe") {
  const f = argv[1];
  const grid = Number(flag("--grid", 200));
  const nat = await open(f);
  const scale = Math.min(1400 / nat.w, 1400 / nat.h);
  const w = Math.round(nat.w * scale), h = Math.round(nat.h * scale);
  await page.setViewportSize({ width: w, height: h });
  await place(nat, 0, 0, scale);
  await page.evaluate(([grid, scale, nat]) => {
    const g = document.createElement("div");
    g.style.cssText = "position:absolute;inset:0;pointer-events:none;font:11px monospace";
    for (let x = 0; x < nat.w; x += grid) {
      const l = document.createElement("div");
      l.style.cssText = `position:absolute;top:0;bottom:0;left:${x * scale}px;border-left:1px solid rgba(255,0,0,.6)`;
      l.innerHTML = `<span style="background:#000;color:#fff;padding:0 2px">${x}</span>`;
      g.appendChild(l);
    }
    for (let y = 0; y < nat.h; y += grid) {
      const l = document.createElement("div");
      l.style.cssText = `position:absolute;left:0;right:0;top:${y * scale}px;border-top:1px solid rgba(255,0,0,.6)`;
      l.innerHTML = `<span style="background:#000;color:#fff;padding:0 2px;position:absolute;left:0;top:0">${y}</span>`;
      g.appendChild(l);
    }
    document.body.appendChild(g);
  }, [grid, scale, nat]);
  const out = f + ".probe.png";
  await page.screenshot({ path: out });
  console.log(`${f}: ${nat.w}x${nat.h} -> ${out} (grid every ${grid} source px)`);
  await browser.close();
  process.exit(0);
}

const [src, key] = argv;
if (!src || !key) { console.error("usage: node frame.mjs <src> <key> --alt ... [--box x,y,w,h] [--widths ...]"); process.exit(2); }
const alt = flag("--alt", "");
const source = flag("--source", src);
const widths = flag("--widths", "410,768,1024,1536").split(",").map(Number);
const quality = Number(flag("--quality", 86));
const nat = await open(src);
const box = flag("--box", null) ? flag("--box").split(",").map(Number) : [0, 0, nat.w, nat.h];
const [bx, by, bw, bh] = box;
console.log(`${src}: ${nat.w}x${nat.h}, crop ${bw}x${bh} at ${bx},${by}`);

const sizes = [];
for (const w of widths) {
  if (w > bw && !argv.includes("--upscale")) { console.log(`  skip ${w}: wider than the crop (pass --upscale to allow it)`); continue; }
  const h = Math.round(bh * (w / bw));
  const scale = w / bw;
  await page.setViewportSize({ width: w, height: h });
  await place(nat, bx, by, scale);
  await page.waitForTimeout(100);
  const file = `mp-${key}-${w}x${h}.jpg`;
  await page.screenshot({ path: path.join(OUT_DIR, file), type: "jpeg", quality, clip: { x: 0, y: 0, width: w, height: h } });
  const bytes = fs.statSync(path.join(OUT_DIR, file)).size;
  sizes.push({ w, h, file, bytes });
  console.log(`  wrote ${file} (${bytes} bytes)`);
}
await browser.close();

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
manifest[key] = { frame: "external", alt, source, sizes };
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`registered "${key}" in album-manifest.json`);
