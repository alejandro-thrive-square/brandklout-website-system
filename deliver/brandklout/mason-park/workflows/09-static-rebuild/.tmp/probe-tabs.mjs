// How wide the service-group tab row wants to be, and how many lines it takes,
// at the widths the reviewer and the house breakpoints use. BugHerd #93 asked
// for all seven group names on one line; at 2560 the seventh was wrapping.
//   node probe-tabs.mjs [url] > bugherd/probe-tabs.log
// With no argument it reads the local file; pass a URL to read the published
// page (the live one is the one that wrapped -- measure it, not the local copy).
import { chromium } from "playwright-core";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const pageUrl = process.argv[2] || pathToFileURL(path.join(import.meta.dirname, "..", "home", "our-services", "index.html")).href;
const b = await chromium.launch({ executablePath: CHROME });
console.log(pageUrl);
for (const w of [900, 1024, 1150, 1280, 1440, 1512, 1920, 2560]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(pageUrl, { waitUntil: "networkidle" }).catch(() => {});
  await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    await document.fonts.load('300 32px "Newsreader"').catch(() => {});
    const row = document.querySelector(".el-tabs_row");
    if (!row) return { missing: true };
    const tabs = [...row.querySelectorAll(".el-tabs_tab")];
    const lines = new Set(tabs.map((t) => Math.round(t.getBoundingClientRect().top))).size;
    const gap = parseFloat(getComputedStyle(row).columnGap);
    const need = tabs.reduce((s, t) => s + t.getBoundingClientRect().width, 0) + gap * (tabs.length - 1);
    return {
      rowW: Math.round(row.getBoundingClientRect().width), lines, need: Math.round(need), gap,
      fs: getComputedStyle(tabs[0]).fontSize, ff: getComputedStyle(tabs[0]).fontFamily.split(",")[0],
      widths: tabs.map((t) => Math.round(t.getBoundingClientRect().width)),
    };
  });
  console.log(w, JSON.stringify(r));
  await p.close();
}
await b.close();
