// ===========================================================================
// THE OTHER GATE: what the page actually looks like, at four widths.
//
//   cd .tmp && npm i          # once: playwright-core, no browser download
//   node shot.mjs ../home/index.html
//   node shot.mjs ../home/index.html --slices desktop
//   node shot.mjs ../home/index.html --only desktop,mobile
//
// Drives the Chrome already installed on the machine through playwright-core.
// Ported from the parent practice's workflow 09.
//
// WHAT IT REPORTS, beyond the PNGs
//   - broken images, horizontal overflow, text under 12px
//   - anything still invisible AFTER the whole page has been scrolled past,
//     which is a reveal that never fired
//   - console errors, page errors, failed file:// requests
//   - the root font size and the h1 size at each width
//   - which font family is actually painted on the h1 and the body, by
//     measuring a string against its fallback: identical widths mean the
//     fallback is what is on screen
//
// It SCROLLS THE WHOLE PAGE before capturing, so scrubbed sections are
// photographed past their start state. Captures still lie about motion:
// judge scenes with probe-hooks.mjs, not a PNG.
// ===========================================================================
import { chromium } from "playwright-core";
import { settle } from "./settle.mjs";
import fs from "node:fs";
import path from "node:path";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--"));
if (!target) {
  console.error("usage: node shot.mjs <path/to/index.html> [--slices <view>] [--only a,b] [--out <dir>]");
  process.exit(1);
}
const sliceView = args.includes("--slices") ? args[args.indexOf("--slices") + 1] : null;
const only = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const outDir = path.resolve(args.includes("--out") ? args[args.indexOf("--out") + 1] : "shots");
const file = path.resolve(target);
const url = "file:///" + file.split(path.sep).join("/");
const tag = path.basename(path.dirname(file)) === "home" ? "home" : path.basename(path.dirname(file));

fs.mkdirSync(outDir, { recursive: true });

const VIEWS = {
  desktop: { width: 1440, height: 900, dsf: 1 },
  mobile: { width: 390, height: 844, dsf: 2, mobile: true },
  wide: { width: 1920, height: 1080, dsf: 1 },
  tablet: { width: 768, height: 1024, dsf: 2 },
};

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
let bad = 0;

