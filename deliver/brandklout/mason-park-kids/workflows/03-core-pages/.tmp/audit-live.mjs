// ===========================================================================
// EVERY LIVE PAGE, LOOKED AT. The whole instance, not the eleven.
//
//   node audit-live.mjs                    all 57 routes at 1440
//   node audit-live.mjs --width 390
//   node audit-live.mjs --only services/invisalign,contacts
//   node audit-live.mjs --json out.json
//
// WHY. 2026-09-08, the client: "I see a lot of errors on Instatic so I don't
// want to cascade those errors to the redesign on rest of the pages." The
// eleven redesigned routes verify clean (verify-live.mjs), so whatever is
// wrong is on the 46 pages the 02 migration imported and nobody has looked at
// since. This looks at all of them the same way and prints one line per fault.
//
// WHAT COUNTS AS A FAULT
//   http        anything but 200
//   image       a request that 404s, or an <img> that decoded to 0x0
//   overflow    the document is wider than the viewport
//   console     a console error or an uncaught exception
//   meta        no <meta name="description">, or an empty <title>
//   heading     no <h1>, or more than one
//   chrome      neither masthead_ nor navbar_ chrome present
//   link        an <a> with no href, or href="#" , or a bare "/assets/" path
//   text        rendered text under 12px
//   empty       a button or link with no accessible name
//   alt         an <img> with no alt attribute at all
// Everything is reported per route so a fix can be aimed.
// ===========================================================================
import { chromium } from "playwright-core";
import { settle } from "./settle.mjs";
import fs from "node:fs";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE = "https://mason-park-kids.up.railway.app";
const args = process.argv.slice(2);
const width = args.includes("--width") ? Number(args[args.indexOf("--width") + 1]) : 1440;
const onlyArg = args.includes("--only") ? args[args.indexOf("--only") + 1].split(",") : null;
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;

// EVERY page under home/, walked, in the order the folder gives. The two
// hand-written lists this replaced (2026-09-09, evening) watched 57 routes
// while eleven more arrived; a gate with a list watches only the list.
import path from "node:path";
const HOME = path.resolve("..", "home");
const walkRoutes = (dir, rel) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() && e.name !== "assets" ? walkRoutes(path.join(dir, e.name), rel + e.name + "/")
  : e.name === "index.html" ? [rel.replace(/\/$/, "")] : []);
