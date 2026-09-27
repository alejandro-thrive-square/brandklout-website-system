// Motion probe. Opens a page WITHOUT reduced motion, scrolls to each of the
// given positions (or to each selector), waits for GSAP to settle, and
// captures the VIEWPORT — not the full page — so the pinned and scrubbed
// states can actually be seen. shot.mjs cannot show them: it emulates reduced
// motion so the full-page capture is honest, which means it never runs a pin.
//
// Also reports console errors and, for every [data-in] / [data-wipe] /
// [data-split] on the page, whether it reached its .is-in / .is-split state
// after the scroll-through.
//
// Usage: node probe.mjs <page> <width> <outPrefix> <y|selector> [y|selector ...]
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../final-site");
const [page, widthArg, outPrefix, ...stops] = process.argv.slice(2);
const width = Number(widthArg || 1440);
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--hide-scrollbars"] });
const pg = await browser.newPage();
const errors = [];
pg.on("pageerror", (e) => errors.push(String(e).slice(0, 160)));
pg.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
await pg.setViewport({ width, height: 900 });
await pg.goto(`http://127.0.0.1:${PORT}/${page}`, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 900));
// smooth scroll defeats headless scrollTo — force auto (memory: smooth-scroll-defeats-headless-tooling)
await pg.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
let i = 0;
for (const stop of stops) {
  const y = /^\d+$/.test(stop)
    ? Number(stop)
    : await pg.evaluate((sel) => { const el = document.querySelector(sel); return el ? window.scrollY + el.getBoundingClientRect().top - 80 : 0; }, stop);
  // step there so IntersectionObservers and ScrollTriggers fire on the way
  await pg.evaluate(async (target) => {
    let cur = window.scrollY;
    while (Math.abs(target - cur) > 200) { cur += Math.sign(target - cur) * 200; window.scrollTo(0, cur); await new Promise((r) => setTimeout(r, 16)); }
    window.scrollTo(0, target);
  }, y);
  await new Promise((r) => setTimeout(r, 1800));
  const out = `${outPrefix}-${String(i++).padStart(2, "0")}.png`;
  await pg.screenshot({ path: out });
  console.log(`${out}  y=${Math.round(y)}  (${stop})`);
}
const state = await pg.evaluate(() => {
  const count = (sel, cls) => { const all = document.querySelectorAll(sel); let ok = 0; all.forEach((e) => { if (e.classList.contains(cls)) ok++; }); return `${ok}/${all.length}`; };
  const dot = document.querySelector(".cadence_dot");
  return {
    dataIn: count("[data-in]", "is-in"),
    wipes: count("[data-wipe]", "is-in"),
    splits: count("[data-split]", "is-split"),
    reveals: count("[data-reveal]", "is-revealed"),
    dot: dot ? getComputedStyle(dot).transform : "none on page",
    pins: document.querySelectorAll(".pin-spacer").length,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
  };
});
console.log(state);
console.log(errors.length ? `CONSOLE ERRORS:\n  ${errors.join("\n  ")}` : "console clean");
await browser.close();
srv.close();
