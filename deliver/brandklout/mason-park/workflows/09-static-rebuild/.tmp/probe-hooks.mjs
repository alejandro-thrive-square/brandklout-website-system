// ===========================================================================
// DRIVE THE GENERIC HOOKS, motion ON.
//
// DESIGN-STANDARD.md: "A scrubbed scene that snaps between two states is a
// triggered scene wearing a costume." So for every `data-write` on the page
// this steps the scroll to 10 / 50 / 90 percent of the element's own trigger
// range and asserts a DIFFERENT number of written words at each. It also
// asserts every `data-count` reaches the value it states, every `data-rail`
// has actually travelled, every `data-wipe` has finished revealing once
// scrolled past, and that the console stayed clean.
//
//   node probe-hooks.mjs ../home/about-us/index.html [width] [height]
//
// Exit code 1 on any failure. Reduced motion is OFF here on purpose: this is
// the one pass that has to run the timelines.
// ===========================================================================
import { chromium } from "playwright-core";
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
// A live URL is taken as is; anything else is an absolute local path.
const url = /^https?:\/\//.test(process.argv[2]) ? process.argv[2] : "file:///" + process.argv[2].split("\\").join("/");
const w = +(process.argv[3] || 1440), h = +(process.argv[4] || 900);

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(url, { waitUntil: "load" });
await page.waitForTimeout(1200);

let fails = 0;
const fail = (m) => { fails++; console.log("  FAIL " + m); };
const ok = (m) => console.log("  ok   " + m);

const scrollTo = async (y) => {
  await page.evaluate((n) => window.scrollTo({ top: n, behavior: "instant" }), y);
  await page.waitForTimeout(500);
};

// Walk the whole page first so every trigger has been reached at least once.
const total = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < total; y += Math.round(h * 0.5)) await scrollTo(y);

// --- data-write: different intermediate states ----------------------------
const writes = await page.evaluate(() => [...document.querySelectorAll("[data-write]")].map((el, i) => {
  const r = el.getBoundingClientRect();
  return { i, top: r.top + window.scrollY, height: r.height, words: el.querySelectorAll(".jr-word").length };
}));
console.log(writes.length + " data-write element(s)");
for (const wr of writes) {
  if (!wr.words) { fail("data-write #" + wr.i + " was never split into words"); continue; }
  // The trigger is start "top 95%" .. end "top 55%" (since 2026-09-16, BugHerd
  // #64: written by the time the element's top is past mid-window). Scroll
  // positions that put the element's top at 95% of the viewport, then at 55%.
  const start = wr.top - h * 0.95;
  const end = wr.top - h * 0.55;
  const states = [];
  for (const f of [0.1, 0.5, 0.9]) {
    await scrollTo(start + (end - start) * f);
    states.push(await page.evaluate((i) => {
      const el = document.querySelectorAll("[data-write]")[i];
      const to = el.getAttribute("data-write-to") || (el.closest("[data-theme='dark']") ? "rgb(255, 255, 255)" : "rgb(46, 53, 56)");
      const norm = (c) => c.replace(/\s+/g, "");
      return [...el.querySelectorAll(".jr-word")].filter((s) => norm(getComputedStyle(s).color) === norm(to)).length;
    }, wr.i));
  }
  if (states[0] < states[1] && states[1] < states[2]) ok("data-write #" + wr.i + " writes " + states.join(" / ") + " of " + wr.words + " words at 10/50/90%");
  else fail("data-write #" + wr.i + " does not scrub: " + states.join(" / ") + " of " + wr.words);
}

// --- everything else, after a full pass --------------------------------------
await scrollTo(total);
await page.waitForTimeout(2200);
const report = await page.evaluate(() => {
  const out = { counts: [], rails: [], wipes: [], staggers: [] };
  for (const b of document.querySelectorAll("[data-count]")) {
    const to = parseFloat(b.getAttribute("data-count"));
    const dec = parseInt(b.getAttribute("data-decimals") || "0", 10);
    const txt = b.textContent.replace(/[^0-9.]/g, "");
    out.counts.push({ to, shown: b.textContent.trim(), reached: Math.abs(parseFloat(txt) - to) < (dec ? 0.05 : 0.5) });
  }
  for (const r of document.querySelectorAll("[data-rail]")) {
    const m = new DOMMatrixReadOnly(getComputedStyle(r).transform);
    out.rails.push({ x: Math.round(m.m41), over: r.scrollWidth - r.parentElement.clientWidth });
  }
  for (const el of document.querySelectorAll("[data-wipe]")) {
    const cp = getComputedStyle(el).clipPath;
    out.wipes.push({ clip: cp, done: cp === "none" || /inset\(0(px|%)? 0(px|%)? 0(px|%)? 0(px|%)?\)/.test(cp) });
  }
  for (const g of document.querySelectorAll("[data-stagger]")) {
    const hidden = [...g.children].filter((c) => parseFloat(getComputedStyle(c).opacity) < 0.95).length;
    out.staggers.push({ kids: g.children.length, hidden });
  }
  return out;
});
for (const c of report.counts) (c.reached ? ok : fail)("data-count " + c.to + " shows " + JSON.stringify(c.shown));
for (const r of report.rails) ((r.over <= 0 || r.x < -10) ? ok : fail)("data-rail travelled " + r.x + "px of " + r.over + " overflow");
for (const wp of report.wipes) (wp.done ? ok : fail)("data-wipe finished: " + wp.clip);
for (const s of report.staggers) (s.hidden === 0 ? ok : fail)("data-stagger group of " + s.kids + " has " + s.hidden + " still hidden");

// --- the pinned scene, if the page has one ---------------------------------
const hasPath = await page.evaluate(() => !!document.querySelector(".ch-path"));
if (hasPath) {
  const sec = await page.evaluate(() => {
    const s = document.querySelector(".ch-path"), p = document.querySelector("#pathPin");
    return { section: s.offsetHeight, scene: p.offsetHeight, isStatic: s.classList.contains("is-static") };
  });
  if (sec.isStatic || w < 900) ok("path is " + (sec.isStatic ? "static" : "flow") + " at " + w);
  else if (sec.section > sec.scene + 200) ok("path pinned: section " + sec.section + " = scene " + sec.scene + " + travel");
  else fail("path is not pinned: section " + sec.section + " vs scene " + sec.scene);
}

if (errors.length) { fail("console: " + errors.join(" | ")); } else ok("console clean");
await browser.close();
console.log(fails ? "\n" + fails + " FAILURE(S)" : "\nall hooks do work");
process.exit(fails ? 1 : 0);
