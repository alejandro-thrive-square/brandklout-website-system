// Hover every distinct kind of button on a page and record what a reader
// sees: the text colour, the colour of the pixel behind it, and a crop of the
// hovered button. Added 2026-09-09 (evening) when the client reported the
// hover hiding the label.
//   node hover-probe.mjs ../home/index.html <outdir>
import { chromium } from "playwright-core";
import path from "node:path";
import fs from "node:fs";

const file = path.resolve(process.argv[2] || "../home/index.html");
const out = path.resolve(process.argv[3] || "shots/hover");
fs.mkdirSync(out, { recursive: true });
const url = "file:///" + file.split(path.sep).join("/");
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(1200);
const seen = new Set();
const buttons = await page.locator("a.button, button.button").all();
let i = 0;
for (const b of buttons) {
  const cls = (await b.getAttribute("class")) || "";
  const key = cls.split(/\s+/).sort().join(" ");
  if (seen.has(key)) continue;
  seen.add(key);
  await b.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(400);
  const before = await b.evaluate((el) => ({ color: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor, text: el.textContent.trim() }));
  await b.hover();
  await page.waitForTimeout(1500); // past the transition
  const after = await b.evaluate((el) => {
    const cs = getComputedStyle(el);
    const af = getComputedStyle(el, "::after");
    return { color: cs.color, bg: cs.backgroundColor, afterBg: af.backgroundColor, afterTransform: af.transform, afterOpacity: af.opacity };
  });
  const box = await b.boundingBox();
  const shot = path.join(out, `btn-${i++}.png`);
  await page.screenshot({ path: shot, clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 8), width: box.width + 16, height: box.height + 16 } });
  console.log(`[${cls}] "${before.text}"\n   rest: text ${before.color} on ${before.bg}\n   hover: text ${after.color}, ::after ${after.afterBg} transform ${after.afterTransform}\n   -> ${path.relative(process.cwd(), shot)}`);
  await page.mouse.move(0, 0);
}
await browser.close();
