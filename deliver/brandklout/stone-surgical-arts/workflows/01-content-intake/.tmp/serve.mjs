// Serves a folder over http on 8791.
//
// Two uses: reading the archived screenshots in the browser (the extension
// refuses file:// URLs), and previewing the Surgical Arts build while it is
// being written. Root defaults to this workflow's screenshot folder; pass a
// path to serve something else.
//
// Usage: node serve.mjs [root] [port]
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.argv[2] || path.join(HERE, "wayback-screenshots"));
const PORT = Number(process.argv[3] || 8791);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

http
  .createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split("?")[0]);
    if (rel === "/") rel = "/index.html";
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end("no");
      return;
    }
    // Extensionless request -> try .html, the way a static host would.
    const target = fs.existsSync(file)
      ? file
      : fs.existsSync(file + ".html")
        ? file + ".html"
        : null;
    if (!target || fs.statSync(target).isDirectory()) {
      res.writeHead(404, { "content-type": "text/plain" }).end("404 " + rel);
      return;
    }
    res.writeHead(200, {
      "content-type": TYPES[path.extname(target).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    });
    fs.createReadStream(target).pipe(res);
  })
  .listen(PORT, () => console.log(`serving ${ROOT} on http://localhost:${PORT}`));
