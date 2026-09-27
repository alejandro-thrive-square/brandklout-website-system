// ===========================================================================
// THE FREEZE GATE: did the two approved pages move?
//
// Every block appended to site.css since the freeze carries the same promise:
// "the homepage and the Invisalign page must not move a pixel". Until now
// that was checked by re-running shot.mjs and reading four numbers off the
// console by eye. This writes them down and diffs them.
//
//   node probe-heights.mjs --save base          # before touching site.css
//   node probe-heights.mjs --diff base          # after: exits 1 on any change
//   node probe-heights.mjs ../home/about-us/index.html   # ad hoc, any page
//
// It measures with reduced motion ON, so no pin spacer and no half-finished
// tween can vary the number between runs. That is deliberate: this gate is
// about layout, not motion. probe-scene.mjs is the one that drives the pin.
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const args = process.argv.slice(2);
const flag = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const save = flag("--save"), diff = flag("--diff");
const explicit = args.filter((a) => !a.startsWith("--") && a !== save && a !== diff);

const FROZEN = ["../home/index.html", "../home/services/invisalign/index.html"];
const pages = explicit.length ? explicit : FROZEN;
const WIDTHS = [390, 768, 1024, 1440];

const browser = await chromium.launch({ executablePath: CHROME, args: ["--allow-file-access-from-files"] });
const result = {};
for (const p of pages) {
  const file = path.resolve(p);
  const url = "file:///" + file.split(path.sep).join("/");
  const key = path.relative(path.resolve(".."), file).split(path.sep).join("/");
  result[key] = {};
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const secs = [...document.querySelectorAll("main > section, main > div")].map((s) => Math.round(s.getBoundingClientRect().height));
      return { height: document.body.scrollHeight, overflow: de.scrollWidth - de.clientWidth, sections: secs };
    });
    result[key][w] = r;
    await ctx.close();
  }
}
await browser.close();

const store = (name) => path.join("heights", name + ".json");
if (save) {
  fs.mkdirSync("heights", { recursive: true });
  fs.writeFileSync(store(save), JSON.stringify(result, null, 1));
  console.log("saved " + store(save));
}
for (const [k, byW] of Object.entries(result)) {
  console.log("\n" + k);
  for (const [w, r] of Object.entries(byW)) {
    console.log("  " + String(w).padStart(4) + "  height " + String(r.height).padStart(6) + "  overflow " + r.overflow + "  sections " + r.sections.join(" "));
  }
}
if (diff) {
  const base = JSON.parse(fs.readFileSync(store(diff), "utf8"));
  let moved = 0;
  for (const [k, byW] of Object.entries(result)) {
    for (const [w, r] of Object.entries(byW)) {
      const b = base[k] && base[k][w];
      if (!b) continue;
      if (b.height !== r.height || b.sections.join() !== r.sections.join()) {
        moved++;
        console.log("\nMOVED " + k + " @" + w + ": " + b.height + " -> " + r.height);
        r.sections.forEach((h, i) => { if (b.sections[i] !== h) console.log("   section " + i + ": " + b.sections[i] + " -> " + h); });
      }
    }
  }
  console.log(moved ? "\n" + moved + " page/width pairs moved" : "\nfrozen pages unchanged at every width");
  process.exit(moved ? 1 : 0);
}
