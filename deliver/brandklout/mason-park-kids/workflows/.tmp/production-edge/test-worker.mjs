// Local test of worker.js: a stub fetch() stands in for the origin.
import w from './worker.js';
globalThis.fetch = async (req) => new Response('ORIGIN ' + new URL(req.url).pathname, { status: 200 });
const cases = [
  ['https://www.masonparkpediatricdental.com/about-us/?a=1', 301, 'https://masonparkpediatricdental.com/about-us/?a=1'],
  ['https://masonparkpediatricdental.com/pacifiers-and-teeth-development-pediatric-dentist-katy/', 301, 'https://masonparkpediatricdental.com/blog/pacifiers-and-teeth-development-pediatric-dentist-katy/'],
  ['https://masonparkpediatricdental.com/teeth-stages-childrens-dentist-katy', 301, 'https://masonparkpediatricdental.com/blog/teeth-stages-childrens-dentist-katy/'],
  ['https://masonparkpediatricdental.com/dental-savings-plan/?utm_source=g', 301, 'https://masonparkpediatricdental.com/dental-saving-plan/?utm_source=g'],
  ['https://masonparkpediatricdental.com/about-us/', 200, 'ORIGIN /about-us/'],
  ['https://masonparkpediatricdental.com/blog/teeth-stages-childrens-dentist-katy/', 200, 'ORIGIN /blog/teeth-stages-childrens-dentist-katy/'],
  ['https://masonparkpediatricdental.com/', 200, 'ORIGIN /'],
  ['https://masonparkpediatricdental.com/robots.txt', 200, 'Sitemap: https://masonparkpediatricdental.com/sitemap.xml'],
  ['https://masonparkpediatricdental.com/sitemap.xml?v=2', 200, '<loc>https://masonparkpediatricdental.com/services/sealants/</loc>'],
];
let f = 0;
for (const [u, st, want] of cases) {
  const r = await w.fetch(new Request(u));
  const got = r.status === 301 ? r.headers.get('location') : await r.text();
  const ok = r.status === st && got.includes(want);
  if (!ok) f++;
  console.log(ok ? 'PASS' : 'FAIL', r.status, u.replace('https://', ''), ok ? '' : '=> ' + got.slice(0, 120));
}
console.log(f ? `${f} FAILED` : 'all passed');
