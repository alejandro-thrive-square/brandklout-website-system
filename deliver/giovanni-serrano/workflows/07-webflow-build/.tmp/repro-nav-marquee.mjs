import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import url from "node:url";
import fs from "node:fs";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const DESIGN_DIR = path.resolve(HERE, "..", "..", "05-design-revisions", ".tmp", "final revisions");
const srv = spawn("python", ["-m", "http.server", "8805", "--directory", DESIGN_DIR], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1200));
fs.mkdirSync(".tmp/verify/navmarq", { recursive: true });

const browser = await chromium.launch();
const targets = [
  ["design-index", "http://127.0.0.1:8805/index.html"],
  ["design-invest", "http://127.0.0.1:8805/invest.html"],
  ["staging-index", "https://giovanni-serrano.webflow.io/"],
  ["staging-invest", "https://giovanni-serrano.webflow.io/invest"],
  ["staging-detail", "https://giovanni-serrano.webflow.io/projects/4855-college-ave"],
];

for (const [name, u] of targets) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(u, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  // top of page: nav + marquee
  await page.screenshot({ path: `.tmp/verify/navmarq/${name}-top.png`, clip: { x: 0, y: 0, width: 390, height: 200 } });
  // marquee diagnostics
  const marq = await page.evaluate(() => {
    const m = document.querySelector(".marquee");
    if (!m) return "no .marquee";
    const track = m.firstElementChild;
    const span = track && track.firstElementChild;
    const pick = (el, props) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const o = { rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(",") };
      props.forEach(p => o[p] = cs[p]);
      return o;
    };
    return {
      marquee: pick(m, ["height", "display", "alignItems", "overflow", "padding", "background"]),
      track: pick(track, ["display", "alignItems", "animationName", "animationDuration", "gap", "whiteSpace", "flexWrap", "width", "transform"]),
      trackChildren: track ? track.children.length : 0,
      firstSpan: pick(span, ["fontSize", "lineHeight", "display", "padding", "color"])
    };
  });
  console.log("=== " + name + " marquee:", JSON.stringify(marq));
  // open nav
  const btn = page.locator("button.nav-toggle");
  if (await btn.count()) {
    await btn.tap();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `.tmp/verify/navmarq/${name}-menuopen.png`, clip: { x: 0, y: 0, width: 390, height: 500 } });
    const menu = await page.evaluate(() => {
      const l = document.querySelector("nav .links");
      const cs = getComputedStyle(l);
      const links = [...l.querySelectorAll("a")].map(a => {
        const r = a.getBoundingClientRect();
        return { t: (a.textContent || "").trim().slice(0, 12), y: Math.round(r.y), h: Math.round(r.height), display: getComputedStyle(a).display };
      });
      return { cls: l.className, display: cs.display, position: cs.position, top: cs.top, background: cs.backgroundColor, flexDirection: cs.flexDirection, rect: (r => [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(","))(l.getBoundingClientRect()), links };
    });
    console.log("=== " + name + " open menu:", JSON.stringify(menu));
  }
  await ctx.close();
}
await browser.close();
srv.kill();
console.log("done");
