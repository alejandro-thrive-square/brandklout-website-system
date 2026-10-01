// The header "Form" link clicked early (while the GHL iframe is still resizing), N times.
import { chromium } from "playwright-core";
const [base, n = 6] = process.argv.slice(2);
const br = await chromium.launch({ channel: "chrome" });
let pass = 0; const res = [];
for (let i = 0; i < +n; i++) {
  const w = [864, 390, 1440][i % 3];
  const page = await br.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(`${base}/ads-landing-pages/invisalign-consultation`, { waitUntil: "load" });
  await page.waitForTimeout(800 + (i % 4) * 900);
  await page.locator('.navbar_component a[href="#form"]').click();
  await page.waitForTimeout(9000);
  const r = await page.evaluate(() => ({ hb: Math.round(document.querySelector(".navbar_component").getBoundingClientRect().bottom), top: Math.round(document.querySelector("#form").getBoundingClientRect().top) }));
  const ok = r.top >= r.hb && r.top < r.hb + 80; if (ok) pass++;
  res.push(`${ok ? "ok" : "FAIL"} @${w} header ${r.hb} form ${r.top}`);
  await page.close();
}
await br.close();
console.log(res.join("\n")); console.log(`${pass}/${n}`);
