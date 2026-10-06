#!/usr/bin/env node
// SEO v3 posts gate: every Journal post published with ONE <h1>, and its meta description,
// og:description and BlogPosting description all equal seo-v3/post-descriptions.json.
//   node seo-v3/verify-posts-v3.mjs [host]
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
const HERE = dirname(fileURLToPath(import.meta.url))
const S = process.argv[2] || 'https://www.drnahlah.com'
const DESC = JSON.parse(readFileSync(join(HERE, 'post-descriptions.json'), 'utf8'))
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const bad = []
for (const [slug, want] of Object.entries(DESC)) {
  const h = await (await fetch(`${S}/posts/${slug}`)).text()
  const head = h.split('</head>')[0]
  const h1 = (h.match(/<h1\b/g) || []).length
  const desc = dec((head.match(/name="description" content="([^"]*)"/) || [])[1] || '')
  const og = dec((head.match(/property="og:description" content="([^"]*)"/) || [])[1] || '')
  const ld = (h.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/) || [])[1]
  const art = ld ? JSON.parse(ld)['@graph'].find((n) => [].concat(n['@type']).includes('BlogPosting')) : null
  const why = [h1 !== 1 && `${h1} h1`, desc !== want && 'meta description', og !== want && 'og:description', art?.description !== want && 'BlogPosting description'].filter(Boolean)
  if (why.length) bad.push(`${slug}: ${why.join(', ')}`)
}
console.log(Object.keys(DESC).length, 'posts', bad.length ? '\n' + bad.join('\n') : 'POSTS CLEAN')
process.exit(bad.length ? 1 : 0)
