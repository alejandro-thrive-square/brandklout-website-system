// #3 "the bottom of the logo is being cut off": the header logo at 1x DPR on
// common laptop widths, with its box, its natural size and any clipping ancestor.
//
//   node shot-logo.mjs https://staging.masonparkdental.com/ > logo.log
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const url = process.argv[2] || "https://staging.masonparkdental.com/";
const tag = process.argv[3] || "live";
const widths = [1024, 1280, 1366, 1440, 1536, 1920];
const browser = await chromium.launch({ executablePath: CHROME });
for (const dpr of [1, 2]) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: dpr });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => {
      const img = document.querySelector(".navbar_logo");
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      const clips = [];
      for (let el = img.parentElement; el && el !== document.body; el = el.parentElement) {
        const s = getComputedStyle(el);
        if (s.overflow !== "visible" || s.overflowY !== "visible" || s.clipPath !== "none" || s.contain !== "none") {
          const b = el.getBoundingClientRect();
          clips.push(`${el.tagName}.${el.className} ov=${s.overflowY} clip=${s.clipPath} box ${b.top.toFixed(1)}..${b.bottom.toFixed(1)}`);
        }
      }
      return {
        box: [r.left, r.top, r.width, r.height].map((n) => +n.toFixed(2)),
        natural: [img.naturalWidth, img.naturalHeight],
        currentSrc: img.currentSrc.split("/").pop(),
        css: { display: cs.display, h: cs.height, maxH: cs.maxHeight, objectFit: cs.objectFit, pad: cs.padding, aspect: cs.aspectRatio },
        ratio: +(r.width / r.height).toFixed(4),
        clips,
      };
    });
    const b = info.box;
    await page.screenshot({ path: `logo-${tag}-${w}@${dpr}x.png`, clip: { x: Math.max(0, b[0] - 8), y: Math.max(0, b[1] - 8), width: b[2] + 16, height: b[3] + 16 } });
    console.log(`${w}@${dpr}x ${JSON.stringify(info)}`);
    await ctx.close();
  }
}
await browser.close();
