import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import url from "node:url";

const HERE = path.dirname(url.fileURLToPath(import.meta.url));
const DESIGN_DIR = path.resolve(HERE, "..", "..", "05-design-revisions", ".tmp", "final revisions");
const srv = spawn("python", ["-m", "http.server", "8803", "--directory", DESIGN_DIR], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 1200));

const browser = await chromium.launch();
async function test(u, label) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(u, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => {
    const cands = [...document.querySelectorAll("nav *")].filter(el => {
      const c = el.getAttribute("class") || "";
      return /toggle|burger|menu/i.test(c);
    }).map(el => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return { tag: el.tagName, cls: (el.getAttribute("class") || ""), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), display: cs.display };
    });
    return cands;
  });
  console.log(label, "toggle candidates:", JSON.stringify(info));
  const vis = info.find(c => c.w > 0 && c.h > 0 && c.display !== "none");
  if (vis) {
    await page.touchscreen.tap(vis.x + vis.w / 2, vis.y + vis.h / 2);
    await page.waitForTimeout(700);
    const state = await page.evaluate(() => {
      const links = document.querySelector("nav .links");
      const cs = links ? getComputedStyle(links) : null;
      return links ? { cls: links.className, display: cs.display } : "no links";
    });
    console.log(label, "after tap:", JSON.stringify(state));
    // also try plain click
    await page.mouse.click(vis.x + vis.w / 2, vis.y + vis.h / 2);
    await page.waitForTimeout(700);
    const state2 = await page.evaluate(() => {
      const links = document.querySelector("nav .links");
      return { cls: links.className, display: getComputedStyle(links).display };
    });
    console.log(label, "after click:", JSON.stringify(state2));
  }
  await ctx.close();
}
await test("http://127.0.0.1:8803/index.html", "DESIGN");
await test("https://giovanni-serrano.webflow.io/", "STAGING");
await test("https://giovanni-serrano.webflow.io/projects/4855-college-ave", "TEMPLATE");
await browser.close();
srv.kill();
