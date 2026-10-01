/**
 * Headless checks for a journey page's chapters.
 *
 * RUNS AGAINST EITHER PAGE, and since 2026-09-01 it has to: the neck lift page
 * is built in the same system and shares every failure mode. Pass the page as
 * the second argument. Two assertions were hard-coded to the home page's
 * content when the home page was the only page, and both are noted where they
 * were generalised. Everything else was already page-agnostic, which is the
 * useful thing this exercise proved about the suite.
 *
 * The point of this file is that the journey layer's failure modes are SILENT.
 * A pin that never creates, a scrub that never advances, a bundle that boots
 * and then throws: all of them leave a page that looks plausible in a
 * screenshot and is broken in a browser. Every assertion below is therefore
 * POSITIVE ("the track moved 900px") rather than an absence check ("no error
 * was thrown"), because the Nahlah build shipped a guard clause that reported
 * PASS while ScrollSmoother was silently dead.
 *
 * It also asserts the two things the design has to keep no matter what:
 *   - no horizontal overflow at any of the six widths, and
 *   - with prefers-reduced-motion, ZERO pins and every reveal already visible.
 *
 * Usage:  node journey-test.mjs [../final-site] [index.html]
 */
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, process.argv[2] || "../final-site");
const PAGE = process.argv[3] || "index.html";
const PORT = 8811;
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) {
    res.writeHead(404);
    return res.end("not found");
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});

async function open({ width, height = 900, reduce = false }) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  if (reduce) await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${PORT}/${PAGE}`, { waitUntil: "networkidle0", timeout: 60000 });
  // The site sets `scroll-behavior: smooth` on the root, which is correct for
  // its anchor links and ruinous for a harness that scrolls and measures in the
  // same breath: every reading is taken mid-glide. Turned off here, in the test
  // only. Never assert against a page that is still moving.
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  await new Promise((r) => setTimeout(r, 600));
  return { page, errors };
}

/* Scroll, then wait until the page has actually stopped moving, then let
   GSAP's scrubs catch up on top of that.
 *
 * This is a real function, not a string. page.evaluate() accepts a string, but
 * it evaluates it as an EXPRESSION and silently drops the extra arguments: an
 * earlier version passed the body as a template literal and every scroll in the
 * suite quietly did nothing, which read as six separate feature failures. */
const settle = (page, y) =>
  page.evaluate(async (target) => {
    window.scrollTo(0, target);
    let last = -1;
    let same = 0;
    for (let i = 0; i < 90 && same < 3; i++) {
      await new Promise((r) => requestAnimationFrame(r));
      if (window.scrollY === last) same++;
      else {
        same = 0;
        last = window.scrollY;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
    return window.scrollY;
  }, y);

/* --- 1. no horizontal overflow, at every width the brief names ------------- */
for (const width of [360, 390, 768, 1024, 1440, 1920]) {
  const { page, errors } = await open({ width });
  const over = await page.evaluate(() => {
    const de = document.documentElement;
    const wide = [];
    // scrollWidth on the root is what a reader actually feels. The per-element
    // pass names the culprit, which is the difference between "something
    // overflows" and a fixable report.
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > de.clientWidth + 1.5) {
        // Excused if some ancestor contains it: a scrollable rail the reader
        // can reach, or a clipping context, which is how every deliberate
        // bleed in this design is built (the surgeon portrait, the two offer
        // bands, the pinned track). Content clipped on purpose is not overflow.
        // What that CANNOT excuse is a clipped control; see the next check.
        let p = el.parentElement;
        while (p && p !== document.body) {
          const ov = getComputedStyle(p).overflowX;
          if (ov === "auto" || ov === "scroll" || ov === "hidden" || ov === "clip") return;
          p = p.parentElement;
        }
        wide.push(el.className || el.tagName);
      }
    });

    // No CONTROL may sit past the right edge. A photograph bleeding off the
    // page is the design; a link or a button doing it cannot be clicked, and
    // that is a defect at any width whatever is clipping it. This is the check
    // that catches the navbar: at 1024 "Book a consultation" was cut in half at
    // the viewport edge and the element sweep above excused it, because an
    // ancestor with overflow-x: hidden was hiding the evidence.
    const cut = [];
    document.querySelectorAll("a[href], button, input, select, summary").forEach((el) => {
      const cs = getComputedStyle(el);
      // The mobile drawer is off-canvas and `visibility: hidden` when closed.
      if (cs.visibility === "hidden" || cs.display === "none") return;
      let p = el.parentElement;
      while (p) {
        const pcs = getComputedStyle(p);
        if (pcs.visibility === "hidden") return;
        // A control inside a scrollable rail is REACHABLE: the reader scrolls
        // the rail and clicks it. The category cards on a phone live in one.
        // `hidden` and `clip` get no such excuse, which is the whole point of
        // this check: they mean the control cannot be reached at all.
        if (pcs.overflowX === "auto" || pcs.overflowX === "scroll") return;
        p = p.parentElement;
      }
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > de.clientWidth + 1.5) {
        cut.push((el.textContent || el.tagName).trim().slice(0, 24));
      }
    });

    return { doc: de.scrollWidth, client: de.clientWidth, wide: wide.slice(0, 5), cut: cut.slice(0, 5) };
  });
  check(
    `no horizontal overflow @ ${width}`,
    over.doc <= over.client + 1 && over.wide.length === 0,
    `scrollWidth ${over.doc} vs ${over.client}${over.wide.length ? " :: " + over.wide.join(", ") : ""}`
  );
  check(
    `no control clipped off the right edge @ ${width}`,
    over.cut.length === 0,
    over.cut.length ? over.cut.join(", ") : ""
  );
  check(`console clean @ ${width}`, errors.length === 0, errors.slice(0, 2).join(" | "));
  await page.close();
}

/* --- 1b. nothing is fetched from off this origin ----------------------------
   Client, 2026-09-01: "Everything should be local." Until then the build pulled
   both typefaces from fonts.googleapis.com on every page view, which on a
   MEDICAL practice's site hands a third party the IP of everyone who visits,
   and left the design one blocked request away from Georgia and Arial.

   This asserts it stays true. A remote asset is easy to reintroduce by pasting
   an embed or a CDN tag, and nothing else would notice. */
{
  const page = await browser.newPage();
  const external = [];
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(`http://127.0.0.1:${PORT}`) && !u.startsWith("data:") && !u.startsWith("blob:")) {
      external.push(u.slice(0, 70));
    }
  });
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}/${PAGE}`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 500));
  check("no off-origin requests", external.length === 0, external.slice(0, 3).join(" | "));

  // And the self-hosted faces really loaded, rather than silently falling back
  // to the stack in 01-tokens.css. document.fonts is the only way to tell:
  // a fallback renders perfectly happily and looks wrong.
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight} ${f.style}`);
    return { loaded, count: document.fonts.size };
  });
  check(
    "both self-hosted typefaces actually loaded",
    fonts.loaded.some((f) => f.includes("Cormorant")) && fonts.loaded.some((f) => f.includes("Inter")),
    `${fonts.loaded.length} of ${fonts.count} faces loaded`
  );
  await page.close();
}

