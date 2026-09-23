#!/usr/bin/env node
/**
 * Export the old site's blog into one clean JSON the Instatic collection import reads, plus the
 * old-URL -> new-URL rows the redirect map needs.
 *
 * Origin: the WXR harvest in bk-mason-park-kids workflows/03-core-pages/.tmp/build-blog.mjs (157 posts,
 * 2026-09-09), the WP REST discovery in bk-ifa-dentistry scrapers/mirror.mjs, and the scrape-JSON
 * route used on bk-west-la-implants (46 posts rendered from scrape_site.py data). Written as one
 * script 2026-09-23.
 *
 *   node export-posts.mjs --wxr recovered/content.xml --prefix /blog --out <dir> > posts.log
 *   node export-posts.mjs --rest https://www.old-site.com --prefix /blog --out <dir> > posts.log
 *   node export-posts.mjs --scrape <scrape>/site-data.json --prefix /blog --out <dir> > posts.log
 *
 * Source order of preference: WXR (verbatim, includes drafts' metadata, from wp-ssh-export.sh or the
 * client's backup) > REST (/wp-json/wp/v2/posts, live site) > scrape JSON (text only, last resort).
 * A client file backup without a database (Stone, 39 posts) is extracted by hand, not here.
 *
 * Writes <out>/posts.json   [{ slug, title, date, modified, author, categories, tags, excerpt,
 *                              featuredImage, oldUrl, newPath, html, images, oldLinks, words }]
 *        <out>/posts/<slug>.md       one readable file per post, for review
 *        <out>/posts-redirects.csv   old path,new path (paste as "exact" rows in the redirect config)
 * The html is cleaned: comments, inline styles, spans, empty figures and page-builder wrappers go;
 * headings, paragraphs, lists, quotes, links, emphasis and images stay. Links to the old domain are
 * listed in oldLinks: rewrite them to new paths before import. Images are listed so they can be
 * uploaded to Instatic first (the importer drops data: URIs and re-used basenames).
 * Collection entries need two path segments (/blog/<slug>) and each row is published separately.
 */
import fs from 'node:fs'
import path from 'node:path'

const val = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d }
const OUT = path.resolve(val('out', 'posts-export')), PREFIX = val('prefix', '/blog').replace(/\/$/, '')
if (!val('wxr') && !val('rest') && !val('scrape')) { console.error('usage: node export-posts.mjs (--wxr file | --rest origin | --scrape site-data.json) [--prefix /blog] --out <dir>'); process.exit(2) }

const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
const plain = (h) => decode(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
function clean(html) {
  return html.replace(/\r/g, '').replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|iframe)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/\s(style|class|id|data-[\w-]+)="[^"]*"/gi, '')
    .replace(/<\/?(span|div|section|font)[^>]*>/gi, '\n')
    .replace(/<figure[^>]*>\s*<\/figure>/gi, '').replace(/<b>/gi, '<strong>').replace(/<\/b>/gi, '</strong>')
    .replace(/<i>/gi, '<em>').replace(/<\/i>/gi, '</em>').replace(/<p>\s*(&nbsp;)?\s*<\/p>/gi, '')
    .replace(/\n{2,}/g, '\n').trim()
}

