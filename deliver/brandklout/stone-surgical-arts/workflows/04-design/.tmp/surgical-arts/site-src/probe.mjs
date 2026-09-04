/**
 * Runtime probe: loads a page WITH motion, scrolls it end to end the way a
 * visitor would, then reports the live state of whatever selectors you name.
 *
 * WHY. slices.mjs forces reduced motion so its screenshots are stable, which
 * also means it never sees the runtime's own states: an IntersectionObserver
 * that never fired, a GSAP set that left an element the wrong size, a class
 * that should have been added. Those bugs look like "an empty grey box" in a
 * motion screenshot and this is the tool that says why.
 *
 * Usage:
 *   node probe.mjs ../final-site index.html ".offer_media [data-j=mask]" ".offer_media img"
 */
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2];
const page = process.argv[3];
const selectors = process.argv.slice(4);
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".avif": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(root, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(8823, r));
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const pg = await browser.newPage();
const errors = [];
pg.on("pageerror", (e) => errors.push("pageerror: " + e.message));
pg.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
await pg.setViewport({ width: Number(process.env.W || 1440), height: 900 });
await pg.goto(`http://127.0.0.1:8823/${page}`, { waitUntil: "networkidle0", timeout: 60000 });
// INSTANT SCROLLING, whatever the stylesheet says. 02-base.css sets
// `scroll-behavior: smooth` on <html> (and turns it off under reduced
// motion), so with motion on every scrollTo() here ANIMATES and the waits
// below end before the page has arrived: observers never see the frames and
// every masked photograph screenshots as a grey box. Found 2026-09-01 after
// an hour of suspecting the observers.
await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
await new Promise((r) => setTimeout(r, 2600)); // past the veil
await pg.evaluate(async () => {
  await new Promise((r) => {
    let y = 0;
    const t = setInterval(() => { window.scrollBy(0, 300); y += 300; if (y > document.body.scrollHeight) { clearInterval(t); r(); } }, 40);
  });
});
await new Promise((r) => setTimeout(r, 800));
// AT=<y> parks the page at that scroll position for 1.5s before reporting,
// which is how an IntersectionObserver that needs a still frame gets one.
if (process.env.AT) {
  await pg.evaluate((y) => window.scrollTo(0, y), Number(process.env.AT));
  await new Promise((r) => setTimeout(r, 1500));
}
// IO=<selector> registers a fresh observer on that selector and reports what
// it sees after a frame, independent of the page's own observers.
if (process.env.IO) {
  const seen = await pg.evaluate((sel) => new Promise((res) => {
    const out = [];
    const io = new IntersectionObserver((es) => { es.forEach((e) => out.push([e.target.className, e.isIntersecting, Math.round(e.boundingClientRect.top)])); }, { threshold: 0 });
    document.querySelectorAll(sel).forEach((el) => io.observe(el));
    setTimeout(() => res(out), 600);
  }), process.env.IO);
  console.log("fresh IO on", process.env.IO, JSON.stringify(seen));
}
for (const sel of selectors) {
  const out = await pg.evaluate((sel) => {
    return Array.from(document.querySelectorAll(sel)).map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        cls: el.className && el.className.baseVal === undefined ? el.className : "",
        rect: [Math.round(r.left), Math.round(r.top + window.scrollY), Math.round(r.width), Math.round(r.height)],
        opacity: cs.opacity, clip: cs.clipPath, transform: cs.transform, pos: cs.position, h: cs.height,
        inline: el.getAttribute("style"),
      };
    });
  }, sel);
  console.log("\n== " + sel);
  for (const o of out) console.log(JSON.stringify(o));
}
console.log("\nerrors:", errors.length ? errors : "none");
await browser.close();
srv.close();
