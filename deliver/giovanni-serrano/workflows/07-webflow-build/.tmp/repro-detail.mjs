import { chromium } from "playwright";
import fs from "node:fs";

const OUT = ".tmp/verify/repro-3";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });

// ---------- rail initial position on fresh load ----------
let page = await ctx.newPage();
await page.goto("https://giovanni-serrano.webflow.io/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const rail = await page.evaluate(() => {
  const track = document.querySelector(".index-div-9.track");
  if (!track) return null;
  const cs = getComputedStyle(track);
  const kids = [...track.children].map((k, i) => {
    const r = k.getBoundingClientRect();
    const kcs = getComputedStyle(k);
    return { i, cls: k.className.slice(0, 40), x: Math.round(r.x), w: Math.round(r.width), snapAlign: kcs.scrollSnapAlign };
  });
  return {
    scrollLeft: Math.round(track.scrollLeft), scrollW: track.scrollWidth, clientW: track.clientWidth,
    pl: cs.paddingLeft, pr: cs.paddingRight, gap: cs.gap || cs.columnGap,
    snapType: cs.scrollSnapType, snapPaddingLeft: cs.scrollPaddingLeft,
    kids
  };
});
console.log("=== RAIL fresh load 390px:", JSON.stringify(rail, null, 1));
// screenshot of the rail as first seen (scroll it into view vertically only)
await page.evaluate(() => document.querySelector(".index-div-9.track").scrollIntoView({ block: "center" }));
await page.waitForTimeout(1500);
await page.screenshot({ path: OUT + "/rail-initial.png" });
const railAfterReveal = await page.evaluate(() => {
  const track = document.querySelector(".index-div-9.track");
  const kids = [...track.children].map((k, i) => {
    const r = k.getBoundingClientRect();
    return { i, cls: k.className.slice(0, 40), x: Math.round(r.x), op: getComputedStyle(k).opacity };
  });
  return { scrollLeft: Math.round(track.scrollLeft), kids: kids.filter(k => k.x > -400 && k.x < 500) };
});
console.log("=== RAIL after in-view:", JSON.stringify(railAfterReveal, null, 1));

// ---------- direct line rows ----------
const dl = await page.evaluate(() => {
  const card = [...document.querySelectorAll("div")].find(d => /DIRECT LINE/.test(d.textContent || "") && d.querySelectorAll("a").length >= 2 && d.querySelectorAll("a").length < 8);
  if (!card) return "no card";
  const rows = [];
  for (const a of card.querySelectorAll("a")) {
    const row = a.closest("div") === card ? a : (a.parentElement);
    rows.push({ aCls: a.className.slice(0, 40), aTxt: (a.textContent || "").trim().slice(0, 35), parentCls: a.parentElement.className.slice(0, 45), parentDisplay: getComputedStyle(a.parentElement).display });
  }
  // structure dump of card children
  const struct = [...card.children].map(c => ({
    cls: (typeof c.className === "string" ? c.className : "").slice(0, 45),
    display: getComputedStyle(c).display,
    gridCols: getComputedStyle(c).gridTemplateColumns.slice(0, 40),
    kids: [...c.children].map(k => ({ cls: (typeof k.className === "string" ? k.className : "").slice(0, 35), tag: k.tagName, x: Math.round(k.getBoundingClientRect().x), w: Math.round(k.getBoundingClientRect().width), y: Math.round(k.getBoundingClientRect().y) }))
  }));
  return { cardCls: card.className, struct };
});
console.log("=== DIRECT LINE card:", JSON.stringify(dl, null, 1));
await page.evaluate(() => {
  const card = [...document.querySelectorAll("div")].find(d => /DIRECT LINE/.test(d.textContent || "") && d.querySelectorAll("a").length >= 2 && d.querySelectorAll("a").length < 8);
  card?.scrollIntoView({ block: "center" });
});
await page.waitForTimeout(1200);
await page.screenshot({ path: OUT + "/direct-line.png" });
await page.close();

// ---------- current-link underline on invest ----------
page = await ctx.newPage();
await page.goto("https://giovanni-serrano.webflow.io/invest", { waitUntil: "networkidle" });
const cur = await page.evaluate(() => {
  const out = [];
  for (const a of document.querySelectorAll("nav a")) {
    const cs = getComputedStyle(a);
    const after = getComputedStyle(a, "::after");
    out.push({
      txt: (a.textContent || "").trim().slice(0, 10),
      cls: a.className.slice(0, 60),
      borderBottom: cs.borderBottom,
      textDecoration: cs.textDecorationLine + " " + cs.textDecorationColor,
      bgImage: cs.backgroundImage === "none" ? "none" : cs.backgroundImage.slice(0, 60),
      after: after.content !== "none" ? { content: after.content, w: after.width, h: after.height, bg: after.backgroundColor, pos: after.position, bottom: after.bottom, left: after.left } : null
    });
  }
  return out;
});
console.log("=== INVEST nav links underline CSS:", JSON.stringify(cur, null, 1));

// zoomed screenshot of open menu top rows
const toggle = page.locator('[class*="nav-toggle"]').first();
await toggle.tap();
await page.waitForTimeout(700);
await page.screenshot({ path: OUT + "/nav-open-invest-top.png", clip: { x: 0, y: 0, width: 390, height: 400 } });
await page.close();

await browser.close();
console.log("DONE");