let raw = []
if (val('wxr')) {
  const x = fs.readFileSync(val('wxr'), 'utf8')
  const f = (it, tag) => { const m = it.match(new RegExp('<' + tag + '>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</' + tag + '>')); return m ? m[1].trim() : '' }
  const items = x.match(/<item>[\s\S]*?<\/item>/g) || []
  const attachments = new Map(items.filter((it) => f(it, 'wp:post_type') === 'attachment').map((it) => [f(it, 'wp:post_id'), f(it, 'wp:attachment_url')]))
  for (const it of items) {
    if (f(it, 'wp:post_type') !== 'post' || f(it, 'wp:status') !== 'publish') continue
    const thumb = (it.match(/<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]>/) || [])[1]
    raw.push({
      slug: f(it, 'wp:post_name'), title: decode(f(it, 'title')), date: f(it, 'wp:post_date').slice(0, 10), modified: f(it, 'wp:post_modified').slice(0, 10),
      author: f(it, 'dc:creator'), oldUrl: f(it, 'link'), html: f(it, 'content:encoded'), excerpt: plain(f(it, 'excerpt:encoded')),
      categories: [...it.matchAll(/<category domain="category"[^>]*><!\[CDATA\[(.*?)\]\]>/g)].map((m) => decode(m[1])),
      tags: [...it.matchAll(/<category domain="post_tag"[^>]*><!\[CDATA\[(.*?)\]\]>/g)].map((m) => decode(m[1])),
      featuredImage: thumb ? attachments.get(thumb) ?? '' : '',
    })
  }
} else if (val('rest')) {
  const origin = val('rest').replace(/\/$/, '')
  for (let page = 1; page < 50; page++) {
    const r = await fetch(`${origin}/wp-json/wp/v2/posts?per_page=100&page=${page}&_embed=1`, { headers: { 'user-agent': 'Mozilla/5.0 (migration export)' } })
    if (!r.ok) { if (page === 1) { console.error(`REST answered ${r.status}; use --wxr or --scrape`); process.exit(1) } break }
    const arr = await r.json()
    for (const p of arr) raw.push({
      slug: p.slug, title: decode(p.title.rendered), date: p.date.slice(0, 10), modified: p.modified.slice(0, 10), oldUrl: p.link,
      author: p._embedded?.author?.[0]?.name ?? '', html: p.content.rendered, excerpt: plain(p.excerpt.rendered),
      categories: (p._embedded?.['wp:term']?.[0] ?? []).map((t) => decode(t.name)), tags: (p._embedded?.['wp:term']?.[1] ?? []).map((t) => decode(t.name)),
      featuredImage: p._embedded?.['wp:featuredmedia']?.[0]?.source_url ?? '',
    })
    if (arr.length < 100) break
  }
} else {
  const recs = JSON.parse(fs.readFileSync(val('scrape'), 'utf8')).filter((r) => r.kind === 'post' && !r.error)
  /* scrape_site.py records: seo{}, h1[], body_markdown (headings as #, paragraphs split by blank lines). */
  const md2html = (md) => md.split(/\n{2,}/).map((b) => {
    const h = b.match(/^(#{1,4})\s+(.*)$/)
    if (h) return `<h${h[1].length}>${h[2]}</h${h[1].length}>`
    if (/^[-*] /m.test(b)) return `<ul>${b.split('\n').map((l) => `<li>${l.replace(/^[-*]\s+/, '')}</li>`).join('')}</ul>`
    return `<p>${b.replace(/\n/g, ' ')}</p>`
  }).join('\n')
  for (const r of recs) raw.push({
    slug: new URL(r.url).pathname.split('/').filter(Boolean).pop(), title: r.h1?.[0] || r.seo?.title_tag || '',
    date: (r.seo?.article_published || '').slice(0, 10), modified: (r.seo?.article_modified || '').slice(0, 10), oldUrl: r.url,
    author: '', html: md2html(r.body_markdown || ''), excerpt: r.seo?.meta_description || '',
    categories: [], tags: [], featuredImage: r.seo?.og_image || '',
  })
}

const oldHost = raw[0] ? new URL(raw[0].oldUrl).hostname.replace(/^www\./, '') : ''
const posts = raw.map((p) => {
  const html = clean(p.html)
  const images = [...new Set([...html.matchAll(/<img[^>]+src="([^"]+)"/gi)].map((m) => m[1]).concat(p.featuredImage ? [p.featuredImage] : []))]
  const oldLinks = [...new Set([...html.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]).filter((h) => h.includes(oldHost) || h.startsWith('/')))]
  const text = plain(html)
  return { ...p, html, images, oldLinks, words: text.split(' ').filter(Boolean).length, excerpt: p.excerpt || text.slice(0, 170), newPath: `${PREFIX}/${p.slug}` }
}).sort((a, b) => b.date.localeCompare(a.date))

fs.mkdirSync(path.join(OUT, 'posts'), { recursive: true })
fs.writeFileSync(path.join(OUT, 'posts.json'), JSON.stringify(posts, null, 1))
for (const p of posts) fs.writeFileSync(path.join(OUT, 'posts', `${p.slug}.md`), `# ${p.title}\n\n- Old URL: ${p.oldUrl}\n- New path: ${p.newPath}\n- Date: ${p.date}\n- Author: ${p.author}\n- Categories: ${p.categories.join(', ')}\n- Words: ${p.words}\n- Featured image: ${p.featuredImage}\n\n${plain(p.html.replace(/<\/(p|h\d|li)>/gi, '\n\n'))}\n`)
const oldPath = (u) => { try { return new URL(u).pathname.replace(/\/+$/, '') || '/' } catch { return u } }
fs.writeFileSync(path.join(OUT, 'posts-redirects.csv'), ['old path,new path', ...posts.filter((p) => oldPath(p.oldUrl) !== p.newPath).map((p) => `${oldPath(p.oldUrl)},${p.newPath}`)].join('\n') + '\n')
const imgs = new Set(posts.flatMap((p) => p.images))
console.log(`${posts.length} posts (${posts.at(-1)?.date ?? '-'} to ${posts[0]?.date ?? '-'}), ${imgs.size} images, ${posts.filter((p) => p.oldLinks.length).length} posts with links to rewrite`)
console.log(`wrote ${OUT}/posts.json, posts/, posts-redirects.csv`)
