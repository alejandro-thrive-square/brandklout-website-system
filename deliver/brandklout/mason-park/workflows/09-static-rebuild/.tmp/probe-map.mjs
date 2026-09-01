// Why is the map strip blank? Ask the page, do not guess from a screenshot.
//
// ANSWER, 2026-09-01: it is not blank, it is UNPAINTED. Every Google request
// returns 200 and the iframe measures 1440x468 -- the tiles simply arrive after
// shot.mjs has taken its picture. A screenshot cannot tell those two apart, so
// this exists to check the requests and the box rather than the pixels.
//
//   node probe-map.mjs ../home/about-us/index.html            # report only
//   node probe-map.mjs ../home/about-us/index.html --shot visit
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const args = process.argv.slice(2);
const file = path.resolve(args.find((a) => !a.startsWith("--")));
const anchor = args.includes("--shot") ? args[args.indexOf("--shot") + 1] : null;
const url = "file:///" + file.split(path.sep).join("/");

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("console", (m) => console.log("  console[" + m.type() + "] " + m.text().slice(0, 200)));
page.on("requestfailed", (r) => console.log("  requestfailed " + r.url().slice(0, 120) + "  -> " + (r.failure() || {}).errorText));
const maps = [];
page.on("response", (r) => { if (/maps/.test(r.url())) maps.push(r.status()); });

await page.goto(url, { waitUntil: "load" });
const total = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total; y += 500) {
  await page.evaluate((n) => window.scrollTo({ top: n, behavior: "instant" }), y);
  await page.waitForTimeout(90);
}
await page.waitForTimeout(2500);

const report = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("iframe, [data-src]").forEach((el) => {
    const b = el.getBoundingClientRect();
    out.push({
      tag: el.tagName, cls: el.className, stillDeferred: el.hasAttribute("data-src"),
      src: (el.getAttribute("src") || "").slice(0, 60), w: Math.round(b.width), h: Math.round(b.height),
    });
  });
  return out;
});
console.log("  map requests: " + maps.length + (maps.length ? " (" + [...new Set(maps)].join(", ") + ")" : ""));
console.log(JSON.stringify(report, null, 2));

if (anchor) {
  // Scroll the section to the top and give the tiles time they do not get in
  // shot.mjs, so the picture shows the loaded state rather than the loading one.
  await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: "instant" });
  }, anchor);
  await page.waitForTimeout(6000);
  const out = path.resolve("shots", "probe-" + anchor + ".png");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out });
  console.log("  -> " + out);
}

await browser.close();
