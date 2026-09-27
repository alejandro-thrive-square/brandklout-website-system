/**
 * What box does the published GHL form actually get?
 *
 *   node probe-ad-form-box.mjs https://staging.masonparkdental.com/ads-landing-pages/invisalign-consultation
 *
 * verify-form.mjs proves the iframe, the form id, the loader and the CSP. It
 * does not prove the form fills its card: an iframe with no usable width rule
 * falls back to the 300px intrinsic width and sits in the corner of a 545px
 * card, and every other gate stays green. This prints the size of the iframe
 * and of each ancestor up to the card, plus how the header button and the
 * rail came through the importer.
 */
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const url = process.argv[2];
if (!url) throw new Error("usage: node probe-ad-form-box.mjs <url> [width]");
const width = Number(process.argv[3] || 1440);
const browser = await chromium.launch({ executablePath: CHROME });
const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
await page.goto(url, { waitUntil: "load", timeout: 120000 });
await page.waitForTimeout(9000);
const out = await page.evaluate(() => {
  const f = document.querySelector('iframe[src*="leadconnectorhq"]');
  const chain = [];
  for (let el = f; el && chain.length < 7; el = el.parentElement) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    chain.push(`${el.tagName.toLowerCase()}.${String(el.className || "").slice(0, 44)}  ${Math.round(r.width)}x${Math.round(r.height)}  display:${cs.display} pos:${cs.position} vis:${cs.visibility} op:${cs.opacity}`);
  }
  return {
    iframeStyle: f && f.getAttribute("style"),
    chain,
    navCta: document.querySelector(".ad-nav_cta")?.outerHTML.slice(0, 320) ?? null,
    rail: document.querySelector(".ad-rail")?.outerHTML.slice(0, 320) ?? null,
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