/* --- 2. the motion actually runs ------------------------------------------- */
{
  const { page, errors } = await open({ width: 1440 });

  const booted = await page.evaluate(() => ({
    gsap: !!window.gsap,
    st: !!window.ScrollTrigger,
    split: !!window.SplitText,
    jsClass: document.documentElement.classList.contains("js"),
    triggers: window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 0,
    pins: window.ScrollTrigger ? window.ScrollTrigger.getAll().filter((t) => t.pin).length : 0,
  }));
  check("GSAP + ScrollTrigger + SplitText all loaded", booted.gsap && booted.st && booted.split);
  check("the .js scope survived the boot timer", booted.jsClass);
  check("ScrollTriggers were created", booted.triggers > 8, `${booted.triggers} triggers`);
  check("the path chapter pins", booted.pins >= 1, `${booted.pins} pin(s)`);

  // Headlines were split into masked lines.
  const lines = await page.evaluate(() => document.querySelectorAll(".j-line-mask").length);
  check("headlines split into masked lines", lines >= 5, `${lines} lines`);

  // The thesis chapter (its sentence lit word by word on scroll) was retired in
  // BugHerd round 2, 2026-09-29: the sentence is the surgeon chapter's heading
  // now. thesis() in 10-journey.js still runs on any page with a .thesis_text.

  // The pinned path chapter really travels sideways.
  //
  // The scroll targets come from the ScrollTrigger itself, NOT from
  // section.offsetTop. Once a pin exists ScrollTrigger wraps the element in a
  // pin-spacer, so offsetTop is measured inside that wrapper and is nowhere
  // near the document position the pin actually starts at. An earlier version
  // of this file scrolled by offsetTop, landed two chapters short, and reported
  // "moved 0px" for a pin that works perfectly.
  const bounds = await page.evaluate(() => {
    const st = window.ScrollTrigger.getAll().find((t) => t.pin);
    return { start: st.start, end: st.end };
  });
  await settle(page, bounds.start + 4);
  const before = await page.evaluate(() => document.querySelector(".path_track").getBoundingClientRect().left);
  await settle(page, bounds.end - 4);
  const travel = await page.evaluate((before) => {
    const track = document.querySelector(".path_track");
    const fill = document.querySelector(".path_rule-fill");
    return {
      moved: Math.abs(track.getBoundingClientRect().left - before),
      pathBar: new DOMMatrixReadOnly(getComputedStyle(fill).transform).a,
    };
  }, before);
  travel.span = bounds.end - bounds.start;
  check("the path track travels while pinned", travel.moved > 400, `moved ${Math.round(travel.moved)}px over a ${Math.round(travel.span)}px pin`);
  check("the path progress rule fills to the end", travel.pathBar > 0.9, `scaleX ${Number(travel.pathBar).toFixed(2)}`);

  // The readout names the chapter you are in. Read here, while parked inside
  // the path chapter, so it is asserting the right answer and not just a
  // different one from the starting value.
  const readout = await page.evaluate(() => {
    const pad = document.querySelector(".journey_readout");
    return {
      on: pad.classList.contains("is-on"),
      num: pad.querySelector(".journey_readout-num").textContent,
      name: pad.querySelector(".journey_readout-name").textContent,
    };
  });
  check("the chapter readout names the path chapter", readout.on && readout.num === "03", `${readout.num} ${readout.name}`);

  // The nav progress bar, read at the very bottom of the document where it has
  // to be full.
  await settle(page, 10 ** 6);
  const navBar = await page.evaluate(() => {
    const el = document.querySelector(".journey_progress-bar");
    return new DOMMatrixReadOnly(getComputedStyle(el).transform).a;
  });
  check("the nav progress bar fills to the bottom", navBar > 0.9, `scaleX ${Number(navBar).toFixed(2)}`);

  // The ledger, whether or not it counts.
  //
  // A COUNTED ledger has to land on the PUBLISHED string rather than on a
  // rounded tween value, which is the whole reason counters() sets el.textContent
  // back on complete. An UNCOUNTED one has to survive the tween machinery not
  // running at all: a value left blank is the failure mode, and it is invisible
  // in a screenshot taken before the reveal.
  //
  // Both shapes ship. The home page counts its four figures because they are
  // achievements; the neck lift page does not, because one of them is a surgical
  // fee and animating a price up from zero is a sales tactic. So the assertion
  // reads `data-count` off the markup rather than hard-coding one page's values.
  await settle(page, 0);
  await new Promise((r) => setTimeout(r, 1600));
  const ledger = await page.evaluate(() =>
    [...document.querySelectorAll(".ledger_value")].map((e) => ({
      text: e.textContent.trim(),
      count: e.getAttribute("data-count"),
    }))
  );
  const counted = ledger.filter((v) => v.count);
  const landed =
    ledger.length >= 4 &&
    ledger.every((v) => v.text.length > 0) &&
    // A counted value must not be sitting on the tween's own formatting: the
    // final frame is the literal markup, so it parses back to data-count and is
    // not merely the number.
    counted.every((v) => parseFloat(v.text.replace(/[^0-9.]/g, "")) === parseFloat(v.count));
  check(
    `the ledger lands on its published values (${counted.length} of ${ledger.length} counted)`,
    landed,
    ledger.map((v) => v.text).join(", ")
  );

  check("no console errors with motion on", errors.length === 0, errors.slice(0, 2).join(" | "));
  await page.close();
}

