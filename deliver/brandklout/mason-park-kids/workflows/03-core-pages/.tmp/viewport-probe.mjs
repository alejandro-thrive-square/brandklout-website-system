// Viewport captures at offsets from a section's top, motion on - for judging a
// pinned or scrubbed scene that a full-page capture cannot show.
//   node viewport-probe.mjs <path/to/index.html> <outdir> <sectionId> <y offset...>
// Viewport captures at offsets from a section's top: node _vp.mjs <file> <outdir> <sectionId> <y...>
import { chromium } from "playwright-core";
const [file, out, id, ...ys] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: +(process.env.VW||1440), height: +(process.env.VH||900) } });
await page.goto("file:///" + file.split("\\").join("/"), { waitUntil: "load" });
await page.waitForTimeout(1500);
const top = await page.evaluate((id) => { const s = document.getElementById(id); return s ? s.getBoundingClientRect().top + window.scrollY : 0; }, id);
console.log("section top", top, "doc", await page.evaluate(() => document.body.scrollHeight));
for (const y of ys) {
  const target = Math.round(top + Number(y));
  await page.evaluate((t) => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, t); }, target);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/vp-${y}.png` });
}
await browser.close();
