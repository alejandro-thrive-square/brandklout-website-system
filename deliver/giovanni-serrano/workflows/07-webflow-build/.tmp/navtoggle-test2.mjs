import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await ctx.newPage();
await page.goto("https://giovanni-serrano.webflow.io/", { waitUntil: "networkidle" });
await page.waitForTimeout(600);

// instrument: log every click/touch on the toggle chain + class mutations
await page.evaluate(() => {
  window.__log = [];
  const links = document.querySelector("nav .links");
  new MutationObserver(muts => {
    for (const m of muts) window.__log.push("class -> " + links.className);
  }).observe(links, { attributes: true, attributeFilter: ["class"] });
  for (const ev of ["touchstart", "touchend", "click"]) {
    document.addEventListener(ev, e => {
      const t = e.target.closest ? e.target.closest(".nav-toggle") : null;
      window.__log.push(ev + " on " + (t ? t.tagName + "." + (t.getAttribute("class") || "") : e.target.tagName));
    }, true);
  }
});

const btn = page.locator("button.nav-toggle");
await btn.tap();
await page.waitForTimeout(700);
console.log("after tap1:", JSON.stringify(await page.evaluate(() => ({ log: window.__log, cls: document.querySelector("nav .links").className }))));

await page.evaluate(() => { window.__log = []; });
await btn.tap();
await page.waitForTimeout(700);
console.log("after tap2:", JSON.stringify(await page.evaluate(() => ({ log: window.__log, cls: document.querySelector("nav .links").className }))));

await browser.close();
