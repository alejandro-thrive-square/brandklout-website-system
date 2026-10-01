import { chromium } from "playwright-core";
const br = await chromium.launch({ channel: "chrome" });
for (const dismiss of [false, true]) {
  const page = await br.newPage({ viewport: { width: 864, height: 906 } });
  await page.goto("https://www.masonparkdental.com/ads-landing-pages/invisalign-consultation", { waitUntil: "load" });
  await page.waitForTimeout(3000);
  if (dismiss) { await page.getByRole("button", { name: "Decline" }).click().catch(() => {}); await page.waitForTimeout(800); }
  const link = page.locator('.navbar_component a[href="#form"]');
  console.log(dismiss, "links", await link.count(), await link.first().evaluate((a) => { const r = a.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return `${a.outerHTML.slice(0, 120)} | hit: ${top?.outerHTML.slice(0, 120)}`; }));
  await link.first().click(); await page.waitForTimeout(2500);
  console.log(" after", await page.evaluate(() => ({ y: scrollY, hash: location.hash, top: Math.round(document.querySelector("#form").getBoundingClientRect().top) })));
  await page.close();
}
await br.close();
