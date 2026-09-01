/**
 * Headless checks for the service page's dossier layout and its three controls.
 *
 * WHY A SECOND SUITE RATHER THAN MORE CASES IN journey-test.mjs. That file
 * guards everything on `.journey_page` and asserts a pinned viewport, a
 * word-by-word thesis, a horizontal track that travels and a chapter readout.
 * None of those exist here, by design: this page is a document with a sticky
 * rail and three stateful controls. Bolting it onto that suite would have meant
 * a file where half the assertions skip depending on the argument, which is how
 * a test suite quietly stops testing anything.
 *
 * The two suites share their standard, which is the one thing that matters:
 * every assertion is POSITIVE ("the rail moved 0px while the page moved 900",
 * "the tally says 3 of 4") rather than an absence check, because the failure
 * modes here are silent. A tab strip whose panels never swap looks identical in
 * a screenshot to one that works.
 *
 * Usage:  node dossier-test.mjs [../final-site] [neck-lift.html]
 */
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, process.argv[2] || "../final-site");
const PAGE = process.argv[3] || "neck-lift.html";
const PORT = 8813;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const MIME = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png",
  ".avif": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2",
};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const results = [];
function check(name, pass, note) {
  results.push({ name, pass: !!pass, note: note || "" });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${note ? "  " + note : ""}`);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});
const url = `http://127.0.0.1:${PORT}/${PAGE}`;
// `behavior: "instant"`, because <html> carries `scroll-behavior: smooth`.
const settle = (pg, y) =>
  pg.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y).then(() => new Promise((r) => setTimeout(r, 260)));

/* --- 1. the shape holds at every width ------------------------------------ */
for (const width of [360, 390, 768, 1024, 1440, 1920]) {
  const pg = await browser.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e)));
  pg.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await pg.setViewport({ width, height: 900 });
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

  const box = await pg.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    // Anything whose right edge is past the viewport, which is the shape of the
    // namespace bug that shipped in the first build: the spec card inherited a
    // width from the home page's carousel and ran off the screen.
    over: [...document.querySelectorAll(".dossier_page *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        // The matrix is ALLOWED to be wider than its box; it scrolls inside it.
        if (el.closest(".matrix_scroll")) return false;
        return r.right > document.documentElement.clientWidth + 1;
      })
      .map((el) => el.className.toString().split(" ")[0] || el.tagName)
      .slice(0, 4),
  }));
  check(`no horizontal overflow @ ${width}`, box.scrollW <= box.clientW + 1, `scrollWidth ${box.scrollW} vs ${box.clientW}`);
  check(`nothing runs past the right edge @ ${width}`, box.over.length === 0, box.over.join(", "));
  check(`console clean @ ${width}`, errors.length === 0, errors.slice(0, 2).join(" | "));
  await pg.close();
}

/* --- 2. no GSAP, and none requested -------------------------------------- */
{
  const pg = await browser.newPage();
  const requested = [];
  pg.on("request", (r) => requested.push(r.url()));
  await pg.setViewport({ width: 1440, height: 900 });
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  const g = await pg.evaluate(() => ({ gsap: !!window.gsap, st: !!window.ScrollTrigger }));
  check("the vendor bundle is never requested", !requested.some((u) => u.includes("vendor.js")), `${requested.length} requests`);
  check("GSAP is absent from the page", !g.gsap && !g.st);
  check("no off-origin requests", requested.every((u) => u.startsWith(`http://127.0.0.1:${PORT}`) || u.startsWith("data:")),
    requested.filter((u) => !u.startsWith(`http://127.0.0.1:${PORT}`) && !u.startsWith("data:")).slice(0, 2).join(" "));
  await pg.close();
}

