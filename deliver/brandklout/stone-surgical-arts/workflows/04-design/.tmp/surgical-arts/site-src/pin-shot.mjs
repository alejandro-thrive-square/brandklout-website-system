import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2];
const OUT = process.argv[3];
const W = Number(process.argv[4] || 1440);
const H = Number(process.argv[5] || 800);
const TAG = process.argv[6] || `${W}x${H}`;

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".avif": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(8816, r));

const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--hide-scrollbars"] });
const pg = await b.newPage();
await pg.setViewport({ width: W, height: H });
await pg.goto("http://127.0.0.1:8816/index.html", { waitUntil: "networkidle0" });
await pg.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
await new Promise((r) => setTimeout(r, 900));

const settle = (y) =>
  pg.evaluate(async (target) => {
    window.scrollTo(0, target);
    let last = -1, same = 0;
    for (let i = 0; i < 90 && same < 3; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      if (window.scrollY === last) same++; else { same = 0; last = window.scrollY; }
    }
    await new Promise((r) => setTimeout(r, 600));
    return window.scrollY;
  }, y);

const pin = await pg.evaluate(() => {
  const st = window.ScrollTrigger.getAll().find((t) => t.pin);
  return st ? { start: st.start, end: st.end } : null;
});
if (!pin) { console.log("NO PIN — reduced motion or GSAP absent"); await b.close(); srv.close(); process.exit(0); }

for (const [frac, name] of [[0.02, "a"], [0.5, "b"], [0.98, "c"]]) {
  await settle(pin.start + (pin.end - pin.start) * frac);
  await pg.screenshot({ path: `${OUT}/pin-${TAG}-${name}.png` });
}
// And the chapter just before the pin engages, to see the heading.
await settle(pin.start - H * 0.5);
await pg.screenshot({ path: `${OUT}/pin-${TAG}-pre.png` });

console.log(`pin ${Math.round(pin.start)} -> ${Math.round(pin.end)} (${Math.round(pin.end - pin.start)}px) at ${TAG}`);
await b.close();
srv.close();
