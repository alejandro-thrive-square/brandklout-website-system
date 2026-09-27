// What exactly is wrong on a migrated page, by SELECTOR, so the override can
// be written against the real thing rather than a guess.
//   node probe-legacy.mjs [route] [width]
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "https://mason-park-kids.up.railway.app";
const route = process.argv[2] || "services/invisalign";
const width = Number(process.argv[3] || 390);

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width, height: 900 } });
await page.goto(`${BASE}/${route}`, { waitUntil: "load" });
await page.waitForTimeout(1500);

const out = await page.evaluate(() => {
  const t = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
  const sel = (el) => {
    const c = [...el.classList].join(".");
    return el.tagName.toLowerCase() + (c ? "." + c : "") + (el.id ? "#" + el.id : "");
  };
  const tiny = [];
  for (const el of document.querySelectorAll("*")) {
    const s = t(el);
    if (!s || el.children.length) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const px = parseFloat(cs.fontSize);
    if (px < 12) tiny.push({ sel: sel(el), parent: sel(el.parentElement), px: +px.toFixed(1), text: s.slice(0, 30) });
  }
  // Grounds: every distinct background colour of a large block, so an
  // off-brand footer shows up as a colour with a selector against it.
  const grounds = [];
  for (const el of document.querySelectorAll("footer, section, div, header")) {
    const b = el.getBoundingClientRect();
    if (b.height < 120 || b.width < window.innerWidth * 0.8) continue;
    const bg = getComputedStyle(el).backgroundColor;
    if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") continue;
    grounds.push({ sel: sel(el), bg, h: Math.round(b.height) });
  }
  const seen = new Set();
  return {
    tiny: tiny.filter((x) => (seen.has(x.sel) ? false : seen.add(x.sel))),
    grounds: grounds.slice(0, 14),
    fonts: {
      h1: (document.querySelector("h1") ? getComputedStyle(document.querySelector("h1")).fontFamily : ""),
      body: getComputedStyle(document.body).fontFamily,
    },
  };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
