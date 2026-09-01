/**
 * Measures the home page against the viewport, at several screen sizes.
 *
 * Answers three questions the screenshots cannot, and that the client asked
 * directly on 2026-09-01:
 *
 *   1. WHICH sections are taller than the screen, and by how much. "Some
 *      sections are too tall" needs a list, not an impression.
 *   2. Does every reveal actually fire? A `data-j` element that never gets
 *      `.is-in` is content stuck at opacity 0, which is the worst failure this
 *      design can have and is invisible in a reduced-motion screenshot.
 *   3. What the real content width and section rhythm resolve to, so they can
 *      be compared against the Dr. Nahlah build's proportions.
 *
 * Usage:  node measure.mjs [../final-site] [index.html]
 */
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, process.argv[2] || "../final-site");
const PAGE = process.argv[3] || "index.html";
const PORT = 8813;

const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png", ".avif": "image/avif", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(PORT, r));

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});

/* 1440x800 is the laptop that matters most: a 16:10 13-inch with browser chrome
   leaves about 800px of page, and that is where "too tall for the screen"
   actually bites. 1920x1080 and 390x844 bracket it. */
const SIZES = [
  { w: 1920, h: 1080, label: "1920x1080 desktop" },
  { w: 1440, h: 800, label: "1440x800  laptop" },
  { w: 1024, h: 768, label: "1024x768  small laptop" },
  { w: 390, h: 844, label: "390x844   phone" },
];

for (const { w, h, label } of SIZES) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });
  await page.goto(`http://127.0.0.1:${PORT}/${PAGE}`, { waitUntil: "networkidle0", timeout: 60000 });
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  await new Promise((r) => setTimeout(r, 700));

  const out = await page.evaluate(async (vh) => {
    // Walk the whole page so every reveal has had its chance to fire, then come
    // back. Anything still without .is-in never fired at all.
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += Math.round(vh * 0.6)) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, max);
    await new Promise((r) => setTimeout(r, 900));

    const tall = [];
    document.querySelectorAll("[data-chapter], .ledger_component").forEach((el) => {
      const rect = el.getBoundingClientRect();
      const name = el.getAttribute("data-chapter-name") || el.className.split(" ")[0];
      tall.push({ name, h: Math.round(rect.height), screens: +(rect.height / vh).toFixed(2) });
    });

    // The pinned chapter's own frame has to fit the screen even though the
    // chapter consumes several screens of scroll. Same for anything sticky.
    const comps = [];
    [
      [".path_panel", "path panel (visible while pinned)"],
      [".path_viewport", "path viewport (the pinned frame)"],
      [".ways_media", "category frame"],
      [".surgeon_media", "surgeon portrait"],
      [".ask_media", "questions photo (sticky)"],
      [".arrival_component", "hero"],
      [".rail_card", "review card"],
    ].forEach(([sel, name]) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const h = Math.round(el.getBoundingClientRect().height);
      comps.push({ name, h, screens: +(h / vh).toFixed(2) });
    });

    const notIn = [];
    document.querySelectorAll("[data-j]").forEach((el) => {
      if (!el.classList.contains("is-in")) {
        notIn.push((el.className || el.tagName).slice(0, 44));
      }
    });

    // What the layout actually resolves to, for comparison with Nahlah.
    const cs = getComputedStyle(document.documentElement);
    const probe = document.querySelector(".ways_head");
    const probeRect = probe ? probe.getBoundingClientRect() : null;

    return {
      tall,
      comps,
      notIn,
      docHeight: max,
      screensTotal: +(max / vh).toFixed(1),
      root: cs.fontSize,
      gutter: cs.getPropertyValue("--gutter").trim(),
      contentWidth: probeRect ? Math.round(probeRect.width) : null,
    };
  }, h);

  console.log(`\n=== ${label} ===`);
  console.log(`root ${out.root} · gutter ${out.gutter} · content ${out.contentWidth}px · page ${out.screensTotal} screens`);
  const over = out.tall.filter((t) => t.screens > 1.0);
  if (over.length) {
    console.log("taller than the screen:");
    over.forEach((t) => console.log(`   ${String(t.screens).padStart(5)} screens  ${String(t.h).padStart(5)}px  ${t.name}`));
  } else {
    console.log("no chapter exceeds one screen");
  }
  const bigComps = out.comps.filter((c) => c.screens > 0.78);
  if (bigComps.length) {
    console.log("components taking most of the screen or more:");
    bigComps.forEach((c) => console.log(`   ${String(c.screens).padStart(5)} screens  ${String(c.h).padStart(5)}px  ${c.name}`));
  }
  if (out.notIn.length) {
    console.log(`REVEALS THAT NEVER FIRED (${out.notIn.length}): ${out.notIn.join(" | ")}`);
  } else {
    console.log("every reveal fired");
  }
  await page.close();
}

await browser.close();
server.close();
