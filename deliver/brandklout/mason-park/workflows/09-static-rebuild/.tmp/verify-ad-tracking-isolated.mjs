/** Verify call tracking in a fresh browser context for every paid route. */
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ORIGIN = (process.argv[2] || "https://staging.masonparkdental.com").replace(/\/+$/, "");
const PUBLIC = "(281) 769-8878";
const routes = [
  "invisalign", "invisalign-consultation", "invisalign-thank-you",
  "new-patient-special", "new-patient-special-consultation", "new-patient-thank-you",
].map((slug) => `ads-landing-pages/${slug}`);

const browser = await chromium.launch({ executablePath: CHROME });
let problems = 0;
for (const slug of routes) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const poolResponses = [];
  page.on("response", (response) => {
    if (/number_pool\.js/.test(response.url())) poolResponses.push(response.status());
  });
  await page.goto(`${ORIGIN}/${slug}?tracking-qa=${Date.now()}`, { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(15_000);
  const info = await page.evaluate(() => ({
    scripts: [...document.querySelectorAll('script[src*="number_pool.js"]')].map((script) => script.src),
    numbers: [...new Set([...document.querySelectorAll('a[href^="tel:"]')]
      .map((anchor) => anchor.textContent.replace(/\s+/g, " ").trim())
      .filter((text) => /\d{3}/.test(text)))],
    hrefs: [...new Set([...document.querySelectorAll('a[href^="tel:"]')].map((anchor) => anchor.getAttribute("href")))],
  }));
  const swapped = info.numbers.some((number) => !number.includes(PUBLIC));
  const ok = info.scripts.length === 1 && poolResponses.includes(200) && swapped;
  if (!ok) problems++;
  console.log(`${ok ? "PASS" : "FAIL"} /${slug}  script=${info.scripts.length}  pool=${poolResponses.join(",") || "none"}  numbers=${info.numbers.join(" | ")}`);
  await context.close();
}
await browser.close();
console.log(`${problems} problem(s)`);
if (problems) process.exit(1);
