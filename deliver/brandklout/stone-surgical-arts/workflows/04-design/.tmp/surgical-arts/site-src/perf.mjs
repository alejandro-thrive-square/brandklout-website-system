/**
 * Measures how the home page behaves WHILE SCROLLING.
 *
 * Everything else in this build checks what the page looks like when it is
 * standing still. This chapter design is doing real work on every frame: a pin,
 * five scrubbed timelines, four parallax tweens, a fixed-attachment marble band
 * and a backdrop-filter, and none of that shows up in a screenshot or in an
 * assertion about layout. A page that is beautiful and janky is not responsive.
 *
 * Method: drive the scroll in real time with CDP's Input.synthesizeScrollGesture
 * so the compositor does the same work it would for a person, and read the
 * frame timeline back out of the renderer.
 *
 * Reported per pass:
 *   frames        how many animation frames were served
 *   long frames   frames that took longer than 32ms, i.e. dropped below 30fps
 *   worst         the longest single frame
 *   long tasks    main-thread blocks over 50ms, from PerformanceObserver
 *
 * Usage:  node perf.mjs [../final-site] [index.html]
 */
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, process.argv[2] || "../final-site");
const PAGE = process.argv[3] || "index.html";
const PORT = 8817;

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
  args: ["--no-sandbox", "--hide-scrollbars", "--enable-gpu-rasterization"],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
const client = await page.createCDPSession();

/* A 4x CPU slowdown is roughly a mid-range laptop or a good phone. Measuring on
   an unthrottled desktop tells you nothing: everything is smooth there, which
   is exactly why janky sites ship. */
await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

await page.goto(`http://127.0.0.1:${PORT}/${PAGE}`, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, 1200));

await page.evaluate(() => {
  window.__frames = [];
  window.__long = [];
  let last = performance.now();
  const tick = (now) => {
    window.__frames.push(now - last);
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  try {
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__long.push(Math.round(e.duration));
    }).observe({ entryTypes: ["longtask"] });
  } catch (e) {
    /* longtask is not implemented everywhere; the frame timings still stand */
  }
});

/* Three passes over the parts of the page that do the most work. */
const zones = await page.evaluate(() => {
  const at = (sel) => {
    const el = document.querySelector(sel);
    return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : 0;
  };
  return {
    top: 0,
    ways: at(".ways_component"),
    path: at(".path_component"),
    standard: at(".standard_component"),
    end: document.documentElement.scrollHeight - window.innerHeight,
  };
});

async function pass(name, from, to) {
  await page.evaluate((y) => window.scrollTo(0, y), from);
  await new Promise((r) => setTimeout(r, 900));
  await page.evaluate(() => {
    window.__frames.length = 0;
    window.__long.length = 0;
  });

  const distance = to - from;
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    await client.send("Input.synthesizeScrollGesture", {
      x: 720,
      y: 450,
      yDistance: -Math.round(distance / steps),
      speed: 1400,
      gestureSourceType: "mouse",
    });
  }
  await new Promise((r) => setTimeout(r, 400));

  const out = await page.evaluate(() => {
    const f = window.__frames.filter((d) => d > 0 && d < 2000);
    f.sort((a, b) => a - b);
    return {
      frames: f.length,
      long: f.filter((d) => d > 32).length,
      veryLong: f.filter((d) => d > 60).length,
      median: f.length ? Math.round(f[Math.floor(f.length / 2)]) : 0,
      p95: f.length ? Math.round(f[Math.floor(f.length * 0.95)]) : 0,
      worst: f.length ? Math.round(f[f.length - 1]) : 0,
      longTasks: window.__long.length,
      worstTask: window.__long.length ? Math.max(...window.__long) : 0,
    };
  });

  const pct = out.frames ? Math.round((out.long / out.frames) * 100) : 0;
  console.log(
    `${name.padEnd(24)} ${String(out.frames).padStart(4)} frames · ` +
      `${String(out.long).padStart(3)} over 32ms (${String(pct).padStart(2)}%) · ` +
      `${String(out.veryLong).padStart(2)} over 60ms · ` +
      `median ${String(out.median).padStart(3)}ms · p95 ${String(out.p95).padStart(3)}ms · worst ${String(out.worst).padStart(4)}ms · ` +
      `${out.longTasks} long tasks (worst ${out.worstTask}ms)`
  );
  return out;
}

console.log("Scrolling at 4x CPU throttle, 1440x900\n");
const results = [];
results.push(await pass("hero into ways", zones.top, zones.ways));
results.push(await pass("through the pin", zones.path - 900, zones.path + 1600));
results.push(await pass("the marble band", zones.standard - 600, zones.standard + 1200));
results.push(await pass("proof to the end", zones.standard + 1200, zones.end));

const worstPct = Math.max(
  ...results.map((r) => (r.frames ? (r.long / r.frames) * 100 : 0))
);
console.log(`\nworst pass drops ${Math.round(worstPct)}% of frames below 30fps`);

await browser.close();
server.close();
