#!/usr/bin/env node
/**
 * insta-api: a site-document page write must not lose the cells pageToCells() drops.
 * Runs against a local stub that behaves like Instatic: the save REPLACES a page's cells with
 * { title, slug, body (+template) }, and a row PATCH re-derives the routing slug (`a/b` -> `a-b`).
 *
 *   node test-insta-api-cells.mjs
 */
import http from 'node:http'
import { rmSync } from 'node:fs'
import assert from 'node:assert/strict'

const body = (nodes) => ({ nodes, rootNodeId: 'root' })
const rows = new Map([
  ['flat', { id: 'flat', slug: 'about', cells: { title: 'About', slug: 'about', body: body({ root: { id: 'root', children: [] } }), seoTitle: 'About us', seoDescription: 'Who we are' } }],
  ['nested', { id: 'nested', slug: 'story/ava', cells: { title: 'Ava', slug: 'story/ava', body: body({ root: { id: 'root', children: [] } }), seoDescription: 'Ava story' } }],
  ['plain', { id: 'plain', slug: 'contact', cells: { title: 'Contact', slug: 'contact', body: body({ root: { id: 'root', children: [] } }) } }],
])
let patches = 0
const server = http.createServer((req, res) => {
  let raw = ''
  req.on('data', (c) => (raw += c))
  req.on('end', () => {
    const send = (code, obj, headers = {}) => { res.writeHead(code, { 'content-type': 'application/json', ...headers }); res.end(JSON.stringify(obj)) }
    const input = raw ? JSON.parse(raw) : {}
    const url = req.url.split('?')[0]
    if (url === '/admin/api/cms/login') return send(200, { ok: true }, { 'set-cookie': 'instatic_admin_session=stub; Path=/' })
    if (req.method === 'GET' && url === '/admin/api/cms/pages') return send(200, { rows: [...rows.values()] })
    const m = url.match(/^\/admin\/api\/cms\/data\/rows\/(.+)$/)
    if (m && req.method === 'GET') return rows.has(m[1]) ? send(200, { row: structuredClone(rows.get(m[1])) }) : send(404, { error: 'not found' })
    if (m && req.method === 'PATCH') {
      patches++
      const row = rows.get(m[1])
      row.cells = input.cells
      row.slug = String(input.cells.slug).replace(/\//g, '-') // the flattening Instatic does
      return send(200, { row })
    }
    if (req.method === 'PUT' && url === '/admin/api/cms/site-document') {
      for (const p of input.changedPages) {
        const row = rows.get(p.id)
        row.cells = { title: p.title, slug: p.slug, body: { nodes: p.nodes, rootNodeId: p.rootNodeId } } // pageToCells
        row.slug = p.slug
      }
      return send(200, { ok: true })
    }
    send(404, { error: `stub: ${req.method} ${url}` })
  })
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
process.env.INSTATIC_BASE_URL = `http://127.0.0.1:${server.address().port}`
process.env.INSTATIC_EMAIL = 'stub@example.com'
process.env.INSTATIC_PASSWORD = 'stub'
const api = await import('./insta-api.mjs')
const save = (ids) => api.api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site: {}, changedPages: ids.map((id) => api.toChangedPage(rows.get(id))),
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [], baseSeqs: {},
})
const quiet = console.warn
console.warn = () => {}
try {
  // 1. flat page: SEO cells come back, slug and body unchanged
  await save(['flat', 'plain'])
  const flat = rows.get('flat')
  assert.equal(flat.cells.seoTitle, 'About us')
  assert.equal(flat.cells.seoDescription, 'Who we are')
  assert.equal(flat.slug, 'about')
  assert.equal(patches, 1, 'only the page that lost cells is patched')

  // 2. nested page with SEO cells: refused before anything is written
  const before = structuredClone(rows.get('nested'))
  await assert.rejects(save(['nested']), /refusing the save.*story\/ava/)
  assert.deepEqual(rows.get('nested'), before)

  // 3. explicit override: the save goes through, nested slug kept, cells dropped (caller's plan)
  process.env.INSTATIC_ALLOW_CELL_DROP = '1'
  await save(['nested'])
  assert.equal(rows.get('nested').slug, 'story/ava')
  assert.equal(rows.get('nested').cells.seoDescription, undefined)
  delete process.env.INSTATIC_ALLOW_CELL_DROP
} finally {
  console.warn = quiet
  server.close()
  rmSync(api.SESSION_FILE, { force: true })
}
console.log('insta-api cells: all cases pass')
