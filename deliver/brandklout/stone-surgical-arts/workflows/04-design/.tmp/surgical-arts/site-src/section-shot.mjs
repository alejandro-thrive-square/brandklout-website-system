// Screenshots ONE section of a page at a width, as the browser paints it.
//
// The crop probe measures every frame; this is for the handful where a
// photograph sits under type or a scrim and the crop has to be judged with
// the overlay on: the dossier hero, the dark "standard" band, the team band on
// the doctor's page. It scrolls the page through so the reveal work has
// happened, takes a full-page capture the way shot.mjs does, and cuts the
// section's box out of it. (Scrolling the element into view and clipping the
// viewport was tried first and landed on the wrong section: the pinned
// scrollytelling chapters make an element's viewport position a poor guide.)
//
// Usage: node section-shot.mjs <page.html> <selector> <width> <out.png>
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "final-site");
const [page, selector, widthArg, out] = process.argv.slice(2);
// --motion: leave prefers-reduced-motion alone so the parallax, the masks and
// the settle run as they do for a reviewer; --scroll=<px>: where to leave the
// scroll before capturing (the parallax is scrubbed to it). --vh=<px>: the
// viewport height (default 900).
const MOTION = process.argv.includes("--motion");
const SCROLL = Number((process.argv.find((a) => a.startsWith("--scroll=")) || "--scroll=0").slice(9));
const VH = Number((process.argv.find((a) => a.startsWith("--vh=")) || "--vh=900").slice(5));
if (!out) { console.error("usage: node section-shot.mjs <page.html> <selector> <width> <out.png>"); process.exit(2); }
const width = Number(widthArg);
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
const PORT = 8796;
await new Promise((r) => srv.listen(PORT, r));
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--hide-scrollbars"] });
const pg = await browser.newPage();
if (!MOTION) await pg.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await pg.setViewport({ width, height: VH, deviceScaleFactor: 1 });
await pg.goto(`http://127.0.0.1:${PORT}/${page}`, { waitUntil: "networkidle0", timeout: 60000 });
const box = await pg.evaluate(async (sel, scrollTo) => {
  document.documentElement.style.scrollBehavior = "auto";
  await new Promise((r) => { let y = 0; const t = setInterval(() => { window.scrollBy(0, 600); y += 600; if (y > document.body.scrollHeight) { clearInterval(t); r(); } }, 40); });
  window.scrollTo(0, scrollTo);
  // Long enough for a mask reveal and the settle to finish with motion on.
  await new Promise((r) => setTimeout(r, 2600));
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height };
}, selector, SCROLL);
if (!box) { console.error(`no element for ${selector} on ${page}`); process.exit(1); }
const full = out.replace(/\.png$/, ".full.png");
await pg.screenshot({ path: full, fullPage: true });
await browser.close();
srv.close();
// Crop with Pillow: Chrome's clip on a full-page capture is unreliable past
// the first viewport, and Pillow is already the image tool of this folder.
const script = `
import sys
from PIL import Image
src, dst, x, y, w, h = sys.argv[1], sys.argv[2], *map(float, sys.argv[3:7])
im = Image.open(src)
box = (max(0, int(x)), max(0, int(y)), min(im.width, int(x + w)), min(im.height, int(y + h)))
im.crop(box).save(dst)
print(box[2] - box[0], box[3] - box[1])
`;
const size = execFileSync("python", ["-c", script, full, out, String(box.x), String(box.y), String(box.width), String(box.height)], { encoding: "utf8" }).trim();
fs.unlinkSync(full);
console.log(`${page} ${selector} @${width}: ${size.replace(" ", "x")} at y=${Math.round(box.y)} -> ${out}`);
