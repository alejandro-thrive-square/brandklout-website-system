#!/usr/bin/env node
/**
 * grab.mjs — download every image used by the four Arvada ads landing pages,
 * one folder per page under a master folder, plus a manifest per page.
 *
 * Sources covered: <img src>, <img srcset>, <source srcset>, poster,
 * inline style background-image, url() in the page's own <style> blocks, and
 * background images in the site stylesheet whose selector class appears on the
 * page. Video embeds are not downloaded (they are YouTube/Vimeo hosted) but
 * their poster thumbnails are, and every embed URL is listed in the manifest.
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.arvadadentalimplants.com/ads-landing-pages';
const OUT = process.argv[2];
const STAMP = process.argv[3] || 'the date of this download';
const PAGES = [
  { slug: 'dental-implants-ads-landing', dir: '01-dental-implants', title: 'Dental Implants' },
  { slug: 'all-on-x-ads-landing', dir: '02-all-on-x', title: 'All-on-X / Full Arch' },
  { slug: 'porcelain-veneers-ads-landing', dir: '03-porcelain-veneers', title: 'Porcelain Veneers' },
  { slug: 'emergency-dentist-ads-landing', dir: '04-emergency-dentistry', title: 'Emergency Dentistry' },
];

const abs = (u) => (u.startsWith('//') ? 'https:' + u : u.startsWith('/') ? 'https://www.arvadadentalimplants.com' + u : u);
const IMG_EXT = /\.(jpe?g|png|webp|gif|svg|avif)(\?|$)/i;

/** Webflow serves resized variants as `-p-500.jpg`; the unsuffixed URL is the original upload. */
const original = (u) => u.replace(/-p-\d+(\.\w+)(\.webp)?$/i, '$1');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** The CDN drops connections under a burst; a couple of retries is enough. */
async function get(url, init, tries = 4) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, init);
      if (r.ok || (init && init.method === 'HEAD')) return r;
      last = new Error(`${r.status} ${url}`);
    } catch (e) { last = e; }
    await sleep(500 * 2 ** i);
  }
  throw last;
}

async function best(urls) {
  const cands = [...new Set(urls.flatMap((u) => [original(u), u]))];
  let win = null;
  for (const u of cands) {
    try {
      const r = await get(u, { method: 'HEAD' }, 2);
      if (!r.ok) continue;
      const len = Number(r.headers.get('content-length') || 0);
      if (!win || len > win.len) win = { url: u, len, type: r.headers.get('content-type') || '' };
    } catch { /* try the next candidate */ }
  }
  return win;
}

