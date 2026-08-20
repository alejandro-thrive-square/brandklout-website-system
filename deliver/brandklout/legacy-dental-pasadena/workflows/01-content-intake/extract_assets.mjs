// Extract every asset reference from captured HTML: img src, srcset, source,
// video src/poster, CSS url() in inline styles and <style> blocks, link icons,
// og:image, and data-* attributes that hold media or embed ids.
// A URL list is not the deliverable; download.mjs consumes assets.json.
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const out = process.argv[3];
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const MEDIA = /\.(png|jpe?g|gif|webp|avif|svg|ico|mp4|webm|mov|pdf|woff2?|ttf|otf)(\?|#|$)/i;
const assets = new Map(); // url -> {url, kinds:Set, pages:Set, attrs:Set}

function add(url, kind, page, note) {
  if (!url) return;
  url = url.trim().replace(/&amp;/g, '&');
  if (!url || url.startsWith('data:') || url.startsWith('#')) return;
  if (url.startsWith('//')) url = 'https:' + url;
  if (url.startsWith('/')) url = 'https://legacydentalpasadena.com' + url;
  if (!/^https?:/i.test(url)) return;
  if (!assets.has(url)) assets.set(url, { url, kinds: new Set(), pages: new Set(), notes: new Set() });
  const a = assets.get(url);
  a.kinds.add(kind); a.pages.add(page); if (note) a.notes.add(note);
}

function nearestAlt(html, idx) {
  // pull the alt="" of the tag the match sits inside, for the catalogue
  const start = html.lastIndexOf('<', idx);
  const end = html.indexOf('>', idx);
  if (start < 0 || end < 0) return '';
  const tag = html.slice(start, end + 1);
  const m = tag.match(/\salt="([^"]*)"/i);
  return m ? m[1] : '';
}

const embeds = [];

for (const f of files) {
  const page = f.replace(/\.html$/, '');
  const html = fs.readFileSync(path.join(dir, f), 'utf8');

  for (const m of html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/gi)) add(m[1], 'img-src', page, nearestAlt(html, m.index));
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/gi)) {
    for (const cand of m[1].split(',')) add(cand.trim().split(/\s+/)[0], 'srcset', page, nearestAlt(html, m.index));
  }
  for (const m of html.matchAll(/<(?:video|source)\b[^>]*\ssrc="([^"]+)"/gi)) add(m[1], 'video-src', page);
  for (const m of html.matchAll(/\sposter="([^"]+)"/gi)) add(m[1], 'video-poster', page);
  for (const m of html.matchAll(/url\((['"]?)([^'")]+)\1\)/gi)) if (MEDIA.test(m[2])) add(m[2], 'css-url', page);
  for (const m of html.matchAll(/<link\b[^>]*\shref="([^"]+)"[^>]*>/gi)) {
    const tag = m[0];
    if (/rel="[^"]*(icon|apple-touch|preload)[^"]*"/i.test(tag) && MEDIA.test(m[1])) add(m[1], 'link-icon', page);
  }
  for (const m of html.matchAll(/<meta\b[^>]*(?:property|name)="(og:image|twitter:image)"[^>]*content="([^"]+)"/gi)) add(m[2], 'meta-image', page);
  // Webflow background-video and lightbox JSON hold urls inside escaped attributes
  for (const m of html.matchAll(/&quot;(https?:\?\/\?\/[^&"]+?)&quot;/gi)) {
    const u = m[1].replace(/\\//g, '/');
    if (MEDIA.test(u)) add(u, 'json-attr', page);
  }
  // embeds live in href and data-* just as often as in iframe src
  for (const m of html.matchAll(/<iframe\b[^>]*\ssrc="([^"]+)"/gi)) embeds.push({ page, kind: 'iframe', url: m[1] });
  for (const m of html.matchAll(/(?:href|data-src|data-video-url|data-url)="((?:https?:)?\/\/(?:player\.)?vimeo[^"]*|[^"]*youtube[^"]*|[^"]*youtu\.be[^"]*|[^"]*jarvisanalytics[^"]*)"/gi)) {
    embeds.push({ page, kind: 'link-embed', url: m[1] });
  }
  for (const m of html.matchAll(/vimeo\.com\?\/(?:video\?\/)?(\d{6,})/gi)) embeds.push({ page, kind: 'vimeo-id', url: m[1] });
}

const list = [...assets.values()].map(a => ({
  url: a.url, kinds: [...a.kinds], pages: [...a.pages], alts: [...a.notes].filter(Boolean),
})).sort((x, y) => x.url.localeCompare(y.url));

const uniqEmbeds = [...new Map(embeds.map(e => [e.kind + '|' + e.url, e])).values()];
fs.writeFileSync(out, JSON.stringify({ generated: 'extract_assets.mjs', pages: files.length, assets: list, embeds: uniqEmbeds }, null, 2));
console.log(`pages ${files.length}  assets ${list.length}  embeds ${uniqEmbeds.length}`);
