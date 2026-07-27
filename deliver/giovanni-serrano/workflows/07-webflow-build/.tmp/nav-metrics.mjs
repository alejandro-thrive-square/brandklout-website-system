import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const DESIGN_DIR = path.resolve(HERE, "..", "..", "05-design-revisions", ".tmp", "final revisions");
spawn("python", ["-m", "http.server", "8807", "--directory", DESIGN_DIR], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1200));

const browser = await chromium.launch();
async function probe(u) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(u, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => {
    const nav = document.querySelector("nav.top");
    const nr = nav.getBoundingClientRect();
    const ncs = getComputedStyle(nav);
    const wrap = document.querySelector("div.nav-toggle.w-embed");
    const btn = document.querySelector("button.nav-toggle");
    const strip = document.querySelector(".marquee, .context");
    const sr = strip ? strip.getBoundingClientRect() : null;
    const scs = strip ? getComputedStyle(strip) : null;
    const box = el => el ? (x => [Math.round(x.x), Math.round(x.y), Math.round(x.width), Math.round(x.height)].join(","))(el.getBoundingClientRect()) : null;
    return {
      navH: Math.round(nr.height), navPad: ncs.padding, navPos: ncs.position,
      wrapper: box(wrap), wrapperPad: wrap ? getComputedStyle(wrap).padding : null, wrapperDisplay: wrap ? getComputedStyle(wrap).display : null,
      button: box(btn),
      strip: strip ? { cls: strip.getAttribute("class"), rect: box(strip), pos: scs.position, top: scs.top, z: scs.zIndex } : "none",
      navZ: ncs.zIndex
    };
  });
  await page.close();
  return r;
}
for (const [n, u] of [
  ["design-index ", "http://127.0.0.1:8807/index.html"],
  ["design-invest", "http://127.0.0.1:8807/invest.html"],
  ["stage-index  ", "https://giovanni-serrano.webflow.io/"],
  ["stage-invest ", "https://giovanni-serrano.webflow.io/invest"],
  ["stage-detail ", "https://giovanni-serrano.webflow.io/projects/4855-college-ave"],
]) console.log(n, JSON.stringify(await probe(u)));
await browser.close();
