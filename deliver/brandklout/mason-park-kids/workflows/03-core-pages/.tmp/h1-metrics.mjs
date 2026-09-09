// The h1 is the same width and the same font on both sides and wraps
// differently. So measure the ink: what does the first line actually cost, and
// what does the h1's own markup look like once SplitText has been through it?
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
  const h1 = document.querySelector(".ar-title");
  const cs = getComputedStyle(h1);
  const measure = (html, italicPart) => {
    const s = document.createElement("span");
    s.style.cssText = "position:absolute;left:-9999px;white-space:nowrap";
    s.style.font = cs.font;
    s.style.letterSpacing = cs.letterSpacing;
    s.style.wordSpacing = cs.wordSpacing;
    s.style.fontVariationSettings = cs.fontVariationSettings;
    s.innerHTML = html;
    h1.appendChild(s);
    const w = s.getBoundingClientRect().width;
    s.remove();
    return +w.toFixed(1);
  };
  const lines = Array.from(h1.querySelectorAll(".jr-line"));
  return {
    contentWidth: +(h1.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)).toFixed(1),
    letterSpacing: cs.letterSpacing,
    wordSpacing: cs.wordSpacing,
    fontVariationSettings: cs.fontVariationSettings,
    fontWeight: cs.fontWeight,
    textWrap: cs.textWrap ?? cs.textWrapStyle ?? "(n/a)",
    hyphens: cs.hyphens,
    // What each existing line costs, and what the contested string costs.
    lineWidths: lines.map((l) => ({ text: (l.textContent || "").trim().slice(0, 40), w: +l.getBoundingClientRect().width.toFixed(1) })),
    plain_TheDentistYourChild: measure("The dentist your child"),
    withEm_asks: measure('<em style="font-style:italic">asks</em>'),
    emComputedStyle: (() => {
      const em = h1.querySelector("em");
      if (!em) return null;
      const e = getComputedStyle(em);
      return { fontStyle: e.fontStyle, fontFamily: e.fontFamily, fvs: e.fontVariationSettings, text: em.textContent };
    })(),
    emCount: h1.querySelectorAll("em").length,
    emTexts: Array.from(h1.querySelectorAll("em")).map((e) => JSON.stringify(e.textContent)),
    innerHTML: h1.innerHTML.replace(/\s+/g, " ").slice(0, 1400),
  };
});
console.log(url);
console.log(JSON.stringify(out, null, 2));
await browser.close();
