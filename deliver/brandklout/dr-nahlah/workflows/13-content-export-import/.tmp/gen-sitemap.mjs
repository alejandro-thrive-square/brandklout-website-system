#!/usr/bin/env node
/**
 * gen-sitemap.mjs — build sitemap.xml for the whole site: 33 pages + 43 posts.
 *
 * WHERE THIS CAN ACTUALLY BE SERVED, which is the open question and not a
 * detail. Instatic has no sitemap generator: the only two mentions of the word
 * in its codebase are a loop-source description and the plugin SDK's list of
 * things a plugin could expose ("public read APIs (sitemaps, robots, search)").
 * /sitemap.xml returns 404 today, and so does /robots.txt at the origin, the
 * robots.txt you see being synthesised by Cloudflare because the origin 404s.
 *
 * Three routes, none of them free:
 *   1. STATIC_DIR (/app/dist) IS served at the root, proven by /favicon.svg
 *      returning 200. Dropping the file there works and is LOST ON REDEPLOY,
 *      because that path is a layer in the image, not the mounted volume.
 *   2. A Cloudflare Worker or redirect rule in front of the origin. Durable,
 *      outside Instatic, and someone has to own it.
 *   3. An Instatic plugin, which is the supported route the SDK describes and
 *      the only one that survives an upgrade.
 *
 * The file is generated regardless: it is also what Webflow needs, and the
 * decision about hosting does not change its contents.
 *
 *   node gen-sitemap.mjs [--base https://encorercm.com]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(HERE, '../../04-design/.tmp/final-site');
const POSTS = path.join(HERE, 'posts.json');
const argv = process.argv.slice(2);
const BASE = (argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : 'https://encorercm.com')
  .replace(/\/$/, '');

/* thank-you is noindex on the built pages; a sitemap says "please index this",
   so listing it would contradict the page's own instruction. */
const NOINDEX = new Set(['thank-you']);

const pages = fs.readdirSync(SITE)
  .filter((f) => f.endsWith('.html'))
  .map((f) => f.replace(/\.html$/, ''))
  .filter((s) => !NOINDEX.has(s))
  .sort();

const posts = JSON.parse(fs.readFileSync(POSTS, 'utf8'));

const url = (loc, lastmod, priority, changefreq) =>
  `  <url>\n    <loc>${loc}</loc>\n` +
  (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
  `    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

const today = new Date().toISOString().slice(0, 10);
const rows = [];
for (const s of pages) {
  const loc = s === 'index' ? `${BASE}/` : `${BASE}/${s}`;
  const priority = s === 'index' ? '1.0'
    : /^(dental-implants|all-on-4|veneers|smile-makeover|implant-cost|contact)$/.test(s) ? '0.9'
    : /^(privacy-policy|terms-conditions|terms-of-service|privacy-policy-)/.test(s) ? '0.2'
    : '0.7';
  rows.push(url(loc, today, priority, s === 'index' ? 'weekly' : 'monthly'));
}
rows.push(url(`${BASE}/posts`, today, '0.7', 'weekly'));
for (const p of posts) {
  // The post's own publication date, not the day it was loaded into the CMS.
  rows.push(url(`${BASE}/posts/${p.slug}`, p.date || today, '0.5', 'yearly'));
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;

const out = path.join(HERE, 'sitemap.xml');
fs.writeFileSync(out, xml);

const robots = `User-agent: *\nAllow: /\n\nSitemap: ${BASE}/sitemap.xml\n`;
fs.writeFileSync(path.join(HERE, 'robots.txt'), robots);

console.log(`${rows.length} URLs -> sitemap.xml  (${pages.length} pages, 1 index, ${posts.length} posts)`);
console.log(`base ${BASE}, ${xml.length} bytes`);
console.log(`robots.txt written too; the origin currently serves none and Cloudflare fills the gap.`);
