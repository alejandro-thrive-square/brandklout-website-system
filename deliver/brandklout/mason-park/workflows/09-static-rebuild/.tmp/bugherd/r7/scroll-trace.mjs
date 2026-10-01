import { chromium } from "playwright-core";
const br = await chromium.launch({ channel: "chrome" });
for (let run = 0; run < 3; run++) {
  const page = await br.newPage({ viewport: { width: 864, height: 906 } });
  await page.addInitScript(() => {
    window.__log = [];
    const wrap = (o, k) => { const f = o[k]; o[k] = function (...a) { window.__log.push(`${(performance.now() / 1000).toFixed(2)} ${k}(${JSON.stringify(a).slice(0, 60)}) ${new Error().stack.split("\n").slice(2, 4).map((s) => s.trim()).join(" < ")}`); return f.apply(this, a); }; };
    wrap(window, "scrollTo"); wrap(window, "scroll"); wrap(window, "scrollBy"); wrap(Element.prototype, "scrollIntoView"); wrap(HTMLElement.prototype, "focus");
    let last = 0; setInterval(() => { if (Math.abs(scrollY - last) > 50) window.__log.push(`${(performance.now() / 1000).toFixed(2)} y ${last} -> ${scrollY}`); last = scrollY; }, 50);
  });
  await page.goto("https://www.masonparkdental.com/ads-landing-pages/invisalign-consultation", { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await page.evaluate(() => window.__log.push(`${(performance.now() / 1000).toFixed(2)} CLICK`));
  await page.locator('.navbar_component a[href="#form"]').click();
  await page.waitForTimeout(4000);
  console.log(`\n== run ${run}`); console.log((await page.evaluate(() => window.__log)).join("\n"));
  await page.close();
}
await br.close();
