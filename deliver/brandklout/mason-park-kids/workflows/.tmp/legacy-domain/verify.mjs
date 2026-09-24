// pediatricdentistkatytx.com -> masonparkpediatricdental.com, checked on the real hosts.
//   node verify.mjs            the real domain (works only once the Cloudflare zone is ACTIVE)
//   node verify.mjs --via      the Worker's workers.dev address (works while the zone is pending)
// Also prints the delegation from RDAP: the zone is live only when it says ajay/ruth.ns.cloudflare.com.
const via = process.argv.includes('--via');
const rd = await (await fetch('https://rdap.verisign.com/com/v1/domain/pediatricdentistkatytx.com')).json();
console.log('registry NS:', rd.nameservers.map(n => n.ldhName.toLowerCase()).join(', '));
const bases = via ? ['https://pediatricdentistkatytx-redirect.agency-45e.workers.dev']
  : ['https://pediatricdentistkatytx.com', 'https://www.pediatricdentistkatytx.com', 'http://pediatricdentistkatytx.com'];
let fails = 0;
for (const b of bases) for (const p of ['/', '/about-us/', '/new-patients/?utm_source=test']) {
  try {
    const r = await fetch(b + p, { redirect: 'manual' });
    const want = 'https://masonparkpediatricdental.com' + p;
    const ok = r.status === 301 && r.headers.get('location') === want;
    if (!ok) fails++;
    console.log(ok ? 'PASS' : 'FAIL', b + p, r.status, r.headers.get('location') || '');
  } catch (e) { fails++; console.log('FAIL', b + p, e.cause?.code || e.message); }
}
console.log(fails ? `${fails} FAILED` : 'all passed');