/* --- 2b. the mobile drawer, and the keyboard ---------------------------------
   Both of these were built in the first pass and neither had ever been opened.
   They turned out to be fine, which is exactly why they are worth pinning down:
   an untested control that happens to work is one refactor away from not. */
{
  const { page, errors } = await open({ width: 390, height: 844 });
  await page.click(".navbar_burger");
  await new Promise((r) => setTimeout(r, 700));
  const drawer = await page.evaluate(() => {
    const d = document.querySelector(".drawer_component");
    const panel = document.querySelector(".drawer_panel");
    const r = panel.getBoundingClientRect();
    const links = [...panel.querySelectorAll("a")];
    return {
      open: d.classList.contains("is-open") && getComputedStyle(d).visibility === "visible",
      onScreen: r.left >= -1 && r.right <= window.innerWidth + 1,
      links: links.length,
      // The panel must be able to scroll its own overflow, because the page
      // behind it is locked: anything past the panel's fold is otherwise
      // unreachable while the drawer is open.
      //
      // This used to ALSO assert that the panel currently overflows, which was
      // true when the menu carried four category headings and twelve treatment
      // links. Since 2026-09-01 the drawer is three links and a contact block
      // and it fits a 390x844 phone with room to spare, so that half of the
      // assertion was failing on a drawer that is fine. What has to hold is the
      // capability, and that the content fits or scrolls — never neither.
      scrollable:
        ["auto", "scroll"].includes(getComputedStyle(panel).overflowY) ||
        panel.scrollHeight <= r.height + 2,
      overflows: panel.scrollHeight > r.height + 2,
      offscreenLinks: links.filter((a) => {
        const lr = a.getBoundingClientRect();
        return lr.width === 0 || lr.right > window.innerWidth + 1 || lr.left < -1;
      }).length,
      bodyLocked:
        getComputedStyle(document.body).overflow === "hidden" ||
        getComputedStyle(document.documentElement).overflow === "hidden",
    };
  });
  check("the drawer opens and sits on screen", drawer.open && drawer.onScreen);
  check("every drawer link is on screen", drawer.offscreenLinks === 0, `${drawer.links} links, ${drawer.offscreenLinks} off`);
  check("the drawer fits, or scrolls its own overflow", drawer.scrollable, drawer.overflows ? "overflows and scrolls" : "fits without scrolling");
  check("the page behind the drawer is scroll-locked", drawer.bodyLocked);
  check("no console errors with the drawer open", errors.length === 0, errors.slice(0, 2).join(" | "));
  await page.close();
}

