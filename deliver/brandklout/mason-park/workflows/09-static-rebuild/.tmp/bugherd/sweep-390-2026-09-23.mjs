// Every published page, rendered: status, broken images, horizontal overflow,
// console errors. verify-live.mjs only visits two pages, which is how a whole
// round can come back green while 59 pages are broken.
//
//   node sweep-live-2026-09-21.mjs live-urls-2026-09-21.txt > sweep-live-2026-09-21.log
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const list = process.argv[2] || path.join(import.meta.dirname, "live-urls-2026-09-21.txt");
const urls = fs.readFileSync(list, "utf8").split(/\r?\n/).filter(Boolean);

const b = await chromium.launch({ executablePath: CHROME });
let bad = 0;
for (const url of urls) {
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  pg.on("pageerror", (e) => errs.push(e.message));
  // Two CSP refusals are on every STAGING page and are not the site's: the
  // BugHerd review sidebar loads its icon font as a data: URI (font-src) and
  // Cloudflare injects its beacon (script-src). Neither ships to production --
  // BugHerd is staging-only and the beacon is the proxy's. Ignoring them is
  // what makes the rest of this gate readable.
  const NOISE = /x-font-ttf|cloudflareinsights/;
  pg.on("console", (m) => { if (m.type() === "error" && !NOISE.test(m.text())) errs.push("console: " + m.text().slice(0, 120)); });
  const res = await pg.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => ({ status: () => String(e) }));
  await pg.waitForTimeout(1800);
  // Walk the page so the lazy images actually fetch.
  await pg.evaluate(async () => {
    document.documentElement.style.scrollBehavior = "auto";
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
    window.scrollTo(0, 0);
  });
  await pg.waitForTimeout(1200);
  const r = await pg.evaluate(() => {
    const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
    const de = document.documentElement;
    return { broken, overflow: de.scrollWidth - de.clientWidth };
  });
  const status = typeof res.status === "function" ? res.status() : res.status;
  const problems = [];
  if (status !== 200) problems.push(`status ${status}`);
  if (r.broken.length) problems.push(`${r.broken.length} broken: ${r.broken.slice(0, 2).join(" ")}`);
  if (r.overflow > 0) problems.push(`overflow ${r.overflow}px`);
  if (errs.length) problems.push(`errors: ${errs.slice(0, 2).join(" | ")}`);
  if (problems.length) bad++;
  console.log(`${problems.length ? "PROBLEM" : "  ok   "} ${url}${problems.length ? "  " + problems.join("; ") : ""}`);
  await pg.close();
}
await b.close();
console.log(`\n${bad} of ${urls.length} page(s) with problems`);
process.exit(bad ? 1 : 0);
