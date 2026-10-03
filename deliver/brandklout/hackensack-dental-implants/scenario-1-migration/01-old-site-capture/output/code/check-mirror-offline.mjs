// Client script, 2026-09-30. Opens mirrored pages from file:// with the network cut to local files
// only, and reports what each page still asked the network for and whether its CSS, fonts and
// images arrived. Proves the mirror stands on its own; run scan-mirror.mjs first.
//
// Usage (from the step's output/ folder):
//   node code/check-mirror-offline.mjs mirror/site index.html services/all-on-x.html > mirror-offline.log
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(new URL("../../scripts/package.json", import.meta.url));
const puppeteer = require("puppeteer-core");

const SITE = path.resolve(process.argv[2] || "mirror/site");
const rels = process.argv.slice(3).filter((a) => !a.startsWith("--"));
if (!rels.length) rels.push("index.html");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const shots = path.join(path.dirname(SITE), "offline-shots");
fs.mkdirSync(shots, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--allow-file-access-from-files"] });
let bad = 0;
for (const rel of rels) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.setRequestInterception(true);
  const blocked = new Map();
  const failedLocal = [];
  page.on("request", (r) => {
    const u = r.url();
    if (u.startsWith("file:") || u.startsWith("data:") || u.startsWith("blob:")) return r.continue();
    const h = new URL(u).hostname;
    blocked.set(h, (blocked.get(h) || 0) + 1);
    if (process.argv.includes("--urls")) console.log(`      blocked ${u.slice(0, 160)}`);
    r.abort();
  });
  // Chrome aborts a video request once it has the metadata; that is not a missing file.
  page.on("requestfailed", (r) => {
    if (!r.url().startsWith("file:")) return;
    if (r.failure()?.errorText === "net::ERR_ABORTED" && /\.(mp4|webm|mov|m4v)$/i.test(r.url())) return;
    failedLocal.push(decodeURIComponent(r.url().split("/site/")[1] || r.url()));
  });
  await page.goto(pathToFileURL(path.join(SITE, rel)).href, { waitUntil: "load", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  const info = await page.evaluate(() => {
    const imgs = [...document.images].filter((i) => i.currentSrc && i.currentSrc.startsWith("file:") && i.loading !== "lazy");
    return {
      sheets: [...document.styleSheets].filter((s) => s.href && s.href.startsWith("file:")).length,
      rules: [...document.styleSheets].reduce((n, s) => { try { return n + s.cssRules.length; } catch { return n; } }, 0),
      eagerImages: imgs.length,
      brokenImages: imgs.filter((i) => i.complete && !i.naturalWidth).map((i) => i.currentSrc.split("/site/")[1]),
      h1: (document.querySelector("h1")?.innerText || "").slice(0, 70),
      bodyFont: getComputedStyle(document.body).fontFamily.slice(0, 50),
      height: document.documentElement.scrollHeight,
    };
  });
  const name = rel.replace(/[\\/]/g, "__").replace(/\.html$/, "") + ".png";
  await page.screenshot({ path: path.join(shots, name) });
  const failed = info.sheets === 0 || info.rules < 50 || info.brokenImages.length || failedLocal.length;
  if (failed) bad++;
  console.log(`${failed ? "FAIL" : "PASS"}  ${rel}`);
  console.log(`      local stylesheets ${info.sheets}, css rules ${info.rules}, eager images ${info.eagerImages}, broken ${info.brokenImages.length}, page height ${info.height}`);
  console.log(`      h1 "${info.h1}"  font ${info.bodyFont}`);
  if (failedLocal.length) console.log(`      local files that failed: ${failedLocal.slice(0, 8).join(", ")}`);
  if (info.brokenImages.length) console.log(`      broken images: ${info.brokenImages.slice(0, 8).join(", ")}`);
  console.log(`      network hosts the page still asked for (blocked here): ${[...blocked].map(([h, n]) => `${h} x${n}`).join(", ") || "none"}`);
  await page.close();
}
await browser.close();
console.log(`\n${rels.length - bad}/${rels.length} pages stand alone; screenshots in ${shots}`);
process.exitCode = bad ? 1 : 0;
