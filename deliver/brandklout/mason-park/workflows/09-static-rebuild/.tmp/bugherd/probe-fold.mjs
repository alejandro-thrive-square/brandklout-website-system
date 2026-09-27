// BugHerd #71/#73/#74/#77 (2026-09-16): open a "read more" fold, then scroll
// to a later chapter and read its head's opacity. A stale ScrollTrigger (the
// page grew but the triggers were not refreshed) fades headings that are
// still on screen. Also reports the fold's photo size before and after.
//   node probe-fold.mjs <origin> [engine] > log
import { chromium, webkit } from "playwright-core";

const [origin = "http://127.0.0.1:8089", engine = "webkit"] = process.argv.slice(2);
const b = engine === "webkit" ? await webkit.launch() : await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe" });
const p = await b.newPage({ viewport: { width: 1512, height: 652 } });
await p.goto(origin + "/our-doctors/", { waitUntil: "load" });
await p.waitForTimeout(2000);

const heads = () => p.evaluate(() => [...document.querySelectorAll("section[data-chapter]")].map((s) => {
  const h = s.querySelector("h2");
  if (!h) return null;
  const r = h.getBoundingClientRect();
  return { id: s.id, top: Math.round(r.top), op: +getComputedStyle(h).opacity.slice(0, 4) };
}).filter((x) => x && x.top > 90 && x.top < innerHeight - 40));

const scrollTo = async (sel, frac = 0.35) => {
  await p.evaluate(([sel, frac]) => {
    document.documentElement.style.scrollBehavior = "auto";
    const el = document.querySelector(sel);
    window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * frac);
  }, [sel, frac]);
  await p.waitForTimeout(1500);
};

const photo = () => p.evaluate(() => {
  const i = document.querySelector("#specialist figure.cp-split_ink img, #specialist img");
  const r = i.getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), filter: getComputedStyle(i).filter };
});

await scrollTo("#specialist");
console.log("specialist photo before", JSON.stringify(await photo()));
// Click, as the reviewer does: the portrait is held on the summary's click.
const sums = p.locator("details.el-fold > summary");
const folds = await sums.count();
for (let i = 0; i < folds; i++) { await sums.nth(i).scrollIntoViewIfNeeded(); await sums.nth(i).click(); await p.waitForTimeout(400); }
await scrollTo("#specialist");
console.log(`opened ${folds} folds`);
console.log("specialist photo after", JSON.stringify(await photo()));
for (const sel of ["#specialist h2", "#measure", "#voices"]) {
  await scrollTo(sel);
  console.log(sel, JSON.stringify(await heads()));
  await p.screenshot({ path: `fold-${engine}-${sel.replace(/\W/g, "")}.png` });
}
await b.close();