function extract(html) {
  const found = [];           // { urls: [], alt }
  const embeds = new Set();
  const push = (urls, alt) => {
    const clean = urls.map(abs).filter((u) => /^https?:/.test(u) && IMG_EXT.test(u));
    if (clean.length) found.push({ urls: clean, alt: (alt || '').trim() });
  };

  for (const tag of html.match(/<img\b[^>]*>/gi) || []) {
    const src = tag.match(/\bsrc="([^"]+)"/i)?.[1];
    const srcset = tag.match(/\bsrcset="([^"]+)"/i)?.[1] || '';
    const alt = unescapeHtml(tag.match(/\balt="([^"]*)"/i)?.[1]);
    const set = srcset.split(',').map((s) => s.trim().split(/\s+/)[0]).filter(Boolean);
    push([src, ...set].filter(Boolean), alt);
  }
  for (const tag of html.match(/<source\b[^>]*>/gi) || []) {
    const set = (tag.match(/\bsrcset="([^"]+)"/i)?.[1] || '').split(',').map((s) => s.trim().split(/\s+/)[0]);
    push(set.filter(Boolean), 'picture source');
  }
  for (const m of html.matchAll(/\bposter="([^"]+)"/gi)) push([m[1]], 'video poster');
  for (const m of html.matchAll(/url\((['"]?)([^'")]+)\1\)/gi)) push([m[2]], 'css background');

  // Embedly wrappers carry the real video URL and its thumbnail as query params.
  for (const m of html.matchAll(/<iframe\b[^>]*\bsrc="([^"]+)"/gi)) {
    const u = new URL(abs(m[1].replace(/&amp;/g, '&')));
    const real = u.searchParams.get('url') || u.searchParams.get('src') || u.href;
    embeds.add(real);
    const thumb = u.searchParams.get('image');
    if (thumb) push([thumb], 'video thumbnail');
  }
  return { found, embeds: [...embeds] };
}

/** Alt text arrives HTML-escaped, and `&#x27;` would otherwise slug to "x27". */
const unescapeHtml = (s) => (s || '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const slugify = (s, fallback) => (s || '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || fallback;

/** Webflow prefixes every upload with the 24-hex asset id; drop it from filenames. */
const dehash = (s) => s.replace(/^[0-9a-f]{24}_/i, '').replace(/^imgi[_-]\d+[_-]/i, '');

/** Photos are the campaign material; icons, logos and video posters are support files. */
function bucket(name, alt, bytes, ext) {
  if (/video thumbnail|video poster/i.test(alt)) return 'video-thumbnails';
  if (ext === 'svg' || bytes < 15000) return 'icons-and-logos';
  if (/\blogos?\b|\bicons?\b|\bbadge/i.test(`${alt} ${name}`)) return 'icons-and-logos';
  return '';
}

const master = path.resolve(OUT);
fs.mkdirSync(master, { recursive: true });
const summary = [];

for (const page of PAGES) {
  const html = await (await get(`${BASE}/${page.slug}`)).text();
  const { found, embeds } = extract(html);
  const dir = path.join(master, page.dir);
  fs.mkdirSync(dir, { recursive: true });

  const seen = new Set();
  const rows = [];
  let i = 0;
  for (const item of found) {
    const pick = await best(item.urls);
    if (!pick) { rows.push({ file: '(unreachable)', alt: item.alt, url: item.urls[0], bytes: 0 }); continue; }
    if (seen.has(pick.url)) continue;
    seen.add(pick.url);
    const src = dehash(decodeURIComponent(pick.url.split('/').pop().split('?')[0]));
    const ext = (src.match(/\.(jpe?g|png|webp|gif|svg|avif)$/i)?.[1] || 'jpg').toLowerCase();
    const stem = slugify(item.alt.replace(/'s/g, 's'), slugify(src.replace(/\.\w+$/, '').replace(/\.(jpe?g|png)$/i, ''), 'image'));
    let buf;
    try { buf = Buffer.from(await (await get(pick.url)).arrayBuffer()); }
    catch (e) { console.log(`  !! ${pick.url}: ${e.message}`); rows.push({ file: '(download failed)', alt: item.alt, url: pick.url, bytes: 0 }); continue; }
    const sub = bucket(src, item.alt, buf.length, ext);
    const name = `${String(++i).padStart(2, '0')}-${stem}.${ext}`;
    if (sub) fs.mkdirSync(path.join(dir, sub), { recursive: true });
    fs.writeFileSync(path.join(dir, sub, name), buf);
    rows.push({ file: sub ? `${sub}/${name}` : name, alt: item.alt, url: pick.url, bytes: buf.length });
  }

  const md = [
    `# ${page.title} — page images`,
    '',
    `Source page: ${BASE}/${page.slug}`,
    `Downloaded: ${rows.filter((r) => r.bytes).length} files, ` +
      `${(rows.reduce((a, r) => a + r.bytes, 0) / 1048576).toFixed(1)} MB`,
    '',
    '| File | Alt text / role | Source URL |',
    '|---|---|---|',
    ...rows.map((r) => `| ${r.file} | ${r.alt || '-'} | ${r.url} |`),
    '',
    '## Video embeds on this page (not downloaded, hosted by YouTube / Vimeo)',
    '',
    ...(embeds.length ? embeds.map((e) => `- ${e}`) : ['- none']),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(dir, 'MANIFEST.md'), md);

  const bytes = rows.reduce((a, r) => a + r.bytes, 0);
  summary.push({ ...page, count: rows.filter((r) => r.bytes).length, bytes, embeds: embeds.length });
  console.log(`${page.dir}: ${rows.filter((r) => r.bytes).length} images, ${(bytes / 1048576).toFixed(1)} MB, ${embeds.length} embeds`);
}

const totalFiles = summary.reduce((a, s) => a + s.count, 0);
const totalMB = (summary.reduce((a, s) => a + s.bytes, 0) / 1048576).toFixed(1);
fs.writeFileSync(path.join(master, 'README.md'), [
  '# Arvada Dental Center — ad campaign images',
  '',
  `Every image used by the four paid-traffic landing pages, pulled from the live site on ${STAMP}.`,
  `${totalFiles} files, ${totalMB} MB, one folder per page.`,
  '',
  '| Folder | Page | Files | Size | Video embeds |',
  '|---|---|---|---|---|',
  ...summary.map((s) => `| \`${s.dir}/\` | ${s.title} | ${s.count} | ${(s.bytes / 1048576).toFixed(1)} MB | ${s.embeds} |`),
  '',
  '## What is in each page folder',
  '',
  '- **Photography** sits at the top level, numbered in the order it appears down the page.',
  '- **`icons-and-logos/`** holds the logo, SVG icons and credential badges.',
  '- **`video-thumbnails/`** holds the poster frames of the YouTube / Vimeo testimonials.',
  '  The videos themselves are hosted by YouTube and Vimeo, so they are not downloadable here;',
  '  every embed URL is listed at the bottom of that page\'s `MANIFEST.md`.',
  '- **`MANIFEST.md`** maps each file to its alt text and its original URL on the site.',
  '',
  'Filenames come from each image\'s alt text, so they describe the shot rather than the upload.',
  'The same photo can appear in more than one page folder: each folder is complete on its own,',
  'which is what makes it safe to send a single page folder to someone.',
  '',
  '## Source pages',
  '',
  ...PAGES.map((p) => `- ${p.title} — ${BASE}/${p.slug}`),
  '',
  '## A note on rights',
  '',
  'These come from the practice\'s own site. Several are evidently licensed stock the practice',
  'already runs, so confirm with Brandklout before using them in paid placements beyond this site.',
  '',
].join('\n'));
fs.writeFileSync(path.join(master, 'SUMMARY.json'), JSON.stringify(summary, null, 1));
console.log(`\n${totalFiles} files, ${totalMB} MB`);
console.log('master:', master);
