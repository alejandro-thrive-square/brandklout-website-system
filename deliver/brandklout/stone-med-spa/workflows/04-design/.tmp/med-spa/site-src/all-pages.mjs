/**
 * Regression check across ALL EIGHTEEN pages.
 *
 * WHY THIS EXISTS. The home rebuild changed four SHARED files:
 *
 *   20-navbar.css   two new breakpoints for the 992-to-1150 squeeze
 *   30-hero.css     the inner-page hero's stone texture, whose path was broken
 *   38-cta.css      the closing band's stone texture, same bug
 *   partials/head.html   the Google Fonts link replaced by self-hosted faces
 *
 * Every one of those lands on the seventeen pages nobody has looked at since,
 * and `journey-test.mjs` only ever opens index.html. A shared stylesheet is
 * exactly where a fix for one page quietly breaks another, so this asserts the
 * same three things on every page at three widths:
 *
 *   - the document does not scroll sideways
 *   - no visible CONTROL sits past the right edge (the navbar bug)
 *   - the console is clean, and the self-hosted typefaces actually loaded
 *
 * Usage:  node all-pages.mjs [../final-site]
 */
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, process.argv[2] || "../final-site");
const PORT = 0;
const WIDTHS = [390, 1024, 1440];

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".avif": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));
const LIVE = server.address().port;

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});

const failures = [];
let checks = 0;

for (const file of pages) {
  const row = [];
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    const errors = [];
    const external = [];
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 90)));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 90)); });
    page.on("request", (r) => {
      const u = r.url();
      if (!u.startsWith(`http://127.0.0.1:${LIVE}`) && !u.startsWith("data:") && !u.startsWith("blob:")) external.push(u.slice(0, 60));
    });
    await page.setViewport({ width, height: 900 });
    await page.goto(`http://127.0.0.1:${LIVE}/${file}`, { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 450));

    const res = await page.evaluate(() => {
      const de = document.documentElement;
      const cut = [];
      document.querySelectorAll("a[href], button, input, select, summary").forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") return;
        let p = el.parentElement;
        while (p) {
          const pcs = getComputedStyle(p);
          if (pcs.visibility === "hidden") return;
          if (pcs.overflowX === "auto" || pcs.overflowX === "scroll") return;
          // A marquee or a pinned sideways track deliberately holds controls
          // past the edge; it says so with data-overflow-ok. 2026-09-03.
          if (p.hasAttribute("data-overflow-ok")) return;
          p = p.parentElement;
        }
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > de.clientWidth + 1.5) cut.push((el.textContent || el.tagName).trim().slice(0, 22));
      });
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, cut: cut.slice(0, 3) };
    });

    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      const l = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
      return l.some((f) => f.includes("Cormorant")) && l.some((f) => f.includes("Inter"));
    });

    checks += 4;
    const problems = [];
    if (res.scrollW > res.clientW + 1) problems.push(`overflows ${res.scrollW}>${res.clientW}`);
    if (res.cut.length) problems.push(`clipped control: ${res.cut.join(", ")}`);
    if (errors.length) problems.push(`console: ${errors[0]}`);
    if (external.length) problems.push(`off-origin: ${external[0]}`);
    if (!fonts) problems.push("typefaces did not load");
    if (problems.length) {
      failures.push(`${file} @ ${width}  ${problems.join(" | ")}`);
      row.push(`${width}:FAIL`);
    } else {
      row.push(`${width}:ok`);
    }
    await page.close();
  }
  console.log(`${file.padEnd(30)} ${row.join("  ")}`);
}

await browser.close();
server.close();

console.log(`\n${pages.length} pages x ${WIDTHS.length} widths, ${checks} assertions`);
if (failures.length) {
  console.log(`\n${failures.length} FAILURES:`);
  failures.forEach((f) => console.log("  " + f));
  process.exit(1);
}
console.log("all pages clean");
