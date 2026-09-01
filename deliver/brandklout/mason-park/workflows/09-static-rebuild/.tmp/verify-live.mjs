// Check the PUBLISHED pages, not the local files.
//
//   node verify-live.mjs https://staging.masonparkdental.com/ /services/invisalign
//
// A local file:// render proves the design. It proves nothing about the import:
// Instatic stores a node graph, not our HTML, and the things that go wrong on
// the way in are invisible locally -- a class that was dropped because no style
// rule was registered for it, a button whose inline svg the base.button module
// discarded, an image still pointing at /assets/ instead of /uploads/, a
// <script> that never became a code asset.
//
// So this asserts, on the live URL: the response is 200 HTML, site.css and
// site.js are actually linked and load, every image resolves, the chapter
// classes survived, GSAP booted, and nothing errored in the console.
import { chromium } from "playwright-core";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const origin = (args[0] || "https://staging.masonparkdental.com").replace(/\/+$/, "");
const routes = args.length > 1 ? args.slice(1) : ["/", "/services/invisalign"];
const outDir = path.join(HERE, "shots", "live");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
let bad = 0;

for (const route of routes) {
  const url = origin + (route.startsWith("/") ? route : "/" + route);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const problems = [];
  const failed = [];
  page.on("console", (m) => { if (m.type() === "error") problems.push("console: " + m.text().slice(0, 160)); });
  page.on("pageerror", (e) => problems.push("pageerror: " + e.message.slice(0, 160)));
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });

  const res = await page.goto(url, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 540) {
    await page.evaluate((n) => window.scrollTo({ top: n, behavior: "instant" }), y);
    await page.waitForTimeout(110);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(600);

  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const imgs = [...document.images];
    return {
      title: document.title,
      chapters: document.querySelectorAll("section[data-chapter]").length,
      cssLinked: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href.split("/").pop()),
      // proof the stylesheet actually applied, not merely linked
      chPadded: getComputedStyle(document.querySelector(".ch") || document.body).paddingTop,
      rootPx: getComputedStyle(de).fontSize,
      gsap: !!window.gsap,
      jrReady: de.classList.contains("jr-ready"),
      jrFail: de.classList.contains("jr-fail"),
      imgs: imgs.length,
      broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => (i.currentSrc || i.src).split("/").pop()),
      stillLocal: imgs.filter((i) => /\/assets\//.test(i.currentSrc || i.src)).length,
      overflow: de.scrollWidth - de.clientWidth,
      height: document.body.scrollHeight,
      svcCards: document.querySelectorAll(".svc-card").length,
      // A button with no text and no label is the base.button trap: Instatic's
      // button module takes no child nodes, so an inline <svg> icon is dropped
      // at import and the live control renders as an empty box.
      // `aria-hidden` buttons are excluded -- `.navbar_scrim` is a deliberate
      // click-catcher behind the open drawer, and flagging it made this gate
      // cry wolf on both pages while the real toggle was fine.
      emptyButtons: [...document.querySelectorAll("button")]
        .filter((b) => !b.textContent.trim() && !b.getAttribute("aria-label") && b.getAttribute("aria-hidden") !== "true")
        .length,
    };
  });

  const file = path.join(outDir, (route === "/" ? "home" : route.replace(/\//g, "_").replace(/^_/, "")) + ".png");
  await page.screenshot({ path: file, fullPage: true });

  console.log("\n== " + url + " ==");
  console.log("  HTTP        " + res.status() + "  " + (res.headers()["content-type"] || "").split(";")[0]);
  console.log("  title       " + r.title);
  console.log("  chapters    " + r.chapters + "   svc-cards " + r.svcCards);
  console.log("  stylesheet  " + r.cssLinked.join(", ") + "   .ch padding-top " + r.chPadded + "   root " + r.rootPx);
  console.log("  motion      gsap " + r.gsap + "   jr-ready " + r.jrReady + "   jr-fail " + r.jrFail);
  console.log("  images      " + r.imgs + " (" + r.broken.length + " broken, " + r.stillLocal + " still /assets/)");
  console.log("  overflow    " + r.overflow + "px   height " + r.height + "px");
  console.log("  -> " + file);

  if (res.status() !== 200) { console.log("  FAIL non-200"); bad++; }
  if (!r.chapters) { console.log("  FAIL no data-chapter sections - the import flattened the page"); bad++; }
  if (r.chPadded === "0px") { console.log("  FAIL .ch has no padding - site.css did not apply"); bad++; }
  if (!r.gsap) { console.log("  FAIL gsap did not load"); bad++; }
  if (r.jrFail) { console.log("  warn jr-fail: the motion layer degraded"); }
  if (r.broken.length) { console.log("  FAIL broken images: " + r.broken.slice(0, 6).join(", ")); bad++; }
  if (r.stillLocal) { console.log("  FAIL " + r.stillLocal + " image(s) still point at /assets/"); bad++; }
  if (r.overflow > 1) { console.log("  FAIL horizontal overflow"); bad++; }
  if (r.emptyButtons) { console.log("  FAIL " + r.emptyButtons + " empty button(s) - base.button dropped its children"); bad++; }
  // Cloudflare's bot-management beacon posts to a long random path on this
  // domain and is expected to 404; and Instatic generates its -w64 placeholder
  // variants lazily, so the first request for a freshly published image can
  // miss and succeed a moment later. Neither is ours.
  const f = [...new Set(failed)].filter((u) =>
    !/favicon/.test(u) &&
    !/cloudflare|cdn-cgi/.test(u) &&
    !/-w64\.webp$/.test(u) &&
    !/^https:\/\/[^/]+\/[A-Za-z0-9_-]{60,}$/.test(u));
  if (f.length) { console.log("  failed requests: " + f.slice(0, 6).join("\n                   ")); bad++; }
  if (problems.length) { console.log("  " + problems.slice(0, 6).join("\n  ")); bad++; }

  await ctx.close();
}

await browser.close();
console.log("\n" + (bad ? bad + " problem group(s)" : "clean"));
process.exit(bad ? 1 : 0);
