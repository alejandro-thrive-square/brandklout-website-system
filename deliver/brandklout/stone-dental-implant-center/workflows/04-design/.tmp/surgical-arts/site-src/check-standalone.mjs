/**
 * Opens a packed preview the way a person will: as a file, off the disk, with
 * no server. Nothing else in this build tests that.
 *
 * The packer used to strip the document shell because it was written to feed a
 * host that supplied its own. A browser handed a file starting with <title>
 * renders it in quirks mode with the content in an implied body, which looks
 * plausible and is subtly wrong. This asserts the things that would be broken
 * in that state and in the other standalone failure modes:
 *
 *   - standards mode, not quirks
 *   - every image decoded (a data: URI that got truncated shows as complete
 *     with naturalWidth 0)
 *   - the self-hosted typefaces actually loaded
 *   - NOTHING fetched off the file, so it works on a plane
 *   - no console errors
 *
 * Usage:  node check-standalone.mjs [../preview-neck-lift.html]
 */
import puppeteer from "puppeteer-core";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(HERE, process.argv[2] || "../preview-neck-lift.html");
if (!fs.existsSync(FILE)) {
  console.error(`no such file: ${FILE}`);
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});
const page = await browser.newPage();
const errors = [];
const external = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 90)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text().slice(0, 90));
});
page.on("request", (r) => {
  const u = r.url();
  if (!u.startsWith("file:") && !u.startsWith("data:") && !u.startsWith("blob:")) {
    external.push(u.slice(0, 60));
  }
});

await page.setViewport({ width: 1440, height: 900 });
await page.goto(pathToFileURL(FILE).href, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1500));

const out = await page.evaluate(async () => {
  await document.fonts.ready;
  // Walk the page first. Images below the fold carry loading="lazy", and an
  // undecoded lazy image reports naturalWidth 0, which is indistinguishable
  // from a broken data: URI unless you give it the chance to load.
  const max = document.documentElement.scrollHeight;
  for (let y = 0; y < max; y += 600) {
    window.scrollTo(0, y);
    await new Promise((r) => requestAnimationFrame(r));
  }
  // Deliberately NOT scrolling back to the top before checking. A lazy image
  // loads when it is IN VIEW, and returning to the top immediately took it out
  // of view again before it had started: the poll below then waited six seconds
  // for something that was never going to begin. Stay at the bottom, let them
  // finish, then measure.
  const imgs = [...document.querySelectorAll("img")];
  // Poll until every image has decoded, with a ceiling. A fixed delay reported
  // a good file as having a broken image, and img.decode() on a multi-megabyte
  // data: URI hung the evaluate entirely. Polling is the version that is both
  // deterministic and cannot wedge.
  for (let i = 0; i < 60; i++) {
    if (imgs.every((im) => im.complete && im.naturalWidth > 0)) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  return {
    mode: document.compatMode,
    height: document.documentElement.scrollHeight,
    images: imgs.length,
    brokenImages: imgs.filter((i) => !i.complete || i.naturalWidth === 0).length,
    facesLoaded: [...document.fonts].filter((f) => f.status === "loaded").length,
    cormorant: [...document.fonts].some((f) => f.status === "loaded" && f.family.includes("Cormorant")),
    inter: [...document.fonts].some((f) => f.status === "loaded" && f.family.includes("Inter")),
    h1: (document.querySelector("h1") || {}).textContent || "",
    bodyBg: getComputedStyle(document.body).backgroundColor,
    headings: document.querySelectorAll("h1,h2,h3").length,
  };
});

const checks = [
  ["standards mode (not quirks)", out.mode === "CSS1Compat", out.mode],
  ["the page has real height", out.height > 3000, out.height + "px"],
  ["every image decoded", out.images > 0 && out.brokenImages === 0, `${out.images} images, ${out.brokenImages} broken`],
  ["both typefaces loaded", out.cormorant && out.inter, `${out.facesLoaded} faces`],
  ["body paints its own ground", out.bodyBg !== "rgba(0, 0, 0, 0)", out.bodyBg],
  ["nothing fetched off the file", external.length === 0, external.slice(0, 2).join(" | ")],
  ["no console errors", errors.length === 0, errors.slice(0, 2).join(" | ")],
];

console.log(`${path.basename(FILE)}  ${(fs.statSync(FILE).size / 1024 / 1024).toFixed(2)}MB  "${out.h1.trim()}"  ${out.headings} headings\n`);
let bad = 0;
for (const [name, ok, detail] of checks) {
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
}
console.log(`\n${checks.length - bad}/${checks.length} passed`);

await browser.close();
if (bad) process.exit(1);
