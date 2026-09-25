// Resolve chosen hosts over DNS-over-HTTPS (2026-09-25). This workstation's VPN keeps
// serving stale answers for domains that just moved (bestdentistinkatytx.com still resolved
// to the suspended SiteGround box an hour after its nameservers moved to Cloudflare).
//   DOH_HOSTS=bestdentistinkatytx.com,www.bestdentistinkatytx.com node -r ./doh-preload.cjs verify-redirects.mjs
const dns = require("node:dns");
const https = require("node:https");
const hosts = new Set((process.env.DOH_HOSTS || "").split(",").filter(Boolean));
const cache = new Map();
const orig = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === "function") { callback = options; options = {}; }
  if (typeof options === "number") options = { family: options };
  if (!hosts.has(hostname)) return orig.call(dns, hostname, options, callback);
  const done = (addr) => (options && options.all ? callback(null, [{ address: addr, family: 4 }]) : callback(null, addr, 4));
  if (cache.has(hostname)) return done(cache.get(hostname));
  https.get(`https://cloudflare-dns.com/dns-query?name=${hostname}&type=A`, { headers: { accept: "application/dns-json" } }, (res) => {
    let body = ""; res.on("data", (c) => (body += c));
    res.on("end", () => {
      const a = (JSON.parse(body).Answer || []).find((x) => x.type === 1);
      if (!a) return callback(Object.assign(new Error(`DoH: no A for ${hostname}`), { code: "ENOTFOUND" }));
      cache.set(hostname, a.data); done(a.data);
    });
  }).on("error", callback);
};
