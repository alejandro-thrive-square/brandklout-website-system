// Check the PUBLISHED pages, not the local files.
//
//   node verify-live.mjs                       # the eleven core pages
//   node verify-live.mjs / /about-us           # a subset
//   node verify-live.mjs --migrated            # two of the 43 migrated pages, as a regression check
//
// A local render proves the design. It proves nothing about the import:
// Instatic stores a node graph, and the things that go wrong on the way in
// are invisible locally: a class dropped because no rule was registered, an
// image still pointing at /assets/, a <script> that never became a code asset,
// a body class that never reached the root node, a font that fell back.
//
// So this asserts on the live URL: 200 HTML, the chapters survived, site.css
// applied, GSAP booted, the masthead measured itself, both faces are actually
// painted (measured against their fallbacks), every image resolves, nothing
// still points at /assets/, no overflow, no empty buttons, console clean.
import { chromium } from "playwright-core";
import { settle } from "./settle.mjs";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { BASE } from "./insta.mjs";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const MIGRATED = args.includes("--migrated");
const CORE = ["/", "/about-us", "/our-doctors", "/our-team", "/our-services", "/services/comprehensive-pediatric-dentistry", "/new-patients", "/financing", "/dental-saving-plan", "/patient-reviews", "/thank-you"];
const routes = MIGRATED ? ["/services/sealants", "/pediatric-dentistry-faqs-katy-tx"] : (args.filter((a) => a.startsWith("/")).length ? args.filter((a) => a.startsWith("/")) : CORE);
const outDir = path.join(HERE, "shots", "live");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ executablePath: CHROME });
let bad = 0;

