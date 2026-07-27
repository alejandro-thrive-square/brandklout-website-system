import { chromium } from "playwright";
import fs from "node:fs";

const OUT = ".tmp/verify/round2";
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

// 1) rail centering at 360 + 390
for (const w of [360, 390]) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 }, hasTouch: true });
  await page.goto("https://giovanni-serrano.webflow.io/?cb=" + Date.now(), { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const track = document.querySelector(".index-div-9.track");
    const real = [...track.children].filter(k => !k.className.includes("is-clone"))[0].getBoundingClientRect();
    return { cardX: Math.round(real.x), cardW: Math.round(real.width), rightGap: Math.round(document.documentElement.clientWidth - real.x - real.width) };
  });
  console.log(`rail @${w}:`, JSON.stringify(r));
  await page.evaluate(() => document.querySelector(".index-div-9.track").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${OUT}/rail-${w}.png` });
  await page.close();
}

// 2) menu on invest at 390 (overlap + active-after) and 800 (tablet top)
for (const [w, h] of [[390, 844], [800, 900]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, hasTouch: true });
  await page.goto("https://giovanni-serrano.webflow.io/invest?cb=" + Date.now(), { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const toggle = page.locator('[class*="nav-toggle"]').first();
  if (w < 500) await toggle.tap(); else await toggle.click();
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const nav = document.querySelector("nav.top").getBoundingClientRect();
    const links = document.querySelector("nav .links").getBoundingClientRect();
    const aa = document.querySelector("nav .links a > .active-after");
    return {
      navH: Math.round(nav.height), linksTop: Math.round(links.y),
      overlap: Math.round(nav.height - links.y),
      activeAfterDisplay: aa ? getComputedStyle(aa).display : "none-found"
    };
  });
  console.log(`menu invest @${w}:`, JSON.stringify(r));
  await page.screenshot({ path: `${OUT}/nav-open-invest-${w}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 500) } });
  await page.close();
}

// 3) reach rows stacked at 390 on index + invest
for (const p of ["", "invest"]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await page.goto("https://giovanni-serrano.webflow.io/" + p + "?cb=" + Date.now(), { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 35)); }
  });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const reach = document.querySelector('[class^="reach"]');
    if (!reach) return "no reach";
    const a = reach.querySelector("a");
    const k = a.querySelector(".k").getBoundingClientRect();
    const val = a.querySelectorAll("span")[1].getBoundingClientRect();
    const email = [...reach.querySelectorAll("a")].find(x => (x.href || "").startsWith("mailto"));
    const ev = email ? email.querySelectorAll("span")[1] : null;
    return {
      display: getComputedStyle(a).display, cols: getComputedStyle(a).gridTemplateColumns,
      labelAboveValue: k.bottom <= val.top + 2,
      emailOneLine: ev ? Math.round(ev.getBoundingClientRect().height) : null
    };
  });
  console.log(`reach ${p || "index"} @390:`, JSON.stringify(r));
  await page.evaluate(() => document.querySelector('[class^="reach"]').scrollIntoView({ block: "center" }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/reach-${p || "index"}.png` });
  await page.close();
}

// 4) regression sweep: console errors + overflow on all pages at 390
const pages = ["", "invest", "develop", "scale", "sell", "projects/4855-college-ave"];
for (const p of pages) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on("pageerror", e => errors.push(String(e).slice(0, 120)));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text().slice(0, 120)); });
  await page.goto("https://giovanni-serrano.webflow.io/" + p + "?cb=" + Date.now(), { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
  });
  await page.waitForTimeout(600);
  const hOv = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(`regress ${p || "index"}: hOverflow=${hOv} errors=${JSON.stringify([...new Set(errors)].slice(0, 3))}`);
  await page.close();
}

await browser.close();
console.log("DONE");
