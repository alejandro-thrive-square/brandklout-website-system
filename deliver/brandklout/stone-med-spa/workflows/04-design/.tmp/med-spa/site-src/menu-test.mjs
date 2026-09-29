// Functional test of /treatments: the concern filter narrows the generated rows
// and the count reads correctly; clicking the active pill clears it; a row
// opens onto its portrait; every home-page anchor (#slug) resolves to a row.
// Usage: node menu-test.mjs
import puppeteer from "puppeteer-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../final-site");
const MIME = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".woff2": "font/woff2" };
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  const f = path.join(ROOT, p === "/" ? "/index.html" : p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(f).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(0, r));
const PORT = srv.address().port;
const browser = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
const pg = await browser.newPage();
await pg.setViewport({ width: 1440, height: 900 });
await pg.goto(`http://127.0.0.1:${PORT}/treatments.html`, { waitUntil: "networkidle0" });
let pass = 0, fail = 0;
const t = (name, ok, detail = "") => { ok ? pass++ : fail++; console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? "  " + detail : ""}`); };

const visible = () => pg.evaluate(() => [...document.querySelectorAll("[data-treatment]")].filter((r) => !r.hidden).map((r) => r.id));
t("twelve rows rendered", (await visible()).length === 12);
t("twelve anchors", (await pg.evaluate(() => ["botox","dysport-jeuveau","dermal-fillers","sculptra","morpheus8","chemical-peels","skinpen","prp","hair-restoration","hydrafacial","dermaplaning","skin-boosters"].every((id) => document.getElementById(id)))));

await pg.click('[data-concern="hair"]');
await new Promise((r) => setTimeout(r, 200));
let v = await visible();
t("hair thinning -> 2 rows", v.length === 2 && v.includes("prp") && v.includes("hair-restoration"), v.join(","));
t("count text", (await pg.$eval("[data-ledger-count]", (e) => e.textContent)).includes("2 treatments address hair thinning"));
t("empty groups hidden", (await pg.evaluate(() => [...document.querySelectorAll("[data-group]")].filter((g) => g.hidden).length)) === 3);
t("pill active", (await pg.$eval('[data-concern="hair"]', (b) => b.getAttribute("data-active"))) === "true");
t("pill lands on the menu", (await pg.evaluate(() => location.hash)) === "#menu");
await pg.screenshot({ path: "../shots/_menu-filtered.png" });

await pg.click('[data-concern="hair"]');
await new Promise((r) => setTimeout(r, 200));
t("click again clears", (await visible()).length === 12);

await pg.click("#botox summary");
await new Promise((r) => setTimeout(r, 1400));
const open = await pg.evaluate(() => {
  const d = document.getElementById("botox");
  const img = d.querySelector(".row_figure img");
  const r = img.getBoundingClientRect();
  return { open: d.open, w: Math.round(r.width), h: Math.round(r.height), opacity: getComputedStyle(img).opacity };
});
t("row opens onto its portrait", open.open && open.w > 200 && open.opacity === "1", JSON.stringify(open));
await pg.evaluate(() => document.getElementById("botox").scrollIntoView());
await new Promise((r) => setTimeout(r, 600));
await pg.screenshot({ path: "../shots/_menu-open.png" });

// the home page links land on a row that is scrolled under the fixed navbar? scroll-margin-top handles it
await pg.goto(`http://127.0.0.1:${PORT}/treatments.html#morpheus8`, { waitUntil: "networkidle0" });
await new Promise((r) => setTimeout(r, 800));
const top = await pg.evaluate(() => document.getElementById("morpheus8").getBoundingClientRect().top);
t("anchor lands below the navbar", top >= 80 && top < 200, `top=${Math.round(top)}`);

console.log(`\n${pass} passed, ${fail} failed`);
await browser.close();
srv.close();
process.exit(fail ? 1 : 0);
