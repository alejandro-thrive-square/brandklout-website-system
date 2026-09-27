// Is the chapter tag missing, or is it just invisible? A screenshot cannot say.
// Reports every .chapter-tag's computed opacity, transform and box after the
// page has been scrolled through, so a reveal that never fired and an element
// that was never rendered look different.
//
//   node probe-tag.mjs ../home/about-us/index.html [#anchor-to-rest-on]
import { chromium } from "playwright-core";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const file = path.resolve(process.argv[2]);
const rest = process.argv[3] || null;
const url = "file:///" + file.split(path.sep).join("/");

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load" });

const total = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total; y += 400) {
  await page.evaluate((n) => window.scrollTo({ top: n, behavior: "instant" }), y);
  await page.waitForTimeout(80);
}
if (rest) {
  await page.evaluate((id) => {
    const e = document.getElementById(id);
    if (e) window.scrollTo({ top: e.getBoundingClientRect().top + window.scrollY - 40, behavior: "instant" });
  }, rest);
}
await page.waitForTimeout(2500);

const rows = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll(".chapter-tag").forEach((t) => {
    const cs = getComputedStyle(t);
    const b = t.getBoundingClientRect();
    out.push({
      sec: t.closest("section") ? t.closest("section").id : "-",
      text: t.textContent.trim(),
      opacity: cs.opacity,
      transform: cs.transform,
      visibility: cs.visibility,
      color: cs.color,
      top: Math.round(b.top),
      w: Math.round(b.width),
      h: Math.round(b.height),
    });
  });
  return out;
});
for (const r of rows) {
  console.log(
    (r.sec + "        ").slice(0, 12) +
    " op=" + r.opacity +
    " h=" + r.h + " w=" + r.w + " top=" + r.top +
    " vis=" + r.visibility +
    " tf=" + (r.transform === "none" ? "none" : r.transform.slice(0, 34)) +
    "  " + r.text
  );
}
await browser.close();
