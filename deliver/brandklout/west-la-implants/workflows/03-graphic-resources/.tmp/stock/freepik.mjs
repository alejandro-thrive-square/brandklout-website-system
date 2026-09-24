#!/usr/bin/env node
/**
 * Licensed stock from Freepik (the MAGNIFIC key is a Freepik API key, premium licence).
 *
 *   node freepik.mjs search "<term>" [n=12] [--out=<dir>]   previews + metadata -> <dir>/<slug>/
 *   node freepik.mjs get <id> <name.jpg>                    full-res download -> media/img/<name.jpg>
 *
 * Search writes each preview (626px) and results.json (id, title, preview url, author, size where given)
 * so candidates can be laid out on a contact sheet and judged against the copy before anything is
 * downloaded at full size. Photos only; AI-generated results excluded.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../../../../../../..')
for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const KEY = process.env.MAGNIFIC
if (!KEY) { console.error('MAGNIFIC (Freepik API key) missing from .env'); process.exit(1) }
const API = 'https://api.freepik.com/v1'
const H = { 'x-freepik-api-key': KEY, 'accept-language': 'en-US' }
const IMG = path.resolve(HERE, '../../../04-design/.tmp/site-src/media/img')

const [cmd, a, b] = process.argv.slice(2)
const outArg = (process.argv.find((x) => x.startsWith('--out=')) || '').slice(6)

async function j(url, opts = {}) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(url, { ...opts, headers: { ...H, ...(opts.headers || {}) } })
    if (r.status >= 500) { await new Promise((s) => setTimeout(s, 1500)); continue }
    const t = await r.text()
    if (!r.ok) throw new Error(`${r.status} ${url}\n${t.slice(0, 400)}`)
    return JSON.parse(t)
  }
  throw new Error('5xx x3 ' + url)
}

if (cmd === 'search') {
  const n = Number(b) || 12
  const slug = a.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)
  const dir = path.join(outArg || path.join(HERE, 'search'), slug)
  fs.mkdirSync(dir, { recursive: true })
  const q = new URLSearchParams({ term: a, limit: String(n), order: 'relevance' })
  q.append('filters[content_type][photo]', '1')
  q.append('filters[ai-generated][excluded]', '1')
  const res = await j(`${API}/resources?${q}`)
  const out = []
  for (const r of res.data || []) {
    const url = r.image?.source?.url
    if (!url) continue
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
    const file = `${r.id}.jpg`
    fs.writeFileSync(path.join(dir, file), buf)
    out.push({ id: r.id, title: r.title, file, orientation: r.image?.orientation, author: r.author?.name, url: r.url })
  }
  fs.writeFileSync(path.join(dir, 'results.json'), JSON.stringify({ term: a, results: out }, null, 1))
  console.log(JSON.stringify({ term: a, dir: path.relative(HERE, dir), found: out.length }))
} else if (cmd === 'get') {
  const d = await j(`${API}/resources/${a}/download`)
  const url = d.data?.url || d.data?.signed_url
  if (!url) throw new Error('no download url: ' + JSON.stringify(d).slice(0, 300))
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  const dst = path.join(IMG, b)
  fs.writeFileSync(dst, buf)
  console.log(JSON.stringify({ id: a, file: b, bytes: buf.length, from: (d.data?.filename || '') }))
} else {
  console.log('usage: search "<term>" [n] | get <id> <name.jpg>')
}
