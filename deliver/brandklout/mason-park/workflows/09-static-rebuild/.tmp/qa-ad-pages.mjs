/**
 * Responsive gate for all six paid-traffic routes at the design standard's
 * six widths. External requests are blocked so this tests the local build,
 * not Google Maps, fonts or a vendor widget.
 *
 *   node qa-ad-pages.mjs
 */
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.join(HERE, "..", "home");
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ALL_WIDTHS = [360, 390, 768, 1024, 1440, 1920];
const ALL_PAGES = [
  "ads-landing-pages/invisalign", "ads-landing-pages/invisalign-consultation", "ads-landing-pages/invisalign-thank-you",
  "ads-landing-pages/new-patient-special", "ads-landing-pages/new-patient-special-consultation", "ads-landing-pages/new-patient-thank-you",
];
const PAGES = process.argv[2] ? [process.argv[2]] : ALL_PAGES;
const WIDTHS = process.argv[3] ? [Number(process.argv[3])] : ALL_WIDTHS;
const FORM_PAGES = new Set(PAGES.filter((slug) => !slug.endsWith("thank-you")));

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
let failures = 0;

for (const slug of PAGES) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, reducedMotion: "reduce" });
    const page = await context.newPage();
    const errors = [];
    await page.route("**/*", (route) => /^https?:/i.test(route.request().url()) ? route.abort() : route.continue());
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    const file = path.join(HOME, slug, "index.html");
    await page.goto("file:///" + file.split(path.sep).join("/"), { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    // The rail arrives once the hero (which carries the form) has passed, so
    // it is measured mid-page, where it has to be in reach.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.5));
    await page.waitForTimeout(350);
    const report = await page.evaluate((expectsForm) => {
      const root = document.documentElement;
      const rail = document.querySelector(".lp-rail");
      const railBox = rail?.getBoundingClientRect();
      const images = [...document.images];
      const slots = document.querySelectorAll("[data-ghl-form]").length;
      const buttons = [...document.querySelectorAll(".lp-rail a")].map((el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });
      return {
        overflow: root.scrollWidth - innerWidth,
        broken: images.filter((image) => image.complete && !image.naturalWidth).length,
        slots,
        formOk: expectsForm ? slots === 1 : slots === 0,
        railInView: !!railBox && railBox.left >= -1 && railBox.right <= innerWidth + 1 && railBox.bottom <= innerHeight + 1,
        buttons,
        h1: document.querySelector("h1")?.textContent.trim() || "",
      };
    }, FORM_PAGES.has(slug));
    const problems = [];
    if (report.overflow > 1) problems.push(`overflow ${report.overflow}px`);
    if (report.broken) problems.push(`${report.broken} broken image(s)`);
    if (!report.formOk) problems.push(`form slots ${report.slots}`);
    if (!report.railInView) problems.push("CTA rail outside viewport");
    if (!report.h1) problems.push("missing h1");
    if (width <= 390 && report.buttons.some((button) => button.h < 44 || button.w < 44)) problems.push(`CTA target below 44px ${JSON.stringify(report.buttons)}`);
    const relevantErrors = errors.filter((error) => !/Failed to load resource|ERR_FAILED|ERR_BLOCKED_BY_CLIENT/.test(error));
    if (relevantErrors.length) problems.push(`browser: ${relevantErrors.join(" | ")}`);
    failures += problems.length;
    console.log(`${problems.length ? "FAIL" : "ok  "} ${slug.padEnd(36)} ${String(width).padStart(4)} ${problems.join(", ")}`);
    await context.close();
  }
}

console.log(`${PAGES.length * WIDTHS.length} renders, ${failures} problem(s)`);
await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 2000))]);
process.exit(failures ? 1 : 0);
