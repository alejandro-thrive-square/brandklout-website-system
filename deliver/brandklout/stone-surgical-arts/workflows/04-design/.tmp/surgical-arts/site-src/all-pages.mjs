/**
 * Regression check across ALL EIGHTEEN pages.
 *
 * WHY THIS EXISTS. The home rebuild changed four SHARED files:
 *
 *   20-navbar.css   two new breakpoints for the 992-to-1150 squeeze
 *   30-hero.css     the inner-page hero's stone texture, whose path was broken
 *   38-cta.css      the closing band's stone texture, same bug
 *   partials/head.html   the Google Fonts link replaced by self-hosted faces
 *
 * Every one of those lands on the seventeen pages nobody has looked at since,
 * and `journey-test.mjs` only ever opens index.html. A shared stylesheet is
 * exactly where a fix for one page quietly breaks another, so this asserts the
 * same three things on every page at three widths:
 *
 *   - the document does not scroll sideways
 *   - no visible CONTROL sits past the right edge (the navbar bug)
 *   - the console is clean, and the self-hosted typefaces actually loaded
 *
 * Usage:  node all-pages.mjs [../final-site]
 */
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findMarkers, hostAllowed } from "../../../../21-instatic-upload/embed-markers.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, process.argv[2] || "../final-site");
const PORT = 8819;
const WIDTHS = [390, 1024, 1440];

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

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).sort();
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--no-sandbox", "--hide-scrollbars"],
});

const failures = [];
let checks = 0;

/* The hosts a page is ALLOWED to reach, read from the page itself: the vendor
   snippet inside an embed marker ([data-embed]), plus the marker's own
   `data-embed-hosts`, and nothing else. Reading them per page rather than
   keeping a list here means the gate stays exactly as strict as the markup
   is, and a vendor host that appears anywhere outside a marker still fails.
   `data-embed-hosts` exists for a vendor that renders IN the page rather than
   in a frame (Elfsight, 2026-09-30): its follow-up requests come from the main
   frame, from hosts the snippet never names, and the frame test below cannot
   excuse them. Each entry is a suffix. See css/62-embed.css and
   21-instatic-upload/place-embeds.mjs. */
function embedHosts(file) {
  const html = fs.readFileSync(path.join(ROOT, file), "utf8");
  const hosts = new Set();
  for (const m of findMarkers(html)) for (const h of m.hosts) hosts.add(h);
  return hosts;
}

