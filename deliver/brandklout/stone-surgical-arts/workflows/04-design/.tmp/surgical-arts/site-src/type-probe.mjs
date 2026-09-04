/**
 * Prints the computed type scale actually in use on a page, in document order.
 *
 * Written while reviewing the service template, because eyeballing a heading in
 * a half-scale screenshot and deciding it "looks too small" is how you spend
 * twenty minutes on a rule that was already applying. A hierarchy is a list of
 * numbers; read the numbers.
 *
 * Usage:  node type-probe.mjs [page.html] [width]
 */
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "final-site");
const PAGE = process.argv[2] || "index.html";
const WIDTH = Number(process.argv[3] || 1440);
const PORT = 8821;

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

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});
const page = await browser.newPage();
await page.setViewport({ width: WIDTH, height: 900 });
await page.goto(`http://127.0.0.1:${PORT}/${PAGE}`, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 600));

const rows = await page.evaluate(() =>
  [...document.querySelectorAll("h1, h2, h3")].map((el) => {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      px: Math.round(parseFloat(cs.fontSize)),
      weight: cs.fontWeight,
      family: cs.fontFamily.split(",")[0].replace(/"/g, ""),
      cls: (el.className || "").toString().slice(0, 30),
      text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 44),
    };
  })
);

console.log(`${PAGE} at ${WIDTH}px, root ${await page.evaluate(() => getComputedStyle(document.documentElement).fontSize)}\n`);
for (const r of rows) {
  console.log(
    `${r.tag.padEnd(3)} ${String(r.px + "px").padStart(6)} ${r.weight.padEnd(4)} ${r.family.padEnd(20)} ${r.cls.padEnd(30)} ${r.text}`
  );
}
const sizes = [...new Set(rows.map((r) => r.px))].sort((a, b) => b - a);
console.log(`\n${rows.length} headings, ${sizes.length} distinct sizes: ${sizes.join(", ")}px`);

await browser.close();
server.close();
