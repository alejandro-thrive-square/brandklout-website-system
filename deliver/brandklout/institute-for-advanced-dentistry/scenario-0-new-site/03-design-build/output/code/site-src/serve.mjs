/**
 * serve.mjs — serve dist/ the way the live site routes it: /a/b/ and /a/b -> dist/a/b.html, / -> index.html.
 * Answers byte ranges (the films seek; python -m http.server does not). 404s are real 404s.
 *
 * Usage: node serve.mjs [port=4180] [distDir=./dist]     then http://localhost:4180/
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DIST = process.argv[3] ? path.resolve(process.argv[3]) : path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist')
const PORT = Number(process.argv[2] || 4180)
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.json': 'application/json' }

function resolve(urlPath) {
  let p = decodeURIComponent(urlPath.split('?')[0])
  if (p.includes('..')) return null
  const direct = path.join(DIST, p)
  if (path.extname(p) && fs.existsSync(direct) && fs.statSync(direct).isFile()) return direct
  p = p.replace(/\/+$/, '')
  const page = path.join(DIST, (p || '/index') + '.html')
  return fs.existsSync(page) ? page : null
}

http.createServer((req, res) => {
  const file = resolve(req.url)
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/html' })
    const nf = path.join(DIST, '404.html')
    return res.end(fs.existsSync(nf) ? fs.readFileSync(nf) : 'not found')
  }
  const type = TYPES[path.extname(file)] || 'application/octet-stream'
  const size = fs.statSync(file).size
  const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range)
  if (range) {
    const start = range[1] ? Number(range[1]) : 0
    const end = range[2] ? Number(range[2]) : size - 1
    res.writeHead(206, { 'content-type': type, 'content-range': `bytes ${start}-${end}/${size}`, 'accept-ranges': 'bytes', 'content-length': end - start + 1 })
    return fs.createReadStream(file, { start, end }).pipe(res)
  }
  res.writeHead(200, { 'content-type': type, 'content-length': size, 'accept-ranges': 'bytes', 'cache-control': 'no-store' })
  fs.createReadStream(file).pipe(res)
}).listen(PORT, () => console.log(`http://localhost:${PORT}/`))
