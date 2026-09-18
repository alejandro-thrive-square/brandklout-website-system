/**
 * Drive the paid landing page's three desktop scenes in a focused Chrome tab.
 *
 *   node probe-ad-journey.mjs ../home/ads-landing-pages/invisalign/index.html
 *
 * A screenshot cannot tell a pinned scene from a tall section. This steps each
 * scene through its own range and asserts that the scroll did the work:
 *   the journey   pinned, and a DIFFERENT move is lit at 12 / 38 / 62 / 88%,
 *                 each with its own photograph fully up and the others down
 *   why here      the head is held (its top does not move) while the grid passes
 *   the path      the track has travelled further at 25, 50 and 75%
 * and that the rail is away while the hero's form is on screen and back after it.
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
// Third parties a published page carries and this probe is not about: the GHL
// form's own console diagnostic, and Cloudflare's beacon, whose SRI check fails
// behind this workstation's VPN (it is not a site fault; see the memory note).
const NOISE = /Failed to load resource|ERR_|font-size:0;color:transparent|cloudflareinsights|Turnstile/;
page.on("console", (message) => { if (message.type() === "error" && !NOISE.test(message.text())) errors.push(message.text()); });
await page.goto(url, { waitUntil: "load", timeout: 60000 });
await page.bringToFront();
await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
// A published page's form iframe grows from 150px to its real height some
// seconds after load, which moves every scene below it. journey.js refreshes
// its triggers when the document height changes; measuring before that reads
// ranges that are about to be replaced.
await page.waitForTimeout(/^https?:/.test(url) ? 14000 : 1600);

let failures = 0;
const say = (pass, text) => { console.log(`${pass ? "ok  " : "FAIL"} ${text}`); if (!pass) failures++; };
const scrollTo = async (y) => { await page.evaluate((top) => window.scrollTo(0, top), y); await page.waitForTimeout(900); };
const range = (id) => page.evaluate((triggerId) => {
  const t = ScrollTrigger.getById(triggerId);
  return t && { start: t.start, end: t.end };
}, id);

// ---- the rail, before anything has moved
const railAtTop = await page.evaluate(() => document.querySelector(".lp-rail")?.classList.contains("is-in"));
say(railAtTop === false, `rail is away while the hero form is on screen (is-in=${railAtTop})`);

// ---- the journey
const j = await range("lp-journey-pin");
if (!j || j.end <= j.start) say(false, "journey: pin missing or empty");
else {
  const lit = [];
  for (const f of [0.12, 0.38, 0.62, 0.88]) {
    await scrollTo(j.start + (j.end - j.start) * f);
    lit.push(await page.evaluate(() => {
      const t = ScrollTrigger.getById("lp-journey-pin");
      const steps = [...document.querySelectorAll(".lp-journey_step")];
      const frames = [...document.querySelectorAll(".lp-journey_frame")];
      const on = steps.findIndex((s) => s.classList.contains("is-on"));
      const open = steps.map((s) => Math.round(s.querySelector(".lp-journey_more").getBoundingClientRect().height));
      const top = frames.map((fr) => +getComputedStyle(fr).opacity).lastIndexOf(1);
      const box = document.querySelector("#lpJourneyStage").getBoundingClientRect();
      return { active: t.isActive, on, top, open, fits: box.bottom <= innerHeight + 1 && box.top >= -1 };
    }));
  }
  const order = lit.map((s) => s.on).join("/");
  say(lit.every((s) => s.active), `journey: pinned through its range`);
  say(order === "0/1/2/3", `journey: a different move is lit at 12/38/62/88% (${order})`);
  say(lit.every((s, i) => s.top === i), `journey: the lit move's photograph is the one on top (${lit.map((s) => s.top).join("/")})`);
  say(lit.every((s) => s.open.filter((h) => h > 4).length === 1 && s.open[s.on] > 4), `journey: only the lit move is open (${lit.map((s) => s.open.join(",")).join(" | ")})`);
  say(lit.every((s) => s.fits), "journey: the pinned stage fits the window");
}

// ---- why here
const w = await range("lp-why-pin");
if (!w || w.end <= w.start) say(false, "why: pin missing or empty");
else {
  const tops = [];
  for (const f of [0.2, 0.5, 0.8]) {
    await scrollTo(w.start + (w.end - w.start) * f);
    tops.push(await page.evaluate(() => {
      const head = document.querySelector("#why .lp-why_head");
      const h2 = head.querySelector("h2");
      return { top: Math.round(head.getBoundingClientRect().top), grid: Math.round(document.querySelector("#why .lp-why_grid").getBoundingClientRect().top), opacity: +getComputedStyle(h2).opacity };
    }));
  }
  say(Math.abs(tops[0].top - tops[2].top) <= 2, `why: head held at ${tops.map((t) => t.top).join("/")}px`);
  say(tops[0].grid > tops[1].grid && tops[1].grid > tops[2].grid, `why: the reasons pass beside it (${tops.map((t) => t.grid).join("/")})`);
  say(tops.every((t) => t.opacity > 0.95), `why: the held heading stays readable (${tops.map((t) => t.opacity).join("/")})`);
}

// ---- the path
const p = await page.evaluate(() => {
  const t = ScrollTrigger.getAll().find((item) => item.vars.pin && item.trigger?.id === "pathPin");
  return t && { start: t.start, end: t.end };
});
if (!p || p.end <= p.start) say(false, "path: pin missing or empty");
else {
  const xs = [];
  for (const f of [0.25, 0.5, 0.75]) {
    await scrollTo(p.start + (p.end - p.start) * f);
    xs.push(await page.evaluate(() => Math.round(new DOMMatrixReadOnly(getComputedStyle(document.querySelector("#pathTrack")).transform).m41)));
  }
  say(xs[0] > xs[1] && xs[1] > xs[2], `path: track at ${xs.join(" / ")} at 25/50/75%`);
  const railMid = await page.evaluate(() => {
    const r = document.querySelector(".lp-rail");
    const b = r.getBoundingClientRect();
    return r.classList.contains("is-in") && b.bottom <= innerHeight + 1 && b.top > 0;
  });
  say(railMid, "rail is in reach mid-page");
}

for (const error of errors) say(false, `browser: ${error}`);
console.log(`${failures} problem(s)`);
await browser.close();
process.exitCode = failures ? 1 : 0;
