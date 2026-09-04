// Records what every `object-fit: cover` frame actually shows of its photograph.
//
// WHY. The client reported faces cut off by their frames. The stylesheet has
// many `cover` rules and few `object-position` ones, so most frames centre-crop,
// and on a portrait a centred crop in a short frame takes the forehead and the
// chin. This probe measures the crop FROM THE RENDER: for each page and width it
// loads the page, scrolls it through so lazy work settles, and for each image
// with `object-fit: cover` writes the visible region of the source image as
// fractions (x0 x1 y0 y1), together with the frame's class chain, its computed
// object-position and the natural and rendered sizes. It also clips a screenshot
// of every such frame so the crop can be seen, not inferred.
//
// The companion `crop-faces.py` runs OpenCV face detection over the assets and
// intersects each face box with the visible region here, listing the frames
// where a face is actually clipped. Fix those, re-run both, and the list should
// be empty. A centred crop on a room is not a finding.
//
// Usage:
//   node crop-probe.mjs <out-dir> [widths]        widths default 390,1024,1440,1920
// Writes <out-dir>/frames.json and <out-dir>/frames/<page>-<width>-<n>.png.
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, "..", "final-site");
const OUT = process.argv[2];
if (!OUT) {
  console.error("usage: node crop-probe.mjs <out-dir> [widths]");
  process.exit(2);
}
const WIDTHS = (process.argv[3] || "390,1024,1440,1920").split(",").map(Number);
const SHOTS = process.argv.includes("--no-shots") ? false : true;

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json",
  ".mp4": "video/mp4", ".webm": "video/webm",
};
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
const PORT = 8797;
await new Promise((r) => srv.listen(PORT, r));

fs.mkdirSync(path.join(OUT, "frames"), { recursive: true });
const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});

const all = [];
for (const file of pages) {
  for (const width of WIDTHS) {
    const pg = await browser.newPage();
    await pg.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await pg.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await pg.goto(`http://127.0.0.1:${PORT}/${file}`, { waitUntil: "networkidle0", timeout: 60000 });
    await pg.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      await new Promise((r) => {
        let y = 0;
        const t = setInterval(() => {
          window.scrollBy(0, 600); y += 600;
          if (y > document.body.scrollHeight) { clearInterval(t); r(); }
        }, 40);
      });
      window.scrollTo(0, 0);
    });
    await new Promise((r) => setTimeout(r, 800));

    const frames = await pg.evaluate(() => {
      const pct = (v, size, img) => {
        // computed object-position: "<x> <y>", each a % or a px length.
        v = v.trim();
        if (v.endsWith("%")) return parseFloat(v) / 100;
        if (v.endsWith("px")) { const px = parseFloat(v); return (size - img) === 0 ? 0.5 : px / (size - img); }
        return 0.5;
      };
      const out = [];
      const imgs = Array.from(document.images);
      imgs.forEach((img, i) => {
        const cs = getComputedStyle(img);
        if (cs.objectFit !== "cover") return;
        const r = img.getBoundingClientRect();
        const rw = r.width, rh = r.height, nw = img.naturalWidth, nh = img.naturalHeight;
        if (!rw || !rh || !nw || !nh) return;
        const chain = [];
        let el = img;
        for (let d = 0; d < 5 && el && el !== document.body; d++) {
          const cls = el.className && typeof el.className === "string" ? el.className.trim().split(/\s+/).filter(Boolean) : [];
          const attrs = [];
          for (const a of el.attributes) if (a.name.startsWith("data-") && ["data-parallax", "data-mask", "data-face"].includes(a.name)) attrs.push(`[${a.name}]`);
          chain.push((el.tagName.toLowerCase()) + (cls.length ? "." + cls.join(".") : "") + attrs.join(""));
          el = el.parentElement;
        }
        const scale = Math.max(rw / nw, rh / nh);
        const iw = nw * scale, ih = nh * scale;
        const [ox, oy] = cs.objectPosition.split(/\s+/);
        const px = pct(ox, rw, iw), py = pct(oy, rh, ih);
        const offx = (rw - iw) * px, offy = (rh - ih) * py;
        const x0 = -offx / iw, x1 = (rw - offx) / iw;
        const y0 = -offy / ih, y1 = (rh - offy) / ih;
        const sec = img.closest("section, header, footer, main > *");
        out.push({
          n: i,
          src: (img.currentSrc || img.src).split("/").pop(),
          chain,
          section: sec ? (sec.id ? "#" + sec.id : sec.className.split(/\s+/)[0]) : "",
          objectPosition: cs.objectPosition,
          natural: [nw, nh], rendered: [Math.round(rw), Math.round(rh)],
          visible: { x0: +x0.toFixed(3), x1: +x1.toFixed(3), y0: +y0.toFixed(3), y1: +y1.toFixed(3) },
          top: Math.round(r.top + window.scrollY), left: Math.round(r.left),
          hidden: cs.visibility === "hidden" || cs.display === "none" || parseFloat(cs.opacity) === 0,
        });
      });
      return out;
    });

    if (SHOTS) {
      for (const f of frames) {
        const [rw, rh] = f.rendered;
        if (rw < 24 || rh < 24 || f.hidden) continue;
        const name = `${file.replace(".html", "")}-${width}-${f.n}.png`;
        try {
          const y = await pg.evaluate((top) => { window.scrollTo(0, Math.max(0, top - 60)); return window.scrollY; }, f.top);
          await new Promise((r) => setTimeout(r, 60));
          const clip = { x: Math.max(0, f.left), y: Math.max(0, f.top - y), width: Math.min(rw, width - Math.max(0, f.left)), height: Math.min(rh, 900) };
          if (clip.width > 0 && clip.height > 0) { await pg.screenshot({ path: path.join(OUT, "frames", name), clip }); f.shot = name; }
        } catch (e) { f.shotError = e.message.split(/\r?\n/)[0]; }
      }
    }
    for (const f of frames) all.push({ page: file, width, ...f });
    console.log(`${file.padEnd(26)} ${String(width).padStart(4)}  ${frames.length} cover frames`);
    await pg.close();
  }
}
fs.writeFileSync(path.join(OUT, "frames.json"), JSON.stringify(all, null, 1));
console.log(`\n${all.length} frames -> ${path.join(OUT, "frames.json")}`);
await browser.close();
srv.close();