for (const file of pages) {
  const row = [];
  const allowedHosts = embedHosts(file);
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    const errors = [];
    const external = [];
    /* A console message from INSIDE a vendor's frame is not this site's defect
       and not this site's to fix. The Go High Level form logs a styled line
       (`%c%d font-size:0;color:transparent NaN`) that Chrome reports as an
       error, and it failed the booking page at two widths on 2026-09-17 while
       the page itself was perfect. Same rule as the request listener below:
       judge it by where it came from, and keep everything from our own origin. */
    const ours = (url) => !url || url.startsWith(`http://127.0.0.1:${PORT}`);
    page.on("pageerror", (e) => errors.push(String(e).slice(0, 90)));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      if (!ours(m.location()?.url ?? "")) return;
      errors.push(m.text().slice(0, 90));
    });
    page.on("request", (r) => {
      // Only the PAGE's own requests. Since 2026-09-17 the booking page carries
      // a third-party iframe (the Go High Level form), and everything that
      // widget loads inside its own frame — its bundle, its fonts, its API —
      // arrives on this listener too. None of it is ours to control, and
      // listing the hosts would mean re-listing them whenever the vendor moves
      // one. What this gate is for is the SITE reaching off-origin, so it asks
      // the frame: the iframe's own navigation belongs to the child frame, as
      // does everything under it.
      if (r.frame() !== page.mainFrame()) return;
      const u = r.url();
      if (u.startsWith(`http://127.0.0.1:${PORT}`) || u.startsWith("data:") || u.startsWith("blob:")) return;
      // The vendor script an embed marker on THIS page asks for is expected.
      let host = "";
      try { host = new URL(u).hostname.toLowerCase(); } catch { host = ""; }
      if (hostAllowed(host, allowedHosts)) return;
      external.push(u.slice(0, 60));
    });
    await page.setViewport({ width, height: 900 });
    /* A page carrying a third-party widget NEVER reaches networkidle0: the Go
       High Level form holds connections open and polls, so the booking page
       timed out at 60s and took the whole gate down with it (2026-09-17).
       Those pages wait for the document and then sit still long enough for the
       widget to boot and settle its height, which is what the measurements
       below need; every other page keeps the stricter wait. */
    const hasEmbed = allowedHosts.size > 0;
    await page.goto(`http://127.0.0.1:${PORT}/${file}`, {
      waitUntil: hasEmbed ? "domcontentloaded" : "networkidle0",
      timeout: 60000,
    });
    /* A widget parks its frame off-screen while it boots — Go High Level uses
       `position:absolute; left:-9999px; visibility:hidden` — and a page
       measured in that state reports a horizontal overflow that is not real,
       at some widths and not others. So wait for the frame to be VISIBLE
       rather than for a fixed number of seconds, and give up after 25s so a
       vendor outage fails the page honestly rather than hanging the gate. */
    if (hasEmbed) {
      await page
        .waitForFunction(
          // SOME, not every: the vendor keeps helper frames of its own that stay
          // hidden by design, and `every` waits for them forever. A vendor that
          // renders in the page instead of a frame (Elfsight) counts as booted
          // once its own mount point has grown past a bare line of text, or,
          // for a widget whose layout is a floating badge, once its portal at
          // the end of <body> has rendered the rating (the mount then stays 0px
          // by design: found 2026-09-30, widget c92f78df is a "cardBadge").
          () =>
            [...document.querySelectorAll('[data-embed] iframe, .ep-wrapper iframe')]
              .some((f) => getComputedStyle(f).visibility === "visible" && f.getBoundingClientRect().left > -1000) ||
            [...document.querySelectorAll('[data-embed] [class^="elfsight-app-"]')]
              .some((e) => e.getBoundingClientRect().height > 40) ||
            [...document.querySelectorAll('[class*="ElfsightPortalNest"]')]
              .some((e) => e.textContent.trim().length > 0),
          { timeout: 25000, polling: 500 },
        )
        .catch((e) => errors.push(`the embedded widget never became visible: ${String(e).slice(0, 60)}`));
      await new Promise((r) => setTimeout(r, 1500));
    } else {
      await new Promise((r) => setTimeout(r, 450));
    }

    const res = await page.evaluate(() => {
      const de = document.documentElement;
      const cut = [];
      document.querySelectorAll("a[href], button, input, select, summary").forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") return;
        let p = el.parentElement;
        while (p) {
          const pcs = getComputedStyle(p);
          if (pcs.visibility === "hidden") return;
          if (pcs.overflowX === "auto" || pcs.overflowX === "scroll") return;
          p = p.parentElement;
        }
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > de.clientWidth + 1.5) cut.push((el.textContent || el.tagName).trim().slice(0, 22));
      });
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, cut: cut.slice(0, 3) };
    });

    const fonts = await page.evaluate(async () => {
      await document.fonts.ready;
      const l = [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family);
      return l.some((f) => f.includes("Cormorant")) && l.some((f) => f.includes("Inter"));
    });

    checks += 4;
    const problems = [];
    if (res.scrollW > res.clientW + 1) problems.push(`overflows ${res.scrollW}>${res.clientW}`);
    if (res.cut.length) problems.push(`clipped control: ${res.cut.join(", ")}`);
    if (errors.length) problems.push(`console: ${errors[0]}`);
    if (external.length) problems.push(`off-origin: ${external[0]}`);
    if (!fonts) problems.push("typefaces did not load");
    if (problems.length) {
      failures.push(`${file} @ ${width}  ${problems.join(" | ")}`);
      row.push(`${width}:FAIL`);
    } else {
      row.push(`${width}:ok`);
    }
    await page.close();
  }
  console.log(`${file.padEnd(30)} ${row.join("  ")}`);
}

await browser.close();
server.close();

console.log(`\n${pages.length} pages x ${WIDTHS.length} widths, ${checks} assertions`);
if (failures.length) {
  console.log(`\n${failures.length} FAILURES:`);
  failures.forEach((f) => console.log("  " + f));
  process.exit(1);
}
console.log("all pages clean");