for (const [name, v] of Object.entries(VIEWS)) {
  if (sliceView && name !== sliceView) continue;
  if (only && !only.includes(name)) continue;
  const ctx = await browser.newContext({
    viewport: { width: v.width, height: v.height },
    deviceScaleFactor: sliceView ? 1 : v.dsf,
    isMobile: !!v.mobile,
    hasTouch: !!v.mobile,
  });
  const page = await ctx.newPage();
  const problems = [];
  page.on("console", (m) => { if (m.type() === "error") problems.push("console: " + m.text()); });
  page.on("pageerror", (e) => problems.push("pageerror: " + e.message));
  page.on("requestfailed", (r) => {
    if (r.url().startsWith("file:")) problems.push("404: " + r.url().split("/").slice(-1)[0]);
  });

  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  // The faces are self-hosted now; measuring before they land reports the
  // fallback and the wrong line count. See settle.mjs.
  await settle(page);

  const total = await page.evaluate(() => document.body.scrollHeight);

  if (sliceView) {
    const step = Math.round(v.height * 0.94);
    let i = 0;
    for (let y = 0; y < total; y += step) {
      await page.evaluate((n) => window.scrollTo({ top: n, behavior: "instant" }), y);
      await page.waitForTimeout(450);
      i++;
      await page.screenshot({ path: path.join(outDir, tag + "-" + name + "-" + String(i).padStart(2, "0") + ".png") });
    }
    console.log(i + " slices of " + total + "px at " + v.width + "x" + v.height + " -> " + outDir);
    await ctx.close();
    continue;
  }

  for (let y = 0; y < total; y += Math.round(v.height * 0.6)) {
    await page.evaluate((n) => window.scrollTo({ top: n, behavior: "instant" }), y);
    await page.waitForTimeout(140);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(900);

  const report = await page.evaluate(() => {
    const de = document.documentElement;
    const over = de.scrollWidth - de.clientWidth;
    const wide = [];
    if (over > 1) {
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1)) {
          wide.push(el.tagName.toLowerCase() + "." + String(el.className || "").split(" ")[0] +
            " [" + Math.round(r.left) + " to " + Math.round(r.right) + "]");
          if (wide.length > 6) break;
        }
      }
    }
    const tiny = [];
    for (const el of document.querySelectorAll("p, li, span, cite, dd, dt, summary, figcaption, small, b")) {
      if (!el.textContent.trim()) continue;
      const px = parseFloat(getComputedStyle(el).fontSize);
      if (px < 12) tiny.push(el.tagName.toLowerCase() + "." + String(el.className || "").split(" ")[0] + " at " + px.toFixed(1) + "px");
      if (tiny.length > 4) break;
    }
    const hidden = [];
    for (const el of document.querySelectorAll("[data-anim='hide'], [data-split], .pa-card, .pr-chip, .gr-stage, [data-stagger] > *, [data-wipe]")) {
      const cs = getComputedStyle(el);
      if (el.getBoundingClientRect().height > 0 &&
          (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05)) {
        hidden.push(el.tagName.toLowerCase() + "." + String(el.className || "").split(" ").slice(0, 2).join("."));
        if (hidden.length > 6) break;
      }
    }
    const broken = [...document.images].filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => (i.currentSrc || i.src).split("/").slice(-1)[0]);
    const h1 = document.querySelector("h1");
    // Which face is painted: measure a string in the family and in its own
    // fallback. Equal widths mean the fallback is on screen.
    const first = (token, fallbackName) => {
      const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
      if (!v) return fallbackName;
      return v.split(",")[0].trim().replace(/^["']|["']$/g, "");
    };
    const painted = (family, fallback) => {
      const s = document.createElement("span");
      s.textContent = "Mason Park Dental for Kids 0123456789";
      s.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font-size:40px;font-family:" + fallback;
      document.body.appendChild(s);
      const a = s.getBoundingClientRect().width;
      s.style.fontFamily = "'" + family + "'," + fallback;
      const b = s.getBoundingClientRect().width;
      s.remove();
      return Math.abs(a - b) > 0.5 ? family : "FALLBACK (" + fallback + ")";
    };
    return {
      overflow: over, wide, tiny, hidden, broken,
      height: document.body.scrollHeight,
      rootPx: getComputedStyle(de).fontSize,
      h1px: h1 ? getComputedStyle(h1).fontSize : "no h1",
      // Ask the TOKENS which family is meant to be painted, never a literal
      // name. Since 2026-09-08 the stacks lead with the self-hosted variable
      // faces "Fraunces VF" / "Nunito VF", and nothing on the site asks for
      // plain "Fraunces" any more - so measuring that name reported FALLBACK
      // on a page that was painting the right font perfectly.
      display: painted(first("--font-display", "Fraunces"), "Georgia"),
      body: painted(first("--font-body", "Nunito"), "Arial"),
    };
  });

  const out = path.join(outDir, tag + "-" + name + ".png");
  await page.screenshot({ path: out, fullPage: true });

  console.log("\n== " + name + " " + v.width + "x" + v.height + " ==");
  console.log("  height " + report.height + "px, root " + report.rootPx + ", h1 " + report.h1px + ", faces: " + report.display + " / " + report.body);
  console.log("  horizontal overflow: " + report.overflow + "px" + (report.wide.length ? " -> " + report.wide.join(" | ") : ""));
  if (report.broken.length) { console.log("  BROKEN IMAGES: " + report.broken.join(", ")); bad++; }
  if (report.tiny.length) { console.log("  TEXT UNDER 12px: " + report.tiny.join(", ")); bad++; }
  if (report.hidden.length) { console.log("  STILL HIDDEN after a full scroll: " + report.hidden.join(", ")); bad++; }
  if (report.overflow > 1) bad++;
  if (problems.length) { console.log("  " + problems.slice(0, 8).join("\n  ")); bad++; }
  console.log("  -> " + out);

  await ctx.close();
}

await browser.close();
if (!sliceView) console.log("\n" + (bad ? bad + " problem group(s)" : "clean"));
process.exit(bad ? 1 : 0);
