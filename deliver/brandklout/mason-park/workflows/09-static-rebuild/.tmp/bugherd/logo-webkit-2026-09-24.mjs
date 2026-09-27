// #3 re-check in WebKit (the reviewer is Safari 26 on a Mac at 1512x735, 2x):
// the header logo's box against its image and every clipping ancestor, on the
// top of the page and after a scroll (the header shrinks when it sticks).
//   node logo-webkit-2026-09-24.mjs > logo-webkit-2026-09-24.log
import { webkit } from "playwright-core";
const b = await webkit.launch();
for (const [w, h] of [[1512, 735], [1440, 900], [1920, 1080]]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await p.goto("https://staging.masonparkdental.com/", { waitUntil: "load" });
  await p.waitForTimeout(2500);
  for (const at of [0, 1200]) {
    await p.evaluate((y) => { document.documentElement.style.scrollBehavior = "auto"; scrollTo(0, y); }, at);
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => {
      const img = document.querySelector(".navbar_logo");
      const ib = img.getBoundingClientRect();
      const clips = [];
      for (let e = img.parentElement; e && e !== document.body; e = e.parentElement) {
        const cs = getComputedStyle(e);
        if (cs.overflow !== "visible" || cs.overflowY !== "visible") { const r = e.getBoundingClientRect(); clips.push({ el: e.className.split(" ")[0], bottom: +r.bottom.toFixed(2), top: +r.top.toFixed(2) }); }
      }
      return { src: img.currentSrc.split("/").pop(), natural: `${img.naturalWidth}x${img.naturalHeight}`, box: [+ib.top.toFixed(2), +ib.bottom.toFixed(2), +ib.width.toFixed(2), +ib.height.toFixed(2)], clips };
    });
    const cut = r.clips.filter((c) => c.bottom < r.box[1] - 0.01 || c.top > r.box[0] + 0.01);
    console.log(`${w}x${h} scroll ${at}: ${JSON.stringify(r)} -> ${cut.length ? "CLIPPED" : "whole"}`);
    await p.locator(".navbar_logo-link").screenshot({ path: `logo-webkit-${w}-${at}.png` });
  }
  await p.close();
}
await b.close();