for (const route of routes) {
  const url = BASE + route;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const problems = [], failed = [], noted = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const text = m.text();
    if (/^Failed to load resource/.test(text)) return;
    if (/cloudflareinsights|cdn-cgi/.test(text)) { noted.push(text.slice(0, 100)); return; }
    problems.push("console: " + text.slice(0, 160));
  });
  page.on("pageerror", (e) => problems.push("pageerror: " + e.message.slice(0, 160)));
  page.on("requestfailed", (r) => failed.push(r.url()));
  page.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url()); });

  const res = await page.goto(url, { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(2500);
  await settle(page);
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 540) { await page.evaluate((n) => window.scrollTo({ top: n, behavior: "instant" }), y); await page.waitForTimeout(100); }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(600);

  const r = await page.evaluate(async () => {
    const de = document.documentElement;
    await (document.fonts.ready ?? Promise.resolve());
    const cv = document.createElement("canvas").getContext("2d");
    const S = "Handgloves 12345";
    const wOf = (f) => { cv.font = f; return cv.measureText(S).width; };
    const paints = (name, fb) => wOf(`500 48px "${name}", ${fb}`) !== wOf(`500 48px ${fb}`);
    const imgs = [...document.images];
    return {
      // Ask the TOKENS which family should be on screen, never a literal name.
      // The stacks lead with the self-hosted variable faces "Fraunces VF" and
      // "Nunito VF" since 2026-09-09, and nothing asks for plain "Fraunces"
      // any more - so checking that name reported FALLBACK on all eleven
      // routes while they were painting the right font.
      fonts: (function () {
        var cs = getComputedStyle(document.documentElement);
        var lead = function (token, dflt) {
          var v = (cs.getPropertyValue(token) || "").trim();
          return v ? v.split(",")[0].trim().replace(/^["']|["']$/g, "") : dflt;
        };
        var d = lead("--font-display", "Fraunces");
        var b = lead("--font-body", "Nunito");
        var out = {};
        out[d] = paints(d, "Georgia, serif");
        out[b] = paints(b, "Arial, sans-serif");
        return out;
      })(),
      bodyClass: document.body.className || "",
      title: document.title,
      chapters: document.querySelectorAll("section[data-chapter]").length,
      masthead: !!document.querySelector(".masthead_component"),
      navbar: !!document.querySelector(".navbar_component"),
      navH: getComputedStyle(de).getPropertyValue("--jr-nav-h").trim(),
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
      emptyButtons: [...document.querySelectorAll("button")].filter((b) => !b.textContent.trim() && !b.getAttribute("aria-label") && b.getAttribute("aria-hidden") !== "true").length,
      mapFrame: !!document.querySelector(".iv-map iframe"),
      details: document.querySelectorAll("details").length,
      tables: document.querySelectorAll("table").length,
    };
  });

  const file = path.join(outDir, (route === "/" ? "home" : route.replace(/\//g, "_").replace(/^_/, "")) + ".png");
  await page.screenshot({ path: file, fullPage: true });

  const core = !MIGRATED;
  console.log("\n== " + url + " ==");
  console.log("  HTTP        " + res.status() + "  " + (res.headers()["content-type"] || "").split(";")[0]);
  console.log("  title       " + r.title);
  console.log("  chapters    " + r.chapters + "   masthead " + r.masthead + "   navbar " + r.navbar + "   details " + r.details + "   tables " + r.tables);
  console.log("  css         .ch padding-top " + r.chPadded + "   root " + r.rootPx);
  console.log("  fonts       " + Object.entries(r.fonts).map(([n, ok]) => n + " " + (ok ? "ok" : "FALLBACK")).join("   "));
  console.log("  body class  " + (r.bodyClass || "(none)") + "   --jr-nav-h " + (r.navH || "(unset)"));
  console.log("  motion      gsap " + r.gsap + "   jr-ready " + r.jrReady + "   jr-fail " + r.jrFail + "   map iframe " + r.mapFrame);
  console.log("  images      " + r.imgs + " (" + r.broken.length + " broken, " + r.stillLocal + " still /assets/)");
  console.log("  overflow    " + r.overflow + "px   height " + r.height + "px");
  console.log("  -> " + file);

  if (res.status() !== 200) { console.log("  FAIL non-200"); bad++; }
  if (core && !r.chapters) { console.log("  FAIL no data-chapter sections - the import flattened the page"); bad++; }
  if (core && r.chPadded === "0px") { console.log("  FAIL .ch has no padding - site.css did not apply"); bad++; }
  if (!r.gsap) { console.log("  FAIL gsap did not load - the script asset is not running"); bad++; }
  const fell = Object.entries(r.fonts).filter(([, ok]) => !ok).map(([n]) => n);
  if (core && fell.length) { console.log("  FAIL falling back to a system font: " + fell.join(", ")); bad++; }
  if (core && !r.bodyClass.split(/\s+/).includes("has-journey")) { console.log("  FAIL body is missing has-journey"); bad++; }
  if (core && !r.navH) { console.log("  FAIL --jr-nav-h unset - journey.js never measured the masthead"); bad++; }
  if (r.jrFail) console.log("  warn jr-fail: the motion layer degraded");
  if (r.broken.length) { console.log("  FAIL broken images: " + r.broken.slice(0, 6).join(", ")); bad++; }
  if (r.stillLocal) { console.log("  FAIL " + r.stillLocal + " image(s) still point at /assets/"); bad++; }
  if (r.overflow > 1) { console.log("  FAIL horizontal overflow"); bad++; }
  if (r.emptyButtons) { console.log("  FAIL " + r.emptyButtons + " empty button(s)"); bad++; }
  const f = [...new Set(failed)].filter((u) => !/favicon/.test(u) && !/cloudflare|cdn-cgi/.test(u) && !/-w64\.webp$/.test(u) && !/^https:\/\/[^/]+\/[A-Za-z0-9_-]{60,}$/.test(u));
  if (f.length) { console.log("  failed requests: " + f.slice(0, 6).join("\n                   ")); bad++; }
  if (problems.length) { console.log("  " + problems.slice(0, 6).join("\n  ")); bad++; }
  if (noted.length) console.log("  noted (not ours): " + noted.length);

  await ctx.close();
}

await browser.close();
console.log("\n" + (bad ? bad + " problem group(s)" : "clean"));
process.exit(bad ? 1 : 0);
