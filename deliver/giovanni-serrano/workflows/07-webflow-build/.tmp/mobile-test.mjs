import { chromium } from "playwright";
import fs from "node:fs";

const OUT = ".tmp/verify/mobile-final";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
});

// --- home: nav toggle + portfolio screenshot ---
let page = await ctx.newPage();
await page.goto("https://giovanni-serrano.webflow.io/", { waitUntil: "networkidle" });
// hamburger
const toggle = page.locator('[class*="nav-toggle"], nav .burger, nav [class*="toggle"]').first();
let navResult = "toggle not found";
if (await toggle.count()) {
  await toggle.tap();
  await page.waitForTimeout(600);
  const open = await page.evaluate(() => {
    const links = document.querySelector("nav .links");
    if (!links) return "no .links";
    const cs = getComputedStyle(links);
    return { cls: links.className, display: cs.display, position: cs.position, visible: links.getBoundingClientRect().height > 0 };
  });
  navResult = open;
  await page.screenshot({ path: OUT + "/home-nav-open.png" });
  await toggle.tap(); // close again
  await page.waitForTimeout(400);
}
console.log("home mobile nav:", JSON.stringify(navResult));

// scroll to portfolio and screenshot it
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 350) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
});
await page.waitForTimeout(1200);
const cardY = await page.evaluate(() => {
  window.scrollTo(0, 0);
  const el = document.querySelector(".project-card");
  return el ? el.getBoundingClientRect().top + window.scrollY - 200 : 0;
});
await page.evaluate(y => window.scrollTo(0, y), cardY);
await page.waitForTimeout(900);
await page.screenshot({ path: OUT + "/home-portfolio-mobile.png" });
console.log("home portfolio screenshot at y", Math.round(cardY));

// tap a project card -> navigates to project page?
const firstCardHref = await page.evaluate(() => document.querySelector(".project-card")?.getAttribute("href"));
console.log("first card href:", firstCardHref);
await page.close();

// --- invest: FAQ accordion ---
page = await ctx.newPage();
await page.goto("https://giovanni-serrano.webflow.io/invest", { waitUntil: "networkidle" });
const faqResult = await page.evaluate(async () => {
  const q = document.querySelector(".faq summary, .faq-q, details summary, [class*='faq'] button");
  if (!q) return "no FAQ trigger found";
  const details = q.closest("details");
  q.click();
  await new Promise(r => setTimeout(r, 500));
  return { clicked: (q.textContent || "").trim().slice(0, 50), open: details ? details.open : "n/a" };
});
console.log("invest FAQ:", JSON.stringify(faqResult));
await page.close();

// --- contact form fill on home ---
page = await ctx.newPage();
await page.goto("https://giovanni-serrano.webflow.io/", { waitUntil: "networkidle" });
const formCheck = await page.evaluate(() => {
  const f = document.querySelector("form");
  if (!f) return "no form";
  const inputs = [...f.querySelectorAll("input,select,textarea")].map(i => ({ tag: i.tagName, type: i.type || null, name: i.name }));
  return inputs;
});
console.log("home form fields:", JSON.stringify(formCheck));
// fill without submitting
await page.evaluate(() => document.querySelector("form")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(800);
const nameInput = page.locator("form input").first();
if (await nameInput.count()) {
  await nameInput.tap();
  await nameInput.fill("Test");
  const val = await nameInput.inputValue();
  console.log("form input tappable+fillable:", val === "Test");
}
await page.close();

// --- project template mobile screenshots ---
page = await ctx.newPage();
await page.goto("https://giovanni-serrano.webflow.io/projects/4855-college-ave", { waitUntil: "networkidle" });
await page.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 350) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
});
await page.waitForTimeout(1000);
// footer screenshot
await page.evaluate(() => document.querySelector("footer")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(800);
await page.screenshot({ path: OUT + "/template-footer-mobile.png" });
// hero
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(800);
await page.screenshot({ path: OUT + "/template-hero-mobile.png" });
const hOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log("template mobile horizontal overflow px:", hOverflow);
await page.close();

await browser.close();
console.log("DONE — screenshots in", OUT);
