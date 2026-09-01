// The name wall and the spec index are the two things on the practice pages
// that a screenshot cannot check: a <details> photographs shut, and a sticky
// index photographs as a list. This clicks them.
//
//   node probe-wall.mjs
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
let bad = 0;
const fail = (m) => { bad++; console.log("  FAIL " + m); };

// ---------------------------------------------------------- the name wall
{
  const file = path.resolve("../home/our-team/index.html");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("file:///" + file.split(path.sep).join("/"), { waitUntil: "load" });
  await page.waitForTimeout(900);

  const n = await page.locator(".tm-name").count();
  console.log("name wall: " + n + " cells");
  if (n !== 5) fail("expected 5 cells, got " + n);

  for (let i = 0; i < n; i++) {
    const cell = page.locator(".tm-name").nth(i);
    const name = (await cell.locator(".tm-name_first").innerText()).trim();
    const before = await cell.locator(".tm-name_body").isVisible();
    if (before) fail(name + ": body visible before opening");
    await cell.locator("summary").click();
    await page.waitForTimeout(140);
    const after = await cell.locator(".tm-name_body").isVisible();
    const quote = (await cell.locator("blockquote").innerText()).trim();
    const cite = (await cell.locator("cite").innerText()).trim();
    if (!after) fail(name + ": body still hidden after click");
    if (quote.length < 40) fail(name + ": quote is " + quote.length + " chars");
    // `innerText` returns the CASED text, and `cite` is uppercased in CSS, so a
    // case-sensitive match here reported six missing attributions that were all
    // present. Match the way the DOM actually hands it over.
    if (!/google/i.test(cite)) fail(name + ": no attribution");
    console.log("  " + (after ? "opens" : "STUCK") + "  " + name.padEnd(16) +
      " " + quote.length + " chars  " + cite);
  }
  // Every cell open at once must not overflow the page sideways.
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 0) fail("horizontal overflow with every cell open: " + over + "px");
  console.log("  overflow with all open: " + over + "px");
  fs.mkdirSync("shots", { recursive: true });
  await page.locator("#named").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.resolve("shots", "probe-wall-open.png") });
  await page.close();
}

// ------------------------------------------------------- the spec index
{
  const file = path.resolve("../home/about-us/index.html");
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("file:///" + file.split(path.sep).join("/"), { waitUntil: "load" });
  await page.waitForTimeout(900);

  const links = await page.locator(".ab-spec_index a").count();
  console.log("spec index: " + links + " links");
  if (links !== 6) fail("expected 6 spec links, got " + links);

  for (let i = 0; i < links; i++) {
    const a = page.locator(".ab-spec_index a").nth(i);
    const label = (await a.innerText()).trim();
    const href = await a.getAttribute("href");
    await a.click();
    await page.waitForTimeout(700);
    const top = await page.evaluate((id) => {
      const el = document.getElementById(id);
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    }, href.slice(1));
    // The floating header is ~95px; the target must land BELOW it, not under it.
    const okd = top !== null && top >= 60 && top < 260;
    if (!okd) fail(label + " lands at top=" + top);
    console.log("  " + (okd ? "lands" : "MISSES") + "  " + label.padEnd(24) + " top=" + top);
  }
  // The index must hold its place WHILE ITS CONTAINER IS ON SCREEN. Measured
  // from the top of `.ab-spec`, not from wherever the last anchor click left
  // us: past the container's bottom the index scrolls away with it, which is
  // correct sticky behaviour and read as a failure the first time.
  await page.evaluate(() => {
    const el = document.querySelector(".ab-spec");
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
  });
  await page.waitForTimeout(300);
  const start = await page.evaluate(() => Math.round(document.querySelector(".ab-spec_index").getBoundingClientRect().top));
  await page.evaluate(() => window.scrollBy(0, 700));
  await page.waitForTimeout(300);
  const stuck = await page.evaluate(() => {
    const el = document.querySelector(".ab-spec_index");
    return { top: Math.round(el.getBoundingClientRect().top), pos: getComputedStyle(el).position };
  });
  console.log("  index: position=" + stuck.pos + ", top " + start + " -> " + stuck.top + " after scrolling 700 inside the chapter");
  if (stuck.pos !== "sticky") fail("index is not sticky");
  // 7.5rem = 120px is where it should pin. Allow a little slack.
  if (Math.abs(stuck.top - 120) > 8) fail("index did not pin at 120px, it is at " + stuck.top);
  await page.close();
}

await browser.close();
console.log(bad ? "\n" + bad + " failure(s)" : "\nall good");
process.exit(bad ? 1 : 0);
