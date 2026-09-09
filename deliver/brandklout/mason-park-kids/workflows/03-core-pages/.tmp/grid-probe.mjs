// Two figures on the home page still measure differently local vs live.
// Both sit in a two-column grid, so ask the grid what it resolved to.
import { chromium } from "playwright-core";
import path from "node:path";
import { settle } from "./settle.mjs";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const t = process.argv[2] || "../home/index.html";
const url = /^https?:\/\//.test(t) ? t : "file:///" + path.resolve(t).split(path.sep).join("/");

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);
await settle(page);

const out = await page.evaluate(() => {
  const look = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return {
      sel,
      box: [+b.width.toFixed(1), +b.height.toFixed(1)],
      cols: cs.gridTemplateColumns,
      gap: cs.columnGap,
      display: cs.display,
      parent: el.parentElement ? el.parentElement.className : null,
      parentCols: el.parentElement ? getComputedStyle(el.parentElement).gridTemplateColumns : null,
      parentWidth: el.parentElement ? +el.parentElement.getBoundingClientRect().width.toFixed(1) : null,
      childrenOfParent: el.parentElement ? el.parentElement.children.length : null,
      siblings: el.parentElement
        ? Array.from(el.parentElement.children).map((c) => c.tagName.toLowerCase() + "." + (c.className || "") + " " + Math.round(c.getBoundingClientRect().width))
        : null,
    };
  };
  return {
    prLead: look(".pr-lead"),
    prPortrait: look(".pr-portrait"),
    pePlate: look(".pe-plate"),
    innerWidth: window.innerWidth,
  };
});
console.log(url);
console.log(JSON.stringify(out, null, 1));
await browser.close();
