/**
 * Measures what the page COSTS to load, and how much of that is wasted.
 *
 * perf.mjs measures the page once it is running. This measures getting it
 * there, and the one thing it is really looking for is over-delivery: an image
 * decoded at 1600px wide and painted into a 390px slot has cost the visitor
 * about sixteen times the pixels they can see. Nothing in this build has ever
 * checked that, and none of the markup carries a `sizes` or `srcset`.
 *
 * Reported:
 *   - transferred bytes by type, and the total
 *   - Largest Contentful Paint, which on this page is the hero photograph
 *   - per image: intrinsic pixels vs painted CSS pixels at this viewport,
 *     and the waste ratio at DPR 1 and DPR 2
 *
 * Usage:  node weight.mjs [../final-site] [index.html] [width]
 */
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, process.argv[2] || "../final-site");
const PAGE = process.argv[3] || "index.html";
const PORT = 8818;

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

for (const [w, h, label] of [
  [390, 844, "390  phone"],
  [1440, 900, "1440 laptop"],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h });

  const bytes = {};
  page.on("response", async (r) => {
    const type = (r.headers()["content-type"] || "other").split("/")[0].split(";")[0];
    try {
      const buf = await r.buffer();
      bytes[type] = (bytes[type] || 0) + buf.length;
    } catch (e) {
      /* redirects and aborted requests have no body */
    }
  });

  await page.goto(`http://127.0.0.1:${PORT}/${PAGE}`, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 700));

  const lcp = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let v = 0;
        try {
          new PerformanceObserver((l) => {
            for (const e of l.getEntries()) v = Math.round(e.startTime);
          }).observe({ type: "largest-contentful-paint", buffered: true });
        } catch (e) {
          /* not supported */
        }
        setTimeout(() => resolve(v), 400);
      })
  );

  // Walk the page so lazy images actually load, then measure every one.
  const imgs = await page.evaluate(async () => {
    const max = document.documentElement.scrollHeight;
    for (let y = 0; y < max; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(r));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 1200));

    return [...document.querySelectorAll("img")]
      .map((im) => {
        const r = im.getBoundingClientRect();
        const painted = Math.round(r.width);
        const natural = im.naturalWidth;
        return {
          file: (im.currentSrc || im.src).split("/").pop().split("?")[0],
          natural,
          painted,
          // At DPR 2 a 390px slot genuinely wants 780px of image, so the honest
          // waste ratio is against painted * 2, not against painted.
          waste2x: painted > 0 ? +(natural / (painted * 2)).toFixed(2) : 0,
          hasSrcset: !!im.getAttribute("srcset"),
        };
      })
      .filter((i) => i.painted > 0)
      .sort((a, b) => b.waste2x - a.waste2x);
  });

  const total = Object.values(bytes).reduce((a, b) => a + b, 0);
  console.log(`\n=== ${label} ===`);
  console.log(
    Object.entries(bytes)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ${(v / 1024).toFixed(0)}KB`)
      .join(" · ") + `  ||  TOTAL ${(total / 1024).toFixed(0)}KB`
  );
  console.log(`LCP ${lcp}ms · ${imgs.length} images · ${imgs.filter((i) => i.hasSrcset).length} with srcset`);
  const bad = imgs.filter((i) => i.waste2x > 1.35);
  if (bad.length) {
    console.log(`over-delivered even allowing for a 2x screen (${bad.length}):`);
    bad.slice(0, 8).forEach((i) =>
      console.log(`   ${String(i.waste2x).padStart(5)}x  ${String(i.natural).padStart(4)}px natural -> ${String(i.painted).padStart(4)}px painted  ${i.file}`)
    );
  } else {
    console.log("no image is over-delivered at 2x");
  }
  await page.close();
}

await browser.close();
server.close();