const ALL = walkRoutes(HOME, "");
const ROUTES = (onlyArg ?? ALL).map((r) => r.replace(/^\//, ""));

const browser = await chromium.launch({ executablePath: CHROME });
const report = [];

for (const route of ROUTES) {
  const url = `${BASE}/${route}`;
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const faults = [];
  const badRequests = [];
  page.on("console", (m) => { if (m.type() === "error") faults.push(["console", m.text().slice(0, 160)]); });
  page.on("pageerror", (e) => faults.push(["console", "uncaught: " + String(e.message).slice(0, 160)]));
  // Instatic's own front end probes its origin with a burst of requests to
  // RANDOM 80+ character paths - as a script, a stylesheet, a GET, a HEAD and
  // several POSTs - and one of them aborts. It is bot detection, it is on all
  // 57 routes, it is not ours and there is nothing to fix. Counting it meant
  // the audit could never report a clean route, and an audit that always
  // reports 57 faults is one nobody reads.
  const ORIGIN_NOISE = /^https?:\/\/[^/]+\/[A-Za-z0-9_-]{60,}$/;
  const noise = (u) => ORIGIN_NOISE.test(u);
  page.on("requestfailed", (r) => { if (!noise(r.url())) badRequests.push(`${r.failure()?.errorText ?? "failed"} ${r.url().slice(0, 120)}`); });
  page.on("response", (r) => { if (r.status() >= 400 && !noise(r.url())) badRequests.push(`${r.status()} ${r.url().slice(0, 120)}`); });

  let status = 0;
  try {
    const resp = await page.goto(url, { waitUntil: "load", timeout: 60000 });
    status = resp ? resp.status() : 0;
  } catch (e) {
    faults.push(["http", "navigation failed: " + e.message.slice(0, 120)]);
  }
  if (status !== 200) faults.push(["http", `status ${status}`]);
  await page.waitForTimeout(1400);
  try { await settle(page); } catch {}

  // Scroll so lazy images load and reveals fire.
  try {
    await page.evaluate(async () => {
      document.documentElement.style.scrollBehavior = "auto";
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.body.scrollHeight + window.innerHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 70));
      }
      window.scrollTo(0, 0);
    });
  } catch {}
  await page.waitForTimeout(900);

  let facts = {};
  try {
    facts = await page.evaluate(() => {
      const t = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
      const imgs = Array.from(document.images);
      return {
        title: document.title || "",
        description: (document.querySelector('meta[name="description"]') || {}).content || "",
        canonical: (document.querySelector('link[rel="canonical"]') || {}).href || "",
        ogTitle: (document.querySelector('meta[property="og:title"]') || {}).content || "",
        jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
        h1: Array.from(document.querySelectorAll("h1")).map(t),
        chrome: document.querySelector('[class*="masthead_"]') ? "masthead"
          : document.querySelector('[class*="navbar_"]') ? "navbar" : "none",
        hasJourney: document.body.classList.contains("has-journey"),
        gsap: !!window.gsap,
        jrFail: document.documentElement.classList.contains("jr-fail"),
        overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        brokenImgs: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src).slice(0, 8),
        assetImgs: imgs.map((i) => i.currentSrc || i.src).filter((s) => /\/assets\//.test(s)).slice(0, 8),
        noAlt: imgs.filter((i) => !i.hasAttribute("alt")).map((i) => (i.currentSrc || i.src).slice(-60)).slice(0, 8),
        imgCount: imgs.length,
        // An image asked to paint much larger than the pixels it actually has
        // is the "blurry" the client can see. 1.35 is the point at which a
        // photograph visibly softens on a 1x screen.
        upscaled: imgs
          .filter((i) => i.naturalWidth > 0 && i.clientWidth > 0)
          .map((i) => ({
            src: (i.currentSrc || i.src).split("/").pop(),
            natural: i.naturalWidth,
            css: Math.round(i.clientWidth * (window.devicePixelRatio || 1)),
            ratio: +(i.clientWidth * (window.devicePixelRatio || 1) / i.naturalWidth).toFixed(2),
          }))
          .filter((r) => r.ratio >= 1.35)
          .slice(0, 10),
        deadLinks: Array.from(document.querySelectorAll("a"))
          .filter((a) => { const h = a.getAttribute("href"); return !h || h === "#" || h.trim() === ""; })
          .map((a) => t(a).slice(0, 40) || "(no text)").slice(0, 8),
        assetLinks: Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.getAttribute("href")).filter((h) => /^\/?assets\//.test(h)).slice(0, 8),
        emptyControls: Array.from(document.querySelectorAll("a, button"))
          .filter((el) => {
            const cs = getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") return false;
            return !t(el) && !el.getAttribute("aria-label") && !el.querySelector("img[alt]:not([alt=''])") && !el.querySelector("svg");
          }).map((el) => el.tagName.toLowerCase() + "." + (el.className || "")).slice(0, 8),
        tinyText: Array.from(document.querySelectorAll("p, li, span, a, td, div"))
          .filter((el) => {
            const s = t(el);
            if (!s || s.length < 4 || el.children.length) return false;
            const cs = getComputedStyle(el);
            if (cs.display === "none" || cs.visibility === "hidden") return false;
            return parseFloat(cs.fontSize) < 12;
          }).map((el) => `${Math.round(parseFloat(getComputedStyle(el).fontSize))}px "${t(el).slice(0, 30)}"`).slice(0, 6),
      };
    });
  } catch (e) {
    faults.push(["http", "evaluate failed: " + e.message.slice(0, 120)]);
  }

  if (facts.overflow > 1) faults.push(["overflow", `${facts.overflow}px wider than the viewport`]);
  if (!facts.title) faults.push(["meta", "no <title>"]);
  if (!facts.description) faults.push(["meta", "no meta description"]);
  if (!facts.canonical) faults.push(["meta", "no canonical"]);
  if (!facts.ogTitle) faults.push(["meta", "no og:title"]);
  if (!facts.jsonLd) faults.push(["meta", "no JSON-LD"]);
  if ((facts.h1 ?? []).length === 0) faults.push(["heading", "no <h1>"]);
  if ((facts.h1 ?? []).length > 1) faults.push(["heading", `${facts.h1.length} <h1>: ${facts.h1.map((s) => `"${s.slice(0, 30)}"`).join(", ")}`]);
  if (facts.chrome === "none") faults.push(["chrome", "no masthead and no navbar"]);
  for (const s of facts.brokenImgs ?? []) faults.push(["image", `broken: ${s.slice(-80)}`]);
  for (const s of facts.assetImgs ?? []) faults.push(["image", `still a local path: ${s.slice(-80)}`]);
  for (const s of facts.noAlt ?? []) faults.push(["alt", `no alt attribute: ${s}`]);
  for (const u of facts.upscaled ?? []) faults.push(["blurry", `${u.src} painted ${u.css}px from ${u.natural}px (${u.ratio}x)`]);
  for (const s of facts.deadLinks ?? []) faults.push(["link", `no destination: "${s}"`]);
  for (const s of facts.assetLinks ?? []) faults.push(["link", `local path: ${s}`]);
  for (const s of facts.emptyControls ?? []) faults.push(["empty", s]);
  for (const s of facts.tinyText ?? []) faults.push(["text", s]);
  for (const s of badRequests.slice(0, 8)) faults.push(["request", s]);

  report.push({ route: "/" + route, width, status, chrome: facts.chrome, imgCount: facts.imgCount ?? 0, faults });
  await ctx.close();

  const core = route.startsWith("blog") ? "blog" : "page";
  console.log(`\n/${route || ""}  [${core}]  ${status}  ${facts.chrome ?? "?"}  ${facts.imgCount ?? 0} img`);
  if (!faults.length) console.log("   clean");
  else {
    const byKind = {};
    for (const [k, m] of faults) (byKind[k] ??= []).push(m);
    for (const k of Object.keys(byKind)) {
      console.log(`   ${k.padEnd(9)} ${byKind[k].length}`);
      for (const m of byKind[k].slice(0, 6)) console.log(`      - ${m}`);
    }
  }
}
await browser.close();

const tally = {};
for (const r of report) for (const [k] of r.faults) tally[k] = (tally[k] ?? 0) + 1;
console.log(`\n${"=".repeat(70)}\nTALLY over ${report.length} route(s) at ${width}px`);
for (const k of Object.keys(tally).sort((a, b) => tally[b] - tally[a])) console.log(`  ${k.padEnd(10)} ${tally[k]}`);
const dirty = report.filter((r) => r.faults.length);
console.log(`  ${dirty.length} route(s) with at least one fault, ${report.length - dirty.length} clean`);
if (jsonOut) { fs.writeFileSync(jsonOut, JSON.stringify(report, null, 2)); console.log(`  -> ${jsonOut}`); }
