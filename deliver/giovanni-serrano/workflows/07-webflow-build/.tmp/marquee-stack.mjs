import { chromium } from "playwright";

const browser = await chromium.launch();
for (const [name, u] of [["staging", "https://giovanni-serrano.webflow.io/"], ["design", "http://127.0.0.1:8806/index.html"]]) {
  if (name === "design") {
    const { spawn } = await import("node:child_process");
    spawn("python", ["-m", "http.server", "8806", "--directory", "../05-design-revisions/.tmp/final revisions"], { stdio: "ignore", cwd: process.cwd() + "/.." });
    await new Promise(r => setTimeout(r, 1200));
  }
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(u, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const rep = await page.evaluate(() => {
    const out = {};
    for (const y of [70, 80, 90]) {
      out["y" + y] = document.elementsFromPoint(195, y).slice(0, 6).map(el => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return (el.tagName + "." + (el.getAttribute("class") || "").split(" ").slice(0, 3).join(".")) +
          " rect=" + [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(",") +
          " bg=" + cs.backgroundColor + " pos=" + cs.position + " z=" + cs.zIndex;
      });
    }
    const m = document.querySelector(".marquee");
    out.marqueeParentChain = [];
    let p = m;
    for (let i = 0; i < 5 && p; i++) {
      const cs = getComputedStyle(p);
      const r = p.getBoundingClientRect();
      out.marqueeParentChain.push((p.tagName + "." + (p.getAttribute("class") || "").split(" ").slice(0, 3).join(".")) + " rect=" + [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(",") + " pos=" + cs.position + " overflow=" + cs.overflow + " bg=" + cs.backgroundColor);
      p = p.parentElement;
    }
    out.marqueeHTML = m.outerHTML.slice(0, 500);
    return out;
  });
  console.log("=====", name, JSON.stringify(rep, null, 1));
  await page.close();
}
await browser.close();
