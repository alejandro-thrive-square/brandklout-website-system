import { chromium } from "playwright";
import fs from "node:fs";

const OUT = ".tmp/verify/repro-3";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });

// ---------- 1. home sliders geometry ----------
let page = await ctx.newPage();
await page.goto("https://giovanni-serrano.webflow.io/", { waitUntil: "networkidle" });
const sliders = await page.evaluate(() => {
  const found = [];
  const seen = new Set();
  for (const el of document.querySelectorAll("*")) {
    const cls = typeof el.className === "string" ? el.className : "";
    if (!/slider|swiper|carousel|track|rail|marquee|review/i.test(cls)) continue;
    if (seen.has(el)) continue;
    seen.add(el);
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width === 0 && r.height === 0) continue;
    found.push({
      cls: cls.slice(0, 60), tag: el.tagName,
      x: Math.round(r.x), w: Math.round(r.width),
      ml: cs.marginLeft, mr: cs.marginRight, pl: cs.paddingLeft, pr: cs.paddingRight,
      overflowX: cs.overflowX, display: cs.display,
      kids: el.children.length,
      firstKid: el.firstElementChild ? {
        cls: (typeof el.firstElementChild.className === "string" ? el.firstElementChild.className : "").slice(0, 50),
        x: Math.round(el.firstElementChild.getBoundingClientRect().x),
        w: Math.round(el.firstElementChild.getBoundingClientRect().width)
      } : null
    });
  }
  return found;
});
console.log("=== HOME slider-ish elements (390px):");
for (const s of sliders) console.log(JSON.stringify(s));

// screenshot the services rail and the reviews area
const railY = await page.evaluate(() => {
  const el = document.querySelector(".index-article.svc");
  if (!el) return null;
  el.parentElement.scrollIntoView({ block: "center" });
  return true;
});
if (railY) { await page.waitForTimeout(1200); await page.screenshot({ path: OUT + "/home-rail.png" }); }
const revY = await page.evaluate(() => {
  const el = [...document.querySelectorAll('[class*="review"], [class*="testimonial"], [class*="quote"]')].find(e => e.getBoundingClientRect().height > 100);
  if (!el) return null;
  el.scrollIntoView({ block: "center" });
  return el.className.slice(0, 60);
});
if (revY) { await page.waitForTimeout(1200); await page.screenshot({ path: OUT + "/home-reviews.png" }); console.log("reviews el:", revY); }
await page.close();

// ---------- 2. nav open: home + invest ----------
for (const p of ["", "invest"]) {
  page = await ctx.newPage();
  await page.goto("https://giovanni-serrano.webflow.io/" + p, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const toggle = page.locator('[class*="nav-toggle"]').first();
  await toggle.tap();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/nav-open-${p || "home"}.png` });
  const navdump = await page.evaluate(() => {
    const links = document.querySelector("nav .links, .links.open");
    if (!links) return "no links";
    const lr = links.getBoundingClientRect();
    const out = { linksRect: { x: Math.round(lr.x), y: Math.round(lr.y), w: Math.round(lr.width), h: Math.round(lr.height) }, items: [] };
    for (const a of links.querySelectorAll("a")) {
      const r = a.getBoundingClientRect();
      const cs = getComputedStyle(a);
      out.items.push({
        text: (a.textContent || "").trim().slice(0, 12),
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        outline: cs.outline, border: cs.border, boxShadow: cs.boxShadow === "none" ? "none" : cs.boxShadow.slice(0, 60),
        bg: cs.backgroundColor, display: cs.display, pad: cs.padding
      });
    }
    // what's under the last link (overlap check)
    const last = out.items[out.items.length - 1];
    if (last) {
      const below = document.elementsFromPoint(195, last.rect.y + last.rect.h + 10).map(e =>
        (typeof e.className === "string" ? e.className : e.tagName).slice(0, 40)).slice(0, 4);
      out.belowLastLink = below;
    }
    // marquee vs links overlap
    const marquee = document.querySelector('[class*="marquee"]');
    if (marquee) {
      const mr = marquee.getBoundingClientRect();
      out.marquee = { y: Math.round(mr.y), h: Math.round(mr.h || mr.height), overlapsLinks: mr.y < lr.y + lr.height && mr.y + mr.height > lr.y };
    }
    return out;
  });
  console.log(`=== NAV OPEN ${p || "home"}:`, JSON.stringify(navdump, null, 1));
  await page.close();
}

// ---------- 3. side-by-side label/link rows ----------
page = await ctx.newPage();
await page.goto("https://giovanni-serrano.webflow.io/", { waitUntil: "networkidle" });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 350) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
});
await page.waitForTimeout(800);
const rows = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("div, li")) {
    if (el.children.length < 2 || el.children.length > 3) continue;
    const kids = [...el.children];
    const rects = kids.map(k => k.getBoundingClientRect());
    if (rects.some(r => r.width === 0)) continue;
    // side by side: same row, both narrow-ish
    const sameRow = Math.abs(rects[0].top - rects[1].top) < 12 && rects[1].left > rects[0].right - 4;
    if (!sameRow) continue;
    const cls = (typeof el.className === "string" ? el.className : "").slice(0, 50);
    if (!cls || /nav|toggle|links|marquee|w-embed/.test(cls)) continue;
    const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 55);
    if (!txt) continue;
    out.push({ cls, txt, kidCls: kids.map(k => (typeof k.className === "string" ? k.className : "").slice(0, 30)) });
  }
  // dedupe by cls
  const seen = new Set();
  return out.filter(r => !seen.has(r.cls) && seen.add(r.cls));
});
console.log("=== HOME side-by-side rows (390px):");
for (const r of rows) console.log(JSON.stringify(r));
await page.close();

await browser.close();
console.log("DONE");
