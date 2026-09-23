#!/usr/bin/env node
/**
 * preview.mjs — assemble the built artifacts into standalone pages and serve
 * them, so the build can be proven BEFORE anything is written to the client's
 * live site.
 *
 * What Webflow will emit for each page is, in order: the head freeform block
 * inside <head>, then the body containing our one HtmlEmbed's code verbatim,
 * then the footer freeform block at the end of <body>. This script reproduces
 * exactly that assembly from built/<page>.{head,embed,footer}.html, which means
 * a pass here is a genuine pre-flight on the artifacts rather than a guess.
 *
 * A Node server on purpose: python -m http.server resets connections under
 * parallel image loads on this machine and manufactures false failures.
 *
 *   node preview.mjs                 # write built/preview/<page>.html, serve :8300
 *   node preview.mjs --port 8123
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BUILT = path.join(HERE, 'built');
const OUT = path.join(BUILT, 'preview');
const PAGES = ['implant', 'cosmetic', 'thank-you'];
const portArg = process.argv.indexOf('--port');
const PORT = portArg > -1 ? Number(process.argv[portArg + 1]) : 8300;

fs.mkdirSync(OUT, { recursive: true });
for (const p of PAGES) {
  const head = fs.readFileSync(path.join(BUILT, `${p}.head.html`), 'utf8');
  const body = fs.readFileSync(path.join(BUILT, `${p}.embed.html`), 'utf8');
  const footer = fs.readFileSync(path.join(BUILT, `${p}.footer.html`), 'utf8');
  fs.writeFileSync(
    path.join(OUT, `${p}.html`),
    `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${head}\n</head>\n<body>\n${body}\n${footer}\n</body>\n</html>\n`,
  );
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };
http
  .createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'implant.html';
    // Webflow serves the site's own favicon, so a missing one here is a gap in
    // this harness rather than in the build — answer it so the verifier's
    // "no failed or 404 requests" check measures the page, not the server.
    if (rel === 'favicon.ico') {
      res.writeHead(200, { 'content-type': 'image/x-icon' }).end();
      return;
    }
    const file = path.join(OUT, rel);
    if (!file.startsWith(OUT) || !fs.existsSync(file)) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => {
    for (const p of PAGES) console.log(`http://127.0.0.1:${PORT}/${p}.html`);
  });
