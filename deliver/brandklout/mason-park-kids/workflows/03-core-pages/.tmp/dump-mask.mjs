// One-shot: print the DOM GSAP SplitText actually builds for a masked line,
// so the crop fix is written against the real wrapper and not a guess.
import { chromium } from "playwright-core";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const target = process.argv[2] || "../home/index.html";
const url = /^https?:\/\//.test(target) ? target : "file:///" + path.resolve(target).split(path.sep).join("/");

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(2000);

const info = await page.evaluate(() => {
  const t = document.querySelector(".ar-title");
  if (!t) return { err: "no .ar-title" };
  const mask = t.querySelector(".jr-line-mask") || t.querySelector("[class*=mask]");
  const line = t.querySelector(".jr-line");
  const g = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    return {
      tag: el.tagName, cls: el.className, inline: el.getAttribute("style"),
      box: { w: +b.width.toFixed(1), h: +b.height.toFixed(1) },
      overflow: cs.overflow, display: cs.display, lineHeight: cs.lineHeight,
      fontSize: cs.fontSize, padding: cs.padding, margin: cs.margin,
    };
  };
  // Does the start state still hide the line? The reveal translates the line
  // by yPercent of its OWN height; it is hidden only while the top of its ink
  // sits below the mask's bottom edge.
  const proof = [];
  for (const [sel, yPercent] of [[".ar-title", 140], ["[data-split]", 140]]) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const m = el.querySelector(".jr-line-mask");
    const l = el.querySelector(".jr-line");
    if (!m || !l) continue;
    const mh = m.getBoundingClientRect().height;
    const lh = l.getBoundingClientRect().height;
    const r = document.createRange();
    r.selectNodeContents(l);
    const ink = Array.from(r.getClientRects()).filter((b) => b.height > 0);
    const inkTop = Math.min(...ink.map((b) => b.top)) - l.getBoundingClientRect().top;
    const travel = (yPercent / 100) * lh;
    proof.push({
      sel, maskH: +mh.toFixed(1), lineH: +lh.toFixed(1), travel: +travel.toFixed(1),
      inkTopWithinLine: +inkTop.toFixed(1),
      inkTopAtStart: +(inkTop + travel).toFixed(1),
      hiddenAtStart: inkTop + travel >= mh,
    });
  }
  return {
    proof,
    titleHTML: t.innerHTML.slice(0, 900),
    titleCS: g(t),
    mask: g(mask),
    line: g(line),
    maskParentIsTitle: mask ? mask.parentElement === t : null,
    lineParentIsMask: line && mask ? line.parentElement === mask : null,
    gsapVersion: window.gsap ? window.gsap.version : null,
    splitTextVersion: window.SplitText ? (window.SplitText.version || "?") : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
