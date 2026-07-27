import { chromium } from "playwright";

const pages = ["", "invest", "develop", "scale", "sell", "projects/4855-college-ave"];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });

console.log("=== mobile hamburger tap test (touch) ===");
for (const p of pages) {
  const page = await ctx.newPage();
  await page.goto("https://giovanni-serrano.webflow.io/" + p, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const btn = page.locator("button.nav-toggle");
  await btn.tap();
  await page.waitForTimeout(600);
  const s1 = await page.evaluate(() => {
    const l = document.querySelector("nav .links");
    return { open: l.classList.contains("open"), display: getComputedStyle(l).display, icon: document.querySelector("button.nav-toggle")?.textContent };
  });
  // tap a nav link area? just close by tapping outside
  await page.touchscreen.tap(195, 700);
  await page.waitForTimeout(500);
  const s2 = await page.evaluate(() => document.querySelector("nav .links").classList.contains("open"));
  console.log((p || "index").padEnd(30), "tap->open:", s1.open, s1.display, "icon:", s1.icon, "| outside-tap closes:", !s2);
  await page.close();
}

console.log("\n=== regression sweep (mobile) ===");
for (const p of pages) {
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(String(e).slice(0, 120)));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text().slice(0, 120)); });
  await page.goto("https://giovanni-serrano.webflow.io/" + p, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 350) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
  });
  await page.waitForTimeout(1000);
  const rep = await page.evaluate(() => ({
    stuck: [...document.querySelectorAll('[class*="reveal"]')].filter(el => getComputedStyle(el).opacity === "0" && el.getBoundingClientRect().height > 0 && !el.className.includes("svc")).length,
    cards: document.querySelectorAll(".project-card").length,
    cardsVisible: [...document.querySelectorAll(".project-card")].filter(c => getComputedStyle(c).opacity === "1").length,
    brokenImgs: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith("data:")).length,
    hOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
  }));
  console.log((p || "index").padEnd(30), JSON.stringify(rep), "errors:", errors.length ? errors.slice(0, 3) : "none");
  await page.close();
}
await browser.close();
