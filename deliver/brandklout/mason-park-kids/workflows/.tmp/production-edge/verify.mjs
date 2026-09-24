// masonparkpediatricdental.com in production (launched 2026-09-24): is every piece doing its job?
//   node verify.mjs > log
// Resolves the hosts through DoH, because this workstation's VPN caches DNS past a change.
// Checks: pages serve the new site with the apex canonical; www 301s to the apex; EVERY old
// WordPress URL in redirects.json 301s to a page that answers 200; robots.txt and sitemap.xml;
// staging still serves; the Railway host still serves.
import dns from 'node:dns';
import fs from 'node:fs';
import https from 'node:https';
const APEX = 'https://masonparkpediatricdental.com';
const redirects = JSON.parse(fs.readFileSync(new URL('./redirects.json', import.meta.url)));
const ip = {};
const doh = async (h) => { const j = await (await fetch(`https://cloudflare-dns.com/dns-query?name=${h}&type=A`, { headers: { accept: 'application/dns-json' } })).json(); return (j.Answer || []).filter(a => a.type === 1).map(a => a.data)[0]; };
for (const h of ['masonparkpediatricdental.com', 'www.masonparkpediatricdental.com', 'staging.masonparkpediatricdental.com']) ip[h] = await doh(h);
const lookup = (h, o, cb) => { if (typeof o === 'function') cb = o; if (ip[h]) return o && o.all ? cb(null, [{ address: ip[h], family: 4 }]) : cb(null, ip[h], 4); return dns.lookup(h, o, cb); };
const get = (u) => new Promise((res) => {
  const r = https.request(u, { lookup, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153.0 Safari/537.36' } }, (x) => { let b = ''; x.on('data', d => b += d); x.on('end', () => res({ s: x.statusCode, loc: x.headers.location, h: x.headers, b })); });
  r.on('error', e => res({ s: 'ERR ' + e.code, b: '' })); r.setTimeout(30000, () => r.destroy(new Error('timeout'))); r.end();
});
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL ' + m); } else console.log('PASS ' + m); };
console.log('resolves', JSON.stringify(ip));
for (const p of ['/', '/about-us/', '/services/sealants/', '/blog/', '/contacts/']) {
  const r = await get(APEX + p);
  const canon = r.b.match(/<link rel="canonical" href="([^"]*)"/)?.[1];
  ok(r.s === 200 && canon === APEX + p, `${p} ${r.s} canonical ${canon} via ${r.h?.server || ''}`);
}
const w = await get('https://www.masonparkpediatricdental.com/about-us/?x=1');
ok(w.s === 301 && w.loc === APEX + '/about-us/?x=1', `www 301 -> ${w.loc}`);
const rb = await get(APEX + '/robots.txt');
ok(rb.s === 200 && rb.b.includes('Sitemap: ' + APEX + '/sitemap.xml'), `robots.txt ${rb.s}`);
const sm = await get(APEX + '/sitemap.xml?v=1');
const locs = (sm.b.match(/<loc>/g) || []).length;
ok(sm.s === 200 && locs === 215, `sitemap.xml ${sm.s}, ${locs} urls`);
let bad = 0;
const targets = new Map();
for (const [from, to] of Object.entries(redirects)) {
  const r = await get(APEX + from);
  if (!(r.s === 301 && r.loc === APEX + to)) { bad++; console.log('FAIL redirect', from, r.s, r.loc); }
  targets.set(to, true);
}
ok(bad === 0, `${Object.keys(redirects).length} old URLs 301 to their new paths (${bad} wrong)`);
let dead = 0;
for (const to of targets.keys()) { const r = await get(APEX + to); if (r.s !== 200) { dead++; console.log('FAIL target', to, r.s); } }
ok(dead === 0, `${targets.size} redirect targets answer 200 (${dead} not)`);
const st = await get('https://staging.masonparkpediatricdental.com/');
ok(st.s === 200, `staging ${st.s}`);
const rw = await get('https://mason-park-kids.up.railway.app/');
ok(rw.s === 200, `railway host ${rw.s}`);
console.log(fails ? `${fails} FAILED` : 'all passed');