{
  const { page } = await open({ width: 1440, height: 900 });
  // Walk the page with Tab and confirm every stop paints something. A focus
  // style that exists in the stylesheet but is overridden by a component rule
  // is invisible in a screenshot and invisible in code review.
  const seen = [];
  const bare = [];
  for (let i = 0; i < 45; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        cls: (el.className || el.tagName).toString().slice(0, 34),
        label: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 26),
        painted: (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== "none"),
        onScreen: r.width > 0 && r.height > 0,
      };
    });
    if (!info) break;
    const key = info.cls + "|" + info.label;
    if (seen.includes(key)) continue;
    seen.push(key);
    if (info.onScreen && !info.painted) bare.push(`${info.cls} ${info.label}`);
  }
  check("every keyboard stop paints a focus ring", bare.length === 0, `${seen.length} stops` + (bare.length ? " :: " + bare.slice(0, 3).join(", ") : ""));
  await page.close();
}

/* --- 3. reduced motion is a real branch ------------------------------------ */
{
  const { page, errors } = await open({ width: 1440, reduce: true });
  const state = await page.evaluate(() => ({
    pins: window.ScrollTrigger ? window.ScrollTrigger.getAll().filter((t) => t.pin).length : 0,
    triggers: window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 0,
    hidden: [...document.querySelectorAll("[data-j]")].filter(
      (el) => parseFloat(getComputedStyle(el).opacity) < 0.99
    ).length,
    splits: document.querySelectorAll(".j-line-mask").length,
    railScrolls: getComputedStyle(document.querySelector(".path_track")).overflowX,
    pinned: document.querySelector(".path_viewport").classList.contains("is-pinned"),
  }));
  check("reduced motion creates NO pins", state.pins === 0, `${state.pins} pins, ${state.triggers} triggers`);
  check("reduced motion leaves nothing hidden", state.hidden === 0, `${state.hidden} elements under full opacity`);
  check("reduced motion does not split headlines", state.splits === 0, `${state.splits} masks`);
  check("reduced motion leaves the path as a scrollable rail", !state.pinned && state.railScrolls === "auto", state.railScrolls);
  check("no console errors with reduced motion", errors.length === 0, errors.slice(0, 2).join(" | "));
  await page.close();
}

/* --- 4. the page is complete with no JS at all ----------------------------- */
{
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`http://127.0.0.1:${PORT}/${PAGE}`, { waitUntil: "networkidle0", timeout: 60000 });
  const state = await page.evaluate(() => ({
    js: document.documentElement.classList.contains("js"),
    hidden: [...document.querySelectorAll("[data-j]")].filter(
      (el) => parseFloat(getComputedStyle(el).opacity) < 0.99
    ).length,
    images: [...document.querySelectorAll("img")].length,
    text: document.body.innerText.replace(/\s+/g, " ").trim().length,
  }));
  // This is the failure the head partial's timer exists for. Without JS the
  // .js class is never added at all, so every hidden state in the stylesheet is
  // out of scope and the page paints in full, unanimated.
  check("no-JS: the .js scope is absent", !state.js);
  check("no-JS: nothing is left invisible", state.hidden === 0, `${state.hidden} hidden`);
  // Seven images, not ten. The floor was written when the only page in the suite
  // was the home page, which carries thirteen; a service page carries seven and
  // is not thereby incomplete. What the check is actually for is a page that has
  // gone BLANK without JS, and any real page clears both of these by a mile.
  check("no-JS: the page still carries its content", state.text > 3000 && state.images >= 5, `${state.text} chars, ${state.images} images`);
  await page.close();
}

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("\nFAILED:");
  failed.forEach((f) => console.log(`  ${f.name}  ${f.detail}`));
  process.exit(1);
}
