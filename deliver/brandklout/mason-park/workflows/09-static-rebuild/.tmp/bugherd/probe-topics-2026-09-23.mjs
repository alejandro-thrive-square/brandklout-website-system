// #158 / #159 gate: on /blog, do the four topic tiles share one height, does
// every topic name fit on one line inside its tile, and does the article
// grid leave no filled block in an unfilled row? Takes a base URL.
//
//   node probe-topics-2026-09-23.mjs http://127.0.0.1:8089 > probe-topics.log
import { chromium } from "playwright-core";

const BASE = process.argv[2] || "http://127.0.0.1:8089";
const browser = await chromium.launch({ executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" });
let bad = 0;
for (const w of [1024, 1280, 1440, 1512, 1920, 2560]) {
  const page = await browser.newPage({ viewport: { width: w, height: 1000 } });
  const res = await page.goto(`${BASE}/blog/`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const tiles = [...document.querySelectorAll(".bl-topic")];
    const heights = tiles.map((t) => Math.round(t.getBoundingClientRect().height));
    const names = [...document.querySelectorAll(".bl-topic_name")].map((n) => {
      const body = n.closest(".bl-topic_body").getBoundingClientRect();
      const b = n.getBoundingClientRect();
      const lh = parseFloat(getComputedStyle(n).lineHeight) || parseFloat(getComputedStyle(n).fontSize) * 1.3;
      return { t: n.textContent, lines: Math.round(b.height / lh), overflow: Math.round(b.right - body.right + parseFloat(getComputedStyle(n.closest(".bl-topic_body")).paddingRight)) };
    });
    const grid = document.querySelector(".bl-grid");
    const gs = grid && getComputedStyle(grid);
    return { heights, names, gridBg: gs?.backgroundColor, gridBorder: gs?.borderTopWidth };
  });
  const same = new Set(r.heights).size === 1;
  const oneLine = r.names.every((n) => n.lines === 1 && n.overflow <= 0);
  const clear = r.gridBg === "rgba(0, 0, 0, 0)";
  if (!same || (w >= 992 && !oneLine) || !clear) bad++;
  console.log(`${w} ${res.status()} heights ${r.heights.join("/")} ${same ? "equal" : "UNEQUAL"} | ${r.names.map((n) => `${n.t}:${n.lines}l${n.overflow > 0 ? ` +${n.overflow}px` : ""}`).join(", ")} | grid bg ${r.gridBg}`);
  await page.close();
}
await browser.close();
console.log(`${bad} failing widths`);
