import { chromium } from "playwright-core";
const br = await chromium.launch({ channel: "chrome" });
for (const base of ["https://staging.masonparkdental.com", "https://www.masonparkdental.com"]) {
  const page = await br.newPage({ viewport: { width: 864, height: 906 } });
  await page.addInitScript(() => {
    window.__h = []; let last = 0;
    const snap = () => { const H = document.documentElement.scrollHeight; if (H !== last) { const ifr = [...document.querySelectorAll("iframe")].map((f) => `${(f.id || f.src || "").slice(0, 30)}:${Math.round(f.getBoundingClientRect().height)}`).join(" "); window.__h.push(`${(performance.now() / 1000).toFixed(2)} H ${last}->${H} | ${ifr}`); last = H; } };
    setInterval(snap, 100);
  });
  await page.goto(`${base}/ads-landing-pages/invisalign-consultation`, { waitUntil: "load" });
  await page.waitForTimeout(12000);
  console.log(`\n== ${base}`); console.log((await page.evaluate(() => window.__h)).join("\n"));
  await page.close();
}
await br.close();
