/**
 * Drive the three paid-page desktop pins in a focused Chrome tab.
 *
 *   node probe-ad-journey.mjs ../home/invisalign/index.html
 */
import { chromium } from "playwright-core";
import nodePath from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const target = process.argv[2];
if (!target) throw new Error("usage: node probe-ad-journey.mjs <page>");
const url = /^https?:\/\//.test(target) ? target : "file:///" + nodePath.resolve(target).split("\\").join("/");
const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.bringToFront();
await page.waitForTimeout(1400);

let failures = 0;
for (const id of ["ad-offer-pin", "ad-proof-pin"]) {
  const range = await page.evaluate((triggerId) => {
    const trigger = ScrollTrigger.getById(triggerId);
    return trigger && { start: trigger.start, end: trigger.end };
  }, id);
  if (!range || range.end <= range.start) {
    console.log(`FAIL ${id}: missing or empty range`);
    failures++;
    continue;
  }
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), (range.start + range.end) / 2);
  await page.waitForTimeout(450);
  const state = await page.evaluate((triggerId) => {
    const trigger = ScrollTrigger.getById(triggerId);
    const rect = trigger.pin.getBoundingClientRect();
    return { active: trigger.isActive, progress: +trigger.progress.toFixed(3), top: Math.round(rect.top) };
  }, id);
  const pass = state.active && state.progress > 0.1 && state.progress < 0.9;
  console.log(`${pass ? "ok  " : "FAIL"} ${id}: active=${state.active} progress=${state.progress} top=${state.top}`);
  if (!pass) failures++;
}

const path = await page.evaluate(() => {
  const trigger = ScrollTrigger.getAll().find((item) => item.vars.pin && item.trigger?.id === "pathPin");
  return trigger && { start: trigger.start, end: trigger.end };
});
if (!path || path.end <= path.start) {
  console.log("FAIL treatment path: missing or empty range");
  failures++;
} else {
  const states = [];
  for (const fraction of [0.25, 0.5, 0.75]) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), path.start + (path.end - path.start) * fraction);
    await page.waitForTimeout(450);
    states.push(await page.evaluate(() => {
      const transform = new DOMMatrixReadOnly(getComputedStyle(document.querySelector("#pathTrack")).transform);
      return Math.round(transform.m41);
    }));
  }
  const pass = states[0] > states[1] && states[1] > states[2];
  console.log(`${pass ? "ok  " : "FAIL"} treatment path: ${states.join(" / ")} at 25/50/75%`);
  if (!pass) failures++;
}

if (errors.length) {
  failures += errors.length;
  for (const error of errors) console.log(`FAIL browser: ${error}`);
}
console.log(`${failures} problem(s)`);
await browser.close();
process.exitCode = failures ? 1 : 0;
