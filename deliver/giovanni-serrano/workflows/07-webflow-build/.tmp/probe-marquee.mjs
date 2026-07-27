import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const DESIGN_DIR = path.resolve(HERE, "..", "..", "05-design-revisions", ".tmp", "final revisions");
const srv = spawn("python", ["-m", "http.server", "8801", "--directory", DESIGN_DIR], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1200));

const browser = await chromium.launch();
async function probe(u, w) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  await page.goto(u, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const res = await page.evaluate(() => {
    const cands = [...document.querySelectorAll('[class*="marquee"], [class*="ticker"], [class*="strip"]')];
    return cands.slice(0, 6).map(el => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName, cls: (el.getAttribute("class") || "").slice(0, 70),
        h: Math.round(r.height), w: Math.round(r.width),
        padding: cs.padding, fontSize: cs.fontSize, lineHeight: cs.lineHeight,
        overflow: cs.overflow, display: cs.display, alignItems: cs.alignItems,
        anim: cs.animationName + " " + cs.animationDuration,
        childCount: el.children.length,
        firstChildH: el.firstElementChild ? Math.round(el.firstElementChild.getBoundingClientRect().height) : null,
        firstChildCls: el.firstElementChild ? (el.firstElementChild.getAttribute("class") || "").slice(0, 60) : null
      };
    });
  });
  await page.close();
  return res;
}
console.log("== DESIGN mobile ==");
console.log(JSON.stringify(await probe("http://127.0.0.1:8801/index.html", 390), null, 1));
console.log("== STAGING mobile ==");
console.log(JSON.stringify(await probe("https://giovanni-serrano.webflow.io/", 390), null, 1));
await browser.close();
srv.kill();
