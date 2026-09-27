// What masonparkpediatricdental.com answers right now, resolved through DoH (the VPN caches DNS).
import dns from 'node:dns';
const cache = {};
const doh = async (h) => { const j = await (await fetch(`https://cloudflare-dns.com/dns-query?name=${h}&type=A`, { headers: { accept: 'application/dns-json' } })).json(); return (j.Answer || []).filter(a => a.type === 1).map(a => a.data); };
for (const h of ['masonparkpediatricdental.com', 'www.masonparkpediatricdental.com']) cache[h] = (await doh(h))[0];
console.log('resolves', JSON.stringify(cache));
const orig = dns.lookup;
dns.lookup = (h, o, cb) => { if (typeof o === 'function') cb = o; if (cache[h]) return o && o.all ? cb(null, [{ address: cache[h], family: 4 }]) : cb(null, cache[h], 4); return orig(h, o, cb); };
const { request } = await import('node:https');
const get = (u) => new Promise((res) => { const r = request(u, { method: 'GET', lookup: dns.lookup }, (x) => { let b = ''; x.on('data', d => b += d); x.on('end', () => res({ s: x.statusCode, loc: x.headers.location, server: x.headers.server, b })); }); r.on('error', e => res({ s: 'ERR ' + e.code })); r.end(); });
for (const u of ['https://masonparkpediatricdental.com/', 'https://masonparkpediatricdental.com/about-us', 'https://www.masonparkpediatricdental.com/', 'https://masonparkpediatricdental.com/blog/']) {
  const r = await get(u);
  const canon = (r.b || '').match(/<link rel="canonical"[^>]*>/)?.[0] || '';
  const t = (r.b || '').match(/<title>([^<]*)/)?.[1] || '';
  console.log(r.s, u, r.loc || '', r.server || '', '|', t.slice(0, 50), '|', canon);
}
