/**
 * Serve the rebuilt landing pages exactly as Instatic will assemble them:
 * one site-wide stylesheet, the page body inside it, assets under /assets.
 *
 *   node preview.mjs [--port 4320]
 *
 * The live site's own stylesheet is served alongside lp.css, in the same order
 * Instatic emits it, because the question that matters is not "does the
 * landing page look right on its own" but "does it still look right with the
 * main site's 146 competing class rules loaded underneath it".
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "out");
const ASSETS = path.join(HERE, "capture", "assets");
const SITE_CSS = path.join(HERE, "capture", "css", "instatic-user.css");

const argv = process.argv.slice(2);
const PORT = argv.includes("--port") ? Number(argv[argv.indexOf("--port") + 1]) : 4320;

const MIME = {
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml",
  ".gif": "image/gif", ".pdf": "application/pdf",
};

const pages = new Map();
for (const f of fs.readdirSync(path.join(OUT, "pages"))) {
  const p = JSON.parse(fs.readFileSync(path.join(OUT, "pages", f), "utf8"));
  pages.set(`/${p.slug}`, p);
}

/** The head Instatic publishes, plus our two stylesheets in cascade order. */
const document_ = (p) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${p.title}</title>
${p.description ? `<meta name="description" content="${p.description.replace(/"/g, "&quot;")}">` : ""}
<meta name="robots" content="${p.robots}">
<link rel="stylesheet" href="/site.css">
<link rel="stylesheet" href="/lp.css">
</head>
<body>
${p.html}
</body>
</html>`;

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]).replace(/\/+$/, "") || "/";

  if (url === "/lp.css" || url === "/site.css") {
    const file = url === "/lp.css" ? path.join(OUT, "lp.css") : SITE_CSS;
    res.writeHead(200, { "content-type": MIME[".css"] });
    return res.end(fs.readFileSync(file));
  }
  if (url.startsWith("/assets/")) {
    const file = path.join(ASSETS, url.slice("/assets/".length));
    if (!file.startsWith(ASSETS) || !fs.existsSync(file)) { res.writeHead(404); return res.end("no"); }
    res.writeHead(200, { "content-type": MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream" });
    return res.end(fs.readFileSync(file));
  }
  if (url === "/") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(`<h1>Landing pages</h1><ul>${[...pages.keys()]
      .map((u) => `<li><a href="${u}">${u}</a></li>`).join("")}</ul>`);
  }
  const p = pages.get(url);
  if (!p) { res.writeHead(404, { "content-type": "text/html" }); return res.end("<h1>404</h1>"); }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(document_(p));
}).listen(PORT, () => {
  console.log(`preview on http://localhost:${PORT}`);
  for (const u of pages.keys()) console.log(`   http://localhost:${PORT}${u}`);
});
