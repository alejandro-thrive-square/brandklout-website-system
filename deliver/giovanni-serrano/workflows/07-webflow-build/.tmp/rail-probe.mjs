import { chromium } from "playwright";

const browser = await chromium.launch();

for (const [w, h] of [[390, 844], [1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 500 });
  const page = await ctx.newPage();
  await page.goto("https://giovanni-serrano.webflow.io/", { waitUntil: "networkidle" });

  // scroll the rail section into view vertically
  const railInfo = await page.evaluate(() => {
    const card = document.querySelector(".index-article.svc");
    if (!card) return null;
    const rail = card.parentElement;
    rail.scrollIntoView({ block: "center" });
    const cs = getComputedStyle(rail);
    return { railCls: rail.className, overflowX: cs.overflowX, scrollW: rail.scrollWidth, clientW: rail.clientWidth };
  });
  await page.waitForTimeout(1500);

  const before = await page.evaluate(() =>
    [...document.querySelectorAll(".index-article.svc")].map(el => ({
      t: (el.textContent || "").trim().slice(0, 12),
      op: getComputedStyle(el).opacity,
      cls: el.className.includes(" in") || / in /.test(el.className + " ")
    }))
  );

  // swipe/scroll the rail to the end in steps
  await page.evaluate(async () => {
    const rail = document.querySelector(".index-article.svc").parentElement;
    for (let x = 0; x <= rail.scrollWidth; x += 300) {
      rail.scrollTo({ left: x });
      await new Promise(r => setTimeout(r, 120));
    }
  });
  await page.waitForTimeout(1500);

  const after = await page.evaluate(() =>
    [...document.querySelectorAll(".index-article.svc")].map(el => ({
      t: (el.textContent || "").trim().slice(0, 12),
      op: getComputedStyle(el).opacity
    }))
  );

  console.log(`--- viewport ${w}`, JSON.stringify(railInfo));
  console.log("before swipe:", JSON.stringify(before));
  console.log("after  swipe:", JSON.stringify(after));
  await ctx.close();
}
await browser.close();
