// Browse the rebuilt site locally, exactly as a static host would serve it.
//
//   node serve.mjs [--port 4300]
//
// Directory routes resolve to index.html and anything unmatched falls through to
// 404.html, which is how Instatic (and every other static host) behaves - so what
// you see here is what goes live.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(HERE, "dist");
const argv = process.argv.slice(2);
const PORT = argv.includes("--port") ? Number(argv[argv.indexOf("--port") + 1]) : 4300;

if (!fs.existsSync(DIST)) {
  console.error("dist/ does not exist yet - run `node build.mjs` first.");
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".gif": "image/gif",
  ".ico": "image/x-icon", ".xml": "application/xml", ".txt": "text/plain",
};

const resolve = (urlPath) => {
  const p = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (p.includes("..")) return null;                       // no escaping dist/
  const direct = path.join(DIST, p);
  if (fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct;
  const index = path.join(DIST, p, "index.html");
  if (fs.existsSync(index)) return index;
  return null;
};

http.createServer((req, res) => {
  const file = resolve(req.url);
  if (!file) {
    const notFound = path.join(DIST, "404.html");
    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    return fs.existsSync(notFound) ? fs.createReadStream(notFound).pipe(res) : res.end("Not found");
  }
  res.writeHead(200, {
    "content-type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream",
    "cache-control": "no-store",
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  const pages = fs.readdirSync(DIST, { recursive: true }).filter((f) => String(f).endsWith("index.html")).length;
  console.log(`Mason Park Dental - static rebuild, ${pages} pages`);
  console.log(`  http://localhost:${PORT}/`);
  console.log("  Ctrl-C to stop.");
});
