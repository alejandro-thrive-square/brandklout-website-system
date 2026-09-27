// pediatricdentistkatytx.com (the kids practice's old domain) end to end (2026-09-25). Every old
// WordPress path the kids site's own edge Worker maps is requested on the OLD domain (apex and
// www) and followed to the end: it must land on a 200 page of https://masonparkpediatricdental.com.
// Both Workers belong to the kids site (bk-mason-park-kids): pediatricdentistkatytx-redirect sends
// every path as-is to the new domain, and masonparkpediatricdental-edge maps the old paths.
// Needs a copy of the edge Worker at .tmp/worker-masonparkpediatricdental-edge.js (Cloudflare
// API, workers/scripts/<id>/content/v2). Through this workstation's VPN, resolve over DoH:
//   DOH_HOSTS=pediatricdentistkatytx.com,www.pediatricdentistkatytx.com,masonparkpediatricdental.com node -r ./doh-preload.cjs verify-pediatric-redirects.mjs
import fs from "node:fs";
const src = fs.readFileSync(new URL("./.tmp/worker-masonparkpediatricdental-edge.js", import.meta.url), "utf8");
const paths = [...new Set([...src.matchAll(/"(\/[^"]*)"\s*:\s*"\/[^"]*"/g)].map((m) => m[1]))];
paths.unshift("/", "/about-us/", "/contact-us/", "/blog/");
const results = { ok: 0, hops: {}, bad: [] };
const q = [...paths];
async function follow(url) {
  const chain = [];
  for (let i = 0; i < 6; i++) {
    const r = await fetch(url, { redirect: "manual", headers: { "user-agent": "Mozilla/5.0 redirect-check" } });
    chain.push(`${r.status} ${url}`);
    if (r.status >= 300 && r.status < 400) { url = new URL(r.headers.get("location"), url).href; continue; }
    return { status: r.status, final: url, chain };
  }
  return { status: 0, final: url, chain };
}
await Promise.all(Array.from({ length: 6 }, async () => { while (q.length) { const p = q.shift();
  for (const host of ["pediatricdentistkatytx.com", "www.pediatricdentistkatytx.com"]) {
    const r = await follow(`https://${host}${p}`);
    const hops = r.chain.length - 1;
    results.hops[hops] = (results.hops[hops] ?? 0) + 1;
    if (r.status !== 200 || !r.final.startsWith("https://masonparkpediatricdental.com/")) results.bad.push(r.chain.join(" -> "));
    else results.ok++;
  } } }));
console.log(`${paths.length} old paths x 2 hosts: ${results.ok} land on a live kids page; hops ${JSON.stringify(results.hops)}; ${results.bad.length} problem(s)`);
for (const b of results.bad.slice(0, 10)) console.log("  " + b);