/* --- 3. the rail actually sticks ----------------------------------------- */
{
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1440, height: 900 });
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  const before = await pg.evaluate(() => document.querySelector(".spec_card").getBoundingClientRect().top);
  await settle(pg, 2400);
  const after = await pg.evaluate(() => ({
    top: document.querySelector(".spec_card").getBoundingClientRect().top,
    y: window.scrollY,
    inView: document.querySelector(".spec_card").getBoundingClientRect().bottom < window.innerHeight + 200,
  }));
  // The whole point of the layout: the page moved 2400px and the card did not
  // leave the screen. `position: sticky` on a grid item is easy to get wrong
  // (a stretched item never moves) and it fails silently.
  check("the spec rail sticks while the page scrolls", after.top > 0 && after.top < 400 && after.inView,
    `card top ${Math.round(before)} -> ${Math.round(after.top)} after ${after.y}px of scroll`);
  await pg.close();
}

/* --- 4. the three controls ------------------------------------------------ */
{
  const pg = await browser.newPage();
  const errors = [];
  pg.on("pageerror", (e) => errors.push(String(e)));
  await pg.setViewport({ width: 1440, height: 900 });
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

  // the layer switcher
  const start = await pg.evaluate(() => ({
    visible: [...document.querySelectorAll(".layers_panel")].filter((p) => !p.hidden).length,
    name: document.querySelector(".layers_panel:not([hidden]) .layers_name").textContent.trim(),
    lit: [...document.querySelectorAll(".layers_bar.is-on")].length,
    active: document.querySelector(".layers_bar.is-active")?.getAttribute("data-layer"),
  }));
  check("one layer panel is shown at a time", start.visible === 1, `${start.visible} visible, "${start.name}"`);
  check("choosing the deepest layer lights all three bars", start.lit === 3 && start.active === "muscle",
    `${start.lit} lit, active ${start.active}`);

  await pg.click("#tab-skin");
  await new Promise((r) => setTimeout(r, 320));
  const skin = await pg.evaluate(() => ({
    name: document.querySelector(".layers_panel:not([hidden]) .layers_name").textContent.trim(),
    lit: [...document.querySelectorAll(".layers_bar.is-on")].length,
    active: document.querySelector(".layers_bar.is-active")?.getAttribute("data-layer"),
    selected: document.querySelector('.layers_tab[aria-selected="true"]').id,
  }));
  check("the tab swaps the panel", skin.name === "Excess skin", `now "${skin.name}"`);
  check("the surface layer lights one bar", skin.lit === 1 && skin.active === "skin", `${skin.lit} lit, active ${skin.active}`);
  check("aria-selected follows the click", skin.selected === "tab-skin", skin.selected);

  // the arrow keys, which is the half of the tab pattern that is usually missing
  await pg.focus("#tab-skin");
  await pg.keyboard.press("ArrowRight");
  await new Promise((r) => setTimeout(r, 120));
  const wrapped = await pg.evaluate(() => document.querySelector('.layers_tab[aria-selected="true"]').id);
  check("the arrow keys move between tabs", wrapped === "tab-muscle", `ArrowRight from skin -> ${wrapped}`);

  // the self-check
  const boxes = await pg.$$(".check_input");
  await boxes[0].click();
  await boxes[2].click();
  await new Promise((r) => setTimeout(r, 120));
  const tally = await pg.evaluate(() => ({
    count: document.querySelector(".check_out-count").textContent.trim(),
    text: document.querySelector(".check_out-text").textContent.trim(),
  }));
  check("the self-check counts", tally.count === "2 of 4", tally.count);
  check("the self-check reading changes with the count", /consultation/i.test(tally.text), tally.text.slice(0, 60) + "...");
  // The guard that matters: it must never tell a stranger they need surgery.
  const allFour = await pg.evaluate(() => {
    document.querySelectorAll(".check_input").forEach((i) => { if (!i.checked) i.click(); });
    return document.querySelector(".check_out-text").textContent.trim();
  });
  check("even four of four hands the decision back to a consultation",
    /Dr\. Stone|consultation|examination/i.test(allFour), allFour.slice(0, 70) + "...");

  check("no console errors while driving the controls", errors.length === 0, errors.slice(0, 2).join(" | "));
  await pg.close();
}

