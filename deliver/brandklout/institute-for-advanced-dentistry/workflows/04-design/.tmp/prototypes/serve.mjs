#!/usr/bin/env node
// Static server for the design prototypes. Byte ranges are answered, which
// python's http.server does not do and which <video> seeking needs.
//   node serve.mjs [port]      ->  http://localhost:4173/home/
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.argv[2]) || 4173
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon',
}

createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (rel === '/') { res.writeHead(302, { location: '/home/' }).end(); return }
  let file = join(ROOT, normalize(rel))
  if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!rel.endsWith('/')) { res.writeHead(302, { location: rel + '/' }).end(); return }
    file = join(file, 'index.html')
  }
  if (!existsSync(file)) { res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found'); return }

  const size = statSync(file).size
  const head = { 'content-type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'accept-ranges': 'bytes', 'cache-control': 'no-store' }
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '')
  if (m) {
    const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]))
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1
    if (start > end || start >= size) { res.writeHead(416, { 'content-range': `bytes */${size}` }).end(); return }
    res.writeHead(206, { ...head, 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 })
    createReadStream(file, { start, end }).pipe(res)
    return
  }
  res.writeHead(200, { ...head, 'content-length': size })
  createReadStream(file).pipe(res)
}).listen(PORT, () => console.log(`Prototypes on http://localhost:${PORT}/home/`))
