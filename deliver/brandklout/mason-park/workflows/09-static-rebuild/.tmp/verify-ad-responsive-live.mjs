/** Mobile layout gate for the six published paid-campaign routes. */
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ORIGIN = (process.argv[2] || "https://staging.masonparkdental.com").replace(/\/+$/, "");
const pages = new Map([
  ["invisalign", "YbX91GhEDKkCN4GH4gka"],
  ["invisalign-consultation", "YbX91GhEDKkCN4GH4gka"],
  ["invisalign-thank-you", null],
  ["new-patient-special", "AFu5BpJpMjgSnSf8yybc"],
  ["new-patient-special-consultation", "AFu5BpJpMjgSnSf8yybc"],
  ["new-patient-thank-you", null],
]);

const browser = await chromium.launch({ executablePath: CHROME });
let problems = 0;
for (const [slug, expectedForm] of pages) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  // The desktop integration gate exercises the vendors. This pass isolates
  // the published host layout so a slow iframe cannot disguise mobile drift.
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (/^https?:/.test(url) && !url.startsWith(ORIGIN)) route.abort();
    else route.continue();
  });
  const response = await page.goto(`${ORIGIN}/${slug}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
  await page.waitForTimeout(600);
  const report = await page.evaluate(() => {
    const root = document.documentElement;
    const rail = document.querySelector(".ad-rail");
    const box = rail?.getBoundingClientRect();
    const iframe = document.querySelector('iframe[src*="leadconnectorhq.com/widget/form/"]');
    return {
      bodyClass: document.body.className,
      h1: document.querySelector("h1")?.textContent.trim() || "",
      overflow: root.scrollWidth - root.clientWidth,
      formId: iframe?.getAttribute("data-form-id") ?? null,
      railInView: !!box && box.left >= -1 && box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1,
      targets: [...document.querySelectorAll(".ad-rail a")].map((element) => {
        const target = element.getBoundingClientRect();
        return [Math.round(target.width), Math.round(target.height)];
      }),
    };
  });
  const failures = [];
  if (response?.status() !== 200) failures.push(`HTTP ${response?.status()}`);
  if (!report.bodyClass.split(/\s+/).includes("is-ad-page")) failures.push("missing is-ad-page");
  if (!report.h1) failures.push("missing h1");
  if (report.overflow > 1) failures.push(`overflow ${report.overflow}px`);
  if (report.formId !== expectedForm) failures.push(`form ${report.formId ?? "none"}, expected ${expectedForm ?? "none"}`);
  if (!report.railInView) failures.push("CTA rail outside viewport");
  if (report.targets.some(([width, height]) => width < 44 || height < 44)) failures.push("CTA target below 44px");
  problems += failures.length;
  console.log(`${failures.length ? "FAIL" : "PASS"} /${slug}  ${failures.join(", ")}`);
  await context.close();
}
await browser.close();
console.log(`${pages.size} mobile renders, ${problems} problem(s)`);
if (problems) process.exit(1);