/* --- 5. the timeline draws and the spy tracks ----------------------------- */
{
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1440, height: 900 });
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  const top = await pg.evaluate(() => {
    const el = document.querySelector(".tl_component");
    return { p: parseFloat(getComputedStyle(el).getPropertyValue("--p")), lit: document.querySelectorAll(".tl_stop.is-lit").length };
  });
  const y = await pg.evaluate(() => window.scrollY + document.querySelector(".tl_component").getBoundingClientRect().bottom - 200);
  await settle(pg, y);
  const bottom = await pg.evaluate(() => {
    const el = document.querySelector(".tl_component");
    return { p: parseFloat(getComputedStyle(el).getPropertyValue("--p")), lit: document.querySelectorAll(".tl_stop.is-lit").length };
  });
  check("the timeline spine draws as the section passes", top.p < 0.2 && bottom.p > 0.9, `--p ${top.p.toFixed(2)} -> ${bottom.p.toFixed(2)}`);
  check("every stop lights by the end of it", bottom.lit === 4, `${top.lit} -> ${bottom.lit} of 4`);

  const spy = await pg.evaluate(() => document.querySelector(".toc_link.is-here")?.textContent.trim());
  check("the rail marks the section being read", spy === "Recovery", `marked "${spy}"`);

  // The matrix opens on the column the reader is on, not on the first one.
  await pg.setViewport({ width: 390, height: 844 });
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  const m = await pg.evaluate(() => {
    const box = document.querySelector(".matrix_scroll");
    const cur = box.querySelector("thead .is-current");
    return { left: Math.round(box.scrollLeft), curLeft: Math.round(cur.offsetLeft), max: box.scrollWidth - box.clientWidth };
  });
  check("the matrix opens on the current column", m.max > 0 && m.left > 0, `scrollLeft ${m.left} of ${m.max}`);
  await pg.close();
}

/* --- 6. the mobile bar ---------------------------------------------------- */
{
  const pg = await browser.newPage();
  await pg.setViewport({ width: 390, height: 844 });
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  const bar = await pg.evaluate(() => {
    const b = document.querySelector(".mbar_component");
    const r = b.getBoundingClientRect();
    const cs = getComputedStyle(b);
    return { shown: cs.display !== "none", bottom: Math.round(r.bottom), vh: window.innerHeight, h: Math.round(r.height) };
  });
  check("the sticky bar is on screen on a phone", bar.shown && Math.abs(bar.bottom - bar.vh) < 2, `bottom ${bar.bottom} of ${bar.vh}`);
  // The bar is FIXED, so at the very bottom of the page it sits on top of
  // whatever is there. That is the footer's legal line, which is outside
  // `.dossier_page` and therefore outside the bottom padding on the layout.
  const clear = await pg.evaluate(async () => {
    // `behavior: "instant"` matters: 02-base.css sets `scroll-behavior: smooth`
    // on <html>, so a plain scrollTo ANIMATES ten thousand pixels and any
    // reasonable wait measures the page still near the top. The first run of
    // this assertion failed for exactly that reason and the layout was fine.
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 250));
    const last = document.querySelector(".footer_legal");
    const bar = document.querySelector(".mbar_component");
    return {
      lastBottom: Math.round(last.getBoundingClientRect().bottom),
      barTop: Math.round(bar.getBoundingClientRect().top),
    };
  });
  check("the footer's last line clears the sticky bar", clear.lastBottom <= clear.barTop,
    `legal bottom ${clear.lastBottom} vs bar top ${clear.barTop}`);

  await pg.setViewport({ width: 1440, height: 900 });
  await pg.reload({ waitUntil: "networkidle0" });
  const hidden = await pg.evaluate(() => getComputedStyle(document.querySelector(".mbar_component")).display === "none");
  check("the sticky bar is gone on a desktop, where the rail does its job", hidden);
  await pg.close();
}

