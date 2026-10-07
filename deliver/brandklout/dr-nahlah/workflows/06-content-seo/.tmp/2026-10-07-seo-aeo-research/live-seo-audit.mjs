// Live SEO snapshot of www.drnahlah.com: title, description, H1s, JSON-LD size/types, image alts.
import { writeFileSync } from 'node:fs';

const OUT = process.argv[2];
const ORIGIN = 'https://www.drnahlah.com';
const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36' };

const decode = s => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const text = s => decode(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

async function get(url) {
  const r = await fetch(url, { headers: UA, redirect: 'follow' });
  return { status: r.status, body: await r.text() };
}

const sm = await get(`${ORIGIN}/sitemap.xml`);
let urls = [...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim());
// a sitemap index points at child sitemaps
if (urls.every(u => u.endsWith('.xml'))) {
  const all = [];
  for (const u of urls) all.push(...[...(await get(u)).body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1].trim()));
  urls = all;
}

const rows = [];
for (const url of urls) {
  try {
    const { status, body } = await get(url);
    const head = body.split(/<\/head>/i)[0];
    const title = text((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const desc = decode((head.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) || head.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i) || [])[1] || '');
    const h1s = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => text(m[1]));
    const h2count = (body.match(/<h2[\s>]/gi) || []).length;
    const ld = [...body.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
    const ldBytes = ld.reduce((n, s) => n + s.length, 0);
    const types = new Set();
    let ldNodes = 0;
    const walk = o => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') {
        if (o['@type']) { ldNodes++; [].concat(o['@type']).forEach(t => types.add(t)); }
        Object.values(o).forEach(walk);
      }
    };
    for (const s of ld) { try { walk(JSON.parse(s)); } catch { types.add('!PARSE_ERROR'); } }
    const imgs = [...body.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
    const noAlt = imgs.filter(t => !/\balt=["'][^"']+["']/i.test(t)).length;
    const bodyText = text(body.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<header[\s\S]*?<\/header>|<footer[\s\S]*?<\/footer>|<nav[\s\S]*?<\/nav>/gi, ' '));
    const words = bodyText.split(' ').filter(Boolean).length;
    const mentions = {
      mclean: (bodyText.match(/McLean/gi) || []).length,
      tysons: (bodyText.match(/Tysons/gi) || []).length,
      alexandria: (bodyText.match(/Alexandria/gi) || []).length,
    };
    rows.push({ url: url.replace(ORIGIN, '') || '/', status, title, titleLen: title.length, desc, descLen: desc.length, h1s, h2count, ldBlocks: ld.length, ldBytes, ldNodes, types: [...types].sort(), imgs: imgs.length, noAlt, words, mentions });
  } catch (e) {
    rows.push({ url, error: String(e) });
  }
}

writeFileSync(OUT, JSON.stringify({ fetched: new Date().toISOString(), count: rows.length, rows }, null, 1));
console.log(`wrote ${rows.length} rows`);
