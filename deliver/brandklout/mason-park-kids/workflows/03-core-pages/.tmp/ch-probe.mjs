// `max-width: 14ch` on the h1 stopped constraining it when the display stack
// changed. What is a `ch` here, and against which font is it being resolved?
import { chromium } from "playwright-core";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const t = process.argv[2] || "../home/index.html";
const url = /^https?:\/\//.test(t) ? t : "file:///" + path.resolve(t).split(path.sep).join("/");

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(2500);

const out = await page.evaluate(async () => {
  await document.fonts.ready;
  const h1 = document.querySelector(".ar-title");
  const cs = getComputedStyle(h1);
  // Measure a `ch` directly, in the h1's own font, now that fonts are settled.
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;left:-9999px;white-space:pre;width:14ch";
  probe.style.font = cs.font;
  probe.style.fontVariationSettings = cs.fontVariationSettings;
  h1.appendChild(probe);
  const chWidth = probe.getBoundingClientRect().width / 14;
  probe.remove();
  const loaded = [];
  document.fonts.forEach((f) => loaded.push(`${f.family} ${f.style} ${f.weight} ${f.status}`));
  return {
    maxWidth: cs.maxWidth,
    fontSize: cs.fontSize,
    fontFamily: cs.fontFamily,
    h1Box: +h1.getBoundingClientRect().width.toFixed(1),
    chWidth: +chWidth.toFixed(2),
    chInEm: +(chWidth / parseFloat(cs.fontSize)).toFixed(3),
    fourteenCh: +(chWidth * 14).toFixed(1),
    fontsReadyStatus: document.fonts.status,
    faces: loaded,
  };
});
console.log(url);
console.log(JSON.stringify(out, null, 2));
await browser.close();