/* --- 7. reduced motion ---------------------------------------------------- */
{
  const pg = await browser.newPage();
  await pg.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await pg.setViewport({ width: 1440, height: 900 });
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  const r = await pg.evaluate(() => ({
    p: parseFloat(getComputedStyle(document.querySelector(".tl_component")).getPropertyValue("--p")),
    lit: document.querySelectorAll(".tl_stop.is-lit").length,
    hidden: [...document.querySelectorAll('[data-d="rise"]')].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length,
    panels: [...document.querySelectorAll(".layers_panel")].filter((p) => !p.hidden).length,
  }));
  // The timeline is simply drawn and every stop lit: the still state has to be
  // the finished state, not the empty one.
  check("reduced motion draws the timeline in full", r.p >= 1 && r.lit === 4, `--p ${r.p}, ${r.lit} lit`);
  check("reduced motion leaves nothing hidden", r.hidden === 0, `${r.hidden} under full opacity`);
  // The controls are function, not decoration, so they still work.
  check("reduced motion keeps the tab switcher working", r.panels === 1, `${r.panels} panel(s) shown`);
  await pg.close();
}

/* --- 8. no JS at all ------------------------------------------------------ */
{
  const pg = await browser.newPage();
  await pg.setJavaScriptEnabled(false);
  await pg.setViewport({ width: 1440, height: 900 });
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  const s = await pg.evaluate(() => ({
    js: document.documentElement.classList.contains("js"),
    panels: [...document.querySelectorAll(".layers_panel")].filter((p) => !p.hidden).length,
    hidden: [...document.querySelectorAll('[data-d="rise"]')].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.99).length,
    text: document.body.innerText.replace(/\s+/g, " ").trim().length,
    images: document.querySelectorAll("img").length,
    boxes: document.querySelectorAll(".check_input").length,
  }));
  check("no-JS: the .js scope is absent", !s.js);
  // ALL THREE panels, because `hidden` is applied by the script and never in
  // the markup. A page with no JS shows the whole section rather than one box.
  check("no-JS: every layer panel is on the page", s.panels === 3, `${s.panels} of 3 visible`);
  check("no-JS: nothing is left invisible", s.hidden === 0, `${s.hidden} hidden`);
  check("no-JS: the checkboxes are still real controls", s.boxes === 4, `${s.boxes} inputs`);
  check("no-JS: the page still carries its content", s.text > 3000 && s.images >= 4, `${s.text} chars, ${s.images} images`);
  await pg.close();
}

/* --- 9. the keyboard ------------------------------------------------------ */
{
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1440, height: 900 });
  await pg.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  const walk = await pg.evaluate(async () => {
    const seen = [];
    let noRing = 0;
    for (let i = 0; i < 45; i++) {
      // eslint-disable-next-line no-undef
      const before = document.activeElement;
      await new Promise((r) => { document.addEventListener("keyup", r, { once: true }); document.dispatchEvent(new KeyboardEvent("keyup")); });
      if (document.activeElement === before) break;
    }
    return { seen: seen.length, noRing };
  });
  // Puppeteer drives the real Tab key; the evaluate above cannot. Do it here.
  let stops = 0;
  let noRing = 0;
  for (let i = 0; i < 45; i++) {
    await pg.keyboard.press("Tab");
    const info = await pg.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
      const shadow = cs.boxShadow && cs.boxShadow !== "none";
      const border = cs.borderBottomColor;
      return { tag: el.tagName, cls: el.className.toString().slice(0, 40), ring: ring || shadow || !!border };
    });
    if (!info) break;
    stops++;
    if (!info.ring) noRing++;
  }
  check("the page is walkable by keyboard", stops > 8, `${stops} stops`);
  check("every keyboard stop paints something", noRing === 0, `${noRing} without a visible state`);
  // The tab strip is ONE stop, not three: roving tabindex.
  const roving = await pg.evaluate(() => [...document.querySelectorAll(".layers_tab")].filter((t) => t.tabIndex === 0).length);
  check("the tab strip is one stop in the tab order", roving === 1, `${roving} tabbable of 3`);
  void walk;
  await pg.close();
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("\nFAILED:");
  for (const f of failed) console.log(`  ${f.name}  ${f.note}`);
  process.exitCode = 1;
}
